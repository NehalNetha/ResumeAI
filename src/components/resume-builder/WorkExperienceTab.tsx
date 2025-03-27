import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Save } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { ResumeSection } from '@/types/resume';
import { createClient } from '@/utils/supabase/client';
import { toast } from "sonner";

interface WorkExperienceTabProps {
  workExperience: ResumeSection[];
  onAdd: () => void;
  onRemove: (id: string) => void;
  resumeId?: string | null;
  userId?: string | null;
}

export default function WorkExperienceTab({ 
  workExperience, 
  onAdd, 
  onRemove, 
  resumeId,
  userId 
}: WorkExperienceTabProps) {
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveWorkExperience = async () => {
    if (!userId) {
      toast.error("You must be logged in to save work experience");
      return;
    }

    if (!resumeId) {
      toast.error("Please save your personal information first");
      return;
    }

    try {
      setIsSaving(true);
      const supabase = createClient();

      // Update the work_experience field in the resume_info table
      const { error } = await supabase
        .from('resume_info')
        .update({ 
          work_experience: workExperience,
          updated_at: new Date().toISOString()
        })
        .eq('id', resumeId)
        .eq('user_id', userId);

      if (error) {
        console.error("Error saving work experience:", error);
        throw error;
      }

      toast.success("Work experience saved successfully");
    } catch (error: any) {
      console.error('Error saving work experience:', error.message || error);
      toast.error("Failed to save work experience");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Work Experience</h3>
        <div className="flex gap-2">
          <Button onClick={onAdd} className="flex items-center gap-2">
            <Plus size={16} />
            Add Experience
          </Button>
         
        </div>
      </div>
      
      {workExperience.length === 0 ? (
        <div className="text-center py-12 border border-dashed rounded-lg">
          <p className="text-gray-500">No work experience added yet</p>
          <Button 
            variant="outline" 
            onClick={onAdd} 
            className="mt-4"
          >
            Add Your First Work Experience
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {workExperience.map((job) => (
            <Card key={job.id} className="relative">
              <Button 
                variant="ghost" 
                size="icon" 
                className="absolute top-2 right-2 text-gray-500 hover:text-red-500"
                onClick={() => onRemove(job.id)}
              >
                <Trash2 size={16} />
              </Button>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-2">
                  <div>
                    <h4 className="font-semibold text-lg">{job.title}</h4>
                    <p className="text-gray-600">{job.company}</p>
                    <p className="text-gray-500 text-sm">{job.location}</p>
                  </div>
                  <div className="text-gray-500 text-sm">
                    {job.startDate} - {job.endDate || 'Present'}
                  </div>
                </div>
                
                <p className="mt-3 text-gray-700">{job.description}</p>
                
                {job.bullets.length > 0 && job.bullets[0] !== "" && (
                  <ul className="mt-3 list-disc list-inside space-y-1">
                    {job.bullets.map((bullet, index) => (
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