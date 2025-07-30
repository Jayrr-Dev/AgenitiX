/**
 * Email Service for Magic Links
 *
 * For development: Logs to console
 * For production: Replace with real email service (Resend, SendGrid, etc.)
 */

export interface MagicLinkEmailData {
	to: string;
	name: string;
	magicToken: string;
	type: "verification" | "login";
}

export interface EmailResult {
	success: boolean;
	messageId?: string;
	error?: string;
	magicLinkUrl?: string; // For development testing
}

/**
 * Send magic link email
 * TODO: Replace with real email service in production
 */
export async function sendMagicLinkEmail(data: MagicLinkEmailData): Promise<EmailResult> {
	const { to, name, magicToken, type } = data;
	console.log(`Sending ${type} email to ${to} with magic token ${magicToken}`);
	// Generate magic link URL - always use localhost in development
	const baseUrl =
		process.env.NODE_ENV === "development"
			? "http://localhost:3000"
			: process.env.NEXT_PUBLIC_APP_URL || "https://agenitix.com";
	const magicLinkUrl = `${baseUrl}/auth/verify?token=${magicToken}`;

	// Email content based on type
	const emailContent =
		type === "verification"
			? {
					subject: "🚀 Welcome to AgenitiX - Verify your account",
					html: `
				<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
					<div style="background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); padding: 40px 20px; text-align: center;">
						<h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">Welcome to AgenitiX!</h1>
						<p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Visual Flow Automation Platform</p>
					</div>
					<div style="padding: 40px 20px;">
						<p style="font-size: 16px; color: #374151; margin: 0 0 20px 0;">Hi ${name},</p>
						<p style="font-size: 16px; color: #374151; line-height: 1.6; margin: 0 0 30px 0;">
							Thanks for signing up! You're just one click away from building powerful automation workflows. 
							Click the button below to verify your account and get started.
						</p>
						<div style="text-align: center; margin: 40px 0;">
							<a href="${magicLinkUrl}" 
							   style="background: #3b82f6; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);">
								✨ Verify Account & Sign In
							</a>
						</div>
						<div style="background: #f9fafb; padding: 20px; border-radius: 8px; border-left: 4px solid #3b82f6;">
							<p style="margin: 0; font-size: 14px; color: #6b7280;">
								<strong>Security note:</strong> This link will expire in 15 minutes for your security. 
								If you didn't create an account, you can safely ignore this email.
							</p>
						</div>
						<p style="font-size: 14px; color: #9ca3af; margin: 30px 0 0 0; line-height: 1.5;">
							Having trouble with the button? Copy and paste this URL into your browser:<br>
							<a href="${magicLinkUrl}" style="color: #3b82f6; word-break: break-all;">${magicLinkUrl}</a>
						</p>
					</div>
					<div style="background: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
						<p style="margin: 0; font-size: 12px; color: #9ca3af;">
							© 2025 AgenitiX. All rights reserved.
						</p>
					</div>
				</div>
			`,
				}
			: {
					subject: "🔐 Your AgenitiX magic link is here",
					html: `
				<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
					<div style="background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); padding: 40px 20px; text-align: center;">
						<h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">Sign in to AgenitiX</h1>
						<p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Your magic link is ready</p>
					</div>
					<div style="padding: 40px 20px;">
						<p style="font-size: 16px; color: #374151; margin: 0 0 20px 0;">Hi ${name},</p>
						<p style="font-size: 16px; color: #374151; line-height: 1.6; margin: 0 0 30px 0;">
							Click the button below to sign in to your AgenitiX account and continue building your automation workflows.
						</p>
						<div style="text-align: center; margin: 40px 0;">
							<a href="${magicLinkUrl}" 
							   style="background: #3b82f6; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);">
								🚀 Sign In to AgenitiX
							</a>
						</div>
						<div style="background: #f9fafb; padding: 20px; border-radius: 8px; border-left: 4px solid #3b82f6;">
							<p style="margin: 0; font-size: 14px; color: #6b7280;">
								<strong>Security note:</strong> This link will expire in 15 minutes. 
								If you didn't request this, you can safely ignore this email.
							</p>
						</div>
						<p style="font-size: 14px; color: #9ca3af; margin: 30px 0 0 0; line-height: 1.5;">
							Having trouble with the button? Copy and paste this URL into your browser:<br>
							<a href="${magicLinkUrl}" style="color: #3b82f6; word-break: break-all;">${magicLinkUrl}</a>
						</p>
					</div>
					<div style="background: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
						<p style="margin: 0; font-size: 12px; color: #9ca3af;">
							© 2025 AgenitiX. All rights reserved.
						</p>
					</div>
				</div>
			`,
				};

	// For development: Log to console
	if (process.env.NODE_ENV === "development") {
		// Log the magic link to console for development testing
		console.log("\n🔗 MAGIC LINK FOR DEVELOPMENT:");
		console.log("=".repeat(50));
		console.log(`📧 Email: ${to}`);
		console.log(`👤 Name: ${name}`);
		console.log(`🔗 Magic Link: ${magicLinkUrl}`);
		console.log(`📝 Type: ${type}`);
		console.log("=".repeat(50));
		console.log("💡 Copy the magic link above to test authentication\n");

		// Return the magic link URL for the API response
		return {
			success: true,
			messageId: `dev_${Date.now()}`,
			magicLinkUrl, // Include this for development testing
		};
	}

	// For production: Use Resend email service
	try {
		// Check if we have Resend API key
		if (!process.env.RESEND_API_KEY) {
			console.error("RESEND_API_KEY not found in environment variables");
			return {
				success: false,
				error: "Email service not configured. Please add RESEND_API_KEY to environment variables.",
			};
		}

		// Use Resend for production emails
		const { Resend } = await import("resend");
		const resend = new Resend(process.env.RESEND_API_KEY);

		const result = await resend.emails.send({
			from: "AgenitiX <noreply@agenitix.com>", // Try with a custom domain
			to: [to],
			subject: emailContent.subject,
			html: emailContent.html,
		});
		return { success: true, messageId: result.data?.id || "sent" };
	} catch (error) {
		console.error("❌ Email sending failed:", error);

		// Try fallback with Resend's default domain
		try {
			const { Resend } = await import("resend");
			const resend = new Resend(process.env.RESEND_API_KEY);

			const fallbackResult = await resend.emails.send({
				from: "onboarding@resend.dev", // Resend's default domain
				to: [to],
				subject: emailContent.subject,
				html: emailContent.html,
			});
			return { success: true, messageId: fallbackResult.data?.id || "sent" };
		} catch (fallbackError) {
			console.error("❌ Fallback email also failed:", fallbackError);
			return {
				success: false,
				error: `Email sending failed: ${error instanceof Error ? error.message : "Unknown error"}`,
			};
		}
	}
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return emailRegex.test(email);
}
