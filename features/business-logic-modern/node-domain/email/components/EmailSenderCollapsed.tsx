"use client";
/**
 * Route: features/business-logic-modern/node-domain/email/components/EmailSenderCollapsed.tsx
 * EMAIL SENDER – Collapsed view UI following EmailReader design principles
 *
 * • Compact status with sent count and send status
 * • Status dot with glow and processing states
 * • Center button triggers send action (Enter/Space supported)
 * • Consistent 10px text size and spacing with EmailReader
 *
 * Keywords: email-sender, collapsed, status-dot, compact
 */

import RenderStatusDot from "@/components/RenderStatusDot";
import { memo, useMemo } from "react";
import { MdSend } from "react-icons/md";
import SkueButton from "@/components/ui/skue-button";
import type { EmailSenderData } from "../emailSender.node";

const COLLAPSED_STYLES = {
  container: "flex items-center justify-center w-full h-full",
  content: "p-3 text-center space-y-3 mt-2",
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
      const isSending = sendingStatus === "sending" || sendingStatus === "composing";
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
              ? "sent"
              : "neutral",
      };
    }, [sendingStatus]);

    const displayText = useMemo(() => {
      if (accountId && sentCount > 0) {
        return `${sentCount} sent`;
      }
      return "No emails sent";
    }, [accountId, sentCount]);

    // Determine if button should be in processing state
    const isProcessing = sendingStatus === "sending" || sendingStatus === "composing";

    return (
      <div className={COLLAPSED_STYLES.container}>
        <div className={COLLAPSED_STYLES.content}>
          {/* Icon */}
          <div className="flex justify-center">
            <SkueButton
              ariaLabel="Send"
              title="Send"
              checked={false}
              processing={isProcessing}
              onCheckedChange={(checked) => {
                if (checked) onSendEmail?.();
              }}
              size="sm"
              className="cursor-pointer translate-y-2"
              style={{ transform: "scale(1.1)", transformOrigin: "center" }}
              surfaceBgVar="--node-email-bg"
            >
              <MdSend />
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

EmailSenderCollapsed.displayName = "EmailSenderCollapsed";

export default EmailSenderCollapsed;