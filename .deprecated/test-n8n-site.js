#!/usr/bin/env node

/**
 * N8N.IO SITE TESTING SUITE
 * Tests how n8n.io handles various bot scenarios and user agents
 * Based on the Adaptive Anubis testing framework
 */

const https = require("https");
const http = require("http");
const { performance } = require("perf_hooks");

// TEST CONFIGURATION
const CONFIG = {
	// Target n8n.io
	baseUrl: "https://n8n.io",

	// Test endpoints
	endpoints: ["/", "/pricing", "/docs", "/templates", "/community"],

	// Test scenarios to see how n8n handles different bots
	scenarios: {
		// Legitimate browser
		realBrowser: {
			userAgent:
				"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
			headers: {
				Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
				"Accept-Language": "en-US,en;q=0.5",
				"Accept-Encoding": "gzip, deflate, br",
				Connection: "keep-alive",
				"Upgrade-Insecure-Requests": "1",
				"Sec-Fetch-Dest": "document",
				"Sec-Fetch-Mode": "navigate",
				"Sec-Fetch-Site": "none",
			},
			expectedResult: "ALLOW",
			description: "Real Chrome browser",
		},

		// Scraping bot
		scrapingBot: {
			userAgent: "ScrapingBot/1.0",
			headers: {
				Accept: "*/*",
				Connection: "close",
			},
			expectedResult: "BLOCK_OR_CHALLENGE",
			description: "Generic scraping bot",
		},

		// Python requests
		pythonBot: {
			userAgent: "python-requests/2.28.1",
			headers: {
				Accept: "*/*",
				"Accept-Encoding": "gzip, deflate",
				Connection: "keep-alive",
			},
			expectedResult: "BLOCK_OR_CHALLENGE",
			description: "Python requests library",
		},

		// Headless Chrome
		headlessChrome: {
			userAgent:
				"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/120.0.0.0 Safari/537.36",
			headers: {
				Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
				"Accept-Language": "en-US,en;q=0.5",
			},
			expectedResult: "BLOCK_OR_CHALLENGE",
			description: "Headless Chrome browser",
		},

		// cURL
		curlBot: {
			userAgent: "curl/7.68.0",
			headers: {
				Accept: "*/*",
			},
			expectedResult: "BLOCK_OR_CHALLENGE",
			description: "cURL command line tool",
		},

		// Googlebot (should be allowed)
		googleBot: {
			userAgent: "Googlebot/2.1 (+http://www.google.com/bot.html)",
			headers: {
				Accept: "*/*",
				From: "googlebot(at)googlebot.com",
			},
			expectedResult: "ALLOW",
			description: "Google search bot",
		},

		// Aggressive bot with suspicious patterns
		aggressiveBot: {
			userAgent: "DataMiner/3.0 (automated data collection)",
			headers: {
				Accept: "*/*",
				"X-Forwarded-For": "192.168.1.1",
				"X-Real-IP": "10.0.0.1",
			},
			expectedResult: "BLOCK_OR_CHALLENGE",
			description: "Aggressive data mining bot",
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
			timeout: options.timeout || 15000,
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
	log(`\n🧪 Testing ${scenario.description} on ${endpoint}`, "cyan");

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
		statusCode: response.statusCode,
		responseSize: response.body.length,
		redirected: response.redirected,
		blocked: false,
		challenged: false,
		cloudflareProtected: false,
		hasAntiBot: false,
		issues: [],
	};

	const content = response.body.toLowerCase();
	const headers = response.headers;

	// CHECK FOR VARIOUS PROTECTION METHODS
	analysis.cloudflareProtected =
		headers["cf-ray"] || headers["cf-cache-status"] || content.includes("cloudflare");
	analysis.blocked = response.statusCode === 403 || response.statusCode === 429;
	analysis.challenged =
		content.includes("checking your browser") ||
		content.includes("please wait") ||
		content.includes("challenge") ||
		content.includes("security check") ||
		content.includes("verifying you are human");

	// CHECK FOR N8N CONTENT
	const hasN8nContent =
		content.includes("n8n") ||
		content.includes("workflow automation") ||
		content.includes("technical teams") ||
		content.includes("drag-n-drop");

	// RATE LIMITING INDICATORS
	const rateLimited =
		response.statusCode === 429 || content.includes("too many requests") || headers["retry-after"];

	// DETERMINE RESULT
	if (expectedScenario.expectedResult === "ALLOW") {
		if (response.statusCode === 200 && hasN8nContent && !analysis.challenged) {
			analysis.result = "✅ ALLOWED";
			analysis.color = "green";
		} else if (analysis.blocked || analysis.challenged) {
			analysis.result = "❌ BLOCKED (False positive)";
			analysis.color = "red";
			analysis.issues.push("Legitimate traffic blocked");
		} else {
			analysis.result = "⚠️ UNEXPECTED";
			analysis.color = "yellow";
		}
	} else {
		// BLOCK_OR_CHALLENGE expected
		if (analysis.blocked || analysis.challenged || rateLimited) {
			analysis.result = "✅ BLOCKED/CHALLENGED";
			analysis.color = "green";
		} else if (response.statusCode === 200 && hasN8nContent) {
			analysis.result = "❌ ALLOWED (Should be blocked)";
			analysis.color = "red";
			analysis.issues.push("Bot traffic allowed through");
		} else {
			analysis.result = "⚠️ UNEXPECTED";
			analysis.color = "yellow";
		}
	}

	return analysis;
}

function displayResults(scenarioName, endpoint, response, analysis, responseTime) {
	log(`📊 Results for ${scenarioName}:`, "blue");
	log(`   Status: ${response.statusCode}`, analysis.color);
	log(`   Response Time: ${responseTime}ms`, "blue");
	log(`   Size: ${(analysis.responseSize / 1024).toFixed(1)}KB`, "blue");
	log(`   Result: ${analysis.result}`, analysis.color);

	if (analysis.cloudflareProtected) {
		log(`   🔒 Cloudflare Protected: Yes`, "cyan");
	}

	if (analysis.challenged) {
		log(`   🛡️ Challenge Required: Yes`, "yellow");
	}

	if (response.headers["cf-ray"]) {
		log(`   ☁️ CF-Ray: ${response.headers["cf-ray"]}`, "blue");
	}

	if (analysis.issues.length > 0) {
		log(`   ⚠️ Issues: ${analysis.issues.join(", ")}`, "yellow");
	}
}

async function runAllTests() {
	log("🌐 N8N.IO PROTECTION ANALYSIS", "cyan");
	log(`Testing: ${CONFIG.baseUrl}`, "yellow");
	log("=" * 60);

	const results = {
		total: 0,
		passed: 0,
		failed: 0,
		unknown: 0,
		scenarios: {},
	};

	for (const [scenarioName, scenario] of Object.entries(CONFIG.scenarios)) {
		log(`\n${"=".repeat(40)}`, "cyan");
		log(`🎭 SCENARIO: ${scenario.description.toUpperCase()}`, "bright");
		log(`${"=".repeat(40)}`, "cyan");

		const scenarioResults = [];

		for (const endpoint of CONFIG.endpoints) {
			const result = await testScenario(scenarioName, scenario, endpoint);
			scenarioResults.push(result);

			if (result.success !== false) {
				results.total++;
				if (result.result?.includes("✅")) {
					results.passed++;
				} else if (result.result?.includes("❌")) {
					results.failed++;
				} else {
					results.unknown++;
				}
			}

			// RATE LIMITING DELAY
			await new Promise((resolve) => setTimeout(resolve, 2000));
		}

		results.scenarios[scenarioName] = scenarioResults;
	}

	displaySummary(results);
	return results;
}

function displaySummary(results) {
	log("\n" + "=".repeat(60), "cyan");
	log("📊 N8N.IO PROTECTION SUMMARY", "bright");
	log("=".repeat(60), "cyan");

	log(`Total Tests: ${results.total}`, "blue");
	log(`✅ Behaved as Expected: ${results.passed}`, "green");
	log(`❌ Unexpected Behavior: ${results.failed}`, "red");
	log(`⚠️ Unknown Results: ${results.unknown}`, "yellow");

	const successRate = results.total > 0 ? ((results.passed / results.total) * 100).toFixed(1) : 0;
	log(`\n🎯 Success Rate: ${successRate}%`, successRate > 80 ? "green" : "yellow");

	// DETAILED ANALYSIS
	log("\n🔍 DETAILED ANALYSIS:", "cyan");

	for (const [scenarioName, scenarioResults] of Object.entries(results.scenarios)) {
		const scenario = CONFIG.scenarios[scenarioName];
		log(`\n${scenario.description}:`, "yellow");

		scenarioResults.forEach((result, index) => {
			if (result.success !== false) {
				const endpoint = CONFIG.endpoints[index];
				log(`  ${endpoint}: ${result.result}`, result.color);
			}
		});
	}

	log("\n🛡️ PROTECTION INSIGHTS:", "cyan");

	// Check if any Cloudflare protection was detected
	const hasCloudflare = Object.values(results.scenarios).some((scenarioResults) =>
		scenarioResults.some((result) => result.cloudflareProtected)
	);

	if (hasCloudflare) {
		log("  ☁️ Uses Cloudflare protection", "green");
	}

	log("\n🎉 Analysis complete!", "green");
}

// RUN TESTS
if (require.main === module) {
	runAllTests().catch(console.error);
}

module.exports = { runAllTests, CONFIG };
