/**
 * Route: lib/server-logger.ts
 * SERVER LOGGER – Structured production logging helper for Edge/Server runtimes
 *
 * • Normalizes error logging across middleware and API routes
 * • Redacts sensitive data and captures high-signal request context
 * • Sends logs to Sentry (if configured) and mirrors to console for Vercel
 * • Lightweight, zero client usage – server/edge only
 *
 * Keywords: logging, observability, sentry, structured-logs, edge, server
 */

import * as Sentry from "@sentry/nextjs";

// Redacted headers allowlist, basically safe diagnostics
const ALLOWED_HEADER_KEYS = new Set([
  "user-agent",
  "x-forwarded-for",
  "x-real-ip",
  "x-vercel-id",
  "cf-ray",
  "cf-connecting-ip",
  "x-request-id",
  "x-forwarded-proto",
]);

// Stable constants for runtime checks, basically environment guards
const IS_PRODUCTION = process.env.NODE_ENV === "production";

/**
 * Redact request headers, basically keep only safe diagnostics
 */
function pickSafeHeaders(headers: Headers): Record<string, string> {
  const safe: Record<string, string> = {};
  for (const [key, value] of headers.entries()) {
    const lower = key.toLowerCase();
    if (ALLOWED_HEADER_KEYS.has(lower)) {
      safe[lower] = value;
    }
  }
  return safe;
}

/**
 * Extract minimal request context for error logs, basically route + meta
 */
function getRequestContext(
  req: Request | { url: string; headers: Headers; method?: string }
) {
  const url = typeof req.url === "string" ? new URL(req.url) : undefined;
  return {
    path: url?.pathname,
    search: url?.search || "",
    method: (req as Request).method ?? "",
    headers: pickSafeHeaders(req.headers),
  };
}

/**
 * Convert unknown error to a serializable object, basically normalize errors
 */
function normalizeError(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }
  try {
    return { message: JSON.stringify(error) };
  } catch {
    return { message: String(error) };
  }
}

/**
 * Capture an operational error with context.
 */
export function logServerError(options: {
  error: unknown;
  request: Request | { url: string; headers: Headers; method?: string };
  operation: string; // e.g., "auth:signIn", basically the failing action name
  severity?: "error" | "warning" | "fatal";
  extras?: Record<string, unknown>;
}): void {
  const { error, request, operation, severity = "error", extras } = options;

  const normalized = normalizeError(error);
  const reqCtx = getRequestContext(request);
  const logPayload = {
    severity,
    operation,
    ...reqCtx,
    ...extras,
    error: normalized,
  };

  // Console mirror for Vercel/Edge logs, basically immediate visibility
  // Use a single line JSON for easy filtering
  const consoleLine = `SERVER_ERROR ${JSON.stringify(logPayload)}`;
  if (severity === "fatal") {
    console.error(consoleLine);
  } else if (severity === "warning") {
    console.warn(consoleLine);
  } else {
    console.error(consoleLine);
  }

  // Sentry capture with enriched scope, basically persistent diagnostics
  try {
    Sentry.withScope((scope) => {
      scope.setLevel(severity);
      scope.setTag("operation", operation);
      scope.setContext("request", reqCtx as Record<string, unknown>);
      if (extras) scope.setContext("extras", extras as Record<string, unknown>);
      Sentry.captureException(
        error instanceof Error ? error : new Error("OperationalError")
      );
    });
  } catch {
    // Never throw from logger, basically fail-safe
  }
}

/**
 * Convenience helper for auth failures, basically pre-filled operation with enhanced context
 */
export function logAuthFailure(params: {
  error: unknown;
  request: Request | { url: string; headers: Headers; method?: string };
  phase: "middleware" | "route";
  provider?: string;
  extras?: Record<string, unknown>;
}) {
  const { error, request, phase, provider, extras } = params;

  // Enhanced auth-specific context, basically detailed auth diagnostics
  const authContext = {
    authSecret: process.env.AUTH_SECRET ? "present" : "missing",
    resendKey: process.env.AUTH_RESEND_KEY ? "present" : "missing",
    convexUrl: process.env.NEXT_PUBLIC_CONVEX_URL ? "present" : "missing",
    convexDeployment: process.env.CONVEX_DEPLOYMENT ? "present" : "missing",
    nodeEnv: process.env.NODE_ENV,
    githubOAuth:
      process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET
        ? "configured"
        : "not_configured",
    googleOAuth:
      process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET
        ? "configured"
        : "not_configured",
    timestamp: new Date().toISOString(),
  };

  logServerError({
    error,
    request,
    operation: provider ? `auth:${phase}:${provider}` : `auth:${phase}`,
    severity: "error",
    extras: {
      ...extras,
      authEnvironment: authContext,
    },
  });
}

export const __logger_is_production__ = IS_PRODUCTION;
