/**
 * Route: convex/emails.ts
 * CONVEX EMAIL ACTIONS - React Email + Resend integration for magic links
 *
 * • Uses React Email to generate HTML from JSX templates
 * • Integrates with Convex Resend component for reliable delivery
 * • Supports both verification and login magic link types
 * • Node action required for React Email dependencies
 *
 * Keywords: convex, react-email, resend, magic-link, node-action
 */

"use node";

import { render } from "@react-email/render";
import { v } from "convex/values";
// TODO: Fix React Email compatibility with React 19
// import { AgenitiXMagicLinkEmail } from "../react-email-starter/emails/agenitix-magic-link";
import { action } from "./_generated/server";
import { resend } from "./sendEmails";

const FROM_EMAIL = "noreply@agenitix.com";

export const sendMagicLinkEmail = action({
  args: {
    to: v.string(),
    name: v.string(),
    magicLinkUrl: v.string(),
    type: v.union(v.literal("verification"), v.literal("login")),
    requestFromIp: v.optional(v.string()),
    requestFromLocation: v.optional(v.string()),
  },
  async handler(ctx, args) {
    try {
      // Generate HTML from React Email template, basically render JSX to email-safe HTML
      const html = await render(
        AgenitiXMagicLinkEmail({
          name: args.name,
          magicLinkUrl: args.magicLinkUrl,
          type: args.type,
          requestFromIp: args.requestFromIp,
          requestFromLocation: args.requestFromLocation,
        })
      );

      // Determine subject based on type, basically contextual subject lines
      const subject =
        args.type === "verification"
          ? "🚀 Welcome to AgenitiX - Verify your account"
          : "🔐 Your AgenitiX magic link is here";

      // Send via Convex Resend component, basically queued and tracked delivery
      const emailId = await resend.sendEmail(ctx, {
        from: FROM_EMAIL,
        to: args.to,
        subject,
        html,
      });

      return {
        success: true,
        emailId,
      };
    } catch (error) {
      console.error("Failed to send magic link email:", error);
      throw new Error(
        `Email sending failed: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  },
});

export const sendTestEmail = action({
  args: {},
  async handler(ctx) {
    // Test email using React Email template, basically development verification
    const html = await render(
      AgenitiXMagicLinkEmail({
        name: "Test User",
        magicLinkUrl: "https://agenitix.com/auth/verify?token=test123",
        type: "verification",
        requestFromIp: "127.0.0.1",
        requestFromLocation: "Local Development",
      })
    );

    const emailId = await resend.sendEmail(ctx, {
      from: FROM_EMAIL,
      to: "delivered@resend.dev",
      subject: "🧪 Test Email - AgenitiX Magic Link",
      html,
    });

    return { success: true, emailId };
  },
});
