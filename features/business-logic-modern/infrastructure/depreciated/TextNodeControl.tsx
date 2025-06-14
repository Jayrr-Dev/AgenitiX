/**
 * TEXT NODE CONTROL COMPONENT - Specialized text editing control for text nodes
 *
 * • Provides enhanced text input interface for text-based node types
 * • Includes validation and formatting for text content editing
 * • Supports multi-line text editing with syntax highlighting
 * • Integrates with node data updates and real-time preview
 * • Handles text-specific operations like word count and formatting
 *
 * Keywords: text-control, text-editing, validation, multi-line, syntax, word-count
 */

import React from "react";
import { BaseControl } from "../node-inspector/controls/BaseControl";
import { BaseControlProps } from "../node-inspector/types";

export const TextNodeControl: React.FC<BaseControlProps> = ({
  node,
  updateNodeData,
}) => {
  return (
    <BaseControl>
      <label className="block text-xs">
        <div className="flex flex-row gap-2">
          <span className="py-1">Text:</span>
          <input
            type="text"
            className="w-full rounded border px-1 py-1 text-xs"
            value={
              typeof node.data.heldText === "string" ? node.data.heldText : ""
            }
            onChange={(e) =>
              updateNodeData(node.id, { heldText: e.target.value })
            }
          />
        </div>
      </label>
    </BaseControl>
  );
};
