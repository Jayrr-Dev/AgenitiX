"use client";
/**
 * Route: features/business-logic-modern/node-domain/email/components/EmailSenderExpanded.tsx
 * EMAIL SENDER – Expanded view UI for configuration and actions
 *
 * • Presents account selector filtered by connected nodes
 * • Form controls for recipients, subject, and content
 * • File attachment handling with validation
 * • Send options and status information
 *
 * Keywords: email-sender, expanded, configuration, form-controls
 */

import RenderStatusDot from "@/components/RenderStatusDot";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import * as React from "react";
import type { EmailSenderData } from "../emailSender.node";

// Align styling tokens with EmailReader for consistency
const EXPANDED_STYLES = {
  container: "p-4 w-full h-full flex flex-col",
  disabled:
    "opacity-75 bg-[--node-email-bg-hover] dark:bg-[--node-email-bg] rounded-md transition-all duration-300",
  content:
    "flex-1 space-y-1 overflow-y-auto max-h-[400px] pr-2 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-transparent",
} as const;

const FIELD_STYLES = {
  label:
    "text-[--node-email-text] text-[10px] font-medium mb-1 block w-full flex items-center justify-between",
  input:
    "h-6 text-[10px] border border-[--node-email-border] bg-[--node-email-bg] text-[--node-email-text] rounded-md px-2 focus:ring-1 focus:ring-[--node-email-border-hover] focus:border-[--node-email-border-hover] disabled:opacity-50 disabled:cursor-not-allowed placeholder:text-[--node-email-text-secondary] placeholder:text-[10px] transition-all duration-200",
  textarea:
    "text-[10px] border border-[--node-email-border] bg-[--node-email-bg] text-[--node-email-text] rounded-md px-2 py-1 focus:ring-1 focus:ring-[--node-email-border-hover] focus:border-[--node-email-border-hover] disabled:opacity-50 disabled:cursor-not-allowed placeholder:text-[--node-email-text-secondary] placeholder:text-[10px] transition-all duration-200 resize-none",
  select:
    "h-6 text-[10px] border border-[--node-email-border] bg-[--node-email-bg] text-[--node-email-text] rounded-md px-2 focus:ring-1 focus:ring-[--node-email-border-hover] focus:border-[--node-email-border-hover] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200",
  checkboxLabel: "flex items-center gap-2 text-[10px] text-[--node-email-text]",
  helperText: "text-[10px] text-[--node-email-text-secondary]",
  button:
    "w-full h-6 rounded-md border border-[--node-email-border] bg-transparent text-[--node-email-text] text-[10px] font-medium hover:bg-[--node-email-bg-hover] disabled:cursor-not-allowed disabled:opacity-50 transition-all flex items-center justify-center",
  statusBox:
    "rounded-md border border-[--node-email-border] bg-[--node-email-bg] p-2 text-[10px] text-[--node-email-text-secondary]",
  attachmentItem:
    "flex items-center justify-between p-2 bg-[--node-email-bg-hover] rounded text-[10px]",
  fileInput: "hidden",
  fileButton:
    "inline-flex items-center gap-1 px-3 py-1 text-[10px] bg-blue-500 text-white rounded hover:bg-blue-600 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed",
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

type AttachmentType = {
  id: string;
  filename: string;
  size: number;
  mimeType: string;
  content?: string;
  file?: any;
};

export interface EmailSenderExpandedProps {
  nodeData: EmailSenderData;
  isEnabled: boolean;
  sendingStatus: EmailSenderData["sendingStatus"];
  availableAccounts: AvailableAccount[];
  selectedAccount?: AvailableAccount;
  accountErrors: string[];
  onAccountChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onSubjectChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRecipientsChange: (
    field: "to" | "cc" | "bcc"
  ) => (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onContentChange: (
    field: "text" | "html"
  ) => (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onCheckboxChange: (
    field: string
  ) => (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFileAttachment: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveAttachment: (attachmentId: string) => void;
  onNumberChange: (
    field: string,
    min: number,
    max: number
  ) => (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSendModeChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onSendEmail: () => void;
  onRefreshAccount?: () => void;
}

export const EmailSenderExpanded = React.memo(
  function EmailSenderExpanded(props: EmailSenderExpandedProps) {
    const {
      nodeData,
      isEnabled,
      sendingStatus,
      availableAccounts,
      selectedAccount,
      accountErrors,
      onAccountChange,
      onSubjectChange,
      onRecipientsChange,
      onContentChange,
      onCheckboxChange,
      onFileAttachment,
      onRemoveAttachment,
      onNumberChange,
      onSendModeChange,
      onSendEmail,
      onRefreshAccount,
    } = props;

    const {
      accountId,
      recipients,
      subject,
      content,
      attachments,
      maxAttachmentSize,
      sendMode,
      batchSize,
      delayBetweenSends,
      trackDelivery,
      trackReads,
      trackClicks,
      retryAttempts,
      continueOnError,
      sentCount,
      failedCount,
      lastError,
    } = nodeData;

    // Provide safe defaults for critical objects that might be undefined
    const safeRecipients = recipients || { to: [], cc: [], bcc: [] };
    const safeContent = content || {
      text: "",
      html: "",
      useHtml: false,
      useTemplate: false,
      templateId: "",
      variables: {},
    };
    const safeAttachments = (attachments || []) as AttachmentType[];

    // Memoize heavy/derived UI values to avoid recalculation during drags
    const accountOptions = React.useMemo(() => {
      return availableAccounts.map((account) => (
        <option
          key={account.value}
          value={account.value}
          disabled={!account.isActive}
        >
          {account.label}{" "}
          {account.isActive
            ? account.isConnected
              ? ""
              : "(connection error)"
            : "(inactive)"}
        </option>
      ));
    }, [availableAccounts]);

    return (
      <div
        className={`nowheel ${EXPANDED_STYLES.container} ${isEnabled ? "" : EXPANDED_STYLES.disabled}`}
      >
        <div className={EXPANDED_STYLES.content}>
          {/* Account Selection */}
          <div>
            <label
              htmlFor="email-account-select"
              className={FIELD_STYLES.label}
            >
              <span className="inline-flex items-center gap-1">
                Email Account
                {/* Live connection status, basically visual indicator */}
              </span>
              <RenderStatusDot
                eventActive={sendingStatus === "sent"}
                isProcessing={sendingStatus === "sending"}
                hasError={sendingStatus === "error"}
                enableGlow
                size="sm"
                titleText={sendingStatus}
              />
            </label>
            <select
              id="email-account-select"
              value={accountId ?? ""}
              onChange={onAccountChange}
              className={`${FIELD_STYLES.select} w-full ${accountErrors.length > 0 ? "border-red-500" : ""}`}
              disabled={!isEnabled || sendingStatus === "sending"}
            >
              <option value="">Select email account...</option>
              {accountOptions}
            </select>

            {/* Account Status Display */}
            {selectedAccount && (
              <div className="mt-1 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] ${selectedAccount.isConnected ? "text-green-600" : "text-red-600"}`}
                  >
                    ●{" "}
                    {selectedAccount.isConnected
                      ? "Connected"
                      : "Connection Issue"}
                  </span>
                  {selectedAccount.lastValidated && (
                    <span className={FIELD_STYLES.helperText}>
                      Last checked:{" "}
                      {new Date(
                        selectedAccount.lastValidated
                      ).toLocaleTimeString()}
                    </span>
                  )}
                </div>
                {onRefreshAccount && (
                  <button
                    onClick={onRefreshAccount}
                    className="text-[10px] text-blue-600 hover:text-blue-800 underline"
                    disabled={sendingStatus === "sending"}
                  >
                    Refresh
                  </button>
                )}
              </div>
            )}

            {/* Account Errors */}
            {(accountErrors?.length ?? 0) > 0 && (
              <div className="mt-1">
                {(accountErrors || []).map((error, index) => (
                  <div key={index} className="text-[10px] text-red-600">
                    ⚠ {error}
                  </div>
                ))}
              </div>
            )}

            {/* No Accounts Available */}
            {availableAccounts.length === 0 && (
              <div className="mt-1 text-[10px] text-yellow-600">
                ⚠ No email accounts configured. Please add an email account
                first.
              </div>
            )}
          </div>

          {/* Recipients */}
          <div>
            <label htmlFor="recipients-to" className={FIELD_STYLES.label}>
              To (comma-separated):
            </label>
            {/* dev test recipient buttons removed */}
            <textarea
              id="recipients-to"
              value={safeRecipients.to.join(", ")}
              onChange={onRecipientsChange("to")}
              placeholder="recipient1@example.com, recipient2@example.com"
              className={`${FIELD_STYLES.textarea} w-full h-12`}
              disabled={!isEnabled || sendingStatus === "sending"}
            />
          </div>

          {/* CC Recipients */}
          <div>
            <label htmlFor="recipients-cc" className={FIELD_STYLES.label}>
              CC (optional):
            </label>
            <textarea
              id="recipients-cc"
              value={safeRecipients.cc.join(", ")}
              onChange={onRecipientsChange("cc")}
              placeholder="cc@example.com"
              className={`${FIELD_STYLES.textarea} w-full h-8`}
              disabled={!isEnabled || sendingStatus === "sending"}
            />
          </div>

          {/* Subject */}
          <div>
            <label htmlFor="email-subject" className={FIELD_STYLES.label}>
              Subject:
            </label>
            <input
              id="email-subject"
              type="text"
              value={subject ?? ""}
              onChange={onSubjectChange}
              placeholder="Email subject..."
              className={`${FIELD_STYLES.input} w-full`}
              disabled={!isEnabled || sendingStatus === "sending"}
            />
          </div>

          {/* Message Content */}
          <div>
            <label htmlFor="message-content" className={FIELD_STYLES.label}>
              Message:
            </label>
            <textarea
              id="message-content"
              value={safeContent.text}
              onChange={onContentChange("text")}
              placeholder="Enter your message here..."
              className={`${FIELD_STYLES.textarea} w-full h-16`}
              disabled={!isEnabled || sendingStatus === "sending"}
            />
          </div>

          {/* Attachments */}
          <div>
            <label className={FIELD_STYLES.label}>Attachments:</label>

            {/* File Input */}
            <div className="mb-2">
              <input
                type="file"
                multiple={true}
                onChange={onFileAttachment}
                className={FIELD_STYLES.fileInput}
                id="file-input"
                disabled={!isEnabled || sendingStatus === "sending"}
                accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif,.zip,.rar"
              />
              <label htmlFor="file-input" className={FIELD_STYLES.fileButton}>
                Add Files
              </label>
              <span className={`${FIELD_STYLES.helperText} ml-2`}>
                Max: {Math.round(maxAttachmentSize / 1024 / 1024)}MB per file
              </span>
            </div>

            {/* Attachments List */}
            {safeAttachments.length > 0 && (
              <div className="space-y-1 max-h-16 overflow-y-auto">
                {safeAttachments.map((attachment) => (
                  <div
                    key={attachment.id}
                    className={FIELD_STYLES.attachmentItem}
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="text-blue-600">•</span>
                      <span className="truncate font-medium">
                        {attachment.filename}
                      </span>
                      <span
                        className={`${FIELD_STYLES.helperText} flex-shrink-0`}
                      >
                        ({Math.round(attachment.size / 1024)}KB)
                      </span>
                    </div>
                    <button
                      onClick={() => onRemoveAttachment(attachment.id)}
                      className="text-red-500 hover:text-red-700 ml-2 flex-shrink-0"
                      disabled={!isEnabled || sendingStatus === "sending"}
                      title="Remove attachment"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Attachments Summary */}
            {safeAttachments.length > 0 && (
              <div className={`${FIELD_STYLES.helperText} mt-1`}>
                {safeAttachments.length} file(s) • Total:{" "}
                {Math.round(
                  safeAttachments.reduce((sum, att) => sum + att.size, 0) / 1024
                )}
                KB
              </div>
            )}
          </div>

          {/* Send Mode */}
          <div>
            <label htmlFor="send-mode" className={FIELD_STYLES.label}>
              Send Mode:
            </label>
            <select
              id="send-mode"
              value={sendMode ?? "immediate"}
              onChange={onSendModeChange}
              className={`${FIELD_STYLES.select} w-full`}
              disabled={!isEnabled || sendingStatus === "sending"}
            >
              <option value="immediate">Immediate</option>
              <option value="batch">Batch</option>
              <option value="scheduled">Scheduled</option>
            </select>
          </div>

          {/* Batch Options */}
          {sendMode === "batch" && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <label
                      htmlFor="batch-size"
                      className={`${FIELD_STYLES.label} cursor-help`}
                    >
                      Batch Size:
                    </label>
                  </TooltipTrigger>
                  <TooltipContent
                    sideOffset={6}
                    className={FIELD_STYLES.helperText}
                  >
                    Number of emails to send in each batch, basically the chunk
                    size.
                  </TooltipContent>
                </Tooltip>
                <input
                  id="batch-size"
                  type="number"
                  value={batchSize ?? 10}
                  onChange={onNumberChange("batchSize", 1, 100)}
                  min="1"
                  max="100"
                  className={`${FIELD_STYLES.input} w-full`}
                  disabled={!isEnabled || sendingStatus === "sending"}
                />
              </div>
              <div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <label
                      htmlFor="delay-between-sends"
                      className={`${FIELD_STYLES.label} cursor-help`}
                    >
                      Delay (ms):
                    </label>
                  </TooltipTrigger>
                  <TooltipContent
                    sideOffset={6}
                    className={FIELD_STYLES.helperText}
                  >
                    Delay between batches in milliseconds, basically the wait
                    time.
                  </TooltipContent>
                </Tooltip>
                <input
                  id="delay-between-sends"
                  type="number"
                  value={delayBetweenSends ?? 0}
                  onChange={onNumberChange("delayBetweenSends", 0, 60000)}
                  min="0"
                  max="60000"
                  className={`${FIELD_STYLES.input} w-full`}
                  disabled={!isEnabled || sendingStatus === "sending"}
                />
              </div>
            </div>
          )}

          {/* Tracking Options */}
          <div className="flex flex-col gap-1">
            <label className={FIELD_STYLES.checkboxLabel}>
              <input
                type="checkbox"
                checked={!!trackDelivery}
                onChange={onCheckboxChange("trackDelivery")}
                className="mr-2"
                disabled={!isEnabled || sendingStatus === "sending"}
              />
              Track Delivery
            </label>
            <label className={FIELD_STYLES.checkboxLabel}>
              <input
                type="checkbox"
                checked={!!trackReads}
                onChange={onCheckboxChange("trackReads")}
                className="mr-2"
                disabled={!isEnabled || sendingStatus === "sending"}
              />
              Track Reads
            </label>
            <label className={FIELD_STYLES.checkboxLabel}>
              <input
                type="checkbox"
                checked={!!trackClicks}
                onChange={onCheckboxChange("trackClicks")}
                className="mr-2"
                disabled={!isEnabled || sendingStatus === "sending"}
              />
              Track Clicks
            </label>
            <label className={FIELD_STYLES.checkboxLabel}>
              <input
                type="checkbox"
                checked={!!continueOnError}
                onChange={onCheckboxChange("continueOnError")}
                className="mr-2"
                disabled={!isEnabled || sendingStatus === "sending"}
              />
              Continue on Error
            </label>
          </div>

          {/* Retry Settings */}
          <div>
            <Tooltip>
              <TooltipTrigger asChild>
                <label
                  htmlFor="retry-attempts"
                  className={`${FIELD_STYLES.label} cursor-help`}
                >
                  Retry Attempts:
                </label>
              </TooltipTrigger>
              <TooltipContent
                sideOffset={6}
                className={FIELD_STYLES.helperText}
              >
                Number of retry attempts on failure, basically the resilience
                setting.
              </TooltipContent>
            </Tooltip>
            <input
              id="retry-attempts"
              type="number"
              value={retryAttempts ?? 3}
              onChange={onNumberChange("retryAttempts", 0, 5)}
              min="0"
              max="5"
              className={`${FIELD_STYLES.input} w-full`}
              disabled={!isEnabled || sendingStatus === "sending"}
            />
          </div>

          {/* Send Button */}
          <div>
            <button
              onClick={onSendEmail}
              disabled={
                !isEnabled ||
                !accountId ||
                sendingStatus === "sending" ||
                safeRecipients.to.length === 0
              }
              className={FIELD_STYLES.button}
              type="button"
            >
              {sendingStatus === "sending" ? "Sending..." : "Send Email"}
            </button>
          </div>

          {/* Status Information */}
          <div className={FIELD_STYLES.statusBox}>
            <div>
              <span className="text-[--node-email-text]">Sent:</span>{" "}
              {sentCount}{" "}
              <span className="text-[--node-email-text]">| Failed:</span>{" "}
              {failedCount}
            </div>
            <div>
              Recipients:{" "}
              {safeRecipients.to.length +
                safeRecipients.cc.length +
                safeRecipients.bcc.length}
            </div>
            <div>
              Attachments: {safeAttachments.length}
              {safeAttachments.length > 0 && (
                <span className="ml-1">
                  (
                  {Math.round(
                    safeAttachments.reduce((sum, att) => sum + att.size, 0) /
                      1024
                  )}
                  KB)
                </span>
              )}
            </div>
            {lastError && (
              <div className="text-red-600 mt-1">Error: {lastError}</div>
            )}
          </div>
        </div>
      </div>
    );
  },
  (prev, next) => {
    // Compare primitive props
    if (
      prev.isEnabled !== next.isEnabled ||
      prev.sendingStatus !== next.sendingStatus
    ) {
      return false;
    }
    // Shallow compare available accounts by id + length
    const a = prev.availableAccounts;
    const b = next.availableAccounts;
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (a[i].value !== b[i].value || a[i].isConnected !== b[i].isConnected) {
        return false;
      }
    }
    // Compare frequently edited fields (recipients + content) and core fields
    const prevData: any = prev.nodeData as any;
    const nextData: any = next.nodeData as any;
    const recipientsChanged = ["to", "cc", "bcc"].some((field) => {
      const p = Array.isArray(prevData?.recipients?.[field])
        ? prevData.recipients[field].join(",")
        : "";
      const n = Array.isArray(nextData?.recipients?.[field])
        ? nextData.recipients[field].join(",")
        : "";
      return p !== n;
    });
    if (recipientsChanged) return false;
    if (
      (prevData?.content?.text || "") !== (nextData?.content?.text || "") ||
      (prevData?.content?.html || "") !== (nextData?.content?.html || "") ||
      Boolean(prevData?.content?.useHtml) !==
        Boolean(nextData?.content?.useHtml)
    ) {
      return false;
    }
    const keys: (keyof EmailSenderData)[] = [
      "accountId",
      "subject",
      "sentCount",
      "failedCount",
      "lastError",
      "sendMode",
      "batchSize",
      "delayBetweenSends",
      "trackDelivery",
      "trackReads",
      "trackClicks",
      "retryAttempts",
      "continueOnError",
    ];
    for (const k of keys) {
      if (prevData[k] !== nextData[k]) return false;
    }
    return true;
  }
);

export default EmailSenderExpanded;
