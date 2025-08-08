/**
 * Route: features/business-logic-modern/node-domain/email/components/EmailAccountCollapsed.tsx
 * EMAIL ACCOUNT COLLAPSED VIEW - Compact display for collapsed node state
 *
 * • Provider-specific icons with gradient backgrounds
 * • Connection status indicators
 * • Email address display with truncation
 * • Hover effects and animations
 * • Responsive design for small node size
 *
 * Keywords: collapsed-view, provider-icons, status-indicators, compact-ui
 */

import { memo, useMemo } from "react";
import { FaMicrosoft } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import { MdEmail } from "react-icons/md";
import RenderStatusDot from "@/components/RenderStatusDot";
// No import needed for types

// Collapsed view styling constants
const COLLAPSED_STYLES = {
  container: "flex items-center justify-center w-full h-full",
  content: "p-3 text-center space-y-3 mt-4",
  providerIcon:
    "relative w-12 h-12 bg-gradient-to-br from-white to-gray-50 dark:from-gray-100 dark:to-gray-200 rounded-full flex items-center justify-center transform transition-all duration-300 hover:scale-105 active:scale-95 shadow-[0_8px_32px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.3)] before:absolute before:inset-0 before:rounded-full before:bg-gradient-to-br before:from-white/80 before:to-transparent before:opacity-60 after:absolute after:inset-0 after:rounded-full after:bg-gradient-to-br after:from-transparent after:to-black/5 after:opacity-40 cursor-pointer",
  iconWrapper: "relative z-10",
  emailInfo: "space-y-1",
  emailText: "font-medium text-[10px] truncate",
  statusIndicator: "flex items-center justify-center gap-1",
} as const;

interface EmailAccountCollapsedProps {
  nodeData: any; // Using any for now to avoid type conflicts
  categoryStyles: { primary: string };
  onToggleExpand?: () => void;
}

export const EmailAccountCollapsed = memo(
  ({
    nodeData,
    categoryStyles,
    onToggleExpand,
  }: EmailAccountCollapsedProps) => {
    const { provider, email, connectionStatus } = nodeData;

    // Provider information with icons
    const providerInfo = useMemo(() => {
      const providers = {
        gmail: { name: "Gmail", icon: FcGoogle, color: "" },
        outlook: { name: "Outlook", icon: FaMicrosoft, color: "text-blue-600" },
        imap: { name: "IMAP", icon: MdEmail, color: "text-gray-600" },
        smtp: { name: "SMTP", icon: MdEmail, color: "text-gray-600" },
      };
      return providers[provider as keyof typeof providers];
    }, [provider]);

    // Compute status props for the reusable dot component
    const statusProps = useMemo(() => {
      const isConnected = connectionStatus === "connected";
      const isConnecting = connectionStatus === "connecting";
      const isError = connectionStatus === "error";
      const isDisconnected = connectionStatus === "disconnected";

      return {
        eventActive: isConnected,
        isProcessing: isConnecting,
        hasError: isError,
        // Disconnected maps to gray (neutral/off)
        // Glow enabled; component will not glow when gray
        enableGlow: true,
        size: "sm" as const,
        titleText: isError
          ? "error"
          : isConnecting
            ? "processing"
            : isConnected
              ? "active"
              : isDisconnected
                ? "neutral"
                : "neutral",
      };
    }, [connectionStatus]);

    // Display text
    const displayText = useMemo(() => {
      if (email) {
        return email.split("@")[0];
      }
      return providerInfo?.name || provider;
    }, [email, providerInfo, provider]);

    if (!providerInfo) {
      return null;
    }

    const IconComponent = providerInfo.icon;

    return (
      <div className={`${COLLAPSED_STYLES.container}`}>
        <div className={COLLAPSED_STYLES.content}>
          {/* Provider Icon */}
          <div className="flex justify-center">
            <div 
              className={COLLAPSED_STYLES.providerIcon}
              onClick={onToggleExpand}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onToggleExpand?.();
                }
              }}
            >
              <IconComponent
                className={`w-6 h-6 ${providerInfo.color} ${COLLAPSED_STYLES.iconWrapper}`}
              />
            </div>
          </div>

          {/* Email and Status */}
          <div className={COLLAPSED_STYLES.emailInfo}>
            <div
              className={`${COLLAPSED_STYLES.emailText} ${categoryStyles.primary}`}
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

EmailAccountCollapsed.displayName = "EmailAccountCollapsed";
