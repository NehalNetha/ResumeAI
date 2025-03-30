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
  Save
} from 'lucide-react';

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
          <Link 
            href={!isCollapsed ? "/" : ""} 
            onClick={isCollapsed ? toggleSidebar : undefined}
            className="flex items-center gap-2"
          >
            <div className="w-8 h-8 rounded bg-blue-500 flex items-center justify-center cursor-pointer">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L20 7V17L12 22L4 17V7L12 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            {!isCollapsed && <span className="text-xl font-semibold">ResumeAI</span>}
          </Link>


          {!isCollapsed && (
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              className="hidden lg:flex hover:bg-transparent"
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
              title="Template" 
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
            <SidebarItem 
              icon={<Settings size={20} />} 
              title="Settings" 
              href="/dashboard/settings" 
              isActive={pathname === '/dashboard/settings'}
              collapsed={isCollapsed}
            />
          </div>
        </div>

        {/* User Profile */}
        <div className="p-4 border-t flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0"></div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">John Doe</p>
              <p className="text-xs text-gray-500 truncate">john@example.com</p>
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