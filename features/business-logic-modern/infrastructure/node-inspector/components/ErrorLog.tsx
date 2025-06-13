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

import { NodeError } from "@/features/business-logic-modern/infrastructure/node-inspector/types";
import React from "react";

interface ErrorLogProps {
  errors: NodeError[];
  onClearErrors?: () => void;
}

export const ErrorLog: React.FC<ErrorLogProps> = ({
  errors,
  onClearErrors,
}) => {
  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Sticky Header - Transparent */}
      <div className="sticky top-0 z-10 pb-3">
        <div className="flex items-center justify-between px-1">
          <div className="font-semibold text-infra-inspector-text text-sm">
            Errors ({errors.length})
          </div>
          {errors.length > 0 && onClearErrors && (
            <button
              onClick={onClearErrors}
              className="px-2 py-1 text-xs text-error hover:text-error-secondary hover:bg-error-hover rounded transition-colors"
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Scrollable Error Container */}
      <div className="flex-1 bg-node-view border-node-view rounded-lg p-4 overflow-hidden flex flex-col min-h-0">
        {errors.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <span className="text-infra-inspector-text-secondary italic text-sm">
              No errors detected
            </span>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto overflow-x-hidden space-y-3 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
            {errors.map((error, index) => (
              <div
                key={`${error.timestamp}-${index}`}
                className="bg-infra-inspector border-infra-inspector rounded-md p-3 shadow-sm"
              >
                {/* Error Header */}
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      error.type === "error"
                        ? "bg-status-node-delete"
                        : error.type === "warning"
                          ? "bg-status-edge-add"
                          : "bg-status-node-update"
                    }`}
                  />
                  <span
                    className={`font-medium text-xs uppercase tracking-wide ${
                      error.type === "error"
                        ? "text-error"
                        : error.type === "warning"
                          ? "text-warning"
                          : "text-info"
                    }`}
                  >
                    {error.type}
                  </span>
                  <span className="text-infra-inspector-text-secondary text-xs ml-auto">
                    {new Date(error.timestamp).toLocaleTimeString()}
                  </span>
                </div>

                {/* Error Message */}
                <div
                  className={`text-sm font-mono leading-relaxed break-words whitespace-pre-wrap ${
                    error.type === "error"
                      ? "text-error-secondary"
                      : error.type === "warning"
                        ? "text-warning-secondary"
                        : "text-info-secondary"
                  }`}
                >
                  {error.message}
                </div>

                {/* Error Source */}
                {error.source && (
                  <div className="mt-2 pt-2 border-t border-infra-inspector">
                    <span className="text-xs text-infra-inspector-text-secondary">
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
