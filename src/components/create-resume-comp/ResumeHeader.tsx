import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye, LayoutTemplate, FileText, Loader2, CreditCard } from 'lucide-react';

interface Template {
  id: string;
  name: string;
  preview_url: string;
  category: string;
  is_premium: boolean;
}

interface ResumeHeaderProps {
  selectedTemplate: Template | null;
  setIsTemplateDialogOpen: (open: boolean) => void;
  handlePreviewResume: () => void;
  handleGenerateResume?: () => void;
  isGenerating?: boolean; 
  userCredits: number// Add isGenerating prop
  isLoadingCredits?: boolean; // Add isLoadingCredits prop
}

export default function ResumeHeader({ 
  selectedTemplate, 
  setIsTemplateDialogOpen, 
  handlePreviewResume,
  handleGenerateResume,
  isGenerating = false,
  userCredits,
  isLoadingCredits
}: ResumeHeaderProps) {
  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 px-4 sm:px-5 gap-4">
        <h1 className="text-xl sm:text-2xl font-bold">Create Your Resume</h1>
        <div className="flex flex-wrap gap-2">

        <div className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-medium flex items-center">
              <CreditCard className="h-4 w-4 mr-1" />
              {isLoadingCredits ? (
                <span className="flex items-center">
                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                  Loading...
                </span>
              ) : (
                <span>{userCredits} credits</span>
              )}
            </div>
            
          <Button 
            variant="outline" 
            onClick={() => setIsTemplateDialogOpen(true)} 
            className="flex items-center gap-2 text-sm sm:text-base flex-1 sm:flex-auto"
            disabled={isGenerating}
          >
            <LayoutTemplate size={16} />
            {selectedTemplate ? "Change Template" : "Select Template"}
          </Button>


       
        
          <Button 
            variant="default" 
            onClick={handleGenerateResume} 
            className="flex items-center gap-2 text-sm sm:text-base flex-1 sm:flex-auto"
            disabled={!selectedTemplate || isGenerating}
          >
            {isGenerating ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <FileText size={16} />
                Create Resume
              </>
            )}
          </Button>
        </div>
      </div>

      {selectedTemplate && (
        <Card className="mx-4 sm:mx-0 mb-4 bg-blue-50 border-blue-200">
          <CardContent className="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded overflow-hidden border flex-shrink-0">
                {selectedTemplate.preview_url ? (
                  <img 
                    src={selectedTemplate.preview_url} 
                    alt={selectedTemplate.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full bg-gray-100 flex items-center justify-center">
                    <LayoutTemplate size={20} className="text-gray-400" />
                  </div>
                )}
              </div>
              <div>
                <h3 className="font-medium text-sm sm:text-base">Template: {selectedTemplate.name}</h3>
                <p className="text-xs sm:text-sm text-gray-600">{selectedTemplate.category.charAt(0).toUpperCase() + selectedTemplate.category.slice(1)}</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setIsTemplateDialogOpen(true)}
              disabled={isGenerating}
              className="w-full sm:w-auto"
            >
              Change
            </Button>
          </CardContent>
        </Card>
      )}
    </>
  );
}