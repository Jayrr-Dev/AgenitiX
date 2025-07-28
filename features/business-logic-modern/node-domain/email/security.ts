/**
 * Email Security Utilities
 *
 * Provides encryption, validation, and security utilities for email credentials.
 * In production, this should use proper encryption libraries and key management.
 */

import type { EmailAccountConfig, EmailError } from "./types";
import { createEmailError } from "./utils";

// Security configuration
const SECURITY_CONFIG = {
	// In production, these should come from environment variables
	ENCRYPTION_KEY: process.env.EMAIL_ENCRYPTION_KEY || "dev-key-not-secure",
	TOKEN_EXPIRY_BUFFER: 5 * 60 * 1000, // 5 minutes buffer before token expiry
	MAX_RETRY_ATTEMPTS: 3,
	RATE_LIMIT_WINDOW: 60 * 1000, // 1 minute
	MAX_REQUESTS_PER_WINDOW: 10,
};

// Simple encryption/decryption (DEVELOPMENT ONLY)
// In production, use proper encryption libraries like crypto-js or node:crypto
export function encryptCredentials(credentials: EmailAccountConfig): string {
	try {
		// WARNING: This is NOT secure encryption - for development only
		// In production, use proper encryption with:
		// - Strong encryption algorithms (AES-256-GCM)
		// - Proper key derivation (PBKDF2, scrypt, or Argon2)
		// - Secure key storage (environment variables, key management services)
		// - Initialization vectors (IVs) for each encryption

		const jsonString = JSON.stringify(credentials);
		const encoded = btoa(jsonString); // Base64 encoding (NOT encryption)

		return encoded;
	} catch (error) {
		throw new Error(
			`Failed to encrypt credentials: ${error instanceof Error ? error.message : "Unknown error"}`
		);
	}
}

export function decryptCredentials(encryptedData: string): EmailAccountConfig {
	try {
		// WARNING: This is NOT secure decryption - for development only
		const decoded = atob(encryptedData); // Base64 decoding (NOT decryption)
		const credentials = JSON.parse(decoded);

		return credentials;
	} catch (error) {
		throw new Error(
			`Failed to decrypt credentials: ${error instanceof Error ? error.message : "Invalid encrypted data"}`
		);
	}
}

// Credential validation
export function validateCredentials(credentials: EmailAccountConfig): EmailError | null {
	// Basic validation
	if (!credentials.provider) {
		return createEmailError(
			"CONFIGURATION_INVALID",
			"Provider is required",
			{ field: "provider" },
			true
		);
	}

	if (!credentials.email) {
		return createEmailError("CONFIGURATION_INVALID", "Email is required", { field: "email" }, true);
	}

	// Provider-specific validation
	switch (credentials.provider) {
		case "gmail":
		case "outlook":
			if (!credentials.accessToken) {
				return createEmailError(
					"INVALID_CREDENTIALS",
					`Access token is required for ${credentials.provider}`,
					{ provider: credentials.provider },
					true
				);
			}

			// Check token expiry
			if (
				credentials.tokenExpiry &&
				credentials.tokenExpiry < Date.now() + SECURITY_CONFIG.TOKEN_EXPIRY_BUFFER
			) {
				return createEmailError(
					"TOKEN_EXPIRED",
					"Access token has expired or will expire soon",
					{ provider: credentials.provider, expiry: credentials.tokenExpiry },
					true
				);
			}
			break;

		case "imap":
			if (
				!credentials.imapHost ||
				!credentials.imapPort ||
				!credentials.username ||
				!credentials.password
			) {
				return createEmailError(
					"CONFIGURATION_INVALID",
					"IMAP host, port, username, and password are required",
					{ provider: "imap" },
					true
				);
			}
			break;

		case "smtp":
			if (
				!credentials.smtpHost ||
				!credentials.smtpPort ||
				!credentials.username ||
				!credentials.password
			) {
				return createEmailError(
					"CONFIGURATION_INVALID",
					"SMTP host, port, username, and password are required",
					{ provider: "smtp" },
					true
				);
			}
			break;

		default:
			return createEmailError(
				"CONFIGURATION_INVALID",
				`Unsupported provider: ${credentials.provider}`,
				{ provider: credentials.provider },
				false
			);
	}

	return null;
}

// Credential sanitization (remove sensitive data for logging)
export function sanitizeCredentials(credentials: EmailAccountConfig): Partial<EmailAccountConfig> {
	const sanitized = { ...credentials };

	// Mask sensitive fields
	if (sanitized.password) {
		sanitized.password = "***";
	}

	if (sanitized.accessToken) {
		sanitized.accessToken = sanitized.accessToken.substring(0, 10) + "...";
	}

	if (sanitized.refreshToken) {
		sanitized.refreshToken = sanitized.refreshToken.substring(0, 10) + "...";
	}

	return sanitized;
}

// Session validation
export function validateUserSession(userId: string, sessionToken: string): boolean {
	// In production, this would validate against a secure session store
	// For now, just basic validation
	return !!(userId && sessionToken && sessionToken.length > 10);
}

// Rate limiting (basic implementation)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(identifier: string): { allowed: boolean; retryAfter?: number } {
	const now = Date.now();
	const key = identifier;

	const current = rateLimitStore.get(key);

	if (!current || now > current.resetTime) {
		rateLimitStore.set(key, {
			count: 1,
			resetTime: now + SECURITY_CONFIG.RATE_LIMIT_WINDOW,
		});
		return { allowed: true };
	}

	if (current.count >= SECURITY_CONFIG.MAX_REQUESTS_PER_WINDOW) {
		const retryAfter = Math.ceil((current.resetTime - now) / 1000);
		return { allowed: false, retryAfter };
	}

	current.count++;
	return { allowed: true };
}

// Audit logging
export interface AuditEvent {
	userId: string;
	action: string;
	resource: string;
	details?: any;
	timestamp: number;
	ipAddress?: string;
	userAgent?: string;
}

export function logSecurityEvent(event: AuditEvent): void {
	// In production, this would log to a secure audit system
	console.log("Security Event:", {
		...event,
		details: event.details ? sanitizeCredentials(event.details) : undefined,
	});
}

// Token refresh validation
export function shouldRefreshToken(tokenExpiry?: number): boolean {
	if (!tokenExpiry) return false;

	return tokenExpiry < Date.now() + SECURITY_CONFIG.TOKEN_EXPIRY_BUFFER;
}

// Secure random string generation
export function generateSecureToken(length = 32): string {
	const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	let result = "";

	// In production, use crypto.getRandomValues() or similar
	for (let i = 0; i < length; i++) {
		result += chars.charAt(Math.floor(Math.random() * chars.length));
	}

	return result;
}

// Input sanitization
export function sanitizeInput(input: string): string {
	if (typeof input !== "string") return "";

	return input
		.trim()
		.replace(/[<>]/g, "") // Remove potential HTML tags
		.substring(0, 1000); // Limit length
}

// Email validation (more robust)
export function validateEmailFormat(email: string): boolean {
	const emailRegex =
		/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
	return emailRegex.test(email) && email.length <= 254;
}

// Domain validation
export function validateDomain(domain: string): boolean {
	const domainRegex =
		/^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
	return domainRegex.test(domain) && domain.length <= 253;
}

// Port validation
export function validatePort(port: number): boolean {
	return Number.isInteger(port) && port >= 1 && port <= 65535;
}

// Security headers for API responses
export function getSecurityHeaders(): Record<string, string> {
	return {
		"X-Content-Type-Options": "nosniff",
		"X-Frame-Options": "DENY",
		"X-XSS-Protection": "1; mode=block",
		"Referrer-Policy": "strict-origin-when-cross-origin",
		"Content-Security-Policy": "default-src 'self'",
	};
}

// Error sanitization (remove sensitive info from error messages)
export function sanitizeError(error: any): any {
	if (error instanceof Error) {
		return {
			message: error.message,
			name: error.name,
			// Don't include stack traces in production
			...(process.env.NODE_ENV === "development" && { stack: error.stack }),
		};
	}

	if (typeof error === "object" && error !== null) {
		const sanitized = { ...error };

		// Remove sensitive fields
		delete sanitized.password;
		delete sanitized.accessToken;
		delete sanitized.refreshToken;
		delete sanitized.credentials;

		return sanitized;
	}

	return error;
}
