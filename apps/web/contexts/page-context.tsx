'use client';

/**
 * Page Context
 * 
 * Provides context for page-specific widgets in the ContextSidebar.
 * Pages can inject widgets that will be displayed in the right sidebar.
 */

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface PageWidget {
  id: string;
  title: string;
  content: ReactNode;
}

interface PageContextType {
  widgets: PageWidget[];
  setWidgets: (widgets: PageWidget[]) => void;
  addWidget: (widget: PageWidget) => void;
  removeWidget: (id: string) => void;
  clearWidgets: () => void;
}

const PageContext = createContext<PageContextType | undefined>(undefined);

export function PageContextProvider({ children }: { children: ReactNode }) {
  const [widgets, setWidgets] = useState<PageWidget[]>([]);

  const addWidget = (widget: PageWidget) => {
    setWidgets((prev) => [...prev, widget]);
  };

  const removeWidget = (id: string) => {
    setWidgets((prev) => prev.filter((w) => w.id !== id));
  };

  const clearWidgets = () => {
    setWidgets([]);
  };

  return (
    <PageContext.Provider
      value={{
        widgets,
        setWidgets,
        addWidget,
        removeWidget,
        clearWidgets,
      }}
    >
      {children}
    </PageContext.Provider>
  );
}

export function usePageContext() {
  const context = useContext(PageContext);
  
  if (context === undefined) {
    throw new Error('usePageContext must be used within a PageContextProvider');
  }
  
  return context;
}

/**
 * Hook to set page widgets
 * Automatically clears widgets on unmount
 */
export function usePageWidgets(widgets: PageWidget[]) {
  const { setWidgets, clearWidgets } = usePageContext();

  useEffect(() => {
    setWidgets(widgets);
    return () => clearWidgets();
  }, [widgets, setWidgets, clearWidgets]);
}
