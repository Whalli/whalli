'use client';

/**
 * App Shell v2
 * 
 * Enhanced layout with:
 * - PrimarySidebar with sections and icons
 * - ContextSidebar with page-specific widgets (auto-hides if empty)
 * - Keyboard shortcuts: ⌘B (primary), ⌘. (context)
 */

import { useState, useEffect, ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { Menu } from 'lucide-react';
import { PrimarySidebar } from '@/components/primary-sidebar';
import { ContextSidebar } from '@/components/context-sidebar';
import { PageContextProvider, usePageContext } from '@/contexts/page-context';

interface AppShellProps {
  children: ReactNode;
}

function AppShellContent({ children }: AppShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { widgets } = usePageContext();

  const hasContextWidgets = widgets.length > 0;

  // Close mobile menu when clicking outside
  useEffect(() => {
    if (mobileMenuOpen) {
      const handleClickOutside = () => setMobileMenuOpen(false);
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [mobileMenuOpen]);

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100">
      {/* Backdrop for mobile */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Primary Sidebar - Hidden on mobile by default, visible on desktop OR when mobile menu open */}
      <div className={`
        ${mobileMenuOpen ? 'fixed left-0 top-0 bottom-0 z-50 lg:relative' : 'hidden'}
        lg:block
      `}>
        <PrimarySidebar />
      </div>

      {/* Context Sidebar - Hidden on mobile by default, ALWAYS visible on desktop when widgets available */}
      {hasContextWidgets && (
        <div className={`
          ${mobileMenuOpen ? 'fixed left-16 top-0 bottom-0 z-50 lg:relative' : 'hidden'}
          lg:block
        `}>
          <ContextSidebar
            isOpen={true}
            onToggle={() => {
              if (window.innerWidth < 1024) {
                setMobileMenuOpen(false);
              }
            }}
          />
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="h-16 border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-sm flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            {/* Mobile Burger Button - Only visible on mobile */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setMobileMenuOpen(!mobileMenuOpen);
              }}
              className={`
                lg:hidden p-2 hover:bg-zinc-800 rounded-lg transition-all
                ${mobileMenuOpen ? 'bg-zinc-800 text-blue-400' : 'text-zinc-400'}
              `}
              aria-label="Toggle menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            
            {/* Page Title */}
            <h1 className="text-lg font-semibold capitalize">
              {pathname?.split('/').filter(Boolean)[0] || 'Dashboard'}
            </h1>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

export function AppShell({ children }: AppShellProps) {
  return (
    <PageContextProvider>
      <AppShellContent>{children}</AppShellContent>
    </PageContextProvider>
  );
}
