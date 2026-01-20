// src/app/api/generate-resume/route.ts
import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@/utils/supabase/server';
import { rateLimiters } from '@/utils/rateLimiting/rate-limit';
import { withRateLimit } from '@/utils/rateLimiting/rate-limit-middleware';

// Initialize OpenAI with your API key
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
  baseURL: process.env.OPENAI_BASE_URL,
});
const MODEL_NAME = process.env.OPENAI_MODEL_NAME || 'gpt-4o-mini';

const SYSTEM_INSTRUCTION = `You are an expert resume tailoring assistant. Your task is to customize a LaTeX resume template
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
Output ONLY the complete, modified LaTeX code. Do not include any introductory text, explanations, or markdown formatting (like \`\`\`latex).`;

// Helper function to stream OpenAI response
async function streamOpenAIResponse(
  stream: AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>,
  controller: ReadableStreamDefaultController<any>
) {
  const encoder = new TextEncoder();
  try {
    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content;
      if (text) {
        controller.enqueue(encoder.encode(text));
      }
    }
  } catch (error) {
    console.error("Error reading OpenAI stream:", error);
    controller.error(error);
  } finally {
    controller.close();
  }
}

export async function POST(request: Request) {
  return withRateLimit(request, rateLimiters.chat, async () => {
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
      console.log('OpenAI Resume Generation Request:', {
        templateId: template?.id,
        templateName: template?.name,
        jobDescriptionLength: jobDescription?.length || 0,
        timestamp: new Date().toISOString()
      });

      if (!template || !template.latex_content) {
        console.log('API Error: Missing template or template content');
        return NextResponse.json(
          { error: 'Missing template or template content' },
          { status: 400 }
        );
      }

      // Construct the structured resume data
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
          return value
            .replace(/%/g, '\\%')
            .replace(/&/g, '\\&')
            .replace(/\$/g, '\\$')
            .replace(/#/g, '\\#')
            .replace(/_/g, '\\_')
            .replace(/{/g, '\\{')
            .replace(/}/g, '\\}');
        }
        return value;
      });

      // Construct the prompt
      let prompt = `RESUME DATA (LaTeX special characters should be escaped):\n${JSON.stringify(escapedResumeData, null, 2)}\n\n`;

      if (jobDescription) {
        const escapedJobDesc = jobDescription.replace(/%/g, '\\%').replace(/&/g, '\\&');
        prompt += `JOB DESCRIPTION:\n${escapedJobDesc}\n\n`;
      }

      prompt += `LATEX TEMPLATE:\n${template.latex_content}\n\n`;

      prompt += "Instruction: Fill the LaTeX template using the provided RESUME DATA. ";
      if (jobDescription) {
        prompt += "Tailor the content using the JOB DESCRIPTION. ";
      }
      prompt += "Ensure all user text inserted into the template has LaTeX special characters properly escaped. Output ONLY the modified LaTeX code, ready for compilation.";

      console.log('OpenAI API Prompt Length:', prompt.length);

      // Generate content stream using OpenAI
      const stream = await openai.chat.completions.create({
        model: MODEL_NAME,
        messages: [
          { role: 'system', content: SYSTEM_INSTRUCTION },
          { role: 'user', content: prompt }
        ],
        stream: true,
      });

      // Stream the response
      const responseStream = new ReadableStream({
        start(controller) {
          streamOpenAIResponse(stream, controller);
        },
        cancel(reason) {
          console.log("Stream cancelled:", reason);
        }
      });

      // Return the stream response
      return new NextResponse(responseStream, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'X-Content-Type-Options': 'nosniff',
        },
      });

    } catch (error: any) {
      console.error('Error generating resume with OpenAI API:', error);
      if (error.response && error.response.data) {
        console.error('OpenAI API Error Details:', error.response.data);
      }
      return NextResponse.json(
        { error: `Failed to generate resume stream: ${error.message || 'Unknown error'}` },
        { status: 500 }
      );
    }
  });
}
