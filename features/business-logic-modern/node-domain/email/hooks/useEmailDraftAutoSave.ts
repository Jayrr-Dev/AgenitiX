/**
 * useEmailDraftAutoSave - Real Gmail API integration for drafts
 * 
 * Handles:
 * • Auto-save to Gmail API with debouncing
 * • Create new drafts
 * • Update existing drafts
 * • Error handling and retry logic
 * • Status indicators in English
 * 
 * Keywords: gmail, draft, auto-save, convex, api
 */

import { useState, useCallback, useRef, useEffect } from "react";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { EmailDraftData } from "../emailDraft.node";

// Debug: Verify emailDrafts API is available
if (!api.emailDrafts?.createEmailDraft || !api.emailDrafts?.updateEmailDraft) {
  console.error("EmailDrafts API not available", { api: api.emailDrafts });
}

interface AutoSaveState {
  isLoading: boolean;
  lastSaved?: number;
  hasUnsavedChanges: boolean;
  error?: string;
  draftId?: string;
}

interface AutoSaveConfig {
  enabled: boolean;
  intervalMs: number;
  maxRetries: number;
}

interface UseEmailDraftAutoSaveOptions {
  nodeId: string;
  draftData: EmailDraftData;
  updateNodeData: (updates: Partial<EmailDraftData>) => void;
  config?: Partial<AutoSaveConfig>;
  onSave?: (draftId: string) => void;
  onError?: (error: string) => void;
}

interface SaveStatus {
  text: string;
  icon: "loading" | "success" | "error" | "warning" | null;
  color: string;
}

export function useEmailDraftAutoSave({
  nodeId,
  draftData,
  updateNodeData,
  config = {},
  onSave,
  onError,
}: UseEmailDraftAutoSaveOptions) {
  const [state, setState] = useState<AutoSaveState>({
    isLoading: false,
    lastSaved: draftData.lastSaved,
    hasUnsavedChanges: false,
    draftId: draftData.draftId,
  });

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef(0);
  const lastDataHashRef = useRef<string>("");
  
  // Convex actions
  const createDraftAction = useAction(api.emailDrafts.createEmailDraft);
  const updateDraftAction = useAction(api.emailDrafts.updateEmailDraft);

  // Default config with safe fallbacks
  const finalConfig: AutoSaveConfig = {
    enabled: config.enabled ?? true, // Use config value or default to true
    intervalMs: 3000, // 3 seconds
    maxRetries: 3,
    ...config,
  };

  // Log config only if there are issues
  if (!finalConfig.enabled) {
    console.warn("EmailDraft auto-save disabled:", finalConfig);
  }

  // Generate hash of current data to detect changes
  const getCurrentDataHash = useCallback(() => {
    const relevantData = {
      recipients: draftData.recipients,
      subject: draftData.subject,
      body: draftData.body,
      accountId: draftData.accountId,
    };
    return JSON.stringify(relevantData);
  }, [draftData]);

  // Check if draft has content
  const isDraftEmpty = useCallback(() => {
    const { recipients, subject, body } = draftData;
    const hasRecipients = recipients?.to?.length > 0;
    const hasSubject = subject && subject.trim().length > 0;
    const hasBody = body && (body as any)?.text && ((body as any).text as string).trim().length > 0;
    
    return !hasRecipients && !hasSubject && !hasBody;
  }, [draftData]);

  // Save draft function
  const saveDraft = useCallback(async (): Promise<boolean> => {
    console.log("saveDraft called - initial checks:", {
      enabled: finalConfig.enabled,
      isLoading: state.isLoading,
      isEmpty: isDraftEmpty(),
      accountId: draftData.accountId,
    });

    if (!finalConfig.enabled || state.isLoading) {
      console.log("Save aborted - disabled or loading");
      return false;
    }

    // Don't save empty drafts
    if (isDraftEmpty()) {
      console.log("Save aborted - empty draft");
      setState(prev => ({
        ...prev,
        hasUnsavedChanges: false,
        error: undefined,
      }));
      return true;
    }

    // Check if we have a valid account
    if (!draftData.accountId) {
      const errorMsg = "No email account selected";
      console.error("Draft save failed:", errorMsg, { draftData });
      setState(prev => ({
        ...prev,
        error: errorMsg,
      }));
      onError?.(errorMsg);
      return false;
    }

    setState(prev => ({ ...prev, isLoading: true, error: undefined }));

    try {
      const { recipients, subject, body } = draftData;
      const safeRecipients = recipients || { to: [], cc: [], bcc: [] };
      const safeBody = body || { text: "", html: "", mode: "text" };

      const draftRequest = {
        accountId: draftData.accountId as any, // Type assertion for Convex ID
        to: safeRecipients.to || [],
        cc: safeRecipients.cc || [],
        bcc: safeRecipients.bcc || [],
        subject: subject || "",
        textContent: (safeBody as any)?.text || "",
        htmlContent: (safeBody as any)?.html || "",
      };

      console.log("Making API call to save draft:", {
        hasDraftId: !!state.draftId,
        draftRequest,
      });

      let result;
      
      if (state.draftId) {
        // Update existing draft
        console.log("Updating existing draft:", state.draftId);
        result = await updateDraftAction({
          ...draftRequest,
          draftId: state.draftId,
        });
      } else {
        // Create new draft
        console.log("Creating new draft");
        result = await createDraftAction(draftRequest);
      }

      console.log("API call result:", result);

      if (result.success && result.draftId) {
        const now = Date.now();
        setState(prev => ({
          ...prev,
          isLoading: false,
          lastSaved: now,
          hasUnsavedChanges: false,
          draftId: result.draftId,
          error: undefined,
        }));

        // Update node data with draft info
        updateNodeData({
          draftId: result.draftId,
          lastSaved: now,
        });

        // Reset retry count on success
        retryCountRef.current = 0;
        
        onSave?.(result.draftId);
        return true;
      } else {
        throw new Error(result.error || "Failed to save draft");
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to save draft";
      console.error("Draft save API error:", error, {
        draftRequest: {
          accountId: draftData.accountId,
          to: (draftData.recipients || { to: [] }).to,
          subject: draftData.subject || "",
        },
      });
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));

      onError?.(errorMessage);

      // Implement exponential backoff for retries
      if (retryCountRef.current < finalConfig.maxRetries) {
        retryCountRef.current++;
        const retryDelay = Math.min(1000 * Math.pow(2, retryCountRef.current), 10000);
        
        setTimeout(() => {
          saveDraft();
        }, retryDelay);
      }

      return false;
    }
  }, [
    finalConfig,
    state.isLoading,
    state.draftId,
    isDraftEmpty,
    draftData,
    updateNodeData,
    createDraftAction,
    updateDraftAction,
    onSave,
    onError,
  ]);

  // Schedule auto-save with debouncing
  const scheduleAutoSave = useCallback(() => {
    if (!finalConfig.enabled) return;

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      saveDraft();
    }, finalConfig.intervalMs);
  }, [finalConfig.enabled, finalConfig.intervalMs, saveDraft]);

  // Detect changes and trigger auto-save
  useEffect(() => {
    const currentHash = getCurrentDataHash();
    
    if (currentHash !== lastDataHashRef.current && lastDataHashRef.current !== "") {
      setState(prev => ({ ...prev, hasUnsavedChanges: true }));
      scheduleAutoSave();
    }
    
    lastDataHashRef.current = currentHash;
  }, [getCurrentDataHash, scheduleAutoSave]);

  // Update lastSaved when it changes externally
  useEffect(() => {
    if (draftData.lastSaved !== state.lastSaved) {
      setState(prev => ({ ...prev, lastSaved: draftData.lastSaved }));
    }
  }, [draftData.lastSaved, state.lastSaved]);

  // Update draftId when it changes externally
  useEffect(() => {
    if (draftData.draftId !== state.draftId) {
      setState(prev => ({ ...prev, draftId: draftData.draftId }));
    }
  }, [draftData.draftId, state.draftId]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Force save function
  const forceSave = useCallback(async () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    return await saveDraft();
  }, [saveDraft]);

  // Get current save status for UI
  const getSaveStatus = useCallback((): SaveStatus => {
    if (state.isLoading) {
      return {
        text: "Saving...",
        icon: "loading",
        color: "text-blue-500",
      };
    }

    if (state.error) {
      return {
        text: `Error: ${state.error}`,
        icon: "error",
        color: "text-red-500",
      };
    }

    if (isDraftEmpty()) {
      return {
        text: "Empty draft",
        icon: null,
        color: "text-muted-foreground",
      };
    }

    if (state.hasUnsavedChanges) {
      return {
        text: "Unsaved changes",
        icon: "warning",
        color: "text-yellow-500",
      };
    }

    if (state.lastSaved) {
      const timeSinceLastSave = Date.now() - state.lastSaved;
      if (timeSinceLastSave < 10000) { // Less than 10 seconds
        return {
          text: "Saved",
          icon: "success",
          color: "text-green-500",
        };
      } else {
        return {
          text: "Saved",
          icon: null,
          color: "text-muted-foreground",
        };
      }
    }

    return {
      text: "Not saved",
      icon: null,
      color: "text-muted-foreground",
    };
  }, [state, isDraftEmpty]);

  const hookReturn = {
    ...state,
    forceSave,
    getSaveStatus,
    isAutoSaveEnabled: finalConfig.enabled,
    isEmpty: isDraftEmpty(),
  };

  // Debug only when there are errors
  if (hookReturn.error) {
    console.error("EmailDraft auto-save error:", hookReturn.error);
  }

  return hookReturn;
}