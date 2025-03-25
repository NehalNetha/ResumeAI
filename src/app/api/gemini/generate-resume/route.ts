import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Google Generative AI with your API key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: Request) {
  try {
    const { 
      personalInfo, 
      workExperience, 
      education, 
      projects, 
      skills, 
      links, 
      template, 
      jobDescription 
    } = await request.json();
    
    // Log the request data
    console.log('Gemini Resume Generation Request:', {
      templateId: template?.id,
      templateName: template?.name,
      jobDescriptionLength: jobDescription?.length || 0,
      timestamp: new Date().toISOString()
    });
    
    if (!template) {
      console.log('Gemini API Error: Missing template');
      return NextResponse.json(
        { error: 'Missing template' },
        { status: 400 }
      );
    }
    
    // Get the generative model - using gemini-1.5-flash
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',  
      systemInstruction: `You are an expert resume tailoring assistant. Your task is to customize a LaTeX resume template 
      based on the provided structured resume data and job description (if available). Focus on:
      1. Filling in the LaTeX template with the provided resume data
      2. Highlighting relevant skills and experiences that match the job requirements (if job description is provided)
      3. Maintaining the original LaTeX structure and formatting
      4. Ensuring the output is valid LaTeX code that can be compiled
      5. Don't add any unnecessary text or comments in the LaTeX, as it's going to be used as an actual resume
      6. Don't change any LaTeX code that affects styling and layout, just fill in the appropriate values
      7. If the template includes graphics, bars, charts, etc., do not remove them - use the provided data to fill them appropriately
      8. Format dates consistently throughout the resume
      9. Ensure bullet points are concise and impactful
      10. If job description is provided, tailor the content to emphasize relevant qualifications`
    });
    
    // Construct the structured resume data
    const resumeData = {
      personalInfo: personalInfo || {},
      workExperience: workExperience || [],
      education: education || [],
      projects: projects || [],
      skills: skills || [],
      links: links || []
    };
    
    // Construct the prompt
    let prompt = `RESUME DATA:\n${JSON.stringify(resumeData, null, 2)}\n\n`;
    
    // Add job description if available
    if (jobDescription) {
      prompt += `JOB DESCRIPTION:\n${jobDescription}\n\n`;
    }
    
    // Add template
    prompt += `CURRENT LATEX TEMPLATE:\n${template.latex_content}\n\n`;
    
    // Add final instruction
    prompt += "Please fill the LaTeX template with the provided resume data, creating a professional and well-formatted resume. ";
    if (jobDescription) {
      prompt += "Tailor the content to highlight skills and experiences relevant to the job description. ";
    }
    prompt += "Return only the modified LaTeX code.";
    
    console.log('Gemini API Prompt Length:', prompt.length);
    
    // Generate content
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
    console.error('Error generating resume with Gemini API:', error);
    return NextResponse.json(
      { error: 'Failed to generate resume' },
      { status: 500 }
    );
  }
}