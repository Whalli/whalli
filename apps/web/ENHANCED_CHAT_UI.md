# Enhanced Chat UI - Complete Documentation

**Status**: ✅ Feature Complete  
**Version**: 2.0.0  
**Last Updated**: 2025-10-05

## Table of Contents
1. [Overview](#overview)
2. [New Features](#new-features)
3. [Components](#components)
4. [Command Palette](#command-palette)
5. [Conversation Threads](#conversation-threads)
6. [Model Pinning](#model-pinning)
7. [Usage Examples](#usage-examples)
8. [Integration Guide](#integration-guide)

---

## Overview

The Enhanced Chat UI brings powerful new features to the chat experience, including:
- 🎯 **Command Palette** (Ctrl+K) - Quick actions from anywhere
- 💬 **Conversation Threads** - Organized chat history with project linking
- 📌 **Model Pinning** - Lock conversations to specific AI models
- 🔍 **Smart Filtering** - Filter by project/standalone threads
- 🎨 **Rich Context** - View project associations, model locks, message counts

### Key Improvements
- **Better Organization**: Threads grouped by pinned/recent/project
- **Faster Navigation**: Command palette for instant actions
- **Consistent Experience**: Pin model to maintain context across conversation
- **Project Integration**: Link conversations to specific projects

---

## New Features

### 1. Command Palette (Ctrl+K / Cmd+K)

**Global Keyboard Shortcut**: Access from anywhere in the app.

**Available Commands**:
| Command | Description | Shortcut | Category |
|---------|-------------|----------|----------|
| New Chat | Start a new conversation | Ctrl+K → "new chat" | Chat |
| New Project | Create a new project | Ctrl+K → "new project" | Project |
| New Task | Create a new task | Ctrl+K → "new task" | Task |
| Run Web Search | Execute recurring search | Ctrl+K → "run search" | Search |
| Ask AI Assistant | Get help from AI | Ctrl+K → "ask ai" | Chat |
| View All Projects | Browse projects | Ctrl+K → "view projects" | Project |
| View All Tasks | Browse tasks | Ctrl+K → "view tasks" | Task |

**Features**:
- ✅ Fuzzy search with keyword matching
- ✅ Keyboard navigation (↑/↓ arrows, Enter to select)
- ✅ Category badges (chat, project, task, search)
- ✅ Command descriptions and icons
- ✅ Escape to close

---

### 2. Conversation Threads Sidebar

**Enhanced Sidebar Features**:
- 📌 **Pinned Threads**: Pin important conversations to top
- 📁 **Project Linking**: See which project each thread belongs to
- 🔒 **Model Indicators**: Visual badges for pinned models
- 📊 **Thread Stats**: Message count and timestamp
- 🔍 **Search**: Filter threads by title, message, or project
- 🎛️ **Filter Tabs**: All / Projects / Standalone

**Thread Properties**:
```typescript
interface ConversationThread {
  id: string;
  title: string;
  isPinned?: boolean;
  lastMessage?: string;
  timestamp?: string;
  projectId?: string;              // Link to project
  projectName?: string;
  pinnedModelId?: string;          // Locked AI model
  pinnedModelName?: string;
  messageCount?: number;
}
```

**Thread Actions**:
- **Pin/Unpin**: Toggle pinned status
- **Rename**: Edit thread title
- **Archive**: Move to archive
- **Delete**: Permanently remove

---

### 3. Model Pinning

**Purpose**: Lock a conversation to a specific AI model to maintain consistency.

**Use Cases**:
- 🔬 **Research**: Compare model outputs across multiple queries
- 📝 **Writing**: Maintain consistent tone/style with same model
- 💻 **Coding**: Use specialized coding model for entire session
- 🎓 **Learning**: Get explanations from preferred teaching model

**UI Indicators**:
- 🔒 Blue "Model Locked" badge in chat header
- 💙 Blue model badge in conversation thread
- 📌 Pin icon in model selector
- ℹ️ Info notice at bottom of chat

**How It Works**:
1. Click "Pin Model" button in chat header
2. Select model from dropdown
3. Model is locked for this conversation
4. All messages use the pinned model
5. Click "Unpin Model" to unlock

---

## Components

### CommandPalette

**Location**: `apps/web/src/components/chat/CommandPalette.tsx`

**Props**:
```typescript
interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNewChat?: () => void;
  onNewProject?: () => void;
  onNewTask?: () => void;
  onRunSearch?: () => void;
}
```

**Features**:
- Fuzzy search with keyword matching
- Keyboard navigation (↑↓ arrows, Enter, Escape)
- Category badges (chat, project, task, search)
- Command icons from Lucide React
- Backdrop click to close
- Auto-focus on search input

**Example**:
```tsx
import { CommandPalette } from '@/components/chat/CommandPalette';
import { useCommandPalette } from '@/hooks/useCommandPalette';

function MyComponent() {
  const { isOpen, close } = useCommandPalette();
  
  return (
    <CommandPalette
      isOpen={isOpen}
      onClose={close}
      onNewChat={() => router.push('/chat')}
      onNewProject={() => router.push('/projects?action=create')}
    />
  );
}
```

---

### ConversationThread

**Location**: `apps/web/src/components/chat/ConversationThread.tsx`

**Props**:
```typescript
interface ConversationThreadProps {
  thread: ConversationThread;
  isActive?: boolean;
  onPin?: (threadId: string) => void;
  onDelete?: (threadId: string) => void;
  onEdit?: (threadId: string) => void;
  onArchive?: (threadId: string) => void;
}
```

**Visual Elements**:
- 📌 Pin icon (yellow) if pinned
- 💬 Message icon if not pinned
- 📁 Folder icon + project name badge
- 🔒 Lock icon + model name badge (blue)
- ⏰ Timestamp and message count
- ⋮ More menu (hover to reveal)

**Menu Actions**:
- Pin/Unpin conversation
- Rename
- Archive
- Delete (red, destructive)

**Example**:
```tsx
<ConversationThread
  thread={{
    id: '123',
    title: 'My Research Chat',
    isPinned: true,
    lastMessage: 'Analyzing data...',
    timestamp: '2h ago',
    projectId: 'proj-1',
    projectName: 'AI Research',
    pinnedModelId: 'gpt-4-turbo',
    pinnedModelName: 'GPT-4 Turbo',
    messageCount: 24
  }}
  isActive={currentChatId === '123'}
  onPin={(id) => handlePin(id)}
  onDelete={(id) => handleDelete(id)}
/>
```

---

### ModelPinButton

**Location**: `apps/web/src/components/chat/ModelPinButton.tsx`

**Props**:
```typescript
interface ModelPinButtonProps {
  currentModel?: Model | null;
  pinnedModelId?: string | null;
  availableModels: Model[];
  onPinModel: (modelId: string | null) => void;
}
```

**States**:
- **Unpinned**: Gray button with 🔓 Unlock icon
- **Pinned**: Blue button with 🔒 Lock icon + model name

**Dropdown Sections**:
1. **Current Model** (if different from pinned)
2. **Unpin Option** (if currently pinned)
3. **Available Models** (scrollable list)
4. **Footer** with helpful tip

**Example**:
```tsx
<ModelPinButton
  currentModel={selectedModel}
  pinnedModelId={pinnedModelId}
  availableModels={models}
  onPinModel={(modelId) => {
    setPinnedModelId(modelId);
    // Save to backend
    savePinnedModel(chatId, modelId);
  }}
/>
```

---

### ChatSecondarySidebar (Enhanced)

**Location**: `apps/web/src/components/layout/chat-secondary-sidebar.tsx`

**Props**:
```typescript
interface ChatSecondarySidebarProps {
  threads?: ConversationThread[];
  activeThreadId?: string;
  onPinThread?: (threadId: string) => void;
  onDeleteThread?: (threadId: string) => void;
  onEditThread?: (threadId: string) => void;
  onArchiveThread?: (threadId: string) => void;
}
```

**Features**:
- Search input with real-time filtering
- Filter tabs: All / Projects / Standalone
- Pinned section (yellow pin icon)
- Recent section grouped by project (if filter = Projects)
- Empty states with helpful messages
- Footer stats (total conversations + keyboard hint)

**Grouping Logic** (Project filter):
```
📁 AI Research Project (3)
  - AI Model Comparison Study
  - Code Review Discussion
  
📁 Marketing Campaign (1)
  - Marketing Strategy Session
  
📁 Website Redesign (1)
  - Website Redesign Ideas
```

---

### ChatUI (Enhanced)

**Location**: `apps/web/src/components/chat/ChatUI.tsx`

**New Props**:
```typescript
interface ChatUIProps {
  userId: string;
  chatId?: string;                    // NEW: Conversation ID
  apiUrl?: string;
  initialPinnedModelId?: string;      // NEW: Load pinned model
  onModelPin?: (modelId: string | null) => void;  // NEW: Save callback
}
```

**Layout Enhancements**:
1. **Header Bar** (new):
   - Model lock status indicator
   - ModelPinButton in top-right
2. **Messages Area** (unchanged)
3. **Input Area** (unchanged)
4. **Footer Notice** (new):
   - Shows when model is pinned
   - Explains locked behavior

**Model Priority Logic**:
```typescript
// If model is pinned, use pinned model
// Otherwise, use currently selected model
const effectiveModel = pinnedModelId 
  ? models.find(m => m.id === pinnedModelId) 
  : selectedModel;
```

---

## Command Palette

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+K` / `Cmd+K` | Open/close command palette |
| `↑` / `↓` | Navigate commands |
| `Enter` | Execute selected command |
| `Esc` | Close palette |
| Type to search | Filter commands |

### Command Categories

#### Chat Commands
- **New Chat**: Start fresh conversation (`/chat`)
- **Ask AI Assistant**: Quick chat access

#### Project Commands
- **New Project**: Create project (`/projects?action=create`)
- **View All Projects**: Browse projects (`/projects`)

#### Task Commands
- **New Task**: Create task (`/tasks?action=create`)
- **View All Tasks**: Browse tasks (`/tasks`)

#### Search Commands
- **Run Web Search**: Execute recurring search

### Fuzzy Search

**Keyword Matching**:
```typescript
Command: "New Chat"
Keywords: ["conversation", "message", "talk"]

// All of these match:
"chat"        → ✅ Match (in label)
"new"         → ✅ Match (in label)
"conversation" → ✅ Match (in keywords)
"message"     → ✅ Match (in keywords)
```

---

## Conversation Threads

### Thread Lifecycle

```
1. User sends first message
   ↓
2. Thread created with auto-generated title
   ↓
3. User can:
   - Pin thread (moves to top)
   - Link to project
   - Pin AI model
   - Rename title
   ↓
4. Thread appears in sidebar with badges:
   - 📌 Pinned icon
   - 📁 Project name
   - 🔒 Model lock
   - 📊 Message count
   ↓
5. User can archive or delete
```

### Project Linking

**How to Link**:
1. Open thread menu (⋮)
2. Click "Link to Project"
3. Select project from list
4. Thread now shows project badge

**Benefits**:
- See all project-related conversations
- Filter threads by project
- Context switching easier
- Better organization

**API Integration**:
```typescript
// Backend: Link thread to project
PUT /api/chat/:chatId
{
  "projectId": "proj-123"
}

// Sidebar will show:
// 📁 Project Name badge
```

---

## Model Pinning

### When to Pin a Model

**Good Use Cases**:
✅ **Research Projects**: Compare outputs from same model  
✅ **Writing Projects**: Maintain consistent style/tone  
✅ **Coding Sessions**: Use specialized coding model  
✅ **Learning**: Get explanations from preferred model  
✅ **Testing**: Evaluate specific model capabilities

**When NOT to Pin**:
❌ Quick one-off questions  
❌ Testing multiple models  
❌ Casual conversations  

### Pin vs. Switch

| Action | Effect | Use When |
|--------|--------|----------|
| **Pin Model** | Locks model for entire conversation | Long session, need consistency |
| **Switch Model** | Changes model for next message only | Exploring different models |

### Visual Indicators

**When Pinned**:
- 🔒 Blue "Model Locked" badge in header
- 💙 Blue model name in thread sidebar
- 📌 Pin icon in model selector (filled)
- ℹ️ Blue notice at bottom: "Conversation locked to GPT-4 Turbo"
- Model selector disabled (shows locked model)

**When Unpinned**:
- 🔓 Gray "Pin Model" button
- Model selector enabled
- No footer notice
- Model can change per message

---

## Usage Examples

### Example 1: Basic Chat with Command Palette

```tsx
'use client';

import { ChatUI, CommandPalette } from '@/components/chat';
import { useCommandPalette } from '@/hooks/useCommandPalette';
import { useRouter } from 'next/navigation';

export default function ChatPage() {
  const router = useRouter();
  const { isOpen, close } = useCommandPalette();

  return (
    <>
      <ChatUI 
        userId="user-123" 
        apiUrl="http://localhost:3001"
      />
      
      <CommandPalette
        isOpen={isOpen}
        onClose={close}
        onNewChat={() => router.push('/chat')}
        onNewProject={() => router.push('/projects?action=create')}
        onNewTask={() => router.push('/tasks?action=create')}
      />
    </>
  );
}
```

---

### Example 2: Chat with Model Pinning

```tsx
'use client';

import { useState } from 'react';
import { ChatUI } from '@/components/chat';
import { useParams } from 'next/navigation';

export default function ChatConversationPage() {
  const params = useParams();
  const chatId = params.chatId as string;
  
  // Load pinned model from backend or localStorage
  const [pinnedModelId, setPinnedModelId] = useState<string | null>(
    localStorage.getItem(`chat-${chatId}-pinned-model`)
  );

  const handleModelPin = (modelId: string | null) => {
    setPinnedModelId(modelId);
    
    // Save to localStorage
    if (modelId) {
      localStorage.setItem(`chat-${chatId}-pinned-model`, modelId);
    } else {
      localStorage.removeItem(`chat-${chatId}-pinned-model`);
    }
    
    // Save to backend
    fetch(`/api/chat/${chatId}`, {
      method: 'PUT',
      body: JSON.stringify({ pinnedModelId: modelId }),
    });
  };

  return (
    <ChatUI 
      userId="user-123"
      chatId={chatId}
      apiUrl="http://localhost:3001"
      initialPinnedModelId={pinnedModelId}
      onModelPin={handleModelPin}
    />
  );
}
```

---

### Example 3: Enhanced Sidebar with Threads

```tsx
'use client';

import { useState } from 'react';
import { ChatSecondarySidebar } from '@/components/layout/chat-secondary-sidebar';
import type { ConversationThread } from '@/components/chat';

export default function ChatLayout({ children }) {
  const [threads, setThreads] = useState<ConversationThread[]>([
    {
      id: '1',
      title: 'AI Research Discussion',
      isPinned: true,
      lastMessage: 'Comparing GPT-4 vs Claude...',
      timestamp: '2h ago',
      projectId: 'proj-1',
      projectName: 'AI Research',
      pinnedModelId: 'gpt-4-turbo',
      pinnedModelName: 'GPT-4 Turbo',
      messageCount: 24
    },
    // ... more threads
  ]);

  const handlePinThread = (threadId: string) => {
    setThreads(prev => prev.map(t => 
      t.id === threadId ? { ...t, isPinned: !t.isPinned } : t
    ));
    
    // Save to backend
    fetch(`/api/chat/${threadId}/pin`, { method: 'POST' });
  };

  const handleDeleteThread = (threadId: string) => {
    if (confirm('Delete this conversation?')) {
      setThreads(prev => prev.filter(t => t.id !== threadId));
      fetch(`/api/chat/${threadId}`, { method: 'DELETE' });
    }
  };

  return (
    <div className="flex h-screen">
      <ChatSecondarySidebar
        threads={threads}
        activeThreadId={currentChatId}
        onPinThread={handlePinThread}
        onDeleteThread={handleDeleteThread}
        onEditThread={(id) => openRenameDialog(id)}
        onArchiveThread={(id) => archiveThread(id)}
      />
      <div className="flex-1">
        {children}
      </div>
    </div>
  );
}
```

---

### Example 4: Project-Linked Conversations

```tsx
// Creating a new chat linked to a project
async function createProjectChat(projectId: string, title: string) {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title,
      projectId,
      userId: 'user-123'
    })
  });
  
  const chat = await response.json();
  router.push(`/chat/${chat.id}`);
}

// Example: Create chat from project page
<button onClick={() => createProjectChat('proj-1', 'Project Discussion')}>
  Start Chat for This Project
</button>
```

---

## Integration Guide

### Backend API Requirements

#### 1. Conversation Threads Endpoint

```typescript
// GET /api/chat/threads
// Response: List of conversation threads
{
  threads: [
    {
      id: "chat-123",
      title: "AI Research",
      isPinned: true,
      lastMessage: "Comparing models...",
      timestamp: "2024-10-05T10:30:00Z",
      projectId: "proj-1",
      projectName: "AI Research Project",
      pinnedModelId: "gpt-4-turbo",
      pinnedModelName: "GPT-4 Turbo",
      messageCount: 24
    }
  ]
}
```

#### 2. Pin/Unpin Thread

```typescript
// POST /api/chat/:chatId/pin
// Toggle pinned status
{
  isPinned: true
}
```

#### 3. Update Thread

```typescript
// PUT /api/chat/:chatId
// Update thread properties
{
  title?: string,
  projectId?: string,
  pinnedModelId?: string
}
```

#### 4. Delete/Archive Thread

```typescript
// DELETE /api/chat/:chatId
// Soft delete (archive)

// DELETE /api/chat/:chatId?permanent=true
// Hard delete
```

---

### Frontend State Management

**Recommended Approach**:

```typescript
// hooks/useChatThreads.ts
export function useChatThreads(userId: string) {
  const [threads, setThreads] = useState<ConversationThread[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch threads
  useEffect(() => {
    fetchThreads();
  }, [userId]);

  const fetchThreads = async () => {
    const response = await fetch(`/api/chat/threads?userId=${userId}`);
    const data = await response.json();
    setThreads(data.threads);
    setLoading(false);
  };

  // Pin/unpin thread
  const pinThread = async (threadId: string) => {
    await fetch(`/api/chat/${threadId}/pin`, { method: 'POST' });
    setThreads(prev => prev.map(t => 
      t.id === threadId ? { ...t, isPinned: !t.isPinned } : t
    ));
  };

  // Delete thread
  const deleteThread = async (threadId: string) => {
    await fetch(`/api/chat/${threadId}`, { method: 'DELETE' });
    setThreads(prev => prev.filter(t => t.id !== threadId));
  };

  return { threads, loading, pinThread, deleteThread, refetch: fetchThreads };
}
```

---

## Summary

### Features Added ✅

1. **Command Palette** (Ctrl+K)
   - 7 quick actions
   - Fuzzy search
   - Keyboard navigation
   - Category badges

2. **Conversation Threads**
   - Pin/unpin threads
   - Project linking
   - Rich metadata (message count, timestamps)
   - Smart filtering (all/project/standalone)
   - Grouped by project view

3. **Model Pinning**
   - Lock model per conversation
   - Visual indicators (badges, colors)
   - Pin/unpin UI
   - Model selector integration

4. **Enhanced Sidebar**
   - Search functionality
   - Filter tabs
   - Thread actions menu
   - Empty states
   - Footer stats

### Files Created/Modified 📁

**Created**:
- `CommandPalette.tsx` (250+ lines)
- `ConversationThread.tsx` (180+ lines)
- `ModelPinButton.tsx` (200+ lines)
- `useCommandPalette.ts` (30 lines)

**Modified**:
- `ChatUI.tsx` (enhanced with model pinning)
- `chat-secondary-sidebar.tsx` (enhanced with threads)
- `layout.tsx` (mock thread data)
- `index.ts` (exports)

### Next Steps 🚀

1. **Backend Integration**:
   - Create `/api/chat/threads` endpoint
   - Implement pin/unpin API
   - Add model pinning to database schema

2. **Testing**:
   - Test command palette in all pages
   - Verify thread filtering
   - Check model pinning persistence

3. **Enhancements**:
   - Add thread search highlighting
   - Implement drag-to-reorder threads
   - Add keyboard shortcuts for threads
   - Thread preview on hover

---

**Version**: 2.0.0 | **Status**: ✅ Feature Complete | **Last Updated**: 2025-10-05
