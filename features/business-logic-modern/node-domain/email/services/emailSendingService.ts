/**
 * Email Sending Service
 * 
 * Service for sending emails through configured email accounts via Convex backend.
 * Handles Gmail, Outlook, and SMTP providers with proper error handling and retry logic.
 */

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useMutation } from "convex/react";

// Types for email sending
export interface EmailRecipients {
  to: string[];
  cc?: string[];
  bcc?: string[];
}

export interface EmailContent {
  text: string;
  html?: string;
}

export interface EmailAttachment {
  filename: string;
  content: string; // base64 encoded
  contentType: string;
  size: number;
}

export interface SendEmailRequest {
  accountId: Id<"email_accounts">;
  recipients: EmailRecipients;
  subject: string;
  content: EmailContent;
  attachments?: EmailAttachment[];
}

export interface SendEmailResult {
  success: boolean;
  data?: {
    messageId: string;
    recipients: EmailRecipients;
    deliveryStatus: string;
    message: string;
  };
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

// Email validation utilities
export class EmailValidation {
  private static readonly EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

  static validateEmail(email: string): boolean {
    return this.EMAIL_REGEX.test(email) && email.length <= 254;
  }

  static validateRecipients(recipients: EmailRecipients): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check if at least one recipient exists
    if (!recipients.to || recipients.to.length === 0) {
      errors.push("At least one recipient is required");
    }

    // Validate all email addresses
    const allEmails = [
      ...(recipients.to || []),
      ...(recipients.cc || []),
      ...(recipients.bcc || []),
    ];

    for (const email of allEmails) {
      if (!this.validateEmail(email.trim())) {
        errors.push(`Invalid email address: ${email}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  static validateContent(subject: string, content: EmailContent): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!subject.trim()) {
      errors.push("Subject is required");
    }

    if (!content.text.trim() && !content.html?.trim()) {
      errors.push("Message content is required");
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

// Email sending service class
export class EmailSendingService {
  private static instance: EmailSendingService;
  
  private constructor() {}

  static getInstance(): EmailSendingService {
    if (!EmailSendingService.instance) {
      EmailSendingService.instance = new EmailSendingService();
    }
    return EmailSendingService.instance;
  }

  /**
   * Send email through Convex backend
   */
  async sendEmail(
    request: SendEmailRequest,
    tokenHash: string,
    sendEmailMutation: any
  ): Promise<SendEmailResult> {
    try {
      // Validate request
      const recipientValidation = EmailValidation.validateRecipients(request.recipients);
      if (!recipientValidation.valid) {
        return {
          success: false,
          error: {
            code: "INVALID_RECIPIENTS",
            message: recipientValidation.errors.join(", "),
          },
        };
      }

      const contentValidation = EmailValidation.validateContent(request.subject, request.content);
      if (!contentValidation.valid) {
        return {
          success: false,
          error: {
            code: "INVALID_CONTENT",
            message: contentValidation.errors.join(", "),
          },
        };
      }

      // Call Convex mutation
      const result = await sendEmailMutation({
        token_hash: tokenHash,
        account_id: request.accountId,
        recipients: request.recipients,
        subject: request.subject,
        content: request.content,
        attachments: request.attachments,
      });

      return result;
    } catch (error) {
      console.error("Email sending service error:", error);
      return {
        success: false,
        error: {
          code: "SERVICE_ERROR",
          message: error instanceof Error ? error.message : "Failed to send email",
        },
      };
    }
  }

  /**
   * Parse recipient string into array of valid emails
   */
  parseRecipients(recipientString: string): { valid: string[]; invalid: string[] } {
    const emails = recipientString
      .split(/[,;\n]/)
      .map(email => email.trim())
      .filter(email => email.length > 0);

    const valid: string[] = [];
    const invalid: string[] = [];

    for (const email of emails) {
      if (EmailValidation.validateEmail(email)) {
        valid.push(email);
      } else {
        invalid.push(email);
      }
    }

    return { valid, invalid };
  }

  /**
   * Format recipients for display
   */
  formatRecipients(recipients: EmailRecipients): string {
    const parts: string[] = [];
    
    if (recipients.to && recipients.to.length > 0) {
      parts.push(`To: ${recipients.to.join(", ")}`);
    }
    
    if (recipients.cc && recipients.cc.length > 0) {
      parts.push(`CC: ${recipients.cc.join(", ")}`);
    }
    
    if (recipients.bcc && recipients.bcc.length > 0) {
      parts.push(`BCC: ${recipients.bcc.join(", ")}`);
    }

    return parts.join(" | ");
  }

  /**
   * Get user-friendly error message
   */
  getErrorMessage(error: { code: string; message: string }): string {
    switch (error.code) {
      case "INVALID_RECIPIENTS":
        return "Please check the recipient email addresses";
      case "INVALID_CONTENT":
        return "Please check the subject and message content";
      case "AUTHENTICATION_FAILED":
        return "Email account authentication failed. Please reconnect your account.";
      case "PERMISSION_DENIED":
        return "Insufficient permissions to send email. Please check your account settings.";
      case "RATE_LIMIT_EXCEEDED":
        return "Too many emails sent. Please wait before sending more.";
      case "ACCOUNT_NOT_FOUND":
        return "Email account not found. Please select a valid account.";
      case "ACCOUNT_INACTIVE":
        return "Email account is inactive. Please activate it first.";
      case "NETWORK_ERROR":
        return "Network error occurred. Please check your connection and try again.";
      case "GMAIL_API_ERROR":
        return "Gmail API error. Please try again or contact support.";
      case "NOT_IMPLEMENTED":
        return "This email provider is not yet supported.";
      default:
        return error.message || "An unexpected error occurred while sending email";
    }
  }
}

// Hook for using email sending service
export function useEmailSending() {
  const sendEmailMutation = useMutation(api.emailAccounts.sendEmail);
  const emailService = EmailSendingService.getInstance();

  const sendEmail = async (request: SendEmailRequest, tokenHash: string): Promise<SendEmailResult> => {
    return emailService.sendEmail(request, tokenHash, sendEmailMutation);
  };

  return {
    sendEmail,
    parseRecipients: emailService.parseRecipients.bind(emailService),
    formatRecipients: emailService.formatRecipients.bind(emailService),
    getErrorMessage: emailService.getErrorMessage.bind(emailService),
    validateRecipients: EmailValidation.validateRecipients,
    validateContent: EmailValidation.validateContent,
  };
}

export default EmailSendingService;