import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye, LayoutTemplate, FileText, Loader2 } from 'lucide-react';

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
  isGenerating?: boolean; // Add isGenerating prop
}

export default function ResumeHeader({ 
  selectedTemplate, 
  setIsTemplateDialogOpen, 
  handlePreviewResume,
  handleGenerateResume,
  isGenerating = false // Default to false
}: ResumeHeaderProps) {
  return (
    <>
      <div className="flex items-center justify-between mb-6 px-5">
        <h1 className="text-2xl font-bold">Create Your Resume</h1>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => setIsTemplateDialogOpen(true)} 
            className="flex items-center gap-2"
            disabled={isGenerating}
          >
            <LayoutTemplate size={16} />
            {selectedTemplate ? "Change Template" : "Select Template"}
          </Button>
        
          <Button 
            variant="default" 
            onClick={handleGenerateResume} 
            className="flex items-center gap-2"
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
        <Card className="mb-4 bg-blue-50 border-blue-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded overflow-hidden border">
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
                <h3 className="font-medium">Template: {selectedTemplate.name}</h3>
                <p className="text-sm text-gray-600">{selectedTemplate.category.charAt(0).toUpperCase() + selectedTemplate.category.slice(1)}</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setIsTemplateDialogOpen(true)}
              disabled={isGenerating}
            >
              Change
            </Button>
          </CardContent>
        </Card>
      )}
    </>
  );
}