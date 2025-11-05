'use client';

/**
 * Admin Sidebar
 * Left navigation for admin panel
 */

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@whalli/utils';
import { 
  Users, 
  Cpu, 
  Palette, 
  BarChart3, 
  Settings, 
  ChevronLeft,
  Menu,
  Shield
} from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: typeof Users;
}

const navItems: NavItem[] = [
  { label: 'Users', href: '/users', icon: Users },
  { label: 'Models', href: '/models', icon: Cpu },
  { label: 'Presets', href: '/presets', icon: Palette },
  { label: 'Analytics', href: '/analytics', icon: BarChart3 },
  { label: 'System', href: '/system', icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        'flex flex-col bg-zinc-900 border-r border-zinc-800 transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-zinc-800">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-violet-500" />
            <span className="font-bold text-lg text-zinc-100">Admin</span>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-2 rounded-lg hover:bg-zinc-800 transition-colors text-zinc-400 hover:text-zinc-100"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <Menu className="w-5 h-5" />
          ) : (
            <ChevronLeft className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
                'hover:bg-zinc-800',
                isActive
                  ? 'bg-violet-500/10 text-violet-400 hover:bg-violet-500/20'
                  : 'text-zinc-400 hover:text-zinc-100'
              )}
              title={collapsed ? item.label : undefined}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && (
                <span className="font-medium">{item.label}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User info */}
      <div className="p-3 border-t border-zinc-800">
        <div
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-lg',
            collapsed ? 'justify-center' : ''
          )}
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-bold text-white">A</span>
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-zinc-100 truncate">
                Admin User
              </p>
              <p className="text-xs text-zinc-500 truncate">
                admin@whalli.io
              </p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
