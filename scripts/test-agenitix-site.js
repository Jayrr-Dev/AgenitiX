#!/usr/bin/env node

/**
 * AGENITIX ANUBIS PROTECTION TEST SUITE
 * Tests how agenitix.vercel.app handles various bot scenarios
 * Based on the Adaptive Anubis testing framework
 */

const https = require('https');
const http = require('http');
const { performance } = require('perf_hooks');

// TEST CONFIGURATION
const CONFIG = {
  // Target AgenitiX site
  baseUrl: process.env.TEST_SERVER_URL || 'https://agenitix.vercel.app',
  
  // Test endpoints
  endpoints: [
    '/',
    '/admin',
    '/dashboard',
    '/api/protected',
    '/talent-acquisition'
  ],
  
  // Test scenarios to validate Anubis protection
  scenarios: {
    // LEVEL 1: LOW RISK - Trusted user
    trustedBrowser: {
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
      description: 'Trusted Chrome browser'
    },
    
    // LEVEL 2: MODERATE RISK - Standard user
    standardBrowser: {
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      headers: {
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US',
        'Connection': 'keep-alive'
      },
      expectedResult: 'ALLOW_OPTIMISTIC',
      expectedRiskLevel: 'MODERATE',
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
      description: 'Python requests library'
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
    
    // Googlebot (should be allowed)
    googleBot: {
      userAgent: 'Googlebot/2.1 (+http://www.google.com/bot.html)',
      headers: {
        'Accept': '*/*',
        'From': 'googlebot(at)googlebot.com'
      },
      expectedResult: 'ALLOW',
      description: 'Google search bot'
    },
    
    // Aggressive bot with threat intel patterns
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
      timeout: options.timeout || 30000
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

async function testScenario(scenarioName, scenario, endpoint) {
  log(`\n🧪 Testing ${scenario.description} on ${endpoint}`, 'cyan');
  
  const startTime = performance.now();
  
  try {
    const response = await makeRequest(`${CONFIG.baseUrl}${endpoint}`, {
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
    displayResults(scenarioName, endpoint, response, analysis, responseTime);
    
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
    issues: []
  };

  const content = response.body.toLowerCase();
  const headers = response.headers;

  // CHECK FOR ANUBIS HEADERS
  analysis.riskLevel = headers['x-anubis-risk-level'];
  analysis.optimistic = headers['x-anubis-optimistic'] === 'true';
  analysis.difficulty = headers['x-anubis-difficulty'] ? parseInt(headers['x-anubis-difficulty']) : null;
  analysis.gracePeriod = headers['x-anubis-grace-period'] ? parseInt(headers['x-anubis-grace-period']) : null;
  
  // CHECK FOR ANUBIS PROTECTION
  analysis.anubisProtected = !!(analysis.riskLevel || headers['x-anubis-session']);
  
  // CHECK FOR CHALLENGE PAGE
  analysis.challengeRequired = content.includes('proof of work') || 
                              content.includes('challenge') ||
                              content.includes('anubis') ||
                              content.includes('sha256') ||
                              content.includes('verifying') ||
                              response.statusCode === 429;

  // CHECK FOR AGENITIX CONTENT
  const hasAgenitixContent = content.includes('agenitix') || 
                            content.includes('talent acquisition') ||
                            content.includes('testing is') ||
                            response.statusCode === 200;

  // DETERMINE RESULT BASED ON EXPECTATIONS
  if (expectedScenario.expectedResult === 'ALLOW') {
    if (response.statusCode === 200 && hasAgenitixContent && !analysis.challengeRequired) {
      analysis.result = '✅ ALLOWED';
      analysis.color = 'green';
    } else if (analysis.challengeRequired) {
      analysis.result = '❌ BLOCKED (False positive)';
      analysis.color = 'red';
      analysis.issues.push('Legitimate traffic blocked');
    } else {
      analysis.result = '⚠️ UNEXPECTED';
      analysis.color = 'yellow';
    }
  } else if (expectedScenario.expectedResult === 'ALLOW_OPTIMISTIC') {
    if (response.statusCode === 200 && analysis.optimistic && hasAgenitixContent) {
      analysis.result = '✅ OPTIMISTIC ACCESS';
      analysis.color = 'green';
    } else if (analysis.challengeRequired) {
      analysis.result = '❌ BLOCKED (Should be optimistic)';
      analysis.color = 'red';
      analysis.issues.push('Optimistic access denied');
    } else {
      analysis.result = '⚠️ UNEXPECTED';
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
      analysis.result = '⚠️ UNEXPECTED';
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

function displayResults(scenarioName, endpoint, response, analysis, responseTime) {
  log(`📊 Results for ${scenarioName}:`, 'blue');
  log(`   Status: ${response.statusCode}`, analysis.color);
  log(`   Response Time: ${responseTime}ms`, 'blue');
  log(`   Size: ${(analysis.responseSize / 1024).toFixed(1)}KB`, 'blue');
  log(`   Result: ${analysis.result}`, analysis.color);
  
  if (analysis.anubisProtected) {
    log(`   🐺 Anubis Protected: Yes`, 'cyan');
    if (analysis.riskLevel) {
      log(`   🎯 Risk Level: ${analysis.riskLevel}`, 'yellow');
    }
    if (analysis.optimistic !== null) {
      log(`   ⚡ Optimistic Mode: ${analysis.optimistic ? '✅' : '❌'}`, analysis.optimistic ? 'green' : 'red');
    }
    if (analysis.difficulty) {
      log(`   💪 Difficulty: ${analysis.difficulty}`, 'magenta');
    }
    if (analysis.gracePeriod) {
      log(`   ⏱️ Grace Period: ${analysis.gracePeriod}ms`, 'blue');
    }
  } else {
    log(`   🐺 Anubis Protected: No`, 'red');
  }
  
  if (analysis.challengeRequired) {
    log(`   🛡️ Challenge Required: Yes`, 'yellow');
  }
  
  if (analysis.issues.length > 0) {
    log(`   ⚠️ Issues: ${analysis.issues.join(', ')}`, 'yellow');
  }
}

async function runAllTests() {
  log('🐺 AGENITIX ANUBIS PROTECTION ANALYSIS', 'cyan');
  log(`Testing: ${CONFIG.baseUrl}`, 'yellow');
  log('=' * 60);

  const results = {
    total: 0,
    passed: 0,
    failed: 0,
    unknown: 0,
    scenarios: {},
    anubisEnabled: false
  };

  for (const [scenarioName, scenario] of Object.entries(CONFIG.scenarios)) {
    log(`\n${'='.repeat(50)}`, 'cyan');
    log(`🎭 SCENARIO: ${scenario.description.toUpperCase()}`, 'bright');
    log(`${'='.repeat(50)}`, 'cyan');

    const scenarioResults = [];

    for (const endpoint of CONFIG.endpoints) {
      const result = await testScenario(scenarioName, scenario, endpoint);
      scenarioResults.push(result);
      
      if (result.success !== false) {
        results.total++;
        if (result.anubisProtected) {
          results.anubisEnabled = true;
        }
        
        if (result.result?.includes('✅')) {
          results.passed++;
        } else if (result.result?.includes('❌')) {
          results.failed++;
        } else {
          results.unknown++;
        }
      }

      // RATE LIMITING DELAY
      await new Promise(resolve => setTimeout(resolve, 3000));
    }

    results.scenarios[scenarioName] = scenarioResults;
  }

  displaySummary(results);
  return results;
}

function displaySummary(results) {
  log('\n' + '='.repeat(60), 'cyan');
  log('🐺 AGENITIX ANUBIS PROTECTION SUMMARY', 'bright');
  log('='.repeat(60), 'cyan');
  
  log(`Anubis Status: ${results.anubisEnabled ? '🟢 ENABLED' : '🔴 DISABLED'}`, results.anubisEnabled ? 'green' : 'red');
  log(`Total Tests: ${results.total}`, 'blue');
  log(`✅ Working Correctly: ${results.passed}`, 'green');
  log(`❌ Issues Found: ${results.failed}`, 'red');
  log(`⚠️ Unknown Results: ${results.unknown}`, 'yellow');

  const successRate = results.total > 0 ? ((results.passed / results.total) * 100).toFixed(1) : 0;
  log(`\n🎯 Protection Success Rate: ${successRate}%`, successRate > 80 ? 'green' : 'yellow');

  // DETAILED ANALYSIS
  log('\n🔍 DETAILED ANALYSIS:', 'cyan');
  
  for (const [scenarioName, scenarioResults] of Object.entries(results.scenarios)) {
    const scenario = CONFIG.scenarios[scenarioName];
    log(`\n${scenario.description}:`, 'yellow');
    
    scenarioResults.forEach((result, index) => {
      if (result.success !== false) {
        const endpoint = CONFIG.endpoints[index];
        log(`  ${endpoint}: ${result.result}`, result.color);
        if (result.riskLevel) {
          log(`    Risk: ${result.riskLevel} | Optimistic: ${result.optimistic ? 'Yes' : 'No'}`, 'blue');
        }
      }
    });
  }

  // RECOMMENDATIONS
  log('\n🛠️ RECOMMENDATIONS:', 'cyan');
  
  if (!results.anubisEnabled) {
    log('  🔴 Anubis protection appears to be DISABLED', 'red');
    log('  💡 Check environment variables and middleware configuration', 'yellow');
  } else if (successRate < 80) {
    log('  🟡 Some protection issues detected', 'yellow');
    log('  💡 Review risk level assignments and challenge requirements', 'yellow');
  } else {
    log('  🟢 Anubis protection is working excellently!', 'green');
  }
  
  log('\n🎉 Analysis complete!', 'green');
}

// RUN TESTS
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = { runAllTests, CONFIG }; 