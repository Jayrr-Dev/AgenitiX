# Email Sender Design Document

## Overview

The Email Sender system provides comprehensive email composition and delivery capabilities for AgenitiX workflows. It builds upon the existing emailAccount infrastructure to send emails through various providers (Gmail, Outlook, SMTP) with support for templates, attachments, batch sending, and delivery tracking.

## Architecture

### High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   emailSender   │───▶│  Email Service  │───▶│  Email Provider │
│      Node       │    │    Manager      │    │   (Gmail/etc)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Message       │    │   Convex        │    │   External      │
│   Composer      │    │   Database      │    │   Email APIs    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Component Breakdown

1. **emailSender Node**: React component with UI for message composition and sending
2. **Message Composer**: Handles email composition, templates, and dynamic content
3. **Delivery Manager**: Manages message sending, retries, and status tracking
4. **Attachment Handler**: Processes file attachments and encoding
5. **Template Engine**: Processes email templates and variable substitution
6. **Batch Processor**: Handles multiple recipient sending with rate limiting

## Components and Interfaces

### 1. EmailSender Node Component

```typescript
interface EmailSenderData {
  // Account Configuration
  accountId: string;
  provider: EmailProviderType;
  
  // Message Composition
  recipients: {
    to: string[];
    cc?: string[];
    bcc?: string[];
  };
  subject: string;
  content: {
    text: string;
    html?: string;
    useTemplate: boolean;
    templateId?: string;
    variables?: Record<string, any>;
  };
  
  // Attachments
  attachments: EmailAttachment[];
  maxAttachmentSize: number;
  
  // Sending Options
  sendMode: 'immediate' | 'batch' | 'scheduled';
  batchSize: number;
  delayBetweenSends: number; // milliseconds
  scheduledTime?: Date;
  
  // Delivery Tracking
  trackDelivery: boolean;
  trackReads: boolean;
  trackClicks: boolean;
  
  // Error Handling
  retryAttempts: number;
  retryDelay: number;
  continueOnError: boolean;
  
  // State
  isEnabled: boolean;
  isActive: boolean;
  isExpanded: boolean;
  sendingStatus: 'idle' | 'composing' | 'sending' | 'sent' | 'error';
  
  // Results
  sentCount: number;
  failedCount: number;
  lastSent: number;
  deliveryResults: DeliveryResult[];
  
  // Outputs
  successOutput: boolean;
  messageIdOutput?: string;
  errorOutput?: string;
}
```

### 2. Message Composer

```typescript
interface MessageComposer {
  // Composition
  composeMessage(data: EmailSenderData): Promise<ComposedMessage>;
  validateRecipients(recipients: string[]): ValidationResult;
  processTemplate(templateId: string, variables: Record<string, any>): Promise<string>;
  
  // Content Processing
  processHtmlContent(html: string): string;
  processTextContent(text: string): string;
  replaceVariables(content: string, variables: Record<string, any>): string;
  
  // Validation
  validateMessage(message: ComposedMessage): ValidationResult;
  validateAttachments(attachments: EmailAttachment[]): ValidationResult;
}
```

### 3. Delivery Manager

```typescript
interface DeliveryManager {
  // Single Message
  sendMessage(message: ComposedMessage, account: EmailAccount): Promise<DeliveryResult>;
  
  // Batch Sending
  sendBatch(messages: ComposedMessage[], options: BatchOptions): Promise<BatchResult>;
  
  // Status Tracking
  trackDelivery(messageId: string): Promise<DeliveryStatus>;
  getDeliveryStatus(messageId: string): Promise<DeliveryStatus>;
  
  // Retry Logic
  retryFailedMessage(messageId: string): Promise<DeliveryResult>;
  scheduleRetry(messageId: string, delay: number): void;
}
```

### 4. Template Engine

```typescript
interface TemplateEngine {
  // Template Processing
  loadTemplate(templateId: string): Promise<EmailTemplate>;
  processTemplate(template: EmailTemplate, variables: Record<string, any>): ProcessedTemplate;
  
  // Variable Handling
  extractVariables(content: string): string[];
  validateVariables(variables: Record<string, any>, required: string[]): ValidationResult;
  
  // Preview
  generatePreview(template: EmailTemplate, variables: Record<string, any>): string;
}
```

## Data Models

### ComposedMessage

```typescript
interface ComposedMessage {
  id: string;
  accountId: string;
  
  // Recipients
  to: EmailAddress[];
  cc?: EmailAddress[];
  bcc?: EmailAddress[];
  
  // Content
  subject: string;
  textContent: string;
  htmlContent?: string;
  
  // Attachments
  attachments: ProcessedAttachment[];
  
  // Metadata
  priority: 'low' | 'normal' | 'high';
  headers?: Record<string, string>;
  
  // Tracking
  trackingEnabled: boolean;
  trackingId?: string;
  
  // Scheduling
  sendAt?: Date;
  timezone?: string;
}
```

### DeliveryResult

```typescript
interface DeliveryResult {
  messageId: string;
  status: 'sent' | 'failed' | 'pending' | 'bounced';
  
  // Timestamps
  sentAt?: Date;
  deliveredAt?: Date;
  
  // Provider Response
  providerMessageId?: string;
  providerResponse?: any;
  
  // Error Information
  error?: {
    code: string;
    message: string;
    retryable: boolean;
  };
  
  // Tracking Data
  tracking?: {
    opened?: Date;
    clicked?: Date;
    bounced?: Date;
    bounceReason?: string;
  };
}
```

### EmailTemplate

```typescript
interface EmailTemplate {
  id: string;
  name: string;
  description?: string;
  
  // Content
  subject: string;
  textContent: string;
  htmlContent?: string;
  
  // Variables
  variables: TemplateVariable[];
  requiredVariables: string[];
  
  // Metadata
  category?: string;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

interface TemplateVariable {
  name: string;
  type: 'string' | 'number' | 'date' | 'boolean';
  description?: string;
  defaultValue?: any;
  required: boolean;
}
```

### ProcessedAttachment

```typescript
interface ProcessedAttachment {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  
  // Content
  content: Buffer | string;
  encoding: 'base64' | 'binary';
  
  // Metadata
  contentId?: string;
  isInline: boolean;
  
  // Validation
  isValid: boolean;
  validationErrors?: string[];
}
```

## Error Handling

### Error Types

```typescript
enum EmailSenderErrorType {
  ACCOUNT_NOT_FOUND = 'account_not_found',
  AUTHENTICATION_FAILED = 'authentication_failed',
  INVALID_RECIPIENTS = 'invalid_recipients',
  MESSAGE_TOO_LARGE = 'message_too_large',
  ATTACHMENT_ERROR = 'attachment_error',
  TEMPLATE_ERROR = 'template_error',
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  DELIVERY_FAILED = 'delivery_failed',
  NETWORK_ERROR = 'network_error'
}

interface EmailSenderError {
  type: EmailSenderErrorType;
  message: string;
  details?: any;
  retryable: boolean;
  retryAfter?: number;
}
```

### Error Recovery Strategies

1. **Authentication Errors**: Automatic token refresh, fallback to re-auth
2. **Rate Limiting**: Exponential backoff with jitter
3. **Network Errors**: Retry with circuit breaker pattern
4. **Invalid Recipients**: Skip invalid, continue with valid ones
5. **Attachment Errors**: Offer to send without attachments

## Testing Strategy

### Unit Tests

1. **Message Composition**: Test template processing and variable substitution
2. **Recipient Validation**: Test email format validation and error handling
3. **Attachment Processing**: Test file encoding and size validation
4. **Delivery Logic**: Mock provider responses and test retry logic
5. **Error Handling**: Test all error scenarios and recovery

### Integration Tests

1. **End-to-End Sending**: Test complete message sending flow
2. **Provider Integration**: Test with real email accounts (sandbox)
3. **Template Integration**: Test with various template formats
4. **Batch Sending**: Test with multiple recipients and rate limiting
5. **Error Scenarios**: Test network failures and provider errors

### Test Data

```typescript
const mockEmailMessage: ComposedMessage = {
  id: 'msg_123',
  accountId: 'acc_456',
  to: [{ email: 'recipient@example.com', name: 'Test Recipient' }],
  subject: 'Test Email Subject',
  textContent: 'This is a test email content',
  attachments: [],
  trackingEnabled: true,
  priority: 'normal'
};
```

## Performance Considerations

### Optimization Strategies

1. **Batch Processing**: Group multiple sends to same provider
2. **Connection Pooling**: Reuse connections for multiple sends
3. **Attachment Streaming**: Stream large attachments to avoid memory issues
4. **Template Caching**: Cache processed templates for reuse
5. **Rate Limiting**: Respect provider limits to avoid throttling

### Monitoring Metrics

1. **Send Rate**: Messages per second/minute
2. **Success Rate**: Percentage of successful deliveries
3. **Error Rate**: Percentage of failed sends
4. **Latency**: Time from send request to delivery
5. **Resource Usage**: Memory and CPU consumption

## Security Considerations

### Data Protection

1. **Credential Security**: Use existing emailAccount encryption
2. **Message Content**: Encrypt sensitive message content
3. **Attachment Scanning**: Scan attachments for malware
4. **Access Control**: Respect user permissions and account isolation

### Privacy Compliance

1. **Data Retention**: Configurable message retention policies
2. **User Consent**: Clear disclosure of tracking capabilities
3. **Data Minimization**: Only store necessary delivery data
4. **Audit Logging**: Track email sending activities

## Implementation Phases

### Phase 1: Core Infrastructure (Week 1)
- [ ] Basic emailSender node structure
- [ ] Message composition interface
- [ ] Account integration
- [ ] Simple text email sending

### Phase 2: Advanced Features (Week 2)
- [ ] HTML email support
- [ ] Template integration
- [ ] Attachment handling
- [ ] Delivery tracking

### Phase 3: Batch and Scheduling (Week 3)
- [ ] Batch sending capabilities
- [ ] Rate limiting and retry logic
- [ ] Scheduled sending
- [ ] Performance optimizations

### Phase 4: Polish and Testing (Week 4)
- [ ] Error handling improvements
- [ ] Comprehensive testing
- [ ] Documentation
- [ ] Production readiness

## Dependencies

### External Dependencies
- Gmail API SDK
- Microsoft Graph SDK
- SMTP client library
- Email validation libraries
- Template processing libraries

### Internal Dependencies
- emailAccount node (authentication)
- Convex database (message logging)
- Node core infrastructure
- Theming and UI components

## Migration and Compatibility

### Backward Compatibility
- Maintain compatibility with existing emailAccount nodes
- Support existing workflow patterns
- Graceful degradation for unsupported features

### Future Extensibility
- Plugin architecture for new email providers
- Extensible template system
- Configurable delivery options
- Integration with future email nodes