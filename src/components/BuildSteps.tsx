"use client"
import React from 'react';
import { motion } from "framer-motion";

const BuildSteps = () => {
  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Explore Professional Resume Templates</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Browse a variety of expertly designed resume templates tailored for different industries and career levels
          </p>
        </div>

        <div className="overflow-hidden">
          <div className="flex justify-center">
            <div className="max-w-6xl">
              <div className="flex overflow-x-auto pb-6 gap-6 snap-x scrollbar-hide">
                <motion.div 
                  className="min-w-[250px] w-full md:w-1/4 flex-shrink-0 snap-center overflow-hidden"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.1 }}
                >
                  <img 
                    src="/resumes/moden.png" 
                    alt="ATS Friendly Resume Template" 
                    className="w-full h-auto object-cover max-h-[400px] border border-gray-200 rounded-md transition-all duration-300 hover:scale-110 cursor-pointer hover:shadow-lg"
                  />
                  <p className="text-center mt-3 font-medium">ATS Friendly</p>
                </motion.div>
                
                <motion.div 
                  className="min-w-[250px] w-full md:w-1/4 flex-shrink-0 snap-center overflow-hidden"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.2 }}
                >
                  <img 
                    src="/resumes/sales.png" 
                    alt="Professional Resume Template" 
                    className="w-full h-auto object-cover max-h-[400px] border border-gray-200 rounded-md transition-all duration-300 hover:scale-110 cursor-pointer hover:shadow-lg"
                  />
                  <p className="text-center mt-3 font-medium">Professional</p>
                </motion.div>
                
                <motion.div 
                  className="min-w-[250px] w-full md:w-1/4 flex-shrink-0 snap-center overflow-hidden"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.3 }}
                >
                  <img 
                    src="/resumes/Hr.png" 
                    alt="Creative Resume Template" 
                    className="w-full h-auto object-cover max-h-[400px] border border-gray-200 rounded-md transition-all duration-300 hover:scale-110 cursor-pointer hover:shadow-lg"
                  />
                  <p className="text-center mt-3 font-medium">Creative</p>
                </motion.div>
                
                <motion.div 
                  className="min-w-[250px] w-full md:w-1/4 flex-shrink-0 snap-center overflow-hidden"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.4 }}
                >
                  <img 
                    src="/resumes/Fun.png" 
                    alt="Corporate Resume Template" 
                    className="w-full h-auto object-cover max-h-[400px] border border-gray-200 rounded-md transition-all duration-300 hover:scale-110 cursor-pointer hover:shadow-lg"
                  />
                  <p className="text-center mt-3 font-medium">Corporate</p>
                </motion.div>
                <motion.div 
                  className="min-w-[250px] w-full md:w-1/4 flex-shrink-0 snap-center overflow-hidden"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.4 }}
                >
                  <img 
                    src="/resumes/creative.png" 
                    alt="Corporate Resume Template" 
                    className="w-full h-auto object-cover max-h-[400px] border border-gray-200 rounded-md transition-all duration-300 hover:scale-110 cursor-pointer hover:shadow-lg"
                  />
                  <p className="text-center mt-3 font-medium">Corporate</p>
                </motion.div>
                <motion.div 
                  className="min-w-[250px] w-full md:w-1/4 flex-shrink-0 snap-center overflow-hidden"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.4 }}
                >
                  <img 
                    src="/resumes/ClassicProfessional.png" 
                    alt="Corporate Resume Template" 
                    className="w-full h-auto object-cover max-h-[400px] border border-gray-200 rounded-md transition-all duration-300 hover:scale-110 cursor-pointer hover:shadow-lg"
                  />
                  <p className="text-center mt-3 font-medium">Corporate</p>
                </motion.div>
                <motion.div 
                  className="min-w-[250px] w-full  md:w-1/4 flex-shrink-0 snap-center overflow-hidden"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.4 }}
                >
                  <img 
                    src="/resumes/academicCV.png" 
                    alt="Corporate Resume Template" 
                    className="w-full h-auto object-cover max-h-[400px] border border-gray-200 rounded-md transition-all duration-300 hover:scale-110 cursor-pointer hover:shadow-lg"
                  />
                  <p className="text-center mt-3 font-medium">Corporate</p>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BuildSteps;