/**
 * FEATURE FLAGS CONFIGURATION - Hypertune integration for feature flag management
 *
 * • Centralized feature flag configuration using Hypertune
 * • Type-safe flag declarations with full end-to-end type safety
 * • Context-aware flag evaluation with user and environment data
 * • Server-side flag evaluation for Next.js applications
 * • Integration with Vercel Edge Config for optimal performance
 *
 * Keywords: feature-flags, hypertune, type-safety, server-side, vercel-integration
 */

import { createHypertuneAdapter } from "@flags-sdk/hypertune";
import type { Identify } from "flags";
import { dedupe, flag } from "flags/next";
import {
	type Context,
	type RootFlagValues,
	createSource,
	vercelFlagDefinitions as flagDefinitions,
	flagFallbacks,
} from "./generated/hypertune";

/**
 * Identify function that creates context for flag evaluation
 * @param headers - Request headers for context
 * @param cookies - Request cookies for context
 * @returns Context object with environment and user information
 */
const identify: Identify<Context> = dedupe(
	async ({ headers, cookies }: { headers: Headers; cookies: any }) => {
		return {
			environment: process.env.NODE_ENV,
			user: { id: "1", name: "Test User", email: "hi@test.com" },
		};
	}
);

/**
 * Hypertune adapter for type-safe feature flag management
 */
const hypertuneAdapter = createHypertuneAdapter<RootFlagValues, Context>({
	createSource,
	flagFallbacks,
	flagDefinitions,
	identify,
});

/**
 * Test feature flag declaration
 */
export const testFlag = flag(hypertuneAdapter.declarations.test);

/**
 * Install App feature flag declaration
 * Controls whether the PWA install prompt is shown to users
 */
export const installAppFlag = flag(hypertuneAdapter.declarations.installApp);
