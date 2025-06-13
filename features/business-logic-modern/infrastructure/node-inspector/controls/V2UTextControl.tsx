/**
 * V2U TEXT CONTROL COMPONENT - Enhanced text editing control for V2U nodes
 *
 * 🎯 V2U ENHANCED CONTROLS: Modern text control with defineNode() integration
 * • Advanced text input with V2U lifecycle integration
 * • Real-time validation and character counting
 * • Performance optimization with debounced updates
 * • Security validation for text content
 * • Integration with V2U metadata and analytics
 * • Enhanced accessibility and keyboard shortcuts
 *
 * Keywords: v2u-controls, text-editing, defineNode, validation, performance, security
 */

import React, { useCallback, useEffect, useRef, useState } from "react";
import { BaseControlProps } from "../types";
import {
  ActionButton,
  BaseControl,
  ControlGroup,
  EnhancedTextarea,
  StatusBadge,
} from "./BaseControl";

// ============================================================================
// V2U TEXT CONTROL INTERFACES
// ============================================================================

interface V2UTextControlProps extends BaseControlProps {
  // V2U Enhanced props
  maxLength?: number;
  enableRealTimeValidation?: boolean;
  showCharacterCount?: boolean;
  showWordCount?: boolean;
  enableTextAnalytics?: boolean;
  placeholder?: string;
  multiline?: boolean;
  rows?: number;
}

interface TextMetrics {
  characters: number;
  words: number;
  lines: number;
  isValid: boolean;
  validationMessage?: string;
}

// ============================================================================
// V2U TEXT VALIDATION HELPERS
// ============================================================================

function validateV2UText(
  text: string,
  maxLength?: number
): {
  isValid: boolean;
  message?: string;
} {
  if (!text) {
    return { isValid: true };
  }

  // Length validation
  if (maxLength && text.length > maxLength) {
    return {
      isValid: false,
      message: `Text exceeds maximum length of ${maxLength} characters`,
    };
  }

  // V2U Security validation
  const securityPatterns = [
    /<script[^>]*>.*?<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /eval\s*\(/gi,
    /Function\s*\(/gi,
  ];

  for (const pattern of securityPatterns) {
    if (pattern.test(text)) {
      return {
        isValid: false,
        message: "Text contains potentially unsafe content",
      };
    }
  }

  return { isValid: true };
}

function calculateTextMetrics(text: string, maxLength?: number): TextMetrics {
  const characters = text.length;
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const lines = text.split("\n").length;
  const validation = validateV2UText(text, maxLength);

  return {
    characters,
    words,
    lines,
    isValid: validation.isValid,
    validationMessage: validation.message,
  };
}

// ============================================================================
// V2U TEXT CONTROL COMPONENT
// ============================================================================

export const V2UTextControl: React.FC<V2UTextControlProps> = ({
  node,
  updateNodeData,
  v2uState,
  debugMode = false,
  maxLength = 100000,
  enableRealTimeValidation = true,
  showCharacterCount = true,
  showWordCount = true,
  enableTextAnalytics = true,
  placeholder = "Enter your text here...",
  multiline = true,
  rows = 4,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Get current text value
  const currentText =
    typeof node.data.heldText === "string" ? node.data.heldText : "";

  // Local state for real-time feedback
  const [localText, setLocalText] = useState(currentText);
  const [metrics, setMetrics] = useState<TextMetrics>(() =>
    calculateTextMetrics(currentText, maxLength)
  );
  const [isDirty, setIsDirty] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Debounced update to node data
  const debouncedUpdate = useCallback(
    (() => {
      let timeoutId: ReturnType<typeof setTimeout>;
      return (text: string) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          updateNodeData(node.id, { heldText: text });
          setIsDirty(false);
          setLastSaved(new Date());
        }, 300); // 300ms debounce
      };
    })(),
    [node.id, updateNodeData]
  );

  // Handle text changes
  const handleTextChange = useCallback(
    (value: string) => {
      setLocalText(value);
      setIsDirty(true);

      // Update metrics in real-time
      if (enableRealTimeValidation) {
        const newMetrics = calculateTextMetrics(value, maxLength);
        setMetrics(newMetrics);
      }

      // Debounced update to node
      debouncedUpdate(value);
    },
    [enableRealTimeValidation, maxLength, debouncedUpdate]
  );

  // Sync with external changes
  useEffect(() => {
    if (currentText !== localText && !isDirty) {
      setLocalText(currentText);
      setMetrics(calculateTextMetrics(currentText, maxLength));
    }
  }, [currentText, localText, isDirty, maxLength]);

  // Manual save function
  const handleManualSave = useCallback(() => {
    updateNodeData(node.id, { heldText: localText });
    setIsDirty(false);
    setLastSaved(new Date());
  }, [node.id, localText, updateNodeData]);

  // Clear text function
  const handleClearText = useCallback(() => {
    setLocalText("");
    updateNodeData(node.id, { heldText: "" });
    setIsDirty(false);
    setLastSaved(new Date());
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [node.id, updateNodeData]);

  // V2U metadata detection
  const isV2UNode = !!(node.data as any)._v2uMigrated;
  const v2uVersion = (node.data as any)._v2uVersion;

  return (
    <BaseControl title="V2U Text Input" nodeType={node.type}>
      {/* V2U Status Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <StatusBadge
            status={isV2UNode}
            trueLabel="V2U"
            falseLabel="Legacy"
            nodeType={node.type}
          />
          {v2uVersion && (
            <span className="text-xs px-2 py-1 bg-info text-info-text rounded-full">
              v{v2uVersion}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {isDirty && (
            <span className="text-xs text-warning">
              ● Unsaved
            </span>
          )}
          {lastSaved && !isDirty && (
            <span className="text-xs text-success">
              ✓ Saved
            </span>
          )}
        </div>
      </div>

      {/* Text Input */}
      <ControlGroup nodeType={node.type}>
        <div className="space-y-2">
          <EnhancedTextarea
            value={localText}
            onChange={handleTextChange}
            placeholder={placeholder}
            rows={rows}
            nodeType={node.type}
            className={`${!metrics.isValid ? "border-error bg-error" : ""}`}
          />

          {/* Validation Error */}
          {!metrics.isValid && metrics.validationMessage && (
            <div className="text-xs text-error p-2 bg-error rounded border-error">
              ⚠️ {metrics.validationMessage}
            </div>
          )}
        </div>
      </ControlGroup>

      {/* Text Analytics */}
      {enableTextAnalytics && (
        <ControlGroup title="Text Analytics" nodeType={node.type}>
          <div className="grid grid-cols-2 gap-3 text-xs">
            {showCharacterCount && (
              <div className="p-2 bg-node-view rounded border-node-view">
                <div className="text-node-view-text-secondary">
                  Characters
                </div>
                <div
                  className={`text-lg font-semibold ${
                    maxLength && metrics.characters > maxLength * 0.9
                      ? "text-warning"
                      : "text-node-view"
                  }`}
                >
                  {metrics.characters}
                  {maxLength && (
                    <span className="text-xs text-node-view-text-secondary">/{maxLength}</span>
                  )}
                </div>
              </div>
            )}

            {showWordCount && (
              <div className="p-2 bg-node-view rounded border-node-view">
                <div className="text-node-view-text-secondary">Words</div>
                <div className="text-lg font-semibold text-node-view">
                  {metrics.words}
                </div>
              </div>
            )}

            <div className="p-2 bg-node-view rounded border-node-view">
              <div className="text-node-view-text-secondary">Lines</div>
              <div className="text-lg font-semibold text-node-view">
                {metrics.lines}
              </div>
            </div>

            <div className="p-2 bg-node-view rounded border-node-view">
              <div className="text-node-view-text-secondary">Status</div>
              <div
                className={`text-sm font-medium ${
                  metrics.isValid
                    ? "text-success"
                    : "text-error"
                }`}
              >
                {metrics.isValid ? "✓ Valid" : "⚠️ Invalid"}
              </div>
            </div>
          </div>
        </ControlGroup>
      )}

      {/* Action Buttons */}
      <ControlGroup nodeType={node.type}>
        <div className="flex items-center gap-2">
          {isDirty && (
            <ActionButton
              onClick={handleManualSave}
              variant="primary"
              nodeType={node.type}
            >
              💾 Save Now
            </ActionButton>
          )}

          {localText && (
            <ActionButton
              onClick={handleClearText}
              variant="secondary"
              nodeType={node.type}
            >
              🗑️ Clear
            </ActionButton>
          )}
        </div>
      </ControlGroup>

      {/* V2U Debug Info */}
      {debugMode && v2uState && (
        <ControlGroup title="V2U Debug Info" nodeType={node.type}>
          <div className="text-xs space-y-1">
            <div className="p-2 bg-infra-inspector rounded font-mono">
              <div>Node ID: {node.id}</div>
              <div>V2U Migrated: {isV2UNode ? "Yes" : "No"}</div>
              <div>
                Performance: {v2uState.performance.averageExecutionTime}ms avg
              </div>
              <div>Executions: {v2uState.performance.executionCount}</div>
              <div>Memory: {v2uState.performance.memoryUsage}MB</div>
            </div>
          </div>
        </ControlGroup>
      )}
    </BaseControl>
  );
};

export default V2UTextControl;
