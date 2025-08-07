import { getRouteProtectionManager, loadAnubisConfig } from "@/lib/anubis/config";
import { verifyJWT } from "@/lib/anubis/crypto";
import { adaptiveRateLimiter } from "@/lib/anubis/rate-limiter";
import { analyzeRequest, trackRisk } from "@/lib/anubis/risk-engine";
import { convexAuthNextjsMiddleware } from "@convex-dev/auth/nextjs/server";
import { type NextRequest, NextResponse } from "next/server";

// Use Convex Auth middleware as the base
const convexMiddleware = convexAuthNextjsMiddleware();

// COMBINED MIDDLEWARE - Convex Auth + Anubis Protection
export default async function middleware(request: NextRequest) {
	const { pathname } = request.nextUrl;
	
	// Always let Convex Auth handle OAuth callbacks or auth API routes, basically route them to Convex middleware
	if (pathname.startsWith('/api/auth') || request.nextUrl.searchParams.has('code')) {
		// Add CORS headers for OAuth routes
		const response = await convexMiddleware(request);
		
		// Add CORS headers for OAuth development
		if (process.env.NODE_ENV === "development" && response) {
			response.headers.set("Access-Control-Allow-Origin", "http://localhost:3000");
			response.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
			response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, Accept, Origin");
			response.headers.set("Access-Control-Allow-Credentials", "true");
			
			// Remove COOP headers that block popup communication
			response.headers.delete("Cross-Origin-Opener-Policy");
			response.headers.delete("Cross-Origin-Embedder-Policy");
			
			// Add permissive headers for OAuth popup flow
			response.headers.set("Cross-Origin-Opener-Policy", "unsafe-none");
			response.headers.set("Cross-Origin-Embedder-Policy", "unsafe-none");
		}
		
		return response;
	}

	// For all other routes, apply Anubis protection
	const userAgent = request.headers.get("user-agent") || "";

	// LOAD ANUBIS CONFIGURATION
	const config = loadAnubisConfig();
	const routeManager = getRouteProtectionManager();

	// FORCE ENABLE FOR TESTING (REMOVE IN PRODUCTION)
	if (!config.enabled) {
		config.enabled = true;
	}

	// CHECK IF ROUTE IS PROTECTED USING ANUBIS CONFIG
	const needsProtection = routeManager.isRouteProtected(pathname);

	if (!needsProtection) {
		return NextResponse.next();
	}

	// CHECK FOR LEGITIMATE BOTS FIRST
	if (isAllowedUserAgent(userAgent, config.allowedUserAgents)) {
		const response = NextResponse.next();
		response.headers.set("X-Anubis-Bot-Allowed", "true");
		response.headers.set("X-Anubis-Bot-Type", "legitimate");
		return response;
	}

	// EXTRACT REQUEST METADATA FOR RISK ANALYSIS
	const requestMetadata = {
		ip: getClientIP(request),
		userAgent: userAgent,
		headers: Object.fromEntries(request.headers.entries()),
		sessionHistory: getSessionHistory(request),
		timestamp: Date.now(),
	};

	// PERFORM RISK ANALYSIS
	const { riskLevel, config: adaptiveConfig, factors } = await analyzeRequest(requestMetadata);

	// TRACK RISK FOR MONITORING
	trackRisk(requestMetadata.ip, riskLevel);

	// CHECK RATE LIMITING BASED ON RISK LEVEL
	const rateLimitResult = adaptiveRateLimiter.checkLimit(requestMetadata, riskLevel.name);

	if (!rateLimitResult.allowed) {
		const response = NextResponse.json(
			{
				error: "Rate limit exceeded",
				message: "Too many requests. Please try again later.",
				retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000),
			},
			{ status: 429 }
		);

		// ADD RATE LIMIT HEADERS
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

	// GET VERIFICATION STATUS
	const authCookie = request.cookies.get("anubis-auth");
	const sessionCookie = request.cookies.get("anubis-session");
	const failuresCookie = request.cookies.get("anubis-failures");

	const failures = failuresCookie ? Number.parseInt(failuresCookie.value) : 0;
	const now = Date.now();

	// CHECK FOR EXISTING VALID AUTH TOKEN
	if (authCookie?.value) {
		try {
			const payload = await verifyJWT(
				authCookie.value,
				process.env.ANUBIS_SECRET || "default-secret"
			);
			if (payload && payload.exp > Math.floor(now / 1000)) {
				const response = NextResponse.next();
				response.headers.set("X-Anubis-Verified", "true");
				response.headers.set("X-Anubis-Risk-Level", riskLevel.name);
				response.headers.set("X-Anubis-Risk-Score", riskLevel.score.toString());
				return response;
			}
		} catch (_error) {
			// Invalid token - continue to verification flow
		}
	}

	// ADAPTIVE VERIFICATION FLOW
	if (adaptiveConfig.optimisticEnabled) {
		// CHECK IF BACKGROUND VERIFICATION IS IN PROGRESS
		if (sessionCookie?.value) {
			try {
				const sessionData = JSON.parse(sessionCookie.value);
				const sessionAge = now - sessionData.startTime;

				// STILL WITHIN GRACE PERIOD - ALLOW ACCESS
				if (sessionAge < adaptiveConfig.gracePeriod) {
					const response = NextResponse.next();

					// ADD ADAPTIVE VERIFICATION HEADERS
					response.headers.set("X-Anubis-Optimistic", "true");
					response.headers.set("X-Anubis-Session", sessionData.sessionId);
					response.headers.set(
						"X-Anubis-Remaining",
						String(adaptiveConfig.gracePeriod - sessionAge)
					);
					response.headers.set("X-Anubis-Risk-Level", riskLevel.name);
					response.headers.set("X-Anubis-Risk-Score", riskLevel.score.toString());
					response.headers.set(
						"X-Anubis-Difficulty",
						adaptiveConfig.challengeDifficulty.toString()
					);
					response.headers.set("X-Anubis-Grace-Period", adaptiveConfig.gracePeriod.toString());

					return response;
				}
				// GRACE PERIOD EXPIRED - CHECK VERIFICATION STATUS
				if (!sessionData.verified) {
					// VERIFICATION FAILED - INCREMENT FAILURES AND BLOCK
					const response = redirectToChallenge(request, adaptiveConfig.challengeDifficulty);
					response.cookies.set("anubis-failures", String(failures + 1), {
						maxAge: 3600, // 1 hour
						httpOnly: true,
						secure: true,
						sameSite: "strict",
					});
					return response;
				}
			} catch (_error) {
				// Invalid session cookie - start new adaptive flow
			}
		}

		// START NEW ADAPTIVE OPTIMISTIC SESSION
		const sessionId = generateSessionId();
		const sessionData = {
			sessionId,
			startTime: now,
			verified: false,
			challenge: generateChallenge(adaptiveConfig.challengeDifficulty),
			riskLevel: riskLevel.level,
			riskFactors: factors,
		};

		const response = NextResponse.next();

		// ADD ADAPTIVE VERIFICATION HEADERS
		response.headers.set("X-Anubis-Optimistic", "true");
		response.headers.set("X-Anubis-Session", sessionId);
		response.headers.set("X-Anubis-Risk-Level", riskLevel.name);
		response.headers.set("X-Anubis-Risk-Score", riskLevel.score.toString());
		response.headers.set("X-Anubis-Difficulty", adaptiveConfig.challengeDifficulty.toString());
		response.headers.set("X-Anubis-Grace-Period", adaptiveConfig.gracePeriod.toString());

		// SET SESSION COOKIE FOR BACKGROUND VERIFICATION
		response.cookies.set("anubis-session", JSON.stringify(sessionData), {
			maxAge: Math.ceil(adaptiveConfig.gracePeriod / 1000),
			httpOnly: true,
			secure: true,
			sameSite: "strict",
		});

		return response;
	}
	return redirectToChallenge(request, adaptiveConfig.challengeDifficulty);
}

// HELPER FUNCTIONS
function redirectToChallenge(request: NextRequest, difficulty = 4) {
	const challengeUrl = new URL("/api/anubis/challenge", request.url);
	challengeUrl.searchParams.set("returnTo", request.url);
	challengeUrl.searchParams.set("difficulty", difficulty.toString());
	return NextResponse.redirect(challengeUrl);
}

function generateSessionId(): string {
	return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

function generateChallenge(difficulty = 4) {
	const challenge = Math.random().toString(36).substring(2);
	return {
		challenge,
		difficulty,
		timestamp: Date.now(),
	};
}

// GET SESSION HISTORY FOR RISK ANALYSIS
function getSessionHistory(request: NextRequest): any {
	const failuresCookie = request.cookies.get("anubis-failures");
	const sessionCookie = request.cookies.get("anubis-session");

	const history = {
		failures: failuresCookie ? Number.parseInt(failuresCookie.value) : 0,
		challenges: 0,
		lastActivity: Date.now(),
	};

	if (sessionCookie?.value) {
		try {
			const sessionData = JSON.parse(sessionCookie.value);
			history.challenges = sessionData.challengeCount || 0;
			history.lastActivity = sessionData.startTime || Date.now();
		} catch (_error) {
			// Invalid session data
		}
	}

	return history;
}

// EXTRACT CLIENT IP ADDRESS
function getClientIP(request: NextRequest): string {
	const forwarded = request.headers.get("x-forwarded-for");
	const realIP = request.headers.get("x-real-ip");
	const cfConnectingIP = request.headers.get("cf-connecting-ip");

	if (cfConnectingIP) {
		return cfConnectingIP;
	}
	if (realIP) {
		return realIP;
	}
	if (forwarded) {
		return forwarded.split(",")[0].trim();
	}

	return "127.0.0.1"; // FALLBACK IP
}

// CHECK IF USER AGENT IS ALLOWED (SEARCH BOTS)
function isAllowedUserAgent(userAgent: string | undefined, allowedAgents: string[]): boolean {
	if (!userAgent) {
		return false;
	}

	return allowedAgents.some((allowed) => userAgent.toLowerCase().includes(allowed.toLowerCase()));
}

// Middleware config
export const config = {
	matcher: [
		/*
		 * Match all request paths including auth API routes
		 * Exclude only:
		 * - api/anubis (Anubis API routes)
		 * - api/convex (Convex backend API)  
		 * - _next/static (static files)
		 * - _next/image (image optimization files)
		 * - favicon.ico (favicon file)
		 * - manifest.json (PWA manifest)
		 * - logo-mark.png (logo)
		 * - .well-known (well-known paths)
		 * - auth pages (sign-in, sign-up, forgot-password, verify)
		 * - callback pages (OAuth callbacks)
		 */
		"/((?!api/anubis|api/convex|_next/static|_next/image|favicon.ico|manifest.json|logo-mark.png|.well-known|sign-in|sign-up|forgot-password|auth/verify|callback).*)",
		// Explicitly match home page and API auth routes
		"/",
		"/api/auth/:path*",
	],
};
