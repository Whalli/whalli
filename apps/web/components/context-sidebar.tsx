'use client';

/**
 * Context Sidebar
 * 
 * Left sidebar (after primary) that displays contextual lists:
 * - Chat history for /chat
 * - Projects list for /projects
 * - Mindmaps list for /mindmaps
 * Auto-hides when no content is available.
 */

import { usePageContext } from '@/contexts/page-context';
import { ChevronLeft } from 'lucide-react';

interface ContextSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function ContextSidebar({ isOpen, onToggle }: ContextSidebarProps) {
  const { widgets } = usePageContext();
  
  const hasWidgets = widgets.length > 0;

  // Don't render if no widgets
  if (!hasWidgets) {
    return null;
  }

  return (
    <aside
      className={`
        h-screen bg-zinc-900 border-r border-zinc-800 transition-all duration-300 overflow-hidden
        ${isOpen ? 'w-72' : 'w-0'}
      `}
    >
      {isOpen && (
        <div className="h-full flex flex-col w-72">
          {/* Header */}
          <div className="flex items-center justify-between h-16 px-4 border-b border-zinc-800">
            <h2 className="font-semibold text-zinc-100">
              {widgets[0]?.title || 'Context'}
            </h2>
            <button
              onClick={onToggle}
              className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
              title="Close context panel (⌘B)"
              aria-label="Close context panel"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {widgets.map((widget) => (
              <div key={widget.id} className="h-full">
                {widget.content}
              </div>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}
