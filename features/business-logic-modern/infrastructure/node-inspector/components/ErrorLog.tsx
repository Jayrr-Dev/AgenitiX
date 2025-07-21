/**
 * ERROR LOG COMPONENT - Node error display and management interface
 *
 * • Displays categorized error messages for the selected node
 * • Provides error filtering by type (error, warning, info) and severity
 * • Shows timestamped error entries with source information
 * • Includes clear all errors functionality with confirmation
 * • Auto-scrolls to newest errors and highlights critical issues
 *
 * Keywords: error-log, filtering, timestamps, severity, debugging, notifications
 */

"use client";

import React from "react";
import { useComponentTheme } from "../../theming/components";
import { NodeError } from "../types";

interface ErrorLogProps {
  errors: NodeError[];
  onClearErrors?: () => void;
}

export const ErrorLog: React.FC<ErrorLogProps> = ({
  errors,
  onClearErrors,
}) => {
  // Get component theme
  const theme = useComponentTheme("nodeInspector");

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Sticky Header - Transparent */}
      <div className="sticky top-0 z-10 pb-3">
        <div className="flex items-center justify-between px-1">
          <div className={`font-semibold ${theme.text.primary} text-sm`}>
            Errors ({errors.length})
          </div>
          {errors.length > 0 && onClearErrors && (
            <button
              onClick={onClearErrors}
              className={`px-2 py-1 text-xs text-error hover:text-error-secondary hover:bg-error-hover ${theme.borderRadius.button} ${theme.transition}`}
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Scrollable Error Container */}
      <div className="flex-1 overflow-hidden flex flex-col min-h-0">
        {errors.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <span className={`${theme.text.muted} italic text-sm`}>
              No errors detected
            </span>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto overflow-x-hidden space-y-3 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
            {errors.map((error, index) => (
              <div
                key={`${error.timestamp}-${index}`}
                className={`${theme.background.hover} ${theme.border.default} border ${theme.borderRadius.panel} p-3`}
              >
                {/* Error Header */}
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      error.type === "error"
                        ? "bg-destructive"
                        : error.type === "warning"
                          ? "bg-warning"
                          : "bg-info"
                    }`}
                  />
                  <span
                    className={`font-medium text-xs uppercase tracking-wide ${
                      error.type === "error"
                        ? "text-destructive"
                        : error.type === "warning"
                          ? "text-warning"
                          : "text-info"
                    }`}
                  >
                    {error.type}
                  </span>
                  <span className={`${theme.text.muted} text-xs ml-auto`}>
                    {new Date(error.timestamp).toLocaleTimeString()}
                  </span>
                </div>

                {/* Error Message */}
                <div
                  className={`text-sm font-mono leading-relaxed break-words whitespace-pre-wrap ${
                    error.type === "error"
                      ? "text-destructive-foreground"
                      : error.type === "warning"
                        ? "text-warning-secondary"
                        : "text-info-secondary"
                  }`}
                >
                  {error.message}
                </div>

                {/* Error Source */}
                {error.source && (
                  <div className={`mt-2 pt-2 border-t ${theme.border.default}`}>
                    <span className={`text-xs ${theme.text.muted}`}>
                      Source: <span className="font-mono">{error.source}</span>
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
