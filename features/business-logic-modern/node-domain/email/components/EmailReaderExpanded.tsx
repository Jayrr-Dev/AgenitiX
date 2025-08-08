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

// Align styling tokens with EmailAccountExpanded
const EXPANDED_STYLES = {
  container: "p-4 w-full h-full flex flex-col",
  disabled:
    "opacity-75 bg-[--node-email-bg-hover] dark:bg-[--node-email-bg] rounded-md transition-all duration-300",
  content: "flex-1 space-y-2 max-h-[400px] overflow-y-auto",
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
          <div className="flex justify-between flex-row w-full ">
            <label htmlFor="email-account-select" className="block text-gray-600 text-xs">
              Email Account
            </label>
            <div className={`text-xs ${connectionStatus === "connected" ? "text-green-600" : connectionStatus === "error" ? "text-red-600" : "text-gray-600"}`}>
              {connectionStatus}
            </div>
          </div>
          <select
            id="email-account-select"
            value={accountId}
            onChange={onAccountChange}
            className="w-full rounded border border-gray-300 p-2 text-xs"
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
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Tooltip>
              <TooltipTrigger asChild>
                <label htmlFor="batch-size-input" className="mb-1 block text-gray-600 text-xs cursor-help">
                  Batch Size:
                </label>
              </TooltipTrigger>
              <TooltipContent sideOffset={6}>
                Number of emails to get at once, basically the chunk size.
              </TooltipContent>
            </Tooltip>
            <EnforceNumericInput
              id="batch-size-input"
              value={batchSize}
              onValueChange={onBatchSizeChange}
              className="w-full rounded border border-gray-300 p-2 text-xs"
              disabled={!isEnabled || connectionStatus === "reading"}
              placeholder="10"
              aria-label="Batch Size"
            />
          </div>
          <div>
            <Tooltip>
              <TooltipTrigger asChild>
                <label htmlFor="max-messages-input" className="mb-1 block text-gray-600 text-xs cursor-help">
                  Max Messages:
                </label>
              </TooltipTrigger>
              <TooltipContent sideOffset={6}>
                The total cap for this run, basically stop at this number.
              </TooltipContent>
            </Tooltip>
            <EnforceNumericInput
              id="max-messages-input"
              value={maxMessages}
              onValueChange={onMaxMessagesChange}
              className="w-full rounded border border-gray-300 p-2 text-xs"
              disabled={!isEnabled || connectionStatus === "reading"}
              placeholder="50"
              aria-label="Max Messages"
            />
          </div>
        </div>

        {/* Options */}
        <div className="flex flex-col gap-2">
          <label className="flex items-center text-xs">
            <input
              type="checkbox"
              checked={includeAttachments}
              onChange={onIncludeAttachmentsChange}
              className="mr-2"
              disabled={!isEnabled}
            />
            Include Attachments
          </label>
          <label className="flex items-center text-xs">
            <input
              type="checkbox"
              checked={markAsRead}
              onChange={onMarkAsReadChange}
              className="mr-2"
              disabled={!isEnabled}
            />
            Mark as Read
          </label>
          <label className="flex items-center text-xs">
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
            <label htmlFor="check-interval-input" className="mb-1 block text-gray-600 text-xs">
              Check Interval (minutes):
            </label>
            <EnforceNumericInput
              id="check-interval-input"
              value={checkInterval}
              onValueChange={onCheckIntervalChange}
              className="w-full rounded border border-gray-300 p-2 text-xs"
              disabled={!isEnabled}
              placeholder="5"
              aria-label="Check Interval"
            />
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={onReadMessages}
            disabled={!(isEnabled && accountId) || connectionStatus === "reading"}
            className="flex-1 rounded bg-blue-500 p-2 text-white text-xs hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
            type="button"
          >
            {connectionStatus === "reading" ? "Reading..." : "Read Messages"}
          </button>
        </div>

        {/* Status Information */}
        <div className="rounded bg-gray-50 p-2 text-gray-500 text-xs">
          <div>
            Messages: {messageCount} | Processed: {processedCount}
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


