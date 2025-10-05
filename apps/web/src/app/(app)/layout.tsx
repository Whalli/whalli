"use client";

import { usePathname } from 'next/navigation';
import { DualSidebarLayout } from '@/components/layout/dual-sidebar-layout';
import { MainLayout } from '@/components/layout/main-layout';
import { ChatSecondarySidebar } from '@/components/layout/chat-secondary-sidebar';
import { TasksSecondarySidebar } from '@/components/layout/tasks-secondary-sidebar';
import { ProjectsSecondarySidebar } from '@/components/layout/projects-secondary-sidebar';

// Mock data pour les sidebars secondaires - Enhanced conversation threads
const mockConversationThreads = [
  { 
    id: '1', 
    title: 'AI Model Comparison Study', 
    isPinned: true,
    lastMessage: 'Comparing GPT-4 vs Claude 3 Opus performance...',
    timestamp: '2h ago',
    projectId: 'proj-1',
    projectName: 'AI Research Project',
    pinnedModelId: 'gpt-4-turbo',
    pinnedModelName: 'GPT-4 Turbo',
    messageCount: 24
  },
  { 
    id: '2', 
    title: 'Marketing Strategy Session', 
    isPinned: true,
    lastMessage: 'Discussing Q4 campaign ideas...',
    timestamp: '5h ago',
    projectId: 'proj-2',
    projectName: 'Marketing Campaign',
    messageCount: 15
  },
  { 
    id: '3', 
    title: 'Code Review Discussion', 
    lastMessage: 'Reviewing pull request #234...',
    timestamp: '1d ago',
    projectId: 'proj-1',
    projectName: 'AI Research Project',
    pinnedModelId: 'claude-3-opus',
    pinnedModelName: 'Claude 3 Opus',
    messageCount: 8
  },
  {
    id: '4',
    title: 'Quick Question about API',
    lastMessage: 'How do I authenticate with the API?',
    timestamp: '2d ago',
    messageCount: 3
  },
  {
    id: '5',
    title: 'Website Redesign Ideas',
    lastMessage: 'Looking at modern UI patterns...',
    timestamp: '3d ago',
    projectId: 'proj-3',
    projectName: 'Website Redesign',
    messageCount: 42
  },
];

const mockTaskStats = {
  todo: 12,
  inProgress: 5,
  completed: 28,
};

const mockProjectStats = {
  total: 15,
  active: 8,
  archived: 7,
};

const mockProjects = [
  { id: '1', name: 'Website Redesign', color: '#3b82f6', progress: 75 },
  { id: '2', name: 'Mobile App', color: '#8b5cf6', progress: 45 },
  { id: '3', name: 'Marketing Campaign', color: '#ec4899', progress: 90 },
];

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  
  // Mock user - à remplacer par vraie auth
  const user = {
    name: 'Demo User',
    email: 'demo@whalli.com',
  };

  // Routes qui utilisent DualSidebarLayout avec secondary sidebar
  const dualSidebarRoutes = ['/chat', '/tasks', '/projects'];
  const isDualSidebarRoute = dualSidebarRoutes.some(route => pathname?.startsWith(route));

  // Déterminer quelle secondary sidebar afficher
  const getSecondarySidebar = () => {
    if (pathname?.startsWith('/chat')) {
      // Extract chatId from pathname for active state
      const chatId = pathname.split('/chat/')[1];
      
      return (
        <ChatSecondarySidebar 
          threads={mockConversationThreads}
          activeThreadId={chatId}
          onPinThread={(id) => console.log('Pin thread:', id)}
          onDeleteThread={(id) => console.log('Delete thread:', id)}
          onEditThread={(id) => console.log('Edit thread:', id)}
          onArchiveThread={(id) => console.log('Archive thread:', id)}
        />
      );
    }
    if (pathname?.startsWith('/tasks')) {
      return <TasksSecondarySidebar stats={mockTaskStats} />;
    }
    if (pathname?.startsWith('/projects')) {
      return <ProjectsSecondarySidebar stats={mockProjectStats} projects={mockProjects} />;
    }
    return null;
  };

  // Routes qui n'utilisent pas de layout (login, signup, etc.)
  const noLayoutRoutes = ['/login', '/signup', '/api'];
  const shouldSkipLayout = noLayoutRoutes.some(route => pathname?.startsWith(route));

  if (shouldSkipLayout) {
    return <>{children}</>;
  }

  // Utiliser DualSidebarLayout pour chat/tasks/projects
  if (isDualSidebarRoute) {
    return (
      <DualSidebarLayout
        user={user}
        showSecondarySidebar={true}
        secondarySidebar={getSecondarySidebar()}
      >
        {children}
      </DualSidebarLayout>
    );
  }

  // Utiliser MainLayout pour le reste (home, profile, settings)
  return (
    <MainLayout user={user}>
      {children}
    </MainLayout>
  );
}
