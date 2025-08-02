---
inclusion: fileMatch
fileMatchPattern: "**/email/**/*, convex/emails.ts, features/**/email*.tsx"
---

# Email Integration Standards

## Email Architecture Overview

AgenitiX provides comprehensive email capabilities through nodes, templates, and analytics. The email system supports both sending and receiving with template variables, scheduling, and tracking.

### Email System Components

- **Email Templates**: Reusable templates with variable substitution
- **Email Sending**: Direct and scheduled email delivery
- **Email Receiving**: Webhook-based email processing
- **Email Analytics**: Delivery tracking and engagement metrics
- **Email Queue**: Reliable delivery with retry logic

## Email Template System

### Template Structure

```typescript
// convex/schema.ts - Email template schema
export const emailTemplates = defineTable({
  name: v.string(),
  subject: v.string(),
  body: v.string(),
  variables: v.array(v.string()), // Template variables like {{name}}
  userId: v.id("auth_users"),
  isActive: v.boolean(),
  createdAt: v.number(),
  updatedAt: v.number(),
});
```

### Template Variable Processing

```typescript
// utils/email-utils.ts
export const processTemplate = (
  template: string,
  variables: Record<string, any>
): string => {
  return template.replace(/\{\{(\w+)\}\}/g, (match, variable) => {
    return variables[variable] || "";
  });
};
```

## Email Sending Nodes

### Create Email Node

```typescript
// features/business-logic-modern/node-domain/create/createEmail/createEmail.spec.ts
export const createEmailSpec: NodeSpec = {
  type: "createEmail",
  category: "create",
  domain: "create",

  name: "Create Email",
  description:
    "Creates an email with template support and variable substitution",
  icon: "Mail",

  inputs: [
    {
      name: "templateId",
      type: "string",
      required: true,
      description: "Email template ID or template content",
    },
    {
      name: "to",
      type: "string",
      required: true,
      description: "Recipient email address",
      validation: {
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        message: "Invalid email address",
      },
    },
    {
      name: "subject",
      type: "string",
      required: true,
      description: "Email subject line",
    },
    {
      name: "variables",
      type: "object",
      required: false,
      description: "Template variables for substitution",
    },
    {
      name: "scheduleFor",
      type: "string",
      required: false,
      description: "Schedule email for specific date/time (ISO string)",
    },
  ],

  output: [
    {
      name: "emailId",
      type: "string",
      description: "Generated email ID",
    },
    {
      name: "scheduledFor",
      type: "string",
      description: "Scheduled delivery time",
    },
  ],
};
```

### Send Email Node

```typescript
// features/business-logic-modern/node-domain/create/sendEmail/sendEmail.spec.ts
export const sendEmailSpec: NodeSpec = {
  type: "sendEmail",
  category: "create",
  domain: "create",

  name: "Send Email",
  description: "Sends an email immediately or adds to queue",
  icon: "Send",

  inputs: [
    {
      name: "emailId",
      type: "string",
      required: true,
      description: "Email ID to send",
    },
    {
      name: "priority",
      type: "string",
      required: false,
      description: "Email priority (high, normal, low)",
      defaultValue: "normal",
    },
  ],

  output: [
    {
      name: "sentAt",
      type: "string",
      description: "Timestamp when email was sent",
    },
    {
      name: "status",
      type: "string",
      description: "Email delivery status",
    },
  ],
};
```

## Email Receiving Nodes

### Receive Email Node

```typescript
// features/business-logic-modern/node-domain/trigger/receiveEmail/receiveEmail.spec.ts
export const receiveEmailSpec: NodeSpec = {
  type: "receiveEmail",
  category: "trigger",
  domain: "trigger",

  name: "Receive Email",
  description: "Triggers workflow when email is received",
  icon: "Mail",

  inputs: [
    {
      name: "webhookUrl",
      type: "string",
      required: true,
      description: "Webhook URL for email notifications",
    },
    {
      name: "filters",
      type: "object",
      required: false,
      description: "Email filters (from, subject, etc.)",
    },
  ],

  output: [
    {
      name: "emailData",
      type: "object",
      description: "Received email data",
    },
    {
      name: "triggeredAt",
      type: "string",
      description: "Timestamp when email was received",
    },
  ],

  isTrigger: true,
};
```

### Process Email Node

```typescript
// features/business-logic-modern/node-domain/create/processEmail/processEmail.spec.ts
export const processEmailSpec: NodeSpec = {
  type: "processEmail",
  category: "create",
  domain: "create",

  name: "Process Email",
  description: "Processes received email content",
  icon: "Settings",

  inputs: [
    {
      name: "emailData",
      type: "object",
      required: true,
      description: "Raw email data from trigger",
    },
    {
      name: "extractFields",
      type: "array",
      required: false,
      description: "Fields to extract from email",
    },
  ],

  output: [
    {
      name: "processedData",
      type: "object",
      description: "Processed email data",
    },
    {
      name: "extractedFields",
      type: "object",
      description: "Extracted field values",
    },
  ],
};
```

## Email Analytics

### Email Tracking

```typescript
// convex/emails.ts - Email tracking functions
export const trackEmailOpen = mutation({
  args: { emailId: v.id("emails"), trackingPixel: v.string() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.emailId, {
      openedAt: new Date(),
      isOpened: true,
    });
  },
});

export const trackEmailClick = mutation({
  args: { emailId: v.id("emails"), linkUrl: v.string() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.emailId, {
      clickedAt: new Date(),
      isClicked: true,
      lastClickedUrl: args.linkUrl,
    });
  },
});
```

### Email Analytics Node

```typescript
// features/business-logic-modern/node-domain/view/viewEmailAnalytics/viewEmailAnalytics.spec.ts
export const viewEmailAnalyticsSpec: NodeSpec = {
  type: "viewEmailAnalytics",
  category: "view",
  domain: "view",

  name: "Email Analytics",
  description: "Displays email performance metrics and analytics",
  icon: "BarChart",

  inputs: [
    {
      name: "emailId",
      type: "string",
      required: false,
      description: "Specific email ID to analyze",
    },
    {
      name: "dateRange",
      type: "object",
      required: false,
      description: "Date range for analytics",
    },
  ],

  output: [
    {
      name: "analytics",
      type: "object",
      description: "Email analytics data",
    },
    {
      name: "metrics",
      type: "object",
      description: "Calculated performance metrics",
    },
  ],
};
```

## Email Queue System

### Queue Management

```typescript
// convex/emails.ts - Email queue functions
export const addToEmailQueue = mutation({
  args: {
    to: v.string(),
    subject: v.string(),
    body: v.string(),
    priority: v.optional(v.string()),
    scheduledFor: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const queueId = await ctx.db.insert("email_queue", {
      to: args.to,
      subject: args.subject,
      body: args.body,
      priority: args.priority || "normal",
      scheduledFor: args.scheduledFor ? new Date(args.scheduledFor) : null,
      status: "pending",
      attempts: 0,
      maxAttempts: 3,
      createdAt: new Date(),
    });

    return { queueId };
  },
});
```

## Email Provider Integration

### Provider Configuration

```typescript
// lib/email-providers.ts
interface EmailProvider {
  name: string;
  sendEmail: (email: EmailData) => Promise<SendResult>;
  setupWebhook: (webhookUrl: string) => Promise<void>;
  validateCredentials: (credentials: any) => Promise<boolean>;
}

// Resend provider example
export const resendProvider: EmailProvider = {
  name: "resend",

  async sendEmail(email: EmailData): Promise<SendResult> {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "noreply@agenitix.com",
        to: email.to,
        subject: email.subject,
        html: email.body,
      }),
    });

    if (!response.ok) {
      throw new Error(`Email send failed: ${response.statusText}`);
    }

    const result = await response.json();
    return {
      messageId: result.id,
      status: "sent",
    };
  },
};
```

## File References

- **Email Schema**: #[[file:convex/schema.ts]]
- **Email Functions**: #[[file:convex/emails.ts]]
- **Email Templates**: #[[file:features/business-logic-modern/node-domain/create/createEmail/]]
- **Email Analytics**: #[[file:features/business-logic-modern/node-domain/view/viewEmailAnalytics/]]
- **Email Providers**: #[[file:lib/email-providers.ts]]
- **Email Utils**: #[[file:utils/email-utils.ts]]
