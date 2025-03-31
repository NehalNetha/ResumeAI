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
  Zap,
  LayoutTemplate // Added for potential future use or variation
} from 'lucide-react';
import Image from 'next/image';

const JobMatchResume = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  
  // Updated steps based on the dashboard workflow
  const steps = [
    {
      id: "select-source",
      title: "Choose Source & Template",
      description: "Start by selecting your base resume information (upload a file or pick saved data) and choose a professional template.",
      icon: <Upload className="h-6 w-6" />, // Represents input source
      number: 1,
      image: "/jobMatchResume/sc_one.png" // Placeholder image, update if needed
    },
    {
      id: "add-job-desc",
      title: "Paste Job Description",
      description: "Provide the job description you're targeting. Our AI reads it to understand exactly what the employer wants.",
      icon: <Target className="h-6 w-6" />, // Represents targeting the job
      number: 2,
      image: "/jobMatchResume/sc_two.png" // Placeholder image, update if needed
    },
    {
      id: "ai-tailor",
      title: "AI Generates & Tailors",
      description: "Watch as our AI crafts a new version of your resume, specifically optimized with keywords and content to match the job requirements.",
      icon: <Sparkles className="h-6 w-6" />, // Represents AI generation magic
      number: 3,
      image: "/jobMatchResume/sc_three.png" // Placeholder image, update if needed
    },
    {
      id: "review-export",
      title: "Review, Refine & Export",
      description: "Review the AI-generated resume, see the match score, optionally refine further using the assistant, and then download your job-ready PDF.",
      icon: <Zap className="h-6 w-6" />, // Represents finalizing and quick export
      number: 4,
      image: "/jobMatchResume/sc_four.png" // Placeholder image, update if needed
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
                      ? 'bg-blue-600 text-white scale-110' 
                      : 'bg-white text-gray-400 border-2 border-gray-200'}`}
                >
                  {step.number}
                </div>
                <div className={`mt-3 text-center transition-colors duration-300 max-w-[100px]
                  ${activeIndex >= index ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>
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
                  <div className="inline-flex items-center justify-center p-2 bg-blue-100 rounded-lg mb-6">
                    <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center">
                      {steps[activeIndex].icon}
                    </div>
                    <span className="ml-3 px-2 font-medium text-blue-800">Step {steps[activeIndex].number}</span>
                  </div>
                  
                  <h3 className="text-2xl font-bold mb-4 text-gray-800">{steps[activeIndex].title}</h3>
                  <p className="text-gray-600 mb-8 text-lg leading-relaxed">{steps[activeIndex].description}</p>
                  
                  {/* Pro Tip for Step 1 */}
                  {activeIndex === 0 && (
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6">
                      <h4 className="font-medium text-gray-700 mb-2">Pro Tip:</h4>
                      <p className="text-gray-600 text-sm">Ensure your selected resume information is up-to-date for best results. Choose a template that fits the industry standard.</p>
                    </div>
                  )}
                  
                  {activeIndex === 1 && (
                    <div className="flex flex-wrap gap-2 mb-6">
                      {["Python", "Project Management", "Communication", "Data Analysis", "Leadership"].map(skill => (
                        <span key={skill} className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm">
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}
                  
                   {/* Tailoring Example for Step 3 */}
                   {activeIndex === 2 && (
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200 mb-6">
                       <div className="flex items-center mb-2">
                         <Sparkles className="h-5 w-5 text-green-600 mr-2" />
                         <h4 className="font-medium text-green-700">AI Suggestions Implemented:</h4>
                       </div>
                       <ul className="text-gray-600 text-sm space-y-2">
                         <li>• Reworded project descriptions to include "Agile methodology".</li>
                         <li>• Added quantifiable results like "managed budgets up to $500k".</li>
                         <li>• Highlighted "Python" in the skills section prominently.</li>
                       </ul>
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
                          : 'bg-blue-600 text-white hover:bg-blue-700'
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
                    <Image 
                      src={steps[activeIndex].image} 
                      alt={steps[activeIndex].title}
                      className="w-full h-auto"
                      width={300}
                      height={600}

                    />
                  </Card>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
        
      
      </div>
    </section>
  );
};

export default JobMatchResume;