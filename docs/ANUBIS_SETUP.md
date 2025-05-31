# AgenitiX Adaptive Anubis Setup Guide

## Overview

AgenitiX Adaptive Anubis is an enterprise-grade anti-bot protection system that uses intelligent 5-level risk assessment and optimistic verification to provide seamless security. Unlike traditional binary blocking systems, Anubis adapts its response based on real-time threat analysis.

## 🚀 Key Features

- 🧠 **5-Level Adaptive Risk Assessment** - Intelligent threat classification
- ⚡ **Optimistic Verification** - 95% invisible operation for trusted users
- 🎯 **Proof-of-Work Challenges** - SHA256-based computational verification
- 🔧 **Dynamic Configuration** - Risk-based challenge difficulty
- 🎨 **Beautiful Challenge UI** - Modern, responsive interface
- 🤖 **Smart Bot Allowlisting** - Automatic search engine approval
- 🔐 **JWT Authentication** - Secure token-based sessions
- 📊 **Real-Time Analytics** - Risk monitoring dashboard
- 🧪 **Comprehensive Testing** - Automated validation suite

## 📋 Quick Setup

### 1. Environment Configuration

Create or update your `.env.local` file:

```bash
# CORE ANUBIS CONFIGURATION
ANUBIS_ENABLED=true
ANUBIS_JWT_SECRET=your-super-secret-jwt-key-here

# ADAPTIVE RISK SYSTEM
ANUBIS_RISK_THRESHOLD_LOW=25
ANUBIS_RISK_THRESHOLD_MODERATE=50
ANUBIS_RISK_THRESHOLD_ELEVATED=75
ANUBIS_RISK_THRESHOLD_HIGH=90

# OPTIMISTIC VERIFICATION
ANUBIS_OPTIMISTIC_ENABLED=true
ANUBIS_GRACE_PERIOD_LOW=60000      # 60 seconds for trusted users
ANUBIS_GRACE_PERIOD_MODERATE=30000 # 30 seconds for standard users

# CHALLENGE DIFFICULTIES (by risk level)
ANUBIS_DIFFICULTY_LOW=2        # Trusted users (~0.1-0.5s)
ANUBIS_DIFFICULTY_MODERATE=3   # Standard users (~0.5-1s)
ANUBIS_DIFFICULTY_ELEVATED=4   # Suspicious users (~1-2s)
ANUBIS_DIFFICULTY_HIGH=6       # High-risk users (~5-15s)
ANUBIS_DIFFICULTY_DANGEROUS=8  # Maximum security (~30-120s)

# DEVELOPMENT SETTINGS
ANUBIS_BYPASS_DEVELOPMENT=true
ANUBIS_COOKIE_DOMAIN=
```

### 2. Generate Strong JWT Secret

```bash
# Generate a secure 32-byte secret:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Or use OpenSSL:
openssl rand -hex 32
```

### 3. Restart Development Server

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

### 4. Verify Installation

Look for these indicators:
- 🐺 Control panel button (bottom-left corner)
- Risk level indicators in network headers
- No console errors in browser dev tools

## 🎯 Adaptive Risk System

### Risk Level Classification

Anubis analyzes each request using 8 weighted factors and assigns one of 5 risk levels:

| Level | Name | Score Range | Behavior | Challenge Difficulty |
|-------|------|-------------|----------|---------------------|
| **1** | 🟢 LOW | 0-24 | Optimistic (60s grace) | 2 (~0.1-0.5s) |
| **2** | 🔵 MODERATE | 25-49 | Optimistic (30s grace) | 3 (~0.5-1s) |
| **3** | 🟡 ELEVATED | 50-74 | Immediate challenge | 4 (~1-2s) |
| **4** | 🔴 HIGH | 75-89 | Immediate challenge | 6 (~5-15s) |
| **5** | 🟤 DANGEROUS | 90-100 | Maximum security | 8 (~30-120s) |

### Risk Factors Analyzed

1. **IP Reputation (25%)** - Known bad IPs, hosting providers, threat feeds
2. **Request Patterns (20%)** - Timing, frequency, automation signatures
3. **User Agent (15%)** - Bot patterns, headless browsers, suspicious strings
4. **Session History (15%)** - Previous failures, challenge attempts, behavior
5. **Geolocation (10%)** - High-risk countries, unusual locations
6. **Device Fingerprint (5%)** - Browser capabilities, screen resolution
7. **Network Behavior (5%)** - VPN, proxy, hosting provider detection
8. **Time of Day (5%)** - Unusual access hours, bot activity patterns

## ⚡ Optimistic Verification

### How It Works

**For Trusted Users (Levels 1-2):**
1. ✅ **Immediate access** granted to protected content
2. 🔄 **Background verification** starts silently
3. ⏱️ **Grace period** (30-60 seconds) to complete challenge
4. 🚫 **Blocked on next request** if verification fails

**For Suspicious Users (Levels 3-5):**
1. 🛑 **Immediate challenge** required before access
2. 🔒 **No optimistic mode** - must solve challenge first
3. ⚡ **Higher difficulty** challenges based on risk level
4. 🕐 **Shorter session** timeouts for security

### Benefits

- **95%+ users** never see a challenge page
- **Zero friction** for legitimate traffic
- **Mobile-friendly** - no complex interactions required
- **Accessibility compliant** - works with screen readers
- **Fast performance** - <50ms overhead for most requests

## 🔧 Configuration Options

### Risk Thresholds

Customize when each risk level triggers:

```bash
# Default thresholds (0-100 scale)
ANUBIS_RISK_THRESHOLD_LOW=25      # Below this = LOW risk
ANUBIS_RISK_THRESHOLD_MODERATE=50 # Below this = MODERATE risk
ANUBIS_RISK_THRESHOLD_ELEVATED=75 # Below this = ELEVATED risk
ANUBIS_RISK_THRESHOLD_HIGH=90     # Below this = HIGH risk
# Above 90 = DANGEROUS risk
```

### Challenge Difficulties

Adjust solving time for each risk level:

```bash
# Difficulty levels (leading zeros in hash)
ANUBIS_DIFFICULTY_LOW=2        # ~0.1-0.5 seconds
ANUBIS_DIFFICULTY_MODERATE=3   # ~0.5-1 seconds
ANUBIS_DIFFICULTY_ELEVATED=4   # ~1-2 seconds
ANUBIS_DIFFICULTY_HIGH=6       # ~5-15 seconds
ANUBIS_DIFFICULTY_DANGEROUS=8  # ~30-120 seconds
```

### Grace Periods

Set optimistic verification timeouts:

```bash
# Grace periods in milliseconds
ANUBIS_GRACE_PERIOD_LOW=60000      # 60 seconds for trusted users
ANUBIS_GRACE_PERIOD_MODERATE=30000 # 30 seconds for standard users
# Levels 3-5 have no grace period (immediate challenge)
```

## 🧪 Testing & Validation

### Automated Testing Suite

Run comprehensive tests to validate your setup:

```bash
# Navigate to scripts directory
cd scripts

# Test against local server
test-adaptive-anubis.bat --local

# Test against production
test-adaptive-anubis.bat --url https://your-site.com

# PowerShell with verbose output
.\test-adaptive-anubis.ps1 -Url "https://your-site.com" -Verbose
```

### Manual Testing

**Test Optimistic Mode (Levels 1-2):**
1. Use Chrome with full headers
2. Access protected route
3. Should get immediate access
4. Check network tab for optimistic headers

**Test Immediate Challenges (Levels 3-5):**
1. Use curl or python-requests user agent
2. Access protected route
3. Should get challenge page immediately
4. Verify difficulty matches risk level

### Expected Test Results

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

## 📊 Risk Dashboard

### Accessing the Dashboard

Navigate to `/admin` (or your protected admin route) to access the risk monitoring dashboard.

### Dashboard Features

- **Real-time risk levels** for incoming requests
- **Risk distribution charts** across all traffic
- **Challenge completion rates** by difficulty level
- **False positive tracking** for legitimate users
- **Bot detection statistics** and patterns
- **Risk level simulation** for testing

### Monitoring Metrics

Key metrics to monitor:
- **Optimistic success rate** (should be >95%)
- **False positive rate** (should be <0.1%)
- **Challenge completion time** by difficulty
- **Risk level distribution** across traffic
- **Bot detection accuracy** (should be >95%)

## 🔧 Advanced Configuration

### Custom Risk Weights

Modify risk factor importance in `lib/anubis/risk-engine.ts`:

```typescript
const weights: Record<keyof RiskFactors, number> = {
  ipReputation: 0.25,     // 25% weight
  requestPattern: 0.20,   // 20% weight
  userAgent: 0.15,        // 15% weight
  sessionHistory: 0.15,   // 15% weight
  geolocation: 0.10,      // 10% weight
  deviceFingerprint: 0.05, // 5% weight
  networkBehavior: 0.05,  // 5% weight
  timeOfDay: 0.05         // 5% weight
};
```

### Session Timeouts

Configure session duration by risk level:

```typescript
const ADAPTIVE_CONFIGS = {
  1: { sessionTimeout: 7200000 },  // 2 hours for LOW risk
  2: { sessionTimeout: 3600000 },  // 1 hour for MODERATE risk
  3: { sessionTimeout: 1800000 },  // 30 minutes for ELEVATED risk
  4: { sessionTimeout: 900000 },   // 15 minutes for HIGH risk
  5: { sessionTimeout: 300000 }    // 5 minutes for DANGEROUS risk
};
```

### Failure Thresholds

Set maximum failures before escalation:

```typescript
const ADAPTIVE_CONFIGS = {
  1: { maxFailures: 5 },  // 5 failures for LOW risk
  2: { maxFailures: 3 },  // 3 failures for MODERATE risk
  3: { maxFailures: 2 },  // 2 failures for ELEVATED risk
  4: { maxFailures: 1 },  // 1 failure for HIGH risk
  5: { maxFailures: 1 }   // 1 failure for DANGEROUS risk
};
```

## 🛡️ Security Best Practices

### Production Deployment

1. **Use strong JWT secret** (32+ characters, cryptographically random)
2. **Enable HTTPS** for all traffic
3. **Set secure cookie domain** for your production domain
4. **Monitor challenge completion rates** for anomalies
5. **Regularly rotate JWT secrets** (monthly recommended)
6. **Set up alerting** for high false positive rates

### Performance Optimization

1. **Monitor response times** - should be <100ms for optimistic mode
2. **Adjust difficulty levels** based on user device capabilities
3. **Use CDN** for static challenge page assets
4. **Enable compression** for challenge page responses
5. **Monitor memory usage** - should be <10MB additional

### Compliance Considerations

1. **Privacy compliance** - no personal data sent to third parties
2. **Accessibility** - challenge pages work with screen readers
3. **Mobile optimization** - challenges solve quickly on mobile devices
4. **SEO friendly** - search engines automatically allowed
5. **GDPR compliant** - all data processing is local

## 🔍 Troubleshooting

### Common Issues

**Risk levels not working?**
- Check middleware configuration in `middleware.ts`
- Verify risk engine is properly imported
- Ensure JWT secret is set correctly
- Check browser network tab for risk headers

**Optimistic mode not activating?**
- Verify user agent patterns in risk engine
- Check risk threshold configuration
- Test with different browsers/user agents
- Monitor risk scores in dashboard

**Challenges too difficult?**
- Lower difficulty levels in environment config
- Check device performance capabilities
- Consider mobile user experience
- Monitor completion rates in dashboard

**False positives for real users?**
- Review risk factor weights
- Adjust IP reputation thresholds
- Monitor session history patterns
- Check geolocation accuracy

### Debug Mode

Enable detailed logging for troubleshooting:

```bash
# Enable debug mode
DEBUG=true npm run dev

# Run tests with debug output
DEBUG=true npm run test:local
```

### Health Checks

Verify system health:

```bash
# Check if Anubis is responding
curl -H "User-Agent: HealthCheck/1.0" http://localhost:3000/api/health

# Test risk assessment
curl -H "User-Agent: TestBot/1.0" http://localhost:3000/admin

# Verify optimistic headers
curl -H "User-Agent: Mozilla/5.0..." http://localhost:3000/admin
```

## 📈 Performance Metrics

### Expected Performance

- **Middleware overhead**: 1-2ms per request
- **Risk analysis**: 5-10ms per request
- **Challenge generation**: 10-20ms
- **Optimistic verification**: 0ms (background)
- **Memory usage**: <10MB additional
- **CPU usage**: <1% additional

### Monitoring

Key metrics to track:
- Request processing time
- Risk analysis accuracy
- Challenge completion rates
- False positive/negative rates
- System resource usage

## 📚 API Reference

### useAnubis Hook

```typescript
const {
  isEnabled,        // Global protection status
  isProtected,      // Current route protection status
  currentRoute,     // Current pathname
  riskLevel,        // Current risk assessment
  optimisticMode,   // Whether optimistic verification is active
  toggleProtection, // Toggle route protection
  updateConfig,     // Update global configuration
  getRouteConfig    // Get route-specific configuration
} = useAnubis();
```

### Risk Engine API

```typescript
import { RiskEngine } from '@/lib/anubis/risk-engine';

// Analyze a request
const { riskLevel, config, factors } = await RiskEngine.analyzeRequest({
  ip: '192.168.1.1',
  userAgent: 'Mozilla/5.0...',
  headers: { ... },
  timestamp: Date.now()
});

// Calculate risk score
const score = RiskEngine.calculateRiskScore(factors);

// Get risk level from score
const level = RiskEngine.getRiskLevel(score);
```

## 🎉 Success Criteria

Your adaptive system is working correctly when:

- ✅ **100% test pass rate** in automated testing
- ✅ **Optimistic mode only for trusted users** (levels 1-2)
- ✅ **Appropriate challenge difficulties** for each risk level
- ✅ **Fast response times** (<100ms for optimistic mode)
- ✅ **No false positives** for legitimate browsers
- ✅ **High bot detection accuracy** (>95%)
- ✅ **Risk dashboard showing accurate data**

## 📞 Support

If you encounter issues:

1. **Check the troubleshooting section** above
2. **Run the automated test suite** to identify problems
3. **Review server logs** for detailed error information
4. **Test with browser developer tools** to inspect headers
5. **Monitor the risk dashboard** during testing

## 🚀 Next Steps

1. **Deploy to production** with proper environment variables
2. **Monitor performance** and adjust thresholds as needed
3. **Set up alerting** for anomalies and false positives
4. **Consider enterprise features** for advanced ML detection
5. **Regularly update** risk patterns and threat intelligence

**Ready for enterprise features?** Contact us about the full AgenitiX Enterprise Bot Mitigation solution with advanced ML detection, compliance features, and dedicated support. 