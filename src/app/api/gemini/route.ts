import { NextResponse } from 'next/server';
import {
  GoogleGenerativeAI,
  GenerateContentStreamResult,
  Part, // Import Part type
  Content, // Import Content type
} from '@google/generative-ai';
import { createClient } from '@/utils/supabase/server';
import { rateLimiters } from '@/utils/rateLimiting/rate-limit';
import { withRateLimit } from '@/utils/rateLimiting/rate-limit-middleware';

// --- Configuration ---
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const MODEL_NAME = process.env.GEMINI_MODEL_NAME || 'gemini-1.5-flash'; // Allow overriding via env var
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

// --- Type Definitions (Optional but recommended) ---
interface ResumeInfo {
  personal_info?: Record<string, any>;
  work_experience?: any[];
  education?: any[];
  projects?: any[];
  skills?: any[];
  links?: any[];
  // Add other potential fields
}

interface ResumeFile {
  name: string;
  url?: string; // URL to the PDF on Supabase Storage or elsewhere
  // Optionally add size, type etc. if needed
}

interface Template {
  id: string | number;
  name: string;
  latex_content: string;
}

// --- Initialization ---
if (!GEMINI_API_KEY) {
  console.error("FATAL: GEMINI_API_KEY environment variable is not set.");
  // Optionally throw an error during build/startup if preferred
}
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY || ''); // Fallback empty string prevents immediate crash if check is bypassed
const model = genAI.getGenerativeModel({
    model: MODEL_NAME,
    systemInstruction: SYSTEM_INSTRUCTION,
});


// --- Helper Functions ---

/**
 * Pipes the Gemini stream to a ReadableStream controller.
 * Encodes text chunks and handles stream errors/completion.
 */
async function streamGeminiResponse(
  streamResult: GenerateContentStreamResult,
  controller: ReadableStreamDefaultController<any>
): Promise<void> { // Added return type hint
  const encoder = new TextEncoder();
  try {
    for await (const chunk of streamResult.stream) {
      // Defensive check for text content
      const text = chunk.text?.(); // Use optional chaining just in case
      if (typeof text === 'string' && text.length > 0) {
        controller.enqueue(encoder.encode(text));
      }
      // Log potential non-text chunks or errors if needed for debugging
      // else if (chunk.functionCalls) { console.log("Received function call chunk:", chunk); }
      // else if (chunk.error) { console.error("Received error chunk:", chunk.error); }
    }
  } catch (error) {
    console.error('Error reading Gemini stream:', error);
    // Propagate the error to the client via the stream
    controller.error(error instanceof Error ? error : new Error('Gemini stream processing failed'));
  } finally {
    // Ensure the stream is always closed
    try {
        controller.close();
    } catch (closeError) {
        // Ignore errors closing an already errored/closed stream
        console.warn("Error closing stream controller (may be expected if stream already errored):", closeError);
    }
  }
}

/**
 * Fetches a PDF from a URL and returns its base64 representation.
 */
async function fetchPdfAsBase64(url: string, resumeName: string): Promise<string | null> {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            console.warn(`Failed to fetch resume PDF: ${resumeName}, Status: ${response.status} ${response.statusText}, URL: ${url}`);
            return null; // Indicate failure
        }
        if (response.headers.get('content-type')?.toLowerCase() !== 'application/pdf') {
            console.warn(`Unexpected content type for resume PDF: ${resumeName}, Type: ${response.headers.get('content-type')}, URL: ${url}`);
            // Decide if you want to return null or try processing anyway
            // return null;
        }
        const fileBuffer = await response.arrayBuffer();
        // Ensure buffer is not empty
        if (fileBuffer.byteLength === 0) {
            console.warn(`Fetched empty buffer for resume PDF: ${resumeName}, URL: ${url}`);
            return null;
        }
        return Buffer.from(fileBuffer).toString('base64');
    } catch (error) {
        console.error(`Error fetching or processing resume PDF: ${resumeName}, URL: ${url}`, error);
        return null; // Indicate failure
    }
}


// --- API Route Handler ---

export async function POST(request: Request): Promise<NextResponse> {
  return withRateLimit(request, rateLimiters.chat, async (req) => {
    const supabase = await createClient(); // Renamed to avoid conflict with request
    let user;

    // 1. Authentication
    try {
      const { data: authData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError; // Throw Supabase auth errors
      if (!authData.user) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
      }
      user = authData.user; // Assign user for potential future use
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
      // Add more specific validation if needed (e.g., using Zod)
      resumesInput = body.resumes;
      template = body.template;
      jobDescription = body.jobDescription;
      resumeInfo = body.resumeInfo;


      console.log('Request Body resume ingo:', resumeInfo); // Log the entire request body

      if (!template?.latex_content || !jobDescription) {
        console.log('Gemini API Error: Missing required parameters (template or jobDescription)');
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

    // Log request details (consider sampling or reducing verbosity in production)
    console.log('Processing Gemini Request:', {
        userId: user.id, // Log user ID for traceability
        templateId: template.id,
        templateName: template.name,
        jobDescriptionLength: jobDescription.length,
        resumeFileCount: resumeFiles.length,
        hasResumeInfo: !!resumeInfo,
        timestamp: new Date().toISOString()
    });

    // 3. Prepare Content Parts for Gemini
    const baseTextParts: Part[] = [
        { text: `JOB DESCRIPTION:\n${jobDescription}\n\n` },
        // Add structured info only if it exists and has content
        ...(resumeInfo && Object.keys(resumeInfo).length > 0 // <-- Checks if resumeInfo exists and is not empty
          ? [{ text: `STRUCTURED RESUME INFORMATION:\n${JSON.stringify(resumeInfo, null, 2)}\n\n` }]
          : []),
        { text: `LATEX TEMPLATE:\n${template.latex_content}\n\n` },
    ];

    let contentParts: Part[] = [];
    let attemptMultimodal = resumeFiles.some(resume => resume?.url); // Check if any resume has a URL
    let streamResult: GenerateContentStreamResult | null = null;
    let generationMode: 'multimodal' | 'text-only' | 'multimodal-fallback' = 'text-only'; // Track generation mode

    // 4. Attempt Multimodal Generation (if applicable)
    if (attemptMultimodal) {
      console.log(`Attempting multimodal generation with ${MODEL_NAME}`);
      generationMode = 'multimodal';
      const pdfParts: Part[] = [];
      let pdfFetchSuccess = false; // Track if at least one PDF was processed

      for (const resume of resumeFiles) {
        if (resume.url) {
          const base64Data = await fetchPdfAsBase64(resume.url, resume.name);
          if (base64Data) {
            pdfParts.push({
              inlineData: { mimeType: 'application/pdf', data: base64Data }
            });
            // Optional: Add text part naming the PDF
            pdfParts.push({ text: `\n[The above content is from resume PDF: ${resume.name}]\n` });
            pdfFetchSuccess = true;
          } else {
             // Inform the model that a PDF was expected but failed
            pdfParts.push({ text: `\n[Note: Failed to load or process resume PDF named: ${resume.name}]\n` });
          }
        }
      }

      // Only proceed with multimodal if at least one PDF was successfully processed
      if (pdfFetchSuccess) {
          contentParts = [
              ...baseTextParts.slice(0, -1), // Add JD, structured info
              ...pdfParts, // Add PDF data and notes
              baseTextParts[baseTextParts.length - 1], // Add LaTeX Template
              { text: `Based on the job description, the provided resume information (including processed PDFs), and the LaTeX template, generate the customized LaTeX resume code ONLY. Fill the template with relevant information matching the job requirements. Return ONLY the raw, valid LaTeX code without any extra text, comments, or markdown formatting.` }
          ];

          try {
            streamResult = await model.generateContentStream({
                contents: [{ role: 'user', parts: contentParts }],
            });
            console.log("Multimodal stream generation initiated successfully.");
          } catch (multiModalError: any) {
            console.error('Error during multimodal stream generation:', multiModalError);
            // Log error but don't return yet, allow fallback to text-only
            streamResult = null; // Ensure fallback happens
            generationMode = 'multimodal-fallback';
            console.log("Falling back to text-only generation due to multimodal error.");
          }
      } else {
          console.log("No PDFs successfully processed, skipping multimodal attempt.");
          // Proceed directly to text-only below
          streamResult = null;
          generationMode = 'text-only'; // Set explicitly as text-only from the start
      }
    }

    // 5. Text-only Generation (if no PDFs, multimodal failed, or no PDFs processed)
    if (!streamResult) {
      // If we fell back, generationMode is already 'multimodal-fallback'
      if (generationMode !== 'multimodal-fallback') generationMode = 'text-only';
      console.log(`Using ${generationMode} generation with ${MODEL_NAME}`);

      let textPrompt = baseTextParts.map(part => part.text).join(''); // Combine base texts

      // Add a note if PDFs were provided but not processed (either fetch failed or multimodal failed)
      if (resumeFiles.length > 0) {
          const resumeNames = resumeFiles.map(r => r.name).filter(Boolean).join(', ');
          if(resumeNames) {
            textPrompt += `NOTE: The following resume files were provided but could not be processed as PDFs: ${resumeNames}. Use the STRUCTURED RESUME INFORMATION primarily.\n\n`;
          }
      }

      textPrompt += `Based on the job description, the provided structured resume information, and the LaTeX template, generate the customized LaTeX resume code ONLY. Fill the template with relevant information matching the job requirements. Return ONLY the raw, valid LaTeX code without any extra text, comments, or markdown formatting.`;

      contentParts = [{ text: textPrompt }];

      try {
        streamResult = await model.generateContentStream({
            contents: [{ role: 'user', parts: contentParts }],
        });
        console.log(`${generationMode} stream generation initiated successfully.`);
      } catch (textOnlyError: any) {
        console.error(`Error during ${generationMode} stream generation:`, textOnlyError);
        // This is a fatal error for the request if both multimodal (if attempted) and text-only fail
        return NextResponse.json(
          { error: `Failed to generate content: ${textOnlyError.message || 'Unknown Gemini error'}` },
          { status: 500 }
        );
      }
    }

    // 6. Stream the Response
    if (!streamResult) {
        // Should theoretically not happen if the above logic is correct, but as a safeguard:
        console.error("Error: No stream result available after generation attempts.");
        return NextResponse.json(
            { error: 'Failed to initiate content generation stream.' },
            { status: 500 }
        );
    }

    try {
        const stream = new ReadableStream({
            start(controller) {
                // Intentionally not awaited - runs in background
                streamGeminiResponse(streamResult!, controller)
                    .catch(streamError => {
                        console.error("Error caught during stream processing in ReadableStream start:", streamError);
                        // Controller might already be closed or errored, attempt to signal error if possible.
                        try { controller.error(streamError); } catch (_) { /* Ignore */ }
                    });
            },
            cancel(reason) {
                console.log("Client cancelled the stream:", reason);
                // Optional: Add logic here if Gemini SDK supports request cancellation
                // streamResult?.cancel(); // Example if such a method existed
            }
        });

        return new NextResponse(stream, {
            status: 200, // OK status for successful stream initiation
            headers: {
                'Content-Type': 'text/plain; charset=utf-8',
                'X-Content-Type-Options': 'nosniff',
                'X-Generation-Mode': generationMode, // Custom header indicating mode used
            },
        });
    } catch (streamSetupError) {
        console.error("Error setting up response stream:", streamSetupError);
        return NextResponse.json(
            { error: 'Failed to set up response stream' },
            { status: 500 }
        );
    }

  }); // End of withRateLimit callback
} // End of POST function