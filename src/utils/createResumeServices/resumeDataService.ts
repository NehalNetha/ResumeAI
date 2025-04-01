import { createClient } from '@/utils/supabase/client';
import { PersonalInfo, ResumeSection, Skill, Link } from '@/types/resume';
import { toast } from "sonner";

const supabase = createClient();

export const fetchResumeDataUtil = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('resume_info')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(1);
      
    if (error) throw error;
    
    if (data && data.length > 0) {
      toast.success("Resume data loaded successfully");
      return data[0];
    }
    return null;
  } catch (error) {
    console.error('Error fetching resume data:', error);
    toast.error("Failed to load resume data");
    throw error;
  }
};

export const savePersonalInfo = async (
  userId: string, 
  resumeId: string | null, 
  personalInfo: PersonalInfo
) => {
  try {
    if (!userId) {
      toast.error("You must be logged in to save personal information");
      return null;
    }
    
    if (!personalInfo.name || !personalInfo.email) {
      toast.error("Name and email are required");
      return null;
    }
    
    const updateData = {
      personal_info: personalInfo,
      updated_at: new Date().toISOString()
    };
    
    let response;
    
    if (resumeId) {
      response = await supabase
        .from('resume_info')
        .update(updateData)
        .eq('id', resumeId)
        .eq('user_id', userId);
    } else {
      response = await supabase
        .from('resume_info')
        .insert({
          user_id: userId,
          personal_info: personalInfo,
          updated_at: new Date().toISOString()
        })
        .select();
    }
    
    if (response.error) throw response.error;
    
    if (response.data && response.data[0]) {
      toast.success("Personal information saved successfully");
      return response.data[0].id;
    }
    
    return resumeId;
  } catch (error) {
    console.error('Error saving personal information:', error);
    toast.error("Failed to save personal information");
    return null;
  }
};

export const saveResumeSection = async (
  userId: string,
  resumeId: string | null,
  sectionType: "work_experience" | "education" | "projects" | "skills" | "links",
  sectionData: ResumeSection[] | Skill[] | Link[]
) => {
  try {
    if (!userId) {
      toast.error("You must be logged in to save resume data");
      return null;
    }
    
    const updateData = {
      [sectionType]: sectionData,
      updated_at: new Date().toISOString()
    };
    
    let response;
    
    if (resumeId) {
      response = await supabase
        .from('resume_info')
        .update(updateData)
        .eq('id', resumeId)
        .eq('user_id', userId);
    } else {
      response = await supabase
        .from('resume_info')
        .insert({
          user_id: userId,
          [sectionType]: sectionData,
          updated_at: new Date().toISOString()
        })
        .select();
    }
    
    if (response.error) throw response.error;
    
    if (response.data && response.data[0]) {
      return response.data[0].id;
    }
    
    return resumeId;
  } catch (error) {
    console.error(`Error saving ${sectionType}:`, error);
    toast.error(`Failed to save ${sectionType.replace('_', ' ')}`);
    return null;
  }
};

export const saveFullResume = async (
  userId: string,
  resumeId: string | null,
  resumeData: {
    template_id: string | null;
    personal_info: PersonalInfo;
    work_experience: ResumeSection[];
    education: ResumeSection[];
    projects: ResumeSection[];
    skills: Skill[];
    links: Link[];
    generated_latex: string | null;
  }
) => {
  try {
    if (!userId) {
      toast.error("You must be logged in to save a resume");
      return null;
    }
    
    if (!resumeData.personal_info.name || !resumeData.personal_info.email) {
      toast.error("Name and email are required");
      return null;
    }
    
    const fullResumeData = {
      user_id: userId,
      ...resumeData,
      updated_at: new Date().toISOString()
    };
    
    let response;
    
    if (resumeId) {
      response = await supabase
        .from('resume_info')
        .update(fullResumeData)
        .eq('id', resumeId);
    } else {
      response = await supabase
        .from('resume_info')
        .insert(fullResumeData)
        .select();
    }
    
    if (response.error) throw response.error;
    
    if (response.data && response.data[0]) {
      toast.success(resumeId ? "Resume updated successfully!" : "Resume created successfully!");
      return response.data[0].id;
    }
    
    return resumeId;
  } catch (error) {
    console.error('Error saving resume:', error);
    toast.error("Failed to save resume");
    return null;
  }
};