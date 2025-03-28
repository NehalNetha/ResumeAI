import { NextResponse } from 'next/server';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold, Content } from '@google/generative-ai';

// Initialize the Google Generative AI with your API key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Define a type for the chat history entries for clarity
interface ChatHistoryEntry {
  role: 'user' | 'model';
  parts: { text: string }[];
}

export async function POST(request: Request) {
  try {
    // Destructure chatHistory along with latex, question, and selectedResume
    const { latex, question, chatHistory = [], selectedResume = null } = await request.json();

    // Log the request data including history length and selected resume
    console.log('Chat API Request:', {
      questionLength: question?.length || 0,
      latexLength: latex?.length || 0,
      historyLength: chatHistory?.length || 0,
      hasSelectedResume: !!selectedResume,
      selectedResumeName: selectedResume?.name || 'none',
      timestamp: new Date().toISOString()
    });

    if (!latex || !question) {
      console.log('Chat API Error: Missing required parameters');
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Get the generative model - update systemInstruction to handle resume references
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      systemInstruction: `You are an expert resume editor. Your task is to modify a LaTeX resume based on user questions or requests, potentially considering previous interactions.
      Focus on:
      1. Making precise edits to the LaTeX code as requested by the user
      2. Maintaining the original LaTeX structure and formatting
      3. Ensuring the output is valid LaTeX code that can be compiled
      4. Only modifying the content that needs to be changed based on the user's request
      5. Returning the complete modified LaTeX code, not just the changes
      6. Do not add any explanations or comments in your response, just return the modified LaTeX code
      7. If the user asks for something that would break the LaTeX structure, make minimal changes that preserve the structure
      8. If the user asks for something that's not possible or not clear, make your best judgment to improve the resume in that area
      9. If the user references a specific resume file, prioritize information from that resume when making edits`
    });

    // Format the incoming history for the API if it exists
    const formattedHistory: Content[] = chatHistory.map((entry: any) => ({
        role: entry.role,
        parts: entry.parts
    }));

    // Start a chat session with the formatted history
    const chat = model.startChat({
      history: formattedHistory,
    });

    // Prepare content parts for the message
    let contentParts = [];

    // Add the current LaTeX and question
    contentParts.push({
      text: `CURRENT LATEX RESUME:
${latex}

USER REQUEST:
${question}
`
    });

    // Add selected resume if available - using the same approach as in gemini/route.ts
    if (selectedResume && selectedResume.url) {
      try {
        console.log('Fetching PDF from signed URL:', selectedResume.name);
        
        const response = await fetch(selectedResume.url);
        if (!response.ok) {
          console.error(`Failed to fetch resume PDF: ${selectedResume.name}`);
        } else {
          const fileBuffer = await response.arrayBuffer();
          
          // Add the PDF as inline data
          contentParts.push({
            inlineData: {
              mimeType: 'application/pdf',
              data: Buffer.from(fileBuffer).toString('base64')
            }
          });
          
          // Add a text description after the PDF
          contentParts.push({
            text: `\nThe above is the referenced resume PDF named: ${selectedResume.name}\n\n`
          });
        }
      } catch (error) {
        console.error(`Error processing resume PDF: ${selectedResume.name}`, error);
      }
    }

    // Add final instruction
    contentParts.push({
      text: `Please modify the LaTeX resume according to the user's request, considering our previous conversation if relevant. Return only the complete modified LaTeX code without any additional explanations or markdown formatting.`
    });

    console.log('Chat API: Sending message with content parts:', contentParts.length);

    // Send the message with all content parts
    const result = await chat.sendMessage(contentParts);
    const response = await result.response;
    const text = response.text();

    console.log('Chat API Raw Response Length:', text.length);

    // --- Unchanged LaTeX extraction logic ---
    let modifiedLatex = text;
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
    // --- End of unchanged LaTeX extraction logic ---

    // Construct the updated history to send back
    // For history, we need to simplify the content parts to just text
    const userMessageText = `User asked about: ${question}${selectedResume ? ` (Referenced resume: ${selectedResume.name})` : ''}`;
    
    const updatedHistory = [
        ...chatHistory,
        { role: 'user', parts: [{ text: userMessageText }] },
        { role: 'model', parts: [{ text: text }] }
    ];

    // Return the modified LaTeX, original LaTeX, raw response, and the NEW updated history
    return NextResponse.json({
      modifiedLatex: modifiedLatex,
      originalLatex: latex,
      originalResponse: text,
      chatHistory: updatedHistory
    });

  } catch (error) {
    console.error('Error calling Chat API:', error);
    return NextResponse.json(
      { error: 'Failed to process with Chat API' },
      { status: 500 }
    );
  }
}