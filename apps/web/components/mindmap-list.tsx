'use client';

/**
 * Mindmap List
 * 
 * Displays a list of all mindmaps in the context sidebar.
 * Used on mindmap pages.
 */

import { GitBranch, Plus } from 'lucide-react';

export function MindmapList() {
  // TODO: Load actual mindmaps from API
  const mindmaps = []; // Placeholder

  return (
    <div className="flex flex-col h-full">
      {/* Header with New Mindmap Button */}
      <div className="p-4 border-b border-zinc-800">
        <button
          onClick={() => {
            // TODO: Create new mindmap
            console.log('Create new mindmap');
          }}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
        >
          <Plus className="w-4 h-4" />
          <span>New Mindmap</span>
        </button>
      </div>

      {/* Mindmap List */}
      <div className="flex-1 overflow-y-auto">
        {mindmaps.length === 0 ? (
          <div className="p-4 text-center">
            <GitBranch className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
            <p className="text-sm text-zinc-500">No mindmaps yet</p>
            <p className="text-xs text-zinc-600 mt-1">Create your first mindmap</p>
          </div>
        ) : (
          <div className="p-2">
            {/* TODO: Render mindmap items */}
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-zinc-800">
        <p className="text-xs text-zinc-600 text-center">
          {mindmaps.length} {mindmaps.length === 1 ? 'mindmap' : 'mindmaps'}
        </p>
      </div>
    </div>
  );
}
