"use client";
/**
 * Route: features/business-logic-modern/node-domain/email/components/EmailSenderExpanded.tsx
 * EMAIL SENDER – Minimalist expanded view using reusable EmailSender
 *
 * • Clean, focused interface for email sending configuration
 * • Integrates with new EmailSender component
 * • Simplified prop handling and state management
 * • Maintains compatibility with existing node architecture
 *
 * Keywords: email-sender, expanded, minimalist, clean-design
 */

import * as React from "react";
import type { EmailSenderData } from "../emailSender.node";
import { EmailSender } from "./EmailSender";

// Minimalist container styles
const EXPANDED_STYLES = {
  container: "w-full h-full",
  disabled: "opacity-75 pointer-events-none",
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

export interface EmailSenderExpandedProps {
  nodeId: string;
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
      nodeId,
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

    return (
      <div
        className={`${EXPANDED_STYLES.container} ${isEnabled ? "" : EXPANDED_STYLES.disabled}`}
      >
        <EmailSender
          nodeId={nodeId}
          nodeData={nodeData}
          isEnabled={isEnabled}
          sendingStatus={sendingStatus}
          availableAccounts={availableAccounts}
          selectedAccount={selectedAccount}
          accountErrors={accountErrors}
          onAccountChange={onAccountChange}
          onSubjectChange={onSubjectChange}
          onRecipientsChange={onRecipientsChange}
          onContentChange={onContentChange}
          onCheckboxChange={onCheckboxChange}
          onFileAttachment={onFileAttachment}
          onRemoveAttachment={onRemoveAttachment}
          onNumberChange={onNumberChange}
          onSendModeChange={onSendModeChange}
          onSendEmail={onSendEmail}
          onRefreshAccount={onRefreshAccount}
        />
      </div>
    );
  },
  (prev, next) => {
    // Compare primitive props
    if (
      prev.isEnabled !== next.isEnabled ||
      prev.sendingStatus !== next.sendingStatus ||
      prev.nodeId !== next.nodeId
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

    // Compare essential nodeData fields for sender
    const keys: (keyof EmailSenderData)[] = [
      "accountId",
      "subject",
      "recipients",
      "content",
      "attachments",
      "sendMode",
      "sentCount",
      "failedCount",
      "lastError",
    ];
    for (const k of keys) {
      if ((prev.nodeData as any)[k] !== (next.nodeData as any)[k]) return false;
    }
    return true;
  }
);

export default EmailSenderExpanded;