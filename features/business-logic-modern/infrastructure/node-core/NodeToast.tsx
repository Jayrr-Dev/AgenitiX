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

import React, { useState, useCallback, useEffect } from 'react';
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
}> = ({ toast, onDismiss, nodeWidth }) => {
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

  return (
    <motion.div
      initial={{ opacity: 0, y: -10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={`
        relative flex items-center rounded-md border shadow-md
        ${style.bg} ${style.border} ${style.text}
        ${nodeWidth < 150 ? 'gap-2 px-2 py-1.5' : 'gap-2 px-3 py-2'}
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

      {/* Dismiss button */}
      {toast.dismissible !== false && nodeWidth > 150 && (
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

// Helper function to get node width from standardized sizes
const getNodeWidthFromSizing = (nodeId: string): number => {
  // Try to get the node element to determine its current state
  const nodeElement = document.querySelector(`[data-id="${nodeId}"]`);
  if (!nodeElement) return 180; // Default to VE2 width
  
  // Get expansion state from data attribute
  const isExpanded = nodeElement.getAttribute('data-expanded') === 'true';
  
  // Get the current size key from data attributes
  const currentSizeKey = nodeElement.getAttribute('data-current-size') ||
                        (isExpanded 
                          ? nodeElement.getAttribute('data-expanded-size') 
                          : nodeElement.getAttribute('data-collapsed-size'));
  
  if (currentSizeKey) {
    if (isExpanded) {
      const expandedSize = EXPANDED_SIZES[currentSizeKey as keyof typeof EXPANDED_SIZES];
      if (expandedSize) return expandedSize.width;
    } else {
      const collapsedSize = COLLAPSED_SIZES[currentSizeKey as keyof typeof COLLAPSED_SIZES];
      if (collapsedSize) return collapsedSize.width;
    }
  }
  
  // Fallback to measuring the actual DOM element
  const rect = nodeElement.getBoundingClientRect();
  if (rect.width > 0) return Math.round(rect.width);
  
  // Final fallback based on common patterns
  return isExpanded ? 180 : 120; // VE2 : C2 default
};

// Main toast container component
export const NodeToastContainer: React.FC<{
  nodeId: string;
}> = ({ nodeId }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [nodeWidth, setNodeWidth] = useState<number>(() => getNodeWidthFromSizing(nodeId));
  const DEBUG_WIDTH = process.env.NODE_ENV === 'development' && false; // Set to true to debug width matching

  // Add toast to queue
  const addToast = useCallback((config: ToastConfig) => {
    const id = `${nodeId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
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

  // Get node width using sizing system and DOM measurement
  useEffect(() => {
    const updateNodeWidth = () => {
      const newWidth = getNodeWidthFromSizing(nodeId);
      
      if (DEBUG_WIDTH) {
        console.log(`Toast width update for node ${nodeId}:`, {
          newWidth,
          previousWidth: nodeWidth
        });
      }
      
      if (newWidth !== nodeWidth) {
        setNodeWidth(newWidth);
      }
    };

    // Initial width calculation
    updateNodeWidth();

    // Update width when node changes (expansion/collapse, size changes)
    const mutationObserver = new MutationObserver(updateNodeWidth);
    
    // Observe the node element if found
    const nodeElement = document.querySelector(`[data-id="${nodeId}"]`);
    if (nodeElement) {
      mutationObserver.observe(nodeElement, { 
        attributes: true, 
        attributeFilter: ['data-expanded', 'data-size', 'data-expanded-size', 'data-collapsed-size', 'class', 'style'],
        childList: true,
        subtree: true
      });
    }

    // Also observe for React Flow updates
    const flowContainer = document.querySelector('.react-flow');
    if (flowContainer) {
      mutationObserver.observe(flowContainer, {
        childList: true,
        subtree: true
      });
    }

    return () => {
      mutationObserver.disconnect();
    };
  }, [nodeId, nodeWidth, DEBUG_WIDTH]);

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
      <div className="flex flex-col gap-2">
        <AnimatePresence mode="popLayout">
          {toasts.map((toast) => (
            <Toast
              key={toast.id}
              toast={toast}
              onDismiss={removeToast}
              nodeWidth={nodeWidth}
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