'use client';

/**
 * Project List
 * 
 * Displays a list of all projects in the context sidebar.
 * Used on project pages.
 */

import { KanbanSquare, Plus } from 'lucide-react';

export function ProjectList() {
  // TODO: Load actual projects from API
  const projects = []; // Placeholder

  return (
    <div className="flex flex-col h-full">
      {/* Header with New Project Button */}
      <div className="p-4 border-b border-zinc-800">
        <button
          onClick={() => {
            // TODO: Create new project
            console.log('Create new project');
          }}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
        >
          <Plus className="w-4 h-4" />
          <span>New Project</span>
        </button>
      </div>

      {/* Project List */}
      <div className="flex-1 overflow-y-auto">
        {projects.length === 0 ? (
          <div className="p-4 text-center">
            <KanbanSquare className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
            <p className="text-sm text-zinc-500">No projects yet</p>
            <p className="text-xs text-zinc-600 mt-1">Create your first project</p>
          </div>
        ) : (
          <div className="p-2">
            {/* TODO: Render project items */}
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-zinc-800">
        <p className="text-xs text-zinc-600 text-center">
          {projects.length} {projects.length === 1 ? 'project' : 'projects'}
        </p>
      </div>
    </div>
  );
}
