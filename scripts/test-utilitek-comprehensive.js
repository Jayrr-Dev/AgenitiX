#!/usr/bin/env node

const https = require("https");

console.log("🐺 COMPREHENSIVE ANUBIS TEST - UTILITEK SOLUTIONS");
console.log("Target: https://utiliteksolutions.ca/");
console.log("=" * 60);

function testBot(userAgent, botName) {
	return new Promise((resolve) => {
		console.log(`\n🧪 TESTING: ${botName.toUpperCase()}`);
		console.log(`User-Agent: ${userAgent}`);
		console.log("-".repeat(50));

		const req = https.request(
			{
				hostname: "utiliteksolutions.ca",
				port: 443,
				path: "/",
				method: "GET",
				headers: {
					"User-Agent": userAgent,
					Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
				},
				timeout: 10000,
			},
			(res) => {
				let data = "";
				res.on("data", (chunk) => (data += chunk));
				res.on("end", () => {
					console.log(`📊 Status Code: ${res.statusCode}`);
					console.log(`📏 Response Size: ${(data.length / 1024).toFixed(1)}KB`);

					// Check for Anubis protection headers
					const anubisHeaders = Object.keys(res.headers).filter((h) =>
						h.toLowerCase().startsWith("x-anubis")
					);

					if (anubisHeaders.length > 0) {
						console.log("🛡️ Anubis Protection: ✅ YES");
						anubisHeaders.forEach((header) => {
							console.log(`   ${header}: ${res.headers[header]}`);
						});
					} else {
						console.log("❌ Anubis Protection: NO");
					}

					// Check for Utilitek content
					const hasUtilitekContent =
						data.includes("Utilitek Solutions") ||
						data.includes("Our expertise is your success") ||
						data.includes("admin2@utiliteksolutions.ca");
					console.log(
						`🏠 Content Type: ${hasUtilitekContent ? "Utilitek Homepage" : "Other/Blocked/Challenge"}`
					);

					// Check for challenge/blocking indicators
					const isChallenge =
						data.includes("challenge") ||
						data.includes("proof-of-work") ||
						data.includes("verification") ||
						data.includes("Anubis");
					if (isChallenge) {
						console.log("🔐 Challenge Detected: Bot verification required");
					}

					// Risk assessment
					const riskLevel = res.headers["x-anubis-risk-level"];
					if (riskLevel) {
						console.log(`⚠️ Risk Assessment: ${riskLevel}`);
					}

					resolve();
				});
			}
		);

		req.on("error", (err) => {
			console.log(`❌ Request Error: ${err.message}`);
			resolve();
		});

		req.on("timeout", () => {
			console.log("⏰ Request Timeout");
			req.destroy();
			resolve();
		});

		req.end();
	});
}

async function runComprehensiveTest() {
	const testCases = [
		{
			ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
			name: "Real Browser (Chrome)",
		},
		{
			ua: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
			name: "Real Browser (Safari)",
		},
		{
			ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
			name: "Mobile Browser (iPhone)",
		},
		{
			ua: "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/120.0.0.0 Safari/537.36",
			name: "Headless Chrome",
		},
		{ ua: "curl/7.68.0", name: "cURL Bot" },
		{ ua: "python-requests/2.28.1", name: "Python Requests" },
		{ ua: "ScrapingBot/1.0", name: "Generic Scraper" },
		{ ua: "wget/1.20.3 (linux-gnu)", name: "Wget Bot" },
		{ ua: "HTTPie/2.6.0", name: "HTTPie Tool" },
		{ ua: "PostmanRuntime/7.29.2", name: "Postman" },
		{ ua: "Googlebot/2.1 (+http://www.google.com/bot.html)", name: "Google Bot" },
		{
			ua: "Mozilla/5.0 (compatible; Bingbot/2.0; +http://www.bing.com/bingbot.htm)",
			name: "Bing Bot",
		},
		{
			ua: "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)",
			name: "Facebook Bot",
		},
		{ ua: "Twitterbot/1.0", name: "Twitter Bot" },
		{
			ua: "LinkedInBot/1.0 (compatible; Mozilla/5.0; Apache-HttpClient +http://www.linkedin.com/)",
			name: "LinkedIn Bot",
		},
	];

	for (const testCase of testCases) {
		await testBot(testCase.ua, testCase.name);
		// Wait between requests to avoid overwhelming the server
		await new Promise((resolve) => setTimeout(resolve, 1500));
	}

	console.log("\n" + "=".repeat(60));
	console.log("🎉 COMPREHENSIVE ANUBIS TEST COMPLETE!");
	console.log("✅ Analyzed 15 different user agents");
	console.log("🛡️ Checked Anubis protection status");
	console.log("📊 Verified content delivery");
	console.log("=" * 60);
}

runComprehensiveTest().catch(console.error);
