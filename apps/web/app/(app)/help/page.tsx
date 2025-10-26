'use client';

/**
 * Help Page
 * 
 * Documentation, tutorials, and support resources.
 */

import { HelpCircle, Book, MessageCircle, FileText } from 'lucide-react';

export default function HelpPage() {
  const helpSections = [
    {
      icon: Book,
      title: 'Documentation',
      description: 'Learn how to use Whalli effectively',
    },
    {
      icon: MessageCircle,
      title: 'Support',
      description: 'Get help from our support team',
    },
    {
      icon: FileText,
      title: 'API Reference',
      description: 'Integrate Whalli with your apps',
    },
  ];

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <HelpCircle className="w-16 h-16 text-zinc-600 mx-auto mb-6" />
            <h1 className="text-3xl font-bold text-zinc-100 mb-4">Help Center</h1>
            <p className="text-zinc-400 text-lg">
              Everything you need to know about Whalli
            </p>
          </div>

          {/* Help Sections */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {helpSections.map((section) => {
              const Icon = section.icon;
              return (
                <div
                  key={section.title}
                  className="p-6 bg-zinc-900 border border-zinc-800 rounded-xl hover:border-zinc-700 transition-colors text-center"
                >
                  <Icon className="w-10 h-10 text-blue-500 mx-auto mb-4" />
                  <h3 className="font-semibold text-zinc-100 mb-2">{section.title}</h3>
                  <p className="text-sm text-zinc-400">{section.description}</p>
                </div>
              );
            })}
          </div>

          {/* Keyboard Shortcuts */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-zinc-100 mb-4">Keyboard Shortcuts</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-zinc-800">
                <span className="text-zinc-300">Toggle Primary Sidebar</span>
                <kbd className="px-3 py-1 bg-zinc-800 border border-zinc-700 rounded text-sm font-mono">
                  ⌘B
                </kbd>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-zinc-800">
                <span className="text-zinc-300">Toggle Context Sidebar</span>
                <kbd className="px-3 py-1 bg-zinc-800 border border-zinc-700 rounded text-sm font-mono">
                  ⌘.
                </kbd>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-zinc-300">New Chat</span>
                <kbd className="px-3 py-1 bg-zinc-800 border border-zinc-700 rounded text-sm font-mono">
                  ⌘K
                </kbd>
              </div>
            </div>
          </div>
        </div>
      </div>
  );
}
