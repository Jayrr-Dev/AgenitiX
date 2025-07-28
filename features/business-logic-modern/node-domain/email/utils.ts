/**
 * Email Domain Utilities
 * 
 * Shared utility functions for email operations, validation, and formatting.
 */

import type { EmailError, EmailErrorCode, EmailAccountConfig } from './types';

// Error handling utilities
export function createEmailError(
  code: EmailErrorCode,
  message: string,
  details?: any,
  recoverable: boolean = true,
  retryAfter?: number
): EmailError {
  return {
    code,
    message,
    details,
    recoverable,
    retryAfter,
  };
}

export function isRecoverableError(error: EmailError): boolean {
  return error.recoverable;
}

export function getErrorDisplayMessage(error: EmailError): string {
  switch (error.code) {
    case 'AUTHENTICATION_FAILED':
      return 'Authentication failed. Please check your credentials and try again.';
    case 'CONNECTION_TIMEOUT':
      return 'Connection timed out. Please check your network connection.';
    case 'INVALID_CREDENTIALS':
      return 'Invalid credentials. Please verify your email and password.';
    case 'PROVIDER_ERROR':
      return `Provider error: ${error.message}`;
    case 'RATE_LIMIT_EXCEEDED':
      return `Rate limit exceeded. ${error.retryAfter ? `Try again in ${error.retryAfter} seconds.` : 'Please try again later.'}`;
    case 'NETWORK_ERROR':
      return 'Network error. Please check your internet connection.';
    case 'CONFIGURATION_INVALID':
      return `Configuration error: ${error.message}`;
    case 'TOKEN_EXPIRED':
      return 'Access token has expired. Please re-authenticate.';
    case 'PERMISSION_DENIED':
      return 'Permission denied. Please check your account permissions.';
    case 'QUOTA_EXCEEDED':
      return 'Quota exceeded. Please try again later or upgrade your account.';
    default:
      return error.message || 'An unknown error occurred.';
  }
}

// Validation utilities
export function validateEmailAddress(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validateHostname(hostname: string): boolean {
  const hostnameRegex = /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return hostnameRegex.test(hostname);
}

export function validatePort(port: number): boolean {
  return Number.isInteger(port) && port >= 1 && port <= 65535;
}

// Configuration utilities
export function sanitizeEmailConfig(config: EmailAccountConfig): EmailAccountConfig {
  return {
    ...config,
    email: config.email?.trim().toLowerCase() || '',
    displayName: config.displayName?.trim() || '',
    imapHost: config.imapHost?.trim() || '',
    smtpHost: config.smtpHost?.trim() || '',
    username: config.username?.trim() || '',
  };
}

export function maskSensitiveData(config: EmailAccountConfig): Partial<EmailAccountConfig> {
  const masked = { ...config };
  
  // Mask sensitive fields
  if (masked.password) {
    masked.password = '***';
  }
  if (masked.accessToken) {
    masked.accessToken = masked.accessToken.substring(0, 10) + '...';
  }
  if (masked.refreshToken) {
    masked.refreshToken = masked.refreshToken.substring(0, 10) + '...';
  }
  
  return masked;
}

// Formatting utilities
export function formatConnectionStatus(status: string): string {
  switch (status) {
    case 'connected':
      return 'Connected';
    case 'connecting':
      return 'Connecting...';
    case 'disconnected':
      return 'Disconnected';
    case 'error':
      return 'Connection Error';
    default:
      return 'Unknown';
  }
}

export function formatLastValidated(timestamp?: number): string {
  if (!timestamp) {
    return 'Never';
  }
  
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffMins < 1) {
    return 'Just now';
  } else if (diffMins < 60) {
    return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  } else if (diffDays < 7) {
    return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  } else {
    return date.toLocaleDateString();
  }
}

// Provider detection utilities
export function detectProviderFromEmail(email: string): string | null {
  const domain = email.split('@')[1]?.toLowerCase();
  
  if (!domain) return null;
  
  const providerMap: Record<string, string> = {
    'gmail.com': 'gmail',
    'googlemail.com': 'gmail',
    'outlook.com': 'outlook',
    'hotmail.com': 'outlook',
    'live.com': 'outlook',
    'msn.com': 'outlook',
    'yahoo.com': 'imap', // Yahoo requires app passwords, so use IMAP
    'icloud.com': 'imap',
    'me.com': 'imap',
  };
  
  return providerMap[domain] || null;
}

// Encryption utilities (placeholder - would use actual encryption in production)
export function encryptCredentials(credentials: EmailAccountConfig): string {
  // In production, this would use proper encryption
  // For now, just JSON stringify (NOT SECURE - for development only)
  return JSON.stringify(credentials);
}

export function decryptCredentials(encryptedData: string): EmailAccountConfig {
  // In production, this would use proper decryption
  // For now, just JSON parse (NOT SECURE - for development only)
  try {
    return JSON.parse(encryptedData);
  } catch {
    throw new Error('Failed to decrypt credentials');
  }
}

// Retry utilities
export function shouldRetryError(error: EmailError): boolean {
  const retryableCodes: EmailErrorCode[] = [
    'CONNECTION_TIMEOUT',
    'NETWORK_ERROR',
    'RATE_LIMIT_EXCEEDED',
    'PROVIDER_ERROR',
  ];
  
  return retryableCodes.includes(error.code);
}

export function getRetryDelay(attempt: number, baseDelay: number = 1000): number {
  // Exponential backoff with jitter
  const delay = baseDelay * Math.pow(2, attempt);
  const jitter = Math.random() * 0.1 * delay;
  return Math.min(delay + jitter, 30000); // Max 30 seconds
}

// Status utilities
export function getStatusColor(status: string): string {
  switch (status) {
    case 'connected':
      return 'text-green-600';
    case 'connecting':
      return 'text-blue-600';
    case 'error':
      return 'text-red-600';
    case 'disconnected':
    default:
      return 'text-gray-600';
  }
}

export function getStatusIcon(status: string): string {
  switch (status) {
    case 'connected':
      return '✓';
    case 'connecting':
      return '⟳';
    case 'error':
      return '✗';
    case 'disconnected':
    default:
      return '○';
  }
}