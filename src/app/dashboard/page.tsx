"use client"
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import DashboardSidebar from '@/components/DashboardSidebar';
import { Button } from "@/components/ui/button";
import { Upload, FileText, Wand2, Loader2, LayoutTemplate ,  Eye, Code} from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { v4 as uuidv4 } from 'uuid';
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";

interface Resume {
  id: number | string;
  name: string;
  date: string;
  size: string;
  path?: string;
  url?: string;
}

interface Template {
  id: string;
  name: string;
  description: string;
  category: 'professional' | 'creative' | 'academic' | 'simple';
  preview_url: string;
  created_at: string;
  is_premium: boolean;
  latex_content?: string;
}

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
  const [activeTab, setActiveTab] = useState<'resumes' | 'templates'>('resumes');
  const [previewMode, setPreviewMode] = useState<'raw' | 'preview'>('raw');
  
  const supabase = createClient();
  
  useEffect(() => {
    fetchResumes();
    fetchTemplates();
  }, []);
  
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
    if (!selectedTemplate || selectedResumes.length === 0 || !jobDescription.trim()) {
      toast("Please select a template, at least one resume, and provide a job description");
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
      
      // Log what's being sent to Gemini
      console.log('Sending to Gemini API:', {
        resumeCount: validResumes.length,
        resumeNames: validResumes.map(r => r.name),
        templateName: templateWithLatex.name,
        jobDescriptionLength: jobDescription.length,
        templateContentLength: templateWithLatex.latex_content?.length || 0
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

  return (
    <div className="flex min-h-screen bg-gray-50">
      <DashboardSidebar />
      <main className="flex-1 p-6 flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Resume Builder</h1>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-[calc(100vh-150px)]">
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
                    className="min-h-[200px] resize-none"
                  />
                </div>
                
                <div className="flex-1 overflow-hidden flex flex-col">
                  <Tabs defaultValue={activeTab} onValueChange={(value) => setActiveTab(value as 'resumes' | 'templates')} className="flex-1 flex flex-col">
                    <TabsList className="w-full">
                      <TabsTrigger value="resumes" className="flex-1">Resumes</TabsTrigger>
                      <TabsTrigger value="templates" className="flex-1">Templates</TabsTrigger>
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
                  </Tabs>
                </div>
              </CardContent>
            </Card>
            
            {/* Generate button moved outside the card */}
            <Button 
              onClick={handleGenerateResume} 
              disabled={isGenerating || !selectedTemplate || selectedResumes.length === 0 || !jobDescription.trim()}
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
                    
                    <TabsContent value="raw" className="h-full">
                      <div className="h-full overflow-y-auto p-4" style={{ maxHeight: 'calc(100vh - 300px)' }}>
                        <pre className="text-xs whitespace-pre-wrap font-mono">
                          {generatedLatex}
                        </pre>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="preview" className="h-full">
                      <div className="h-full overflow-y-auto p-4" style={{ maxHeight: 'calc(100vh - 300px)' }}>
                        <div className="flex items-center justify-center h-full">
                         
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              )}
              
              {generatedLatex && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium">Resume customized for job description</p>
                      <p className="text-xs text-gray-500">
                        Using {selectedResumes.length} resume(s) and {selectedTemplate?.name} template
                      </p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        // Reset the generated content
                        setGeneratedLatex('');
                      }}
                    >
                      Generate New
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
