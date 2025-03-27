import React from 'react';
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface JobDescriptionSectionProps {
  jobDescription: string;
  setJobDescription: (value: string) => void;
}

export default function JobDescriptionSection({ 
  jobDescription, 
  setJobDescription 
}: JobDescriptionSectionProps) {
  return (
    <div className="mb-4">
      <Label htmlFor="job-description" className="text-lg font-medium mb-2 block">
        Job Description
      </Label>
      <Textarea
        id="job-description"
        placeholder="Paste the job description here to tailor your resume..."
        value={jobDescription}
        onChange={(e) => setJobDescription(e.target.value)}
        className="min-h-[150px] lg:min-h-[200px] resize-none"
      />
    </div>
  );
}