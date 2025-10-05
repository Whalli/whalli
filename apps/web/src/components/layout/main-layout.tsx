"use client";

import { ReactNode, useState } from 'react';
import { Menu, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  MessageSquare, 
  CheckSquare, 
  Folder,
  User
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface MainLayoutProps {
  children: ReactNode;
  user?: {
    name: string;
    email: string;
    avatar?: string;
  };
}

const navigation = [
  { name: 'Chat', href: '/chat', icon: MessageSquare },
  { name: 'Tasks', href: '/tasks', icon: CheckSquare },
  { name: 'Projects', href: '/projects', icon: Folder },
];

export function MainLayout({ children, user }: MainLayoutProps) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Menu Button - Sobre et disparaît quand ouvert */}
      {!isSidebarOpen && (
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="lg:hidden fixed top-4 left-4 z-50 p-2.5 text-foreground/70 hover:text-foreground transition-colors"
          aria-label="Toggle menu"
        >
          <Menu className="h-6 w-6" />
        </button>
      )}

      {/* Overlay */}
      {isSidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40 animate-fade-in"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen w-64 bg-sidebar flex flex-col transition-transform duration-300 ease-in-out",
          "lg:translate-x-0",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Close Button - Mobile only */}
        {isSidebarOpen && (
          <div className="lg:hidden flex justify-end p-4">
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="p-2 text-sidebar-foreground/70 hover:text-sidebar-foreground transition-colors"
              aria-label="Close menu"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        )}

        {/* Logo */}
        <div className="flex items-center justify-center h-20 border-b border-sidebar-hover">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-2xl font-bold text-sidebar-foreground">
              Whalli
            </span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsSidebarOpen(false)}
                className={cn(
                  "flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200",
                  "hover:bg-sidebar-hover",
                  isActive 
                    ? "bg-sidebar-active text-sidebar-foreground font-medium shadow-lg" 
                    : "text-sidebar-foreground/80"
                )}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                <span className="text-sm">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Avatar */}
        <div className="p-4 border-t border-sidebar-hover">
          <Link
            href="/profile"
            onClick={() => setIsSidebarOpen(false)}
            className="flex items-center space-x-3 p-3 rounded-lg hover:bg-sidebar-hover transition-colors group"
          >
            <div className="relative h-10 w-10 flex-shrink-0">
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="h-full w-full rounded-full object-cover border-2 border-sidebar-foreground/20"
                />
              ) : (
                <div className="h-full w-full rounded-full bg-sidebar-active flex items-center justify-center">
                  <User className="h-5 w-5 text-sidebar-foreground" />
                </div>
              )}
              <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-success border-2 border-sidebar" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {user?.name || 'User'}
              </p>
              <p className="text-xs text-sidebar-foreground/60 truncate">
                {user?.email || 'user@example.com'}
              </p>
            </div>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="min-h-screen">
        <div className="">
          {children}
        </div>
      </main>
    </div>
  );
}
