/**
 * Generic OAuth2 Callback Processor
 *
 * Shared callback processing logic for all OAuth2 providers.
 * Handles token exchange, validation, and secure storage.
 */

import { getProvider } from "@/features/business-logic-modern/node-domain/email/providers";
import type { EmailProviderType } from "@/features/business-logic-modern/node-domain/email/types";
import { type NextRequest, NextResponse } from "next/server";
import {
	buildErrorRedirect,
	buildSuccessRedirect,
	mapOAuth2Error,
	sanitizeAuthData,
} from "../utils";

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { provider, code, state, redirectUri } = body;

		// Validate required parameters
		if (!provider || !code || !redirectUri) {
			return NextResponse.json(
				{ error: "Missing required parameters: provider, code, redirectUri" },
				{ status: 400 }
			);
		}

		// Get provider instance
		const providerInstance = getProvider(provider as EmailProviderType);
		if (!providerInstance) {
			return NextResponse.json({ error: `Unsupported provider: ${provider}` }, { status: 400 });
		}

		// Validate that provider supports OAuth2
		if (providerInstance.authType !== "oauth2" || !providerInstance.exchangeCodeForTokens) {
			return NextResponse.json(
				{ error: `Provider ${provider} does not support OAuth2` },
				{ status: 400 }
			);
		}

		// Exchange code for tokens
		const tokens = await providerInstance.exchangeCodeForTokens(code, redirectUri);

		// Validate the connection to get user info
		const connectionResult = await providerInstance.validateConnection({
			provider: provider as EmailProviderType,
			email: "", // Will be filled from profile
			accessToken: tokens.accessToken,
			refreshToken: tokens.refreshToken,
			tokenExpiry: Date.now() + tokens.expiresIn * 1000,
		});

		if (!connectionResult.success) {
			console.error("Connection validation failed:", sanitizeAuthData(connectionResult.error));
			return NextResponse.json(
				{
					error: "Connection validation failed",
					details: connectionResult.error?.message || "Unknown validation error",
					code: connectionResult.error?.code || "VALIDATION_FAILED",
				},
				{ status: 400 }
			);
		}

		// Return success with account info and tokens
		const authData = {
			provider: provider as EmailProviderType,
			email: connectionResult.accountInfo?.email || "",
			displayName: connectionResult.accountInfo?.displayName || "",
			accessToken: tokens.accessToken,
			refreshToken: tokens.refreshToken,
			tokenExpiry: Date.now() + tokens.expiresIn * 1000,
			accountInfo: connectionResult.accountInfo,
		};

		console.log("OAuth2 callback success:", sanitizeAuthData(authData));

		return NextResponse.json({
			success: true,
			data: authData,
			timestamp: new Date().toISOString(),
		});
	} catch (error) {
		console.error("OAuth2 callback processing error:", error);

		return NextResponse.json(
			{
				error: "OAuth2 callback processing failed",
				details: error instanceof Error ? error.message : "Unknown error",
				timestamp: new Date().toISOString(),
			},
			{ status: 500 }
		);
	}
}

// Handle GET requests (direct callback from OAuth2 provider)
export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const code = searchParams.get("code");
		const state = searchParams.get("state");
		const error = searchParams.get("error");
		const provider = searchParams.get("provider") as EmailProviderType;

		// Handle OAuth2 errors
		if (error) {
			const errorDescription =
				searchParams.get("error_description") || "OAuth2 authorization failed";
			const mappedError = mapOAuth2Error(error);

			console.error("OAuth2 error:", { error, errorDescription, provider });

			return buildErrorRedirect(mappedError.code, mappedError.message, provider || "gmail", state);
		}

		// This endpoint expects to be called via POST with processed data
		// Direct GET callbacks should go to provider-specific endpoints
		return buildErrorRedirect(
			"INVALID_CALLBACK",
			"Direct callback not supported. Use provider-specific endpoints.",
			provider || "gmail",
			state
		);
	} catch (error) {
		console.error("OAuth2 callback GET error:", error);

		return buildErrorRedirect(
			"CALLBACK_ERROR",
			error instanceof Error ? error.message : "Unknown callback error",
			"gmail" // Default provider for error handling
		);
	}
}
