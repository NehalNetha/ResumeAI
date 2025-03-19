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
  
  const supabase = createClient();
  
  // Fetch templates on component mount
  useEffect(() => {
    fetchTemplates();
  }, []);
  
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
  
  const handleAddSection = () => {
    if (dialogType === "work") {
      if (!newSection.title || !newSection.company) {
        toast("Please fill in required fields");
        return;
      }
      setWorkExperience(prev => [...prev, newSection]);
    } else if (dialogType === "education") {
      if (!newSection.title || !newSection.company) {
        toast("Please fill in required fields");
        return;
      }
      setEducation(prev => [...prev, newSection]);
    } else if (dialogType === "project") {
      if (!newSection.title) {
        toast("Please fill in required fields");
        return;
      }
      setProjects(prev => [...prev, newSection]);
    } else if (dialogType === "skill") {
      if (!newSkill.name) {
        toast("Please enter a skill name");
        return;
      }
      setSkills(prev => [...prev, newSkill]);
    } else if (dialogType === "link") {
      if (!newLink.title || !newLink.url) {
        toast("Please fill in all fields");
        return;
      }
      setLinks(prev => [...prev, newLink]);
    }
    
    setIsDialogOpen(false);
    toast(`Added new ${dialogType} entry`);
  };
  
  const removeItem = (type: string, id: string) => {
    if (type === "work") {
      setWorkExperience(prev => prev.filter(item => item.id !== id));
    } else if (type === "education") {
      setEducation(prev => prev.filter(item => item.id !== id));
    } else if (type === "project") {
      setProjects(prev => prev.filter(item => item.id !== id));
    } else if (type === "skill") {
      setSkills(prev => prev.filter(item => item.id !== id));
    } else if (type === "link") {
      setLinks(prev => prev.filter(item => item.id !== id));
    }
    toast(`Removed ${type} entry`);
  };
  
  const handleSaveResume = () => {
    const resumeData = {
      personalInfo,
      workExperience,
      education,
      projects,
      skills,
      links,
      templateId: selectedTemplate?.id || null
    };
    
    console.log("Saving resume:", resumeData);
    toast.success("Resume saved successfully!");
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
            <Button onClick={handleSaveResume} className="flex items-center gap-2">
              <Save size={16} />
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
                />
              </TabsContent>
              
              <TabsContent value="work">
                <WorkExperienceTab 
                  workExperience={workExperience} 
                  onAdd={() => openDialog("work")} 
                  onRemove={(id) => removeItem("work", id)} 
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
                />
              </TabsContent>
              
              <TabsContent value="links">
                <LinksTab 
                  links={links} 
                  onAdd={() => openDialog("link")} 
                  onRemove={(id) => removeItem("link", id)} 
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
