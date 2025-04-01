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
import { fetchUserCredits, updateUserCredits } from '@/utils/credits/credits';
import { renderRawLatex } from '@/utils/latexRender/renderLatex';
import { downloadPdf, generatePdfPreview } from '@/utils/pdfGeneration/pdfUtil';
import { fetchResumeDataUtil, saveFullResume, saveResumeSection } from '@/utils/createResumeServices/resumeDataService';
import PricingToast from '@/components/PricingToast';

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
  const [previewMode, setPreviewMode] = useState<"code" | "preview">("code");
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
  const [isDownloading, setIsDownloading] = useState(false); // Add state for download loading

  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [cachedLatex, setCachedLatex] = useState<string | null>(null);

 

  const handleChatSubmit = async () => {
    if (!generatedLatex || !chatQuestion.trim()) {
      toast("Please generate a resume and enter a question");
      return;
    }

    const generationCost = 3;
    if (userCredits < generationCost) {
      toast.error(
        <PricingToast  credits={3}/>
      );
      return;
    }
    
    setIsChatLoading(true);
    
    try {
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


      if (userId) {
        const updatedCredits = userCredits - 3;
        setUserCredits(updatedCredits);
        await updateUserCredits(userId, updatedCredits, "resume customization create-resume");
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
      if (!userId) return;
      
      const resume = await fetchResumeDataUtil(userId);
      
      if (resume) {
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
      }
    } catch (error) {
      console.error('Error in fetchResumeDataForUser:', error);
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
      const updatedWorkExperience = [...workExperience, newSection];
      setWorkExperience(updatedWorkExperience);
      
      if (userId && resumeId) {
        try {
          await saveResumeSection(userId, resumeId, "work_experience", updatedWorkExperience);
          toast.success("Work experience saved to database");
        } catch (error) {
          console.error("Error saving work experience:", error);
        }
      }
    } else if (dialogType === "education") {
      if (!newSection.title || !newSection.company) {
        toast("Please fill in required fields");
        return;
      }
      const updatedEducation = [...education, newSection];
      setEducation(updatedEducation);
      
      if (userId && resumeId) {
        try {
          await saveResumeSection(userId, resumeId, "education", updatedEducation);
          toast.success("Education saved to database");
        } catch (error) {
          console.error("Error saving education:", error);
        }
      }
    } else if (dialogType === "project") {
      if (!newSection.title) {
        toast("Please fill in required fields");
        return;
      }
      const updatedProjects = [...projects, newSection];
      setProjects(updatedProjects);
      
      if (userId && resumeId) {
        try {
          await saveResumeSection(userId, resumeId, "projects", updatedProjects);
          toast.success("Project saved to database");
        } catch (error) {
          console.error("Error saving project:", error);
        }
      }
    } else if (dialogType === "skill") {
      if (!newSkill.name) {
        toast("Please enter a skill name");
        return;
      }
      const updatedSkills = [...skills, newSkill];
      setSkills(updatedSkills);
      
      if (userId && resumeId) {
        try {
          await saveResumeSection(userId, resumeId, "skills", updatedSkills);
          toast.success("Skill saved to database");
        } catch (error) {
          console.error("Error saving skill:", error);
        }
      }
    } else if (dialogType === "link") {
      if (!newLink.title || !newLink.url) {
        toast("Please fill in all fields");
        return;
      }
      const updatedLinks = [...links, newLink];
      setLinks(updatedLinks);
      
      if (userId && resumeId) {
        try {
          await saveResumeSection(userId, resumeId, "links", updatedLinks);
          toast.success("Link saved to database");
        } catch (error) {
          console.error("Error saving link:", error);
        }
      }
    }
    
    setIsDialogOpen(false);
    toast(`Added new ${dialogType} entry`);
  };

  const removeItem = async (type: string, id: string) => {
    let updatedData;
    let sectionType;
    
    if (type === "work") {
      updatedData = workExperience.filter(item => item.id !== id);
      setWorkExperience(updatedData);
      sectionType = "work_experience";
    } else if (type === "education") {
      updatedData = education.filter(item => item.id !== id);
      setEducation(updatedData);
      sectionType = "education";
    } else if (type === "project") {
      updatedData = projects.filter(item => item.id !== id);
      setProjects(updatedData);
      sectionType = "projects";
    } else if (type === "skill") {
      updatedData = skills.filter(item => item.id !== id);
      setSkills(updatedData);
      sectionType = "skills";
    } else if (type === "link") {
      updatedData = links.filter(item => item.id !== id);
      setLinks(updatedData);
      sectionType = "links";
    } else {
      return;
    }
    
    if (userId && resumeId) {
      try {
        await saveResumeSection(userId, resumeId, sectionType as any, updatedData);
      } catch (error) {
        console.error(`Error updating ${type}:`, error);
        toast.error("Failed to update database");
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
        template_id: selectedTemplate?.id || null,
        personal_info: personalInfo,
        work_experience: workExperience,
        education: education,
        projects: projects,
        skills: skills,
        links: links,
        generated_latex: generatedLatex,
      };
      
      const newResumeId = await saveFullResume(userId, resumeId, resumeData);
      
      if (newResumeId && !resumeId) {
        setResumeId(newResumeId);
      }
    } catch (error) {
      console.error('Error in handleSaveResume:', error);
    } finally {
      setIsSaving(false);
    }
  };

    useEffect(() => {
      if (generatedLatex && typeof window !== 'undefined') {
        sessionStorage.setItem('generatedLatex', generatedLatex);
      }
    }, [generatedLatex]);
  
    const handleClearResume = () => {
      setGeneratedLatex(null);
      setPdfUrl(null);
      setShowDiff(false);
      
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('generatedLatex');
      }
      
      toast.success("Resume data cleared");
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

    const generationCost = 5;
    if (userCredits < generationCost) {
      toast.error(
        <PricingToast credits={5} />
      );
      return;
    }


    setIsGenerating(true);
    setGeneratedLatex(null);
    setPdfUrl(null);
    setCachedLatex(null);
    setShowDiff(false);
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('generatedLatex');
    }

    let generationSuccessful = false;
    let accumulatedLatex = '';


    try {
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

      if (!response.ok || !response.body) {
         const errorData = await response.json().catch(() => ({ error: `HTTP error! Status: ${response.status}` }));
         throw new Error(errorData.error || `HTTP error! Status: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        accumulatedLatex += chunk;
        setGeneratedLatex(prev => (prev ?? '') + chunk);
      }

      if (!accumulatedLatex.trim()) {
          throw new Error("Generation finished, but no content was received.");
      }

      if (userId) {
          await updateUserCredits(userId, generationCost, "resume generation create-resume");
          setUserCredits(prev => Math.max(0, prev - generationCost));
      }

      generationSuccessful = true;
      toast.success(`Resume generated successfully! (${generationCost} credits used)`);

      // Omitted the database save logic here for brevity, it remains the same

      setTimeout(() => {
        document.getElementById('preview-section')?.scrollIntoView({ behavior: 'smooth' });
      }, 500);

      setPreviewMode("code");


    } catch (error) {
      console.error('Error generating resume:', error);
      toast.error(error instanceof Error ? error.message : "Failed to generate resume");
       setGeneratedLatex(null);
       if (typeof window !== 'undefined') {
         sessionStorage.removeItem('generatedLatex');
       }
    } finally {
      setIsGenerating(false); // Set isGenerating to false *after* the try/catch block
      if (generationSuccessful && typeof window !== 'undefined') {
           if (accumulatedLatex) {
              sessionStorage.setItem('generatedLatex', accumulatedLatex);
           }
      }
    }
  };


  useEffect(() => {
    // Only trigger preview generation when NOT generating and in preview mode
    if (previewMode === "preview" && !isGenerating && generatedLatex) {
        if (pdfUrl && cachedLatex === generatedLatex) {
            setIsPreviewLoading(false);
            setPreviewError(null);
        } else {
            if (pdfUrl && cachedLatex !== generatedLatex) {
                URL.revokeObjectURL(pdfUrl);
                setPdfUrl(null);
                setCachedLatex(null);
            }
            handleGeneratePreview();
        }
    } else if (previewMode === "preview" && isGenerating) {
    }
  }, [previewMode, isGenerating, generatedLatex]); // Add isGenerating dependency
  useEffect(() => {
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl])



   const handleDownloadPDF = async () => {
    if (!generatedLatex) {
      toast.error("No LaTeX content available to download");
      return;
    }
    if (isDownloading) return; 

    setIsDownloading(true);
    try {
      await downloadPdf(generatedLatex, 'resume.pdf');
    } catch (error) {
      
      console.error("Unexpected error during download initiation:", error);
      toast.error("An unexpected error occurred while trying to download.");
    } finally {
      setIsDownloading(false);
    }
  };


  const handleGeneratePreview = async () => {    if (!generatedLatex) {
      toast.info("No LaTeX content available to generate preview.");
      return;
    }

    if (pdfUrl && cachedLatex === generatedLatex) {
        setIsPreviewLoading(false);
        setPreviewError(null);
        return;
    }

    setIsPreviewLoading(true);
    setPreviewError(null);
    const latexToGenerateFor = generatedLatex;

    try {
      const newUrl = await generatePdfPreview(latexToGenerateFor);

      if (latexToGenerateFor === generatedLatex) {
         if (pdfUrl && pdfUrl !== newUrl) {
           URL.revokeObjectURL(pdfUrl);
         }

         if (newUrl) {
           setPdfUrl(newUrl);
           setCachedLatex(latexToGenerateFor); 
           setPreviewError(null); 
         } else {
           setPreviewError("Failed to generate preview. Check console for details.");
           if (pdfUrl) URL.revokeObjectURL(pdfUrl);
           setPdfUrl(null);
           setCachedLatex(null);
         }
      } else {
        console.warn("Latex content changed during preview generation. Discarding stale result.");
        if (newUrl) URL.revokeObjectURL(newUrl); 
      }

    } catch (error) {
      console.error('Error generating preview:', error);
       if (latexToGenerateFor === generatedLatex) {
         setPreviewError(error instanceof Error ? error.message : 'An unexpected error occurred during preview generation.');
         if (pdfUrl) URL.revokeObjectURL(pdfUrl); 
         setPdfUrl(null);
         setCachedLatex(null);
       }
    } finally {
      if (latexToGenerateFor === generatedLatex) {
        setIsPreviewLoading(false);
      }
    }
  };



  
  return (
  <>
    <div className="flex-1 flex flex-col mt-6">
       <ResumeHeader
         selectedTemplate={selectedTemplate}
         setIsTemplateDialogOpen={setIsTemplateDialogOpen}
         handlePreviewResume={handleGenerateResume}
         handleGenerateResume={handleGenerateResume}
         isGenerating={isGenerating}
         isLoadingCredits={isLoadingCredits}
         userCredits={userCredits}
       />

      {/* Main Content */}
      <main className="flex-1 p-4 sm:p-6 flex flex-col lg:flex-row gap-6">
        {/* Form Section remains the same width calculation */}
        <div className={`flex-1 ${isGenerating || generatedLatex ? 'lg:w-1/2' : 'w-full'}`}>
           {/* ... Card with ResumeTabs ... */}
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

        {/* Preview Section - Show whenever generating OR generatedLatex exists */}
        {(isGenerating || generatedLatex) && (
          <div className="w-full lg:w-1/2 flex flex-col gap-6">
            <Card className="lg:sticky lg:top-24 overflow-hidden">
              <div className="p-4 sm:p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold">
                    {isGenerating ? "Generating Resume..." : "Resume Preview"}
                  </h2>
                  {generatedLatex && !isGenerating && ( // Only show clear button when NOT actively generating
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

                {/* Always render Tabs when generating or latex exists */}
                <Tabs value={previewMode} onValueChange={(value) => setPreviewMode(value as "code" | "preview")}>
                  <TabsList className="grid w-full grid-cols-2 mb-6">
                     {/* Keep the code tab always enabled */}
                     <TabsTrigger value="code">LaTeX Code</TabsTrigger>
                     {/* Disable preview tab while generating */}
                     <TabsTrigger value="preview" disabled={isGenerating}>
                      Preview {isGenerating && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
                      </TabsTrigger>
                  </TabsList>
                  <TabsContent value="code">
                      <div className="relative h-[400px] sm:h-[600px]">
                        <Button
                          variant="outline"
                          className="absolute right-2 top-2 z-10"
                          onClick={handleCopyLatex}
                          disabled={!generatedLatex || isGenerating} // Disable copy while generating might be safer
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
                         {/* This will now show the streaming content */}
                         {renderRawLatex({ generatedLatex, showDiff, diffResult })}
                         {/* Optionally show a subtle indicator if still loading */}
                         {isGenerating && (
                           <div className="absolute bottom-2 right-2 text-xs text-gray-400 italic flex items-center">
                             <Loader2 className="h-3 w-3 animate-spin mr-1" /> Streaming...
                           </div>
                         )}
                        </div>
                      </div>
                    </TabsContent>
                  <TabsContent value="preview" className="min-h-[400px] sm:min-h-[600px]">
                    {/* Preview Logic remains the same - it won't activate if isGenerating is true */}
                    <div className="w-full h-full flex items-center justify-center">
                      {isPreviewLoading ? (
                        // ... loading indicator ...
                        <div className="flex flex-col items-center justify-center">
                          <Loader2 className="h-8 w-8 animate-spin text-gray-400 mb-2" />
                          <p className="text-sm text-gray-500">Generating preview...</p>
                        </div>
                      ) : previewError ? (
                         // ... error message ...
                        <div className="text-center p-4 border border-red-200 rounded-md bg-red-50 max-w-md">
                          <h3 className="text-red-800 font-medium mb-2">Error Generating Preview</h3>
                          <p className="text-sm text-red-600">{previewError}</p>
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-3"
                            onClick={handleGeneratePreview}
                            disabled={isGenerating} // Also disable retry if generating main resume
                          >
                            Try Again
                          </Button>
                        </div>
                      ) : pdfUrl ? (
                         // ... iframe ...
                        <div className="w-full h-full" style={{ minHeight: '600px' }}>
                          <iframe
                            src={pdfUrl}
                            title="Resume Preview"
                            className="w-full h-full border border-gray-200 shadow-sm"
                            style={{ minHeight: '600px' }}
                          />
                        </div>
                      ) : (
                         // ... generate preview button ...
                        <div className="text-center">
                          <Button
                            variant="outline"
                            onClick={handleGeneratePreview}
                            disabled={isGenerating || !generatedLatex} // Disable if generating or no latex yet
                          >
                            Generate Preview
                          </Button>
                          {isGenerating && <p className="text-xs text-gray-500 mt-2">Resume generation in progress...</p>}
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
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

