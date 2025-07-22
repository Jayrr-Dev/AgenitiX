import Anubis from "@agenitix/anubis";
// Express.js Middleware Example with Anubis Protection
import express from "express";

const app = express();

// Initialize Anubis with your configuration
const anubis = new Anubis({
	enabled: true,
	difficulty: 4,
	jwtSecret: process.env.ANUBIS_JWT_SECRET || "your-secret-key",
	protectedRoutes: [
		"/", // Home page
		"/admin", // Admin routes
		"/api/contact", // Contact form
		"/api/forms/*", // All form endpoints
		"/dashboard", // User dashboard
	],
	excludedRoutes: [
		"/api/health", // Health check
		"/api/anubis", // Anubis internal APIs
		"/static/*", // Static files
		"/favicon.ico", // Favicon
		"/robots.txt", // Robots file
	],
	allowedUserAgents: ["Googlebot", "Bingbot", "facebookexternalhit", "Twitterbot"],
});

// Anubis protection middleware
app.use(async (req, res, next) => {
	const pathname = req.path;
	const userAgent = req.get("User-Agent") || "";

	console.log(`🐺 Anubis middleware processing: ${pathname}`);

	// Check if route needs protection
	if (!anubis.isRouteProtected(pathname)) {
		console.log(`✅ Route not protected: ${pathname}`);
		return next();
	}

	console.log(`🛡️ Protecting route: ${pathname}`);

	// Extract request metadata
	const requestMetadata = {
		ip: getClientIP(req),
		userAgent: userAgent,
		headers: req.headers as Record<string, string>,
		timestamp: Date.now(),
	};

	try {
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

			// Set rate limit headers
			res.set("X-RateLimit-Limit", String(rateLimitResult.totalHits + rateLimitResult.remaining));
			res.set("X-RateLimit-Remaining", String(rateLimitResult.remaining));
			res.set("X-RateLimit-Reset", String(Math.ceil(rateLimitResult.resetTime / 1000)));
			res.set("Retry-After", String(Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)));

			return res.status(429).json({
				error: "Rate limit exceeded",
				message: "Too many requests. Please try again later.",
				retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000),
			});
		}

		// Check existing verification
		const authCookie = req.cookies?.["anubis-auth"];
		if (authCookie) {
			try {
				const payload = await anubis.verifyToken(authCookie);
				if (payload && payload.exp > Math.floor(Date.now() / 1000)) {
					console.log(`✅ Valid token found, allowing access`);
					res.set("X-Anubis-Verified", "true");
					res.set("X-Anubis-Risk-Level", riskLevel.name);
					return next();
				}
			} catch (error) {
				console.log(`❌ Invalid token: ${error}`);
			}
		}

		// Set risk headers
		res.set("X-Anubis-Risk-Level", riskLevel.name);
		res.set("X-Anubis-Risk-Score", riskLevel.score.toString());
		res.set("X-Anubis-Difficulty", config.challengeDifficulty.toString());

		// Handle based on risk level and optimistic mode
		if (config.optimisticEnabled) {
			// OPTIMISTIC MODE: Allow access, verify in background
			console.log(`⚡ Optimistic mode: Allowing access with ${config.gracePeriod}ms grace period`);

			// Add headers for client-side verification
			res.set("X-Anubis-Optimistic", "true");
			res.set("X-Anubis-Grace-Period", config.gracePeriod.toString());
			res.set("X-Anubis-Requires-Interaction", config.requiresInteraction.toString());

			// Create challenge for background verification
			const challenge = anubis.createChallenge(requestMetadata, config.challengeDifficulty);
			res.set("X-Anubis-Challenge", JSON.stringify(challenge));

			return next();
		} else {
			// IMMEDIATE CHALLENGE: Return challenge page or redirect
			console.log(`🛑 Immediate challenge required for ${riskLevel.name} risk level`);

			// For API routes, return JSON challenge
			if (pathname.startsWith("/api/")) {
				const challenge = anubis.createChallenge(requestMetadata, config.challengeDifficulty);
				return res.status(403).json({
					error: "Challenge required",
					challenge: challenge,
					riskLevel: riskLevel.name,
					difficulty: config.challengeDifficulty,
					message: "Please complete the proof-of-work challenge to continue.",
				});
			} else {
				// For regular routes, redirect to challenge page
				const challengeUrl = `/challenge?return_to=${encodeURIComponent(pathname)}&difficulty=${config.challengeDifficulty}&risk_level=${riskLevel.name}`;
				return res.redirect(challengeUrl);
			}
		}
	} catch (error) {
		console.error(`❌ Anubis middleware error:`, error);
		// On error, allow the request to continue (fail open)
		return next();
	}
});

// Helper function to extract client IP
function getClientIP(req: express.Request): string {
	const forwarded = req.get("x-forwarded-for");
	const realIP = req.get("x-real-ip");
	const cfConnectingIP = req.get("cf-connecting-ip");

	if (cfConnectingIP) return cfConnectingIP;
	if (realIP) return realIP;
	if (forwarded) return forwarded.split(",")[0].trim();

	return req.ip || req.connection.remoteAddress || "127.0.0.1";
}

// Challenge verification endpoint
app.post("/api/anubis/verify", async (req, res) => {
	try {
		const { nonce, hash, challenge, timestamp } = req.body;

		if (!nonce || !hash || !challenge || !timestamp) {
			return res.status(400).json({ error: "Missing required fields" });
		}

		// Validate proof of work
		const isValid = await anubis.validateProofOfWork({
			nonce,
			hash,
			challenge,
			timestamp,
		});

		if (!isValid) {
			return res.status(400).json({ error: "Invalid proof of work" });
		}

		// Generate JWT token
		const requestMetadata = {
			ip: getClientIP(req),
			userAgent: req.get("User-Agent") || "",
			headers: req.headers as Record<string, string>,
		};

		const fingerprint = req.get("User-Agent") + "|" + getClientIP(req);
		const now = Math.floor(Date.now() / 1000);

		const payload = {
			fingerprint,
			exp: now + 7 * 24 * 60 * 60, // 7 days
			iat: now,
			difficulty: anubis.getConfig().difficulty,
		};

		const token = await anubis.signToken(payload);

		// Set cookie
		res.cookie("anubis-auth", token, {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "lax",
			maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
		});

		res.json({ success: true, token });
	} catch (error) {
		console.error("Challenge verification error:", error);
		res.status(500).json({ error: "Verification failed" });
	}
});

// Example protected routes
app.get("/", (req, res) => {
	res.json({ message: "Welcome to the protected home page!" });
});

app.get("/admin", (req, res) => {
	res.json({ message: "Admin dashboard - highly protected!" });
});

app.post("/api/contact", (req, res) => {
	res.json({ message: "Contact form submitted successfully!" });
});

// Health check (unprotected)
app.get("/api/health", (req, res) => {
	res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
	console.log(`🚀 Server running on port ${PORT}`);
	console.log(`🐺 Anubis protection enabled: ${anubis.getConfig().enabled}`);
});

export default app;
