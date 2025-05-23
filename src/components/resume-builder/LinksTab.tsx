import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Save } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Link } from '@/types/resume';
import { createClient } from '@/utils/supabase/client';
import { toast } from "sonner";

interface LinksTabProps {
  links: Link[];
  onAdd: () => void;
  onRemove: (id: string) => void;
  resumeId?: string | null;
  userId?: string | null;
}

export default function LinksTab({ 
  links, 
  onAdd, 
  onRemove,
  resumeId,
  userId
}: LinksTabProps) {
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveLinks = async () => {
    if (!userId) {
      toast.error("You must be logged in to save links");
      return;
    }

    if (!resumeId) {
      toast.error("Please save your personal information first");
      return;
    }

    try {
      setIsSaving(true);
      const supabase = createClient();

      // Update the links field in the resume_info table
      const { error } = await supabase
        .from('resume_info')
        .update({ 
          links: links,
          updated_at: new Date().toISOString()
        })
        .eq('id', resumeId)
        .eq('user_id', userId);

      if (error) {
        console.error("Error saving links:", error);
        throw error;
      }

      toast.success("Links saved successfully");
    } catch (error: any) {
      console.error('Error saving links:', error.message || error);
      toast.error("Failed to save links");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Links</h3>
        <div className="flex gap-2">
          <Button onClick={onAdd} className="flex items-center gap-2">
            <Plus size={16} />
            Add Link
          </Button>
         
        </div>
      </div>
      
      {links.length === 0 ? (
        <div className="text-center py-12 border border-dashed rounded-lg">
          <p className="text-gray-500">No links added yet</p>
          <Button 
            variant="outline" 
            onClick={onAdd} 
            className="mt-4"
          >
            Add Your First Link
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {links.map((link) => (
            <Card key={link.id} className="relative">
              <Button 
                variant="ghost" 
                size="icon" 
                className="absolute top-2 right-2 text-gray-500 hover:text-red-500"
                onClick={() => onRemove(link.id)}
              >
                <Trash2 size={16} />
              </Button>
              <CardContent className="p-4">
                <h4 className="font-medium">{link.title}</h4>
                <a 
                  href={link.url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-blue-500 hover:underline text-sm truncate block"
                >
                  {link.url}
                </a>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}