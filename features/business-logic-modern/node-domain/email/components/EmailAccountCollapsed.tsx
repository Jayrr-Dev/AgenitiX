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

import RenderStatusDot from "@/components/RenderStatusDot";
import { memo, useCallback, useMemo } from "react";
import { FaMicrosoft } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import { MdEmail } from "react-icons/md";
import { useEmailAccountContext } from "./EmailAccountProvider";
import { SkueButton } from "@/components/ui/skue-button";
// Local, minimal types to avoid cross-file circular deps while staying type-safe
type EmailProviderType = "gmail" | "outlook" | "imap" | "smtp";
type ConnectionStatus = "disconnected" | "connecting" | "connected" | "error";

// Collapsed view styling constants
const COLLAPSED_STYLES = {
  container: "flex items-center justify-center w-full h-full",
  content: "p-3 text-center space-y-3 mt-4",
  providerIcon:
    "relative w-12 h-12 bg-gradient-to-br from-white to-gray-50 dark:from-gray-100 dark:to-gray-400 inner-shadow  rounded-full flex items-center justify-center transform transition-all duration-300 hover:scale-105 active:scale-95 shadow-[0_8px_32px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.3)] before:absolute before:inset-0 before:rounded-full before:bg-gradient-to-br before:from-white/80 before:to-transparent before:opacity-60 after:absolute after:inset-0 after:rounded-full after:bg-gradient-to-br after:from-transparent after:to-black/5 after:opacity-40 cursor-pointer",
  iconWrapper: "relative z-10",
  emailInfo: "space-y-1",
  emailText: "font-medium text-[10px] truncate",
  statusIndicator: "flex items-center justify-center gap-1",
} as const;

interface EmailAccountCollapsedProps {
  nodeData: {
    provider?: EmailProviderType;
    email?: string;
    connectionStatus?: ConnectionStatus;
    isAuthenticating?: boolean;
  };
  categoryStyles: { primary: string };
  onToggleExpand?: () => void;
}

export const EmailAccountCollapsed = memo(
  ({
    nodeData,
    categoryStyles,
    onToggleExpand,
  }: EmailAccountCollapsedProps) => {
    const { provider, email, connectionStatus, isAuthenticating } = nodeData;
    const { handleOAuth2Auth } = useEmailAccountContext();

    // Provider information with icons
    const providerInfo = useMemo(() => {
      const providers = {
        gmail: { name: "Gmail", icon: FcGoogle, color: "" },
        outlook: { name: "Outlook", icon: FaMicrosoft, color: "text-blue-600" },
        imap: { name: "IMAP", icon: MdEmail, color: "text-gray-600" },
        smtp: { name: "SMTP", icon: MdEmail, color: "text-gray-600" },
      };
      // Fallback to gmail when provider is missing, basically default to Gmail icon/button
      const key = (provider ??
        "gmail") as EmailProviderType as keyof typeof providers;
      return providers[key];
    }, [provider]);

    // Compute status props for the reusable dot component
    const statusProps = useMemo(() => {
      const isConnected = connectionStatus === "connected";
      const isConnecting = connectionStatus === "connecting";
      const isError = connectionStatus === "error";
      const isDisconnected = connectionStatus === "disconnected";

      return {
        eventActive: isConnected,
        isProcessing: isConnecting || isAuthenticating,
        hasError: isError,
        // Disconnected maps to gray (neutral/off)
        // Glow enabled; component will not glow when gray
        enableGlow: true,
        size: "sm" as const,
        titleText: isError
          ? "error"
          : (isConnecting || isAuthenticating)
            ? "processing"
            : isConnected
              ? "active"
              : isDisconnected
                ? "neutral"
                : "neutral",
      };
    }, [connectionStatus, isAuthenticating]);

    // Determine if button should be in processing state
    // [Explanation], basically show pressed state during OAuth popup and connection process
    const isProcessing = isAuthenticating || connectionStatus === "connecting";

    // Display text
    const displayText = useMemo(() => {
      if (email) {
        return email.split("@")[0];
      }
      return providerInfo?.name || (provider ?? "gmail");
    }, [email, providerInfo, provider]);

    // Ensure we always have an icon, basically never render null for missing provider
    if (!providerInfo) return null;

    const IconComponent = providerInfo.icon;

    // Primary action for collapsed big icon, basically OAuth for oauth2 providers or expand for manual
    const onPrimaryAction = useCallback(() => {
      const key = (provider ?? "gmail") as EmailProviderType; // [Explanation], basically default provider for click
      if (key === "gmail" || key === "outlook") {
        handleOAuth2Auth(key);
        return;
      }
      onToggleExpand?.();
    }, [handleOAuth2Auth, onToggleExpand, provider]);

    return (
      <div className={`${COLLAPSED_STYLES.container}`}>
        <div className={COLLAPSED_STYLES.content}>
          {/* Provider Icon */}
          <div className="flex justify-center">
            <SkueButton
              checked={false}
              processing={isProcessing}
              onClick={onPrimaryAction}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onPrimaryAction();
                }
              }}
            >
              <IconComponent
                className={`w-6 h-6 ${providerInfo.color} ${COLLAPSED_STYLES.iconWrapper}`}
              />
            </SkueButton>
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

// Extra memo comparator to ensure this UI doesn't re-render during drag unless key props change
export default memo(EmailAccountCollapsed, (prev, next) => {
  const p = prev.nodeData;
  const n = next.nodeData;
  return (
    p.provider === n.provider &&
    p.email === n.email &&
    p.connectionStatus === n.connectionStatus &&
    prev.categoryStyles.primary === next.categoryStyles.primary
  );
});
