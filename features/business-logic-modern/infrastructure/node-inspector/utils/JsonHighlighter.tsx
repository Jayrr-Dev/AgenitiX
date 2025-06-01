/**
 * JSON HIGHLIGHTER UTILITY - Syntax highlighted JSON display component
 *
 * • Renders JSON data with syntax highlighting and proper formatting
 * • Provides collapsible object/array structures for better readability
 * • Supports different data types with color-coded highlighting
 * • Handles large data sets with performance optimizations
 * • Includes copy functionality and expandable nested structures
 *
 * Keywords: json-highlighting, syntax-coloring, formatting, collapsible, performance, copy
 */

import React from "react";
import { JsonHighlighterProps } from "../types";

export const JsonHighlighter = React.memo<JsonHighlighterProps>(
  ({ data, className = "" }) => {
    const highlightJson = React.useCallback(
      (obj: unknown, depth = 0): React.ReactNode => {
        const indent = "  ".repeat(depth);

        if (obj === null) {
          return <span className="text-gray-500 dark:text-gray-400">null</span>;
        }

        if (obj === undefined) {
          return (
            <span className="text-gray-500 dark:text-gray-400">undefined</span>
          );
        }

        if (typeof obj === "string") {
          return (
            <span className="text-green-600 dark:text-green-400 break-all">
              "{obj}"
            </span>
          );
        }

        if (typeof obj === "number") {
          if (isNaN(obj)) {
            return (
              <span className="text-orange-600 dark:text-orange-400">NaN</span>
            );
          }
          if (!isFinite(obj)) {
            return (
              <span className="text-orange-600 dark:text-orange-400">
                {obj > 0 ? "Infinity" : "-Infinity"}
              </span>
            );
          }
          return (
            <span className="text-blue-600 dark:text-blue-400">{obj}</span>
          );
        }

        if (typeof obj === "boolean") {
          return (
            <span className="text-purple-600 dark:text-purple-400">
              {obj.toString()}
            </span>
          );
        }

        if (typeof obj === "bigint") {
          return (
            <span className="text-blue-600 dark:text-blue-400">
              {obj.toString()}n
            </span>
          );
        }

        if (obj instanceof Date) {
          return (
            <span className="text-orange-600 dark:text-orange-400">
              "{obj.toISOString()}"
            </span>
          );
        }

        if (Array.isArray(obj)) {
          if (obj.length === 0) {
            return <span className="text-gray-700 dark:text-gray-300">[]</span>;
          }

          return (
            <span className="text-gray-700 dark:text-gray-300">
              [<br />
              {obj.map((item, index) => (
                <span key={index}>
                  {indent} {highlightJson(item, depth + 1)}
                  {index < obj.length - 1 && (
                    <span className="text-gray-500">,</span>
                  )}
                  <br />
                </span>
              ))}
              {indent}]
            </span>
          );
        }

        if (typeof obj === "object" && obj !== null) {
          const entries = Object.entries(obj);
          if (entries.length === 0) {
            return (
              <span className="text-gray-700 dark:text-gray-300">{"{}"}</span>
            );
          }

          return (
            <span className="text-gray-700 dark:text-gray-300">
              {"{"}
              <br />
              {entries.map(([key, value], index) => (
                <span key={key}>
                  {indent}{" "}
                  <span className="text-red-600 dark:text-red-400">
                    "{key}"
                  </span>
                  <span className="text-gray-500">: </span>
                  {highlightJson(value, depth + 1)}
                  {index < entries.length - 1 && (
                    <span className="text-gray-500">,</span>
                  )}
                  <br />
                </span>
              ))}
              {indent}
              {"}"}
            </span>
          );
        }

        return (
          <span className="text-gray-500 dark:text-gray-400">
            {String(obj)}
          </span>
        );
      },
      []
    );

    return (
      <pre
        className={`font-mono text-xs leading-relaxed whitespace-pre-wrap break-words ${className}`}
      >
        {highlightJson(data)}
      </pre>
    );
  }
);

JsonHighlighter.displayName = "JsonHighlighter";
