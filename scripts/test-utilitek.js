#!/usr/bin/env node

const https = require("https");
const url = require("url");

function makeRequest(testUrl, userAgent) {
	return new Promise((resolve) => {
		console.log(`🧪 Testing: ${userAgent}`);

		const parsed = new URL(testUrl);
		const requestOptions = {
			hostname: parsed.hostname,
			port: parsed.port || 443,
			path: parsed.pathname,
			method: "GET",
			headers: {
				"User-Agent": userAgent,
				Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
			},
			timeout: 10000,
		};

		const req = https.request(requestOptions, (res) => {
			let data = "";
			res.on("data", (chunk) => (data += chunk));
			res.on("end", () => {
				console.log(`📊 Response: ${res.statusCode} (${(data.length / 1024).toFixed(1)}KB)`);

				const anubisHeaders = Object.keys(res.headers).filter((key) =>
					key.toLowerCase().startsWith("x-anubis")
				);

				if (anubisHeaders.length > 0) {
					console.log(`🛡️ Anubis protected: ✅ YES`);
					anubisHeaders.forEach((h) => console.log(`   ${h}: ${res.headers[h]}`));
				} else {
					console.log(`❌ Anubis protected: NO`);
				}

				// Check if it's the actual site content
				const hasUtilitekContent =
					data.includes("Utilitek Solutions") || data.includes("Our expertise is your success");
				console.log(
					`🏠 Site content: ${hasUtilitekContent ? "Utilitek homepage" : "Other/blocked"}`
				);

				// Check for challenge indicators
				const isChallenge =
					data.includes("challenge") ||
					data.includes("proof-of-work") ||
					data.includes("verification");
				if (isChallenge) {
					console.log(`🔐 Challenge detected: Bot verification required`);
				}

				console.log("");
				resolve();
			});
		});

		req.on("error", (err) => {
			console.log(`❌ Error: ${err.message}\n`);
			resolve();
		});
		req.on("timeout", () => {
			console.log(`⏰ Timeout\n`);
			req.destroy();
			resolve();
		});
		req.end();
	});
}

async function test() {
	console.log("🚀 Testing Utilitek PRODUCTION site (re-check) with simple bot test...");
	console.log("🎯 Target: https://utiliteksolutions.ca/\n");

	const tests = [
		{
			ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
			desc: "Real Browser",
		},
		{ ua: "curl/7.68.0", desc: "cURL Bot" },
		{ ua: "python-requests/2.28.1", desc: "Python Bot" },
		{ ua: "ScrapingBot/1.0", desc: "Scraping Bot" },
	];

	for (const test of tests) {
		console.log(`============================================`);
		console.log(`🎭 ${test.desc.toUpperCase()}`);
		console.log(`============================================`);
		await makeRequest("https://utiliteksolutions.ca/", test.ua);
		await new Promise((r) => setTimeout(r, 1000));
	}

	console.log("============================================");
	console.log("🎉 Simple test complete!");
	console.log("============================================");
}

test().catch(console.error);
