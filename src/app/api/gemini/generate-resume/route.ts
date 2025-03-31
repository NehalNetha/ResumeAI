// src/app/api/generate-resume/route.ts
// (Keep the existing code as provided in the prompt)
import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@/utils/supabase/server';
import { withRateLimit } from '@/utils/rate-limit-middleware';
import { rateLimiters } from '@/utils/rate-limit'
// Initialize the Google Generative AI with your API key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

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

    if (!template || !template.latex_content) { // Ensure latex_content exists
      console.log('Gemini API Error: Missing template or template content');
      return NextResponse.json(
        { error: 'Missing template or template content' },
        { status: 400 }
      );
    }

    // Get the generative model
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
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
    // Escape LaTeX special characters in user data (simplified example)
    // A more robust solution would recursively traverse the data structure
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
                // Handle tilde (~) and caret (^) if needed: .replace(/~/g, '\\textasciitilde{}').replace(/\^/g, '\\textasciicircum{}')
        }
        return value;
    });


    let prompt = `RESUME DATA (LaTeX special characters should be escaped):\n${JSON.stringify(escapedResumeData, null, 2)}\n\n`;

    if (jobDescription) {
      // Also escape job description text if necessary, although less likely to contain problematic chars
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

    // Generate content
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    console.log('Gemini API Raw Response Length:', text.length);

    // Simple check if response looks like LaTeX
    const latexCode = text.trim().startsWith('\\documentclass') ? text.trim() : text; // Basic check

    console.log('Gemini API Processed Response Length:', latexCode.length);

    // --- Important: Add check for empty or error response from Gemini ---
    if (!latexCode || latexCode.length < 50) { // Arbitrary short length check
        console.error('Gemini API returned potentially invalid or empty LaTeX:', latexCode);
        return NextResponse.json(
          { error: 'Failed to generate valid LaTeX from AI. Please try again or adjust your inputs.' },
          { status: 500 }
        );
    }
    // --- End Check ---

    return NextResponse.json({
      modifiedLatex: latexCode
      // We removed originalResponse as it's not needed by the frontend now
    });

  } catch (error: any) {
    console.error('Error generating resume with Gemini API:', error);
    // Log specific Gemini errors if available
    if (error.response && error.response.data) {
        console.error('Gemini API Error Details:', error.response.data);
    }
    return NextResponse.json(
      { error: `Failed to generate resume: ${error.message || 'Unknown error'}` },
      { status: 500 }
    );
  }
});
}