"use client"
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  FileText, 
  Trash2, 
  Download, 
  Eye, 
  Calendar, 
  Loader2,
  CreditCard,
  Edit,
  ArrowLeft
} from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface SavedResume {
  id: string;
  user_id: string;
  name: string;
  template_id: string;
  latex_content: string;
  pdf_path: string;
  pdf_url: string;
  job_description: string;
  created_at: string;
  template_name?: string;
}

export default function SavedResumesPage() {
  const [savedResumes, setSavedResumes] = useState<SavedResume[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedResume, setSelectedResume] = useState<SavedResume | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [userCredits, setUserCredits] = useState<number>(0);
  const [isLoadingCredits, setIsLoadingCredits] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  const supabase = createClient();
  const router = useRouter();
  
  useEffect(() => {
    fetchSavedResumes();
    fetchUserCredits();
  }, []);
  
  const fetchUserCredits = async () => {
    try {
      setIsLoadingCredits(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/login');
        return;
      }
      
      const { data, error } = await supabase
        .from('user_credits')
        .select('credits')
        .eq('user_id', user.id)
        .single();
        
      if (error) {
        console.error('Error fetching user credits:', error);
        toast.error("Failed to load credit information");
      } else if (data) {
        setUserCredits(data.credits);
      }
    } catch (error) {
      console.error('Error fetching user credits:', error);
    } finally {
      setIsLoadingCredits(false);
    }
  };
  
  const fetchSavedResumes = async () => {
    try {
      setIsLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/login');
        return;
      }
      
      // Fetch saved resumes
      const { data: resumesData, error: resumesError } = await supabase
        .from('saved_resumes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
        
      if (resumesError) throw resumesError;
      
      if (!resumesData) {
        setSavedResumes([]);
        return;
      }
      
      // Get template names for each resume
      const resumesWithTemplateNames = await Promise.all(
        resumesData.map(async (resume) => {
          const { data: templateData } = await supabase
            .from('templates')
            .select('name')
            .eq('id', resume.template_id)
            .single();
            
          return {
            ...resume,
            template_name: templateData?.name || 'Unknown Template'
          };
        })
      );
      
      setSavedResumes(resumesWithTemplateNames);
      
    } catch (error) {
      console.error('Error fetching saved resumes:', error);
      toast.error("Failed to load saved resumes");
    } finally {
      setIsLoading(false);
    }
  };
  
  const handlePreview = (resume: SavedResume) => {
    setSelectedResume(resume);
    setPreviewOpen(true);
  };
  
  const handleDownload = async (resume: SavedResume) => {
    try {
      // Create a link to download the file
      const a = document.createElement('a');
      a.href = resume.pdf_url;
      a.download = `${resume.name}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      toast.success("Resume downloaded successfully");
    } catch (error) {
      console.error('Error downloading resume:', error);
      toast.error("Failed to download resume");
    }
  };
  
  const handleDelete = async (resume: SavedResume) => {
    try {
      setIsDeleting(true);
      
      // Delete from storage first
      const { error: storageError } = await supabase
        .storage
        .from('created-resumes')
        .remove([resume.pdf_path]);
        
      if (storageError) {
        console.error('Error deleting file from storage:', storageError);
        // Continue with database deletion even if storage deletion fails
      }
      
      // Delete from database
      const { error } = await supabase
        .from('saved_resumes')
        .delete()
        .eq('id', resume.id);
        
      if (error) throw error;
      
      setSavedResumes(savedResumes.filter(r => r.id !== resume.id));
      toast.success("Resume deleted successfully");
      
      if (previewOpen && selectedResume?.id === resume.id) {
        setPreviewOpen(false);
      }
      
    } catch (error) {
      console.error('Error deleting resume:', error);
      toast.error("Failed to delete resume");
    } finally {
      setIsDeleting(false);
    }
  };
  
  const handleEdit = (resume: SavedResume) => {
    // Navigate to dashboard with the resume data
    router.push(`/dashboard?resumeId=${resume.id}`);
  };
  
  // Filter resumes by date
  const getFilteredResumes = () => {
    if (selectedCategory === 'all') {
      return savedResumes;
    } else if (selectedCategory === 'recent') {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      return savedResumes.filter(resume => 
        new Date(resume.created_at) >= oneWeekAgo
      );
    } else if (selectedCategory === 'older') {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      return savedResumes.filter(resume => 
        new Date(resume.created_at) < oneWeekAgo
      );
    }
    return savedResumes;
  };
  
  const filteredResumes = getFilteredResumes();
  
  return (
    <div className="flex min-h-screen bg-gray-50">
      <main className="flex-1 p-6 flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => router.push('/dashboard')}
              className="mr-2"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-bold">Saved Resumes</h1>
          </div>
          
          <div className="flex items-center gap-4">
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
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => router.push('/dashboard')}
              className="gap-2"
            >
              Create New Resume
            </Button>
          </div>
        </div>
        
        <Card className="flex-1">
          <CardContent className="p-6">
            <Tabs defaultValue="all" className="mb-6" onValueChange={setSelectedCategory}>
              <TabsList>
                <TabsTrigger value="all">All Resumes</TabsTrigger>
                <TabsTrigger value="recent">Recent (7 days)</TabsTrigger>
                <TabsTrigger value="older">Older</TabsTrigger>
              </TabsList>
            </Tabs>
            
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="h-12 w-12 animate-spin text-gray-400" />
              </div>
            ) : savedResumes.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <FileText className="h-16 w-16 text-gray-300 mb-4" />
                <h3 className="text-xl font-medium text-gray-700 mb-2">No Saved Resumes</h3>
                <p className="text-gray-500 max-w-md mb-6">
                  You haven't saved any resumes yet. Generate and save a resume to see it here.
                </p>
                <Button onClick={() => router.push('/dashboard')}>
                  Create Your First Resume
                </Button>
              </div>
            ) : filteredResumes.length === 0 ? (
              <div className="col-span-full text-center py-12 text-gray-500">
                No resumes found in this category
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredResumes.map((resume) => (
                  <div 
                    key={resume.id}
                    className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                  >
                    <div className="relative aspect-[3/4] bg-gray-100">
                      {resume.pdf_url ? (
                        <iframe 
                          src={resume.pdf_url} 
                          title={resume.name}
                          className="absolute inset-0 w-full h-full"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                          {resume.name} Preview
                        </div>
                      )}
                      
                      <div className="absolute top-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                        {format(new Date(resume.created_at), 'MMM d, yyyy')}
                      </div>
                    </div>
                    
                    <div className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-medium">{resume.name}</h3>
                      </div>
                      
                      <p className="text-sm text-gray-500 mb-1">
                        Template: {resume.template_name}
                      </p>
                      
                      <p className="text-sm text-gray-700 mb-4 line-clamp-3">
                        {resume.job_description}
                      </p>
                      
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1"
                          onClick={() => handlePreview(resume)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Preview
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1"
                          onClick={() => handleDownload(resume)}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-none"
                          onClick={() => handleDelete(resume)}
                          disabled={isDeleting}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
      
      {/* Resume Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{selectedResume?.name}</DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-auto">
            {selectedResume && (
              <iframe 
                src={selectedResume.pdf_url}
                className="w-full h-[70vh] border rounded"
              />
            )}
          </div>
          
          <DialogFooter className="flex justify-between items-center">
            <div className="text-sm text-gray-500">
              Created: {selectedResume && format(new Date(selectedResume.created_at), 'MMMM d, yyyy')}
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => handleEdit(selectedResume!)}
              >
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </Button>
              <Button 
                onClick={() => handleDownload(selectedResume!)}
              >
                <Download className="h-4 w-4 mr-1" />
                Download
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}