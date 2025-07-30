# Email Creator Node - Technical Design

## Overview

The emailCreator node is a comprehensive email composition tool that provides rich text editing, template integration, dynamic content support, and attachment management. It serves as the content creation hub for email workflows in AgenitiX.

## Architecture

### Core Components

```
emailCreator.node.tsx
├── EmailCreatorData (Zod Schema)
├── EmailComposer (Main UI Component)
├── RichTextEditor (Content Editing)
├── TemplateSelector (Template Management)
├── AttachmentManager (File Handling)
├── VariableInserter (Dynamic Content)
├── EmailPreview (Preview & Validation)
└── EmailCreatorInspector (Node Inspector)
```

### Data Schema

```typescript
interface EmailCreatorData {
  // Basic Email Fields
  recipients: {
    to: string[];
    cc: string[];
    bcc: string[];
  };
  subject: string;
  
  // Content
  content: {
    text: string;
    html: string;
    mode: 'text' | 'html' | 'rich';
  };
  
  // Template Integration
  template: {
    id?: string;
    name?: string;
    variables: Record<string, string>;
    useTemplate: boolean;
  };
  
  // Attachments
  attachments: Array<{
    id: string;
    name: string;
    size: number;
    type: string;
    content?: string; // base64 for small files
    url?: string; // for large files
  }>;
  
  // Formatting Options
  formatting: {
    font: string;
    fontSize: number;
    textColor: string;
    backgroundColor: string;
    alignment: 'left' | 'center' | 'right' | 'justify';
  };
  
  // Validation & Preview
  validation: {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  };
  
  // Node State
  isEnabled: boolean;
  expandedSize: string;
  collapsedSize: string;
  
  // Outputs
  emailOutput?: ComposedEmail;
  validationOutput?: boolean;
  errorOutput?: string;
}
```

### Rich Text Editor Integration

```typescript
interface RichTextEditorProps {
  content: string;
  mode: 'text' | 'html' | 'rich';
  onChange: (content: string) => void;
  onModeChange: (mode: 'text' | 'html' | 'rich') => void;
  variables: Variable[];
  onVariableInsert: (variable: Variable) => void;
}

// Editor Features
const EDITOR_FEATURES = {
  formatting: ['bold', 'italic', 'underline', 'strikethrough'],
  alignment: ['left', 'center', 'right', 'justify'],
  lists: ['ordered', 'unordered'],
  links: ['insert', 'edit', 'remove'],
  images: ['insert', 'resize', 'alt-text'],
  tables: ['insert', 'edit', 'format'],
  variables: ['insert', 'preview', 'validate'],
};
```

### Template System

```typescript
interface EmailTemplate {
  id: string;
  name: string;
  description?: string;
  subject: string;
  content: {
    text: string;
    html: string;
  };
  variables: Array<{
    name: string;
    type: 'text' | 'number' | 'date' | 'boolean';
    required: boolean;
    defaultValue?: string;
    description?: string;
  }>;
  category: string;
  tags: string[];
  createdAt: number;
  updatedAt: number;
}

// Template Processing
const processTemplate = (
  template: EmailTemplate,
  variables: Record<string, string>
): ProcessedTemplate => {
  // Variable substitution logic
  // HTML/text processing
  // Validation and error handling
};
```

### Variable System

```typescript
interface Variable {
  name: string;
  type: 'text' | 'number' | 'date' | 'boolean' | 'object';
  value: any;
  source: 'workflow' | 'user' | 'system';
  description?: string;
}

// Variable Syntax
const VARIABLE_SYNTAX = {
  simple: '{{variableName}}',
  formatted: '{{variableName|format}}',
  conditional: '{{#if condition}}content{{/if}}',
  loop: '{{#each items}}{{name}}{{/each}}',
};

// Variable Resolution
const resolveVariables = (
  content: string,
  variables: Record<string, any>
): ResolvedContent => {
  // Parse variable syntax
  // Resolve values from workflow data
  // Handle missing variables
  // Apply formatting
};
```

### Attachment Management

```typescript
interface AttachmentManager {
  maxFileSize: number; // 25MB default
  allowedTypes: string[];
  maxAttachments: number;
  
  validateFile(file: File): ValidationResult;
  uploadFile(file: File): Promise<AttachmentResult>;
  removeAttachment(id: string): void;
  getAttachmentPreview(attachment: Attachment): PreviewData;
}

// File Processing
const processAttachment = async (file: File): Promise<ProcessedAttachment> => {
  // Validate file type and size
  // Generate preview/thumbnail
  // Upload to storage or encode as base64
  // Create attachment metadata
};
```

### Email Validation

```typescript
interface EmailValidator {
  validateRecipients(recipients: Recipients): ValidationResult;
  validateSubject(subject: string): ValidationResult;
  validateContent(content: EmailContent): ValidationResult;
  validateAttachments(attachments: Attachment[]): ValidationResult;
  validateOverall(email: ComposedEmail): ValidationResult;
}

// Validation Rules
const VALIDATION_RULES = {
  recipients: {
    maxTo: 100,
    maxCc: 50,
    maxBcc: 50,
    emailFormat: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
  subject: {
    maxLength: 200,
    minLength: 1,
    noSpamWords: true,
  },
  content: {
    maxSize: 1024 * 1024, // 1MB
    allowedHtmlTags: ['p', 'div', 'span', 'a', 'img', 'table', 'tr', 'td'],
    sanitizeHtml: true,
  },
  attachments: {
    maxSize: 25 * 1024 * 1024, // 25MB
    maxCount: 10,
    allowedTypes: ['.pdf', '.doc', '.docx', '.jpg', '.png', '.gif'],
  },
};
```

## UI Components

### Main Composer Interface

```typescript
const EmailComposer: React.FC<EmailComposerProps> = ({
  data,
  updateData,
  isEnabled,
}) => {
  return (
    <div className="email-composer">
      {/* Recipients Section */}
      <RecipientsInput
        recipients={data.recipients}
        onChange={(recipients) => updateData({ recipients })}
        validation={data.validation}
      />
      
      {/* Subject Line */}
      <SubjectInput
        subject={data.subject}
        onChange={(subject) => updateData({ subject })}
        variables={availableVariables}
        onVariableInsert={handleVariableInsert}
      />
      
      {/* Template Selector */}
      <TemplateSelector
        selectedTemplate={data.template}
        onTemplateSelect={handleTemplateSelect}
        onVariableChange={handleTemplateVariableChange}
      />
      
      {/* Rich Text Editor */}
      <RichTextEditor
        content={data.content}
        onChange={(content) => updateData({ content })}
        variables={availableVariables}
        onVariableInsert={handleVariableInsert}
      />
      
      {/* Attachment Manager */}
      <AttachmentManager
        attachments={data.attachments}
        onAttachmentAdd={handleAttachmentAdd}
        onAttachmentRemove={handleAttachmentRemove}
        maxSize={25 * 1024 * 1024}
      />
      
      {/* Preview & Validation */}
      <EmailPreview
        email={composedEmail}
        validation={data.validation}
        onValidate={handleValidation}
      />
    </div>
  );
};
```

### Rich Text Editor

```typescript
const RichTextEditor: React.FC<RichTextEditorProps> = ({
  content,
  mode,
  onChange,
  onModeChange,
  variables,
  onVariableInsert,
}) => {
  return (
    <div className="rich-text-editor">
      {/* Mode Selector */}
      <div className="editor-modes">
        <button 
          className={mode === 'rich' ? 'active' : ''}
          onClick={() => onModeChange('rich')}
        >
          Rich Text
        </button>
        <button 
          className={mode === 'html' ? 'active' : ''}
          onClick={() => onModeChange('html')}
        >
          HTML
        </button>
        <button 
          className={mode === 'text' ? 'active' : ''}
          onClick={() => onModeChange('text')}
        >
          Plain Text
        </button>
      </div>
      
      {/* Formatting Toolbar */}
      {mode === 'rich' && (
        <FormattingToolbar
          onFormat={handleFormat}
          onVariableInsert={onVariableInsert}
          variables={variables}
        />
      )}
      
      {/* Editor Content */}
      <div className="editor-content">
        {mode === 'rich' && (
          <RichTextArea
            content={content.html}
            onChange={(html) => onChange({ ...content, html })}
          />
        )}
        {mode === 'html' && (
          <CodeEditor
            content={content.html}
            language="html"
            onChange={(html) => onChange({ ...content, html })}
          />
        )}
        {mode === 'text' && (
          <PlainTextArea
            content={content.text}
            onChange={(text) => onChange({ ...content, text })}
          />
        )}
      </div>
    </div>
  );
};
```

### Template Selector

```typescript
const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  selectedTemplate,
  onTemplateSelect,
  onVariableChange,
}) => {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  return (
    <div className="template-selector">
      <div className="template-header">
        <label>Email Template</label>
        <button onClick={handleCreateTemplate}>
          Create New Template
        </button>
      </div>
      
      <select
        value={selectedTemplate.id || ''}
        onChange={handleTemplateChange}
        disabled={isLoading}
      >
        <option value="">No Template</option>
        {templates.map(template => (
          <option key={template.id} value={template.id}>
            {template.name}
          </option>
        ))}
      </select>
      
      {selectedTemplate.id && (
        <TemplateVariables
          template={selectedTemplate}
          variables={selectedTemplate.variables}
          onChange={onVariableChange}
        />
      )}
    </div>
  );
};
```

## Integration Points

### With EmailSender Node

```typescript
interface EmailCreatorOutput {
  composedEmail: {
    recipients: Recipients;
    subject: string;
    content: EmailContent;
    attachments: Attachment[];
    metadata: {
      templateId?: string;
      variables: Record<string, string>;
      createdAt: number;
    };
  };
  isValid: boolean;
  validationErrors: string[];
}

// Output Handle
const OUTPUT_HANDLE = {
  id: 'emailOutput',
  type: 'source',
  dataType: 'composedEmail',
  position: 'right',
};
```

### With EmailAccount Node

```typescript
// Input Handle for Account Information
const ACCOUNT_INPUT_HANDLE = {
  id: 'accountInput',
  type: 'target',
  dataType: 'emailAccount',
  position: 'left',
};

// Use account info for sender details
const useAccountInfo = (accountData: EmailAccountData) => {
  return {
    senderName: accountData.displayName || accountData.email,
    senderEmail: accountData.email,
    signature: accountData.signature,
  };
};
```

### With Workflow Variables

```typescript
// Variable Context Integration
const useWorkflowVariables = () => {
  const { workflowData } = useWorkflowContext();
  
  return useMemo(() => {
    return extractVariables(workflowData);
  }, [workflowData]);
};

// Variable Extraction
const extractVariables = (data: any): Variable[] => {
  // Extract variables from workflow context
  // Include node outputs, user inputs, system variables
  // Format for template system
};
```

## Performance Considerations

### Optimization Strategies

1. **Lazy Loading**: Load templates and attachments on demand
2. **Debounced Updates**: Debounce content changes to avoid excessive re-renders
3. **Virtual Scrolling**: For large template lists and attachment previews
4. **Memoization**: Cache processed templates and variable resolutions
5. **Progressive Enhancement**: Load advanced features after basic functionality

### Memory Management

```typescript
// Cleanup Strategy
const useCleanup = () => {
  useEffect(() => {
    return () => {
      // Clean up file uploads
      // Clear template cache
      // Remove event listeners
      // Cancel pending operations
    };
  }, []);
};

// File Upload Optimization
const optimizeFileUpload = (file: File) => {
  // Compress images
  // Chunk large files
  // Show progress
  // Allow cancellation
};
```

## Security Considerations

### Content Sanitization

```typescript
const sanitizeHtmlContent = (html: string): string => {
  // Remove dangerous tags and attributes
  // Validate URLs in links and images
  // Escape user input
  // Preserve safe formatting
};

const validateAttachment = (file: File): SecurityResult => {
  // Check file type against whitelist
  // Scan for malware signatures
  // Validate file headers
  // Check file size limits
};
```

### Data Protection

```typescript
// Secure Variable Handling
const secureVariableResolution = (
  template: string,
  variables: Record<string, any>
): string => {
  // Validate variable sources
  // Sanitize variable values
  // Prevent code injection
  // Log security events
};
```

## Testing Strategy

### Unit Tests
- Template processing and variable resolution
- Content validation and sanitization
- Attachment handling and validation
- Rich text editor functionality

### Integration Tests
- Node-to-node data flow
- Template system integration
- File upload and processing
- Email composition workflow

### E2E Tests
- Complete email creation workflow
- Template selection and customization
- Attachment management
- Preview and validation

## File Structure

```
features/business-logic-modern/node-domain/email/
├── emailCreator.node.tsx           # Main node component
├── components/
│   ├── EmailComposer.tsx           # Main composition interface
│   ├── RichTextEditor.tsx          # Rich text editing
│   ├── TemplateSelector.tsx        # Template management
│   ├── AttachmentManager.tsx       # File handling
│   ├── VariableInserter.tsx        # Dynamic content
│   ├── EmailPreview.tsx            # Preview & validation
│   └── RecipientsInput.tsx         # Recipient management
├── services/
│   ├── templateService.ts          # Template operations
│   ├── attachmentService.ts        # File processing
│   ├── validationService.ts        # Content validation
│   └── variableService.ts          # Variable resolution
├── utils/
│   ├── htmlSanitizer.ts           # Content sanitization
│   ├── variableParser.ts          # Variable parsing
│   └── emailFormatter.ts          # Email formatting
└── types/
    ├── emailCreator.ts            # Type definitions
    ├── template.ts                # Template types
    └── attachment.ts              # Attachment types
```

This design provides a comprehensive, secure, and user-friendly email creation experience that integrates seamlessly with the AgenitiX workflow system.