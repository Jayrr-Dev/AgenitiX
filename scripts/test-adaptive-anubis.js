#!/usr/bin/env node

/**
 * ADAPTIVE ANUBIS TESTING SUITE
 * Tests the 5-level adaptive risk system with various scenarios
 */

const https = require("https");
const http = require("http");
const { performance } = require("perf_hooks");

// TEST CONFIGURATION
const CONFIG = {
	// Update this to your test server URL
	baseUrl: process.env.TEST_SERVER_URL || "http://localhost:3000",

	// Test endpoints
	endpoints: ["/admin", "/dashboard", "/api/protected"],

	// Test scenarios
	scenarios: {
		// Level 1: LOW RISK - Trusted user
		lowRisk: {
			userAgent:
				"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
			headers: {
				Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
				"Accept-Language": "en-US,en;q=0.5",
				"Accept-Encoding": "gzip, deflate, br",
				Connection: "keep-alive",
				"Upgrade-Insecure-Requests": "1",
			},
			expectedRiskLevel: "LOW",
			expectedOptimistic: true,
		},

		// Level 2: MODERATE RISK - Standard user
		moderateRisk: {
			userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
			headers: {
				Accept: "text/html,application/xhtml+xml",
				"Accept-Language": "en-US",
				Connection: "keep-alive",
			},
			expectedRiskLevel: "MODERATE",
			expectedOptimistic: true,
		},

		// Level 3: ELEVATED RISK - Suspicious user agent
		elevatedRisk: {
			userAgent: "HeadlessChrome/120.0.0.0",
			headers: {
				Accept: "*/*",
				Connection: "close",
			},
			expectedRiskLevel: "ELEVATED",
			expectedOptimistic: false,
			expectedDifficulty: 4,
		},

		// Level 4: HIGH RISK - Bot-like user agent
		highRisk: {
			userAgent: "python-requests/2.28.1",
			headers: {
				Accept: "*/*",
				"User-Agent": "python-requests/2.28.1",
			},
			expectedRiskLevel: "HIGH",
			expectedOptimistic: false,
			expectedDifficulty: 6,
		},

		// Level 5: DANGEROUS - Known bot
		dangerousRisk: {
			userAgent: "curl/7.68.0",
			headers: {
				Accept: "*/*",
			},
			expectedRiskLevel: "DANGEROUS",
			expectedOptimistic: false,
			expectedDifficulty: 8,
		},
	},
};

// COLORS FOR CONSOLE OUTPUT
const colors = {
	reset: "\x1b[0m",
	bright: "\x1b[1m",
	red: "\x1b[31m",
	green: "\x1b[32m",
	yellow: "\x1b[33m",
	blue: "\x1b[34m",
	magenta: "\x1b[35m",
	cyan: "\x1b[36m",
};

// UTILITY FUNCTIONS
function log(message, color = "reset") {
	console.log(`${colors[color]}${message}${colors.reset}`);
}

function makeRequest(url, options = {}) {
	return new Promise((resolve, reject) => {
		const urlObj = new URL(url);
		const isHttps = urlObj.protocol === "https:";
		const client = isHttps ? https : http;

		const requestOptions = {
			hostname: urlObj.hostname,
			port: urlObj.port || (isHttps ? 443 : 80),
			path: urlObj.pathname + urlObj.search,
			method: options.method || "GET",
			headers: options.headers || {},
			timeout: options.timeout || 30000,
		};

		const req = client.request(requestOptions, (res) => {
			let data = "";

			res.on("data", (chunk) => {
				data += chunk;
			});

			res.on("end", () => {
				resolve({
					statusCode: res.statusCode,
					headers: res.headers,
					body: data,
					redirected: res.statusCode >= 300 && res.statusCode < 400,
				});
			});
		});

		req.on("error", (error) => {
			reject(error);
		});

		req.on("timeout", () => {
			req.destroy();
			reject(new Error("Request timeout"));
		});

		if (options.body) {
			req.write(options.body);
		}

		req.end();
	});
}

async function testScenario(scenarioName, scenario, endpoint) {
	log(`\n🧪 Testing ${scenarioName} on ${endpoint}`, "cyan");

	const startTime = performance.now();

	try {
		const response = await makeRequest(`${CONFIG.baseUrl}${endpoint}`, {
			headers: {
				"User-Agent": scenario.userAgent,
				...scenario.headers,
			},
		});

		const endTime = performance.now();
		const responseTime = Math.round(endTime - startTime);

		// ANALYZE RESPONSE
		const analysis = analyzeResponse(response, scenario);

		// DISPLAY RESULTS
		displayResults(scenarioName, endpoint, response, analysis, responseTime);

		return analysis;
	} catch (error) {
		log(`❌ Request failed: ${error.message}`, "red");
		return { success: false, error: error.message };
	}
}

function analyzeResponse(response, expectedScenario) {
	const analysis = {
		success: true,
		riskLevel: null,
		optimistic: null,
		difficulty: null,
		gracePeriod: null,
		redirected: response.redirected,
		challengeRequired: false,
		issues: [],
	};

	// CHECK FOR ANUBIS HEADERS
	const headers = response.headers;
	analysis.riskLevel = headers["x-anubis-risk-level"];
	analysis.optimistic = headers["x-anubis-optimistic"] === "true";
	analysis.difficulty = Number.parseInt(headers["x-anubis-difficulty"]) || null;
	analysis.gracePeriod = Number.parseInt(headers["x-anubis-remaining"]) || null;

	// CHECK FOR CHALLENGE REDIRECT
	if (response.redirected || response.statusCode === 302) {
		analysis.challengeRequired = true;
	}

	// VALIDATE EXPECTATIONS
	if (
		expectedScenario.expectedRiskLevel &&
		analysis.riskLevel !== expectedScenario.expectedRiskLevel
	) {
		analysis.issues.push(
			`Expected risk level ${expectedScenario.expectedRiskLevel}, got ${analysis.riskLevel}`
		);
	}

	if (
		expectedScenario.expectedOptimistic !== undefined &&
		analysis.optimistic !== expectedScenario.expectedOptimistic
	) {
		analysis.issues.push(
			`Expected optimistic ${expectedScenario.expectedOptimistic}, got ${analysis.optimistic}`
		);
	}

	if (
		expectedScenario.expectedDifficulty &&
		analysis.difficulty !== expectedScenario.expectedDifficulty
	) {
		analysis.issues.push(
			`Expected difficulty ${expectedScenario.expectedDifficulty}, got ${analysis.difficulty}`
		);
	}

	// CHECK LOGIC CONSISTENCY
	if (
		analysis.riskLevel &&
		["ELEVATED", "HIGH", "DANGEROUS"].includes(analysis.riskLevel) &&
		analysis.optimistic
	) {
		analysis.issues.push(
			`Risk level ${analysis.riskLevel} should not have optimistic mode enabled`
		);
	}

	if (analysis.issues.length > 0) {
		analysis.success = false;
	}

	return analysis;
}

function displayResults(scenarioName, endpoint, response, analysis, responseTime) {
	const statusColor =
		response.statusCode < 300 ? "green" : response.statusCode < 400 ? "yellow" : "red";

	log(`📊 Results for ${scenarioName}:`, "bright");
	log(`   Status: ${response.statusCode}`, statusColor);
	log(`   Response Time: ${responseTime}ms`, "blue");
	log(`   Risk Level: ${analysis.riskLevel || "Not detected"}`, "magenta");
	log(
		`   Optimistic Mode: ${analysis.optimistic ? "✅" : "❌"}`,
		analysis.optimistic ? "green" : "red"
	);
	log(`   Difficulty: ${analysis.difficulty || "N/A"}`, "yellow");
	log(`   Grace Period: ${analysis.gracePeriod ? `${analysis.gracePeriod}ms` : "N/A"}`, "cyan");
	log(
		`   Challenge Required: ${analysis.challengeRequired ? "✅" : "❌"}`,
		analysis.challengeRequired ? "yellow" : "green"
	);

	if (analysis.issues.length > 0) {
		log(`   Issues:`, "red");
		analysis.issues.forEach((issue) => log(`     - ${issue}`, "red"));
	} else {
		log(`   ✅ All checks passed!`, "green");
	}
}

async function testChallengeFlow(scenario) {
	log(`\n🔐 Testing challenge flow for ${scenario.userAgent}`, "cyan");

	try {
		// Step 1: Get challenge
		const challengeResponse = await makeRequest(`${CONFIG.baseUrl}/api/anubis/challenge`, {
			headers: {
				"User-Agent": scenario.userAgent,
				...scenario.headers,
			},
		});

		if (challengeResponse.statusCode !== 200) {
			log(`❌ Challenge request failed: ${challengeResponse.statusCode}`, "red");
			return false;
		}

		log(`✅ Challenge received (${challengeResponse.statusCode})`, "green");

		// Step 2: Solve challenge (simulate)
		log(`🧮 Simulating challenge solving...`, "yellow");

		// Extract challenge data from response
		const challengeData = extractChallengeData(challengeResponse.body);
		if (challengeData) {
			log(`   Difficulty: ${challengeData.difficulty}`, "blue");
			log(`   Estimated time: ${getEstimatedTime(challengeData.difficulty)}`, "cyan");
		}

		return true;
	} catch (error) {
		log(`❌ Challenge flow failed: ${error.message}`, "red");
		return false;
	}
}

function extractChallengeData(html) {
	// Extract challenge data from HTML response
	const difficultyMatch = html.match(/difficulty['"]\s*:\s*(\d+)/);
	const challengeMatch = html.match(/challenge['"]\s*:\s*['"]([^'"]+)['"]/);

	if (difficultyMatch && challengeMatch) {
		return {
			difficulty: Number.parseInt(difficultyMatch[1]),
			challenge: challengeMatch[1],
		};
	}

	return null;
}

function getEstimatedTime(difficulty) {
	const times = {
		2: "~0.1s",
		3: "~0.5s",
		4: "~1-2s",
		6: "~5-15s",
		8: "~30-120s",
	};
	return times[difficulty] || "~unknown";
}

async function testRateLimiting() {
	log(`\n🚀 Testing rate limiting and failure escalation`, "cyan");

	const rapidRequests = [];
	const userAgent = "RapidTestBot/1.0";

	// Make 10 rapid requests
	for (let i = 0; i < 10; i++) {
		rapidRequests.push(
			makeRequest(`${CONFIG.baseUrl}/admin`, {
				headers: { "User-Agent": userAgent },
			}).catch((err) => ({ error: err.message }))
		);
	}

	const results = await Promise.all(rapidRequests);

	log(`📊 Rate limiting results:`, "bright");
	results.forEach((result, index) => {
		if (result.error) {
			log(`   Request ${index + 1}: Error - ${result.error}`, "red");
		} else {
			const riskLevel = result.headers["x-anubis-risk-level"] || "Unknown";
			log(`   Request ${index + 1}: ${result.statusCode} - Risk: ${riskLevel}`, "blue");
		}
	});
}

async function runAllTests() {
	log("🚀 Starting Adaptive Anubis Test Suite", "bright");
	log(`📍 Target Server: ${CONFIG.baseUrl}`, "cyan");
	log(
		`📋 Testing ${Object.keys(CONFIG.scenarios).length} scenarios on ${CONFIG.endpoints.length} endpoints\n`,
		"blue"
	);

	const results = {
		total: 0,
		passed: 0,
		failed: 0,
		scenarios: {},
	};

	// TEST EACH SCENARIO ON EACH ENDPOINT
	for (const [scenarioName, scenario] of Object.entries(CONFIG.scenarios)) {
		results.scenarios[scenarioName] = { passed: 0, failed: 0, details: [] };

		for (const endpoint of CONFIG.endpoints) {
			const result = await testScenario(scenarioName, scenario, endpoint);
			results.total++;

			if (result.success) {
				results.passed++;
				results.scenarios[scenarioName].passed++;
			} else {
				results.failed++;
				results.scenarios[scenarioName].failed++;
			}

			results.scenarios[scenarioName].details.push({
				endpoint,
				success: result.success,
				issues: result.issues || [],
			});

			// Small delay between requests
			await new Promise((resolve) => setTimeout(resolve, 500));
		}
	}

	// TEST CHALLENGE FLOWS
	log(`\n🔐 Testing Challenge Flows`, "bright");
	for (const [scenarioName, scenario] of Object.entries(CONFIG.scenarios)) {
		if (!scenario.expectedOptimistic) {
			await testChallengeFlow(scenario);
			await new Promise((resolve) => setTimeout(resolve, 1000));
		}
	}

	// TEST RATE LIMITING
	await testRateLimiting();

	// DISPLAY SUMMARY
	displaySummary(results);
}

function displaySummary(results) {
	log(`\n📊 TEST SUMMARY`, "bright");
	log(`═══════════════════════════════════════`, "bright");
	log(`Total Tests: ${results.total}`, "blue");
	log(`Passed: ${results.passed}`, "green");
	log(`Failed: ${results.failed}`, results.failed > 0 ? "red" : "green");
	log(`Success Rate: ${Math.round((results.passed / results.total) * 100)}%`, "cyan");

	log(`\n📋 Scenario Breakdown:`, "bright");
	for (const [scenarioName, scenarioResults] of Object.entries(results.scenarios)) {
		const total = scenarioResults.passed + scenarioResults.failed;
		const successRate = Math.round((scenarioResults.passed / total) * 100);
		const statusColor = successRate === 100 ? "green" : successRate >= 80 ? "yellow" : "red";

		log(`   ${scenarioName}: ${scenarioResults.passed}/${total} (${successRate}%)`, statusColor);

		// Show failed details
		const failedDetails = scenarioResults.details.filter((d) => !d.success);
		if (failedDetails.length > 0) {
			failedDetails.forEach((detail) => {
				log(`     ❌ ${detail.endpoint}: ${detail.issues.join(", ")}`, "red");
			});
		}
	}

	log(`\n🎯 Recommendations:`, "bright");
	if (results.failed === 0) {
		log(`✅ All tests passed! Your adaptive risk system is working correctly.`, "green");
	} else {
		log(`⚠️  Some tests failed. Review the issues above and check your configuration.`, "yellow");
	}

	log(`\n🔗 Next Steps:`, "bright");
	log(`   1. Review any failed tests above`, "cyan");
	log(`   2. Check server logs for detailed error information`, "cyan");
	log(`   3. Test with real user traffic patterns`, "cyan");
	log(`   4. Monitor the Risk Dashboard during testing`, "cyan");
}

// MAIN EXECUTION
if (require.main === module) {
	runAllTests().catch((error) => {
		log(`💥 Test suite failed: ${error.message}`, "red");
		console.error(error);
		process.exit(1);
	});
}

module.exports = {
	runAllTests,
	testScenario,
	CONFIG,
};
