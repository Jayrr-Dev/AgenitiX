---
inclusion: fileMatch
fileMatchPattern: "app/api/**/*, convex/**/*, features/**/server-actions.ts"
---

# API Standards & Conventions

## REST API Design Principles

### Endpoint Naming
- **Format**: `/api/[domain]/[resource]/[action]`
- **Examples**: 
  - `/api/email/templates/create`
  - `/api/workflow/runs/start`
  - `/api/nodes/[nodeId]/execute`

### HTTP Status Codes
```typescript
// Success Responses
200 - OK (GET, PUT, PATCH)
201 - Created (POST)
204 - No Content (DELETE)

// Client Errors
400 - Bad Request (validation errors)
401 - Unauthorized (authentication required)
403 - Forbidden (insufficient permissions)
404 - Not Found (resource doesn't exist)
409 - Conflict (resource already exists)
422 - Unprocessable Entity (semantic errors)

// Server Errors
500 - Internal Server Error
502 - Bad Gateway (external service failure)
503 - Service Unavailable (temporary unavailability)
```

### Request/Response Patterns

#### Standard Response Format
```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
  meta?: {
    timestamp: string;
    requestId: string;
  };
}
```

#### Error Response Format
```typescript
interface ApiError {
  code: "VALIDATION_ERROR" | "AUTH_ERROR" | "NOT_FOUND" | "CONFLICT" | "INTERNAL_ERROR";
  message: string;
  details?: Record<string, any>;
  timestamp: string;
  requestId: string;
}
```

## Convex API Standards

### Function Naming Convention
- **Queries**: `get[Resource]`, `list[Resources]`, `find[Resource]By[Field]`
- **Mutations**: `create[Resource]`, `update[Resource]`, `delete[Resource]`
- **Actions**: `[action][Resource]` (e.g., `sendEmail`, `startWorkflow`)

### Example Convex Function
```typescript
// convex/emails.ts
export const createEmailTemplate = mutation({
  args: {
    name: v.string(),
    subject: v.string(),
    body: v.string(),
    variables: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    // Validate user authentication
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    // Create template
    const templateId = await ctx.db.insert("email_templates", {
      name: args.name,
      subject: args.subject,
      body: args.body,
      variables: args.variables || [],
      userId: identity.subject,
      createdAt: new Date(),
    });

    return { success: true, data: { templateId } };
  },
});
```

## Server Actions Standards

### File Organization
- **Location**: `features/[domain]/[feature]/server-actions.ts`
- **Naming**: `[action][Resource]` (e.g., `createEmailTemplate`, `sendWorkflowEmail`)

### Example Server Action
```typescript
// features/email/templates/server-actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { api } from "@/convex/_generated/api";
import { useMutation } from "convex/react";

export async function createEmailTemplate(formData: FormData) {
  try {
    const name = formData.get("name") as string;
    const subject = formData.get("subject") as string;
    const body = formData.get("body") as string;

    // Validation
    if (!name || !subject || !body) {
      throw new Error("All fields are required");
    }

    // Call Convex mutation
    const result = await useMutation(api.emails.createEmailTemplate)({
      name,
      subject,
      body,
    });

    revalidatePath("/email/templates");
    return { success: true, data: result };
  } catch (error) {
    return {
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: error instanceof Error ? error.message : "Unknown error",
      },
    };
  }
}
```

## Authentication & Authorization

### User Context Pattern
```typescript
// Always check authentication in Convex functions
const identity = await ctx.auth.getUserIdentity();
if (!identity) {
  throw new Error("Unauthorized");
}

// Check permissions for specific resources
const resource = await ctx.db.get(args.resourceId);
if (resource.userId !== identity.subject) {
  throw new Error("Forbidden");
}
```

### API Route Authentication
```typescript
// app/api/protected/route.ts
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return Response.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  // Protected logic here
}
```

## Error Handling Standards

### Convex Error Handling
```typescript
// Use specific error types
export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export class NotFoundError extends Error {
  constructor(resource: string) {
    super(`${resource} not found`);
    this.name = "NotFoundError";
  }
}

// In functions
if (!args.email) {
  throw new ValidationError("Email is required", "email");
}
```

### API Route Error Handling
```typescript
// app/api/error-handling-example/route.ts
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validation
    if (!body.email) {
      return Response.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Business logic
    const result = await processEmail(body.email);
    
    return Response.json({ success: true, data: result });
  } catch (error) {
    console.error("API Error:", error);
    
    return Response.json(
      { 
        error: "Internal server error",
        requestId: generateRequestId()
      },
      { status: 500 }
    );
  }
}
```

## Rate Limiting & Security

### Rate Limiting Pattern
```typescript
// Use Convex's built-in rate limiting
export const sendEmail = action({
  args: { to: v.string(), subject: v.string(), body: v.string() },
  handler: async (ctx, args) => {
    // Rate limiting: max 10 emails per minute per user
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const recentEmails = await ctx.db
      .query("email_logs")
      .withIndex("by_user_and_time", (q) =>
        q.eq("userId", identity.subject)
          .gte("createdAt", new Date(Date.now() - 60000))
      )
      .collect();

    if (recentEmails.length >= 10) {
      throw new Error("Rate limit exceeded");
    }

    // Send email logic
  },
});
```

## Testing API Endpoints

### Convex Function Testing
```typescript
// convex/emails.test.ts
import { ConvexError } from "convex/values";
import { api } from "./_generated/api";
import { runMutation } from "./_generated/test";

describe("Email Templates", () => {
  it("should create email template", async () => {
    const result = await runMutation(api.emails.createEmailTemplate, {
      name: "Test Template",
      subject: "Test Subject",
      body: "Test Body",
    });

    expect(result.success).toBe(true);
    expect(result.data.templateId).toBeDefined();
  });

  it("should reject invalid template", async () => {
    await expect(
      runMutation(api.emails.createEmailTemplate, {
        name: "",
        subject: "",
        body: "",
      })
    ).rejects.toThrow(ConvexError);
  });
});
```

## File References

- **Convex Schema**: #[[file:convex/schema.ts]]
- **Auth Functions**: #[[file:convex/auth.ts]]
- **Email Functions**: #[[file:convex/emails.ts]]
- **API Routes**: #[[file:app/api/]]
- **Server Actions**: #[[file:features/**/server-actions.ts]]