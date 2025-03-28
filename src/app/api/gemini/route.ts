import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Google Generative AI with your API key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: Request) {
  try {
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
    
    // Get the generative model - using gemini-1.5-flash for multimodal support
    const model = genAI.getGenerativeModel(
      { model: 'gemini-2.0-flash',  
        systemInstruction: `You are an expert resume tailoring assistant. Your task is to customize a LaTeX resume template 
        based on the provided resume PDF(s), structured resume information, and job description. Focus on:
        1. Highlighting relevant skills and experiences that match the job requirements
        2. Reorganizing content to emphasize the most relevant qualifications
        3. Maintaining the original LaTeX structure and formatting
        4. Ensuring the output is valid LaTeX code that can be compiled, and please don't add 
        5. Please don't add any unnecessary text, or comments in the latex, cause it's going to be used as an actualy resume.
        6. You'll be provided with a LaTeX templation and resumes, please don't change any latex code that change the styling and layout, just fill the values that are appropriate in the code.
        7. I repeat again, if you've provided with a latex template, and that is even with graphics, bar, charts, etc, you should not remove them, even if the job description is one worded, use your cretivity to fill in the text appropirately, but do not change the styling of the latex and do not remove anything.
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
        
        // Add job description
        contentParts.push({
          text: `JOB DESCRIPTION:\n${jobDescription}\n\n`
        });
        
        // Add structured resume info if available
        if (resumeInfo) {
          contentParts.push({
            text: `STRUCTURED RESUME INFORMATION:\n${JSON.stringify(resumeInfo, null, 2)}\n\n`
          });
        }
        
        // Add LaTeX template
        contentParts.push({
          text: `LATEX TEMPLATE:\n${template.latex_content}\n\n`
        });
        
        // Add resume PDFs as images
        for (const resume of resumeArray) {
          if (resume.url) {
            try {
              const response = await fetch(resume.url);
              if (!response.ok) {
                console.error(`Failed to fetch resume PDF: ${resume.name}`);
                continue;
              }
              
              const fileBuffer = await response.arrayBuffer();
              contentParts.push({
                inlineData: {
                  mimeType: 'application/pdf',
                  data: Buffer.from(fileBuffer).toString('base64')
                }
              });
              
              contentParts.push({
                text: `\nThe above is a resume PDF named: ${resume.name}\n\n`
              });
              
            } catch (error) {
              console.error(`Error processing resume PDF: ${resume.name}`, error);
            }
          }
        }
        
        // Add final instruction
        contentParts.push({
          text: `Based on the job description, the provided resume information, and the LaTeX template, please generate a customized LaTeX resume. 
          Fill in the appropriate sections of the template with relevant information from the resume that matches the job requirements.
          Return ONLY the modified LaTeX code without any additional explanations or comments.`
        });
        
        // Generate content with the multimodal model
        const result = await model.generateContent({
          contents: [{ role: 'user', parts: contentParts }],
        });
        
        const response = result.response;
        let originalResponse = response.text();
        
        // Remove markdown code block delimiters if they exist
        originalResponse = originalResponse.replace(/^```latex\n?/, '').replace(/\n?```$/, '');
        
        // Return the generated LaTeX
        return NextResponse.json({
          modifiedLatex: originalResponse,
          originalResponse: originalResponse
        });
        
      } catch (error) {
        console.error('Error in multimodal approach:', error);
        // Fall back to text-only approach
      }
    }
    
    // Text-only approach (fallback or if no PDFs)
    let promptText = `JOB DESCRIPTION:\n${jobDescription}\n\n`;
    
    // Add structured resume info if available
    if (resumeInfo) {
      promptText += `STRUCTURED RESUME INFORMATION:\n${JSON.stringify(resumeInfo, null, 2)}\n\n`;
    }
    
    // Add resume names if available
    if (resumeArray.length > 0) {
      promptText += `RESUME NAMES (PDFs could not be processed):\n${resumeArray.map(r => r.name).join('\n')}\n\n`;
    }
    
    promptText += `LATEX TEMPLATE:\n${template.latex_content}\n\n`;
    
    promptText += `Based on the job description, the provided resume information, and the LaTeX template, please generate a customized LaTeX resume.
    Fill in the appropriate sections of the template with relevant information that matches the job requirements.
    Return ONLY the modified LaTeX code without any additional explanations or comments.`;
    
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: promptText }] }],
    });
    
    const response = result.response;
    const originalResponse = response.text();
    
    // Return the generated LaTeX
    return NextResponse.json({
      modifiedLatex: originalResponse,
      originalResponse: originalResponse
    });
    
  } catch (error) {
    console.error('Gemini API Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate customized resume' },
      { status: 500 }
    );
  }
}