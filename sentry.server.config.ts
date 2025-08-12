// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

/**
Route: sentry.server.config.ts
 * SERVER SENTRY CONFIG – Node runtime Sentry initialization
 *
 * • Lower tracing sample rate in non-prod to reduce event volume
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
