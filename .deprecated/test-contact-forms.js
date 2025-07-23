#!/usr/bin/env node

/**
 * CONTACT FORM PROTECTION TEST
 * Tests Anubis protection on form submission endpoints
 */

const https = require("https");
const http = require("http");
const { performance } = require("perf_hooks");

// TEST CONFIGURATION
const CONFIG = {
	baseUrl: process.env.TEST_SERVER_URL || "https://agenitix.vercel.app",

	// FORM ENDPOINTS TO TEST
	formEndpoints: [
		"/api/contact",
		"/api/forms/contact",
		"/api/submit/contact",
		"/api/newsletter",
		"/api/subscribe",
		"/api/feedback",
		"/api/quote",
		"/api/demo",
		"/api/consultation",
	],

	// TEST SCENARIOS FOR FORM SPAM
	scenarios: {
		// LEGITIMATE USER
		legitimateUser: {
			userAgent:
				"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
			headers: {
				Accept: "application/json, text/plain, */*",
				"Accept-Language": "en-US,en;q=0.9",
				"Content-Type": "application/json",
				Referer: "https://agenitix.vercel.app/contact",
				"Sec-Fetch-Dest": "empty",
				"Sec-Fetch-Mode": "cors",
				"Sec-Fetch-Site": "same-origin",
			},
			formData: {
				name: "John Doe",
				email: "john@example.com",
				message: "Interested in your services",
			},
			expectedResult: "ALLOW_OR_CHALLENGE",
			description: "Legitimate form submission",
		},

		// FORM SPAM BOT
		spamBot: {
			userAgent: "python-requests/2.28.1",
			headers: {
				Accept: "*/*",
				"Content-Type": "application/json",
			},
			formData: {
				name: "SEO Services",
				email: "spam@seo-services.com",
				message: "We can improve your website ranking! Click here for more info!",
			},
			expectedResult: "BLOCK",
			description: "Spam bot form submission",
		},

		// AUTOMATED SCRAPER
		scraperBot: {
			userAgent: "AutoSpammer/1.0",
			headers: {
				Accept: "*/*",
				"Content-Type": "application/x-www-form-urlencoded",
			},
			formData: {
				name: "Best Deals",
				email: "deals@automated-spam.com",
				message: "URGENT! Limited time offer! Buy now!",
			},
			expectedResult: "BLOCK",
			description: "Automated spam scraper",
		},

		// CURL FORM SUBMISSION
		curlSubmission: {
			userAgent: "curl/7.68.0",
			headers: {
				Accept: "*/*",
				"Content-Type": "application/json",
			},
			formData: {
				name: "Automated Test",
				email: "test@automated.com",
				message: "This is an automated test submission",
			},
			expectedResult: "BLOCK",
			description: "cURL form submission",
		},
	},
};

// COLORS FOR OUTPUT
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
			method: options.method || "POST",
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

async function testFormSubmission(endpoint, scenarioName, scenario) {
	log(`\n🧪 Testing ${scenarioName} on ${endpoint}`, "cyan");

	const startTime = performance.now();

	try {
		const response = await makeRequest(`${CONFIG.baseUrl}${endpoint}`, {
			method: "POST",
			headers: {
				"User-Agent": scenario.userAgent,
				...scenario.headers,
			},
			body: JSON.stringify(scenario.formData),
		});

		const endTime = performance.now();
		const responseTime = Math.round(endTime - startTime);

		// ANALYZE RESPONSE
		const analysis = analyzeFormResponse(response, scenario);

		// DISPLAY RESULTS
		displayFormResults(scenarioName, endpoint, response, analysis, responseTime);

		return analysis;
	} catch (error) {
		log(`❌ Request failed: ${error.message}`, "red");
		return { success: false, error: error.message };
	}
}

function analyzeFormResponse(response, expectedScenario) {
	const analysis = {
		success: true,
		protected: false,
		blocked: false,
		riskLevel: null,
		challengeRequired: false,
		issues: [],
	};

	// CHECK FOR ANUBIS HEADERS
	const headers = response.headers;
	analysis.riskLevel = headers["x-anubis-risk-level"];
	analysis.protected = !!(headers["x-anubis-risk-level"] || headers["x-anubis-optimistic"]);

	// CHECK FOR BLOCKING/CHALLENGES
	if (response.redirected || response.statusCode === 307) {
		analysis.blocked = true;
		analysis.challengeRequired = true;
	}

	// CHECK STATUS CODES
	if (response.statusCode === 429) {
		analysis.blocked = true;
		analysis.rateLimited = true;
	}

	// VALIDATE EXPECTATIONS
	if (expectedScenario.expectedResult === "BLOCK" && !analysis.blocked) {
		analysis.issues.push("Expected to be blocked but was allowed");
	}

	if (expectedScenario.expectedResult === "ALLOW_OR_CHALLENGE" && response.statusCode >= 400) {
		analysis.issues.push("Legitimate user blocked unexpectedly");
	}

	if (analysis.issues.length > 0) {
		analysis.success = false;
	}

	return analysis;
}

function displayFormResults(scenarioName, endpoint, response, analysis, responseTime) {
	const statusColor =
		response.statusCode < 300 ? "green" : response.statusCode < 400 ? "yellow" : "red";

	log(`📊 Results for ${scenarioName}:`, "bright");
	log(`   Endpoint: ${endpoint}`, "blue");
	log(`   Status: ${response.statusCode}`, statusColor);
	log(`   Response Time: ${responseTime}ms`, "blue");
	log(`   Protected: ${analysis.protected ? "✅" : "❌"}`, analysis.protected ? "green" : "red");
	log(`   Blocked: ${analysis.blocked ? "✅" : "❌"}`, analysis.blocked ? "green" : "red");
	log(`   Risk Level: ${analysis.riskLevel || "Not detected"}`, "magenta");

	if (analysis.issues.length > 0) {
		log(`   Issues:`, "red");
		analysis.issues.forEach((issue) => log(`     - ${issue}`, "red"));
	} else {
		log(`   ✅ Working as expected!`, "green");
	}
}

async function runAllFormTests() {
	log("🛡️ CONTACT FORM PROTECTION TEST", "bright");
	log(`📍 Target: ${CONFIG.baseUrl}`, "cyan");
	log(
		`📋 Testing ${Object.keys(CONFIG.scenarios).length} scenarios on ${CONFIG.formEndpoints.length} endpoints\n`,
		"cyan"
	);

	const results = [];

	for (const [scenarioName, scenario] of Object.entries(CONFIG.scenarios)) {
		log(`\n${"=".repeat(60)}`, "yellow");
		log(`🎭 SCENARIO: ${scenarioName.toUpperCase()}`, "yellow");
		log(`🔧 Description: ${scenario.description}`, "yellow");
		log(`${"=".repeat(60)}`, "yellow");

		for (const endpoint of CONFIG.formEndpoints) {
			const result = await testFormSubmission(endpoint, scenarioName, scenario);
			results.push({
				scenario: scenarioName,
				endpoint,
				result,
				success: result.success,
			});

			// Small delay between requests
			await new Promise((resolve) => setTimeout(resolve, 500));
		}
	}

	// DISPLAY SUMMARY
	displayFormSummary(results);

	return results;
}

function displayFormSummary(results) {
	log(`\n${"=".repeat(80)}`, "bright");
	log("🛡️ CONTACT FORM PROTECTION SUMMARY", "bright");
	log(`${"=".repeat(80)}`, "bright");

	const totalTests = results.length;
	const successfulTests = results.filter((r) => r.success).length;
	const failedTests = totalTests - successfulTests;

	log(`📊 Test Results:`, "bright");
	log(`   Total Tests: ${totalTests}`, "blue");
	log(`   ✅ Working Correctly: ${successfulTests}`, "green");
	log(`   ❌ Issues Found: ${failedTests}`, failedTests > 0 ? "red" : "green");
	log(`   🎯 Success Rate: ${Math.round((successfulTests / totalTests) * 100)}%`, "cyan");

	// GROUP BY SCENARIO
	const scenarios = [...new Set(results.map((r) => r.scenario))];

	log(`\n🔍 DETAILED BREAKDOWN:`, "bright");
	scenarios.forEach((scenario) => {
		const scenarioResults = results.filter((r) => r.scenario === scenario);
		const scenarioSuccess = scenarioResults.filter((r) => r.success).length;
		const scenarioTotal = scenarioResults.length;

		log(
			`   ${scenario}: ${scenarioSuccess}/${scenarioTotal} (${Math.round((scenarioSuccess / scenarioTotal) * 100)}%)`,
			scenarioSuccess === scenarioTotal ? "green" : "yellow"
		);
	});

	log(`\n🛠️ RECOMMENDATIONS:`, "bright");
	if (failedTests === 0) {
		log("   🟢 Form protection is working excellently!", "green");
	} else {
		log("   🟡 Some form protection issues detected", "yellow");
		log("   💡 Review failed tests and adjust Anubis configuration", "yellow");
	}

	log(`\n🎉 Contact form test complete! ${new Date().toISOString()}`, "green");
}

// RUN TESTS
if (require.main === module) {
	runAllFormTests().catch(console.error);
}

module.exports = { runAllFormTests };
