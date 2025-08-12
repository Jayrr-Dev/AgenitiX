/**
 * Route: convex/sendEmails.ts
 * CONVEX RESEND INTEGRATION – Centralized Resend instance, webhook handling, and event dispatch
 *
 * • Single `Resend` instance wired to Convex Components
 * • Secure webhook handling via `handleResendEventWebhook`
 * • Internal event handler for delivery/bounce/complaint lifecycle updates
 *
 * Keywords: convex, resend, email, webhook, delivery-status
 */

import { Resend, vEmailEvent, vEmailId } from "@convex-dev/resend";
import { components, internal } from "./_generated/api";
import { internalMutation } from "./_generated/server";

// Environment-aware test mode, basically prevent real sends in development
const RESEND_TEST_MODE: boolean = process.env.NODE_ENV !== "production";

// Optional: pass webhook secret explicitly, basically allow signature verification in component
const RESEND_WEBHOOK_SECRET: string | undefined =
  process.env.RESEND_WEBHOOK_SECRET;

export const resend: Resend = new Resend(components.resend, {
  testMode: RESEND_TEST_MODE,
  webhookSecret: RESEND_WEBHOOK_SECRET,
  // Forward events to internal handler, basically centralize email status updates
  onEmailEvent: internal.sendEmails.handleEmailEvent,
});

export const handleEmailEvent = internalMutation({
  args: {
    id: vEmailId,
    event: vEmailEvent,
  },
  async handler(ctx, args) {
    // Persist or react to status transitions, basically update analytics or user notifications
    // No-op for now; hook is wired and secured via webhook signature
  },
});
