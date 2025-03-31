import React, { useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Upload, FileText } from 'lucide-react';
import { Resume } from '@/types/resume';

interface ResumeSelectorProps {
  activeTab: string;
  setActiveTab: (tab: 'resumes' | 'templates' | 'info') => void;
  uploadedResumes: Resume[];
  selectedResumes: Resume[];
  isLoading: boolean;
  onSelectResume: (resume: Resume) => void;
  onFileInput: (files: File[]) => Promise<void>;
  visible: boolean;
}

export default function ResumeSelector({
  activeTab,
  setActiveTab,
  uploadedResumes,
  selectedResumes,
  isLoading,
  onSelectResume,
  onFileInput,
  visible
}: ResumeSelectorProps) {
  if (!visible) return null;
  
  // Add a file input ref to programmatically trigger the file dialog
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length > 0) {
      onFileInput(files);
    }
  };

  // Function to trigger file input click
  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="flex-1 h-full overflow-y-auto">
      {uploadedResumes.length === 0 ? (
        <div className="text-center py-8 text-gray-500 h-full flex items-center justify-center">
          <div>
            <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p>No resumes uploaded yet</p>
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-2 mt-4"
              onClick={triggerFileInput}
              disabled={isLoading}
            >
              <Upload className="h-4 w-4" />
              Upload Resume
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              multiple
              accept=".pdf,.doc,.docx"
              onChange={handleFileInput}
              disabled={isLoading}
            />
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-2 mt-2 h-[calc(100%-60px)] overflow-y-auto">
            {uploadedResumes.map((resume) => (
              <div 
                key={resume.id.toString()}
                className={`border rounded p-3 cursor-pointer flex items-center ${
                  selectedResumes.some(r => r.id === resume.id)
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => onSelectResume(resume)}
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
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-2"
              onClick={triggerFileInput}
              disabled={isLoading}
            >
              <Upload className="h-4 w-4" />
              Upload New
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              multiple
              accept=".pdf,.doc,.docx"
              onChange={handleFileInput}
              disabled={isLoading}
            />
          </div>
        </>
      )}
    </div>
  );
}