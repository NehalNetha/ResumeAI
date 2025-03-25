import React, { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { PersonalInfo } from '@/types/resume';
import { Button } from "@/components/ui/button";
import { Save } from 'lucide-react';
import { toast } from "sonner";
import { createClient } from '@/utils/supabase/client';

interface PersonalInfoTabProps {
  personalInfo: PersonalInfo;
  onChange: (info: PersonalInfo) => void;
  resumeId?: string | null;
}

export default function PersonalInfoTab({ personalInfo, onChange, resumeId }: PersonalInfoTabProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // If resumeId changes and is not null, fetch the personal info
  useEffect(() => {
    if (resumeId) {
      fetchPersonalInfo(resumeId);
    }
  }, [resumeId]);
  
  const fetchPersonalInfo = async (id: string) => {
    try {
      setIsLoading(true);
      const supabase = createClient();
      
      const { data, error } = await supabase
        .from('resume_info')
        .select('personal_info')
        .eq('id', id)
        .single();
        
      if (error) {
        throw error;
      }
      
      if (data && data.personal_info) {
        // Update the personal info in the parent component
        onChange(data.personal_info);
      }
    } catch (error) {
      console.error('Error fetching personal info:', error);
      toast.error("Failed to load personal information");
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    onChange({
      ...personalInfo,
      [name]: value
    });
  };

  const handleSave = async () => {
    // Validate required fields
    if (!personalInfo.name || !personalInfo.email) {
      toast.error("Name and email are required");
      return;
    }
    
    try {
      setIsSaving(true);
      
      // Create a new Supabase client instance
      const supabase = createClient();
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("You must be logged in to save your information");
        return;
      }
      
      if (resumeId) {
        // Update existing resume's personal info
        const { error } = await supabase
          .from('resume_info')
          .update({ 
            personal_info: personalInfo,
            updated_at: new Date().toISOString()
          })
          .eq('id', resumeId)
          .eq('user_id', user.id);
          
        if (error) {
          console.error("Supabase update error:", error);
          throw error;
        }
      } else {
        // Create a new resume with just personal info
        const { error, data } = await supabase
          .from('resume_info')
          .insert({
            user_id: user.id,
            personal_info: personalInfo,
            work_experience: [],
            education: [],
            projects: [],
            skills: [],
            links: []
          })
          .select();
          
        if (error) {
          console.error("Supabase insert error:", error);
          throw error;
        }
        
        console.log("New resume created:", data);
      }
      
      toast.success("Personal information saved to database");
    } catch (error: any) {
      console.error('Error saving personal info:', error.message || error);
      toast.error("Failed to save personal information");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label htmlFor="name">Full Name</Label>
              <Input 
                id="name" 
                name="name" 
                placeholder="John Doe" 
                value={personalInfo.name}
                onChange={handleChange}
              />
            </div>
            
            <div className="space-y-3">
              <Label htmlFor="title">Professional Title</Label>
              <Input 
                id="title" 
                name="title" 
                placeholder="Software Engineer" 
                value={personalInfo.title}
                onChange={handleChange}
              />
            </div>
            
            <div className="space-y-3">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                name="email" 
                type="email" 
                placeholder="john.doe@example.com" 
                value={personalInfo.email}
                onChange={handleChange}
              />
            </div>
            
            <div className="space-y-3">
              <Label htmlFor="phone">Phone</Label>
              <Input 
                id="phone" 
                name="phone" 
                placeholder="(123) 456-7890" 
                value={personalInfo.phone}
                onChange={handleChange}
              />
            </div>
            
            <div className="space-y-3">
              <Label htmlFor="location">Location</Label>
              <Input 
                id="location" 
                name="location" 
                placeholder="San Francisco, CA" 
                value={personalInfo.location}
                onChange={handleChange}
              />
            </div>
          </div>
          
          <div className="space-y-3 mt-6">
            <Label htmlFor="summary">Professional Summary</Label>
            <Textarea 
              id="summary" 
              name="summary" 
              placeholder="Write a brief summary of your professional background and key strengths..." 
              rows={5}
              value={personalInfo.summary}
              onChange={handleChange}
            />
          </div>

          <div className="flex justify-end mt-6">
            <Button 
              onClick={handleSave}
              className="flex items-center gap-2"
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}