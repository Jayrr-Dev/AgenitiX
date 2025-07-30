// THREAT INTELLIGENCE INTEGRATION FOR ANUBIS
// Integrates with IPsum and other threat feeds for real-time IP reputation

export interface ThreatIntelligenceResult {
	isMalicious: boolean;
	riskScore: number; // 0-100
	sources: string[]; // Which threat feeds flagged this IP
	blacklistHits: number; // Number of blacklists that flagged this IP
	lastSeen: Date | null; // When this IP was last seen as malicious
	confidence: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
}

export interface IPsumEntry {
	ip: string;
	hits: number; // Number of blacklists that flagged this IP
}

// THREAT INTELLIGENCE STATE
const ipsumCache: Map<string, IPsumEntry> = new Map();
let lastUpdate = 0;
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
const IPSUM_URL = "https://raw.githubusercontent.com/stamparm/ipsum/master/ipsum.txt";

// MAIN IP REPUTATION CHECK
export async function checkIPReputation(ip: string): Promise<ThreatIntelligenceResult> {
	// ENSURE IPSUM DATA IS FRESH
	await updateIPsumData();

	// CHECK IPSUM FEED
	const ipsumResult = checkIPsumFeed(ip);

	// CHECK OTHER THREAT SOURCES
	const additionalChecks = await checkAdditionalSources(ip);

	// COMBINE RESULTS
	const combinedResult = combineResults(ip, ipsumResult, additionalChecks);

	return combinedResult;
}

// UPDATE IPSUM DATA FROM GITHUB
async function updateIPsumData(): Promise<void> {
	const now = Date.now();

	// CHECK IF UPDATE IS NEEDED
	if (now - lastUpdate < CACHE_DURATION && ipsumCache.size > 0) {
		return; // Data is still fresh
	}

	try {
		const response = await fetch(IPSUM_URL, {
			headers: {
				"User-Agent": "AgenitiX-Anubis-Bot-Protection/1.0",
			},
		});

		if (!response.ok) {
			throw new Error(`Failed to fetch IPsum data: ${response.status}`);
		}

		const data = await response.text();
		parseIPsumData(data);
		lastUpdate = now;
	} catch (error) {
		console.error("❌ Failed to update IPsum data:", error);
		// Continue with cached data if available
	}
}

// PARSE IPSUM TEXT DATA
function parseIPsumData(data: string): void {
	const lines = data.split("\n");
	ipsumCache.clear();

	for (const line of lines) {
		// SKIP COMMENTS AND EMPTY LINES
		if (line.startsWith("#") || line.trim() === "") {
			continue;
		}

		// PARSE IP AND HIT COUNT
		const parts = line.trim().split(/\s+/);
		if (parts.length >= 2) {
			const ip = parts[0];
			const hits = Number.parseInt(parts[1], 10);

			if (isValidIP(ip) && !Number.isNaN(hits)) {
				ipsumCache.set(ip, { ip, hits });
			}
		}
	}
}

// CHECK IP AGAINST IPSUM FEED
function checkIPsumFeed(ip: string): Partial<ThreatIntelligenceResult> {
	const entry = ipsumCache.get(ip);

	if (!entry) {
		return {
			isMalicious: false,
			riskScore: 0,
			sources: [],
			blacklistHits: 0,
			lastSeen: null,
			confidence: "LOW",
		};
	}

	// CALCULATE RISK SCORE BASED ON HITS
	const riskScore = Math.min(entry.hits * 10, 100);
	const confidence =
		entry.hits >= 5 ? "CRITICAL" : entry.hits >= 3 ? "HIGH" : entry.hits >= 2 ? "MEDIUM" : "LOW";

	return {
		isMalicious: entry.hits > 0,
		riskScore,
		sources: ["IPsum"],
		blacklistHits: entry.hits,
		lastSeen: new Date(), // IPsum doesn't provide timestamps
		confidence,
	};
}

// CHECK ADDITIONAL THREAT SOURCES
function checkAdditionalSources(ip: string): Partial<ThreatIntelligenceResult> {
	const results: Partial<ThreatIntelligenceResult> = {
		isMalicious: false,
		riskScore: 0,
		sources: [],
		blacklistHits: 0,
		lastSeen: null,
		confidence: "LOW",
	};

	// CHECK FOR TOR EXIT NODES
	if (isTorExitNode(ip)) {
		results.isMalicious = true;
		results.riskScore = Math.max(results.riskScore || 0, 30);
		results.sources = [...(results.sources || []), "Tor Exit Node"];
		results.confidence = "MEDIUM";
	}

	// CHECK FOR HOSTING PROVIDERS (LOWER RISK)
	if (isHostingProvider(ip)) {
		results.riskScore = Math.max(results.riskScore || 0, 10);
		results.sources = [...(results.sources || []), "Hosting Provider"];
	}

	// CHECK FOR SUSPICIOUS IP RANGES
	if (isSuspiciousRange(ip)) {
		results.isMalicious = true;
		results.riskScore = Math.max(results.riskScore || 0, 50);
		results.sources = [...(results.sources || []), "Suspicious Range"];
		results.confidence = "HIGH";
	}

	return results;
}

// COMBINE RESULTS FROM MULTIPLE SOURCES
function combineResults(
	_ip: string,
	ipsumResult: Partial<ThreatIntelligenceResult>,
	additionalResult: Partial<ThreatIntelligenceResult>
): ThreatIntelligenceResult {
	const combinedSources = [...(ipsumResult.sources || []), ...(additionalResult.sources || [])];

	const combinedBlacklistHits =
		(ipsumResult.blacklistHits || 0) + (additionalResult.blacklistHits || 0);
	const combinedRiskScore = Math.min(
		(ipsumResult.riskScore || 0) + (additionalResult.riskScore || 0),
		100
	);

	const isMalicious = Boolean(ipsumResult.isMalicious || additionalResult.isMalicious);

	// DETERMINE CONFIDENCE LEVEL
	let confidence: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" = "LOW";
	if (combinedRiskScore >= 80 || ipsumResult.confidence === "CRITICAL") {
		confidence = "CRITICAL";
	} else if (combinedRiskScore >= 60 || ipsumResult.confidence === "HIGH") {
		confidence = "HIGH";
	} else if (combinedRiskScore >= 30 || ipsumResult.confidence === "MEDIUM") {
		confidence = "MEDIUM";
	}

	return {
		isMalicious,
		riskScore: combinedRiskScore,
		sources: combinedSources,
		blacklistHits: combinedBlacklistHits,
		lastSeen: ipsumResult.lastSeen || additionalResult.lastSeen || null,
		confidence,
	};
}

// VALIDATE IP ADDRESS FORMAT
function isValidIP(ip: string): boolean {
	const ipv4Regex =
		/^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
	return ipv4Regex.test(ip);
}

// CHECK IF IP IS A TOR EXIT NODE
function isTorExitNode(ip: string): boolean {
	// SIMPLIFIED TOR EXIT NODE DETECTION
	// In a real implementation, you'd check against a TOR exit node list
	const torRanges = [
		"176.10.99.200",
		"176.10.99.201",
		"176.10.99.202",
		// Add more TOR exit nodes as needed
	];

	return torRanges.includes(ip);
}

// CHECK IF IP BELONGS TO A HOSTING PROVIDER
function isHostingProvider(ip: string): boolean {
	// SIMPLIFIED HOSTING PROVIDER DETECTION
	const hostingRanges = [
		"8.8.8.8", // Google DNS (example)
		"1.1.1.1", // Cloudflare DNS (example)
		// Add more hosting provider ranges as needed
	];

	return hostingRanges.includes(ip);
}

// CHECK IF IP IS IN A SUSPICIOUS RANGE
function isSuspiciousRange(ip: string): boolean {
	// SIMPLIFIED SUSPICIOUS RANGE DETECTION
	const suspiciousRanges = [
		"192.168.1.1", // Local network (example)
		"10.0.0.1", // Private network (example)
		// Add more suspicious ranges as needed
	];

	return suspiciousRanges.includes(ip);
}

// GET CACHE STATISTICS
export function getCacheStats(): { size: number; lastUpdate: Date | null; isStale: boolean } {
	const now = Date.now();
	const isStale = now - lastUpdate > CACHE_DURATION;

	return {
		size: ipsumCache.size,
		lastUpdate: lastUpdate > 0 ? new Date(lastUpdate) : null,
		isStale,
	};
}

// REFRESH CACHE MANUALLY
export async function refreshCache(): Promise<void> {
	lastUpdate = 0; // Force refresh
	await updateIPsumData();
}
