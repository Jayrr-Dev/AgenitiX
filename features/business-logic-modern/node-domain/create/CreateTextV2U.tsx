/**
 * CREATE TEXT V2U – Fully-migrated defineNode() implementation
 *
 * ▸ Week-8 migration from createNodeComponent
 * ▸ Single-file architecture, enterprise features
 * ▸ Integrated V2U DevTools, monitoring, and rich lifecycle hooks
 */

"use client";

import { Position } from "@xyflow/react";
import React, { useRef } from "react";

import { useTextInputShortcuts } from "../../infrastructure/flow-engine/hooks/useTextInputShortcuts";
import { BaseNodeData } from "../../infrastructure/flow-engine/types/nodeData";
import { defineNode } from "../../infrastructure/node-creation";
import { useAutoOptimizedTextInput } from "../../infrastructure/node-creation/factory/hooks/performance/useOptimizedTextInput";

// -----------------------------------------------------------------------------
// 1 ▸ Type Definitions
// -----------------------------------------------------------------------------

interface CreateTextV2UData extends BaseNodeData {
  text: string;
  heldText: string;
  /** V2U migration meta */
  _v2uMigrated?: boolean;
  _v2uMigrationDate?: number;
  /** Enhanced error states */
  isErrorState?: boolean;
  errorType?: "warning" | "error" | "critical";
  error?: string;
}

type ErrorLevel = NonNullable<CreateTextV2UData["errorType"]> | "local";

interface ErrorStyle {
  text: string;
  bg?: string;
  border?: string;
  indicator: string;
  ringColor?: string;
}

// -----------------------------------------------------------------------------
// 2 ▸ Shared Helpers
// -----------------------------------------------------------------------------

const pickFirstTruthy = (values: any[]) =>
  values.find((v) => v !== undefined && v !== null);

function getSingleInputValue(nodesData: any[]): any {
  const first = nodesData?.[0];
  return first && typeof first === "object"
    ? pickFirstTruthy(Object.values(first))
    : null;
}

const isTruthy = (v: any): boolean =>
  v == null
    ? false
    : typeof v === "string"
      ? v.trim().length > 0
      : typeof v === "object"
        ? Array.isArray(v)
          ? v.length > 0
          : Object.keys(v).length > 0
        : Boolean(v);

const errorStyles: Record<ErrorLevel, ErrorStyle> = {
  warning: {
    text: "text-yellow-700 dark:text-yellow-300",
    indicator: "⚠️",
  },
  error: {
    text: "text-orange-700 dark:text-orange-300",
    indicator: "🚨",
  },
  critical: {
    text: "text-red-700 dark:text-red-300",
    indicator: "💥",
  },
  local: {
    text: "text-orange-700 dark:text-orange-300",
    indicator: "🚨",
  },
};

// -----------------------------------------------------------------------------
// 3 ▸ Custom Text Input Component
// -----------------------------------------------------------------------------

const TextInput: React.FC<{
  /** current node id for hooks */
  id: string;
  data: CreateTextV2UData;
  updateNodeData(partial: Partial<CreateTextV2UData>): void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}> = ({ id, data, updateNodeData, disabled, placeholder, className }) => {
  const ref = useRef<HTMLTextAreaElement>(null);

  const optimised = useAutoOptimizedTextInput(id, data.heldText || "", (_, d) =>
    updateNodeData(d)
  );

  useTextInputShortcuts({
    value: optimised.value,
    setValue: (v) => updateNodeData({ heldText: v }),
    onEnter: () => ref.current?.blur(),
  });

  return (
    <textarea
      ref={ref}
      value={optimised.value}
      onChange={optimised.onChange}
      onKeyDown={(e) => {
        if (e.key === "Tab" && !e.shiftKey) e.preventDefault();
      }}
      spellCheck
      disabled={disabled}
      placeholder={placeholder}
      className={
        className ??
        "w-full h-full resize-none bg-transparent outline-none text-sm leading-relaxed p-1"
      }
      style={{ minHeight: 60 }}
    />
  );
};

// -----------------------------------------------------------------------------
// 4 ▸ Node renderers (collapse / expanded)
// -----------------------------------------------------------------------------

function CollapsedView(props: {
  data: CreateTextV2UData;
  id: string;
  error: string | null;
  updateNodeData(partial: Partial<CreateTextV2UData>): void;
}) {
  const { data, error, updateNodeData, id } = props;

  const runtimeError = error || (data.isErrorState && data.error);
  const level: ErrorLevel = error ? "local" : data.errorType || "error";
  const style = runtimeError ? errorStyles[level] : null;

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center px-2">
      {/* Header */}
      <div
        className={`text-xs font-semibold mb-1 flex items-center gap-1 ${
          style?.text ?? ""
        }`}
      >
        {style ? (
          <>
            <span>{style.indicator}</span>
            <span>V2U {level.toUpperCase()}</span>
          </>
        ) : (
          <>
            {/* <span></span> */}
            <span>Create Text</span>
          </>
        )}
      </div>

      {/* Body */}
      {runtimeError ? (
        <p className={`text-xs text-center break-words ${style!.text}`}>
          {runtimeError}
        </p>
      ) : (
        <div
          className="nodrag nowheel w-full flex-1 flex items-center justify-center"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <TextInput
            id={id}
            data={data}
            updateNodeData={updateNodeData}
            placeholder="Enter your text…"
            className="w-full h-full resize-none bg-transparent outline-none text-gray-800 dark:text-gray-200 text-sm leading-relaxed p-1"
          />
        </div>
      )}
    </div>
  );
}

function ExpandedView(props: {
  data: CreateTextV2UData;
  id: string;
  error: string | null;
  updateNodeData(partial: Partial<CreateTextV2UData>): void;
  categoryTheme?: Record<string, string>;
  categoryClasses?: Record<string, string>;
}) {
  const { data, error, updateNodeData, id, categoryClasses } = props;

  const runtimeError = error || (data.isErrorState && data.error);
  const level: ErrorLevel = error ? "local" : data.errorType || "error";
  const style = runtimeError ? errorStyles[level] : null;

  return (
    <div className="flex flex-col text-xs w-auto" key={`ct-v2u-${id}`}>
      {/* Header */}
      <div
        className={`font-semibold mb-2 flex items-center justify-between ${
          categoryClasses?.textPrimary ?? "text-green-700 dark:text-green-300"
        }`}
      >
        <span className="flex items-center gap-1">
          📝<span>Create Text V2U</span>
        </span>

        {runtimeError && (
          <span className={`flex items-center gap-1 ${style!.text}`}>
            {style!.indicator}
            {runtimeError.slice(0, 20)}
            {runtimeError.length > 20 ? "…" : ""}
          </span>
        )}
      </div>

      {/* Error panel */}
      {runtimeError && (
        <div className="mb-2 p-2 rounded bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-700">
          <div className="font-semibold mb-1 flex items-center gap-1">
            {style!.indicator}
            <span>V2U {level.toUpperCase()} Details:</span>
          </div>
          <p>{runtimeError}</p>
        </div>
      )}

      {/* TextArea */}
      <div
        className="nodrag nowheel"
        onMouseDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
      >
        <TextInput
          id={id}
          data={data}
          updateNodeData={updateNodeData}
          disabled={!!runtimeError}
          placeholder={
            runtimeError
              ? "V2U error – editing disabled"
              : "Enter your text… (V2U)"
          }
          className={`w-full text-xs min-h-[65px] px-3 py-2 rounded border resize-both focus:outline-none focus:ring-2 bg-white dark:bg-blue-800 transition-colors ${
            runtimeError
              ? "border-red-300 dark:border-red-700 text-red-900 dark:text-red-100 focus:ring-red-500"
              : "border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 focus:ring-blue-500"
          }`}
        />
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// 5 ▸ defineNode()  (config & business logic)
// -----------------------------------------------------------------------------

export default defineNode<CreateTextV2UData>({
  // ─────────────────────────────────────────── Metadata
  metadata: {
    nodeType: "createTextV2U",
    category: "create",
    displayName: "Create Text (V2U)",
    description:
      "Enhanced text creation node with V2U architecture – supports conditional output via triggers",
    icon: "📝",
    folder: "main",
    version: "2.0.0",
    author: "V2U Migration Team",
    tags: ["text", "input", "v2u", "migrated"],
  },

  // ─────────────────────────────────────────── Handles
  handles: [
    {
      id: "trigger",
      type: "target",
      position: Position.Left,
      dataType: "boolean",
      description:
        "Optional trigger – when connected, text outputs only when trigger is true",
      validation: (d) =>
        typeof d === "boolean" || d === null || d === undefined,
    },
    {
      id: "text",
      type: "source",
      position: Position.Right,
      dataType: "string",
      description: "Text output",
    },
  ],

  // ─────────────────────────────────────────── Defaults & Size
  defaultData: {
    text: "",
    heldText: "",
    _v2uMigrated: true,
    _v2uMigrationDate: Date.now(),
  },
  size: {
    collapsed: { width: 200, height: 80 },
    expanded: { width: 300, height: 160 },
  },

  // ─────────────────────────────────────────── Processing
  async processLogic({
    data,
    updateNodeData,
    getConnections,
    setError,
    nodeId,
  }) {
    const started = performance.now();
    try {
      const triggerConns = getConnections().filter(
        (c) => c.targetHandle === "trigger"
      );
      const triggerVal = getSingleInputValue([]); // TODO: supply inputs
      const isActive = isTruthy(triggerVal);

      const text = data.heldText ?? "";
      if (text.length > 100_000) throw new Error("Text too long (100 k max)");

      const out = triggerConns.length === 0 || isActive ? text : "";
      updateNodeData({ text: out, _v2uMigrated: true });
      setError(null);
    } catch (err: any) {
      console.error(`[CreateTextV2U] ${nodeId} –`, err);
      setError(err.message ?? "Unknown error");
      updateNodeData({
        text: "",
        isErrorState: true,
        error: err.message,
        errorType: "error",
      });
    } finally {
      const ms = performance.now() - started;
      if (ms > 50)
        console.warn(`[CreateTextV2U] slow execution (${ms.toFixed(1)} ms)`);
    }
  },

  // ─────────────────────────────────────────── Renderers
  renderCollapsed: CollapsedView,
  renderExpanded: ExpandedView,

  // ─────────────────────────────────────────── Lifecycle
  lifecycle: {
    onMount: async ({ nodeId, emitEvent }) =>
      emitEvent("v2u:node-mounted", { nodeType: "createTextV2U", nodeId }),
    onUnmount: async ({ nodeId, emitEvent }) =>
      emitEvent("v2u:node-unmounted", { nodeType: "createTextV2U", nodeId }),
    onDataChange: (n, o, { nodeId, emitEvent }) =>
      n.heldText !== o.heldText &&
      emitEvent("v2u:text-changed", {
        nodeId,
        oldLength: o.heldText?.length ?? 0,
        newLength: n.heldText?.length ?? 0,
      }),
    onValidation: (d) =>
      typeof d.heldText !== "string"
        ? "heldText must be a string"
        : d.heldText.length > 100_000
          ? "Text too long (100 k max)"
          : true,
  },

  // ─────────────────────────────────────────── Security / Perf
  security: {
    requiresAuth: false,
    permissions: ["node:read", "node:write"],
    dataAccessLevel: "write",
  },
  performance: {
    timeout: 5_000,
    maxMemoryMB: 10,
    retryAttempts: 2,
    retryDelay: 1_000,
  },

  // ─────────────────────────────────────────── Registry
  autoRegister: true,
  registryPath: "create/createTextV2U",
});
