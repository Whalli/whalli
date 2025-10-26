'use client';

/**
 * App Layout
 * 
 * Wraps all authenticated app pages with AppShell and provides PageContext
 */

import { ReactNode } from 'react';
import { AppShell } from '@/components/app-shell-v2';

export default function AppLayout({ children }: { children: ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
