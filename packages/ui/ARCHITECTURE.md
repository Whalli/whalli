# UI Component Architecture Guide

## 🏗️ Architecture Overview

The `@whalli/ui` package follows a headless-first, accessible design pattern with these principles:

### Core Principles

1. **Headless-First**: Logic separated from presentation
2. **Composable**: Small, focused components that work together
3. **Accessible**: WCAG 2.1 AAA compliant
4. **Responsive**: Mobile-first, works on all devices
5. **Type-Safe**: Full TypeScript support
6. **No Side Effects**: Pure props and callbacks

## 📐 Component Hierarchy

```
App (SidebarProvider)
└── LayoutShell
    ├── Sidebar
    │   ├── SidebarHeader
    │   ├── SidebarContent
    │   │   └── SidebarNav
    │   │       └── SidebarNavItem (repeatable)
    │   └── SidebarFooter
    └── LayoutMain
        ├── Topbar
        │   └── TopbarContent
        │       ├── TopbarTitle
        │       └── TopbarActions
        └── LayoutContent
            └── LayoutContainer
                └── Your Content
```

## 🎯 Component Patterns

### Pattern 1: Layout Setup

**Purpose**: Establish application shell with sidebar and topbar

```tsx
<SidebarProvider defaultOpen={true}>
  <LayoutShell>
    <Sidebar>
      <SidebarHeader>Logo/Brand</SidebarHeader>
      <SidebarContent>Navigation</SidebarContent>
      <SidebarFooter>User Info</SidebarFooter>
    </Sidebar>
    <LayoutMain>
      <Topbar>Page Title + Actions</Topbar>
      <LayoutContent>Page Content</LayoutContent>
    </LayoutMain>
  </LayoutShell>
</SidebarProvider>
```

**Responsibilities**:
- SidebarProvider: Manages sidebar open/close state
- LayoutShell: Contains entire application
- Sidebar: Navigation panel (collapsible on mobile)
- LayoutMain: Main content area
- Topbar: Page header with mobile menu toggle
- LayoutContent: Scrollable content area

### Pattern 2: Form Dialog

**Purpose**: Collect user input in a modal

```tsx
<Modal open={isOpen} onClose={handleClose}>
  <ModalHeader>
    <ModalTitle>Form Title</ModalTitle>
  </ModalHeader>
  <ModalContent>
    <Input label="Name" />
    <Textarea label="Description" autoResize />
  </ModalContent>
  <ModalFooter>
    <Button variant="outline" onClick={handleClose}>Cancel</Button>
    <Button onClick={handleSubmit} loading={submitting}>Submit</Button>
  </ModalFooter>
</Modal>
```

**Responsibilities**:
- Modal: Manages overlay, escape key, focus trap
- Form controls: Validation and input handling
- Parent component: Business logic and API calls

### Pattern 3: Data Display

**Purpose**: Show content in cards with actions

```tsx
<div className="grid grid-cols-3 gap-4">
  {items.map(item => (
    <Card key={item.id}>
      <CardHeader>
        <CardTitle>{item.title}</CardTitle>
        <CardDescription>{item.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <p>{item.content}</p>
      </CardContent>
      <CardFooter>
        <Button size="sm" onClick={() => handleEdit(item.id)}>Edit</Button>
        <Button size="sm" variant="outline" onClick={() => handleDelete(item.id)}>
          Delete
        </Button>
      </CardFooter>
    </Card>
  ))}
</div>
```

## 🎨 Styling Strategy

### Tailwind-First

All components use Tailwind utility classes:

```tsx
// Good: Compose with Tailwind
<Button className="w-full justify-start">
  Click Me
</Button>

// Avoid: Inline styles
<Button style={{ width: '100%' }}>
  Click Me
</Button>
```

### Dark Mode Support

All components support dark mode via `dark:` prefix:

```tsx
className="bg-white text-gray-900 dark:bg-gray-900 dark:text-white"
```

### Custom Styling

Extend components with `className` prop:

```tsx
// Base button
<Button>Click</Button>

// Custom styled button
<Button className="bg-gradient-to-r from-blue-500 to-purple-500">
  Gradient Button
</Button>
```

## ♿ Accessibility Implementation

### Keyboard Navigation

All interactive components support keyboard:

- **Tab**: Navigate between elements
- **Enter/Space**: Activate buttons/links
- **Escape**: Close modals/dropdowns
- **Arrow Keys**: Navigate lists/menus

### ARIA Attributes

Components include proper ARIA:

```tsx
// Modal
<div role="dialog" aria-modal="true">
  <h2 id="modal-title">Title</h2>
  <div aria-labelledby="modal-title">Content</div>
</div>

// Button
<button aria-label="Close" aria-pressed="false">
  <X />
</button>

// Input with error
<input aria-invalid="true" aria-describedby="input-error" />
<p id="input-error">Error message</p>
```

### Focus Management

- Visible focus rings on all interactive elements
- Focus trapping in modals
- Focus restoration when closing modals
- Skip navigation links for screen readers

### Screen Reader Support

- Semantic HTML (`<header>`, `<nav>`, `<main>`, `<button>`)
- Meaningful alt text for icons
- Descriptive labels for form inputs
- Status announcements for dynamic content

## 📱 Responsive Design

### Mobile-First Approach

Components are designed for mobile first, then enhanced:

```tsx
// Sidebar: Hidden on mobile, visible on desktop
className="hidden lg:block"

// Responsive grid
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3"

// Responsive text
className="text-sm md:text-base lg:text-lg"
```

### Breakpoint Strategy

- **< 640px**: Mobile (single column)
- **640px - 768px**: Tablet (2 columns)
- **768px - 1024px**: Small desktop (2-3 columns)
- **> 1024px**: Desktop (sidebar visible, 3-4 columns)

### Touch Targets

All interactive elements meet minimum 44x44px touch target:

```tsx
// Button minimum height
className="h-10 px-4"  // 40px + padding

// Icon button
className="h-10 w-10"  // 40px x 40px
```

## 🔧 State Management

### Local State (within component)

```tsx
function MyForm() {
  const [value, setValue] = useState('');
  // Component manages its own state
}
```

### Context State (shared across components)

```tsx
// Sidebar state shared across app
<SidebarProvider>
  {/* All children can access sidebar state */}
  <MyComponent />
</SidebarProvider>

function MyComponent() {
  const { isOpen, toggle } = useSidebar();
  // Access shared state via hook
}
```

### App State (business logic)

```tsx
// Parent component manages business logic
function App() {
  const [chats, setChats] = useState([]);
  
  const handleCreateChat = async (data) => {
    // API call and state update
    const newChat = await api.createChat(data);
    setChats([...chats, newChat]);
  };
  
  return <ChatList chats={chats} onCreate={handleCreateChat} />;
}
```

## 🎭 Component Composition

### Building Complex UIs

Compose small components into larger features:

```tsx
// Chat Message Component (composed)
function ChatMessage({ message, onEdit, onDelete }) {
  return (
    <Card>
      <CardContent>
        <p>{message.content}</p>
      </CardContent>
      <CardFooter>
        <Tooltip content="Edit message">
          <Button size="sm" variant="ghost" onClick={onEdit}>
            <Icon icon={Edit2} />
          </Button>
        </Tooltip>
        <Tooltip content="Delete message">
          <Button size="sm" variant="ghost" onClick={onDelete}>
            <Icon icon={Trash2} />
          </Button>
        </Tooltip>
      </CardFooter>
    </Card>
  );
}

// Chat Interface (composed)
function ChatInterface() {
  return (
    <LayoutContent>
      <div className="space-y-4">
        {messages.map(msg => (
          <ChatMessage
            key={msg.id}
            message={msg}
            onEdit={() => handleEdit(msg.id)}
            onDelete={() => handleDelete(msg.id)}
          />
        ))}
      </div>
      <ChatInput onSend={handleSend} />
    </LayoutContent>
  );
}
```

## 🚀 Performance Optimization

### Code Splitting

Import components only when needed:

```tsx
// Lazy load modal
const Modal = lazy(() => import('@whalli/ui').then(m => ({ default: m.Modal })));

// Use with Suspense
<Suspense fallback={<Loader />}>
  <Modal open={isOpen}>...</Modal>
</Suspense>
```

### Memoization

Prevent unnecessary re-renders:

```tsx
// Memoize expensive components
const MemoizedCard = memo(Card);

// Memoize callbacks
const handleClick = useCallback(() => {
  // expensive operation
}, [dependencies]);
```

### Portal Optimization

Modals and tooltips use portals for better performance:

```tsx
// Modal renders outside main DOM tree
createPortal(<ModalContent />, document.body)
```

## 📊 Testing Strategy

### Component Testing

Test components in isolation:

```tsx
import { render, screen } from '@testing-library/react';
import { Button } from '@whalli/ui';

test('button renders with text', () => {
  render(<Button>Click me</Button>);
  expect(screen.getByText('Click me')).toBeInTheDocument();
});

test('button calls onClick', () => {
  const handleClick = jest.fn();
  render(<Button onClick={handleClick}>Click</Button>);
  screen.getByText('Click').click();
  expect(handleClick).toHaveBeenCalled();
});
```

### Accessibility Testing

Use jest-axe for a11y testing:

```tsx
import { axe } from 'jest-axe';

test('modal has no accessibility violations', async () => {
  const { container } = render(
    <Modal open onClose={() => {}}>
      <ModalContent>Content</ModalContent>
    </Modal>
  );
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

## 🎯 Best Practices Checklist

### When Creating Components

- ✅ Use `forwardRef` for ref forwarding
- ✅ Export TypeScript types
- ✅ Add JSDoc comments
- ✅ Include `displayName` for dev tools
- ✅ Support `className` prop
- ✅ Add proper ARIA attributes
- ✅ Test keyboard navigation
- ✅ Support dark mode
- ✅ Make responsive
- ✅ Document in README

### When Using Components

- ✅ Wrap layout in `SidebarProvider`
- ✅ Pass callbacks, not business logic
- ✅ Use semantic HTML inside components
- ✅ Provide meaningful labels
- ✅ Test on mobile devices
- ✅ Check accessibility with screen reader
- ✅ Validate color contrast
- ✅ Test keyboard navigation

## 🔗 Resources

- [Tailwind CSS Docs](https://tailwindcss.com)
- [Lucide Icons](https://lucide.dev)
- [WCAG Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [React Accessibility](https://react.dev/learn/accessibility)
- [Headless UI](https://headlessui.com)
