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
		if (!config.email || !validateEmailAddress(config.email)) {
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

	protected async handleConnectionError(error: any, context: string): Promise<ConnectionResult> {
		console.error(`${this.name} ${context} error:`, error);

		if (error instanceof Error) {
			// Network errors
			if (error.message.includes("fetch") || error.message.includes("network")) {
				return {
					success: false,
					error: createEmailError(
						"NETWORK_ERROR",
						"Network connection failed. Please check your internet connection.",
						{ originalError: error.message },
						true
					),
				};
			}

			// Timeout errors
			if (error.message.includes("timeout")) {
				return {
					success: false,
					error: createEmailError(
						"CONNECTION_TIMEOUT",
						"Connection timed out. Please try again.",
						{ originalError: error.message },
						true
					),
				};
			}

			// Authentication errors
			if (error.message.includes("401") || error.message.includes("unauthorized")) {
				return {
					success: false,
					error: createEmailError(
						"AUTHENTICATION_FAILED",
						"Authentication failed. Please check your credentials.",
						{ originalError: error.message },
						true
					),
				};
			}

			// Rate limiting
			if (error.message.includes("429") || error.message.includes("rate limit")) {
				return {
					success: false,
					error: createEmailError(
						"RATE_LIMIT_EXCEEDED",
						"Rate limit exceeded. Please try again later.",
						{ originalError: error.message },
						true,
						300 // 5 minutes
					),
				};
			}
		}

		// Generic error
		return {
			success: false,
			error: createEmailError(
				"PROVIDER_ERROR",
				error instanceof Error ? error.message : "Unknown provider error",
				{ originalError: error },
				false
			),
		};
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
