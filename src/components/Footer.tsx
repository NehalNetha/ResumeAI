"use client"
import React from 'react';
import Link from 'next/link';
import { Facebook, Twitter, Linkedin, Instagram, ArrowUp } from 'lucide-react';

const Footer = () => {
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <footer className="border-t border-gray-200 bg-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Logo and Contact Info */}
          <div className="space-y-4">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-blue-500 flex items-center justify-center rounded">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M19 10V16L12 20L5 16V10" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
            <div className="space-y-2 text-gray-600">
              <p>5123 Market St. #137</p>
              <p>Charlottesville, California 44635</p>
              <p>(021) 546-4356</p>
              <p>contactus@cvcraft.com</p>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="grid grid-cols-2 gap-8">
            <div>
              <ul className="space-y-3">
                <li><Link href="/" className="text-gray-600 hover:text-blue-600 transition-colors">Home</Link></li>
                <li><Link href="/features" className="text-gray-600 hover:text-blue-600 transition-colors">Features</Link></li>
                <li><Link href="/templates" className="text-gray-600 hover:text-blue-600 transition-colors">Templates</Link></li>
                <li><Link href="/pricing" className="text-gray-600 hover:text-blue-600 transition-colors">Pricing</Link></li>
                <li><Link href="/testimonials" className="text-gray-600 hover:text-blue-600 transition-colors">Testimonials</Link></li>
                <li><Link href="/faq" className="text-gray-600 hover:text-blue-600 transition-colors">FAQ</Link></li>
              </ul>
            </div>
            
            {/* Social Media Links */}
            <div>
              <ul className="space-y-3">
                <li><Link href="https://facebook.com" className="text-gray-600 hover:text-blue-600 transition-colors">Facebook</Link></li>
                <li><Link href="https://twitter.com" className="text-gray-600 hover:text-blue-600 transition-colors">Twitter</Link></li>
                <li><Link href="https://linkedin.com" className="text-gray-600 hover:text-blue-600 transition-colors">LinkedIn</Link></li>
                <li><Link href="https://instagram.com" className="text-gray-600 hover:text-blue-600 transition-colors">Instagram</Link></li>
              </ul>
            </div>
          </div>

          {/* Scroll to Top Button */}
          <div className="flex justify-end">
            <button 
              onClick={scrollToTop}
              className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white hover:bg-blue-600 transition-colors"
              aria-label="Scroll to top"
            >
              <ArrowUp size={20} />
            </button>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-12 text-center text-gray-600 text-sm">
          <p>© 2023 CVCRAFT. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;