---
inclusion: always
---

# Security Guidelines & Best Practices

## Security Principles

**Rule**: Security by design. Every feature must consider security implications from the start.

### Core Security Principles
1. **Defense in Depth**: Multiple layers of security controls
2. **Least Privilege**: Users get minimum necessary permissions
3. **Fail Securely**: Systems fail to secure state by default
4. **Input Validation**: All inputs are validated and sanitized
5. **Output Encoding**: All outputs are properly encoded
6. **Audit Logging**: All security events are logged

## Authentication & Authorization

### User Authentication Flow
```typescript
// convex/auth.ts
export const authenticateUser = mutation({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    // Rate limiting for auth attempts
    const recentAttempts = await ctx.db
      .query("auth_attempts")
      .withIndex("by_email_and_time", (q) =>
        q.eq("email", args.email)
          .gte("createdAt", new Date(Date.now() - 300000)) // 5 minutes
      )
      .collect();

    if (recentAttempts.length >= 5) {
      throw new Error("Too many authentication attempts");
    }

    // Validate email format
    if (!isValidEmail(args.email)) {
      throw new Error("Invalid email format");
    }

    // Generate magic link
    const token = generateSecureToken();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await ctx.db.insert("auth_tokens", {
      email: args.email,
      token: await hashToken(token),
      expiresAt,
      createdAt: new Date(),
    });

    // Send magic link email
    await sendMagicLinkEmail(args.email, token);

    return { success: true };
  },
});
```

### Authorization Patterns
```typescript
// Authorization middleware for Convex functions
const requireAuth = async (ctx: ActionCtx) => {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Unauthorized");
  }
  return identity;
};

const requireResourceAccess = async (
  ctx: ActionCtx, 
  resourceId: string, 
  resourceType: string
) => {
  const identity = await requireAuth(ctx);
  
  const resource = await ctx.db.get(resourceId);
  if (!resource) {
    throw new Error("Resource not found");
  }
  
  if (resource.userId !== identity.subject) {
    throw new Error("Access denied");
  }
  
  return resource;
};

// Usage in functions
export const updateEmailTemplate = mutation({
  args: { templateId: v.id("email_templates"), data: v.any() },
  handler: async (ctx, args) => {
    const template = await requireResourceAccess(ctx, args.templateId, "email_templates");
    
    // Update template
    await ctx.db.patch(args.templateId, args.data);
    
    return { success: true };
  },
});
```

### Role-Based Access Control
```typescript
// User roles and permissions
type UserRole = "user" | "admin" | "super_admin";

interface Permission {
  resource: string;
  action: "read" | "write" | "delete" | "execute";
}

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  user: [
    { resource: "own_workflows", action: "read" },
    { resource: "own_workflows", action: "write" },
    { resource: "own_email_templates", action: "read" },
    { resource: "own_email_templates", action: "write" },
  ],
  admin: [
    { resource: "all_workflows", action: "read" },
    { resource: "all_email_templates", action: "read" },
    { resource: "user_management", action: "read" },
  ],
  super_admin: [
    { resource: "*", action: "*" },
  ],
};

// Permission checking
const checkPermission = (
  userRole: UserRole,
  resource: string,
  action: string
): boolean => {
  const permissions = ROLE_PERMISSIONS[userRole];
  return permissions.some(p => 
    (p.resource === resource || p.resource === "*") &&
    (p.action === action || p.action === "*")
  );
};
```

## Input Validation & Sanitization

### Data Validation Patterns
```typescript
// Validation utilities
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
};

export const validateUrl = (url: string): boolean => {
  try {
    const parsed = new URL(url);
    return ["http:", "https:"].includes(parsed.protocol);
  } catch {
    return false;
  }
};

export const sanitizeHtml = (html: string): string => {
  // Use DOMPurify or similar library
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ["b", "i", "em", "strong", "a"],
    ALLOWED_ATTR: ["href"],
  });
};

export const validateNodeInput = (input: any, spec: NodeInput): string[] => {
  const errors: string[] = [];
  
  // Required field validation
  if (spec.required && !input) {
    errors.push(`${spec.name} is required`);
    return errors;
  }
  
  // Type validation
  if (input && !validateType(input, spec.type)) {
    errors.push(`${spec.name} must be of type ${spec.type}`);
  }
  
  // Length validation
  if (typeof input === "string") {
    if (spec.minLength && input.length < spec.minLength) {
      errors.push(`${spec.name} must be at least ${spec.minLength} characters`);
    }
    if (spec.maxLength && input.length > spec.maxLength) {
      errors.push(`${spec.name} must be no more than ${spec.maxLength} characters`);
    }
  }
  
  // Pattern validation
  if (spec.pattern && !spec.pattern.test(input)) {
    errors.push(spec.message || `${spec.name} format is invalid`);
  }
  
  return errors;
};
```

### SQL Injection Prevention
```typescript
// Always use parameterized queries in Convex
export const getUserWorkflows = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    // ✅ Safe - uses Convex's built-in parameterization
    return await ctx.db
      .query("workflows")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

// ❌ Never do this - direct string interpolation
// const workflows = await ctx.db.raw(`SELECT * FROM workflows WHERE userId = '${args.userId}'`);
```

### XSS Prevention
```typescript
// React component with XSS protection
const SafeTextDisplay: React.FC<{ content: string }> = ({ content }) => {
  // ✅ Safe - React automatically escapes content
  return <div>{content}</div>;
};

// For HTML content, use dangerouslySetInnerHTML with sanitization
const SafeHtmlDisplay: React.FC<{ htmlContent: string }> = ({ htmlContent }) => {
  const sanitizedHtml = sanitizeHtml(htmlContent);
  
  return (
    <div 
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
      className="safe-html-content"
    />
  );
};
```

## Data Protection

### Sensitive Data Handling
```typescript
// Environment variables for sensitive data
const CONFIG = {
  CONVEX_DEPLOY_KEY: process.env.CONVEX_DEPLOY_KEY!,
  SENTRY_DSN: process.env.SENTRY_DSN!,
  EMAIL_API_KEY: process.env.EMAIL_API_KEY!,
  JWT_SECRET: process.env.JWT_SECRET!,
} as const;

// Validate required environment variables
Object.entries(CONFIG).forEach(([key, value]) => {
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
});

// Encrypt sensitive data before storage
export const encryptSensitiveData = async (data: string): Promise<string> => {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(CONFIG.JWT_SECRET),
    { name: "AES-GCM" },
    false,
    ["encrypt"]
  );
  
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoder.encode(data)
  );
  
  return JSON.stringify({
    iv: Array.from(iv),
    data: Array.from(new Uint8Array(encrypted)),
  });
};
```

### Data Retention & Privacy
```typescript
// Data retention policies
const DATA_RETENTION_POLICIES = {
  email_logs: 90, // days
  workflow_runs: 365, // days
  user_sessions: 30, // days
  audit_logs: 2555, // days (7 years)
} as const;

// Automatic data cleanup
export const cleanupExpiredData = action({
  handler: async (ctx) => {
    const now = new Date();
    
    // Clean up email logs older than 90 days
    const expiredEmailLogs = await ctx.db
      .query("email_logs")
      .filter((q) => q.lt(q.field("createdAt"), new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)))
      .collect();
    
    for (const log of expiredEmailLogs) {
      await ctx.db.delete(log._id);
    }
    
    // Clean up expired auth tokens
    const expiredTokens = await ctx.db
      .query("auth_tokens")
      .filter((q) => q.lt(q.field("expiresAt"), now))
      .collect();
    
    for (const token of expiredTokens) {
      await ctx.db.delete(token._id);
    }
  },
});
```

## API Security

### Rate Limiting
```typescript
// Rate limiting implementation
export const rateLimit = async (
  ctx: ActionCtx,
  key: string,
  limit: number,
  windowMs: number
): Promise<boolean> => {
  const now = Date.now();
  const windowStart = now - windowMs;
  
  // Get recent requests
  const recentRequests = await ctx.db
    .query("rate_limit_logs")
    .withIndex("by_key_and_time", (q) =>
      q.eq("key", key).gte("timestamp", new Date(windowStart))
    )
    .collect();
  
  if (recentRequests.length >= limit) {
    return false; // Rate limit exceeded
  }
  
  // Log this request
  await ctx.db.insert("rate_limit_logs", {
    key,
    timestamp: new Date(now),
    userId: ctx.auth.getUserIdentity()?.subject,
  });
  
  return true; // Request allowed
};

// Usage in functions
export const sendEmail = action({
  args: { to: v.string(), subject: v.string(), body: v.string() },
  handler: async (ctx, args) => {
    const identity = await requireAuth(ctx);
    
    // Rate limit: 10 emails per minute per user
    const allowed = await rateLimit(ctx, `email:${identity.subject}`, 10, 60000);
    if (!allowed) {
      throw new Error("Rate limit exceeded");
    }
    
    // Send email logic
  },
});
```

### CORS Configuration
```typescript
// Next.js API route CORS configuration
import { NextRequest, NextResponse } from "next/server";

const corsHeaders = {
  "Access-Control-Allow-Origin": process.env.ALLOWED_ORIGINS?.split(",") || ["http://localhost:3000"],
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400",
};

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { headers: corsHeaders });
}

export async function POST(request: NextRequest) {
  // Validate origin
  const origin = request.headers.get("origin");
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",") || ["http://localhost:3000"];
  
  if (!allowedOrigins.includes(origin || "")) {
    return NextResponse.json({ error: "Unauthorized origin" }, { status: 403 });
  }
  
  // Handle request
  const body = await request.json();
  
  return NextResponse.json(
    { success: true },
    { headers: corsHeaders }
  );
}
```

## Security Monitoring

### Audit Logging
```typescript
// Audit log structure
interface AuditLog {
  _id: Id<"audit_logs">;
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
}

// Audit logging function
export const logAuditEvent = mutation({
  args: {
    action: v.string(),
    resource: v.string(),
    resourceId: v.optional(v.string()),
    details: v.any(),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    
    await ctx.db.insert("audit_logs", {
      userId: identity?.subject || "anonymous",
      action: args.action,
      resource: args.resource,
      resourceId: args.resourceId,
      details: args.details,
      ipAddress: args.ipAddress,
      userAgent: args.userAgent,
      timestamp: new Date(),
    });
  },
});

// Usage in functions
export const deleteEmailTemplate = mutation({
  args: { templateId: v.id("email_templates") },
  handler: async (ctx, args) => {
    const template = await requireResourceAccess(ctx, args.templateId, "email_templates");
    
    // Log the deletion
    await logAuditEvent(ctx, {
      action: "delete",
      resource: "email_templates",
      resourceId: args.templateId,
      details: { templateName: template.name },
    });
    
    // Delete the template
    await ctx.db.delete(args.templateId);
    
    return { success: true };
  },
});
```

### Security Headers
```typescript
// Next.js security headers configuration
// next.config.ts
const securityHeaders = [
  {
    key: "X-DNS-Prefetch-Control",
    value: "on",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "X-XSS-Protection",
    value: "1; mode=block",
  },
  {
    key: "X-Frame-Options",
    value: "SAMEORIGIN",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "origin-when-cross-origin",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self'",
      "connect-src 'self' https://*.convex.cloud",
      "frame-ancestors 'none'",
    ].join("; "),
  },
];

module.exports = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};
```

## Error Handling & Information Disclosure

### Secure Error Responses
```typescript
// Secure error handling
export const handleError = (error: unknown, context: string): never => {
  // Log the full error for debugging
  console.error(`Error in ${context}:`, error);
  
  // Don't expose internal details to users
  const userMessage = error instanceof Error 
    ? error.message 
    : "An unexpected error occurred";
  
  // Send to Sentry for monitoring
  Sentry.captureException(error, {
    tags: { context },
    extra: { error },
  });
  
  throw new Error(userMessage);
};

// Usage
export const processEmail = action({
  args: { emailData: v.any() },
  handler: async (ctx, args) => {
    try {
      // Process email logic
      return { success: true };
    } catch (error) {
      handleError(error, "processEmail");
    }
  },
});
```

## File References

- **Auth Functions**: #[[file:convex/auth.ts]]
- **Security Middleware**: #[[file:middleware.ts]]
- **Environment Config**: #[[file:.env.example]]
- **Security Headers**: #[[file:next.config.ts]]
- **Audit Logs**: #[[file:convex/schema.ts]]
- **Rate Limiting**: #[[file:convex/rateLimiting.ts]]