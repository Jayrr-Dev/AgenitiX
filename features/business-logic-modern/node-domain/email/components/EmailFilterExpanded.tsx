"use client";
/**
 * EmailFilterExpanded – Professional expanded view following emailMessage design principles
 */

import * as React from "react";
import { FiFilter, FiPlus, FiTrash2, FiSettings } from "react-icons/fi";
import RenderStatusDot from "@/components/RenderStatusDot";
import type { EmailFilterData } from "../emailFilter.node";

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
  input: "w-full px-2 py-1 text-[10px] border border-border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent transition-colors",
  select: "w-full px-2 py-1 text-[10px] border border-border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent transition-colors",
  statusSection: "bg-muted/20 rounded-lg p-3 space-y-2",
  statusRow: "flex items-center justify-between",
  statusLabel: "text-[10px] font-medium text-muted-foreground",
  statusValue: "text-[10px] font-medium",
  buttonGroup: "flex gap-2 pt-2",
  primaryButton: "flex-1 px-3 py-2 text-[10px] font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
  secondaryButton: "flex-1 px-3 py-2 text-[10px] font-medium border border-border rounded-md hover:bg-muted/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
  ruleItem: "bg-muted/10 rounded-md p-2 space-y-2",
  ruleHeader: "flex items-center justify-between",
  ruleControls: "grid grid-cols-3 gap-2",
} as const;

export interface EmailFilterExpandedProps {
  nodeId: string;
  nodeData: EmailFilterData;
  isEnabled: boolean;
  filterStatus: EmailFilterData["filterStatus"];
  onAddRule?: () => void;
  onUpdateRule?: (ruleId: string, updates: any) => void;
  onRemoveRule?: (ruleId: string) => void;
}

export const EmailFilterExpanded = React.memo(
  function EmailFilterExpanded(props: EmailFilterExpandedProps) {
    const {
      nodeId,
      nodeData,
      isEnabled,
      filterStatus,
      onAddRule,
      onUpdateRule,
      onRemoveRule,
    } = props;

    const {
      filterRules,
      matchMode,
      filterAction,
      actionValue,
      totalProcessed,
      totalMatched,
      totalBlocked,
      lastProcessedAt,
      lastError,
    } = nodeData;

    const statusProps = React.useMemo(() => {
      const isActive = filterStatus === "active";
      const isProcessing = filterStatus === "processing";
      const isError = filterStatus === "error";

      return {
        eventActive: isActive,
        isProcessing: isProcessing,
        hasError: isError,
        enableGlow: true,
        size: "sm" as const,
        titleText: isError ? "error" : isProcessing ? "processing" : isActive ? "active" : "inactive",
      };
    }, [filterStatus]);

    const lastProcessedDisplay = React.useMemo(() => {
      if (!lastProcessedAt) return "Never";
      return new Date(lastProcessedAt).toLocaleString();
    }, [lastProcessedAt]);

    return (
      <div className={`${EXPANDED_STYLES.container} ${isEnabled ? "" : EXPANDED_STYLES.disabled}`}>
        {/* Header */}
        <div className={EXPANDED_STYLES.header}>
          <div className={EXPANDED_STYLES.headerTitle}>
            <FiFilter className={EXPANDED_STYLES.headerIcon} size={12} />
            Email Filter Rules
          </div>
          <RenderStatusDot {...statusProps} />
        </div>

        {/* Filter Configuration */}
        <div className={EXPANDED_STYLES.section}>
          <div className={EXPANDED_STYLES.sectionTitle}>Configuration</div>
          <div className="grid grid-cols-2 gap-2">
            <div className={EXPANDED_STYLES.formGroup}>
              <label className={EXPANDED_STYLES.label}>Match Mode</label>
              <select className={EXPANDED_STYLES.select} value={matchMode} disabled={!isEnabled}>
                <option value="any">Any Rule (OR)</option>
                <option value="all">All Rules (AND)</option>
              </select>
            </div>
            <div className={EXPANDED_STYLES.formGroup}>
              <label className={EXPANDED_STYLES.label}>Action</label>
              <select className={EXPANDED_STYLES.select} value={filterAction} disabled={!isEnabled}>
                <option value="pass">Pass Through</option>
                <option value="block">Block</option>
                <option value="tag">Add Tag</option>
                <option value="move">Move to Folder</option>
              </select>
            </div>
          </div>
          {(filterAction === "tag" || filterAction === "move") && (
            <div className={EXPANDED_STYLES.formGroup}>
              <label className={EXPANDED_STYLES.label}>
                {filterAction === "tag" ? "Tag Name" : "Folder Name"}
              </label>
              <input
                type="text"
                className={EXPANDED_STYLES.input}
                value={actionValue}
                placeholder={filterAction === "tag" ? "important" : "filtered"}
                disabled={!isEnabled}
              />
            </div>
          )}
        </div>

        {/* Filter Rules */}
        <div className={EXPANDED_STYLES.section}>
          <div className="flex items-center justify-between">
            <div className={EXPANDED_STYLES.sectionTitle}>Filter Rules ({filterRules.length})</div>
            <button
              className="px-2 py-1 text-[10px] bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
              onClick={onAddRule}
              disabled={!isEnabled}
            >
              <FiPlus size={10} className="inline mr-1" />
              Add Rule
            </button>
          </div>
          
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {filterRules.map((rule) => (
              <div key={rule.id} className={EXPANDED_STYLES.ruleItem}>
                <div className={EXPANDED_STYLES.ruleHeader}>
                  <span className="text-[10px] font-medium">Rule {rule.id.slice(-4)}</span>
                  <button
                    className="text-destructive hover:text-destructive/80 transition-colors"
                    onClick={() => onRemoveRule?.(rule.id)}
                    disabled={!isEnabled}
                  >
                    <FiTrash2 size={10} />
                  </button>
                </div>
                <div className={EXPANDED_STYLES.ruleControls}>
                  <select
                    className={EXPANDED_STYLES.select}
                    value={rule.field}
                    onChange={(e) => onUpdateRule?.(rule.id, { field: e.target.value })}
                    disabled={!isEnabled}
                  >
                    <option value="sender">Sender</option>
                    <option value="subject">Subject</option>
                    <option value="content">Content</option>
                    <option value="recipient">Recipient</option>
                  </select>
                  <select
                    className={EXPANDED_STYLES.select}
                    value={rule.operator}
                    onChange={(e) => onUpdateRule?.(rule.id, { operator: e.target.value })}
                    disabled={!isEnabled}
                  >
                    <option value="contains">Contains</option>
                    <option value="equals">Equals</option>
                    <option value="startsWith">Starts With</option>
                    <option value="endsWith">Ends With</option>
                    <option value="not">Not Contains</option>
                  </select>
                  <input
                    type="text"
                    className={EXPANDED_STYLES.input}
                    value={rule.value}
                    onChange={(e) => onUpdateRule?.(rule.id, { value: e.target.value })}
                    placeholder="Filter value..."
                    disabled={!isEnabled}
                  />
                </div>
              </div>
            ))}
            {filterRules.length === 0 && (
              <div className="text-[10px] text-muted-foreground text-center py-4">
                No filter rules configured
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
            <span className={EXPANDED_STYLES.statusLabel}>Processed</span>
            <span className={EXPANDED_STYLES.statusValue}>{totalProcessed}</span>
          </div>
          <div className={EXPANDED_STYLES.statusRow}>
            <span className={EXPANDED_STYLES.statusLabel}>Matched</span>
            <span className={EXPANDED_STYLES.statusValue}>{totalMatched}</span>
          </div>
          <div className={EXPANDED_STYLES.statusRow}>
            <span className={EXPANDED_STYLES.statusLabel}>Last Processed</span>
            <span className={EXPANDED_STYLES.statusValue}>{lastProcessedDisplay}</span>
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

EmailFilterExpanded.displayName = "EmailFilterExpanded";