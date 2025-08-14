"use client";
/**
 * EmailLabelerExpanded – Professional expanded view following emailMessage design principles
 */

import * as React from "react";
import { FiTag, FiPlus, FiSettings } from "react-icons/fi";
import RenderStatusDot from "@/components/RenderStatusDot";
import type { EmailLabelerData } from "../emailLabeler.node";

const EXPANDED_STYLES = {
  container: "w-full h-full p-3 space-y-3",
  disabled: "opacity-75 pointer-events-none",
  header: "flex items-center justify-between pb-2 border-b border-border/20",
  headerTitle: "flex items-center gap-2 text-[10px] font-medium",
  headerIcon: "text-muted-foreground",
  section: "space-y-2",
  sectionTitle: "text-[10px] font-medium text-muted-foreground uppercase tracking-wide",
  formGroup: "space-y-1",
  label: "text-[10px] font-medium text-foreground",
  select: "w-full px-2 py-1 text-[10px] border border-border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent transition-colors",
  statusSection: "bg-muted/20 rounded-lg p-3 space-y-2",
  statusRow: "flex items-center justify-between",
  statusLabel: "text-[10px] font-medium text-muted-foreground",
  statusValue: "text-[10px] font-medium",
  labelItem: "flex items-center justify-between p-2 bg-muted/10 rounded-md",
  labelInfo: "flex items-center gap-2",
  labelColor: "w-3 h-3 rounded-full",
  labelName: "text-[10px] font-medium",
  labelCount: "text-[9px] text-muted-foreground",
} as const;

export interface EmailLabelerExpandedProps {
  nodeId: string;
  nodeData: EmailLabelerData;
  isEnabled: boolean;
  labelingStatus: EmailLabelerData["labelingStatus"];
}

export const EmailLabelerExpanded = React.memo(
  function EmailLabelerExpanded(props: EmailLabelerExpandedProps) {
    const {
      nodeId,
      nodeData,
      isEnabled,
      labelingStatus,
    } = props;

    const {
      labelingMode,
      availableLabels,
      aiModel,
      totalLabeled,
      labelsApplied,
      lastLabeledAt,
      lastError,
    } = nodeData;

    const statusProps = React.useMemo(() => {
      const isActive = labelingStatus === "active";
      const isProcessing = labelingStatus === "processing";
      const isError = labelingStatus === "error";

      return {
        eventActive: isActive,
        isProcessing: isProcessing,
        hasError: isError,
        enableGlow: true,
        size: "sm" as const,
        titleText: isError ? "error" : isProcessing ? "processing" : isActive ? "active" : "inactive",
      };
    }, [labelingStatus]);

    const lastLabeledDisplay = React.useMemo(() => {
      if (!lastLabeledAt) return "Never";
      return new Date(lastLabeledAt).toLocaleString();
    }, [lastLabeledAt]);

    return (
      <div className={`${EXPANDED_STYLES.container} ${isEnabled ? "" : EXPANDED_STYLES.disabled}`}>
        {/* Header */}
        <div className={EXPANDED_STYLES.header}>
          <div className={EXPANDED_STYLES.headerTitle}>
            <FiTag className={EXPANDED_STYLES.headerIcon} size={12} />
            Email Labeler
          </div>
          <RenderStatusDot {...statusProps} />
        </div>

        {/* Configuration */}
        <div className={EXPANDED_STYLES.section}>
          <div className={EXPANDED_STYLES.sectionTitle}>Configuration</div>
          <div className="grid grid-cols-2 gap-2">
            <div className={EXPANDED_STYLES.formGroup}>
              <label className={EXPANDED_STYLES.label}>Mode</label>
              <select className={EXPANDED_STYLES.select} value={labelingMode} disabled={!isEnabled}>
                <option value="ai">AI Only</option>
                <option value="rules">Rules Only</option>
                <option value="hybrid">AI + Rules</option>
              </select>
            </div>
            <div className={EXPANDED_STYLES.formGroup}>
              <label className={EXPANDED_STYLES.label}>AI Model</label>
              <select className={EXPANDED_STYLES.select} value={aiModel} disabled={!isEnabled}>
                <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                <option value="gpt-4">GPT-4</option>
                <option value="claude-3">Claude 3</option>
              </select>
            </div>
          </div>
        </div>

        {/* Available Labels */}
        <div className={EXPANDED_STYLES.section}>
          <div className="flex items-center justify-between">
            <div className={EXPANDED_STYLES.sectionTitle}>Labels ({availableLabels.length})</div>
            <button
              className="px-2 py-1 text-[10px] bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
              disabled={!isEnabled}
            >
              <FiPlus size={10} className="inline mr-1" />
              Add
            </button>
          </div>
          
          <div className="space-y-1 max-h-24 overflow-y-auto">
            {availableLabels.slice(0, 4).map((label) => (
              <div key={label.id} className={EXPANDED_STYLES.labelItem}>
                <div className={EXPANDED_STYLES.labelInfo}>
                  <div 
                    className={EXPANDED_STYLES.labelColor}
                    style={{ backgroundColor: label.color }}
                  />
                  <span className={EXPANDED_STYLES.labelName}>{label.name}</span>
                </div>
                <span className={EXPANDED_STYLES.labelCount}>
                  {labelsApplied[label.id] || 0}
                </span>
              </div>
            ))}
            {availableLabels.length > 4 && (
              <div className="text-[9px] text-muted-foreground text-center">
                +{availableLabels.length - 4} more labels
              </div>
            )}
          </div>
        </div>

        {/* Statistics */}
        <div className={EXPANDED_STYLES.statusSection}>
          <div className={EXPANDED_STYLES.statusRow}>
            <span className={EXPANDED_STYLES.statusLabel}>Status</span>
            <div className="flex items-center gap-1">
              <RenderStatusDot {...statusProps} />
              <span className={EXPANDED_STYLES.statusValue}>{statusProps.titleText}</span>
            </div>
          </div>
          <div className={EXPANDED_STYLES.statusRow}>
            <span className={EXPANDED_STYLES.statusLabel}>Total Labeled</span>
            <span className={EXPANDED_STYLES.statusValue}>{totalLabeled}</span>
          </div>
          <div className={EXPANDED_STYLES.statusRow}>
            <span className={EXPANDED_STYLES.statusLabel}>Last Labeled</span>
            <span className={EXPANDED_STYLES.statusValue}>{lastLabeledDisplay}</span>
          </div>
          {lastError && (
            <div className={EXPANDED_STYLES.statusRow}>
              <span className={EXPANDED_STYLES.statusLabel}>Error</span>
              <span className="text-[10px] text-destructive font-medium truncate max-w-32">
                {lastError}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }
);

EmailLabelerExpanded.displayName = "EmailLabelerExpanded";