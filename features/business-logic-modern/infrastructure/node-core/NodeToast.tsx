/**
 * Node Toast Component
 * 
 * A modular toast notification system that appears above nodes.
 * Provides contextual feedback for node operations like errors, success, and info messages.
 * 
 * Features:
 * - Positioned above the node
 * - Auto-dismiss with configurable duration
 * - Multiple toast types (error, success, info, warning)
 * - Smooth animations
 * - Queue management for multiple toasts
 * 
 * @example
 * const { showToast } = useNodeToast();
 * showToast({ type: 'error', message: 'Connection failed' });
 */

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Check, AlertTriangle, Info, AlertCircle } from 'lucide-react';
import { COLLAPSED_SIZES, EXPANDED_SIZES } from '@/features/business-logic-modern/infrastructure/theming/sizing';

// Toast types and configuration
export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
  description?: string;
  duration?: number;
  dismissible?: boolean;
}

interface ToastConfig {
  type: ToastType;
  message: string;
  description?: string;
  duration?: number;
  dismissible?: boolean;
}

// Default durations for different toast types
const DEFAULT_DURATIONS: Record<ToastType, number> = {
  success: 3000,
  info: 4000,
  warning: 5000,
  error: 6000,
};

// Toast styling configuration - shadcn/sonner inspired
const TOAST_STYLES: Record<ToastType, {
  bg: string;
  border: string;
  text: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
}> = {
  success: {
    bg: 'bg-background',
    border: 'border-border',
    text: 'text-foreground',
    icon: Check,
    iconColor: 'text-green-600 dark:text-green-400',
  },
  error: {
    bg: 'bg-background',
    border: 'border-border',
    text: 'text-foreground',
    icon: AlertCircle,
    iconColor: 'text-red-600 dark:text-red-400',
  },
  warning: {
    bg: 'bg-background',
    border: 'border-border',
    text: 'text-foreground',
    icon: AlertTriangle,
    iconColor: 'text-yellow-600 dark:text-yellow-400',
  },
  info: {
    bg: 'bg-background',
    border: 'border-border',
    text: 'text-foreground',
    icon: Info,
    iconColor: 'text-blue-600 dark:text-blue-400',
  },
};

// Individual toast component
const Toast: React.FC<{
  toast: ToastMessage;
  onDismiss: (id: string) => void;
  nodeWidth: number;
  index: number;
  total: number;
}> = ({ toast, onDismiss, nodeWidth, index, total }) => {
  const style = TOAST_STYLES[toast.type];
  const Icon = style.icon;

  // Auto-dismiss timer
  useEffect(() => {
    if (toast.duration && toast.duration > 0) {
      const timer = setTimeout(() => {
        onDismiss(toast.id);
      }, toast.duration);

      return () => clearTimeout(timer);
    }
  }, [toast.id, toast.duration, onDismiss]);

  // Calculate stacking position (newest on top)
  const isTop = index === total - 1; // Last toast (newest) is on top
  const distanceFromTop = total - 1 - index; // How far this toast is from the top
  const stackOffset = distanceFromTop * -4; // Negative offset to stack upward
  const scaleOffset = distanceFromTop * 0.05; // Scale reduction for older toasts
  const opacityOffset = Math.max(0.4, 1 - distanceFromTop * 0.15); // Fade older toasts

  return (
    <motion.div
      initial={{
        opacity: 0,
        y: -10,
        scale: 0.95,
        zIndex: index + 1 // Higher index = higher z-index (most recent on top)
      }}
      animate={{
        opacity: isTop ? 1 : opacityOffset,
        y: stackOffset,
        scale: isTop ? 1 : 1 - scaleOffset,
        zIndex: index + 1 // Higher index = higher z-index (most recent on top)
      }}
      exit={{
        opacity: 0,
        y: -10,
        scale: 0.95,
        transition: { duration: 0.15 }
      }}
      transition={{
        duration: 0.2,
        ease: 'easeOut',
        opacity: { duration: 0.15 },
        scale: { duration: 0.2 }
      }}
      className={`
        absolute top-0 -translate-y-6 left-0 flex items-center rounded-md border shadow-md
        ${style.bg} ${style.border} ${style.text}
        ${nodeWidth < 150 ? 'gap-2 px-2 py-1.5' : 'gap-2 px-3 py-2 -translate-y-8'}
        ${!isTop ? 'pointer-events-none' : ''}
      `}
      style={{
        width: `${nodeWidth}px`,
        minWidth: `${nodeWidth}px`,
        maxWidth: `${nodeWidth}px`
      }}
    >
      {/* Icon */}
      <Icon className={`${nodeWidth < 150 ? 'w-3 h-3' : 'w-4 h-4'} flex-shrink-0 ${style.iconColor}`} />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="font-medium leading-tight break-words" style={{ fontSize: '8px' }}>
          {toast.message}
        </p>
        {toast.description && nodeWidth > 200 && (
          <p className="text-muted-foreground mt-0.5 leading-tight break-words" style={{ fontSize: '8px' }}>
            {toast.description}
          </p>
        )}
      </div>

      {/* Dismiss button - only show on top toast */}
      {toast.dismissible !== false && nodeWidth > 150 && isTop && (
        <button
          onClick={() => onDismiss(toast.id)}
          className="flex-shrink-0 p-0.5 rounded-sm hover:bg-accent hover:text-accent-foreground transition-colors text-muted-foreground"
          aria-label="Dismiss notification"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </motion.div>
  );
};

// Fixed toast widths based on standardized sizing (normal sizing)
const TOAST_WIDTHS = {
  // Collapsed sizes (normal sizing)St
  C1: 60,    // 60px
  C1W: 120,  // 120px
  C2: 120,   // 120px
  C3: 180,   // 180px

  // Expanded sizes (normal sizing)
  FE0: 60,   // 60px
  FE1: 120,  // 120px
  FE1H: 120, // 120px
  FE2: 180,  // 180px
  FE3: 240,  // 240px
  VE0: 60,   // 60px
  VE1: 120,  // 120px
  VE2: 180,  // 180px
  VE3: 240,  // 240px
} as const;

// Helper function to get toast width from size key (for backwards compatibility)
const getToastWidthFromSizeKey = (sizeKey: string): number => {
  if (sizeKey && sizeKey in TOAST_WIDTHS) {
    return TOAST_WIDTHS[sizeKey as keyof typeof TOAST_WIDTHS];
  }
  return TOAST_WIDTHS.VE2; // Default fallback
};

// Main toast container component
export const NodeToastContainer: React.FC<{
  nodeId: string;
  isExpanded?: boolean;
  expandedSize?: string;
  collapsedSize?: string;
}> = ({ nodeId, isExpanded = false, expandedSize = 'VE2', collapsedSize = 'C2' }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Calculate width based on props (React way)
  const nodeWidth = useMemo(() => {
    const currentSizeKey = isExpanded ? expandedSize : collapsedSize;

    if (currentSizeKey && currentSizeKey in TOAST_WIDTHS) {
      return TOAST_WIDTHS[currentSizeKey as keyof typeof TOAST_WIDTHS];
    }

    // Fallback
    return isExpanded ? TOAST_WIDTHS.VE2 : TOAST_WIDTHS.C2;
  }, [isExpanded, expandedSize, collapsedSize]);

  const DEBUG_WIDTH = process.env.NODE_ENV === 'development' && false; // Set to true to debug width matching

  // Add toast to queue
  const addToast = useCallback((config: ToastConfig) => {
    const id = `${nodeId}-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    const duration = config.duration ?? DEFAULT_DURATIONS[config.type];

    const newToast: ToastMessage = {
      id,
      type: config.type,
      message: config.message,
      description: config.description,
      duration,
      dismissible: config.dismissible,
    };

    setToasts(prev => [...prev, newToast]);

    return id;
  }, [nodeId]);

  // Remove toast from queue
  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  // Clear all toasts
  const clearToasts = useCallback(() => {
    setToasts([]);
  }, []);

  // Debug logging
  useEffect(() => {
    if (DEBUG_WIDTH) {
      console.log(`[Toast Debug] NodeToastContainer props for ${nodeId}:`, {
        isExpanded,
        expandedSize,
        collapsedSize,
        calculatedWidth: nodeWidth
      });
    }
  }, [nodeId, isExpanded, expandedSize, collapsedSize, nodeWidth, DEBUG_WIDTH]);

  // Expose toast functions via custom event system
  useEffect(() => {
    const handleShowToast = (event: CustomEvent<ToastConfig>) => {
      addToast(event.detail);
    };

    const handleClearToasts = () => {
      clearToasts();
    };

    // Listen for toast events specific to this node
    const showEventName = `node-toast-show-${nodeId}`;
    const clearEventName = `node-toast-clear-${nodeId}`;

    window.addEventListener(showEventName, handleShowToast as EventListener);
    window.addEventListener(clearEventName, handleClearToasts);

    return () => {
      window.removeEventListener(showEventName, handleShowToast as EventListener);
      window.removeEventListener(clearEventName, handleClearToasts);
    };
  }, [nodeId, addToast, clearToasts]);

  if (toasts.length === 0) {
    return null;
  }

  return (
    <div
      className="absolute -top-2 left-1/2 transform -translate-x-1/2 -translate-y-full z-50"
      style={{
        width: `${nodeWidth}px`,
        minWidth: `${nodeWidth}px`,
        maxWidth: `${nodeWidth}px`
      }}
    >
      <div className="relative">
        <AnimatePresence mode="popLayout">
          {toasts.map((toast, index) => (
            <Toast
              key={toast.id}
              toast={toast}
              onDismiss={removeToast}
              nodeWidth={nodeWidth}
              index={index}
              total={toasts.length}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

// Hook for using node toasts
export const useNodeToast = (nodeId: string) => {
  const showToast = useCallback((config: ToastConfig) => {
    const event = new CustomEvent(`node-toast-show-${nodeId}`, {
      detail: config,
    });
    window.dispatchEvent(event);
  }, [nodeId]);

  const clearToasts = useCallback(() => {
    const event = new CustomEvent(`node-toast-clear-${nodeId}`);
    window.dispatchEvent(event);
  }, [nodeId]);

  // Convenience methods for different toast types
  const showSuccess = useCallback((message: string, description?: string, duration?: number) => {
    showToast({ type: 'success', message, description, duration });
  }, [showToast]);

  const showError = useCallback((message: string, description?: string, duration?: number) => {
    showToast({ type: 'error', message, description, duration });
  }, [showToast]);

  const showWarning = useCallback((message: string, description?: string, duration?: number) => {
    showToast({ type: 'warning', message, description, duration });
  }, [showToast]);

  const showInfo = useCallback((message: string, description?: string, duration?: number) => {
    showToast({ type: 'info', message, description, duration });
  }, [showToast]);

  return {
    showToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    clearToasts,
  };
};

export default NodeToastContainer;