"use client"
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Eye, Save, LayoutTemplate } from 'lucide-react';
import DashboardSidebar from '@/components/DashboardSidebar';
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

// Import our new components
import PersonalInfoTab from '@/components/resume-builder/PersonalInfoTab';
import WorkExperienceTab from '@/components/resume-builder/WorkExperienceTab';
import EducationTab from '@/components/resume-builder/EducationTab';
import ProjectsTab from '@/components/resume-builder/ProjectsTab';
import SkillsTab from '@/components/resume-builder/SkillsTab';
import LinksTab from '@/components/resume-builder/LinksTab';
import AddSectionDialog from '@/components/resume-builder/AddSectionDialog';

// Import types
import { PersonalInfo, ResumeSection, Skill, Link } from '@/types/resume';

// Template interface
interface Template {
  id: string;
  name: string;
  description: string;
  category: 'professional' | 'creative' | 'academic' | 'simple';
  latex_content: string;
  preview_url: string;
  created_at: string;
  is_premium: boolean;
}

export default function CreateResume() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("personal");
  const [personalInfo, setPersonalInfo] = useState<PersonalInfo>({
    name: "",
    title: "",
    email: "",
    phone: "",
    location: "",
    summary: ""
  });
  
  // Template related states
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [resumeId, setResumeId] = useState<string | null>(null);
  
  const supabase = createClient();
  
  // Fetch templates and user info on component mount
  useEffect(() => {
    fetchTemplates();
    fetchUserInfo();
  }, []);
  
  // Add a new useEffect to fetch resume data when userId is available
  useEffect(() => {
    if (userId) {
      fetchResumeData();
    }
  }, [userId]);
  
  const fetchUserInfo = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }
    } catch (error) {
      console.error('Error fetching user info:', error);
    }
  };
  
  // Add a new function to fetch resume data
  const fetchResumeData = async () => {
    try {
      setIsLoading(true);
      
      // Get the most recent resume for this user
      const { data, error } = await supabase
        .from('resume_info')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .limit(1);
        
      if (error) {
        throw error;
      }
      
      if (data && data.length > 0) {
        const resume = data[0];
        setResumeId(resume.id);
        
        // Set all the resume data
        if (resume.personal_info) setPersonalInfo(resume.personal_info);
        if (resume.work_experience) setWorkExperience(resume.work_experience);
        if (resume.education) setEducation(resume.education);
        if (resume.projects) setProjects(resume.projects);
        if (resume.skills) setSkills(resume.skills);
        if (resume.links) setLinks(resume.links);
        
        // Set the selected template if it exists
        if (resume.template_id) {
          const template = templates.find(t => t.id === resume.template_id);
          if (template) {
            setSelectedTemplate(template);
          }
        }
        
        toast.success("Resume data loaded successfully");
      }
    } catch (error) {
      console.error('Error fetching resume data:', error);
      toast.error("Failed to load resume data");
    } finally {
      setIsLoading(false);
    }
  };
  
  const fetchTemplates = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('templates')
        .select('*');
        
      if (error) {
        throw error;
      }
      
      if (data) {
        setTemplates(data);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast.error("Failed to load templates");
    } finally {
      setIsLoading(false);
    }
  };
  
  const [workExperience, setWorkExperience] = useState<ResumeSection[]>([]);
  const [education, setEducation] = useState<ResumeSection[]>([]);
  const [projects, setProjects] = useState<ResumeSection[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [links, setLinks] = useState<Link[]>([]);
  
  // For new section entry
  const [newSection, setNewSection] = useState<ResumeSection>({
    id: "",
    title: "",
    company: "",
    location: "",
    startDate: "",
    endDate: "",
    description: "",
    bullets: [""]
  });
  
  // For new skill entry
  const [newSkill, setNewSkill] = useState<Skill>({
    id: "",
    name: "",
    level: 3
  });
  
  // For new link entry
  const [newLink, setNewLink] = useState<Link>({
    id: "",
    title: "",
    url: ""
  });
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<"work" | "education" | "project" | "skill" | "link">("work");
  
  const handlePersonalInfoChange = (updatedInfo: PersonalInfo) => {
    setPersonalInfo(updatedInfo);
  };
  
  const openDialog = (type: "work" | "education" | "project" | "skill" | "link") => {
    setDialogType(type);
    setIsDialogOpen(true);
    
    // Reset form based on type
    if (type === "work" || type === "education" || type === "project") {
      setNewSection({
        id: Date.now().toString(),
        title: "",
        company: "",
        location: "",
        startDate: "",
        endDate: "",
        description: "",
        bullets: [""]
      });
    } else if (type === "skill") {
      setNewSkill({
        id: Date.now().toString(),
        name: "",
        level: 3
      });
    } else if (type === "link") {
      setNewLink({
        id: Date.now().toString(),
        title: "",
        url: ""
      });
    }
  };
  
  const handleAddSection = async () => {
    if (dialogType === "work") {
      if (!newSection.title || !newSection.company) {
        toast("Please fill in required fields");
        return;
      }
      setWorkExperience(prev => [...prev, newSection]);
      
      // Save work experience to database after adding
      if (userId && resumeId) {
        try {
          const updatedWorkExperience = [...workExperience, newSection];
          const supabase = createClient();
          
          const { error } = await supabase
            .from('resume_info')
            .update({ 
              work_experience: updatedWorkExperience,
              updated_at: new Date().toISOString()
            })
            .eq('id', resumeId)
            .eq('user_id', userId);
            
          if (error) {
            console.error("Error saving work experience:", error);
            toast.error("Failed to save work experience to database");
          } else {
            toast.success("Work experience saved to database");
          }
        } catch (error) {
          console.error("Error saving work experience:", error);
          toast.error("Failed to save work experience to database");
        }
      }
    } else if (dialogType === "education") {
      if (!newSection.title || !newSection.company) {
        toast("Please fill in required fields");
        return;
      }
      setEducation(prev => [...prev, newSection]);
      
      // Save education to database after adding
      if (userId && resumeId) {
        try {
          const updatedEducation = [...education, newSection];
          const supabase = createClient();
          
          const { error } = await supabase
            .from('resume_info')
            .update({ 
              education: updatedEducation,
              updated_at: new Date().toISOString()
            })
            .eq('id', resumeId)
            .eq('user_id', userId);
            
          if (error) {
            console.error("Error saving education:", error);
            toast.error("Failed to save education to database");
          } else {
            toast.success("Education saved to database");
          }
        } catch (error) {
          console.error("Error saving education:", error);
          toast.error("Failed to save education to database");
        }
      }
    } else if (dialogType === "project") {
      if (!newSection.title) {
        toast("Please fill in required fields");
        return;
      }
      setProjects(prev => [...prev, newSection]);
      
      // Save projects to database after adding
      if (userId && resumeId) {
        try {
          const updatedProjects = [...projects, newSection];
          const supabase = createClient();
          
          const { error } = await supabase
            .from('resume_info')
            .update({ 
              projects: updatedProjects,
              updated_at: new Date().toISOString()
            })
            .eq('id', resumeId)
            .eq('user_id', userId);
            
          if (error) {
            console.error("Error saving project:", error);
            toast.error("Failed to save project to database");
          } else {
            toast.success("Project saved to database");
          }
        } catch (error) {
          console.error("Error saving project:", error);
          toast.error("Failed to save project to database");
        }
      }
    }  else if (dialogType === "skill") {
      if (!newSkill.name) {
        toast("Please enter a skill name");
        return;
      }
      setSkills(prev => [...prev, newSkill]);
      
      // Save skills to database after adding
      if (userId && resumeId) {
        try {
          const updatedSkills = [...skills, newSkill];
          const supabase = createClient();
          
          const { error } = await supabase
            .from('resume_info')
            .update({ 
              skills: updatedSkills,
              updated_at: new Date().toISOString()
            })
            .eq('id', resumeId)
            .eq('user_id', userId);
            
          if (error) {
            console.error("Error saving skill:", error);
            toast.error("Failed to save skill to database");
          } else {
            toast.success("Skill saved to database");
          }
        } catch (error) {
          console.error("Error saving skill:", error);
          toast.error("Failed to save skill to database");
        }
      }
    }  else if (dialogType === "link") {
      if (!newLink.title || !newLink.url) {
        toast("Please fill in all fields");
        return;
      }
      setLinks(prev => [...prev, newLink]);
      
      // Save links to database after adding
      if (userId && resumeId) {
        try {
          const updatedLinks = [...links, newLink];
          const supabase = createClient();
          
          const { error } = await supabase
            .from('resume_info')
            .update({ 
              links: updatedLinks,
              updated_at: new Date().toISOString()
            })
            .eq('id', resumeId)
            .eq('user_id', userId);
            
          if (error) {
            console.error("Error saving link:", error);
            toast.error("Failed to save link to database");
          } else {
            toast.success("Link saved to database");
          }
        } catch (error) {
          console.error("Error saving link:", error);
          toast.error("Failed to save link to database");
        }
      }
    }
  
    
    setIsDialogOpen(false);
    toast(`Added new ${dialogType} entry`);
  };
  
  const removeItem = async (type: string, id: string) => {
    if (type === "work") {
      const updatedWorkExperience = workExperience.filter(item => item.id !== id);
      setWorkExperience(updatedWorkExperience);
      
      // Save updated work experience to database after removing
      if (userId && resumeId) {
        try {
          const supabase = createClient();
          
          const { error } = await supabase
            .from('resume_info')
            .update({ 
              work_experience: updatedWorkExperience,
              updated_at: new Date().toISOString()
            })
            .eq('id', resumeId)
            .eq('user_id', userId);
            
          if (error) {
            console.error("Error updating work experience:", error);
            toast.error("Failed to update database");
          }
        } catch (error) {
          console.error("Error updating work experience:", error);
          toast.error("Failed to update database");
        }
      }
    } else if (type === "education") {
      const updatedEducation = education.filter(item => item.id !== id);
      setEducation(updatedEducation);
      
      // Save updated education to database after removing
      if (userId && resumeId) {
        try {
          const supabase = createClient();
          
          const { error } = await supabase
            .from('resume_info')
            .update({ 
              education: updatedEducation,
              updated_at: new Date().toISOString()
            })
            .eq('id', resumeId)
            .eq('user_id', userId);
            
          if (error) {
            console.error("Error updating education:", error);
            toast.error("Failed to update database");
          }
        } catch (error) {
          console.error("Error updating education:", error);
          toast.error("Failed to update database");
        }
      }
    } else if (type === "project") {
      const updatedProjects = projects.filter(item => item.id !== id);
      setProjects(updatedProjects);
      
      // Save updated projects to database after removing
      if (userId && resumeId) {
        try {
          const supabase = createClient();
          
          const { error } = await supabase
            .from('resume_info')
            .update({ 
              projects: updatedProjects,
              updated_at: new Date().toISOString()
            })
            .eq('id', resumeId)
            .eq('user_id', userId);
            
          if (error) {
            console.error("Error updating projects:", error);
            toast.error("Failed to update database");
          }
        } catch (error) {
          console.error("Error updating projects:", error);
          toast.error("Failed to update database");
        }
      }
    } else if (type === "skill") {
      const updatedSkills = skills.filter(item => item.id !== id);
      setSkills(updatedSkills);
      
      // Save updated skills to database after removing
      if (userId && resumeId) {
        try {
          const supabase = createClient();
          
          const { error } = await supabase
            .from('resume_info')
            .update({ 
              skills: updatedSkills,
              updated_at: new Date().toISOString()
            })
            .eq('id', resumeId)
            .eq('user_id', userId);
            
          if (error) {
            console.error("Error updating skills:", error);
            toast.error("Failed to update database");
          }
        } catch (error) {
          console.error("Error updating skills:", error);
          toast.error("Failed to update database");
        }
      }
    } else if (type === "link") {
      const updatedLinks = links.filter(item => item.id !== id);
      setLinks(updatedLinks);
      
      // Save updated links to database after removing
      if (userId && resumeId) {
        try {
          const supabase = createClient();
          
          const { error } = await supabase
            .from('resume_info')
            .update({ 
              links: updatedLinks,
              updated_at: new Date().toISOString()
            })
            .eq('id', resumeId)
            .eq('user_id', userId);
            
          if (error) {
            console.error("Error updating links:", error);
            toast.error("Failed to update database");
          }
        } catch (error) {
          console.error("Error updating links:", error);
          toast.error("Failed to update database");
        }
      }
    }
  
    toast(`Removed ${type} entry`);
  };
  
  const handleSaveResume = async () => {
    if (!userId) {
      toast.error("You must be logged in to save a resume");
      return;
    }
    
    if (!personalInfo.name || !personalInfo.email) {
      toast.error("Name and email are required");
      setActiveTab("personal");
      return;
    }
    
    try {
      setIsSaving(true);
      
      const resumeData = {
        user_id: userId,
        template_id: selectedTemplate?.id || null,
        personal_info: personalInfo,
        work_experience: workExperience,
        education: education,
        projects: projects,
        skills: skills,
        links: links,
        updated_at: new Date().toISOString()
      };
      
      let response;
      
      if (resumeId) {
        // Update existing resume
        response = await supabase
          .from('resume_info')
          .update(resumeData)
          .eq('id', resumeId);
      } else {
        // Create new resume
        response = await supabase
          .from('resume_info')
          .insert(resumeData)
          .select();
      }
      
      if (response.error) {
        throw response.error;
      }
      
      if (response.data && response.data[0]) {
        setResumeId(response.data[0].id);
      }
      
      toast.success(resumeId ? "Resume updated successfully!" : "Resume created successfully!");
      
      // Optionally redirect to the resumes list
      // router.push('/dashboard/resumes');
      
    } catch (error) {
      console.error('Error saving resume:', error);
      toast.error("Failed to save resume");
    } finally {
      setIsSaving(false);
    }
  };
  
  const handlePreviewResume = () => {
    toast.info("Preview functionality coming soon!");
  };
  
  const handleNextTab = () => {
    const tabs = ["personal", "work", "education", "projects", "skills", "links"];
    const currentIndex = tabs.indexOf(activeTab);
    if (currentIndex < tabs.length - 1) {
      setActiveTab(tabs[currentIndex + 1]);
    }
  };
  
  const handlePrevTab = () => {
    const tabs = ["personal", "work", "education", "projects", "skills", "links"];
    const currentIndex = tabs.indexOf(activeTab);
    if (currentIndex > 0) {
      setActiveTab(tabs[currentIndex - 1]);
    }
  };
  
  // Template selection handler
  const handleSelectTemplate = (template: Template) => {
    setSelectedTemplate(template);
    setIsTemplateDialogOpen(false);
    toast.success(`Template "${template.name}" selected`);
  };
  
  return (
    <div className="flex min-h-screen bg-gray-50">
      <DashboardSidebar />
      <main className="flex-1 p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Create Your Resume</h1>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => setIsTemplateDialogOpen(true)} 
              className="flex items-center gap-2"
            >
              <LayoutTemplate size={16} />
              {selectedTemplate ? "Change Template" : "Select Template"}
            </Button>
            <Button variant="outline" onClick={handlePreviewResume} className="flex items-center gap-2">
              <Eye size={16} />
              Preview
            </Button>
            <Button variant="outline" onClick={handlePreviewResume}
             className="flex items-center gap-2">
              <Eye size={16} />
              Create Resume
            </Button>
          
          </div>
        </div>
        
        {selectedTemplate && (
          <Card className="mb-4 bg-blue-50 border-blue-200">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded overflow-hidden border">
                  {selectedTemplate.preview_url ? (
                    <img 
                      src={selectedTemplate.preview_url} 
                      alt={selectedTemplate.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full bg-gray-100 flex items-center justify-center">
                      <LayoutTemplate size={20} className="text-gray-400" />
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="font-medium">Template: {selectedTemplate.name}</h3>
                  <p className="text-sm text-gray-600">{selectedTemplate.category.charAt(0).toUpperCase() + selectedTemplate.category.slice(1)}</p>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setIsTemplateDialogOpen(true)}
              >
                Change
              </Button>
            </CardContent>
          </Card>
        )}
        
        <Card className="mb-6">
          <CardContent className="p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-6 mb-8">
                <TabsTrigger value="personal">Personal</TabsTrigger>
                <TabsTrigger value="work">Work</TabsTrigger>
                <TabsTrigger value="education">Education</TabsTrigger>
                <TabsTrigger value="projects">Projects</TabsTrigger>
                <TabsTrigger value="skills">Skills</TabsTrigger>
                <TabsTrigger value="links">Links</TabsTrigger>
              </TabsList>
              
              <TabsContent value="personal">
                <PersonalInfoTab 
                  personalInfo={personalInfo} 
                  onChange={handlePersonalInfoChange} 
                  resumeId={resumeId}

                />
              </TabsContent>
              
              <TabsContent value="work">
                <WorkExperienceTab 
                  workExperience={workExperience} 
                  onAdd={() => openDialog("work")} 
                  onRemove={(id) => removeItem("work", id)} 
                  resumeId={resumeId}
                  userId={userId}
                />
              </TabsContent>
              
              <TabsContent value="education">
                <EducationTab 
                  education={education} 
                  onAdd={() => openDialog("education")} 
                  onRemove={(id) => removeItem("education", id)} 
                />
              </TabsContent>
              
              <TabsContent value="projects">
                <ProjectsTab 
                  projects={projects} 
                  onAdd={() => openDialog("project")} 
                  onRemove={(id) => removeItem("project", id)} 
                />
              </TabsContent>
              
              <TabsContent value="skills">
                <SkillsTab 
                  skills={skills} 
                  onAdd={() => openDialog("skill")} 
                  onRemove={(id) => removeItem("skill", id)} 
                  resumeId={resumeId}
                  userId={userId}
                />
              </TabsContent>
                          
              <TabsContent value="links">
                <LinksTab 
                  links={links} 
                  onAdd={() => openDialog("link")} 
                  onRemove={(id) => removeItem("link", id)} 
                  resumeId={resumeId}
                  userId={userId}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
          
          <CardFooter className="flex justify-between p-6 border-t">
            <Button 
              variant="outline" 
              onClick={handlePrevTab}
              disabled={activeTab === "personal"}
              className="flex items-center gap-2"
            >
              <ArrowLeft size={16} />
              Previous
            </Button>
            <Button 
              onClick={handleNextTab}
              disabled={activeTab === "links"}
              className="flex items-center gap-2"
            >
              Next
              <ArrowRight size={16} />
            </Button>
          </CardFooter>
        </Card>
      </main>
      
      {/* Dialog for adding new entries */}
      <AddSectionDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        dialogType={dialogType}
        newSection={newSection}
        setNewSection={setNewSection}
        newSkill={newSkill}
        setNewSkill={setNewSkill}
        newLink={newLink}
        setNewLink={setNewLink}
        onAdd={handleAddSection}
      />
      
      {/* Template Selection Dialog */}
      <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Select a Template</DialogTitle>
          </DialogHeader>
          
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
              {templates.map((template) => (
                <div 
                  key={template.id}
                  className={`border rounded-lg overflow-hidden transition-all cursor-pointer hover:shadow-md ${
                    selectedTemplate?.id === template.id ? 'ring-2 ring-blue-500 shadow-md' : ''
                  }`}
                  onClick={() => handleSelectTemplate(template)}
                >
                  <div className="relative aspect-[3/4] bg-gray-100">
                    {template.preview_url ? (
                      <img 
                        src={template.preview_url} 
                        alt={template.name}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                        {template.name} Preview
                      </div>
                    )}
                    
                    {template.is_premium && (
                      <div className="absolute top-2 right-2 bg-amber-500 text-white text-xs px-2 py-1 rounded">
                        PREMIUM
                      </div>
                    )}
                  </div>
                  
                  <div className="p-3">
                    <h3 className="font-medium">{template.name}</h3>
                    <p className="text-xs text-gray-500 mt-1">
                      {template.category.charAt(0).toUpperCase() + template.category.slice(1)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
