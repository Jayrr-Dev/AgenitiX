/**
 * Route: convex/sendEmails.ts
 * CONVEX RESEND INTEGRATION – Centralized Resend instance & optional hooks
 *
 * • Exposes a single `resend` instance wired to Convex Components
 * • Used by HTTP router to handle Resend webhooks for delivery/bounce events
 * • Can be imported by actions/mutations to send emails in a consistent way
 *
 * Keywords: convex, resend, email, webhook, delivery-status
 */

import { Resend } from "@convex-dev/resend";
import { components } from "./_generated/api";

export const resend: Resend = new Resend(components.resend, {
  // Production mode: test mode disabled, basically allow real email sending
  testMode: false,
});
