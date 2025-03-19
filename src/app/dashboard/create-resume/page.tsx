"use client"
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, Save, Download, Eye, ArrowLeft, ArrowRight } from 'lucide-react';
import DashboardSidebar from '@/components/DashboardSidebar';
import { toast } from "sonner";

interface ResumeSection {
  id: string;
  title: string;
  company?: string;
  location?: string;
  startDate: string;
  endDate: string;
  description: string;
  bullets: string[];
  projectUrl?: string; // Add this field for project links

}

interface PersonalInfo {
  name: string;
  title: string;
  email: string;
  phone: string;
  location: string;
  summary: string;
}

interface Link {
  id: string;
  title: string;
  url: string;
}

interface Skill {
  id: string;
  name: string;
  level: number; // 1-5
}

export default function CreateResume() {
  const [activeTab, setActiveTab] = useState("personal");
  const [personalInfo, setPersonalInfo] = useState<PersonalInfo>({
    name: "",
    title: "",
    email: "",
    phone: "",
    location: "",
    summary: ""
  });
  
  const [workExperience, setWorkExperience] = useState<ResumeSection[]>([]);
  const [education, setEducation] = useState<ResumeSection[]>([]);
  const [projects, setProjects] = useState<ResumeSection[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [links, setLinks] = useState<Link[]>([]);
  
  // For new section entry
  const [newSection, setNewSection] = useState<ResumeSection>({
    id: "",
    title: "",
    company: "",
    location: "",
    startDate: "",
    endDate: "",
    description: "",
    bullets: [""]
  });
  
  // For new skill entry
  const [newSkill, setNewSkill] = useState<Skill>({
    id: "",
    name: "",
    level: 3
  });
  
  // For new link entry
  const [newLink, setNewLink] = useState<Link>({
    id: "",
    title: "",
    url: ""
  });
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<"work" | "education" | "project" | "skill" | "link">("work");
  
  const handlePersonalInfoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setPersonalInfo(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleNewSectionChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewSection(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleBulletChange = (index: number, value: string) => {
    setNewSection(prev => {
      const updatedBullets = [...prev.bullets];
      updatedBullets[index] = value;
      return {
        ...prev,
        bullets: updatedBullets
      };
    });
  };
  
  const addBullet = () => {
    setNewSection(prev => ({
      ...prev,
      bullets: [...prev.bullets, ""]
    }));
  };
  
  const removeBullet = (index: number) => {
    setNewSection(prev => {
      const updatedBullets = prev.bullets.filter((_, i) => i !== index);
      return {
        ...prev,
        bullets: updatedBullets.length ? updatedBullets : [""]
      };
    });
  };
  
  const openDialog = (type: "work" | "education" | "project" | "skill" | "link") => {
    setDialogType(type);
    setIsDialogOpen(true);
    
    // Reset form based on type
    if (type === "work" || type === "education" || type === "project") {
      setNewSection({
        id: Date.now().toString(),
        title: "",
        company: "",
        location: "",
        startDate: "",
        endDate: "",
        description: "",
        bullets: [""]
      });
    } else if (type === "skill") {
      setNewSkill({
        id: Date.now().toString(),
        name: "",
        level: 3
      });
    } else if (type === "link") {
      setNewLink({
        id: Date.now().toString(),
        title: "",
        url: ""
      });
    }
  };
  
  const handleAddSection = () => {
    if (dialogType === "work") {
      if (!newSection.title || !newSection.company) {
        toast("Please fill in required fields");
        return;
      }
      setWorkExperience(prev => [...prev, newSection]);
    } else if (dialogType === "education") {
      if (!newSection.title || !newSection.company) {
        toast("Please fill in required fields");
        return;
      }
      setEducation(prev => [...prev, newSection]);
    } else if (dialogType === "project") {
      if (!newSection.title) {
        toast("Please fill in required fields");
        return;
      }
      setProjects(prev => [...prev, newSection]);
    } else if (dialogType === "skill") {
      if (!newSkill.name) {
        toast("Please enter a skill name");
        return;
      }
      setSkills(prev => [...prev, newSkill]);
    } else if (dialogType === "link") {
      if (!newLink.title || !newLink.url) {
        toast("Please fill in all fields");
        return;
      }
      setLinks(prev => [...prev, newLink]);
    }
    
    setIsDialogOpen(false);
    toast(`Added new ${dialogType} entry`);
  };
  
  const removeItem = (type: string, id: string) => {
    if (type === "work") {
      setWorkExperience(prev => prev.filter(item => item.id !== id));
    } else if (type === "education") {
      setEducation(prev => prev.filter(item => item.id !== id));
    } else if (type === "project") {
      setProjects(prev => prev.filter(item => item.id !== id));
    } else if (type === "skill") {
      setSkills(prev => prev.filter(item => item.id !== id));
    } else if (type === "link") {
      setLinks(prev => prev.filter(item => item.id !== id));
    }
    toast(`Removed ${type} entry`);
  };
  
  const handleSaveResume = () => {
    // Here you would implement saving the resume data
    // For example, to localStorage or to a database
    const resumeData = {
      personalInfo,
      workExperience,
      education,
      projects,
      skills,
      links
    };
    
    console.log("Saving resume:", resumeData);
    toast.success("Resume saved successfully!");
  };
  
  const handlePreviewResume = () => {
    // Here you would implement the preview functionality
    toast.info("Preview functionality coming soon!");
  };
  
  const handleNextTab = () => {
    const tabs = ["personal", "work", "education", "projects", "skills", "links"];
    const currentIndex = tabs.indexOf(activeTab);
    if (currentIndex < tabs.length - 1) {
      setActiveTab(tabs[currentIndex + 1]);
    }
  };
  
  const handlePrevTab = () => {
    const tabs = ["personal", "work", "education", "projects", "skills", "links"];
    const currentIndex = tabs.indexOf(activeTab);
    if (currentIndex > 0) {
      setActiveTab(tabs[currentIndex - 1]);
    }
  };
  
  return (
    <div className="flex min-h-screen bg-gray-50">
      <DashboardSidebar />
      <main className="flex-1 p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Create Your Resume</h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handlePreviewResume} className="flex items-center gap-2">
              <Eye size={16} />
              Preview
            </Button>
            <Button onClick={handleSaveResume} className="flex items-center gap-2">
              <Save size={16} />
              Save Resume
            </Button>
          </div>
        </div>
        
        <Card className="mb-6">
          <CardContent className="p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-6 mb-8">
                <TabsTrigger value="personal">Personal</TabsTrigger>
                <TabsTrigger value="work">Work</TabsTrigger>
                <TabsTrigger value="education">Education</TabsTrigger>
                <TabsTrigger value="projects">Projects</TabsTrigger>
                <TabsTrigger value="skills">Skills</TabsTrigger>
                <TabsTrigger value="links">Links</TabsTrigger>
              </TabsList>
              
              <TabsContent value="personal" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="name">Full Name</Label>
                    <Input 
                      id="name" 
                      name="name" 
                      placeholder="John Doe" 
                      value={personalInfo.name}
                      onChange={handlePersonalInfoChange}
                    />
                  </div>
                  
                  <div className="space-y-3">
                    <Label htmlFor="title">Professional Title</Label>
                    <Input 
                      id="title" 
                      name="title" 
                      placeholder="Software Engineer" 
                      value={personalInfo.title}
                      onChange={handlePersonalInfoChange}
                    />
                  </div>
                  
                  <div className="space-y-3">
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email" 
                      name="email" 
                      type="email" 
                      placeholder="john.doe@example.com" 
                      value={personalInfo.email}
                      onChange={handlePersonalInfoChange}
                    />
                  </div>
                  
                  <div className="space-y-3">
                    <Label htmlFor="phone">Phone</Label>
                    <Input 
                      id="phone" 
                      name="phone" 
                      placeholder="(123) 456-7890" 
                      value={personalInfo.phone}
                      onChange={handlePersonalInfoChange}
                    />
                  </div>
                  
                  <div className="space-y-3">
                    <Label htmlFor="location">Location</Label>
                    <Input 
                      id="location" 
                      name="location" 
                      placeholder="San Francisco, CA" 
                      value={personalInfo.location}
                      onChange={handlePersonalInfoChange}
                    />
                  </div>
                </div>
                
                <div className="space-y-3 mt-6">
                  <Label htmlFor="summary">Professional Summary</Label>
                  <Textarea 
                    id="summary" 
                    name="summary" 
                    placeholder="Write a brief summary of your professional background and key strengths..." 
                    rows={5}
                    value={personalInfo.summary}
                    onChange={handlePersonalInfoChange}
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="work" className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Work Experience</h3>
                  <Button onClick={() => openDialog("work")} className="flex items-center gap-2">
                    <Plus size={16} />
                    Add Experience
                  </Button>
                </div>
                
                {workExperience.length === 0 ? (
                  <div className="text-center py-12 border border-dashed rounded-lg">
                    <p className="text-gray-500">No work experience added yet</p>
                    <Button 
                      variant="outline" 
                      onClick={() => openDialog("work")} 
                      className="mt-4"
                    >
                      Add Your First Work Experience
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {workExperience.map((job) => (
                      <Card key={job.id} className="relative">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="absolute top-2 right-2 text-gray-500 hover:text-red-500"
                          onClick={() => removeItem("work", job.id)}
                        >
                          <Trash2 size={16} />
                        </Button>
                        <CardContent className="p-6">
                          <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-2">
                            <div>
                              <h4 className="font-semibold text-lg">{job.title}</h4>
                              <p className="text-gray-600">{job.company}</p>
                              <p className="text-gray-500 text-sm">{job.location}</p>
                            </div>
                            <div className="text-gray-500 text-sm">
                              {job.startDate} - {job.endDate || 'Present'}
                            </div>
                          </div>
                          
                          <p className="mt-3 text-gray-700">{job.description}</p>
                          
                          {job.bullets.length > 0 && job.bullets[0] !== "" && (
                            <ul className="mt-3 list-disc list-inside space-y-1">
                              {job.bullets.map((bullet, index) => (
                                <li key={index} className="text-gray-700">{bullet}</li>
                              ))}
                            </ul>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="education" className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Education</h3>
                  <div className="flex justify-between items-center">
                  <Button onClick={() => openDialog("education")} className="flex items-center gap-2">
                    <Plus size={16} />
                    Add Education
                  </Button>
                  </div>
                </div>
                
                {education.length === 0 ? (
                  <div className="text-center py-12 border border-dashed rounded-lg">
                    <p className="text-gray-500">No education added yet</p>
                    <Button 
                      variant="outline" 
                      onClick={() => openDialog("education")} 
                      className="mt-4"
                    >
                      Add Your Education
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {education.map((edu) => (
                      <Card key={edu.id} className="relative">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="absolute top-2 right-2 text-gray-500 hover:text-red-500"
                          onClick={() => removeItem("education", edu.id)}
                        >
                          <Trash2 size={16} />
                        </Button>
                        <CardContent className="p-6">
                          <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-2">
                            <div>
                              <h4 className="font-semibold text-lg">{edu.title}</h4>
                              <p className="text-gray-600">{edu.company}</p>
                              <p className="text-gray-500 text-sm">{edu.location}</p>
                            </div>
                            <div className="text-gray-500 text-sm">
                              {edu.startDate} - {edu.endDate || 'Present'}
                            </div>
                          </div>
                          
                          <p className="mt-3 text-gray-700">{edu.description}</p>
                          
                          {edu.bullets.length > 0 && edu.bullets[0] !== "" && (
                            <ul className="mt-3 list-disc list-inside space-y-1">
                              {edu.bullets.map((bullet, index) => (
                                <li key={index} className="text-gray-700">{bullet}</li>
                              ))}
                            </ul>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="projects" className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Projects</h3>
                  <Button onClick={() => openDialog("project")} className="flex items-center gap-2">
                    <Plus size={16} />
                    Add Project
                  </Button>
                </div>
                
                {projects.length === 0 ? (
                  <div className="text-center py-12 border border-dashed rounded-lg">
                    <p className="text-gray-500">No projects added yet</p>
                    <Button 
                      variant="outline" 
                      onClick={() => openDialog("project")} 
                      className="mt-4"
                    >
                      Add Your First Project
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {projects.map((project) => (
                      <Card key={project.id} className="relative">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="absolute top-2 right-2 text-gray-500 hover:text-red-500"
                          onClick={() => removeItem("project", project.id)}
                        >
                          <Trash2 size={16} />
                        </Button>
                        <CardContent className="p-6">
                          <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-2">
                            <div>
                              <h4 className="font-semibold text-lg">{project.title}</h4>
                              {project.company && <p className="text-gray-600">{project.company}</p>}
                            </div>
                            <div className="text-gray-500 text-sm">
                              {project.startDate && project.endDate ? 
                                `${project.startDate} - ${project.endDate || 'Present'}` : ''}
                            </div>
                          </div>
                          
                          <p className="mt-3 text-gray-700">{project.description}</p>
                          
                          {/* Display project URL if it exists */}
                          {project.projectUrl && (
                            <a 
                              href={project.projectUrl} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="mt-2 text-blue-500 hover:underline text-sm inline-block"
                            >
                              View Project
                            </a>
                          )}
                          
                          {project.bullets.length > 0 && project.bullets[0] !== "" && (
                            <ul className="mt-3 list-disc list-inside space-y-1">
                              {project.bullets.map((bullet, index) => (
                                <li key={index} className="text-gray-700">{bullet}</li>
                              ))}
                            </ul>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="skills" className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Skills</h3>
                  <Button onClick={() => openDialog("skill")} className="flex items-center gap-2">
                    <Plus size={16} />
                    Add Skill
                  </Button>
                </div>
                
                {skills.length === 0 ? (
                  <div className="text-center py-12 border border-dashed rounded-lg">
                    <p className="text-gray-500">No skills added yet</p>
                    <Button 
                      variant="outline" 
                      onClick={() => openDialog("skill")} 
                      className="mt-4"
                    >
                      Add Your Skills
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {skills.map((skill) => (
                      <Card key={skill.id} className="relative">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="absolute top-2 right-2 text-gray-500 hover:text-red-500"
                          onClick={() => removeItem("skill", skill.id)}
                        >
                          <Trash2 size={16} />
                        </Button>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium">{skill.name}</h4>
                            <div className="flex">
                              {[...Array(5)].map((_, i) => (
                                <div 
                                  key={i} 
                                  className={`w-2 h-2 rounded-full mx-0.5 ${
                                    i < skill.level ? 'bg-blue-500' : 'bg-gray-200'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="links" className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Links</h3>
                  <Button onClick={() => openDialog("link")} className="flex items-center gap-2">
                    <Plus size={16} />
                    Add Link
                  </Button>
                </div>
                
                {links.length === 0 ? (
                  <div className="text-center py-12 border border-dashed rounded-lg">
                    <p className="text-gray-500">No links added yet</p>
                    <Button 
                      variant="outline" 
                      onClick={() => openDialog("link")} 
                      className="mt-4"
                    >
                      Add Your First Link
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {links.map((link) => (
                      <Card key={link.id} className="relative">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="absolute top-2 right-2 text-gray-500 hover:text-red-500"
                          onClick={() => removeItem("link", link.id)}
                        >
                          <Trash2 size={16} />
                        </Button>
                        <CardContent className="p-4">
                          <h4 className="font-medium">{link.title}</h4>
                          <a 
                            href={link.url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-blue-500 hover:underline text-sm truncate block"
                          >
                            {link.url}
                          </a>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
          
          <CardFooter className="flex justify-between p-6 border-t">
            <Button 
              variant="outline" 
              onClick={handlePrevTab}
              disabled={activeTab === "personal"}
              className="flex items-center gap-2"
            >
              <ArrowLeft size={16} />
              Previous
            </Button>
            <Button 
              onClick={handleNextTab}
              disabled={activeTab === "links"}
              className="flex items-center gap-2"
            >
              Next
              <ArrowRight size={16} />
            </Button>
          </CardFooter>
        </Card>
      </main>
      
      {/* Dialog for adding new entries */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>
              {dialogType === "work" && "Add Work Experience"}
              {dialogType === "education" && "Add Education"}
              {dialogType === "project" && "Add Project"}
              {dialogType === "skill" && "Add Skill"}
              {dialogType === "link" && "Add Link"}
            </DialogTitle>
            <DialogDescription>
              {dialogType === "work" && "Add details about your work experience"}
              {dialogType === "education" && "Add details about your education"}
              {dialogType === "project" && "Add details about your project"}
              {dialogType === "skill" && "Add a skill and proficiency level"}
              {dialogType === "link" && "Add a link to your portfolio, social media, etc."}
            </DialogDescription>
          </DialogHeader>
          
          {/* Work, Education, Project Form */}
          {(dialogType === "work" || dialogType === "education" || dialogType === "project") && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="title" className="text-right">
                  {dialogType === "work" ? "Job Title" : 
                   dialogType === "education" ? "Degree/Certificate" : "Project Title"}
                </Label>
                <Input
                  id="title"
                  name="title"
                  className="col-span-3"
                  value={newSection.title}
                  onChange={handleNewSectionChange}
                  placeholder={dialogType === "work" ? "Software Engineer" : 
                              dialogType === "education" ? "Bachelor of Science" : "E-commerce Website"}
                />
              </div>
              
              {/* Add Project URL field only for projects */}
              {dialogType === "project" && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="projectUrl" className="text-right">
                    Project URL
                  </Label>
                  <Input
                    id="projectUrl"
                    name="projectUrl"
                    type="url"
                    className="col-span-3"
                    value={newSection.projectUrl || ""}
                    onChange={handleNewSectionChange}
                    placeholder="https://github.com/username/project"
                  />
                </div>
              )}
              
              {(dialogType === "work" || dialogType === "education") && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="company" className="text-right">
                    {dialogType === "work" ? "Company" : "Institution"}
                  </Label>
                  <Input
                    id="company"
                    name="company"
                    className="col-span-3"
                    value={newSection.company}
                    onChange={handleNewSectionChange}
                    placeholder={dialogType === "work" ? "Google" : "Stanford University"}
                  />
                </div>
              )}
              
              {(dialogType === "work" || dialogType === "education") && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="location" className="text-right">
                    Location
                  </Label>
                  <Input
                    id="location"
                    name="location"
                    className="col-span-3"
                    value={newSection.location}
                    onChange={handleNewSectionChange}
                    placeholder="San Francisco, CA"
                  />
                </div>
              )}
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="startDate" className="text-right">
                  Start Date
                </Label>
                <Input
                  id="startDate"
                  name="startDate"
                  type="month"
                  className="col-span-3"
                  value={newSection.startDate}
                  onChange={handleNewSectionChange}
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="endDate" className="text-right">
                  End Date
                </Label>
                <Input
                  id="endDate"
                  name="endDate"
                  type="month"
                  className="col-span-3"
                  value={newSection.endDate}
                  onChange={handleNewSectionChange}
                  placeholder="Leave blank if current"
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">
                  Description
                </Label>
                <Textarea
                  id="description"
                  name="description"
                  className="col-span-3"
                  value={newSection.description}
                  onChange={handleNewSectionChange}
                  placeholder="Brief description..."
                />
              </div>
              
              <div className="grid grid-cols-4 gap-4">
                <Label className="text-right mt-2">
                  Key Points
                </Label>
                <div className="col-span-3 space-y-2">
                  {newSection.bullets.map((bullet, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={bullet}
                        onChange={(e) => handleBulletChange(index, e.target.value)}
                        placeholder={`Bullet point ${index + 1}`}
                      />
                      <Button 
                        variant="ghost" 
                        size="icon"
                        type="button"
                        onClick={() => removeBullet(index)}
                        disabled={newSection.bullets.length === 1}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  ))}
                  <Button 
                    variant="outline"
                    type="button"
                    onClick={addBullet}
                    className="w-full mt-2"
                    >
                    Add Bullet Point
                    </Button>
                </div>
                </div>
            </div>
            )}
            
            {/* Skill Form */}
            {dialogType === "skill" && (
            <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="skillName" className="text-right">
                    Skill Name
                </Label>
                <Input
                    id="skillName"
                    className="col-span-3"
                    value={newSkill.name}
                    onChange={(e) => setNewSkill(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="JavaScript, Project Management, etc."
                />
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="skillLevel" className="text-right">
                    Proficiency Level
                </Label>
                <div className="col-span-3">
                    <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500">Beginner</span>
                    <div className="flex-1 flex items-center">
                        {[1, 2, 3, 4, 5].map((level) => (
                        <button
                            key={level}
                            type="button"
                            className={`w-8 h-8 rounded-full mx-1 flex items-center justify-center ${
                            level <= newSkill.level ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
                            }`}
                            onClick={() => setNewSkill(prev => ({ ...prev, level }))}
                        >
                            {level}
                        </button>
                        ))}
                    </div>
                    <span className="text-sm text-gray-500">Expert</span>
                    </div>
                </div>
                </div>
            </div>
            )}
            
            {/* Link Form */}
            {dialogType === "link" && (
            <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="linkTitle" className="text-right">
                    Title
                </Label>
                <Input
                    id="linkTitle"
                    className="col-span-3"
                    value={newLink.title}
                    onChange={(e) => setNewLink(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="LinkedIn, GitHub, Portfolio, etc."
                />
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="linkUrl" className="text-right">
                    URL
                </Label>
                <Input
                    id="linkUrl"
                    type="url"
                    className="col-span-3"
                    value={newLink.url}
                    onChange={(e) => setNewLink(prev => ({ ...prev, url: e.target.value }))}
                    placeholder="https://example.com"
                />
                </div>
            </div>
            )}
            
            <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
            </Button>
            <Button onClick={handleAddSection}>
                Add
            </Button>
            </DialogFooter>
        </DialogContent>
        </Dialog>
    </div>
    );
}