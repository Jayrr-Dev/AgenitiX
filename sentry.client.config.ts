/**
Route: sentry.client.config.ts
 * CLIENT SENTRY CONFIG – Base client init used by Next instrumentation
 *
 * • Lowers tracing sample rate to avoid quota/rate limiting
 * • No Replay here (handled separately if enabled)
 *
 * Keywords: sentry, nextjs, client, tracing
 */

import * as Sentry from "@sentry/nextjs";

const IS_PROD = process.env.NODE_ENV === "production"; // [Explanation], basically toggle prod behavior
const TRACES_SAMPLE_RATE = IS_PROD ? 0.1 : 0; // [Explanation], basically reduce noise in dev

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: TRACES_SAMPLE_RATE,
  debug: false,
  enableLogs: false,
});
