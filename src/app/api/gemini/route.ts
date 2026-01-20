import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@/utils/supabase/server';
import { rateLimiters } from '@/utils/rateLimiting/rate-limit';
import { withRateLimit } from '@/utils/rateLimiting/rate-limit-middleware';

// --- Configuration ---
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL;
const MODEL_NAME = process.env.OPENAI_MODEL_NAME || 'gpt-4o-mini';
const SYSTEM_INSTRUCTION = `You are an expert resume tailoring assistant. Your task is to customize a LaTeX resume template
based on the provided resume PDF(s), structured resume information, and job description. Focus on:
1.  Highlighting relevant skills and experiences that match the job requirements.
2.  Reorganizing content to emphasize the most relevant qualifications.
3.  Maintaining the original LaTeX structure and formatting provided in the template.
4.  Ensuring the output is valid LaTeX code that can be compiled without errors.
5.  Output ONLY the raw LaTeX code. DO NOT add any introductory/concluding text, comments, explanations, or markdown formatting like \`\`\`latex or \`\`\`.
6.  If given a LaTeX template, strictly adhere to its structure. Only replace placeholder values or content sections as appropriate based on the provided information and job description. DO NOT modify LaTeX commands related to styling, layout, graphics, fonts, colors, bars, charts, etc.
7.  Use the provided information creatively to fill the template, especially if the job description is brief, but always prioritize relevance and accuracy. Do not invent information not supported by the input. If essential information is missing for a template section, omit that section gracefully if possible or use a neutral placeholder if appropriate for the template structure, but DO NOT alter the template's core LaTeX code.
8.  DO NOT add elements not present in the original template, such as footers, headers, page numbers, logos, or timestamps (e.g., \\hfill{\\it\\footnotesize Updated \\today}}), unless they were explicitly part of the original template's structure. Keep the document clean and focused on the content requested.
9.  If the resume pdf, contains, job descriptions, analyse it, see if it is good, if it is add that, if there's no points, description of anything, add those, the resume should be as filled as possible.
`;

// --- Type Definitions ---
interface ResumeInfo {
  personal_info?: Record<string, any>;
  work_experience?: any[];
  education?: any[];
  projects?: any[];
  skills?: any[];
  links?: any[];
}

interface ResumeFile {
  name: string;
  url?: string;
}

interface Template {
  id: string | number;
  name: string;
  latex_content: string;
}

// --- Initialization ---
if (!OPENAI_API_KEY) {
  console.error("FATAL: OPENAI_API_KEY environment variable is not set.");
}
const openai = new OpenAI({
  apiKey: OPENAI_API_KEY || '',
  baseURL: OPENAI_BASE_URL,
});

// --- Helper Functions ---

/**
 * Streams OpenAI response to a ReadableStream controller.
 */
async function streamOpenAIResponse(
  stream: AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>,
  controller: ReadableStreamDefaultController<any>
): Promise<void> {
  const encoder = new TextEncoder();
  try {
    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content;
      if (typeof text === 'string' && text.length > 0) {
        controller.enqueue(encoder.encode(text));
      }
    }
  } catch (error) {
    console.error('Error reading OpenAI stream:', error);
    controller.error(error instanceof Error ? error : new Error('OpenAI stream processing failed'));
  } finally {
    try {
      controller.close();
    } catch (closeError) {
      console.warn("Error closing stream controller:", closeError);
    }
  }
}

// --- API Route Handler ---

export async function POST(request: Request): Promise<NextResponse> {
  return withRateLimit(request, rateLimiters.chat, async (req) => {
    const supabase = await createClient();
    let user;

    // 1. Authentication
    try {
      const { data: authData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!authData.user) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
      }
      user = authData.user;
    } catch (error: any) {
      console.error('Authentication Error:', error);
      return NextResponse.json(
        { error: `Authentication failed: ${error.message || 'Unknown error'}` },
        { status: 401 }
      );
    }

    // 2. Request Body Parsing and Validation
    let resumesInput: ResumeFile | ResumeFile[] | undefined;
    let template: Template | undefined;
    let jobDescription: string | undefined;
    let resumeInfo: ResumeInfo | undefined;

    try {
      const body = await req.json();
      resumesInput = body.resumes;
      template = body.template;
      jobDescription = body.jobDescription;
      resumeInfo = body.resumeInfo;

      console.log('Request Body resume info:', resumeInfo);

      if (!template?.latex_content || !jobDescription) {
        console.log('API Error: Missing required parameters (template or jobDescription)');
        return NextResponse.json(
          { error: 'Missing required parameters: template and jobDescription' },
          { status: 400 }
        );
      }
    } catch (error) {
      console.error('Error parsing request body:', error);
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    // Normalize resumes to always be an array
    const resumeFiles: ResumeFile[] = Array.isArray(resumesInput)
      ? resumesInput
      : resumesInput
        ? [resumesInput]
        : [];

    // Log request details
    console.log('Processing OpenAI Request:', {
      userId: user.id,
      templateId: template.id,
      templateName: template.name,
      jobDescriptionLength: jobDescription.length,
      resumeFileCount: resumeFiles.length,
      hasResumeInfo: !!resumeInfo,
      timestamp: new Date().toISOString()
    });

    // 3. Build the prompt
    let prompt = `JOB DESCRIPTION:\n${jobDescription}\n\n`;

    if (resumeInfo && Object.keys(resumeInfo).length > 0) {
      prompt += `STRUCTURED RESUME INFORMATION:\n${JSON.stringify(resumeInfo, null, 2)}\n\n`;
    }

    // Note about resume files (OpenAI doesn't support PDF input directly in chat completions)
    if (resumeFiles.length > 0) {
      const resumeNames = resumeFiles.map(r => r.name).filter(Boolean).join(', ');
      if (resumeNames) {
        prompt += `NOTE: Resume files were provided (${resumeNames}). Use the STRUCTURED RESUME INFORMATION above.\n\n`;
      }
    }

    prompt += `LATEX TEMPLATE:\n${template.latex_content}\n\n`;
    prompt += `Based on the job description, the provided structured resume information, and the LaTeX template, generate the customized LaTeX resume code ONLY. Fill the template with relevant information matching the job requirements. Return ONLY the raw, valid LaTeX code without any extra text, comments, or markdown formatting.`;

    console.log(`Using OpenAI generation with ${MODEL_NAME}`);

    // 4. Generate content with streaming
    try {
      const stream = await openai.chat.completions.create({
        model: MODEL_NAME,
        messages: [
          { role: 'system', content: SYSTEM_INSTRUCTION },
          { role: 'user', content: prompt }
        ],
        stream: true,
      });

      // 5. Stream the Response
      const responseStream = new ReadableStream({
        start(controller) {
          streamOpenAIResponse(stream, controller)
            .catch(streamError => {
              console.error("Error during stream processing:", streamError);
              try { controller.error(streamError); } catch (_) { /* Ignore */ }
            });
        },
        cancel(reason) {
          console.log("Client cancelled the stream:", reason);
        }
      });

      return new NextResponse(responseStream, {
        status: 200,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'X-Content-Type-Options': 'nosniff',
          'X-Generation-Mode': 'openai',
        },
      });

    } catch (error: any) {
      console.error('Error during OpenAI generation:', error);
      return NextResponse.json(
        { error: `Failed to generate content: ${error.message || 'Unknown OpenAI error'}` },
        { status: 500 }
      );
    }

  });
}
