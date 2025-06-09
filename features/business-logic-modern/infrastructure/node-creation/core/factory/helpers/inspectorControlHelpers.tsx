/**
 * INSPECTOR CONTROL HELPERS - Helper components for node inspector controls
 *
 * • Provides reusable helper components for building inspector interfaces
 * • Implements common control patterns and input validation helpers
 * • Supports dynamic form generation and data binding utilities
 * • Features accessibility and styling helpers for consistent UI
 * • Integrates with inspector systems for enhanced user experience
 *
 * Keywords: inspector-controls, helper-components, form-generation, validation, accessibility, ui-consistency
 */

"use client";

import React from "react";
import type { BaseNodeData, InspectorControlProps } from "../types";

// ============================================================================
// COMMON CONTROL CREATORS
// ============================================================================

/**
 * CREATE TEXT INPUT CONTROL
 * Creates a text input control for inspector
 */
export function createTextInputControl(
  label: string,
  dataKey: string,
  placeholder?: string
): <T extends BaseNodeData>(
  props: InspectorControlProps<T>
) => React.ReactElement {
  return function TextInputControl<T extends BaseNodeData>({
    node,
    updateNodeData,
  }: InspectorControlProps<T>) {
    return (
      <div className="flex flex-col gap-2">
        <label className="block text-xs">
          <div className="flex flex-row gap-2">
            <span className="py-1">{label}:</span>
            <input
              type="text"
              className="w-full rounded border px-1 py-1 text-xs"
              placeholder={placeholder}
              value={
                typeof node.data[dataKey] === "string" ? node.data[dataKey] : ""
              }
              onChange={(e) =>
                updateNodeData(node.id, { [dataKey]: e.target.value })
              }
            />
          </div>
        </label>
      </div>
    );
  };
}

/**
 * CREATE NUMBER INPUT CONTROL
 * Creates a number input control for inspector
 */
export function createNumberInputControl(
  label: string,
  dataKey: string,
  min?: number,
  max?: number,
  step?: number
): <T extends BaseNodeData>(
  props: InspectorControlProps<T>
) => React.ReactElement {
  return function NumberInputControl<T extends BaseNodeData>({
    node,
    updateNodeData,
  }: InspectorControlProps<T>) {
    return (
      <div className="flex flex-col gap-2">
        <label className="block text-xs">
          <div className="flex flex-row gap-2">
            <span className="py-1">{label}:</span>
            <input
              type="number"
              className="w-full rounded border px-1 py-1 text-xs"
              min={min}
              max={max}
              step={step}
              value={
                typeof node.data[dataKey] === "number" ? node.data[dataKey] : 0
              }
              onChange={(e) =>
                updateNodeData(node.id, { [dataKey]: Number(e.target.value) })
              }
            />
          </div>
        </label>
      </div>
    );
  };
}

/**
 * CREATE CHECKBOX CONTROL
 * Creates a checkbox control for inspector
 */
export function createCheckboxControl(
  label: string,
  dataKey: string
): <T extends BaseNodeData>(
  props: InspectorControlProps<T>
) => React.ReactElement {
  return function CheckboxControl<T extends BaseNodeData>({
    node,
    updateNodeData,
  }: InspectorControlProps<T>) {
    return (
      <div className="flex flex-col gap-2">
        <label className="block text-xs">
          <div className="flex flex-row gap-2 items-center">
            <input
              type="checkbox"
              className="rounded border"
              checked={!!node.data[dataKey]}
              onChange={(e) =>
                updateNodeData(node.id, { [dataKey]: e.target.checked })
              }
            />
            <span>{label}</span>
          </div>
        </label>
      </div>
    );
  };
}

/**
 * CREATE SELECT CONTROL
 * Creates a select dropdown control for inspector
 */
export function createSelectControl(
  label: string,
  dataKey: string,
  options: Array<{ value: string | number; label: string }>
): <T extends BaseNodeData>(
  props: InspectorControlProps<T>
) => React.ReactElement {
  return function SelectControl<T extends BaseNodeData>({
    node,
    updateNodeData,
  }: InspectorControlProps<T>) {
    return (
      <div className="flex flex-col gap-2">
        <label className="block text-xs">
          <div className="flex flex-row gap-2">
            <span className="py-1">{label}:</span>
            <select
              className="w-full rounded border px-1 py-1 text-xs"
              value={node.data[dataKey] || ""}
              onChange={(e) =>
                updateNodeData(node.id, { [dataKey]: e.target.value })
              }
            >
              {options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </label>
      </div>
    );
  };
}

/**
 * CREATE TEXTAREA CONTROL
 * Creates a textarea control for inspector
 */
export function createTextareaControl(
  label: string,
  dataKey: string,
  placeholder?: string,
  rows: number = 3
): <T extends BaseNodeData>(
  props: InspectorControlProps<T>
) => React.ReactElement {
  return function TextareaControl<T extends BaseNodeData>({
    node,
    updateNodeData,
  }: InspectorControlProps<T>) {
    return (
      <div className="flex flex-col gap-2">
        <label className="block text-xs">
          <div className="flex flex-col gap-1">
            <span>{label}:</span>
            <textarea
              className="w-full rounded border px-2 py-1 text-xs"
              placeholder={placeholder}
              rows={rows}
              value={
                typeof node.data[dataKey] === "string" ? node.data[dataKey] : ""
              }
              onChange={(e) =>
                updateNodeData(node.id, { [dataKey]: e.target.value })
              }
            />
          </div>
        </label>
      </div>
    );
  };
}

/**
 * CREATE RANGE CONTROL
 * Creates a range/slider control for inspector
 */
export function createRangeControl(
  label: string,
  dataKey: string,
  min: number = 0,
  max: number = 100,
  step: number = 1
): <T extends BaseNodeData>(
  props: InspectorControlProps<T>
) => React.ReactElement {
  return function RangeControl<T extends BaseNodeData>({
    node,
    updateNodeData,
  }: InspectorControlProps<T>) {
    return (
      <div className="flex flex-col gap-2">
        <label className="block text-xs">
          <div className="flex flex-col gap-1">
            <div className="flex justify-between">
              <span>{label}:</span>
              <span className="font-mono">{node.data[dataKey] || min}</span>
            </div>
            <input
              type="range"
              className="w-full"
              min={min}
              max={max}
              step={step}
              value={
                typeof node.data[dataKey] === "number"
                  ? node.data[dataKey]
                  : min
              }
              onChange={(e) =>
                updateNodeData(node.id, { [dataKey]: Number(e.target.value) })
              }
            />
          </div>
        </label>
      </div>
    );
  };
}

/**
 * CREATE COLOR CONTROL
 * Creates a color picker control for inspector
 */
export function createColorControl(
  label: string,
  dataKey: string
): <T extends BaseNodeData>(
  props: InspectorControlProps<T>
) => React.ReactElement {
  return function ColorControl<T extends BaseNodeData>({
    node,
    updateNodeData,
  }: InspectorControlProps<T>) {
    return (
      <div className="flex flex-col gap-2">
        <label className="block text-xs">
          <div className="flex flex-row gap-2 items-center">
            <span className="py-1">{label}:</span>
            <input
              type="color"
              className="w-8 h-8 rounded border cursor-pointer"
              value={node.data[dataKey] || "#000000"}
              onChange={(e) =>
                updateNodeData(node.id, { [dataKey]: e.target.value })
              }
            />
            <input
              type="text"
              className="flex-1 rounded border px-1 py-1 text-xs font-mono"
              value={node.data[dataKey] || "#000000"}
              onChange={(e) =>
                updateNodeData(node.id, { [dataKey]: e.target.value })
              }
            />
          </div>
        </label>
      </div>
    );
  };
}

// ============================================================================
// COMPOSITE CONTROL CREATORS
// ============================================================================

/**
 * CREATE GROUP CONTROL
 * Creates a group of controls with a title
 */
export function createGroupControl(
  title: string,
  controls: Array<(props: InspectorControlProps<any>) => React.ReactNode>
): <T extends BaseNodeData>(
  props: InspectorControlProps<T>
) => React.ReactElement {
  return function GroupControl<T extends BaseNodeData>(
    props: InspectorControlProps<T>
  ) {
    return (
      <div className="flex flex-col gap-3">
        <div className="text-sm font-medium text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-600 pb-1">
          {title}
        </div>
        <div className="flex flex-col gap-2 pl-2">
          {controls.map((control, index) => (
            <div key={index}>{control(props)}</div>
          ))}
        </div>
      </div>
    );
  };
}

/**
 * CREATE CONDITIONAL CONTROL
 * Creates a control that only renders based on a condition
 */
export function createConditionalControl<T extends BaseNodeData>(
  condition: (data: T) => boolean,
  control: (props: InspectorControlProps<T>) => React.ReactNode
): (props: InspectorControlProps<T>) => React.ReactNode {
  return function ConditionalControl(props: InspectorControlProps<T>) {
    if (!condition(props.node.data)) {
      return null;
    }
    return control(props);
  };
}

/**
 * CREATE BUTTON CONTROL
 * Creates a button control for actions
 */
export function createButtonControl(
  label: string,
  onClick: (node: any, updateNodeData: any) => void,
  variant: "primary" | "secondary" | "danger" = "primary"
): <T extends BaseNodeData>(
  props: InspectorControlProps<T>
) => React.ReactElement {
  return function ButtonControl<T extends BaseNodeData>({
    node,
    updateNodeData,
  }: InspectorControlProps<T>) {
    const baseClasses =
      "px-3 py-2 rounded text-xs font-medium transition-colors";
    const variantClasses = {
      primary: "bg-blue-500 hover:bg-blue-600 text-white",
      secondary:
        "bg-gray-200 hover:bg-gray-300 text-gray-800 dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-white",
      danger: "bg-red-500 hover:bg-red-600 text-white",
    };

    return (
      <button
        className={`${baseClasses} ${variantClasses[variant]}`}
        onClick={() => onClick(node, updateNodeData)}
      >
        {label}
      </button>
    );
  };
}
