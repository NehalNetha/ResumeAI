"use client";
import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import DashboardSidebar from '@/components/DashboardSidebar';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { PersonalInfo, ResumeSection, Skill, Link } from '@/types/resume';
import ResumeHeader from '@/components/create-resume-comp/ResumeHeader';
import TemplateSelector from '@/components/create-resume-comp/TemplateSelector';
import AddSectionDialog from '@/components/resume-builder/AddSectionDialog';
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ResumeTabs from '@/components/create-resume-comp/ResumeTabs';

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
    summary: "" // Optional but initialized
  });
  
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(() => {
    if (typeof window !== 'undefined') {
      const savedTemplate = sessionStorage.getItem('selectedTemplate');
      return savedTemplate ? JSON.parse(savedTemplate) : null;
    }
    return null;
  });
  
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [resumeId, setResumeId] = useState<string | null>(null);
  
  // New states for resume generation and preview
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedLatex, setGeneratedLatex] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<"code" | "preview">("preview");
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  
  const supabase = createClient();
  const [workExperience, setWorkExperience] = useState<ResumeSection[]>([]);
  const [education, setEducation] = useState<ResumeSection[]>([]);
  const [projects, setProjects] = useState<ResumeSection[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [links, setLinks] = useState<Link[]>([]);
  
  const [newSection, setNewSection] = useState<ResumeSection>({
    id: "", title: "", company: "", location: "", startDate: "", endDate: "", description: "", bullets: [""]
  });
  const [newSkill, setNewSkill] = useState<Skill>({ id: "", name: "", level: "3" });
  const [newLink, setNewLink] = useState<Link>({ id: "", name: "", title: "", url: "" });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<"work" | "education" | "project" | "skill" | "link">("work");

  useEffect(() => {
    fetchTemplates();
    fetchUserInfo();
  }, []);

  useEffect(() => {
    if (userId) {
      fetchResumeData();
    }
  }, [userId]);

  const fetchUserInfo = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserId(user.id);
    } catch (error) {
      console.error('Error fetching user info:', error);
    }
  };

  const fetchResumeData = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('resume_info')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .limit(1);
        
      if (error) throw error;
      
      if (data && data.length > 0) {
        const resume = data[0];
        setResumeId(resume.id);
        if (resume.personal_info) setPersonalInfo(resume.personal_info);
        if (resume.work_experience) setWorkExperience(resume.work_experience);
        if (resume.education) setEducation(resume.education);
        if (resume.projects) setProjects(resume.projects);
        if (resume.skills) setSkills(resume.skills);
        if (resume.links) setLinks(resume.links);
        if (resume.template_id) {
          const template = templates.find(t => t.id === resume.template_id);
          if (template) setSelectedTemplate(template);
        }
        if (resume.generated_latex) {
          setGeneratedLatex(resume.generated_latex);
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
      const { data, error } = await supabase.from('templates').select('*');
      if (error) throw error;
      if (data) setTemplates(data);
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast.error("Failed to load templates");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePersonalInfoChange = (updatedInfo: PersonalInfo) => {
    setPersonalInfo(updatedInfo);
  };

  const openDialog = (type: "work" | "education" | "project" | "skill" | "link") => {
    setDialogType(type);
    setIsDialogOpen(true);
    if (type === "work" || type === "education" || type === "project") {
      setNewSection({ id: Date.now().toString(), title: "", company: "", location: "", startDate: "", endDate: "", description: "", bullets: [""] });
    } else if (type === "skill") {
      setNewSkill({ id: Date.now().toString(), name: "", level: "3" });
    } else if (type === "link") {
      setNewLink({ id: Date.now().toString(), name: "", title: "", url: "" });
    }
  };

  const handleAddSection = async () => {
    if (dialogType === "work") {
      if (!newSection.title || !newSection.company) {
        toast("Please fill in required fields");
        return;
      }
      setWorkExperience(prev => [...prev, newSection]);
      
      if (userId && resumeId) {
        try {
          const updatedWorkExperience = [...workExperience, newSection];
          const { error } = await supabase
            .from('resume_info')
            .update({ 
              work_experience: updatedWorkExperience,
              updated_at: new Date().toISOString()
            })
            .eq('id', resumeId)
            .eq('user_id', userId);
            
          if (error) throw error;
          toast.success("Work experience saved to database");
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
      
      if (userId && resumeId) {
        try {
          const updatedEducation = [...education, newSection];
          const { error } = await supabase
            .from('resume_info')
            .update({ 
              education: updatedEducation,
              updated_at: new Date().toISOString()
            })
            .eq('id', resumeId)
            .eq('user_id', userId);
            
          if (error) throw error;
          toast.success("Education saved to database");
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
      
      if (userId && resumeId) {
        try {
          const updatedProjects = [...projects, newSection];
          const { error } = await supabase
            .from('resume_info')
            .update({ 
              projects: updatedProjects,
              updated_at: new Date().toISOString()
            })
            .eq('id', resumeId)
            .eq('user_id', userId);
            
          if (error) throw error;
          toast.success("Project saved to database");
        } catch (error) {
          console.error("Error saving project:", error);
          toast.error("Failed to save project to database");
        }
      }
    } else if (dialogType === "skill") {
      if (!newSkill.name) {
        toast("Please enter a skill name");
        return;
      }
      setSkills(prev => [...prev, newSkill]);
      
      if (userId && resumeId) {
        try {
          const updatedSkills = [...skills, newSkill];
          const { error } = await supabase
            .from('resume_info')
            .update({ 
              skills: updatedSkills,
              updated_at: new Date().toISOString()
            })
            .eq('id', resumeId)
            .eq('user_id', userId);
            
          if (error) throw error;
          toast.success("Skill saved to database");
        } catch (error) {
          console.error("Error saving skill:", error);
          toast.error("Failed to save skill to database");
        }
      }
    } else if (dialogType === "link") {
      if (!newLink.title || !newLink.url) {
        toast("Please fill in all fields");
        return;
      }
      setLinks(prev => [...prev, newLink]);
      
      if (userId && resumeId) {
        try {
          const updatedLinks = [...links, newLink];
          const { error } = await supabase
            .from('resume_info')
            .update({ 
              links: updatedLinks,
              updated_at: new Date().toISOString()
            })
            .eq('id', resumeId)
            .eq('user_id', userId);
            
          if (error) throw error;
          toast.success("Link saved to database");
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
      
      if (userId && resumeId) {
        try {
          const { error } = await supabase
            .from('resume_info')
            .update({ 
              work_experience: updatedWorkExperience,
              updated_at: new Date().toISOString()
            })
            .eq('id', resumeId)
            .eq('user_id', userId);
            
          if (error) throw error;
        } catch (error) {
          console.error("Error updating work experience:", error);
          toast.error("Failed to update database");
        }
      }
    } else if (type === "education") {
      const updatedEducation = education.filter(item => item.id !== id);
      setEducation(updatedEducation);
      
      if (userId && resumeId) {
        try {
          const { error } = await supabase
            .from('resume_info')
            .update({ 
              education: updatedEducation,
              updated_at: new Date().toISOString()
            })
            .eq('id', resumeId)
            .eq('user_id', userId);
            
          if (error) throw error;
        } catch (error) {
          console.error("Error updating education:", error);
          toast.error("Failed to update database");
        }
      }
    } else if (type === "project") {
      const updatedProjects = projects.filter(item => item.id !== id);
      setProjects(updatedProjects);
      
      if (userId && resumeId) {
        try {
          const { error } = await supabase
            .from('resume_info')
            .update({ 
              projects: updatedProjects,
              updated_at: new Date().toISOString()
            })
            .eq('id', resumeId)
            .eq('user_id', userId);
            
          if (error) throw error;
        } catch (error) {
          console.error("Error updating projects:", error);
          toast.error("Failed to update database");
        }
      }
    } else if (type === "skill") {
      const updatedSkills = skills.filter(item => item.id !== id);
      setSkills(updatedSkills);
      
      if (userId && resumeId) {
        try {
          const { error } = await supabase
            .from('resume_info')
            .update({ 
              skills: updatedSkills,
              updated_at: new Date().toISOString()
            })
            .eq('id', resumeId)
            .eq('user_id', userId);
            
          if (error) throw error;
        } catch (error) {
          console.error("Error updating skills:", error);
          toast.error("Failed to update database");
        }
      }
    } else if (type === "link") {
      const updatedLinks = links.filter(item => item.id !== id);
      setLinks(updatedLinks);
      
      if (userId && resumeId) {
        try {
          const { error } = await supabase
            .from('resume_info')
            .update({ 
              links: updatedLinks,
              updated_at: new Date().toISOString()
            })
            .eq('id', resumeId)
            .eq('user_id', userId);
            
          if (error) throw error;
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
        generated_latex: generatedLatex,
        updated_at: new Date().toISOString()
      };
      
      let response;
      
      if (resumeId) {
        response = await supabase
          .from('resume_info')
          .update(resumeData)
          .eq('id', resumeId);
      } else {
        response = await supabase
          .from('resume_info')
          .insert(resumeData)
          .select();
      }
      
      if (response.error) throw response.error;
      
      if (response.data && response.data[0]) {
        setResumeId(response.data[0].id);
      }
      
      toast.success(resumeId ? "Resume updated successfully!" : "Resume created successfully!");
    } catch (error) {
      console.error('Error saving resume:', error);
      toast.error("Failed to save resume");
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerateResume = async () => {
    if (!selectedTemplate) {
      toast.error("Please select a template first");
      setIsTemplateDialogOpen(true);
      return;
    }
    
    if (!personalInfo.name || !personalInfo.email) {
      toast.error("Name and email are required");
      setActiveTab("personal");
      return;
    }
    
    try {
      setIsGenerating(true);
      
      const response = await fetch('/api/gemini/generate-resume', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalInfo,
          workExperience,
          education,
          projects,
          skills,
          links,
          template: selectedTemplate,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate resume');
      }
      
      const data = await response.json();
      setGeneratedLatex(data.modifiedLatex);
      
      // Save the generated LaTeX to the database
      if (userId && resumeId) {
        await supabase
          .from('resume_info')
          .update({ 
            generated_latex: data.modifiedLatex,
            updated_at: new Date().toISOString()
          })
          .eq('id', resumeId)
          .eq('user_id', userId);
      }
      
      // Generate PDF preview
      
      // Scroll to the preview section
      setTimeout(() => {
        document.getElementById('preview-section')?.scrollIntoView({ behavior: 'smooth' });
      }, 500);
      
      toast.success("Resume generated successfully!");
    } catch (error) {
      console.error('Error generating resume:', error);
      toast.error(error instanceof Error ? error.message : "Failed to generate resume");
    } finally {
      setIsGenerating(false);
    }
  };


  const handlePreviewResume = () => {
    if (!generatedLatex) {
      handleGenerateResume();
    } else {
      // If we already have generated LaTeX, just show the preview section
      window.scrollTo({
        top: document.getElementById('preview-section')?.offsetTop,
        behavior: 'smooth'
      });
    }
  };
  return (
  <>
    <div className="flex-1 flex flex-col mt-6">
      {/* Full-Width Header */}
      <ResumeHeader 
        selectedTemplate={selectedTemplate}
        setIsTemplateDialogOpen={setIsTemplateDialogOpen}
        handlePreviewResume={handleGenerateResume}
        handleGenerateResume={handleGenerateResume}
        isGenerating={isGenerating}
      />

      {/* Main Content */}
      <main className="flex-1 p-4 sm:p-6 flex flex-col lg:flex-row gap-6">
        {/* Form Section */}
        <div className={`flex-1 ${isGenerating || generatedLatex ? 'lg:w-1/2' : 'w-full'}`}>
          <Card className="mb-6">
            <ResumeTabs
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              personalInfo={personalInfo}
              workExperience={workExperience}
              education={education}
              projects={projects}
              skills={skills}
              links={links}
              handlePersonalInfoChange={handlePersonalInfoChange}
              openDialog={openDialog}
              removeItem={removeItem}
              resumeId={resumeId}
              userId={userId}
            />
          </Card>
        </div>

        {/* Preview Section - Only when generating or generated */}
        {(isGenerating || generatedLatex) && (
          <div className="w-full lg:w-1/2 flex flex-col gap-6">
            <Card className="lg:sticky lg:top-24 overflow-hidden">
              <div className="p-4 sm:p-6">
                <h2 className="text-2xl font-bold mb-4">Resume Preview</h2>
                {isGenerating ? (
                  <div className="flex items-center justify-center h-[400px] sm:h-[600px] bg-gray-100 rounded-md">
                    <p className="text-gray-500">Generating resume...</p>
                  </div>
                ) : (
                  <Tabs value={previewMode} onValueChange={(value) => setPreviewMode(value as "code" | "preview")}>
                    <TabsList className="grid w-full grid-cols-2 mb-6">
                      <TabsTrigger value="preview">Preview</TabsTrigger>
                      <TabsTrigger value="code">LaTeX Code</TabsTrigger>
                    </TabsList>
                    <TabsContent value="preview" className="min-h-[400px] sm:min-h-[600px]">
                      {pdfUrl ? (
                        <iframe 
                          src={pdfUrl} 
                          className="w-full h-[400px] sm:h-[600px] md:h-[700px] lg:h-[800px] border rounded-md"
                          title="Resume Preview"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-[400px] sm:h-[600px] bg-gray-100 rounded-md">
                          <p className="text-gray-500">PDF preview is being generated...</p>
                        </div>
                      )}
                    </TabsContent>
                    <TabsContent value="code">
                      <div className="relative h-[400px] sm:h-[600px]">
                        <Button 
                          variant="outline" 
                          className="absolute right-2 top-2 z-10"
                          onClick={() => {
                            navigator.clipboard.writeText(generatedLatex || "");
                            toast.success("LaTeX code copied!");
                          }}
                        >
                          Copy Code
                        </Button>
                        <pre className="bg-gray-100 p-4 rounded-md h-full text-sm overflow-y-auto whitespace-pre-wrap break-all max-w-full">
                          <code className="block w-full">{generatedLatex}</code>
                        </pre>
                      </div>
                    </TabsContent>
                  </Tabs>
                )}
                <div className="flex flex-col sm:flex-row justify-between gap-3 mt-6">
                  <Button variant="outline" onClick={handleSaveResume} disabled={isSaving || isGenerating} className="w-full sm:w-auto">
                    {isSaving ? "Saving..." : "Save Resume"}
                  </Button>
                  <Button 
                    onClick={() => pdfUrl && window.open(pdfUrl, '_blank')}
                    disabled={!pdfUrl || isGenerating}
                    className="w-full sm:w-auto"
                  >
                    Download PDF
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </main>
    </div>

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

      <div >
      <TemplateSelector
        isOpen={isTemplateDialogOpen}
        onOpenChange={setIsTemplateDialogOpen}
        templates={templates}
        selectedTemplate={selectedTemplate}
        isLoading={isLoading}
        onSelectTemplate={(template) => {
          setSelectedTemplate(template as Template);
          sessionStorage.setItem('selectedTemplate', JSON.stringify(template));
          setIsTemplateDialogOpen(false);
          toast.success(`Template "${template.name}" selected`);
        }}
        
      />
      </div>
      </>
  );
}