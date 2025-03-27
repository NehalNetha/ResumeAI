import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Google Generative AI with your API key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: Request) {
  try {
    const { latex, question } = await request.json();
    
    // Log the request data
    console.log('Chat API Request:', {
      questionLength: question?.length || 0,
      latexLength: latex?.length || 0,
      timestamp: new Date().toISOString()
    });
    
    if (!latex || !question) {
      console.log('Chat API Error: Missing required parameters');
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }
    
    // Get the generative model
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      systemInstruction: `You are an expert resume editor. Your task is to modify a LaTeX resume based on user questions or requests.
      Focus on:
      1. Making precise edits to the LaTeX code as requested by the user
      2. Maintaining the original LaTeX structure and formatting
      3. Ensuring the output is valid LaTeX code that can be compiled
      4. Only modifying the content that needs to be changed based on the user's request
      5. Returning the complete modified LaTeX code, not just the changes
      6. Do not add any explanations or comments in your response, just return the modified LaTeX code
      7. If the user asks for something that would break the LaTeX structure, make minimal changes that preserve the structure
      8. If the user asks for something that's not possible or not clear, make your best judgment to improve the resume in that area`
    });
    
    // Construct the prompt
    const prompt = `
CURRENT LATEX RESUME:
${latex}

USER REQUEST:
${question}

Please modify the LaTeX resume according to the user's request. Return only the complete modified LaTeX code without any additional explanations or markdown formatting.
`;

    console.log('Chat API Prompt Length:', prompt.length);
    
    // Generate content
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log('Chat API Raw Response Length:', text.length);
    
    // Extract just the LaTeX code from the response if needed
    let modifiedLatex = text;
    
    // If the response contains markdown code blocks, extract just the LaTeX
    if (text.includes('```latex')) {
      const latexMatch = text.match(/```latex\n([\s\S]*?)```/);
      if (latexMatch && latexMatch[1]) {
        modifiedLatex = latexMatch[1];
        console.log('Chat API: Extracted LaTeX from markdown code block with latex tag');
      }
    } else if (text.includes('```')) {
      const codeMatch = text.match(/```\n([\s\S]*?)```/);
      if (codeMatch && codeMatch[1]) {
        modifiedLatex = codeMatch[1];
        console.log('Chat API: Extracted LaTeX from generic markdown code block');
      }
    } else {
      console.log('Chat API: No code blocks found, using raw response');
    }
    
    return NextResponse.json({
      modifiedLatex: modifiedLatex,
      originalLatex: latex,  // Return the original LaTeX for diff comparison
      originalResponse: text
    });
    
  } catch (error) {
    console.error('Error calling Chat API:', error);
    return NextResponse.json(
      { error: 'Failed to process with Chat API' },
      { status: 500 }
    );
  }
}