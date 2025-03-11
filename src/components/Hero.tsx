import React from 'react';
import { Button } from "@/components/ui/button";
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

const Hero = () => {
  return (
    <section className="relative pt-28 pb-20 md:pt-36 md:pb-32 hero-pattern overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-1/4 right-[15%] w-16 h-16 bg-blue-100 rounded opacity-50 animate-float"></div>
      <div className="absolute bottom-1/4 left-[10%] w-24 h-24 bg-blue-100 rounded opacity-50 animate-float delay-200"></div>
      <div className="absolute top-1/3 left-[20%] w-20 h-20 bg-blue-100 rounded opacity-50 animate-float delay-300"></div>
      <div className="absolute bottom-1/3 right-[20%] w-20 h-20 bg-blue-100 rounded opacity-50 animate-float delay-100"></div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          {/* Icon */}
          <div className="inline-flex items-center justify-center w-16 h-16 mb-8 bg-black rounded-xl text-white">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 5H7C5.89543 5 5 5.89543 5 7V19C5 20.1046 5.89543 21 7 21H17C18.1046 21 19 20.1046 19 19V7C19 5.89543 18.1046 5 17 5H15" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M9 5C9 3.89543 9.89543 3 11 3H13C14.1046 3 15 3.89543 15 5V7H9V5Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M9 12H15" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M9 16H15" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>

          {/* Headline */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-10 opacity-0 animate-fade-in">
            Build a Job-Winning Resume in Minutes with AI
          </h1>

          {/* Subheadline */}
          <p className="text-lg md:text-xl text-gray-600 mb-12 max-w-2xl mx-auto opacity-0 animate-fade-in-delayed">
            Our AI-based resume builder makes it easy to create a stunning resume that gets noticed by recruiters.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 opacity-0 animate-fade-in-delayed delay-200">
            <Button size="lg" className="bg-blue-500 hover:bg-blue-600 text-white font-medium px-8 h-12">
              <Link href="/dashboard">
                Get Started Free

              </Link>
            </Button>
            <Button variant="outline" size="lg" className="group flex items-center gap-2 h-12">
              See How It Works
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
