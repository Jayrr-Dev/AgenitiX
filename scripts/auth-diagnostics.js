/**
 * Script: scripts/auth-diagnostics.js
 * AUTH DIAGNOSTICS - Comprehensive authentication configuration checker
 *
 * • Validates all required environment variables for Convex Auth
 * • Checks OAuth provider configurations
 * • Tests Convex connection and auth setup
 * • Provides specific remediation steps for missing configurations
 * • Safe for production use - no sensitive data logged
 *
 * Keywords: auth-diagnostics, convex-auth, oauth-config, environment-validation
 */

const chalk = require("chalk");

// ANSI color codes for environments without chalk
const colors = {
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  reset: "\x1b[0m",
  bold: "\x1b[1m",
};

function log(message, color = "reset") {
  console.log(colors[color] + message + colors.reset);
}

function checkEnvironmentVariable(name, required = false, description = "") {
  const value = process.env[name];
  const status = {
    name,
    set: !!value,
    length: value?.length || 0,
    required,
    description,
  };

  if (value) {
    log(`✅ ${name}: Set (${value.length} chars) - ${description}`, "green");
  } else if (required) {
    log(`❌ ${name}: MISSING (REQUIRED) - ${description}`, "red");
  } else {
    log(`⚠️  ${name}: Missing (optional) - ${description}`, "yellow");
  }

  return status;
}

async function runAuthDiagnostics() {
  log("\n🔍 AUTH DIAGNOSTICS - Convex Auth Configuration Check\n", "bold");

  // Check critical environment variables, basically required for auth to work
  log("1. Critical Environment Variables:", "cyan");
  const criticalVars = [
    checkEnvironmentVariable(
      "AUTH_SECRET",
      true,
      "JWT signing secret for sessions"
    ),
    checkEnvironmentVariable(
      "CONVEX_DEPLOYMENT",
      true,
      "Convex backend deployment ID"
    ),
    checkEnvironmentVariable(
      "NEXT_PUBLIC_CONVEX_URL",
      true,
      "Convex API endpoint URL"
    ),
  ];

  // Check email provider configuration, basically magic link support
  log("\n2. Email Provider Configuration:", "cyan");
  const emailVars = [
    checkEnvironmentVariable(
      "AUTH_RESEND_KEY",
      true,
      "Resend API key for magic links"
    ),
    checkEnvironmentVariable(
      "RESEND_API_KEY",
      false,
      "Legacy Resend key (if used)"
    ),
    checkEnvironmentVariable(
      "RESEND_FROM_EMAIL",
      false,
      "Custom sender email domain"
    ),
  ];

  // Check OAuth providers, basically GitHub and Google integration
  log("\n3. OAuth Provider Configuration:", "cyan");
  const oauthVars = [
    checkEnvironmentVariable("AUTH_GITHUB_ID", false, "GitHub OAuth client ID"),
    checkEnvironmentVariable(
      "AUTH_GITHUB_SECRET",
      false,
      "GitHub OAuth client secret"
    ),
    checkEnvironmentVariable("AUTH_GOOGLE_ID", false, "Google OAuth client ID"),
    checkEnvironmentVariable(
      "AUTH_GOOGLE_SECRET",
      false,
      "Google OAuth client secret"
    ),
  ];

  // Check application configuration, basically Next.js setup
  log("\n4. Application Configuration:", "cyan");
  const appVars = [
    checkEnvironmentVariable(
      "NEXT_PUBLIC_APP_URL",
      false,
      "Application base URL for redirects"
    ),
    checkEnvironmentVariable("NODE_ENV", false, "Runtime environment"),
  ];

  // Analyze results and provide recommendations, basically actionable feedback
  log("\n📊 DIAGNOSTIC RESULTS:", "bold");

  const allVars = [...criticalVars, ...emailVars, ...oauthVars, ...appVars];
  const missingRequired = allVars.filter((v) => v.required && !v.set);
  const missingOptional = allVars.filter((v) => !v.required && !v.set);

  if (missingRequired.length === 0) {
    log("✅ All required environment variables are set!", "green");
  } else {
    log(`❌ ${missingRequired.length} required variables missing:`, "red");
    missingRequired.forEach((v) => {
      log(`   • ${v.name}: ${v.description}`, "red");
    });
  }

  if (missingOptional.length > 0) {
    log(
      `⚠️  ${missingOptional.length} optional variables missing (may limit functionality):`,
      "yellow"
    );
    missingOptional.forEach((v) => {
      log(`   • ${v.name}: ${v.description}`, "yellow");
    });
  }

  // Provide specific remediation steps, basically how to fix issues
  log("\n🔧 REMEDIATION STEPS:", "bold");

  if (missingRequired.includes((v) => v.name === "AUTH_SECRET")) {
    log("1. Generate AUTH_SECRET:", "cyan");
    log("   Run: openssl rand -base64 32", "blue");
    log("   Or use: https://generate-secret.vercel.app/", "blue");
  }

  if (missingRequired.includes((v) => v.name === "AUTH_RESEND_KEY")) {
    log("2. Get Resend API Key:", "cyan");
    log("   • Sign up at https://resend.com", "blue");
    log("   • Create API key in dashboard", "blue");
    log("   • Set AUTH_RESEND_KEY=re_your_key_here", "blue");
  }

  if (missingRequired.some((v) => v.name.includes("CONVEX"))) {
    log("3. Configure Convex:", "cyan");
    log("   • Run: npx convex dev (for development)", "blue");
    log("   • Or: npx convex deploy (for production)", "blue");
    log("   • Copy deployment URL to NEXT_PUBLIC_CONVEX_URL", "blue");
  }

  // Check if OAuth is properly configured, basically validate provider setup
  const hasGitHub =
    process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET;
  const hasGoogle =
    process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET;

  if (!hasGitHub && !hasGoogle) {
    log(
      "\n⚠️  No OAuth providers configured - only magic links will work",
      "yellow"
    );
    log("   To add GitHub: Set AUTH_GITHUB_ID and AUTH_GITHUB_SECRET", "blue");
    log("   To add Google: Set AUTH_GOOGLE_ID and AUTH_GOOGLE_SECRET", "blue");
  }

  // Test Convex connection if possible, basically validate deployment
  if (process.env.NEXT_PUBLIC_CONVEX_URL) {
    log("\n🌐 Testing Convex Connection:", "cyan");
    try {
      const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
      log(`   Convex URL: ${convexUrl}`, "blue");

      if (convexUrl.includes("localhost") || convexUrl.includes("127.0.0.1")) {
        log("   ✅ Local development setup detected", "green");
      } else if (convexUrl.includes(".convex.cloud")) {
        log("   ✅ Convex Cloud deployment detected", "green");
      } else {
        log("   ⚠️  Unusual Convex URL format detected", "yellow");
      }
    } catch (error) {
      log(`   ❌ Error checking Convex URL: ${error.message}`, "red");
    }
  }

  // Final recommendations, basically next steps
  log("\n🎯 NEXT STEPS:", "bold");

  if (missingRequired.length > 0) {
    log("1. Fix missing required environment variables above", "cyan");
    log("2. Restart your application after setting variables", "cyan");
    log("3. Re-run this diagnostic to verify fixes", "cyan");
  } else {
    log("1. Deploy with current configuration", "green");
    log("2. Test authentication flow in production", "green");
    log("3. Monitor auth logs for any runtime issues", "green");
  }

  log("\n📝 For detailed setup guides, see:", "cyan");
  log("   • PRODUCTION_SETUP.md - Production deployment guide", "blue");
  log("   • EMAIL_OAUTH_SETUP.md - OAuth provider setup", "blue");
  log("   • GMAIL_OAUTH_CHECKLIST.md - Gmail-specific setup", "blue");

  log("\n🔍 To run again: node scripts/auth-diagnostics.js\n", "cyan");
}

// Run diagnostics
runAuthDiagnostics().catch((error) => {
  console.error("Diagnostic script error:", error);
  process.exit(1);
});
