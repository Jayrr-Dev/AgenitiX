// ADAPTIVE RISK ENGINE FOR ANUBIS
import { ThreatIntelligence } from "./threat-intelligence";

export interface RiskFactors {
	ipReputation: number; // 0-100 (100 = known bad)
	geolocation: number; // 0-100 (100 = high-risk country)
	userAgent: number; // 0-100 (100 = suspicious/bot-like)
	requestPattern: number; // 0-100 (100 = automated pattern)
	timeOfDay: number; // 0-100 (100 = unusual hours)
	sessionHistory: number; // 0-100 (100 = multiple failures)
	deviceFingerprint: number; // 0-100 (100 = suspicious device)
	networkBehavior: number; // 0-100 (100 = proxy/VPN/hosting)
}

export interface RiskLevel {
	level: 1 | 2 | 3 | 4 | 5;
	name: "LOW" | "MODERATE" | "ELEVATED" | "HIGH" | "DANGEROUS";
	score: number;
	color: string;
	description: string;
}

export interface AdaptiveConfig {
	optimisticEnabled: boolean;
	gracePeriod: number;
	challengeDifficulty: number;
	maxFailures: number;
	sessionTimeout: number;
	requiresInteraction: boolean;
	blockingMode: boolean;
}

// RISK LEVEL DEFINITIONS
export const RISK_LEVELS: Record<number, RiskLevel> = {
	1: {
		level: 1,
		name: "LOW",
		score: 0,
		color: "#10b981", // green
		description: "Trusted user, minimal security measures",
	},
	2: {
		level: 2,
		name: "MODERATE",
		score: 25,
		color: "#3b82f6", // blue
		description: "Standard user, balanced security",
	},
	3: {
		level: 3,
		name: "ELEVATED",
		score: 50,
		color: "#f59e0b", // yellow
		description: "Suspicious activity, immediate verification required",
	},
	4: {
		level: 4,
		name: "HIGH",
		score: 75,
		color: "#ef4444", // red
		description: "High threat, strict verification required",
	},
	5: {
		level: 5,
		name: "DANGEROUS",
		score: 90,
		color: "#7c2d12", // dark red
		description: "Extreme threat, maximum security measures",
	},
};

// ADAPTIVE CONFIGURATIONS BY RISK LEVEL
export const ADAPTIVE_CONFIGS: Record<number, AdaptiveConfig> = {
	1: {
		// LOW RISK - Maximum Optimism
		optimisticEnabled: true,
		gracePeriod: 60000, // 60 seconds
		challengeDifficulty: 2, // Very easy
		maxFailures: 5,
		sessionTimeout: 7200000, // 2 hours
		requiresInteraction: false,
		blockingMode: false,
	},
	2: {
		// MODERATE RISK - Standard Optimism
		optimisticEnabled: true,
		gracePeriod: 30000, // 30 seconds
		challengeDifficulty: 3, // Easy
		maxFailures: 3,
		sessionTimeout: 3600000, // 1 hour
		requiresInteraction: false,
		blockingMode: false,
	},
	3: {
		// ELEVATED RISK - NO OPTIMISM
		optimisticEnabled: false, // DISABLED - immediate challenge
		gracePeriod: 0, // No grace period
		challengeDifficulty: 4, // Medium difficulty (~1-2 seconds)
		maxFailures: 2,
		sessionTimeout: 1800000, // 30 minutes
		requiresInteraction: true,
		blockingMode: false,
	},
	4: {
		// HIGH RISK - NO OPTIMISM
		optimisticEnabled: false, // DISABLED - immediate challenge
		gracePeriod: 0, // No grace period
		challengeDifficulty: 6, // Hard difficulty (~5-15 seconds)
		maxFailures: 1,
		sessionTimeout: 900000, // 15 minutes
		requiresInteraction: true,
		blockingMode: false,
	},
	5: {
		// DANGEROUS - NO OPTIMISM
		optimisticEnabled: false, // DISABLED - immediate challenge
		gracePeriod: 0, // No grace period
		challengeDifficulty: 8, // Maximum difficulty (~30-120 seconds)
		maxFailures: 1,
		sessionTimeout: 300000, // 5 minutes
		requiresInteraction: true,
		blockingMode: true,
	},
};

// RISK CALCULATION ENGINE
export namespace RiskEngine {
	// CALCULATE OVERALL RISK SCORE
	export function calculateRiskScore(factors: Partial<RiskFactors>): number {
		const weights: Record<keyof RiskFactors, number> = {
			ipReputation: 0.2, // Reduced from 0.25
			geolocation: 0.08, // Reduced from 0.10
			userAgent: 0.35, // INCREASED from 0.15 - most important for bot detection
			requestPattern: 0.15, // Reduced from 0.20
			timeOfDay: 0.05, // Same
			sessionHistory: 0.1, // Reduced from 0.15
			deviceFingerprint: 0.04, // Reduced from 0.05
			networkBehavior: 0.03, // Reduced from 0.05
		};

		let totalScore = 0;
		let totalWeight = 0;

		for (const [key, value] of Object.entries(factors)) {
			if (value !== undefined && weights[key as keyof RiskFactors]) {
				totalScore += value * weights[key as keyof RiskFactors];
				totalWeight += weights[key as keyof RiskFactors];
			}
		}

		return totalWeight > 0 ? Math.round(totalScore / totalWeight) : 0;
	}

	// DETERMINE RISK LEVEL FROM SCORE
	export function getRiskLevel(score: number): RiskLevel {
		// GET THRESHOLDS FROM ENVIRONMENT VARIABLES OR USE DEFAULTS
		const thresholds = {
			moderate: Number.parseInt(process.env.ANUBIS_RISK_THRESHOLD_LOW || "20", 10),
			elevated: Number.parseInt(process.env.ANUBIS_RISK_THRESHOLD_MODERATE || "40", 10),
			high: Number.parseInt(process.env.ANUBIS_RISK_THRESHOLD_ELEVATED || "55", 10),
			dangerous: Number.parseInt(process.env.ANUBIS_RISK_THRESHOLD_HIGH || "70", 10),
		};

		if (score >= thresholds.dangerous) {
			return RISK_LEVELS[5]; // DANGEROUS
		}
		if (score >= thresholds.high) {
			return RISK_LEVELS[4]; // HIGH
		}
		if (score >= thresholds.elevated) {
			return RISK_LEVELS[3]; // ELEVATED
		}
		if (score >= thresholds.moderate) {
			return RISK_LEVELS[2]; // MODERATE
		}
		return RISK_LEVELS[1]; // LOW
	}

	// GET ADAPTIVE CONFIG FOR RISK LEVEL
	export function getAdaptiveConfig(riskLevel: number): AdaptiveConfig {
		return ADAPTIVE_CONFIGS[riskLevel] || ADAPTIVE_CONFIGS[2];
	}

	// ANALYZE REQUEST AND RETURN RISK ASSESSMENT
	export async function analyzeRequest(request: {
		ip: string;
		userAgent: string;
		headers: Record<string, string>;
		sessionHistory?: Record<string, unknown>;
		timestamp: number;
	}): Promise<{ riskLevel: RiskLevel; config: AdaptiveConfig; factors: RiskFactors }> {
		const factors: RiskFactors = {
			ipReputation: await checkIPReputation(request.ip),
			geolocation: await checkGeolocation(request.ip),
			userAgent: analyzeUserAgent(request.userAgent),
			requestPattern: analyzeRequestPattern(request),
			timeOfDay: analyzeTimeOfDay(request.timestamp),
			sessionHistory: analyzeSessionHistory(request.sessionHistory),
			deviceFingerprint: analyzeDeviceFingerprint(request.headers),
			networkBehavior: analyzeNetworkBehavior(request.ip),
		};

		const score = calculateRiskScore(factors);
		const riskLevel = getRiskLevel(score);
		const config = getAdaptiveConfig(riskLevel.level);

		return { riskLevel, config, factors };
	}

	// INDIVIDUAL RISK FACTOR ANALYZERS
	async function checkIPReputation(ip: string): Promise<number> {
		// LOCAL/PRIVATE IPS (SAFE)
		if (
			ip.startsWith("127.") ||
			ip.startsWith("192.168.") ||
			ip.startsWith("10.") ||
			ip.startsWith("172.16.")
		) {
			return 0;
		}

		try {
			// USE ENHANCED THREAT INTELLIGENCE
			const threatResult = await ThreatIntelligence.checkIPReputation(ip);

			if (threatResult.isMalicious) {
				return threatResult.riskScore;
			}

			// NOT IN THREAT FEEDS - CHECK ADDITIONAL PATTERNS
			return checkAdditionalIPPatterns(ip);
		} catch (error) {
			console.error(`❌ Error checking IP reputation for ${ip}:`, error);
			// FALLBACK TO BASIC CHECKS
			return checkAdditionalIPPatterns(ip);
		}
	}

	// ADDITIONAL IP PATTERN CHECKS (FALLBACK)
	function checkAdditionalIPPatterns(ip: string): number {
		// TOR EXIT NODES PATTERNS (BACKUP CHECK)
		const torPatterns = [
			/^185\.220\./, // Common Tor range
			/^199\.87\./, // Common Tor range
			/^176\.10\./, // Common Tor range
			/^51\.15\./, // Some Tor exits
			/^163\.172\./, // Some Tor exits
		];

		if (torPatterns.some((pattern) => pattern.test(ip))) {
			return 85;
		}

		// HOSTING PROVIDER RANGES
		const hostingRanges = [
			/^5\./, // Many VPS providers
			/^104\./, // US hosting/CDN
			/^185\./, // European hosting
			/^172\.(?!1[6-9]|2[0-9]|3[01])\./, // Hosting (excluding private 172.16-31)
			/^198\.199\./, // DigitalOcean
			/^159\.203\./, // DigitalOcean
			/^142\.93\./, // DigitalOcean
			/^167\.99\./, // DigitalOcean
		];

		if (hostingRanges.some((pattern) => pattern.test(ip))) {
			return 60;
		}

		// SUSPICIOUS RANGES
		const suspiciousRanges = [
			/^103\./, // APNIC region, often abused
			/^125\./, // APNIC region
			/^180\./, // APNIC region
			/^200\./, // LACNIC region
			/^46\./, // RIPE region, some abuse
			/^80\./, // RIPE region
			/^92\./, // RIPE region
			/^93\./, // RIPE region
		];

		if (suspiciousRanges.some((pattern) => pattern.test(ip))) {
			return 40;
		}
		return 15; // Low risk for unknown but clean IPs
	}

	function checkGeolocation(_ip: string): number {
		// High-risk countries/regions
		const _highRiskCountries = new Set(["CN", "RU", "KP", "IR"]);

		try {
			return 35; // Increased from 20 - default moderate risk
		} catch {
			return 45; // Increased from 30 - unknown location = higher risk
		}
	}

	function analyzeUserAgent(userAgent: string): number {
		if (!userAgent) {
			return 95; // No user agent = very suspicious
		}

		// AGGRESSIVE BOT DETECTION PATTERNS
		const botPatterns = [
			/bot/i,
			/crawler/i,
			/spider/i,
			/scraper/i,
			/curl/i,
			/wget/i,
			/python/i,
			/java/i,
			/perl/i,
			/ruby/i,
			/node/i,
			/go-http/i,
			/httpclient/i,
			/okhttp/i,
			/axios/i,
			/request/i,
			/urllib/i,
			/fetch/i,
			/phantom/i,
			/headless/i,
			/selenium/i,
			/webdriver/i,
			/automation/i,
		];

		if (botPatterns.some((pattern) => pattern.test(userAgent))) {
			return 90; // Very high risk for known bot patterns
		}

		// SUSPICIOUS CHARACTERISTICS
		let suspicionScore = 0;

		// Too short or too long
		if (userAgent.length < 10 || userAgent.length > 500) {
			suspicionScore += 40;
		}

		// Missing common browser indicators
		if (
			!(
				/Mozilla/i.test(userAgent) ||
				/Chrome/i.test(userAgent) ||
				/Firefox/i.test(userAgent) ||
				/Safari/i.test(userAgent) ||
				/Edge/i.test(userAgent)
			)
		) {
			suspicionScore += 35;
		}

		// Suspicious patterns
		if (/^[A-Z\s]+$/i.test(userAgent)) {
			suspicionScore += 30; // All caps or very simple
		}

		if (!(/\(/.test(userAgent) && /\)/.test(userAgent))) {
			suspicionScore += 25; // Missing parentheses (common in real browsers)
		}

		// Check for version patterns
		if (!/\d+\.\d+/.test(userAgent)) {
			suspicionScore += 20; // No version numbers
		}

		return Math.min(suspicionScore, 95);
	}

	function analyzeTimeOfDay(timestamp: number): number {
		const hour = new Date(timestamp).getHours();

		// High activity during typical bot hours (midnight to 6 AM)
		if (hour >= 0 && hour < 6) {
			return 25; // Increased from 15
		}

		// Business hours (9 AM to 5 PM) - lower risk
		if (hour >= 9 && hour <= 17) {
			return 5;
		}

		// Evening hours - moderate risk
		return 10;
	}

	/**
	 * Analyzes missing common headers
	 */
	function analyzeMissingHeaders(headers: Record<string, string>): number {
		let riskScore = 0;

		if (!headers.accept) {
			riskScore += 15;
		}
		if (!headers["accept-language"]) {
			riskScore += 10;
		}
		if (!headers["accept-encoding"]) {
			riskScore += 10;
		}

		return riskScore;
	}

	/**
	 * Analyzes suspicious header values
	 */
	function analyzeSuspiciousHeaders(headers: Record<string, string>): number {
		let riskScore = 0;

		if (headers.accept === "*/*") {
			riskScore += 20; // Generic accept header
		}

		if (headers["accept-language"] === "en-US" && !headers["accept-language"].includes(",")) {
			riskScore += 15; // Too simple language header
		}

		return riskScore;
	}

	/**
	 * Analyzes user agent mismatches
	 */
	function analyzeUserAgentMismatch(userAgent: string, headers: Record<string, string>): number {
		let riskScore = 0;

		if (userAgent) {
			// Chrome user agent without Chrome-specific headers
			if (/Chrome/i.test(userAgent) && !headers["sec-ch-ua"]) {
				riskScore += 25;
			}

			// Firefox without Firefox headers
			if (/Firefox/i.test(userAgent) && headers["sec-ch-ua"]) {
				riskScore += 20; // Firefox shouldn't have Chrome-specific headers
			}
		}

		return riskScore;
	}

	/**
	 * Analyzes automation and suspicious combinations
	 */
	function analyzeAutomationIndicators(headers: Record<string, string>): number {
		let riskScore = 0;

		// AUTOMATION INDICATORS
		if (headers["x-requested-with"] === "XMLHttpRequest" && !headers.referer) {
			riskScore += 15; // AJAX without referer
		}

		// SUSPICIOUS COMBINATIONS
		if (!(headers.referer || headers.origin) && headers.accept !== "text/html") {
			riskScore += 20; // API-like request without proper context
		}

		return riskScore;
	}

	function analyzeRequestPattern(request: {
		headers: Record<string, string>;
		userAgent: string;
		ip: string;
	}): number {
		const headers = request.headers || {};
		const userAgent = request.userAgent;

		let riskScore = 0;
		riskScore += analyzeMissingHeaders(headers);
		riskScore += analyzeSuspiciousHeaders(headers);
		riskScore += analyzeUserAgentMismatch(userAgent, headers);
		riskScore += analyzeAutomationIndicators(headers);

		return Math.min(riskScore, 95);
	}

	function analyzeDeviceFingerprint(headers: Record<string, string>): number {
		let riskScore = 0;

		// Missing device-specific headers
		if (!headers["sec-ch-ua-platform"]) {
			riskScore += 10;
		}

		if (!headers["sec-ch-ua-mobile"]) {
			riskScore += 10;
		}

		// Generic or missing viewport
		if (!(headers["viewport-width"] || headers["sec-ch-viewport-width"])) {
			riskScore += 5;
		}

		return Math.min(riskScore, 50);
	}

	/**
	 * Analyzes request volume patterns
	 */
	function analyzeRequestVolume(history: Record<string, unknown>): number {
		let riskScore = 0;

		if (typeof history === "object" && "requestCount" in history) {
			const requestCount = history.requestCount as number;
			if (requestCount > 100) {
				riskScore += 40; // Very high request volume
			} else if (requestCount > 50) {
				riskScore += 25;
			} else if (requestCount > 20) {
				riskScore += 15;
			}
		}

		return riskScore;
	}

	/**
	 * Analyzes user agent consistency patterns
	 */
	function analyzePatternConsistency(history: Record<string, unknown>): number {
		let riskScore = 0;

		if (typeof history === "object" && "userAgentChanges" in history) {
			const changes = history.userAgentChanges as number;
			if (changes > 3) {
				riskScore += 30; // Frequent user agent changes
			} else if (changes > 1) {
				riskScore += 15;
			}
		}

		return riskScore;
	}

	function analyzeSessionHistory(history: Record<string, unknown> | undefined): number {
		if (!history) {
			return 15; // Increased from 10 - no history = slight risk
		}

		let riskScore = 0;
		riskScore += analyzeRequestVolume(history);
		riskScore += analyzePatternConsistency(history);

		return Math.min(riskScore, 80);
	}

	function analyzeNetworkBehavior(_ip: string): number {
		// IMPLEMENT PROXY/VPN/HOSTING DETECTION
		// This could be enhanced with external services
		return 25; // Increased from 20 - default moderate risk
	}
}

// RISK MONITORING NAMESPACE
export namespace RiskMonitor {
	const riskHistory: Map<string, RiskLevel[]> = new Map();

	export function trackRisk(identifier: string, riskLevel: RiskLevel) {
		if (!riskHistory.has(identifier)) {
			riskHistory.set(identifier, []);
		}

		const history = riskHistory.get(identifier);
		if (history) {
			history.push(riskLevel);

			// Keep only last 10 entries
			if (history.length > 10) {
				history.shift();
			}

			// CHECK FOR RISK ESCALATION
			checkRiskEscalation(identifier, history);
		}
	}

	function checkRiskEscalation(identifier: string, history: RiskLevel[]) {
		if (history.length >= 3) {
			const recentLevels = history.slice(-3).map((r) => r.level);
			const isEscalating = recentLevels.every(
				(level, index) => index === 0 || level >= recentLevels[index - 1]
			);

			if (isEscalating && recentLevels[recentLevels.length - 1] >= 4) {
				console.warn(`🚨 Risk escalation detected for ${identifier}: ${recentLevels.join(" → ")}`);
			}
		}
	}

	export function getRiskTrend(identifier: string): "increasing" | "decreasing" | "stable" {
		const history = riskHistory.get(identifier);
		if (!history || history.length < 2) {
			return "stable";
		}

		const recent = history.slice(-3);
		const avg = recent.reduce((sum, r) => sum + r.level, 0) / recent.length;
		const earlier = history.slice(-6, -3);

		if (earlier.length === 0) {
			return "stable";
		}

		const earlierAvg = earlier.reduce((sum, r) => sum + r.level, 0) / earlier.length;

		if (avg > earlierAvg + 0.5) {
			return "increasing";
		}
		if (avg < earlierAvg - 0.5) {
			return "decreasing";
		}
		return "stable";
	}
}
