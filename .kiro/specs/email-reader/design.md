# Email Reader Design Document

## Overview

The Email Reader system provides comprehensive inbox parsing and message retrieval capabilities for AgenitiX workflows. It builds upon the existing emailAccount infrastructure to read, filter, and process emails from various providers (Gmail, Outlook, IMAP/SMTP) in real-time or batch mode.

## Architecture

### High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   emailReader   │───▶│  Email Service  │───▶│  Email Provider │
│      Node       │    │    Manager      │    │   (Gmail/etc)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Message       │    │   Convex        │    │   External      │
│   Processor     │    │   Database      │    │   Email APIs    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Component Breakdown

1. **emailReader Node**: React component with UI for configuration and status display
2. **Email Service Manager**: Core service for managing email operations
3. **Message Processor**: Handles message parsing, filtering, and transformation
4. **Provider Adapters**: Specific implementations for each email provider
5. **Cache Manager**: Handles message caching and state management
6. **Real-time Monitor**: Manages periodic inbox checking and notifications

## Components and Interfaces

### 1. EmailReader Node Component

```typescript
interface EmailReaderData {
  // Account Configuration
  accountId: string;
  provider: EmailProviderType;

  // Filtering Options
  filters: {
    sender?: string[];
    subject?: string;
    dateRange?: {
      from?: Date;
      to?: Date;
      relative?: "last24h" | "lastWeek" | "lastMonth";
    };
    readStatus?: "all" | "unread" | "read";
    hasAttachments?: boolean;
    contentSearch?: string;
  };

  // Processing Options
  batchSize: number;
  maxMessages: number;
  includeAttachments: boolean;
  markAsRead: boolean;

  // Real-time Monitoring
  enableRealTime: boolean;
  checkInterval: number; // minutes

  // Output Configuration
  outputFormat: "full" | "summary" | "custom";
  customFields?: string[];

  // State
  isActive: boolean;
  isEnabled: boolean;
  isExpanded: boolean;
  lastSync: number;
  processedCount: number;

  // output
  messages: EmailMessage[];
  status: "idle" | "reading" | "processing" | "error";
  error?: string;
}
```

### 2. Email Service Manager

```typescript
interface EmailServiceManager {
  // Core Operations
  connectToInbox(accountId: string): Promise<InboxConnection>;
  readMessages(
    connection: InboxConnection,
    filters: MessageFilters
  ): Promise<EmailMessage[]>;
  monitorInbox(
    connection: InboxConnection,
    callback: (messages: EmailMessage[]) => void
  ): void;

  // Message Operations
  markAsRead(messageId: string): Promise<void>;
  downloadAttachment(messageId: string, attachmentId: string): Promise<Buffer>;

  // State Management
  getProcessedMessages(accountId: string): Promise<string[]>;
  markAsProcessed(accountId: string, messageIds: string[]): Promise<void>;

  // Cache Management
  getCachedMessages(
    accountId: string,
    filters: MessageFilters
  ): Promise<EmailMessage[]>;
  invalidateCache(accountId: string): Promise<void>;
}
```

### 3. Message Processor

```typescript
interface MessageProcessor {
  // Filtering
  applyFilters(
    messages: EmailMessage[],
    filters: MessageFilters
  ): EmailMessage[];

  // Content Extraction
  extractContent(message: RawEmailMessage): EmailMessage;
  parseAttachments(message: RawEmailMessage): EmailAttachment[];

  // Data Transformation
  transformToOutput(messages: EmailMessage[], format: OutputFormat): any;

  // Batch Processing
  processBatch(
    messages: EmailMessage[],
    batchSize: number
  ): Promise<EmailMessage[]>;
}
```

### 4. Provider Adapters

```typescript
interface EmailProviderAdapter {
  // Connection Management
  connect(credentials: EmailCredentials): Promise<ProviderConnection>;
  disconnect(connection: ProviderConnection): Promise<void>;
  testConnection(connection: ProviderConnection): Promise<boolean>;

  // Message Retrieval
  getMessages(
    connection: ProviderConnection,
    options: RetrievalOptions
  ): Promise<RawEmailMessage[]>;
  getMessage(
    connection: ProviderConnection,
    messageId: string
  ): Promise<RawEmailMessage>;

  // Real-time Support
  supportsRealTime(): boolean;
  setupWebhook?(
    connection: ProviderConnection,
    callback: WebhookCallback
  ): Promise<void>;

  // Rate Limiting
  getRateLimit(): RateLimitInfo;
  handleRateLimit(error: RateLimitError): Promise<void>;
}
```

## Data Models

### EmailMessage

```typescript
interface EmailMessage {
  id: string;
  threadId?: string;
  provider: EmailProviderType;

  // Basic Info
  from: EmailAddress;
  to: EmailAddress[];
  cc?: EmailAddress[];
  bcc?: EmailAddress[];
  subject: string;

  // Content
  textContent: string;
  htmlContent?: string;
  snippet: string;

  // Metadata
  date: Date;
  isRead: boolean;
  isImportant?: boolean;
  labels?: string[];

  // Attachments
  attachments: EmailAttachment[];
  hasAttachments: boolean;

  // Processing State
  isProcessed: boolean;
  processedAt?: Date;
  processingErrors?: string[];
}
```

### EmailAttachment

```typescript
interface EmailAttachment {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  isInline: boolean;
  contentId?: string;

  // Download Info
  downloadUrl?: string;
  isDownloaded: boolean;
  localPath?: string;
}
```

### MessageFilters

```typescript
interface MessageFilters {
  sender?: {
    addresses?: string[];
    domains?: string[];
    exclude?: string[];
  };

  subject?: {
    contains?: string;
    regex?: string;
    exclude?: string;
  };

  dateRange?: {
    from?: Date;
    to?: Date;
    relative?: RelativeDateRange;
  };

  content?: {
    search?: string;
    regex?: string;
    attachmentTypes?: string[];
  };

  status?: {
    read?: boolean;
    important?: boolean;
    hasAttachments?: boolean;
  };

  labels?: {
    include?: string[];
    exclude?: string[];
  };
}
```

## Error Handling

### Error Types

```typescript
enum EmailReaderErrorType {
  CONNECTION_FAILED = "connection_failed",
  AUTHENTICATION_EXPIRED = "auth_expired",
  RATE_LIMIT_EXCEEDED = "rate_limit_exceeded",
  INSUFFICIENT_PERMISSIONS = "insufficient_permissions",
  MESSAGE_NOT_FOUND = "message_not_found",
  PARSING_ERROR = "parsing_error",
  NETWORK_ERROR = "network_error",
  QUOTA_EXCEEDED = "quota_exceeded",
}

interface EmailReaderError {
  type: EmailReaderErrorType;
  message: string;
  details?: any;
  retryable: boolean;
  retryAfter?: number;
}
```

### Error Recovery Strategies

1. **Connection Errors**: Exponential backoff with max retry attempts
2. **Authentication Errors**: Automatic token refresh, fallback to re-auth
3. **Rate Limiting**: Respect provider limits, implement queuing
4. **Parsing Errors**: Log and skip malformed messages, continue processing
5. **Network Errors**: Retry with circuit breaker pattern

## Testing Strategy

### Unit Tests

1. **Message Filtering**: Test all filter combinations and edge cases
2. **Content Extraction**: Verify parsing of various email formats
3. **Provider Adapters**: Mock API responses and test error handling
4. **Cache Management**: Test cache invalidation and consistency
5. **Batch Processing**: Verify pagination and memory management

### Integration Tests

1. **End-to-End Flow**: Test complete message retrieval and processing
2. **Provider Integration**: Test with real email accounts (sandbox)
3. **Real-time Monitoring**: Test webhook and polling mechanisms
4. **Error Scenarios**: Test network failures and API errors
5. **Performance**: Test with large inboxes and high message volumes

### Test Data

```typescript
const mockEmailMessage: EmailMessage = {
  id: "msg_123",
  provider: "gmail",
  from: { email: "sender@example.com", name: "Test Sender" },
  to: [{ email: "recipient@example.com", name: "Test Recipient" }],
  subject: "Test Email Subject",
  textContent: "This is a test email content",
  date: new Date("2024-01-15T10:30:00Z"),
  isRead: false,
  attachments: [],
  hasAttachments: false,
  isProcessed: false,
};
```

## Performance Considerations

### Optimization Strategies

1. **Lazy Loading**: Load message content only when needed
2. **Incremental Sync**: Only fetch new/changed messages
3. **Efficient Caching**: Cache frequently accessed messages
4. **Batch Operations**: Group API calls to reduce overhead
5. **Memory Management**: Implement proper cleanup and garbage collection

### Monitoring Metrics

1. **Message Processing Rate**: Messages per second/minute
2. **API Call Efficiency**: Calls per message retrieved
3. **Cache Hit Rate**: Percentage of cache hits vs misses
4. **Error Rate**: Percentage of failed operations
5. **Memory Usage**: Peak and average memory consumption

## Security Considerations

### Data Protection

1. **Credential Security**: Use existing emailAccount encryption
2. **Message Content**: Encrypt sensitive message content in cache
3. **Attachment Handling**: Secure temporary file storage
4. **Access Control**: Respect user permissions and account isolation

### Privacy Compliance

1. **Data Retention**: Configurable message retention policies
2. **User Consent**: Clear disclosure of email access permissions
3. **Data Minimization**: Only store necessary message data
4. **Audit Logging**: Track email access and processing activities

## Implementation Phases

### Phase 1: Core Infrastructure (Week 1)

- [ ] Basic emailReader node structure
- [ ] Provider adapter interfaces
- [ ] Message data models
- [ ] Basic Gmail integration

### Phase 2: Message Processing (Week 2)

- [ ] Message filtering system
- [ ] Content extraction and parsing
- [ ] Batch processing implementation
- [ ] Cache management

### Phase 3: Real-time Features (Week 3)

- [ ] Real-time monitoring system
- [ ] Webhook support for supported providers
- [ ] State management and persistence
- [ ] Error handling and recovery

### Phase 4: Advanced Features (Week 4)

- [ ] Outlook and IMAP support
- [ ] Attachment handling
- [ ] Performance optimizations
- [ ] Comprehensive testing

## Dependencies

### External Dependencies

- Gmail API SDK
- Microsoft Graph SDK
- IMAP client library
- Email parsing libraries

### Internal Dependencies

- emailAccount node (authentication)
- Convex database (state storage)
- Node core infrastructure
- Theming and UI components

## Migration and Compatibility

### Backward Compatibility

- Maintain compatibility with existing emailAccount nodes
- Support existing email workflow patterns
- Graceful degradation for unsupported features

### Future Extensibility

- Plugin architecture for new email providers
- Extensible filtering system
- Configurable output formats
- Integration with future email nodes (sender, replier, etc.)
