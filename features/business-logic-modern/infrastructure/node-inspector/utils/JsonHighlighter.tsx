/**
 * JSON HIGHLIGHTER - Syntax highlighting for JSON with semantic tokens
 *
 * • Provides syntax highlighting for JSON data in node inspector
 * • Uses semantic tokens for consistent theming across node categories
 * • Supports collapsible object/array structures
 * • Maintains accessibility and readability standards
 * • Integrates with control component theming system
 *
 * Keywords: json-highlighter, semantic-tokens, syntax-highlighting, node-inspector, accessibility
 */

import React, { useState } from "react";

interface JsonHighlighterProps {
  data: any;
  maxDepth?: number;
  className?: string;
}

interface JsonValueProps {
  value: any;
  depth: number;
  maxDepth: number;
  isLast?: boolean;
}

const JsonValue: React.FC<JsonValueProps> = ({ value, depth, maxDepth, isLast = false }) => {
  const [isCollapsed, setIsCollapsed] = useState(depth >= maxDepth);

  if (value === null) {
    return <span className="text-control-debug">null</span>;
  }

  if (value === undefined) {
    return <span className="text-control-debug">undefined</span>;
  }

  if (typeof value === "string") {
    return (
      <span>
        <span className="text-control-success">"</span>
        <span className="text-control-success">{value}</span>
        <span className="text-control-success">"</span>
      </span>
    );
  }

  if (typeof value === "number") {
    return <span className="text-control-warning">{value}</span>;
  }

  if (typeof value === "boolean") {
    return <span className="text-node-create-text">{value.toString()}</span>;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return <span className="text-control-debug">[]</span>;
    }

    return (
      <div className="inline-block">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="text-control-debug hover:text-control-input focus:outline-none"
        >
          <span className="text-control-debug">[</span>
          {isCollapsed && (
            <span className="text-control-debug ml-1">
              ... {value.length} items
            </span>
          )}
        </button>
        {!isCollapsed && (
          <div className="ml-4 border-l-2 border-control-group pl-2">
            {value.map((item, index) => (
              <div key={index} className="my-1">
                <JsonValue
                  value={item}
                  depth={depth + 1}
                  maxDepth={maxDepth}
                  isLast={index === value.length - 1}
                />
                {index < value.length - 1 && (
                  <span className="text-control-debug">,</span>
                )}
              </div>
            ))}
          </div>
        )}
        {!isCollapsed && <span className="text-control-debug">]</span>}
      </div>
    );
  }

  if (typeof value === "object") {
    const keys = Object.keys(value);
    if (keys.length === 0) {
      return <span className="text-control-debug">{"{}"}</span>;
    }

    return (
      <div className="inline-block">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="text-control-debug hover:text-control-input focus:outline-none"
        >
          <span className="text-control-debug">{"{"}</span>
          {isCollapsed && (
            <span className="text-control-debug ml-1">
              ... {keys.length} properties
            </span>
          )}
        </button>
        {!isCollapsed && (
          <div className="ml-4 border-l-2 border-control-group pl-2">
            {keys.map((key, index) => (
              <div key={key} className="my-1">
                <span className="text-control-debug">"</span>
                <span className="text-control-debug">{key}</span>
                <span className="text-control-debug">": </span>
                <JsonValue
                  value={value[key]}
                  depth={depth + 1}
                  maxDepth={maxDepth}
                  isLast={index === keys.length - 1}
                />
                {index < keys.length - 1 && (
                  <span className="text-control-debug">,</span>
                )}
              </div>
            ))}
          </div>
        )}
        {!isCollapsed && <span className="text-control-debug">{"}"}</span>}
      </div>
    );
  }

  // Fallback for unknown types
  return (
    <span className="text-control-error">
      {typeof value}: {String(value)}
    </span>
  );
};

export const JsonHighlighter: React.FC<JsonHighlighterProps> = ({
  data,
  maxDepth = 3,
  className = "",
}) => {
  return (
    <div className={`font-mono text-xs bg-control-debug p-3 rounded border border-control-input overflow-auto ${className}`}>
      <JsonValue value={data} depth={0} maxDepth={maxDepth} />
    </div>
  );
};
