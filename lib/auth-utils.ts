/**
 * Utility functions for authentication error handling and user experience
 */

/**
 * Converts Convex error messages to user-friendly messages
 */
export function formatAuthError(error: unknown): string {
	if (!(error instanceof Error)) {
		return "An unexpected error occurred. Please try again.";
	}

	const message = error.message.toLowerCase();

	// Handle specific Convex auth errors
	if (message.includes("invalid credentials") || message.includes("inactive user")) {
		return "Account not found. Please check your email or create a new account.";
	}

	if (message.includes("user with this email already exists")) {
		return "An account with this email already exists. Please sign in instead.";
	}

	if (message.includes("network") || message.includes("connection")) {
		return "Connection error. Please check your internet connection and try again.";
	}

	if (message.includes("timeout")) {
		return "Request timed out. Please try again.";
	}

	if (message.includes("server error") || message.includes("internal error")) {
		return "Server error. Please try again in a few moments.";
	}

	// Return original message if it's already user-friendly
	if (error.message.length < 100 && !error.message.includes("handler") && !error.message.includes("convex")) {
		return error.message;
	}

	// Default fallback
	return "Something went wrong. Please try again.";
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