import { NextResponse } from 'next/server';
import { GoogleGenerativeAI, GenerateContentStreamResult } from '@google/generative-ai';
import { createClient } from '@/utils/supabase/server';
import { withRateLimit } from '@/utils/rate-limit-middleware';
import { rateLimiters } from '@/utils/rate-limit';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Helper function to pipe the Gemini stream to the Response stream
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

  try {


    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }


    const { resumes, template, jobDescription, resumeInfo } = await request.json();
    
    // Enhanced logging to debug the issue
    console.log('Gemini API Request Details:', {
      resumesProvided: Array.isArray(resumes) ? resumes.length : (resumes ? 1 : 0),
      templateId: template?.id,
      templateName: template?.name,
      jobDescriptionLength: jobDescription?.length || 0,
      hasResumeInfo: !!resumeInfo,
      resumeInfoStructure: resumeInfo ? {
        hasPersonalInfo: !!resumeInfo.personal_info,
        workExperienceCount: (resumeInfo.work_experience || []).length,
        educationCount: (resumeInfo.education || []).length,
        projectsCount: (resumeInfo.projects || []).length,
        skillsCount: (resumeInfo.skills || []).length,
        linksCount: (resumeInfo.links || []).length
      } : null,
      timestamp: new Date().toISOString()
    });
    
    if (!template || !jobDescription) {
      console.log('Gemini API Error: Missing required parameters');
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }
    
    const modelName = 'gemini-1.5-flash'; // Using flash model, suitable for streaming

    const model = genAI.getGenerativeModel(
      { model: modelName,
        systemInstruction: `You are an expert resume tailoring assistant. Your task is to customize a LaTeX resume template
        based on the provided resume PDF(s), structured resume information, and job description. Focus on:
        1. Highlighting relevant skills and experiences that match the job requirements
        2. Reorganizing content to emphasize the most relevant qualifications
        3. Maintaining the original LaTeX structure and formatting
        4. Ensuring the output is valid LaTeX code that can be compiled.
        5. DO NOT add any unnecessary text, comments, explanations, or markdown formatting like \`\`\`latex or \`\`\` around the LaTeX code. Output ONLY the raw LaTeX code.
        6. If provided with a LaTeX template, DO NOT change any LaTeX code that controls styling, layout, graphics, bars, charts, etc. Only fill in the values appropriately.
        7. Use creativity to fill in text appropriately based on the provided information, even if the job description is short, but DO NOT change template styling or remove elements.
        8. DO NOT add any last updated date, footer, page numbers, headers, or timestamps (e.g., \\hfill{\\it\\footnotesize Updated \\today}}), unless explicitly part of the original template structure. Keep the document clean.
        ` ,
      }
    );

    // Normalize resumes to always be an array
    const resumeArray = Array.isArray(resumes) ? resumes : (resumes ? [resumes] : []);

  try {
    let streamResult: GenerateContentStreamResult | null = null;
    let contentParts: any[] = []; // Define contentParts outside the specific approach blocks

    // --- Multimodal Approach ---
    if (resumeArray.length > 0 && resumeArray.some(resume => resume?.url)) {
        console.log(`Attempting multimodal generation with ${modelName}`);
        contentParts = []; // Reset for multimodal

        // Add job description
        contentParts.push({ text: `JOB DESCRIPTION:\n${jobDescription}\n\n` });

        // Add structured resume info if available
        if (resumeInfo) {
          contentParts.push({ text: `STRUCTURED RESUME INFORMATION:\n${JSON.stringify(resumeInfo, null, 2)}\n\n` });
        }

        // Add LaTeX template
        contentParts.push({ text: `LATEX TEMPLATE:\n${template.latex_content}\n\n` });

        // Add resume PDFs as images
        for (const resume of resumeArray) {
          if (resume.url) {
            try {
              const response = await fetch(resume.url);
              if (!response.ok) {
                console.warn(`Failed to fetch resume PDF: ${resume.name}, status: ${response.status}`);
                contentParts.push({ text: `\n[Could not fetch resume PDF: ${resume.name}]\n` }); // Inform model
                continue; // Skip this PDF
              }

              const fileBuffer = await response.arrayBuffer();
              contentParts.push({
                inlineData: {
                  mimeType: 'application/pdf',
                  data: Buffer.from(fileBuffer).toString('base64')
                }
              });
              contentParts.push({ text: `\nThe above is a resume PDF named: ${resume.name}\n\n` });

            } catch (error) {
              console.error(`Error processing resume PDF: ${resume.name}`, error);
              contentParts.push({ text: `\n[Error processing resume PDF: ${resume.name}]\n` }); // Inform model
            }
          }
        }

        // Add final instruction
        contentParts.push({
          text: `Based on the job description, the provided resume information, and the LaTeX template, please generate the customized LaTeX resume code ONLY. Fill the template with relevant information matching the job requirements. Return ONLY the raw, valid LaTeX code without any extra text, comments, or markdown formatting.`
        });

        try {
            streamResult = await model.generateContentStream({
              contents: [{ role: 'user', parts: contentParts }],
            });
        } catch (multiModalError: any) {
            console.error('Error in multimodal stream generation:', multiModalError);
            // Fallback to text-only if multimodal fails
            streamResult = null; // Ensure we proceed to text-only
            console.log("Falling back to text-only generation due to multimodal error.");
        }
    }

    // --- Text-only Approach (if no PDFs, or multimodal failed) ---
    if (!streamResult) {
        console.log(`Using text-only generation with ${modelName}`);
        let promptText = `JOB DESCRIPTION:\n${jobDescription}\n\n`;

        // Add structured resume info if available
        if (resumeInfo) {
          promptText += `STRUCTURED RESUME INFORMATION:\n${JSON.stringify(resumeInfo, null, 2)}\n\n`;
        }

        // Add resume names if PDFs were present but couldn't be processed (or if multimodal failed)
        if (resumeArray.length > 0) {
          const resumeNames = resumeArray.map(r => r.name).join('\n');
          promptText += `RESUME NAMES (PDFs were provided but might not have been processed):\n${resumeNames}\n\n`;
        }

        promptText += `LATEX TEMPLATE:\n${template.latex_content}\n\n`;

        promptText += `Based on the job description, the provided resume information, and the LaTeX template, please generate the customized LaTeX resume code ONLY. Fill the template with relevant information matching the job requirements. Return ONLY the raw, valid LaTeX code without any extra text, comments, or markdown formatting.`;

        contentParts = [{ text: promptText }]; // Prepare parts for text-only stream

        streamResult = await model.generateContentStream({
            contents: [{ role: 'user', parts: contentParts }],
        });
    }


    // --- Streaming the response ---
    const stream = new ReadableStream({
      start(controller) {
        // Don't await here, let it run in the background
        streamGeminiResponse(streamResult!, controller);
      },
      cancel(reason) {
          console.log("Stream cancelled:", reason);
          // Potential cleanup if needed, e.g., cancelling Gemini request if possible
      }
    });

    // Return the stream response
    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8', // Set correct content type for streaming text
        'X-Content-Type-Options': 'nosniff',
      },
    });

    } catch (error) {
      console.error('Gemini API Error:', error);
      // Ensure a proper JSON error response if streaming setup fails
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Failed to generate customized resume stream' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in rate-limited request:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process request' },
      { status: 500 }
    );
  }
});
}