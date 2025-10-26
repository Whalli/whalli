'use client';

/**
 * Mindmaps Page
 * 
 * Stub for mindmap/knowledge graph feature.
 */

import { useMemo } from 'react';
import { usePageWidgets } from '@/contexts/page-context';
import { MindmapList } from '@/components/mindmap-list';
import { Network } from 'lucide-react';

export default function MindmapsPage() {
  // Show mindmap list in context sidebar
  const widgets = useMemo(() => [
    {
      id: 'mindmap-list',
      title: 'Mindmaps',
      content: <MindmapList />,
    },
  ], []);
  
  usePageWidgets(widgets);

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto text-center py-20">
        <Network className="w-16 h-16 text-zinc-600 mx-auto mb-6" />
        <h1 className="text-3xl font-bold text-zinc-100 mb-4">Mindmaps</h1>
        <p className="text-zinc-400 text-lg mb-8">
          Visualize your ideas and knowledge in interactive mindmaps
        </p>
        <div className="inline-block px-6 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-500">
          Coming Soon
        </div>
      </div>
    </div>
  );
}
