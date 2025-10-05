"use client";

import { useEffect, useState, useCallback } from 'react';
import { 
  Search, 
  MessageSquarePlus, 
  FolderPlus, 
  CheckSquare, 
  Globe,
  X,
  Sparkles,
  FileText as _FileText,
  Users as _Users
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Command {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  action: () => void;
  category: 'chat' | 'project' | 'task' | 'search';
  keywords?: string[];
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNewChat?: () => void;
  onNewProject?: () => void;
  onNewTask?: () => void;
  onRunSearch?: () => void;
}

export function CommandPalette({ 
  isOpen, 
  onClose,
  onNewChat,
  onNewProject,
  onNewTask,
  onRunSearch
}: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Define available commands
  const commands: Command[] = [
    {
      id: 'new-chat',
      label: 'New Chat',
      description: 'Start a new conversation',
      icon: <MessageSquarePlus className="h-4 w-4" />,
      action: () => {
        onNewChat?.();
        router.push('/chat');
        onClose();
      },
      category: 'chat',
      keywords: ['conversation', 'message', 'talk'],
    },
    {
      id: 'new-project',
      label: 'New Project',
      description: 'Create a new project',
      icon: <FolderPlus className="h-4 w-4" />,
      action: () => {
        onNewProject?.();
        router.push('/projects?action=create');
        onClose();
      },
      category: 'project',
      keywords: ['workspace', 'folder'],
    },
    {
      id: 'new-task',
      label: 'New Task',
      description: 'Create a new task',
      icon: <CheckSquare className="h-4 w-4" />,
      action: () => {
        onNewTask?.();
        router.push('/tasks?action=create');
        onClose();
      },
      category: 'task',
      keywords: ['todo', 'assignment', 'ticket'],
    },
    {
      id: 'run-search',
      label: 'Run Web Search',
      description: 'Execute a recurring web search',
      icon: <Globe className="h-4 w-4" />,
      action: () => {
        onRunSearch?.();
        // Could open a modal or redirect
        onClose();
      },
      category: 'search',
      keywords: ['google', 'find', 'query', 'web'],
    },
    {
      id: 'ai-assistant',
      label: 'Ask AI Assistant',
      description: 'Get help from AI',
      icon: <Sparkles className="h-4 w-4" />,
      action: () => {
        router.push('/chat');
        onClose();
      },
      category: 'chat',
      keywords: ['help', 'assistant', 'copilot'],
    },
    {
      id: 'view-projects',
      label: 'View All Projects',
      description: 'Browse your projects',
      icon: <FolderPlus className="h-4 w-4" />,
      action: () => {
        router.push('/projects');
        onClose();
      },
      category: 'project',
      keywords: ['list', 'browse'],
    },
    {
      id: 'view-tasks',
      label: 'View All Tasks',
      description: 'Browse your tasks',
      icon: <CheckSquare className="h-4 w-4" />,
      action: () => {
        router.push('/tasks');
        onClose();
      },
      category: 'task',
      keywords: ['list', 'browse', 'todos'],
    },
  ];

  // Filter commands based on search query
  const filteredCommands = commands.filter(cmd => {
    const searchTerm = query.toLowerCase();
    return (
      cmd.label.toLowerCase().includes(searchTerm) ||
      cmd.description.toLowerCase().includes(searchTerm) ||
      cmd.keywords?.some(k => k.includes(searchTerm))
    );
  });

  // Reset selected index when filtered results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < filteredCommands.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : filteredCommands.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].action();
        }
        break;
      case 'Escape':
        e.preventDefault();
        onClose();
        break;
    }
  }, [isOpen, filteredCommands, selectedIndex, onClose]);

  // Global keyboard shortcut (Ctrl+K / Cmd+K)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (!isOpen) {
          // Open command palette
          setQuery('');
          setSelectedIndex(0);
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isOpen]);

  // Keyboard navigation within palette
  useEffect(() => {
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Command Palette */}
      <div className="relative w-full max-w-2xl bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-200">
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <Search className="h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Type a command or search..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent outline-none text-gray-900 dark:text-gray-100 placeholder:text-gray-500"
            autoFocus
          />
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          >
            <X className="h-4 w-4 text-gray-500" />
          </button>
        </div>

        {/* Command List */}
        <div className="max-h-[400px] overflow-y-auto">
          {filteredCommands.length > 0 ? (
            <div className="py-2">
              {filteredCommands.map((cmd, index) => (
                <button
                  key={cmd.id}
                  onClick={() => cmd.action()}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`w-full flex items-center gap-3 px-4 py-3 transition-colors ${
                    index === selectedIndex
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <div className={`flex-shrink-0 ${
                    index === selectedIndex ? 'text-primary-foreground' : 'text-gray-500'
                  }`}>
                    {cmd.icon}
                  </div>
                  <div className="flex-1 text-left">
                    <div className={`text-sm font-medium ${
                      index === selectedIndex ? 'text-primary-foreground' : 'text-gray-900 dark:text-gray-100'
                    }`}>
                      {cmd.label}
                    </div>
                    <div className={`text-xs ${
                      index === selectedIndex 
                        ? 'text-primary-foreground/80' 
                        : 'text-gray-500'
                    }`}>
                      {cmd.description}
                    </div>
                  </div>
                  <div className={`text-xs px-2 py-1 rounded ${
                    index === selectedIndex
                      ? 'bg-primary-foreground/20 text-primary-foreground'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-500'
                  }`}>
                    {cmd.category}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-gray-500">
              <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No commands found</p>
              <p className="text-xs mt-1">Try searching for something else</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <kbd className="px-2 py-0.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-xs">↑↓</kbd>
              Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-2 py-0.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-xs">↵</kbd>
              Select
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-2 py-0.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-xs">Esc</kbd>
              Close
            </span>
          </div>
          <div className="text-xs text-gray-500">
            <kbd className="px-2 py-0.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-xs">Ctrl+K</kbd>
          </div>
        </div>
      </div>
    </div>
  );
}
