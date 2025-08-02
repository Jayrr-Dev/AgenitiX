/**
 * Node Toast Hook
 * 
 * Provides easy access to the node toast system for displaying contextual notifications.
 * This hook should be used within node components to show success, error, warning, and info messages.
 * 
 * @example
 * const { showSuccess, showError } = useNodeToast();
 * 
 * // Show success message
 * showSuccess('Data saved successfully');
 * 
 * // Show error with description
 * showError('Connection failed', 'Please check your network settings');
 * 
 * // Show custom toast
 * showToast({
 *   type: 'warning',
 *   message: 'Rate limit approaching',
 *   duration: 5000
 * });
 */

import { useCallback } from 'react';
import { useReactFlow } from '@xyflow/react';

export interface ToastConfig {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  description?: string;
  duration?: number;
  dismissible?: boolean;
}

/**
 * Hook for displaying toast notifications above a specific node
 * @param nodeId - Optional node ID. If not provided, will attempt to get from React Flow context
 */
export const useNodeToast = (nodeId?: string) => {
  const { getNode } = useReactFlow();
  
  // Try to get node ID from context if not provided
  const resolvedNodeId = nodeId || (() => {
    // This is a fallback - in practice, nodes should pass their ID
    console.warn('useNodeToast: nodeId not provided, toast may not work correctly');
    return 'unknown-node';
  })();

  const showToast = useCallback((config: ToastConfig) => {
    const event = new CustomEvent(`node-toast-show-${resolvedNodeId}`, {
      detail: config,
    });
    window.dispatchEvent(event);
  }, [resolvedNodeId]);

  const clearToasts = useCallback(() => {
    const event = new CustomEvent(`node-toast-clear-${resolvedNodeId}`);
    window.dispatchEvent(event);
  }, [resolvedNodeId]);

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

export default useNodeToast;