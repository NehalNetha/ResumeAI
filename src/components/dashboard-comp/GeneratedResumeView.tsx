import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Wand2, Eye, Code, Clipboard, ClipboardCheck, FileText, Loader2 } from 'lucide-react';
import { Textarea } from "@/components/ui/textarea";
import * as diffLib from 'diff';
import ResumeAssistant from './ResumeAssistant';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Resume } from '@/types/resume';

interface GeneratedResumeViewProps {
  generatedLatex: string;
  originalLatex: string;
  previewMode: 'raw' | 'preview';
  setPreviewMode: (mode: 'raw' | 'preview') => void;
  diffResult: diffLib.Change[];
  showDiff: boolean;
  isCopied: boolean;
  setIsCopied: (copied: boolean) => void;
  onDownloadPDF?: () => void;
  onCopyLatex?: () => void;
  // Add new props for ResumeAssistant
  chatQuestion: string;
  setChatQuestion: (question: string) => void;
  isChatLoading: boolean;
  onChatSubmit: () => void;
  // Add props for resume selection
  uploadedResumes: Resume[];
  onSelectResumeForChat: (resume: Resume) => void;
}

export default function GeneratedResumeView({
  generatedLatex,
  originalLatex,
  previewMode,
  setPreviewMode,
  diffResult,
  showDiff,
  isCopied,
  setIsCopied,
  onDownloadPDF,
  onCopyLatex,
  // Add new props for ResumeAssistant
  chatQuestion,
  setChatQuestion,
  isChatLoading,
  onChatSubmit,
  uploadedResumes,
  onSelectResumeForChat
}: GeneratedResumeViewProps) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [cachedLatex, setCachedLatex] = useState<string | null>(null); // <-- Add state for cached LaTeX

  const [showResumePicker, setShowResumePicker] = useState(false);
  const chatInputRef = useRef<HTMLTextAreaElement>(null);
  const handleChatInputKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === '#') {
      e.preventDefault();
      setShowResumePicker(true);
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onChatSubmit();
    } else if (e.key === 'Escape') {
      setShowResumePicker(false);
    }
  };
  
  const handleResumeSelect = (resume: Resume) => {
    onSelectResumeForChat(resume);
    setShowResumePicker(false);
    // Add a reference to the selected resume in the chat input
    setChatQuestion(`${chatQuestion} [Using resume: ${resume.name}] `);
    // Focus back on the input
    if (chatInputRef.current) {
      chatInputRef.current.focus();
    }
  };
  
  // Generate PDF preview when switching to preview tab
  useEffect(() => {
    // Only attempt to show/generate preview if in preview mode and latex exists
    if (previewMode === 'preview' && generatedLatex) {
      // Check if the current URL is for the current LaTeX content
      if (pdfUrl && cachedLatex === generatedLatex) {
        // Cache hit: We already have the correct preview loaded
        setIsPreviewLoading(false);
        setPreviewError(null);
      } else {
        // Cache miss or no URL: Need to generate a new preview
        // If pdfUrl exists but latex is different, revoke the old URL first
        if (pdfUrl && cachedLatex !== generatedLatex) {
             URL.revokeObjectURL(pdfUrl);
             setPdfUrl(null); // Clear the state immediately
             setCachedLatex(null);
        }
        generatePdfPreview();
      }
    } else if (previewMode !== 'preview') {
        // Optional: Clear loading/error when switching away from preview tab
        setIsPreviewLoading(false);
        setPreviewError(null);
        // Do not revoke URL here - user might switch back
    }
    // NOTE: We don't include pdfUrl or cachedLatex in deps to avoid re-running unnecessarily
  }, [previewMode, generatedLatex]); // Re-run only when mode or latex changes
  
  // Clean up PDF URL when component unmounts
  useEffect(() => {
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]); // Depend on pdfUrl to ensure the *current* URL is revoked if it changes before unmount

  const generatePdfPreview = async () => {
    if (!generatedLatex) return;
  
    setIsPreviewLoading(true);
    setPreviewError(null);
    // Store the latex content we are generating for, in case it changes during the async operation
    const latexToGenerateFor = generatedLatex;
  
    try {
      // Use the compile endpoint to get PDF directly
      const response = await fetch('https://latex-compiler-1082803956279.asia-south1.run.app/compile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          latex_content: latexToGenerateFor, // Use the stored latex content
          target_filename: "resume.tex"
        }),
      });
  
      if (!response.ok) {
        const errorText = await response.text();
        console.error("PDF compilation error:", errorText);
        throw new Error(errorText || 'Failed to generate PDF preview');
      }
  
      const blob = await response.blob();
      const newUrl = URL.createObjectURL(blob);
  
      // Check if latex content has changed *while* we were fetching
      if (latexToGenerateFor === generatedLatex) {
        // Revoke previous URL *before* setting the new one, if it exists
        if (pdfUrl) {
            URL.revokeObjectURL(pdfUrl);
        }
        // Update state with the new URL and the corresponding LaTeX
        setPdfUrl(newUrl);
        setCachedLatex(latexToGenerateFor);
      } else {
        // Latex changed during fetch - discard this result and revoke its URL
        console.warn("Latex content changed during preview generation. Discarding stale result.");
        URL.revokeObjectURL(newUrl);
        // The main useEffect will trigger again for the *new* generatedLatex
      }
  
      } catch (error) {
        console.error('Error generating preview:', error);
         // Only set error if the request was for the *current* latex
         if (latexToGenerateFor === generatedLatex) {
            setPreviewError(error instanceof Error ? error.message : 'Failed to generate preview');
            // Clear potentially outdated URL if generation failed for current latex
            if (pdfUrl) {
              URL.revokeObjectURL(pdfUrl);
              setPdfUrl(null);
              setCachedLatex(null);
            }
         }
      } finally {
        // Only set loading to false if the request was for the *current* latex
        if (latexToGenerateFor === generatedLatex) {
          setIsPreviewLoading(false);
        }
      }
    };
  
 
  
  const handleCopyLatex = () => {
    if (onCopyLatex) {
      onCopyLatex();
    } else if (generatedLatex) {
      navigator.clipboard.writeText(generatedLatex).then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      });
    }
  };
  
  const renderRawLatex = () => {
    if (!showDiff || !diffResult.length) {
      return (
        <pre className="text-xs whitespace-pre-wrap font-mono">
          {generatedLatex}
        </pre>
      );
    }
    
    return (
      <div className="font-mono text-xs whitespace-pre-wrap">
        {diffResult.map((part, index) => {
          // Added lines are green, removed lines are red, unchanged are normal
          const color = part.added ? 'bg-green-100 text-green-800' : 
                      part.removed ? 'bg-red-100 text-red-800' : '';
          
          return (
            <span key={index} className={`${color}`}>
              {part.value}
            </span>
          );
        })}
      </div>
    );
  };

  
  
  const renderDiff = () => {
    return (
      <div className="font-mono text-xs whitespace-pre-wrap">
        {diffResult.map((part, index) => {
          // Added lines are green, removed lines are red, unchanged are normal
          const color = part.added ? 'bg-green-100 text-green-800' : 
                      part.removed ? 'bg-red-100 text-red-800' : '';
          
          // Add line prefix to indicate added/removed
          const lines = part.value.split('\n').filter(line => line.length > 0);
          
          return (
            <div key={index} className={`${color}`}>
              {lines.map((line, lineIndex) => (
                <div key={`${index}-${lineIndex}`} className="py-1">
                  <span className="mr-2 inline-block w-4 text-gray-500">
                    {part.added ? '+' : part.removed ? '-' : ' '}
                  </span>
                  {line}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <Card className="flex flex-col lg:h-full"> {/* Assume parent provides height context */}

    <CardContent className="flex-1 flex flex-col p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium">Generated Resume</h2>
        {generatedLatex && (
          <Button variant="outline" size="sm" className="gap-2" onClick={onDownloadPDF}>
            <FileText className="h-4 w-4" />
            Download PDF
          </Button>
        )}
      </div>
      
      {!generatedLatex ? (
        <div className="flex-1 flex items-center justify-center text-center p-6 border-2 border-dashed border-gray-200 rounded-lg">
          <div>
            <Wand2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No Resume Generated Yet</h3>
            <p className="text-gray-500 max-w-md">
              Select a resume template, upload your resume, and provide a job description to generate a customized resume.
            </p>
          </div>
        </div>
      ) : (
        // Modify this container: Make it a flex column, remove overflow-hidden
        <div className="flex-1 flex flex-col bg-white border border-gray-200 rounded-lg"> {/* Removed overflow-hidden, added flex flex-col */}
          {/* Make Tabs component itself flexible and grow */}
          <Tabs value={previewMode} onValueChange={(value) => setPreviewMode(value as 'raw' | 'preview')} className="w-full flex flex-col flex-1"> {/* Added flex flex-col flex-1 */}
            {/* Ensure TabsList doesn't shrink */}
            <TabsList className="w-full mb-2 flex-shrink-0"> {/* Added flex-shrink-0 */}
              <TabsTrigger value="raw" className="flex-1 gap-2">
                <Code className="h-4 w-4" />
                Raw LaTeX
              </TabsTrigger>
              <TabsTrigger value="preview" className="flex-1 gap-2">
                <Eye className="h-4 w-4" />
                Preview
              </TabsTrigger>
            </TabsList>
            
            {/* Raw LaTeX Tab: Use relative/absolute for scrolling within flex child */}
            <TabsContent value="raw" className="relative flex-1 overflow-hidden"> {/* Added relative flex-1 overflow-hidden */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyLatex}
                className="absolute top-0 right-8 z-10 gap-1" // Keep absolute positioning relative to TabsContent
              >
                {isCopied ? (
                  <>
                    <ClipboardCheck />
                    Copied!
                  </>
                ) : (
                  <>
                   <Clipboard />
                    Copy
                  </>
                )}
              </Button>
              {/* This div now handles scrolling within the flex space */}
              <div className="absolute inset-0 overflow-y-auto p-4 pt-10"> {/* Changed to absolute inset-0 for scrolling */}
                {renderRawLatex()}
              </div>
            </TabsContent>

            {/* Preview Tab: Make it a flex container that grows */}
            <TabsContent value="preview" className="flex-1 flex flex-col"> {/* Added flex-1 flex flex-col */}
              {/* This div will now take the height given by flex-1 */}
              <div className="flex-1 flex items-center justify-center p-0"> {/* Added flex-1 flex */}
                {/* Inner container to center content */}
                <div className="w-full h-full flex items-center justify-center">
                  {isPreviewLoading ? (
                    <div className="flex flex-col items-center justify-center">
                      <Loader2 className="h-8 w-8 animate-spin text-gray-400 mb-2" />
                      <p className="text-sm text-gray-500">Generating preview...</p>
                    </div>
                  ) : previewError ? (
                    <div className="text-center p-4 border border-red-200 rounded-md bg-red-50 max-w-md">
                      <h3 className="text-red-800 font-medium mb-2">Error Generating Preview</h3>
                      <p className="text-sm text-red-600">{previewError}</p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-3"
                        onClick={generatePdfPreview}
                      >
                        Try Again
                      </Button>
                    </div>
                  ) : pdfUrl ? (
                    // Increase the height of the container div and the iframe
                    <div className="w-full h-full" style={{ minHeight: '90vh' }}> 
                      <iframe 
                        src={pdfUrl} 
                        title="Resume Preview" 
                        // Use h-full to fill parent div, keep minHeight as fallback
                        className="w-full h-full border border-gray-200 shadow-sm" 
                        style={{ minHeight: '700px' }} // Keep min-height constraint
                      />
                    </div>
                  ) : (
                    <div className="text-center">
                      <Button 
                        variant="outline" 
                        onClick={generatePdfPreview}
                      >
                        Generate Preview
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
            
            {/* Diff Tab: Similar scrolling setup as Raw Tab */}
            <TabsContent value="diff" className="relative flex-1 overflow-hidden"> {/* Added relative flex-1 overflow-hidden */}
                {/* This div now handles scrolling */}
              <div className="absolute inset-0 overflow-y-auto p-4"> {/* Changed to absolute inset-0 for scrolling */}
                {renderDiff()}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      )}
      
      {/* Chat box UI */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <h3 className="text-sm font-medium mb-2">Resume Assistant</h3>
        
        <div className="flex items-center relative">
          <Popover open={showResumePicker} onOpenChange={setShowResumePicker}>
            <PopoverTrigger asChild>
              <div className="sr-only">Resume Picker</div>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="start">
              <div className="max-h-60 overflow-y-auto p-2">
                <h4 className="font-medium text-sm mb-2 px-2">Select a resume to reference:</h4>
                {uploadedResumes.length === 0 ? (
                  <p className="text-sm text-gray-500 p-2">No resumes available</p>
                ) : (
                  <div className="space-y-1">
                    {uploadedResumes.map(resume => (
                      <div 
                        key={resume.id.toString()}
                        className="flex items-center p-2 hover:bg-gray-100 rounded cursor-pointer"
                        onClick={() => handleResumeSelect(resume)}
                      >
                        <FileText className="h-4 w-4 mr-2 text-blue-500" />
                        <span className="text-sm">{resume.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>
          
          <Textarea 
            placeholder="Ask a question about your resume... (Press # to reference a specific resume)"
            className="flex-1 resize-none h-10 py-2"
            value={chatQuestion}
            onChange={(e) => setChatQuestion(e.target.value)}
            disabled={isChatLoading || !generatedLatex}
            onKeyDown={handleChatInputKeyDown}
            ref={chatInputRef}
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
    </CardContent>
  </Card>
  );
}

// Handle # key press to show resume picker
