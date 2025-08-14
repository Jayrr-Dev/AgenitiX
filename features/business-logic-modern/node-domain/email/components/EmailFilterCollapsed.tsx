"use client";
/**
 * EmailFilterCollapsed – Professional collapsed view following emailMessage design principles
 */

import RenderStatusDot from "@/components/RenderStatusDot";
import { memo, useMemo } from "react";
import { FiFilter } from "react-icons/fi";
import SkueButton from "@/components/ui/skue-button";
import type { EmailFilterData } from "../emailFilter.node";

const COLLAPSED_STYLES = {
  container: "flex items-center justify-center w-full h-full",
  content: "p-3 text-center space-y-3 mt-2",
  iconButton: "relative w-10 h-10 bg-gradient-to-br from-white to-gray-50 dark:from-gray-100 dark:to-gray-200 rounded-full flex items-center justify-center transform transition-all duration-300 hover:scale-105 active:scale-95 shadow-[0_8px_32px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.3)] cursor-pointer",
  iconWrapper: "relative z-10 text-white dark:text-black opacity-75",
  textInfo: "space-y-1",
  primaryText: "font-medium text-[10px] truncate",
  statusIndicator: "flex items-center justify-center gap-1",
} as const;

interface EmailFilterCollapsedProps {
  nodeData: EmailFilterData;
  categoryStyles: { primary: string; secondary: string };
  onToggleExpand?: () => void;
}

export const EmailFilterCollapsed = memo(
  ({ nodeData, categoryStyles, onToggleExpand }: EmailFilterCollapsedProps) => {
    const { 
      filterRules,
      filterStatus, 
      totalProcessed,
      totalMatched,
      matchMode
    } = nodeData;

    const statusProps = useMemo(() => {
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

    const displayText = useMemo(() => {
      if (filterRules.length === 0) return "No rules";
      return `${filterRules.length} rules (${matchMode})`;
    }, [filterRules.length, matchMode]);

    const statsText = useMemo(() => {
      if (totalProcessed === 0) return "No emails processed";
      return `${totalMatched}/${totalProcessed} matched`;
    }, [totalProcessed, totalMatched]);

    return (
      <div className={COLLAPSED_STYLES.container}>
        <div className={COLLAPSED_STYLES.content}>
          <div className="flex justify-center">
            <SkueButton
              onClick={onToggleExpand}
              className={COLLAPSED_STYLES.iconButton}
              aria-label="Expand email filter"
            >
              <div className={COLLAPSED_STYLES.iconWrapper}>
                <FiFilter size={16} />
              </div>
            </SkueButton>
          </div>

          <div className={COLLAPSED_STYLES.textInfo}>
            <div className={`${COLLAPSED_STYLES.primaryText} ${categoryStyles.primary}`}>
              Email Filter
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

EmailFilterCollapsed.displayName = "EmailFilterCollapsed";