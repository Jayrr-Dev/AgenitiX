# Enterprise Node Validation System

## Overview

The Enterprise Node Validation System provides comprehensive data validation, error tracking, metrics collection, and monitoring for all nodes in the Agenitix business logic engine. This system ensures data integrity, provides real-time health monitoring, and supports enterprise-grade error reporting.

## 🚀 Key Features

### ✅ **Type-Safe Validation with Zod**
- Runtime data validation with TypeScript type inference
- Enterprise-grade schema validation with sanitization
- XSS protection and input sanitization
- Automatic fallback to safe defaults

### 📊 **Real-Time Metrics Collection**
- Validation success/failure rates
- Performance monitoring
- Error pattern analysis
- Health score calculation

### 🔔 **Error Tracking & Alerting**
- Integration-ready error tracking (Sentry, LogRocket)
- Automated alert generation
- Severity-based error classification
- Audit trail for all validation events

### 📈 **Monitoring Dashboard**
- Comprehensive validation health reporting
- Export capabilities (JSON, CSV, Markdown)
- Real-time status monitoring
- Critical node identification

### ⚡ **Developer Experience**
- Automated node generation with Plop
- Enterprise migration tools
- Comprehensive TypeScript support
- Flexible schema building utilities

## 📁 System Architecture

```
features/business-logic-modern/infrastructure/node-core/
├── validation.ts              # Core validation engine
├── validation-monitor.ts      # Monitoring & dashboard
├── NodeSpec.ts               # Node specification types
└── withNodeScaffold.tsx      # Node wrapper HOC

tooling/
├── dev-scripts/plop-templates/node.tsx.hbs  # Enterprise template
└── migration-scripts/migrate-all-nodes.ts   # Migration utility
```

## 🛠️ Quick Start

### 1. Creating a New Node

```bash
pnpm new:node
```

This generates an enterprise-grade node with:
- Zod schema validation
- Error tracking integration
- Metrics collection
- Type-safe data handling

### 2. Migrating Existing Nodes

```bash
pnpm migrate:nodes
```

Automatically converts legacy nodes to the enterprise validation system.

### 3. Monitoring Validation Health

```typescript
import { generateValidationDashboard } from '@/features/business-logic-modern/infrastructure/node-core/validation-monitor';

const dashboard = generateValidationDashboard();
console.log(`System Health: ${dashboard.overall.overallHealthScore}%`);
```

## 📋 Node Implementation Guide

### Basic Node Structure

```typescript
import { z } from 'zod';
import { 
  createNodeValidator, 
  CommonSchemas, 
  reportValidationError,
  useNodeDataValidation 
} from '@/features/business-logic-modern/infrastructure/node-core/validation';

// 1. Define your data schema
const MyNodeDataSchema = z.object({
  text: CommonSchemas.text.default('Default value'),
  count: CommonSchemas.positiveInt.default(1),
  isEnabled: CommonSchemas.boolean,
}).strict();

type MyNodeData = z.infer<typeof MyNodeDataSchema>;

// 2. Create validator
const validateNodeData = createNodeValidator(MyNodeDataSchema, 'MyNode');

// 3. Use in component
const MyNodeComponent = ({ data, id }: NodeProps) => {
  const validationResult = validateNodeData(data);
  const nodeData = validationResult.data;
  
  // Report errors for monitoring
  if (!validationResult.success) {
    reportValidationError('MyNode', id, validationResult.errors);
  }
  
  // Real-time validation hook
  const { updateData, getHealthScore } = useNodeDataValidation(
    MyNodeDataSchema,
    'MyNode',
    nodeData,
    id
  );
  
  // Your component logic here...
};
```

### Advanced Schema Patterns

```typescript
// Complex validation with custom rules
const AdvancedSchema = z.object({
  email: CommonSchemas.email,
  url: CommonSchemas.url,
  safeHtml: CommonSchemas.safeHtml.default('<p>Safe content</p>'),
  filePath: CommonSchemas.filePath,
  hexColor: CommonSchemas.hexColor.default('#000000'),
  
  // Custom validation
  customField: z.string()
    .min(5, 'Must be at least 5 characters')
    .refine(val => !val.includes('forbidden'), 'Contains forbidden content'),
    
  // Conditional fields
  conditionalData: z.string().optional(),
}).refine(data => {
  // Cross-field validation
  if (data.customField.startsWith('special') && !data.conditionalData) {
    return false;
  }
  return true;
}, 'Conditional data required when customField starts with "special"');

// Using schema builder utilities
import { SchemaBuilderUtils } from './validation';

const baseSchema = SchemaBuilderUtils.createBaseSchema({
  id: z.string().uuid(),
  name: CommonSchemas.text,
});

const extendedSchema = SchemaBuilderUtils.extendSchema(baseSchema, {
  description: CommonSchemas.optionalText,
  tags: CommonSchemas.stringArray,
});
```

## 🔍 Monitoring & Analytics

### Dashboard Usage

```typescript
import { 
  generateValidationDashboard,
  ValidationExporter,
  ValidationMonitorUtils 
} from './validation-monitor';

// Get current system health
const dashboard = generateValidationDashboard();

// Check if system is healthy
const isHealthy = ValidationMonitorUtils.isSystemHealthy(dashboard);

// Get critical nodes needing attention
const criticalNodes = ValidationMonitorUtils.getCriticalNodes(dashboard);

// Export for external analysis
const csvReport = ValidationExporter.toCSV(dashboard);
const markdownReport = ValidationExporter.toMarkdown(dashboard);
```

### React Integration

```typescript
import { useState, useEffect } from 'react';
import { generateValidationDashboard } from './validation-monitor';

export function useValidationMonitoring(refreshInterval = 30000) {
  const [dashboard, setDashboard] = useState(null);
  
  useEffect(() => {
    const refresh = () => setDashboard(generateValidationDashboard());
    refresh();
    const interval = setInterval(refresh, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval]);
  
  return dashboard;
}

// Usage in component
function ValidationDashboardComponent() {
  const dashboard = useValidationMonitoring();
  
  return (
    <div>
      <h2>System Health: {dashboard?.overall.overallHealthScore}%</h2>
      {dashboard?.alerts.map(alert => (
        <div key={alert.id} className={`alert-${alert.severity}`}>
          {alert.message}
        </div>
      ))}
    </div>
  );
}
```

## 📝 Common Schema Patterns

### Input Validation
```typescript
const FormSchema = z.object({
  username: CommonSchemas.text.min(3).max(50),
  email: CommonSchemas.email,
  age: CommonSchemas.positiveInt.min(13).max(120),
  website: CommonSchemas.url.optional(),
  bio: CommonSchemas.safeHtml.max(500),
});
```

### API Data
```typescript
const ApiResponseSchema = z.object({
  data: CommonSchemas.jsonObject,
  pagination: z.object({
    page: CommonSchemas.positiveInt,
    total: CommonSchemas.positiveInt,
    hasMore: CommonSchemas.boolean,
  }),
  metadata: z.record(z.unknown()).optional(),
});
```

### File Processing
```typescript
const FileProcessorSchema = z.object({
  inputPath: CommonSchemas.filePath,
  outputPath: CommonSchemas.filePath,
  format: z.enum(['json', 'csv', 'xml']).default('json'),
  options: z.object({
    compress: CommonSchemas.boolean,
    validate: CommonSchemas.boolean,
  }).default({}),
});
```

## 🔧 Error Tracking Integration

### Sentry Setup

```typescript
import { initializeErrorTracking, SentryErrorTracking } from './validation';

// Initialize error tracking (when available)
if (process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_SENTRY_DSN) {
  initializeErrorTracking(SentryErrorTracking);
}
```

### Custom Error Service

```typescript
import { initializeErrorTracking, type ErrorTrackingService } from './validation';

const customErrorService: ErrorTrackingService = {
  captureError: (error, context) => {
    // Send to your error tracking service
    fetch('/api/errors', {
      method: 'POST',
      body: JSON.stringify({ error, context }),
    });
  },
  captureMessage: (message, level) => {
    console.log(`[${level.toUpperCase()}] ${message}`);
  },
};

initializeErrorTracking(customErrorService);
```

## 📊 Metrics & Performance

### Health Score Calculation
- **100%**: No validation failures
- **80-99%**: Occasional failures, system stable
- **50-79%**: Regular failures, needs attention
- **<50%**: Critical, immediate intervention required

### Alert Levels
- **Critical**: Health score < 50%, system failure imminent
- **High**: Failure rate > 20%, performance impact
- **Medium**: Recent failures or error patterns detected
- **Low**: Minor issues, monitoring recommended

### Performance Monitoring
```typescript
import { getValidationMetrics, getValidationHealthScore } from './validation';

// Monitor specific node type
const healthScore = getValidationHealthScore('CreateText');
const metrics = getValidationMetrics();

// Log performance summary
console.log('Validation Performance Report:');
metrics.forEach(metric => {
  console.log(`${metric.nodeType}: ${metric.validationCount} validations, ${metric.failureCount} failures`);
});
```

## 🔄 Migration Guide

### From Legacy Nodes

The migration system automatically converts:
- `meta.json` + component → single `.node.tsx` file
- Manual validation → Zod schema validation
- Basic error handling → enterprise error tracking
- Static data → type-safe validated data

### Manual Migration Steps

1. **Update imports**:
```typescript
// Old
import { withNodeScaffold } from './withNodeScaffold';

// New
import { 
  createNodeValidator, 
  CommonSchemas 
} from '@/features/business-logic-modern/infrastructure/node-core/validation';
```

2. **Convert data types**:
```typescript
// Old
type NodeData = {
  text: string;
  count: number;
};

// New
const NodeDataSchema = z.object({
  text: CommonSchemas.text.default(''),
  count: CommonSchemas.positiveInt.default(0),
}).strict();

type NodeData = z.infer<typeof NodeDataSchema>;
```

3. **Add validation**:
```typescript
// Old
const data = props.data as NodeData;

// New
const validationResult = validateNodeData(props.data);
const data = validationResult.data;

if (!validationResult.success) {
  reportValidationError('NodeType', id, validationResult.errors);
}
```

## 🎯 Best Practices

### 1. Schema Design
- Always use `strict()` to prevent unexpected properties
- Provide sensible defaults for all fields
- Use `CommonSchemas` for standard validation patterns
- Add custom validation for business rules

### 2. Error Handling
- Report validation errors for monitoring
- Provide meaningful error messages
- Use appropriate severity levels
- Include context for debugging

### 3. Performance
- Monitor validation health scores regularly
- Address critical nodes immediately
- Use caching for expensive validations
- Profile validation performance in production

### 4. Testing
- Test both valid and invalid data scenarios
- Verify error reporting functionality
- Test migration scripts thoroughly
- Monitor metrics after deployments

## 🔮 Future Enhancements

### Planned Features
- **Time-series metrics**: Historical validation trends
- **Predictive alerting**: ML-based failure prediction
- **Auto-healing**: Automatic schema migration
- **A/B testing**: Schema validation comparisons
- **Real-time dashboard**: Live monitoring interface

### Integration Roadmap
- **Grafana dashboards**: Visual monitoring
- **Slack notifications**: Real-time alerts
- **CI/CD integration**: Validation in build pipeline
- **Load testing**: Validation performance under stress

## 📞 Support & Troubleshooting

### Common Issues

**High failure rates**:
- Check for schema changes without migration
- Verify input data formats
- Review custom validation rules

**Performance issues**:
- Profile complex validation schemas
- Consider caching frequently validated data
- Monitor validation metrics regularly

**Error tracking not working**:
- Verify error service initialization
- Check environment variables
- Test error reporting manually

### Debug Mode

Enable verbose logging:
```typescript
// Set environment variable
process.env.NODE_ENV = 'development';

// Or enable specific debugging
process.env.VALIDATION_DEBUG = 'true';
```

---

## 🎉 Conclusion

The Enterprise Node Validation System provides a robust, scalable foundation for data validation in the Agenitix platform. With comprehensive monitoring, automated tooling, and enterprise-grade error handling, it ensures data integrity while providing excellent developer experience.

For questions or support, refer to the implementation files or create an issue in the project repository. 