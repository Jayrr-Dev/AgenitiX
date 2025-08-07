/**
 * Test OAuth2 Configuration
 *
 * This script helps diagnose OAuth2 configuration issues by checking
 * environment variables and testing the OAuth2 endpoints.
 */

const https = require("https");
const http = require("http");
const path = require("path");

// Load environment variables from .env.local
try {
  require("dotenv").config({ path: path.join(__dirname, "..", ".env.local") });
  console.log("📁 Loaded .env.local file");
} catch (error) {
  console.log("⚠️  Could not load .env.local file:", error.message);
}

// Check environment variables
console.log("🔍 Checking OAuth2 Configuration...\n");

const requiredVars = [
  "GMAIL_CLIENT_ID",
  "GMAIL_CLIENT_SECRET",
  "GMAIL_REDIRECT_URI",
];

let allConfigured = true;

requiredVars.forEach((varName) => {
  const value = process.env[varName];
  if (value) {
    console.log(`✅ ${varName}: Set`);
    // Show first few characters for verification
    console.log(`   Value: ${value.substring(0, 20)}...`);
  } else {
    console.log(`❌ ${varName}: Missing`);
    allConfigured = false;
  }
});

console.log(
  "\n📊 Configuration Status:",
  allConfigured ? "Ready" : "Not Configured"
);

if (!allConfigured) {
  console.log("\n🚨 To fix this:");
  console.log("1. Create a Google Cloud Project");
  console.log("2. Enable Gmail API");
  console.log("3. Create OAuth2 credentials");
  console.log("4. Set environment variables in .env.local:");
  console.log("   - GMAIL_CLIENT_ID=your_client_id");
  console.log("   - GMAIL_CLIENT_SECRET=your_client_secret");
  console.log(
    "   - GMAIL_REDIRECT_URI=http://localhost:3000/api/auth/email/gmail/callback"
  );
  console.log(
    "\n📖 See: https://developers.google.com/gmail/api/quickstart/nodejs"
  );
} else {
  console.log("\n✅ OAuth2 is properly configured!");
  console.log("💡 If you're still having issues:");
  console.log("1. Check that your redirect URI matches exactly");
  console.log("2. Ensure your app is running on the correct domain");
  console.log("3. Check browser console for JavaScript errors");
  console.log("4. Verify popup blockers are disabled");
}

console.log("\n🔗 Test endpoints:");
console.log("- Debug: http://localhost:3000/api/auth/email/gmail/debug");
console.log(
  "- OAuth: http://localhost:3000/api/auth/email/gmail?redirect_uri=..."
);

// Test the OAuth URL generation
console.log("\n🧪 Testing OAuth URL generation...");
try {
  const { getEmailProviderConfig, buildOAuth2AuthUrl } = require("../features/business-logic-modern/node-domain/email/providers/credentialProviders");
  
  getEmailProviderConfig("gmail").then(config => {
    if (config) {
      const authUrl = buildOAuth2AuthUrl(config, "test-session-token");
      console.log("✅ OAuth URL generated successfully");
      console.log(`   URL starts with: ${authUrl.substring(0, 100)}...`);
    } else {
      console.log("❌ Failed to get Gmail configuration");
    }
  }).catch(error => {
    console.log("❌ Error testing OAuth URL generation:", error.message);
  });
} catch (error) {
  console.log("❌ Could not test OAuth URL generation:", error.message);
}
