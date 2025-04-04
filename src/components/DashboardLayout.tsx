"use client"

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  Settings, 
  Bell,
  User,
  PanelLeft,
  PenLine,
  Save,
  Coins,
  LogOut
} from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { User as SupabaseUser } from '@supabase/auth-js';
import { fetchUserCredits } from '@/utils/credits/credits';

type SidebarItemProps = {
  icon: React.ReactNode;
  title: string;
  href: string;
  isActive?: boolean;
  collapsed?: boolean;
};

const SidebarItem = ({ icon, title, href, isActive, collapsed }: SidebarItemProps) => {
  return (
    <Link 
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-gray-100",
        isActive ? "bg-gray-100 text-blue-600 font-medium" : "text-gray-700"
      )}
    >
      {icon}
      {!collapsed && title}
    </Link>
  );
};

import { Menu, X } from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [userCredits, setUserCredits] = useState<number>(0);
  const [isLoadingCredits, setIsLoadingCredits] = useState(false);
  const supabase = createClient();

  // Handle mobile view
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsCollapsed(true);
      }
    };

    handleResize(); // Initial check
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchUserInfo = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUser(user);
    } catch (error) {
      console.error('Error fetching user info:', error);
    }
  };

  const loadUserCredits = async (userId: string) => {
    try {
      setIsLoadingCredits(true);
      const credits = await fetchUserCredits(userId);
      setUserCredits(credits);
    } catch (error) {
      console.error('Error loading user credits:', error);
    } finally {
      setIsLoadingCredits(false);
    }
  };

  useEffect(() => {
    fetchUserInfo();
  }, []);

  useEffect(() => {
    if (user?.id) {
      loadUserCredits(user.id);
    }
  }, [user?.id]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/'; // Redirect to home page after logout
  };

  const toggleSidebar = () => {
    if (window.innerWidth >= 768) {
      setIsCollapsed(!isCollapsed);
    } else {
      setIsMobileMenuOpen(!isMobileMenuOpen);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Mobile Menu Toggle - Moved to right side */}
      <button
        className="md:hidden fixed top-4 right-4 z-50 p-2 bg-white rounded-lg shadow-md"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      >
        {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex flex-col bg-white border-r transition-all duration-300",
          isCollapsed ? "w-[70px]" : "w-[240px]",
          "md:translate-x-0",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Sidebar Header */}
        <div className="flex h-16 items-center justify-between px-4 border-b">
          {/* Container for Logo and Title - Use relative positioning */}
          <Link
            href={!isCollapsed ? "/" : "#"} // Navigate to home only when expanded
            onClick={isCollapsed ? (e) => { e.preventDefault(); toggleSidebar(); } : undefined} // Prevent navigation and toggle when collapsed
            className={cn(
              "relative h-full", // Add relative position context, use full height of parent
              // Adjust width: enough for logo when collapsed, wider when expanded
              isCollapsed ? "w-8" : "w-40" 
            )}
            aria-label={isCollapsed ? "Expand Sidebar" : "Go to Homepage"}
          >
            {/* Absolutely position the logo within the Link */}
            <img
              src="/logo.png"
              alt="Logo"
              // Position absolutely, center vertically, place at the left
              className={`absolute top-1/2 left-0 transform -translate-y-1/2 ${isCollapsed ? "h-10 w-11": "h-16 w-16" }`}
            />
             {/* Absolutely position the Title, show only when not collapsed */}
            {!isCollapsed && (
              <span className="absolute top-1/2 left-14 transform -translate-y-1/2 text-xl font-semibold whitespace-nowrap"> {/* Position to the right of the logo */}
                ResumeAI
              </span>
            )}
          </Link>

          {/* Collapse Button */}
          {!isCollapsed && (
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              className="hidden lg:flex hover:bg-transparent" // This part remains the same
            >
              <PanelLeft />
            </Button>
          )}
          
        </div>

        {/* Sidebar Content */}
        <div className="flex-1 overflow-auto py-4 px-3">
          <div className="space-y-4">
            <SidebarItem 
              icon={<LayoutDashboard size={20} />} 
              title="Dashboard" 
              href="/dashboard" 
              isActive={pathname === '/dashboard'}
              collapsed={isCollapsed}
            />
            <SidebarItem 
              icon={<FileText size={20} />} 
              title="My Resumes" 
              href="/dashboard/resume-upload" 
              isActive={pathname === '/dashboard/resume-upload'}
              collapsed={isCollapsed}
            />
            <SidebarItem 
              icon={<Users size={20} />} 
              title="Templates" 
              href="/dashboard/templates" 
              isActive={pathname === '/dashboard/templates'}
              collapsed={isCollapsed}
            />
            <SidebarItem 
              icon={<PenLine size={20} />} 
              title="Create Resume" 
              href="/dashboard/create-resume" 
              isActive={pathname === '/dashboard/create-resume'}
              collapsed={isCollapsed}
            />

            <SidebarItem 
              icon={<Save size={20} />} 
              title="Created Resumes" 
              href="/dashboard/saved-resumes" 
              isActive={pathname === '/dashboard/saved-resume'}
              collapsed={isCollapsed}
            />
            <SidebarItem 
              icon={<User size={20} />} 
              title="Profile" 
              href="/dashboard/profile" 
              isActive={pathname === '/dashboard/profile'}
              collapsed={isCollapsed}
            />
         
          </div>
        </div>

        {/* User Profile - Updated */}
        <div className="p-4 border-t">
          {user ? (
            <div className="flex flex-col space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {user.user_metadata?.avatar_url ? (
                    <img 
                      src={user.user_metadata.avatar_url} 
                      alt="Profile" 
                      className="w-8 h-8 rounded-full flex-shrink-0"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0"></div>
                  )}
                  
                  {!isCollapsed && (
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>
                  )}
                </div>
                
                {!isCollapsed && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleLogout}
                    className="text-gray-500 hover:text-red-500 ml-2"
                  >
                    <LogOut size={16} />
                  </Button>
                )}
              </div>
              
              
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0"></div>
              {!isCollapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">Loading...</p>
                  <p className="text-xs text-gray-500 truncate">Please wait</p>
                </div>
              )}
            </div>
          )}
        </div>
      </aside>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className={cn(
        "flex-1 transition-all duration-300",
        isCollapsed ? "md:ml-[70px]" : "md:ml-[240px]",
        "ml-0" // Always 0 margin on mobile
      )}>
        {children}
      </div>
    </div>
  );
}