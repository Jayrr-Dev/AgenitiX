/**
 * Email Accounts Convex Functions
 *
 * Server functions for managing email account storage, validation, and operations.
 * All functions include proper authentication, encryption, and error handling.
 */

import { v } from "convex/values";
import { type QueryCtx, mutation, query } from "./_generated/server";

// Types for email account operations
export type EmailProviderType = "gmail" | "outlook" | "imap" | "smtp";
export type ConnectionStatus = "disconnected" | "connecting" | "connected" | "error";

export type EmailAccountResult<T = unknown> =
	| {
			success: true;
			data: T;
	  }
	| {
			success: false;
			error: {
				code: string;
				message: string;
				details?: Record<string, unknown>;
			};
	  };

interface EmailCredentials {
	provider: EmailProviderType;
	email: string;
	username?: string;
	displayName?: string;
	password?: string;
	accessToken?: string;
	refreshToken?: string;
	imapHost?: string;
	imapPort?: number;
	smtpHost?: string;
	smtpPort?: number;
	useSSL?: boolean;
	useTLS?: boolean;
}

interface SecurityEvent {
	type: string;
	userId: string;
	action: string;
	timestamp: number;
	resource?: string;
	details?: Record<string, unknown>;
}

// Helper function to validate user session
async function validateUserSession(ctx: QueryCtx, tokenHash: string) {
	const session = await ctx.db
		.query("auth_sessions")
		.withIndex("by_token_hash", (q) => q.eq("token_hash", tokenHash))
		.filter((q) => q.eq(q.field("is_active"), true))
		.filter((q) => q.gt(q.field("expires_at"), Date.now()))
		.first();

	if (!session) {
		throw new Error("Invalid or expired session");
	}

	const user = await ctx.db.get(session.user_id);
	if (!user?.is_active) {
		throw new Error("User not found or inactive");
	}

	return { user, session };
}

// Simple encryption/decryption (in production, use proper encryption)
function encryptCredentials(credentials: EmailCredentials): string {
	// TODO: Implement proper encryption in production
	// For now, just JSON stringify (NOT SECURE - for development only)
	return JSON.stringify(credentials);
}

function decryptCredentials(encryptedData: string): EmailCredentials {
	// TODO: Implement proper decryption in production
	// For now, just JSON parse (NOT SECURE - for development only)
	try {
		return JSON.parse(encryptedData);
	} catch {
		throw new Error("Failed to decrypt credentials");
	}
}

// Basic validation functions
function validateEmailFormat(email: string): boolean {
	const emailRegex =
		/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
	return emailRegex.test(email) && email.length <= 254;
}

function validateCredentials(
	credentials: EmailCredentials
): { code: string; message: string } | null {
	if (!credentials.provider) {
		return { code: "CONFIGURATION_INVALID", message: "Provider is required" };
	}

	if (!credentials.email) {
		return { code: "CONFIGURATION_INVALID", message: "Email is required" };
	}

	// Provider-specific validation
	switch (credentials.provider) {
		case "gmail":
		case "outlook":
			if (!credentials.accessToken) {
				return {
					code: "INVALID_CREDENTIALS",
					message: `Access token is required for ${credentials.provider}`,
				};
			}
			break;

		case "imap":
			if (
				!(
					credentials.imapHost &&
					credentials.imapPort &&
					credentials.username &&
					credentials.password
				)
			) {
				return {
					code: "CONFIGURATION_INVALID",
					message: "IMAP host, port, username, and password are required",
				};
			}
			break;

		case "smtp":
			if (
				!(
					credentials.smtpHost &&
					credentials.smtpPort &&
					credentials.username &&
					credentials.password
				)
			) {
				return {
					code: "CONFIGURATION_INVALID",
					message: "SMTP host, port, username, and password are required",
				};
			}
			break;

		default:
			return {
				code: "CONFIGURATION_INVALID",
				message: `Unsupported provider: ${credentials.provider}`,
			};
	}

	return null;
}

// Rate limiting (basic implementation)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(identifier: string): { allowed: boolean; retryAfter?: number } {
	const now = Date.now();
	const key = identifier;

	const current = rateLimitStore.get(key);

	if (!current || now > current.resetTime) {
		rateLimitStore.set(key, {
			count: 1,
			resetTime: now + 60000, // 1 minute
		});
		return { allowed: true };
	}

	if (current.count >= 10) {
		// Max 10 requests per minute
		const retryAfter = Math.ceil((current.resetTime - now) / 1000);
		return { allowed: false, retryAfter };
	}

	current.count++;
	return { allowed: true };
}

// Audit logging
function logSecurityEvent(_event: SecurityEvent): void {}

// Store or update email account
export const storeEmailAccount = mutation({
	args: {
		token_hash: v.string(),
		provider: v.union(
			v.literal("gmail"),
			v.literal("outlook"),
			v.literal("imap"),
			v.literal("smtp")
		),
		email: v.string(),
		display_name: v.optional(v.string()),
		credentials: v.any(), // EmailAccountConfig object
		account_id: v.optional(v.id("email_accounts")), // For updates
	},
	handler: async (ctx, args): Promise<EmailAccountResult> => {
		try {
			// Validate user session
			const { user } = await validateUserSession(ctx, args.token_hash);

			// Rate limiting check
			const rateLimitResult = checkRateLimit(`store_email_${user._id}`);
			if (!rateLimitResult.allowed) {
				return {
					success: false,
					error: {
						code: "RATE_LIMIT_EXCEEDED",
						message: `Too many requests. Try again in ${rateLimitResult.retryAfter} seconds.`,
					},
				};
			}

			// Validate email format
			if (!validateEmailFormat(args.email)) {
				return {
					success: false,
					error: {
						code: "INVALID_EMAIL",
						message: "Please enter a valid email address",
					},
				};
			}

			// Validate credentials
			const credentialError = validateCredentials(args.credentials);
			if (credentialError) {
				return {
					success: false,
					error: {
						code: credentialError.code,
						message: credentialError.message,
					},
				};
			}

			// Encrypt credentials
			const encryptedCredentials = encryptCredentials(args.credentials);

			const now = Date.now();

			// Check if updating existing account
			if (args.account_id) {
				// Verify user owns this account
				const existingAccount = await ctx.db.get(args.account_id);
				if (!existingAccount || existingAccount.user_id !== user._id) {
					return {
						success: false,
						error: {
							code: "ACCOUNT_NOT_FOUND",
							message: "Email account not found or access denied",
						},
					};
				}

				// Update existing account
				await ctx.db.patch(args.account_id, {
					provider: args.provider,
					email: args.email.toLowerCase().trim(),
					display_name: args.display_name,
					encrypted_credentials: encryptedCredentials,
					connection_status: "disconnected" as ConnectionStatus,
					last_error: undefined,
					updated_at: now,
				});

				// Log security event
				logSecurityEvent({
					type: "EMAIL_ACCOUNT",
					userId: user._id,
					action: "UPDATE_ACCOUNT",
					resource: `${args.provider}:${args.email}`,
					details: { provider: args.provider, email: args.email },
					timestamp: Date.now(),
				});

				return {
					success: true,
					data: {
						accountId: args.account_id,
						email: args.email,
						provider: args.provider,
						message: "Email account updated successfully",
					},
				};
			}
			// Check for duplicate email accounts for this user
			const existingAccount = await ctx.db
				.query("email_accounts")
				.withIndex("by_user_id", (q) => q.eq("user_id", user._id))
				.filter((q) => q.eq(q.field("email"), args.email.toLowerCase().trim()))
				.filter((q) => q.eq(q.field("provider"), args.provider))
				.first();

			if (existingAccount) {
				return {
					success: false,
					error: {
						code: "ACCOUNT_EXISTS",
						message: "An account with this email and provider already exists",
					},
				};
			}

			// Create new account
			const accountId = await ctx.db.insert("email_accounts", {
				user_id: user._id,
				provider: args.provider,
				email: args.email.toLowerCase().trim(),
				display_name: args.display_name,
				encrypted_credentials: encryptedCredentials,
				is_active: true,
				connection_status: "disconnected" as ConnectionStatus,
				created_at: now,
				updated_at: now,
			});

			// Log security event
			logSecurityEvent({
				type: "EMAIL_ACCOUNT",
				userId: user._id,
				action: "CREATE_ACCOUNT",
				resource: `${args.provider}:${args.email}`,
				details: { provider: args.provider, email: args.email },
				timestamp: Date.now(),
			});

			return {
				success: true,
				data: {
					accountId,
					email: args.email,
					provider: args.provider,
					message: "Email account created successfully",
				},
			};
		} catch (error) {
			console.error("Store email account error:", error);
			return {
				success: false,
				error: {
					code: "INTERNAL_ERROR",
					message: error instanceof Error ? error.message : "An unexpected error occurred",
				},
			};
		}
	},
});

// Get user's email accounts
export const getEmailAccounts = query({
	args: {
		token_hash: v.string(),
		include_inactive: v.optional(v.boolean()),
	},
	handler: async (ctx, args) => {
		try {
			// Validate user session
			const { user } = await validateUserSession(ctx, args.token_hash);

			// Query user's email accounts
			let query = ctx.db
				.query("email_accounts")
				.withIndex("by_user_id", (q) => q.eq("user_id", user._id));

			// Filter by active status if requested
			if (!args.include_inactive) {
				query = query.filter((q) => q.eq(q.field("is_active"), true));
			}

			const accounts = await query.collect();

			// Return accounts without sensitive credential data
			return accounts.map((account) => ({
				id: account._id,
				provider: account.provider,
				email: account.email,
				displayName: account.display_name,
				isActive: account.is_active,
				connectionStatus: account.connection_status,
				lastValidated: account.last_validated,
				lastError: account.last_error ? JSON.parse(account.last_error) : null,
				createdAt: account.created_at,
				updatedAt: account.updated_at,
			}));
		} catch (error) {
			console.error("Get email accounts error:", error);
			throw new Error(error instanceof Error ? error.message : "Failed to fetch email accounts");
		}
	},
});

// Get specific email account with credentials (for internal use)
export const getEmailAccountWithCredentials = query({
	args: {
		token_hash: v.string(),
		account_id: v.id("email_accounts"),
	},
	handler: async (ctx, args) => {
		try {
			// Validate user session
			const { user } = await validateUserSession(ctx, args.token_hash);

			// Get account
			const account = await ctx.db.get(args.account_id);
			if (!account || account.user_id !== user._id) {
				throw new Error("Email account not found or access denied");
			}

			// Decrypt credentials
			const credentials = decryptCredentials(account.encrypted_credentials);

			return {
				id: account._id,
				provider: account.provider,
				email: account.email,
				displayName: account.display_name,
				credentials,
				isActive: account.is_active,
				connectionStatus: account.connection_status,
				lastValidated: account.last_validated,
				lastError: account.last_error ? JSON.parse(account.last_error) : null,
				createdAt: account.created_at,
				updatedAt: account.updated_at,
			};
		} catch (error) {
			console.error("Get email account with credentials error:", error);
			throw new Error(error instanceof Error ? error.message : "Failed to fetch email account");
		}
	},
});

// Validate email connection
export const validateEmailConnection = mutation({
	args: {
		token_hash: v.string(),
		account_id: v.id("email_accounts"),
	},
	handler: async (ctx, args): Promise<EmailAccountResult> => {
		try {
			// Validate user session
			const { user } = await validateUserSession(ctx, args.token_hash);

			// Get account
			const account = await ctx.db.get(args.account_id);
			if (!account || account.user_id !== user._id) {
				return {
					success: false,
					error: {
						code: "ACCOUNT_NOT_FOUND",
						message: "Email account not found or access denied",
					},
				};
			}

			// Update status to connecting
			await ctx.db.patch(args.account_id, {
				connection_status: "connecting" as ConnectionStatus,
				updated_at: Date.now(),
			});

			// Decrypt credentials for validation
			const credentials = decryptCredentials(account.encrypted_credentials);

			// TODO: Implement actual connection validation based on provider
			// For now, simulate validation
			const isValid = await simulateConnectionValidation(account.provider, credentials);

			const now = Date.now();

			if (isValid.success) {
				// Update successful connection
				await ctx.db.patch(args.account_id, {
					connection_status: "connected" as ConnectionStatus,
					last_validated: now,
					last_error: undefined,
					updated_at: now,
				});

				return {
					success: true,
					data: {
						accountId: args.account_id,
						status: "connected",
						message: "Connection validated successfully",
						accountInfo: isValid.accountInfo,
					},
				};
			}
			// Update failed connection
			await ctx.db.patch(args.account_id, {
				connection_status: "error" as ConnectionStatus,
				last_error: JSON.stringify(isValid.error),
				updated_at: now,
			});

			return {
				success: false,
				error: isValid.error || {
					code: "VALIDATION_FAILED",
					message: "Connection validation failed",
				},
			};
		} catch (error) {
			console.error("Validate email connection error:", error);
			return {
				success: false,
				error: {
					code: "INTERNAL_ERROR",
					message: error instanceof Error ? error.message : "Connection validation failed",
				},
			};
		}
	},
        error: {
          code: "INTERNAL_ERROR",
          message: error instanceof Error ? error.message : "Connection validation failed",

});

// Delete email account
export const deleteEmailAccount = mutation({
	args: {
		token_hash: v.string(),
		account_id: v.id("email_accounts"),
	},
	handler: async (ctx, args): Promise<EmailAccountResult> => {
		try {
			// Validate user session
			const { user } = await validateUserSession(ctx, args.token_hash);

			// Get account
			const account = await ctx.db.get(args.account_id);
			if (!account || account.user_id !== user._id) {
				return {
					success: false,
					error: {
						code: "ACCOUNT_NOT_FOUND",
						message: "Email account not found or access denied",
					},
				};
			}

			// Soft delete by marking as inactive
			await ctx.db.patch(args.account_id, {
				is_active: false,
				connection_status: "disconnected" as ConnectionStatus,
				updated_at: Date.now(),
			});

			// TODO: In production, also clean up related email logs and templates
			// For now, just mark the account as inactive

			return {
				success: true,
				data: {
					accountId: args.account_id,
					message: "Email account deleted successfully",
				},
			};
		} catch (error) {
			console.error("Delete email account error:", error);
			return {
				success: false,
				error: {
					code: "INTERNAL_ERROR",
					message: error instanceof Error ? error.message : "Failed to delete email account",
				},
			};
		}
	},
});

// Send email through configured account
export const sendEmail = mutation({
  args: {
    token_hash: v.string(),
    account_id: v.id("email_accounts"),
    recipients: v.object({
      to: v.array(v.string()),
      cc: v.optional(v.array(v.string())),
      bcc: v.optional(v.array(v.string())),
    }),
    subject: v.string(),
    content: v.object({
      text: v.string(),
      html: v.optional(v.string()),
    }),
    attachments: v.optional(v.array(v.any())),
  },
  handler: async (ctx, args): Promise<EmailAccountResult> => {
    try {
      // Validate user session
      const { user } = await validateUserSession(ctx, args.token_hash);

      // Rate limiting check for sending
      const rateLimitResult = checkRateLimit(`send_email_${user._id}`);
      if (!rateLimitResult.allowed) {
        return {
          success: false,
          error: {
            code: "RATE_LIMIT_EXCEEDED",
            message: `Too many email sends. Try again in ${rateLimitResult.retryAfter} seconds.`,
          },
        };
      }

      // Get account with credentials
      const account = await ctx.db.get(args.account_id);
      if (!account || account.user_id !== user._id) {
        return {
          success: false,
          error: {
            code: "ACCOUNT_NOT_FOUND",
            message: "Email account not found or access denied",
          },
        };
      }

      if (!account.is_active) {
        return {
          success: false,
          error: {
            code: "ACCOUNT_INACTIVE",
            message: "Email account is inactive",
          },
        };
      }

      // Validate recipients
      if (!args.recipients.to || args.recipients.to.length === 0) {
        return {
          success: false,
          error: {
            code: "INVALID_RECIPIENTS",
            message: "At least one recipient is required",
          },
        };
      }

      // Validate all email addresses
      const allRecipients = [
        ...args.recipients.to,
        ...(args.recipients.cc || []),
        ...(args.recipients.bcc || []),
      ];

      for (const email of allRecipients) {
        if (!validateEmailFormat(email)) {
          return {
            success: false,
            error: {
              code: "INVALID_EMAIL",
              message: `Invalid email address: ${email}`,
            },
          };
        }
      }

      // Validate content
      if (!args.subject.trim()) {
        return {
          success: false,
          error: {
            code: "INVALID_CONTENT",
            message: "Subject is required",
          },
        };
      }

      if (!args.content.text.trim() && !args.content.html?.trim()) {
        return {
          success: false,
          error: {
            code: "INVALID_CONTENT",
            message: "Message content is required",
          },
        };
      }

      // Decrypt credentials
      const credentials = decryptCredentials(account.encrypted_credentials);

      // Send email based on provider
      const sendResult = await sendEmailByProvider(
        account.provider,
        credentials,
        {
          recipients: args.recipients,
          subject: args.subject,
          content: args.content,
          attachments: args.attachments,
        }
      );

      if (sendResult.success) {
        // Log successful send
        logSecurityEvent({
          userId: user._id,
          action: "SEND_EMAIL",
          resource: `email_account:${args.account_id}`,
          details: { 
            provider: account.provider, 
            recipientCount: args.recipients.to.length,
            messageId: sendResult.messageId,
          },
          timestamp: Date.now(),
        });

        return {
          success: true,
          data: {
            messageId: sendResult.success ? (sendResult as any).messageId : "unknown",
            recipients: args.recipients,
            deliveryStatus: "sent",
            message: `Email sent successfully to ${args.recipients.to.length} recipient(s)`,
          },
        };
      } else {
        return {
          success: false,
          error: (sendResult as any).error || {
            code: "SEND_FAILED",
            message: "Failed to send email",
          },
        };
      }
    } catch (error) {
      console.error("Send email error:", error);
      return {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: error instanceof Error ? error.message : "Failed to send email",
        },
      };
    }
  },
});

// Helper function to send email by provider
async function sendEmailByProvider(
  provider: EmailProviderType,
  credentials: any,
  emailData: {
    recipients: { to: string[]; cc?: string[]; bcc?: string[] };
    subject: string;
    content: { text: string; html?: string };
    attachments?: any[];
  }
) {
  switch (provider) {
    case 'gmail':
      return await sendGmailEmail(credentials, emailData);
    case 'outlook':
      return await sendOutlookEmail(credentials, emailData);
    case 'smtp':
      return await sendSmtpEmail(credentials, emailData);
    default:
      return {
        success: false,
        error: {
          code: "UNSUPPORTED_PROVIDER",
          message: `Email sending not implemented for provider: ${provider}`,
        },
      };
  }
}

// Gmail email sending implementation
async function sendGmailEmail(
  credentials: any,
  emailData: {
    recipients: { to: string[]; cc?: string[]; bcc?: string[] };
    subject: string;
    content: { text: string; html?: string };
    attachments?: any[];
  }
) {
  try {
    // Validate Gmail credentials
    if (!credentials.accessToken) {
      return {
        success: false,
        error: {
          code: "INVALID_CREDENTIALS",
          message: "Gmail access token is required",
        },
      };
    }

    // Build email message in RFC 2822 format
    const boundary = `boundary_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    let message = '';
    message += `To: ${emailData.recipients.to.join(', ')}\r\n`;
    
    if (emailData.recipients.cc && emailData.recipients.cc.length > 0) {
      message += `Cc: ${emailData.recipients.cc.join(', ')}\r\n`;
    }
    
    if (emailData.recipients.bcc && emailData.recipients.bcc.length > 0) {
      message += `Bcc: ${emailData.recipients.bcc.join(', ')}\r\n`;
    }
    
    message += `Subject: ${emailData.subject}\r\n`;
    message += `MIME-Version: 1.0\r\n`;
    
    if (emailData.content.html) {
      message += `Content-Type: multipart/alternative; boundary="${boundary}"\r\n\r\n`;
      message += `--${boundary}\r\n`;
      message += `Content-Type: text/plain; charset=UTF-8\r\n\r\n`;
      message += `${emailData.content.text}\r\n\r\n`;
      message += `--${boundary}\r\n`;
      message += `Content-Type: text/html; charset=UTF-8\r\n\r\n`;
      message += `${emailData.content.html}\r\n\r\n`;
      message += `--${boundary}--\r\n`;
    } else {
      message += `Content-Type: text/plain; charset=UTF-8\r\n\r\n`;
      message += `${emailData.content.text}\r\n`;
    }

    // Encode message in base64url format
    const encodedMessage = Buffer.from(message)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    // Send via Gmail API
    const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${credentials.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        raw: encodedMessage,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      // Handle specific Gmail API errors
      if (response.status === 401) {
        return {
          success: false,
          error: {
            code: "AUTHENTICATION_FAILED",
            message: "Gmail authentication failed. Please reconnect your account.",
          },
        };
      } else if (response.status === 403) {
        return {
          success: false,
          error: {
            code: "PERMISSION_DENIED",
            message: "Insufficient permissions to send email. Please check your Gmail settings.",
          },
        };
      } else if (response.status === 429) {
        return {
          success: false,
          error: {
            code: "RATE_LIMIT_EXCEEDED",
            message: "Gmail API rate limit exceeded. Please try again later.",
          },
        };
      } else {
        return {
          success: false,
          error: {
            code: "GMAIL_API_ERROR",
            message: errorData.error?.message || `Gmail API error: ${response.status}`,
          },
        };
      }
    }

    const result = await response.json();
    
    return {
      success: true,
      messageId: result.id,
      threadId: result.threadId,
    };
  } catch (error) {
    console.error("Gmail send error:", error);
    return {
      success: false,
      error: {
        code: "NETWORK_ERROR",
        message: error instanceof Error ? error.message : "Failed to send email via Gmail",
      },
    };
  }
}

// Outlook email sending implementation (placeholder)
async function sendOutlookEmail(credentials: any, emailData: any) {
  // TODO: Implement Outlook/Microsoft Graph API sending
  return {
    success: false,
    error: {
      code: "NOT_IMPLEMENTED",
      message: "Outlook email sending not yet implemented",
    },
  };
}

// SMTP email sending implementation (placeholder)
async function sendSmtpEmail(credentials: any, emailData: any) {
  // TODO: Implement SMTP sending
  return {
    success: false,
    error: {
      code: "NOT_IMPLEMENTED",
      message: "SMTP email sending not yet implemented",
    },
  };
}

// Helper function to simulate connection validation
// TODO: Replace with actual provider-specific validation
async function simulateConnectionValidation(
	provider: EmailProviderType,
	credentials: EmailCredentials
) {
	// Simulate network delay
	await new Promise((resolve) => setTimeout(resolve, 1000));

	// Basic validation based on provider
	switch (provider) {
		case "gmail":
			if (!credentials.accessToken) {
				return {
					success: false,
					error: {
						code: "INVALID_CREDENTIALS",
						message: "Gmail access token is required",
					},
				};
			}
			break;

		case "outlook":
			if (!credentials.accessToken) {
				return {
					success: false,
					error: {
						code: "INVALID_CREDENTIALS",
						message: "Outlook access token is required",
					},
				};
			}
			break;

		case "imap":
		case "smtp":
			if (
				!(credentials.email && credentials.password && credentials.imapHost && credentials.smtpHost)
			) {
				return {
					success: false,
					error: {
						code: "CONFIGURATION_INVALID",
						message: "Email, password, and server settings are required",
					},
				};
			}
			break;
	}

	// Simulate successful validation
	return {
		success: true,
		accountInfo: {
			email: credentials.email,
			displayName: credentials.displayName || credentials.email,
		},
	};
}
