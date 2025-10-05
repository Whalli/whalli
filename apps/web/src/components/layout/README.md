# Layout Components

## Overview

This directory contains the main layout components for the Whalli web application, implementing the "Deep Ocean" theme with a distinctive deep blue color scheme.

## Components

### Sidebar

**File**: `sidebar.tsx`

The main navigation sidebar with the following features:
- Deep blue background (#040069)
- Logo with Zain font
- Navigation links (Chat, Tasks, Projects)
- User avatar with online indicator
- Mobile collapse with overlay
- Active state detection
- Smooth animations

**Props**:
```typescript
interface SidebarProps {
  user?: {
    name: string;
    email: string;
    avatar?: string;
  };
}
```

**Usage**:
```tsx
import { Sidebar } from '@/components/layout';

<Sidebar user={{ name: 'John Doe', email: 'john@example.com' }} />
```

### MainLayout

**File**: `main-layout.tsx`

Responsive layout wrapper that combines the sidebar with the main content area.

**Props**:
```typescript
interface MainLayoutProps {
  children: ReactNode;
  user?: {
    name: string;
    email: string;
    avatar?: string;
  };
}
```

**Usage**:
```tsx
import { MainLayout } from '@/components/layout';

export default function MyPage() {
  return (
    <MainLayout user={{ name: 'John Doe', email: 'john@example.com' }}>
      <h1>My Page Content</h1>
      {/* Your content here */}
    </MainLayout>
  );
}
```

## Styling

### Colors

- `bg-sidebar` - Deep blue (#040069)
- `bg-sidebar-hover` - Lighter blue on hover
- `bg-sidebar-active` - Active navigation item
- `bg-sidebar-foreground` - White text

### Animations

- `animate-fade-in` - Overlay fade-in
- `animate-slide-in-left` - Sidebar slide-in on mobile

### Responsive Behavior

- **Mobile (< 1024px)**: Sidebar hidden by default, slides in with menu button
- **Desktop (≥ 1024px)**: Sidebar always visible, fixed at 256px width

## File Structure

```
layout/
├── sidebar.tsx          # Main navigation sidebar
├── main-layout.tsx      # Layout wrapper component
├── index.ts             # Export barrel
└── README.md            # This file
```

## Dependencies

- `lucide-react` - Icons
- `next/link` - Navigation
- `next/navigation` - Active route detection
- `@/lib/utils` - Class name utilities

## Best Practices

1. **Always provide user prop** to display user information
2. **Use MainLayout for pages** to ensure consistent layout
3. **Sidebar is responsive** by default, no extra configuration needed
4. **Active links** are detected automatically via pathname
5. **Mobile overlay** closes automatically on navigation

## Related Documentation

- [UI Refactor Guide](../../UI_REFACTOR.md) - Complete refactor documentation
- [UI Refactor Summary](../../UI_REFACTOR_SUMMARY.md) - Quick reference
