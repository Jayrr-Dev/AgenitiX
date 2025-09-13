/**
 * EmailDraft Domain Types
 * 
 * Tipos específicos para el sistema de borradores de email
 */

import type { EmailAttachment } from "../types";

export interface EmailDraftContent {
  recipients: {
    to: string[];
    cc: string[];
    bcc: string[];
  };
  subject: string;
  body: {
    text: string;
    html: string;
    mode: "text" | "html" | "rich";
  };
  attachments: EmailAttachment[];
}

export interface EmailDraftTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  variables: Record<string, string>;
}

export interface EmailDraftMetadata {
  draftId?: string;
  lastSaved?: number;
  autoSave: boolean;
  accountId: string;
  fromAddress: string;
}

export interface EmailDraftStatus {
  isValid: boolean;
  hasChanges: boolean;
  isConnected: boolean;
  lastValidationError?: string;
}

export interface EmailDraftOutput {
  draft: EmailDraftContent & EmailDraftMetadata;
  status: EmailDraftStatus;
}

export interface ConnectedEmailAccount {
  email: string;
  displayName?: string;
  isConnected: boolean;
  accountId: string;
}

export interface EmailValidationResult {
  email: string;
  isValid: boolean;
  error?: string;
}

export interface DraftAutoSaveConfig {
  enabled: boolean;
  intervalMs: number;
  maxRetries: number;
}

export const DEFAULT_DRAFT_CONFIG: DraftAutoSaveConfig = {
  enabled: true,
  intervalMs: 2000,
  maxRetries: 3,
};

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateDraftEmailAddress(email: string): EmailValidationResult {
  const trimmed = email.trim();
  const isValid = EMAIL_REGEX.test(trimmed);
  
  return {
    email: trimmed,
    isValid,
    error: !isValid ? "Invalid email format" : undefined,
  };
}

export function validateEmailList(emails: string[]): EmailValidationResult[] {
  return emails.map(validateDraftEmailAddress);
}

export function isDraftValid(draft: EmailDraftContent): boolean {
  const hasRecipients = draft.recipients.to.length > 0;
  const hasSubject = draft.subject.trim().length > 0;
  const hasBody = draft.body.text.trim().length > 0;
  
  return hasRecipients && (hasSubject || hasBody);
}

export function getDraftSummary(draft: EmailDraftContent): string {
  const recipientCount = draft.recipients.to.length + draft.recipients.cc.length + draft.recipients.bcc.length;
  const subject = draft.subject.trim() || "Sin asunto";
  
  return `${recipientCount} destinatario${recipientCount !== 1 ? 's' : ''} - ${subject}`;
}
