import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Save } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { ResumeSection } from '@/types/resume';
import { createClient } from '@/utils/supabase/client';
import { toast } from "sonner";

interface ProjectsTabProps {
  projects: ResumeSection[];
  onAdd: () => void;
  onRemove: (id: string) => void;
  resumeId?: string | null;
  userId?: string | null;
}

export default function ProjectsTab({ 
  projects, 
  onAdd, 
  onRemove,
  resumeId,
  userId
}: ProjectsTabProps) {
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveProjects = async () => {
    if (!userId) {
      toast.error("You must be logged in to save projects");
      return;
    }

    if (!resumeId) {
      toast.error("Please save your personal information first");
      return;
    }

    try {
      setIsSaving(true);
      const supabase = createClient();

      // Update the projects field in the resume_info table
      const { error } = await supabase
        .from('resume_info')
        .update({ 
          projects: projects,
          updated_at: new Date().toISOString()
        })
        .eq('id', resumeId)
        .eq('user_id', userId);

      if (error) {
        console.error("Error saving projects:", error);
        throw error;
      }

      toast.success("Projects saved successfully");
    } catch (error: any) {
      console.error('Error saving projects:', error.message || error);
      toast.error("Failed to save projects");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Projects</h3>
        <div className="flex gap-2">
          <Button onClick={onAdd} className="flex items-center gap-2">
            <Plus size={16} />
            Add Project
          </Button>
        
        </div>
      </div>
      
      {projects.length === 0 ? (
        <div className="text-center py-12 border border-dashed rounded-lg">
          <p className="text-gray-500">No projects added yet</p>
          <Button 
            variant="outline" 
            onClick={onAdd} 
            className="mt-4"
          >
            Add Your First Project
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {projects.map((project) => (
            <Card key={project.id} className="relative">
              <Button 
                variant="ghost" 
                size="icon" 
                className="absolute top-2 right-2 text-gray-500 hover:text-red-500"
                onClick={() => onRemove(project.id)}
              >
                <Trash2 size={16} />
              </Button>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-2">
                  <div>
                    <h4 className="font-semibold text-lg">{project.title}</h4>
                    {project.company && <p className="text-gray-600">{project.company}</p>}
                  </div>
                  <div className="text-gray-500 text-sm">
                    {project.startDate && project.endDate ? 
                      `${project.startDate} - ${project.endDate || 'Present'}` : ''}
                  </div>
                </div>
                
                <p className="mt-3 text-gray-700">{project.description}</p>
                
                {project.projectUrl && (
                  <a 
                    href={project.projectUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="mt-2 text-blue-500 hover:underline text-sm inline-block"
                  >
                    View Project
                  </a>
                )}
                
                {project.bullets.length > 0 && project.bullets[0] !== "" && (
                  <ul className="mt-3 list-disc list-inside space-y-1">
                    {project.bullets.map((bullet, index) => (
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