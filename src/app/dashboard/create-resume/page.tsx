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
import { Textarea } from '@/components/ui/textarea';
import { Clipboard, ClipboardCheck, CreditCard, Loader2, Trash, Trash2 } from 'lucide-react';
import * as diffLib from 'diff';
import { fetchUserCredits, updateUserCredits } from '@/utils/credits';

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
  const [generatedLatex, setGeneratedLatex] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const savedLatex = sessionStorage.getItem('generatedLatex');
      return savedLatex || null;
    }
    return null;
  });
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


  const [chatQuestion, setChatQuestion] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [showDiff, setShowDiff] = useState(false);

  const [originalLatex, setOriginalLatex] = useState<string | null>(null);
  const [diffResult, setDiffResult] = useState<diffLib.Change[]>([]);
  const [userCredits, setUserCredits] = useState<number>(0);
  const [isLoadingCredits, setIsLoadingCredits] = useState(false);


 

  const handleChatSubmit = async () => {
    if (!generatedLatex || !chatQuestion.trim()) {
      toast("Please generate a resume and enter a question");
      return;
    }
    
    setIsChatLoading(true);
    
    try {
      // Save the current LaTeX as original before making changes
      setOriginalLatex(generatedLatex);
      
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          latex: generatedLatex,
          question: chatQuestion,
        }),
      });
  
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to process chat request');
      }
      
      const data = await response.json();
      
      // Update the LaTeX with the modified version
      setGeneratedLatex(data.modifiedLatex);
      
      // Compute diff between original and modified LaTeX
      if (originalLatex) {
        const diff = diffLib.diffLines(originalLatex, data.modifiedLatex);
        setDiffResult(diff);
      }
      
      setShowDiff(true);
    
      // Clear the chat input
      setChatQuestion('');
      
      toast.success("Resume updated based on your request");
      
    } catch (error) {
      console.error('Error processing chat:', error);
      toast.error(error instanceof Error ? error.message : "Failed to process your request");
    } finally {
      setIsChatLoading(false);
    }
  };

 

  const handleCopyLatex = () => {
    if (generatedLatex) {
      navigator.clipboard.writeText(generatedLatex).then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
        toast.success("LaTeX code copied to clipboard");
      });
    }
  };
  
  

  useEffect(() => {
    fetchTemplates();
    fetchUserInfo();
    

  }, []);

  useEffect(() => {
    if (userId) {
      fetchResumeData();
      loadUserCredits(userId)
    }
  }, [userId]);

  const loadUserCredits = async (userId: string) => {
    try {
      setIsLoadingCredits(true);
      const credits = await fetchUserCredits(userId);
      setUserCredits(credits);
    } catch (error) {
      console.error('Error loading user credits:', error);
    } finally {
      setIsLoadingCredits(false);
    }
  };



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

    useEffect(() => {
      if (generatedLatex && typeof window !== 'undefined') {
        sessionStorage.setItem('generatedLatex', generatedLatex);
      }
    }, [generatedLatex]);
  
    // Add a function to clear the resume data
    const handleClearResume = () => {
      setGeneratedLatex(null);
      setPdfUrl(null);
      setShowDiff(false);
      
      // Clear from session storage
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('generatedLatex');
      }
      
      toast.success("Resume data cleared");
    };

  // Add these new states for PDF preview handling
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [cachedLatex, setCachedLatex] = useState<string | null>(null);

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

      if (userId) {
        await updateUserCredits(userId, 5, "resume creation");
      }
      
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

  // Add a new function to generate PDF preview
  const generatePdfPreview = async () => {
    if (!generatedLatex) return;
  
    setIsPreviewLoading(true);
    setPreviewError(null);
    // Store the latex content we are generating for, in case it changes during the async operation
    const latexToGenerateFor = generatedLatex;
  
    try {
      // Use the compile endpoint to get PDF directly
      const response = await fetch('https://latex-compiler-1082803956279.asia-south1.run.app/compile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          latex_content: latexToGenerateFor, // Use the stored latex content
          target_filename: "resume.tex"
        }),
      });
  
      if (!response.ok) {
        const errorText = await response.text();
        console.error("PDF compilation error:", errorText);
        throw new Error(errorText || 'Failed to generate PDF preview');
      }
  
      const blob = await response.blob();
      const newUrl = URL.createObjectURL(blob);
  
      // Check if latex content has changed *while* we were fetching
      if (latexToGenerateFor === generatedLatex) {
        // Revoke previous URL *before* setting the new one, if it exists
        if (pdfUrl) {
          URL.revokeObjectURL(pdfUrl);
        }
        // Update state with the new URL and the corresponding LaTeX
        setPdfUrl(newUrl);
        setCachedLatex(latexToGenerateFor);
      } else {
        // Latex changed during fetch - discard this result and revoke its URL
        console.warn("Latex content changed during preview generation. Discarding stale result.");
        URL.revokeObjectURL(newUrl);
        // The main useEffect will trigger again for the *new* generatedLatex
      }
  
    } catch (error) {
      console.error('Error generating preview:', error);
      // Only set error if the request was for the *current* latex
      if (latexToGenerateFor === generatedLatex) {
        setPreviewError(error instanceof Error ? error.message : 'Failed to generate preview');
        // Clear potentially outdated URL if generation failed for current latex
        if (pdfUrl) {
          URL.revokeObjectURL(pdfUrl);
          setPdfUrl(null);
          setCachedLatex(null);
        }
      }
    } finally {
      // Only set loading to false if the request was for the *current* latex
      if (latexToGenerateFor === generatedLatex) {
        setIsPreviewLoading(false);
      }
    }
  };
  useEffect(() => {
    if (previewMode === "preview" && generatedLatex) {
      if (pdfUrl && cachedLatex === generatedLatex) {
        setIsPreviewLoading(false);
        setPreviewError(null);
      } else {
       
        if (pdfUrl && cachedLatex !== generatedLatex) {
          URL.revokeObjectURL(pdfUrl);
          setPdfUrl(null); // Clear the state immediately
          setCachedLatex(null);
        }
        generatePdfPreview();
      }
    }
  }, [previewMode, generatedLatex]);

  useEffect(() => {
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl])

  const handleDownloadPDF = () => {
    if (!pdfUrl) {
      toast.error("No PDF available to download");
      return;
    }
    
    const a = document.createElement('a');
    a.href = pdfUrl;
    a.download = 'resume.pdf';
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    document.body.removeChild(a);
    
    toast.success("PDF downloaded successfully!");
  };

  const renderRawLatex = () => {
    if (!showDiff || !diffResult.length) {
      return (
        <pre className="text-xs whitespace-pre-wrap font-mono">
          {generatedLatex}
        </pre>
      );
    }
    
    return (
      <div className="font-mono text-xs whitespace-pre-wrap">
        {diffResult.map((part, index) => {
          // Added lines are green, removed lines are red, unchanged are normal
          const color = part.added ? 'bg-green-100 text-green-800' : 
                      part.removed ? 'bg-red-100 text-red-800' : '';
          
          return (
            <span key={index} className={`${color}`}>
              {part.value}
            </span>
          );
        })}
      </div>
    );
  };

  const renderDiff = () => {
    return (
      <div className="font-mono text-xs whitespace-pre-wrap">
        {diffResult.map((part, index) => {
          // Added lines are green, removed lines are red, unchanged are normal
          const color = part.added ? 'bg-green-100 text-green-800' : 
                      part.removed ? 'bg-red-100 text-red-800' : '';
          
          // Add line prefix to indicate added/removed
          const lines = part.value.split('\n').filter(line => line.length > 0);
          
          return (
            <div key={index} className={`${color}`}>
              {lines.map((line, lineIndex) => (
                <div key={`${index}-${lineIndex}`} className="py-1">
                  <span className="mr-2 inline-block w-4 text-gray-500">
                    {part.added ? '+' : part.removed ? '-' : ' '}
                  </span>
                  {line}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    );
  };


  const handlePreviewResume = () => {
    if (!generatedLatex) {
      handleGenerateResume();
    } else {
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
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold">Resume Preview</h2>
                  {generatedLatex && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleClearResume}
                      className="flex items-center gap-1"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                      Clear
                    </Button>
                  )}
                </div>
                
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
                      <div className="w-full h-full flex items-center justify-center">
                        {isPreviewLoading ? (
                          <div className="flex flex-col items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-gray-400 mb-2" />
                            <p className="text-sm text-gray-500">Generating preview...</p>
                          </div>
                        ) : previewError ? (
                          <div className="text-center p-4 border border-red-200 rounded-md bg-red-50 max-w-md">
                            <h3 className="text-red-800 font-medium mb-2">Error Generating Preview</h3>
                            <p className="text-sm text-red-600">{previewError}</p>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="mt-3"
                              onClick={generatePdfPreview}
                            >
                              Try Again
                            </Button>
                          </div>
                        ) : pdfUrl ? (
                          <div className="w-full h-full" style={{ minHeight: '600px' }}> 
                            <iframe 
                              src={pdfUrl} 
                              title="Resume Preview" 
                              className="w-full h-full border border-gray-200 shadow-sm" 
                              style={{ minHeight: '600px' }} 
                            />
                          </div>
                        ) : (
                          <div className="text-center">
                            <Button 
                              variant="outline" 
                              onClick={generatePdfPreview}
                            >
                              Generate Preview
                            </Button>
                          </div>
                        )}
                      </div>
                    </TabsContent>
                    <TabsContent value="code">
                        <div className="relative h-[400px] sm:h-[600px]">
                          <Button 
                            variant="outline" 
                            className="absolute right-2 top-2 z-10"
                            onClick={handleCopyLatex}
                          >
                            {isCopied ? (
                              <>
                                <ClipboardCheck className="h-4 w-4 mr-1" />
                                Copied!
                              </>
                            ) : (
                              <>
                                <Clipboard className="h-4 w-4 mr-1" />
                                Copy Code
                              </>
                            )}
                          </Button>
                          <div className="bg-gray-100 p-4 rounded-md h-full text-sm overflow-y-auto whitespace-pre-wrap break-all max-w-full">
                            {renderRawLatex()}
                          </div>
                        </div>
                      </TabsContent>
                  </Tabs>
                )}
                <div className="flex flex-col sm:flex-row justify-between gap-3 mt-6">
                  <Button variant="outline" onClick={handleSaveResume} disabled={isSaving || isGenerating} className="w-full sm:w-auto">
                    {isSaving ? "Saving..." : "Save Resume"}
                  </Button>
                  <Button 
                    onClick={handleDownloadPDF}
                    disabled={!pdfUrl || isGenerating}
                    className="w-full sm:w-auto"
                  >
                    Download PDF
                  </Button>
                </div>
                
                {/* Add Resume Assistant Chat Section */}
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <h3 className="text-sm font-medium mb-2">Resume Assistant</h3>
                  
                  <div className="flex items-center relative">
                    <Textarea 
                      placeholder="Ask a question about your resume..."
                      className="flex-1 resize-none h-10 py-2"
                      value={chatQuestion}
                      onChange={(e) => setChatQuestion(e.target.value)}
                      disabled={isChatLoading || !generatedLatex}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleChatSubmit();
                        }
                      }}
                    />
                    <Button 
                      size="sm" 
                      className="ml-2 h-10"
                      onClick={handleChatSubmit}
                      disabled={isChatLoading || !generatedLatex || !chatQuestion.trim()}
                    >
                      {isChatLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-send">
                          <path d="m22 2-7 20-4-9-9-4Z"/>
                          <path d="M22 2 11 13"/>
                        </svg>
                      )}
                    </Button>
                  </div>
                  
                  {isChatLoading && (
                    <div className="mt-2 text-sm text-gray-500 flex items-center">
                      <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                      Processing your request...
                    </div>
                  )}
                  
                  {showDiff && (
                    <div className="mt-2 p-2 bg-blue-50 text-blue-700 text-sm rounded-md">
                      <p>Your resume has been updated based on your request.</p>
                    </div>
                  )}
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

    <div>
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

