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
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left side - Branding */}
      <div className="hidden md:flex md:w-1/2 bg-blue-600 p-8 flex-col justify-between">
        <div>
          <Link href="/" className="flex items-center">
            <div className="w-[80px] h-[80px] rounded flex items-center justify-center bg-white p-2">
              <Image
                src="/logo.svg"
                alt="ResumeAI Logo"
                width={60}
                height={60}
              />
            </div>
            <span className="text-xl font-semibold text-white ml-2">ResumeAI</span>
          </Link>
          
          <div className="mt-16">
            <h1 className="text-4xl font-bold text-white mb-4">
              Create professional resumes in minutes
            </h1>
            <p className="text-blue-100 text-lg">
              AI-powered resume builder that helps you land your dream job
            </p>
          </div>
        </div>
        
        <div className="bg-blue-700 rounded-lg p-6 mt-8">
          <p className="text-blue-100 italic mb-4">
            "ResumeAI helped me create a stunning resume that got me interviews at top tech companies. Highly recommended!"
          </p>
          <div className="flex items-center">
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium">
              JD
            </div>
            <div className="ml-3">
              <p className="text-white font-medium">John Doe</p>
              <p className="text-blue-200 text-sm">Software Engineer</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Right side - Auth form */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-md">
          <div className="md:hidden flex items-center justify-center mb-8">
            <Link href="/" className="flex items-center">
              <div className="w-[60px] h-[60px] rounded flex items-center justify-center">
                <Image
                  src="/logo.svg"
                  alt="ResumeAI Logo"
                  width={50}
                  height={50}
                />
              </div>
              <span className="text-xl font-semibold ml-2">ResumeAI</span>
            </Link>
          </div>
          
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold">{title}</h2>
            {description && <p className="text-gray-500 mt-2">{description}</p>}
          </div>
          
          {children}
        </div>
      </div>
    </div>
  );
}