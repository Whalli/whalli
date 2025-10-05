# Chat Routes Structure

## 📋 Vue d'Ensemble

Structure de routing pour le système de chat avec deux types de pages :
- **Index page** (`/chat`) : Page d'accueil avec search et quick actions
- **Conversation page** (`/chat/[chatId]`) : Interface de chat pour une conversation spécifique

## 🗺️ Structure des Routes

```
apps/web/src/app/(app)/chat/
├── page.tsx                    # GET /chat (Index - Empty state)
└── [chatId]/
    └── page.tsx                # GET /chat/:chatId (Conversation)
```

## 📄 Pages

### 1. Chat Index (`/chat`)

**Fichier** : `apps/web/src/app/(app)/chat/page.tsx`

**Description** : Page d'accueil du chat avec empty state élégant

**UI Components** :
- Logo/Icon Whalli
- Titre et description
- Input de recherche (Start a new chat)
- Quick actions (Get Ideas, Write, Analyze, Research)

**Comportement** :
- Affiche un état vide avec call-to-action
- Permet de démarrer une nouvelle conversation
- Recherche dans l'historique des conversations
- Quick actions pour démarrer avec un prompt prédéfini

**Code Example** :
```tsx
export default function ChatIndexPage() {
  return (
    <div className="flex flex-col items-center justify-center">
      {/* Logo */}
      <div className="w-20 h-20 rounded-full bg-primary/10">
        <svg>...</svg>
      </div>
      
      {/* Title */}
      <h1>Welcome to Whalli Chat</h1>
      
      {/* Search Input */}
      <input 
        placeholder="Start a new chat or search..."
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            // TODO: Create new chat
          }
        }}
      />
      
      {/* Quick Actions */}
      <div className="grid grid-cols-4 gap-3">
        <button>💡 Get Ideas</button>
        <button>✍️ Write</button>
        <button>📊 Analyze</button>
        <button>🔍 Research</button>
      </div>
    </div>
  );
}
```

**Screenshots** :
- Voir image 1 de l'attachement (empty state)

---

### 2. Chat Conversation (`/chat/[chatId]`)

**Fichier** : `apps/web/src/app/(app)/chat/[chatId]/page.tsx`

**Description** : Interface de conversation avec un chat spécifique

**UI Components** :
- ChatUI component (input, messages, model selector)
- Chat history dans la sidebar secondaire
- Messages streaming avec animation

**Comportement** :
- Charge l'historique du chat depuis l'API (TODO)
- Permet d'envoyer et recevoir des messages
- Streaming des réponses AI
- Changement de modèle AI

**Code Example** :
```tsx
export default function ChatConversationPage() {
  const params = useParams();
  const chatId = params.chatId as string;
  const userId = 'demo-user-id';

  // TODO: Fetch chat history for this chatId
  // TODO: Pass chatId to ChatUI

  return (
    <div className="h-[calc(100vh-6rem)]">
      <ChatUI 
        userId={userId} 
        apiUrl="http://localhost:3001"
      />
    </div>
  );
}
```

**URL Examples** :
- `/chat/123` → Conversation avec ID 123
- `/chat/abc-def-456` → Conversation avec UUID abc-def-456

**Screenshots** :
- Voir image 2 de l'attachement (conversation active)

---

## 🔀 Navigation Flow

```
┌─────────────────────────────────────────────────────────────┐
│  User Journey                                               │
└─────────────────────────────────────────────────────────────┘

1. User visits /chat
   │
   ├─> Sees empty state with search input
   │
   ├─> Types message + Enter
   │   │
   │   └─> POST /api/chat (create new chat)
   │       │
   │       └─> Redirect to /chat/[newChatId]
   │
   └─> OR clicks on chat in sidebar
       │
       └─> Navigate to /chat/[existingChatId]

2. User at /chat/[chatId]
   │
   ├─> ChatUI loads with messages
   │
   ├─> Types message + Send
   │   │
   │   └─> POST /api/chat/[chatId]/messages
   │       │
   │       └─> Stream AI response
   │
   └─> Clicks "New chat" in sidebar
       │
       └─> Navigate back to /chat
```

## 🎨 Layouts

Les deux pages utilisent **DualSidebarLayout** avec **ChatSecondarySidebar** :

```
┌────────────────────────────────────────────────────────────┐
│  Layout Structure                                          │
└────────────────────────────────────────────────────────────┘

┌─────┬──────────┬────────────────────────────────────────┐
│     │  Chats   │                                        │
│ Pri │          │  /chat           /chat/[chatId]        │
│ mar │  Search  │  ─────────       ─────────────         │
│ y   │          │  Empty State     ChatUI               │
│     │  Pinned  │  • Logo          • Messages           │
│ Nav │  • Chat1 │  • Search        • Input              │
│     │  • Chat2 │  • Quick         • Model selector     │
│     │          │    Actions                            │
│ 80  │ History  │                                        │
│ px  │  • Chat3 │                                        │
│     │  • Chat4 │                                        │
│     │          │                                        │
└─────┴──────────┴────────────────────────────────────────┘
 80px    256px              Remaining width
```

## 🔧 ChatSecondarySidebar Integration

**Fichier** : `apps/web/src/components/layout/chat-secondary-sidebar.tsx`

**Features** :
- Header avec titre "Chats" et bouton "+" (lien vers `/chat`)
- Search input pour filtrer les conversations
- Section "Pinned" pour chats épinglés
- Section "History" pour conversations récentes
- Chaque chat item est un lien vers `/chat/[chatId]`

**Code Example** :
```tsx
export function ChatSecondarySidebar({ chats = [] }: Props) {
  return (
    <div>
      {/* Header */}
      <div>
        <h2>Chats</h2>
        <Link href="/chat">
          <Plus /> {/* New chat */}
        </Link>
      </div>
      
      {/* Chat List */}
      <div>
        {/* Pinned */}
        {pinnedChats.map(chat => (
          <Link href={`/chat/${chat.id}`}>
            <ChatItem chat={chat} />
          </Link>
        ))}
        
        {/* History */}
        {recentChats.map(chat => (
          <Link href={`/chat/${chat.id}`}>
            <ChatItem chat={chat} />
          </Link>
        ))}
      </div>
    </div>
  );
}
```

## 🚀 API Integration (TODO)

### 1. Create New Chat

**Endpoint** : `POST /api/chat`

**Request** :
```json
{
  "userId": "user-123",
  "firstMessage": "Hello, how are you?"
}
```

**Response** :
```json
{
  "chatId": "chat-abc-123",
  "createdAt": "2024-10-04T12:00:00Z"
}
```

**Frontend Integration** :
```tsx
// In /chat page.tsx
const handleStartChat = async (message: string) => {
  const response = await fetch('/api/chat', {
    method: 'POST',
    body: JSON.stringify({ userId, firstMessage: message })
  });
  const { chatId } = await response.json();
  router.push(`/chat/${chatId}`);
};
```

---

### 2. Fetch Chat History

**Endpoint** : `GET /api/chat/:chatId/messages`

**Response** :
```json
{
  "chatId": "chat-abc-123",
  "title": "Project Planning Discussion",
  "messages": [
    {
      "id": "msg-1",
      "role": "user",
      "content": "Hello",
      "timestamp": "2024-10-04T12:00:00Z"
    },
    {
      "id": "msg-2",
      "role": "assistant",
      "content": "Hi! How can I help?",
      "model": "gpt-4",
      "timestamp": "2024-10-04T12:00:05Z"
    }
  ]
}
```

**Frontend Integration** :
```tsx
// In /chat/[chatId]/page.tsx
const { data: chatHistory } = useSWR(
  `/api/chat/${chatId}/messages`,
  fetcher
);

return <ChatUI initialMessages={chatHistory?.messages} />;
```

---

### 3. Send Message

**Endpoint** : `POST /api/chat/:chatId/messages`

**Request** :
```json
{
  "content": "What's the weather?",
  "model": "gpt-4"
}
```

**Response** : SSE stream with message chunks

**Frontend Integration** :
```tsx
// Already implemented in ChatUI component
// Uses EventSource for SSE streaming
```

---

### 4. List User Chats

**Endpoint** : `GET /api/chat?userId=:userId`

**Response** :
```json
{
  "chats": [
    {
      "id": "chat-1",
      "title": "Project Planning",
      "isPinned": true,
      "lastMessage": "Let's discuss...",
      "timestamp": "2h ago"
    }
  ]
}
```

**Frontend Integration** :
```tsx
// In (app)/layout.tsx
const { data: chats } = useSWR(`/api/chat?userId=${userId}`, fetcher);

return <ChatSecondarySidebar chats={chats} />;
```

## 📊 State Management

### Current State (Mock Data)

```tsx
// (app)/layout.tsx
const mockChats = [
  { id: '1', title: 'Pinned Chat 1', isPinned: true, ... },
  { id: '2', title: 'Recent Chat 1', ... },
];

<ChatSecondarySidebar chats={mockChats} />
```

### Future State (API + SWR)

```tsx
// (app)/layout.tsx
import useSWR from 'swr';

const { data: chats, mutate } = useSWR(`/api/chat?userId=${userId}`, fetcher);

<ChatSecondarySidebar 
  chats={chats} 
  onNewChat={() => router.push('/chat')}
/>
```

## 🎯 User Experience

### Empty State (`/chat`)

**Design Goals** :
- ✅ Welcoming and inviting
- ✅ Clear call-to-action
- ✅ Multiple entry points (search, quick actions)
- ✅ Matches Whalli brand (logo, colors)

**Interactions** :
1. Type in search → Press Enter → Create new chat
2. Click quick action → Pre-fill prompt → Create chat
3. View history in sidebar → Click chat → Navigate to conversation

---

### Active Conversation (`/chat/[chatId]`)

**Design Goals** :
- ✅ Full-screen chat interface
- ✅ Easy model switching
- ✅ Smooth message streaming
- ✅ Quick access to other chats (sidebar)

**Interactions** :
1. Type message → Send → Stream AI response
2. Click model selector → Change AI model
3. Upload file → Attach to message
4. Click "New chat" → Navigate to `/chat`

## 🔄 Migration from Old Structure

### Before (Single Route)

```
src/app/(app)/chat/
└── page.tsx  (Always showed ChatUI)
```

### After (Index + Dynamic)

```
src/app/(app)/chat/
├── page.tsx           (Empty state - new entry point)
└── [chatId]/
    └── page.tsx       (Conversation - ChatUI)
```

**Benefits** :
- ✅ Better UX with dedicated empty state
- ✅ Clear separation: index vs conversation
- ✅ Matches common chat app patterns (Slack, Discord, ChatGPT)
- ✅ SEO-friendly URLs (`/chat`, `/chat/project-planning`)

## 📝 Next Steps

### Phase 1: API Integration ✅ Ready
- [ ] Implement `/api/chat` endpoint (create chat)
- [ ] Implement `/api/chat/:chatId/messages` (list messages)
- [ ] Implement chat list endpoint
- [ ] Update ChatUI to accept `chatId` prop

### Phase 2: State Management
- [ ] Install SWR or React Query
- [ ] Replace mock data with API calls
- [ ] Add loading states
- [ ] Add error handling

### Phase 3: Features
- [ ] Chat title generation (AI-powered)
- [ ] Pin/unpin chats
- [ ] Delete chats
- [ ] Search in chat history
- [ ] Export chat as PDF/Markdown

### Phase 4: Polish
- [ ] Keyboard shortcuts (Ctrl+K for new chat)
- [ ] Drag-and-drop to reorder pinned chats
- [ ] Chat folders/categories
- [ ] Shared chats (collaboration)

## 🎉 Summary

**Architecture** : Index + Dynamic route pattern  
**Empty State** : Welcoming page with search and quick actions  
**Conversation** : Full ChatUI with message history  
**Sidebar** : Always visible with chat list and navigation  
**Status** : ✅ Implemented, 🔜 API integration ready

---

**Documentation créée le** : 4 octobre 2025  
**Prêt pour** : Intégration API et Better Auth
