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

// Top‑level singleton for Resend component
const IS_DEV = process.env.NODE_ENV !== "production";

export const resend: Resend = new Resend(components.resend, {
  // Enable test mode in development so only Resend test addresses are accepted
  // [Explanation], basically keep dev safe and predictable
  testMode: IS_DEV,
});
