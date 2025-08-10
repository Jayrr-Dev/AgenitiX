"use client";
/**
 * EmailPreview NODE – Content-focused, schema-driven, type-safe
 * Styling is kept identical; logic is refactored to prevent update-depth loops.
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
import { shallow } from "zustand/shallow";
import { useEmailReaderOutputsStore } from "./stores/use-email-reader-outputs";

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
    expandedSize: SafeSchemas.text("VE3W"),
    collapsedSize: SafeSchemas.text("C2W"),
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
  subject:
    "text-[10px] font-semibold text-black dark:text-[--node-email-text] break-words",
  meta: "text-[10px] text-zinc-600 dark:text-[--node-email-text-secondary]",
  divider: "my-3 h-px bg-zinc-200 dark:bg-[--node-email-border]",
  body: "text-[10px] whitespace-pre-wrap text-black dark:text-[--node-email-text] leading-[1.35]",
} as const;

const COLLAPSED_SUMMARY_STYLES = {
  wrap: "w-full h-full px-2 py-1 flex flex-col justify-center text-[10px] text-foreground/90",
  navRow:
    "w-full flex items-center justify-between mt-2 text-[11px] font-medium",
  arrowBtn:
    "h-4 w-4 inline-flex items-center justify-center rounded border border-[--node-email-border] bg-[--node-email-bg] text-[--node-email-text] hover:bg-[--node-email-bg-hover] disabled:opacity-40 disabled:cursor-not-allowed",
  title: "px-1 text-[11px]",
  row: "flex items-center gap-1",
  key: "min-w-[54px] text-foreground o",
  val: "truncate max-w-[120px]",
  valWrap:
    "max-w-[140px] whitespace-normal break-words font-bold text-shadow-lg leading-tight",
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

const EMPTY_EMAILS: ReadonlyArray<Record<string, unknown>> = Object.freeze([]);

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
    const dataRef = nodeData as EmailPreviewData;

    const flowMetadata = useFlowMetadataOptional();
    const flowId = String(flowMetadata?.flow?.id ?? "");

    // 5.2 Stable primitive slices (avoid depending on entire nodeData)
    const {
      isExpanded,
      isEnabled,
      isActive,
      selectedIndex,
      emails: emailsRaw,
      label,
    } = dataRef;

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

    // 5.7 Upstream EmailReader reactive store
    const reactiveMessages = useEmailReaderOutputsStore(
      useCallback(
        (s) =>
          flowId && emailInputInfo.sourceId
            ? (s.getMessages(flowId, emailInputInfo.sourceId) as Array<
                Record<string, unknown>
              >)
            : (EMPTY_EMAILS as Array<Record<string, unknown>>),
        [flowId, emailInputInfo.sourceId]
      )
    );

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

    // 5.9 Keep a stable emails array in node data (guarded by json string ref)
    const lastEmailsJsonRef = useRef<string>("[]");
    useEffect(() => {
      const emails = computeEmailsArray();
      const safeEmails = Array.isArray(emails) ? emails : EMPTY_EMAILS;
      const nextJson = JSON.stringify(safeEmails);
      if (nextJson !== lastEmailsJsonRef.current) {
        lastEmailsJsonRef.current = nextJson;
        // Write only when the *content* actually changed
        updateNodeData({ emails: safeEmails as any });
      }
    }, [computeEmailsArray, updateNodeData]);

    // 5.10 Reset on edge removal (unchanged)
    useEffect(() => {
      if (!hasEmailsInputEdge) {
        lastEmailsJsonRef.current = "[]";
        updateNodeData({ emails: [], selectedIndex: 0 });
      }
    }, [hasEmailsInputEdge, updateNodeData]);

    // 5.11 Derive selected email with useMemo (no function dep loops)
    const emails: Array<Record<string, unknown>> = useMemo(
      () =>
        Array.isArray(emailsRaw)
          ? emailsRaw
          : ([] as Array<Record<string, unknown>>),
      [emailsRaw]
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
      if (lastActiveRef.current !== nextActive) {
        lastActiveRef.current = nextActive;
        updateNodeData({ isActive: nextActive });
      }
    }, [isEnabled, selectedEmail?.content, updateNodeData]);

    // 5.14 Emit output only when (isActive && isEnabled) *and* value actually changed
    const lastOutputRef = useRef<string | null>(null);
    useEffect(() => {
      const shouldSend = Boolean(isActive && isEnabled && selectedJson);
      const out = shouldSend ? (selectedJson as string) : null;
      if (out !== lastOutputRef.current) {
        lastOutputRef.current = out;
        updateNodeData({ output: out });
      }
    }, [isActive, isEnabled, selectedJson, updateNodeData]);

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
        updateNodeData(updates as Record<string, unknown>);
      }
    }, [isActive, isEnabled, dataRef, updateNodeData]);

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
      updateNodeData({ isExpanded: !isExpanded });
    }, [isExpanded, updateNodeData]);

    const handleStoreChange = useCallback(
      (e: ChangeEvent<HTMLTextAreaElement>) => {
        updateNodeData({ store: e.target.value });
      },
      [updateNodeData]
    );

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
          <div
            className={`${CONTENT.collapsed} ${!isEnabled ? CONTENT.disabled : ""}`}
          >
            {(() => {
              const count = emails.length;
              const currentIndex = Math.min(
                Math.max(0, selectedIndex || 0),
                Math.max(0, count - 1)
              );
              const sel = selectedEmail;

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
                    <div className={COLLAPSED_SUMMARY_STYLES.title}>
                      {`Email ${count > 0 ? currentIndex + 1 : 0}`}
                      {sel?.attachmentsCount && sel.attachmentsCount > 0 ? (
                        <span
                          aria-label="Has attachments"
                          title={`${sel.attachmentsCount} attachment${sel.attachmentsCount === 1 ? "" : "s"}`}
                          className="ml-1 inline-flex items-center text-[10px]"
                        >
                          {/* Paperclip */}
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="10"
                            height="10"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="inline-block align-middle"
                          >
                            <path d="M21.44 11.05l-9.19 9.19a6 6 0 1 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66L9.88 17.25a2 2 0 1 1-2.83-2.83l8.49-8.49" />
                          </svg>
                        </span>
                      ) : null}
                    </div>
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
                    <div className=" flex flex-col gap-0">
                      <div className={COLLAPSED_SUMMARY_STYLES.row}>
                        <span
                          className={`${COLLAPSED_SUMMARY_STYLES.valWrap} ${categoryStyles.primary}`}
                          title={decodeHtmlEntities(sel.subject || "")}
                        >
                          {decodeHtmlEntities(sel.subject || "")}
                        </span>
                      </div>
                      <div className={COLLAPSED_SUMMARY_STYLES.row}>
                        <span className={COLLAPSED_SUMMARY_STYLES.key}>
                          From:
                        </span>
                        <span
                          className={`${COLLAPSED_SUMMARY_STYLES.val} ${categoryStyles.primary}`}
                          title={decodeHtmlEntities(sel.from || "")}
                        >
                          {decodeHtmlEntities(sel.fromName || sel.from || "")}
                        </span>
                      </div>

                      <div className={COLLAPSED_SUMMARY_STYLES.row}>
                        <span className={COLLAPSED_SUMMARY_STYLES.key}>
                          Date:
                        </span>
                        <span className={COLLAPSED_SUMMARY_STYLES.val}>
                          {formatDateToDDMMYY(sel.date || "")}
                        </span>
                      </div>
                      <div className={COLLAPSED_SUMMARY_STYLES.row}>
                        <span className={COLLAPSED_SUMMARY_STYLES.key}>
                          Read:
                        </span>
                        <span className={COLLAPSED_SUMMARY_STYLES.val}>
                          {sel.isRead ? "Yes" : "No"}
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
                    <div
                      className={VIEW_STYLES.subject}
                      title={decodeHtmlEntities(sel.subject || "(No subject)")}
                    >
                      {decodeHtmlEntities(sel.subject || "(No subject)")}
                    </div>
                    <div className={VIEW_STYLES.meta}>
                      <span title={decodeHtmlEntities(sel.from || "(Unknown)")}>
                        {`From: ${decodeHtmlEntities(sel.fromName || sel.from || "(Unknown)")}`}
                      </span>
                      {sel.date
                        ? ` · Date: ${formatDateToDDMMYY(sel.date)}`
                        : ""}
                    </div>
                    <div className={VIEW_STYLES.meta}>
                      {`Attachments#: ${Math.max(0, sel.attachmentsCount ?? 0)} · ${
                        sel.isRead ? "Read" : "Unread"
                      }`}
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

              {/* Selector */}
              {(emails?.length ?? 0) > 0 && (
                <div className="flex items-center justify-between gap-2 mt-2">
                  <label className={UI_STYLES.label}>Select Email</label>
                  <div className="flex items-center gap-2">
                    <select
                      className={UI_STYLES.select}
                      value={selectedIndex}
                      onChange={(e) => {
                        const idx = Number.parseInt(e.target.value, 10) || 0;
                        updateNodeData({ selectedIndex: idx });
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
