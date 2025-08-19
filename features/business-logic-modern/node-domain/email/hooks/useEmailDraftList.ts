/**
 * Hook for managing Gmail drafts list and selection
 * 
 * Provides functionality to:
 * • List available drafts from Gmail
 * • Load specific draft details
 * • Delete drafts
 * • Handle draft selection and mode switching
 * 
 * Keywords: gmail, drafts, list, selection, management
 */

import { useCallback, useEffect, useState } from "react";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";

interface DraftSummary {
  id: string;
  subject: string;
  snippet: string;
  lastModified: number;
  hasAttachments: boolean;
}

interface DraftDetails {
  id: string;
  messageId: string;
  threadId: string;
  subject: string;
  recipients: {
    to: string[];
    cc: string[];
    bcc: string[];
  };
  body: {
    text: string;
    html: string;
    mode: "text" | "html";
  };
  snippet: string;
  lastModified: number;
  sizeEstimate: number;
}

interface UseEmailDraftListConfig {
  accountId: string;
  enabled?: boolean;
  autoRefresh?: boolean;
  maxResults?: number;
}

interface UseEmailDraftListReturn {
  // State
  drafts: DraftSummary[];
  isLoading: boolean;
  error: string | null;
  selectedDraft: DraftDetails | null;
  isLoadingDraft: boolean;
  
  // Actions
  refreshDrafts: () => Promise<void>;
  loadDraft: (draftId: string) => Promise<DraftDetails | null>;
  deleteDraft: (draftId: string) => Promise<boolean>;
  clearSelection: () => void;
  
  // Utils
  getDraftById: (draftId: string) => DraftSummary | undefined;
  getTotalCount: () => number;
}

export function useEmailDraftList(config: UseEmailDraftListConfig): UseEmailDraftListReturn {
  const { accountId, enabled = true, autoRefresh = false, maxResults = 20 } = config;

  // State
  const [drafts, setDrafts] = useState<DraftSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDraft, setSelectedDraft] = useState<DraftDetails | null>(null);
  const [isLoadingDraft, setIsLoadingDraft] = useState(false);

  // Convex actions
  const listEmailDraftsAction = useAction(api.emailDrafts.listEmailDrafts);
  const getDraftDetailsAction = useAction(api.emailDrafts.getDraftDetails);
  const deleteEmailDraftAction = useAction(api.emailDrafts.deleteEmailDraft);

  // Refresh drafts list
  const refreshDrafts = useCallback(async () => {
    if (!enabled || !accountId) return;

    setIsLoading(true);
    setError(null);

    try {

      
      const result = await listEmailDraftsAction({
        accountId: accountId as any,
        maxResults,
      });

      if (result.success && result.drafts) {
        // Transform drafts to our format - now includes proper subjects from API
        const transformedDrafts: DraftSummary[] = result.drafts.map((draft: any) => ({
          id: draft.id,
          subject: draft.subject || "No subject",
          snippet: draft.snippet || "",
          lastModified: draft.lastModified || Date.now(),
          hasAttachments: false, // Will be enhanced with actual attachment detection
        }));

        setDrafts(transformedDrafts);
      } else {
        setError(result.error || "Failed to load drafts");
        setDrafts([]);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error loading drafts";
      setError(errorMessage);
      setDrafts([]);
      console.error("Failed to load drafts:", err);
    } finally {
      setIsLoading(false);
    }
  }, [listEmailDraftsAction, accountId, enabled, maxResults]);

  // Load specific draft details
  const loadDraft = useCallback(async (draftId: string): Promise<DraftDetails | null> => {
    if (!accountId) return null;

    setIsLoadingDraft(true);
    setError(null);

    try {

      
      const result = await getDraftDetailsAction({
        accountId: accountId as any,
        draftId,
      });

      if (result.success && result.draft) {
        const draftDetails: DraftDetails = {
          id: result.draft.id,
          messageId: result.draft.messageId,
          threadId: result.draft.threadId,
          subject: result.draft.subject,
          recipients: result.draft.recipients,
          body: result.draft.body,
          snippet: result.draft.snippet,
          lastModified: result.draft.lastModified,
          sizeEstimate: result.draft.sizeEstimate,
        };

        setSelectedDraft(draftDetails);
        return draftDetails;
      } else {
        setError(result.error || "Failed to load draft details");
        return null;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error loading draft";
      setError(errorMessage);
      console.error("Failed to load draft details:", err);
      return null;
    } finally {
      setIsLoadingDraft(false);
    }
  }, [getDraftDetailsAction, accountId]);

  // Delete draft
  const deleteDraft = useCallback(async (draftId: string): Promise<boolean> => {
    if (!accountId) return false;

    try {

      
      const result = await deleteEmailDraftAction({
        accountId: accountId as any,
        draftId,
      });

      if (result.success) {
        // Remove from local state
        setDrafts(prev => prev.filter(draft => draft.id !== draftId));
        
        // Clear selection if this draft was selected
        if (selectedDraft?.id === draftId) {
          setSelectedDraft(null);
        }
        
        return true;
      } else {
        setError(result.error || "Failed to delete draft");
        return false;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error deleting draft";
      setError(errorMessage);
      console.error("Failed to delete draft:", err);
      return false;
    }
  }, [deleteEmailDraftAction, accountId, selectedDraft]);

  // Clear selection
  const clearSelection = useCallback(() => {
    setSelectedDraft(null);
    setError(null);
  }, []);

  // Utility functions
  const getDraftById = useCallback((draftId: string): DraftSummary | undefined => {
    return drafts.find(draft => draft.id === draftId);
  }, [drafts]);

  const getTotalCount = useCallback((): number => {
    return drafts.length;
  }, [drafts]);

  // Auto-refresh effect
  useEffect(() => {
    if (autoRefresh && enabled && accountId) {
      refreshDrafts();
      
      const interval = setInterval(refreshDrafts, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh, enabled, accountId, refreshDrafts]);

  // Initial load effect
  useEffect(() => {
    if (enabled && accountId) {
      refreshDrafts();
    }
  }, [enabled, accountId, refreshDrafts]);

  return {
    // State
    drafts,
    isLoading,
    error,
    selectedDraft,
    isLoadingDraft,
    
    // Actions
    refreshDrafts,
    loadDraft,
    deleteDraft,
    clearSelection,
    
    // Utils
    getDraftById,
    getTotalCount,
  };
}

export default useEmailDraftList;
