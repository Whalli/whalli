"use client";

import { ReactNode, useState } from 'react';
import { Menu, X, MessageSquare, CheckSquare, Folder, User } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { WhalliIcon } from '@/components/logo';

interface DualSidebarLayoutProps {
  children: ReactNode;
  user?: {
    name: string;
    email: string;
    avatar?: string;
  };
  secondarySidebar?: ReactNode; // Sidebar contextuelle
  showSecondarySidebar?: boolean;
}

export function DualSidebarLayout({ 
  children, 
  user, 
  secondarySidebar,
  showSecondarySidebar = false 
}: DualSidebarLayoutProps) {
  const [areSidebarsOpen, setAreSidebarsOpen] = useState(false);

  const closeSidebars = () => {
    setAreSidebarsOpen(false);
  };

  const toggleSidebars = () => {
    setAreSidebarsOpen(!areSidebarsOpen);
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Mobile Menu Button - Fixed top-left (contrôle les deux sidebars) */}
      {!areSidebarsOpen && (
        <button
          onClick={toggleSidebars}
          className="lg:hidden fixed top-4 left-4 z-[60] p-2.5 text-foreground/70 hover:text-foreground transition-colors"
          aria-label="Toggle menu"
        >
          <Menu className="h-6 w-6" />
        </button>
      )}

      {/* Overlay for mobile - Appears when sidebar is open */}
      {areSidebarsOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40 animate-fade-in"
          onClick={closeSidebars}
          aria-hidden="true"
        />
      )}

      {/* Primary Navigation Sidebar */}
      <aside className={`
        fixed left-0 top-0 z-50 h-screen w-20 bg-sidebar border-r border-sidebar-hover flex flex-col items-center py-6
        transition-transform duration-300 ease-in-out
        lg:translate-x-0
        ${areSidebarsOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Close Button - Mobile only, at the top */}
        {areSidebarsOpen && (
          <button
            onClick={closeSidebars}
            className="lg:hidden mb-4 p-2 text-sidebar-foreground/70 hover:text-sidebar-foreground transition-colors"
            aria-label="Close menu"
          >
            <X className="h-6 w-6" />
          </button>
        )}

        {/* Logo */}
        <div className={areSidebarsOpen ? "mb-4" : "mb-8"}>
          <div className="w-12 h-12 flex items-center justify-center">
            <WhalliIcon 
              color="#FFF"
              height={48} 
              className="hover:opacity-80 transition-opacity"
            />
          </div>
        </div>

        {/* Navigation Icons */}
        <nav className="flex-1 flex flex-col items-center space-y-4">
          <NavIcon href="/chat" icon={MessageSquare} label="Chats" />
          <NavIcon href="/tasks" icon={CheckSquare} label="Tasks" />
          <NavIcon href="/projects" icon={Folder} label="Projects" />
        </nav>

        {/* User Avatar at bottom */}
        <div className="mt-auto">
          <a 
            href="/profile"
            className="w-12 h-12 rounded-full bg-sidebar-active flex items-center justify-center hover:bg-sidebar-hover transition-colors"
          >
            {user?.avatar ? (
              <img 
                src={user.avatar} 
                alt={user.name}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <User className="w-6 h-6 text-sidebar-foreground" />
            )}
          </a>
        </div>
      </aside>

      {/* Secondary Contextual Sidebar - Conditional */}
      {showSecondarySidebar && secondarySidebar && (
        <>

          <aside className={`
            fixed top-0 z-40 h-screen w-64 bg-primary text-primary-foreground border-r border-primary-foreground/10
            transition-transform duration-300 ease-in-out
            lg:left-20 lg:translate-x-0
            ${areSidebarsOpen ? 'left-20 translate-x-0' : 'left-0 -translate-x-full lg:translate-x-0'}
          `}>
            {secondarySidebar}
          </aside>
        </>
      )}

      {/* Main Content */}
            {/* Main Content */}
      <main 
        className={`
          flex-1 w-full h-screen flex flex-col
          transition-all duration-300
          ${showSecondarySidebar ? 'lg:ml-[336px]' : 'lg:ml-20'}
        `}
      >
        {children}
      </main>
    </div>
  );
}

interface NavIconProps {
  href: string;
  icon: LucideIcon;
  label: string;
}

function NavIcon({ href, icon: Icon, label }: NavIconProps) {
  return (
    <a
      href={href}
      className="group relative w-12 h-12 rounded-lg bg-transparent hover:bg-sidebar-hover active:bg-sidebar-active transition-colors flex items-center justify-center"
      aria-label={label}
    >
      <Icon className="w-6 h-6 text-sidebar-foreground" />
      {/* Tooltip - Desktop only */}
      <span className="hidden lg:block absolute left-full ml-4 px-3 py-2 bg-card text-foreground text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-lg">
        {label}
      </span>
    </a>
  );
}
