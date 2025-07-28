/**
 * Email Provider Registry
 * 
 * Central registry for all supported email providers.
 * Each provider implements the EmailProvider interface for consistent handling.
 */

import type { EmailProvider, EmailProviderType } from '../types';
import { gmailProvider } from './gmail';
import { outlookProvider } from './outlook';
import { imapProvider } from './imap';
import { smtpProvider } from './smtp';

// Registry of all available providers
const providers: EmailProvider[] = [
  gmailProvider,
  outlookProvider,
  imapProvider,
  smtpProvider,
];

// Provider registry functions
export function getProvider(providerId: EmailProviderType): EmailProvider | null {
  return providers.find(p => p.id === providerId) || null;
}

export function getAllProviders(): EmailProvider[] {
  return [...providers];
}

export function getOAuthProviders(): EmailProvider[] {
  return providers.filter(p => p.authType === 'oauth2');
}

export function getManualProviders(): EmailProvider[] {
  return providers.filter(p => p.authType === 'manual');
}

export function isProviderSupported(providerId: string): providerId is EmailProviderType {
  return providers.some(p => p.id === providerId);
}

// Provider validation
export function validateProviderConfig(providerId: EmailProviderType, config: any): string[] {
  const provider = getProvider(providerId);
  if (!provider) {
    return [`Provider ${providerId} is not supported`];
  }

  const errors: string[] = [];
  
  for (const field of provider.configFields) {
    const value = config[field.key];
    
    if (field.required && (!value || value.toString().trim() === '')) {
      errors.push(`${field.label} is required`);
      continue;
    }
    
    if (value && field.validation) {
      const validationError = field.validation(value);
      if (validationError) {
        errors.push(validationError);
      }
    }
  }
  
  return errors;
}

// Export base class and individual providers for direct access
export { BaseEmailProvider } from './base';
export { gmailProvider } from './gmail';
export { outlookProvider } from './outlook';
export { imapProvider } from './imap';
export { smtpProvider } from './smtp';