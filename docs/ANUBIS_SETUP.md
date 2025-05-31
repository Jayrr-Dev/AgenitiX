# Anubis Protection Setup Guide

## Overview

Anubis is an anti-bot protection system that uses proof-of-work challenges to verify legitimate users and block automated scrapers. This implementation provides a complete toggle system for enabling/disabling protection on specific routes or globally.

## Features

- 🛡️ **Proof-of-Work Challenges**: SHA256-based computational challenges
- 🎯 **Route-Specific Protection**: Enable protection for specific pages/routes
- 🔧 **Easy Toggle System**: Turn protection on/off globally or per route
- 🎨 **Beautiful Challenge UI**: Modern, responsive challenge page
- 🤖 **Bot Allowlisting**: Automatically allow search engine bots
- 🔐 **JWT Authentication**: Secure token-based authentication
- ⚡ **Performance Optimized**: Lightweight and efficient

## Environment Configuration

Add these variables to your `.env.local` file:

```bash
# ANUBIS PROTECTION CONFIGURATION
# Enable or disable Anubis protection globally
ANUBIS_ENABLED=false

# Difficulty level for proof-of-work challenges (1-10)
# Higher numbers = more difficult challenges = better bot protection
# Recommended: 4 for production, 2 for development
ANUBIS_DIFFICULTY=4

# JWT secret for signing authentication tokens
# IMPORTANT: Use a strong, random secret in production
ANUBIS_JWT_SECRET=your-super-secret-jwt-key-here

# Optional: Cookie domain for JWT tokens
# Leave empty to use current domain
ANUBIS_COOKIE_DOMAIN=

# Bypass Anubis protection in development mode
# Set to 'false' to test Anubis in development
ANUBIS_BYPASS_DEVELOPMENT=true
```

## Quick Start

### 1. Enable Anubis Protection

Set the environment variable:
```bash
ANUBIS_ENABLED=true
ANUBIS_JWT_SECRET=your-secret-key-here
```

### 2. Access the Control Panel

- Look for the 🐺 button in the bottom-left corner of your website
- Click it to open the Anubis Control Panel
- Toggle global protection on/off
- Add specific routes to protect

### 3. Protect Specific Routes

**Option A: Using the Control Panel**
1. Navigate to the page you want to protect
2. Open the Anubis Control Panel (🐺 button)
3. Click "Protect This Route" in the Current Route section

**Option B: Manual Route Addition**
1. Open the Anubis Control Panel
2. Enter the route path in the "Add Protected Route" section
3. Click "Add Route"

**Option C: Programmatic Protection**
```typescript
import { useAnubis } from '@/components/anubis/AnubisProvider';

function MyComponent() {
  const { toggleProtection } = useAnubis();
  
  const protectCurrentPage = () => {
    toggleProtection('/my-protected-page', true);
  };
  
  return (
    <button onClick={protectCurrentPage}>
      Protect This Page
    </button>
  );
}
```

## How It Works

### 1. Request Interception
The middleware intercepts all requests and checks if the route needs protection.

### 2. Bot Detection
- Checks for valid JWT authentication cookie
- Allows known search engine bots (Google, Bing, etc.)
- Redirects suspicious traffic to challenge page

### 3. Proof-of-Work Challenge
Users must solve a computational challenge:
- Find a nonce that produces a hash with required leading zeros
- Difficulty adjustable from 1-10 (higher = more secure)
- Modern browsers solve this in 1-5 seconds

### 4. Authentication
- Successful challenge completion generates a JWT token
- Token stored as secure HTTP-only cookie
- Valid for 7 days by default

## Configuration Options

### Difficulty Levels

| Level | Description | Typical Solve Time |
|-------|-------------|-------------------|
| 1-2   | Very Easy   | < 1 second        |
| 3-4   | Easy        | 1-5 seconds       |
| 5-6   | Medium      | 5-30 seconds      |
| 7-8   | Hard        | 30-120 seconds    |
| 9-10  | Very Hard   | 2-10 minutes      |

**Recommended**: Level 4 for production, Level 2 for development.

### Allowed User Agents

By default, these bots are automatically allowed:
- Googlebot
- Bingbot
- DuckDuckBot
- Baiduspider
- YandexBot
- FacebookBot
- TwitterBot
- LinkedInBot
- WhatsApp
- AppleBot

### Excluded Routes

These routes are automatically excluded from protection:
- `/api/health`
- `/api/anubis/*`
- `/_next/*`
- `/favicon.ico`
- `/robots.txt`
- `/sitemap.xml`
- Static assets (images, CSS, JS)

## API Reference

### AnubisProvider

Wrap your app with the Anubis provider:

```tsx
import { AnubisProvider } from '@/components/anubis/AnubisProvider';

function App({ children }) {
  return (
    <AnubisProvider>
      {children}
    </AnubisProvider>
  );
}
```

### useAnubis Hook

```typescript
const {
  isEnabled,        // Global protection status
  isProtected,      // Current route protection status
  currentRoute,     // Current pathname
  toggleProtection, // Toggle route protection
  updateConfig,     // Update global config
  getRouteConfig    // Get route configuration
} = useAnubis();
```

### AnubisControlPanel

The control panel component provides a UI for managing protection:

```tsx
import { AnubisControlPanel } from '@/components/anubis/AnubisControlPanel';

// Automatically included in layout.tsx
// Shows as floating 🐺 button
```

### AnubisStatus

Shows current protection status:

```tsx
import { AnubisStatus } from '@/components/anubis/AnubisProvider';

// Automatically included in layout.tsx
// Shows protection status in bottom-right corner
```

## Advanced Usage

### Custom Route Protection

```typescript
import { getRouteProtectionManager } from '@/lib/anubis/config';

// Server-side route protection
const routeManager = getRouteProtectionManager();
routeManager.addProtectedRoute({
  path: '/admin/*',
  enabled: true,
  customDifficulty: 6,
  description: 'Admin area protection'
});
```

### Custom Challenge Difficulty

```typescript
// Set different difficulty for specific routes
const { updateConfig } = useAnubis();

updateConfig({
  protectedRoutes: [
    { path: '/admin', difficulty: 8 },
    { path: '/api/sensitive', difficulty: 6 }
  ]
});
```

## Troubleshooting

### Common Issues

**1. Challenge Page Not Showing**
- Check `ANUBIS_ENABLED=true` in environment
- Verify route is added to protected routes
- Check browser console for errors

**2. Challenge Takes Too Long**
- Reduce `ANUBIS_DIFFICULTY` value
- Check if device has sufficient computational power
- Consider using difficulty 2-4 for mobile users

**3. Legitimate Users Blocked**
- Add user agents to allowed list
- Reduce challenge difficulty
- Check JWT cookie expiration

**4. Bots Still Getting Through**
- Increase challenge difficulty
- Review allowed user agents list
- Check for bypass routes

### Debug Mode

Enable debug logging:

```typescript
// In middleware.ts
console.log('Anubis Debug:', {
  route: pathname,
  isProtected: routeManager.isRouteProtected(pathname),
  userAgent: request.headers.get('user-agent'),
  hasValidJWT: !!validJWT
});
```

## Security Considerations

1. **JWT Secret**: Use a strong, random secret in production
2. **HTTPS**: Always use HTTPS in production for secure cookies
3. **Rate Limiting**: Consider adding rate limiting to challenge endpoint
4. **Monitoring**: Monitor challenge completion rates and adjust difficulty
5. **Backup Protection**: Use Anubis alongside other security measures

## Performance Impact

- **Middleware**: ~1-2ms overhead per request
- **Challenge Page**: ~50KB additional payload
- **Client-side**: 1-5 seconds computational time
- **Memory**: Minimal server-side memory usage

## Migration Guide

### From No Protection

1. Add environment variables
2. Enable Anubis globally
3. Start with low difficulty (2-3)
4. Gradually add protected routes
5. Monitor user experience

### From Other Bot Protection

1. Disable existing protection
2. Configure Anubis with similar routes
3. Test thoroughly in staging
4. Deploy with monitoring

## Support

For issues or questions:
1. Check this documentation
2. Review browser console errors
3. Test with different difficulty levels
4. Open an issue with detailed logs

## License

This Anubis implementation is part of your project and follows the same license terms. 