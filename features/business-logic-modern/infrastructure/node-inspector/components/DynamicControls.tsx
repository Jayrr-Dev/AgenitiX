/**
 * DYNAMIC CONTROLS COMPONENT - Enhanced Schema-Driven Control Generation
 *
 * • Automatically generates form controls from Zod schemas in NodeSpec
 * • Supports 400+ node types with zero maintenance overhead
 * • Provides type-safe editing with built-in validation
 * • Supports all modern control types with extensible architecture
 * • Eliminates manual control mapping and reduces maintenance overhead
 * • Integrates seamlessly with the Plop node creation system
 *
 * Keywords: schema-driven-controls, automatic-generation, scalable-architecture, type-safety, zero-maintenance
 */

"use client";

import React, { useCallback, useMemo, useState } from "react";
import type { AgenNode } from "../../flow-engine/types/nodeData";
import {
  ActionButton,
  BaseControl,
  EnhancedInput,
  EnhancedTextarea,
  StatusBadge,
} from "../controls/BaseControl";
import {
  NodeInspectorService,
  type ControlField,
} from "../services/NodeInspectorService";

// ============================================================================
// COMPONENT INTERFACE
// ============================================================================

interface DynamicControlsProps {
  node: AgenNode;
  updateNodeData: (id: string, patch: Record<string, unknown>) => void;
  onLogError?: (nodeId: string, message: string, type?: string) => void;
}

interface ControlRendererProps {
  field: ControlField;
  value: unknown;
  onChange: (value: unknown) => void;
  nodeType: string;
  hasError: boolean;
  errorMessage?: string;
}

// ============================================================================
// ENHANCED CONTROL RENDERERS
// ============================================================================

/**
 * Text input control renderer
 */
const TextControlRenderer: React.FC<ControlRendererProps> = ({
  field,
  value,
  onChange,
  nodeType,
  hasError,
  errorMessage,
}) => {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-control-input">
        {field.label}
        {field.required && <span className="text-control-error ml-1">*</span>}
      </label>
      <EnhancedInput
        value={String(value || "")}
        onChange={(newValue) => onChange(newValue)}
        placeholder={field.placeholder}
        nodeType={nodeType}
        type="text"
        className={hasError ? "border-control-error" : ""}
      />
      {hasError && errorMessage && (
        <div className="text-xs text-control-error">{errorMessage}</div>
      )}
      {field.description && (
        <div className="text-xs text-control-placeholder">
          {field.description}
        </div>
      )}
    </div>
  );
};

/**
 * Textarea control renderer
 */
const TextareaControlRenderer: React.FC<ControlRendererProps> = ({
  field,
  value,
  onChange,
  nodeType,
  hasError,
  errorMessage,
}) => {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-control-input">
        {field.label}
        {field.required && <span className="text-control-error ml-1">*</span>}
      </label>
      <EnhancedTextarea
        value={String(value || "")}
        onChange={(newValue) => onChange(newValue)}
        placeholder={field.placeholder}
        nodeType={nodeType}
        rows={field.ui?.rows || 4}
        className={hasError ? "border-control-error" : ""}
      />
      {hasError && errorMessage && (
        <div className="text-xs text-control-error">{errorMessage}</div>
      )}
      {field.description && (
        <div className="text-xs text-control-placeholder">
          {field.description}
        </div>
      )}
    </div>
  );
};

/**
 * Number input control renderer
 */
const NumberControlRenderer: React.FC<ControlRendererProps> = ({
  field,
  value,
  onChange,
  nodeType,
  hasError,
  errorMessage,
}) => {
  const handleChange = useCallback(
    (newValue: string) => {
      const numValue = parseFloat(newValue);
      if (!isNaN(numValue)) {
        onChange(numValue);
      } else if (newValue === "") {
        onChange(field.defaultValue);
      }
    },
    [onChange, field.defaultValue]
  );

  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-control-input">
        {field.label}
        {field.required && <span className="text-control-error ml-1">*</span>}
      </label>
      <EnhancedInput
        value={String(value ?? "")}
        onChange={handleChange}
        placeholder={field.placeholder}
        nodeType={nodeType}
        type="number"
        step={field.ui?.step || 1}
        min={field.validation?.min}
        max={field.validation?.max}
        className={hasError ? "border-control-error" : ""}
      />
      {hasError && errorMessage && (
        <div className="text-xs text-control-error">{errorMessage}</div>
      )}
      {field.description && (
        <div className="text-xs text-control-placeholder">
          {field.description}
        </div>
      )}
    </div>
  );
};

/**
 * Boolean control renderer
 */
const BooleanControlRenderer: React.FC<ControlRendererProps> = ({
  field,
  value,
  onChange,
  nodeType,
  hasError,
  errorMessage,
}) => {
  const boolValue = Boolean(value);

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <button
          onClick={() => onChange(!boolValue)}
          className={`
            w-4 h-4 rounded border-2 flex items-center justify-center transition-colors
            ${
              boolValue
                ? "bg-control-success border-control-success text-white"
                : "bg-control-input border-control-input"
            }
            ${hasError ? "border-control-error" : ""}
          `}
        >
          {boolValue && <span className="text-xs">✓</span>}
        </button>
        <label className="text-xs font-medium text-control-input">
          {field.label}
          {field.required && <span className="text-control-error ml-1">*</span>}
        </label>
      </div>
      {hasError && errorMessage && (
        <div className="text-xs text-control-error">{errorMessage}</div>
      )}
      {field.description && (
        <div className="text-xs text-control-placeholder">
          {field.description}
        </div>
      )}
    </div>
  );
};

/**
 * Select control renderer
 */
const SelectControlRenderer: React.FC<ControlRendererProps> = ({
  field,
  value,
  onChange,
  nodeType,
  hasError,
  errorMessage,
}) => {
  const options = field.validation?.options || [];

  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-control-input">
        {field.label}
        {field.required && <span className="text-control-error ml-1">*</span>}
      </label>
      <select
        value={String(value || "")}
        onChange={(e) => onChange(e.target.value)}
        className={`
          w-full p-1 border rounded text-sm
          bg-white dark:bg-neutral-800
          text-black dark:text-white
          border-neutral-300 dark:border-neutral-600
          focus:outline-none focus:ring-2 focus:ring-blue-500
          ${hasError ? "border-control-error" : ""}
        `}
      >
        {!field.required && (
          <option value="">-- Select {field.label} --</option>
        )}
        {options.map((option) => (
          <option key={String(option.value)} value={String(option.value)}>
            {option.label}
          </option>
        ))}
      </select>
      {hasError && errorMessage && (
        <div className="text-xs text-control-error">{errorMessage}</div>
      )}
      {field.description && (
        <div className="text-xs text-control-placeholder">
          {field.description}
        </div>
      )}
    </div>
  );
};

/**
 * URL input control renderer
 */
const UrlControlRenderer: React.FC<ControlRendererProps> = ({
  field,
  value,
  onChange,
  nodeType,
  hasError,
  errorMessage,
}) => {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-control-input">
        {field.label}
        {field.required && <span className="text-control-error ml-1">*</span>}
      </label>
      <EnhancedInput
        value={String(value || "")}
        onChange={(newValue) => onChange(newValue)}
        placeholder={field.placeholder || "https://example.com"}
        nodeType={nodeType}
        type="url"
        className={hasError ? "border-control-error" : ""}
      />
      {hasError && errorMessage && (
        <div className="text-xs text-control-error">{errorMessage}</div>
      )}
      {field.description && (
        <div className="text-xs text-control-placeholder">
          {field.description}
        </div>
      )}
    </div>
  );
};

/**
 * Email input control renderer
 */
const EmailControlRenderer: React.FC<ControlRendererProps> = ({
  field,
  value,
  onChange,
  nodeType,
  hasError,
  errorMessage,
}) => {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-control-input">
        {field.label}
        {field.required && <span className="text-control-error ml-1">*</span>}
      </label>
      <EnhancedInput
        value={String(value || "")}
        onChange={(newValue) => onChange(newValue)}
        placeholder={field.placeholder || "user@example.com"}
        nodeType={nodeType}
        type="email"
        className={hasError ? "border-control-error" : ""}
      />
      {hasError && errorMessage && (
        <div className="text-xs text-control-error">{errorMessage}</div>
      )}
      {field.description && (
        <div className="text-xs text-control-placeholder">
          {field.description}
        </div>
      )}
    </div>
  );
};

/**
 * Color input control renderer
 */
const ColorControlRenderer: React.FC<ControlRendererProps> = ({
  field,
  value,
  onChange,
  nodeType,
  hasError,
  errorMessage,
}) => {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-control-input">
        {field.label}
        {field.required && <span className="text-control-error ml-1">*</span>}
      </label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={String(value || "#000000")}
          onChange={(e) => onChange(e.target.value)}
          className={`
            w-8 h-8 rounded border cursor-pointer
            ${hasError ? "border-control-error" : "border-neutral-300 dark:border-neutral-600"}
          `}
        />
        <EnhancedInput
          value={String(value || "")}
          onChange={(newValue) => onChange(newValue)}
          placeholder="#000000"
          nodeType={nodeType}
          type="text"
          className={hasError ? "border-control-error" : ""}
        />
      </div>
      {hasError && errorMessage && (
        <div className="text-xs text-control-error">{errorMessage}</div>
      )}
      {field.description && (
        <div className="text-xs text-control-placeholder">
          {field.description}
        </div>
      )}
    </div>
  );
};

/**
 * Date input control renderer
 */
const DateControlRenderer: React.FC<ControlRendererProps> = ({
  field,
  value,
  onChange,
  nodeType,
  hasError,
  errorMessage,
}) => {
  const dateValue =
    value instanceof Date
      ? value.toISOString().split("T")[0]
      : String(value || "");

  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-control-input">
        {field.label}
        {field.required && <span className="text-control-error ml-1">*</span>}
      </label>
      <input
        type="date"
        value={dateValue}
        onChange={(e) => onChange(new Date(e.target.value))}
        className={`
          w-full p-1 border rounded text-sm
          bg-white dark:bg-neutral-800
          text-black dark:text-white
          border-neutral-300 dark:border-neutral-600
          focus:outline-none focus:ring-2 focus:ring-blue-500
          ${hasError ? "border-control-error" : ""}
        `}
      />
      {hasError && errorMessage && (
        <div className="text-xs text-control-error">{errorMessage}</div>
      )}
      {field.description && (
        <div className="text-xs text-control-placeholder">
          {field.description}
        </div>
      )}
    </div>
  );
};

/**
 * JSON input control renderer
 */
const JsonControlRenderer: React.FC<ControlRendererProps> = ({
  field,
  value,
  onChange,
  nodeType,
  hasError,
  errorMessage,
}) => {
  const [jsonString, setJsonString] = useState(() => {
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return String(value || "{}");
    }
  });

  const [jsonError, setJsonError] = useState<string | null>(null);

  const handleJsonChange = useCallback(
    (newValue: string) => {
      setJsonString(newValue);
      try {
        const parsed = JSON.parse(newValue);
        onChange(parsed);
        setJsonError(null);
      } catch (error) {
        setJsonError(error instanceof Error ? error.message : "Invalid JSON");
      }
    },
    [onChange]
  );

  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-control-input">
        {field.label}
        {field.required && <span className="text-control-error ml-1">*</span>}
      </label>
      <EnhancedTextarea
        value={jsonString}
        onChange={handleJsonChange}
        placeholder={field.placeholder || '{"key": "value"}'}
        nodeType={nodeType}
        rows={field.ui?.rows || 6}
        className={`font-mono ${hasError || jsonError ? "border-control-error" : ""}`}
      />
      {(hasError || jsonError) && (
        <div className="text-xs text-control-error">
          {errorMessage || jsonError}
        </div>
      )}
      {field.ui?.showPreview && !jsonError && (
        <div className="text-xs text-control-placeholder">
          <div className="font-medium">Preview:</div>
          <pre className="mt-1 p-2 bg-control-debug rounded text-xs overflow-auto max-h-20">
            {JSON.stringify(value, null, 2)}
          </pre>
        </div>
      )}
      {field.description && (
        <div className="text-xs text-control-placeholder">
          {field.description}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// MAIN DYNAMIC CONTROLS COMPONENT
// ============================================================================

export const DynamicControls: React.FC<DynamicControlsProps> = ({
  node,
  updateNodeData,
  onLogError,
}) => {
  // State for tracking validation errors and pending updates
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});
  const [pendingUpdates, setPendingUpdates] = useState<Record<string, unknown>>(
    {}
  );

  // Generate control fields from the node's schema using enhanced service
  const controlFields = useMemo(() => {
    return NodeInspectorService.generateControlFields(node.type as any);
  }, [node.type]);

  // Get current node data with defaults applied
  const nodeDataWithDefaults = useMemo(() => {
    return NodeInspectorService.getNodeDataWithDefaults(node);
  }, [node]);

  // Check if the node has any custom controls available
  const hasControls = controlFields.length > 0;

  /**
   * Handle individual field updates with validation
   */
  const handleFieldUpdate = useCallback(
    (fieldKey: string, value: unknown) => {
      // Update pending changes
      setPendingUpdates((prev) => ({
        ...prev,
        [fieldKey]: value,
      }));

      // Apply update immediately for better UX
      updateNodeData(node.id, { [fieldKey]: value });

      // Clear any existing validation error for this field
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[fieldKey];
        return newErrors;
      });

      // Validate the update
      const updateResult = NodeInspectorService.updateNodeData(node, {
        [fieldKey]: value,
      });

      if (!updateResult.success) {
        // Set validation error
        const fieldError = updateResult.errors.find((error) =>
          error.startsWith(`${fieldKey}:`)
        );
        if (fieldError) {
          setValidationErrors((prev) => ({
            ...prev,
            [fieldKey]: fieldError,
          }));
        }

        // Log error if handler provided
        if (onLogError) {
          onLogError(
            node.id,
            `Validation failed for ${fieldKey}: ${fieldError || "Unknown error"}`,
            "warning"
          );
        }
      }
    },
    [node, pendingUpdates, updateNodeData, onLogError]
  );

  /**
   * Apply all pending updates at once
   */
  const handleApplyAllUpdates = useCallback(() => {
    if (Object.keys(pendingUpdates).length === 0) return;

    const updateResult = NodeInspectorService.updateNodeData(
      node,
      pendingUpdates
    );

    if (updateResult.success) {
      updateNodeData(node.id, pendingUpdates);
      setPendingUpdates({});
      setValidationErrors({});
    } else {
      // Set validation errors for failed fields
      const newErrors: Record<string, string> = {};
      updateResult.errors.forEach((error) => {
        const fieldMatch = error.match(/^([^:]+):/);
        if (fieldMatch) {
          newErrors[fieldMatch[1]] = error;
        }
      });
      setValidationErrors(newErrors);

      if (onLogError) {
        onLogError(
          node.id,
          `Batch update failed: ${updateResult.errors.join(", ")}`,
          "error"
        );
      }
    }
  }, [node, pendingUpdates, updateNodeData, onLogError]);

  /**
   * Reset all pending changes
   */
  const handleResetChanges = useCallback(() => {
    setPendingUpdates({});
    setValidationErrors({});
  }, []);

  /**
   * Render individual control based on field type
   */
  const renderControl = useCallback(
    (field: ControlField) => {
      const currentValue =
        pendingUpdates[field.key] ??
        nodeDataWithDefaults[field.key] ??
        field.defaultValue;
      const hasError = field.key in validationErrors;
      const errorMessage = validationErrors[field.key];

      const commonProps: ControlRendererProps = {
        field,
        value: currentValue,
        onChange: (value) => handleFieldUpdate(field.key, value),
        nodeType: node.type as string,
        hasError,
        errorMessage,
      };

      switch (field.type) {
        case "textarea":
          return <TextareaControlRenderer key={field.key} {...commonProps} />;
        case "number":
          return <NumberControlRenderer key={field.key} {...commonProps} />;
        case "boolean":
          return <BooleanControlRenderer key={field.key} {...commonProps} />;
        case "select":
          return <SelectControlRenderer key={field.key} {...commonProps} />;
        case "url":
          return <UrlControlRenderer key={field.key} {...commonProps} />;
        case "email":
          return <EmailControlRenderer key={field.key} {...commonProps} />;
        case "color":
          return <ColorControlRenderer key={field.key} {...commonProps} />;
        case "date":
          return <DateControlRenderer key={field.key} {...commonProps} />;
        case "json":
          return <JsonControlRenderer key={field.key} {...commonProps} />;
        case "text":
        default:
          return <TextControlRenderer key={field.key} {...commonProps} />;
      }
    },
    [
      nodeDataWithDefaults,
      pendingUpdates,
      validationErrors,
      handleFieldUpdate,
      node.type,
    ]
  );

  // ============================================================================
  // RENDER
  // ============================================================================

  // Check for custom control component first
  const controlConfig = NodeInspectorService.getNodeControlConfig(
    node.type as any
  );
  if (controlConfig.hasCustomComponent) {
    // TODO: Implement custom component loading
    console.log(`Custom component: ${controlConfig.customComponentName}`);
  }

  if (!hasControls) {
    return (
      <div className="text-xs text-control-placeholder p-3 text-center italic">
        No controls available for this node type.
        <br />
        <span className="text-control-debug">
          Node type: <code>{node.type}</code>
        </span>
        <br />
        <span className="text-control-debug">
          Add a <code>dataSchema</code> to your NodeSpec to enable automatic
          controls.
        </span>
      </div>
    );
  }

  const hasPendingUpdates = Object.keys(pendingUpdates).length > 0;
  const hasValidationErrors = Object.keys(validationErrors).length > 0;

  return (
    <BaseControl title="Node Configuration" nodeType={node.type}>
      {/* Control Fields */}
      <div className="space-y-4">{controlFields.map(renderControl)}</div>

      {/* Pending Updates Status */}
      {(hasPendingUpdates || hasValidationErrors) && (
        <div className="mt-4 p-3 bg-control-debug rounded border-control-input">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs font-medium text-control-input">
              Update Status
            </div>
            <div className="flex gap-2">
              <StatusBadge
                status={!hasValidationErrors}
                trueLabel="VALID"
                falseLabel="ERRORS"
                nodeType={node.type}
              />
            </div>
          </div>

          {hasPendingUpdates && (
            <div className="text-xs text-control-placeholder mb-2">
              {Object.keys(pendingUpdates).length} pending changes
            </div>
          )}

          <div className="flex gap-2">
            <ActionButton
              onClick={handleApplyAllUpdates}
              disabled={!hasPendingUpdates || hasValidationErrors}
              variant="primary"
              nodeType={node.type}
            >
              Apply Changes
            </ActionButton>
            <ActionButton
              onClick={handleResetChanges}
              disabled={!hasPendingUpdates && !hasValidationErrors}
              variant="secondary"
              nodeType={node.type}
            >
              Reset
            </ActionButton>
          </div>
        </div>
      )}

      {/* Debug Information (Development Only) */}
      {process.env.NODE_ENV === "development" && (
        <div className="mt-4 p-2 bg-control-warning rounded text-xs border-control-input">
          <div className="font-medium text-control-input mb-1">
            🔧 Schema-Driven Controls Debug:
          </div>
          <div className="space-y-0.5 text-control-placeholder">
            <div>Fields Generated: {controlFields.length}</div>
            <div>
              Has Schema:{" "}
              {NodeInspectorService.hasSchemaControls(node.type as any)
                ? "✅"
                : "❌"}
            </div>
            <div>Pending Updates: {Object.keys(pendingUpdates).length}</div>
            <div>Validation Errors: {Object.keys(validationErrors).length}</div>
            <div>
              Control Types: {controlFields.map((f) => f.type).join(", ")}
            </div>
          </div>
        </div>
      )}
    </BaseControl>
  );
};
