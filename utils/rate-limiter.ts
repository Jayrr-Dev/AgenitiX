// utils/rate-limiter.ts

//This is a rate limiter for the contact form, schedule consultation form, and careers form.
//It is a simple rate limiter that uses an in-memory storage for rate limiting.
//Does not work for scale, but works for small applications.

import type { NextRequest } from "next/server";

// Define rate limit configuration interface
interface RateLimitConfig {
	windowMs: number; // Time window in milliseconds
	maxRequests: number; // Maximum number of requests allowed in the time window
	message?: string; // Optional custom error message
}

// In-memory storage for rate limiting (for smaller applications)
// For production, consider using Redis or a distributed cache
const requestLog: Record<string, number[]> = {};

/**
 * Apply rate limiting to a specific endpoint
 * @param req Next.js request object
 * @param config Rate limiting configuration
 * @returns Boolean indicating if the request is allowed
 */
export function applyRateLimit(req: NextRequest, config: RateLimitConfig): boolean {
	// Use IP address as the identifier (you might want to use a more sophisticated method in production)
	const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "127.0.0.1";
	const now = Date.now();

	// Clean up old requests outside the time window
	if (!requestLog[ip]) {
		requestLog[ip] = [];
	}

	requestLog[ip] = requestLog[ip].filter((timestamp) => now - timestamp < config.windowMs);

	// Check if the number of requests exceeds the limit
	if (requestLog[ip].length >= config.maxRequests) {
		return false;
	}

	// Add current request timestamp
	requestLog[ip].push(now);

	return true;
}

/**
 * Create a rate limiter middleware for API routes
 * @param config Rate limiting configuration
 * @returns Middleware function
 */
export function createRateLimiter(config: RateLimitConfig) {
	return (req: NextRequest) => {
		if (!applyRateLimit(req, config)) {
			return new Response(
				JSON.stringify({
					error: config.message || "Too many requests, please try again later.",
				}),
				{
					status: 429, // Too Many Requests
					headers: { "Content-Type": "application/json" },
				}
			);
		}
		return null; // Proceed with the request
	};
}

// Preset configurations for different use cases
export const rateLimitPresets = {
	// Strict rate limit for critical endpoints like login
	strict: {
		windowMs: 15 * 60 * 1000, // 15 minutes
		maxRequests: 5,
		message: "Too many login attempts. Please wait 15 minutes.",
	},

	// Moderate rate limit for general form submissions
	moderate: {
		windowMs: 60 * 60 * 1000, // 1 hour
		maxRequests: 10,
		message: "Too many form submissions. Please wait an hour.",
	},

	// Lenient rate limit for less critical endpoints
	lenient: {
		windowMs: 24 * 60 * 60 * 1000, // 24 hours
		maxRequests: 50,
		message: "Daily submission limit exceeded.",
	},
};
