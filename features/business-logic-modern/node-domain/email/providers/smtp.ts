/**
 * SMTP Provider Implementation
 *
 * Handles manual SMTP configuration and connection validation.
 */

import type {
	ConfigField,
	ConnectionResult,
	EmailAccountConfig,
	ProviderCapabilities,
} from "../types";
import { createEmailError } from "../utils";
import { BaseEmailProvider } from "./base";

// Common SMTP configurations for popular providers
const _COMMON_SMTP_CONFIGS = {
	"gmail.com": { host: "smtp.gmail.com", port: 587, tls: true },
	"outlook.com": { host: "smtp-mail.outlook.com", port: 587, tls: true },
	"hotmail.com": { host: "smtp-mail.outlook.com", port: 587, tls: true },
	"yahoo.com": { host: "smtp.mail.yahoo.com", port: 587, tls: true },
	"icloud.com": { host: "smtp.mail.me.com", port: 587, tls: true },
};

function validateEmail(email: string): string | null {
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	if (!emailRegex.test(email)) {
		return "Please enter a valid email address";
	}
	return null;
}

function validateHost(host: string): string | null {
	if (!host || host.trim() === "") {
		return "SMTP host is required";
	}
	// Basic hostname validation
	const hostRegex = /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
	if (!hostRegex.test(host)) {
		return "Please enter a valid hostname";
	}
	return null;
}

function validatePort(port: number): string | null {
	if (!port || port < 1 || port > 65535) {
		return "Port must be between 1 and 65535";
	}
	return null;
}

const smtpConfigFields: ConfigField[] = [
	{
		key: "email",
		label: "Email Address",
		type: "text",
		required: true,
		placeholder: "your.email@example.com",
		validation: validateEmail,
	},
	{
		key: "smtpHost",
		label: "SMTP Server",
		type: "text",
		required: true,
		placeholder: "smtp.example.com",
		validation: validateHost,
	},
	{
		key: "smtpPort",
		label: "SMTP Port",
		type: "number",
		required: true,
		placeholder: "587",
		validation: validatePort,
	},
	{
		key: "username",
		label: "Username",
		type: "text",
		required: true,
		placeholder: "Usually your email address",
	},
	{
		key: "password",
		label: "Password",
		type: "password",
		required: true,
		placeholder: "Your email password or app password",
	},
	{
		key: "useTLS",
		label: "Use TLS",
		type: "select",
		required: true,
		options: [
			{ value: "true", label: "Yes (Recommended)" },
			{ value: "false", label: "No" },
		],
	},
];

function validateSmtpConnection(config: EmailAccountConfig): Promise<ConnectionResult> {
	try {
		// Basic validation of config
		if (!(config.smtpHost && config.smtpPort)) {
			return Promise.resolve({
				success: false,
				error: createEmailError(
					"CONFIGURATION_INVALID",
					"SMTP host and port are required",
					{ provider: "smtp" },
					true
				),
			});
		}

		// Validate required fields
		const requiredFields = ["email", "smtpHost", "smtpPort", "username", "password"] as const;
		for (const field of requiredFields) {
			const value = config[field];
			if (!value || (typeof value === "string" && value.trim() === "")) {
				return Promise.resolve({
					success: false,
					error: createEmailError(
						"CONFIGURATION_INVALID",
						`${field} is required for SMTP configuration`,
						{ provider: "smtp", field },
						true
					),
				});
			}
		}

		// Validate port range
		if (config.smtpPort && (config.smtpPort < 1 || config.smtpPort > 65535)) {
			return Promise.resolve({
				success: false,
				error: createEmailError(
					"CONFIGURATION_INVALID",
					"SMTP port must be between 1 and 65535",
					{ provider: "smtp", port: config.smtpPort },
					true
				),
			});
		}

		// In a real implementation, this would test actual SMTP connection
		// For now, we'll simulate success after basic validation
		return Promise.resolve({
			success: true,
			accountInfo: {
				email: config.email,
				displayName: config.displayName || config.email,
			},
		});
	} catch (error) {
		return Promise.resolve({
			success: false,
			error: createEmailError(
				"NETWORK_ERROR",
				error instanceof Error ? error.message : "Unknown error during SMTP validation",
				{ provider: "smtp", originalError: error },
				true
			),
		});
	}
}

class SmtpProvider extends BaseEmailProvider {
	readonly id = "smtp" as const;
	readonly name = "SMTP";
	readonly authType = "manual" as const;
	readonly configFields = smtpConfigFields;

	readonly capabilities: ProviderCapabilities = {
		canSend: true,
		canReceive: false, // SMTP is for sending only
		supportsAttachments: true,
		supportsHtml: true,
		rateLimit: {
			requestsPerMinute: 30,
			requestsPerHour: 1800,
			requestsPerDay: 43200,
		},
	};

	readonly defaultConfig = {
		smtpPort: 587,
		useTLS: true,
	};

	validateConnection(config: EmailAccountConfig): Promise<ConnectionResult> {
		return validateSmtpConnection(config);
	}
}

export const smtpProvider = new SmtpProvider();
