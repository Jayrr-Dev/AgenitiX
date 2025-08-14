"use client";
/**
 * EmailDraftCollapsed – Professional collapsed view following emailMessage design principles
 *
 * • 10px text consistency throughout
 * • SkueButton for primary interactions
 * • RenderStatusDot for draft states
 * • Proper spacing and gradients matching emailMessage
 * • Smooth transitions and hover effects
 *
 * Keywords: email-draft, collapsed, professional-ui, auto-save
 */

import RenderStatusDot from "@/components/RenderStatusDot";
import { memo, useMemo } from "react";
import { MdOutlineDrafts } from "react-icons/md";
import SkueButton from "@/components/ui/skue-button";
import type { EmailDraftData } from "../emailDraft.node";

const COLLAPSED_STYLES = {
  container: "flex items-center justify-center w-full h-full",
  content: "p-3 text-center space-y-3 mt-2",
  iconButton:
    "relative w-10 h-10 bg-gradient-to-br from-white to-gray-50 dark:from-gray-100 dark:to-gray-200 rounded-full flex items-center justify-center transform transition-all duration-300 hover:scale-105 active:scale-95 shadow-[0_8px_32px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.3)] cursor-pointer",
  iconWrapper: "relative z-10 text-white dark:text-black opacity-75",
  textInfo: "space-y-1",
  primaryText: "font-medium text-[10px] truncate",
  statusIndicator: "flex items-center justify-center gap-1",
} as const;

interface EmailDraftCollapsedProps {
  nodeData: EmailDraftData;
  categoryStyles: { primary: string; secondary: string };
  onToggleExpand?: () => void;
  onSaveDraft?: () => void;
}

export const EmailDraftCollapsed = memo(
  ({
    nodeData,
    categoryStyles,
    onToggleExpand,
    onSaveDraft,
  }: EmailDraftCollapsedProps) => {
    const { 
      subject,
      messageContent,
      draftStatus, 
      wordCount,
      characterCount,
      lastSavedAt,
      autoSave
    } = nodeData;

    const statusProps = useMemo(() => {
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

    const displayText = useMemo(() => {
      if (subject || messageContent) {
        return `${wordCount} words`;
      }
      return "Empty draft";
    }, [subject, messageContent, wordCount]);

    const subjectDisplay = useMemo(() => {
      if (!subject && !messageContent) return "New Draft";
      if (subject) return subject.length > 20 ? `${subject.slice(0, 20)}...` : subject;
      return "Untitled Draft";
    }, [subject, messageContent]);

    const lastSavedDisplay = useMemo(() => {
      if (!lastSavedAt) return "";
      const now = Date.now();
      const diff = now - lastSavedAt;
      const minutes = Math.floor(diff / 60000);
      if (minutes < 1) return "Just saved";
      if (minutes < 60) return `${minutes}m ago`;
      const hours = Math.floor(minutes / 60);
      return `${hours}h ago`;
    }, [lastSavedAt]);

    return (
      <div className={COLLAPSED_STYLES.container}>
        <div className={COLLAPSED_STYLES.content}>
          {/* Icon */}
          <div className="flex justify-center">
            <SkueButton
              onClick={draftStatus === "editing" && !autoSave ? onSaveDraft : onToggleExpand}
              className={COLLAPSED_STYLES.iconButton}
              aria-label={draftStatus === "editing" && !autoSave ? "Save draft" : "Expand draft editor"}
            >
              <div className={COLLAPSED_STYLES.iconWrapper}>
                <MdOutlineDrafts size={16} />
              </div>
            </SkueButton>
          </div>

          {/* Text Info */}
          <div className={COLLAPSED_STYLES.textInfo}>
            <div className={`${COLLAPSED_STYLES.primaryText} ${categoryStyles.primary}`}>
              {subjectDisplay}
            </div>
            <div className={`text-[10px] text-muted-foreground`}>
              {displayText}
            </div>
            {lastSavedDisplay && (
              <div className="text-[9px] text-muted-foreground/70">
                {lastSavedDisplay}
              </div>
            )}
          </div>

          {/* Status Indicator */}
          <div className={COLLAPSED_STYLES.statusIndicator}>
            <RenderStatusDot {...statusProps} />
            <span className="text-[10px] text-muted-foreground ml-1">
              {statusProps.titleText}
            </span>
          </div>

          {/* Auto-save indicator */}
          {autoSave && (
            <div className="text-[9px] text-muted-foreground/60">
              Auto-save enabled
            </div>
          )}
        </div>
      </div>
    );
  }
);

EmailDraftCollapsed.displayName = "EmailDraftCollapsed";