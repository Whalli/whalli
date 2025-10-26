"use client";

/**
 * Modal Component
 * Accessible modal dialog with overlay
 */

import {
  forwardRef,
  HTMLAttributes,
  ReactNode,
  useEffect,
  useCallback,
  MouseEvent,
} from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@whalli/utils';
import { Icon, X } from './icon';

export interface ModalProps extends HTMLAttributes<HTMLDivElement> {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  showCloseButton?: boolean;
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  full: 'max-w-full mx-4',
};

/**
 * Modal Component
 * 
 * Accessible modal dialog with overlay and animations
 * 
 * @example
 * ```tsx
 * <Modal open={isOpen} onClose={() => setIsOpen(false)} size="lg">
 *   <ModalHeader>
 *     <ModalTitle>Confirm Action</ModalTitle>
 *   </ModalHeader>
 *   <ModalContent>
 *     <p>Are you sure you want to continue?</p>
 *   </ModalContent>
 *   <ModalFooter>
 *     <Button onClick={onConfirm}>Confirm</Button>
 *   </ModalFooter>
 * </Modal>
 * ```
 */
export const Modal = forwardRef<HTMLDivElement, ModalProps>(
  (
    {
      open,
      onClose,
      children,
      className,
      size = 'md',
      closeOnOverlayClick = true,
      closeOnEscape = true,
      showCloseButton = true,
      ...props
    },
    ref
  ) => {
    // Handle escape key
    useEffect(() => {
      if (!open || !closeOnEscape) return;

      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };

      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }, [open, closeOnEscape, onClose]);

    // Prevent body scroll when modal is open
    useEffect(() => {
      if (open) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }

      return () => {
        document.body.style.overflow = '';
      };
    }, [open]);

    // Handle overlay click
    const handleOverlayClick = useCallback(
      (e: MouseEvent<HTMLDivElement>) => {
        if (closeOnOverlayClick && e.target === e.currentTarget) {
          onClose();
        }
      },
      [closeOnOverlayClick, onClose]
    );

    if (!open) return null;

    const modalContent = (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
        onClick={handleOverlayClick}
        role="dialog"
        aria-modal="true"
      >
        <div
          ref={ref}
          className={cn(
            'relative w-full rounded-lg bg-white shadow-xl dark:bg-gray-900',
            'animate-in fade-in-0 zoom-in-95 duration-200',
            sizeClasses[size],
            className
          )}
          onClick={(e) => e.stopPropagation()}
          {...props}
        >
          {showCloseButton && (
            <button
              onClick={onClose}
              className="absolute right-4 top-4 rounded-md p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
              aria-label="Close modal"
            >
              <Icon icon={X} size={20} />
            </button>
          )}
          {children}
        </div>
      </div>
    );

    return createPortal(modalContent, document.body);
  }
);

Modal.displayName = 'Modal';

/**
 * Modal Header
 */
export const ModalHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('flex flex-col space-y-1.5 border-b border-gray-200 p-6 dark:border-gray-800', className)}
        {...props}
      />
    );
  }
);

ModalHeader.displayName = 'ModalHeader';

/**
 * Modal Title
 */
export const ModalTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => {
    return (
      <h2
        ref={ref}
        className={cn('text-lg font-semibold text-gray-900 dark:text-white', className)}
        {...props}
      />
    );
  }
);

ModalTitle.displayName = 'ModalTitle';

/**
 * Modal Content
 */
export const ModalContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('p-6 text-gray-700 dark:text-gray-300', className)}
        {...props}
      />
    );
  }
);

ModalContent.displayName = 'ModalContent';

/**
 * Modal Footer
 */
export const ModalFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('flex items-center justify-end gap-2 border-t border-gray-200 p-6 dark:border-gray-800', className)}
        {...props}
      />
    );
  }
);

ModalFooter.displayName = 'ModalFooter';
