/**
 * Generic OAuth2 Callback Processor (Optimised)
 *
 * ✓ Single exit-point helpers for JSON / redirect responses
 * ✓ zod–validated request body for type-safe parsing
 * ✓ Strongly-typed provider resolution (no “as” casts needed)
 * ✓ Centralised, typed error system (OAuthError)
 * ✓ Side-effect-free pure helpers → easier unit testing
 */

import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";

import { getProvider } from "@/features/business-logic-modern/node-domain/email/providers";
import type {
	EmailProvider,
	EmailProviderType,
} from "@/features/business-logic-modern/node-domain/email/types";
import {
	buildErrorRedirect,
	mapOAuth2Error,
	sanitizeAuthData,
} from "../utils";

/* -------------------------------------------------------------------------- */
/*                              🔖  Schema / Types                            */
/* -------------------------------------------------------------------------- */

const BodySchema = z.object({
	provider: z.enum(["gmail","outlook","yahoo","imap","smtp"]),
	code: z.string().min(1),
	redirectUri: z.string().url(),
});

type BodyInput = z.infer<typeof BodySchema>;

interface TokenResponse {
	accessToken: string;
	refreshToken?: string;
	expiresIn: number;
}

interface ConnectionResult {
	success: boolean;
	accountInfo?: {
		email?: string;
		displayName?: string;
	};
	error?: {
		message?: string;
		code?: string;
	};
}

/* -------------------------------------------------------------------------- */
/*                                 🧩 Helpers                                 */
/* -------------------------------------------------------------------------- */

/** Typed HTTP error - lets us carry useful info through the call-stack */
class OAuthError extends Error {
	public readonly status: number;

	constructor(message: string, status = 400) {
		super(message);
		this.status = status;
	}
}

function json<T>(data: T, status = 200) {
	return NextResponse.json<T>(data, { status });
}

function buildAuthData(
	provider: EmailProviderType,
	tokens: TokenResponse,
	accountInfo: NonNullable<ConnectionResult["accountInfo"]>,
) {
	return {
		provider,
		email: accountInfo.email ?? "",
		displayName: accountInfo.displayName ?? "",
		accessToken: tokens.accessToken,
		refreshToken: tokens.refreshToken,
		tokenExpiry: Date.now() + tokens.expiresIn * 1_000,
		accountInfo,
	};
}

function resolveProvider(name: EmailProviderType): EmailProvider {
	const provider = getProvider(name);
	if (!provider) {
		throw new OAuthError(`Unsupported provider: ${name}`, 400);
	}
	if (provider.authType !== "oauth2" || !provider.exchangeCodeForTokens) {
		throw new OAuthError(`Provider ${name} does not support OAuth2`, 400);
	}
	return provider;
}

/* -------------------------------------------------------------------------- */
/*                            🚀  POST – main entry                           */
/* -------------------------------------------------------------------------- */

export async function POST(req: NextRequest) {
	try {
		const body = BodySchema.parse(await req.json()) as BodyInput;
		const provider = resolveProvider(body.provider);

		/* 1️⃣  Exchange code → tokens */
		const tokens = await provider.exchangeCodeForTokens!(
			body.code,
			body.redirectUri,
		);
		if (!tokens) throw new OAuthError("Failed to exchange code for tokens", 502);

		/* 2️⃣  Validate connection */
		const connection = await provider.validateConnection({
			provider: provider.id,
			email: "",
			accessToken: tokens.accessToken,
			refreshToken: tokens.refreshToken,
			tokenExpiry: Date.now() + tokens.expiresIn * 1_000,
		});

		if (!connection.success) {
			const details = connection.error ?? { message: "Unknown validation error" };
			console.error("Connection validation failed:", sanitizeAuthData(details as any));
			throw new OAuthError(details.message ?? "Connection validation failed", 400);
		}

		/* 3️⃣  Success 🎉 */
		return json({
			success: true,
			data: buildAuthData(provider.id, tokens, connection.accountInfo!),
			timestamp: new Date().toISOString(),
		});
	} catch (err) {
		if (err instanceof OAuthError) {
			return json({ error: err.message }, err.status);
		}
		console.error("OAuth2 callback processing error:", err);
		return json(
			{
				error: "OAuth2 callback processing failed",
				details: err instanceof Error ? err.message : "Unknown error",
			},
			500,
		);
	}
}

/* -------------------------------------------------------------------------- */
/*                            🌐  GET – provider redirect                     */
/* -------------------------------------------------------------------------- */

export function GET(req: NextRequest) {
	try {
		const { searchParams } = new URL(req.url);
		const code = searchParams.get("code");
		const state = searchParams.get("state");
		const error = searchParams.get("error");
		const provider = (searchParams.get("provider") ??
			"gmail") as EmailProviderType; // default for redirects

		/* Provider returned an OAuth2 error */
		if (error) {
			const errorDescription =
				searchParams.get("error_description") ?? "OAuth2 authorization failed";
			const mapped = mapOAuth2Error(error);

			console.error("OAuth2 error:", {
				error,
				errorDescription,
				provider,
			});

			return buildErrorRedirect(
				mapped.code,
				mapped.message,
				provider,
				state ?? undefined,
			);
		}

		/* Direct GET → not supported */
		return buildErrorRedirect(
			"INVALID_CALLBACK",
			"Direct callback not supported. Use provider-specific endpoints.",
			provider,
			state ?? undefined,
		);
	} catch (err) {
		console.error("OAuth2 callback GET error:", err);
		return buildErrorRedirect(
			"CALLBACK_ERROR",
			err instanceof Error ? err.message : "Unknown callback error",
			"gmail",
		);
	}
}
