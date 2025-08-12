/**
Route: instrumentation-client.ts
 * CLIENT SENTRY INIT – Client-side Sentry configuration
 *
 * • Disables/limits Replay to avoid 429 rate limits
 * • Reduces tracing in development
 * • Safe, environment-aware defaults
 *
 * Keywords: sentry, replay, rate-limiting, nextjs, client
 */

import * as Sentry from "@sentry/nextjs";

// Configuration constants (top-level), basically easy to tune
const IS_PROD = process.env.NODE_ENV === "production";
const DSN =
  process.env.NEXT_PUBLIC_SENTRY_DSN ||
  "https://5cb3c0fc918cf2322ec01a7e5aee6259@o4509188158914560.ingest.us.sentry.io/4509188159635456";

// Disable Replay to eliminate 429s for now
const ENABLE_REPLAY = false; // [Explanation], basically kill replay traffic

// Conservative sampling
const TRACES_SAMPLE_RATE = IS_PROD ? 0.1 : 0;
const REPLAY_SESSION_RATE = ENABLE_REPLAY ? (IS_PROD ? 0.01 : 0) : 0;
const REPLAY_ON_ERROR_RATE = ENABLE_REPLAY ? (IS_PROD ? 0.05 : 0) : 0;

Sentry.init({
  dsn: DSN,
  integrations: ENABLE_REPLAY ? [Sentry.replayIntegration()] : [],
  tracesSampleRate: TRACES_SAMPLE_RATE,
  enableLogs: false,
  replaysSessionSampleRate: REPLAY_SESSION_RATE,
  replaysOnErrorSampleRate: REPLAY_ON_ERROR_RATE,
  debug: false,
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
