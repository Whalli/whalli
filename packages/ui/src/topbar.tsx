"use client";

/**
 * Topbar Component
 * Application header/topbar with mobile menu toggle
 */

import { forwardRef, HTMLAttributes, ReactNode } from 'react';
import { cn } from '@whalli/utils';
import { useSidebar } from './sidebar-context';
import { Icon, Menu } from './icon';

export interface TopbarProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
  className?: string;
}

/**
 * Topbar Component
 * 
 * Application header with mobile menu toggle
 * 
 * @example
 * ```tsx
 * <Topbar>
 *   <TopbarContent>
 *     <TopbarTitle>Dashboard</TopbarTitle>
 *     <TopbarActions>
 *       <Button>Action</Button>
 *     </TopbarActions>
 *   </TopbarContent>
 * </Topbar>
 * ```
 */
export const Topbar = forwardRef<HTMLDivElement, TopbarProps>(
  ({ children, className, ...props }, ref) => {
    const { toggle } = useSidebar();

    return (
      <header
        ref={ref}
        className={cn(
          'sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-gray-200 bg-white px-4 dark:border-gray-800 dark:bg-gray-900',
          className
        )}
        {...props}
      >
        {/* Mobile Menu Toggle */}
        <button
          onClick={toggle}
          className="rounded-md p-2 text-gray-500 hover:bg-gray-100 lg:hidden dark:hover:bg-gray-800"
          aria-label="Toggle menu"
        >
          <Icon icon={Menu} size={20} />
        </button>

        {children}
      </header>
    );
  }
);

Topbar.displayName = 'Topbar';

/**
 * Topbar Content (wrapper for flex layout)
 */
export const TopbarContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('flex flex-1 items-center justify-between', className)}
        {...props}
      />
    );
  }
);

TopbarContent.displayName = 'TopbarContent';

/**
 * Topbar Title
 */
export const TopbarTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => {
    return (
      <h1
        ref={ref}
        className={cn('text-xl font-semibold text-gray-900 dark:text-white', className)}
        {...props}
      />
    );
  }
);

TopbarTitle.displayName = 'TopbarTitle';

/**
 * Topbar Actions (right side content)
 */
export const TopbarActions = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('flex items-center gap-2', className)}
        {...props}
      />
    );
  }
);

TopbarActions.displayName = 'TopbarActions';
