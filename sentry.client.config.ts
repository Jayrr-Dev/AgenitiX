// This file configures the initialization of Sentry on the client side.
// The config you add here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://3a0a6997c4f418fa5be67124a5876d42@o4509188158914560.ingest.us.sentry.io/4509748017168384",

  // Set tracesSampleRate to 1.0 to capture 100%
  // of transactions for performance monitoring.
  // We recommend adjusting this value in production
  tracesSampleRate: 1.0,

  // Enable logs to be sent to Sentry
  enableLogs: true,

  // Capture Replay for 10% of all sessions,
  // plus for 100% of sessions with an error
  replaysSessionSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 0.5,
  replaysOnErrorSampleRate: 1.0,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: process.env.NODE_ENV === "development",

  integrations: [
    // Replay integration for session recordings
    Sentry.replayIntegration({
      // Privacy-focused configuration
      maskAllText: true,
      blockAllMedia: true,
      // Performance optimizations
      maskAllInputs: true,
      blockClass: "sentry-block",
      maskClass: "sentry-mask",
    }),
    // Console logging integration to capture console logs
    Sentry.consoleLoggingIntegration({ levels: ["error", "warn"] }),
  ],

  // Additional production optimizations
  beforeSend(event) {
    // Filter out development-only errors in production
    if (process.env.NODE_ENV === "production") {
      // Filter out chunk loading errors (common in deployments)
      if (event.exception?.values?.[0]?.type === "ChunkLoadError") {
        return null;
      }
      // Filter out network errors that aren't actionable
      if (event.exception?.values?.[0]?.type === "NetworkError") {
        return null;
      }
    }
    return event;
  },
});