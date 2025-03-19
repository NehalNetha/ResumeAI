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

export interface PersonalInfo {
  name: string;
  title: string;
  email: string;
  phone: string;
  location: string;
  summary: string;
}

export interface Link {
  id: string;
  title: string;
  url: string;
}

export interface Skill {
  id: string;
  name: string;
  level: number; // 1-5
}