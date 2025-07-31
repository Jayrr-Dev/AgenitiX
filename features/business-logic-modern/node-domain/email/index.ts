/**
 * Email Domain Exports
 *
 * Central export point for all email domain functionality.
 */

// Types
export type * from "./types";

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
export { default as emailReplier, spec as emailReplierSpec } from "./emailReplier.node";
