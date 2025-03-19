import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Trash2 } from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { ResumeSection, Skill, Link } from '@/types/resume';

interface AddSectionDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  dialogType: "work" | "education" | "project" | "skill" | "link";
  newSection: ResumeSection;
  setNewSection: React.Dispatch<React.SetStateAction<ResumeSection>>;
  newSkill: Skill;
  setNewSkill: React.Dispatch<React.SetStateAction<Skill>>;
  newLink: Link;
  setNewLink: React.Dispatch<React.SetStateAction<Link>>;
  onAdd: () => void;
}

export default function AddSectionDialog({
  isOpen,
  onOpenChange,
  dialogType,
  newSection,
  setNewSection,
  newSkill,
  setNewSkill,
  newLink,
  setNewLink,
  onAdd
}: AddSectionDialogProps) {
  
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

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
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
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onAdd}>
            Add
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}