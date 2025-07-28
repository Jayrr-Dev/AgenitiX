// RATE LIMITING FOR ANUBIS BOT PROTECTION

// REQUEST INTERFACE FOR RATE LIMITING
export interface RateLimitRequest {
	ip: string;
	userAgent: string;
	[key: string]: unknown;
}

export interface RateLimitConfig {
	windowMs: number; // Time window in milliseconds
	maxRequests: number; // Max requests per window
	skipSuccessfulRequests: boolean;
	skipFailedRequests: boolean;
	keyGenerator: (request: RateLimitRequest) => string;
}

export interface RateLimitResult {
	allowed: boolean;
	remaining: number;
	resetTime: number;
	totalHits: number;
}

// IN-MEMORY RATE LIMITER (FOR DEMONSTRATION)
// In production, use Redis or similar distributed store
class MemoryStore {
	private hits: Map<string, { count: number; resetTime: number }> = new Map();

	// INCREMENT COUNTER FOR KEY
	increment(key: string, windowMs: number): { totalHits: number; resetTime: number } {
		const now = Date.now();
		const resetTime = now + windowMs;

		const current = this.hits.get(key);

		if (!current || current.resetTime <= now) {
			// NEW WINDOW OR EXPIRED
			this.hits.set(key, { count: 1, resetTime });
			return { totalHits: 1, resetTime };
		}
		// INCREMENT EXISTING
		current.count++;
		return { totalHits: current.count, resetTime: current.resetTime };
	}

	// GET CURRENT COUNT
	get(key: string): { count: number; resetTime: number } | null {
		const current = this.hits.get(key);
		if (!current || current.resetTime <= Date.now()) {
			return null;
		}
		return current;
	}

	// CLEANUP EXPIRED ENTRIES
	cleanup(): void {
		const now = Date.now();
		const entries = Array.from(this.hits.entries());
		for (const [key, value] of entries) {
			if (value.resetTime <= now) {
				this.hits.delete(key);
			}
		}
	}
}

// RATE LIMITER CLASS
export class RateLimiter {
	private store = new MemoryStore();
	private config: RateLimitConfig;

	constructor(config: Partial<RateLimitConfig> = {}) {
		this.config = {
			windowMs: 15 * 60 * 1000, // 15 minutes default
			maxRequests: 100, // 100 requests per window
			skipSuccessfulRequests: false,
			skipFailedRequests: false,
			keyGenerator: (request) => this.defaultKeyGenerator(request),
			...config,
		};

		// CLEANUP EXPIRED ENTRIES EVERY 5 MINUTES
		setInterval(() => this.store.cleanup(), 5 * 60 * 1000);
	}

	// DEFAULT KEY GENERATOR (IP + USER AGENT)
	private defaultKeyGenerator(request: RateLimitRequest): string {
		const ip = request.ip || "unknown";
		const userAgent = request.userAgent || "unknown";
		return `${ip}:${userAgent.substring(0, 50)}`;
	}

	// CHECK RATE LIMIT
	checkLimit(request: RateLimitRequest): RateLimitResult {
		const key = this.config.keyGenerator(request);
		const { totalHits, resetTime } = this.store.increment(key, this.config.windowMs);

		const allowed = totalHits <= this.config.maxRequests;
		const remaining = Math.max(0, this.config.maxRequests - totalHits);

		return {
			allowed,
			remaining,
			resetTime,
			totalHits,
		};
	}

	// GET CURRENT STATUS WITHOUT INCREMENTING
	getStatus(request: RateLimitRequest): RateLimitResult {
		const key = this.config.keyGenerator(request);
		const current = this.store.get(key);

		if (!current) {
			return {
				allowed: true,
				remaining: this.config.maxRequests,
				resetTime: Date.now() + this.config.windowMs,
				totalHits: 0,
			};
		}

		const allowed = current.count <= this.config.maxRequests;
		const remaining = Math.max(0, this.config.maxRequests - current.count);

		return {
			allowed,
			remaining,
			resetTime: current.resetTime,
			totalHits: current.count,
		};
	}
}

// ADAPTIVE RATE LIMITING BASED ON RISK LEVEL
export class AdaptiveRateLimiter {
	private limiters: Map<string, RateLimiter> = new Map();

	constructor() {
		// DIFFERENT RATE LIMITS FOR DIFFERENT RISK LEVELS
		this.limiters.set(
			"LOW",
			new RateLimiter({
				windowMs: 15 * 60 * 1000, // 15 minutes
				maxRequests: 200, // Generous for trusted users
			})
		);

		this.limiters.set(
			"MODERATE",
			new RateLimiter({
				windowMs: 15 * 60 * 1000, // 15 minutes
				maxRequests: 100, // Standard limit
			})
		);

		this.limiters.set(
			"ELEVATED",
			new RateLimiter({
				windowMs: 15 * 60 * 1000, // 15 minutes
				maxRequests: 50, // Reduced for suspicious users
			})
		);

		this.limiters.set(
			"HIGH",
			new RateLimiter({
				windowMs: 5 * 60 * 1000, // 5 minutes
				maxRequests: 10, // Very restrictive
			})
		);

		this.limiters.set(
			"DANGEROUS",
			new RateLimiter({
				windowMs: 60 * 1000, // 1 minute
				maxRequests: 1, // Almost blocked
			})
		);
	}

	// CHECK RATE LIMIT BASED ON RISK LEVEL
	checkLimit(request: RateLimitRequest, riskLevel: string): RateLimitResult {
		const limiter = this.limiters.get(riskLevel) || this.limiters.get("MODERATE");
		return limiter?.checkLimit(request);
	}

	// GET STATUS WITHOUT INCREMENTING
	getStatus(request: RateLimitRequest, riskLevel: string): RateLimitResult {
		const limiter = this.limiters.get(riskLevel) || this.limiters.get("MODERATE");
		return limiter?.getStatus(request);
	}
}

// GLOBAL ADAPTIVE RATE LIMITER INSTANCE
export const adaptiveRateLimiter = new AdaptiveRateLimiter();
