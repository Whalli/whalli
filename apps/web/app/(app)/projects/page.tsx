'use client';

/**
 * Projects Page
 * 
 * Stub for project management feature.
 */

import { useMemo } from 'react';
import { usePageWidgets } from '@/contexts/page-context';
import { ProjectList } from '@/components/project-list';
import { FolderKanban } from 'lucide-react';

export default function ProjectsPage() {
  // Show project list in context sidebar
  const widgets = useMemo(() => [
    {
      id: 'project-list',
      title: 'Projects',
      content: <ProjectList />,
    },
  ], []);
  
  usePageWidgets(widgets);

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto text-center py-20">
        <FolderKanban className="w-16 h-16 text-zinc-600 mx-auto mb-6" />
        <h1 className="text-3xl font-bold text-zinc-100 mb-4">Projects</h1>
        <p className="text-zinc-400 text-lg mb-8">
          Organize your work into projects with custom workflows
        </p>
        <div className="inline-block px-6 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-500">
          Coming Soon
        </div>
      </div>
    </div>
  );
}
