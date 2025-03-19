import React from 'react';
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { ResumeSection } from '@/types/resume';

interface EducationTabProps {
  education: ResumeSection[];
  onAdd: () => void;
  onRemove: (id: string) => void;
}

export default function EducationTab({ education, onAdd, onRemove }: EducationTabProps) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Education</h3>
        <Button onClick={onAdd} className="flex items-center gap-2">
          <Plus size={16} />
          Add Education
        </Button>
      </div>
      
      {education.length === 0 ? (
        <div className="text-center py-12 border border-dashed rounded-lg">
          <p className="text-gray-500">No education added yet</p>
          <Button 
            variant="outline" 
            onClick={onAdd} 
            className="mt-4"
          >
            Add Your Education
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {education.map((edu) => (
            <Card key={edu.id} className="relative">
              <Button 
                variant="ghost" 
                size="icon" 
                className="absolute top-2 right-2 text-gray-500 hover:text-red-500"
                onClick={() => onRemove(edu.id)}
              >
                <Trash2 size={16} />
              </Button>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-2">
                  <div>
                    <h4 className="font-semibold text-lg">{edu.title}</h4>
                    <p className="text-gray-600">{edu.company}</p>
                    <p className="text-gray-500 text-sm">{edu.location}</p>
                  </div>
                  <div className="text-gray-500 text-sm">
                    {edu.startDate} - {edu.endDate || 'Present'}
                  </div>
                </div>
                
                <p className="mt-3 text-gray-700">{edu.description}</p>
                
                {edu.bullets.length > 0 && edu.bullets[0] !== "" && (
                  <ul className="mt-3 list-disc list-inside space-y-1">
                    {edu.bullets.map((bullet, index) => (
                      <li key={index} className="text-gray-700">{bullet}</li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}