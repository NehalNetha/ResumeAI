"use client"
import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from "framer-motion";

const BuildSteps = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  
  const templates = [
    {
      id: "ats",
      title: "ATS Friendly",
      image: "/resumes/resumeOne.png",
    },
    {
      id: "professional",
      title: "Professional",
      image: "/resumes/resumeTwo.png",
    },
    {
      id: "creative",
      title: "Creative",
      image: "/resumes/resumeThree.png",
    },
    {
      id: "corporate",
      title: "Corporate",
      image: "/resumes/resumeOne.png", // Using resumeOne as placeholder, replace with actual corporate template
    }
  ];

  const handleNext = () => {
    setActiveIndex((prev) => (prev < templates.length - 1 ? prev + 1 : prev));
  };

  const handlePrev = () => {
    setActiveIndex((prev) => (prev > 0 ? prev - 1 : prev));
  };

  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Explore Professional Resume Templates</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Browse a variety of expertly designed resume templates tailored for different industries and career levels
          </p>
        </div>

        <Tabs value={templates[activeIndex].id} onValueChange={(value) => setActiveIndex(templates.findIndex(template => template.id === value))}>
          <div className="flex justify-center mb-8">
            <TabsList className="flex gap-6 p-1 bg-transparent">
              {templates.map((template, index) => (
                <TabsTrigger
                  key={template.id}
                  value={template.id}
                  className={`px-4 py-2 text-sm transition-all duration-300 ease-in-out rounded-md ${
                    activeIndex === index 
                      ? "bg-blue-50 text-blue-600 font-medium border-b-2 border-blue-500" 
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                  onClick={() => setActiveIndex(index)}
                >
                  {index === 0 && (
                    <svg className="w-4 h-4 mr-2 inline" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M9 12L11 14L15 10M20 12C20 16.4183 16.4183 20 12 20C7.58172 20 4 16.4183 4 12C4 7.58172 7.58172 4 12 4C16.4183 4 20 7.58172 20 12Z" 
                        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                  {index === 1 && (
                    <svg className="w-4 h-4 mr-2 inline" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M19 21V5C19 3.89543 18.1046 3 17 3H7C5.89543 3 5 3.89543 5 5V21M19 21H5M19 21H21M5 21H3M9 7H15M9 11H15M9 15H13" 
                        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                  {index === 2 && (
                    <svg className="w-4 h-4 mr-2 inline" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M4 16L8.58579 11.4142C9.36683 10.6332 10.6332 10.6332 11.4142 11.4142L16 16M14 14L15.5858 12.4142C16.3668 11.6332 17.6332 11.6332 18.4142 12.4142L20 14M14 8H14.01M6 20H18C19.1046 20 20 19.1046 20 18V6C20 4.89543 19.1046 4 18 4H6C4.89543 4 4 4.89543 4 6V18C4 19.1046 4.89543 20 6 20Z" 
                        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                  {index === 3 && (
                    <svg className="w-4 h-4 mr-2 inline" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M21 13.2554C20.4734 13.1083 19.9146 13 19.3333 13C16.7478 13 14.5199 14.6479 13.6634 17M21 13.2554V10H17.6447M21 13.2554C21.614 13.4237 22.1974 13.6547 22.7365 13.9403M13.6634 17H16.5M13.6634 17C13.2897 17.7763 13.0833 18.6421 13.0833 19.5556C13.0833 20.2593 13.1907 20.9368 13.3918 21.5721M18.7917 5.44444C18.7917 7.89904 16.7894 9.88889 14.3333 9.88889C11.8773 9.88889 9.875 7.89904 9.875 5.44444C9.875 2.98985 11.8773 1 14.3333 1C16.7894 1 18.7917 2.98985 18.7917 5.44444ZM10.1094 13.4831C9.58801 13.1683 9.01342 12.9443 8.4 12.8333C7.92483 12.7523 7.43345 12.7083 6.93333 12.7083C4.08883 12.7083 1.66667 14.3092 1.66667 16.2778V21H10.9635M10.1094 13.4831C10.7658 14.2404 11.2378 15.1794 11.4365 16.2222M10.1094 13.4831L10.9635 21M10.9635 21H13.3918M13.3918 21.5721C13.3918 21.5721 13.3918 21.5721 13.3918 21.5721L13.3918 21" 
                        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                  {template.title}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <div className="overflow-hidden">
            <div className="flex justify-center">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl">
                <AnimatePresence mode="wait">
                  {templates.map((template, index) => (
                    <TabsContent key={template.id} value={template.id} className="mt-0 col-span-3">
                      <div className="flex overflow-x-auto pb-6 gap-6 snap-x scrollbar-hide">
                        <motion.div 
                          className="min-w-[250px] w-full md:w-1/4 flex-shrink-0 snap-center overflow-hidden"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.4, delay: 0.1 }}
                        >
                            <img 
                              src="/resumes/resumeOne.png" 
                              alt="Classic Resume Template" 
                              className="w-full h-auto object-cover max-h-[400px] border border-gray-200 rounded-md transition-all duration-300 hover:scale-110 cursor-pointer hover:shadow-lg"
                            />
                         
                        </motion.div>
                        
                        <motion.div 
                          className="min-w-[250px] w-full md:w-1/4 flex-shrink-0 snap-center overflow-hidden"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.4, delay: 0.2 }}
                        >
                            <img 
                              src="/resumes/resumeTwo.png" 
                              alt="Modern Resume Template" 
                              className="w-full h-auto object-cover max-h-[400px] border border-gray-200 rounded-md transition-all duration-300 hover:scale-110 cursor-pointer hover:shadow-lg"
                            />
                           
                        </motion.div>
                        
                        <motion.div 
                          className="min-w-[250px] w-full md:w-1/4 flex-shrink-0 snap-center overflow-hidden"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.4, delay: 0.3 }}
                        >
                            <img 
                              src="/resumes/resumeThree.png" 
                              alt="Executive Resume Template" 
                              className="w-full h-auto object-cover max-h-[400px] border border-gray-200 rounded-md transition-all duration-300 hover:scale-110 cursor-pointer hover:shadow-lg"
                            />
                          
                          
                        </motion.div>
                        
                        <motion.div 
                          className="min-w-[250px] w-full md:w-1/4 flex-shrink-0 snap-center overflow-hidden"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.4, delay: 0.3 }}
                        >
                            <img 
                              src="/resumes/resumeThree.png" 
                              alt="Executive Resume Template" 
                              className="w-full h-auto object-cover max-h-[400px] border border-gray-200 rounded-md transition-all duration-300 hover:scale-110 cursor-pointer hover:shadow-lg"
                            />
                          
                          
                        </motion.div>

                        <motion.div 
                          className="min-w-[250px] w-full md:w-1/4 flex-shrink-0 snap-center overflow-hidden"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.4, delay: 0.3 }}
                        >
                            <img 
                              src="/resumes/resumeThree.png" 
                              alt="Executive Resume Template" 
                              className="w-full h-auto object-cover max-h-[400px] border border-gray-200 rounded-md transition-all duration-300 hover:scale-110 cursor-pointer hover:shadow-lg"
                            />
                          
                          
                        </motion.div>

                        <motion.div 
                          className="min-w-[250px] w-full md:w-1/4 flex-shrink-0 snap-center overflow-hidden"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.4, delay: 0.3 }}
                        >
                            <img 
                              src="/resumes/resumeThree.png" 
                              alt="Executive Resume Template" 
                              className="w-full h-auto object-cover max-h-[400px] border border-gray-200 rounded-md transition-all duration-300 hover:scale-110 cursor-pointer hover:shadow-lg"
                            />
                          
                          
                        </motion.div>
                      </div>
                    </TabsContent>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </Tabs>
      </div>
    </section>
  );
};

export default BuildSteps;