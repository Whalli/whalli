# Enhanced Chat UI - Visual Component Structure

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Enhanced Chat UI Architecture                     │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                         GLOBAL FEATURES                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ⌨️  Command Palette (Ctrl+K / Cmd+K)                               │
│  ┌───────────────────────────────────────────────────────────┐     │
│  │  🔍 Search: "new chat"                              ❌ ESC │     │
│  ├───────────────────────────────────────────────────────────┤     │
│  │  ➤ 💬 New Chat                                      chat  │     │
│  │    📁 New Project                                 project │     │
│  │    ✅ New Task                                       task  │     │
│  │    🌐 Run Web Search                               search │     │
│  │    ⚡ Ask AI Assistant                              chat  │     │
│  │    📂 View All Projects                           project │     │
│  │    📋 View All Tasks                                task  │     │
│  └───────────────────────────────────────────────────────────┘     │
│  Fuzzy Search | Keyboard Nav | Category Badges                      │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────┐
│                    CHAT PAGE WITH SIDEBARS                           │
└─────────────────────────────────────────────────────────────────────┘

┌──────┬──────────────────┬─────────────────────────────────────────┐
│ NAV  │  THREADS SIDEBAR │           CHAT CONTENT                  │
│ 80px │     256px        │              Flexible                   │
├──────┼──────────────────┼─────────────────────────────────────────┤
│      │                  │                                          │
│ 🏠   │ Conversations  ➕│  ┌────────────────────────────────────┐ │
│ 💬   │ ┌──────────────┐ │  │ ℹ️ Model changes with each msg     │ │
│ 📁   │ │🔍 Search...  │ │  │             🔓 Pin Model [v]       │ │
│ ✅   │ └──────────────┘ │  └────────────────────────────────────┘ │
│ 👤   │                  │                                          │
│ ⚙️   │ ┌──────────────┐ │  ┌────────────────────────────────────┐ │
│      │ │All│Proj│Stand││ │  │                                    │ │
│      │ └──────────────┘ │  │  👤 User: Hello, explain React...  │ │
│      │                  │  │                                    │ │
│      │ 📌 Pinned        │  │  🤖 Assistant: React is a...       │ │
│      │ ┌──────────────┐ │  │                                    │ │
│      │ │📌 AI Research│ │  │  👤 User: Show me an example...    │ │
│      │ │📁 AI Project │ │  │                                    │ │
│      │ │🔒 GPT-4 Turbo│ │  │  🤖 Assistant: Here's a...         │ │
│      │ │24 msgs • 2h  │ │  │                                    │ │
│      │ └──────────────┘ │  └────────────────────────────────────┘ │
│      │                  │                                          │
│      │ 🕒 Recent        │  ┌────────────────────────────────────┐ │
│      │ ┌──────────────┐ │  │ 💬 Type your message...            │ │
│      │ │💬 Quick Q    │ │  │ 📎 🎤 🤖 GPT-4 Turbo [v]      Send│ │
│      │ │3 msgs • 2d   │ │  └────────────────────────────────────┘ │
│      │ └──────────────┘ │                                          │
│      │                  │  ┌────────────────────────────────────┐ │
│      │ 5 total convos   │  │ 💡 This conversation is locked to  │ │
│      │ Press Ctrl+K     │  │    GPT-4 Turbo. All messages will  │ │
│      │                  │  │    use this model.                 │ │
│      │                  │  └────────────────────────────────────┘ │
│      │                  │                                          │
└──────┴──────────────────┴─────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────┐
│                   CONVERSATION THREAD COMPONENT                      │
└─────────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────┐
│ 📌 AI Model Comparison Study                              ⋮   │  ← Pinned
│ 📁 AI Research Project                                        │  ← Project
│ 🔒 GPT-4 Turbo                                               │  ← Model Lock
│ Comparing GPT-4 vs Claude 3 Opus performance...             │  ← Last Message
│ 2h ago • 24 messages                                         │  ← Stats
└───────────────────────────────────────────────────────────────┘
        ↓ Click ⋮ for context menu
┌───────────────────────┐
│ 📌 Unpin conversation │
│ ✏️  Rename            │
│ 📦 Archive            │
│ ─────────────────────  │
│ 🗑️  Delete            │  ← Red, destructive
└───────────────────────┘


┌─────────────────────────────────────────────────────────────────────┐
│                      MODEL PIN BUTTON UI                             │
└─────────────────────────────────────────────────────────────────────┘

Unpinned State:
┌─────────────────────┐
│ 🔓 Pin Model    [v] │  ← Gray button
└─────────────────────┘

Pinned State:
┌─────────────────────┐
│ 🔒 GPT-4 Turbo  [v] │  ← Blue button
└─────────────────────┘

Dropdown Menu:
┌────────────────────────────────────────┐
│ Pin AI Model                        ❌ │
│ Lock this conversation to a model     │
├────────────────────────────────────────┤
│ Current Model:                         │
│ ┌────────────────────────────────────┐ │
│ │ GPT-3.5 Turbo                  🔒  │ │
│ │ OpenAI                             │ │
│ └────────────────────────────────────┘ │
├────────────────────────────────────────┤
│ 🔓 Unpin Model                         │  ← If currently pinned
├────────────────────────────────────────┤
│ Available Models:                      │
│ ┌────────────────────────────────────┐ │
│ │ GPT-4 Turbo                        │ │
│ │ OpenAI                             │ │
│ └────────────────────────────────────┘ │
│ ┌────────────────────────────────────┐ │
│ │ Claude 3 Opus                  ✓   │ │  ← Selected/Pinned
│ │ Anthropic                          │ │
│ └────────────────────────────────────┘ │
│ ... (scrollable list) ...              │
├────────────────────────────────────────┤
│ 💡 Pinned models are locked for this   │
│    conversation. You can switch...     │
└────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────┐
│                    FILTER TABS (SIDEBAR)                             │
└─────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────┐
│ [💬 All] [📁 Projects] [⚡ Standalone] │  ← Tab filters
└────────────────────────────────────────┘
         ↓ When "Projects" selected
┌────────────────────────────────────────┐
│ 📁 AI Research Project (3)             │  ← Project group
│   ├─ AI Model Comparison               │
│   ├─ Code Review Discussion            │
│   └─ Data Analysis                     │
│                                        │
│ 📁 Marketing Campaign (1)              │
│   └─ Marketing Strategy                │
│                                        │
│ 📁 Website Redesign (1)                │
│   └─ UI Design Ideas                   │
└────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────┐
│                      COMPONENT HIERARCHY                             │
└─────────────────────────────────────────────────────────────────────┘

App Layout (layout.tsx)
├── DualSidebarLayout
│   ├── PrimarySidebar (80px, navigation)
│   │   ├── Home Icon
│   │   ├── Chat Icon
│   │   ├── Projects Icon
│   │   ├── Tasks Icon
│   │   └── Settings Icon
│   │
│   ├── ChatSecondarySidebar (256px)
│   │   ├── Header
│   │   │   ├── Title: "Conversations"
│   │   │   └── New Chat Button (+)
│   │   │
│   │   ├── Search Input (🔍)
│   │   │
│   │   ├── Filter Tabs
│   │   │   ├── All Tab
│   │   │   ├── Projects Tab
│   │   │   └── Standalone Tab
│   │   │
│   │   ├── Pinned Section (📌)
│   │   │   └── ConversationThread[]
│   │   │       ├── Pin Icon (yellow)
│   │   │       ├── Project Badge
│   │   │       ├── Model Lock Badge (blue)
│   │   │       ├── Stats (count, time)
│   │   │       └── Context Menu (⋮)
│   │   │
│   │   ├── Recent Section (🕒)
│   │   │   └── ConversationThread[]
│   │   │       └── (same structure)
│   │   │
│   │   └── Footer Stats
│   │
│   └── ChatUI (main content)
│       ├── Header Bar
│       │   ├── Lock Indicator (ℹ️ or 🔒)
│       │   └── ModelPinButton
│       │       ├── Pin/Unpin Button
│       │       └── Dropdown Menu
│       │           ├── Current Model
│       │           ├── Unpin Option
│       │           ├── Available Models
│       │           └── Footer Tip
│       │
│       ├── Messages Area
│       │   └── ChatMessages
│       │       ├── User Message
│       │       ├── Assistant Message
│       │       └── ...
│       │
│       ├── Input Area
│       │   └── ChatInput
│       │       ├── Text Input
│       │       ├── File Upload (📎)
│       │       ├── Voice Recorder (🎤)
│       │       ├── Model Selector (🤖)
│       │       └── Send Button
│       │
│       └── Footer Notice (if pinned)
│           └── Blue info banner
│
└── CommandPalette (overlay)
    ├── Backdrop (click to close)
    └── Palette Dialog
        ├── Search Input (🔍)
        ├── Command List
        │   └── Command Items
        │       ├── Icon
        │       ├── Label + Description
        │       └── Category Badge
        └── Footer
            ├── Keyboard Hints
            └── Shortcut Badge (Ctrl+K)


┌─────────────────────────────────────────────────────────────────────┐
│                       STATE MANAGEMENT                               │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│         Global State (App Level)        │
├─────────────────────────────────────────┤
│ • userId                                │
│ • currentChatId                         │
│ • conversationThreads[]                 │
│   ├── id, title, isPinned               │
│   ├── projectId, projectName            │
│   ├── pinnedModelId, pinnedModelName    │
│   ├── lastMessage, timestamp            │
│   └── messageCount                      │
└─────────────────────────────────────────┘
               ↓
┌─────────────────────────────────────────┐
│       Chat Page State (Local)           │
├─────────────────────────────────────────┤
│ • messages[]                            │
│ • selectedModel                         │
│ • pinnedModelId (this conversation)     │
│ • isStreaming                           │
└─────────────────────────────────────────┘
               ↓
┌─────────────────────────────────────────┐
│     Sidebar State (Local)               │
├─────────────────────────────────────────┤
│ • searchQuery                           │
│ • filterType (all/project/standalone)   │
│ • activeThreadId                        │
└─────────────────────────────────────────┘
               ↓
┌─────────────────────────────────────────┐
│   Command Palette State (Global Hook)   │
├─────────────────────────────────────────┤
│ • isOpen                                │
│ • selectedCommandIndex                  │
└─────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────┐
│                         DATA FLOW                                    │
└─────────────────────────────────────────────────────────────────────┘

User Press Ctrl+K
    ↓
useCommandPalette hook detects
    ↓
Set isOpen = true
    ↓
CommandPalette renders
    ↓
User types "new chat"
    ↓
Filters commands
    ↓
User presses Enter
    ↓
Execute command action
    ↓
router.push('/chat')
    ↓
Close palette


User clicks thread in sidebar
    ↓
ConversationThread onClick
    ↓
router.push(`/chat/${threadId}`)
    ↓
ChatUI loads with chatId
    ↓
Fetch initialPinnedModelId
    ↓
Set pinnedModelId state
    ↓
effectiveModel = pinnedModel || selectedModel
    ↓
All messages use effectiveModel


User clicks "Pin Model"
    ↓
ModelPinButton opens dropdown
    ↓
User selects model
    ↓
onPinModel(modelId) callback
    ↓
setPinnedModelId(modelId)
    ↓
Save to backend: PUT /api/chat/:id { pinnedModelId }
    ↓
Save to localStorage (backup)
    ↓
Update thread in sidebar
    ↓
Show blue lock badge


┌─────────────────────────────────────────────────────────────────────┐
│                    KEYBOARD SHORTCUTS                                │
└─────────────────────────────────────────────────────────────────────┘

Global:
  Ctrl+K / Cmd+K   → Open/close command palette

Command Palette:
  ↑ / ↓            → Navigate commands
  Enter            → Execute selected command
  Esc              → Close palette
  Type to search   → Filter commands

Sidebar (planned):
  Ctrl+F           → Focus search
  Ctrl+N           → New chat
  Ctrl+Shift+P     → Pin thread

Chat (planned):
  Ctrl+M           → Toggle model pinning
  Ctrl+L           → Link to project


┌─────────────────────────────────────────────────────────────────────┐
│                      RESPONSIVE BEHAVIOR                             │
└─────────────────────────────────────────────────────────────────────┘

Desktop (≥1024px):
┌──────┬──────────────────┬─────────────────────────────────────────┐
│ NAV  │  THREADS SIDEBAR │           CHAT CONTENT                  │
│ 80px │     256px        │              Flexible                   │
│ Fixed│     Fixed        │         (1024px - 336px)                │
└──────┴──────────────────┴─────────────────────────────────────────┘
  Both sidebars always visible


Mobile (<1024px):
┌──────────────────────────────────────────────────────────────────────┐
│                       CHAT CONTENT (Full Width)                      │
│                                                                       │
│  [☰ Threads]                                      [☰ Nav]            │
│  ← Toggle buttons in corners                                         │
└──────────────────────────────────────────────────────────────────────┘
  Sidebars slide in as overlays when toggled


┌─────────────────────────────────────────────────────────────────────┐
│                      ACCESSIBILITY                                   │
└─────────────────────────────────────────────────────────────────────┘

✅ Keyboard Navigation
   • Ctrl+K for command palette
   • Arrow keys for navigation
   • Enter to select/execute
   • Esc to close dialogs

✅ ARIA Labels
   • All buttons have aria-label
   • Dropdown menus have role="menu"
   • Threads have semantic HTML

✅ Focus Management
   • Auto-focus on search inputs
   • Focus trap in modals
   • Visible focus indicators

✅ Screen Reader Support
   • Descriptive labels
   • Status announcements
   • Proper heading hierarchy

✅ Color Contrast
   • WCAG AA compliant
   • Blue (#3b82f6) on white
   • Text contrast ≥4.5:1


┌─────────────────────────────────────────────────────────────────────┐
│                    ANIMATION TIMINGS                                 │
└─────────────────────────────────────────────────────────────────────┘

Component              | Duration | Easing
──────────────────────────────────────────────────
Command Palette open   | 200ms    | ease-out
Command Palette close  | 150ms    | ease-in
Dropdown open          | 150ms    | ease-out
Sidebar slide (mobile) | 300ms    | ease-in-out
Thread hover           | 100ms    | ease
Button hover           | 150ms    | ease
Fade in                | 200ms    | ease
Slide in               | 300ms    | cubic-bezier


┌─────────────────────────────────────────────────────────────────────┐
│                         SUMMARY                                      │
└─────────────────────────────────────────────────────────────────────┘

Component Count:
  • 4 new components created
  • 3 components enhanced
  • 1 new hook added

Lines of Code:
  • CommandPalette.tsx:        250 lines
  • ConversationThread.tsx:    180 lines
  • ModelPinButton.tsx:        200 lines
  • Enhanced ChatUI.tsx:       +150 lines
  • Enhanced Sidebar:          +200 lines
  • useCommandPalette.ts:       30 lines
  ────────────────────────────────────────
  Total:                      ~1010 lines

Features:
  ✅ Command Palette (Ctrl+K)
  ✅ Conversation Threads
  ✅ Project Linking
  ✅ Model Pinning
  ✅ Search & Filtering
  ✅ Context Menus
  ✅ Visual Indicators
  ✅ Responsive Design

Status:
  ✅ Frontend: Complete
  ✅ TypeScript: No errors
  ⏳ Backend: API needed
  ⏳ Testing: Pending
