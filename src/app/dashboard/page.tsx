"use client"
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wand2, Loader2, RefreshCw, CreditCard } from 'lucide-react';
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
import TemplateSelector from '@/components/dashboard-comp/TemplateSelector';
import GeneratedResumeView from '@/components/dashboard-comp/GeneratedResumeView';
import ResumeAssistant from '@/components/dashboard-comp/ResumeAssistant';
import ResumeInfoSelector from '@/components/dashboard-comp/ResumeInfoSelector';
import ResumeSelector from '@/components/dashboard-comp/ResumeSelector';
import { fetchUserCredits, updateUserCredits } from '@/utils/credits/credits';
import { downloadPdf, generatePdfPreview } from '@/utils/pdfGeneration/pdfUtil';
import PricingToast from '@/components/PricingToast';
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
  const [selectedChatResume, setSelectedChatResume] = useState<Resume | null>(null);
  // Add credit state
  const [userCredits, setUserCredits] = useState<number>(0);
  const [isLoadingCredits, setIsLoadingCredits] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const supabase = createClient();
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedJobDescription = sessionStorage.getItem('jobDescription');
      const storedSelectedTemplate = sessionStorage.getItem('selectedTemplate');
      const storedSelectedResumes = sessionStorage.getItem('selectedResumes');
      const storedGeneratedLatex = sessionStorage.getItem('generatedLatex');
      const storedOriginalLatex = sessionStorage.getItem('originalLatex');
      const storedActiveTab = sessionStorage.getItem('activeTab');
      const storedSelectedResumeInfo = sessionStorage.getItem('selectedResumeInfo');
      const storedSelectedComponents = sessionStorage.getItem('selectedComponents');
      
      // Set state from session storage if available
      if (storedJobDescription) setJobDescription(storedJobDescription);
      if (storedSelectedTemplate) setSelectedTemplate(JSON.parse(storedSelectedTemplate));
      if (storedSelectedResumes) setSelectedResumes(JSON.parse(storedSelectedResumes));
      if (storedGeneratedLatex) setGeneratedLatex(storedGeneratedLatex);
      if (storedOriginalLatex) setOriginalLatex(storedOriginalLatex);
      if (storedActiveTab) setActiveTab(storedActiveTab as 'resumes' | 'templates' | 'info');
      if (storedSelectedResumeInfo) setSelectedResumeInfo(JSON.parse(storedSelectedResumeInfo));
      if (storedSelectedComponents) setSelectedComponents(JSON.parse(storedSelectedComponents));
    }
    
    fetchResumes();
    fetchTemplates();
    fetchUserId();
    
  }, []);


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
  
  // Save data to session storage when it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('jobDescription', jobDescription);
      
      if (selectedTemplate) {
        sessionStorage.setItem('selectedTemplate', JSON.stringify(selectedTemplate));
      }
      
      if (selectedResumes.length > 0) {
        sessionStorage.setItem('selectedResumes', JSON.stringify(selectedResumes));
      }
      
      if (generatedLatex) {
        sessionStorage.setItem('generatedLatex', generatedLatex);
      }
      
      if (originalLatex) {
        sessionStorage.setItem('originalLatex', originalLatex);
      }
      
      sessionStorage.setItem('activeTab', activeTab);
      
      if (selectedResumeInfo) {
        sessionStorage.setItem('selectedResumeInfo', JSON.stringify(selectedResumeInfo));
      }
      
      sessionStorage.setItem('selectedComponents', JSON.stringify(selectedComponents));
    }
  }, [
    jobDescription, 
    selectedTemplate, 
    selectedResumes, 
    generatedLatex, 
    originalLatex, 
    activeTab,
    selectedResumeInfo,
    selectedComponents
  ]);
  
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
      
      // First get the current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("User not authenticated");
      }
      
      // List files in the user's folder
      const { data, error } = await supabase
        .storage
        .from("resumes")
        .list(`${user.id}`); // List only files in the user's folder
        
      if (error) {
        throw error;
      }
      
      if (data) {
        const resumeFiles = await Promise.all(
          data.map(async (file) => {
            const { data: urlData } = await supabase
              .storage
              .from('resumes')
              .createSignedUrl(`${user.id}/${file.name}`, 60 * 60 * 24);
              
            const originalName = file.name.includes('_') 
              ? file.name.substring(file.name.indexOf('_') + 1) 
              : file.name;
              
            return {
              id: file.id,
              name: originalName,
              date: new Date(file.created_at).toISOString().split('T')[0],
              size: `${(file.metadata.size / (1024 * 1024)).toFixed(1)} MB`,
              path: `${user.id}/${file.name}`, // Include user ID in path
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
        loadUserCredits(user.id) // Add this line to fetch credits
      }
    } catch (error) {
      console.error('Error fetching user:', error);
    }
  };
  
  // Add a function to fetch user credits

  
  // Add a function to update user credits
 
  
 
  const handleGenerateResume = async () => {
    if (!selectedTemplate || (selectedResumes.length === 0 && !selectedResumeInfo) || !jobDescription.trim()) {
      toast("Please select a template, at least one resume or saved information, and provide a job description");
      return;
    }
  
    if (userCredits < 5) {
      toast.error(
        <PricingToast credits={5} />
      );
      return;
    }
    
    setIsGenerating(true);
    setGeneratedLatex(''); // Clear previous result immediately
    // Ensure selectedTemplate and its content exist before setting originalLatex
    if (selectedTemplate?.latex_content) {
        setOriginalLatex(selectedTemplate.latex_content);
        // Store original latex in session storage immediately
         if (typeof window !== 'undefined') {
            sessionStorage.setItem('originalLatex', selectedTemplate.latex_content);
            sessionStorage.removeItem('generatedLatex'); // Remove old generated content
         }
    } else {
        setOriginalLatex(''); // Clear original if template content is missing
        if (typeof window !== 'undefined') {
            sessionStorage.removeItem('originalLatex');
            sessionStorage.removeItem('generatedLatex');
        }
    }
  
    setShowDiff(false); // Hide diff view during generation
    setPreviewMode('raw'); // Switch to raw view
  
    let generationSuccessful = false; // Flag to track successful completion
  
    try {
      let templateWithLatex = selectedTemplate;
      // Fetch template content if missing (if it wasn't loaded initially or selected from a list without content)
      if (!templateWithLatex?.latex_content) {
        const { data, error } = await supabase
          .from('templates')
          .select('latex_content')
          .eq('id', selectedTemplate!.id) // Use non-null assertion as selectedTemplate check happened above
          .single();
  
        if (error) throw error;
  
        if (data && data.latex_content) {
          templateWithLatex = {
            ...selectedTemplate!, // Use non-null assertion
            latex_content: data.latex_content
          };
           // Update originalLatex and session storage again if it was fetched now
           setOriginalLatex(data.latex_content);
           if (typeof window !== 'undefined') {
             sessionStorage.setItem('originalLatex', data.latex_content);
           }
  
        } else {
            throw new Error("Selected template content could not be loaded.");
        }
      } else {
        // If content already exists, ensure originalLatex is set correctly
        setOriginalLatex(templateWithLatex.latex_content);
      }
  
  
      // Create a customized resumeInfo with the selected components
      let customizedResumeInfo = null;
      if (selectedResumeInfo) {
        customizedResumeInfo = {
          personal_info: selectedComponents.personalInfo,
          work_experience: selectedComponents.workExperiences,
          education: selectedComponents.educations,
          projects: selectedComponents.projects,
          skills: selectedComponents.skills,
          links: selectedComponents.links
        };
      }
  
      console.log('Sending request to /api/gemini with:', {
        resumesCount: selectedResumes.length,
        templateId: templateWithLatex?.id,
        jobDescriptionLength: jobDescription.length,
        hasResumeInfo: !!customizedResumeInfo,
        resumeInfo: customizedResumeInfo // Now this will show the actual data
      });

      // Prepare the request body
      const requestBody = {
        template: templateWithLatex,
        jobDescription,
        resumes: selectedResumes.map(resume => ({
          name: resume.name,
          url: resume.url
        })),
        resumeInfo: selectedResumeInfo ? {
          personal_info: selectedComponents.personalInfo,
          work_experience: selectedComponents.workExperiences,
          education: selectedComponents.educations,
          projects: selectedComponents.projects,
          skills: selectedComponents.skills,
          links: selectedComponents.links
        } : undefined
      };

      // Modified section: Handle non-streaming response
      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate resume');
      }

      // Parse the JSON response
      const data = await response.json();
      
      if (data.latex) {
        setGeneratedLatex(data.latex);
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('generatedLatex', data.latex);
        }
        generationSuccessful = true;
      } else {
        throw new Error('No LaTeX content received');
      }

      // Deduct credits *after* successful stream completion
      if (userId) {
        await updateUserCredits(userId, 5, "resume generation");
        // Update local credit count after deduction
        setUserCredits(prev => Math.max(0, prev - 5));
      }
  
      generationSuccessful = true; // Mark as successful
      toast.success("Resume template customized successfully! (5 credits used)");
  
    } catch (error) {
      console.error('Error generating resume:', error);
      toast.error(error instanceof Error ? error.message : "Failed to customize resume template");
      // Clear partial results on error
      setGeneratedLatex('');
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('generatedLatex');
      }
    } finally {
      setIsGenerating(false);
      // Optional: Store the fully generated latex only if successful
      if (generationSuccessful && typeof window !== 'undefined') {
        // Get the final state value directly
        setGeneratedLatex(currentLatex => {
          sessionStorage.setItem('generatedLatex', currentLatex);
          return currentLatex; // Return the current state value without changing it
        });
      }
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

      console.log('Resume information fetched:', data); // Log the fetched data for inspection
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
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("User not authenticated");
      }
      
      const newResumes: Resume[] = [];
      
      for (const file of files) {
        // Create a UUID filename for storage but keep original name
        const fileExt = file.name.split('.').pop();
        const originalName = file.name;
        const storageFileName = `${uuidv4()}_${originalName}`;
        const filePath = `${user.id}/${storageFileName}`; // Store in user-specific folder
        
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


  const handleSaveResume = async () => {
    if (!generatedLatex || !selectedTemplate) {
      toast.error("No resume to save");
      return;
    }
    
    setIsSaving(true);
    
    try {
      // Generate PDF blob using our utility function
      const pdfUrl = await generatePdfPreview(generatedLatex);
      
      if (!pdfUrl) {
        throw new Error('Failed to generate PDF preview');
      }
      
      // Convert the URL to a blob
      const response = await fetch(pdfUrl);
      const pdfBlob = await response.blob();
      
      // Create a filename for the saved resume
      const timestamp = new Date().toISOString();
      const fileName = `resume_${timestamp.replace(/[:.]/g, '-')}.pdf`;
      
      // Upload PDF to Supabase Storage
      const { data: storageData, error: storageError } = await supabase
        .storage
        .from('created-resumes')
        .upload(`${userId}/${fileName}`, pdfBlob);
        
      if (storageError) {
        throw storageError;
      }
      
      // Get the public URL for the uploaded file
      const { data: publicUrlData } = supabase
        .storage
        .from('created-resumes')
        .getPublicUrl(`${userId}/${fileName}`);
      
      // Save metadata to the database
      const { data, error } = await supabase
        .from('saved_resumes')
        .insert([
          {
            user_id: userId,
            name: `Resume - ${new Date().toLocaleDateString()}`,
            template_id: selectedTemplate.id,
            latex_content: generatedLatex,
            pdf_path: `${userId}/${fileName}`,
            pdf_url: publicUrlData.publicUrl,
            job_description: jobDescription,
            created_at: timestamp
          }
        ]);
        
      if (error) throw error;
      
      // Clean up the URL object
      window.URL.revokeObjectURL(pdfUrl);
      
      toast.success("Resume saved successfully!");
      
    } catch (error) {
      console.error('Error saving resume:', error);
      toast.error(error instanceof Error ? error.message : "Failed to save resume");
    } finally {
      setIsSaving(false);
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
        selectedResume: selectedChatResume, // Pass the selected resume
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

    if(userId) {
      await updateUserCredits(userId, 3, "resume customization dashboard");
    }
    
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
  };


  // Add the PDF download handler function
  const handleDownloadPDF = async () => {
    if (!generatedLatex) {
      toast.error("No LaTeX content to compile");
      return;
    }
    
    await downloadPdf(generatedLatex);

    if (userId) {
      await updateUserCredits(userId, 5, "resume download dashboard");
      setUserCredits(prev => Math.max(0, prev - 5));
    }
  };
  

  // Add a function to handle clearing selections and generated resume
const handleClearAll = () => {
  // Clear selections
  setSelectedResumes([]);
  setSelectedTemplate(null);
  setSelectedResumeInfo(null);
  setSelectedComponents({
    personalInfo: null,
    workExperiences: [],
    educations: [],
    projects: [],
    skills: [],
    links: []
  });
  
  // Clear generated content
  setGeneratedLatex('');
  setOriginalLatex('');
  setShowDiff(false);
  setChatQuestion('');
  setSelectedChatResume(null);
  
  // Reset to default tabs
  setActiveTab('resumes');
  setPreviewMode('raw');
  
  // Show confirmation toast
  toast.success("All selections and generated content cleared");
};

 
  const handleSelectResumeForChat = (resume: Resume) => {
    setSelectedChatResume(resume);
  };


  
  return (
    <div className="flex min-h-screen bg-gray-50">
      <main className="flex-1 p-6 flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Resume Builder</h1>
          
          <div className="flex items-center gap-4">
            {/* Credits display */}
            <div className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-medium flex items-center">
              <CreditCard className="h-4 w-4 mr-1" />
              {isLoadingCredits ? (
                <span className="flex items-center">
                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                  Loading...
                </span>
              ) : (
                <span>{userCredits} credits</span>
              )}
            </div>
            
            {/* Clear All button */}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleClearAll}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Clear All
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-auto lg:h-[calc(100vh-50px)]">
          {/* Left side - Job Description and Selection */}
          <div className="flex flex-col space-y-4">
            <Card className="flex flex-col overflow-hidden h-full"> {/* Added h-full */}
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

                    {/* Use TabsContent for each tab */}
                    <TabsContent value="resumes" className="flex-1 overflow-y-auto mt-0"> {/* Adjust styling as needed */}
                      <ResumeSelector
                        activeTab={activeTab} // Keep for now, might remove later if not needed internally
                        setActiveTab={setActiveTab} // Keep for now
                        uploadedResumes={uploadedResumes}
                        selectedResumes={selectedResumes}
                        isLoading={isLoading}
                        onSelectResume={selectResume}
                        onFileInput={handleFileInput}
                        visible={activeTab === 'resumes'} // Keep for now, or remove if ResumeSelector relies only on being mounted
                      />
                    </TabsContent>

                    <TabsContent value="templates" className="flex-1 overflow-y-auto mt-0 h-full"> {/* Adjust styling as needed */}
                       {/* Removed the extra div with h-full */}
                        <TemplateSelector
                          templates={templates}
                          selectedTemplate={selectedTemplate}
                          onSelectTemplate={selectTemplate}
                          visible={activeTab === 'templates'} // Keep for now
                        />
                    </TabsContent>

                    <TabsContent value="info" className="flex-1 overflow-y-auto mt-0"> {/* Adjust styling as needed */}
                      <ResumeInfoSelector
                        userId={userId}
                        resumeInfos={resumeInfos}
                        selectedResumeInfo={selectedResumeInfo}
                        selectedComponents={selectedComponents}
                        setSelectedResumeInfo={setSelectedResumeInfo}
                        setSelectedComponents={setSelectedComponents}
                        visible={activeTab === 'info'} // Keep for now
                      />
                    </TabsContent>
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
                  Generate Customized Resume (5 credits)
                </>
              )}
            </Button>
          </div>
          
          {/* Right side - Preview and Download */}
          <div className="h-full">
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
              // Add new props for resume selection
              uploadedResumes={uploadedResumes}
              onSelectResumeForChat={handleSelectResumeForChat}
              onSaveResume={handleSaveResume}
              isSaving={isSaving}
            />
            
         
          </div>
        </div>
      </main>
    </div>
  );
}

