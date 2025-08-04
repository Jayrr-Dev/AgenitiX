/**
 * Route: features/business-logic-modern/node-domain/email/components/EmailAccountStatus.tsx
 * EMAIL ACCOUNT STATUS - Connection status and account information display
 *
 * • Connection status indicators with color coding
 * • Last validation timestamp display
 * • Error message display and handling
 * • Test connection functionality
 * • Account information summary
 *
 * Keywords: status-indicators, connection-status, error-display, account-info
 */

import { memo, useCallback } from "react";
import { useEmailAccountContext } from "./EmailAccountProvider";
// No import needed for types

// Status styling constants
const STATUS_STYLES = {
  container: "pt-4 border-t border-[--node-email-border]",
  header: "flex items-center justify-between mb-3",
  title: "text-[11px] font-medium text-[--node-email-text-secondary]",
  testButton:
    "text-[11px] text-[--node-email-border] hover:text-[--node-email-border-hover] transition-colors",
  statusBox: "bg-[--node-email-bg-hover] rounded-lg p-3 space-y-2",
  statusRow: "flex items-center justify-between text-[11px]",
  label: "text-[--node-email-text-secondary]",
  value: "text-[--node-email-text]",
  error: "text-[--core-palette-semantic-error] text-[11px] font-medium",
  statusIndicator: {
    base: "inline-flex items-center gap-1 text-[10px] font-medium",
    connected: "text-[--core-palette-semantic-success]",
    error: "text-[--core-palette-semantic-error]",
    connecting: "text-[--core-palette-semantic-warning]",
    disconnected: "text-[--node-email-text-secondary]",
  },
} as const;

interface EmailAccountStatusProps {
  nodeData: any; // Using any for now to avoid type conflicts
  isEnabled: boolean;
}

export const EmailAccountStatus = memo(
  ({ nodeData, isEnabled }: EmailAccountStatusProps) => {
    const { connectionStatus, handleTestConnection } = useEmailAccountContext();

    const { isConfigured, lastValidated, lastError, accountId } = nodeData;

    /** Handle test connection click */
    const handleTestClick = useCallback(() => {
      if (accountId && typeof accountId === "string") {
        handleTestConnection(accountId);
      }
    }, [accountId, handleTestConnection]);

    // Don't render if not configured
    if (!isConfigured) {
      return null;
    }

    return (
      <div className={STATUS_STYLES.container}>
        <div className={STATUS_STYLES.header}>
          <span className={STATUS_STYLES.title}>Account Status</span>
          <button
            onClick={handleTestClick}
            disabled={!isEnabled || connectionStatus === "connecting"}
            className={STATUS_STYLES.testButton}
            type="button"
          >
            {connectionStatus === "connecting" ? "Testing..." : "Test"}
          </button>
        </div>

        {(lastValidated || lastError) && (
          <div className={STATUS_STYLES.statusBox}>
            {lastValidated && (
              <div className={STATUS_STYLES.statusRow}>
                <span className={STATUS_STYLES.label}>Last verified</span>
                <span className={STATUS_STYLES.value}>
                  {new Date(lastValidated).toLocaleTimeString()}
                </span>
              </div>
            )}
            {lastError && (
              <div className={STATUS_STYLES.error}>{lastError}</div>
            )}
          </div>
        )}
      </div>
    );
  }
);

EmailAccountStatus.displayName = "EmailAccountStatus";
