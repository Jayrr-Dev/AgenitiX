# Anubis Bot Protection

Anubis is an anti-bot protection system that blocks AI scrapers and automated traffic using proof-of-work challenges.

## Step-by-Step Setup

### 1. Create Environment File

Create or edit `.env.local` in your project root:

```bash
# Required settings
ANUBIS_ENABLED=true
ANUBIS_DIFFICULTY=4
ANUBIS_JWT_SECRET=your-super-secret-jwt-key-here

# Optional settings
ANUBIS_BYPASS_DEVELOPMENT=true
ANUBIS_COOKIE_DOMAIN=
```

### 2. Generate Strong JWT Secret

```bash
# Generate a secure secret (use one of these methods):

# Method 1: Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Method 2: OpenSSL
openssl rand -hex 32

# Method 3: Online generator
# Visit: https://generate-secret.vercel.app/32
```

### 3. Restart Development Server

```bash
# Stop your dev server (Ctrl+C) and restart:
npm run dev
# or
yarn dev
# or
pnpm dev
```

### 4. Verify Installation

Look for these indicators:
- 🐺 button appears in bottom-left corner
- Status indicator in bottom-right corner (when enabled)
- No console errors in browser dev tools

## Testing & Verification

### Quick Test (Recommended)

1. **Enable Testing Mode**:
```bash
# In .env.local, temporarily set:
ANUBIS_BYPASS_DEVELOPMENT=false
ANUBIS_DIFFICULTY=2  # Lower for faster testing
```

2. **Protect Current Page**:
   - Click 🐺 button (bottom-left)
   - Click "Protect This Route"

3. **Test in Incognito**:
   - Open incognito/private window
   - Visit the same page
   - Should see challenge page with 🐺 logo

4. **Verify Success**:
   - Challenge completes in 1-5 seconds
   - Redirects back to original page
   - Page loads normally

### Visual Indicators

**🐺 Control Panel Button** (bottom-left)
- Appears when Anubis is enabled
- Click to manage protection settings

**Status Indicator** (bottom-right)
- Shows current route protection status
- Only visible when protection is enabled

**Challenge Page**
- Beautiful interface with progress bar
- 🐺 logo and "Anubis Protection" title
- Real-time solving progress

### Debug Component

Add this to any page for instant status check:

```typescript
import { useAnubis } from '@/components/anubis/AnubisProvider';

function AnubisDebug() {
  const { isEnabled, isProtected, currentRoute } = useAnubis();
  
  return (
    <div style={{ 
      position: 'fixed', 
      top: 10, 
      right: 10, 
      background: 'black', 
      color: 'white', 
      padding: 10,
      borderRadius: 5,
      fontSize: 12,
      zIndex: 9999
    }}>
      <div>Enabled: {isEnabled ? '✅' : '❌'}</div>
      <div>Protected: {isProtected ? '🛡️' : '🔓'}</div>
      <div>Route: {currentRoute}</div>
    </div>
  );
}
```

### Testing Methods

**Method 1: Incognito Window** (Easiest)
1. Protect any page via control panel
2. Open incognito/private browser window
3. Navigate to protected page
4. Challenge should appear immediately

**Method 2: Clear Cookies**
```javascript
// Run in browser console:
document.cookie = "anubis-auth=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
// Then refresh protected page
```

**Method 3: Different Browser**
1. Protect route in Chrome
2. Open Firefox/Safari
3. Visit same route
4. Challenge should trigger

**Method 4: Curl Test**
```bash
# Should return challenge page HTML:
curl -L http://localhost:3000/your-protected-route

# Look for "Anubis Protection" in response
```

### Monitoring Logs

**Browser Console** (F12 → Console):
```
✅ Good: "Incoming request to: /your-route"
✅ Good: "Challenge generation for route..."
❌ Bad: Any error messages
```

**Network Tab** (F12 → Network):
```
✅ Look for: Redirect to /api/anubis/challenge
✅ Look for: POST to /api/anubis/challenge (after solving)
✅ Look for: Final redirect back to original page
```

**Server Terminal**:
```
✅ Good: "Incoming request to: /protected-route"
✅ Good: "Challenge generation..."
✅ Good: "Proof of work validation..."
```

## Quick Start

### 1. Enable Protection

Add to your `.env.local`:

```bash
ANUBIS_ENABLED=true
ANUBIS_DIFFICULTY=4
ANUBIS_JWT_SECRET=your-secret-key-here
```

### 2. Use the Control Panel

- Click the 🐺 button (bottom-left corner)
- Toggle global protection on/off
- Add routes to protect

### 3. Protect Routes

**Via Control Panel:**
1. Navigate to any page
2. Open control panel (🐺 button)
3. Click "Protect This Route"

**Via Code:**
```typescript
import { useAnubisProtection } from '@/hooks/useAnubisProtection';

function MyPage() {
  const { protectCurrentRoute } = useAnubisProtection();
  
  return (
    <button onClick={protectCurrentRoute}>
      Protect This Page
    </button>
  );
}
```

**Auto-protect Pages:**
```typescript
// Automatically protect when component loads
function AdminPage() {
  useAnubisProtection({ autoProtect: true });
  return <div>Protected content</div>;
}
```

## How It Works

1. **Request Check**: Middleware checks if route needs protection
2. **Challenge**: Suspicious traffic gets a computational challenge
3. **Verification**: Users solve proof-of-work puzzle (1-5 seconds)
4. **Access**: Valid solution grants 7-day access token

## Configuration

| Setting | Description | Default |
|---------|-------------|---------|
| `ANUBIS_ENABLED` | Enable/disable globally | `false` |
| `ANUBIS_DIFFICULTY` | Challenge difficulty (1-10) | `4` |
| `ANUBIS_JWT_SECRET` | Token signing secret | Required |
| `ANUBIS_BYPASS_DEVELOPMENT` | Skip in dev mode | `true` |

### Difficulty Levels

- **1-2**: Very Easy (< 1 second)
- **3-4**: Easy (1-5 seconds) ← Recommended
- **5-6**: Medium (5-30 seconds)
- **7-8**: Hard (30-120 seconds)
- **9-10**: Very Hard (2-10 minutes)

## Bulk Protection

```typescript
import { AnubisUtils } from '@/hooks/useAnubisProtection';

// Protect admin routes
AnubisUtils.protectRoutes(AnubisUtils.patterns.admin, toggleProtection);

// Available patterns:
// - admin: /admin, /dashboard
// - auth: /login, /register, /profile
// - ecommerce: /checkout, /cart, /orders
// - api: /api/*
// - content: /blog/*, /docs/*
```

## What Gets Protected

✅ **Blocked**: AI scrapers, bots, automated traffic
✅ **Allowed**: Search engines (Google, Bing, etc.)
✅ **Excluded**: Static files, API health checks

## Components

### Status Indicator
Shows protection status in bottom-right corner (auto-included).

### Control Panel
Floating 🐺 button for managing protection (auto-included).

### Protected Component
```typescript
import { ProtectedComponent } from '@/hooks/useAnubisProtection';

<ProtectedComponent
  fallback={<div>Route not protected</div>}
>
  <div>This shows when route is protected</div>
</ProtectedComponent>
```

### Page HOC
```typescript
import { withAnubisProtection } from '@/hooks/useAnubisProtection';

const ProtectedPage = withAnubisProtection(MyPage, {
  autoProtect: true
});
```

## Troubleshooting

**🐺 Button not showing?**
- Check `ANUBIS_ENABLED=true` in `.env.local`
- Restart development server
- Check browser console for errors

**Challenge not appearing?**
- Set `ANUBIS_BYPASS_DEVELOPMENT=false` for testing
- Verify route is protected in control panel
- Try incognito window
- Clear cookies and refresh

**Challenge too slow?**
- Lower `ANUBIS_DIFFICULTY` to 1-2
- Check device performance
- Use difficulty 2-4 for mobile users

**Bots still getting through?**
- Increase difficulty to 6-8
- Check allowed user agents list
- Monitor server logs for patterns

**Environment issues?**
- Restart server after changing `.env.local`
- Check file is in project root
- Verify no typos in variable names

## Security Notes

- Use strong JWT secret in production (32+ characters)
- Always use HTTPS in production
- Monitor challenge completion rates
- Consider rate limiting for API endpoints
- Regularly rotate JWT secrets

## Performance

- **Middleware**: ~1-2ms overhead per request
- **Challenge**: ~50KB page size
- **Solve time**: 1-5 seconds (difficulty 4)
- **Memory**: Minimal server usage
- **SEO**: No impact (search bots allowed)

## 📚 Additional Documentation

- **[🔧 Complete Setup Guide](./ANUBIS_SETUP.md)** - Detailed implementation guide
- **[🆚 Anubis vs Turnstile](./ANUBIS_VS_TURNSTILE.md)** - Why we chose Anubis over alternatives
- **[🧪 Testing Scripts](../scripts/README.md)** - Automated testing tools

## 🤔 Why Anubis?

Wondering why we built a custom solution instead of using Cloudflare Turnstile or other services? Check out our detailed comparison: **[Anubis vs Turnstile](./ANUBIS_VS_TURNSTILE.md)**

**TL;DR**: We chose Anubis for complete privacy control, custom branding, zero costs, and the flexibility to implement exactly what our application needs. 