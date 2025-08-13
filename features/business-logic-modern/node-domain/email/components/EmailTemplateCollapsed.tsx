"use client";
/**
 * Route: features/business-logic-modern/node-domain/email/components/EmailTemplateCollapsed.tsx
 * EMAIL TEMPLATE – Collapsed view UI
 *
 * • Compact status with template name and active state
 * • Status dot with glow and processing states
 * • Center button triggers template designer (Enter/Space supported)
 * • Matches EmailMessageCollapsed design style
 *
 * Keywords: email-template, collapsed, status-dot, compact, designer
 */

import RenderStatusDot from "@/components/RenderStatusDot";
import { memo, useMemo, useCallback } from "react";
import { MdOutlineDesignServices } from "react-icons/md";
import SkueButton from "@/components/ui/skue-button";
import type { EmailTemplateData } from "../emailTemplate.node";

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

interface EmailTemplateCollapsedProps {
  nodeData: EmailTemplateData;
  categoryStyles: { primary: string };
  onToggleExpand?: () => void;
  onOpenDesigner?: () => void;
}

export const EmailTemplateCollapsed = memo(
  ({
    nodeData,
    categoryStyles,
    onToggleExpand,
    onOpenDesigner,
  }: EmailTemplateCollapsedProps) => {
    
    const { templateName, isActive, isSaving, editorData, category } = nodeData;

    // [Explanation], basically modal is owned by the node; this button just triggers it

    const statusProps = useMemo(() => {
      const hasContent = Boolean(templateName?.trim() || (editorData && Object.keys(editorData).length > 0));
      const isProcessing = isSaving;
      const isError = Boolean(nodeData.lastError);

      return {
        eventActive: isActive && hasContent,
        isProcessing: isProcessing,
        hasError: isError,
        enableGlow: true,
        size: "sm" as const,
        titleText: isError
          ? "error"
          : isProcessing
            ? "processing"
            : isActive && hasContent
              ? "active"
              : "neutral",
      };
    }, [isActive, isSaving, nodeData.lastError, templateName, editorData]);

    const displayText = useMemo(() => {
      if (templateName?.trim()) {
        return templateName.trim();
      }
      if (editorData && Object.keys(editorData).length > 0) {
        return "Template";
      }
      return "No template";
    }, [templateName, editorData]);

    const handleOpenDesigner = useCallback(() => {
      onOpenDesigner?.();
    }, [onOpenDesigner]);

    return (
      <div className={COLLAPSED_STYLES.container}>
        <div className={COLLAPSED_STYLES.content}>
          {/* Icon */}
          <div className="flex justify-center">
            <SkueButton
              ariaLabel="Design Template"
              title="Design Template"
              checked={false}
              onCheckedChange={(checked) => {
                if (checked) handleOpenDesigner();
              }}
              size="sm"
              className="cursor-pointer translate-y-2"
              style={{ transform: "scale(1.1)", transformOrigin: "center" }}
              surfaceBgVar="--node-email-bg"
            >
              <MdOutlineDesignServices />
            </SkueButton>
          </div>

          {/* Text and Status */}
          <div className={COLLAPSED_STYLES.textInfo}>
            <div
              className={`${COLLAPSED_STYLES.primaryText} ${categoryStyles.primary}`}
            >
              {displayText}
            </div>
            <div className={COLLAPSED_STYLES.statusIndicator}>
              <RenderStatusDot {...statusProps} />
            </div>
          </div>
        </div>

        
      </div>
    );
  }
);

EmailTemplateCollapsed.displayName = "EmailTemplateCollapsed";

export default EmailTemplateCollapsed;
