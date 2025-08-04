/**
 * Route: hooks/use-toast.ts
 * TOAST HOOK - Provides toast notification functionality using sonner
 *
 * • Exports useToast hook for consistent toast notifications
 * • Integrates with sonner toast library for modern UI
 * • Provides type-safe toast methods (success, error, warning, info)
 * • Supports custom duration and positioning
 *
 * Keywords: toast-notifications, sonner, ui-feedback, notifications
 */

import { toast as sonnerToast } from "sonner";

export interface ToastOptions {
  duration?: number;
  position?: "top-left" | "top-right" | "top-center" | "bottom-left" | "bottom-right" | "bottom-center";
}

export const useToast = () => {
  const toast = {
    success: (message: string, options?: ToastOptions) => {
      return sonnerToast.success(message, options);
    },
    error: (message: string, options?: ToastOptions) => {
      return sonnerToast.error(message, options);
    },
    warning: (message: string, options?: ToastOptions) => {
      return sonnerToast.warning(message, options);
    },
    info: (message: string, options?: ToastOptions) => {
      return sonnerToast.info(message, options);
    },
    loading: (message: string, options?: ToastOptions) => {
      return sonnerToast.loading(message, options);
    },
    dismiss: (toastId?: string | number) => {
      return sonnerToast.dismiss(toastId);
    },
  };

  return { toast };
}; 