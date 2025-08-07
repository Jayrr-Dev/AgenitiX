/**
 * Script: test-gmail-oauth.js
 * GMAIL OAUTH CONFIGURATION TESTER - Validates OAuth setup
 *
 * • Tests environment variable configuration
 * • Validates OAuth URL construction
 * • Checks redirect URI configuration
 * • Provides debugging information for OAuth issues
 *
 * Keywords: oauth-testing, gmail-config, debugging
 */

async function testGmailOAuthConfig() {
  console.log('🔍 Testing Gmail OAuth Configuration...\n');

  try {
    // Test 1: Check environment variables
    console.log('📋 Environment Variables Check:');
    const requiredEnvVars = [
      'GMAIL_CLIENT_ID',
      'GMAIL_CLIENT_SECRET',
      'GMAIL_REDIRECT_URI'
    ];

    const envStatus = {};
    requiredEnvVars.forEach(varName => {
      const value = process.env[varName];
      envStatus[varName] = {
        set: !!value,
        value: value ? `${value.substring(0, 20)}...` : 'NOT SET',
        length: value?.length || 0
      };
    });

    console.log('Environment Variables Status:', JSON.stringify(envStatus, null, 2));

    // Test 2: Check for common configuration issues
    console.log('\n📋 Common Issues Check:');
    const issues = [];
    
    if (!process.env.GMAIL_CLIENT_ID) issues.push('Missing GMAIL_CLIENT_ID');
    if (!process.env.GMAIL_CLIENT_SECRET) issues.push('Missing GMAIL_CLIENT_SECRET');
    if (!process.env.GMAIL_REDIRECT_URI) issues.push('Missing GMAIL_REDIRECT_URI');
    
    if (issues.length === 0) {
      console.log('✅ No configuration issues detected');
    } else {
      console.log('❌ Configuration issues found:');
      issues.forEach(issue => console.log(`  - ${issue}`));
    }

    // Test 3: Validate redirect URI
    console.log('\n📋 Redirect URI Validation:');
    const expectedRedirectUri = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/auth/email/gmail/callback`;
    const actualRedirectUri = process.env.GMAIL_REDIRECT_URI;
    
    console.log('Redirect URI Check:', {
      expected: expectedRedirectUri,
      actual: actualRedirectUri,
      matches: expectedRedirectUri === actualRedirectUri,
      isLocalhost: actualRedirectUri?.includes('localhost'),
      isHttps: actualRedirectUri?.startsWith('https')
    });

    // Test 4: Simulate OAuth URL construction
    console.log('\n📋 OAuth URL Construction Test:');
    if (process.env.GMAIL_CLIENT_ID && process.env.GMAIL_REDIRECT_URI) {
      const testState = 'test-state-token-123';
      const scopes = [
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/gmail.readonly'
      ];
      
      const params = new URLSearchParams();
      params.append('client_id', process.env.GMAIL_CLIENT_ID);
      params.append('redirect_uri', process.env.GMAIL_REDIRECT_URI);
      params.append('response_type', 'code');
      params.append('scope', scopes.join(' '));
      params.append('access_type', 'offline');
      params.append('prompt', 'consent');
      params.append('include_granted_scopes', 'true');
      params.append('state', testState);
      params.append('t', Date.now().toString());
      
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
      
      console.log('Generated OAuth URL (first 200 chars):', authUrl.substring(0, 200) + '...');
      
      // Parse and validate URL parameters
      const url = new URL(authUrl);
      const urlParams = {
        client_id: url.searchParams.get('client_id') ? 'SET' : 'NOT SET',
        redirect_uri: url.searchParams.get('redirect_uri'),
        response_type: url.searchParams.get('response_type'),
        scope: url.searchParams.get('scope')?.substring(0, 100) + '...',
        access_type: url.searchParams.get('access_type'),
        prompt: url.searchParams.get('prompt'),
        state: url.searchParams.get('state') ? 'SET' : 'NOT SET',
        include_granted_scopes: url.searchParams.get('include_granted_scopes'),
        t: url.searchParams.get('t') ? 'SET' : 'NOT SET'
      };

      console.log('URL Parameters:', JSON.stringify(urlParams, null, 2));
    } else {
      console.log('❌ Cannot test OAuth URL construction - missing required environment variables');
    }

    // Test 5: Provide debugging tips
    console.log('\n📋 Debugging Tips:');
    console.log('1. Ensure GMAIL_CLIENT_ID and GMAIL_CLIENT_SECRET are set in your environment');
    console.log('2. Verify the redirect URI matches exactly in Google Cloud Console');
    console.log('3. Check that Gmail API is enabled in Google Cloud Console');
    console.log('4. Ensure the OAuth consent screen is configured properly');
    console.log('5. Test the OAuth flow in an incognito window to avoid cached consents');
    console.log('6. Check the browser console for any JavaScript errors during OAuth flow');
    console.log('7. Verify that the callback URL is accessible and returns proper HTML');

    // Test 6: Check for the specific issue from logs
    console.log('\n📋 Issue Analysis:');
    console.log('Based on the logs, the issue appears to be:');
    console.log('- OAuth URL is being constructed correctly');
    console.log('- Google is redirecting back with scopes but no authorization code');
    console.log('- This suggests the user is not completing the consent flow');
    console.log('- The user needs to click "Allow" when prompted by Google');
    console.log('- Try testing in an incognito/private browser window');

  } catch (error) {
    console.error('❌ Error testing Gmail OAuth configuration:', error);
  }
}

// Run the test
testGmailOAuthConfig();
