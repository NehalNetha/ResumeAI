import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface Template {
  id: string;
  name: string;
  preview_url: string;
  category: string;
  is_premium: boolean;
}

interface TemplateSelectorProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  templates: Template[];
  selectedTemplate: Template | null;
  isLoading: boolean;
  onSelectTemplate: (template: Template) => void;
}

export default function TemplateSelector({
  isOpen,
  onOpenChange,
  templates,
  selectedTemplate,
  isLoading,
  onSelectTemplate
}: TemplateSelectorProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className=" sm:max-w-4xl max-h-[90vh] overflow-y-auto p-6">
        <DialogHeader className="mb-6">
          <DialogTitle className="text-2xl">Select a Template</DialogTitle>
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pb-6">
            {templates.map((template) => (
              <div 
                key={template.id}
                className={`border rounded-lg overflow-hidden transition-all cursor-pointer hover:shadow-md ${
                  selectedTemplate?.id === template.id ? 'ring-2 ring-blue-500 shadow-md' : ''
                }`}
                onClick={() => onSelectTemplate(template)}
              >
                <div className="relative aspect-[3/4] bg-gray-100">
                  {template.preview_url ? (
                    <img 
                      src={template.preview_url} 
                      alt={template.name}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                      {template.name} Preview
                    </div>
                  )}
                  
                  {template.is_premium && (
                    <div className="absolute top-3 right-3 bg-amber-500 text-white text-xs px-3 py-1 rounded-full font-medium">
                      PREMIUM
                    </div>
                  )}
                </div>
                
                <div className="p-4">
                  <h3 className="font-medium text-base">{template.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {template.category.charAt(0).toUpperCase() + template.category.slice(1)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}