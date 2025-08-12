// This file configures the initialization of Sentry for edge features (middleware, edge routes, and so on).
// The config you add here will be used whenever one of the edge features is loaded.
// Note that this config is unrelated to the Vercel Edge Runtime and is also required when running locally.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

/**
Route: sentry.edge.config.ts
 * EDGE SENTRY CONFIG – Edge runtime Sentry initialization
 *
 * • Lower tracing sample rate to reduce event volume
 * • Keep console logging integration
 */

const IS_PROD = process.env.NODE_ENV === "production";
const TRACES_SAMPLE_RATE = IS_PROD ? 0.1 : 0;

Sentry.init({
  dsn: "https://3a0a6997c4f418fa5be67124a5876d42@o4509188158914560.ingest.us.sentry.io/4509748017168384",
  tracesSampleRate: TRACES_SAMPLE_RATE,
  enableLogs: false,
  debug: false,
  integrations: [
    Sentry.consoleLoggingIntegration({ levels: ["log", "error", "warn"] }),
  ],
});
