import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  description?: string;
}

export default function AuthLayout({ children, title, description }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-50">
      {/* Left side - Branding */}
      <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-blue-500 to-indigo-600 p-10 flex-col justify-between relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-5">
          <svg className="w-full h-full" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="white" strokeWidth="0.3" />
            </pattern>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>
        
        {/* Rest of the left side content remains unchanged */}
        <div className="relative z-10">
          <Link href="/" className="flex items-center">
            <div className="w-[60px] h-[60px] rounded-xl flex items-center justify-center  p-2">
              <Image
                src="/logoFavicon.png"
                alt="ResumeAI Logo"
                width={80}
                height={80}
                className='rounded-md'
              />
            </div>
            <span className="text-xl font-bold text-white ml-3">ResumeRaft</span>
          </Link>
          
          <div className="mt-20">
            <h1 className="text-5xl font-bold text-white mb-6 leading-tight">
              Create professional resumes in minutes
            </h1>
            <p className="text-blue-100 text-xl max-w-md">
              AI-powered resume builder that helps you land your dream job
            </p>
            
            <div className="mt-10 flex items-center space-x-3">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="w-10 h-10 rounded-full border-2 border-blue-600 bg-blue-500 flex items-center justify-center text-white font-medium">
                    {String.fromCharCode(64 + i)}
                  </div>
                ))}
              </div>
              <p className="text-blue-100 ml-2">
                <span className="font-semibold text-white">500+</span> professionals using ResumeAI
              </p>
            </div>
          </div>
        </div>
        
        <div className="relative z-10 bg-white/10 backdrop-blur-sm rounded-xl p-6 mt-8 border border-white/20 shadow-lg">
          <div className="flex items-start">
            <div className="text-yellow-400 mr-2 mt-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </div>
            <p className="text-white italic mb-4 leading-relaxed">
              "ResumeAI helped me create a stunning resume that got me interviews at top tech companies. The AI suggestions were spot on!"
            </p>
          </div>
          <div className="flex items-center">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-medium shadow-md">
              JD
            </div>
            <div className="ml-4">
              <p className="text-white font-medium">John Doe</p>
              <p className="text-blue-200 text-sm">Senior Software Engineer @ Google</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Right side - Auth form */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-md">
          <div className="md:hidden flex items-center justify-center mb-10">
            <Link href="/" className="flex items-center">
              <div className="w-[50px] h-[50px] rounded-xl flex items-center justify-center bg-blue-50 p-2">
                <Image
                  src="/logo.svg"
                  alt="ResumeAI Logo"
                  width={35}
                  height={35}
                />
              </div>
              <span className="text-xl font-bold ml-3 text-gray-900">ResumeAI</span>
            </Link>
          </div>
          
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900">{title}</h2>
            {description && <p className="text-gray-500 mt-3">{description}</p>}
          </div>
          
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
            {children}
          </div>
          
          <div className="mt-8 text-center text-sm text-gray-500">
            <p>© {new Date().getFullYear()} ResumeAI. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  );
}