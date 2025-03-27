import React from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from 'lucide-react';

interface ResumeAssistantProps {
  generatedLatex: string;
  chatQuestion: string;
  setChatQuestion: (question: string) => void;
  isChatLoading: boolean;
  onChatSubmit: () => void;
}

export default function ResumeAssistant({
  generatedLatex,
  chatQuestion,
  setChatQuestion,
  isChatLoading,
  onChatSubmit
}: ResumeAssistantProps) {
  return (
    <div className="mt-4 pt-4 border-t border-gray-200">
      <h3 className="text-sm font-medium mb-2">Resume Assistant</h3>
      
      <div className="flex items-center">
        <Textarea 
          placeholder="Ask a question about your resume..." 
          className="flex-1 resize-none h-10 py-2"
          value={chatQuestion}
          onChange={(e) => setChatQuestion(e.target.value)}
          disabled={isChatLoading || !generatedLatex}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              onChatSubmit();
            }
          }}
        />
        <Button 
          size="sm" 
          className="ml-2 h-10"
          onClick={onChatSubmit}
          disabled={isChatLoading || !generatedLatex || !chatQuestion.trim()}
        >
          {isChatLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-send">
              <path d="m22 2-7 20-4-9-9-4Z"/>
              <path d="M22 2 11 13"/>
            </svg>
          )}
        </Button>
      </div>
    </div>
  );
}