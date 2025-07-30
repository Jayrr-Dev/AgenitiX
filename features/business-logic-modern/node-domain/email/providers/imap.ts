/**
 * IMAP Provider Implementation
 *
 * Handles manual IMAP configuration and connection validation.
 */

import type {
	ConfigField,
	ConnectionResult,
	EmailAccountConfig,
	ProviderCapabilities,
} from "../types";
import { createEmailError } from "../utils";
import { BaseEmailProvider } from "./base";

// Common IMAP configurations for popular providers
const COMMON_IMAP_CONFIGS = {
	"gmail.com": { host: "imap.gmail.com", port: 993, ssl: true },
	"outlook.com": { host: "outlook.office365.com", port: 993, ssl: true },
	"hotmail.com": { host: "outlook.office365.com", port: 993, ssl: true },
	"yahoo.com": { host: "imap.mail.yahoo.com", port: 993, ssl: true },
	"icloud.com": { host: "imap.mail.me.com", port: 993, ssl: true },
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
		return "IMAP host is required";
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

const imapConfigFields: ConfigField[] = [
	{
		key: "email",
		label: "Email Address",
		type: "text",
		required: true,
		placeholder: "your.email@example.com",
		validation: validateEmail,
	},
	{
		key: "imapHost",
		label: "IMAP Server",
		type: "text",
		required: true,
		placeholder: "imap.example.com",
		validation: validateHost,
	},
	{
		key: "imapPort",
		label: "IMAP Port",
		type: "number",
		required: true,
		placeholder: "993",
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
		key: "useSSL",
		label: "Use SSL",
		type: "select",
		required: true,
		options: [
			{ value: "true", label: "Yes (Recommended)" },
			{ value: "false", label: "No" },
		],
	},
];

function validateImapConnection(config: EmailAccountConfig): Promise<ConnectionResult> {
	try {
		// Basic validation of config
		if (!(config.imapHost && config.imapPort)) {
			return Promise.resolve({
				success: false,
				error: createEmailError(
					"CONFIGURATION_INVALID",
					"IMAP host and port are required",
					{ provider: "imap" },
					true
				),
			});
		}

		// Validate required fields
		const requiredFields = ["email", "imapHost", "imapPort", "username", "password"] as const;
		for (const field of requiredFields) {
			const value = config[field];
			if (!value || (typeof value === "string" && value.trim() === "")) {
				return Promise.resolve({
					success: false,
					error: createEmailError(
						"CONFIGURATION_INVALID",
						`${field} is required for IMAP configuration`,
						{ provider: "imap", field },
						true
					),
				});
			}
		}

		// Validate port range
		if (config.imapPort && (config.imapPort < 1 || config.imapPort > 65535)) {
			return Promise.resolve({
				success: false,
				error: createEmailError(
					"CONFIGURATION_INVALID",
					"IMAP port must be between 1 and 65535",
					{ provider: "imap", port: config.imapPort },
					true
				),
			});
		}

		// Auto-configure common providers
		const domain = config.email.split("@")[1];
		const commonConfig = COMMON_IMAP_CONFIGS[domain as keyof typeof COMMON_IMAP_CONFIGS];

		if (commonConfig) {
			// Suggest common configuration if user hasn't set it correctly
			if (config.imapHost !== commonConfig.host || config.imapPort !== commonConfig.port) {
				return Promise.resolve({
					success: false,
					error: createEmailError(
						"CONFIGURATION_INVALID",
						`For ${domain}, recommended settings: Host: ${commonConfig.host}, Port: ${commonConfig.port}, SSL: ${commonConfig.ssl ? "Yes" : "No"}`,
						{
							provider: "imap",
							domain,
							recommended: commonConfig,
							current: {
								host: config.imapHost,
								port: config.imapPort,
								ssl: config.useSSL,
							},
						},
						true
					),
				});
			}
		}

		// In a real implementation, this would test actual IMAP connection
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
				error instanceof Error ? error.message : "Unknown error during IMAP validation",
				{ provider: "imap", originalError: error },
				true
			),
		});
	}
}

class ImapProvider extends BaseEmailProvider {
	readonly id = "imap" as const;
	readonly name = "IMAP";
	readonly authType = "manual" as const;
	readonly configFields = imapConfigFields;

	readonly capabilities: ProviderCapabilities = {
		canSend: false, // IMAP is for receiving only
		canReceive: true,
		supportsAttachments: true,
		supportsHtml: true,
		rateLimit: {
			requestsPerMinute: 30,
			requestsPerHour: 1800,
			requestsPerDay: 43200,
		},
	};

	readonly defaultConfig = {
		imapPort: 993,
		useSSL: true,
	};

	validateConnection(config: EmailAccountConfig): Promise<ConnectionResult> {
		return validateImapConnection(config);
	}
}

export const imapProvider = new ImapProvider();
