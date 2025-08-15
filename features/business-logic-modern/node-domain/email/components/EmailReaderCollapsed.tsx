"use client";
/**
 * Route: features/business-logic-modern/node-domain/email/components/EmailReaderCollapsed.tsx
 * EMAIL READER – Collapsed view UI following EmailMessage design principles
 *
 * • Compact status with message count and read status
 * • Status dot with glow and processing states
 * • Center button triggers read action (Enter/Space supported)
 * • Consistent 10px text size and spacing with EmailMessage
 *
 * Keywords: email-reader, collapsed, status-dot, compact
 */

import RenderStatusDot from "@/components/RenderStatusDot";
import { memo, useMemo } from "react";
import { MdOutlineMailOutline } from "react-icons/md";
import SkueButton from "@/components/ui/skue-button";
import type { EmailReaderData } from "../emailReader.node";

const COLLAPSED_STYLES = {
  container: "flex items-center justify-center w-full h-full",
  content: "p-3 text-center space-y-3 mt-2",
  textInfo: "space-y-1",
  primaryText: "font-medium text-[10px] truncate",
  statusIndicator: "flex items-center justify-center gap-1",
} as const;

interface EmailReaderCollapsedProps {
  nodeData: EmailReaderData;
  categoryStyles: { primary: string };
  onToggleExpand?: () => void;
  onReadMessages?: () => void;
}

export const EmailReaderCollapsed = memo(
  ({
    nodeData,
    categoryStyles,
    onToggleExpand,
    onReadMessages,
  }: EmailReaderCollapsedProps) => {
    const { messageCount, connectionStatus, accountId } = nodeData;

    const statusProps = useMemo(() => {
      const isConnected = connectionStatus === "connected";
      const isReading = connectionStatus === "reading" || connectionStatus === "processing";
      const isError = connectionStatus === "error";

      return {
        eventActive: isConnected,
        isProcessing: isReading,
        hasError: isError,
        enableGlow: true,
        size: "sm" as const,
        titleText: isError
          ? "error"
          : isReading
            ? "processing"
            : isConnected
              ? "connected"
              : "neutral",
      };
    }, [connectionStatus]);

    const displayText = useMemo(() => {
      if (accountId && messageCount > 0) {
        return `${messageCount} messages`;
      }
      return "No messages";
    }, [accountId, messageCount]);

    // Determine if button should be in processing state
    const isProcessing = connectionStatus === "reading" || connectionStatus === "processing";

    return (
      <div className={COLLAPSED_STYLES.container}>
        <div className={COLLAPSED_STYLES.content}>
          {/* Icon */}
          <div className="flex justify-center">
            <SkueButton
              ariaLabel="Read"
              title="Read"
              checked={false}
              processing={isProcessing}
              onCheckedChange={(checked) => {
                if (checked) onReadMessages?.();
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

EmailReaderCollapsed.displayName = "EmailReaderCollapsed";

export default EmailReaderCollapsed;