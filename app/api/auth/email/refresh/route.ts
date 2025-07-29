/**
 * OAuth2 Token Refresh Handler
 *
 * Handles refreshing expired OAuth2 access tokens using refresh tokens.
 */

import { getProvider } from "@/features/business-logic-modern/node-domain/email/providers";
import type { EmailProviderType } from "@/features/business-logic-modern/node-domain/email/types";
import type { NextRequest } from "next/server";
import { buildErrorResponse, buildSuccessResponse, sanitizeAuthData } from "../utils";

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
 * Validates refresh request parameters
 */
function validateRefreshParams(provider: string, refreshToken: string) {
	if (!(provider && refreshToken)) {
		return buildErrorResponse("Missing required parameters: provider, refreshToken");
	}
	return null;
}

/**
 * Gets and validates provider for token refresh
 */
function getRefreshProvider(provider: EmailProviderType) {
	const providerInstance = getProvider(provider);
	if (!providerInstance) {
		throw new Error(`Unsupported provider: ${provider}`);
	}

	if (providerInstance.authType !== "oauth2" || !providerInstance.refreshTokens) {
		throw new Error(`Provider ${provider} does not support token refresh`);
	}

	return providerInstance;
}

/**
 * Handles OAuth2 error responses
 */
function handleOAuthError(error: Error) {
	if (error.message.includes("invalid_grant") || error.message.includes("400")) {
		return buildErrorResponse(
			"Refresh token expired or invalid",
			"Please re-authenticate your email account",
			401
		);
	}

	if (error.message.includes("401") || error.message.includes("unauthorized")) {
		return buildErrorResponse(
			"Authentication failed",
			"Please re-authenticate your email account",
			401
		);
	}

	return null;
}

/**
 * Builds success response with refreshed token data
 */
function buildRefreshSuccessResponse(
	provider: string,
	newTokens: TokenResponse,
	originalRefreshToken: string,
	connectionResult: ConnectionResult,
	accountId?: string
) {
	const refreshData = {
		provider,
		accessToken: newTokens.accessToken,
		refreshToken: newTokens.refreshToken || originalRefreshToken,
		tokenExpiry: Date.now() + newTokens.expiresIn * 1000,
		accountInfo: connectionResult.accountInfo,
		accountId,
	};

	return buildSuccessResponse(refreshData);
}

/**
 * Validates the refreshed connection
 */
async function validateRefreshedConnection(
	providerInstance: ReturnType<typeof getProvider>,
	provider: EmailProviderType,
	newTokens: TokenResponse,
	originalRefreshToken: string
) {
	const connectionResult = await providerInstance?.validateConnection({
		provider: provider as EmailProviderType,
		email: "", // Will be filled from profile
		accessToken: newTokens.accessToken,
		refreshToken: newTokens.refreshToken || originalRefreshToken,
		tokenExpiry: Date.now() + newTokens.expiresIn * 1000,
	});

	if (!connectionResult?.success) {
		const errorData = connectionResult?.error ? { ...connectionResult.error } : {};
		console.error("Token refresh validation failed:", sanitizeAuthData(errorData));
		throw new Error(connectionResult?.error?.message || "Unknown validation error");
	}

	return connectionResult;
}

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { provider, refreshToken, accountId } = body;

		// Validate required parameters
		const validationError = validateRefreshParams(provider, refreshToken);
		if (validationError) {
			return validationError;
		}

		// Get and validate provider
		const providerInstance = getRefreshProvider(provider as EmailProviderType);

		// Refresh tokens
		const newTokens = await providerInstance.refreshTokens(refreshToken);

		// Validate the new connection
		const connectionResult = await validateRefreshedConnection(
			providerInstance,
			provider as EmailProviderType,
			newTokens,
			refreshToken
		);

		return buildRefreshSuccessResponse(
			provider,
			newTokens,
			refreshToken,
			connectionResult,
			accountId
		);
	} catch (error) {
		console.error("Token refresh error:", error);

		// Handle OAuth2-specific errors
		if (error instanceof Error) {
			const oauthErrorResponse = handleOAuthError(error);
			if (oauthErrorResponse) {
				return oauthErrorResponse;
			}
		}

		return buildErrorResponse(
			"Token refresh failed",
			error instanceof Error ? error.message : "Unknown error",
			500
		);
	}
}
