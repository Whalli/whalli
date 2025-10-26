"use client";

/**
 * Sidebar Component
 * Responsive sidebar with mobile overlay
 */

import { forwardRef, HTMLAttributes, ReactNode } from 'react';
import { cn } from '@whalli/utils';
import { useSidebar } from './sidebar-context';
import { Icon, X } from './icon';

export interface SidebarProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
}

/**
 * Sidebar Component
 * 
 * Collapsible sidebar with mobile overlay support
 * 
 * @example
 * ```tsx
 * <Sidebar>
 *   <SidebarHeader>
 *     <h1>My App</h1>
 *   </SidebarHeader>
 *   <SidebarContent>
 *     <nav>...</nav>
 *   </SidebarContent>
 *   <SidebarFooter>
 *     <UserProfile />
 *   </SidebarFooter>
 * </Sidebar>
 * ```
 */
export const Sidebar = forwardRef<HTMLDivElement, SidebarProps>(
  ({ children, className, ...props }, ref) => {
    const { isOpen, close } = useSidebar();

    return (
      <>
        {/* Mobile Overlay */}
        {isOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={close}
            aria-hidden="true"
          />
        )}

        {/* Sidebar */}
        <aside
          ref={ref}
          className={cn(
            'fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-white border-r border-gray-200 transition-transform duration-300 ease-in-out dark:bg-gray-900 dark:border-gray-800',
            isOpen ? 'translate-x-0' : '-translate-x-full',
            'lg:translate-x-0 lg:static lg:z-0',
            className
          )}
          {...props}
        >
          {/* Mobile Close Button */}
          <button
            onClick={close}
            className="absolute right-4 top-4 rounded-md p-2 text-gray-500 hover:bg-gray-100 lg:hidden dark:hover:bg-gray-800"
            aria-label="Close sidebar"
          >
            <Icon icon={X} size={20} />
          </button>

          {children}
        </aside>
      </>
    );
  }
);

Sidebar.displayName = 'Sidebar';

/**
 * Sidebar Header
 */
export const SidebarHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('flex h-16 items-center border-b border-gray-200 px-6 dark:border-gray-800', className)}
        {...props}
      />
    );
  }
);

SidebarHeader.displayName = 'SidebarHeader';

/**
 * Sidebar Content (scrollable area)
 */
export const SidebarContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('flex-1 overflow-y-auto overflow-x-hidden py-4', className)}
        {...props}
      />
    );
  }
);

SidebarContent.displayName = 'SidebarContent';

/**
 * Sidebar Footer
 */
export const SidebarFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('border-t border-gray-200 px-6 py-4 dark:border-gray-800', className)}
        {...props}
      />
    );
  }
);

SidebarFooter.displayName = 'SidebarFooter';

/**
 * Sidebar Nav (navigation list container)
 */
export const SidebarNav = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return (
      <nav
        ref={ref}
        className={cn('space-y-1 px-3', className)}
        {...props}
      />
    );
  }
);

SidebarNav.displayName = 'SidebarNav';

/**
 * Sidebar Nav Item
 */
export interface SidebarNavItemProps extends HTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  disabled?: boolean;
}

export const SidebarNavItem = forwardRef<HTMLButtonElement, SidebarNavItemProps>(
  ({ className, active, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled}
        className={cn(
          'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
          'hover:bg-gray-100 dark:hover:bg-gray-800',
          active && 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-white',
          !active && 'text-gray-600 dark:text-gray-400',
          disabled && 'cursor-not-allowed opacity-50',
          className
        )}
        {...props}
      />
    );
  }
);

SidebarNavItem.displayName = 'SidebarNavItem';
