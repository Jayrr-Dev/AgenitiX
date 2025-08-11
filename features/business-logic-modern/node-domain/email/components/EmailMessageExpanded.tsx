"use client";
/**
 * Route: features/business-logic-modern/node-domain/email/components/EmailMessageExpanded.tsx
 * EMAIL MESSAGE – Expanded view UI for message composition and configuration
 *
 * • Message content editor with type selection (plain/html/markdown)
 * • Recipients management (to, cc, bcc)
 * • Subject line and priority settings
 * • Template configuration and variables
 * • Scheduling options (immediate, scheduled, delayed)
 * • Status panel with send history and errors
 *
 * Keywords: email-message, expanded, composition, recipients, scheduling
 */

import EnforceNumericInput from "@/components/EnforceNumericInput";
import RenderStatusDot from "@/components/RenderStatusDot";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import * as React from "react";
import { MdAdd, MdDelete } from "react-icons/md";
import type { EmailMessageData } from "../emailMessage.node";

// Align styling tokens with EmailReader
const EXPANDED_STYLES = {
  container: "p-4 w-full h-full flex flex-col",
  disabled:
    "opacity-75 bg-[--node-email-bg-hover] dark:bg-[--node-email-bg] rounded-md transition-all duration-300",
  content: "flex-1 space-y-1",
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
  smallButton:
    "h-5 w-5 rounded border border-[--node-email-border] bg-transparent text-[--node-email-text] text-[8px] hover:bg-[--node-email-bg-hover] disabled:cursor-not-allowed disabled:opacity-50 transition-all flex items-center justify-center",
  statusBox:
    "rounded-md border border-[--node-email-border] bg-[--node-email-bg] p-2 text-[10px] text-[--node-email-text-secondary]",
  recipientRow: "flex items-center gap-1",
  recipientGrid: "grid grid-cols-[auto_1fr_auto] gap-1 items-center",
} as const;

export interface EmailMessageExpandedProps {
  nodeData: EmailMessageData;
  isEnabled: boolean;
  connectionStatus: EmailMessageData["connectionStatus"];
  /** Whether the current configuration is valid for sending */
  canSend?: boolean;
  onMessageContentChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onMessageTypeChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onSubjectChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onPriorityChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onRecipientsChange: (type: "to" | "cc" | "bcc", recipients: string[]) => void;
  onUseTemplateChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onTemplateIdChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onScheduleTypeChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onScheduledTimeChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDelayMinutesChange: (numericText: string) => void;
  onComposeMessage: () => void;
}

export const EmailMessageExpanded = React.memo(
  function EmailMessageExpanded(props: EmailMessageExpandedProps) {
    const {
      nodeData,
      isEnabled,
      connectionStatus,
      canSend,
      onMessageContentChange,
      onMessageTypeChange,
      onSubjectChange,
      onPriorityChange,
      onRecipientsChange,
      onUseTemplateChange,
      onTemplateIdChange,
      onScheduleTypeChange,
      onScheduledTimeChange,
      onDelayMinutesChange,
      onComposeMessage,
    } = props;

    const {
      messageContent,
      messageType,
      subject,
      priority,
      recipients,
      useTemplate,
      templateId,
      scheduleType,
      scheduledTime,
      delayMinutes,
      sentCount,
      lastSent,
      lastError,
      retryCount,
    } = nodeData;

    const formattedLastSent = React.useMemo(() => {
      return lastSent ? new Date(lastSent).toLocaleString() : null;
    }, [lastSent]);

    // Recipient management
    const addRecipient = React.useCallback(
      (type: "to" | "cc" | "bcc") => {
        const current = (recipients && recipients[type]) || [];
        onRecipientsChange(type, [...current, ""]);
      },
      [recipients, onRecipientsChange]
    );

    const removeRecipient = React.useCallback(
      (type: "to" | "cc" | "bcc", index: number) => {
        const current = (recipients && recipients[type]) || [];
        const updated = current.filter((_, i) => i !== index);
        onRecipientsChange(type, updated);
      },
      [recipients, onRecipientsChange]
    );

    const updateRecipient = React.useCallback(
      (type: "to" | "cc" | "bcc", index: number, value: string) => {
        const current = (recipients && recipients[type]) || [];
        const updated = [...current];
        updated[index] = value;
        onRecipientsChange(type, updated);
      },
      [recipients, onRecipientsChange]
    );

    const renderRecipientSection = (
      type: "to" | "cc" | "bcc",
      label: string
    ) => {
      const recipientList = (recipients && recipients[type]) || [];

      return (
        <div key={type}>
          <div className="flex items-center justify-between mb-1">
            <label className={FIELD_STYLES.label}>{label}:</label>
            <button
              type="button"
              onClick={() => addRecipient(type)}
              className={FIELD_STYLES.smallButton}
              disabled={!isEnabled}
              title={`Add ${label.toLowerCase()}`}
            >
              <MdAdd className="w-3 h-3" />
            </button>
          </div>
          {recipientList.map((recipient, index) => (
            <div key={index} className={FIELD_STYLES.recipientRow}>
              <input
                type="email"
                value={recipient || ""}
                onChange={(e) => updateRecipient(type, index, e.target.value)}
                placeholder={`${label.toLowerCase()}@example.com`}
                className={`${FIELD_STYLES.input} flex-1`}
                disabled={!isEnabled}
              />
              <button
                type="button"
                onClick={() => removeRecipient(type, index)}
                className={FIELD_STYLES.smallButton}
                disabled={!isEnabled}
                title={`Remove ${label.toLowerCase()}`}
              >
                <MdDelete className="w-3 h-3" />
              </button>
            </div>
          ))}
          {recipientList.length === 0 && (
            <div className={FIELD_STYLES.helperText}>
              Click + to add {label.toLowerCase()} recipients
            </div>
          )}
        </div>
      );
    };

    return (
      <div
        className={`${EXPANDED_STYLES.container} ${isEnabled ? "" : EXPANDED_STYLES.disabled}`}
      >
        <div className={EXPANDED_STYLES.content}>
          {/* Subject */}
          <div>
            <label htmlFor="subject-input" className={FIELD_STYLES.label}>
              <span className="inline-flex items-center gap-1">
                Subject
                {/* Live connection status, basically visual indicator */}
              </span>
              <RenderStatusDot
                eventActive={connectionStatus === "sent"}
                isProcessing={
                  connectionStatus === "composing" ||
                  connectionStatus === "sending"
                }
                hasError={connectionStatus === "error"}
                enableGlow
                size="sm"
                titleText={connectionStatus}
              />
            </label>
            <input
              id="subject-input"
              type="text"
              value={subject || ""}
              onChange={onSubjectChange}
              placeholder="Email subject..."
              className={`${FIELD_STYLES.input} w-full`}
              disabled={!isEnabled || connectionStatus === "sending"}
            />
          </div>

          {/* Message Content */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="message-content" className={FIELD_STYLES.label}>
                Message Content:
              </label>
              <select
                value={messageType || "plain"}
                onChange={onMessageTypeChange}
                className={FIELD_STYLES.select}
                disabled={!isEnabled}
              >
                <option value="plain">Plain Text</option>
                <option value="html">HTML</option>
                <option value="markdown">Markdown</option>
              </select>
            </div>
            <textarea
              id="message-content"
              value={messageContent || ""}
              onChange={onMessageContentChange}
              placeholder="Enter your email message..."
              className={`${FIELD_STYLES.textarea} w-full h-20`}
              disabled={!isEnabled || connectionStatus === "sending"}
            />
          </div>

          {/* Recipients */}
          <div className="space-y-2">
            {renderRecipientSection("to", "To")}
            {renderRecipientSection("cc", "CC")}
            {renderRecipientSection("bcc", "BCC")}
          </div>

          {/* Priority */}
          <div>
            <label htmlFor="priority-select" className={FIELD_STYLES.label}>
              Priority:
            </label>
            <select
              id="priority-select"
              value={priority || "normal"}
              onChange={onPriorityChange}
              className={`${FIELD_STYLES.select} w-full`}
              disabled={!isEnabled}
            >
              <option value="low">Low</option>
              <option value="normal">Normal</option>
              <option value="high">High</option>
            </select>
          </div>

          {/* Template Configuration */}
          <div>
            <label className={FIELD_STYLES.checkboxLabel}>
              <input
                type="checkbox"
                checked={useTemplate || false}
                onChange={onUseTemplateChange}
                className="mr-2"
                disabled={!isEnabled}
              />
              Use Template
            </label>
            {useTemplate && (
              <input
                type="text"
                value={templateId || ""}
                onChange={onTemplateIdChange}
                placeholder="Template ID..."
                className={`${FIELD_STYLES.input} w-full mt-1`}
                disabled={!isEnabled}
              />
            )}
          </div>

          {/* Scheduling */}
          <div>
            <label htmlFor="schedule-type" className={FIELD_STYLES.label}>
              Send Schedule:
            </label>
            <select
              id="schedule-type"
              value={scheduleType || "immediate"}
              onChange={onScheduleTypeChange}
              className={`${FIELD_STYLES.select} w-full`}
              disabled={!isEnabled}
            >
              <option value="immediate">Send Immediately</option>
              <option value="scheduled">Schedule for Later</option>
              <option value="delayed">Delay by Minutes</option>
            </select>

            {scheduleType === "scheduled" && (
              <input
                type="datetime-local"
                value={scheduledTime || ""}
                onChange={onScheduledTimeChange}
                className={`${FIELD_STYLES.input} w-full mt-1`}
                disabled={!isEnabled}
              />
            )}

            {scheduleType === "delayed" && (
              <div className="mt-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <label
                      htmlFor="delay-input"
                      className={`${FIELD_STYLES.label} cursor-help`}
                    >
                      Delay (minutes):
                    </label>
                  </TooltipTrigger>
                  <TooltipContent
                    sideOffset={6}
                    className={FIELD_STYLES.helperText}
                  >
                    How many minutes to wait before sending, basically delay
                    time.
                  </TooltipContent>
                </Tooltip>
                <EnforceNumericInput
                  id="delay-input"
                  value={delayMinutes || 0}
                  onValueChange={onDelayMinutesChange}
                  className={`${FIELD_STYLES.input} w-full`}
                  disabled={!isEnabled}
                  placeholder="5"
                  aria-label="Delay Minutes"
                />
              </div>
            )}
          </div>

          {/* Actions */}
          <div>
            <button
              onClick={onComposeMessage}
              disabled={
                !isEnabled ||
                connectionStatus === "sending" ||
                canSend === false
              }
              className={FIELD_STYLES.button}
              type="button"
            >
              {connectionStatus === "sending"
                ? "Sending..."
                : connectionStatus === "composing"
                  ? "Composing..."
                  : "Send Message"}
            </button>
          </div>

          {/* Status Information */}
          <div className={FIELD_STYLES.statusBox}>
            <div>
              <span className="text-[--node-email-text]">Sent:</span>{" "}
              {sentCount || 0}
            </div>
            {formattedLastSent && <div>Last sent: {formattedLastSent}</div>}
            {lastError && (
              <div className="mt-1 text-red-600">Error: {lastError}</div>
            )}
            {(retryCount || 0) > 0 && (
              <div className="text-yellow-600">Retries: {retryCount || 0}</div>
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
      prev.connectionStatus !== next.connectionStatus ||
      prev.canSend !== next.canSend
    ) {
      return false;
    }

    // Compare nodeData fields that affect view
    const keys: (keyof EmailMessageData)[] = [
      "messageContent",
      "messageType",
      "subject",
      "priority",
      "recipients",
      "useTemplate",
      "templateId",
      "scheduleType",
      "scheduledTime",
      "delayMinutes",
      "sentCount",
      "lastSent",
      "lastError",
      "retryCount",
    ];
    for (const k of keys) {
      if ((prev.nodeData as any)[k] !== (next.nodeData as any)[k]) return false;
    }
    return true;
  }
);

export default EmailMessageExpanded;
