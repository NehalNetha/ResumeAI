import React from 'react';
import { Button } from "@/components/ui/button";
import { User } from 'lucide-react';
import { 
  ResumeInfo, 
  PersonalInfo, 
  WorkExperience, 
  Education, 
  Project, 
  Skill, 
  Link 
} from '@/types/resume';

interface ResumeInfoSelectorProps {
  userId: string | null;
  resumeInfos: ResumeInfo[];
  selectedResumeInfo: ResumeInfo | null;
  selectedComponents: {
    personalInfo: PersonalInfo | null;
    workExperiences: WorkExperience[];
    educations: Education[];
    projects: Project[];
    skills: Skill[];
    links: Link[];
  };
  setSelectedResumeInfo: (resumeInfo: ResumeInfo | null) => void;
  setSelectedComponents: React.Dispatch<React.SetStateAction<{
    personalInfo: PersonalInfo | null;
    workExperiences: WorkExperience[];
    educations: Education[];
    projects: Project[];
    skills: Skill[];
    links: Link[];
  }>>;
  visible: boolean;
}

export default function ResumeInfoSelector({
  userId,
  resumeInfos,
  selectedResumeInfo,
  selectedComponents,
  setSelectedResumeInfo,
  setSelectedComponents,
  visible
}: ResumeInfoSelectorProps) {
  if (!visible) return null;

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const selectResumeInfo = (resumeInfo: ResumeInfo) => {
    if (selectedResumeInfo?.id === resumeInfo.id) {
      // Deselect the resume info
      console.log('Deselecting Resume Info');
      setSelectedResumeInfo(null);
      setSelectedComponents({
        personalInfo: null,
        workExperiences: [],
        educations: [],
        projects: [],
        skills: [],
        links: []
      });
    } else {
      // Log the selected resume info
      console.log('Selecting Resume Info:', resumeInfo);
      
      setSelectedResumeInfo(resumeInfo);
      // Always include personal info by default when selecting a resume info
      // But start with empty arrays for all other components
      setSelectedComponents({
        personalInfo: resumeInfo.personal_info || null,
        workExperiences: [], // Start with empty selections
        educations: [],
        projects: [],
        skills: [],
        links: []
      });
      
      console.log('Set personal info to:', resumeInfo.personal_info);
      console.log('Other components start empty - user must explicitly select them');
    }
  };

  const toggleWorkExperience = (experience: WorkExperience) => {
    setSelectedComponents(prev => {
      const isSelected = prev.workExperiences.some(exp => exp.id === experience.id);
      return {
        ...prev,
        workExperiences: isSelected
          ? prev.workExperiences.filter(exp => exp.id !== experience.id)
          : [...prev.workExperiences, experience]
      };
    });
  };
  
  const toggleEducation = (education: Education) => {
    setSelectedComponents(prev => {
      const isSelected = prev.educations.some(edu => edu.id === education.id);
      return {
        ...prev,
        educations: isSelected
          ? prev.educations.filter(edu => edu.id !== education.id)
          : [...prev.educations, education]
      };
    });
  };
  
  const toggleProject = (project: Project) => {
    setSelectedComponents(prev => {
      const isSelected = prev.projects.some(proj => proj.id === project.id);
      return {
        ...prev,
        projects: isSelected
          ? prev.projects.filter(proj => proj.id !== project.id)
          : [...prev.projects, project]
      };
    });
  };
  
  const toggleSkill = (skill: Skill) => {
    setSelectedComponents(prev => {
      const isSelected = prev.skills.some(s => s.id === skill.id);
      return {
        ...prev,
        skills: isSelected
          ? prev.skills.filter(s => s.id !== skill.id)
          : [...prev.skills, skill]
      };
    });
  };
  
  const toggleLink = (link: Link) => {
    setSelectedComponents(prev => {
      const isSelected = prev.links.some(l => l.id === link.id);
      return {
        ...prev,
        links: isSelected
          ? prev.links.filter(l => l.id !== link.id)
          : [...prev.links, link]
      };
    });
  };

  return (
    <div className="flex-1 overflow-y-auto h-full">
      {!userId ? (
        <div className="text-center py-8 text-gray-500">
          <User className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p>Please sign in to access your saved information</p>
        </div>
      ) : resumeInfos.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <User className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p>No saved information found</p>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-4"
            onClick={() => window.location.href = '/dashboard/create-resume'}
          >
            Create Resume Information
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2 mt-2 overflow-y-auto h-full pb-4">
          {resumeInfos.map((info) => (
            <div 
              key={info.id}
              className={`border rounded p-3 cursor-pointer ${
                selectedResumeInfo?.id === info.id 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div 
                className="flex items-center"
                onClick={() => selectResumeInfo(info)}
              >
                <div className="mr-3">
                  <div className={`w-5 h-5 rounded border flex items-center justify-center ${
                    selectedResumeInfo?.id === info.id
                      ? 'bg-blue-500 border-blue-500' 
                      : 'border-gray-300'
                  }`}>
                    {selectedResumeInfo?.id === info.id && (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </div>
                <User className="h-5 w-5 mr-3 text-blue-500" />
                <div className="flex-1">
                  <div className="font-medium">
                    {info.personal_info?.name || 'Untitled Resume'}
                  </div>
                  <div className="text-xs text-gray-500">
                    {info.personal_info?.title || 'No title'} • Updated {formatDate(info.updated_at)}
                  </div>
                </div>
              </div>
              
              {selectedResumeInfo?.id === info.id && (
                <div className="mt-3 text-xs text-gray-600 border-t pt-3">
                  <div className="font-medium mb-2">Select specific information to include:</div>
                  
                  {/* Work Experience Selection */}
                  <div className="mb-3">
                    <div className="font-semibold mb-1">Work Experience:</div>
                    {info.work_experience && info.work_experience.length > 0 ? (
                      <div className="pl-2">
                        {info.work_experience.map((exp) => (
                          <div key={exp.id} className="flex items-center mb-1">
                            <div 
                              className={`w-4 h-4 rounded border mr-2 flex items-center justify-center cursor-pointer ${
                                selectedComponents.workExperiences.some(e => e.id === exp.id)
                                  ? 'bg-blue-500 border-blue-500' 
                                  : 'border-gray-300'
                              }`}
                              onClick={() => toggleWorkExperience(exp)}
                            >
                              {selectedComponents.workExperiences.some(e => e.id === exp.id) && (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              )}
                            </div>
                            <span className="truncate">{exp.company} - {exp.title}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-gray-400 pl-2">No work experience</div>
                    )}
                  </div>
                  
                  {/* Education Selection */}
                  <div className="mb-3">
                    <div className="font-semibold mb-1">Education:</div>
                    {info.education && info.education.length > 0 ? (
                      <div className="pl-2">
                        {info.education.map((edu) => (
                          <div key={edu.id} className="flex items-center mb-1">
                            <div 
                              className={`w-4 h-4 rounded border mr-2 flex items-center justify-center cursor-pointer ${
                                selectedComponents.educations.some(e => e.id === edu.id)
                                  ? 'bg-blue-500 border-blue-500' 
                                  : 'border-gray-300'
                              }`}
                              onClick={() => toggleEducation(edu)}
                            >
                              {selectedComponents.educations.some(e => e.id === edu.id) && (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              )}
                            </div>
                            <span className="truncate">{edu.title} - {edu.company}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-gray-400 pl-2">No education</div>
                    )}
                  </div>
                  
                  {/* Projects Selection */}
                  <div className="mb-3">
                    <div className="font-semibold mb-1">Projects:</div>
                    {info.projects && info.projects.length > 0 ? (
                      <div className="pl-2">
                        {info.projects.map((project) => (
                          <div key={project.id} className="flex items-center mb-1">
                            <div 
                              className={`w-4 h-4 rounded border mr-2 flex items-center justify-center cursor-pointer ${
                                selectedComponents.projects.some(p => p.id === project.id)
                                  ? 'bg-blue-500 border-blue-500' 
                                  : 'border-gray-300'
                              }`}
                              onClick={() => toggleProject(project)}
                            >
                              {selectedComponents.projects.some(p => p.id === project.id) && (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              )}
                            </div>
                            <span className="truncate">{project.title}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-gray-400 pl-2">No projects</div>
                    )}
                  </div>
                  
                  {/* Skills Selection */}
                  <div className="mb-3">
                    <div className="font-semibold mb-1">Skills:</div>
                    {info.skills && info.skills.length > 0 ? (
                      <div className="pl-2 flex flex-wrap gap-1">
                        {info.skills.map((skill) => (
                          <div 
                            key={skill.id}
                            className={`px-2 py-1 rounded-full text-xs cursor-pointer ${
                              selectedComponents.skills.some(s => s.id === skill.id)
                                ? 'bg-blue-100 text-blue-800 border border-blue-300' 
                                : 'bg-gray-100 text-gray-800 border border-gray-200'
                            }`}
                            onClick={() => toggleSkill(skill)}
                          >
                            {skill.name}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-gray-400 pl-2">No skills</div>
                    )}
                  </div>
                  
                  {/* Links Selection */}
                  <div className="mb-1">
                    <div className="font-semibold mb-1">Links:</div>
                    {info.links && info.links.length > 0 ? (
                      <div className="pl-2">
                        {info.links.map((link) => (
                          <div key={link.id} className="flex items-center mb-1">
                            <div 
                              className={`w-4 h-4 rounded border mr-2 flex items-center justify-center cursor-pointer ${
                                selectedComponents.links.some(l => l.id === link.id)
                                  ? 'bg-blue-500 border-blue-500' 
                                  : 'border-gray-300'
                              }`}
                              onClick={() => toggleLink(link)}
                            >
                              {selectedComponents.links.some(l => l.id === link.id) && (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              )}
                            </div>
                            <span className="truncate">{link.name}: {link.url}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-gray-400 pl-2">No links</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}