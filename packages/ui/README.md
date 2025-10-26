# @whalli/ui

Tailwind-ready React UI components for the Whalli monorepo. Accessible, responsive, and headless-first design.

## 📦 Components

### Layout Components
- **LayoutShell** - Main application layout wrapper
- **LayoutMain** - Main content area (right of sidebar)
- **LayoutContent** - Scrollable content area
- **LayoutContainer** - Max-width container
- **Sidebar** - Collapsible sidebar with mobile support
- **Topbar** - Application header with mobile menu

### Form Components
- **Button** - Accessible button with variants
- **Input** - Text input with error states
- **Textarea** - Multi-line input with auto-resize

### UI Components
- **Card** - Content container with header/footer
- **Modal** - Accessible dialog with overlay
- **Tooltip** - Accessible tooltip with positioning
- **Icon** - Lucide icon wrapper

### Context
- **SidebarProvider** - Sidebar state management
- **useSidebar** - Hook to access sidebar state

## 🚀 Quick Start

```tsx
import {
  SidebarProvider,
  LayoutShell,
  Sidebar,
  Topbar,
  Button,
} from '@whalli/ui';

function App() {
  return (
    <SidebarProvider>
      <LayoutShell>
        <Sidebar>...</Sidebar>
        <div>
          <Topbar>...</Topbar>
          <main>Content</main>
        </div>
      </LayoutShell>
    </SidebarProvider>
  );
}
```

## 📚 Documentation

See the full documentation in the README for:
- Complete layout examples
- Component API reference
- Accessibility features
- Best practices

## 🎨 Features

✅ **Accessible** - WCAG 2.1 compliant
✅ **Responsive** - Mobile-first design
✅ **Dark Mode** - Full dark mode support
✅ **Type-Safe** - Full TypeScript support
✅ **Composable** - Mix and match components
✅ **No Side Effects** - Props and callbacks only

## 🔗 Related

- `@whalli/utils` - Shared utilities
- `@whalli/prisma` - Database (backend only)
