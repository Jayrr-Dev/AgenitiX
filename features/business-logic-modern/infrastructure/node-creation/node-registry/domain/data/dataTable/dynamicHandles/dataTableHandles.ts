/**
 * DATA TABLE DYNAMIC HANDLES
 *
 * Generates handles based on table column configuration
 * Each column gets input/output handles for data flow
 */

import { Position } from "@xyflow/react";
import type { Handle } from "../../../../schemas/base";

interface TableColumn {
  id: string;
  label: string;
  type: "string" | "number" | "boolean" | "date";
  width?: number;
  sortable?: boolean;
  filterable?: boolean;
  visible?: boolean;
}

interface DataTableNodeData {
  columns: TableColumn[];
  rows: Record<string, unknown>[];
  pagination: {
    page: number;
    pageSize: number;
    totalRows: number;
  };
  filters: Record<string, unknown>;
  sorting?: {
    column?: string;
    direction: "asc" | "desc";
  };
  selection: {
    mode: "none" | "single" | "multiple";
    selected: string[];
  };
}

/**
 * Generate dynamic handles based on table configuration
 */
export function generateDataTableHandles(
  nodeData: DataTableNodeData
): Handle[] {
  const handles: Handle[] = [];

  // Static handles
  handles.push(
    {
      id: "data-input",
      type: "target",
      dataType: "array",
      position: Position.Left,
      label: "Table Data",
      isConnectable: true,
    },
    {
      id: "filtered-output",
      type: "source",
      dataType: "array",
      position: Position.Right,
      label: "Filtered Data",
      isConnectable: true,
    },
    {
      id: "selected-output",
      type: "source",
      dataType: "array",
      position: Position.Bottom,
      label: "Selected Rows",
      isConnectable: true,
    }
  );

  // Dynamic column-based handles
  nodeData.columns.forEach((column, index) => {
    if (!column.visible) return;

    // Input handle for column data
    handles.push({
      id: `column-${column.id}-input`,
      type: "target",
      dataType:
        column.type === "string"
          ? "text"
          : column.type === "number"
            ? "number"
            : column.type === "boolean"
              ? "boolean"
              : "any",
      position: Position.Top,
      label: `${column.label} Input`,
      isConnectable: true,
      style: {
        left: `${20 + index * 80}px`,
      },
    });

    // Output handle for column values
    handles.push({
      id: `column-${column.id}-output`,
      type: "source",
      dataType:
        column.type === "string"
          ? "text"
          : column.type === "number"
            ? "number"
            : column.type === "boolean"
              ? "boolean"
              : "any",
      position: Position.Bottom,
      label: `${column.label} Values`,
      isConnectable: true,
      style: {
        left: `${20 + index * 80}px`,
      },
    });
  });

  // Sorting controls
  if (nodeData.sorting) {
    handles.push({
      id: "sort-trigger",
      type: "target",
      dataType: "text",
      position: Position.Left,
      label: "Sort Column",
      isConnectable: true,
      style: {
        top: "60px",
      },
    });
  }

  // Filter controls
  if (Object.keys(nodeData.filters).length > 0) {
    handles.push({
      id: "filter-input",
      type: "target",
      dataType: "object",
      position: Position.Left,
      label: "Filter Data",
      isConnectable: true,
      style: {
        top: "100px",
      },
    });
  }

  return handles;
}

export default generateDataTableHandles;
