# Anubis Bot Protection

Anubis is an anti-bot protection system that blocks AI scrapers and automated traffic using proof-of-work challenges.

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

**Challenge not showing?**
- Check `ANUBIS_ENABLED=true`
- Verify route is protected
- Check browser console

**Too slow?**
- Lower `ANUBIS_DIFFICULTY`
- Use difficulty 2-4 for mobile

**Bots getting through?**
- Increase difficulty
- Check allowed user agents

## Security Notes

- Use strong JWT secret in production
- Always use HTTPS
- Monitor challenge completion rates
- Consider rate limiting

## Performance

- **Middleware**: ~1-2ms overhead
- **Challenge**: ~50KB page
- **Solve time**: 1-5 seconds
- **Memory**: Minimal usage 