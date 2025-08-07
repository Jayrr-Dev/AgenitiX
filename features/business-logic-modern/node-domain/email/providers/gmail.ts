/**
 * Gmail Provider Implementation
 *
 * Handles Gmail-specific OAuth2 authentication and connection validation.
 */

import type {
	ConnectionResult,
	EmailAccountConfig,
	EmailMessage,
	EmailAddress,
	EmailAttachment,
	OAuth2Tokens,
	ProviderCapabilities,
} from "../types";
import { createEmailError } from "../utils";
import { BaseEmailProvider } from "./base";

// Gmail OAuth2 configuration
const GMAIL_OAUTH_CONFIG = {
	clientId:
		process.env.NEXT_PUBLIC_GMAIL_CLIENT_ID ||
		"924539398543-ojqqummnk3593k1fm1803cl28t274tmo.apps.googleusercontent.com",
	clientSecret: process.env.GMAIL_CLIENT_SECRET || "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",
	redirectUri: "http://localhost:3000/api/auth/email/gmail/callback",
	scope:
		"https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/gmail.readonly",
	authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
	tokenUrl: "https://oauth2.googleapis.com/token",
};

async function validateGmailConnection(config: EmailAccountConfig): Promise<ConnectionResult> {
	try {
		if (!config.accessToken) {
			return {
				success: false,
				error: createEmailError(
					"INVALID_CREDENTIALS",
					"Gmail access token is required",
					{ provider: "gmail" },
					true
				),
			};
		}

		// Test connection by fetching user profile
		const response = await fetch("https://www.googleapis.com/gmail/v1/users/me/profile", {
			headers: {
				Authorization: `Bearer ${config.accessToken}`,
				"Content-Type": "application/json",
			},
		});

		if (!response.ok) {
			if (response.status === 401) {
				return {
					success: false,
					error: createEmailError(
						"TOKEN_EXPIRED",
						"Gmail access token has expired. Please re-authenticate.",
						{ provider: "gmail", status: response.status },
						true
					),
				};
			}

			if (response.status === 403) {
				return {
					success: false,
					error: createEmailError(
						"PERMISSION_DENIED",
						"Gmail API access denied. Please check your permissions.",
						{ provider: "gmail", status: response.status },
						true
					),
				};
			}

			if (response.status === 429) {
				return {
					success: false,
					error: createEmailError(
						"RATE_LIMIT_EXCEEDED",
						"Gmail API rate limit exceeded. Please try again later.",
						{ provider: "gmail", status: response.status },
						true,
						300 // 5 minutes
					),
				};
			}

			return {
				success: false,
				error: createEmailError(
					"PROVIDER_ERROR",
					`Gmail API error: ${response.status} ${response.statusText}`,
					{ provider: "gmail", status: response.status },
					false
				),
			};
		}

		const profile = await response.json();

		// Validate that we have the expected data
		if (!profile.emailAddress) {
			return {
				success: false,
				error: createEmailError(
					"PROVIDER_ERROR",
					"Gmail profile data is incomplete",
					{ provider: "gmail", profile },
					false
				),
			};
		}

		return {
			success: true,
			accountInfo: {
				email: profile.emailAddress,
				displayName: profile.emailAddress,
				quotaUsed: profile.messagesTotal || 0,
				quotaTotal: profile.threadsTotal || 0,
			},
		};
	} catch (error) {
		return {
			success: false,
			error: createEmailError(
				"NETWORK_ERROR",
				error instanceof Error ? error.message : "Unknown network error",
				{ provider: "gmail", originalError: error },
				true
			),
		};
	}
}

async function exchangeGmailCodeForTokens(
	code: string,
	redirectUri: string
): Promise<OAuth2Tokens> {
	const response = await fetch(GMAIL_OAUTH_CONFIG.tokenUrl, {
		method: "POST",
		headers: {
			"Content-Type": "application/x-www-form-urlencoded",
		},
		body: new URLSearchParams({
			client_id: GMAIL_OAUTH_CONFIG.clientId,
			client_secret: GMAIL_OAUTH_CONFIG.clientSecret,
			code,
			grant_type: "authorization_code",
			redirect_uri: redirectUri,
		}),
	});

	if (!response.ok) {
		throw new Error(`Failed to exchange code for tokens: ${response.statusText}`);
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

class GmailProvider extends BaseEmailProvider {
	readonly id = "gmail" as const;
	readonly name = "Gmail";
	readonly authType = "oauth2" as const;
	readonly configFields = []; // OAuth2 providers don't need manual config fields

	readonly capabilities: ProviderCapabilities = {
		canSend: true,
		canReceive: true,
		supportsAttachments: true,
		supportsHtml: true,
		maxAttachmentSize: 25 * 1024 * 1024, // 25MB
		rateLimit: {
			requestsPerMinute: 250,
			requestsPerHour: 1000,
			requestsPerDay: 1000000,
		},
	};

	readonly defaultConfig = {
		useSSL: true,
	};

	validateConnection(config: EmailAccountConfig): Promise<ConnectionResult> {
		return validateGmailConnection(config);
	}

	getOAuthUrl(redirectUri: string, state?: string): string {
		const params = new URLSearchParams({
			client_id: GMAIL_OAUTH_CONFIG.clientId,
			redirect_uri: redirectUri,
			response_type: "code",
			scope: GMAIL_OAUTH_CONFIG.scope,
			access_type: "offline",
			prompt: "consent",
			...(state && { state }),
		});
		return `${GMAIL_OAUTH_CONFIG.authUrl}?${params.toString()}`;
	}

	exchangeCodeForTokens(code: string, redirectUri: string): Promise<OAuth2Tokens> {
		return exchangeGmailCodeForTokens(code, redirectUri);
	}

	async refreshTokens(refreshToken: string): Promise<OAuth2Tokens> {
		const response = await fetch(GMAIL_OAUTH_CONFIG.tokenUrl, {
			method: "POST",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
			},
			body: new URLSearchParams({
				client_id: GMAIL_OAUTH_CONFIG.clientId,
				client_secret: GMAIL_OAUTH_CONFIG.clientSecret,
				refresh_token: refreshToken,
				grant_type: "refresh_token",
			}),
		});

		if (!response.ok) {
			throw new Error(`Failed to refresh tokens: ${response.statusText}`);
		}

		const data = await response.json();

		return {
			accessToken: data.access_token,
			refreshToken: refreshToken, // Gmail doesn't return new refresh token
			expiresIn: data.expires_in,
			tokenType: data.token_type,
			scope: data.scope,
		};
	}

	/**
	 * Read emails from Gmail using the Gmail API
	 */
	async readEmails(options: {
		accessToken: string;
		folder?: string;
		limit?: number;
		query?: string;
	}): Promise<EmailMessage[]> {
		try {
			const { accessToken, folder = 'INBOX', limit = 10, query = '' } = options;

			// Build Gmail API query
			let gmailQuery = `in:${folder.toLowerCase()}`;
			if (query) {
				gmailQuery += ` ${query}`;
			}

			// Get message list
			const listResponse = await this.makeAuthenticatedRequest(
				`https://www.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(gmailQuery)}&maxResults=${limit}`,
				accessToken
			);

			const listData = await listResponse.json();
			
			if (!listData.messages || listData.messages.length === 0) {
				return [];
			}

			// Get full message details for each message
			const messages: EmailMessage[] = [];
			
			for (const messageRef of listData.messages) {
				try {
					const messageResponse = await this.makeAuthenticatedRequest(
						`https://www.googleapis.com/gmail/v1/users/me/messages/${messageRef.id}`,
						accessToken
					);
					
					const messageData = await messageResponse.json();
					const emailMessage = this.parseGmailMessage(messageData);
					messages.push(emailMessage);
				} catch (error) {
					console.error(`Failed to fetch message ${messageRef.id}:`, error);
					// Continue with other messages
				}
			}

			return messages;
		} catch (error) {
			console.error('Gmail readEmails error:', error);
			throw new Error(`Failed to read Gmail messages: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
	}

	/**
	 * Parse Gmail API message format to our EmailMessage format
	 */
	private parseGmailMessage(gmailMessage: any): EmailMessage {
		const headers = gmailMessage.payload?.headers || [];
		const getHeader = (name: string) => headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value || '';

		// Parse email addresses
		const parseEmailAddress = (addressString: string): EmailAddress => {
			const match = addressString.match(/^(.+?)\s*<(.+?)>$/) || addressString.match(/^(.+)$/);
			if (match && match[2]) {
				return { name: match[1].trim(), email: match[2].trim() };
			}
			return { email: addressString.trim() };
		};

		const parseEmailAddresses = (addressString: string): EmailAddress[] => {
			if (!addressString) return [];
			return addressString.split(',').map(addr => parseEmailAddress(addr.trim()));
		};

		// Extract text content
		let textContent = '';
		let htmlContent = '';

		const extractContent = (part: any) => {
			if (part.mimeType === 'text/plain' && part.body?.data) {
				textContent = Buffer.from(part.body.data, 'base64').toString('utf-8');
			} else if (part.mimeType === 'text/html' && part.body?.data) {
				htmlContent = Buffer.from(part.body.data, 'base64').toString('utf-8');
			} else if (part.parts) {
				part.parts.forEach(extractContent);
			}
		};

		if (gmailMessage.payload) {
			extractContent(gmailMessage.payload);
		}

		// Parse attachments
		const attachments: EmailAttachment[] = [];
		const extractAttachments = (part: any) => {
			if (part.filename && part.body?.attachmentId) {
				attachments.push({
					id: part.body.attachmentId,
					filename: part.filename,
					name: part.filename, // Agregar campo name requerido
					mimeType: part.mimeType || 'application/octet-stream',
					type: part.mimeType || 'application/octet-stream', // Agregar campo type requerido
					size: part.body.size || 0,
					isInline: part.headers?.some((h: any) => h.name.toLowerCase() === 'content-disposition' && h.value.includes('inline')) || false,
					contentId: part.headers?.find((h: any) => h.name.toLowerCase() === 'content-id')?.value,
					isDownloaded: false,
				});
			} else if (part.parts) {
				part.parts.forEach(extractAttachments);
			}
		};

		if (gmailMessage.payload) {
			extractAttachments(gmailMessage.payload);
		}

		return {
			id: gmailMessage.id,
			threadId: gmailMessage.threadId,
			provider: 'gmail',
			from: parseEmailAddress(getHeader('From')),
			to: parseEmailAddresses(getHeader('To')),
			cc: parseEmailAddresses(getHeader('Cc')),
			bcc: parseEmailAddresses(getHeader('Bcc')),
			subject: getHeader('Subject'),
			textContent: textContent || gmailMessage.snippet || '',
			htmlContent,
			snippet: gmailMessage.snippet || '',
			date: parseInt(gmailMessage.internalDate) || Date.now(), // Timestamp en lugar de Date object
			isRead: !gmailMessage.labelIds?.includes('UNREAD'),
			isImportant: gmailMessage.labelIds?.includes('IMPORTANT') || false,
			labels: gmailMessage.labelIds || [],
			attachments,
			hasAttachments: attachments.length > 0,
			isProcessed: false,
		};
	}

	/**
	 * Send email using Gmail API
	 */
	async sendEmail(options: {
		accessToken: string;
		to: string[];
		cc?: string[];
		bcc?: string[];
		subject: string;
		textContent?: string;
		htmlContent?: string;
		attachments?: EmailAttachment[];
	}): Promise<{ messageId: string; success: boolean }> {
		try {
			const { 
				accessToken, 
				to, 
				cc = [], 
				bcc = [], 
				subject, 
				textContent = '', 
				htmlContent = '',
				attachments = []
			} = options;

			// Build email message in RFC 2822 format
			const boundary = `boundary_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
			
			let emailContent = '';
			
			// Headers
			emailContent += `To: ${to.join(', ')}\r\n`;
			if (cc.length > 0) {
				emailContent += `Cc: ${cc.join(', ')}\r\n`;
			}
			if (bcc.length > 0) {
				emailContent += `Bcc: ${bcc.join(', ')}\r\n`;
			}
			emailContent += `Subject: ${subject}\r\n`;
			emailContent += `MIME-Version: 1.0\r\n`;
			
			if (attachments.length > 0 || htmlContent) {
				emailContent += `Content-Type: multipart/mixed; boundary="${boundary}"\r\n`;
			} else {
				emailContent += `Content-Type: text/plain; charset=utf-8\r\n`;
			}
			
			emailContent += `\r\n`;

			// Body content
			if (attachments.length > 0 || htmlContent) {
				// Multipart message
				if (htmlContent && textContent) {
					// Both HTML and text
					emailContent += `--${boundary}\r\n`;
					emailContent += `Content-Type: multipart/alternative; boundary="${boundary}_alt"\r\n\r\n`;
					
					emailContent += `--${boundary}_alt\r\n`;
					emailContent += `Content-Type: text/plain; charset=utf-8\r\n\r\n`;
					emailContent += `${textContent}\r\n`;
					
					emailContent += `--${boundary}_alt\r\n`;
					emailContent += `Content-Type: text/html; charset=utf-8\r\n\r\n`;
					emailContent += `${htmlContent}\r\n`;
					
					emailContent += `--${boundary}_alt--\r\n`;
				} else if (htmlContent) {
					// HTML only
					emailContent += `--${boundary}\r\n`;
					emailContent += `Content-Type: text/html; charset=utf-8\r\n\r\n`;
					emailContent += `${htmlContent}\r\n`;
				} else {
					// Text only
					emailContent += `--${boundary}\r\n`;
					emailContent += `Content-Type: text/plain; charset=utf-8\r\n\r\n`;
					emailContent += `${textContent}\r\n`;
				}

				// Add attachments (simplified - would need proper base64 encoding)
				for (const attachment of attachments) {
					emailContent += `--${boundary}\r\n`;
					emailContent += `Content-Type: ${attachment.mimeType}\r\n`;
					emailContent += `Content-Disposition: attachment; filename="${attachment.filename}"\r\n`;
					emailContent += `Content-Transfer-Encoding: base64\r\n\r\n`;
					// Note: In a real implementation, you'd need to properly encode the attachment
					emailContent += `[Attachment content would go here]\r\n`;
				}
				
				emailContent += `--${boundary}--\r\n`;
			} else {
				// Simple text message
				emailContent += textContent;
			}

			// Encode the message in base64url format
			const encodedMessage = Buffer.from(emailContent)
				.toString('base64')
				.replace(/\+/g, '-')
				.replace(/\//g, '_')
				.replace(/=+$/, '');

			// Send via Gmail API
			const response = await this.makeAuthenticatedRequest(
				'https://www.googleapis.com/gmail/v1/users/me/messages/send',
				accessToken,
				{
					method: 'POST',
					body: JSON.stringify({
						raw: encodedMessage
					})
				}
			);

			const result = await response.json();

			return {
				messageId: result.id,
				success: true
			};

		} catch (error) {
			console.error('Gmail sendEmail error:', error);
			throw new Error(`Failed to send email: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
	}
}

export const gmailProvider = new GmailProvider();
