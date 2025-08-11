#!/usr/bin/env node
/**
 * Script: scripts/test-auth-config.js
 * QUICK AUTH CONFIG TEST - Simple environment validation
 *
 * • Fast check for critical missing environment variables
 * • Validates Convex Auth requirements
 * • Provides immediate feedback on configuration issues
 * • Safe for CI/CD pipelines and production environments
 *
 * Keywords: auth-validation, quick-check, environment-test
 */

console.log("🔍 Quick Auth Configuration Test\n");

// Critical environment variables for Convex Auth, basically minimum requirements
const required = ["AUTH_SECRET", "NEXT_PUBLIC_CONVEX_URL", "CONVEX_DEPLOYMENT"];

// Recommended for full functionality, basically enhanced features
const recommended = ["AUTH_RESEND_KEY", "NEXT_PUBLIC_APP_URL"];

// OAuth providers (optional), basically extended auth methods
const oauth = [
  "AUTH_GITHUB_ID",
  "AUTH_GITHUB_SECRET",
  "AUTH_GOOGLE_ID",
  "AUTH_GOOGLE_SECRET",
];

let hasErrors = false;

// Check required variables, basically validate critical config
console.log("📋 Required Variables:");
required.forEach((name) => {
  const value = process.env[name];
  if (value) {
    console.log(`✅ ${name}: Set (${value.length} chars)`);
  } else {
    console.log(`❌ ${name}: MISSING`);
    hasErrors = true;
  }
});

// Check recommended variables, basically validate enhanced config
console.log("\n📋 Recommended Variables:");
recommended.forEach((name) => {
  const value = process.env[name];
  if (value) {
    console.log(`✅ ${name}: Set (${value.length} chars)`);
  } else {
    console.log(`⚠️  ${name}: Missing (recommended)`);
  }
});

// Check OAuth providers, basically validate provider config
console.log("\n📋 OAuth Providers:");
const hasGitHub = process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET;
const hasGoogle = process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET;

if (hasGitHub) {
  console.log("✅ GitHub OAuth: Configured");
} else {
  console.log("⚠️  GitHub OAuth: Not configured");
}

if (hasGoogle) {
  console.log("✅ Google OAuth: Configured");
} else {
  console.log("⚠️  Google OAuth: Not configured");
}

// Summary and recommendations, basically actionable results
console.log("\n📊 Summary:");
if (hasErrors) {
  console.log("❌ Configuration has errors - auth will fail");
  console.log("\nTo fix:");
  required.forEach((name) => {
    if (!process.env[name]) {
      console.log(`• Set ${name} environment variable`);
    }
  });
  console.log("\nFor detailed help: node scripts/auth-diagnostics.js");
  process.exit(1);
} else {
  console.log("✅ Minimum configuration complete - auth should work");

  if (!process.env.AUTH_RESEND_KEY) {
    console.log("⚠️  Magic links disabled (AUTH_RESEND_KEY missing)");
  }

  if (!hasGitHub && !hasGoogle) {
    console.log("⚠️  Only magic links available (no OAuth providers)");
  }

  console.log("\n🚀 Ready for deployment!");
}
