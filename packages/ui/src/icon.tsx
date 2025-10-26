"use client";

/**
 * Icon wrapper for lucide-react
 * Provides consistent sizing and styling
 */

import { LucideIcon, LucideProps } from 'lucide-react';
import { forwardRef } from 'react';
import { cn } from '@whalli/utils';

export interface IconProps extends Omit<LucideProps, 'ref'> {
  icon: LucideIcon;
  className?: string;
}

/**
 * Icon Component
 * 
 * Wrapper around lucide-react icons with consistent sizing
 * 
 * @example
 * ```tsx
 * import { Icon } from '@whalli/ui';
 * import { Home } from 'lucide-react';
 * 
 * <Icon icon={Home} className="text-blue-500" />
 * ```
 */
export const Icon = forwardRef<SVGSVGElement, IconProps>(
  ({ icon: IconComponent, className, size = 20, ...props }, ref) => {
    return (
      <IconComponent
        ref={ref}
        size={size}
        className={cn('shrink-0', className)}
        {...props}
      />
    );
  }
);

Icon.displayName = 'Icon';

// Re-export commonly used icons
export {
  Menu,
  X,
  Search,
  Settings,
  User,
  LogOut,
  Plus,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  MessageSquare,
  Send,
  Trash2,
  Edit2,
  Copy,
  Check,
  AlertCircle,
  Info,
  Loader2,
  ExternalLink,
  Download,
  Upload,
  Eye,
  EyeOff,
  Moon,
  Sun,
  Zap,
  Star,
  Heart,
  Share2,
  MoreVertical,
  MoreHorizontal,
} from 'lucide-react';
