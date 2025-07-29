---
inclusion: manual
---

# Convex Best Practices & Guidelines

## Overview

This document outlines best practices for using Convex in the AgenitiX platform. Following these guidelines ensures optimal performance, security, and maintainability of our real-time backend system.

## Core Principles

### 1. Always Await Promises
Convex functions use async/await. Failing to await promises can lead to unexpected behavior or missed error handling.

```typescript
// ❌ Bad - floating promise
export const scheduleTask = mutation({
  handler: async (ctx, args) => {
    ctx.scheduler.runAfter(1000, internal.tasks.processTask, args); // Missing await
    ctx.db.patch(args.id, { status: "scheduled" }); // Missing await
  }
});

// ✅ Good - all promises awaited
export const scheduleTask = mutation({
  handler: async (ctx, args) => {
    await ctx.scheduler.runAfter(1000, internal.tasks.processTask, args);
    await ctx.db.patch(args.id, { status: "scheduled" });
  }
});
```

**ESLint Rule**: Use `no-floating-promises` with TypeScript to catch these automatically.

### 2. Avoid `.filter` on Database Queries
Use indexes or filter in code instead of `.filter()` on queries for better performance.

```typescript
// ❌ Bad - using .filter on query
const userFlows = await ctx.db
  .query("flows")
  .filter(q => q.eq(q.field("userId"), userId))
  .collect();

// ✅ Good - use index
const userFlows = await ctx.db
  .query("flows")
  .withIndex("by_userId", q => q.eq("userId", userId))
  .collect();

// ✅ Also good - filter in code for small datasets
const allFlows = await ctx.db.query("flows").collect();
const userFlows = allFlows.filter(flow => flow.userId === userId);
```

### 3. Only Use `.collect()` with Small Result Sets
For large datasets (1000+ documents), use indexes, pagination, or denormalization.

```typescript
// ❌ Bad - potentially unbounded
const allUserEmails = await ctx.db
  .query("email_logs")
  .withIndex("by_userId", q => q.eq("userId", userId))
  .collect();

// ✅ Good - use pagination
const recentEmails = await ctx.db
  .query("email_logs")
  .withIndex("by_userId", q => q.eq("userId", userId))
  .order("desc")
  .paginate(paginationOptions);

// ✅ Good - use limit for counts
const emailCount = await ctx.db
  .query("email_logs")
  .withIndex("by_userId", q => q.eq("userId", userId))
  .take(100);
const displayCount = emailCount.length === 100 ? "99+" : emailCount.length.toString();
```

## Security Best Practices

### 1. Use Argument Validators for All Public Functions
All public functions must validate their arguments to prevent malicious input.

```typescript
// ❌ Bad - no validation
export const updateFlow = mutation({
  handler: async (ctx, { id, update }) => {
    await ctx.db.patch(id, update); // Dangerous!
  }
});

// ✅ Good - proper validation
export const updateFlow = mutation({
  args: {
    id: v.id("flows"),
    update: v.object({
      name: v.optional(v.string()),
      description: v.optional(v.string()),
      nodes: v.optional(v.array(v.any())),
    }),
  },
  handler: async (ctx, { id, update }) => {
    await ctx.db.patch(id, update);
  }
});
```

### 2. Implement Access Control for All Public Functions
Every public function must verify user authorization.

```typescript
// ❌ Bad - no access control
export const deleteFlow = mutation({
  args: { id: v.id("flows") },
  handler: async (ctx, { id }) => {
    await ctx.db.delete(id); // Anyone can delete any flow!
  }
});

// ✅ Good - proper access control
export const deleteFlow = mutation({
  args: { id: v.id("flows") },
  handler: async (ctx, { id }) => {
    const user = await ctx.auth.getUserIdentity();
    if (!user) {
      throw new Error("Unauthorized");
    }
    
    const flow = await ctx.db.get(id);
    if (!flow || flow.userId !== user.subject) {
      throw new Error("Flow not found or access denied");
    }
    
    await ctx.db.delete(id);
  }
});
```

### 3. Only Schedule Internal Functions
Use `internal.*` functions for scheduling and `ctx.run*` calls, never `api.*` functions.

```typescript
// ❌ Bad - scheduling public function
crons.daily(
  "send daily reports",
  { hourUTC: 9, minuteUTC: 0 },
  api.reports.sendDailyReport, // Public function - security risk!
  { reportType: "daily" }
);

// ✅ Good - scheduling internal function
crons.daily(
  "send daily reports", 
  { hourUTC: 9, minuteUTC: 0 },
  internal.reports.sendDailyReport,
  { reportType: "daily" }
);
```

## AgenitiX-Specific Patterns

### 1. Flow Management Functions
```typescript
// flows.ts - Flow CRUD operations
export const createFlow = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    nodes: v.array(v.any()),
    edges: v.array(v.any()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.auth.getUserIdentity();
    if (!user) throw new Error("Unauthorized");
    
    return await ctx.db.insert("flows", {
      ...args,
      userId: user.subject,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  }
});

export const getUserFlows = query({
  args: {},
  handler: async (ctx) => {
    const user = await ctx.auth.getUserIdentity();
    if (!user) return [];
    
    return await ctx.db
      .query("flows")
      .withIndex("by_userId", q => q.eq("userId", user.subject))
      .order("desc")
      .collect();
  }
});
```

### 2. Email System Functions
```typescript
// emails.ts - Email operations following our table naming convention
export const logEmailSent = mutation({
  args: {
    templateId: v.optional(v.id("email_templates")),
    recipient: v.string(),
    subject: v.string(),
    body: v.string(),
    status: v.union(v.literal("sent"), v.literal("failed"), v.literal("pending")),
  },
  handler: async (ctx, args) => {
    const user = await ctx.auth.getUserIdentity();
    if (!user) throw new Error("Unauthorized");
    
    return await ctx.db.insert("email_logs", {
      ...args,
      userId: user.subject,
      sentAt: Date.now(),
    });
  }
});

export const getEmailAnalytics = query({
  args: {
    startDate: v.number(),
    endDate: v.number(),
  },
  handler: async (ctx, { startDate, endDate }) => {
    const user = await ctx.auth.getUserIdentity();
    if (!user) throw new Error("Unauthorized");
    
    const emails = await ctx.db
      .query("email_logs")
      .withIndex("by_userId_sentAt", q => 
        q.eq("userId", user.subject)
         .gte("sentAt", startDate)
         .lte("sentAt", endDate)
      )
      .collect();
    
    return {
      total: emails.length,
      sent: emails.filter(e => e.status === "sent").length,
      failed: emails.filter(e => e.status === "failed").length,
      pending: emails.filter(e => e.status === "pending").length,
    };
  }
});
```

### 3. Node Registry Functions
```typescript
// nodeRegistry.ts - Node type management
export const registerNodeType = mutation({
  args: {
    nodeType: v.string(),
    category: v.union(
      v.literal("create"),
      v.literal("view"), 
      v.literal("trigger"),
      v.literal("test"),
      v.literal("cycle")
    ),
    spec: v.any(),
  },
  handler: async (ctx, args) => {
    // Only admin users can register node types
    const user = await ctx.auth.getUserIdentity();
    if (!user) throw new Error("Unauthorized");
    
    const isAdmin = await ctx.db
      .query("auth_users")
      .withIndex("by_subject", q => q.eq("subject", user.subject))
      .filter(q => q.eq(q.field("role"), "admin"))
      .first();
    
    if (!isAdmin) throw new Error("Admin access required");
    
    return await ctx.db.insert("node_types", {
      ...args,
      registeredBy: user.subject,
      registeredAt: Date.now(),
    });
  }
});
```

## Code Organization Patterns

### 1. Use Helper Functions for Shared Logic
Most business logic should be in helper functions, with Convex functions as thin wrappers.

```typescript
// model/flows.ts - Business logic helpers
import { QueryCtx, MutationCtx } from "../_generated/server";

export async function getCurrentUser(ctx: QueryCtx) {
  const userIdentity = await ctx.auth.getUserIdentity();
  if (!userIdentity) {
    throw new Error("Unauthorized");
  }
  
  const user = await ctx.db
    .query("auth_users")
    .withIndex("by_subject", q => q.eq("subject", userIdentity.subject))
    .unique();
    
  if (!user) {
    throw new Error("User not found");
  }
  
  return user;
}

export async function ensureFlowAccess(
  ctx: QueryCtx,
  { flowId }: { flowId: Id<"flows"> }
) {
  const user = await getCurrentUser(ctx);
  const flow = await ctx.db.get(flowId);
  
  if (!flow || flow.userId !== user.subject) {
    throw new Error("Flow not found or access denied");
  }
  
  return { user, flow };
}

// flows.ts - Thin API wrappers
import * as FlowModel from "./model/flows";

export const updateFlow = mutation({
  args: {
    id: v.id("flows"),
    update: v.object({
      name: v.optional(v.string()),
      description: v.optional(v.string()),
    }),
  },
  handler: async (ctx, { id, update }) => {
    const { flow } = await FlowModel.ensureFlowAccess(ctx, { flowId: id });
    
    return await ctx.db.patch(id, {
      ...update,
      updatedAt: Date.now(),
    });
  }
});
```

### 2. Minimize `ctx.runQuery` and `ctx.runMutation` Usage
Use plain TypeScript functions instead of `ctx.run*` calls when possible.

```typescript
// ❌ Bad - unnecessary ctx.runQuery calls
export const getFlowWithAnalytics = query({
  args: { flowId: v.id("flows") },
  handler: async (ctx, { flowId }) => {
    const flow = await ctx.runQuery(api.flows.getFlow, { flowId });
    const analytics = await ctx.runQuery(api.analytics.getFlowAnalytics, { flowId });
    return { flow, analytics };
  }
});

// ✅ Good - single query with helper functions
export const getFlowWithAnalytics = query({
  args: { flowId: v.id("flows") },
  handler: async (ctx, { flowId }) => {
    const { flow } = await FlowModel.ensureFlowAccess(ctx, { flowId });
    const analytics = await AnalyticsModel.getFlowAnalytics(ctx, { flowId });
    return { flow, analytics };
  }
});
```

## Performance Optimization

### 1. Check for Redundant Indexes
Remove indexes that are prefixes of other indexes.

```typescript
// ❌ Bad - redundant indexes
// schema.ts
flows: defineTable({
  userId: v.string(),
  name: v.string(),
  category: v.string(),
})
.index("by_userId", ["userId"])
.index("by_userId_category", ["userId", "category"]), // by_userId is redundant

// ✅ Good - only keep the more specific index
flows: defineTable({
  userId: v.string(),
  name: v.string(), 
  category: v.string(),
})
.index("by_userId_category", ["userId", "category"]), // Can query by userId alone too
```

### 2. Avoid Sequential `ctx.run*` Calls in Actions
Combine multiple operations into single transactions when possible.

```typescript
// ❌ Bad - multiple sequential calls
export const processFlowExecution = action({
  args: { flowId: v.id("flows") },
  handler: async (ctx, { flowId }) => {
    const flow = await ctx.runQuery(api.flows.getFlow, { flowId });
    const nodes = await ctx.runQuery(api.flows.getFlowNodes, { flowId });
    await ctx.runMutation(api.flows.updateExecutionStatus, { 
      flowId, 
      status: "running" 
    });
  }
});

// ✅ Good - single query/mutation
export const processFlowExecution = action({
  args: { flowId: v.id("flows") },
  handler: async (ctx, { flowId }) => {
    const flowData = await ctx.runQuery(internal.flows.getFlowWithNodes, { flowId });
    await ctx.runMutation(internal.flows.startExecution, { flowId });
    
    // Process flow execution logic here
  }
});
```

## Error Handling & Logging

### 1. Consistent Error Messages
Use consistent error handling patterns across all functions.

```typescript
// Helper for common errors
export class ConvexError extends Error {
  constructor(
    message: string,
    public code: "UNAUTHORIZED" | "NOT_FOUND" | "VALIDATION_ERROR" | "INTERNAL_ERROR"
  ) {
    super(message);
    this.name = "ConvexError";
  }
}

// Usage in functions
export const getFlow = query({
  args: { id: v.id("flows") },
  handler: async (ctx, { id }) => {
    const user = await ctx.auth.getUserIdentity();
    if (!user) {
      throw new ConvexError("User must be authenticated", "UNAUTHORIZED");
    }
    
    const flow = await ctx.db.get(id);
    if (!flow) {
      throw new ConvexError("Flow not found", "NOT_FOUND");
    }
    
    if (flow.userId !== user.subject) {
      throw new ConvexError("Access denied", "UNAUTHORIZED");
    }
    
    return flow;
  }
});
```

### 2. Sentry Integration for Error Tracking
```typescript
import * as Sentry from "@sentry/node";

export const processEmailQueue = action({
  args: { batchSize: v.optional(v.number()) },
  handler: async (ctx, { batchSize = 10 }) => {
    return Sentry.startSpan(
      {
        op: "convex.action",
        name: "Process Email Queue",
      },
      async (span) => {
        try {
          span.setAttribute("batchSize", batchSize);
          
          const emails = await ctx.runQuery(internal.emails.getPendingEmails, { 
            limit: batchSize 
          });
          
          span.setAttribute("emailCount", emails.length);
          
          for (const email of emails) {
            await processEmail(ctx, email);
          }
          
          return { processed: emails.length };
        } catch (error) {
          Sentry.captureException(error);
          throw error;
        }
      }
    );
  }
});
```

## Database Schema Best Practices

### 1. Follow AgenitiX Table Naming Convention
Use `snake_case` with domain prefixes as defined in our tech guidelines.

```typescript
// schema.ts - Following our naming convention
export default defineSchema({
  // Authentication domain
  auth_users: defineTable({
    subject: v.string(), // From auth provider
    email: v.string(),
    name: v.optional(v.string()),
    role: v.union(v.literal("user"), v.literal("admin")),
    createdAt: v.number(),
  }).index("by_subject", ["subject"]),

  // Email domain  
  email_templates: defineTable({
    userId: v.string(),
    name: v.string(),
    subject: v.string(),
    body: v.string(),
    variables: v.array(v.string()),
    createdAt: v.number(),
  }).index("by_userId", ["userId"]),

  email_logs: defineTable({
    userId: v.string(),
    templateId: v.optional(v.id("email_templates")),
    recipient: v.string(),
    subject: v.string(),
    status: v.union(v.literal("sent"), v.literal("failed"), v.literal("pending")),
    sentAt: v.number(),
    error: v.optional(v.string()),
  })
  .index("by_userId", ["userId"])
  .index("by_userId_sentAt", ["userId", "sentAt"])
  .index("by_status", ["status"]),

  // Flow domain
  flows: defineTable({
    userId: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
    nodes: v.array(v.any()),
    edges: v.array(v.any()),
    status: v.union(v.literal("draft"), v.literal("active"), v.literal("archived")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
  .index("by_userId", ["userId"])
  .index("by_userId_status", ["userId", "status"]),

  // Workflow execution domain
  workflow_runs: defineTable({
    flowId: v.id("flows"),
    userId: v.string(),
    status: v.union(v.literal("running"), v.literal("completed"), v.literal("failed")),
    startedAt: v.number(),
    completedAt: v.optional(v.number()),
    error: v.optional(v.string()),
    results: v.optional(v.any()),
  })
  .index("by_flowId", ["flowId"])
  .index("by_userId", ["userId"])
  .index("by_status", ["status"]),
});
```

### 2. Use Appropriate Index Strategies
Design indexes based on your query patterns.

```typescript
// For time-based queries (recent emails, flow runs)
.index("by_userId_createdAt", ["userId", "createdAt"])

// For status filtering (active flows, pending emails)  
.index("by_userId_status", ["userId", "status"])

// For analytics queries (date ranges)
.index("by_userId_sentAt", ["userId", "sentAt"])
```

## Testing Convex Functions

### 1. Test Helper Functions Separately
```typescript
// model/flows.test.ts
import { test, expect } from "vitest";
import { ConvexTestingHelper } from "convex/testing";
import * as FlowModel from "./flows";

test("getCurrentUser returns user for valid auth", async () => {
  const t = new ConvexTestingHelper();
  
  // Mock authenticated user
  t.withIdentity({ subject: "user123", email: "test@example.com" });
  
  const user = await FlowModel.getCurrentUser(t.ctx);
  expect(user.subject).toBe("user123");
});
```

### 2. Integration Tests for Public Functions
```typescript
// flows.test.ts
import { test, expect } from "vitest";
import { ConvexTestingHelper } from "convex/testing";
import { api } from "./_generated/api";

test("createFlow creates flow for authenticated user", async () => {
  const t = new ConvexTestingHelper();
  t.withIdentity({ subject: "user123" });
  
  const flowId = await t.mutation(api.flows.createFlow, {
    name: "Test Flow",
    description: "A test flow",
    nodes: [],
    edges: [],
  });
  
  expect(flowId).toBeDefined();
  
  const flow = await t.query(api.flows.getFlow, { id: flowId });
  expect(flow.name).toBe("Test Flow");
  expect(flow.userId).toBe("user123");
});
```

## Deployment & Environment Management

### 1. Environment-Specific Configuration
```typescript
// config.ts - Environment-aware configuration
export const config = {
  isDevelopment: process.env.NODE_ENV === "development",
  isProduction: process.env.NODE_ENV === "production",
  
  email: {
    maxBatchSize: process.env.NODE_ENV === "production" ? 100 : 10,
    retryAttempts: process.env.NODE_ENV === "production" ? 3 : 1,
  },
  
  analytics: {
    enableTracking: process.env.NODE_ENV === "production",
  },
};
```

### 2. Migration Patterns
```typescript
// migrations/001_add_email_templates.ts
export const addEmailTemplates = internalMutation({
  handler: async (ctx) => {
    // Check if migration already ran
    const migrationRecord = await ctx.db
      .query("migrations")
      .filter(q => q.eq(q.field("name"), "001_add_email_templates"))
      .first();
      
    if (migrationRecord) {
      console.log("Migration already applied");
      return;
    }
    
    // Run migration logic
    const users = await ctx.db.query("auth_users").collect();
    
    for (const user of users) {
      await ctx.db.insert("email_templates", {
        userId: user.subject,
        name: "Welcome Email",
        subject: "Welcome to AgenitiX!",
        body: "Welcome to our platform!",
        variables: ["name"],
        createdAt: Date.now(),
      });
    }
    
    // Record migration as completed
    await ctx.db.insert("migrations", {
      name: "001_add_email_templates",
      appliedAt: Date.now(),
    });
  }
});
```

## Summary Checklist

Before deploying Convex functions:

- [ ] **All promises awaited** - No floating promises
- [ ] **Argument validation** - All public functions have validators
- [ ] **Access control** - All public functions check authorization
- [ ] **Efficient queries** - Use indexes instead of `.filter()`
- [ ] **Small result sets** - Use pagination for large datasets
- [ ] **Internal functions** - Only schedule/run internal functions
- [ ] **Helper functions** - Business logic in plain TypeScript
- [ ] **Error handling** - Consistent error patterns with Sentry
- [ ] **Table naming** - Follow `domain_resource` convention
- [ ] **Index optimization** - Remove redundant indexes
- [ ] **Testing** - Unit tests for helpers, integration tests for APIs
- [ ] **Environment config** - Environment-aware settings

## Resources

- [Official Convex Best Practices](https://docs.convex.dev/understanding/best-practices/)
- [Convex TypeScript Guide](https://docs.convex.dev/understanding/best-practices/typescript)
- [AgenitiX Tech Stack Documentation](.kiro/steering/tech.md)
- [AgenitiX Project Structure](.kiro/steering/structure.md)