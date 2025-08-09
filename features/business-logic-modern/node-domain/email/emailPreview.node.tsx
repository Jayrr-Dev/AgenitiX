"use client";
/**
 * EmailPreview NODE – Content‑focused, schema‑driven, type‑safe
 *
 * • Shows only internal layout; the scaffold provides borders, sizing, theming, and interactivity.
 * • Zod schema auto‑generates type‑checked Inspector controls.
 * • Dynamic sizing (expandedSize / collapsedSize) drives the spec.
 * • Output propagation is gated by `isActive` *and* `isEnabled` to prevent runaway loops.
 * • Uses findEdgeByHandle utility for robust React Flow edge handling.
 * • Auto-disables when all input connections are removed (handled by flow store).
 * • Code is fully commented and follows current React + TypeScript best practices.
 *
 * Keywords: email-preview, schema-driven, type‑safe, clean‑architecture
 */

import type { NodeProps } from "@xyflow/react";
import React, {
  ChangeEvent,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { z } from "zod";

import { ExpandCollapseButton } from "@/components/nodes/ExpandCollapseButton";
import LabelNode from "@/components/nodes/labelNode";
import { findEdgeByHandle } from "@/features/business-logic-modern/infrastructure/flow-engine/utils/edgeUtils";
import type { NodeSpec } from "@/features/business-logic-modern/infrastructure/node-core/NodeSpec";
import { normalizeHandleId } from "@/features/business-logic-modern/infrastructure/node-core/handleOutputUtils";
import { renderLucideIcon } from "@/features/business-logic-modern/infrastructure/node-core/iconUtils";
import {
  SafeSchemas,
  createSafeInitialData,
} from "@/features/business-logic-modern/infrastructure/node-core/schema-helpers";
import { useNodeFeatureFlag } from "@/features/business-logic-modern/infrastructure/node-core/useNodeFeatureFlag";
import {
  createNodeValidator,
  reportValidationError,
  useNodeDataValidation,
} from "@/features/business-logic-modern/infrastructure/node-core/validation";
import { withNodeScaffold } from "@/features/business-logic-modern/infrastructure/node-core/withNodeScaffold";
import { CATEGORIES } from "@/features/business-logic-modern/infrastructure/theming/categories";
import {
  COLLAPSED_SIZES,
  EXPANDED_SIZES,
} from "@/features/business-logic-modern/infrastructure/theming/sizing";
import { useNodeData } from "@/hooks/useNodeData";
import { useReactFlow, useStore } from "@xyflow/react";

// -----------------------------------------------------------------------------
// 1️⃣  Data schema & validation
// -----------------------------------------------------------------------------

export const EmailPreviewDataSchema = z
  .object({
    store: SafeSchemas.text("Default text"),
    isEnabled: SafeSchemas.boolean(true),
    isActive: SafeSchemas.boolean(false),
    isExpanded: SafeSchemas.boolean(false),
    output: SafeSchemas.optionalText(),
    // Email preview specific (from connected source)
    lastError: z.string().default(""),
    emails: z.array(z.record(z.string(), z.unknown())).default([]),
    selectedIndex: z.number().int().min(0).default(0),
    expandedSize: SafeSchemas.text("FE2"),
    collapsedSize: SafeSchemas.text("C2"),
    label: z.string().optional(), // User-editable node label
  })
  .passthrough();

export type EmailPreviewData = z.infer<typeof EmailPreviewDataSchema>;

const validateNodeData = createNodeValidator(
  EmailPreviewDataSchema,
  "EmailPreview"
);

// -----------------------------------------------------------------------------
// 2️⃣  Constants
// -----------------------------------------------------------------------------

const CATEGORY_TEXT = {
  EMAIL: {
    primary: "text-[--node--e-m-a-i-l-text]",
  },
} as const;

const CONTENT = {
  expanded: "p-4 w-full h-full flex flex-col",
  collapsed: "flex items-center justify-center w-full h-full",
  header: "flex items-center justify-between mb-3",
  body: "flex-1 flex items-center justify-center",
  disabled:
    "opacity-75 bg-zinc-100 dark:bg-zinc-500 rounded-md transition-all duration-300",
} as const;

// Centralized UI classes for maintainability
const UI_STYLES = {
  select:
    "h-6 text-[10px] border border-[--node-email-border] bg-[--node-email-bg] text-[--node-email-text] rounded-md px-2 focus:ring-1 focus:ring-[--node-email-border-hover] focus:border-[--node-email-border-hover] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200",
  input:
    "h-6 text-[10px] border border-[--node-email-border] bg-[--node-email-bg] text-[--node-email-text] rounded-md px-2 focus:ring-1 focus:ring-[--node-email-border-hover] focus:border-[--node-email-border-hover]",
  textarea:
    "w-full h-24 resize-none nowheel bg-background rounded-md p-2 text-[10px] overflow-y-auto focus:outline-none focus:ring-1 focus:ring-[--node-email-border-hover] border border-[--node-email-border] text-[--node-email-text]",
  button:
    "h-6 rounded-md border border-[--node-email-border] bg-transparent text-[--node-email-text] text-[10px] font-medium hover:bg-[--node-email-bg-hover] disabled:cursor-not-allowed disabled:opacity-50 transition-all inline-flex items-center justify-center px-2",
  iframeWrap:
    "flex-1 min-h-24 rounded-md border border-[--node-email-border] overflow-hidden bg-white",
  label: "text-[--node-email-text] text-[10px] font-medium",
  row: "flex items-center gap-2",
} as const;

const VIEW_STYLES = {
  panel:
    "flex-1 rounded-md border border-[--node-email-border] bg-white dark:bg-[--node-email-bg] p-3 overflow-auto min-h-28",
  subject: "text-[13px] font-semibold text-black dark:text-[--node-email-text]",
  meta: "text-[11px] text-zinc-600 dark:text-[--node-email-text-secondary]",
  divider: "my-3 h-px bg-zinc-200 dark:bg-[--node-email-border]",
  body: "text-[12px] whitespace-pre-wrap text-black dark:text-[--node-email-text] leading-[1.35]",
} as const;

// Collapsed summary view styles, basically compact, high-contrast rows
const COLLAPSED_SUMMARY_STYLES = {
  wrap: "w-full h-full px-2 py-1 flex flex-col justify-center gap-1 text-[10px] text-foreground/90",
  navRow:
    "w-full flex items-center justify-between gap-1 text-[11px] font-medium",
  arrowBtn:
    "h-5 w-5 inline-flex items-center justify-center rounded border border-[--node-email-border] bg-[--node-email-bg] text-[--node-email-text] hover:bg-[--node-email-bg-hover] disabled:opacity-40 disabled:cursor-not-allowed",
  title: "px-1 text-[11px]",
  row: "flex items-center gap-1",
  key: "min-w-[54px] text-muted-foreground",
  val: "truncate max-w-[120px]",
} as const;

/**
 * Formats a date-like input to dd/mm/yy using the en-GB locale.
 * [Explanation], basically normalize varied date strings to a compact UI-friendly form
 */
function formatDateToDDMMYY(input: unknown): string {
  if (!input) return "";
  try {
    const d = new Date(String(input));
    if (Number.isNaN(d.getTime())) return String(input);
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    }).format(d);
  } catch {
    return String(input);
  }
}

// Immutable empty emails constant, basically to avoid re-creating arrays
const EMPTY_EMAILS: ReadonlyArray<Record<string, unknown>> = Object.freeze([]);

// -----------------------------------------------------------------------------
// 3️⃣  Dynamic spec factory (pure)
// -----------------------------------------------------------------------------

/**
 * Builds a NodeSpec whose size keys can change at runtime via node data.
 */
function createDynamicSpec(data: EmailPreviewData): NodeSpec {
  const expanded =
    EXPANDED_SIZES[data.expandedSize as keyof typeof EXPANDED_SIZES] ??
    EXPANDED_SIZES.FE2;
  const collapsed =
    COLLAPSED_SIZES[data.collapsedSize as keyof typeof COLLAPSED_SIZES] ??
    COLLAPSED_SIZES.C2;

  return {
    kind: "emailPreview",
    displayName: "EmailPreview",
    label: "EmailPreview",
    category: CATEGORIES.EMAIL,
    size: { expanded, collapsed },
    handles: [
      {
        id: "emails-input",
        code: "a",
        position: "left",
        type: "target",
        dataType: "Array",
      },
      {
        id: "output",
        code: "s",
        position: "right",
        type: "source",
        dataType: "String",
      },
    ],
    inspector: { key: "EmailPreviewInspector" },
    version: 1,
    runtime: { execute: "emailPreview_execute_v1" },
    initialData: createSafeInitialData(EmailPreviewDataSchema, {
      store: "Default text",
      output: "",
      lastError: "",
      emails: [],
      selectedIndex: 0,
    }),
    dataSchema: EmailPreviewDataSchema,
    controls: {
      autoGenerate: true,
      excludeFields: [
        "isActive",
        "output",
        "lastError",
        "emails",
        "selectedIndex",
        "expandedSize",
        "collapsedSize",
      ],
      customFields: [
        { key: "isEnabled", type: "boolean", label: "Enable" },
        {
          key: "store",
          type: "textarea",
          label: "Store",
          placeholder: "Enter your content here…",
          ui: { rows: 4 },
        },
        { key: "isExpanded", type: "boolean", label: "Expand" },
      ],
    },
    icon: "LuMail",
    author: "Agenitix Team",
    description: "EmailPreview node for email operations",
    feature: "email",
    tags: ["email", "emailPreview"],
    featureFlag: {
      flag: "test",
      fallback: true,
      disabledMessage: "This emailPreview node is currently disabled",
      hideWhenDisabled: false,
    },
    theming: {},
  };
}

/** Static spec for registry (uses default size keys) */
export const spec: NodeSpec = createDynamicSpec({
  expandedSize: "FE2",
  collapsedSize: "C2",
} as EmailPreviewData);

// -----------------------------------------------------------------------------
// 4️⃣  React component – data propagation & rendering
// -----------------------------------------------------------------------------

const EmailPreviewNode = memo(
  ({ id, data, spec }: NodeProps & { spec: NodeSpec }) => {
    // -------------------------------------------------------------------------
    // 4.1  Sync with React‑Flow store
    // -------------------------------------------------------------------------
    const { nodeData, updateNodeData } = useNodeData(id, data);

    // -------------------------------------------------------------------------
    // 4.2  Derived state
    // -------------------------------------------------------------------------
    const { isExpanded, isEnabled, isActive, store } =
      nodeData as EmailPreviewData;

    // 4.2  Global React‑Flow store – subscribe only to edges touching this node
    const edges = useStore(
      (s) => s.edges.filter((e) => e.source === id || e.target === id),
      (a, b) => {
        if (a === b) return true;
        if (a.length !== b.length) return false;
        const aIds = a.map((e) => e.id).join("|");
        const bIds = b.map((e) => e.id).join("|");
        return aIds === bIds;
      }
    );
    const { getNodes } = useReactFlow();

    // Subscribe to upstream value changes feeding into `emails-input`
    // This creates a compact signature of the connected source node's relevant outputs
    // so effects can react when inputs change (without subscribing to all nodes)
    const inputSignature = useStore(
      (s) => {
        const edge = findEdgeByHandle(s.edges, id, "emails-input");
        if (!edge) return "no-edge";
        const src = (s.nodes as Array<{ id: string; data?: unknown }>).find(
          (n) => n.id === edge.source
        );
        if (!src) return "no-src";
        const data = (src.data ?? {}) as Record<string, unknown>;
        // Only include keys that can influence the derived emails array
        const compact = {
          output: data.output,
          messages: data.messages,
          emailsOutput: data.emailsOutput,
          store: data.store,
        };
        try {
          return JSON.stringify(compact);
        } catch {
          // Fallback to a simple marker if serialization fails for any reason
          return `sig-${src.id}`;
        }
      },
      (a, b) => a === b
    );

    // keep last emitted output to avoid redundant writes
    const lastOutputRef = useRef<string | null>(null);

    const categoryStyles = CATEGORY_TEXT.EMAIL;

    // Local UI state (client-only)
    const [isRendering] = useState<boolean>(false);

    // -------------------------------------------------------------------------
    // 4.3  Feature flag evaluation (after all hooks)
    // -------------------------------------------------------------------------
    const flagState = useNodeFeatureFlag(spec.featureFlag);

    // -------------------------------------------------------------------------
    // 4.4  Callbacks
    // -------------------------------------------------------------------------

    /** Toggle between collapsed / expanded */
    const toggleExpand = useCallback(() => {
      updateNodeData({ isExpanded: !isExpanded });
    }, [isExpanded, updateNodeData]);

    /** Propagate output ONLY when node is active AND enabled */
    const propagate = useCallback(
      (value: string) => {
        const shouldSend = isActive && isEnabled;
        const out = shouldSend ? value : null;
        if (out !== lastOutputRef.current) {
          lastOutputRef.current = out;
          updateNodeData({ output: out });
        }
      },
      [isActive, isEnabled, updateNodeData]
    );

    /** Clear JSON‑ish fields when inactive or disabled */
    const blockJsonWhenInactive = useCallback(() => {
      if (!isActive || !isEnabled) {
        updateNodeData({
          json: null,
          data: null,
          payload: null,
          result: null,
          response: null,
        });
      }
    }, [isActive, isEnabled, updateNodeData]);

    /**
     * Compute the latest text coming from connected input handles.
     *
     * Uses findEdgeByHandle utility to properly handle React Flow's handle naming
     * conventions (handles get type suffixes like "json-input__j", "input__b").
     *
     * Priority: json-input > input (modify based on your node's specific handles)
     */
    const computeInput = useCallback((): string | null => {
      const inputEdge = findEdgeByHandle(edges, id, "input");
      if (!inputEdge) return null;
      const src = (getNodes() as any[]).find((n) => n.id === inputEdge.source);
      if (!src) return null;
      const inputValue = src.data?.output ?? src.data?.store ?? src.data;
      return typeof inputValue === "string"
        ? inputValue
        : String(inputValue || "");
    }, [edges, id, getNodes]);

    // Extract emails array from 'emails-input' when connected
    const computeEmailsArray = useCallback((): Array<
      Record<string, unknown>
    > => {
      const edge = findEdgeByHandle(edges, id, "emails-input");
      if (!edge) return [];
      const src = (getNodes() as any[]).find((n) => n.id === edge.source);
      if (!src) return [];
      const srcData: any = src.data || {};

      // Primary: handle-based outputs
      if (srcData?.output && typeof srcData.output === "object") {
        if (edge.sourceHandle) {
          const h = normalizeHandleId(edge.sourceHandle);
          const v = srcData.output[h];
          if (Array.isArray(v)) return v as Array<Record<string, unknown>>;
          if (typeof v === "string") {
            try {
              const parsed = JSON.parse(v);
              if (Array.isArray(parsed))
                return parsed as Array<Record<string, unknown>>;
            } catch {}
          }
        }
        // fallback: first array value within output map
        const firstArray = Object.values(srcData.output).find((v: unknown) =>
          Array.isArray(v)
        );
        if (Array.isArray(firstArray))
          return firstArray as Array<Record<string, unknown>>;
        const firstJson = Object.values(srcData.output).find(
          (v: unknown) => typeof v === "string"
        );
        if (typeof firstJson === "string") {
          try {
            const parsed = JSON.parse(firstJson);
            if (Array.isArray(parsed))
              return parsed as Array<Record<string, unknown>>;
          } catch {}
        }
      }

      // Secondary: common fields exposed by upstream nodes
      const value =
        srcData.messages ?? srcData.emailsOutput ?? srcData.store ?? srcData;
      if (Array.isArray(value)) return value as Array<Record<string, unknown>>;
      if (typeof value === "string") {
        try {
          const parsed = JSON.parse(value);
          if (Array.isArray(parsed))
            return parsed as Array<Record<string, unknown>>;
        } catch {}
      }
      if (value && typeof value === "object") {
        const firstArray = Object.values(value).find((v: unknown) =>
          Array.isArray(v)
        );
        if (Array.isArray(firstArray))
          return firstArray as Array<Record<string, unknown>>;
      }
      return [];
    }, [edges, id, getNodes]);

    // Selected email normalization for display
    const getSelectedEmail = useCallback(() => {
      const dataRef = nodeData as EmailPreviewData;
      const emails = Array.isArray(dataRef.emails) ? dataRef.emails : [];
      const idx = Math.min(
        Math.max(0, dataRef.selectedIndex ?? 0),
        Math.max(0, emails.length - 1)
      );
      const item = emails[idx] as Record<string, any> | undefined;
      if (!item) return null;
      let inner: any = item;
      if (item && typeof item === "object") {
        const keys = Object.keys(item);
        if (
          keys.length === 1 &&
          /^(Email\s*\d+|email\s*\d+)$/i.test(keys[0]) &&
          typeof (item as any)[keys[0]] === "object"
        ) {
          inner = (item as any)[keys[0]];
        }
      }
      if (inner && typeof inner === "object") {
        // Normalize from field
        let fromStr = "";
        const from = (inner as any).From ?? (inner as any).from;
        if (typeof from === "string") fromStr = from;
        else if (from && typeof from === "object") {
          const nm = (from as any).name || "";
          const em = (from as any).email || "";
          fromStr = `${nm}${nm && em ? " " : ""}${em ? `<${em}>` : ""}`.trim();
        }

        // Derive attachmentsCount from common fields
        // [Explanation], basically count attachments across typical shapes
        let attachmentsCount = 0;
        const attachmentsRaw =
          (inner as any).Attachments ??
          (inner as any).attachments ??
          (inner as any).files ??
          (inner as any).attachmentsList;
        if (Array.isArray(attachmentsRaw)) {
          attachmentsCount = attachmentsRaw.length;
        } else if (typeof attachmentsRaw === "string") {
          try {
            const parsed = JSON.parse(attachmentsRaw);
            if (Array.isArray(parsed)) attachmentsCount = parsed.length;
          } catch {
            const maybeNum = Number.parseInt(attachmentsRaw, 10);
            if (Number.isFinite(maybeNum))
              attachmentsCount = Math.max(0, maybeNum);
          }
        } else if (attachmentsRaw && typeof attachmentsRaw === "object") {
          const values = Object.values(
            attachmentsRaw as Record<string, unknown>
          );
          const firstArray = values.find((v) => Array.isArray(v));
          if (Array.isArray(firstArray))
            attachmentsCount = firstArray.length as number;
        }
        const attachmentsCountAlt =
          (inner as any).filesCount ??
          (inner as any).attachmentCount ??
          (inner as any).attachmentsCount;
        if (typeof attachmentsCountAlt === "number") {
          attachmentsCount = Math.max(attachmentsCount, attachmentsCountAlt);
        } else if (typeof attachmentsCountAlt === "string") {
          const n = Number.parseInt(attachmentsCountAlt, 10);
          if (Number.isFinite(n))
            attachmentsCount = Math.max(attachmentsCount, n);
        }
        const hasAttachments = (inner as any).hasAttachments;
        if (attachmentsCount === 0 && typeof hasAttachments === "boolean") {
          attachmentsCount = hasAttachments ? 1 : 0;
        }

        // Derive isRead from common flags/fields
        // [Explanation], basically infer read/unread from booleans, labels, or status
        let isRead = false;
        const readField =
          (inner as any).isRead ??
          (inner as any).read ??
          (inner as any).seen ??
          (inner as any).isSeen ??
          (inner as any).Read ??
          (inner as any).Seen;
        if (typeof readField === "boolean") {
          isRead = readField;
        } else if (typeof readField === "string") {
          const s = readField.toLowerCase();
          if (s === "true" || s === "read" || s === "seen") isRead = true;
          if (s === "false" || s === "unread" || s === "unseen") isRead = false;
        }
        const labels =
          (inner as any).flags ??
          (inner as any).labelIds ??
          (inner as any).Labels ??
          (inner as any).labels;
        if (Array.isArray(labels)) {
          const tokens = labels
            .map((v: unknown) => (typeof v === "string" ? v.toLowerCase() : ""))
            .join(" ");
          if (/(^|\s)unread(\s|$)/.test(tokens) || /(\\)?unseen/.test(tokens)) {
            isRead = false;
          } else if (
            /(\\)?seen/.test(tokens) ||
            /(^|\s)read(\s|$)/.test(tokens)
          ) {
            isRead = true;
          }
        }
        const status = (inner as any).status;
        if (typeof status === "string") {
          const s = status.toLowerCase();
          if (s.includes("unread")) isRead = false;
          else if (s.includes("read")) isRead = true;
        }
        return {
          subject: inner.Subject || inner.subject || "",
          from: fromStr,
          date: inner.Date || inner.date || "",
          preview: inner.Preview || inner.snippet || "",
          content: inner.Content || inner.textContent || inner.snippet || "",
          attachmentsCount,
          isRead,
        } as {
          subject: string;
          from: string;
          date: string;
          preview: string;
          content: string;
          attachmentsCount: number;
          isRead: boolean;
        };
      }
      return null;
    }, [nodeData]);

    // Safe string conversion for mixed inputs
    const toSafeString = useCallback((value: unknown): string => {
      if (value === null || value === undefined) return "";
      return typeof value === "string" ? value : String(value);
    }, []);

    // Decode common HTML entities and numeric references
    // [Explanation], basically convert things like &#39; &amp; &lt; into their characters
    const decodeHtmlEntities = useCallback(
      (raw: unknown): string => {
        const text = toSafeString(raw);
        if (!text) return "";
        const named: Record<string, string> = {
          "&quot;": '"',
          "&apos;": "'",
          "&#39;": "'",
          "&amp;": "&",
          "&lt;": "<",
          "&gt;": ">",
          "&nbsp;": " ",
        };
        let out = text.replace(
          /&(quot|apos|amp|lt|gt|nbsp);|&#39;/g,
          (m) => named[m] ?? m
        );
        out = out.replace(/&#x([0-9a-fA-F]+);/g, (_, hex: string) => {
          try {
            return String.fromCodePoint(parseInt(hex, 16));
          } catch {
            return _ as string;
          }
        });
        out = out.replace(/&#([0-9]+);/g, (_, dec: string) => {
          try {
            return String.fromCodePoint(parseInt(dec, 10));
          } catch {
            return _ as string;
          }
        });
        return out;
      },
      [toSafeString]
    );

    // Linkify content (safe – no dangerouslySetInnerHTML)
    const linkify = useCallback(
      (raw: unknown) => {
        const text = toSafeString(raw);
        const nodes: Array<string | React.ReactNode> = [];
        if (!text) return nodes;
        const urlRegex =
          /(https?:\/\/[\w.-]+(?:\/[\w\-._~:\/?#[\]@!$&'()*+,;=%]*)?)/g;
        let lastIndex = 0;
        let match: RegExpExecArray | null;
        while ((match = urlRegex.exec(text)) !== null) {
          const [url] = match;
          const start = match.index;
          if (start > lastIndex) {
            nodes.push(text.slice(lastIndex, start));
          }
          nodes.push(
            <a
              key={`${start}-${url}`}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline"
            >
              {url}
            </a>
          );
          lastIndex = start + url.length;
        }
        if (lastIndex < text.length) {
          nodes.push(text.slice(lastIndex));
        }
        return nodes;
      },
      [toSafeString]
    );

    /** Handle textarea change (memoised for perf) */
    const handleStoreChange = useCallback(
      (e: ChangeEvent<HTMLTextAreaElement>) => {
        updateNodeData({ store: e.target.value });
      },
      [updateNodeData]
    );

    // No server render – this node only previews source emails

    // -------------------------------------------------------------------------
    // 4.5  Effects
    // -------------------------------------------------------------------------

    /* 🔄 Whenever nodes/edges change, recompute emails with deep change detection. */
    const lastEmailsJsonRef = useRef<string>("[]");
    useEffect(() => {
      const emails = computeEmailsArray();
      const safeEmails = Array.isArray(emails) ? emails : EMPTY_EMAILS;
      const nextJson = JSON.stringify(safeEmails);
      if (nextJson !== lastEmailsJsonRef.current) {
        lastEmailsJsonRef.current = nextJson;
        updateNodeData({ emails: safeEmails as any });
      }
    }, [computeEmailsArray, updateNodeData, inputSignature]);

    /* 🧹 If the emails-input edge is removed, clear preview state */
    useEffect(() => {
      const stillConnected = !!findEdgeByHandle(edges, id, "emails-input");
      if (!stillConnected) {
        lastEmailsJsonRef.current = "[]";
        updateNodeData({ emails: [], selectedIndex: 0 });
      }
    }, [edges, id, updateNodeData]);

    // Always enabled per request
    useEffect(() => {
      if (!isEnabled) updateNodeData({ isEnabled: true });
    }, [isEnabled, updateNodeData]);

    // Monitor selected email content and update active state
    useEffect(() => {
      const selected = getSelectedEmail();
      const content = selected?.content || "";
      const hasValidStore = content.trim().length > 0;

      // If disabled, always set isActive to false
      if (!isEnabled) {
        if (isActive) updateNodeData({ isActive: false });
      } else if (isActive !== hasValidStore) {
        updateNodeData({ isActive: hasValidStore });
      }
    }, [getSelectedEmail, isEnabled, isActive, updateNodeData]);

    // Sync output with active and enabled state – emit selected email JSON
    useEffect(() => {
      const selected = getSelectedEmail();
      if (selected) propagate(JSON.stringify(selected, null, 2));
      blockJsonWhenInactive();
    }, [propagate, blockJsonWhenInactive, getSelectedEmail]);

    // No template fetching needed – previews come only from connected emails

    // -------------------------------------------------------------------------
    // 4.6  Validation
    // -------------------------------------------------------------------------
    const validation = validateNodeData(nodeData);
    if (!validation.success) {
      reportValidationError("EmailPreview", id, validation.errors, {
        originalData: validation.originalData,
        component: "EmailPreviewNode",
      });
    }

    useNodeDataValidation(
      EmailPreviewDataSchema,
      "EmailPreview",
      validation.data,
      id
    );

    // -------------------------------------------------------------------------
    // 4.7  Feature flag conditional rendering
    // -------------------------------------------------------------------------

    // If flag is loading, show loading state
    if (flagState.isLoading) {
      return (
        <div className="flex items-center justify-center p-4 text-sm text-muted-foreground">
          Loading emailPreview feature...
        </div>
      );
    }

    // If flag is disabled and should hide, return null
    if (!flagState.isEnabled && flagState.hideWhenDisabled) {
      return null;
    }

    // If flag is disabled, show disabled message
    if (!flagState.isEnabled) {
      return (
        <div className="flex items-center justify-center p-4 text-sm text-muted-foreground border border-dashed border-muted-foreground/20 rounded-lg">
          {flagState.disabledMessage}
        </div>
      );
    }

    // -------------------------------------------------------------------------
    // 4.8  Render
    // -------------------------------------------------------------------------
    // Basic styles
    return (
      <>
        {/* Editable label or icon */}
        {!isExpanded &&
        spec.size.collapsed.width === 60 &&
        spec.size.collapsed.height === 60 ? (
          <div className="absolute inset-0 flex justify-center text-lg p-1 text-foreground/80">
            {spec.icon && renderLucideIcon(spec.icon, "", 16)}
          </div>
        ) : (
          <LabelNode
            nodeId={id}
            label={(nodeData as EmailPreviewData).label || spec.displayName}
          />
        )}

        {!isExpanded ? (
          <div
            className={`${CONTENT.collapsed} ${!isEnabled ? CONTENT.disabled : ""}`}
          >
            {(() => {
              const emailsArr = (nodeData as EmailPreviewData).emails || [];
              const count = emailsArr.length;
              const currentIndex = Math.min(
                Math.max(0, (nodeData as EmailPreviewData).selectedIndex || 0),
                Math.max(0, count - 1)
              );
              const sel = getSelectedEmail();

              // Handlers
              // [Explanation], basically update the selected email index within bounds
              const goPrev = () => {
                if (currentIndex > 0)
                  updateNodeData({ selectedIndex: currentIndex - 1 });
              };
              const goNext = () => {
                if (currentIndex < count - 1)
                  updateNodeData({ selectedIndex: currentIndex + 1 });
              };

              return (
                <div className={COLLAPSED_SUMMARY_STYLES.wrap}>
                  <div className={COLLAPSED_SUMMARY_STYLES.navRow}>
                    <button
                      type="button"
                      className={COLLAPSED_SUMMARY_STYLES.arrowBtn}
                      onClick={goPrev}
                      disabled={!isEnabled || count <= 1 || currentIndex === 0}
                      aria-label="Previous email"
                    >
                      {"<"}
                    </button>
                    <div className={COLLAPSED_SUMMARY_STYLES.title}>{`Email ${
                      count > 0 ? currentIndex + 1 : 0
                    }`}</div>
                    <button
                      type="button"
                      className={COLLAPSED_SUMMARY_STYLES.arrowBtn}
                      onClick={goNext}
                      disabled={
                        !isEnabled || count <= 1 || currentIndex >= count - 1
                      }
                      aria-label="Next email"
                    >
                      {">"}
                    </button>
                  </div>

                  {count === 0 || !sel ? (
                    <div className="text-[10px] text-muted-foreground text-center mt-1">
                      Connect emails to preview
                    </div>
                  ) : (
                    <div className="mt-1 flex flex-col gap-0">
                      <div className={COLLAPSED_SUMMARY_STYLES.row}>
                        {/* <span className={COLLAPSED_SUMMARY_STYLES.key}>
                          Fr:
                        </span> */}
                        <span
                          className={`${COLLAPSED_SUMMARY_STYLES.val} ${categoryStyles.primary}`}
                        >
                          {decodeHtmlEntities(sel.from || "")}
                        </span>
                      </div>
                      <div className={COLLAPSED_SUMMARY_STYLES.row}>
                        {/* <span className={COLLAPSED_SUMMARY_STYLES.key}>
                          Sub:
                        </span> */}
                        <span
                          className={`${COLLAPSED_SUMMARY_STYLES.val} ${categoryStyles.primary}`}
                        >
                          {decodeHtmlEntities(sel.subject || "")}
                        </span>
                      </div>
                      <div className={COLLAPSED_SUMMARY_STYLES.row}>
                        {/* <span className={COLLAPSED_SUMMARY_STYLES.key}>
                          Date:
                        </span> */}
                        <span className={COLLAPSED_SUMMARY_STYLES.val}>
                          {formatDateToDDMMYY(sel.date || "")}
                        </span>
                      </div>
                      <div className={COLLAPSED_SUMMARY_STYLES.row}>
                        {/* <span className={COLLAPSED_SUMMARY_STYLES.key}>
                          Read:
                        </span> */}
                        <span className={COLLAPSED_SUMMARY_STYLES.val}>
                          {sel.isRead ? "Yes" : "No"}
                        </span>
                      </div>
                      <div className={COLLAPSED_SUMMARY_STYLES.row}>
                        {/* <span className={COLLAPSED_SUMMARY_STYLES.key}>
                          Attachment:
                        </span> */}
                        <span className={COLLAPSED_SUMMARY_STYLES.val}>
                          {Math.max(0, sel.attachmentsCount ?? 0)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        ) : (
          <div
            className={`${CONTENT.expanded} ${!isEnabled ? CONTENT.disabled : ""}`}
          >
            <div className="flex flex-col gap-2">
              {(nodeData as EmailPreviewData).lastError && (
                <div className="text-[10px] text-red-600">
                  {(nodeData as EmailPreviewData).lastError}
                </div>
              )}

              {/* Email viewer */}
              {(() => {
                const sel = getSelectedEmail();
                if (!sel) {
                  // also show raw snapshot to help debug wiring
                  const raw = (nodeData as EmailPreviewData).emails;
                  return (
                    <div className={VIEW_STYLES.panel}>
                      <div className={VIEW_STYLES.meta}>
                        Connect an emails array to preview.
                      </div>
                      {Array.isArray(raw) && raw.length > 0 && (
                        <pre className="mt-2 text-[10px] text-zinc-500 whitespace-pre-wrap">
                          {JSON.stringify(raw[0], null, 2)}
                        </pre>
                      )}
                    </div>
                  );
                }
                return (
                  <div className={VIEW_STYLES.panel}>
                    <div className={VIEW_STYLES.subject}>
                      {decodeHtmlEntities(sel.subject || "(No subject)")}
                    </div>
                    <div className={VIEW_STYLES.meta}>
                      {`From: ${decodeHtmlEntities(sel.from || "(Unknown)")}`}
                      {sel.date
                        ? ` · Date: ${decodeHtmlEntities(sel.date)}`
                        : ""}
                    </div>
                    <div className={VIEW_STYLES.meta}>
                      {`Attachments#: ${Math.max(0, sel.attachmentsCount ?? 0)} · ${sel.isRead ? "Read" : "Unread"}`}
                    </div>
                    {sel.preview && (
                      <div className={VIEW_STYLES.meta}>
                        {decodeHtmlEntities(sel.preview)}
                      </div>
                    )}
                    <div className={VIEW_STYLES.divider} />
                    <div className={VIEW_STYLES.body}>
                      {linkify(
                        decodeHtmlEntities(sel.content || "(No content)")
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* When emails array is connected, show a selector to preview one */}
              {((nodeData as EmailPreviewData).emails?.length ?? 0) > 0 && (
                <div className="flex items-center justify-between gap-2 mt-2">
                  <label className={UI_STYLES.label}>Select Email</label>
                  <div className="flex items-center gap-2">
                    <select
                      className={UI_STYLES.select}
                      value={(nodeData as EmailPreviewData).selectedIndex}
                      onChange={(e) => {
                        const idx = Number.parseInt(e.target.value, 10) || 0;
                        updateNodeData({ selectedIndex: idx });
                      }}
                    >
                      {((nodeData as EmailPreviewData).emails || []).map(
                        (_, i) => (
                          <option key={i} value={i}>{`Email ${i + 1}`}</option>
                        )
                      )}
                    </select>
                    <span className={VIEW_STYLES.meta}>
                      {((nodeData as EmailPreviewData).emails || []).length}{" "}
                      total
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <ExpandCollapseButton
          showUI={isExpanded}
          onToggle={toggleExpand}
          size="sm"
        />
      </>
    );
  }
);

// -----------------------------------------------------------------------------
// 5️⃣  High‑order wrapper – inject scaffold with dynamic spec
// -----------------------------------------------------------------------------

/**
 * ⚠️ THIS is the piece that fixes the focus‑loss issue.
 *
 * `withNodeScaffold` returns a *component function*.  Re‑creating that function
 * on every keystroke causes React to unmount / remount the subtree (and your
 * textarea loses focus).  We memoise the scaffolded component so its identity
 * stays stable across renders unless the *spec itself* really changes.
 */
const EmailPreviewNodeWithDynamicSpec = (props: NodeProps) => {
  const { nodeData } = useNodeData(props.id, props.data);

  // Recompute spec only when the size keys change
  const { expandedSize, collapsedSize } = nodeData as EmailPreviewData;
  const dynamicSpec = useMemo(
    () =>
      createDynamicSpec({ expandedSize, collapsedSize } as EmailPreviewData),
    [expandedSize, collapsedSize]
  );

  // Memoise the scaffolded component to keep focus
  const ScaffoldedNode = useMemo(
    () =>
      withNodeScaffold(dynamicSpec, (p) => (
        <EmailPreviewNode {...p} spec={dynamicSpec} />
      )),
    [dynamicSpec]
  );

  return <ScaffoldedNode {...props} />;
};

export default EmailPreviewNodeWithDynamicSpec;
