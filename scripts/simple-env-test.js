/**
 * Simple Environment Variable Test
 */

// Load environment variables from .env.local
require("dotenv").config({ path: ".env.local" });

console.log("🔍 Checking Gmail OAuth Environment Variables...\n");

const vars = [
  "GMAIL_CLIENT_ID",
  "GMAIL_CLIENT_SECRET", 
  "GMAIL_REDIRECT_URI"
];

vars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`✅ ${varName}: ${value.substring(0, 20)}...`);
  } else {
    console.log(`❌ ${varName}: MISSING`);
  }
});

console.log("\n📊 Summary:");
const allSet = vars.every(varName => process.env[varName]);
console.log(allSet ? "✅ All variables are set" : "❌ Some variables are missing");
