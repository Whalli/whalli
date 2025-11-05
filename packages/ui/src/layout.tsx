"use client";

/**
 * Layout Shell
 * Main application layout wrapper with sidebar support
 */

import { forwardRef, HTMLAttributes, ReactNode } from 'react';
import { cn } from '@whalli/utils';

export interface LayoutShellProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** Primary sidebar (left) - always visible on desktop, collapsible on mobile */
  primarySidebar: ReactNode;
  /** Main content area */
  children: ReactNode;
  /** Context sidebar (right) - optional, collapsible */
  contextSidebar?: ReactNode;
  /** Whether to show the context sidebar */
  showContextSidebar?: boolean;
  className?: string;
}

/**
 * Layout Shell Component
 * 
 * Main application layout with three-column structure:
 * - Primary Sidebar (left, fixed width, responsive)
 * - Main Content (center, flexible)
 * - Context Sidebar (right, collapsible, optional)
 * 
 * @example
 * ```tsx
 * <LayoutShell
 *   primarySidebar={<PrimarySidebar />}
 *   contextSidebar={<ContextSidebar />}
 *   showContextSidebar={true}
 * >
 *   <main>Content here</main>
 * </LayoutShell>
 * ```
 */
export const LayoutShell = forwardRef<HTMLDivElement, LayoutShellProps>(
  ({ primarySidebar, children, contextSidebar, showContextSidebar = false, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'flex h-screen w-full overflow-hidden',
          'bg-white dark:bg-gray-950',
          'text-gray-900 dark:text-gray-100',
          className
        )}
        {...props}
      >
        {/* Primary Sidebar - Left */}
        <aside
          className={cn(
            'flex-shrink-0 w-64 border-r',
            'border-gray-200 dark:border-gray-800',
            'bg-white dark:bg-gray-950',
            'transition-all duration-300 ease-in-out',
            'hidden lg:block'
          )}
        >
          {primarySidebar}
        </aside>

        {/* Main Content - Center */}
        <main className="flex-1 overflow-hidden">
          {children}
        </main>

        {/* Context Sidebar - Right */}
        {contextSidebar && (
          <aside
            className={cn(
              'flex-shrink-0 w-80 border-l',
              'border-gray-200 dark:border-gray-800',
              'bg-white dark:bg-gray-950',
              'transition-all duration-300 ease-in-out',
              'hidden xl:block',
              showContextSidebar ? 'translate-x-0' : 'translate-x-full xl:hidden'
            )}
          >
            {contextSidebar}
          </aside>
        )}
      </div>
    );
  }
);

LayoutShell.displayName = 'LayoutShell';

/**
 * Layout Main (main content area, right of sidebar)
 */
export const LayoutMain = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('flex flex-1 flex-col overflow-hidden', className)}
        {...props}
      />
    );
  }
);

LayoutMain.displayName = 'LayoutMain';

/**
 * Layout Content (scrollable content area)
 */
export const LayoutContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('flex-1 overflow-y-auto overflow-x-hidden', className)}
        {...props}
      />
    );
  }
);

LayoutContent.displayName = 'LayoutContent';

/**
 * Layout Container (max-width container for content)
 */
export const LayoutContainer = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8', className)}
        {...props}
      />
    );
  }
);

LayoutContainer.displayName = 'LayoutContainer';
