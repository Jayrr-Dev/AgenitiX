"use client";
/**
 * Route: features/business-logic-modern/node-domain/email/stores/use-email-reader-outputs.ts
 * EMAIL READER OUTPUT STORE - Ephemeral per-node outputs to keep React Flow light
 *
 * • Stores large email arrays outside of `node.data` to avoid drag/render lag
 * • Keyed by (flowId, nodeId) → messages array and lightweight summaries
 * • Not persisted; cleared on logout/flow changes to prevent memory growth
 *
 * Keywords: email-reader, outputs-store, ephemeral, performance, zustand
 */

import { create } from "zustand";

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

// Generic record shape to avoid tight coupling with provider-specific fields
export type EmailMessageLike = Record<string, unknown>;

interface EmailReaderOutputsState {
  /** (flowId::nodeId) → messages */
  nodeKeyToMessages: Record<string, EmailMessageLike[]>;

  /** Store messages for a node. Skips write if refs are equal or shallow-equal by ref. */
  setMessages: (
    flowId: string,
    nodeId: string,
    messages: EmailMessageLike[]
  ) => void;

  /** Get messages for a node (returns a stable EMPTY reference when missing). */
  getMessages: (flowId: string, nodeId: string) => EmailMessageLike[];

  /** Clear a single node’s messages. */
  clearForNode: (flowId: string, nodeId: string) => void;

  /** Clear all nodes under a flow. */
  clearForFlow: (flowId: string) => void;

  /** Clear everything. */
  clearAll: () => void;

  /** (Optional) Selector factory for React components (no per-read allocation). */
  selectMessagesFor?: (
    flowId: string,
    nodeId: string
  ) => (s: EmailReaderOutputsState) => EmailMessageLike[];
}

// -----------------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------------

const KEY_SEPARATOR = "::" as const; // unique joiner for flow/node key

/** Stable empty array to keep getSnapshot cached & avoid re-renders. */
const EMPTY_MESSAGES: ReadonlyArray<EmailMessageLike> = Object.freeze([]);

/** Build a map key for (flowId,nodeId). */
const makeKey = (flowId: string, nodeId: string): string =>
  `${flowId}${KEY_SEPARATOR}${nodeId}`;

/** Shallow ref equality for arrays (compares element references only). */
function arrayRefShallowEqual(a: EmailMessageLike[], b: EmailMessageLike[]) {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

// -----------------------------------------------------------------------------
// Store
// -----------------------------------------------------------------------------

export const useEmailReaderOutputsStore = create<EmailReaderOutputsState>(
  (set, get) => ({
    nodeKeyToMessages: {},

    setMessages: (flowId, nodeId, messages) => {
      const key = makeKey(flowId, nodeId);
      const state = get();
      const prev = state.nodeKeyToMessages[key];

      // ⚠️ Avoid redundant writes to keep snapshots stable
      if (prev && (prev === messages || arrayRefShallowEqual(prev, messages))) {
        return; // no-op: same reference or same element refs
      }

      // Store the array AS-IS (no cloning) so reference stability is preserved downstream.
      set({
        nodeKeyToMessages: {
          ...state.nodeKeyToMessages,
          [key]: messages,
        },
      });
    },

    getMessages: (flowId, nodeId) => {
      const key = makeKey(flowId, nodeId);
      const found = get().nodeKeyToMessages[key];
      // Always return the stored reference or the stable EMPTY reference.
      return found ?? (EMPTY_MESSAGES as EmailMessageLike[]);
    },

    clearForNode: (flowId, nodeId) => {
      const key = makeKey(flowId, nodeId);
      const { nodeKeyToMessages } = get();
      if (!(key in nodeKeyToMessages)) return;

      const next = { ...nodeKeyToMessages };
      delete next[key];
      set({ nodeKeyToMessages: next });
    },

    clearForFlow: (flowId) => {
      const { nodeKeyToMessages } = get();
      const prefix = `${flowId}${KEY_SEPARATOR}`;
      let changed = false;

      const next: Record<string, EmailMessageLike[]> = {};
      for (const key of Object.keys(nodeKeyToMessages)) {
        if (key.startsWith(prefix)) {
          changed = true;
          continue;
        }
        next[key] = nodeKeyToMessages[key];
      }
      if (changed) set({ nodeKeyToMessages: next });
    },

    clearAll: () => {
      const { nodeKeyToMessages } = get();
      if (Object.keys(nodeKeyToMessages).length === 0) return; // no-op
      set({ nodeKeyToMessages: {} });
    },

    // Optional: prebuilt selector factory so components don't call methods in selectors.
    selectMessagesFor: (flowId, nodeId) => {
      const key = makeKey(flowId, nodeId);
      // Return a selector function that reads state without allocating new arrays/objects.
      return (s) =>
        s.nodeKeyToMessages[key] ?? (EMPTY_MESSAGES as EmailMessageLike[]);
    },
  })
);

// -----------------------------------------------------------------------------
// Convenience helpers (backward compatible)
// -----------------------------------------------------------------------------

export function setEmailReaderMessagesForNode(
  flowId: string,
  nodeId: string,
  messages: EmailMessageLike[]
): void {
  useEmailReaderOutputsStore.getState().setMessages(flowId, nodeId, messages);
}

export function clearEmailReaderMessagesForNode(
  flowId: string,
  nodeId: string
): void {
  useEmailReaderOutputsStore.getState().clearForNode(flowId, nodeId);
}

export function getEmailReaderMessagesForNode(
  flowId: string,
  nodeId: string
): EmailMessageLike[] {
  return useEmailReaderOutputsStore.getState().getMessages(flowId, nodeId);
}

/**
 * Optional helper for components:
 * Usage:
 *   const selector = useMemo(() => selectEmailReaderMessagesForNode(flowId, nodeId), [flowId, nodeId]);
 *   const messages = useEmailReaderOutputsStore(selector);
 */
export function selectEmailReaderMessagesForNode(
  flowId: string,
  nodeId: string
): (s: EmailReaderOutputsState) => EmailMessageLike[] {
  return useEmailReaderOutputsStore.getState().selectMessagesFor!(
    flowId,
    nodeId
  );
}
