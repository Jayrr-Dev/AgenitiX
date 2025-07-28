/**
 * Utility functions for authentication error handling and user experience
 */

// Import the AuthErrorCode from Convex to avoid duplication
import type { AuthErrorCode } from "@/convex/auth";

/**
 * Converts Convex error messages to user-friendly messages with specific error codes
 */
export function formatAuthError(error: unknown): string {
	if (!(error instanceof Error)) {
		return "An unexpected error occurred. Please try again.";
	}

	// Check for specific error codes
	const errorCode = (error as any).code as AuthErrorCode;
	const retryAfter = (error as any).retryAfter as number | undefined;
	
	switch (errorCode) {
		case "USER_NOT_FOUND":
			return "Account not found. Please check your email or create a new account.";
		
		case "USER_ALREADY_EXISTS":
			return "An account with this email already exists. Please sign in instead.";
		
		case "RATE_LIMIT_EXCEEDED":
			if (retryAfter) {
				const timeText = retryAfter === 1 ? "1 minute" : `${retryAfter} minutes`;
				return `Too many login attempts. Please wait ${timeText} before trying again.`;
			}
			return "Too many login attempts. Please wait before trying again.";
		
		case "INVALID_MAGIC_LINK":
			return "Invalid magic link. Please request a new one.";
		
		case "EXPIRED_MAGIC_LINK":
			return "Magic link has expired. Please request a new one to continue.";
		
		case "EMAIL_SEND_FAILED":
			return "Failed to send email. Please try again or contact support.";
		
		default:
			// If the error message is already user-friendly (from Convex), use it
			if (error.message.length < 150 && !error.message.includes("handler") && !error.message.includes("convex")) {
				return error.message;
			}
			
			// Fallback for unknown errors
			return "Something went wrong. Please try again.";
	}
}

/**
 * Get error type for specific UI handling
 */
export function getAuthErrorType(error: unknown): AuthErrorCode | null {
	if (!(error instanceof Error)) {
		return null;
	}
	
	return (error as any).code as AuthErrorCode || null;
}

/**
 * Get retry information from rate limit errors
 */
export function getRetryInfo(error: unknown): { canRetry: boolean; retryAfter?: number } {
	if (!(error instanceof Error)) {
		return { canRetry: true };
	}
	
	const errorCode = (error as any).code as AuthErrorCode;
	const retryAfter = (error as any).retryAfter as number | undefined;
	
	if (errorCode === "RATE_LIMIT_EXCEEDED") {
		return { 
			canRetry: false, 
			retryAfter 
		};
	}
	
	return { canRetry: true };
}

/**
 * Validates email format
 */
export function isValidEmail(email: string): boolean {
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return emailRegex.test(email);
}

/**
 * Validates name format
 */
export function isValidName(name: string): boolean {
	return name.trim().length >= 2 && name.trim().length <= 50;
}

/**
 * Sanitizes user input
 */
export function sanitizeInput(input: string): string {
	return input.trim().replace(/[<>]/g, "");
}