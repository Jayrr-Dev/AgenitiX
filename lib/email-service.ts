/**
 * Email Service for Magic Links
 *
 * For development: Uses React Email + Convex Resend component
 * For production: Uses React Email + Convex Resend component with proper tracking
 */

import { ConvexHttpClient } from "convex/browser";
import {
  PRODUCTION_EMAIL_CONFIG,
  shouldEnableTestMode,
} from "./production-config";

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
 * Send magic link email using React Email + Convex Resend component
 */
export async function sendMagicLinkEmail(
  data: MagicLinkEmailData
): Promise<EmailResult> {
  const { to, name, magicToken, type } = data;

  // Generate magic link URL, basically construct verification endpoint
  const baseUrl =
    process.env.NODE_ENV === "development"
      ? "http://localhost:3000"
      : process.env.NEXT_PUBLIC_APP_URL || "https://agenitix.com";
  const magicLinkUrl = `${baseUrl}/auth/verify?token=${magicToken}`;

  // For development without test mode, basically skip actual sending
  if (process.env.NODE_ENV === "development" && !shouldEnableTestMode()) {
    return {
      success: true,
      messageId: `dev_${Date.now()}`,
      magicLinkUrl,
    };
  }

  try {
    // Use Convex client to call email action, basically integrate with Convex Resend component
    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!convexUrl) {
      throw new Error("NEXT_PUBLIC_CONVEX_URL not configured");
    }

    const client = new ConvexHttpClient(convexUrl);

    // Extract IP and location from request if available, basically security context
    // Note: In a real implementation, you'd pass these from the calling context
    const requestFromIp = "Unknown IP";
    const requestFromLocation = "Unknown Location";

    // Call the Convex email action, basically use the emails module we created
    const result = await client.action("emails:sendMagicLinkEmail" as any, {
      to,
      name,
      magicLinkUrl,
      type,
      requestFromIp,
      requestFromLocation,
    });

    return {
      success: result.success,
      messageId: result.emailId || "sent",
    };
  } catch (error) {
    console.error("❌ Convex email sending failed:", error);

    // Fallback to legacy implementation if Convex fails, basically graceful degradation
    return await sendLegacyMagicLinkEmail(data);
  }
}

/**
 * Legacy email sending fallback, basically original inline HTML implementation
 */
async function sendLegacyMagicLinkEmail(
  data: MagicLinkEmailData
): Promise<EmailResult> {
  const { to, name, magicToken, type } = data;

  const baseUrl =
    process.env.NODE_ENV === "development"
      ? "http://localhost:3000"
      : process.env.NEXT_PUBLIC_APP_URL || "https://agenitix.com";
  const magicLinkUrl = `${baseUrl}/auth/verify?token=${magicToken}`;

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

  try {
    if (!PRODUCTION_EMAIL_CONFIG.resendApiKey) {
      return {
        success: false,
        error:
          "Email service not configured. Please add RESEND_API_KEY to environment variables.",
      };
    }

    const { Resend } = await import("resend");
    const resend = new Resend(PRODUCTION_EMAIL_CONFIG.resendApiKey);
    const fromEmail = PRODUCTION_EMAIL_CONFIG.resendFromEmail;

    const result = await resend.emails.send({
      from: fromEmail,
      to: [to],
      subject: emailContent.subject,
      html: emailContent.html,
    });

    if (result.error) {
      throw new Error(`Resend API error: ${result.error.message}`);
    }

    return { success: true, messageId: result.data?.id || "sent" };
  } catch (error) {
    console.error("❌ Legacy email sending failed:", error);
    return {
      success: false,
      error: `Email sending failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
