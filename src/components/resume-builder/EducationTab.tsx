import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Save } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { ResumeSection } from '@/types/resume';
import { createClient } from '@/utils/supabase/client';
import { toast } from "sonner";

interface EducationTabProps {
  education: ResumeSection[];
  onAdd: () => void;
  onRemove: (id: string) => void;
  resumeId?: string | null;
  userId?: string | null;
}

export default function EducationTab({ 
  education, 
  onAdd, 
  onRemove,
  resumeId,
  userId
}: EducationTabProps) {
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveEducation = async () => {
    if (!userId) {
      toast.error("You must be logged in to save education");
      return;
    }

    if (!resumeId) {
      toast.error("Please save your personal information first");
      return;
    }

    try {
      setIsSaving(true);
      const supabase = createClient();

      // Update the education field in the resume_info table
      const { error } = await supabase
        .from('resume_info')
        .update({ 
          education: education,
          updated_at: new Date().toISOString()
        })
        .eq('id', resumeId)
        .eq('user_id', userId);

      if (error) {
        console.error("Error saving education:", error);
        throw error;
      }

      toast.success("Education saved successfully");
    } catch (error: any) {
      console.error('Error saving education:', error.message || error);
      toast.error("Failed to save education");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Education</h3>
        <div className="flex gap-2">
          <Button onClick={onAdd} className="flex items-center gap-2">
            <Plus size={16} />
            Add Education
          </Button>
         
        </div>
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