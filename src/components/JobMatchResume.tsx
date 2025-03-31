 "use client"
import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChevronLeft, 
  ChevronRight, 
  FileText, 
  Target, 
  Sparkles,
  Upload,
  Zap 
} from 'lucide-react';

const JobMatchResume = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  
  const steps = [
    {
      id: "upload",
      title: "Upload Job Description",
      description: "Start by pasting a job description or uploading a job posting. Our system analyzes the key requirements, skills, and qualifications the employer is looking for.",
      icon: <Upload className="h-6 w-6" />,
      number: 1,
      image: "/images/job-match-step1.png"
    },
    {
      id: "analyze",
      title: "AI Analyzes Requirements",
      description: "Our AI breaks down the job description, identifying critical keywords, required skills, and preferred qualifications that will help your resume stand out to both hiring managers and ATS systems.",
      icon: <Target className="h-6 w-6" />,
      number: 2,
      image: "/images/job-match-step2.png"
    },
    {
      id: "tailor",
      title: "Tailor Your Resume",
      description: "Based on the job analysis, our AI suggests specific adjustments to your resume, highlighting relevant experience and skills while recommending sections that need enhancement to match the job requirements.",
      icon: <Sparkles className="h-6 w-6" />,
      number: 3,
      image: "/images/job-match-step3.png"
    },
    {
      id: "finalize",
      title: "Finalize & Export",
      description: "Review your newly optimized resume with a match score showing how well it aligns with the job description. Make any final edits before downloading your tailored resume ready for submission.",
      icon: <Zap className="h-6 w-6" />,
      number: 4,
      image: "/images/job-match-step4.png"
    }
  ];

  const handleNext = () => {
    setActiveIndex((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
  };

  const handlePrev = () => {
    setActiveIndex((prev) => (prev > 0 ? prev - 1 : prev));
  };

  return (
    <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-800">
            Match Your Resume to Any Job Description
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto text-lg">
            Increase your interview chances by tailoring your resume to specific job requirements in minutes
          </p>
        </div>

        {/* Horizontal stepper */}
        <div className="mb-16 relative">
          <div className="hidden md:block absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 bg-gray-200 z-0"></div>
          <div className="flex justify-between relative z-10">
            {steps.map((step, index) => (
              <div 
                key={step.id}
                className="flex flex-col items-center cursor-pointer"
                onClick={() => setActiveIndex(index)}
              >
                <div 
                  className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold transition-all duration-300
                    ${activeIndex >= index 
                      ? 'bg-purple-600 text-white scale-110' 
                      : 'bg-white text-gray-400 border-2 border-gray-200'}`}
                >
                  {step.number}
                </div>
                <div className={`mt-3 text-center transition-colors duration-300 max-w-[100px]
                  ${activeIndex >= index ? 'text-purple-600 font-medium' : 'text-gray-500'}`}>
                  {step.title.split(' ').slice(0, 2).join(' ')}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Content area */}
        <div className="relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={steps[activeIndex].id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.4 }}
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
                {/* Left side - Description */}
                <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                  <div className="inline-flex items-center justify-center p-2 bg-purple-100 rounded-lg mb-6">
                    <div className="w-10 h-10 rounded-full bg-purple-600 text-white flex items-center justify-center">
                      {steps[activeIndex].icon}
                    </div>
                    <span className="ml-3 font-medium text-purple-800">Step {steps[activeIndex].number}</span>
                  </div>
                  
                  <h3 className="text-2xl font-bold mb-4 text-gray-800">{steps[activeIndex].title}</h3>
                  <p className="text-gray-600 mb-8 text-lg leading-relaxed">{steps[activeIndex].description}</p>
                  
                  {activeIndex === 0 && (
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6">
                      <h4 className="font-medium text-gray-700 mb-2">Pro Tip:</h4>
                      <p className="text-gray-600 text-sm">Copy and paste the entire job description, including qualifications and company information, for the most accurate matching.</p>
                    </div>
                  )}
                  
                  {activeIndex === 1 && (
                    <div className="flex flex-wrap gap-2 mb-6">
                      {["Python", "Project Management", "Communication", "Data Analysis", "Leadership"].map(skill => (
                        <span key={skill} className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm">
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  {activeIndex === 2 && (
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200 mb-6">
                      <div className="flex items-center mb-2">
                        <Sparkles className="h-5 w-5 text-green-600 mr-2" />
                        <h4 className="font-medium text-green-700">Suggested Improvements:</h4>
                      </div>
                      <ul className="text-gray-600 text-sm space-y-2">
                        <li>• Highlight your database optimization experience</li>
                        <li>• Add metrics to your project management achievements</li>
                        <li>• Move your Python skills to the top of your skills section</li>
                      </ul>
                    </div>
                  )}
                  
                  {activeIndex === 3 && (
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-6 flex items-center">
                      <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center mr-4 border-4 border-blue-500">
                        <span className="text-blue-600 font-bold text-xl">89%</span>
                      </div>
                      <div>
                        <h4 className="font-medium text-blue-700 mb-1">Match Score</h4>
                        <p className="text-gray-600 text-sm">Your resume now closely matches the job requirements!</p>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex space-x-4">
                    <button
                      onClick={handlePrev}
                      disabled={activeIndex === 0}
                      className={`px-5 py-3 rounded-lg flex items-center transition-colors ${
                        activeIndex === 0 
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                          : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <ChevronLeft className="w-5 h-5 mr-2" />
                      Previous
                    </button>
                    <button
                      onClick={handleNext}
                      disabled={activeIndex === steps.length - 1}
                      className={`px-5 py-3 rounded-lg flex items-center transition-colors ${
                        activeIndex === steps.length - 1 
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                          : 'bg-purple-600 text-white hover:bg-purple-700'
                      }`}
                    >
                      {activeIndex === steps.length - 1 ? 'Finish' : 'Next'}
                      {activeIndex < steps.length - 1 && <ChevronRight className="w-5 h-5 ml-2" />}
                    </button>
                  </div>
                </div>
                
                {/* Right side - Image */}
                <div>
                  <Card className="overflow-hidden shadow-2xl rounded-xl">
                    <img 
                      src={steps[activeIndex].image} 
                      alt={steps[activeIndex].title}
                      className="w-full h-auto"
                    />
                  </Card>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
        
        <div className="mt-20 text-center">
          <div className="inline-block bg-purple-100 text-purple-800 px-4 py-2 rounded-full text-sm font-medium mb-4">
            Join thousands of successful job seekers
          </div>
          <p className="text-gray-500">
            "I applied to 5 jobs with tailored resumes and got 4 interviews. The job-matching feature was a game-changer!"
          </p>
          <p className="text-gray-700 font-medium mt-2">— Michael S., Software Engineer</p>
        </div>
      </div>
    </section>
  );
};

export default JobMatchResume;