#!/usr/bin/env node

const https = require("https");

async function testBot(botName, userAgent, category, expectedResult) {
	return new Promise((resolve) => {
		console.log(`🧪 Testing ${category}: ${botName}`);
		console.log(`   User Agent: ${userAgent}`);

		const req = https.request(
			{
				hostname: "utiliteksolutions.ca",
				path: "/contact", // Test protected route
				method: "GET",
				headers: { "User-Agent": userAgent },
				timeout: 10000,
			},
			(res) => {
				let data = "";
				res.on("data", (chunk) => (data += chunk));
				res.on("end", () => {
					const size = (data.length / 1024).toFixed(1);
					const hasContent = data.includes("Utilitek Solutions");

					console.log(`📊 Response: ${res.statusCode} (${size}KB)`);

					// Check for Anubis protection indicators
					const anubisHeaders = Object.keys(res.headers).filter((h) => h.startsWith("x-anubis"));
					const hasAnubis = anubisHeaders.length > 0;

					if (hasAnubis) {
						console.log(`🛡️ Anubis: YES - ${anubisHeaders.join(", ")}`);
					}

					let result;
					if (res.statusCode === 403) {
						result = "🚫 BLOCKED";
						console.log(`🚫 BLOCKED: Bot protection active!`);
					} else if (res.statusCode === 429) {
						result = "🚦 RATE LIMITED";
						console.log(`🚦 RATE LIMITED: Too many requests!`);
					} else if (res.statusCode === 307) {
						result = "🔄 CHALLENGE REQUIRED";
						console.log(`🔄 REDIRECT: Challenge required!`);
					} else if (res.statusCode === 200 && hasContent) {
						result = "✅ ALLOWED";
						console.log(`✅ ALLOWED: Full content access`);
					} else {
						result = "❓ UNKNOWN";
						console.log(`❓ UNKNOWN: Status ${res.statusCode}`);
					}

					// Verify expected result
					const matches =
						(expectedResult === "ALLOW" && result === "✅ ALLOWED") ||
						(expectedResult === "BLOCK" &&
							(result === "🚫 BLOCKED" || result === "🚦 RATE LIMITED"));

					if (matches) {
						console.log(`✅ EXPECTED: ${result} (as expected for ${category})`);
					} else {
						console.log(`❌ UNEXPECTED: ${result} (expected ${expectedResult} for ${category})`);
					}

					console.log("");
					resolve({ botName, category, result, matches, status: res.statusCode });
				});
			}
		);

		req.on("error", () => {
			console.log(`❌ Error connecting to server\n`);
			resolve({ botName, category, result: "❌ ERROR", matches: false, status: 0 });
		});

		req.on("timeout", () => {
			console.log(`⏰ Request timeout\n`);
			req.destroy();
			resolve({ botName, category, result: "⏰ TIMEOUT", matches: false, status: 0 });
		});

		req.end();
	});
}

async function runComprehensiveTest() {
	console.log("🎯 COMPREHENSIVE BOT PROTECTION TEST");
	console.log("Target: https://utiliteksolutions.ca/contact");
	console.log(
		"Testing both MARKETING BOTS (should be allowed) and MALICIOUS BOTS (should be blocked)\n"
	);

	// MARKETING BOTS (Should be ALLOWED)
	const marketingBots = [
		{
			name: "Google Search",
			agent: "Googlebot/2.1 (+http://www.google.com/bot.html)",
			expected: "ALLOW",
		},
		{
			name: "Bing Search",
			agent: "Mozilla/5.0 (compatible; Bingbot/2.0; +http://www.bing.com/bingbot.htm)",
			expected: "ALLOW",
		},
		{
			name: "Facebook Link Preview",
			agent: "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)",
			expected: "ALLOW",
		},
		{ name: "Twitter Card Bot", agent: "Twitterbot/1.0", expected: "ALLOW" },
		{
			name: "LinkedIn Bot",
			agent:
				"LinkedInBot/1.0 (compatible; Mozilla/5.0; Apache-HttpClient +http://www.linkedin.com)",
			expected: "ALLOW",
		},
		{ name: "WhatsApp Link Preview", agent: "WhatsApp/2.19.81 A", expected: "ALLOW" },
		{ name: "Instagram Browser", agent: "Instagram 76.0.0.15.395 Android", expected: "ALLOW" },
		{ name: "MailChimp Campaign", agent: "MailChimp.com WebHook Checker", expected: "ALLOW" },
		{
			name: "Google Analytics",
			agent: "Mozilla/5.0 (compatible; Google Analytics)",
			expected: "ALLOW",
		},
		{
			name: "HubSpot Crawler",
			agent: "HubSpot Crawler (+https://www.hubspot.com/)",
			expected: "ALLOW",
		},
		{
			name: "Pinterest Bot",
			agent: "Pinterest/0.2 (+https://www.pinterest.com/bot.html)",
			expected: "ALLOW",
		},
		{
			name: "Discord Bot",
			agent: "Mozilla/5.0 (compatible; Discordbot/2.0; +https://discordapp.com)",
			expected: "ALLOW",
		},
	];

	// MALICIOUS BOTS (Should be BLOCKED)
	const maliciousBots = [
		{ name: "Python Requests", agent: "python-requests/2.28.1", expected: "BLOCK" },
		{ name: "cURL Command", agent: "curl/7.68.0", expected: "BLOCK" },
		{ name: "Scraping Bot", agent: "ScrapingBot/1.0", expected: "BLOCK" },
		{ name: "Web Crawler", agent: "WebCrawler/1.0", expected: "BLOCK" },
		{
			name: "Headless Chrome",
			agent: "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 HeadlessChrome/120.0.0.0",
			expected: "BLOCK",
		},
		{
			name: "Selenium Bot",
			agent:
				"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Selenium/4.0",
			expected: "BLOCK",
		},
		{ name: "Generic Bot", agent: "Mozilla/5.0 Bot", expected: "BLOCK" },
		{ name: "Wget Tool", agent: "Wget/1.20.3 (linux-gnu)", expected: "BLOCK" },
	];

	console.log("🟢 TESTING LEGITIMATE MARKETING BOTS (Should be ALLOWED)");
	console.log("=" * 70);

	const marketingResults = [];
	for (const bot of marketingBots) {
		const result = await testBot(bot.name, bot.agent, "🟢 MARKETING BOT", bot.expected);
		marketingResults.push(result);
		await new Promise((r) => setTimeout(r, 500)); // Small delay
	}

	console.log("\n🔴 TESTING MALICIOUS BOTS (Should be BLOCKED)");
	console.log("=" * 70);

	const maliciousResults = [];
	for (const bot of maliciousBots) {
		const result = await testBot(bot.name, bot.agent, "🔴 MALICIOUS BOT", bot.expected);
		maliciousResults.push(result);
		await new Promise((r) => setTimeout(r, 500)); // Small delay
	}

	// SUMMARY REPORT
	console.log("\n" + "=".repeat(80));
	console.log("📊 COMPREHENSIVE TEST RESULTS SUMMARY");
	console.log("=".repeat(80));

	const marketingAllowed = marketingResults.filter((r) => r.matches).length;
	const marketingTotal = marketingResults.length;
	const maliciousBlocked = maliciousResults.filter((r) => r.matches).length;
	const maliciousTotal = maliciousResults.length;

	console.log(
		`\n🟢 MARKETING BOTS: ${marketingAllowed}/${marketingTotal} correctly allowed (${((marketingAllowed / marketingTotal) * 100).toFixed(1)}%)`
	);
	console.log(
		`🔴 MALICIOUS BOTS: ${maliciousBlocked}/${maliciousTotal} correctly blocked (${((maliciousBlocked / maliciousTotal) * 100).toFixed(1)}%)`
	);

	const overallScore =
		((marketingAllowed + maliciousBlocked) / (marketingTotal + maliciousTotal)) * 100;
	console.log(`\n🎯 OVERALL PROTECTION SCORE: ${overallScore.toFixed(1)}%`);

	if (overallScore >= 90) {
		console.log("🎉 EXCELLENT: Bot protection is working perfectly!");
	} else if (overallScore >= 75) {
		console.log("✅ GOOD: Bot protection is working well with minor issues");
	} else if (overallScore >= 50) {
		console.log("⚠️ MODERATE: Bot protection needs improvement");
	} else {
		console.log("❌ POOR: Bot protection is not working properly");
	}

	// DETAILED FAILURES
	const marketingFailures = marketingResults.filter((r) => !r.matches);
	const maliciousFailures = maliciousResults.filter((r) => !r.matches);

	if (marketingFailures.length > 0) {
		console.log("\n❌ MARKETING BOTS INCORRECTLY BLOCKED:");
		marketingFailures.forEach((f) => console.log(`   - ${f.botName}: ${f.result}`));
	}

	if (maliciousFailures.length > 0) {
		console.log("\n❌ MALICIOUS BOTS INCORRECTLY ALLOWED:");
		maliciousFailures.forEach((f) => console.log(`   - ${f.botName}: ${f.result}`));
	}

	console.log("\n🏁 Test completed!\n");
}

runComprehensiveTest().catch(console.error);
