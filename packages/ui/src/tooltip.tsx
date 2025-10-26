"use client";

/**
 * Tooltip Component
 * Accessible tooltip with positioning
 */

import {
  forwardRef,
  ReactNode,
  useState,
  useRef,
  useEffect,
} from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@whalli/utils';

export interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  side?: 'top' | 'bottom' | 'left' | 'right';
  align?: 'start' | 'center' | 'end';
  delayDuration?: number;
  className?: string;
  disabled?: boolean;
}

/**
 * Tooltip Component
 * 
 * Accessible tooltip with auto-positioning
 * 
 * @example
 * ```tsx
 * <Tooltip content="Click to save" side="top">
 *   <Button>Save</Button>
 * </Tooltip>
 * ```
 */
export const Tooltip = forwardRef<HTMLDivElement, TooltipProps>(
  (
    {
      content,
      children,
      side = 'top',
      align = 'center',
      delayDuration = 200,
      className,
      disabled = false,
    },
    ref
  ) => {
    const [isVisible, setIsVisible] = useState(false);
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const triggerRef = useRef<HTMLDivElement>(null);
    const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

    const handleMouseEnter = () => {
      if (disabled) return;
      
      timeoutRef.current = setTimeout(() => {
        setIsVisible(true);
        calculatePosition();
      }, delayDuration);
    };

    const handleMouseLeave = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      setIsVisible(false);
    };

    const calculatePosition = () => {
      if (!triggerRef.current) return;

      const rect = triggerRef.current.getBoundingClientRect();
      const tooltipWidth = 200; // approximate
      const tooltipHeight = 40; // approximate
      const gap = 8;

      let top = 0;
      let left = 0;

      // Calculate position based on side
      switch (side) {
        case 'top':
          top = rect.top - tooltipHeight - gap;
          left = rect.left + rect.width / 2 - tooltipWidth / 2;
          break;
        case 'bottom':
          top = rect.bottom + gap;
          left = rect.left + rect.width / 2 - tooltipWidth / 2;
          break;
        case 'left':
          top = rect.top + rect.height / 2 - tooltipHeight / 2;
          left = rect.left - tooltipWidth - gap;
          break;
        case 'right':
          top = rect.top + rect.height / 2 - tooltipHeight / 2;
          left = rect.right + gap;
          break;
      }

      // Adjust for alignment
      if (side === 'top' || side === 'bottom') {
        if (align === 'start') left = rect.left;
        if (align === 'end') left = rect.right - tooltipWidth;
      } else {
        if (align === 'start') top = rect.top;
        if (align === 'end') top = rect.bottom - tooltipHeight;
      }

      // Keep within viewport
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      if (left < gap) left = gap;
      if (left + tooltipWidth > viewportWidth - gap) {
        left = viewportWidth - tooltipWidth - gap;
      }
      if (top < gap) top = gap;
      if (top + tooltipHeight > viewportHeight - gap) {
        top = viewportHeight - tooltipHeight - gap;
      }

      setPosition({ top, left });
    };

    useEffect(() => {
      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };
    }, []);

    return (
      <>
        <div
          ref={triggerRef}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onFocus={handleMouseEnter}
          onBlur={handleMouseLeave}
          className="inline-block"
        >
          {children}
        </div>

        {isVisible &&
          !disabled &&
          createPortal(
            <div
              ref={ref}
              role="tooltip"
              style={{
                position: 'fixed',
                top: `${position.top}px`,
                left: `${position.left}px`,
                zIndex: 9999,
              }}
              className={cn(
                'rounded-md bg-gray-900 px-3 py-1.5 text-sm text-white shadow-lg animate-in fade-in-0 zoom-in-95 duration-200 dark:bg-gray-700',
                className
              )}
            >
              {content}
            </div>,
            document.body
          )}
      </>
    );
  }
);

Tooltip.displayName = 'Tooltip';

/**
 * Simple Tooltip (no portal, relative positioning)
 */
export interface SimpleTooltipProps {
  content: ReactNode;
  children: ReactNode;
  className?: string;
}

export const SimpleTooltip = forwardRef<HTMLDivElement, SimpleTooltipProps>(
  ({ content, children, className }, ref) => {
    return (
      <div ref={ref} className="group relative inline-block">
        {children}
        <div
          role="tooltip"
          className={cn(
            'pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 rounded-md bg-gray-900 px-3 py-1.5 text-sm text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 dark:bg-gray-700',
            className
          )}
        >
          {content}
        </div>
      </div>
    );
  }
);

SimpleTooltip.displayName = 'SimpleTooltip';
