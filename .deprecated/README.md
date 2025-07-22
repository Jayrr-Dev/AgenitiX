# AgenitiX Adaptive Anubis Testing Suite

Comprehensive testing suite for the 5-level adaptive risk system in your AgenitiX Anubis bot protection.

## 🚀 Quick Start

### Prerequisites
- Node.js 14+ installed
- Your AgenitiX server running with Anubis protection enabled

### Basic Usage

```bash
# Navigate to scripts directory
cd scripts

# Test against local development server
npm run test:local

# Test against custom server
TEST_SERVER_URL=https://your-server.com node test-adaptive-anubis.js

# Test with specific endpoints
node test-adaptive-anubis.js
```

## 🧪 What Gets Tested

### Risk Levels (1-5)
- **Level 1 (LOW)**: Trusted users with optimistic verification
- **Level 2 (MODERATE)**: Standard users with optimistic verification  
- **Level 3 (ELEVATED)**: Suspicious users with immediate challenges (difficulty 4)
- **Level 4 (HIGH)**: High-risk users with harder challenges (difficulty 6)
- **Level 5 (DANGEROUS)**: Maximum security with hardest challenges (difficulty 8)

### Test Scenarios
1. **Trusted Browser**: Chrome with full headers → Should get LOW risk
2. **Standard Browser**: Safari with basic headers → Should get MODERATE risk
3. **Headless Browser**: HeadlessChrome → Should get ELEVATED risk (no optimistic)
4. **Bot User Agent**: python-requests → Should get HIGH risk (no optimistic)
5. **Known Bot**: curl → Should get DANGEROUS risk (no optimistic)

### Endpoints Tested
- `/admin` - Protected admin area
- `/dashboard` - User dashboard
- `/api/protected` - Protected API endpoint

## 📊 Test Output

The script provides detailed output including:

```
🧪 Testing lowRisk on /admin
📊 Results for lowRisk:
   Status: 200
   Response Time: 45ms
   Risk Level: LOW
   Optimistic Mode: ✅
   Difficulty: 2
   Grace Period: 60000ms
   Challenge Required: ❌
   ✅ All checks passed!
```

## 🔧 Configuration

Edit the `CONFIG` object in `test-adaptive-anubis.js` to customize:

```javascript
const CONFIG = {
  baseUrl: 'http://localhost:3000',
  endpoints: ['/admin', '/dashboard', '/api/protected'],
  scenarios: {
    // Add custom test scenarios here
  }
};
```

### Environment Variables
- `TEST_SERVER_URL`: Override the target server URL

## 🎯 Expected Results

### Optimistic Mode (Levels 1-2)
- Immediate access granted (200 status)
- Background verification headers present
- Grace period provided (30-60 seconds)
- Low difficulty challenges (2-3)

### Immediate Mode (Levels 3-5)
- Challenge required immediately
- No optimistic headers
- Higher difficulty challenges (4, 6, 8)
- Shorter session timeouts

## 🔍 Troubleshooting

### Common Issues

1. **Connection Refused**
   ```
   ❌ Request failed: connect ECONNREFUSED
   ```
   - Ensure your server is running
   - Check the TEST_SERVER_URL is correct

2. **Risk Level Not Detected**
   ```
   Risk Level: Not detected
   ```
   - Verify Anubis middleware is properly configured
   - Check that risk headers are being set

3. **Unexpected Risk Levels**
   ```
   Expected risk level LOW, got MODERATE
   ```
   - Review your risk engine configuration
   - Check user agent patterns in `risk-engine.ts`

### Debug Mode

Add debug logging by modifying the script:

```javascript
// Add at the top of test-adaptive-anubis.js
const DEBUG = process.env.DEBUG === 'true';

// Use throughout the script
if (DEBUG) console.log('Debug info:', data);
```

Run with debug:
```bash
DEBUG=true npm run test:local
```

## 📈 Advanced Testing

### Custom Scenarios

Add your own test scenarios:

```javascript
// In CONFIG.scenarios
customBot: {
  userAgent: 'MyBot/1.0',
  headers: {
    'Accept': 'application/json'
  },
  expectedRiskLevel: 'HIGH',
  expectedOptimistic: false,
  expectedDifficulty: 6
}
```

### Rate Limiting Tests

The script includes rate limiting tests that make 10 rapid requests to test escalation behavior.

### Challenge Flow Testing

For non-optimistic scenarios, the script tests the complete challenge flow:
1. Request challenge page
2. Extract challenge parameters
3. Simulate solving (timing analysis)

## 🔗 Integration

### CI/CD Integration

Add to your GitHub Actions:

```yaml
- name: Test Anubis Protection
  run: |
    cd scripts
    npm run test:staging
```

### Monitoring Integration

The test results can be parsed and sent to monitoring systems:

```javascript
const results = await runAllTests();
// Send results to your monitoring system
```

## 📋 Test Checklist

Before deploying to production:

- [ ] All 5 risk levels working correctly
- [ ] Optimistic mode only for levels 1-2
- [ ] Correct difficulty escalation (2→3→4→6→8)
- [ ] Challenge flows working for levels 3-5
- [ ] Rate limiting and escalation working
- [ ] Response times acceptable (<100ms for optimistic)
- [ ] No false positives for legitimate browsers

## 🛠️ Extending the Tests

### Adding New Test Cases

1. Add scenario to `CONFIG.scenarios`
2. Define expected behavior
3. Run tests to validate

### Custom Assertions

Add custom validation logic in `analyzeResponse()`:

```javascript
// Custom validation
if (scenario.customCheck) {
  if (!customValidation(response)) {
    analysis.issues.push('Custom validation failed');
  }
}
```

## 📞 Support

If tests are failing:

1. Check server logs for detailed error information
2. Verify middleware configuration
3. Test with browser developer tools
4. Review the Risk Dashboard during testing

## 🎉 Success Criteria

Your adaptive system is working correctly when:
- ✅ 100% test pass rate
- ✅ Optimistic mode only for trusted users
- ✅ Appropriate challenge difficulties
- ✅ Fast response times
- ✅ No false positives for real browsers 