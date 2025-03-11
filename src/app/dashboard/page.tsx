"use client"

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import DashboardSidebar from '@/components/DashboardSidebar';
import { Button } from "@/components/ui/button";
import { Upload, FileText, Send, PaperclipIcon } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { v4 as uuidv4 } from 'uuid';
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";

interface Resume {
  id: number | string;
  name: string;
  date: string;
  size: string;
  path?: string;
  url?: string;
}

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  attachments?: Resume[];
}

export default function Dashboard() {
  const [uploadedResumes, setUploadedResumes] = useState<Resume[]>([]);
  const [selectedResumes, setSelectedResumes] = useState<Resume[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showFileSelector, setShowFileSelector] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();
  
  useEffect(() => {
    fetchResumes();
  }, []);
  
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
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
      setSelectedResumes(prev => [...prev, ...newResumes]);
      toast("Success: Resume(s) uploaded successfully");
    } catch (error) {
      console.error('Error uploading file:', error);
      toast("Error: Failed to upload resume");
    } finally {
      setIsLoading(false);
    }
  };
  
  const toggleResumeSelection = (resume: Resume) => {
    if (selectedResumes.some(r => r.id === resume.id)) {
      setSelectedResumes(selectedResumes.filter(r => r.id !== resume.id));
    } else {
      setSelectedResumes([...selectedResumes, resume]);
    }
  };
  
  const sendMessage = async () => {
    if (!inputMessage.trim() && selectedResumes.length === 0) return;
    
    // Add user message to chat
    const userMessage: Message = {
      id: uuidv4(),
      content: inputMessage,
      sender: 'user',
      timestamp: new Date(),
      attachments: selectedResumes.length > 0 ? [...selectedResumes] : undefined
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setSelectedResumes([]);
    setShowFileSelector(false);
    
    // Simulate AI response (in a real app, you'd call your backend/API here)
    setIsLoading(true);
    
    setTimeout(() => {
      const aiMessage: Message = {
        id: uuidv4(),
        content: "I've received your message and will process your resume(s). What would you like me to help you with?",
        sender: 'ai',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiMessage]);
      setIsLoading(false);
    }, 1500);
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <DashboardSidebar />
      <main className="flex-1 p-6 flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Resume Assistant</h1>
        </div>
        
        <Card className="flex-1 flex flex-col overflow-hidden">
          <CardContent className="flex-1 flex flex-col p-0">
            {/* Chat messages area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="h-full flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium mb-2">Welcome to Resume Assistant</h3>
                    <p className="max-w-md">
                      Upload your resume or select from your files to get started. 
                      I can help you improve your resume, create cover letters, or prepare for interviews.
                    </p>
                  </div>
                </div>
              ) : (
                messages.map((message) => (
                  <div 
                    key={message.id} 
                    className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div 
                      className={`max-w-[80%] rounded-lg p-4 ${
                        message.sender === 'user' 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-gray-200 text-gray-800'
                      }`}
                    >
                      <div className="whitespace-pre-wrap">{message.content}</div>
                      
                      {message.attachments && message.attachments.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-gray-300 border-opacity-30">
                          <p className="text-sm mb-1">Attached files:</p>
                          <div className="flex flex-wrap gap-2">
                            {message.attachments.map(file => (
                              <div 
                                key={file.id.toString()} 
                                className="text-xs px-2 py-1 rounded bg-opacity-20 bg-gray-700 flex items-center"
                              >
                                <FileText className="h-3 w-3 mr-1" />
                                <span className="truncate max-w-[150px]">{file.name}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <div className="text-xs mt-1 opacity-70">
                        {message.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
            
            {/* File selector area */}
            {showFileSelector && (
              <div className="border-t border-gray-200 max-h-[200px] overflow-y-auto p-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-medium">Select Files</h3>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setShowFileSelector(false)}
                  >
                    Close
                  </Button>
                </div>
                
                {uploadedResumes.length === 0 ? (
                  <div className="text-center py-4 text-gray-500">
                    No resumes uploaded yet
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {uploadedResumes.map((resume) => (
                      <div 
                        key={resume.id.toString()}
                        className={`border rounded p-2 cursor-pointer flex items-center ${
                          selectedResumes.some(r => r.id === resume.id) 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'border-gray-200'
                        }`}
                        onClick={() => toggleResumeSelection(resume)}
                      >
                        <FileText className="h-4 w-4 mr-2 text-blue-500" />
                        <div className="truncate text-sm">{resume.name}</div>
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="mt-3 flex justify-center">
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
              </div>
            )}
            
            {/* Input area */}
            <div className="border-t border-gray-200 p-4">
              <div className="flex items-end gap-2">
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  onClick={() => setShowFileSelector(!showFileSelector)}
                  className="rounded-full h-10 w-10 flex-shrink-0"
                >
                  <PaperclipIcon className="h-5 w-5" />
                </Button>
                
                <div className="flex-1 relative">
                  <Textarea
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Type your message here..."
                    className="resize-none min-h-[60px] pr-12"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                  />
                  
                  {selectedResumes.length > 0 && (
                    <div className="absolute bottom-2 left-2 flex gap-1">
                      {selectedResumes.length > 3 ? (
                        <div className="text-xs bg-blue-100 text-blue-800 rounded px-2 py-1">
                          {selectedResumes.length} files selected
                        </div>
                      ) : (
                        selectedResumes.map(file => (
                          <div 
                            key={file.id.toString()} 
                            className="text-xs bg-blue-100 text-blue-800 rounded px-2 py-1 flex items-center"
                          >
                            <FileText className="h-3 w-3 mr-1" />
                            <span className="truncate max-w-[80px]">{file.name}</span>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
                
                <Button
                  type="button"
                  onClick={sendMessage}
                  disabled={isLoading || (!inputMessage.trim() && selectedResumes.length === 0)}
                  className="rounded-full h-10 w-10 flex-shrink-0"
                >
                  <Send className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}