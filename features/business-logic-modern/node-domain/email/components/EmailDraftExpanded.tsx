"use client";
/**
 * EmailDraftExpanded – Professional expanded view following emailMessage design principles
 *
 * • Clean, focused interface for email draft editing
 * • 10px text consistency and proper spacing
 * • Professional form controls and auto-save indicators
 * • Real-time word count and draft status
 * • Maintains compatibility with node architecture
 *
 * Keywords: email-draft, expanded, editor, professional-ui
 */

import * as React from "react";
import { FiEdit3, FiSave, FiClock, FiCheck, FiAlertCircle } from "react-icons/fi";
import RenderStatusDot from "@/components/RenderStatusDot";
import SkueButton from "@/components/ui/skue-button";
import type { EmailDraftData } from "../emailDraft.node";

// Professional expanded styles following emailMessage patterns
const EXPANDED_STYLES = {
  container: "w-full h-full p-3 space-y-3",
  disabled: "opacity-75 pointer-events-none",
  
  // Header section
  header: "flex items-center justify-between pb-2 border-b border-border/20",
  headerTitle: "flex items-center gap-2 text-[10px] font-medium",
  headerIcon: "text-muted-foreground",
  
  // Editor sections
  section: "space-y-2",
  sectionTitle: "text-[10px] font-medium text-muted-foreground uppercase tracking-wide",
  
  // Form controls
  formGroup: "space-y-1",
  label: "text-[10px] font-medium text-foreground",
  input: "w-full px-2 py-1 text-[10px] border border-border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent transition-colors",
  textarea: "w-full px-2 py-1 text-[10px] border border-border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent transition-colors resize-none",
  select: "w-full px-2 py-1 text-[10px] border border-border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent transition-colors",
  
  // Status section
  statusSection: "bg-muted/20 rounded-lg p-3 space-y-2",
  statusRow: "flex items-center justify-between",
  statusLabel: "text-[10px] font-medium text-muted-foreground",
  statusValue: "text-[10px] font-medium",
  
  // Stats section
  statsSection: "flex justify-between items-center text-[10px] text-muted-foreground",
  statItem: "flex items-center gap-1",
  
  // Action buttons
  buttonGroup: "flex gap-2 pt-2",
  primaryButton: "flex-1 px-3 py-2 text-[10px] font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
  secondaryButton: "flex-1 px-3 py-2 text-[10px] font-medium border border-border rounded-md hover:bg-muted/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
} as const;

export interface EmailDraftExpandedProps {
  nodeId: string;
  nodeData: EmailDraftData;
  isEnabled: boolean;
  draftStatus: EmailDraftData["draftStatus"];
  onSubjectChange?: (subject: string) => void;
  onContentChange?: (content: string) => void;
  onSaveDraft?: () => void;
}

export const EmailDraftExpanded = React.memo(
  function EmailDraftExpanded(props: EmailDraftExpandedProps) {
    const {
      nodeId,
      nodeData,
      isEnabled,
      draftStatus,
      onSubjectChange,
      onContentChange,
      onSaveDraft,
    } = props;

    const {
      subject,
      messageContent,
      messageType,
      priority,
      wordCount,
      characterCount,
      autoSave,
      saveInterval,
      lastSavedAt,
      lastError,
      createdAt,
    } = nodeData;

    // Status indicators
    const statusProps = React.useMemo(() => {
      const isSaved = draftStatus === "saved";
      const isSaving = draftStatus === "saving";
      const isEditing = draftStatus === "editing";
      const isError = draftStatus === "error";

      return {
        eventActive: isSaved,
        isProcessing: isSaving,
        hasError: isError,
        enableGlow: true,
        size: "sm" as const,
        titleText: isError
          ? "error"
          : isSaving
            ? "saving"
          : isEditing
            ? "editing"
          : isSaved
            ? "saved"
            : "new",
      };
    }, [draftStatus]);

    // Format timestamps
    const createdDisplay = React.useMemo(() => {
      if (!createdAt) return "Not created";
      return new Date(createdAt).toLocaleString();
    }, [createdAt]);

    const lastSavedDisplay = React.useMemo(() => {
      if (!lastSavedAt) return "Never";
      return new Date(lastSavedAt).toLocaleString();
    }, [lastSavedAt]);

    // Can save check
    const canSave = (subject.trim() || messageContent.trim()) && draftStatus !== "saving";

    return (
      <div
        className={`${EXPANDED_STYLES.container} ${isEnabled ? "" : EXPANDED_STYLES.disabled}`}
      >
        {/* Header */}
        <div className={EXPANDED_STYLES.header}>
          <div className={EXPANDED_STYLES.headerTitle}>
            <FiEdit3 className={EXPANDED_STYLES.headerIcon} size={12} />
            Email Draft Editor
          </div>
          <RenderStatusDot {...statusProps} />
        </div>

        {/* Subject Section */}
        <div className={EXPANDED_STYLES.section}>
          <div className={EXPANDED_STYLES.formGroup}>
            <label className={EXPANDED_STYLES.label}>Subject</label>
            <input
              type="text"
              className={EXPANDED_STYLES.input}
              value={subject}
              onChange={(e) => onSubjectChange?.(e.target.value)}
              placeholder="Enter email subject..."
              disabled={!isEnabled}
            />
          </div>
        </div>

        {/* Message Content Section */}
        <div className={EXPANDED_STYLES.section}>
          <div className={EXPANDED_STYLES.formGroup}>
            <label className={EXPANDED_STYLES.label}>Message</label>
            <textarea
              className={`${EXPANDED_STYLES.textarea} min-h-20`}
              value={messageContent}
              onChange={(e) => onContentChange?.(e.target.value)}
              placeholder="Draft your email message..."
              disabled={!isEnabled}
              rows={4}
            />
          </div>
        </div>

        {/* Message Options */}
        <div className={EXPANDED_STYLES.section}>
          <div className="grid grid-cols-2 gap-2">
            <div className={EXPANDED_STYLES.formGroup}>
              <label className={EXPANDED_STYLES.label}>Format</label>
              <select
                className={EXPANDED_STYLES.select}
                value={messageType}
                disabled={!isEnabled}
              >
                <option value="plain">Plain Text</option>
                <option value="html">HTML</option>
                <option value="markdown">Markdown</option>
              </select>
            </div>
            
            <div className={EXPANDED_STYLES.formGroup}>
              <label className={EXPANDED_STYLES.label}>Priority</label>
              <select
                className={EXPANDED_STYLES.select}
                value={priority}
                disabled={!isEnabled}
              >
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className={EXPANDED_STYLES.statsSection}>
          <div className={EXPANDED_STYLES.statItem}>
            <span>{wordCount} words</span>
          </div>
          <div className={EXPANDED_STYLES.statItem}>
            <span>{characterCount} characters</span>
          </div>
          {autoSave && (
            <div className={EXPANDED_STYLES.statItem}>
              <FiClock size={10} />
              <span>Auto-save: {saveInterval}s</span>
            </div>
          )}
        </div>

        {/* Status Section */}
        <div className={EXPANDED_STYLES.statusSection}>
          <div className={EXPANDED_STYLES.statusRow}>
            <span className={EXPANDED_STYLES.statusLabel}>Draft Status</span>
            <div className="flex items-center gap-1">
              <RenderStatusDot {...statusProps} />
              <span className={EXPANDED_STYLES.statusValue}>
                {statusProps.titleText}
              </span>
            </div>
          </div>

          <div className={EXPANDED_STYLES.statusRow}>
            <span className={EXPANDED_STYLES.statusLabel}>Created</span>
            <span className={EXPANDED_STYLES.statusValue}>{createdDisplay}</span>
          </div>

          <div className={EXPANDED_STYLES.statusRow}>
            <span className={EXPANDED_STYLES.statusLabel}>Last Saved</span>
            <span className={EXPANDED_STYLES.statusValue}>{lastSavedDisplay}</span>
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

        {/* Action Buttons */}
        <div className={EXPANDED_STYLES.buttonGroup}>
          <button
            className={EXPANDED_STYLES.primaryButton}
            onClick={onSaveDraft}
            disabled={!canSave || !isEnabled}
          >
            <FiSave size={12} className="inline mr-1" />
            {draftStatus === "saving" ? "Saving..." : "Save Draft"}
          </button>
          
          <button
            className={EXPANDED_STYLES.secondaryButton}
            disabled={!isEnabled || !subject.trim()}
          >
            <FiCheck size={12} className="inline mr-1" />
            Send
          </button>
        </div>
      </div>
    );
  },
  (prev, next) => {
    // Optimize re-renders by comparing essential props
    return (
      prev.isEnabled === next.isEnabled &&
      prev.draftStatus === next.draftStatus &&
      prev.nodeData.subject === next.nodeData.subject &&
      prev.nodeData.messageContent === next.nodeData.messageContent &&
      prev.nodeData.messageType === next.nodeData.messageType &&
      prev.nodeData.priority === next.nodeData.priority &&
      prev.nodeData.wordCount === next.nodeData.wordCount &&
      prev.nodeData.characterCount === next.nodeData.characterCount &&
      prev.nodeData.autoSave === next.nodeData.autoSave &&
      prev.nodeData.saveInterval === next.nodeData.saveInterval &&
      prev.nodeData.lastSavedAt === next.nodeData.lastSavedAt &&
      prev.nodeData.lastError === next.nodeData.lastError
    );
  }
);

EmailDraftExpanded.displayName = "EmailDraftExpanded";