
"use client"
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { MenuIcon, X } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { User } from '@supabase/auth-js';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  const supabase = createClient();

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    // Check current session
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
    };

    getSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };


  return (
    <nav 
      className={` top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'bg-white/90 backdrop-blur-md shadow-sm' : 'bg-transparent'
      }`}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <div className="flex items-center">
            <a href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded bg-blue-500 flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L20 7V17L12 22L4 17V7L12 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span className="text-xl font-semibold">ResumeAI</span>
            </a>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-sm font-medium hover:text-blue-500 transition-colors">Features</a>
            <a href="#templates" className="text-sm font-medium hover:text-blue-500 transition-colors">Templates</a>
            <a href="#pricing" className="text-sm font-medium hover:text-blue-500 transition-colors">Pricing</a>
            <a href="#faq" className="text-sm font-medium hover:text-blue-500 transition-colors">FAQ</a>
          </div>

          {/* Action Buttons */}
         <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-3">
                {user.user_metadata?.avatar_url && (
                  <img 
                    src={user.user_metadata.avatar_url} 
                    alt="Profile" 
                    className="w-8 h-8 rounded-full"
                  />
                )}
                <Button variant="ghost" size="sm" className="font-medium" onClick={handleLogout}>
                  Logout
                </Button>
              </div>
            ) : (
              <Button variant="ghost" size="sm" className="font-medium" onClick={handleLogin}>
                Login
              </Button>
            )}
            <Button size="sm" className="bg-blue-500 hover:bg-blue-600 text-white">
              Get Started
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X size={20} /> : <MenuIcon size={20} />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden bg-white px-4 pb-4 pt-2 border-t border-gray-100 animate-fade-in">
            <div className="flex flex-col space-y-4">
              <a href="#features" className="text-sm font-medium hover:text-blue-500 transition-colors py-2">Features</a>
              <a href="#templates" className="text-sm font-medium hover:text-blue-500 transition-colors py-2">Templates</a>
              <a href="#pricing" className="text-sm font-medium hover:text-blue-500 transition-colors py-2">Pricing</a>
              <a href="#faq" className="text-sm font-medium hover:text-blue-500 transition-colors py-2">FAQ</a>
              
              <div className="flex flex-col space-y-3 pt-2">
                {user ? (
                  <>
                    <div className="flex items-center space-x-2 mb-2">
                      {user.user_metadata?.avatar_url && (
                        <img 
                          src={user.user_metadata.avatar_url} 
                          alt="Profile" 
                          className="w-8 h-8 rounded-full"
                        />
                      )}
                    </div>
                    <Button variant="outline" size="sm" className="w-full font-medium" onClick={handleLogout}>
                      Logout
                    </Button>
                  </>
                ) : (
                  <Button variant="outline" size="sm" className="w-full font-medium" onClick={handleLogin}>
                    Login 
                  </Button>
                )}
                <Button size="sm" className="w-full bg-blue-500 hover:bg-blue-600 text-white">
                  Get Started
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;