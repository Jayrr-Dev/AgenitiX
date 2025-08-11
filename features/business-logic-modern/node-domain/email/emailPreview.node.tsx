"use client";
/**
 * EmailPreview NODE – Pure inbox UI with TanStack Virtual
 * Collapsed state shows virtualized email inbox like Outlook
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
import { Badge } from "@/components/ui/badge";
import { useFlowMetadataOptional } from "@/features/business-logic-modern/infrastructure/flow-engine/contexts/flow-metadata-context";
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
import { useStore } from "@xyflow/react";
import { MdAttachFile } from "react-icons/md";
import { shallow } from "zustand/shallow";
import { VirtualizedEmailInbox } from "./components/VirtualizedEmailInbox";
import {
  selectEmailReaderMessagesForNode,
  useEmailReaderOutputsStore,
} from "./stores/use-email-reader-outputs";

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
    // Do not persist emails content; keep ephemeral via store/inputs only
    selectedIndex: z.number().int().min(0).default(0),
    expandedSize: SafeSchemas.text("FE3W"),
    collapsedSize: SafeSchemas.text("C3W"),
    label: z.string().optional(),
    // Note: some upstream nodes may inject additional keys; allow passthrough
  })
  .passthrough();

export type EmailPreviewData = z.infer<typeof EmailPreviewDataSchema>;

const validateNodeData = createNodeValidator(
  EmailPreviewDataSchema,
  "EmailPreview"
);

// -----------------------------------------------------------------------------
// 2️⃣  Constants (UI preserved)
// -----------------------------------------------------------------------------

const CATEGORY_TEXT = {
  EMAIL: {
    primary: "text-[--node--email-text]",
  },
} as const;

const CONTENT = {
  expanded: "p-4 w-full h-full flex flex-col",
  collapsed: "w-full h-full", // Pure inbox view
  header: "flex items-center justify-between mb-3",
  body: "flex-1 flex items-center justify-center",
  disabled:
    "opacity-75 bg-zinc-100 dark:bg-zinc-500 rounded-md transition-all duration-300",
} as const;

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
    "flex-1 rounded-md border nowheel border-[--node-email-border] bg-white/75 dark:bg-[--node-email-bg] p-3 overflow-y-auto max-h-52 min-h-28",
  subject:
    "text-[12px] font-semibold text-black dark:text-[--node-email-text] break-words",
  meta: "text-[10px] text-zinc-600 dark:text-[--node-email-text-secondary]",
  divider: "my-3 h-px bg-black",
  body: "text-[10px] whitespace-pre-wrap text-black dark:text-[--node-email-text] leading-[1.35] overflow-hidden break-words",
} as const;

/** Keys that may contain large JSON-ish payloads from upstream nodes. */
const CLEAR_JSON_KEYS = [
  "json",
  "data",
  "payload",
  "result",
  "response",
] as const;
type ClearJsonKey = (typeof CLEAR_JSON_KEYS)[number];

// Emails are ephemeral by design; do not persist them in node.data

// -----------------------------------------------------------------------------
// 3️⃣  Small helpers (unchanged behavior)
// -----------------------------------------------------------------------------

function parseFlexibleDate(input: unknown): Date | null {
  if (input === null || input === undefined) return null;
  const asNumber =
    typeof input === "number"
      ? input
      : typeof input === "string" && /^\d+$/.test(input.trim())
        ? Number.parseInt(input.trim(), 10)
        : null;
  if (asNumber !== null && Number.isFinite(asNumber)) {
    const ms = asNumber >= 1_000_000_000_000 ? asNumber : asNumber * 1000;
    const d = new Date(ms);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(String(input));
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatDateToDDMMYY(input: unknown): string {
  const d = parseFlexibleDate(input);
  if (!d) return String(input ?? "");
  try {
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    }).format(d);
  } catch {
    return String(input);
  }
}

function parseSenderParts(input: unknown): {
  name: string;
  email: string;
  display: string;
} {
  if (!input) return { name: "", email: "", display: "" };
  try {
    if (typeof input === "object") {
      const obj = input as Record<string, unknown>;
      const name = typeof obj.name === "string" ? obj.name.trim() : "";
      const email = typeof obj.email === "string" ? obj.email.trim() : "";
      const display =
        `${name}${name && email ? " " : ""}$${email ? `<${email}>` : ""}`.replace(
          "$",
          ""
        );
      return { name, email, display: display.trim() };
    }
    const text = String(input).trim();
    const match = text.match(/^\s*"?([^"<]*)"?\s*<([^>]+)>\s*$/);
    if (match) {
      const name = match[1]?.trim() ?? "";
      const email = match[2]?.trim() ?? "";
      return {
        name,
        email,
        display: `${name}${name && email ? " " : ""}<${email}>`.trim(),
      };
    }
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)) {
      return { name: "", email: text, display: `<${text}>` };
    }
    const ltIndex = text.indexOf("<");
    if (ltIndex > 0) {
      const name = text.slice(0, ltIndex).trim().replace(/^"|"$/g, "");
      const email = text
        .slice(ltIndex + 1, text.indexOf(">", ltIndex + 1))
        .trim();
      return {
        name,
        email,
        display: `${name}${name && email ? " " : ""}<${email}>`.trim(),
      };
    }
    return { name: text, email: "", display: text };
  } catch {
    return { name: String(input), email: "", display: String(input) };
  }
}

// -----------------------------------------------------------------------------
// 4️⃣  Dynamic spec factory
// -----------------------------------------------------------------------------

function createDynamicSpec(data: EmailPreviewData): NodeSpec {
  const expanded =
    EXPANDED_SIZES[data.expandedSize as keyof typeof EXPANDED_SIZES] ??
    EXPANDED_SIZES.FE2;
  const collapsed =
    COLLAPSED_SIZES[data.collapsedSize as keyof typeof COLLAPSED_SIZES] ??
    COLLAPSED_SIZES.C2;

  /**
   * HANDLE_TOOLTIPS – ultra‑concise labels for handles
   * [Explanation], basically 1–3 word hints shown before dynamic value/type
   */
  const HANDLE_TOOLTIPS = {
    EMAILS_IN: "Emails",
    OUTPUT_OUT: "Output",
  } as const;

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
        tooltip: HANDLE_TOOLTIPS.EMAILS_IN,
      },
      {
        id: "output",
        code: "s",
        position: "right",
        type: "source",
        dataType: "String",
        tooltip: HANDLE_TOOLTIPS.OUTPUT_OUT,
      },
    ],
    inspector: { key: "EmailPreviewInspector" },
    version: 1,
    runtime: { execute: "emailPreview_execute_v1" },
    initialData: createSafeInitialData(EmailPreviewDataSchema, {
      store: "Default text",
      output: "",
      lastError: "",
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
    description: "EmailPreview node with inbox UI for email operations",
    feature: "email",
    tags: ["email", "emailPreview", "inbox"],
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
// 5️⃣  React component – stable data flow (loop-safe)
// -----------------------------------------------------------------------------

type SelectedEmail = {
  subject: string;
  from: string;
  fromName: string;
  fromEmail: string;
  date: string;
  preview: string;
  content: string;
  attachmentsCount: number;
  isRead: boolean;
} | null;

const EmailPreviewNode = memo(
  ({ id, data, spec }: NodeProps & { spec: NodeSpec }) => {
    // 5.1 React-Flow store + node data
    const { nodeData, updateNodeData } = useNodeData(id, data);
    const isUpdatingRef = useRef(false);
    const safeUpdateNodeData = useCallback(
      (updates: Record<string, unknown>) => {
        if (isUpdatingRef.current) return;
        isUpdatingRef.current = true;
        try {
          updateNodeData(updates);
        } finally {
          // release on microtask to avoid nested update cascades
          queueMicrotask(() => {
            isUpdatingRef.current = false;
          });
        }
      },
      [updateNodeData]
    );
    const dataRef = nodeData as EmailPreviewData;

    const flowMetadata = useFlowMetadataOptional();
    const flowId = String(flowMetadata?.flow?.id ?? "");

    // 5.2 Stable primitive slices (avoid depending on entire nodeData)
    const { isExpanded, isEnabled, isActive, selectedIndex, label } = dataRef;

    const categoryStyles = CATEGORY_TEXT.EMAIL;

    // 5.3 Targeted subscriptions (unchanged)
    const emailInputInfo = useStore(
      (s) => {
        const e = findEdgeByHandle(s.edges, id, "emails-input");
        return {
          sourceId: e?.source ?? null,
          sourceHandle: e?.sourceHandle ?? null,
          edgeId: e?.id ?? null,
        } as const;
      },
      (a, b) =>
        a.sourceId === b.sourceId &&
        a.sourceHandle === b.sourceHandle &&
        a.edgeId === b.edgeId
    );

    const [srcOutput, srcMessages, srcEmailsOutput, srcStore] = useStore(
      (s) => {
        if (!emailInputInfo.sourceId)
          return [undefined, undefined, undefined, undefined] as const;
        const d = (
          s.nodes as Array<{ id: string; data?: unknown; flowId?: string }>
        ).find((n) => n.id === emailInputInfo.sourceId)?.data as
          | (Record<string, unknown> & {
              output?: unknown;
              messages?: unknown;
              emailsOutput?: unknown;
              store?: unknown;
            })
          | undefined;
        return [d?.output, d?.messages, d?.emailsOutput, d?.store] as const;
      },
      shallow
    );

    const hasEmailsInputEdge = useStore(
      (s) => Boolean(findEdgeByHandle(s.edges, id, "emails-input")),
      Object.is
    );

    // 5.4 Local state (unchanged)
    const [isRendering] = useState<boolean>(false);

    // 5.5 Feature flag
    const flagState = useNodeFeatureFlag(spec.featureFlag);

    // 5.6 Utils kept stable
    const toSafeString = useCallback((value: unknown): string => {
      if (value === null || value === undefined) return "";
      return typeof value === "string" ? value : String(value);
    }, []);

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

          // Extract domain for compressed display, basically just show the main domain
          const compressedText = (() => {
            try {
              const urlObj = new URL(url);
              const domain = urlObj.hostname.replace(/^www\./, "");
              return domain;
            } catch {
              // Fallback to simple regex extraction
              const domainMatch = url.match(/https?:\/\/(?:www\.)?([^\/]+)/);
              return domainMatch ? domainMatch[1] : url;
            }
          })();

          nodes.push(
            <a
              key={`${start}-${url}`}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline"
              title={url} // Show full URL on hover
            >
              {compressedText}
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

    // 5.7 Upstream EmailReader reactive store
    const EMPTY_EMAILS_REF: ReadonlyArray<Record<string, unknown>> = useMemo(
      () => Object.freeze([] as Record<string, unknown>[]),
      []
    );
    const messagesSelector = useMemo(
      () =>
        flowId && emailInputInfo.sourceId
          ? selectEmailReaderMessagesForNode(flowId, emailInputInfo.sourceId)
          : () => EMPTY_EMAILS_REF as Array<Record<string, unknown>>,
      [flowId, emailInputInfo.sourceId, EMPTY_EMAILS_REF]
    );
    const reactiveMessages = useEmailReaderOutputsStore(messagesSelector);

    // 5.8 Compute incoming emails (same behavior, stable callback)
    const computeEmailsArray = useCallback((): Array<
      Record<string, unknown>
    > => {
      const srcData: {
        output?: unknown;
        messages?: unknown;
        emailsOutput?: unknown;
        store?: unknown;
      } = {
        output: srcOutput,
        messages: srcMessages,
        emailsOutput: srcEmailsOutput,
        store: srcStore,
      };

      if (Array.isArray(reactiveMessages) && reactiveMessages.length > 0) {
        return reactiveMessages as Array<Record<string, unknown>>;
      }

      if (srcData?.output && typeof srcData.output === "object") {
        if (emailInputInfo.sourceHandle) {
          const h = normalizeHandleId(emailInputInfo.sourceHandle);
          const v = (srcData.output as Record<string, unknown>)[h];
          if (Array.isArray(v)) return v as Array<Record<string, unknown>>;
          if (typeof v === "string") {
            try {
              const parsed = JSON.parse(v);
              if (Array.isArray(parsed))
                return parsed as Array<Record<string, unknown>>;
            } catch {}
          }
        }
        const firstArray = Object.values(
          srcData.output as Record<string, unknown>
        ).find((v) => Array.isArray(v));
        if (Array.isArray(firstArray))
          return firstArray as Array<Record<string, unknown>>;

        const firstJson = Object.values(
          srcData.output as Record<string, unknown>
        ).find((v) => typeof v === "string");
        if (typeof firstJson === "string") {
          try {
            const parsed = JSON.parse(firstJson);
            if (Array.isArray(parsed))
              return parsed as Array<Record<string, unknown>>;
          } catch {}
        }
      }

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
        const firstArray = Object.values(value as Record<string, unknown>).find(
          (v) => Array.isArray(v)
        );
        if (Array.isArray(firstArray))
          return firstArray as Array<Record<string, unknown>>;
      }
      return [];
    }, [
      emailInputInfo.sourceHandle,
      srcOutput,
      srcMessages,
      srcEmailsOutput,
      srcStore,
      reactiveMessages,
    ]);

    // 5.9 Ephemeral emails – do NOT persist to node.data; derive at render time only

    // 5.11 Derive current emails from inputs/store (ephemeral)
    const emails: Array<Record<string, unknown>> = useMemo(
      () => computeEmailsArray(),
      [computeEmailsArray]
    );

    const selectedEmail: SelectedEmail = useMemo(() => {
      const idx = Math.min(
        Math.max(0, selectedIndex ?? 0),
        Math.max(0, emails.length - 1)
      );
      const item = emails[idx] as Record<string, any> | undefined;
      if (!item) return null;

      let inner: any = item;
      const keys = Object.keys(item);
      if (
        keys.length === 1 &&
        /^(Email\s*\d+|email\s*\d+)$/i.test(keys[0]) &&
        typeof (item as any)[keys[0]] === "object"
      ) {
        inner = (item as any)[keys[0]];
      }

      if (inner && typeof inner === "object") {
        const fromRaw = (inner as any).From ?? (inner as any).from;
        const {
          name: fromName,
          email: fromEmail,
          display: fromDisplay,
        } = parseSenderParts(fromRaw);

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
          from: fromDisplay,
          fromName,
          fromEmail,
          date: inner.Date || inner.date || "",
          preview: inner.Preview || inner.snippet || "",
          content: inner.Content || inner.textContent || inner.snippet || "",
          attachmentsCount,
          isRead,
        } satisfies NonNullable<SelectedEmail>;
      }
      return null;
    }, [emails, selectedIndex]);

    // 5.12 JSON for selected email (stable primitive for effect deps)
    const selectedJson: string | null = useMemo(
      () => (selectedEmail ? JSON.stringify(selectedEmail) : null),
      [selectedEmail]
    );

    // 5.13 Keep isActive in sync with content presence, but only when needed
    const lastActiveRef = useRef<boolean>(isActive);
    useEffect(() => {
      const content = selectedEmail?.content ?? "";
      const hasValid = (content?.trim()?.length ?? 0) > 0;

      let nextActive = isEnabled ? hasValid : false;
      if (
        lastActiveRef.current !== nextActive &&
        dataRef.isActive !== nextActive
      ) {
        lastActiveRef.current = nextActive;
        safeUpdateNodeData({ isActive: nextActive });
      }
    }, [
      isEnabled,
      selectedEmail?.content,
      safeUpdateNodeData,
      dataRef.isActive,
    ]);

    // 5.14 Emit output only when (isActive && isEnabled) *and* value actually changed
    const lastOutputRef = useRef<string>((dataRef as any).output ?? "");
    useEffect(() => {
      const shouldSend = Boolean(isActive && isEnabled && selectedJson);
      const out: string = shouldSend ? (selectedJson as string) : "";
      if (out !== lastOutputRef.current && (dataRef as any).output !== out) {
        lastOutputRef.current = out;
        safeUpdateNodeData({ output: out });
      }
    }, [
      isActive,
      isEnabled,
      selectedJson,
      safeUpdateNodeData,
      (dataRef as any).output,
    ]);

    // 5.15 Clear heavy JSON-ish fields only on transition to inactive/disabled
    const hasClearedRef = useRef<boolean>(false);
    useEffect(() => {
      const inactive = !isActive || !isEnabled;
      if (!inactive) {
        hasClearedRef.current = false;
        return;
      }
      if (hasClearedRef.current) return;

      const current = dataRef as unknown as Record<string, unknown>;
      const updates: Partial<Record<ClearJsonKey, null>> = {};
      let hasChange = false;
      for (const key of CLEAR_JSON_KEYS) {
        if (current[key] !== null && current[key] !== undefined) {
          updates[key] = null;
          hasChange = true;
        }
      }
      if (hasChange) {
        hasClearedRef.current = true; // avoid repeated writes
        safeUpdateNodeData(updates as Record<string, unknown>);
      }
    }, [isActive, isEnabled, dataRef, safeUpdateNodeData]);

    // 5.16 Validation (unchanged)
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

    // 5.17 UI actions
    const toggleExpand = useCallback(() => {
      const next = !isExpanded;
      if (dataRef.isExpanded !== next) {
        safeUpdateNodeData({ isExpanded: next });
      }
    }, [isExpanded, dataRef, safeUpdateNodeData]);

    const handleStoreChange = useCallback(
      (e: ChangeEvent<HTMLTextAreaElement>) => {
        safeUpdateNodeData({ store: e.target.value });
      },
      [safeUpdateNodeData]
    );

    // Handle email selection from virtualized inbox, basically user interaction callback
    const handleEmailSelect = useCallback(
      (index: number) => {
        if (dataRef.selectedIndex !== index) {
          safeUpdateNodeData({ selectedIndex: index });
        }
      },
      [dataRef.selectedIndex, safeUpdateNodeData]
    );

    // Handle double-click to expand email preview, basically toggle expanded state
    const handleEmailDoubleClick = useCallback(() => {
      const nextExpanded = !isExpanded;
      if (dataRef.isExpanded !== nextExpanded) {
        safeUpdateNodeData({ isExpanded: nextExpanded });
      }
    }, [isExpanded, dataRef.isExpanded, safeUpdateNodeData]);

    // 5.18 Feature flags UI
    if (flagState.isLoading) {
      return (
        <div className="flex items-center justify-center p-4 text-sm text-muted-foreground">
          Loading emailPreview feature...
        </div>
      );
    }
    if (!flagState.isEnabled && flagState.hideWhenDisabled) return null;
    if (!flagState.isEnabled) {
      return (
        <div className="flex items-center justify-center p-4 text-sm text-muted-foreground border border-dashed border-muted-foreground/20 rounded-lg">
          {flagState.disabledMessage}
        </div>
      );
    }

    // 5.19 Render (visuals preserved)
    return (
      <>
        {/* Editable label or icon */}
        {!isExpanded &&
        spec.size.collapsed.width === 60 &&
        spec.size.collapsed.height === 60 ? (
          <div className="absolute inset-0 flex justify-center text-lg p-0 text-foreground/80">
            {spec.icon && renderLucideIcon(spec.icon, "", 16)}
          </div>
        ) : (
          <LabelNode nodeId={id} label={label || spec.displayName} />
        )}

        {!isExpanded ? (
          /* Collapsed View - Pure Inbox UI like Outlook */
          <div
            className={`nowheel ${CONTENT.collapsed} ${!isEnabled ? CONTENT.disabled : ""}`}
          >
            <VirtualizedEmailInbox
              emails={emails}
              selectedIndex={selectedIndex}
              onEmailSelect={handleEmailSelect}
              onEmailDoubleClick={handleEmailDoubleClick}
              isEnabled={isEnabled}
              maxHeight={180} // Optimized height to prevent overflow
            />
          </div>
        ) : (
          /* Expanded View - Classic email preview */
          <div
            className={`${CONTENT.expanded} ${
              !isEnabled ? CONTENT.disabled : ""
            }`}
          >
            <div className="flex flex-col gap-2">
              {dataRef.lastError && (
                <div className="text-[10px] text-red-600">
                  {dataRef.lastError}
                </div>
              )}

              {/* Email viewer */}
              {(() => {
                const sel = selectedEmail;
                if (!sel) {
                  const raw = emails;
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
                    <div className={VIEW_STYLES.meta}>
                      <div className="flex items-center justify-between">
                        {/* Read the badge green / Unread the badge grey */}
                        <Badge
                          className={`text-[10px] text-right bg-zinc-200 dark:bg-zinc-500 mb-2 rounded-full ${
                            sel.isRead
                              ? "bg-green-200 dark:bg-green-500"
                              : "bg-zinc-200 dark:bg-zinc-500"
                          }`}
                        >
                          {`${sel.isRead ? "Read" : "Unread"}`}
                        </Badge>
                        <span className="text-[10px] text-right ">
                          <div className="flex items-center gap-0">
                            <MdAttachFile className="w-4 h-4" />{" "}
                            {`${Math.max(0, sel.attachmentsCount ?? 0)}`}
                          </div>
                        </span>
                      </div>
                    </div>

                    <div
                      className={`${VIEW_STYLES.meta} flex items-center justify-between`}
                    >
                      <span title={decodeHtmlEntities(sel.from || "(Unknown)")}>
                        {`From: ${decodeHtmlEntities(sel.fromName || sel.from || "(Unknown)")}`}
                      </span>
                      <span className="text-[10px] text-right ">
                        {sel.date ? ` ${formatDateToDDMMYY(sel.date)}` : ""}
                      </span>
                    </div>
                    <div
                      className={`${VIEW_STYLES.subject} mb-2`}
                      title={decodeHtmlEntities(sel.subject || "(No subject)")}
                    >
                      {decodeHtmlEntities(sel.subject || "(No subject)")}
                    </div>
                    {/* {sel.preview && (
                      <div className={VIEW_STYLES.meta}>
                        {decodeHtmlEntities(sel.preview)}
                      </div>
                    )} */}
                    <div className={VIEW_STYLES.divider} />
                    <div className={`${VIEW_STYLES.body} text-[10px]`}>
                      {linkify(
                        decodeHtmlEntities(sel.content || "(No content)")
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Selector */}
              {/* {(emails?.length ?? 0) > 0 && (
                <div className="flex items-center justify-between gap-2 mt-2">
                  <label className={UI_STYLES.label}>Select Email</label>
                  <div className="flex items-center gap-2">
                    <select
                      className={UI_STYLES.select}
                      value={selectedIndex}
                      onChange={(e) => {
                        const idx = Number.parseInt(e.target.value, 10) || 0;
                        if (dataRef.selectedIndex !== idx) {
                          safeUpdateNodeData({ selectedIndex: idx });
                        }
                      }}
                    >
                      {emails.map((_, i) => (
                        <option key={i} value={i}>{`Email ${i + 1}`}</option>
                      ))}
                    </select>
                    <span className={VIEW_STYLES.meta}>
                      {emails.length} total
                    </span>
                  </div>
                </div>
              )} */}
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
// 6️⃣  High-order wrapper – scaffold with dynamic spec (focus-safe)
// -----------------------------------------------------------------------------

/**
 * We still memoize the scaffolded component so its identity is stable
 * unless the *size keys* actually change.
 */
const EmailPreviewNodeWithDynamicSpec = (props: NodeProps) => {
  const { nodeData } = useNodeData(props.id, props.data);
  const { expandedSize, collapsedSize } = nodeData as EmailPreviewData;

  const dynamicSpec = useMemo(
    () =>
      createDynamicSpec({ expandedSize, collapsedSize } as EmailPreviewData),
    [expandedSize, collapsedSize]
  );

  const ScaffoldedNode = useMemo(
    () =>
      withNodeScaffold(dynamicSpec, (p) => (
        <EmailPreviewNode {...(p as NodeProps)} spec={dynamicSpec} />
      )),
    [dynamicSpec]
  );

  return <ScaffoldedNode {...props} />;
};

export default EmailPreviewNodeWithDynamicSpec;
