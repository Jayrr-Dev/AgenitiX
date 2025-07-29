/**
 * Base Email Provider Abstract Class
 *
 * Abstract base class that all email providers must extend.
 * Provides common functionality and enforces consistent interface.
 */

import type {
	AuthType,
	ConfigField,
	ConnectionResult,
	EmailAccountConfig,
	EmailError,
	EmailProvider,
	EmailProviderType,
	OAuth2Tokens,
	ProviderCapabilities,
} from "../types";
import { createEmailError, validateEmailAddress } from "../utils";

export abstract class BaseEmailProvider implements EmailProvider {
	abstract readonly id: EmailProviderType;
	abstract readonly name: string;
	abstract readonly authType: AuthType;
	abstract readonly configFields: ConfigField[];
	abstract readonly capabilities: ProviderCapabilities;
	abstract readonly defaultConfig?: Partial<EmailAccountConfig>;

	// Abstract methods that must be implemented by subclasses
	abstract validateConnection(config: EmailAccountConfig): Promise<ConnectionResult>;

	// Optional OAuth2 methods (only for OAuth2 providers)
	getOAuthUrl?(redirectUri: string, state?: string): string;
	exchangeCodeForTokens?(code: string, redirectUri: string): Promise<OAuth2Tokens>;
	refreshTokens?(refreshToken: string): Promise<OAuth2Tokens>;

	// Common validation methods
	protected validateEmailConfig(config: EmailAccountConfig): EmailError | null {
		if (!(config.email && validateEmailAddress(config.email))) {
			return createEmailError(
				"CONFIGURATION_INVALID",
				"Please enter a valid email address",
				{ field: "email" },
				true
			);
		}

		return null;
	}

	protected validateRequiredFields(
		config: EmailAccountConfig,
		requiredFields: string[]
	): EmailError | null {
		for (const field of requiredFields) {
			const value = (config as any)[field];
			if (!value || (typeof value === "string" && value.trim() === "")) {
				const fieldConfig = this.configFields.find((f) => f.key === field);
				const fieldLabel = fieldConfig?.label || field;

				return createEmailError(
					"CONFIGURATION_INVALID",
					`${fieldLabel} is required`,
					{ field },
					true
				);
			}
		}

		return null;
	}

	protected handleConnectionError(error: any, context: string): Promise<ConnectionResult> {
		console.error(`${this.name} ${context} error:`, error);

		// Determine error type based on error message/code
		let errorType: ConnectionResult["error"]["type"] = "UNKNOWN_ERROR";
		let message = "An unknown error occurred";
		const details = error.message || String(error);

		// Parse common error patterns
		if (details.includes("ENOTFOUND") || details.includes("getaddrinfo")) {
			errorType = "NETWORK_ERROR";
			message = "Network error: Unable to resolve server address";
		} else if (details.includes("ECONNREFUSED") || details.includes("ECONNRESET")) {
			errorType = "CONNECTION_FAILED";
			message = "Connection refused by server";
		} else if (details.includes("ETIMEDOUT") || details.includes("timeout")) {
			errorType = "TIMEOUT";
			message = "Connection timed out";
		} else if (details.includes("authentication") || details.includes("login")) {
			errorType = "AUTH_ERROR";
			message = "Authentication failed";
		} else if (
			details.includes("certificate") ||
			details.includes("SSL") ||
			details.includes("TLS")
		) {
			errorType = "SSL_ERROR";
			message = "SSL/TLS certificate error";
		} else if (details.includes("Invalid host") || details.includes("Invalid port")) {
			errorType = "INVALID_SETTINGS";
			message = "Invalid server settings";
		}

		// Create detailed error response
		const connectionResult: ConnectionResult = {
			success: false,
			error: {
				type: errorType,
				message,
				details,
				timestamp: new Date().toISOString(),
			},
		};

		return Promise.resolve(connectionResult);
	}

	// Helper method for OAuth2 providers
	protected buildOAuthUrl(baseUrl: string, params: Record<string, string>): string {
		const urlParams = new URLSearchParams(params);
		return `${baseUrl}?${urlParams.toString()}`;
	}

	// Helper method for making authenticated API calls
	protected async makeAuthenticatedRequest(
		url: string,
		accessToken: string,
		options: RequestInit = {}
	): Promise<Response> {
		const response = await fetch(url, {
			...options,
			headers: {
				Authorization: `Bearer ${accessToken}`,
				"Content-Type": "application/json",
				...options.headers,
			},
		});

		if (!response.ok) {
			throw new Error(`API request failed: ${response.status} ${response.statusText}`);
		}

		return response;
	}

	// Helper method for token exchange
	protected async exchangeTokens(
		tokenUrl: string,
		params: Record<string, string>
	): Promise<OAuth2Tokens> {
		const response = await fetch(tokenUrl, {
			method: "POST",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
			},
			body: new URLSearchParams(params),
		});

		if (!response.ok) {
			throw new Error(`Token exchange failed: ${response.status} ${response.statusText}`);
		}

		const data = await response.json();

		return {
			accessToken: data.access_token,
			refreshToken: data.refresh_token,
			expiresIn: data.expires_in,
			tokenType: data.token_type,
			scope: data.scope,
		};
	}

	// Validation helper for config fields
	validateConfigFields(config: EmailAccountConfig): EmailError[] {
		const errors: EmailError[] = [];

		for (const field of this.configFields) {
			const value = (config as any)[field.key];

			// Check required fields
			if (field.required && (!value || (typeof value === "string" && value.trim() === ""))) {
				errors.push(
					createEmailError(
						"CONFIGURATION_INVALID",
						`${field.label} is required`,
						{ field: field.key },
						true
					)
				);
				continue;
			}

			// Run custom validation if provided
			if (value && field.validation) {
				const validationError = field.validation(value);
				if (validationError) {
					errors.push(
						createEmailError("CONFIGURATION_INVALID", validationError, { field: field.key }, true)
					);
				}
			}
		}

		return errors;
	}

	// Get provider display information
	getDisplayInfo() {
		return {
			id: this.id,
			name: this.name,
			authType: this.authType,
			capabilities: this.capabilities,
			configFields: this.configFields.map((field) => ({
				...field,
				// Don't expose validation functions in display info
				validation: undefined,
			})),
		};
	}
}
