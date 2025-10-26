'use client';

/**
 * Search Page
 * 
 * Search across chats, messages, and presets.
 */

import { Search as SearchIcon } from 'lucide-react';

export default function SearchPage() {
  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto text-center py-20">
        <SearchIcon className="w-16 h-16 text-zinc-600 mx-auto mb-6" />
        <h1 className="text-3xl font-bold text-zinc-100 mb-4">Search</h1>
        <p className="text-zinc-400 text-lg mb-8">
          Search across all your chats, messages, and presets
        </p>
        <div className="inline-block px-6 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-500">
          Coming Soon
        </div>
      </div>
    </div>
  );
}
