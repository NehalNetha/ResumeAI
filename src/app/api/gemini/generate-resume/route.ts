// src/app/api/generate-resume/route.ts
import { NextResponse } from 'next/server';
// Import GenerateContentStreamResult
import { GoogleGenerativeAI, GenerateContentStreamResult } from '@google/generative-ai';
import { createClient } from '@/utils/supabase/server';
import { rateLimiters } from '@/utils/rateLimiting/rate-limit';
import { withRateLimit } from '@/utils/rateLimiting/rate-limit-middleware';

// Initialize the Google Generative AI with your API key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Add the helper function to pipe the Gemini stream
async function streamGeminiResponse(
  streamResult: GenerateContentStreamResult,
  controller: ReadableStreamDefaultController<any>
) {
  const encoder = new TextEncoder();
  try {
    for await (const chunk of streamResult.stream) {
      const text = chunk.text();
      if (text) { // Ensure text is not empty before encoding/enqueuing
        controller.enqueue(encoder.encode(text));
      }
    }
  } catch (error) {
    console.error("Error reading Gemini stream:", error);
    controller.error(error); // Propagate the error to the client
  } finally {
    controller.close(); // Ensure the stream is closed
  }
}


export async function POST(request: Request) {
  return withRateLimit(request, rateLimiters.chat, async (req) => {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    try {
      const {
        personalInfo,
        workExperience,
        education,
        projects,
        skills,
        links,
        template,
        jobDescription // Optional
      } = await request.json();

      // Log the request data
      console.log('Gemini Resume Generation Request:', {
          templateId: template?.id,
          templateName: template?.name,
          jobDescriptionLength: jobDescription?.length || 0,
          timestamp: new Date().toISOString()
      });

      if (!template || !template.latex_content) {
        console.log('Gemini API Error: Missing template or template content');
        return NextResponse.json(
          { error: 'Missing template or template content' },
          { status: 400 }
        );
      }

      // Get the generative model (system instruction remains the same)
      const model = genAI.getGenerativeModel({
        model: 'gemini-1.5-flash', // Using flash consistently
        systemInstruction: `You are an expert resume tailoring assistant. Your task is to customize a LaTeX resume template
      based on the provided structured resume data and job description (if available). Focus on:
      1. Filling in the LaTeX template with the provided resume data
      2. Highlighting relevant skills and experiences that match the job requirements (if job description is provided)
      3. Maintaining the original LaTeX structure and formatting
      4. Ensuring the output is valid LaTeX code that can be compiled
      5. Don't add any unnecessary text or comments in the LaTeX, other than standard LaTeX comments (%).
      6. Don't change any LaTeX code that affects styling and layout, just fill in the appropriate values.
      7. If the template includes graphics, bars, charts, etc., do not remove them - use the provided data to fill them appropriately if possible, otherwise leave the placeholders or reasonable defaults.
      8. Format dates consistently (e.g., Month YYYY, or YYYY-MM).
      9. Ensure bullet points are concise and impactful.
      10. If job description is provided, tailor the summary, skills, and experience bullet points to emphasize relevant qualifications.
      11. Ensure common LaTeX special characters (like %, &, $, #, _, {, }) are properly escaped (e.g., \\%, \\&, \\$, \\#, \\_, \\{, \\}) within the user-provided text content before inserting it into the template. Handle URLs carefully with the \\url{} command if available. Check the template for packages like 'hyperref'.
      Output ONLY the complete, modified LaTeX code. Do not include any introductory text, explanations, or markdown formatting (like \`\`\`latex).`
      });

      // Construct the structured resume data (escaping logic remains the same)
      const resumeData = {
        personalInfo: personalInfo || {},
        workExperience: workExperience || [],
        education: education || [],
        projects: projects || [],
        skills: skills || [],
        links: links || [],
      };

      // Escape LaTeX special characters in the resume data
      const escapedResumeData = JSON.parse(JSON.stringify(resumeData), (key, value) => {
           if (typeof value === 'string') {
                // Simple escaping - consider more robust solution if needed
                return value
                      .replace(/%/g, '\\%')
                      .replace(/&/g, '\\&')
                      .replace(/\$/g, '\\$')
                      .replace(/#/g, '\\#')
                      .replace(/_/g, '\\_')
                      .replace(/{/g, '\\{')
                      .replace(/}/g, '\\}');
            }
            // Ensure arrays/objects pass through correctly
            return value;
      });

      // Construct the prompt including the properly populated and escaped resume data
      let prompt = `RESUME DATA (LaTeX special characters should be escaped):\n${JSON.stringify(escapedResumeData, null, 2)}\n\n`;

      if (jobDescription) {
        const escapedJobDesc = jobDescription.replace(/%/g, '\\%').replace(/&/g, '\\&'); // Basic escape
        prompt += `JOB DESCRIPTION:\n${escapedJobDesc}\n\n`;
      }

      prompt += `LATEX TEMPLATE:\n${template.latex_content}\n\n`;

      prompt += "Instruction: Fill the LaTeX template using the provided RESUME DATA. ";
      if (jobDescription) {
        prompt += "Tailor the content using the JOB DESCRIPTION. ";
      }
      prompt += "Ensure all user text inserted into the template has LaTeX special characters properly escaped. Output ONLY the modified LaTeX code, ready for compilation.";

      console.log('Gemini API Prompt Length:', prompt.length);

      // Generate content stream
      const streamResult = await model.generateContentStream(prompt);

      // --- Streaming the response ---
      const stream = new ReadableStream({
        start(controller) {
          streamGeminiResponse(streamResult, controller);
        },
        cancel(reason) {
            console.log("Stream cancelled:", reason);
        }
      });

      // Return the stream response
      return new NextResponse(stream, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8', // Set correct content type
          'X-Content-Type-Options': 'nosniff',
        },
      });

    } catch (error: any) {
      console.error('Error generating resume with Gemini API:', error);
      // Log specific Gemini errors if available
      if (error.response && error.response.data) {
          console.error('Gemini API Error Details:', error.response.data);
      }
      // Return a JSON error response if setting up the stream fails
      return NextResponse.json(
        { error: `Failed to generate resume stream: ${error.message || 'Unknown error'}` },
        { status: 500 }
      );
    }
  });
}