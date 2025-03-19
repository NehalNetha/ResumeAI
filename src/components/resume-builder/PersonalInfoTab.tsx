import React from 'react';
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { PersonalInfo } from '@/types/resume';
import { Button } from "@/components/ui/button";
import { Save } from 'lucide-react';
import { toast } from "sonner";
interface PersonalInfoTabProps {
  personalInfo: PersonalInfo;
  onChange: (info: PersonalInfo) => void;
}

export default function PersonalInfoTab({ personalInfo, onChange }: PersonalInfoTabProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    onChange({
      ...personalInfo,
      [name]: value
    });
  };

  const handleSave = () => {
    // Validate required fields
    if (!personalInfo.name || !personalInfo.email) {
      toast.error("Name and email are required");
      return;
    }
    toast.success("Personal information saved");
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <Label htmlFor="name">Full Name</Label>
          <Input 
            id="name" 
            name="name" 
            placeholder="John Doe" 
            value={personalInfo.name}
            onChange={handleChange}
          />
        </div>
        
        <div className="space-y-3">
          <Label htmlFor="title">Professional Title</Label>
          <Input 
            id="title" 
            name="title" 
            placeholder="Software Engineer" 
            value={personalInfo.title}
            onChange={handleChange}
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
            onChange={handleChange}
          />
        </div>
        
        <div className="space-y-3">
          <Label htmlFor="phone">Phone</Label>
          <Input 
            id="phone" 
            name="phone" 
            placeholder="(123) 456-7890" 
            value={personalInfo.phone}
            onChange={handleChange}
          />
        </div>
        
        <div className="space-y-3">
          <Label htmlFor="location">Location</Label>
          <Input 
            id="location" 
            name="location" 
            placeholder="San Francisco, CA" 
            value={personalInfo.location}
            onChange={handleChange}
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
          onChange={handleChange}
        />
      </div>

      <div className="flex justify-end mt-6">
        <Button 
          onClick={handleSave}
          className="flex items-center gap-2"
        >
          <Save size={16} />
          Save Changes
        </Button>
      </div>
    </div>
  );
}