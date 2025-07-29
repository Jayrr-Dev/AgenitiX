/**
 * Generic OAuth2 Callback Processor
 *
 * Shared callback processing logic for all OAuth2 providers.
 * Handles token exchange, validation, and secure storage.
 */

import { getProvider } from "@/features/business-logic-modern/node-domain/email/providers";
import type { EmailProviderType } from "@/features/business-logic-modern/node-domain/email/types";
import { type NextRequest, NextResponse } from "next/server";
import { buildErrorRedirect, mapOAuth2Error, sanitizeAuthData } from "../utils";

/**
 * OAuth2 token response interface
 */
interface TokenResponse {
	accessToken: string;
	refreshToken?: string;
	expiresIn: number;
}

/**
 * Connection validation result interface
 */
interface ConnectionResult {
	success: boolean;
	accountInfo?: {
		email?: string;
		displayName?: string;
	};
	error?: {
		message?: string;
	};
}

/**
 * Validates required OAuth2 parameters
 */
function validateOAuthParams(provider: string, code: string, redirectUri: string) {
	if (!(provider && code && redirectUri)) {
		return NextResponse.json(
			{ error: "Missing required parameters: provider, code, redirectUri" },
			{ status: 400 }
		);
	}
	return null;
}

/**
 * Gets and validates provider instance
 */
function getValidatedProvider(provider: EmailProviderType) {
	const providerInstance = getProvider(provider);
	if (!providerInstance) {
		throw new Error(`Unsupported provider: ${provider}`);
	}

	if (providerInstance.authType !== "oauth2" || !providerInstance.exchangeCodeForTokens) {
		throw new Error(`Provider ${provider} does not support OAuth2`);
	}

	return providerInstance;
}

/**
 * Processes successful connection result
 */
function buildSuccessResponse(provider: EmailProviderType, tokens: TokenResponse, connectionResult: ConnectionResult) {
	const authData = {
		provider: provider as EmailProviderType,
		email: connectionResult.accountInfo?.email || "",
		displayName: connectionResult.accountInfo?.displayName || "",
		accessToken: tokens.accessToken,
		refreshToken: tokens.refreshToken,
		tokenExpiry: Date.now() + tokens.expiresIn * 1000,
		accountInfo: connectionResult.accountInfo,
	};

	return NextResponse.json({
		success: true,
		data: authData,
		timestamp: new Date().toISOString(),
	});
}

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { provider, code, redirectUri } = body;

		// Validate required parameters
		const validationError = validateOAuthParams(provider, code, redirectUri);
		if (validationError) {
			return validationError;
		}

		// Get and validate provider
		const providerInstance = getValidatedProvider(provider as EmailProviderType);

		// Exchange code for tokens
		const tokens = await providerInstance.exchangeCodeForTokens?.(code, redirectUri);
		
		if (!tokens) {
			throw new Error("Failed to exchange code for tokens");
		}

		// Validate the connection to get user info
		const connectionResult = await providerInstance.validateConnection({
			provider: provider as EmailProviderType,
			email: "", // Will be filled from profile
			accessToken: tokens.accessToken,
			refreshToken: tokens.refreshToken,
			tokenExpiry: Date.now() + tokens.expiresIn * 1000,
		});

		if (!connectionResult.success) {
			const errorData = connectionResult.error ? { ...connectionResult.error } : {};
			console.error("Connection validation failed:", sanitizeAuthData(errorData));
			return NextResponse.json(
				{
					error: "Connection validation failed",
					details: connectionResult.error?.message || "Unknown validation error",
					code: connectionResult.error?.code || "VALIDATION_FAILED",
				},
				{ status: 400 }
			);
		}

		return buildSuccessResponse(provider as EmailProviderType, tokens, connectionResult);
	} catch (error) {
		console.error("OAuth2 callback processing error:", error);

		// Handle validation errors with proper status codes
		if (error instanceof Error) {
			if (error.message.includes("Unsupported provider")) {
				return NextResponse.json({ error: error.message }, { status: 400 });
			}
			if (error.message.includes("does not support OAuth2")) {
				return NextResponse.json({ error: error.message }, { status: 400 });
			}
		}

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
export function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const _code = searchParams.get("code");
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
