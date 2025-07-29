// ANUBIS STANDALONE - MAIN EXPORT FILE
// Enterprise-grade adaptive bot protection system

// CORE TYPES
export type {
	AnubisConfig,
	AnubisChallenge,
	AnubisChallengeResponse,
	AnubisJWTPayload,
	RouteProtectionConfig,
	AnubisContextType,
} from "./types/anubis";

// RISK ENGINE
export {
	RiskEngine,
	RiskMonitor,
	RISK_LEVELS,
	ADAPTIVE_CONFIGS,
} from "./lib/risk-engine";

export type {
	RiskFactors,
	RiskLevel,
	AdaptiveConfig,
} from "./lib/risk-engine";

// THREAT INTELLIGENCE
export { ThreatIntelligence } from "./lib/threat-intelligence";

export type { ThreatIntelResult } from "./lib/threat-intelligence";

// CRYPTO UTILITIES
export {
	AnubisCrypto,
	AnubisJWT,
} from "./lib/crypto";

// CONFIGURATION
export {
	loadAnubisConfig,
	RouteProtectionManager,
	getRouteProtectionManager,
} from "./lib/config";

// RATE LIMITING
export {
	RateLimiter,
	AdaptiveRateLimiter,
	adaptiveRateLimiter,
} from "./lib/rate-limiter";

export type {
	RateLimitConfig,
	RateLimitResult,
} from "./lib/rate-limiter";

// BROWSER CLIENT (Optional - only when bundled for browser)
export { default as AnubisBrowser } from "./browser/anubis-browser";
export type {
	AnubisBrowserConfig,
	BrowserChallenge,
	ChallengeResponse,
} from "./browser/anubis-browser";

import { RouteProtectionManager, loadAnubisConfig } from "./lib/config";
import { AnubisCrypto, AnubisJWT } from "./lib/crypto";
import { adaptiveRateLimiter } from "./lib/rate-limiter";
import { RiskEngine } from "./lib/risk-engine";
// IMPORTS FOR MAIN CLASS
import type {
	AnubisChallenge,
	AnubisChallengeResponse,
	AnubisConfig,
	AnubisJWTPayload,
} from "./types/anubis";

// MAIN ANUBIS CLASS FOR EASY INTEGRATION
export class Anubis {
	private config: AnubisConfig;
	private routeManager: RouteProtectionManager;

	constructor(config?: Partial<AnubisConfig>) {
		this.config = loadAnubisConfig();
		if (config) {
			this.config = { ...this.config, ...config };
		}
		this.routeManager = new RouteProtectionManager(this.config);
	}

	// ANALYZE REQUEST RISK
	analyzeRequest(request: {
		ip: string;
		userAgent: string;
		headers: Record<string, string>;
		sessionHistory?: Record<string, unknown>;
		timestamp?: number;
	}) {
		return RiskEngine.analyzeRequest({
			...request,
			timestamp: request.timestamp || Date.now(),
		});
	}

	// CHECK IF ROUTE IS PROTECTED
	isRouteProtected(pathname: string): boolean {
		return this.routeManager.isRouteProtected(pathname);
	}

	// VALIDATE PROOF OF WORK
	async validateProofOfWork(
		response: AnubisChallengeResponse,
		difficulty?: number
	): Promise<boolean> {
		return await AnubisCrypto.validateProofOfWork(response, difficulty || this.config.difficulty);
	}

	// CREATE CHALLENGE
	createChallenge(
		request: {
			userAgent?: string;
			acceptLanguage?: string;
			ip?: string;
		},
		difficulty?: number
	): AnubisChallenge {
		return AnubisCrypto.createChallenge(request, difficulty || this.config.difficulty);
	}

	// VERIFY JWT TOKEN
	async verifyToken(token: string): Promise<AnubisJWTPayload | null> {
		return await AnubisJWT.verify(token, this.config.jwtSecret);
	}

	// SIGN JWT TOKEN
	async signToken(payload: AnubisJWTPayload): Promise<string> {
		return await AnubisJWT.sign(payload, this.config.jwtSecret);
	}

	// CHECK RATE LIMIT
	checkRateLimit(
		request: { ip: string; userAgent: string; [key: string]: unknown },
		riskLevel: string
	) {
		return adaptiveRateLimiter.checkLimit(request, riskLevel);
	}

	// GET CONFIGURATION
	getConfig(): AnubisConfig {
		return { ...this.config };
	}

	// UPDATE CONFIGURATION
	updateConfig(newConfig: Partial<AnubisConfig>): void {
		this.config = { ...this.config, ...newConfig };
		this.routeManager = new RouteProtectionManager(this.config);
	}
}

// DEFAULT EXPORT
export default Anubis;
