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
export class RiskEngine {
	// CALCULATE OVERALL RISK SCORE
	static calculateRiskScore(factors: Partial<RiskFactors>): number {
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

		Object.entries(factors).forEach(([key, value]) => {
			if (value !== undefined && weights[key as keyof RiskFactors]) {
				totalScore += value * weights[key as keyof RiskFactors];
				totalWeight += weights[key as keyof RiskFactors];
			}
		});

		return totalWeight > 0 ? Math.round(totalScore / totalWeight) : 0;
	}

	// DETERMINE RISK LEVEL FROM SCORE
	static getRiskLevel(score: number): RiskLevel {
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
	static getAdaptiveConfig(riskLevel: number): AdaptiveConfig {
		return ADAPTIVE_CONFIGS[riskLevel] || ADAPTIVE_CONFIGS[2];
	}

	// ANALYZE REQUEST AND RETURN RISK ASSESSMENT
	static async analyzeRequest(request: {
		ip: string;
		userAgent: string;
		headers: Record<string, string>;
		sessionHistory?: any;
		timestamp: number;
	}): Promise<{ riskLevel: RiskLevel; config: AdaptiveConfig; factors: RiskFactors }> {
		const factors: RiskFactors = {
			ipReputation: await RiskEngine.checkIPReputation(request.ip),
			geolocation: await RiskEngine.checkGeolocation(request.ip),
			userAgent: RiskEngine.analyzeUserAgent(request.userAgent),
			requestPattern: RiskEngine.analyzeRequestPattern(request),
			timeOfDay: RiskEngine.analyzeTimeOfDay(request.timestamp),
			sessionHistory: RiskEngine.analyzeSessionHistory(request.sessionHistory),
			deviceFingerprint: RiskEngine.analyzeDeviceFingerprint(request.headers),
			networkBehavior: await RiskEngine.analyzeNetworkBehavior(request.ip),
		};

		const score = RiskEngine.calculateRiskScore(factors);
		const riskLevel = RiskEngine.getRiskLevel(score);
		const config = RiskEngine.getAdaptiveConfig(riskLevel.level);

		return { riskLevel, config, factors };
	}

	// INDIVIDUAL RISK FACTOR ANALYZERS
	private static async checkIPReputation(ip: string): Promise<number> {
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
			return RiskEngine.checkAdditionalIPPatterns(ip);
		} catch (error) {
			console.error(`❌ Error checking IP reputation for ${ip}:`, error);
			// FALLBACK TO BASIC CHECKS
			return RiskEngine.checkAdditionalIPPatterns(ip);
		}
	}

	// ADDITIONAL IP PATTERN CHECKS (FALLBACK)
	private static checkAdditionalIPPatterns(ip: string): number {
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

	private static async checkGeolocation(_ip: string): Promise<number> {
		// High-risk countries/regions
		const _highRiskCountries = new Set(["CN", "RU", "KP", "IR"]);

		try {
			return 35; // Increased from 20 - default moderate risk
		} catch {
			return 45; // Increased from 30 - unknown location = higher risk
		}
	}

	private static analyzeUserAgent(userAgent: string): number {
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
			/requests/i,
			/urllib/i,
			/httpx/i,
			/aiohttp/i,
			/scrapy/i,
			/beautifulsoup/i,
			/mechanize/i,
		];

		// HEADLESS BROWSER AND AUTOMATION PATTERNS
		const headlessPatterns = [
			/headless/i,
			/phantom/i,
			/selenium/i,
			/webdriver/i,
			/puppeteer/i,
			/playwright/i,
			/chromedriver/i,
			/automated/i,
			/test/i,
		];

		// SUSPICIOUS CHARACTERISTICS
		const suspiciousPatterns = [
			/^[a-zA-Z0-9\-\.\/\s]{1,20}$/, // Very short user agents
			/^Mozilla\/[0-9]\.[0-9]$/, // Minimal Mozilla strings
			/Windows NT [0-9]+\.[0-9]+\)$/, // Incomplete Windows strings
		];

		// LEGITIMATE BROWSER PATTERNS (lower risk)
		const legitimateBrowsers = [
			/Chrome\/[0-9]{2,3}\.[0-9]+\.[0-9]+\.[0-9]+.*Safari\/[0-9]+/,
			/Firefox\/[0-9]{2,3}\.[0-9]+/,
			/Safari\/[0-9]+.*Version\/[0-9]+/,
			/Edge\/[0-9]+/,
			/Opera\/[0-9]+/,
		];

		// CHECK FOR KNOWN BOTS (highest risk)
		if (botPatterns.some((pattern) => pattern.test(userAgent))) {
			return 98; // Very high risk for obvious bots
		}

		// CHECK FOR HEADLESS BROWSERS (high risk)
		if (headlessPatterns.some((pattern) => pattern.test(userAgent))) {
			return 85; // High risk for automation tools
		}

		// CHECK FOR SUSPICIOUS PATTERNS (moderate-high risk)
		if (suspiciousPatterns.some((pattern) => pattern.test(userAgent))) {
			return 70; // Moderate-high risk for suspicious patterns
		}

		// CHECK FOR LEGITIMATE BROWSERS (low risk)
		if (legitimateBrowsers.some((pattern) => pattern.test(userAgent))) {
			return 5; // Very low risk for real browsers
		}

		// FALLBACK: Unknown user agent patterns
		if (userAgent.length < 30) {
			return 60; // Moderate risk for short user agents
		}
		return 25; // Default moderate risk for unknown patterns
	}

	private static analyzeRequestPattern(request: any): number {
		let riskScore = 0;
		const headers = request.headers || {};

		// CHECK FOR AUTOMATION INDICATORS IN HEADERS
		const automationHeaders = [
			"x-requested-with",
			"x-automation",
			"x-test",
			"x-selenium",
			"x-webdriver",
		];

		const hasAutomationHeaders = automationHeaders.some(
			(header) => headers[header] || headers[header.toLowerCase()]
		);

		if (hasAutomationHeaders) {
			riskScore += 40;
		}

		// CHECK FOR MISSING STANDARD BROWSER HEADERS
		const expectedHeaders = ["accept", "accept-language", "accept-encoding"];
		const missingHeaders = expectedHeaders.filter(
			(header) => !(headers[header] || headers[header.toLowerCase()])
		);

		if (missingHeaders.length > 0) {
			riskScore += missingHeaders.length * 15;
		}

		// CHECK FOR SUSPICIOUS HEADER VALUES
		const acceptHeader = headers.accept || headers.Accept || "";
		if (acceptHeader === "*/*" && !headers["accept-language"]) {
			riskScore += 25;
		}

		// CHECK FOR UNUSUAL HEADER COMBINATIONS
		const userAgent = headers["user-agent"] || headers["User-Agent"] || "";
		const acceptLanguage = headers["accept-language"] || headers["Accept-Language"] || "";

		// Chrome browser should have accept-language
		if (userAgent.includes("Chrome") && !acceptLanguage) {
			riskScore += 30;
		}

		// CHECK FOR RAPID SEQUENTIAL REQUESTS (if timestamp data available)
		// This would require session tracking implementation
		// const requestFrequency = analyzeRequestFrequency(request);
		// if (requestFrequency > threshold) riskScore += 50;

		// CHECK FOR SUSPICIOUS CONNECTION PATTERNS
		const connection = headers.connection || headers.Connection || "";
		if (connection.toLowerCase() === "close" && userAgent.includes("Mozilla")) {
			riskScore += 20;
		}

		return Math.min(riskScore, 100); // Cap at 100
	}

	private static analyzeTimeOfDay(timestamp: number): number {
		const hour = new Date(timestamp).getHours();
		// Higher risk during typical bot hours (2-6 AM)
		if (hour >= 2 && hour <= 6) {
			return 60; // Increased from 40
		}
		return 15; // Increased from 10
	}

	private static analyzeSessionHistory(history: any): number {
		if (!history) {
			return 35; // Increased from 20 - no history is more suspicious
		}

		const failures = history.failures || 0;
		const challenges = history.challenges || 0;

		if (failures > 3) {
			return 95; // Increased from 90
		}
		if (failures > 1) {
			return 70; // Increased from 60
		}
		if (challenges > 5) {
			return 50; // Increased from 40
		}
		return 5; // Decreased from 10 - clean history is very good
	}

	private static analyzeDeviceFingerprint(headers: Record<string, string>): number {
		// Analyze browser capabilities, screen resolution, etc.
		const acceptLanguage = headers["accept-language"];
		const acceptEncoding = headers["accept-encoding"];
		const acceptHeader = headers.accept;

		let suspiciousCount = 0;

		if (!acceptLanguage) {
			suspiciousCount++;
		}
		if (!acceptEncoding) {
			suspiciousCount++;
		}
		if (!acceptHeader) {
			suspiciousCount++;
		}

		// More missing headers = higher risk
		if (suspiciousCount >= 2) {
			return 75; // High risk for missing multiple headers
		}
		if (suspiciousCount === 1) {
			return 45; // Moderate risk for one missing header
		}
		return 10; // Low risk for complete headers
	}

	private static async analyzeNetworkBehavior(_ip: string): Promise<number> {
		return 35; // Increased from 25 - default moderate risk
	}
}

// RISK MONITORING AND ALERTS
export class RiskMonitor {
	private static riskHistory: Map<string, RiskLevel[]> = new Map();

	static trackRisk(identifier: string, riskLevel: RiskLevel) {
		if (!RiskMonitor.riskHistory.has(identifier)) {
			RiskMonitor.riskHistory.set(identifier, []);
		}

		const history = RiskMonitor.riskHistory.get(identifier)!;
		history.push(riskLevel);

		// Keep only last 10 entries
		if (history.length > 10) {
			history.shift();
		}

		// Check for escalating risk
		RiskMonitor.checkRiskEscalation(identifier, history);
	}

	private static checkRiskEscalation(identifier: string, history: RiskLevel[]) {
		if (history.length < 3) {
			return;
		}

		const recent = history.slice(-3);
		const isEscalating = recent.every(
			(level, index) => index === 0 || level.level >= recent[index - 1].level
		);

		if (isEscalating && recent[recent.length - 1].level >= 4) {
			console.warn(`Risk escalation detected for ${identifier}:`, recent);
			// Implement alerting logic here
		}
	}

	static getRiskTrend(identifier: string): "increasing" | "decreasing" | "stable" {
		const history = RiskMonitor.riskHistory.get(identifier);
		if (!history || history.length < 2) {
			return "stable";
		}

		const recent = history.slice(-5);
		const avgRecent = recent.reduce((sum, r) => sum + r.level, 0) / recent.length;
		const older = history.slice(-10, -5);
		const avgOlder =
			older.length > 0 ? older.reduce((sum, r) => sum + r.level, 0) / older.length : avgRecent;

		if (avgRecent > avgOlder + 0.5) {
			return "increasing";
		}
		if (avgRecent < avgOlder - 0.5) {
			return "decreasing";
		}
		return "stable";
	}
}
