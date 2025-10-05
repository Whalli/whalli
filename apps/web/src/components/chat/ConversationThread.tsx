"use client";

import { useState } from 'react';
import { 
  MessageSquare, 
  Pin, 
  MoreVertical, 
  Trash2, 
  Edit2, 
  Archive,
  FolderOpen,
  Lock,
  Unlock as _Unlock
} from 'lucide-react';
import Link from 'next/link';

export interface ConversationThread {
  id: string;
  title: string;
  isPinned?: boolean;
  lastMessage?: string;
  timestamp?: string;
  projectId?: string;
  projectName?: string;
  pinnedModelId?: string;
  pinnedModelName?: string;
  messageCount?: number;
}

interface ConversationThreadProps {
  thread: ConversationThread;
  isActive?: boolean;
  onPin?: (threadId: string) => void;
  onDelete?: (threadId: string) => void;
  onEdit?: (threadId: string) => void;
  onArchive?: (threadId: string) => void;
}

export function ConversationThread({ 
  thread, 
  isActive = false,
  onPin,
  onDelete,
  onEdit,
  onArchive
}: ConversationThreadProps) {
  const [showMenu, setShowMenu] = useState(false);

  const handleMenuClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowMenu(!showMenu);
  };

  return (
    <Link
      href={`/chat/${thread.id}`}
      className={`relative block p-3 rounded-lg transition-all group ${
        isActive
          ? 'bg-primary-foreground/20 border-l-2 border-primary-foreground'
          : 'hover:bg-primary-foreground/10'
      }`}
    >
      {/* Thread Content */}
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={`flex-shrink-0 mt-0.5 ${
          thread.isPinned ? 'text-yellow-400' : 'text-primary-foreground/60'
        }`}>
          {thread.isPinned ? (
            <Pin className="h-4 w-4 fill-current" />
          ) : (
            <MessageSquare className="h-4 w-4" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title */}
          <h3 className="font-medium text-sm truncate mb-1">
            {thread.title}
          </h3>

          {/* Project Badge */}
          {thread.projectId && thread.projectName && (
            <div className="flex items-center gap-1 mb-1">
              <FolderOpen className="h-3 w-3 text-primary-foreground/60" />
              <span className="text-xs text-primary-foreground/70 truncate">
                {thread.projectName}
              </span>
            </div>
          )}

          {/* Pinned Model Badge */}
          {thread.pinnedModelId && thread.pinnedModelName && (
            <div className="flex items-center gap-1 mb-1">
              <Lock className="h-3 w-3 text-blue-400" />
              <span className="text-xs text-blue-400 truncate">
                {thread.pinnedModelName}
              </span>
            </div>
          )}

          {/* Last Message */}
          {thread.lastMessage && (
            <p className="text-xs text-primary-foreground/60 truncate mb-1">
              {thread.lastMessage}
            </p>
          )}

          {/* Footer */}
          <div className="flex items-center gap-2 text-xs text-primary-foreground/50">
            {thread.timestamp && <span>{thread.timestamp}</span>}
            {thread.messageCount && (
              <>
                <span>•</span>
                <span>{thread.messageCount} messages</span>
              </>
            )}
          </div>
        </div>

        {/* Menu Button */}
        <button
          onClick={handleMenuClick}
          className="flex-shrink-0 p-1 opacity-0 group-hover:opacity-100 hover:bg-primary-foreground/20 rounded transition-all"
        >
          <MoreVertical className="h-4 w-4" />
        </button>
      </div>

      {/* Dropdown Menu */}
      {showMenu && (
        <>
          {/* Backdrop to close menu */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowMenu(false);
            }}
          />
          
          {/* Menu */}
          <div className="absolute right-2 top-12 z-50 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 animate-in fade-in slide-in-from-top-2 duration-150">
            <button
              onClick={(e) => {
                e.preventDefault();
                onPin?.(thread.id);
                setShowMenu(false);
              }}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <Pin className="h-4 w-4" />
              {thread.isPinned ? 'Unpin' : 'Pin'} conversation
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                onEdit?.(thread.id);
                setShowMenu(false);
              }}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <Edit2 className="h-4 w-4" />
              Rename
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                onArchive?.(thread.id);
                setShowMenu(false);
              }}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <Archive className="h-4 w-4" />
              Archive
            </button>
            <div className="border-t border-gray-200 dark:border-gray-700 my-1" />
            <button
              onClick={(e) => {
                e.preventDefault();
                onDelete?.(thread.id);
                setShowMenu(false);
              }}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
          </div>
        </>
      )}
    </Link>
  );
}
