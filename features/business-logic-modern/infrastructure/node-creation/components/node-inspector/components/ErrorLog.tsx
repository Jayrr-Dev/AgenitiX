import { NodeError } from "@/features/business-logic-modern/infrastructure/node-creation/components/node-inspector/types";
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
          <div className="font-semibold text-gray-700 dark:text-gray-300 text-sm">
            Errors ({errors.length})
          </div>
          {errors.length > 0 && onClearErrors && (
            <button
              onClick={onClearErrors}
              className="px-2 py-1 text-xs text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Scrollable Error Container */}
      <div className="flex-1 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 overflow-hidden flex flex-col min-h-0">
        {errors.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <span className="text-gray-400 italic text-sm">
              No errors detected
            </span>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto overflow-x-hidden space-y-3 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
            {errors.map((error, index) => (
              <div
                key={`${error.timestamp}-${index}`}
                className="bg-white dark:bg-gray-900 rounded-md border border-gray-200 dark:border-gray-700 p-3 shadow-sm"
              >
                {/* Error Header */}
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      error.type === "error"
                        ? "bg-red-500"
                        : error.type === "warning"
                          ? "bg-yellow-500"
                          : "bg-blue-500"
                    }`}
                  />
                  <span
                    className={`font-medium text-xs uppercase tracking-wide ${
                      error.type === "error"
                        ? "text-red-600 dark:text-red-400"
                        : error.type === "warning"
                          ? "text-yellow-600 dark:text-yellow-400"
                          : "text-blue-600 dark:text-blue-400"
                    }`}
                  >
                    {error.type}
                  </span>
                  <span className="text-gray-500 text-xs ml-auto">
                    {new Date(error.timestamp).toLocaleTimeString()}
                  </span>
                </div>

                {/* Error Message */}
                <div
                  className={`text-sm font-mono leading-relaxed break-words whitespace-pre-wrap ${
                    error.type === "error"
                      ? "text-red-700 dark:text-red-300"
                      : error.type === "warning"
                        ? "text-yellow-700 dark:text-yellow-300"
                        : "text-blue-700 dark:text-blue-300"
                  }`}
                >
                  {error.message}
                </div>

                {/* Error Source */}
                {error.source && (
                  <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
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
