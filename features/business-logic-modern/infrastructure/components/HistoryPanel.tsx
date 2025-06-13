/**
 * HISTORY PANEL - Visual timeline of workflow editor actions
 *
 * • Expandable panel displaying chronological list of user actions
 * • Interactive history entries with jump-to-state functionality
 * • Visual indicators for action types with color-coded icons
 * • Undo/redo controls with clear history option
 * • Multi-branch support with graph-based navigation
 * • Responsive design with collapsible interface and timestamps
 * • Now uses centralized component theming system
 *
 * Keywords: history, timeline, actions, undo-redo, visual-indicators, panel, multi-branch, theming
 */

"use client";

import {
  ChevronDown,
  ChevronRight,
  Clock,
  GitBranch,
  RotateCcw,
  RotateCw,
  Trash2,
} from "lucide-react";
import React, { useMemo, useState } from "react";
import { useUndoRedo } from "./UndoRedoContext";
import { useComponentClasses, useComponentButtonClasses, useComponentTheme } from "../theming/components";

interface HistoryPanelProps {
  className?: string;
}

const HistoryPanel: React.FC<HistoryPanelProps> = ({ className = "" }) => {
  const { undo, redo, clearHistory, getHistory } = useUndoRedo();
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<string | null>(null);

  // GET THEMED CLASSES
  const theme = useComponentTheme('historyPanel');
  const panelClasses = useComponentClasses('historyPanel', 'default', className);
  const buttonClasses = useComponentButtonClasses('historyPanel', 'ghost', 'sm');
  const activeButtonClasses = useComponentButtonClasses('historyPanel', 'primary', 'sm');

  // GET HISTORY FROM CONTEXT - Updated for graph-based system
  const historyData = getHistory();
  const {
    entries: historyPath = [],
    currentIndex,
    canUndo,
    canRedo,
    branchOptions = [],
    currentNode,
    graphStats,
  } = historyData;

  // COMPUTED VALUES
  const visibleHistory = useMemo(() => {
    // Show last 20 entries for performance
    return historyPath.slice(-20);
  }, [historyPath]);

  // UTILITY FUNCTIONS
  const formatTimestamp = (timestamp: number): string => {
    if (!timestamp || isNaN(timestamp)) {
      return "Unknown time";
    }

    const date = new Date(timestamp);
    if (isNaN(date.getTime())) {
      return "Invalid date";
    }

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  const getActionIcon = (metadata: any): React.ReactNode => {
    const actionType = metadata?.actionType || "unknown";
    const iconMap: Record<string, React.ReactNode> = {
      node_add: <div className="w-2 h-2 bg-green-500 rounded-full" />,
      node_delete: <div className="w-2 h-2 bg-red-500 rounded-full" />,
      node_move: <div className="w-2 h-2 bg-blue-500 rounded-full" />,
      node_update: <div className="w-2 h-2 bg-yellow-500 rounded-full" />,
      edge_add: <div className="w-2 h-2 bg-green-400 rounded-full" />,
      edge_delete: <div className="w-2 h-2 bg-red-400 rounded-full" />,
      bulk_delete: <div className="w-2 h-2 bg-red-600 rounded-full" />,
      bulk_update: <div className="w-2 h-2 bg-orange-500 rounded-full" />,
      paste: <div className="w-2 h-2 bg-purple-500 rounded-full" />,
      duplicate: <div className="w-2 h-2 bg-indigo-500 rounded-full" />,
    };
    return (
      iconMap[actionType] || (
        <div className="w-2 h-2 bg-gray-500 rounded-full" />
      )
    );
  };

  const getActionColor = (metadata: any): string => {
    const actionType = metadata?.actionType || "unknown";
    const colorMap: Record<string, string> = {
      node_add: "border-l-green-500",
      node_delete: "border-l-red-500",
      node_move: "border-l-blue-500",
      node_update: "border-l-yellow-500",
      edge_add: "border-l-green-400",
      edge_delete: "border-l-red-400",
      bulk_delete: "border-l-red-600",
      bulk_update: "border-l-orange-500",
      paste: "border-l-purple-500",
      duplicate: "border-l-indigo-500",
    };
    return colorMap[actionType] || "border-l-gray-500";
  };

  // EVENT HANDLERS
  const handleJumpToState = (targetIndex: number) => {
    // In the graph system, we can only navigate along the current path
    const diff = targetIndex - currentIndex;
    if (diff > 0) {
      for (let i = 0; i < diff; i++) redo();
    } else if (diff < 0) {
      for (let i = 0; i < Math.abs(diff); i++) undo();
    }
  };

  const handleBranchRedo = (branchId: string) => {
    redo(branchId);
  };

  const handleClearHistory = () => {
    if (
      window.confirm(
        "Are you sure you want to clear the entire history? This action cannot be undone."
      )
    ) {
      clearHistory();
    }
  };

  // RENDER
  if (!isExpanded) {
    return (
      <div className={panelClasses}>
        <button
          onClick={() => setIsExpanded(true)}
          className={`w-full p-3 flex items-center justify-between ${theme.background.hover} ${theme.transition}`}
        >
          <div className="flex items-center gap-2">
            <Clock className={`w-4 h-4 ${theme.text.muted}`} />
            <span className={`text-sm font-medium ${theme.text.primary}`}>
              History ({historyPath.length})
            </span>
            {graphStats && graphStats.branches > 0 && (
              <div className="flex items-center gap-1">
                <GitBranch className="w-3 h-3 text-orange-500" />
                <span className="text-xs text-orange-600 dark:text-orange-400">
                  {graphStats.branches}
                </span>
              </div>
            )}
          </div>
          <ChevronRight className={`w-4 h-4 ${theme.text.muted}`} />
        </button>
      </div>
    );
  }

  return (
    <div className={panelClasses}>
      {/* HEADER */}
      <div className={`p-3 ${theme.border.default} border-b`}>
        <div className="flex items-center justify-between">
          <button
            onClick={() => setIsExpanded(false)}
            className={`flex items-center gap-2 ${theme.background.hover} p-1 ${theme.borderRadius.button} ${theme.transition}`}
          >
            <ChevronDown className={`w-4 h-4 ${theme.text.muted}`} />
            <Clock className={`w-4 h-4 ${theme.text.muted}`} />
            <span className={`text-sm font-medium ${theme.text.primary}`}>
              History ({historyPath.length})
            </span>
            {graphStats && (
              <div className="flex items-center gap-2 ml-2">
                {graphStats.branches > 0 && (
                  <div className="flex items-center gap-1">
                    <GitBranch className="w-3 h-3 text-orange-500" />
                    <span className="text-xs text-orange-600 dark:text-orange-400">
                      {graphStats.branches} branches
                    </span>
                  </div>
                )}
                <span className={`text-xs ${theme.text.muted}`}>
                  {graphStats.totalNodes} total states
                </span>
              </div>
            )}
          </button>

          <div className="flex items-center gap-1">
            <button
              onClick={() => undo()}
              disabled={!canUndo}
              className={buttonClasses}
              title="Undo (Ctrl+Z)"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              onClick={() => redo()}
              disabled={!canRedo}
              className={buttonClasses}
              title="Redo (Ctrl+Y)"
            >
              <RotateCw className="w-4 h-4" />
            </button>

            <button
              onClick={handleClearHistory}
              className={buttonClasses}
              title="Clear History"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* BRANCH OPTIONS */}
      {branchOptions.length > 1 && (
        <div className="p-2 border-b border-gray-200 dark:border-gray-700 bg-orange-50 dark:bg-orange-900/20">
          <div className="flex items-center gap-2 mb-2">
            <GitBranch className="w-4 h-4 text-orange-600 dark:text-orange-400" />
            <span className="text-sm font-medium text-orange-800 dark:text-orange-300">
              Multiple redo paths available:
            </span>
          </div>
          <div className="flex flex-wrap gap-1">
            {branchOptions.map((branchId, index) => (
              <button
                key={branchId}
                onClick={() => handleBranchRedo(branchId)}
                className="px-2 py-1 text-xs bg-orange-100 hover:bg-orange-200 dark:bg-orange-800 dark:hover:bg-orange-700 text-orange-800 dark:text-orange-200 rounded border border-orange-300 dark:border-orange-600 transition-colors"
                title={`Redo to branch ${index + 1}`}
              >
                Branch {index + 1}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* HISTORY LIST */}
      <div className="max-h-80 overflow-y-auto">
        {visibleHistory.length === 0 ? (
          <div className={`p-4 text-center ${theme.text.muted} text-sm`}>
            No history yet. Start making changes to see them here.
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {visibleHistory.map((entry, index) => {
              const globalIndex = historyPath.indexOf(entry);
              const isCurrentState = globalIndex === currentIndex;
              const isFutureState = globalIndex > currentIndex;
              const isSelected = selectedEntry === entry.id;

              return (
                <div
                  key={entry.id}
                  className={`
                    relative p-2 rounded cursor-pointer transition-all border-l-2
                    ${getActionColor(entry.metadata)}
                    ${
                      isCurrentState
                        ? `${theme.background.active} ring-1 ring-primary/20`
                        : isFutureState
                          ? `${theme.background.secondary} opacity-60`
                          : `${theme.background.hover}`
                    }
                    ${isSelected ? "ring-1 ring-primary/30" : ""}
                  `}
                  onClick={() => {
                    setSelectedEntry(isSelected ? null : entry.id);
                    if (!isSelected) {
                      handleJumpToState(index);
                    }
                  }}
                >
                  <div className="flex items-start gap-2">
                    <div className="flex-shrink-0 mt-1">
                      {getActionIcon(entry.metadata)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className={`text-sm font-medium ${theme.text.primary} truncate`}>
                          {entry.label || "Unknown action"}
                        </span>
                        {isCurrentState && (
                          <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                            Current
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between mt-1">
                        <span className={`text-xs ${theme.text.secondary}`}>
                          {formatTimestamp(entry.createdAt)}
                        </span>
                        <span className={`text-xs ${theme.text.muted} font-mono`}>
                          #{globalIndex + 1}
                        </span>
                      </div>

                      {/* CHILDREN INDICATOR */}
                      {entry.childrenIds && entry.childrenIds.length > 1 && (
                        <div className="mt-1">
                          <div className="flex items-center gap-1">
                            <GitBranch className="w-3 h-3 text-orange-500" />
                            <span className="text-xs text-orange-600 dark:text-orange-400">
                              {entry.childrenIds.length} branches
                            </span>
                          </div>
                        </div>
                      )}

                      {/* METADATA */}
                      {entry.metadata && isSelected && (
                        <div className={`mt-2 p-2 ${theme.background.secondary} rounded text-xs`}>
                          <div className={`font-medium ${theme.text.primary} mb-1`}>
                            Details:
                          </div>
                          {Object.entries(entry.metadata).map(
                            ([key, value]) => (
                              <div
                                key={key}
                                className={`${theme.text.secondary}`}
                              >
                                <span className="font-medium">{key}:</span>{" "}
                                {String(value)}
                              </div>
                            )
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* FOOTER */}
      {historyPath.length > visibleHistory.length && (
        <div className={`p-2 ${theme.border.default} border-t text-center`}>
          <span className={`text-xs ${theme.text.muted}`}>
            Showing last {visibleHistory.length} of {historyPath.length} actions
          </span>
        </div>
      )}
    </div>
  );
};

export default HistoryPanel;
