"use client";
/**
 * Route: features/business-logic-modern/node-domain/email/components/EmailReaderCollapsed.tsx
 * EMAIL READER – Collapsed view UI
 *
 * • Compact status with message count
 * • Status dot with glow and processing states
 * • Accessible toggle via keyboard
 *
 * Keywords: email-reader, collapsed, status-dot, compact
 */

import { memo, useMemo } from "react";
import { MdMailOutline } from "react-icons/md";
import RenderStatusDot from "@/components/RenderStatusDot";
import type { EmailReaderData } from "../emailReader.node";

const COLLAPSED_STYLES = {
  container: "flex items-center justify-center w-full h-full",
  content: "p-3 text-center space-y-3 mt-2",
  iconButton:
    "relative w-10 h-10 bg-gradient-to-br from-white to-gray-50 dark:from-gray-100 dark:to-gray-200 rounded-full flex items-center justify-center transform transition-all duration-300 hover:scale-105 active:scale-95 shadow-[0_8px_32px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.3)] cursor-pointer",
  iconWrapper: "relative z-10",
  textInfo: "space-y-1",
  primaryText: "font-medium text-[10px] truncate",
  statusIndicator: "flex items-center justify-center gap-1",
} as const;

interface EmailReaderCollapsedProps {
  nodeData: EmailReaderData;
  categoryStyles: { primary: string };
  onToggleExpand?: () => void;
}

export const EmailReaderCollapsed = memo(
  ({ nodeData, categoryStyles, onToggleExpand }: EmailReaderCollapsedProps) => {
    const { messageCount, connectionStatus, accountId } = nodeData;

    const statusProps = useMemo(() => {
      const isConnected = connectionStatus === "connected";
      const isConnecting = connectionStatus === "connecting" || connectionStatus === "reading";
      const isError = connectionStatus === "error";

      return {
        eventActive: isConnected,
        isProcessing: isConnecting,
        hasError: isError,
        enableGlow: true,
        size: "sm" as const,
        titleText: isError
          ? "error"
          : isConnecting
            ? "processing"
            : isConnected
              ? "active"
              : "neutral",
      };
    }, [connectionStatus]);

    const displayText = useMemo(() => {
      if (accountId) {
        return `${messageCount} messages`;
      }
      return "No account";
    }, [accountId, messageCount]);

    return (
      <div className={COLLAPSED_STYLES.container}>
        <div className={COLLAPSED_STYLES.content}>
          {/* Icon */}
          <div className="flex justify-center">
            <div
              className={COLLAPSED_STYLES.iconButton}
              onClick={onToggleExpand}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onToggleExpand?.();
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
  },
);

EmailReaderCollapsed.displayName = "EmailReaderCollapsed";

export default EmailReaderCollapsed;


