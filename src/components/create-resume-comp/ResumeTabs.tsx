import React from 'react';
import { CardContent, CardFooter } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight } from 'lucide-react';
import PersonalInfoTab from '@/components/resume-builder/PersonalInfoTab';
import WorkExperienceTab from '@/components/resume-builder/WorkExperienceTab';
import EducationTab from '@/components/resume-builder/EducationTab';
import ProjectsTab from '@/components/resume-builder/ProjectsTab';
import SkillsTab from '@/components/resume-builder/SkillsTab';
import LinksTab from '@/components/resume-builder/LinksTab';
import { PersonalInfo, ResumeSection, Skill, Link } from '@/types/resume';

interface ResumeTabsProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  personalInfo: PersonalInfo;
  workExperience: ResumeSection[];
  education: ResumeSection[];
  projects: ResumeSection[];
  skills: Skill[];
  links: Link[];
  handlePersonalInfoChange: (updatedInfo: PersonalInfo) => void;
  openDialog: (type: "work" | "education" | "project" | "skill" | "link") => void;
  removeItem: (type: string, id: string) => void;
  resumeId: string | null;
  userId: string | null;
}

export default function ResumeTabs({
  activeTab,
  setActiveTab,
  personalInfo,
  workExperience,
  education,
  projects,
  skills,
  links,
  handlePersonalInfoChange,
  openDialog,
  removeItem,
  resumeId,
  userId
}: ResumeTabsProps) {
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
    <>
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

          <TabsContent value="personal">
            <PersonalInfoTab 
              personalInfo={personalInfo} 
              onChange={handlePersonalInfoChange} 
              resumeId={resumeId}
            />
          </TabsContent>

          <TabsContent value="work">
            <WorkExperienceTab 
              workExperience={workExperience} 
              onAdd={() => openDialog("work")} 
              onRemove={(id) => removeItem("work", id)}
              resumeId={resumeId}
              userId={userId}
            />
          </TabsContent>

          <TabsContent value="education">
            <EducationTab 
              education={education} 
              onAdd={() => openDialog("education")} 
              onRemove={(id) => removeItem("education", id)} 
            />
          </TabsContent>

          <TabsContent value="projects">
            <ProjectsTab 
              projects={projects} 
              onAdd={() => openDialog("project")} 
              onRemove={(id) => removeItem("project", id)} 
            />
          </TabsContent>

          <TabsContent value="skills">
            <SkillsTab 
              skills={skills} 
              onAdd={() => openDialog("skill")} 
              onRemove={(id) => removeItem("skill", id)}
              resumeId={resumeId}
              userId={userId}
            />
          </TabsContent>

          <TabsContent value="links">
            <LinksTab 
              links={links} 
              onAdd={() => openDialog("link")} 
              onRemove={(id) => removeItem("link", id)}
              resumeId={resumeId}
              userId={userId}
            />
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
    </>
  );
}