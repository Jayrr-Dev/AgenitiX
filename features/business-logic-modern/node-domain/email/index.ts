/**
 * Email Domain Exports
 *
 * Central export point for all email domain functionality.
 */

// Types
export * from "./types";

// Providers
export * from "./providers";

// Utilities
export * from "./utils";

// Re-export specific providers for convenience
export { gmailProvider } from "./providers/gmail";
export { outlookProvider } from "./providers/outlook";
export { imapProvider } from "./providers/imap";
export { smtpProvider } from "./providers/smtp";

// Export email nodes
export { default as emailAccount, spec as emailAccountSpec } from "./emailAccount.node";
export { default as emailReader, spec as emailReaderSpec } from "./emailReader.node";
export { default as emailCreator, spec as emailCreatorSpec } from "./emailCreator.node";
export { default as emailSender, spec as emailSenderSpec } from "./emailSender.node";
export { default as emailReplier, spec as emailReplierSpec } from "./emailReplier.node";
export { default as emailTemplate, spec as emailTemplateSpec } from "./emailTemplate.node";
export { default as emailBrand, spec as emailBrandSpec } from "./emailBrand.node";
export { default as emailUpdater, spec as emailUpdaterSpec } from "./emailUpdater.node";
export { default as emailList, spec as emailListSpec } from "./emailList.node";
export { default as emailData, spec as emailDataSpec } from "./emailData.node";
export { default as emailBulk, spec as emailBulkSpec } from "./emailBulk.node";
export { default as emailAnalytics, spec as emailAnalyticsSpec } from "./emailAnalytics.node";
export { default as emailDraft, spec as emailDraftSpec } from "./emailDraft.node";
export { default as emailFilter, spec as emailFilterSpec } from "./emailFilter.node";
export { default as emailLabeler, spec as emailLabelerSpec } from "./emailLabeler.node";
