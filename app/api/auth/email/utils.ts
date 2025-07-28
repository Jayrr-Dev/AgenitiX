/**
 * OAuth2 Authentication Utilities
 *
 * Shared utilities for OAuth2 authentication flows.
 */

import type { EmailProviderType } from "@/features/business-logic-modern/node-domain/email/types";
import { NextResponse } from "next/server";

// CSRF state token generation and validation
export function generateStateToken(): string {
	const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	let result = "";
	for (let i = 0; i < 32; i++) {
		result += chars.charAt(Math.floor(Math.random() * chars.length));
	}
	return result;
}

export function validateStateToken(
	receivedState: string | null,
	expectedState: string | null
): boolean {
	if (!(receivedState && expectedState)) {
		return false;
	}
	return receivedState === expectedState;
}

// Redirect URL builders
export function buildErrorRedirect(
	error: string,
	errorDescription: string,
	provider: EmailProviderType,
	state?: string | null
): NextResponse {
	const frontendUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
	const redirectUrl = new URL("/dashboard", frontendUrl);

	redirectUrl.searchParams.set("auth_error", error);
	redirectUrl.searchParams.set("auth_error_description", errorDescription);
	redirectUrl.searchParams.set("provider", provider);

	if (state) {
		redirectUrl.searchParams.set("state", state);
	}

	return NextResponse.redirect(redirectUrl);
}

export function buildSuccessRedirect(
	authData: {
		provider: EmailProviderType;
		email?: string;
		displayName?: string;
		accessToken: string;
		refreshToken?: string;
		tokenExpiry: number;
	},
	state?: string | null
): NextResponse {
	const frontendUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
	const redirectUrl = new URL("/dashboard", frontendUrl);

	// In production, store auth data securely and use a session token
	// For now, we'll encode it in the URL (NOT SECURE - for development only)
	const dataToEncode = {
		...authData,
		state,
	};

	redirectUrl.searchParams.set("auth_success", "true");
	redirectUrl.searchParams.set("auth_data", btoa(JSON.stringify(dataToEncode)));

	return NextResponse.redirect(redirectUrl);
}

// Validation helpers
export function validateRedirectUri(redirectUri: string | null): boolean {
	if (!redirectUri) {
		return false;
	}

	const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
	return redirectUri.startsWith(baseUrl);
}

// Error response builders
export function buildErrorResponse(message: string, details?: string, status = 400) {
	return NextResponse.json(
		{
			error: message,
			details,
			timestamp: new Date().toISOString(),
		},
		{ status }
	);
}

export function buildSuccessResponse(data: any) {
	return NextResponse.json({
		success: true,
		data,
		timestamp: new Date().toISOString(),
	});
}

// OAuth2 error mapping
export function mapOAuth2Error(error: string): { code: string; message: string } {
	const errorMap: Record<string, { code: string; message: string }> = {
		access_denied: {
			code: "USER_DENIED",
			message: "User denied access to their email account",
		},
		invalid_request: {
			code: "INVALID_REQUEST",
			message: "Invalid OAuth2 request parameters",
		},
		invalid_client: {
			code: "INVALID_CLIENT",
			message: "Invalid client credentials",
		},
		invalid_grant: {
			code: "INVALID_GRANT",
			message: "Invalid authorization grant",
		},
		unauthorized_client: {
			code: "UNAUTHORIZED_CLIENT",
			message: "Client not authorized for this grant type",
		},
		unsupported_grant_type: {
			code: "UNSUPPORTED_GRANT_TYPE",
			message: "Grant type not supported",
		},
		invalid_scope: {
			code: "INVALID_SCOPE",
			message: "Invalid or unsupported scope",
		},
	};

	return (
		errorMap[error] || {
			code: "UNKNOWN_ERROR",
			message: `Unknown OAuth2 error: ${error}`,
		}
	);
}

// Token refresh helper
export async function refreshAccessToken(
	provider: EmailProviderType,
	_refreshToken: string
): Promise<{ accessToken: string; expiresIn: number; refreshToken?: string }> {
	// This would be implemented based on the provider
	// For now, throw an error to indicate it needs implementation
	throw new Error(`Token refresh not implemented for provider: ${provider}`);
}

// Security helpers
export function sanitizeAuthData(authData: any): any {
	// Remove sensitive data that shouldn't be logged
	const sanitized = { ...authData };

	if (sanitized.accessToken) {
		sanitized.accessToken = `${sanitized.accessToken.substring(0, 10)}...`;
	}

	if (sanitized.refreshToken) {
		sanitized.refreshToken = `${sanitized.refreshToken.substring(0, 10)}...`;
	}

	return sanitized;
}

// Rate limiting helper (basic implementation)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(identifier: string, maxRequests = 10, windowMs = 60000): boolean {
	const now = Date.now();
	const key = identifier;

	const current = rateLimitMap.get(key);

	if (!current || now > current.resetTime) {
		rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
		return true;
	}

	if (current.count >= maxRequests) {
		return false;
	}

	current.count++;
	return true;
}
