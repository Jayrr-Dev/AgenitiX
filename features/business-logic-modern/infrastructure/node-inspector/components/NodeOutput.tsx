/**
 * NODE OUTPUT COMPONENT - Node execution output display and formatting
 *
 * • Displays computed output results from node execution with registry-enhanced formatting
 * • Provides syntax highlighting for different data types and formats
 * • Shows formatted JSON, text, and structured data with proper indentation
 * • Includes copy-to-clipboard functionality for output values
 * • Renders loading states and error indicators for output computation
 * • Enhanced with modern registry integration for rich metadata and styling
 *
 * Keywords: node-output, syntax-highlighting, formatting, clipboard, results, display, registry-integration
 */

"use client";

import React, { useCallback, useMemo } from "react";

// MODERN REGISTRY INTEGRATION - Import proper types and registry
import type { NodeType } from "../../flow-engine/types/nodeData";
import { getNodeMetadata } from "../../node-registry/nodespec-registry";
import type { NodeMetadata } from "../../node-registry/types";

// ============================================================================
// COMPONENT INTERFACE
// ============================================================================

interface NodeOutputProps {
  output: string | null;
  nodeType: NodeType;
}

// ============================================================================
// OUTPUT FORMATTING TYPES
// ============================================================================

interface FormattedOutput {
  text: string;
  color: string;
  type: string;
  icon?: string;
  fullText?: string;
  metadata?: {
    nodeDisplayName?: string;
    nodeIcon?: string;
    nodeCategory?: string;
  };
}

// ============================================================================
// ENHANCED METADATA HELPERS
// ============================================================================

/**
 * GET OUTPUT FORMATTING PREFERENCES
 * Retrieves output formatting preferences from registry metadata
 */
function getOutputFormattingPreferences(nodeType: string): {
  hasCustomFormatting: boolean;
  customColor?: string;
  customIcon?: string;
  displayName?: string;
  category?: string;
  metadata: NodeMetadata | null;
} {
  const metadata = getNodeMetadata(nodeType as NodeType);
  if (!metadata) {
    return {
      hasCustomFormatting: false,
      metadata: null,
    };
  }

  return {
    hasCustomFormatting: true,
    customIcon: metadata.icon,
    displayName: metadata.displayName,
    category: metadata.category,
    metadata,
  };
}

/**
 * GET NODE-SPECIFIC OUTPUT STYLING
 * Returns node-specific styling based on registry metadata
 */
function getNodeSpecificStyling(
  nodeType: NodeType,
  preferences: ReturnType<typeof getOutputFormattingPreferences>
): Partial<FormattedOutput> {
  // Registry-enhanced styling
  if (preferences.hasCustomFormatting && preferences.metadata) {
    const metadata = preferences.metadata;

    // Category-based styling
    switch (metadata.category) {
      case "create":
        return {
          color: "text-node-create",
          icon: metadata.icon || "🏗️",
        };
      case "view":
        return {
          color: "text-node-view",
          icon: metadata.icon || "👁️",
        };
      case "trigger":
        return {
          color: "text-node-trigger",
          icon: metadata.icon || "⚡",
        };
      case "test":
        return {
          color: "text-node-test",
          icon: metadata.icon || "🧪",
        };
      case "cycle":
        return {
          color: "text-info",
          icon: metadata.icon || "🔄",
        };
      default:
        return {
          color: "text-node-view-text-secondary",
          icon: metadata.icon || "📄",
        };
    }
  }

  // Fallback to node type specific styling (legacy support)
  switch (nodeType) {
    case "createText":
      return {
        color: "text-node-create",
        icon: "📝",
      };
    case "viewOutput":
      return {
        color: "text-node-view",
        icon: "👁️",
      };
    case "triggerOnToggle":
      return {
        color: "text-node-trigger",
        icon: "🎯",
      };
    case "testError":
      return {
        color: "text-node-test",
        icon: "⚠️",
      };
    default:
      return {
        color: "text-node-view-text-secondary",
        icon: "📄",
      };
  }
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const NodeOutput: React.FC<NodeOutputProps> = ({ output, nodeType }) => {
  // REGISTRY METADATA - Get formatting preferences
  const outputPreferences = useMemo(() => {
    return getOutputFormattingPreferences(nodeType);
  }, [nodeType]);

  // COPY TO CLIPBOARD FUNCTIONALITY
  const copyToClipboard = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // You could add a toast notification here
      console.log("Copied to clipboard:", text);
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
    }
  }, []);

  // ENHANCED OUTPUT FORMATTING - Registry-aware
  const formatOutput = useMemo((): FormattedOutput => {
    if (output === null || output === undefined) {
      return {
        text: "—",
        color: "text-node-view-text-secondary italic",
        type: "null",
        icon: "∅",
        metadata: {
          nodeDisplayName: outputPreferences.displayName,
          nodeIcon: outputPreferences.customIcon,
          nodeCategory: outputPreferences.category,
        },
      };
    }

    // Try to parse and detect data type
    let parsedValue: any = output;
    let detectedType = "string";

    try {
      // Attempt JSON parsing for complex types
      if (
        typeof output === "string" &&
        (output.startsWith("{") || output.startsWith("["))
      ) {
        parsedValue = JSON.parse(output);
        detectedType = Array.isArray(parsedValue) ? "array" : "object";
      } else if (output === "true" || output === "false") {
        parsedValue = output === "true";
        detectedType = "boolean";
      } else if (!isNaN(Number(output)) && output.trim() !== "") {
        parsedValue = Number(output);
        detectedType = "number";
      }
    } catch {
      // Keep as string if parsing fails
      detectedType = "string";
    }

    // TYPE-SPECIFIC FORMATTING AND COLORS
    let baseFormatting: FormattedOutput;

    switch (detectedType) {
      case "boolean":
        baseFormatting = {
          text: String(parsedValue),
          color: parsedValue
            ? "text-success"
            : "text-error",
          type: "boolean",
          icon: parsedValue ? "✅" : "❌",
        };
        break;

      case "number":
        baseFormatting = {
          text: String(parsedValue),
          color: "text-warning",
          type: "number",
          icon: "🔢",
        };
        break;

      case "array":
        baseFormatting = {
          text: `[${parsedValue.length} items]`,
          color: "text-node-test",
          type: "array",
          icon: "📊",
          fullText: JSON.stringify(parsedValue, null, 2),
        };
        break;

      case "object":
        const keys = Object.keys(parsedValue);
        baseFormatting = {
          text: `{${keys.length} properties}`,
          color: "text-node-trigger",
          type: "object",
          icon: "📋",
          fullText: JSON.stringify(parsedValue, null, 2),
        };
        break;

      default:
        // Get node-specific styling from registry
        const nodeSpecificStyling = getNodeSpecificStyling(
          nodeType,
          outputPreferences
        );

        baseFormatting = {
          text: String(output),
          color:
            nodeSpecificStyling.color || "text-node-view",
          type: "string",
          icon: nodeSpecificStyling.icon || "📝",
        };
        break;
    }

    // Add registry metadata
    baseFormatting.metadata = {
      nodeDisplayName: outputPreferences.displayName,
      nodeIcon: outputPreferences.customIcon,
      nodeCategory: outputPreferences.category,
    };

    return baseFormatting;
  }, [output, nodeType, outputPreferences]);

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="text-xs space-y-2">
      {/* OUTPUT HEADER - Registry-enhanced */}
      <div className="font-semibold text-node-view flex items-center justify-between">
        <div className="flex items-center gap-1">
          <span>Output:</span>

          {/* DATA TYPE INDICATOR */}
          {formatOutput.icon && (
            <span
              className="text-sm cursor-help"
              title={`Type: ${formatOutput.type}`}
            >
              {formatOutput.icon}
            </span>
          )}

          {/* NODE METADATA INDICATOR */}
          {formatOutput.metadata?.nodeIcon && (
            <span
              className="text-xs opacity-60 cursor-help"
              title={`From: ${formatOutput.metadata.nodeDisplayName} (${formatOutput.metadata.nodeCategory})`}
            >
              {formatOutput.metadata.nodeIcon}
            </span>
          )}
        </div>

        {/* COPY BUTTON */}
        {output && (
          <button
            onClick={() =>
              copyToClipboard(formatOutput.fullText || formatOutput.text)
            }
            className="text-[10px] px-1 py-0.5 bg-node-view-hover hover:bg-node-view-hover
                       rounded transition-colors cursor-pointer"
            title="Copy output to clipboard"
          >
            📋
          </button>
        )}
      </div>

      {/* OUTPUT VALUE DISPLAY */}
      <div
        className={`font-mono break-all bg-node-view-hover rounded-md px-3 py-2 border-node-view ${formatOutput.color} cursor-text`}
        onClick={() =>
          output && copyToClipboard(formatOutput.fullText || formatOutput.text)
        }
        title="Click to copy"
      >
        {formatOutput.text}
      </div>

      {/* EXPANDED VIEW FOR COMPLEX TYPES */}
      {formatOutput.fullText && (
        <details className="mt-2">
          <summary className="text-xs text-node-view-text-secondary cursor-pointer hover:text-node-view select-none">
            📖 View full {formatOutput.type} (
            {formatOutput.fullText.split("\n").length} lines)
          </summary>
          <div className="mt-2 p-3 bg-node-view rounded border-node-view text-xs font-mono overflow-auto max-h-48">
            <div className="flex justify-between items-center mb-2">
              <span className="text-node-view-text-secondary text-[10px]">
                Full {formatOutput.type.toUpperCase()} Content:
              </span>
              <button
                onClick={() => copyToClipboard(formatOutput.fullText!)}
                className="text-[10px] px-1 py-0.5 bg-node-create hover:bg-node-create-hover
                           rounded transition-colors"
                title="Copy full content"
              >
                📋 Copy All
              </button>
            </div>
            <pre className="whitespace-pre-wrap text-node-view-text-secondary leading-relaxed">
              {formatOutput.fullText}
            </pre>
          </div>
        </details>
      )}

      {/* REGISTRY DEBUG INFO - Development only */}
      {process.env.NODE_ENV === "development" &&
        outputPreferences.hasCustomFormatting && (
          <div className="mt-2 p-2 bg-node-create rounded text-[10px] border-node-create">
            <div className="font-medium text-node-create-text mb-1">
              🔧 Registry Output Info:
            </div>
            <div className="space-y-0.5 text-node-create-text-secondary">
              <div>
                Node: <code>{formatOutput.metadata?.nodeDisplayName}</code>
              </div>
              <div>
                Category: <code>{formatOutput.metadata?.nodeCategory}</code>
              </div>
              <div>
                Data Type: <code>{formatOutput.type}</code>
              </div>
              <div>Registry Enhanced: ✅</div>
            </div>
          </div>
        )}
    </div>
  );
};
