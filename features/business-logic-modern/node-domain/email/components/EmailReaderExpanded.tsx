"use client";
/**
 * Route: features/business-logic-modern/node-domain/email/components/EmailReaderExpanded.tsx
 * EMAIL READER – Expanded view UI for configuration and actions
 *
 * • Presents account selector filtered by connected nodes
 * • Numeric-only controls for batch size and max messages
 * • Toggle options and action button to read messages
 * • Status panel with counts, last sync, errors
 *
 * Keywords: email-reader, expanded, configuration, numeric-input
 */

import * as React from "react";
import EnforceNumericInput from "@/components/EnforceNumericInput";
import type { EmailReaderData } from "../emailReader.node";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import RenderStatusDot from "@/components/RenderStatusDot";

// Align styling tokens with EmailAccountExpanded and EmailAccountForm
const EXPANDED_STYLES = {
  container: "p-4 w-full h-full flex flex-col",
  disabled:
    "opacity-75 bg-[--node-email-bg-hover] dark:bg-[--node-email-bg] rounded-md transition-all duration-300",
  content: "flex-1 space-y-1",
} as const;

const FIELD_STYLES = {
  label: "text-[--node-email-text] text-[10px] font-medium mb-1 block",
  input:
    "h-6 text-[10px] border border-[--node-email-border] bg-[--node-email-bg] text-[--node-email-text] rounded-md px-2 focus:ring-1 focus:ring-[--node-email-border-hover] focus:border-[--node-email-border-hover] disabled:opacity-50 disabled:cursor-not-allowed placeholder:text-[--node-email-text-secondary] placeholder:text-[10px] transition-all duration-200",
  select:
    "h-6 text-[10px] border border-[--node-email-border] bg-[--node-email-bg] text-[--node-email-text] rounded-md px-2 focus:ring-1 focus:ring-[--node-email-border-hover] focus:border-[--node-email-border-hover] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200",
  checkboxLabel: "flex items-center gap-2 text-[10px] text-[--node-email-text]",
  helperText: "text-[10px] text-[--node-email-text-secondary]",
  button:
    "w-full h-6 rounded-md border border-[--node-email-border] bg-transparent text-[--node-email-text] text-[10px] font-medium hover:bg-[--node-email-bg-hover] disabled:cursor-not-allowed disabled:opacity-50 transition-all flex items-center justify-center",
  statusBox:
    "rounded-md border border-[--node-email-border] bg-[--node-email-bg] p-2 text-[10px] text-[--node-email-text-secondary]",
} as const;

type AvailableAccount = {
  value: string;
  label: string;
  provider: string;
  email: string;
  isActive: boolean;
  isConnected: boolean;
  lastValidated?: number;
};

export interface EmailReaderExpandedProps {
  nodeData: EmailReaderData;
  isEnabled: boolean;
  connectionStatus: EmailReaderData["connectionStatus"];
  availableAccounts: AvailableAccount[];
  onAccountChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onBatchSizeChange: (numericText: string) => void;
  onMaxMessagesChange: (numericText: string) => void;
  onIncludeAttachmentsChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onMarkAsReadChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onEnableRealTimeChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onCheckIntervalChange: (numericText: string) => void;
  onReadMessages: () => void;
}

export function EmailReaderExpanded(props: EmailReaderExpandedProps) {
  const {
    nodeData,
    isEnabled,
    connectionStatus,
    availableAccounts,
    onAccountChange,
    onBatchSizeChange,
    onMaxMessagesChange,
    onIncludeAttachmentsChange,
    onMarkAsReadChange,
    onEnableRealTimeChange,
    onCheckIntervalChange,
    onReadMessages,
  } = props;

  const {
    accountId,
    batchSize,
    maxMessages,
    includeAttachments,
    markAsRead,
    enableRealTime,
    checkInterval,
    processedCount,
    messageCount,
    lastSync,
    lastError,
    retryCount,
  } = nodeData;

  return (
    <div className={`${EXPANDED_STYLES.container} ${isEnabled ? "" : EXPANDED_STYLES.disabled}`}>
      <div className={EXPANDED_STYLES.content}>
        {/* Account Selection */}
        <div>
          <label htmlFor="email-account-select" className={FIELD_STYLES.label}>
            <span className="inline-flex items-center gap-1">
              Email Account
              {/* Live connection status, basically visual indicator */}
              <RenderStatusDot
                eventActive={connectionStatus === "connected"}
                isProcessing={connectionStatus === "connecting" || connectionStatus === "reading"}
                hasError={connectionStatus === "error"}
                enableGlow
                size="sm"
                titleText={connectionStatus}
              />
            </span>
          </label>
          <select
            id="email-account-select"
            value={accountId}
            onChange={onAccountChange}
            className={`${FIELD_STYLES.select} w-full`}
            disabled={!isEnabled || connectionStatus === "reading"}
          >
            <option value="">Select email account...</option>
            {availableAccounts.map((account) => (
              <option key={account.value} value={account.value} disabled={!account.isActive}>
                {account.label} {account.isActive ? "" : "(inactive)"}
              </option>
            ))}
          </select>
        </div>

        {/* Processing Options */}
        <div className="grid grid-cols-2 gap-1">
          <div>
            <Tooltip>
              <TooltipTrigger asChild>
                <label htmlFor="batch-size-input" className={`${FIELD_STYLES.label} cursor-help`}>
                  Batch Size:
                </label>
              </TooltipTrigger>
              <TooltipContent sideOffset={6} className={FIELD_STYLES.helperText}>
                Number of emails to get at once, basically the chunk size.
              </TooltipContent>
            </Tooltip>
            <EnforceNumericInput
              id="batch-size-input"
              value={batchSize}
              onValueChange={onBatchSizeChange}
              className={`${FIELD_STYLES.input} w-full`}
              disabled={!isEnabled || connectionStatus === "reading"}
              placeholder="10"
              aria-label="Batch Size"
            />
          </div>
          <div>
            <Tooltip>
              <TooltipTrigger asChild>
                <label htmlFor="max-messages-input" className={`${FIELD_STYLES.label} cursor-help`}>
                  Max Messages:
                </label>
              </TooltipTrigger>
              <TooltipContent sideOffset={6} className={FIELD_STYLES.helperText}>
                The total message cap for this run to stop at, basically the stop limit.
              </TooltipContent>
            </Tooltip>
            <EnforceNumericInput
              id="max-messages-input"
              value={maxMessages}
              onValueChange={onMaxMessagesChange}
              className={`${FIELD_STYLES.input} w-full`}
              disabled={!isEnabled || connectionStatus === "reading"}
              placeholder="50"
              aria-label="Max Messages"
            />
          </div>
        </div>

        {/* Options */}
        <div className="flex flex-col gap-1">
          <label className={FIELD_STYLES.checkboxLabel}>
            <input
              type="checkbox"
              checked={includeAttachments}
              onChange={onIncludeAttachmentsChange}
              className="mr-2"
              disabled={!isEnabled}
            />
            Include Attachments
          </label>
          <label className={FIELD_STYLES.checkboxLabel}>
            <input
              type="checkbox"
              checked={markAsRead}
              onChange={onMarkAsReadChange}
              className="mr-2"
              disabled={!isEnabled}
            />
            Mark as Read
          </label>
          <label className={FIELD_STYLES.checkboxLabel}>
            <input
              type="checkbox"
              checked={enableRealTime}
              onChange={onEnableRealTimeChange}
              className="mr-2"
              disabled={!isEnabled}
            />
            Real-time Monitoring
          </label>
        </div>

        {/* Real-time Interval */}
        {enableRealTime && (
          <div>
            <label htmlFor="check-interval-input" className={FIELD_STYLES.label}>
              Check Interval (minutes):
            </label>
            <EnforceNumericInput
              id="check-interval-input"
              value={checkInterval}
              onValueChange={onCheckIntervalChange}
              className={`${FIELD_STYLES.input} w-full`}
              disabled={!isEnabled}
              placeholder="5"
              aria-label="Check Interval"
            />
          </div>
        )}

        {/* Actions */}
        <div>
          <button
            onClick={onReadMessages}
            disabled={!(isEnabled && accountId) || connectionStatus === "reading"}
            className={FIELD_STYLES.button}
            type="button"
          >
            {connectionStatus === "reading" ? "Reading..." : "Read Messages"}
          </button>
        </div>

        {/* Status Information */}
        <div className={FIELD_STYLES.statusBox}>
          <div>
            <span className="text-[--node-email-text]">Messages:</span> {messageCount} {" "}
            <span className="text-[--node-email-text]">| Processed:</span> {processedCount}
          </div>
          {lastSync && <div>Last sync: {new Date(lastSync).toLocaleString()}</div>}
          {lastError && <div className="mt-1 text-red-600">Error: {lastError}</div>}
          {retryCount > 0 && <div className="text-yellow-600">Retries: {retryCount}</div>}
        </div>
      </div>
    </div>
  );
}

export default EmailReaderExpanded;


