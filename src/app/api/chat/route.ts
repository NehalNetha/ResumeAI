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

const SYSTEM_INSTRUCTION = `You are an expert resume editor. Your task is to modify a LaTeX resume based on user questions or requests, potentially considering previous interactions.
Focus on:
1. Making precise edits to the LaTeX code as requested by the user
2. Maintaining the original LaTeX structure and formatting
3. Ensuring the output is valid LaTeX code that can be compiled
4. Only modifying the content that needs to be changed based on the user's request
5. Returning the complete modified LaTeX code, not just the changes
6. Do not add any explanations or comments in your response, just return the modified LaTeX code
7. If the user asks for something that would break the LaTeX structure, make minimal changes that preserve the structure
8. If the user asks for something that's not possible or not clear, make your best judgment to improve the resume in that area
9. If the user references a specific resume file, prioritize information from that resume when making edits`;

// Type for chat history entries
interface ChatHistoryEntry {
  role: 'user' | 'assistant';
  content: string;
}

export async function POST(request: Request) {
  return withRateLimit(request, rateLimiters.chat, async () => {
    try {
      const supabase = await createClient();
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }

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

      // Convert chat history to OpenAI format
      const formattedHistory: OpenAI.Chat.ChatCompletionMessageParam[] = chatHistory.map((entry: any) => {
        // Handle both old format (parts array) and new format (content string)
        const content = entry.parts
          ? entry.parts.map((p: any) => p.text).join('\n')
          : entry.content || '';
        return {
          role: entry.role === 'model' ? 'assistant' : entry.role,
          content: content
        } as OpenAI.Chat.ChatCompletionMessageParam;
      });

      // Build the user message
      let userMessage = `CURRENT LATEX RESUME:
${latex}

USER REQUEST:
${question}
`;

      // Add note about selected resume if available
      if (selectedResume && selectedResume.name) {
        userMessage += `\nNote: User referenced resume file: ${selectedResume.name}. Use the resume data provided above.\n`;
      }

      userMessage += `\nPlease modify the LaTeX resume according to the user's request, considering our previous conversation if relevant. Return only the complete modified LaTeX code without any additional explanations or markdown formatting.`;

      console.log('Chat API: Sending message to OpenAI');

      // Create messages array with system instruction and history
      const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
        { role: 'system', content: SYSTEM_INSTRUCTION },
        ...formattedHistory,
        { role: 'user', content: userMessage }
      ];

      // Call OpenAI
      const result = await openai.chat.completions.create({
        model: MODEL_NAME,
        messages: messages,
      });

      const text = result.choices[0]?.message?.content || '';

      console.log('Chat API Raw Response Length:', text.length);

      // --- LaTeX extraction logic ---
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

      // Construct the updated history to send back
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
  });
}
