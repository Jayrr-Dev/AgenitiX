/**
 * Email Domain Exports
 * 
 * Central export point for all email domain functionality.
 */

// Types
export type * from './types';

// Providers
export * from './providers';

// Utilities
export * from './utils';

// Re-export specific providers for convenience
export { gmailProvider } from './providers/gmail';
export { outlookProvider } from './providers/outlook';
export { imapProvider } from './providers/imap';
export { smtpProvider } from './providers/smtp';

// Export emailAccount node
export { default as emailAccount, spec as emailAccountSpec } from './emailAccount.node';