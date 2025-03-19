import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Google Generative AI with your API key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: Request) {
  try {
    const {  resumes, template, jobDescription } = await request.json();
    
    // Log the request data
    console.log('Gemini API Request:', {
      resumesProvided: Array.isArray(resumes) ? resumes.length : (resumes ? 1 : 0),
      templateId: template?.id,
      templateName: template?.name,
      jobDescriptionLength: jobDescription?.length || 0,
      timestamp: new Date().toISOString()
    });
    
    if ( !template || !jobDescription) {
      console.log('Gemini API Error: Missing required parameters');
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }
    
    // Get the generative model - using gemini-1.5-flash for multimodal support
    const model = genAI.getGenerativeModel(
      { model: 'gemini-1.5-flash',  
        systemInstruction: `You are an expert resume tailoring assistant. Your task is to customize a LaTeX resume template 
        based on the provided resume PDF(s) and job description. Focus on:
        1. Highlighting relevant skills and experiences that match the job requirements
        2. Reorganizing content to emphasize the most relevant qualifications
        3. Maintaining the original LaTeX structure and formatting
        4. Ensuring the output is valid LaTeX code that can be compiled
        5. Please don't add any unnecessary text, or comments in the latex, cause it's going to be used as an actualy resume.
        6. You'll be provided with a LaTeX templation and resumes, please don't change any latex code that change the styling and layout, just fill the values that are appropriate in the code.
        7. I repeat again, if you've provided with a latex template, and that is even with graphics, bar, charts, etc, you should not remove them, even if the job description is one worded, use your cretivity to fill in the text appropirately, but do not change the stylign of the latex and do not remove anything.
        ` ,
      } 

    );
    
    // Normalize resumes to always be an array
    const resumeArray = Array.isArray(resumes) ? resumes : (resumes ? [resumes] : []);
    
    // If we have resumes with URLs, try the multimodal approach
    if (resumeArray.length > 0 && resumeArray.some(resume => resume?.url)) {
      try {
        console.log('Fetching PDFs from signed URLs');
        let contentParts = [];
        
        // Add system prompt
        
        // Add job description
        contentParts.push(`JOB DESCRIPTION:\n${jobDescription}`);
        
        // Process each resume with a URL
        for (const resume of resumeArray) {
          if (resume?.url) {
            try {
              const pdfResp = await fetch(resume.url)
                .then(response => {
                  if (!response.ok) {
                    throw new Error(`Failed to fetch PDF: ${response.status}`);
                  }
                  return response.arrayBuffer();
                });
              
              // Add PDF as inline data
              contentParts.push({
                inlineData: {
                  data: Buffer.from(pdfResp).toString("base64"),
                  mimeType: "application/pdf",
                }
              });
              
              // Add resume name for reference
              contentParts.push(`RESUME: ${resume.name}`);
            } catch (error) {
              console.error(`Error processing PDF for resume ${resume.name}:`, error);
              // Continue with other resumes
            }
          }
        }
        
        // Add template
        contentParts.push(`CURRENT LATEX TEMPLATE:\n${template.latex_content}`);
        
        // Add final instruction
        contentParts.push("Please analyze all the resume PDFs and job description, then modify the LaTeX template to highlight relevant skills and experiences that match the job requirements. Return only the modified LaTeX code.");
        
        console.log('Successfully prepared multimodal content with PDFs');
        
        // Generate content with PDFs
        const result = await model.generateContent(contentParts);
        const response = await result.response;
        const text = response.text();
        
        console.log('Gemini API Raw Response Length:', text.length);
        
        // Extract just the LaTeX code from the response
        let latexCode = text;
        
        // If the response contains markdown code blocks, extract just the LaTeX
        if (text.includes('```latex')) {
          const latexMatch = text.match(/```latex\n([\s\S]*?)```/);
          if (latexMatch && latexMatch[1]) {
            latexCode = latexMatch[1];
            console.log('Gemini API: Extracted LaTeX from markdown code block with latex tag');
          }
        } else if (text.includes('```')) {
          const codeMatch = text.match(/```\n([\s\S]*?)```/);
          if (codeMatch && codeMatch[1]) {
            latexCode = codeMatch[1];
            console.log('Gemini API: Extracted LaTeX from generic markdown code block');
          }
        } else {
          console.log('Gemini API: No code blocks found, using raw response');
        }
        
        console.log('Gemini API Processed Response Length:', latexCode.length);
        
        return NextResponse.json({
          modifiedLatex: latexCode,
          originalResponse: text
        });
        
      } catch (error) {
        console.error('Error processing PDFs:', error);
        // Fall back to text-only approach if PDF processing fails
        console.log('Falling back to text-only approach');
      }
    }
    
    // Fallback: Use text-only approach if PDF processing failed or no URLs were provided
    // Construct the text prompt
    const prompt = `


JOB DESCRIPTION:
${jobDescription}

RESUME CONTENT:
${resumeArray.length > 0 
  ? resumeArray.map(resume => `RESUME: ${resume.name}\n${JSON.stringify(resume)}`).join('\n\n')
  : 'No resumes provided'}

CURRENT LATEX TEMPLATE:
${template.latex_content}

Please analyze the resume(s) and job description, then modify the LaTeX template to highlight relevant skills and experiences that match the job requirements. Return only the modified LaTeX code.
`;

    console.log('Gemini API Prompt Length:', prompt.length);
    
    // Generate content with text-only approach
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log('Gemini API Raw Response Length:', text.length);
    
    // Extract just the LaTeX code from the response
    let latexCode = text;
    
    // If the response contains markdown code blocks, extract just the LaTeX
    if (text.includes('```latex')) {
      const latexMatch = text.match(/```latex\n([\s\S]*?)```/);
      if (latexMatch && latexMatch[1]) {
        latexCode = latexMatch[1];
        console.log('Gemini API: Extracted LaTeX from markdown code block with latex tag');
      }
    } else if (text.includes('```')) {
      const codeMatch = text.match(/```\n([\s\S]*?)```/);
      if (codeMatch && codeMatch[1]) {
        latexCode = codeMatch[1];
        console.log('Gemini API: Extracted LaTeX from generic markdown code block');
      }
    } else {
      console.log('Gemini API: No code blocks found, using raw response');
    }
    
    console.log('Gemini API Processed Response Length:', latexCode.length);
    
    return NextResponse.json({
      modifiedLatex: latexCode,
      originalResponse: text
    });
    
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    return NextResponse.json(
      { error: 'Failed to process with Gemini API' },
      { status: 500 }
    );
  }
}