import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Save } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Skill } from '@/types/resume';
import { createClient } from '@/utils/supabase/client';
import { toast } from "sonner";

interface SkillsTabProps {
  skills: Skill[];
  onAdd: () => void;
  onRemove: (id: string) => void;
  resumeId?: string | null;
  userId?: string | null;
}

export default function SkillsTab({ 
  skills, 
  onAdd, 
  onRemove,
  resumeId,
  userId
}: SkillsTabProps) {
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveSkills = async () => {
    if (!userId) {
      toast.error("You must be logged in to save skills");
      return;
    }

    if (!resumeId) {
      toast.error("Please save your personal information first");
      return;
    }

    try {
      setIsSaving(true);
      const supabase = createClient();

      // Update the skills field in the resume_info table
      const { error } = await supabase
        .from('resume_info')
        .update({ 
          skills: skills,
          updated_at: new Date().toISOString()
        })
        .eq('id', resumeId)
        .eq('user_id', userId);

      if (error) {
        console.error("Error saving skills:", error);
        throw error;
      }

      toast.success("Skills saved successfully");
    } catch (error: any) {
      console.error('Error saving skills:', error.message || error);
      toast.error("Failed to save skills");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Skills</h3>
        <div className="flex gap-2">
          <Button onClick={onAdd} className="flex items-center gap-2">
            <Plus size={16} />
            Add Skill
          </Button>
          
        </div>
      </div>
      
      {skills.length === 0 ? (
        <div className="text-center py-12 border border-dashed rounded-lg">
          <p className="text-gray-500">No skills added yet</p>
          <Button 
            variant="outline" 
            onClick={onAdd} 
            className="mt-4"
          >
            Add Your Skills
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {skills.map((skill) => (
            <Card key={skill.id} className="relative">
              <Button 
                variant="ghost" 
                size="icon" 
                className="absolute top-2 right-2 text-gray-500 hover:text-red-500"
                onClick={() => onRemove(skill.id)}
              >
                <Trash2 size={16} />
              </Button>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">{skill.name}</h4>
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <div 
                        key={i} 
                        className={`w-2 h-2 rounded-full mx-0.5 ${
                          i < (skill.level ? parseInt(skill.level) : 0) ? 'bg-blue-500' : 'bg-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}