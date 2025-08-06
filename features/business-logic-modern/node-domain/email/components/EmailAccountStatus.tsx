/**
 * Route: features/business-logic-modern/node-domain/email/components/EmailAccountStatus.tsx
 * EMAIL ACCOUNT STATUS - Enhanced connection status and account information display
 *
 * • Animated connection status indicators with color coding
 * • Real-time status updates and visual feedback
 * • Last validation timestamp display
 * • Error message display and handling
 * • Test connection functionality with loading states
 * • Account information summary with provider details
 *
 * Keywords: status-indicators, connection-status, error-display, account-info, real-time-updates
 */

import { memo, useCallback } from "react";
import { FaCheckCircle, FaExclamationTriangle, FaSpinner, FaTimesCircle } from "react-icons/fa";
import { useEmailAccountContext } from "./EmailAccountProvider";

// Status styling constants
const STATUS_STYLES = {
  container: "pt-3 border-t border-[--node-email-border]",
  header: "flex items-center justify-between mb-2",
  title: "text-[10px] font-medium text-[--node-email-text-secondary]",
  testButton:
    "text-[10px] text-[--node-email-border] hover:text-[--node-email-border-hover] transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
  statusBox: "bg-[--node-email-bg-hover] rounded-md p-2 space-y-2",
  statusRow: "flex items-center justify-between text-[10px]",
  label: "text-[--node-email-text-secondary]",
  value: "text-[--node-email-text]",
  error: "text-[--core-palette-semantic-error] text-[10px] font-medium",
  connectionStatus: "flex items-center gap-1.5 text-[10px] font-medium",
  statusIndicator: {
    base: "inline-flex items-center gap-1 text-[10px] font-medium",
    connected: "text-[--core-palette-semantic-success]",
    error: "text-[--core-palette-semantic-error]",
    connecting: "text-[--core-palette-semantic-warning]",
    disconnected: "text-[--node-email-text-secondary]",
  },
  providerInfo: "flex items-center justify-between text-[10px] text-[--node-email-text-secondary]",
} as const;

interface EmailAccountStatusProps {
  nodeData: any; // Using any for now to avoid type conflicts
  isEnabled: boolean;
}

export const EmailAccountStatus = memo(
  ({ nodeData, isEnabled }: EmailAccountStatusProps) => {
    const { connectionStatus, handleTestConnection } = useEmailAccountContext();

    const { 
      isConfigured, 
      lastValidated, 
      lastError, 
      accountId, 
      provider, 
      email, 
      displayName,
      isConnected 
    } = nodeData;

    /** Handle test connection click */
    const handleTestClick = useCallback(() => {
      if (accountId && typeof accountId === "string") {
        handleTestConnection(accountId);
      }
    }, [accountId, handleTestConnection]);

    /** Get status icon and text based on connection status */
    const getStatusDisplay = useCallback(() => {
      switch (connectionStatus) {
        case "connected":
          return {
            icon: <FaCheckCircle className="w-3 h-3" />,
            text: "Connected",
            className: STATUS_STYLES.statusIndicator.connected,
          };
        case "connecting":
          return {
            icon: <FaSpinner className="w-3 h-3 animate-spin" />,
            text: "Connecting...",
            className: STATUS_STYLES.statusIndicator.connecting,
          };
        case "error":
          return {
            icon: <FaTimesCircle className="w-3 h-3" />,
            text: "Error",
            className: STATUS_STYLES.statusIndicator.error,
          };
        default:
          return {
            icon: <FaExclamationTriangle className="w-3 h-3" />,
            text: "Disconnected",
            className: STATUS_STYLES.statusIndicator.disconnected,
          };
      }
    }, [connectionStatus]);

    /** Format last validated time */
    const formatLastValidated = useCallback((timestamp: number) => {
      const date = new Date(timestamp);
      const now = new Date();
      const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
      
      if (diffMinutes < 1) return "Just now";
      if (diffMinutes < 60) return `${diffMinutes}m ago`;
      if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
      return date.toLocaleDateString();
    }, []);

    /** Get provider display name */
    const getProviderName = useCallback((provider: string) => {
      const names = {
        gmail: "Gmail",
        outlook: "Outlook",
        yahoo: "Yahoo",
        imap: "IMAP",
        smtp: "SMTP",
      };
      return names[provider as keyof typeof names] || provider;
    }, []);

    // Don't render if not configured
    if (!isConfigured) {
      return null;
    }

    const statusDisplay = getStatusDisplay();

    return (
      <div className={STATUS_STYLES.container}>
        <div className={STATUS_STYLES.header}>
          <span className={STATUS_STYLES.title}>Status</span>
          {accountId && (
            <button
              onClick={handleTestClick}
              disabled={!isEnabled || connectionStatus === "connecting"}
              className={STATUS_STYLES.testButton}
              type="button"
            >
              {connectionStatus === "connecting" ? "Testing..." : "Test"}
            </button>
          )}
        </div>

        <div className={STATUS_STYLES.statusBox}>
          {/* Connection Status */}
          <div className={STATUS_STYLES.statusRow}>
            <span className={STATUS_STYLES.label}>Connection</span>
            <div className={`${STATUS_STYLES.connectionStatus} ${statusDisplay.className}`}>
              {statusDisplay.icon}
              <span>{statusDisplay.text}</span>
            </div>
          </div>

          {/* Provider Information */}
          <div className={STATUS_STYLES.providerInfo}>
            <span>{getProviderName(provider)}</span>
            <span className="truncate max-w-[120px]" title={email || displayName}>
              {displayName || email}
            </span>
          </div>

          {/* Last Validated */}
          {lastValidated && isConnected && (
            <div className={STATUS_STYLES.statusRow}>
              <span className={STATUS_STYLES.label}>Verified</span>
              <span className={STATUS_STYLES.value}>
                {formatLastValidated(lastValidated)}
              </span>
            </div>
          )}

          {/* Error Display */}
          {lastError && (
            <div className={STATUS_STYLES.error}>
              <FaExclamationTriangle className="w-3 h-3 inline mr-1" />
              {lastError}
            </div>
          )}
        </div>
      </div>
    );
  }
);

EmailAccountStatus.displayName = "EmailAccountStatus";
