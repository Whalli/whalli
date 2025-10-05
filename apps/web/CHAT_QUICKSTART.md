# Chat UI Quick Start Guide

## 🚀 Getting Started (5 minutes)

### 1. Start the Web App

```bash
cd /home/geekmonstar/code/projects/whalli
pnpm --filter=@whalli/web dev
```

The app will be available at http://localhost:3000

### 2. Visit the Chat Page

Open your browser and navigate to:
```
http://localhost:3000/chat
```

## 📖 Features Overview

### 🤖 Model Selection
**Location**: Left sidebar

- Click on any AI model to select it
- Models are grouped by company (OpenAI, Anthropic, Google, etc.)
- Selected model highlighted in blue
- On mobile: tap hamburger menu to open sidebar

### 💬 Sending Messages
**Location**: Bottom input box

1. Type your message in the input box
2. Press `Enter` to send (or click send button)
3. Press `Shift+Enter` for new line
4. Watch the AI response stream in real-time

### ⚡ Slash Commands
**Location**: Input box

1. Type `/` to trigger autocomplete
2. Continue typing to filter commands (e.g., `/task`)
3. Use `↑`/`↓` arrow keys to navigate
4. Press `Tab` or `Enter` to select
5. Press `Esc` to close autocomplete

**Available Commands**:
```
/task create [title] due:[date] project:[name]
/task complete [task-id]
/task delete [task-id]
/project create [name] desc:[description]
/project invite [email] project:[name] role:[admin|member|viewer]
/message send [user-email] [message]
/help
/clear
/settings
```

### 📎 File Upload
**Location**: Bottom left of input

1. Click the paperclip icon
2. Select one or more files
3. Files appear as chips above input
4. Click `×` on chip to remove file

**Supported**:
- Images: JPG, PNG, GIF, etc.
- Videos: MP4, MOV, etc.
- Documents: PDF, DOC, DOCX, TXT

### 🎤 Voice Recording
**Location**: Bottom right of input (next to send button)

1. Click microphone icon to start recording
2. Timer shows recording duration
3. Click red square button to stop
4. Audio uploads automatically to `/files/upload`
5. Shows "transcribing..." while processing
6. Transcription appears in input when done

**Requirements**:
- HTTPS or localhost
- Microphone permission granted
- Modern browser (Chrome, Firefox, Safari, Edge)

## 🎨 UI Components Breakdown

### Main Layout
```
┌─────────────────────────────────────────────┐
│  Header (Model Name + New Chat Button)     │
├──────────┬──────────────────────────────────┤
│          │                                  │
│ Sidebar  │      Chat Messages               │
│ (Models) │      (Scrollable)                │
│          │                                  │
│          ├──────────────────────────────────┤
│          │   Input Box + Toolbar           │
└──────────┴──────────────────────────────────┘
```

### Chat Message
```
User Message:
┌────────────────────────────────────────┐
│  [Content]                          [U]│
│  12:34 PM                              │
└────────────────────────────────────────┘

Assistant Message:
┌────────────────────────────────────────┐
│[AI] [Content with streaming...]        │
│     12:34 PM                           │
└────────────────────────────────────────┘
```

### Input Toolbar
```
┌──────────────────────────────────────────────┐
│ [📎] [Type message...] [🎤] [➤]              │
└──────────────────────────────────────────────┘
  File   Input box        Voice  Send
```

## 🔧 Integration with Backend

### Current State (Mock Data)
The UI currently uses **mock data** for demonstration:
- Mock AI models (8 models from 6 companies)
- Simulated streaming responses
- Mock file upload handlers

### Connecting to Real API

#### Step 1: Set Environment Variable

Create `apps/web/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

#### Step 2: Update API Calls

Edit `apps/web/src/hooks/useChatModels.ts`:

```tsx
// Replace mock data fetch with real API call
const response = await fetch(`${apiUrl}/chat/models`, {
  credentials: 'include',
});
const data = await response.json();
setModels(data.models);
```

Edit `apps/web/src/hooks/useChat.ts`:

```tsx
// Implement real streaming with Server-Sent Events
const response = await fetch(`${apiUrl}/chat/messages`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({ userId, modelId, message: content }),
});

const reader = response.body?.getReader();
const decoder = new TextDecoder();
let assistantContent = '';

while (true) {
  const { done, value } = await reader!.read();
  if (done) break;

  const chunk = decoder.decode(value);
  assistantContent += chunk;

  // Update message content in real-time
  setMessages((prev) => {
    const newMessages = [...prev];
    const lastMessage = newMessages[newMessages.length - 1];
    if (lastMessage.role === 'assistant') {
      lastMessage.content = assistantContent;
    }
    return newMessages;
  });
}
```

#### Step 3: Backend Endpoints Required

Create these endpoints in `apps/api`:

```typescript
// GET /chat/models
@Get('models')
async getModels() {
  return {
    models: [
      { id: 'gpt-4', name: 'GPT-4', company: 'OpenAI', description: '...' }
    ]
  };
}

// POST /chat/messages (with streaming)
@Post('messages')
async sendMessage(@Body() dto: SendMessageDto, @Res() res: Response) {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // Stream response chunks
  const stream = await this.aiService.chat(dto.modelId, dto.message);
  for await (const chunk of stream) {
    res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
  }
  res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
  res.end();
}
```

## 📱 Responsive Design

### Desktop (≥1024px)
- Sidebar always visible (256px width)
- Full message width (max 896px)
- All features accessible

### Tablet (768px - 1023px)
- Sidebar toggles with hamburger menu
- Slightly narrower messages
- Touch-friendly button sizes

### Mobile (<768px)
- Sidebar as full-screen overlay
- Single-column layout
- Optimized input toolbar
- Swipe gestures (future enhancement)

## 🎯 Usage Examples

### Example 1: Simple Chat
```tsx
import { ChatUI } from '@/components/chat';

export default function Page() {
  return <ChatUI userId="user-123" />;
}
```

### Example 2: With Auth
```tsx
'use client';

import { ChatUI } from '@/components/chat';
import { useAuth } from '@/lib/auth';

export default function Page() {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (!user) return <div>Please login</div>;

  return <ChatUI userId={user.id} apiUrl="http://localhost:3001" />;
}
```

### Example 3: Embedded Chat
```tsx
import { ChatUI } from '@/components/chat';

export default function Dashboard() {
  return (
    <div className="grid grid-cols-3 gap-4 h-screen">
      <div className="col-span-2">
        {/* Main content */}
      </div>
      <div className="border-l">
        <ChatUI userId="user-123" />
      </div>
    </div>
  );
}
```

## 🎨 Customization

### Change Colors

Edit component files to update theme:

```tsx
// User message bubble
<div className="bg-purple-600 text-white"> {/* Changed from bg-blue-600 */}

// Assistant message bubble
<div className="bg-gray-100 text-gray-900"> {/* Changed from bg-white */}

// Selected model
<div className="bg-green-50 text-green-700"> {/* Changed from bg-blue-50 */}
```

### Add Custom Model
```tsx
// In apps/web/src/hooks/useChatModels.ts
const mockModels: AIModel[] = [
  {
    id: 'my-model',
    name: 'My Custom Model',
    company: 'MyCompany',
    description: 'Description here'
  },
  // ... existing models
];
```

### Add Custom Command
```tsx
// In apps/web/src/hooks/useSlashCommands.ts
const SLASH_COMMANDS: SlashCommand[] = [
  {
    command: '/analyze',
    description: 'Analyze uploaded file',
    icon: '🔍',
    syntax: '/analyze [filename]'
  },
  // ... existing commands
];
```

## 🐛 Common Issues & Solutions

### Issue: "Cannot find module '@/components/chat'"
**Solution**: Check `tsconfig.json` has path mapping:
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### Issue: Microphone not working
**Solutions**:
1. Check browser permissions
2. Use HTTPS (required for getUserMedia API)
3. Try Chrome/Firefox (best support)

### Issue: Autocomplete not showing
**Solutions**:
1. Type `/` at start of line
2. Check console for errors
3. Ensure `useSlashCommands` hook is working

### Issue: Messages not streaming
**Solutions**:
1. Check `isStreaming` state
2. Verify `StreamingText` component is used
3. Adjust `speed` prop (default: 20ms)

### Issue: Sidebar not responsive on mobile
**Solutions**:
1. Check Tailwind `lg:` breakpoint classes
2. Verify overlay click handler
3. Test on actual device (not just resize)

## ⚡ Performance Tips

1. **Long message lists**: Use react-window for virtualization
2. **Large files**: Compress before upload
3. **Autocomplete**: Debounce search (currently instant)
4. **Models list**: Cache in localStorage
5. **Streaming**: Use Web Workers for heavy processing

## 📊 Component State Flow

```
ChatUI (Main Container)
  ├─ useChatModels() → Fetch & manage models
  ├─ useChat() → Message state & sending
  └─ Components:
      ├─ ChatSidebar (models, selection)
      ├─ ChatMessages (display messages)
      │   └─ StreamingText (animate streaming)
      └─ ChatInput (user input)
          ├─ useSlashCommands() → Autocomplete
          ├─ SlashCommandAutocomplete (dropdown)
          ├─ FileUpload (attach files)
          └─ VoiceRecorder (record audio)
```

## 🎓 Learning Resources

- **Tailwind CSS**: https://tailwindcss.com/docs
- **Next.js 14**: https://nextjs.org/docs
- **TypeScript**: https://www.typescriptlang.org/docs
- **Web Audio API**: https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API
- **Server-Sent Events**: https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events

## 🚀 Next Steps

1. **Connect to real AI API** (OpenAI, Anthropic, etc.)
2. **Implement chat history** (save to database)
3. **Add user authentication** (Better Auth integration)
4. **Support markdown rendering** (react-markdown)
5. **Add code syntax highlighting** (Prism.js)
6. **Implement file previews** (images, PDFs)
7. **Add emoji picker** (emoji-mart)
8. **Support @mentions** (mention users/models)
9. **Add message reactions** (like, bookmark, etc.)
10. **Implement search** (search through chat history)

## 📞 Support

For issues or questions:
1. Check CHAT_UI.md documentation
2. Review component source code
3. Check browser console for errors
4. Test with mock data first
5. Verify API endpoints are working

Happy chatting! 🎉
