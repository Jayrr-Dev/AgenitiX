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

// Template with variables example
const welcomeTemplate = {
  name: "Welcome Email",
  subject: "Welcome to AgenitiX, {{name}}!",
  body: `
    <h1>Welcome to AgenitiX!</h1>
    <p>Hello {{name}},</p>
    <p>Thank you for joining AgenitiX. We're excited to help you automate your workflows.</p>
    <p>Your account details:</p>
    <ul>
      <li>Email: {{email}}</li>
      <li>Plan: {{plan}}</li>
      <li>Created: {{createdAt}}</li>
    </ul>
    <p>Best regards,<br>The AgenitiX Team</p>
  `,
  variables: ["name", "email", "plan", "createdAt"],
};
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

// Usage
const processedSubject = processTemplate(
  "Welcome to AgenitiX, {{name}}!",
  { name: "John", email: "john@example.com" }
);
// Result: "Welcome to AgenitiX, John!"
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
  description: "Creates an email with template support and variable substitution",
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
  
  outputs: [
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
  
  execute: async (inputs, context) => {
    const { templateId, to, subject, variables, scheduleFor } = inputs;
    
    // Validate email address
    if (!isValidEmail(to)) {
      throw new Error("Invalid email address");
    }
    
    // Process template
    const template = await context.convex.query("emails.getTemplate", { templateId });
    const processedSubject = processTemplate(template.subject, variables);
    const processedBody = processTemplate(template.body, variables);
    
    // Create email record
    const emailId = await context.convex.mutation("emails.createEmail", {
      to,
      subject: processedSubject,
      body: processedBody,
      variables,
      scheduledFor: scheduleFor ? new Date(scheduleFor) : null,
      userId: context.userId,
    });
    
    return {
      emailId,
      scheduledFor: scheduleFor || null,
    };
  },
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
  
  outputs: [
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
  
  execute: async (inputs, context) => {
    const { emailId, priority = "normal" } = inputs;
    
    // Send email via action
    const result = await context.convex.action("emails.sendEmail", {
      emailId,
      priority,
    });
    
    return {
      sentAt: result.sentAt,
      status: result.status,
    };
  },
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
  
  outputs: [
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
  
  // This node doesn't execute - it's a trigger
  isTrigger: true,
  
  setupWebhook: async (inputs, context) => {
    const { webhookUrl, filters } = inputs;
    
    // Register webhook with email provider
    await context.convex.mutation("emails.setupWebhook", {
      webhookUrl,
      filters,
      nodeId: context.nodeId,
    });
  },
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
  
  outputs: [
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
  
  execute: async (inputs, context) => {
    const { emailData, extractFields = [] } = inputs;
    
    // Parse email content
    const parsedEmail = parseEmailContent(emailData);
    
    // Extract specified fields
    const extracted = {};
    extractFields.forEach(field => {
      extracted[field] = parsedEmail[field] || "";
    });
    
    return {
      processedData: parsedEmail,
      extractedFields: extracted,
    };
  },
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
    
    // Log analytics event
    await ctx.db.insert("email_analytics", {
      emailId: args.emailId,
      event: "open",
      timestamp: new Date(),
      userAgent: args.userAgent,
      ipAddress: args.ipAddress,
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
    
    // Log analytics event
    await ctx.db.insert("email_analytics", {
      emailId: args.emailId,
      event: "click",
      linkUrl: args.linkUrl,
      timestamp: new Date(),
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
  
  outputs: [
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
  
  execute: async (inputs, context) => {
    const { emailId, dateRange } = inputs;
    
    // Get analytics data
    const analytics = await context.convex.query("emails.getAnalytics", {
      emailId,
      dateRange,
    });
    
    // Calculate metrics
    const metrics = calculateEmailMetrics(analytics);
    
    return {
      analytics,
      metrics,
    };
  },
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

export const processEmailQueue = action({
  handler: async (ctx) => {
    const now = new Date();
    
    // Get pending emails
    const pendingEmails = await ctx.db
      .query("email_queue")
      .withIndex("by_status_and_scheduled", (q) =>
        q.eq("status", "pending")
          .lte("scheduledFor", now)
      )
      .take(10); // Process 10 at a time
    
    for (const email of pendingEmails) {
      try {
        // Send email
        await sendEmailViaProvider(email);
        
        // Mark as sent
        await ctx.db.patch(email._id, {
          status: "sent",
          sentAt: new Date(),
        });
      } catch (error) {
        // Increment attempts
        const newAttempts = email.attempts + 1;
        
        if (newAttempts >= email.maxAttempts) {
          // Mark as failed
          await ctx.db.patch(email._id, {
            status: "failed",
            error: error.message,
          });
        } else {
          // Retry later
          await ctx.db.patch(email._id, {
            attempts: newAttempts,
            scheduledFor: new Date(now.getTime() + 5 * 60 * 1000), // 5 minutes
          });
        }
      }
    }
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

// Resend provider
export const resendProvider: EmailProvider = {
  name: "resend",
  
  async sendEmail(email: EmailData): Promise<SendResult> {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
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
  
  async setupWebhook(webhookUrl: string): Promise<void> {
    // Setup webhook with Resend
    const response = await fetch("https://api.resend.com/webhooks", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: webhookUrl,
        events: ["email.delivered", "email.opened", "email.clicked"],
      }),
    });
    
    if (!response.ok) {
      throw new Error("Failed to setup webhook");
    }
  },
  
  async validateCredentials(credentials: any): Promise<boolean> {
    try {
      const response = await fetch("https://api.resend.com/domains", {
        headers: {
          "Authorization": `Bearer ${credentials.apiKey}`,
        },
      });
      return response.ok;
    } catch {
      return false;
    }
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