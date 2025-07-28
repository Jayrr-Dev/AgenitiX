/**
 * Email Domain Types and Interfaces
 * 
 * Core TypeScript interfaces for email providers, configurations, and operations.
 * These types ensure type safety across all email-related nodes and operations.
 */

// Email Provider Types
export type EmailProviderType = 'gmail' | 'outlook' | 'imap' | 'smtp';

export type AuthType = 'oauth2' | 'manual';

export interface ConfigField {
  key: string;
  label: string;
  type: 'text' | 'password' | 'number' | 'select';
  required: boolean;
  placeholder?: string;
  options?: Array<{ value: string; label: string }>;
  validation?: (value: any) => string | null;
}

export interface EmailProvider {
  id: EmailProviderType;
  name: string;
  authType: AuthType;
  configFields: ConfigField[];
  validateConnection: (config: EmailAccountConfig) => Promise<ConnectionResult>;
  getOAuthUrl?: (redirectUri: string, state?: string) => string;
  exchangeCodeForTokens?: (code: string, redirectUri: string) => Promise<OAuth2Tokens>;
  refreshTokens?: (refreshToken: string) => Promise<OAuth2Tokens>;
  capabilities: ProviderCapabilities;
  defaultConfig?: Partial<EmailAccountConfig>;
}

// Configuration Types
export interface EmailAccountConfig {
  provider: EmailProviderType;
  email: string;
  displayName?: string;
  
  // OAuth2 credentials
  accessToken?: string;
  refreshToken?: string;
  tokenExpiry?: number;
  
  // Manual credentials (IMAP/SMTP)
  imapHost?: string;
  imapPort?: number;
  smtpHost?: string;
  smtpPort?: number;
  username?: string;
  password?: string;
  
  // Security settings
  useSSL?: boolean;
  useTLS?: boolean;
}

export interface OAuth2Tokens {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
  tokenType: string;
  scope?: string;
}

// Connection and Status Types
export interface ConnectionResult {
  success: boolean;
  error?: EmailError;
  accountInfo?: {
    email: string;
    displayName?: string;
    quotaUsed?: number;
    quotaTotal?: number;
  };
}

export type EmailErrorCode = 
  | "AUTHENTICATION_FAILED"
  | "CONNECTION_TIMEOUT"
  | "INVALID_CREDENTIALS"
  | "PROVIDER_ERROR"
  | "RATE_LIMIT_EXCEEDED"
  | "NETWORK_ERROR"
  | "CONFIGURATION_INVALID"
  | "TOKEN_EXPIRED"
  | "PERMISSION_DENIED"
  | "QUOTA_EXCEEDED";

export interface EmailError {
  code: EmailErrorCode;
  message: string;
  details?: any;
  retryAfter?: number; // seconds
  recoverable: boolean;
}

// Database Types (for Convex integration)
export interface StoredEmailAccount {
  id: string;
  userId: string;
  provider: EmailProviderType;
  email: string;
  displayName?: string;
  encryptedCredentials: string; // JSON string of encrypted EmailAccountConfig
  isActive: boolean;
  lastValidated?: number;
  createdAt: number;
  updatedAt: number;
}

// Node Integration Types
export interface EmailAccountNodeData {
  // Provider configuration
  provider: EmailProviderType;
  email: string;
  displayName: string;
  
  // Connection state
  isConfigured: boolean;
  isConnected: boolean;
  connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'error';
  lastValidated?: number;
  accountId?: string; // Convex document ID
  
  // Manual configuration fields
  imapHost: string;
  imapPort: number;
  smtpHost: string;
  smtpPort: number;
  username: string;
  password: string;
  useSSL: boolean;
  useTLS: boolean;
  
  // UI state
  isEnabled: boolean;
  isActive: boolean;
  isExpanded: boolean;
  expandedSize: string;
  collapsedSize: string;
  
  // Error handling
  lastError?: EmailError;
  
  // Outputs
  accountOutput?: EmailAccountConfig;
  statusOutput?: boolean;
}

// Utility Types
export interface EmailAccountSummary {
  id: string;
  provider: EmailProviderType;
  email: string;
  displayName?: string;
  isConnected: boolean;
  lastValidated?: number;
}

export interface ProviderCapabilities {
  canSend: boolean;
  canReceive: boolean;
  supportsAttachments: boolean;
  supportsHtml: boolean;
  maxAttachmentSize?: number; // bytes
  rateLimit?: {
    requestsPerMinute: number;
    requestsPerHour: number;
    requestsPerDay: number;
  };
}

// Event Types for integration
export type EmailAccountEvent = 
  | { type: 'ACCOUNT_CONNECTED'; accountId: string; config: EmailAccountConfig }
  | { type: 'ACCOUNT_DISCONNECTED'; accountId: string }
  | { type: 'CONNECTION_FAILED'; accountId: string; error: EmailError }
  | { type: 'ACCOUNT_UPDATED'; accountId: string; config: EmailAccountConfig };

export interface EmailAccountEventHandler {
  (event: EmailAccountEvent): void;
}