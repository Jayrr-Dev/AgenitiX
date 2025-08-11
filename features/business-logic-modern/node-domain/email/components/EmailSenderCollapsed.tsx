"use client";
/**
 * Route: features/business-logic-modern/node-domain/email/components/EmailSenderCollapsed.tsx
 * EMAIL SENDER – Collapsed view UI
 *
 * • Compact status with sent count
 * • Status dot with glow and processing states
 * • Center button triggers send action (Enter/Space supported)
 *
 * Keywords: email-sender, collapsed, status-dot, compact
 */

import RenderStatusDot from "@/components/RenderStatusDot";
import { memo, useMemo } from "react";
import { MdSend } from "react-icons/md";
import type { EmailSenderData } from "../emailSender.node";

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

interface EmailSenderCollapsedProps {
  nodeData: EmailSenderData;
  categoryStyles: { primary: string };
  onToggleExpand?: () => void;
  onSendEmail?: () => void;
}

export const EmailSenderCollapsed = memo(
  ({
    nodeData,
    categoryStyles,
    onToggleExpand,
    onSendEmail,
  }: EmailSenderCollapsedProps) => {
    const { sentCount, sendingStatus, accountId } = nodeData;

    const statusProps = useMemo(() => {
      const isSent = sendingStatus === "sent";
      const isSending = sendingStatus === "sending";
      const isError = sendingStatus === "error";

      return {
        eventActive: isSent,
        isProcessing: isSending,
        hasError: isError,
        enableGlow: true,
        size: "sm" as const,
        titleText: isError
          ? "error"
          : isSending
            ? "processing"
            : isSent
              ? "active"
              : "neutral",
      };
    }, [sendingStatus]);

    const displayText = useMemo(() => {
      if (accountId) {
        return `${sentCount} sent`;
      }
      return "No account";
    }, [accountId, sentCount]);

    return (
      <div className={COLLAPSED_STYLES.container}>
        <div className={COLLAPSED_STYLES.content}>
          {/* Icon */}
          <div className="flex justify-center">
            <div
              className={COLLAPSED_STYLES.iconButton}
              onClick={onSendEmail}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  // [Explanation], basically trigger send action from collapsed center button
                  onSendEmail?.();
                }
              }}
            >
              <MdSend className={`w-5 h-5 ${COLLAPSED_STYLES.iconWrapper}`} />
            </div>
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

EmailSenderCollapsed.displayName = "EmailSenderCollapsed";

export default EmailSenderCollapsed;
