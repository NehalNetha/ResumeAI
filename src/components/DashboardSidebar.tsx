"use client"

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  PlusCircle,
  Bell,
  User,
  PanelLeft
} from 'lucide-react';

type SidebarItemProps = {
  icon: React.ReactNode;
  title: string;
  href: string;
  isActive?: boolean;
};

const SidebarItem = ({ icon, title, href, isActive }: SidebarItemProps) => {
  return (
    <Link 
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-gray-100",
        isActive ? "bg-gray-100 text-blue-600 font-medium" : "text-gray-700"
      )}
    >
      {icon}
      {title}
    </Link>
  );
};

const DashboardSidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const pathname = usePathname();

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const toggleMobileSidebar = () => {
    setIsMobileOpen(!isMobileOpen);
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Toggle Button - Moved outside sidebar */}
      
     
          
          {/* Sidebar */}
          <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex flex-col bg-white border-r transition-all duration-300 lg:relative",
          isCollapsed ? "w-[70px]" : "w-[240px]",
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
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
              title={isCollapsed ? "" : "Dashboard"} 
              href="/dashboard" 
              isActive={pathname === '/dashboard'}
            />
            <SidebarItem 
              icon={<FileText size={20} />} 
              title={isCollapsed ? "" : "My Resumes"} 
              href="/dashboard/resume-upload" 
              isActive={pathname === '/dashboard/resume-upload'}
            />
            <SidebarItem 
              icon={<Users size={20} />} 
              title={isCollapsed ? "" : "Template"} 
              href="/dashboard/templates" 
              isActive={pathname === '/dashboard/templates'}
            />
            <SidebarItem 
              icon={<Bell size={20} />} 
              title={isCollapsed ? "" : "Create Resume"} 
              href="/dashboard/create-resume" 
              isActive={pathname === '/dashboard/create-resume'}
            />
            <SidebarItem 
              icon={<User size={20} />} 
              title={isCollapsed ? "" : "Profile"} 
              href="/dashboard/profile" 
              isActive={pathname === '/dashboard/profile'}
            />
            <SidebarItem 
              icon={<Settings size={20} />} 
              title={isCollapsed ? "" : "Settings"} 
              href="/dashboard/settings" 
              isActive={pathname === '/dashboard/settings'}
            />
          </div>
        </div>

        {/* Create New Resume Button */}
        {/* <div className="p-4 border-t">
          {isCollapsed ? (
            <Button size="icon" className="w-full bg-blue-500 hover:bg-blue-600">
              <PlusCircle size={20} />
            </Button>
          ) : (
            <Button className="w-full bg-blue-500 hover:bg-blue-600">
              <PlusCircle size={20} className="mr-2" />
              Create Resume
            </Button>
          )}
        </div> */}

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
    </>
  );
};

export default DashboardSidebar;