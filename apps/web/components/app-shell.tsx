'use client';

/**
 * App Shell
 * 
 * Main layout with dual sidebars:
 * - Primary Sidebar (left): Global navigation, collapsible
 * - Context Sidebar (right): Page-scoped panel, auto-hides if no content
 * 
 * Dark, minimal, fluid design.
 */

import { useState, ReactNode } from 'react';
import { 
  Menu, 
  X, 
  MessageSquare, 
  FolderKanban, 
  Network, 
  Palette, 
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';

interface AppShellProps {
  children: ReactNode;
  contextSidebar?: ReactNode;
}

interface NavItem {
  label: string;
  icon: typeof MessageSquare;
  href: string;
}

const navItems: NavItem[] = [
  { label: 'Chat', icon: MessageSquare, href: '/chat' },
  { label: 'Projects', icon: FolderKanban, href: '/projects' },
  { label: 'Mindmaps', icon: Network, href: '/mindmaps' },
  { label: 'Presets', icon: Palette, href: '/presets' },
  { label: 'Settings', icon: Settings, href: '/settings' },
];

export function AppShell({ children, contextSidebar }: AppShellProps) {
  const [primaryOpen, setPrimaryOpen] = useState(true);
  const [contextOpen, setContextOpen] = useState(true);
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const hasContextSidebar = !!contextSidebar;

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100">
      {/* Primary Sidebar (Left) */}
      <aside
        className={`
          relative flex flex-col bg-zinc-900 border-r border-zinc-800 transition-all duration-300
          ${primaryOpen ? 'w-64' : 'w-16'}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-zinc-800">
          {primaryOpen && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600" />
              <span className="font-semibold">Whalli</span>
            </div>
          )}
          
          <button
            onClick={() => setPrimaryOpen(!primaryOpen)}
            className="p-2 hover:bg-zinc-800 rounded-lg transition-colors ml-auto"
            aria-label="Toggle sidebar"
          >
            {primaryOpen ? (
              <ChevronLeft className="w-5 h-5" />
            ) : (
              <ChevronRight className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname?.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors
                  ${isActive 
                    ? 'bg-blue-600 text-white' 
                    : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100'
                  }
                  ${!primaryOpen && 'justify-center'}
                `}
                title={!primaryOpen ? item.label : undefined}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {primaryOpen && (
                  <span className="font-medium">{item.label}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Section */}
        {user && (
          <div className="p-3 border-t border-zinc-800">
            {primaryOpen ? (
              <div className="flex items-center gap-3 px-3 py-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center text-sm font-semibold">
                  {user.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{user.name}</p>
                  <p className="text-xs text-zinc-500 truncate">{user.email}</p>
                </div>
                <button
                  onClick={logout}
                  className="p-1.5 hover:bg-zinc-800 rounded transition-colors"
                  title="Logout"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={logout}
                className="w-full p-2 hover:bg-zinc-800 rounded-lg transition-colors flex items-center justify-center"
                title="Logout"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        )}
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="h-16 border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-sm flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setPrimaryOpen(!primaryOpen)}
              className="lg:hidden p-2 hover:bg-zinc-800 rounded-lg transition-colors"
              aria-label="Toggle menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            
            {/* Breadcrumb or page title can go here */}
            <h1 className="text-lg font-semibold capitalize">
              {pathname?.split('/')[1] || 'Dashboard'}
            </h1>
          </div>

          {/* Context Sidebar Toggle */}
          {hasContextSidebar && (
            <button
              onClick={() => setContextOpen(!contextOpen)}
              className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
              aria-label="Toggle context panel"
            >
              <ChevronLeft className={`w-5 h-5 transition-transform ${contextOpen ? '' : 'rotate-180'}`} />
            </button>
          )}
        </header>

        {/* Content Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Main Content */}
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>

          {/* Context Sidebar (Right) */}
          {hasContextSidebar && (
            <aside
              className={`
                bg-zinc-900 border-l border-zinc-800 transition-all duration-300 overflow-y-auto
                ${contextOpen ? 'w-80' : 'w-0'}
              `}
            >
              {contextOpen && (
                <div className="p-6">
                  {contextSidebar}
                </div>
              )}
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}
