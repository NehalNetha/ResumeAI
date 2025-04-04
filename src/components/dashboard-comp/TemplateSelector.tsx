import React from 'react';
import { LayoutTemplate } from 'lucide-react';
import { Template } from '@/types/resume';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface TemplateSelectorProps {
  templates: Template[];
  selectedTemplate: Template | null;
  onSelectTemplate: (template: Template) => void;
  visible: boolean;
}

export default function TemplateSelector({
  templates,
  selectedTemplate,
  onSelectTemplate,
  visible
}: TemplateSelectorProps) {
  if (!visible) return null;

  return (
    <div className="flex-1 h-full overflow-hidden">
      {templates.length === 0 ? (
        <div className="text-center py-8 text-gray-500 h-full flex items-center justify-center">
          <div>
            <LayoutTemplate className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p>No templates available</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2 h-full overflow-y-auto pr-2 pb-4">
          {templates.map((template) => (
            <div 
              key={template.id}
              className={`border rounded p-3 cursor-pointer flex items-center ${
                selectedTemplate?.id === template.id 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => onSelectTemplate(template)}
            >
              <LayoutTemplate className="h-5 w-5 mr-3 text-blue-500 flex-shrink-0" />
              <div className="flex-1">
                <div className="font-medium">{template.name}</div>
                <div className="text-xs text-gray-500">
                  {template.category} • {template.is_premium ? 'Premium' : 'Free'}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}