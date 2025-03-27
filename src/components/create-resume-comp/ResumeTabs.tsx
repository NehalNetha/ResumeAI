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
      <CardContent className="p-4 sm:p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0 pb-2">
            <TabsList className="grid grid-cols-3 sm:grid-cols-6 mb-6 w-full min-w-[500px] sm:min-w-0 bg-slate-100 p-1 gap-x-1 gap-y-1 rounded-lg">
              <TabsTrigger 
                value="personal" 
                className="text-xs sm:text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md hover:bg-slate-50"
              >
                Personal
              </TabsTrigger>
              <TabsTrigger 
                value="work" 
                className="text-xs sm:text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md hover:bg-slate-50"
              >
                Work
              </TabsTrigger>
              <TabsTrigger 
                value="education" 
                className="text-xs sm:text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md hover:bg-slate-50"
              >
                Education
              </TabsTrigger>
              <TabsTrigger 
                value="projects" 
                className="text-xs sm:text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                Projects
              </TabsTrigger>
              <TabsTrigger 
                value="skills" 
                className="text-xs sm:text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                Skills
              </TabsTrigger>
              <TabsTrigger 
                value="links" 
                className="text-xs sm:text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                Links
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="mt-4 sm:mt-6 space-y-4">
            <TabsContent value="personal" className="mt-0">
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
          </div>
        </Tabs>
      </CardContent>

      <CardFooter className="flex justify-between p-4 sm:p-6 border-t">
        <Button 
          variant="outline" 
          onClick={handlePrevTab}
          disabled={activeTab === "personal"}
          className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm"
        >
          <ArrowLeft size={16} />
          <span className="hidden xs:inline">Previous</span>
          <span className="xs:hidden">Prev</span>
        </Button>
        <Button 
          onClick={handleNextTab}
          disabled={activeTab === "links"}
          className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm"
        >
          <span>Next</span>
          <ArrowRight size={16} />
        </Button>
      </CardFooter>
    </>
);
}