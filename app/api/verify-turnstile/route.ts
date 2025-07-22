// app/api/verify-turnstile/route.ts
import { type NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
	try {
		// Parse request body to get the token
		const { token } = await request.json();

		if (!token) {
			return NextResponse.json(
				{ success: false, message: "Missing CAPTCHA token" },
				{ status: 400 }
			);
		}

		// Verify the token with Cloudflare Turnstile
		const verifyResponse = await fetch(
			"https://challenges.cloudflare.com/turnstile/v0/siteverify",
			{
				method: "POST",
				headers: {
					"Content-Type": "application/x-www-form-urlencoded",
				},
				body: new URLSearchParams({
					secret: process.env.TURNSTILE_SECRET_KEY || "",
					response: token,
					remoteip:
						request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "",
				}).toString(),
			}
		);

		const responseData = await verifyResponse.json();

		if (!responseData.success) {
			console.error("Turnstile verification failed:", responseData);
			return NextResponse.json(
				{ success: false, message: "CAPTCHA verification failed" },
				{ status: 400 }
			);
		}

		// Return success if token is valid
		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Error verifying Turnstile token:", error);
		return NextResponse.json(
			{ success: false, message: "An error occurred during verification" },
			{ status: 500 }
		);
	}
}
