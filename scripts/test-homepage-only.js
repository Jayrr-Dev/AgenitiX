#!/usr/bin/env node

/**
 * HOMEPAGE-ONLY ANUBIS PROTECTION TEST
 * Focused testing of home page (/) protection only
 */

// SET ENVIRONMENT VARIABLES FOR TESTING
process.env.ANUBIS_ENABLED = 'true';
process.env.ANUBIS_DIFFICULTY = '4';
process.env.ANUBIS_JWT_SECRET = 'test-secret-key-for-anubis-testing';

const https = require('https');
const http = require('http');
const { performance } = require('perf_hooks');

// TEST CONFIGURATION
const CONFIG = {
  // Target AgenitiX home page only
  baseUrl: process.env.TEST_SERVER_URL || 'https://agenitix.vercel.app',
  endpoint: '/', // ONLY HOME PAGE
  
  // Test scenarios to validate Anubis protection
  scenarios: {
    // LEVEL 1: LOW RISK - Trusted user
    trustedChrome: {
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1'
      },
      expectedResult: 'ALLOW_OPTIMISTIC',
      expectedRiskLevel: 'LOW',
      expectedDifficulty: 2,
      description: 'Trusted Chrome browser'
    },
    
    // LEVEL 2: MODERATE RISK - Standard user
    standardSafari: {
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Safari/605.1.15',
      headers: {
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US',
        'Connection': 'keep-alive'
      },
      expectedResult: 'ALLOW_OPTIMISTIC',
      expectedRiskLevel: 'MODERATE',
      expectedDifficulty: 3,
      description: 'Standard Safari browser'
    },
    
    // LEVEL 3: ELEVATED RISK - Suspicious user agent
    headlessChrome: {
      userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/120.0.0.0 Safari/537.36',
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5'
      },
      expectedResult: 'CHALLENGE_IMMEDIATE',
      expectedRiskLevel: 'ELEVATED',
      expectedDifficulty: 4,
      description: 'Headless Chrome browser'
    },
    
    // LEVEL 4: HIGH RISK - Bot-like user agent
    pythonBot: {
      userAgent: 'python-requests/2.28.1',
      headers: {
        'Accept': '*/*',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive'
      },
      expectedResult: 'CHALLENGE_IMMEDIATE',
      expectedRiskLevel: 'HIGH',
      expectedDifficulty: 6,
      description: 'Python requests library (should be blocked)'
    },
    
    // LEVEL 5: DANGEROUS - Known bot
    curlBot: {
      userAgent: 'curl/7.68.0',
      headers: {
        'Accept': '*/*'
      },
      expectedResult: 'CHALLENGE_IMMEDIATE',
      expectedRiskLevel: 'DANGEROUS',
      expectedDifficulty: 8,
      description: 'cURL command line tool'
    },
    
    // Scraping bot (should be blocked)
    scrapingBot: {
      userAgent: 'ScrapingBot/1.0',
      headers: {
        'Accept': '*/*',
        'Connection': 'close'
      },
      expectedResult: 'CHALLENGE_IMMEDIATE',
      expectedRiskLevel: 'DANGEROUS',
      description: 'Generic scraping bot'
    },
    
    // Googlebot (should be allowed - whitelisted)
    googleBot: {
      userAgent: 'Googlebot/2.1 (+http://www.google.com/bot.html)',
      headers: {
        'Accept': '*/*',
        'From': 'googlebot(at)googlebot.com'
      },
      expectedResult: 'ALLOW_WHITELISTED',
      description: 'Google search bot (should be whitelisted)'
    },
    
    // Malicious bot with threat intel IP
    maliciousBot: {
      userAgent: 'DataMiner/3.0 (automated data collection)',
      headers: {
        'Accept': '*/*',
        'X-Forwarded-For': '185.93.89.118', // High-risk IP from threat intel
        'X-Real-IP': '185.93.89.118'
      },
      expectedResult: 'CHALLENGE_IMMEDIATE',
      expectedRiskLevel: 'DANGEROUS',
      description: 'Malicious bot with threat intel IP'
    }
  }
};

// COLORS FOR CONSOLE OUTPUT
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// UTILITY FUNCTIONS
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {},
      timeout: options.timeout || 15000
    };

    const req = client.request(requestOptions, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data,
          redirected: res.statusCode >= 300 && res.statusCode < 400
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (options.body) {
      req.write(options.body);
    }

    req.end();
  });
}

async function testScenario(scenarioName, scenario) {
  log(`\n${'='.repeat(60)}`, 'cyan');
  log(`🧪 TESTING: ${scenario.description.toUpperCase()}`, 'bright');
  log(`🔧 User Agent: ${scenario.userAgent}`, 'blue');
  log(`${'='.repeat(60)}`, 'cyan');
  
  const startTime = performance.now();
  
  try {
    const response = await makeRequest(`${CONFIG.baseUrl}${CONFIG.endpoint}`, {
      headers: {
        'User-Agent': scenario.userAgent,
        ...scenario.headers
      }
    });
    
    const endTime = performance.now();
    const responseTime = Math.round(endTime - startTime);
    
    // ANALYZE RESPONSE
    const analysis = analyzeResponse(response, scenario);
    
    // DISPLAY RESULTS
    displayResults(scenarioName, response, analysis, responseTime);
    
    return analysis;
    
  } catch (error) {
    log(`❌ Request failed: ${error.message}`, 'red');
    return { success: false, error: error.message };
  }
}

function analyzeResponse(response, expectedScenario) {
  const analysis = {
    success: true,
    statusCode: response.statusCode,
    responseSize: response.body.length,
    redirected: response.redirected,
    riskLevel: null,
    optimistic: null,
    difficulty: null,
    gracePeriod: null,
    challengeRequired: false,
    anubisProtected: false,
    botAllowed: false,
    botType: null,
    issues: []
  };

  const content = response.body.toLowerCase();
  const headers = response.headers;

  // CHECK FOR ANUBIS HEADERS
  analysis.riskLevel = headers['x-anubis-risk-level'];
  analysis.optimistic = headers['x-anubis-optimistic'] === 'true';
  analysis.difficulty = headers['x-anubis-difficulty'] ? parseInt(headers['x-anubis-difficulty']) : null;
  analysis.gracePeriod = headers['x-anubis-grace-period'] ? parseInt(headers['x-anubis-grace-period']) : null;
  analysis.botAllowed = headers['x-anubis-bot-allowed'] === 'true';
  analysis.botType = headers['x-anubis-bot-type'];
  
  // CHECK FOR ANUBIS PROTECTION
  analysis.anubisProtected = !!(analysis.riskLevel || headers['x-anubis-session'] || analysis.botAllowed);
  
  // CHECK FOR CHALLENGE PAGE OR REDIRECT
  analysis.challengeRequired = response.statusCode === 307 || 
                              response.statusCode === 302 ||
                              content.includes('proof of work') || 
                              content.includes('verifying your browser') ||
                              content.includes('agenitix protection') ||
                              content.includes('sha256') ||
                              response.statusCode === 429;

  // CHECK FOR AGENITIX CONTENT
  const hasAgenitixContent = content.includes('agenitix') || 
                            content.includes('talent acquisition') ||
                            content.includes('testing is') ||
                            content.includes('impactful and modern');

  // DETERMINE RESULT BASED ON EXPECTATIONS
  if (expectedScenario.expectedResult === 'ALLOW_WHITELISTED') {
    if (analysis.botAllowed && response.statusCode === 200) {
      analysis.result = '✅ WHITELISTED BOT ALLOWED';
      analysis.color = 'green';
    } else if (analysis.challengeRequired) {
      analysis.result = '❌ WHITELISTED BOT BLOCKED';
      analysis.color = 'red';
      analysis.issues.push('Legitimate bot blocked');
    } else {
      analysis.result = '⚠️ UNEXPECTED RESPONSE';
      analysis.color = 'yellow';
    }
  } else if (expectedScenario.expectedResult === 'ALLOW_OPTIMISTIC') {
    if (response.statusCode === 200 && analysis.optimistic && hasAgenitixContent) {
      analysis.result = '✅ OPTIMISTIC ACCESS GRANTED';
      analysis.color = 'green';
    } else if (analysis.challengeRequired) {
      analysis.result = '❌ BLOCKED (Should be optimistic)';
      analysis.color = 'red';
      analysis.issues.push('Optimistic access denied');
    } else if (response.statusCode === 200 && hasAgenitixContent && !analysis.anubisProtected) {
      analysis.result = '⚠️ ALLOWED BUT NO PROTECTION';
      analysis.color = 'yellow';
      analysis.issues.push('No Anubis protection detected');
    } else {
      analysis.result = '⚠️ UNEXPECTED RESPONSE';
      analysis.color = 'yellow';
    }
  } else { // CHALLENGE_IMMEDIATE expected
    if (analysis.challengeRequired) {
      analysis.result = '✅ CHALLENGE REQUIRED';
      analysis.color = 'green';
    } else if (response.statusCode === 200 && hasAgenitixContent) {
      analysis.result = '❌ ALLOWED (Should be blocked)';
      analysis.color = 'red';
      analysis.issues.push('Bot traffic allowed through');
    } else {
      analysis.result = '⚠️ UNEXPECTED RESPONSE';
      analysis.color = 'yellow';
    }
  }

  // VALIDATE RISK LEVEL
  if (expectedScenario.expectedRiskLevel && analysis.riskLevel !== expectedScenario.expectedRiskLevel) {
    analysis.issues.push(`Expected risk ${expectedScenario.expectedRiskLevel}, got ${analysis.riskLevel || 'none'}`);
  }

  // VALIDATE DIFFICULTY
  if (expectedScenario.expectedDifficulty && analysis.difficulty !== expectedScenario.expectedDifficulty) {
    analysis.issues.push(`Expected difficulty ${expectedScenario.expectedDifficulty}, got ${analysis.difficulty || 'none'}`);
  }

  return analysis;
}

function displayResults(scenarioName, response, analysis, responseTime) {
  log(`\n📊 DETAILED RESULTS:`, 'blue');
  log(`   Status Code: ${response.statusCode}`, analysis.color);
  log(`   Response Time: ${responseTime}ms`, 'blue');
  log(`   Response Size: ${(analysis.responseSize / 1024).toFixed(1)}KB`, 'blue');
  log(`   Final Result: ${analysis.result}`, analysis.color);
  
  log(`\n🛡️ ANUBIS PROTECTION ANALYSIS:`, 'cyan');
  if (analysis.anubisProtected) {
    log(`   🐺 Anubis Protected: YES`, 'green');
    if (analysis.riskLevel) {
      log(`   🎯 Risk Level: ${analysis.riskLevel}`, 'yellow');
    }
    if (analysis.optimistic !== null) {
      log(`   ⚡ Optimistic Mode: ${analysis.optimistic ? 'ENABLED' : 'DISABLED'}`, analysis.optimistic ? 'green' : 'red');
    }
    if (analysis.difficulty) {
      log(`   💪 Challenge Difficulty: ${analysis.difficulty}`, 'magenta');
    }
    if (analysis.gracePeriod) {
      log(`   ⏱️ Grace Period: ${analysis.gracePeriod}ms`, 'blue');
    }
    if (analysis.botAllowed) {
      log(`   🤖 Bot Whitelisted: ${analysis.botType || 'Yes'}`, 'green');
    }
  } else {
    log(`   🐺 Anubis Protected: NO`, 'red');
  }
  
  if (analysis.challengeRequired) {
    log(`   🛡️ Challenge Required: YES`, 'yellow');
  }
  
  log(`\n📋 RESPONSE HEADERS:`, 'cyan');
  const anubisHeaders = Object.entries(response.headers).filter(([key]) => 
    key.toLowerCase().startsWith('x-anubis') || key.toLowerCase().includes('rate-limit')
  );
  if (anubisHeaders.length > 0) {
    anubisHeaders.forEach(([key, value]) => {
      log(`   ${key}: ${value}`, 'blue');
    });
  } else {
    log(`   No Anubis headers found`, 'red');
  }
  
  if (analysis.issues.length > 0) {
    log(`\n⚠️ ISSUES DETECTED:`, 'yellow');
    analysis.issues.forEach(issue => {
      log(`   • ${issue}`, 'yellow');
    });
  }

  // CONTENT PREVIEW (first 200 chars)
  log(`\n📄 CONTENT PREVIEW:`, 'cyan');
  const preview = response.body.substring(0, 200).replace(/\s+/g, ' ').trim();
  log(`   "${preview}${response.body.length > 200 ? '...' : ''}"`, 'blue');
}

async function runAllTests() {
  log('🏠 HOMEPAGE-ONLY ANUBIS PROTECTION TEST', 'cyan');
  log(`Testing URL: ${CONFIG.baseUrl}${CONFIG.endpoint}`, 'yellow');
  log(`${new Date().toISOString()}`, 'blue');
  log('='.repeat(80));

  const results = {
    total: 0,
    passed: 0,
    failed: 0,
    unknown: 0,
    scenarios: {}
  };

  for (const [scenarioName, scenario] of Object.entries(CONFIG.scenarios)) {
    const result = await testScenario(scenarioName, scenario);
    results.scenarios[scenarioName] = result;
    
    if (result.success !== false) {
      results.total++;
      if (result.result?.includes('✅')) {
        results.passed++;
      } else if (result.result?.includes('❌')) {
        results.failed++;
      } else {
        results.unknown++;
      }
    }

    // DELAY BETWEEN TESTS
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  displaySummary(results);
  return results;
}

function displaySummary(results) {
  log('\n' + '='.repeat(80), 'cyan');
  log('🏠 HOMEPAGE PROTECTION SUMMARY', 'bright');
  log('='.repeat(80), 'cyan');
  
  log(`📊 Test Results:`, 'blue');
  log(`   Total Tests: ${results.total}`, 'blue');
  log(`   ✅ Working Correctly: ${results.passed}`, 'green');
  log(`   ❌ Issues Found: ${results.failed}`, 'red');
  log(`   ⚠️ Unknown Results: ${results.unknown}`, 'yellow');

  const successRate = results.total > 0 ? ((results.passed / results.total) * 100).toFixed(1) : 0;
  log(`\n🎯 Protection Success Rate: ${successRate}%`, successRate > 80 ? 'green' : 'yellow');

  // DETAILED BREAKDOWN
  log(`\n🔍 DETAILED BREAKDOWN:`, 'cyan');
  for (const [scenarioName, result] of Object.entries(results.scenarios)) {
    if (result.success !== false) {
      const scenario = CONFIG.scenarios[scenarioName];
      log(`   ${scenario.description}: ${result.result}`, result.color);
    }
  }

  // RECOMMENDATIONS
  log(`\n🛠️ RECOMMENDATIONS:`, 'cyan');
  
  const hasAnubisProtection = Object.values(results.scenarios).some(result => result.anubisProtected);
  const hasProperRiskLevels = Object.values(results.scenarios).some(result => result.riskLevel);
  
  if (!hasAnubisProtection) {
    log(`   🔴 CRITICAL: No Anubis protection detected on home page`, 'red');
    log(`   💡 Check middleware configuration and ensure '/' is in PROTECTED_ROUTES`, 'yellow');
  } else if (!hasProperRiskLevels) {
    log(`   🟡 WARNING: Anubis protection detected but risk levels missing`, 'yellow');
    log(`   💡 Check risk engine configuration and header implementation`, 'yellow');
  } else if (successRate < 80) {
    log(`   🟡 Some protection issues detected`, 'yellow');
    log(`   💡 Review bot detection patterns and whitelisting logic`, 'yellow');
  } else {
    log(`   🟢 Homepage protection is working excellently!`, 'green');
  }
  
  log(`\n🎉 Test complete! ${new Date().toISOString()}`, 'green');
}

// RUN TESTS
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = { runAllTests, CONFIG }; 