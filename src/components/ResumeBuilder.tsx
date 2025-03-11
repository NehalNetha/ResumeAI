"use client"
import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, User, FileText, Briefcase, GraduationCap, Download } from 'lucide-react';

const ResumeBuilder = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  
  const steps = [
    {
      id: "personal",
      title: "Enter Your Details",
      description: "Start by providing key information such as your job title, experience, and skills. Our AI-powered system tailors suggestions based on your input to match industry standards.",
      icon: <User className="h-6 w-6" />,
      number: 1,
      image: "/images/resume-step1.png"
    },
    {
      id: "summary",
      title: "AI Enhances Your Resume",
      description: "The AI instantly analyzes your details, suggesting improvements for clarity, relevance, and impact. It also formats your resume automatically, ensuring a professional and polished look.",
      icon: <FileText className="h-6 w-6" />,
      number: 2,
      image: "/images/resume-step2.png"
    },
    {
      id: "customize",
      title: "Customize & Preview in Real-Time",
      description: "Personalize your resume by selecting different templates, adjusting sections, and refining content. See instant changes as you fine-tune your resume to perfection.",
      icon: <Briefcase className="h-6 w-6" />,
      number: 3,
      image: "/images/resume-step3.png"
    },
    {
      id: "download",
      title: "Download or Share Instantly",
      description: "Once you're satisfied with your resume, download it in your preferred format or share it directly with potential employers—all in just a few clicks!",
      icon: <Download className="h-6 w-6" />,
      number: 4,
      image: "/images/resume-step4.png"
    }
  ];

  const handleNext = () => {
    setActiveIndex((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
  };

  const handlePrev = () => {
    setActiveIndex((prev) => (prev > 0 ? prev - 1 : prev));
  };

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Build Your Resume in Minutes</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Create a standout resume in just a few simple steps—quick, easy, and AI-powered
          </p>
        </div>

        <div className="relative">
          {/* Step indicators */}
          <div className="flex justify-center mb-12">
            <div className="flex items-center max-w-3xl w-full">
              {steps.map((step, index) => (
                <React.Fragment key={step.id}>
                  <div 
                    className={`flex flex-col items-center relative z-10 ${index !== 0 ? 'flex-1' : ''}`}
                    onClick={() => setActiveIndex(index)}
                  >
                    <div 
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-colors duration-300 cursor-pointer
                        ${activeIndex >= index 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-gray-100 text-gray-500 border border-gray-300'}`}
                    >
                      {step.number}
                    </div>
                    <div className={`mt-2 text-sm font-medium transition-colors duration-300 ${activeIndex >= index ? 'text-blue-600' : 'text-gray-500'}`}>
                      {step.title.split(' ')[0]}
                    </div>
                  </div>
                  
                  {index < steps.length - 1 && (
                    <div className="flex-1 h-0.5 relative">
                      <div className="absolute inset-0 bg-gray-200"></div>
                      <div 
                        className="absolute inset-0 bg-blue-600 transition-all duration-500 ease-in-out"
                        style={{ width: activeIndex > index ? '100%' : '0%' }}
                      ></div>
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Step content */}
          <div className="max-w-6xl mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={steps[activeIndex].id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
                className="flex flex-col md:flex-row gap-8 items-center"
              >
                <div className="md:w-1/2 order-2 md:order-1">
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <div className="flex items-center mb-4">
                      <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mr-4">
                        {steps[activeIndex].icon}
                      </div>
                      <h3 className="text-xl font-semibold">{steps[activeIndex].title}</h3>
                    </div>
                    <p className="text-gray-600 mb-6">{steps[activeIndex].description}</p>
                    
                    <div className="flex space-x-4">
                      <button
                        onClick={handlePrev}
                        disabled={activeIndex === 0}
                        className={`px-4 py-2 rounded-md flex items-center ${
                          activeIndex === 0 
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                            : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <ChevronLeft className="w-4 h-4 mr-2" />
                        Previous
                      </button>
                      <button
                        onClick={handleNext}
                        disabled={activeIndex === steps.length - 1}
                        className={`px-4 py-2 rounded-md flex items-center ${
                          activeIndex === steps.length - 1 
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                      >
                        Next
                        <ChevronRight className="w-4 h-4 ml-2" />
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="md:w-1/2 order-1 md:order-2">
                  <Card className="overflow-hidden shadow-lg border border-gray-200">
                    <img 
                      src={steps[activeIndex].image} 
                      alt={steps[activeIndex].title}
                      className="w-full h-auto"
                    />
                  </Card>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ResumeBuilder;