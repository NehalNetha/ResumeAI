export interface ResumeSection {
  id: string;
  title: string;
  company?: string;
  location?: string;
  startDate: string;
  endDate: string;
  description: string;
  bullets: string[];
  projectUrl?: string;
}

export interface Resume {
  id: number | string;
  name: string;
  date: string;
  size: string;
  path?: string;
  url?: string;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  category: 'professional' | 'creative' | 'academic' | 'simple';
  preview_url: string;
  created_at: string;
  is_premium: boolean;
  latex_content?: string;
}

export interface PersonalInfo {
  name: string;
  title: string;
  email: string;
  phone: string;
  location: string;
  summary?: string; // Make summary optional
}

export interface WorkExperience {
  id: string;
  title: string;
  company: string;
  location: string;
  startDate: string;
  endDate: string;
  description: string;
  current?: boolean;
}

export interface Education {
  id: string;
  title: string;
  company: string;
  location: string;
  startDate: string;
  endDate: string;
  description: string;
  current?: boolean;
}

export interface Project {
  id: string;
  title: string;
  link?: string;
  startDate?: string;
  endDate?: string;
  description: string;
  current?: boolean;
}

export interface Skill {
  id: string;
  name: string;
  level?: string; // Change from number to string
}

export interface Link {
  id: string;
  name: string; // Required field
  url: string;
  title?: string; // Make title optional
}

export interface ResumeInfo {
  id: string;
  user_id: string;
  personal_info: PersonalInfo;
  work_experience: WorkExperience[];
  education: Education[];
  projects: Project[];
  skills: Skill[];
  links: Link[];
  template_id?: string;
  generated_latex?: string;
  created_at: string;
  updated_at: string;
}

