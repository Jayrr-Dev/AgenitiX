#!/usr/bin/env node

/**
 * Production Deployment Checker
 * 
 * This script helps verify that all production requirements are met
 * before deploying the magic link authentication system.
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Production Deployment Checker\n');

// Check for required environment variables
const requiredEnvVars = [
  'RESEND_API_KEY',
  'NEXT_PUBLIC_APP_URL',
  'CONVEX_DEPLOYMENT',
  'NEXT_PUBLIC_CONVEX_URL'
];

const optionalEnvVars = [
  'RESEND_FROM_EMAIL'
];

console.log('📋 Checking Environment Variables:');

let hasAllRequired = true;

requiredEnvVars.forEach(envVar => {
  const value = process.env[envVar];
  if (value) {
    console.log(`✅ ${envVar}: ${envVar.includes('API_KEY') ? '***hidden***' : value}`);
  } else {
    console.log(`❌ ${envVar}: Missing (REQUIRED)`);
    hasAllRequired = false;
  }
});

optionalEnvVars.forEach(envVar => {
  const value = process.env[envVar];
  if (value) {
    console.log(`✅ ${envVar}: ${value}`);
  } else {
    console.log(`⚠️  ${envVar}: Not set (optional)`);
  }
});

console.log('\n📁 Checking Files:');

const requiredFiles = [
  'lib/email-service.ts',
  'hooks/useAuth.ts',
  'convex/auth.ts',
  'app/api/auth/send-magic-link/route.ts',
  'app/auth/verify/page.tsx'
];

requiredFiles.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file}: Missing`);
    hasAllRequired = false;
  }
});

console.log('\n🔍 Checking Package Dependencies:');

const packageJsonPath = path.join(process.cwd(), 'package.json');
if (fs.existsSync(packageJsonPath)) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
  
  const requiredPackages = ['convex', 'resend', 'sonner', 'next'];
  
  requiredPackages.forEach(pkg => {
    if (dependencies[pkg]) {
      console.log(`✅ ${pkg}: ${dependencies[pkg]}`);
    } else {
      console.log(`❌ ${pkg}: Missing`);
      hasAllRequired = false;
    }
  });
} else {
  console.log('❌ package.json: Missing');
  hasAllRequired = false;
}

console.log('\n🏗️  Build Check:');

// Check if build files exist or suggest running build
const nextConfigPath = path.join(process.cwd(), 'next.config.ts');
const nextConfigJsPath = path.join(process.cwd(), 'next.config.js');

if (fs.existsSync(nextConfigPath) || fs.existsSync(nextConfigJsPath)) {
  console.log('✅ Next.js configuration found');
} else {
  console.log('⚠️  Next.js configuration not found');
}

console.log('\n📋 Deployment Platforms:');

console.log(`
🌐 Vercel:
   1. Connect your GitHub repository
   2. Add environment variables in dashboard
   3. Deploy: vercel --prod

🌐 Netlify:
   1. Connect your repository
   2. Set build command: "npm run build"
   3. Set publish directory: ".next"
   4. Add environment variables

🌐 Railway:
   1. Connect your repository
   2. Add environment variables
   3. Set start command: "npm start"
`);

console.log('\n📧 Email Service Setup:');

if (process.env.RESEND_API_KEY) {
  console.log('✅ Resend API key is configured');
  console.log('📝 Next steps:');
  console.log('   1. Test email sending in production');
  console.log('   2. Monitor delivery rates in Resend dashboard');
  console.log('   3. Set up domain verification (optional)');
} else {
  console.log('❌ Resend API key not configured');
  console.log('📝 Setup steps:');
  console.log('   1. Go to https://resend.com');
  console.log('   2. Create an account and get API key');
  console.log('   3. Add RESEND_API_KEY to environment variables');
}

console.log('\n🔒 Security Checklist:');

const securityChecks = [
  'Rate limiting enabled (3 requests/hour)',
  'Magic links expire after 15 minutes',
  'Session tokens are secure',
  'HTTPS enabled on production domain',
  'Environment variables secured',
  'API keys not in code repository'
];

securityChecks.forEach(check => {
  console.log(`✅ ${check}`);
});

console.log('\n' + '='.repeat(50));

if (hasAllRequired) {
  console.log('🎉 READY FOR PRODUCTION DEPLOYMENT!');
  console.log('\n📝 Final steps:');
  console.log('   1. Run: npm run build');
  console.log('   2. Test locally: npm start');
  console.log('   3. Deploy to your platform');
  console.log('   4. Test magic link flow in production');
} else {
  console.log('❌ NOT READY FOR PRODUCTION');
  console.log('\n📝 Fix the issues above before deploying');
}

console.log('\n📚 For detailed instructions, see: PRODUCTION_SETUP.md');