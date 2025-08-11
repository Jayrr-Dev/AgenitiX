/**
 * Route: features/business-logic-modern/infrastructure/flow-engine/utils/useNodeDocumentsClient.ts
 * CLIENT UTILS - Node document read/write helpers for large content
 *
 * • Upload text to Convex storage via server mutation, get doc reference
 * • Fetch metadata and optional full content for node documents
 * • Small preview-first API for UI; store only references on nodes
 *
 * Keywords: large-text, storage, preview, client-utils, convex
 */

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";

export type NodeDocumentRef = {
  document_id: Id<"flow_node_documents">;
  document_size: number;
  document_checksum?: string;
  document_content_type?: string;
  document_preview: string;
};

export function useSaveNodeDocument() {
  const saveDoc = useMutation(api.manageFlowOps.saveNodeDocument);
  return async (args: {
    flowId: Id<"flows">;
    userId: Id<"users">;
    nodeId: string;
    content: string;
    contentType?: string;
  }): Promise<NodeDocumentRef> => {
    const id = await saveDoc({
      flow_id: args.flowId,
      user_id: args.userId,
      node_id: args.nodeId,
      content: args.content,
      content_type: args.contentType,
    });
    // Optimistic client-side ref info; server also stores preview
    const preview =
      args.content.length > 4000
        ? args.content.slice(0, 4000) + "…"
        : args.content;
    return {
      document_id: id,
      document_size: new TextEncoder().encode(args.content).byteLength,
      document_preview: preview,
    };
  };
}

export function useNodeDocumentMeta(
  flowId: Id<"flows">,
  userId: Id<"users">,
  nodeId: string
) {
  return useQuery(api.manageFlowOps.getNodeDocument, {
    flow_id: flowId,
    user_id: userId,
    node_id: nodeId,
    include_content: false,
  });
}

export function useNodeDocumentContent(
  flowId: Id<"flows">,
  userId: Id<"users">,
  nodeId: string
) {
  return useQuery(api.manageFlowOps.getNodeDocument, {
    flow_id: flowId,
    user_id: userId,
    node_id: nodeId,
    include_content: true,
  });
}
