# @whalli/ui Package Summary

## 📦 Package Information
- **Name**: `@whalli/ui`
- **Version**: 0.0.0
- **Type**: React UI component library
- **Dependencies**: `react`, `react-dom`, `lucide-react`, `@whalli/utils`

## 📁 Component Structure

```
packages/ui/src/
├── layout.tsx           # LayoutShell, LayoutMain, LayoutContent, LayoutContainer
├── sidebar-context.tsx  # SidebarProvider, useSidebar
├── sidebar.tsx          # Sidebar components
├── topbar.tsx           # Topbar components
├── button.tsx           # Button component
├── input.tsx            # Input component
├── textarea.tsx         # Textarea component
├── card.tsx             # Card components
├── modal.tsx            # Modal components
├── tooltip.tsx          # Tooltip components
├── icon.tsx             # Icon wrapper + exports
└── index.tsx            # Main exports
```

## 🎯 Component Categories

### 🏗️ Layout (8 components)
1. **LayoutShell** - Main container, flex h-screen
2. **LayoutMain** - Right side of sidebar
3. **LayoutContent** - Scrollable area
4. **LayoutContainer** - Max-width wrapper
5. **Sidebar** - Collapsible sidebar with mobile overlay
6. **SidebarHeader/Content/Footer** - Sidebar sections
7. **SidebarNav/NavItem** - Navigation components
8. **Topbar** - Header with mobile menu toggle

### 📝 Forms (3 components)
1. **Button** - 4 variants, 3 sizes, loading state
2. **Input** - Text input with error states
3. **Textarea** - Auto-resize support, max height

### 🎨 UI (3 components)
1. **Card** - 6 sub-components (Header, Title, etc.)
2. **Modal** - Portal-based, overlay, escape key
3. **Tooltip** - Auto-positioning, portal-based

### 🎭 Context (1 provider)
1. **SidebarProvider** - State management for sidebar

### 🎯 Icons (30+ icons)
- Wrapper component + Lucide icons
- Menu, X, Search, Settings, User, LogOut, Plus, etc.

## 📊 Component Stats

Total Components: **15 main components**
- Layout: 8
- Forms: 3
- UI: 3
- Context: 1

Sub-components: **20+** (Card parts, Modal parts, etc.)
Icons exported: **30+** from Lucide

## 🎨 Design System

### Colors (via Tailwind)
- Primary: Blue (buttons, links)
- Secondary: Gray (backgrounds, borders)
- Success: Green
- Error: Red
- Warning: Yellow

### Sizes
**Buttons**: sm (h-8), md (h-10), lg (h-12)
**Text**: sm (14px), base (16px), lg (18px), xl (20px)
**Spacing**: 4px increments (p-1 to p-8)

### Border Radius
- Small: rounded-md (6px)
- Medium: rounded-lg (8px)
- Large: rounded-xl (12px)

### Shadows
- sm: Small shadow
- md: Medium shadow
- lg: Large shadow
- xl: Extra large shadow

## ♿ Accessibility Features

✅ **Keyboard Navigation**
- Tab navigation
- Enter/Space for buttons
- Escape to close modals
- Arrow keys in lists

✅ **ARIA Attributes**
- `aria-label`, `aria-describedby`
- `aria-invalid` for errors
- `role="dialog"` for modals
- `role="tooltip"` for tooltips

✅ **Focus Management**
- Visible focus rings
- Focus trapping in modals
- Focus restoration

✅ **Screen Reader Support**
- Semantic HTML
- Proper heading hierarchy
- Alt text for icons

## 📱 Responsive Design

### Breakpoints
- **sm**: 640px
- **md**: 768px
- **lg**: 1024px
- **xl**: 1280px

### Mobile Features
- Sidebar collapses on mobile (< lg)
- Overlay on mobile when sidebar open
- Mobile menu toggle in Topbar
- Touch-friendly targets (min 44px)

## 🌙 Dark Mode

All components support dark mode via Tailwind:
```tsx
className="bg-white dark:bg-gray-900"
```

## 🎭 Component Props

### Button
```typescript
variant: 'primary' | 'secondary' | 'outline' | 'ghost'
size: 'sm' | 'md' | 'lg'
loading?: boolean
disabled?: boolean
```

### Modal
```typescript
open: boolean
onClose: () => void
size: 'sm' | 'md' | 'lg' | 'xl' | 'full'
closeOnOverlayClick?: boolean
closeOnEscape?: boolean
showCloseButton?: boolean
```

### Textarea
```typescript
autoResize?: boolean
maxHeight?: number
error?: string
```

### Tooltip
```typescript
content: ReactNode
side: 'top' | 'bottom' | 'left' | 'right'
align: 'start' | 'center' | 'end'
delayDuration?: number
```

## 🚀 Usage Patterns

### Pattern 1: Complete Layout
```tsx
<SidebarProvider>
  <LayoutShell>
    <Sidebar>...</Sidebar>
    <LayoutMain>
      <Topbar>...</Topbar>
      <LayoutContent>...</LayoutContent>
    </LayoutMain>
  </LayoutShell>
</SidebarProvider>
```

### Pattern 2: Modal Form
```tsx
<Modal open={isOpen} onClose={close}>
  <ModalHeader><ModalTitle>...</ModalTitle></ModalHeader>
  <ModalContent><Input /><Textarea /></ModalContent>
  <ModalFooter><Button /></ModalFooter>
</Modal>
```

### Pattern 3: Card Grid
```tsx
<div className="grid grid-cols-3 gap-4">
  {items.map(item => (
    <Card>
      <CardHeader>...</CardHeader>
      <CardContent>...</CardContent>
      <CardFooter>...</CardFooter>
    </Card>
  ))}
</div>
```

## 🎯 Best Practices

1. **Always wrap with SidebarProvider** when using Sidebar/Topbar
2. **Use semantic HTML** inside components
3. **Pass callbacks** for interactions
4. **Customize with className** prop
5. **Use TypeScript** for type safety
6. **Follow accessibility guidelines**
7. **Test on mobile** devices

## 🚫 Anti-Patterns

❌ Don't put API calls in components
❌ Don't manage global state in UI
❌ Don't bypass accessibility features
❌ Don't override core styles without reason
❌ Don't use inline styles (use Tailwind)

## 📦 Bundle Size

Approximate sizes (gzipped):
- Core components: ~15 KB
- Icons (lucide-react): ~30 KB
- Tailwind (if not tree-shaken): ~50 KB

**Total**: ~95 KB (before tree shaking)
**After tree shaking**: ~20-30 KB (typical)

## 🔄 Adding Components

### New Component Checklist
1. Create `src/component-name.tsx`
2. Add proper TypeScript types
3. Include JSDoc comments
4. Add accessibility attributes
5. Support dark mode
6. Make it responsive
7. Export from `src/index.tsx`
8. Add examples to EXAMPLES.tsx
9. Update README

### Component Template
```tsx
import { forwardRef, HTMLAttributes } from 'react';
import { cn } from '@whalli/utils';

export interface MyComponentProps extends HTMLAttributes<HTMLDivElement> {
  // custom props
}

export const MyComponent = forwardRef<HTMLDivElement, MyComponentProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('base-styles', className)}
        {...props}
      />
    );
  }
);

MyComponent.displayName = 'MyComponent';
```

## 🔗 Dependencies

**Production**:
- `react` ^18.2.0
- `react-dom` ^18.2.0
- `lucide-react` ^0.321.0
- `@whalli/utils` workspace:*

**Development**:
- `typescript` ^5.3.3
- `tailwindcss` ^3.4.1

## 📚 Related Documentation

- [README.md](./README.md) - Full documentation
- [EXAMPLES.tsx](./EXAMPLES.tsx) - Code examples
- [Tailwind CSS](https://tailwindcss.com)
- [Lucide Icons](https://lucide.dev)
