"use client";

/**
 * Sidebar Context
 * Manages sidebar open/close state across the application
 */

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface SidebarContextValue {
  isOpen: boolean;
  toggle: () => void;
  open: () => void;
  close: () => void;
}

const SidebarContext = createContext<SidebarContextValue | undefined>(undefined);

export interface SidebarProviderProps {
  children: ReactNode;
  defaultOpen?: boolean;
}

/**
 * Sidebar Provider
 * 
 * Provides sidebar state to all child components
 * 
 * @example
 * ```tsx
 * <SidebarProvider defaultOpen={true}>
 *   <LayoutShell>
 *     <Sidebar>...</Sidebar>
 *     <div>Content</div>
 *   </LayoutShell>
 * </SidebarProvider>
 * ```
 */
export function SidebarProvider({ children, defaultOpen = true }: SidebarProviderProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const toggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const open = useCallback(() => {
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  return (
    <SidebarContext.Provider value={{ isOpen, toggle, open, close }}>
      {children}
    </SidebarContext.Provider>
  );
}

/**
 * Use Sidebar Hook
 * 
 * Access sidebar state and controls
 * 
 * @example
 * ```tsx
 * const { isOpen, toggle } = useSidebar();
 * ```
 */
export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
}
