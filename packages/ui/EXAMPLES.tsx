/**
 * Complete UI Package Examples
 * Demonstrates all @whalli/ui components
 */

import {
  // Layout
  SidebarProvider,
  useSidebar,
  LayoutShell,
  LayoutMain,
  LayoutContent,
  LayoutContainer,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarNav,
  SidebarNavItem,
  Topbar,
  TopbarContent,
  TopbarTitle,
  TopbarActions,
  
  // Form Components
  Button,
  Input,
  Textarea,
  
  // UI Components
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Modal,
  ModalHeader,
  ModalTitle,
  ModalContent,
  ModalFooter,
  Tooltip,
  SimpleTooltip,
  
  // Icons
  Icon,
  MessageSquare,
  Settings,
  User,
  LogOut,
  Plus,
  Search,
  Moon,
  Send,
  Trash2,
  Edit2,
} from '@whalli/ui';

import { useState } from 'react';

// ============================================================================
// 1. Complete Layout Example
// ============================================================================

export function CompleteLayoutExample() {
  const [modalOpen, setModalOpen] = useState(false);
  
  return (
    <SidebarProvider defaultOpen={true}>
      <LayoutShell>
        {/* Sidebar */}
        <Sidebar>
          <SidebarHeader>
            <div className="flex items-center gap-2">
              <Icon icon={MessageSquare} size={24} className="text-blue-500" />
              <h1 className="text-xl font-bold">Whalli</h1>
            </div>
          </SidebarHeader>
          
          <SidebarContent>
            <SidebarNav>
              <SidebarNavItem active>
                <Icon icon={MessageSquare} size={20} />
                Chats
              </SidebarNavItem>
              <SidebarNavItem>
                <Icon icon={Settings} size={20} />
                Settings
              </SidebarNavItem>
              <SidebarNavItem>
                <Icon icon={User} size={20} />
                Profile
              </SidebarNavItem>
            </SidebarNav>
          </SidebarContent>
          
          <SidebarFooter>
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-blue-500" />
              <div className="flex-1">
                <p className="text-sm font-medium">John Doe</p>
                <p className="text-xs text-gray-500">john@example.com</p>
              </div>
              <Button variant="ghost" size="sm">
                <Icon icon={LogOut} size={16} />
              </Button>
            </div>
          </SidebarFooter>
        </Sidebar>

        {/* Main Content */}
        <LayoutMain>
          <Topbar>
            <TopbarContent>
              <TopbarTitle>Dashboard</TopbarTitle>
              <TopbarActions>
                <Tooltip content="New chat">
                  <Button onClick={() => setModalOpen(true)}>
                    <Icon icon={Plus} size={16} />
                    New Chat
                  </Button>
                </Tooltip>
                <Button variant="ghost" size="sm">
                  <Icon icon={Moon} size={20} />
                </Button>
              </TopbarActions>
            </TopbarContent>
          </Topbar>

          <LayoutContent>
            <LayoutContainer>
              <h2 className="text-2xl font-bold mb-6">Welcome to Whalli!</h2>
              <CardsExample />
            </LayoutContainer>
          </LayoutContent>
        </LayoutMain>
      </LayoutShell>

      {/* Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
        <ModalHeader>
          <ModalTitle>Create New Chat</ModalTitle>
        </ModalHeader>
        <ModalContent>
          <NewChatForm onClose={() => setModalOpen(false)} />
        </ModalContent>
      </Modal>
    </SidebarProvider>
  );
}

// ============================================================================
// 2. Cards Example
// ============================================================================

function CardsExample() {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle>Recent Chats</CardTitle>
          <CardDescription>Your most recent conversations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center gap-2 rounded p-2 hover:bg-gray-50">
              <Icon icon={MessageSquare} size={16} />
              <span className="text-sm">Chat about AI</span>
            </div>
            <div className="flex items-center gap-2 rounded p-2 hover:bg-gray-50">
              <Icon icon={MessageSquare} size={16} />
              <span className="text-sm">Help with code</span>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button variant="outline" size="sm">View All</Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Button variant="outline" className="w-full justify-start">
              <Icon icon={Plus} size={16} />
              New Chat
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Icon icon={Search} size={16} />
              Search Chats
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================================
// 3. Form Example
// ============================================================================

function NewChatForm({ onClose }: { onClose: () => void }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setLoading(false);
    onClose();
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium">
          Chat Title
        </label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter chat title"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">
          Description
        </label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Enter description..."
          autoResize
          maxHeight={150}
        />
      </div>

      <ModalFooter>
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} loading={loading}>
          Create Chat
        </Button>
      </ModalFooter>
    </div>
  );
}

// ============================================================================
// 4. Chat Interface Example
// ============================================================================

export function ChatInterfaceExample() {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([
    { id: '1', role: 'user', content: 'Hello!' },
    { id: '2', role: 'assistant', content: 'Hi! How can I help you today?' },
  ]);

  const handleSend = () => {
    if (!message.trim()) return;
    
    setMessages([...messages, {
      id: Date.now().toString(),
      role: 'user',
      content: message,
    }]);
    setMessage('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex h-screen flex-col">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                'flex gap-3',
                msg.role === 'user' && 'justify-end'
              )}
            >
              <Card className={cn(
                'max-w-[80%]',
                msg.role === 'user' && 'bg-blue-500 text-white'
              )}>
                <CardContent className="p-3">
                  <p className="text-sm">{msg.content}</p>
                </CardContent>
                <CardFooter className="p-2 pt-0">
                  <div className="flex gap-1">
                    <Tooltip content="Edit">
                      <Button variant="ghost" size="sm">
                        <Icon icon={Edit2} size={14} />
                      </Button>
                    </Tooltip>
                    <Tooltip content="Delete">
                      <Button variant="ghost" size="sm">
                        <Icon icon={Trash2} size={14} />
                      </Button>
                    </Tooltip>
                  </div>
                </CardFooter>
              </Card>
            </div>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="border-t p-4">
        <div className="flex gap-2">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message... (Shift+Enter for new line)"
            autoResize
            maxHeight={150}
            className="flex-1"
          />
          <Button onClick={handleSend}>
            <Icon icon={Send} size={20} />
          </Button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 5. Button Variants Example
// ============================================================================

export function ButtonVariantsExample() {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h3 className="mb-3 text-lg font-semibold">Variants</h3>
        <div className="flex gap-2">
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-lg font-semibold">Sizes</h3>
        <div className="flex items-end gap-2">
          <Button size="sm">Small</Button>
          <Button size="md">Medium</Button>
          <Button size="lg">Large</Button>
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-lg font-semibold">States</h3>
        <div className="flex gap-2">
          <Button loading>Loading</Button>
          <Button disabled>Disabled</Button>
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-lg font-semibold">With Icons</h3>
        <div className="flex gap-2">
          <Button>
            <Icon icon={Plus} size={16} />
            New
          </Button>
          <Button variant="outline">
            <Icon icon={Search} size={16} />
            Search
          </Button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 6. Tooltips Example
// ============================================================================

export function TooltipsExample() {
  return (
    <div className="flex gap-4 p-6">
      <Tooltip content="Top tooltip" side="top">
        <Button>Top</Button>
      </Tooltip>
      
      <Tooltip content="Bottom tooltip" side="bottom">
        <Button>Bottom</Button>
      </Tooltip>
      
      <Tooltip content="Left tooltip" side="left">
        <Button>Left</Button>
      </Tooltip>
      
      <Tooltip content="Right tooltip" side="right">
        <Button>Right</Button>
      </Tooltip>

      <SimpleTooltip content="Simple tooltip">
        <Button variant="outline">Simple</Button>
      </SimpleTooltip>
    </div>
  );
}

// ============================================================================
// 7. Sidebar Toggle Example
// ============================================================================

function SidebarToggleExample() {
  const { isOpen, toggle } = useSidebar();
  
  return (
    <div className="p-6">
      <p className="mb-4">Sidebar is {isOpen ? 'open' : 'closed'}</p>
      <Button onClick={toggle}>
        {isOpen ? 'Close' : 'Open'} Sidebar
      </Button>
    </div>
  );
}

export {};
