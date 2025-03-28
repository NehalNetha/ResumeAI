"use client"
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wand2, Loader2 } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { v4 as uuidv4 } from 'uuid';

import * as diffLib from 'diff';
import { 
  Resume, 
  Template, 
  ResumeInfo, 
  PersonalInfo, 
  WorkExperience, 
  Education, 
  Project, 
  Skill, 
  Link 
} from '@/types/resume';

// Import our new components
import JobDescriptionSection from '@/components/dashboard-comp/JobDescriptionSection';
// import TemplateSelector from '@/components/dashboard/TemplateSelector';
// import ResumeInfoSelector from '@/components/dashboard/ResumeInfoSelector';
// import GeneratedResumeView from '@/components/dashboard/GeneratedResumeView';
// import ResumeAssistant from '@/components/dashboard/ResumeAssistant';
import TemplateSelector from '@/components/dashboard-comp/TemplateSelector';
import GeneratedResumeView from '@/components/dashboard-comp/GeneratedResumeView';
import ResumeAssistant from '@/components/dashboard-comp/ResumeAssistant';
import ResumeInfoSelector from '@/components/dashboard-comp/ResumeInfoSelector';
import ResumeSelector from '@/components/dashboard-comp/ResumeSelector';
export default function Dashboard() {
  // State management
  const [uploadedResumes, setUploadedResumes] = useState<Resume[]>([]);
  const [selectedResumes, setSelectedResumes] = useState<Resume[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [jobDescription, setJobDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedLatex, setGeneratedLatex] = useState('');
  const [originalLatex, setOriginalLatex] = useState('');
  const [activeTab, setActiveTab] = useState<'resumes' | 'templates' | 'info'>('resumes');
  const [previewMode, setPreviewMode] = useState<'raw' | 'preview'>('raw');
  const [chatQuestion, setChatQuestion] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [diffResult, setDiffResult] = useState<diffLib.Change[]>([]);
  const [showDiff, setShowDiff] = useState(false); 
  const [userId, setUserId] = useState<string | null>(null);
  const [resumeInfos, setResumeInfos] = useState<ResumeInfo[]>([]);
  const [selectedResumeInfo, setSelectedResumeInfo] = useState<ResumeInfo | null>(null);
  const [selectedComponents, setSelectedComponents] = useState<{
    personalInfo: PersonalInfo | null;
    workExperiences: WorkExperience[];
    educations: Education[];
    projects: Project[];
    skills: Skill[];
    links: Link[];
  }>({
    personalInfo: null,
    workExperiences: [],
    educations: [],
    projects: [],
    skills: [],
    links: []
  });
  
  const supabase = createClient();
  
  useEffect(() => {
    fetchResumes();
    fetchTemplates();
    fetchUserId();
  }, []);
  
  // Calculate diff when original or generated LaTeX changes
  useEffect(() => {
    if (originalLatex && generatedLatex) {
      const diff = diffLib.diffLines(originalLatex, generatedLatex);
      setDiffResult(diff);
    }
  }, [originalLatex, generatedLatex]);
  
  const fetchResumes = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .storage
        .from("resumes")
        .list();
        
      if (error) {
        throw error;
      }
      
      if (data) {
        const resumeFiles = await Promise.all(
          data.map(async (file) => {
            const { data: urlData } = await supabase
              .storage
              .from('resumes')
              .createSignedUrl(file.name, 60 * 60 * 24);
              
            const originalName = file.name.includes('_') 
              ? file.name.substring(file.name.indexOf('_') + 1) 
              : file.name;
              
            return {
              id: file.id,
              name: originalName,
              date: new Date(file.created_at).toISOString().split('T')[0],
              size: `${(file.metadata.size / (1024 * 1024)).toFixed(1)} MB`,
              path: file.name,
              url: urlData?.signedUrl
            };
          })
        );
        
        setUploadedResumes(resumeFiles);
      }
    } catch (error) {
      console.error('Error fetching resumes:', error);
      toast("Error: Failed to load resumes");
    } finally {
      setIsLoading(false);
    }
  };
  
  const fetchTemplates = async () => {
    try {
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
      toast("Error: Failed to load templates");
    }
  };
  
  const fetchUserId = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        fetchResumeInfos(user.id);
      }
    } catch (error) {
      console.error('Error fetching user:', error);
    }
  };
  
  const fetchResumeInfos = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('resume_info')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });
        
      if (error) throw error;
      
      if (data) {
        setResumeInfos(data as ResumeInfo[]);
      }
    } catch (error) {
      console.error('Error fetching resume information:', error);
      toast.error("Failed to load resume information");
    }
  };
  
  const handleFileInput = async (files: File[]) => {
    if (files.length > 0) {
      await uploadFiles(files);
    }
  };
  
  const uploadFiles = async (files: File[]) => {
    setIsLoading(true);
    
    try {
      const newResumes: Resume[] = [];
      
      for (const file of files) {
        // Create a UUID filename for storage but keep original name
        const fileExt = file.name.split('.').pop();
        const originalName = file.name;
        const storageFileName = `${uuidv4()}_${originalName}`;
        const filePath = `${storageFileName}`;
        
        const { error: uploadError } = await supabase
          .storage
          .from('resumes')
          .upload(filePath, file);
        
        if (uploadError) {
          console.error('Upload error:', uploadError);
          if (uploadError.message.includes('bucket not found')) {
            toast("Error: The resumes storage bucket doesn't exist. Please contact an administrator.");
            break;
          }
          throw uploadError;
        }
        
        const { data: urlData } = await supabase
          .storage
          .from('resumes')
          .createSignedUrl(filePath, 60 * 60 * 24);
            
        const newResume: Resume = {
          id: Date.now(),
          name: originalName, // Use original name for display
          date: new Date().toISOString().split('T')[0],
          size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
          path: filePath,
          url: urlData?.signedUrl
        };
        
        newResumes.push(newResume);
      }
      
      setUploadedResumes(prev => [...prev, ...newResumes]);
      if (newResumes.length > 0) {
        setSelectedResumes(prev => [...prev, newResumes[0]]);
      }
      toast("Success: Resume(s) uploaded successfully");
    } catch (error) {
      console.error('Error uploading file:', error);
      toast("Error: Failed to upload resume");
    } finally {
      setIsLoading(false);
    }
  };


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
    
    // Enable diff view to show changes
    setShowDiff(true);
    
    // Switch to raw tab to show the changes
    setPreviewMode('raw');
    
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
  
  const selectResume = (resume: Resume) => {
    if (selectedResumes.some(r => r.id === resume.id)) {
      setSelectedResumes(prev => prev.filter(r => r.id !== resume.id));
    } else {
      setSelectedResumes(prev => [...prev, resume]);
    }
  };
  
  const selectTemplate = (template: Template) => {
    setSelectedTemplate(template);
    toast(`Template "${template.name}" selected`);
  };
  
  const handleGenerateResume = async () => {
    if (!selectedTemplate || (selectedResumes.length === 0 && !selectedResumeInfo) || !jobDescription.trim()) {
      toast("Please select a template, at least one resume or saved information, and provide a job description");
      return;
    }
    
    setIsGenerating(true);
    
    try {
      // Get the template's LaTeX content if not already loaded
      let templateWithLatex = selectedTemplate;
      if (!selectedTemplate.latex_content) {
        const { data, error } = await supabase
          .from('templates')
          .select('latex_content')
          .eq('id', selectedTemplate.id)
          .single();
          
        if (error) throw error;
        
        if (data) {
          templateWithLatex = {
            ...selectedTemplate,
            latex_content: data.latex_content
          };
        }
      }
      
      // Ensure all resume URLs are still valid
      const validResumes = await Promise.all(
        selectedResumes.map(async (resume) => {
          // ... URL validation logic
          return resume;
        })
      );
      
      // Create a customized resumeInfo with ONLY the selected components
      let customizedResumeInfo = null;
      if (selectedResumeInfo) {
        console.log('Selected Resume Info:', selectedResumeInfo);
        console.log('Selected Components:', selectedComponents);
        
        // Create a new object with only the selected components
        customizedResumeInfo = {
          personal_info: selectedComponents.personalInfo,
          // Only include the explicitly selected items
          work_experience: selectedComponents.workExperiences,
          education: selectedComponents.educations,
          projects: selectedComponents.projects,
          skills: selectedComponents.skills,
          links: selectedComponents.links
        };
        
        console.log('Customized Resume Info being sent to API:', customizedResumeInfo);
      }
      
      // Log the complete request payload
      console.log('API Request Payload:', {
        resumes: validResumes.length,
        templateId: templateWithLatex.id,
        jobDescriptionLength: jobDescription.length,
        hasResumeInfo: !!customizedResumeInfo,
        selectedComponentCounts: customizedResumeInfo ? {
          workExperienceCount: customizedResumeInfo.work_experience.length,
          educationCount: customizedResumeInfo.education.length,
          projectsCount: customizedResumeInfo.projects.length,
          skillsCount: customizedResumeInfo.skills.length,
          linksCount: customizedResumeInfo.links.length
        } : null
      });
      
      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resumes: validResumes,
          template: templateWithLatex,
          jobDescription,
          resumeInfo: customizedResumeInfo
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to generate customized resume');
      }
      
      const data = await response.json();
      setGeneratedLatex(data.modifiedLatex);
      setOriginalLatex(templateWithLatex.latex_content || '');
      toast.success("Resume template customized successfully!");
      
    } catch (error) {
      console.error('Error generating resume:', error);
      toast.error(error instanceof Error ? error.message : "Failed to customize resume template");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!generatedLatex) {
      toast.error("No LaTeX content to compile");
      return;
    }
    
    try {
      // Set loading state if needed
      const downloadToast = toast.loading("Compiling PDF...");
      
      // Send the LaTeX content to the backend
      const response = await fetch('http://localhost:5001/compile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          latex_content: generatedLatex
        }),
      });
      
      if (!response.ok) {
        // Try to get error details from response
        const errorData = await response.json().catch(() => ({}));
        toast.dismiss(downloadToast);
        
        // Display a more detailed error message
        if (errorData.error) {
          toast.error(`Compilation Error: ${errorData.error}`);
          console.error('LaTeX compilation details:', errorData.details || 'No details available');
        } else {
          toast.error('Failed to compile PDF');
        }
        return;
      }
      
      // Get the PDF as a blob
      const blob = await response.blob();
      
      // Create a URL for the blob
      const url = window.URL.createObjectURL(blob);
      
      // Create a temporary anchor element to trigger download
      const a = document.createElement('a');
      a.href = url;
      a.download = 'resume.pdf';
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.dismiss(downloadToast);
      toast.success("PDF downloaded successfully!");
      
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast.error(error instanceof Error ? error.message : "Failed to download PDF");
    }
  };


  return (
    <div className="flex min-h-screen bg-gray-50">
      <main className="flex-1 p-6 flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Resume Builder</h1>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-auto lg:h-[calc(100vh-150px)]">
          {/* Left side - Job Description and Selection */}
          <div className="flex flex-col space-y-4">
            <Card className="flex flex-col overflow-hidden">
              <CardContent className="flex-1 flex flex-col p-4">
                <JobDescriptionSection 
                  jobDescription={jobDescription}
                  setJobDescription={setJobDescription}
                />
                
                <div className="flex-1 overflow-hidden mt-4">
                  {/* Tabs for navigation */}
                  <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'resumes' | 'templates' | 'info')} className="h-full flex flex-col">
                    <TabsList className="w-full mb-2">
                      <TabsTrigger value="resumes" className="flex-1">Resumes</TabsTrigger>
                      <TabsTrigger value="templates" className="flex-1">Templates</TabsTrigger>
                      <TabsTrigger value="info" className="flex-1">My Info</TabsTrigger>
                    </TabsList>
                    
                    <div className="flex-1 overflow-hidden">
                      <ResumeSelector
                        activeTab={activeTab}
                        setActiveTab={setActiveTab}
                        uploadedResumes={uploadedResumes}
                        selectedResumes={selectedResumes}
                        isLoading={isLoading}
                        onSelectResume={selectResume}
                        onFileInput={handleFileInput}
                        visible={activeTab === 'resumes'}
                      />
                      
                      <TemplateSelector
                        templates={templates}
                        selectedTemplate={selectedTemplate}
                        onSelectTemplate={selectTemplate}
                        visible={activeTab === 'templates'}
                      />
                      
                      <ResumeInfoSelector
                        userId={userId}
                        resumeInfos={resumeInfos}
                        selectedResumeInfo={selectedResumeInfo}
                        selectedComponents={selectedComponents}
                        setSelectedResumeInfo={setSelectedResumeInfo}
                        setSelectedComponents={setSelectedComponents}
                        visible={activeTab === 'info'}
                      />
                    </div>
                  </Tabs>
                </div>
              </CardContent>
            </Card>
            
            {/* Generate button */}
            <Button 
              onClick={handleGenerateResume} 
              disabled={isGenerating || !selectedTemplate || (selectedResumes.length === 0 && !selectedResumeInfo) || !jobDescription.trim()}
              className="w-full py-6 mb-11"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Wand2 className="mr-2 h-5 w-5" />
                  Generate Customized Resume
                </>
              )}
            </Button>
          </div>
          
          {/* Right side - Preview and Download */}
          <div className="flex flex-col space-y-4">
          <GeneratedResumeView
              generatedLatex={generatedLatex}
              originalLatex={originalLatex}
              previewMode={previewMode}
              setPreviewMode={setPreviewMode}
              diffResult={diffResult}
              showDiff={showDiff}
              isCopied={isCopied}
              setIsCopied={setIsCopied}
              // Add ResumeAssistant props
              chatQuestion={chatQuestion}
              setChatQuestion={setChatQuestion}
              isChatLoading={isChatLoading}
              onChatSubmit={handleChatSubmit}
              onDownloadPDF={handleDownloadPDF}
            />
            
         
          </div>
        </div>
      </main>
    </div>
  );
}