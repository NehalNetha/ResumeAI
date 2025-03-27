"use client"
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import DashboardSidebar from '@/components/DashboardSidebar';
import { Button } from "@/components/ui/button";
import { Upload, FileText, Wand2, Loader2, LayoutTemplate, Eye, Code, Clipboard, ClipboardCheck, User } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { v4 as uuidv4 } from 'uuid';
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
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

export default function Dashboard() {
  // Replace the single resume selection with an array
  const [uploadedResumes, setUploadedResumes] = useState<Resume[]>([]);
  const [selectedResumes, setSelectedResumes] = useState<Resume[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [jobDescription, setJobDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedLatex, setGeneratedLatex] = useState('');
  const [originalLatex, setOriginalLatex] = useState(''); // Store original LaTeX for diff
  const [activeTab, setActiveTab] = useState<'resumes' | 'templates' | 'info'>('resumes');  const [previewMode, setPreviewMode] = useState<'raw' | 'preview'>('raw'); // Keep original tabs
  const [chatQuestion, setChatQuestion] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [diffResult, setDiffResult] = useState<diffLib.Change[]>([]);
  const [showDiff, setShowDiff] = useState(false); 
  const [userId, setUserId] = useState<string | null>(null);
  const [resumeInfos, setResumeInfos] = useState<ResumeInfo[]>([]);
  const [selectedResumeInfo, setSelectedResumeInfo] = useState<ResumeInfo | null>(null);
  // New state for selected individual components
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
  // New state to toggle diff view
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
              
            // Extract original filename from the storage filename
            // Format is: {uuid}_{originalName}
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
  
  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
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
    // Check if the resume is already selected
    if (selectedResumes.some(r => r.id === resume.id)) {
      // If already selected, remove it
      setSelectedResumes(prev => prev.filter(r => r.id !== resume.id));
    } else {
      // If not selected, add it
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
      
      // Ensure all resume URLs are still valid (they expire after 24 hours)
      const validResumes = await Promise.all(
        selectedResumes.map(async (resume) => {
          if (!resume.url) return resume;
          
          try {
            // Check if URL is still valid with a HEAD request
            const urlCheck = await fetch(resume.url, { method: 'HEAD' });
            if (!urlCheck.ok) {
              // URL expired, get a new one
              console.log(`Resume URL for ${resume.name} expired, generating new signed URL`);
              const { data: urlData } = await supabase
                .storage
                .from('resumes')
                .createSignedUrl(resume.path || '', 60 * 60 * 24);
                
              if (urlData?.signedUrl) {
                return {
                  ...resume,
                  url: urlData.signedUrl
                };
              }
            }
            return resume;
          } catch (error) {
            console.error(`Error checking resume URL for ${resume.name}:`, error);
            return resume;
          }
        })
      );
      
      // Create a customized resumeInfo with only the selected components
      let customizedResumeInfo = null;
      if (selectedResumeInfo) {
        customizedResumeInfo = {
          ...selectedResumeInfo,
          personal_info: selectedComponents.personalInfo,
          work_experience: selectedComponents.workExperiences.length > 0 
            ? selectedComponents.workExperiences 
            : selectedResumeInfo.work_experience,
          education: selectedComponents.educations.length > 0 
            ? selectedComponents.educations 
            : selectedResumeInfo.education,
          projects: selectedComponents.projects.length > 0 
            ? selectedComponents.projects 
            : selectedResumeInfo.projects,
          skills: selectedComponents.skills.length > 0 
            ? selectedComponents.skills 
            : selectedResumeInfo.skills,
          links: selectedComponents.links.length > 0 
            ? selectedComponents.links 
            : selectedResumeInfo.links
        };
      }
      
      // Log what's being sent to Gemini
      console.log('Sending to Gemini API:', {
        resumeCount: validResumes.length,
        resumeNames: validResumes.map(r => r.name),
        templateName: templateWithLatex.name,
        jobDescriptionLength: jobDescription.length,
        templateContentLength: templateWithLatex.latex_content?.length || 0,
        hasResumeInfo: !!customizedResumeInfo,
        selectedComponents: {
          workExperiences: selectedComponents.workExperiences.length,
          educations: selectedComponents.educations.length,
          projects: selectedComponents.projects.length,
          skills: selectedComponents.skills.length,
          links: selectedComponents.links.length
        }
      });
      
      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resumes: validResumes, // Send all selected resumes
          template: templateWithLatex,
          jobDescription,
          resumeInfo: customizedResumeInfo // Include the customized resume info
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to generate customized resume');
      }
      
      const data = await response.json();
      
      // Log what's being received from Gemini
      console.log('Received from Gemini API:', {
        modifiedLatexLength: data.modifiedLatex?.length || 0,
        originalResponseLength: data.originalResponse?.length || 0
      });
      
      setGeneratedLatex(data.modifiedLatex);
      
      toast.success("Resume template customized successfully!");
      
    } catch (error) {
      console.error('Error generating resume:', error);
      toast.error(error instanceof Error ? error.message : "Failed to customize resume template");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyLatex = () => {
    if (generatedLatex) {
      navigator.clipboard.writeText(generatedLatex).then(() => {
        setIsCopied(true);
        toast.success("LaTeX copied to clipboard!");
        setTimeout(() => setIsCopied(false), 2000); // Reset after 2 seconds
      }).catch(err => {
        console.error('Failed to copy LaTeX:', err);
        toast.error("Failed to copy LaTeX");
      });
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
  
  // Fetch resume information from database
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
  

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };
  
  // Select resume info - modified to handle individual components
  const selectResumeInfo = (resumeInfo: ResumeInfo) => {
    if (selectedResumeInfo?.id === resumeInfo.id) {
      // If already selected, deselect it and clear all selected components
      setSelectedResumeInfo(null);
      setSelectedComponents({
        personalInfo: null,
        workExperiences: [],
        educations: [],
        projects: [],
        skills: [],
        links: []
      });
      toast(`Resume information "${resumeInfo.personal_info?.name || 'Untitled'}" deselected`);
    } else {
      // If not selected, select it but don't automatically select all components
      setSelectedResumeInfo(resumeInfo);
      // Initialize with personal info but leave other arrays empty for individual selection
      setSelectedComponents({
        personalInfo: resumeInfo.personal_info || null,
        workExperiences: [],
        educations: [],
        projects: [],
        skills: [],
        links: []
      });
      toast(`Resume information "${resumeInfo.personal_info?.name || 'Untitled'}" selected`);
    }
  };
  
  // New functions to toggle selection of individual components
  const toggleWorkExperience = (experience: WorkExperience) => {
    setSelectedComponents(prev => {
      const isSelected = prev.workExperiences.some(exp => exp.id === experience.id);
      return {
        ...prev,
        workExperiences: isSelected
          ? prev.workExperiences.filter(exp => exp.id !== experience.id)
          : [...prev.workExperiences, experience]
      };
    });
  };
  
  const toggleEducation = (education: Education) => {
    setSelectedComponents(prev => {
      const isSelected = prev.educations.some(edu => edu.id === education.id);
      return {
        ...prev,
        educations: isSelected
          ? prev.educations.filter(edu => edu.id !== education.id)
          : [...prev.educations, education]
      };
    });
  };
  
  const toggleProject = (project: Project) => {
    setSelectedComponents(prev => {
      const isSelected = prev.projects.some(proj => proj.id === project.id);
      return {
        ...prev,
        projects: isSelected
          ? prev.projects.filter(proj => proj.id !== project.id)
          : [...prev.projects, project]
      };
    });
  };
  
  const toggleSkill = (skill: Skill) => {
    setSelectedComponents(prev => {
      const isSelected = prev.skills.some(s => s.id === skill.id);
      return {
        ...prev,
        skills: isSelected
          ? prev.skills.filter(s => s.id !== skill.id)
          : [...prev.skills, skill]
      };
    });
  };
  
  const toggleLink = (link: Link) => {
    setSelectedComponents(prev => {
      const isSelected = prev.links.some(l => l.id === link.id);
      return {
        ...prev,
        links: isSelected
          ? prev.links.filter(l => l.id !== link.id)
          : [...prev.links, link]
      };
    });
  };
  
  
  
  
  

  return (
    <div className="flex min-h-screen bg-gray-50  ">
      <main className="flex-1 p-6 flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Resume Builder</h1>
        </div>
        
        {/* Change the grid layout to be more responsive for mobile */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-auto lg:h-[calc(100vh-150px)]">
          {/* Left side - Job Description and Selection */}
          <div className="flex flex-col space-y-4">
            <Card className="flex flex-col overflow-hidden">
              <CardContent className="flex-1 flex flex-col p-4">
                <div className="mb-4">
                  <Label htmlFor="job-description" className="text-lg font-medium mb-2 block">
                    Job Description
                  </Label>
                  <Textarea
                    id="job-description"
                    placeholder="Paste the job description here to tailor your resume..."
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    className="min-h-[150px] lg:min-h-[200px] resize-none"
                  />
                </div>
                
                <div className="flex-1 overflow-hidden flex flex-col">
                  <Tabs defaultValue={activeTab} onValueChange={(value) => setActiveTab(value as 'resumes' | 'templates' | 'info')} className="flex-1 flex flex-col">
                    <TabsList className="w-full">
                      <TabsTrigger value="resumes" className="flex-1">Resumes</TabsTrigger>
                      <TabsTrigger value="templates" className="flex-1">Templates</TabsTrigger>
                      <TabsTrigger value="info" className="flex-1">My Info</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="resumes" className="flex-1 overflow-y-auto">
                      {uploadedResumes.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                          <p>No resumes uploaded yet</p>
                          <label htmlFor="file-upload" className="cursor-pointer mt-4 inline-block">
                            <Button variant="outline" size="sm" className="gap-2">
                              <Upload className="h-4 w-4" />
                              Upload Resume
                            </Button>
                            <input
                              id="file-upload"
                              type="file"
                              className="hidden"
                              multiple
                              accept=".pdf,.doc,.docx"
                              onChange={handleFileInput}
                              disabled={isLoading}
                            />
                          </label>
                        </div>
                      ) : (
                        <>
                          <div className="grid grid-cols-1 gap-2 mt-2 max-h-[calc(100vh-450px)] overflow-y-auto">
                            {uploadedResumes.map((resume) => (
                              <div 
                                key={resume.id.toString()}
                                className={`border rounded p-3 cursor-pointer flex items-center ${
                                  selectedResumes.some(r => r.id === resume.id)
                                    ? 'border-blue-500 bg-blue-50' 
                                    : 'border-gray-200 hover:border-gray-300'
                                }`}
                                onClick={() => selectResume(resume)}
                              >
                                <div className="mr-3">
                                  <div className={`w-5 h-5 rounded border flex items-center justify-center ${
                                    selectedResumes.some(r => r.id === resume.id)
                                      ? 'bg-blue-500 border-blue-500' 
                                      : 'border-gray-300'
                                  }`}>
                                    {selectedResumes.some(r => r.id === resume.id) && (
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                      </svg>
                                    )}
                                  </div>
                                </div>
                                <FileText className="h-5 w-5 mr-3 text-blue-500" />
                                <div className="flex-1">
                                  <div className="font-medium truncate">{resume.name}</div>
                                  <div className="text-xs text-gray-500">
                                    {resume.date} • {resume.size}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                          
                          <div className="mt-4 flex justify-between items-center">
                            <div className="text-sm text-gray-500">
                              {selectedResumes.length} resume(s) selected
                            </div>
                            <label htmlFor="file-upload" className="cursor-pointer">
                              <Button variant="outline" size="sm" className="gap-2">
                                <Upload className="h-4 w-4" />
                                Upload New
                              </Button>
                              <input
                                id="file-upload"
                                type="file"
                                className="hidden"
                                multiple
                                accept=".pdf,.doc,.docx"
                                onChange={handleFileInput}
                                disabled={isLoading}
                              />
                            </label>
                          </div>
                        </>
                      )}
                    </TabsContent>
                    
                    <TabsContent value="templates" className="flex-1 overflow-y-auto">
                      {templates.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <LayoutTemplate className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                          <p>No templates available</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 gap-2 mt-2 max-h-[calc(100vh-450px)] overflow-y-auto">
                          {templates.map((template) => (
                            <div 
                              key={template.id}
                              className={`border rounded p-3 cursor-pointer flex items-center ${
                                selectedTemplate?.id === template.id 
                                  ? 'border-blue-500 bg-blue-50' 
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                              onClick={() => selectTemplate(template)}
                            >
                              <LayoutTemplate className="h-5 w-5 mr-3 text-blue-500" />
                              <div className="flex-1">
                                <div className="font-medium">{template.name}</div>
                                <div className="text-xs text-gray-500">
                                  {template.category} • {template.is_premium ? 'Premium' : 'Free'}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="info" className="flex-1 overflow-y-auto">
                      {!userId ? (
                        <div className="text-center py-8 text-gray-500">
                          <User className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                          <p>Please sign in to access your saved information</p>
                        </div>
                      ) : resumeInfos.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <User className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                          <p>No saved information found</p>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="mt-4"
                            onClick={() => window.location.href = '/dashboard/create-resume'}
                          >
                            Create Resume Information
                          </Button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 gap-2 mt-2 max-h-[calc(100vh-450px)] overflow-y-auto">
                          {resumeInfos.map((info) => (
                            <div 
                              key={info.id}
                              className={`border rounded p-3 cursor-pointer ${
                                selectedResumeInfo?.id === info.id 
                                  ? 'border-blue-500 bg-blue-50' 
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              <div 
                                className="flex items-center"
                                onClick={() => selectResumeInfo(info)}
                              >
                                <div className="mr-3">
                                  <div className={`w-5 h-5 rounded border flex items-center justify-center ${
                                    selectedResumeInfo?.id === info.id
                                      ? 'bg-blue-500 border-blue-500' 
                                      : 'border-gray-300'
                                  }`}>
                                    {selectedResumeInfo?.id === info.id && (
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                      </svg>
                                    )}
                                  </div>
                                </div>
                                <User className="h-5 w-5 mr-3 text-blue-500" />
                                <div className="flex-1">
                                  <div className="font-medium">
                                    {info.personal_info?.name || 'Untitled Resume'}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {info.personal_info?.title || 'No title'} • Updated {formatDate(info.updated_at)}
                                  </div>
                                </div>
                              </div>
                              
                              {selectedResumeInfo?.id === info.id && (
                                <div className="mt-3 text-xs text-gray-600 border-t pt-3">
                                  <div className="font-medium mb-2">Select specific information to include:</div>
                                  
                                  {/* Work Experience Selection */}
                                  <div className="mb-3">
                                    <div className="font-semibold mb-1">Work Experience:</div>
                                    {info.work_experience && info.work_experience.length > 0 ? (
                                      <div className="pl-2">
                                        {info.work_experience.map((exp) => (
                                          <div key={exp.id} className="flex items-center mb-1">
                                            <div 
                                              className={`w-4 h-4 rounded border mr-2 flex items-center justify-center cursor-pointer ${
                                                selectedComponents.workExperiences.some(e => e.id === exp.id)
                                                  ? 'bg-blue-500 border-blue-500' 
                                                  : 'border-gray-300'
                                              }`}
                                              onClick={() => toggleWorkExperience(exp)}
                                            >
                                              {selectedComponents.workExperiences.some(e => e.id === exp.id) && (
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" viewBox="0 0 20 20" fill="currentColor">
                                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                              )}
                                            </div>
                                            <span className="truncate">{exp.company} - {exp.title}</span>
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <div className="text-gray-400 pl-2">No work experience</div>
                                    )}
                                  </div>
                                  
                                  {/* Education Selection */}
                                  <div className="mb-3">
                                    <div className="font-semibold mb-1">Education:</div>
                                    {info.education && info.education.length > 0 ? (
                                      <div className="pl-2">
                                        {info.education.map((edu) => (
                                          <div key={edu.id} className="flex items-center mb-1">
                                            <div 
                                              className={`w-4 h-4 rounded border mr-2 flex items-center justify-center cursor-pointer ${
                                                selectedComponents.educations.some(e => e.id === edu.id)
                                                  ? 'bg-blue-500 border-blue-500' 
                                                  : 'border-gray-300'
                                              }`}
                                              onClick={() => toggleEducation(edu)}
                                            >
                                              {selectedComponents.educations.some(e => e.id === edu.id) && (
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" viewBox="0 0 20 20" fill="currentColor">
                                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                              )}
                                            </div>
                                            <span className="truncate">{edu.title} - {edu.company}</span>
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <div className="text-gray-400 pl-2">No education</div>
                                    )}
                                  </div>
                                  
                                  
                                  {/* Projects Selection */}
                                  <div className="mb-3">
                                    <div className="font-semibold mb-1">Projects:</div>
                                    {info.projects && info.projects.length > 0 ? (
                                      <div className="pl-2">
                                        {info.projects.map((project) => (
                                          <div key={project.id} className="flex items-center mb-1">
                                            <div 
                                              className={`w-4 h-4 rounded border mr-2 flex items-center justify-center cursor-pointer ${
                                                selectedComponents.projects.some(p => p.id === project.id)
                                                  ? 'bg-blue-500 border-blue-500' 
                                                  : 'border-gray-300'
                                              }`}
                                              onClick={() => toggleProject(project)}
                                            >
                                              {selectedComponents.projects.some(p => p.id === project.id) && (
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" viewBox="0 0 20 20" fill="currentColor">
                                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                              )}
                                            </div>
                                            <span className="truncate">{project.title}</span>
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <div className="text-gray-400 pl-2">No projects</div>
                                    )}
                                  </div>
                                  
                                  {/* Skills Selection */}
                                  <div className="mb-3">
                                    <div className="font-semibold mb-1">Skills:</div>
                                    {info.skills && info.skills.length > 0 ? (
                                      <div className="pl-2 flex flex-wrap gap-1">
                                        {info.skills.map((skill) => (
                                          <div 
                                            key={skill.id}
                                            className={`px-2 py-1 rounded-full text-xs cursor-pointer ${
                                              selectedComponents.skills.some(s => s.id === skill.id)
                                                ? 'bg-blue-100 text-blue-800 border border-blue-300' 
                                                : 'bg-gray-100 text-gray-800 border border-gray-200'
                                            }`}
                                            onClick={() => toggleSkill(skill)}
                                          >
                                            {skill.name}
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <div className="text-gray-400 pl-2">No skills</div>
                                    )}
                                  </div>
                                  
                                  {/* Links Selection */}
                                  <div className="mb-1">
                                    <div className="font-semibold mb-1">Links:</div>
                                    {info.links && info.links.length > 0 ? (
                                      <div className="pl-2">
                                        {info.links.map((link) => (
                                          <div key={link.id} className="flex items-center mb-1">
                                            <div 
                                              className={`w-4 h-4 rounded border mr-2 flex items-center justify-center cursor-pointer ${
                                                selectedComponents.links.some(l => l.id === link.id)
                                                  ? 'bg-blue-500 border-blue-500' 
                                                  : 'border-gray-300'
                                              }`}
                                              onClick={() => toggleLink(link)}
                                            >
                                              {selectedComponents.links.some(l => l.id === link.id) && (
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" viewBox="0 0 20 20" fill="currentColor">
                                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                              )}
                                            </div>
                                            <span className="truncate">{link.name}: {link.url}</span>
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <div className="text-gray-400 pl-2">No links</div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </TabsContent>


                  </Tabs>
                </div>
              </CardContent>
            </Card>
            
            {/* Generate button moved outside the card */}
            <Button 
              onClick={handleGenerateResume} 
              disabled={isGenerating || !selectedTemplate || (selectedResumes.length === 0 && !selectedResumeInfo) || !jobDescription.trim()}
              className="w-full py-6  mb-11"
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
          <Card className="flex flex-col overflow-hidden">
            <CardContent className="flex-1 flex flex-col p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium">Generated Resume</h2>
                {generatedLatex && (
                  <Button variant="outline" size="sm" className="gap-2">
                    <FileText className="h-4 w-4" />
                    Download PDF
                  </Button>
                )}
              </div>
              
              {!generatedLatex ? (
                <div className="flex-1 flex items-center justify-center text-center p-6 border-2 border-dashed border-gray-200 rounded-lg">
                  <div>
                    <Wand2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Resume Generated Yet</h3>
                    <p className="text-gray-500 max-w-md">
                      Select a resume template, upload your resume, and provide a job description to generate a customized resume.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex-1 overflow-hidden bg-white border border-gray-200 rounded-lg">
                  <Tabs value={previewMode} onValueChange={(value) => setPreviewMode(value as 'raw' | 'preview')} className="w-full">
                    <TabsList className="w-full mb-2">
                      <TabsTrigger value="raw" className="flex-1 gap-2">
                        <Code className="h-4 w-4" />
                        Raw LaTeX
                      </TabsTrigger>
                      <TabsTrigger value="preview" className="flex-1 gap-2">
                        <Eye className="h-4 w-4" />
                        Preview
                      </TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="raw" className="h-full relative">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCopyLatex}
                        className="absolute top-0 right-8 z-10 gap-1"
                      >
                        {isCopied ? (
                          <>
                            <ClipboardCheck />
                            Copied!
                          </>
                        ) : (
                          <>
                           <Clipboard />
                            Copy
                          </>
                        )}
                      </Button>
                      <div className="h-full overflow-y-auto p-4 pt-10" style={{ maxHeight: 'calc(100vh - 300px)' }}>
                        {renderRawLatex()}
                      </div>
                    </TabsContent>

                    <TabsContent value="preview" className="h-full">
                      <div className="h-full overflow-y-auto p-4" style={{ maxHeight: 'calc(100vh - 300px)' }}>
                        <div className="flex items-center justify-center h-full">
                         
                        </div>
                      </div>
                    </TabsContent>
                    
                    {/* New diff tab content */}
                    <TabsContent value="diff" className="h-full">
                      <div className="h-full overflow-y-auto p-4" style={{ maxHeight: 'calc(100vh - 300px)' }}>
                        {renderDiff()}
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              )}
              
             
              
              {/* Chat box UI */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <h3 className="text-sm font-medium mb-2">Resume Assistant</h3>
                
                <div className="flex items-center">
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
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

// Render the raw LaTeX with or without diff highlighting
