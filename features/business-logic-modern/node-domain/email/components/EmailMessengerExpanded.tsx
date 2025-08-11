"use client";
/**
 * Route: features/business-logic-modern/node-domain/email/components/EmailMessengerExpanded.tsx
 * EMAIL MESSENGER – Expanded view UI (mirrors EmailReader styling)
 *
 * • Presents subject, recipients, content inputs with consistent tokens
 * • Emits JSON message for downstream `emailSender`
 * • Uses compact 10px typography, borders, and hover states
 *
 * Keywords: email-messenger, expanded, configuration, json-output
 */

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import * as React from "react";
import type { EmailMessengerData } from "../emailMessenger.node";

// Align styling tokens with EmailReader for consistency
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
  button:
    "w-full h-6 rounded-md border border-[--node-email-border] bg-transparent text-[--node-email-text] text-[10px] font-medium hover:bg-[--node-email-bg-hover] disabled:cursor-not-allowed disabled:opacity-50 transition-all flex items-center justify-center",
  helperText: "text-[10px] text-[--node-email-text-secondary]",
} as const;

export interface EmailMessengerExpandedProps {
  nodeData: EmailMessengerData;
  isEnabled: boolean;
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
  onEmitMessage: () => void;
}

export const EmailMessengerExpanded = React.memo(function EmailMessengerExpanded(
  props: EmailMessengerExpandedProps
) {
  const {
    nodeData,
    isEnabled,
    onSubjectChange,
    onRecipientsChange,
    onContentChange,
    onCheckboxChange,
    onEmitMessage,
  } = props;

  const { recipients, subject, content } = nodeData;
  const safeRecipients = recipients || { to: [], cc: [], bcc: [] };
  const safeContent = content || { text: "", html: "", useHtml: false };

  const canEmit = React.useMemo(() => {
    const hasTo = safeRecipients.to.length > 0;
    const hasContent = Boolean(safeContent.text.trim() || safeContent.html.trim());
    return isEnabled && Boolean(subject.trim()) && hasTo && hasContent;
  }, [isEnabled, subject, safeRecipients, safeContent]);

  return (
    <div
      className={`${EXPANDED_STYLES.container} ${
        isEnabled ? "" : EXPANDED_STYLES.disabled
      }`}
    >
      <div className={EXPANDED_STYLES.content}>
        {/* Recipients */}
        <div>
          <label htmlFor="recipients-to" className={FIELD_STYLES.label}>
            To (comma-separated):
          </label>
          <textarea
            id="recipients-to"
            value={safeRecipients.to.join(", ")}
            onChange={onRecipientsChange("to")}
            placeholder="recipient1@example.com, recipient2@example.com"
            className={`${FIELD_STYLES.textarea} w-full h-12`}
            disabled={!isEnabled}
          />
        </div>

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
            disabled={!isEnabled}
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
            value={subject}
            onChange={onSubjectChange}
            placeholder="Email subject..."
            className={`${FIELD_STYLES.input} w-full`}
            disabled={!isEnabled}
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
            disabled={!isEnabled}
          />
        </div>

        {/* HTML Content (optional) */}
        <div>
          <label className={FIELD_STYLES.label}>HTML (optional):</label>
          <textarea
            value={safeContent.html}
            onChange={onContentChange("html")}
            placeholder="<p>HTML content</p>"
            className={`${FIELD_STYLES.textarea} w-full h-16`}
            disabled={!isEnabled}
          />
          <label className="flex items-center gap-2 text-[10px] text-[--node-email-text] mt-1">
            <input
              type="checkbox"
              checked={safeContent.useHtml}
              onChange={onCheckboxChange("useHtml")}
              className="mr-2"
              disabled={!isEnabled}
            />
            Use HTML
          </label>
          <div className={FIELD_STYLES.helperText}>
            If enabled, HTML will be preferred when sending, basically prefer HTML over plain text.
          </div>
        </div>

        {/* Actions */}
        <div>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onEmitMessage}
                disabled={!canEmit}
                className={FIELD_STYLES.button}
                type="button"
              >
                Emit Message JSON
              </button>
            </TooltipTrigger>
            <TooltipContent sideOffset={6} className={FIELD_STYLES.helperText}>
              Sends the composed email as JSON to the right handle, basically outputs the message.
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </div>
  );
});

export default EmailMessengerExpanded;


