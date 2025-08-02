/**
 * JSON HIGHLIGHTER - Syntax highlighting for JSON with proper colors
 *
 * • Provides syntax highlighting for JSON data in node inspector
 * • Uses proper JSON syntax colors (keys, strings, numbers, booleans, etc.)
 * • Supports collapsible object/array structures
 * • Maintains accessibility and readability standards
 * • Matches original NodeInspector JSON highlighting
 *
 * Keywords: json-highlighter, syntax-highlighting, node-inspector, json-colors
 */

import type React from "react";
import { useState } from "react";

interface JsonHighlighterProps {
  data: unknown;
  maxDepth?: number;
  className?: string;
}

interface JsonValueProps {
  value: unknown;
  depth: number;
  maxDepth: number;
  isLast?: boolean;
}

const JsonValue: React.FC<JsonValueProps> = ({ value, depth, maxDepth }) => {
  const [isCollapsed, setIsCollapsed] = useState(depth >= maxDepth);

  if (value === null) {
    return <span className="text-purple-600 dark:text-purple-400">null</span>;
  }

  if (value === undefined) {
    return (
      <span className="text-purple-600 dark:text-purple-400">undefined</span>
    );
  }

  if (typeof value === "string") {
    return (
      <span>
        <span className="text-green-600 dark:text-green-400">"</span>
        <span className="text-green-600 dark:text-green-400">{value}</span>
        <span className="text-green-600 dark:text-green-400">"</span>
      </span>
    );
  }

  if (typeof value === "number") {
    return <span className="text-blue-600 dark:text-blue-400">{value}</span>;
  }

  if (typeof value === "boolean") {
    return (
      <span className="text-orange-600 dark:text-orange-400">
        {value.toString()}
      </span>
    );
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return <span className="text-gray-600 dark:text-gray-400">[]</span>;
    }

    return (
      <div className="inline-block">
        <button
          type="button"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="text-gray-600 hover:text-gray-800 focus:outline-none dark:text-gray-400 dark:hover:text-gray-200"
        >
          <span className="text-gray-600 dark:text-gray-400">[</span>
          {isCollapsed && (
            <span className="ml-1 text-gray-500 dark:text-gray-500">
              ... {value.length} items
            </span>
          )}
        </button>
        {!isCollapsed && (
          <div className="ml-4 border-gray-300 border-l pl-2 dark:border-gray-600">
            {value.map((item, index) => (
              <div
                key={`array-item-${depth}-${index}-${JSON.stringify(item).slice(0, 20)}`}
                className="my-1"
              >
                <JsonValue value={item} depth={depth + 1} maxDepth={maxDepth} />
                {index < value.length - 1 && (
                  <span className="text-gray-600 dark:text-gray-400">,</span>
                )}
              </div>
            ))}
          </div>
        )}
        {!isCollapsed && (
          <span className="text-gray-600 dark:text-gray-400">]</span>
        )}
      </div>
    );
  }

  if (typeof value === "object") {
    const keys = Object.keys(value);
    if (keys.length === 0) {
      return <span className="text-gray-600 dark:text-gray-400">{"{}"}</span>;
    }

    return (
      <div className="inline-block">
        <button
          type="button"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="text-gray-600 hover:text-gray-800 focus:outline-none dark:text-gray-400 dark:hover:text-gray-200"
        >
          <span className="text-gray-600 dark:text-gray-400">{"{"}</span>
          {isCollapsed && (
            <span className="ml-1 text-gray-500 dark:text-gray-500">
              ... {keys.length} properties
            </span>
          )}
        </button>
        {!isCollapsed && (
          <div className="ml-4 border-gray-300 border-l pl-2 dark:border-gray-600">
            {keys.map((key, index) => (
              <div key={`object-key-${depth}-${key}`} className="my-1">
                <span className="text-red-600 dark:text-red-400">"</span>
                <span className="text-red-600 dark:text-red-400">{key}</span>
                <span className="text-red-600 dark:text-red-400">"</span>
                <span className="text-gray-600 dark:text-gray-400">: </span>
                <JsonValue
                  value={(value as Record<string, unknown>)[key]}
                  depth={depth + 1}
                  maxDepth={maxDepth}
                />
                {index < keys.length - 1 && (
                  <span className="text-gray-600 dark:text-gray-400">,</span>
                )}
              </div>
            ))}
          </div>
        )}
        {!isCollapsed && (
          <span className="text-gray-600 dark:text-gray-400">{"}"}</span>
        )}
      </div>
    );
  }

  // Fallback for unknown types
  return (
    <span className="text-red-700 dark:text-red-300">
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
    <div className={`font-mono text-xs leading-relaxed ${className}`}>
      <JsonValue value={data} depth={0} maxDepth={maxDepth} />
    </div>
  );
};
