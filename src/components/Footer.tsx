"use client"
import React from 'react';
import { ArrowUp } from 'lucide-react';

const Footer = () => {
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <footer className="border-t border-gray-200 bg-white">
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center">
          {/* Copyright and Support Email */}
          <div className="text-gray-600 text-sm">
            <p>© 2025 ResumeRaft. All rights reserved.</p>
            <p className="mt-1">Support: <a href="mailto:support@cvcraft.com" className="hover:text-blue-600 transition-colors">support@cvcraft.com</a></p>
          </div>

          {/* Scroll to Top Button */}
          <button 
            onClick={scrollToTop}
            className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white hover:bg-blue-600 transition-colors"
            aria-label="Scroll to top"
          >
            <ArrowUp size={18} />
          </button>
        </div>
      </div>
    </footer>
  );
};

export default Footer;