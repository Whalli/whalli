"use client";

import { useState } from 'react';
import { Plus, Pin, History, Search, Filter, FolderOpen, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { ConversationThread, type ConversationThread as ThreadType } from '@/components/chat/ConversationThread';

interface ChatSecondarySidebarProps {
  threads?: ThreadType[];
  activeThreadId?: string;
  onPinThread?: (threadId: string) => void;
  onDeleteThread?: (threadId: string) => void;
  onEditThread?: (threadId: string) => void;
  onArchiveThread?: (threadId: string) => void;
}

export function ChatSecondarySidebar({ 
  threads = [],
  activeThreadId,
  onPinThread,
  onDeleteThread,
  onEditThread,
  onArchiveThread
}: ChatSecondarySidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'project' | 'standalone'>('all');

  // Filter threads by search query
  const filteredThreads = threads.filter(thread => {
    const matchesSearch = searchQuery === '' || 
      thread.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      thread.lastMessage?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      thread.projectName?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter = 
      filterType === 'all' ||
      (filterType === 'project' && thread.projectId) ||
      (filterType === 'standalone' && !thread.projectId);

    return matchesSearch && matchesFilter;
  });

  // Separate pinned and recent threads
  const pinnedThreads = filteredThreads.filter(t => t.isPinned);
  const recentThreads = filteredThreads.filter(t => !t.isPinned);

  // Group threads by project (for project filter)
  const threadsByProject = recentThreads.reduce((acc, thread) => {
    if (thread.projectId && thread.projectName) {
      if (!acc[thread.projectId]) {
        acc[thread.projectId] = {
          projectId: thread.projectId,
          projectName: thread.projectName,
          threads: [],
        };
      }
      acc[thread.projectId].threads.push(thread);
    }
    return acc;
  }, {} as Record<string, { projectId: string; projectName: string; threads: ThreadType[] }>);

  const _standaloneThreads = recentThreads.filter(t => !t.projectId);
  const projectGroups = Object.values(threadsByProject);

  return (
    <div className="h-full flex flex-col bg-primary text-primary-foreground overflow-hidden">
      {/* Header */}
      <div className="p-3 lg:p-4 border-b border-primary-foreground/10 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-bold">Conversations</h2>
          <Link 
            href="/chat"
            className="p-2 hover:bg-primary-foreground/10 rounded-lg transition-colors"
            aria-label="New conversation"
            title="New conversation (Ctrl+K)"
          >
            <Plus className="h-5 w-5" />
          </Link>
        </div>
        
        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary-foreground/60" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-primary-foreground/10 border border-primary-foreground/20 rounded-lg text-sm placeholder:text-primary-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary-foreground/30"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 p-1 bg-primary-foreground/10 rounded-lg">
          <button
            onClick={() => setFilterType('all')}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
              filterType === 'all'
                ? 'bg-primary-foreground text-primary'
                : 'text-primary-foreground/70 hover:text-primary-foreground'
            }`}
          >
            <MessageSquare className="h-3 w-3" />
            All
          </button>
          <button
            onClick={() => setFilterType('project')}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
              filterType === 'project'
                ? 'bg-primary-foreground text-primary'
                : 'text-primary-foreground/70 hover:text-primary-foreground'
            }`}
          >
            <FolderOpen className="h-3 w-3" />
            Projects
          </button>
          <button
            onClick={() => setFilterType('standalone')}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
              filterType === 'standalone'
                ? 'bg-primary-foreground text-primary'
                : 'text-primary-foreground/70 hover:text-primary-foreground'
            }`}
          >
            <Filter className="h-3 w-3" />
            Standalone
          </button>
        </div>
      </div>

      {/* Thread List */}
      <div className="flex-1 overflow-y-auto">
        {/* Pinned Threads */}
        {pinnedThreads.length > 0 && (
          <div className="p-3 border-b border-primary-foreground/10">
            <div className="flex items-center gap-2 mb-3 text-xs font-medium text-primary-foreground/70">
              <Pin className="h-3 w-3" />
              <span>Pinned</span>
            </div>
            <div className="space-y-2">
              {pinnedThreads.map((thread) => (
                <ConversationThread
                  key={thread.id}
                  thread={thread}
                  isActive={thread.id === activeThreadId}
                  onPin={onPinThread}
                  onDelete={onDeleteThread}
                  onEdit={onEditThread}
                  onArchive={onArchiveThread}
                />
              ))}
            </div>
          </div>
        )}

        {/* Recent Threads - Grouped by Project (if project filter) */}
        {filterType === 'project' && projectGroups.length > 0 ? (
          <div className="p-3">
            {projectGroups.map((group) => (
              <div key={group.projectId} className="mb-4">
                <div className="flex items-center gap-2 mb-2 text-xs font-medium text-primary-foreground/70">
                  <FolderOpen className="h-3 w-3" />
                  <span>{group.projectName}</span>
                  <span className="ml-auto text-primary-foreground/50">
                    {group.threads.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {group.threads.map((thread) => (
                    <ConversationThread
                      key={thread.id}
                      thread={thread}
                      isActive={thread.id === activeThreadId}
                      onPin={onPinThread}
                      onDelete={onDeleteThread}
                      onEdit={onEditThread}
                      onArchive={onArchiveThread}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Recent Threads - Simple List */
          <div className="p-3">
            <div className="flex items-center gap-2 mb-3 text-xs font-medium text-primary-foreground/70">
              <History className="h-3 w-3" />
              <span>Recent</span>
              {recentThreads.length > 0 && (
                <span className="ml-auto text-primary-foreground/50">
                  {recentThreads.length}
                </span>
              )}
            </div>
            <div className="space-y-2">
              {recentThreads.length > 0 ? (
                recentThreads.map((thread) => (
                  <ConversationThread
                    key={thread.id}
                    thread={thread}
                    isActive={thread.id === activeThreadId}
                    onPin={onPinThread}
                    onDelete={onDeleteThread}
                    onEdit={onEditThread}
                    onArchive={onArchiveThread}
                  />
                ))
              ) : (
                <div className="text-center py-12 px-4">
                  <MessageSquare className="h-12 w-12 mx-auto mb-3 text-primary-foreground/30" />
                  <p className="text-sm text-primary-foreground/60 mb-1">
                    {searchQuery ? 'No conversations found' : 'No conversations yet'}
                  </p>
                  <p className="text-xs text-primary-foreground/50">
                    {searchQuery ? 'Try a different search' : 'Start a new chat to get started'}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer Stats */}
      {threads.length > 0 && (
        <div className="p-3 border-t border-primary-foreground/10 flex-shrink-0">
          <div className="flex items-center justify-between text-xs text-primary-foreground/60">
            <span>{threads.length} total conversations</span>
            <span>Press Ctrl+K for commands</span>
          </div>
        </div>
      )}
    </div>
  );
}
