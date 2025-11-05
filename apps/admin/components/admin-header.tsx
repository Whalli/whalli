'use client';

/**
 * Admin Header
 * Top bar with breadcrumbs and quick actions
 */

import { Bell, Search } from 'lucide-react';
import { Button } from '@whalli/ui';

export function AdminHeader() {
  return (
    <header className="h-16 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between px-6">
      {/* Search */}
      <div className="flex-1 max-w-xl">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search users, presets, analytics..."
            className="w-full pl-10 pr-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="relative"
          title="Notifications"
        >
          <Bell className="w-5 h-5" />
          {/* Notification badge */}
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
        </Button>
      </div>
    </header>
  );
}
