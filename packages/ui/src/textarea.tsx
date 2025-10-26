"use client";

/**
 * Textarea Component
 * Accessible textarea with auto-resize support
 */

import { forwardRef, TextareaHTMLAttributes, useEffect, useRef } from 'react';
import { cn } from '@whalli/utils';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
  autoResize?: boolean;
  maxHeight?: number;
}

/**
 * Textarea Component
 * 
 * Multi-line text input with optional auto-resize
 * 
 * @example
 * ```tsx
 * <Textarea
 *   placeholder="Enter your message..."
 *   autoResize
 *   maxHeight={200}
 *   error="This field is required"
 * />
 * ```
 */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, autoResize = false, maxHeight, onChange, ...props }, ref) => {
    const internalRef = useRef<HTMLTextAreaElement | null>(null);
    const textareaRef = (ref as React.RefObject<HTMLTextAreaElement>) || internalRef;

    // Auto-resize logic
    useEffect(() => {
      if (!autoResize || !textareaRef.current) return;

      const textarea = textareaRef.current;
      
      const resize = () => {
        textarea.style.height = 'auto';
        const newHeight = textarea.scrollHeight;
        textarea.style.height = maxHeight && newHeight > maxHeight 
          ? `${maxHeight}px` 
          : `${newHeight}px`;
      };

      resize();
      textarea.addEventListener('input', resize);

      return () => {
        textarea.removeEventListener('input', resize);
      };
    }, [autoResize, maxHeight, textareaRef, props.value]);

    return (
      <div className="w-full">
        <textarea
          ref={textareaRef}
          className={cn(
            'flex min-h-[80px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:ring-offset-gray-950 dark:placeholder:text-gray-400',
            error && 'border-red-500 focus-visible:ring-red-500',
            autoResize && 'resize-none overflow-hidden',
            className
          )}
          onChange={onChange}
          aria-invalid={!!error}
          aria-describedby={error ? 'textarea-error' : undefined}
          {...props}
        />
        {error && (
          <p id="textarea-error" className="mt-1 text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
