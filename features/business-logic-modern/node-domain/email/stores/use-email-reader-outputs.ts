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

// Use a generic record shape to avoid tight coupling with provider types
export type EmailMessageLike = Record<string, unknown>;

interface EmailReaderOutputsState {
  // (flowId::nodeId) → messages
  nodeKeyToMessages: Record<string, EmailMessageLike[]>;
  setMessages: (
    flowId: string,
    nodeId: string,
    messages: EmailMessageLike[]
  ) => void;
  getMessages: (flowId: string, nodeId: string) => EmailMessageLike[];
  clearForNode: (flowId: string, nodeId: string) => void;
  clearForFlow: (flowId: string) => void;
  clearAll: () => void;
}

// -----------------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------------

const KEY_SEPARATOR = "::" as const; // [Explanation], basically unique joiner for flow/node key

const makeKey = (flowId: string, nodeId: string): string =>
  `${flowId}${KEY_SEPARATOR}${nodeId}`;

// -----------------------------------------------------------------------------
// Store
// -----------------------------------------------------------------------------

export const useEmailReaderOutputsStore = create<EmailReaderOutputsState>(
  (set, get) => ({
    nodeKeyToMessages: {},

    setMessages: (flowId, nodeId, messages) => {
      const key = makeKey(flowId, nodeId);
      set((state) => ({
        nodeKeyToMessages: {
          ...state.nodeKeyToMessages,
          [key]: messages,
        },
      }));
    },

    getMessages: (flowId, nodeId) => {
      const key = makeKey(flowId, nodeId);
      return get().nodeKeyToMessages[key] || [];
    },

    clearForNode: (flowId, nodeId) => {
      const key = makeKey(flowId, nodeId);
      set((state) => {
        const next = { ...state.nodeKeyToMessages };
        delete next[key];
        return { nodeKeyToMessages: next };
      });
    },

    clearForFlow: (flowId) => {
      set((state) => {
        const next: Record<string, EmailMessageLike[]> = {};
        const prefix = `${flowId}${KEY_SEPARATOR}`;
        for (const key of Object.keys(state.nodeKeyToMessages)) {
          if (!key.startsWith(prefix)) next[key] = state.nodeKeyToMessages[key];
        }
        return { nodeKeyToMessages: next };
      });
    },

    clearAll: () => set({ nodeKeyToMessages: {} }),
  })
);

// -----------------------------------------------------------------------------
// Convenience helpers
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
