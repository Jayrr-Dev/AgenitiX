"use client";
/**
 * Route: features/business-logic-modern/node-domain/email/components/EmailMessageCollapsed.tsx
 * EMAIL MESSAGE – Collapsed view UI
 *
 * • Compact status with message count and send status
 * • Status dot with glow and processing states
 * • Center button triggers compose action (Enter/Space supported)
 *
 * Keywords: email-message, collapsed, status-dot, compact
 */

import RenderStatusDot from "@/components/RenderStatusDot";
import { memo, useMemo } from "react";
import { MdOutlineMailOutline } from "react-icons/md";
import SkueButton from "@/components/ui/skue-button";
import type { EmailMessageData } from "../emailMessage.node";

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

interface EmailMessageCollapsedProps {
  nodeData: EmailMessageData;
  categoryStyles: { primary: string };
  onToggleExpand?: () => void;
  onComposeMessage?: () => void;
}

export const EmailMessageCollapsed = memo(
  ({
    nodeData,
    categoryStyles,
    onToggleExpand,
    onComposeMessage,
  }: EmailMessageCollapsedProps) => {
    const { sentCount, connectionStatus, subject, messageContent } = nodeData;

    const statusProps = useMemo(() => {
      const isSent = connectionStatus === "sent";
      const isSending =
        connectionStatus === "composing" || connectionStatus === "sending";
      const isError = connectionStatus === "error";

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
              ? "sent"
              : "neutral",
      };
    }, [connectionStatus]);

    const displayText = useMemo(() => {
      if (subject || messageContent) {
        return `${sentCount} sent`;
      }
      return "No message";
    }, [subject, messageContent, sentCount]);

    return (
      <div className={COLLAPSED_STYLES.container}>
        <div className={COLLAPSED_STYLES.content}>
          {/* Icon */}
          <div className="flex justify-center">
            <SkueButton
              ariaLabel="Compose"
              title="Compose"
              checked={false}
              onCheckedChange={(checked) => {
                if (checked) onComposeMessage?.();
              }}
              size="sm"
              className="cursor-pointer translate-y-2"
              style={{ transform: "scale(1.1)", transformOrigin: "center" }}
              surfaceBgVar="--node-email-bg"
            >
              <MdOutlineMailOutline />
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

EmailMessageCollapsed.displayName = "EmailMessageCollapsed";

export default EmailMessageCollapsed;
