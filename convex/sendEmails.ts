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

import { components } from "./_generated/api";
import { Resend } from "@convex-dev/resend";

// Top‑level singleton for Resend component
export const resend: Resend = new Resend(components.resend, {
  // testMode: false, // Uncomment to allow delivery to real addresses in non-test environments
});




