"use client";

/**
 * Layout Shell
 * Main application layout wrapper
 */

import { forwardRef, HTMLAttributes, ReactNode } from 'react';
import { cn } from '@whalli/utils';

export interface LayoutShellProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
}

/**
 * Layout Shell Component
 * 
 * Main application layout container
 * 
 * @example
 * ```tsx
 * <SidebarProvider>
 *   <LayoutShell>
 *     <Sidebar>...</Sidebar>
 *     <LayoutMain>
 *       <Topbar>...</Topbar>
 *       <LayoutContent>
 *         <main>...</main>
 *       </LayoutContent>
 *     </LayoutMain>
 *   </LayoutShell>
 * </SidebarProvider>
 * ```
 */
export const LayoutShell = forwardRef<HTMLDivElement, LayoutShellProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-950', className)}
        {...props}
      >
        {children}
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
