"use client"
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import DashboardSidebar from '@/components/DashboardSidebar';
import { Button } from "@/components/ui/button";
import { 
  Download, 
  Eye, 
  Star, 
  StarHalf,
  CheckCircle2,
  PlusCircle
} from 'lucide-react';
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

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

export default function TemplatesPage() {
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [selectedTemplates, setSelectedTemplates] = useState<Template[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [multiSelectMode, setMultiSelectMode] = useState(false);
  
  const supabase = createClient();
  const router = useRouter();
  
  useEffect(() => {
    fetchTemplates();
  }, []);
  
  const fetchTemplates = async () => {
    try {
      setIsLoading(true);
      
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
      toast.error("Failed to load templates");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredTemplates = selectedCategory === 'all' 
    ? templates 
    : templates.filter(template => template.category === selectedCategory);

  const handleSelectTemplate = (template: Template) => {
    if (multiSelectMode) {
      toggleTemplateSelection(template);
    } else {
      setSelectedTemplate(template);
      toast(`Template "${template.name}" selected`);
    }
  };

  const toggleTemplateSelection = (template: Template) => {
    if (selectedTemplates.some(t => t.id === template.id)) {
      setSelectedTemplates(selectedTemplates.filter(t => t.id !== template.id));
    } else {
      setSelectedTemplates([...selectedTemplates, template]);
      toast(`Template "${template.name}" added to selection`);
    }
  };

  const handleUseTemplate = () => {
    if (multiSelectMode) {
      if (selectedTemplates.length === 0) return;
      
      toast.success(`Using ${selectedTemplates.length} selected templates`);
      // Here you would handle multiple templates
      // For example, redirect to a comparison page or a multi-template editor
      router.push(`/dashboard/editor?templates=${selectedTemplates.map(t => t.id).join(',')}`);
    } else {
      if (!selectedTemplate) return;
      
      toast.success(`Using template: ${selectedTemplate.name}`);
      router.push(`/dashboard/editor?template=${selectedTemplate.id}`);
    }
  };

  const handlePreview = (template: Template) => {
    setSelectedTemplate(template);
    setPreviewOpen(true);
  };

  return (
    <div className="flex min-h-screen bg-gray-50 ">
      <main className="flex-1 p-6 flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Resume Templates</h1>
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={() => {
                setMultiSelectMode(!multiSelectMode);
                if (!multiSelectMode) {
                  setSelectedTemplate(null);
                } else {
                  setSelectedTemplates([]);
                }
              }}
              className="gap-2"
            >
              {multiSelectMode ? "Single Select" : "Multi Select"}
            </Button>
            
            {multiSelectMode ? (
              selectedTemplates.length > 0 && (
                <Button onClick={handleUseTemplate} className="gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Use {selectedTemplates.length} Templates
                </Button>
              )
            ) : (
              selectedTemplate && (
                <Button onClick={handleUseTemplate} className="gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Use Selected Template
                </Button>
              )
            )}
          </div>
        </div>
        
        <Card className="flex-1">
          <CardContent className="p-6">
            <Tabs defaultValue="all" className="mb-6" onValueChange={setSelectedCategory}>
              <TabsList>
                <TabsTrigger value="all">All Templates</TabsTrigger>
                <TabsTrigger value="professional">Professional</TabsTrigger>
                <TabsTrigger value="creative">Creative</TabsTrigger>
                <TabsTrigger value="academic">Academic</TabsTrigger>
                <TabsTrigger value="simple">Simple</TabsTrigger>
              </TabsList>
            </Tabs>
            
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTemplates.length === 0 ? (
                  <div className="col-span-full text-center py-12 text-gray-500">
                    No templates found in this category
                  </div>
                ) : (
                  filteredTemplates.map((template) => (
                    <div 
                      key={template.id}
                      className={`border rounded-lg overflow-hidden transition-all ${
                        multiSelectMode
                          ? selectedTemplates.some(t => t.id === template.id)
                            ? 'ring-2 ring-blue-500 shadow-md'
                            : 'hover:shadow-md'
                          : selectedTemplate?.id === template.id 
                            ? 'ring-2 ring-blue-500 shadow-md' 
                            : 'hover:shadow-md'
                      }`}
                    >
                      <div className="relative aspect-[3/4] bg-gray-100">
                        {template.preview_url ? (
                          <img 
                            src={template.preview_url} 
                            alt={template.name}
                            className="absolute inset-0 w-full h-full object-cover"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                            {template.name} Preview
                          </div>
                        )}
                        
                        {template.created_at && new Date(template.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) && (
                          <div className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
                            NEW
                          </div>
                        )}
                        
                        {template.is_premium && (
                          <div className="absolute top-2 right-2 bg-amber-500 text-white text-xs px-2 py-1 rounded">
                            PREMIUM
                          </div>
                        )}
                      </div>
                      
                      <div className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-medium">{template.name}</h3>
                          <div className="flex items-center text-amber-500">
                            <Star className="h-4 w-4 fill-current" />
                            <span className="text-xs ml-1">4.5</span>
                          </div>
                        </div>
                        
                        <p className="text-sm text-gray-500 mb-4">
                          {template.description}
                        </p>
                        
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1"
                            onClick={() => handlePreview(template)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Preview
                          </Button>
                          <Button 
                            size="sm" 
                            className="flex-1"
                            onClick={() => handleSelectTemplate(template)}
                          >
                            {multiSelectMode ? (
                              selectedTemplates.some(t => t.id === template.id) ? (
                                <>Selected</>
                              ) : (
                                <>
                                  <PlusCircle className="h-4 w-4 mr-1" />
                                  Add
                                </>
                              )
                            ) : (
                              <>Select</>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
      
      {/* Template Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{selectedTemplate?.name}</DialogTitle>
            <DialogDescription>
              {selectedTemplate?.description}
            </DialogDescription>
          </DialogHeader>
          
          <div className="aspect-[8.5/11] bg-white border rounded-md overflow-hidden">
            {selectedTemplate?.preview_url ? (
              <img 
                src={selectedTemplate.preview_url} 
                alt={selectedTemplate.name}
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400">
                Template Preview for {selectedTemplate?.name}
              </div>
            )}
          </div>
          
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setPreviewOpen(false)}>
              Close
            </Button>
            <Button onClick={() => {
              if (multiSelectMode) {
                toggleTemplateSelection(selectedTemplate!);
              } else {
                handleSelectTemplate(selectedTemplate!);
              }
              setPreviewOpen(false);
            }}>
              {multiSelectMode ? "Add to Selection" : "Use This Template"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}