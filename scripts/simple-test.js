#!/usr/bin/env node

console.log('🚀 Simple homepage test starting...');

// SET ENVIRONMENT VARIABLES FOR TESTING
process.env.ANUBIS_ENABLED = 'true';
process.env.ANUBIS_DIFFICULTY = '4';
process.env.ANUBIS_JWT_SECRET = 'test-secret-key-for-anubis-testing';

const https = require('https');

console.log('✅ Environment and modules ready');

// Simple test function
function makeRequest(url, userAgent) {
  return new Promise((resolve, reject) => {
    console.log(`🧪 Testing: ${userAgent}`);
    
    const requestOptions = {
      hostname: 'agenitix.vercel.app',
      port: 443,
      path: '/',
      method: 'GET',
      headers: {
        'User-Agent': userAgent,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      },
      timeout: 10000
    };

    const req = https.request(requestOptions, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`📊 Response: ${res.statusCode} (${(data.length / 1024).toFixed(1)}KB)`);
        
        // Check for Anubis headers
        const anubisHeaders = Object.keys(res.headers).filter(key => 
          key.toLowerCase().startsWith('x-anubis')
        );
        
        if (anubisHeaders.length > 0) {
          console.log(`🛡️ Anubis headers found: ${anubisHeaders.join(', ')}`);
          anubisHeaders.forEach(header => {
            console.log(`   ${header}: ${res.headers[header]}`);
          });
        } else {
          console.log(`❌ No Anubis headers found`);
        }
        
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          bodyLength: data.length,
          hasAnubisProtection: anubisHeaders.length > 0
        });
      });
    });

    req.on('error', (error) => {
      console.log(`❌ Request failed: ${error.message}`);
      reject(error);
    });

    req.on('timeout', () => {
      console.log(`⏰ Request timeout`);
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

// Run tests
async function runTest() {
  console.log('🏠 Testing homepage protection...\n');
  
  const testCases = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'curl/7.68.0',
    'python-requests/2.28.1'
  ];
  
  for (const userAgent of testCases) {
    try {
      await makeRequest('https://agenitix.vercel.app/', userAgent);
      console.log('');
    } catch (error) {
      console.log(`Error: ${error.message}\n`);
    }
    
    // Wait between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('🎉 Test complete!');
}

runTest().catch(console.error); 