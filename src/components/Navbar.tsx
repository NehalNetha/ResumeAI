
"use client"
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { MenuIcon, X, Crown, Coins } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { User } from '@supabase/auth-js';
import Image from 'next/image';
import Link from 'next/link';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isPremium, setIsPremium] = useState(false);
  const [credits, setCredits] = useState<number | null>(null);

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
      
      // If user is logged in, check subscription status and credits
      if (session?.user) {
        const { data: subscription } = await supabase
          .from('user_subscriptions')
          .select('*')
          .eq('user_id', session.user.id)
          .eq('status', 'active')
          .single();
          
        setIsPremium(!!subscription);
        
        // Fetch user credits
        const { data: userCredits } = await supabase
          .from('user_credits')
          .select('credits')
          .eq('user_id', session.user.id)
          .single();
          
        setCredits(userCredits?.credits || 0);
      }
    };

    getSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);
      
      // Check subscription status and credits when auth state changes
      if (session?.user) {
        const { data: subscription } = await supabase
          .from('user_subscriptions')
          .select('*')
          .eq('user_id', session.user.id)
          .eq('status', 'active')
          .single();
          
        setIsPremium(!!subscription);
        
        // Fetch user credits
        const { data: userCredits } = await supabase
          .from('user_credits')
          .select('credits')
          .eq('user_id', session.user.id)
          .single();
          
        setCredits(userCredits?.credits || 0);
      } else {
        setIsPremium(false);
        setCredits(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

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
            <a href="/" className="flex items-center ">
              <div className="w-[100px] h-[100px] py-4 rounded flex items-center justify-center">
                <Image
                  src="/logo.svg"
                  alt="Logo"
                  width={200}
                  height={200}
                  className="w-full h-full "
                />
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
                {isPremium && (
                  <div className="flex items-center text-yellow-500" title="Premium Member">
                    <Crown size={16} className="mr-1" />
                    <span className="text-xs font-medium">Premium</span>
                  </div>
                )}
                
                {/* Display user credits */}
                <div className="flex items-center bg-gray-100 px-2 py-1 rounded-full" title="Available Credits">
                  <Coins size={14} className="text-yellow-500 mr-1" />
                  <span className="text-xs font-medium">{credits !== null ? credits : '...'}</span>
                </div>
                
                {user.user_metadata?.avatar_url && (
                  <img 
                    src={user.user_metadata.avatar_url} 
                    alt="Profile" 
                    className="w-8 h-8 rounded-full"
                  />
                )}
                <Button variant="ghost" size="sm" className="font-medium cursor-pointer" onClick={handleLogout}>
                  Logout
                </Button>
                <Link href="/dashboard">
                  <Button size="sm" className="bg-blue-500 hover:bg-blue-600 cursor-pointer text-white">
                    Dashboard
                  </Button>
                </Link>
              </div>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm" className="font-medium">
                    Login
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button size="sm" className="bg-blue-500 hover:bg-blue-600 text-white">
                    Get Started
                  </Button>
                </Link>
              </>
            )}
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
                      {isPremium && (
                        <div className="flex items-center text-yellow-500 mr-2" title="Premium Member">
                          <Crown size={16} className="mr-1" />
                          <span className="text-xs font-medium">Premium</span>
                        </div>
                      )}
                      
                      <div className="flex items-center bg-gray-100 px-2 py-1 rounded-full" title="Available Credits">
                        <Coins size={14} className="text-yellow-500 mr-1" />
                        <span className="text-xs font-medium">{credits !== null ? credits : '...'}</span>
                      </div>
                      
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
                    <Link href="/dashboard">
                      <Button size="sm" className="w-full bg-blue-500 hover:bg-blue-600 text-white">
                        Dashboard
                      </Button>
                    </Link>
                  </>
                ) : (
                  <>
                    <Link href="/login">
                      <Button variant="outline" size="sm" className="w-full font-medium">
                        Login
                      </Button>
                    </Link>
                    <Link href="/signup">
                      <Button size="sm" className="w-full bg-blue-500 hover:bg-blue-600 text-white">
                        Get Started
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;