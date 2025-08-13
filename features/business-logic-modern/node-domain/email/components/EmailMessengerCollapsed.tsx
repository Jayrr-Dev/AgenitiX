"use client";
/**
 * Route: features/business-logic-modern/node-domain/email/components/EmailMessengerCollapsed.tsx
 * EMAIL MESSENGER – Collapsed view UI (mirrors EmailReader)
 *
 * • Compact status with readiness indicator
 * • Status dot with glow and processing states
 * • Center button emits message JSON to downstream nodes
 *
 * Keywords: email-messenger, collapsed, status-dot, compact
 */

import RenderStatusDot from "@/components/RenderStatusDot";
import { memo, useMemo } from "react";
import { MdMailOutline } from "react-icons/md";
import type { EmailMessengerData } from "../emailMessenger.node";

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

interface EmailMessengerCollapsedProps {
  nodeData: EmailMessengerData;
  categoryStyles: { primary: string };
  onToggleExpand?: () => void;
  onEmitMessage?: () => void;
}

export const EmailMessengerCollapsed = memo(
  ({ nodeData, categoryStyles, onToggleExpand, onEmitMessage }: EmailMessengerCollapsedProps) => {
    const { recipients, subject, isActive } = nodeData;

    const statusProps = useMemo(() => {
      const ready = Boolean(
        (recipients?.to?.length || 0) > 0 && (subject?.trim()?.length || 0) > 0
      );
      return {
        eventActive: Boolean(isActive && ready),
        isProcessing: false,
        hasError: false,
        enableGlow: true,
        size: "sm" as const,
        titleText: ready ? "ready" : "neutral",
      };
    }, [recipients, subject, isActive]);

    const displayText = useMemo(() => {
      const toCount = nodeData.recipients?.to?.length || 0;
      return toCount > 0 ? `${toCount} recipient(s)` : "No recipients";
    }, [nodeData.recipients]);

    return (
      <div className={COLLAPSED_STYLES.container}>
        <div className={COLLAPSED_STYLES.content}>
          {/* Icon */}
          <div className="flex justify-center">
            <div
              className={COLLAPSED_STYLES.iconButton}
              onClick={onEmitMessage}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  // [Explanation], basically trigger emit action from collapsed center button
                  onEmitMessage?.();
                }
              }}
            >
              <MdMailOutline className={`w-5 h-5 ${COLLAPSED_STYLES.iconWrapper}`} />
            </div>
          </div>

          {/* Text and Status */}
          <div className={COLLAPSED_STYLES.textInfo}>
            <div className={`${COLLAPSED_STYLES.primaryText} ${categoryStyles.primary}`}>
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

EmailMessengerCollapsed.displayName = "EmailMessengerCollapsed";

export default EmailMessengerCollapsed;


