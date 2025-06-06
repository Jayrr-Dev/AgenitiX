#!/usr/bin/env node

const https = require('https');

async function testRoute(path, userAgent) {
  return new Promise((resolve) => {
    console.log(`🧪 Testing ${path} with: ${userAgent}`);
    
    const req = https.request({
      hostname: 'utiliteksolutions.ca',
      path: path,
      method: 'GET',
      headers: { 'User-Agent': userAgent },
      timeout: 10000
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log(`📊 ${path}: ${res.statusCode} (${(data.length/1024).toFixed(1)}KB)`);
        
        const anubisHeaders = Object.keys(res.headers).filter(h => h.startsWith('x-anubis'));
        if (anubisHeaders.length > 0) {
          console.log(`🛡️ Anubis: YES - ${anubisHeaders.join(', ')}`);
        } else {
          console.log(`❌ Anubis: NO`);
        }
        
        // Check for protection indicators
        if (res.statusCode === 403) {
          console.log(`🚫 BLOCKED: Bot protection active!`);
        } else if (res.statusCode === 307) {
          console.log(`🔄 REDIRECT: Challenge required!`);
        } else if (res.statusCode === 200) {
          const hasUtilitek = data.includes('Utilitek Solutions');
          console.log(`✅ SUCCESS: ${hasUtilitek ? 'Full content access' : 'Other content'}`);
        }
        
        console.log('');
        resolve();
      });
    });
    
    req.on('error', () => {
      console.log(`❌ Error connecting\n`);
      resolve();
    });
    req.on('timeout', () => { 
      console.log(`⏰ Timeout\n`);
      req.destroy(); 
      resolve(); 
    });
    req.end();
  });
}

async function test() {
  console.log('🎯 Testing protected routes on Utilitek production...\n');
  
  const routes = ['/', '/contact', '/careers', '/about', '/projects'];
  const bots = [
    'python-requests/2.28.1',
    'curl/7.68.0', 
    'ScrapingBot/1.0',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  ];
  
  for (const route of routes) {
    console.log(`${'='.repeat(50)}`);
    console.log(`🎯 ROUTE: ${route.toUpperCase()}`);
    console.log(`${'='.repeat(50)}`);
    
    for (const bot of bots) {
      await testRoute(route, bot);
      await new Promise(r => setTimeout(r, 500));
    }
    console.log('');
  }
  
  console.log('🎉 Route testing complete!');
}

test().catch(console.error); 