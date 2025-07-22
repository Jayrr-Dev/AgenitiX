import Anubis from "@agenitix/anubis";
// Next.js Middleware Example with Anubis Protection
import { type NextRequest, NextResponse } from "next/server";

// Initialize Anubis with your configuration
const anubis = new Anubis({
	enabled: true,
	difficulty: 4,
	jwtSecret: process.env.ANUBIS_JWT_SECRET!,
	protectedRoutes: [
		"/", // Home page
		"/about", // About page
		"/contact", // Contact page
		"/admin", // Admin dashboard
		"/dashboard", // User dashboard
		"/api/contact", // Contact form API
		"/api/forms/*", // All form APIs
	],
	excludedRoutes: [
		"/api/health", // Health check
		"/api/anubis", // Anubis internal APIs
		"/_next/*", // Next.js static files
		"/favicon.ico", // Favicon
		"/robots.txt", // Robots file
		"/sitemap.xml", // Sitemap
	],
	allowedUserAgents: ["Googlebot", "Bingbot", "facebookexternalhit", "Twitterbot"],
});

export async function middleware(request: NextRequest) {
	const { pathname } = request.nextUrl;
	const userAgent = request.headers.get("user-agent") || "";

	console.log(`🐺 Anubis middleware processing: ${pathname}`);

	// Check if route needs protection
	if (!anubis.isRouteProtected(pathname)) {
		console.log(`✅ Route not protected: ${pathname}`);
		return NextResponse.next();
	}

	console.log(`🛡️ Protecting route: ${pathname}`);

	// Extract request metadata
	const requestMetadata = {
		ip: getClientIP(request),
		userAgent: userAgent,
		headers: Object.fromEntries(request.headers.entries()),
		timestamp: Date.now(),
	};

	// Perform risk analysis
	const { riskLevel, config, factors } = await anubis.analyzeRequest(requestMetadata);

	console.log(`📊 Risk Assessment: ${riskLevel.name} (Level ${riskLevel.level})`);
	console.log(`🎯 Risk Score: ${riskLevel.score}`);
	console.log(`⚡ Optimistic Mode: ${config.optimisticEnabled}`);

	// Check rate limiting based on risk level
	const rateLimitResult = anubis.checkRateLimit(requestMetadata, riskLevel.name);

	if (!rateLimitResult.allowed) {
		console.log(
			`🚦 Rate limit exceeded: ${rateLimitResult.totalHits}/${rateLimitResult.totalHits + rateLimitResult.remaining}`
		);

		const response = NextResponse.json(
			{
				error: "Rate limit exceeded",
				message: "Too many requests. Please try again later.",
				retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000),
			},
			{ status: 429 }
		);

		// Add rate limit headers
		response.headers.set(
			"X-RateLimit-Limit",
			String(rateLimitResult.totalHits + rateLimitResult.remaining)
		);
		response.headers.set("X-RateLimit-Remaining", String(rateLimitResult.remaining));
		response.headers.set("X-RateLimit-Reset", String(Math.ceil(rateLimitResult.resetTime / 1000)));
		response.headers.set(
			"Retry-After",
			String(Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000))
		);

		return response;
	}

	// Check existing verification
	const authCookie = request.cookies.get("anubis-auth");
	if (authCookie?.value) {
		try {
			const payload = await anubis.verifyToken(authCookie.value);
			if (payload && payload.exp > Math.floor(Date.now() / 1000)) {
				console.log(`✅ Valid token found, allowing access`);
				const response = NextResponse.next();
				response.headers.set("X-Anubis-Verified", "true");
				response.headers.set("X-Anubis-Risk-Level", riskLevel.name);
				return response;
			}
		} catch (error) {
			console.log(`❌ Invalid token: ${error}`);
		}
	}

	// Handle based on risk level and optimistic mode
	if (config.optimisticEnabled) {
		// OPTIMISTIC MODE: Allow access, verify in background
		console.log(`⚡ Optimistic mode: Allowing access with ${config.gracePeriod}ms grace period`);

		const response = NextResponse.next();

		// Add headers for client-side verification
		response.headers.set("X-Anubis-Optimistic", "true");
		response.headers.set("X-Anubis-Risk-Level", riskLevel.name);
		response.headers.set("X-Anubis-Risk-Score", riskLevel.score.toString());
		response.headers.set("X-Anubis-Difficulty", config.challengeDifficulty.toString());
		response.headers.set("X-Anubis-Grace-Period", config.gracePeriod.toString());
		response.headers.set("X-Anubis-Requires-Interaction", config.requiresInteraction.toString());

		// Create challenge for background verification
		const challenge = anubis.createChallenge(requestMetadata, config.challengeDifficulty);
		response.headers.set("X-Anubis-Challenge", JSON.stringify(challenge));

		return response;
	} else {
		// IMMEDIATE CHALLENGE: Redirect to challenge page
		console.log(`🛑 Immediate challenge required for ${riskLevel.name} risk level`);

		const challengeUrl = new URL("/api/anubis/challenge", request.url);
		challengeUrl.searchParams.set("return_to", pathname);
		challengeUrl.searchParams.set("difficulty", config.challengeDifficulty.toString());
		challengeUrl.searchParams.set("risk_level", riskLevel.name);

		return NextResponse.redirect(challengeUrl);
	}
}

// Helper function to extract client IP
function getClientIP(request: NextRequest): string {
	const forwarded = request.headers.get("x-forwarded-for");
	const realIP = request.headers.get("x-real-ip");
	const cfConnectingIP = request.headers.get("cf-connecting-ip");

	if (cfConnectingIP) return cfConnectingIP;
	if (realIP) return realIP;
	if (forwarded) return forwarded.split(",")[0].trim();

	return "127.0.0.1";
}

// Configure which routes the middleware should run on
export const config = {
	matcher: [
		/*
		 * Match all request paths except for the ones starting with:
		 * - api/anubis (Anubis internal APIs)
		 * - _next/static (static files)
		 * - _next/image (image optimization files)
		 * - favicon.ico (favicon file)
		 */
		"/((?!api/anubis|_next/static|_next/image|favicon.ico).*)",
	],
};
