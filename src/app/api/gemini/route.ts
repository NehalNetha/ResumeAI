import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Google Generative AI with your API key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: Request) {
  try {
    const { systemPrompt, resume, template, jobDescription } = await request.json();
    
    // Log the request data
    console.log('Gemini API Request:', {
      systemPromptLength: systemPrompt?.length || 0,
      resumeProvided: !!resume,
      resumeUrl: resume?.url ? 'URL provided' : 'No URL',
      templateId: template?.id,
      templateName: template?.name,
      jobDescriptionLength: jobDescription?.length || 0,
      timestamp: new Date().toISOString()
    });
    
    if (!systemPrompt || !template || !jobDescription) {
      console.log('Gemini API Error: Missing required parameters');
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }
    
    // Get the generative model - using gemini-1.5-flash for multimodal support
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    let contentParts = [];
    
    // If resume URL is provided, fetch the PDF and convert to base64
    if (resume?.url) {
      try {
        console.log('Fetching PDF from signed URL');
        const pdfResp = await fetch(resume.url)
          .then(response => {
            if (!response.ok) {
              throw new Error(`Failed to fetch PDF: ${response.status}`);
            }
            return response.arrayBuffer();
          });
        
        // Add system prompt
        contentParts.push(systemPrompt);
        
        // Add job description
        contentParts.push(`JOB DESCRIPTION:\n${jobDescription}`);
        
        // Add PDF as inline data
        contentParts.push({
          inlineData: {
            data: Buffer.from(pdfResp).toString("base64"),
            mimeType: "application/pdf",
          }
        });
        
        // Add template
        contentParts.push(`CURRENT LATEX TEMPLATE:\n${template.latex_content}`);
        
        // Add final instruction
        contentParts.push("Please analyze the resume PDF and job description, then modify the LaTeX template to highlight relevant skills and experiences that match the job requirements. Return only the modified LaTeX code.");
        
        console.log('Successfully prepared multimodal content with PDF');
        
        // Generate content with PDF
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
        console.error('Error processing PDF:', error);
        // Fall back to text-only approach if PDF processing fails
        console.log('Falling back to text-only approach');
      }
    }
    
    // Fallback: Use text-only approach if PDF processing failed or no URL was provided
    // Construct the text prompt
    const prompt = `
${systemPrompt}

JOB DESCRIPTION:
${jobDescription}

RESUME CONTENT:
${resume ? JSON.stringify(resume) : 'No resume provided'}

CURRENT LATEX TEMPLATE:
${template.latex_content}

Please analyze the resume and job description, then modify the LaTeX template to highlight relevant skills and experiences that match the job requirements. Return only the modified LaTeX code.
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