'use client';

/**
 * Primary Sidebar
 * 
 * Left sidebar with sections for navigation, actions, and user profile.
 * Supports keyboard shortcuts and collapsible state.
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  MessageSquare,
  KanbanSquare,
  GitBranch,
  Palette,
  Search,
  Settings,
  HelpCircle,
  LogOut,
} from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { LogoSquare } from '@/components/logo-square';
import type { LucideIcon } from 'lucide-react';

interface NavSection {
  label: string;
  items: NavItem[];
}

interface NavItem {
  label: string;
  icon: LucideIcon;
  href: string;
  badge?: string | number;
}

const navSections: NavSection[] = [
  {
    label: 'Main',
    items: [
      { label: 'Chat', icon: MessageSquare, href: '/chat' },
      { label: 'Projects', icon: KanbanSquare, href: '/projects' },
      { label: 'Mindmaps', icon: GitBranch, href: '/mindmaps' },
    ],
  },
  {
    label: 'Tools',
    items: [
      { label: 'Presets', icon: Palette, href: '/presets' },
      { label: 'Search', icon: Search, href: '/search' },
    ],
  },
  {
    label: 'System',
    items: [
      { label: 'Settings', icon: Settings, href: '/settings' },
      { label: 'Help', icon: HelpCircle, href: '/help' },
    ],
  },
];

export function PrimarySidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <aside className="h-screen w-16 flex flex-col bg-zinc-900 border-r border-zinc-800">
      {/* Header */}
      <div className="flex items-center justify-center h-16 border-b border-zinc-800">
        <LogoSquare className="w-10 h-auto" color="white" />
      </div>

      {/* Navigation Sections */}
      <nav className="flex-1 p-2 space-y-1 overflow-hidden">
        {navSections.map((section) => (
          <div key={section.label} className="space-y-1">
            {section.items.map((item) => {
              const Icon = item.icon;
              const isActive = pathname?.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    flex items-center justify-center w-12 h-12 rounded-lg transition-all group relative
                    ${isActive 
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                      : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100'
                    }
                  `}
                  title={item.label}
                >
                  <Icon className="w-5 h-5" />
                  
                  {/* Tooltip */}
                  <div className="absolute left-full ml-2 px-2 py-1 bg-zinc-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity">
                    {item.label}
                  </div>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* User Section */}
      {user && (
        <div className="p-2 border-t border-zinc-800 space-y-2">
          {/* User Avatar */}
          <div className="flex items-center justify-center relative group">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center text-sm font-semibold cursor-pointer">
              {user.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            
            {/* Tooltip */}
            <div className="absolute left-full ml-2 px-2 py-1 bg-zinc-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity">
              {user.name}
            </div>
          </div>
          
          {/* Logout Icon */}
          <button
            onClick={logout}
            className="w-full p-2 hover:bg-zinc-800 hover:text-red-400 rounded-lg transition-colors flex items-center justify-center text-zinc-400 relative group"
            title="Logout"
          >
            <LogOut className="w-5 h-5" />
            
            {/* Tooltip */}
            <div className="absolute left-full ml-2 px-2 py-1 bg-zinc-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity">
              Logout
            </div>
          </button>
        </div>
      )}
    </aside>
  );
}
