# Chat UI Component

A comprehensive, production-ready chat interface built with Next.js 14, TypeScript, and Tailwind CSS.

## 🎯 Features

### ✨ Core Functionality
- **Model Selection Sidebar**: Browse AI models grouped by company (OpenAI, Anthropic, Google, Meta, Mistral, Cohere)
- **Real-time Chat**: Send messages with streaming response animation
- **Slash Commands**: Autocomplete support for 9+ commands (`/task`, `/project`, `/message`, etc.)
- **File Upload**: Attach multiple files (images, videos, PDFs, documents)
- **Voice Recording**: Record audio messages with transcription support
- **Responsive Design**: Works on desktop, tablet, and mobile

### 🎨 UI/UX
- **Minimal Design**: Clean, modern interface using Tailwind CSS
- **Streaming Animation**: Character-by-character text reveal with cursor
- **Loading States**: Animated skeletons and loading indicators
- **Empty States**: Helpful placeholders when no messages exist
- **Keyboard Navigation**: Full keyboard support for autocomplete
- **Accessibility**: ARIA labels, focus management, screen reader support

## 📁 File Structure

```
apps/web/src/
├── components/chat/
│   ├── ChatUI.tsx                    # Main container component
│   ├── ChatSidebar.tsx               # Model selection sidebar
│   ├── ChatMessages.tsx              # Message list display
│   ├── ChatInput.tsx                 # Input area with toolbar
│   ├── StreamingText.tsx             # Animated text streaming
│   ├── SlashCommandAutocomplete.tsx  # Command autocomplete dropdown
│   ├── VoiceRecorder.tsx             # Audio recording button
│   ├── FileUpload.tsx                # File attachment button
│   └── index.ts                      # Exports
│
├── hooks/
│   ├── useChatModels.ts              # Fetch and manage AI models
│   ├── useChat.ts                    # Chat state and message sending
│   ├── useSlashCommands.ts           # Slash command parsing and autocomplete
│   └── index.ts                      # Exports
│
└── app/chat/
    └── page.tsx                      # Example chat page
```

## 🚀 Usage

### Basic Implementation

```tsx
import { ChatUI } from '@/components/chat';

export default function ChatPage() {
  return <ChatUI userId="user-123" apiUrl="http://localhost:3001" />;
}
```

### With Authentication

```tsx
'use client';

import { ChatUI } from '@/components/chat';
import { useAuth } from '@/hooks/useAuth';

export default function ChatPage() {
  const { user } = useAuth();

  if (!user) {
    return <div>Please log in to use chat</div>;
  }

  return <ChatUI userId={user.id} apiUrl={process.env.NEXT_PUBLIC_API_URL} />;
}
```

## 🎨 Component API

### ChatUI

Main component that orchestrates the entire chat interface.

```tsx
interface ChatUIProps {
  userId: string;      // Current user's ID
  apiUrl?: string;     // Backend API URL (default: http://localhost:3001)
}
```

### Message Interface

```tsx
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}
```

### AIModel Interface

```tsx
interface AIModel {
  id: string;
  name: string;
  company: string;
  description?: string;
}
```

## 🎯 Slash Commands

Built-in slash commands with autocomplete:

| Command | Description | Syntax |
|---------|-------------|--------|
| `/task create` | Create a new task | `/task create [title] due:[date] project:[name]` |
| `/task complete` | Complete a task | `/task complete [task-id]` |
| `/task delete` | Delete a task | `/task delete [task-id]` |
| `/project create` | Create a new project | `/project create [name] desc:[description]` |
| `/project invite` | Invite user to project | `/project invite [email] project:[name] role:[role]` |
| `/message send` | Send a direct message | `/message send [user-email] [message]` |
| `/help` | Show all commands | `/help` |
| `/clear` | Clear chat history | `/clear` |
| `/settings` | Open settings | `/settings` |

### Using Slash Commands

1. Type `/` in the input box
2. Start typing command name (e.g., `/task`)
3. Use arrow keys to navigate suggestions
4. Press Tab or Enter to autocomplete
5. Fill in command parameters

## 🎤 Voice Recording

The voice recorder:
1. Click microphone button to start recording
2. Timer shows recording duration
3. Click red stop button to finish
4. Audio is automatically uploaded to `/files/upload` endpoint
5. Displays "transcribing..." status during upload
6. Transcription result is inserted into input

**Browser Requirements:**
- Requires `getUserMedia` API support
- User must grant microphone permissions

## 📎 File Upload

Supported file types:
- Images: `image/*`
- Videos: `video/*`
- Documents: `.pdf`, `.doc`, `.docx`, `.txt`

Multiple files can be attached. Files are displayed as chips above the input box.

## 🔌 Backend Integration

### Expected API Endpoints

#### 1. Get Models
```typescript
GET /chat/models

Response:
{
  models: [
    {
      id: "gpt-4-turbo",
      name: "GPT-4 Turbo",
      company: "OpenAI",
      description: "Most capable model"
    }
  ]
}
```

#### 2. Send Message (Streaming)
```typescript
POST /chat/messages
Content-Type: application/json

Body:
{
  userId: "user-123",
  modelId: "gpt-4-turbo",
  message: "Hello, world!"
}

Response: Server-Sent Events stream
data: {"chunk": "Hello"}
data: {"chunk": " there"}
data: {"chunk": "!"}
data: {"done": true}
```

#### 3. Upload File
```typescript
POST /files/upload
Content-Type: multipart/form-data

Body:
- file: [audio/image/document file]
- type: "audio" | "image" | "document"

Response:
{
  filename: "voice-message.webm",
  url: "https://...",
  transcription?: "Transcribed text..." // For audio files
}
```

## 🎨 Styling & Customization

### Tailwind Configuration

The chat UI uses Tailwind CSS. Ensure your `tailwind.config.js` includes:

```js
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      animation: {
        'bounce': 'bounce 1s infinite',
      },
    },
  },
};
```

### Color Customization

Update colors in component files:

```tsx
// User messages
className="bg-blue-600 text-white"

// Assistant messages
className="bg-white text-gray-900 border border-gray-200"

// Selected model
className="bg-blue-50 text-blue-700 border border-blue-200"
```

## 📱 Responsive Behavior

- **Mobile**: Sidebar collapses to overlay
- **Tablet**: Sidebar visible, condensed width
- **Desktop**: Full sidebar with descriptions

Breakpoints:
- Mobile: `< 1024px` (lg)
- Desktop: `≥ 1024px`

## ⌨️ Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `/` | Start slash command |
| `↑` `↓` | Navigate autocomplete |
| `Tab` or `Enter` | Select command |
| `Esc` | Close autocomplete |
| `Enter` | Send message |
| `Shift+Enter` | New line |

## 🔧 Customization Examples

### Add Custom Models

Edit `apps/web/src/hooks/useChatModels.ts`:

```tsx
const mockModels: AIModel[] = [
  {
    id: 'custom-model',
    name: 'My Custom Model',
    company: 'MyCompany',
    description: 'A custom AI model',
  },
  // ... existing models
];
```

### Add Company Logo

Edit `apps/web/src/components/chat/ChatSidebar.tsx`:

```tsx
const companyLogos: Record<string, string> = {
  MyCompany: '🚀',
  // ... existing logos
};
```

### Add Slash Command

Edit `apps/web/src/hooks/useSlashCommands.ts`:

```tsx
const SLASH_COMMANDS: SlashCommand[] = [
  {
    command: '/mycommand',
    description: 'My custom command',
    icon: '⭐',
    syntax: '/mycommand [param]',
  },
  // ... existing commands
];
```

## 🐛 Troubleshooting

### Microphone Not Working
- Check browser permissions
- Ensure HTTPS (required for getUserMedia)
- Try different browser

### Autocomplete Not Showing
- Ensure input starts with `/`
- Check console for errors
- Verify `useSlashCommands` hook is imported

### Streaming Not Animating
- Check `isStreaming` prop is set
- Verify `StreamingText` component is used
- Adjust `speed` prop (default: 20ms)

## 🚀 Performance Tips

1. **Lazy Load Components**: Use React.lazy for better initial load
2. **Virtualize Messages**: Use react-window for long message lists
3. **Debounce Input**: Debounce autocomplete searches
4. **Optimize Images**: Compress uploaded images
5. **Cache Models**: Store models in localStorage

## 📦 Dependencies

```json
{
  "dependencies": {
    "next": "14.1.0",
    "react": "^18.2.0",
    "tailwindcss": "^3.4.1",
    "typescript": "^5.3.3"
  }
}
```

No additional packages required! Pure Next.js + Tailwind.

## 🎉 Demo

Visit `/chat` to see the component in action with mock data.

## 📄 License

MIT - Part of the Whalli monorepo project
