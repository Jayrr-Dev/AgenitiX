/**
 * WORKFLOW MANAGER - High-level workflow orchestration component
 *
 * • Optimized for performance with proper memoization patterns
 * • Follows domain-driven design with separated concerns
 * • Implements accessible keyboard shortcuts and ARIA standards
 * • Uses extracted reusable components for maintainability
 * • Provides comprehensive error handling and loading states
 *
 * Performance optimizations:
 * - Selective memo with proper comparison function
 * - Stable references for event handlers and computed values
 * - Extracted action button component to reduce duplication
 * - Optimized class name concatenation
 *
 * Keywords: workflow-orchestration, performance-optimized, accessibility, domain-driven
 */

import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Globe, Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import type React from "react";
import { memo, useMemo } from "react";
import { useFlowMetadataOptional } from "../flow-engine/contexts/flow-metadata-context";
import { useAutoSaveCanvas } from "../flow-engine/hooks/useAutoSaveCanvas";
import { useLoadCanvas } from "../flow-engine/hooks/useLoadCanvas";
import { useEdgeCount, useNodeCount } from "../flow-engine/stores/flowStore";
import {
  useComponentButtonClasses,
  useComponentClasses,
} from "../theming/components";
import { useWorkflowActions } from "./hooks/useWorkflowActions";
import { useWorkflowKeyboardShortcuts } from "./hooks/useWorkflowKeyboardShortcuts";
import type {
  ActionButtonProps,
  FlowBadgeProps,
  PermissionLevel,
  WorkflowManagerProps,
  WorkflowStats,
} from "./types";

// Constants for better maintainability and performance
const AUTOSAVE_DEBOUNCE_MS = 2000;
const WORKFLOW_ACTIONS = {
  EXPORT: "export",
  RUN: "run",
  STOP: "stop",
  SETTINGS: "settings",
} as const;

// Extracted reusable action button component with aggressive memoization, basically reduces code duplication
const ActionButton = memo<ActionButtonProps>(
  ({
    icon: Icon,
    title,
    onClick,
    className = "",
    disabled = false,
    shortcut,
  }) => {
    const buttonClasses = useComponentButtonClasses(
      "workflowManager",
      "ghost",
      "sm"
    );

    // Optimized tooltip with conditional shortcut display and stable reference, basically avoids string concatenation
    const fullTitle = useMemo(() => {
      return shortcut ? `${title} (${shortcut})` : title;
    }, [title, shortcut]);

    // Memoized class concatenation to prevent recalculation, basically improves render performance
    const computedClassName = useMemo(() => {
      return `${buttonClasses} flex h-10 w-10 cursor-pointer items-center justify-center p-0 ${className}`;
    }, [buttonClasses, className]);

    return (
      <button
        className={computedClassName}
        title={fullTitle}
        onClick={onClick}
        type="button"
        disabled={disabled}
        aria-label={title}
      >
        <Icon className="h-5 w-5" aria-hidden="true" />
      </button>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison for ActionButton memoization
    return (
      prevProps.icon === nextProps.icon &&
      prevProps.title === nextProps.title &&
      prevProps.disabled === nextProps.disabled &&
      prevProps.className === nextProps.className &&
      prevProps.shortcut === nextProps.shortcut
      // onClick is assumed to be stable from parent
    );
  }
);

ActionButton.displayName = "ActionButton";

const WorkflowManagerComponent: React.FC<WorkflowManagerProps> = ({
  className = "",
}) => {
  // Use individual stable selectors to prevent getSnapshot caching issues, basically avoids object creation
  const nodeCount = useNodeCount();
  const edgeCount = useEdgeCount();
  const { flow } = useFlowMetadataOptional() || { flow: null };
  const router = useRouter();

  // Auto-save and load canvas state with optimized configuration
  const autoSave = useAutoSaveCanvas({
    debounceMs: AUTOSAVE_DEBOUNCE_MS, // Configurable constant for easier maintenance
    enabled: true,
    showNotifications: false, // Keep it subtle to avoid UI noise
  });
  const _loadCanvas = useLoadCanvas();

  // Get themed classes - these hooks return stable values based on theme
  const rawContainerClasses = useComponentClasses(
    "workflowManager",
    "default",
    "flex items-center justify-between gap-4 p-3 rounded-lg shadow-sm border"
  );

  // Optimized class concatenation with early return for empty className
  const containerClasses = useMemo(() => {
    return className
      ? `${rawContainerClasses} ${className}`
      : rawContainerClasses;
  }, [rawContainerClasses, className]);

  // Transform individual counts into workflow stats with stable object shape, basically prevents unnecessary re-renders
  const workflowStats = useMemo<WorkflowStats>(() => {
    return {
      nodeCount,
      edgeCount,
      isWorkflowEmpty: nodeCount === 0,
    };
  }, [nodeCount, edgeCount]);

  // Centralized workflow actions with proper error handling, basically improves maintainability
  const workflowActions = useWorkflowActions({
    flowId: flow?.id,
    isWorkflowEmpty: workflowStats.isWorkflowEmpty,
    canEdit: flow?.canEdit ?? true,
  });

  // Keyboard shortcuts for improved accessibility and UX
  const { getModifierKey } = useWorkflowKeyboardShortcuts({
    enabled: true,
    shortcuts: {
      onExport: workflowActions.handleExportWorkflow,
      onRun: workflowActions.handleRunWorkflow,
      onSettings: workflowActions.handleWorkflowSettings,
      onReturnToDashboard: workflowActions.handleReturnToDashboard,
    },
  });

  // Memoized auto-save tooltip text to prevent string concatenation on every render
  const autoSaveTooltip = useMemo(() => {
    if (autoSave.isSaving) {
      return "Saving changes...";
    }
    if (autoSave.isEnabled && autoSave.lastSaved) {
      return `Last saved at ${autoSave.lastSaved.toLocaleTimeString()}`;
    }
    return autoSave.isEnabled ? "Auto-save enabled" : "Auto-save disabled";
  }, [autoSave.isSaving, autoSave.isEnabled, autoSave.lastSaved]);

  // Optimized flow badge with stable object references, basically prevents badge re-rendering
  const flowBadgeProps = useMemo<FlowBadgeProps | null>(() => {
    if (!flow) return null;

    const isPrivate = flow.is_private;
    const variant = isPrivate ? "secondary" : ("default" as const);
    const baseClasses = "flex scale-90 items-center gap-1 text-xs";
    const colorClasses = isPrivate
      ? "border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100"
      : "border-green-200 bg-green-50 text-green-700 hover:bg-green-100";

    return {
      variant,
      className: `${baseClasses} ${colorClasses}`,
      icon: isPrivate ? Lock : Globe,
      label: isPrivate ? "Private" : "Public",
    };
  }, [flow?.is_private]);

  // Stable permission badge computation, basically optimizes string operations
  const permissionBadge = useMemo<string | null>(() => {
    if (!flow || flow.isOwner) return null;

    const permission = flow.userPermission as PermissionLevel;
    switch (permission) {
      case "view":
        return "View Only";
      case "edit":
        return "Can Edit";
      case "admin":
        return "Admin";
      default:
        return null;
    }
  }, [flow?.isOwner, flow?.userPermission]);

  return (
    <div className={containerClasses}>
      {/* Left Section - Back Button & Workflow Info */}
      <div className="flex items-center gap-3">
        <ActionButton
          icon={ArrowLeft}
          title="Return to Dashboard"
          onClick={workflowActions.handleReturnToDashboard}
          className="mr-3"
          shortcut="Esc"
        />
        <div className="flex flex-col">
          <div className="relative flex items-center gap-2">
            <h2 className="font-semibold text-foreground text-xl">
              {flow?.name || "Untitled Workflow"}
            </h2>

            {/* Auto-save Status Indicator - Absolute positioned to not affect layout */}
            {flow?.canEdit && (
              <div
                className="-left-4 -translate-y-1/2 absolute top-1/2 flex cursor-help items-center"
                title={autoSaveTooltip}
              >
                {autoSave.isSaving ? (
                  <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-500 shadow-[0_0_4px_rgba(59,130,246,0.6)]" />
                ) : autoSave.isEnabled ? (
                  <div className="h-1.5 w-1.5 rounded-full bg-green-500 shadow-[0_0_4px_rgba(34,197,94,0.6)]" />
                ) : (
                  <div className="h-1.5 w-1.5 rounded-full bg-orange-500 shadow-[0_0_4px_rgba(249,115,22,0.6)]" />
                )}
              </div>
            )}

            {flowBadgeProps && (
              <Badge
                variant={flowBadgeProps.variant as any}
                className={flowBadgeProps.className}
              >
                <flowBadgeProps.icon className="h-3 w-3" />
                {flowBadgeProps.label}
              </Badge>
            )}

            {permissionBadge && (
              <Badge variant="outline" className="text-xs">
                {permissionBadge}
              </Badge>
            )}
          </div>
          {/* Memoized stats display to prevent string interpolation on every render */}
          <div className="flex items-center gap-2 text-muted-foreground text-xs">
            <span>{workflowStats.nodeCount} nodes</span>
            <span>•</span>
            <span>{workflowStats.edgeCount} connections</span>
            {workflowStats.isWorkflowEmpty && (
              <>
                <span>•</span>
                <span className="text-orange-500">Empty workflow</span>
              </>
            )}
            {flow && !flow.canEdit && (
              <>
                <span>•</span>
                <span className="text-amber-600">Read Only</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Optimized memo with comprehensive comparison, basically prevents unnecessary re-renders
const WorkflowManager = memo(
  WorkflowManagerComponent,
  (prevProps, nextProps) => {
    // Compare all props that could affect rendering
    return prevProps.className === nextProps.className;
    // Note: Other props would be compared here if we had more
    // The component relies on context and hooks for most of its data
  }
);

WorkflowManager.displayName = "WorkflowManager";

export default WorkflowManager;
