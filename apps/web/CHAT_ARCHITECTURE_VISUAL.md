# Chat UI Visual Architecture

```
┌────────────────────────────────────────────────────────────────────────────┐
│                              CHAT UI COMPONENT                             │
└────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                           Full Application Layout                           │
│                                                                             │
│  ┌──────────────────────┐  ┌────────────────────────────────────────────┐ │
│  │                      │  │                                            │ │
│  │   ChatSidebar        │  │              Main Chat Area                │ │
│  │                      │  │                                            │ │
│  │  ┌────────────────┐  │  │  ┌──────────────────────────────────────┐ │ │
│  │  │ AI Models      │  │  │  │  Header (Selected Model)             │ │ │
│  │  │                │  │  │  └──────────────────────────────────────┘ │ │
│  │  │ OpenAI         │  │  │                                            │ │
│  │  │  🤖 GPT-4      │◄─┼──┼─ Selected                                 │ │
│  │  │  🤖 GPT-3.5    │  │  │                                            │ │
│  │  │                │  │  │  ┌──────────────────────────────────────┐ │ │
│  │  │ Anthropic      │  │  │  │                                      │ │ │
│  │  │  🧠 Claude 3   │  │  │  │      ChatMessages                    │ │ │
│  │  │  🧠 Claude S   │  │  │  │      (Scrollable)                    │ │ │
│  │  │                │  │  │  │                                      │ │ │
│  │  │ Google         │  │  │  │  ┌────────────────────────────┐     │ │ │
│  │  │  🔍 Gemini     │  │  │  │  │ [AI] Assistant Message     │     │ │ │
│  │  │                │  │  │  │  │      ▶ StreamingText       │     │ │ │
│  │  │ Meta           │  │  │  │  └────────────────────────────┘     │ │ │
│  │  │  🦙 Llama 2    │  │  │  │                                      │ │ │
│  │  │                │  │  │  │  ┌────────────────────────────┐     │ │ │
│  │  │ Mistral        │  │  │  │  │    User Message        [U] │     │ │ │
│  │  │  🌬️ Mistral L  │  │  │  │  └────────────────────────────┘     │ │ │
│  │  │                │  │  │  │                                      │ │ │
│  │  │ Cohere         │  │  │  │  ┌────────────────────────────┐     │ │ │
│  │  │  ✨ Command R+ │  │  │  │  │ [AI] Streaming response... │     │ │ │
│  │  └────────────────┘  │  │  │  └────────────────────────────┘     │ │ │
│  │                      │  │  │                                      │ │ │
│  │  256px width         │  │  │  └──────────────────────────────────┘ │ │
│  └──────────────────────┘  │  │                                            │ │
│                             │  │  ┌──────────────────────────────────────┐ │ │
│                             │  │  │                                      │ │ │
│                             │  │  │  ChatInput                           │ │ │
│                             │  │  │                                      │ │ │
│                             │  │  │  ┌──────────────────────────────┐   │ │ │
│                             │  │  │  │ SlashCommandAutocomplete     │   │ │ │
│                             │  │  │  │  /task create               │   │ │ │
│                             │  │  │  │  /project invite            │   │ │ │
│                             │  │  │  └──────────────────────────────┘   │ │ │
│                             │  │  │                                      │ │ │
│                             │  │  │  [📎][Type message...][🎤][➤]       │ │ │
│                             │  │  │                                      │ │ │
│                             │  │  └──────────────────────────────────────┘ │ │
│                             │  └────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────────┐
│                         Component Tree Structure                            │
└─────────────────────────────────────────────────────────────────────────────┘

ChatUI (Main Container)
│
├─── ChatSidebar
│    │
│    ├─── Header (title + description)
│    │
│    ├─── Models List (grouped by company)
│    │    │
│    │    ├─── OpenAI
│    │    │    ├─── GPT-4 Turbo [button]
│    │    │    └─── GPT-3.5 Turbo [button]
│    │    │
│    │    ├─── Anthropic
│    │    │    ├─── Claude 3 Opus [button]
│    │    │    └─── Claude 3 Sonnet [button]
│    │    │
│    │    ├─── Google
│    │    │    └─── Gemini Pro [button]
│    │    │
│    │    ├─── Meta
│    │    │    └─── Llama 2 70B [button]
│    │    │
│    │    ├─── Mistral
│    │    │    └─── Mistral Large [button]
│    │    │
│    │    └─── Cohere
│    │         └─── Command R+ [button]
│    │
│    └─── Footer (model count)
│
├─── Main Area
│    │
│    ├─── Header
│    │    ├─── Hamburger Menu [button] (mobile)
│    │    ├─── Selected Model Name
│    │    └─── New Chat [button]
│    │
│    ├─── ChatMessages
│    │    │
│    │    ├─── Empty State (if no messages)
│    │    │
│    │    ├─── Message List
│    │    │    │
│    │    │    ├─── User Message
│    │    │    │    ├─── Content
│    │    │    │    ├─── Timestamp
│    │    │    │    └─── Avatar [U]
│    │    │    │
│    │    │    ├─── Assistant Message
│    │    │    │    ├─── Avatar [AI]
│    │    │    │    ├─── Content
│    │    │    │    │    └─── StreamingText (if streaming)
│    │    │    │    └─── Timestamp
│    │    │    │
│    │    │    └─── ... more messages
│    │    │
│    │    └─── Loading Indicator (if streaming)
│    │         └─── Bouncing Dots Animation
│    │
│    └─── ChatInput
│         │
│         ├─── Attached Files (if any)
│         │    └─── File Chips [with × button]
│         │
│         ├─── Transcribing Status (if transcribing)
│         │    └─── Loading Spinner + Text
│         │
│         ├─── SlashCommandAutocomplete (if active)
│         │    └─── Command List [buttons]
│         │         ├─── /task create
│         │         ├─── /project invite
│         │         └─── ... more commands
│         │
│         └─── Input Toolbar
│              ├─── FileUpload [button]
│              ├─── Textarea (auto-resize)
│              ├─── VoiceRecorder [button]
│              │    └─── Recording Timer (if recording)
│              └─── Send [button]
│
└─── (uses hooks)
     ├─── useChatModels()
     ├─── useChat()
     └─── useSlashCommands()


┌─────────────────────────────────────────────────────────────────────────────┐
│                              State Flow Diagram                             │
└─────────────────────────────────────────────────────────────────────────────┘

User Actions                    State Changes                   UI Updates
     │                               │                              │
     │  Click Model                  │                              │
     ├──────────────────────────────►│ setSelectedModel()           │
     │                               ├─────────────────────────────►│ Sidebar: Highlight selected
     │                               │                              │ Header: Show model name
     │                               │                              │
     │  Type in Input                │                              │
     ├──────────────────────────────►│ setInput()                   │
     │                               ├─────────────────────────────►│ Textarea: Update value
     │                               │                              │
     │  Type "/"                     │                              │
     ├──────────────────────────────►│ handleInputChange()          │
     │                               ├─────────────────────────────►│ Show autocomplete
     │                               │ setShowAutocomplete(true)    │
     │                               │ setFilteredCommands([...])   │
     │                               │                              │
     │  Press ↓                      │                              │
     ├──────────────────────────────►│ setSelectedIndex(+1)         │
     │                               ├─────────────────────────────►│ Highlight next command
     │                               │                              │
     │  Press Tab/Enter              │                              │
     ├──────────────────────────────►│ selectCommand()              │
     │                               ├─────────────────────────────►│ Insert command in input
     │                               │ setShowAutocomplete(false)   │ Hide autocomplete
     │                               │                              │
     │  Click Send                   │                              │
     ├──────────────────────────────►│ sendMessage()                │
     │                               ├─────────────────────────────►│ Add user message bubble
     │                               │ setMessages([...])           │
     │                               │ setIsStreaming(true)         │ Show loading dots
     │                               │                              │
     │  API Response (streaming)     │                              │
     ├──────────────────────────────►│ setMessages([...])           │
     │                               ├─────────────────────────────►│ Add assistant message
     │                               │ isStreaming: true            │ StreamingText animation
     │                               │                              │
     │  Streaming Complete           │                              │
     ├──────────────────────────────►│ setIsStreaming(false)        │
     │                               ├─────────────────────────────►│ Stop animation
     │                               │ isStreaming: false           │
     │                               │                              │
     │  Click Mic                    │                              │
     ├──────────────────────────────►│ startRecording()             │
     │                               ├─────────────────────────────►│ Button: Red, pulsing
     │                               │ setIsRecording(true)         │ Show timer
     │                               │                              │
     │  Click Stop                   │                              │
     ├──────────────────────────────►│ stopRecording()              │
     │                               ├─────────────────────────────►│ Upload audio
     │                               │ setIsTranscribing(true)      │ Show "transcribing..."
     │                               │                              │
     │  Upload Complete              │                              │
     ├──────────────────────────────►│ setIsTranscribing(false)     │
     │                               ├─────────────────────────────►│ Insert text in input
     │                               │ setInput(prev + transcript)  │
     │                               │                              │
     │  Select Files                 │                              │
     ├──────────────────────────────►│ handleFileSelect()           │
     │                               ├─────────────────────────────►│ Show file chips
     │                               │ setAttachedFiles([...])      │


┌─────────────────────────────────────────────────────────────────────────────┐
│                            Data Flow Diagram                                │
└─────────────────────────────────────────────────────────────────────────────┘

                            ┌─────────────────┐
                            │   API Server    │
                            │  (Backend)      │
                            └────────┬────────┘
                                     │
                  ┌──────────────────┼──────────────────┐
                  │                  │                  │
         GET /chat/models   POST /chat/messages   POST /files/upload
                  │                  │                  │
                  ▼                  ▼                  ▼
         ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
         │ useChatModels│   │   useChat    │   │ VoiceRecorder│
         └──────┬───────┘   └──────┬───────┘   └──────┬───────┘
                │                  │                  │
                ▼                  ▼                  ▼
         ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
         │  ChatSidebar │   │ ChatMessages │   │  ChatInput   │
         │              │   │              │   │              │
         │ • Model list │   │ • Messages[] │   │ • Textarea   │
         │ • Selection  │   │ • Streaming  │   │ • Files      │
         │ • Company    │   │ • Timestamps │   │ • Voice      │
         │   grouping   │   │ • Avatars    │   │ • Send       │
         └──────────────┘   └──────────────┘   └──────────────┘
                │                  │                  │
                └──────────────────┼──────────────────┘
                                   │
                                   ▼
                          ┌─────────────────┐
                          │     ChatUI      │
                          │  (Main Parent)  │
                          └─────────────────┘


┌─────────────────────────────────────────────────────────────────────────────┐
│                        Responsive Layout Breakpoints                        │
└─────────────────────────────────────────────────────────────────────────────┘

Mobile (<1024px)                          Desktop (≥1024px)
┌────────────────────────┐                ┌─────────────────────────────────┐
│  [☰] Selected Model    │                │ Sidebar │  Header               │
├────────────────────────┤                ├─────────┼───────────────────────┤
│                        │                │ Models  │                       │
│                        │                │ ├─ M1   │     Messages          │
│     Messages           │                │ ├─ M2   │     (Wide)            │
│     (Full Width)       │                │ ├─ M3   │                       │
│                        │                │ └─ M4   │                       │
│                        │                │         │                       │
├────────────────────────┤                ├─────────┼───────────────────────┤
│  [📎][Input...][🎤][➤] │                │         │  [📎][Input...][🎤][➤]│
└────────────────────────┘                └─────────┴───────────────────────┘

Sidebar as Overlay:                       Sidebar Always Visible:
┌────────────────────────┐                - 256px fixed width
│ [OVERLAY: Dark BG]     │                - Scrollable model list
│ ┌──────────────────┐   │                - Grouped by company
│ │ Models           │   │
│ │ ├─ OpenAI        │   │
│ │ ├─ Anthropic     │   │
│ │ └─ Google        │   │
│ └──────────────────┘   │
└────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────────┐
│                          Slash Command Flow                                 │
└─────────────────────────────────────────────────────────────────────────────┘

Step 1: Type "/"              Step 2: Filter Commands       Step 3: Select
┌──────────────────┐          ┌──────────────────┐          ┌──────────────────┐
│ Input: /         │          │ Autocomplete ▲   │          │ Input: /task c...│
│              [➤] │   ───►   │ ┌──────────────┐ │   ───►   │              [➤] │
└──────────────────┘          │ │ /task create │ │          └──────────────────┘
                              │ │ /task complete│ │
                              │ │ /task delete │ │          Step 4: Execute
                              │ └──────────────┘ │          ┌──────────────────┐
Type "/ta"                    │                  │          │ Parse command    │
┌──────────────────┐          │ Filtered:        │          │ Execute action   │
│ Input: /ta       │          │ ┌──────────────┐ │          │ Show result      │
│              [➤] │   ───►   │ │ /task create │◄┼─ Selected└──────────────────┘
└──────────────────┘          │ │ /task complete│ │
                              │ │ /task delete │ │
                              │ └──────────────┘ │
                              └──────────────────┘

Keyboard Navigation:
↑ ↓     = Navigate list
Tab/⏎   = Select command
Esc     = Close autocomplete
