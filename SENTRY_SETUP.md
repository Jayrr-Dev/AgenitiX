# Sentry Setup Documentation

## ✅ Complete Sentry Integration Status

Your AgenitiX application now has a **production-ready Sentry setup** with comprehensive error tracking, performance monitoring, and session replay capabilities.

## 📁 Configuration Files

### Core Configuration Files
- ✅ `sentry.client.config.ts` - Frontend/browser error tracking
- ✅ `sentry.server.config.ts` - Server-side error tracking  
- ✅ `sentry.edge.config.ts` - Edge runtime error tracking
- ✅ `instrumentation.ts` - Runtime initialization
- ✅ `next.config.ts` - Build-time integration with PWA
- ✅ `app/global-error.tsx` - Global error boundary
- ✅ `.env.sentry-build-plugin` - Authentication for source maps

## 🔧 Configuration Details

### Project Settings
- **Organization**: `utilitek-solutions`
- **Project**: `agenitix`
- **DSN**: `https://3a0a6997c4f418fa5be67124a5876d42@o4509188158914560.ingest.us.sentry.io/4509748017168384`

### Performance Monitoring
- **Traces Sample Rate**: `1.0` (100% of transactions tracked)
- **Session Replay**: 10% of sessions, 100% of error sessions
- **Console Logging**: Automatic capture of log/error/warn messages

### Privacy & Security
- **Session Replay**: Text and media masked for privacy
- **Tunnel Route**: `/monitoring` (bypasses ad-blockers)
- **Source Maps**: Automatically uploaded during builds
- **Logger Tree-shaking**: Enabled for production bundle optimization

## 🚀 Features Enabled

### 1. **Error Tracking**
- Automatic capture of unhandled errors
- Global error boundary integration
- Custom exception reporting via `Sentry.captureException()`

### 2. **Performance Monitoring**
- 100% transaction sampling
- Custom span instrumentation for UI interactions
- API call performance tracking
- Automatic Next.js route performance monitoring

### 3. **Session Replay**
- Visual reproduction of user sessions
- Privacy-focused (sensitive data masked)
- Automatic recording on errors
- 10% sampling for normal sessions

### 4. **Console Integration**
- Automatic capture of console logs
- Structured logging support
- Error context preservation

### 5. **Source Maps**
- Automatic upload during builds
- Enhanced stack traces with original code
- CI/CD integration ready

## 💻 Usage Examples

### Error Capture
```typescript
import * as Sentry from "@sentry/nextjs";

try {
  // risky operation
} catch (error) {
  Sentry.captureException(error);
}
```

### Performance Tracking
```typescript
// UI interactions
Sentry.startSpan({
  op: "ui.click",
  name: "Create Flow Button"
}, (span) => {
  span.setAttribute("flow_type", "email");
  // your code here
});

// API calls
Sentry.startSpan({
  op: "http.client", 
  name: "GET /api/flows"
}, async () => {
  const response = await fetch("/api/flows");
  return response.json();
});
```

### Structured Logging
```typescript
import * as Sentry from "@sentry/nextjs";

const { logger } = Sentry;

logger.info("Flow created successfully", {
  flowId: "flow_123",
  userId: "user_456",
  flowType: "email"
});
```

## 🔄 Build Process

### Development
```bash
pnpm dev
```
- Sentry runs in development mode
- Errors captured and sent to dashboard
- No source map uploads

### Production Build
```bash
pnpm build
```
- Source maps automatically uploaded to Sentry
- Optimized bundle with tree-shaken logger statements
- Full error tracking and performance monitoring enabled

## 📊 Monitoring Dashboard

Access your Sentry dashboard at:
**https://sentry.io/organizations/utilitek-solutions/projects/agenitix/**

### What You'll See:
- **Issues**: All errors and exceptions
- **Performance**: Transaction traces and slow queries
- **Replays**: Session recordings with error context
- **Releases**: Source map uploads and deployment tracking

## 🛡️ Security & Privacy

### Data Protection
- Session replays mask all text content
- Media content blocked from recordings
- Sensitive form data automatically scrubbed
- Source maps uploaded securely with authentication tokens

### Environment Variables
- `SENTRY_AUTH_TOKEN`: Secure token for source map uploads
- Never commit `.env.sentry-build-plugin` to version control
- Production tokens should be set in deployment environment

## 🎯 Production Recommendations

### Sample Rate Adjustments
For high-traffic production environments, consider reducing sample rates:

```typescript
// In production configs
tracesSampleRate: 0.1, // 10% instead of 100%
replaysSessionSampleRate: 0.01, // 1% instead of 10%
```

### Error Filtering
Add custom error filtering to reduce noise:

```typescript
Sentry.init({
  beforeSend(event) {
    // Filter out known non-critical errors
    if (event.exception?.values?.[0]?.type === 'ChunkLoadError') {
      return null;
    }
    return event;
  }
});
```

## ✅ Verification Checklist

- [x] All configuration files created and properly configured
- [x] DSN consistent across all environments
- [x] Source map authentication configured
- [x] Global error boundary implemented
- [x] Next.js integration with PWA compatibility
- [x] Console logging integration enabled
- [x] Session replay configured with privacy settings
- [x] Performance monitoring at 100% sample rate
- [x] Build process integration complete

## 🎉 Your Sentry Setup is Production Ready!

The integration is complete and will automatically:
- Capture and report all errors
- Monitor performance across your application
- Record user sessions for debugging
- Upload source maps during builds
- Provide detailed error context and stack traces

No additional configuration needed - Sentry is now actively monitoring your AgenitiX application!