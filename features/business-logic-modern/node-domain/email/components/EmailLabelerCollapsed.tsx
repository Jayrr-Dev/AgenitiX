"use client";
/**
 * EmailLabelerCollapsed – Professional collapsed view following emailMessage design principles
 */

import RenderStatusDot from "@/components/RenderStatusDot";
import { memo, useMemo } from "react";
import { FiTag } from "react-icons/fi";
import SkueButton from "@/components/ui/skue-button";
import type { EmailLabelerData } from "../emailLabeler.node";

const COLLAPSED_STYLES = {
  container: "flex items-center justify-center w-full h-full",
  content: "p-3 text-center space-y-3 mt-2",
  iconButton: "relative w-10 h-10 bg-gradient-to-br from-white to-gray-50 dark:from-gray-100 dark:to-gray-200 rounded-full flex items-center justify-center transform transition-all duration-300 hover:scale-105 active:scale-95 shadow-[0_8px_32px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.3)] cursor-pointer",
  iconWrapper: "relative z-10 text-white dark:text-black opacity-75",
  textInfo: "space-y-1",
  primaryText: "font-medium text-[10px] truncate",
  statusIndicator: "flex items-center justify-center gap-1",
} as const;

interface EmailLabelerCollapsedProps {
  nodeData: EmailLabelerData;
  categoryStyles: { primary: string; secondary: string };
  onToggleExpand?: () => void;
}

export const EmailLabelerCollapsed = memo(
  ({ nodeData, categoryStyles, onToggleExpand }: EmailLabelerCollapsedProps) => {
    const { 
      availableLabels,
      labelingStatus, 
      totalLabeled,
      labelingMode
    } = nodeData;

    const statusProps = useMemo(() => {
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

    const displayText = useMemo(() => {
      return `${availableLabels.length} labels (${labelingMode})`;
    }, [availableLabels.length, labelingMode]);

    const statsText = useMemo(() => {
      if (totalLabeled === 0) return "No emails labeled";
      return `${totalLabeled} emails labeled`;
    }, [totalLabeled]);

    return (
      <div className={COLLAPSED_STYLES.container}>
        <div className={COLLAPSED_STYLES.content}>
          <div className="flex justify-center">
            <SkueButton
              onClick={onToggleExpand}
              className={COLLAPSED_STYLES.iconButton}
              aria-label="Expand email labeler"
            >
              <div className={COLLAPSED_STYLES.iconWrapper}>
                <FiTag size={16} />
              </div>
            </SkueButton>
          </div>

          <div className={COLLAPSED_STYLES.textInfo}>
            <div className={`${COLLAPSED_STYLES.primaryText} ${categoryStyles.primary}`}>
              Email Labeler
            </div>
            <div className="text-[10px] text-muted-foreground">
              {displayText}
            </div>
            <div className="text-[9px] text-muted-foreground/70">
              {statsText}
            </div>
          </div>

          <div className={COLLAPSED_STYLES.statusIndicator}>
            <RenderStatusDot {...statusProps} />
            <span className="text-[10px] text-muted-foreground ml-1">
              {statusProps.titleText}
            </span>
          </div>
        </div>
      </div>
    );
  }
);

EmailLabelerCollapsed.displayName = "EmailLabelerCollapsed";