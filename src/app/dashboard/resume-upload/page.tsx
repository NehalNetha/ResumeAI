"use client"

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import DashboardSidebar from '@/components/DashboardSidebar';
import { Button } from "@/components/ui/button";
import { Upload, FileText, FileType, Trash2, Eye, Download } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { v4 as uuidv4 } from 'uuid';
import { toast } from "sonner"

interface Resume {
  id: number | string;
  name: string;
  date: string;
  size: string;
  thumbnail: string;
  path?: string;
  url?: string;
}

export default function ResumeUpload() {
  const [uploadedResumes, setUploadedResumes] = useState<Resume[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const supabase = createClient();
  
  // Fetch existing resumes on component mount
  useEffect(() => {
    fetchResumes();
  }, []);
  
  // Add this function to create a bucket if it doesn't exist
 
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };
  
  const handleDragLeave = () => {
    setIsDragging(false);
  };
  
  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      await uploadFiles(files);
    }
  };
  
  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length > 0) {
      await uploadFiles(files);
    }
  };
  
  // When uploading files to Supabase
  const uploadFiles = async (files: File[]) => {
    setIsLoading(true);
    
    try {
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("User not authenticated");
      }
      
      for (const file of files) {
        // Generate a unique filename to prevent overwriting
        const fileExt = file.name.split('.').pop();
        const originalName = file.name;
        const fileName = `${uuidv4()}_${originalName}`;
        const filePath = `${user.id}/${fileName}`; // Store in user-specific folder
        
        // Upload file to Supabase using the 'resumes' bucket directly
        const { error: uploadError } = await supabase
          .storage
          .from('resumes')
          .upload(filePath, file);
          
        if (uploadError) {
          console.error('Upload error:', uploadError);
          // If bucket doesn't exist, inform the user
          if (uploadError.message.includes('bucket not found')) {
            toast("Error: The resumes storage bucket doesn't exist. Please contact an administrator.");
            break;
          }
          throw uploadError;
        }
        
        // Get the URL for the uploaded file
        const { data: urlData } = await supabase
          .storage
          .from('resumes')
          .createSignedUrl(filePath, 60 * 60 * 24); // 24 hour expiry
          
        // Add the new resume to state
        const newResume: Resume = {
          id: Date.now(),
          name: originalName, // Use original name for display
          date: new Date().toISOString().split('T')[0],
          size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
          thumbnail: "", // We'll use icons instead of thumbnails
          path: filePath,
          url: urlData?.signedUrl
        };
        
        setUploadedResumes(prev => [...prev, newResume]);
      }
      
      toast("Success Resume(s) uploaded successfully");
    } catch (error) {
      console.error('Error uploading file:', error);
      toast("Error Failed to upload resume destructive");
    } finally {
      setIsLoading(false);
    }
  };

// Also update the fetchResumes function to use the correct bucket name
const fetchResumes = async () => {
  try {
    setIsLoading(true);
    
    // First get the current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error("User not authenticated");
    }
    
    // Use the correct bucket name
    const bucketName = 'resumes';
    
    // List files in the user's folder
    const { data, error } = await supabase
      .storage
      .from(bucketName)
      .list(`${user.id}`); // List only files in the user's folder
      
    if (error) {
      throw error;
    }
    
    if (data) {
      const resumeFiles = await Promise.all(
        data.map(async (file) => {
          const { data: urlData } = await supabase
            .storage
            .from(bucketName)
            .createSignedUrl(`${user.id}/${file.name}`, 60 * 60 * 24);
          
          // Extract original filename from the storage filename
          // Format is: {uuid}_{originalName}
          const originalName = file.name.includes('_') 
            ? file.name.substring(file.name.indexOf('_') + 1) 
            : file.name;
            
          return {
            id: file.id,
            name: originalName, // Use the extracted original name
            date: new Date(file.created_at).toISOString().split('T')[0],
            size: `${(file.metadata.size / (1024 * 1024)).toFixed(1)} MB`,
            thumbnail: "", // We'll use icons instead of thumbnails
            path: `${user.id}/${file.name}`, // Include user ID in path
            url: urlData?.signedUrl
          };
        })
      );
      
      setUploadedResumes(resumeFiles);
    }
  } catch (error) {
    console.error('Error fetching resumes:', error);
    toast(
      "Error Failed to load resumes destructive"
    );
  } finally {
    setIsLoading(false);
  }
};

// Also update the deleteResume function
const deleteResume = async (id: number | string, path?: string) => {
  if (!path) return;
  
  try {
    setIsLoading(true);
    
    // Delete from Supabase storage using 'resumes' bucket directly
    const { error } = await supabase
      .storage
      .from('resumes')
      .remove([path]);
      
    if (error) {
      throw error;
    }
    
    // Remove from state
    setUploadedResumes(uploadedResumes.filter(resume => resume.id !== id));
    
    toast("Success Resume deleted successfully");
  } catch (error) {
    console.error('Error deleting resume:', error);
    toast("Error Failed to delete resume destructive");
  } finally {
    setIsLoading(false);
  }
};
  
  const viewResume = (url?: string) => {
    if (url) {
      window.open(url, '_blank');
    }
  };
  
  const downloadResume = (url?: string, name?: string) => {
    if (url) {
      const link = document.createElement('a');
      link.href = url;
      link.download = name || 'resume';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50 ">
      <main className="flex-1 p-6">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Resume Upload</h1>
            <label htmlFor="resume-upload">
              <Button className="bg-blue-500 hover:bg-blue-600" disabled={isLoading}>
                <Upload className="mr-2 h-4 w-4" />
                {isLoading ? 'Uploading...' : 'Upload New'}
              </Button>
            </label>
          </div>
          
          {/* Upload Area */}
          <div 
            className={`border-2 border-dashed rounded-lg p-8 text-center ${
              isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input 
              type="file" 
              id="resume-upload" 
              className="hidden" 
              multiple 
              accept=".pdf,.doc,.docx" 
              onChange={handleFileInput}
              disabled={isLoading}
            />
            <label htmlFor="resume-upload" className="cursor-pointer">
              <div className="mx-auto w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                <Upload className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-medium mb-2">Upload Resume for Reference</h3>
              <p className="text-gray-500 mb-4">Drag and drop your resume files here, or click to browse</p>
              
            </label>
          </div>
          
          {/* Uploaded Resumes */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Uploaded Resumes</h2>
            {isLoading && uploadedResumes.length === 0 ? (
              <div className="text-center py-10">Loading resumes...</div>
            ) : uploadedResumes.length === 0 ? (
              <div className="text-center py-10 text-gray-500">No resumes uploaded yet</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {uploadedResumes.map((resume) => (
                  <Card key={resume.id} className="group relative">
                    <CardContent className="p-4">
                      <div className="space-y-4">
                        {/* File info section */}
                        <div className="flex items-center gap-3">
                          {resume.name.toLowerCase().endsWith('.pdf') ? (
                            <FileText className="h-8 w-8 text-red-500 flex-shrink-0" />
                          ) : resume.name.toLowerCase().endsWith('.doc') || resume.name.toLowerCase().endsWith('.docx') ? (
                            <FileText className="h-8 w-8 text-blue-500 flex-shrink-0" />
                          ) : (
                            <FileType className="h-8 w-8 text-gray-500 flex-shrink-0" />
                          )}
                          <div className="min-w-0 flex-1">
                            <h3 className="text-sm font-medium truncate" title={resume.name}>
                              {resume.name}
                            </h3>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <span>{resume.date}</span>
                              <span>•</span>
                              <span>{resume.size}</span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Actions section */}
                        <div className="flex flex-wrap items-center gap-2">
                          {resume.name.toLowerCase().endsWith('.pdf') && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => viewResume(resume.url)}
                              className="flex-1 min-w-[100px]"
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => downloadResume(resume.url, resume.name)}
                            className="flex-1 min-w-[100px]"
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteResume(resume.id, resume.path)}
                            className="flex-1 min-w-[100px] text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}