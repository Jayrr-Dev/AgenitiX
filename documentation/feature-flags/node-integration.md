# Feature Flags with Node Generation

This guide explains how to automatically integrate feature flags when generating nodes with Plop.

## Overview

The node generation system now supports automatic feature flag integration. When you create a new node using `pnpm new:node`, you can optionally add feature flag support that will:

- Evaluate flags at runtime
- Show/hide nodes based on flag state
- Display custom messages when disabled
- Provide graceful fallbacks

## How It Works

### 1. NodeSpec Enhancement

The `NodeSpec` interface now includes a `featureFlag` property:

```typescript
interface FeatureFlagConfig {
  flag?: string;                    // Flag name to check
  fallback?: boolean;               // Default when flag unavailable
  disabledMessage?: string;         // Custom disabled message
  hideWhenDisabled?: boolean;       // Hide node completely when disabled
  alternativeNode?: string;         // Alternative node to show
}
```

### 2. Automatic Integration

When you run `pnpm new:node`, you'll be prompted with feature flag options:

```bash
? Do you want to add feature flag support to this node? (Y/n)
? Enter the feature flag name (leave blank to use 'test' flag): test
? Should the node be enabled by default if the flag is unavailable? (Y/n)
? Custom message to show when the node is disabled (leave blank for default): 
? Should the node be completely hidden when the flag is disabled? (y/N)
```

### 3. Generated Code

The generated node will automatically include feature flag evaluation:

```tsx
// Feature flag evaluation
const flagState = useNodeFeatureFlag(spec.featureFlag);

// If flag is loading, show loading state
if (flagState.isLoading) {
  return (
    <div className="flex items-center justify-center p-4 text-sm text-muted-foreground">
      Loading feature...
    </div>
  );
}

// If flag is disabled and should hide, return null
if (!flagState.isEnabled && flagState.hideWhenDisabled) {
  return null;
}

// If flag is disabled, show disabled message
if (!flagState.isEnabled) {
  return (
    <div className="flex items-center justify-center p-4 text-sm text-muted-foreground border border-dashed border-muted-foreground/20 rounded-lg">
      {flagState.disabledMessage}
    </div>
  );
}
```

## Usage Examples

### Basic Feature Flag

```typescript
// NodeSpec with basic feature flag
const spec: NodeSpec = {
  // ... other properties
  featureFlag: {
    flag: "enableAdvancedNodes",
    fallback: true,
    disabledMessage: "Advanced nodes are currently disabled",
    hideWhenDisabled: false,
  },
};
```

### Hidden When Disabled

```typescript
// Node completely hidden when flag is disabled
const spec: NodeSpec = {
  // ... other properties
  featureFlag: {
    flag: "betaFeatures",
    fallback: false,
    hideWhenDisabled: true,
  },
};
```

### Custom Fallback

```typescript
// Node with custom fallback behavior
const spec: NodeSpec = {
  // ... other properties
  featureFlag: {
    flag: "experimentalFeatures",
    fallback: false,
    disabledMessage: "This experimental feature is not available",
    alternativeNode: "stableAlternative",
  },
};
```

## Creating Feature Flags

### 1. In Hypertune Dashboard

1. Go to your Hypertune dashboard
2. Create a new flag (e.g., `enableAdvancedNodes`)
3. Set the default value and rules

### 2. Generate Types

```bash
npx hypertune
```

### 3. Add to flag.ts

```typescript
export const enableAdvancedNodesFlag = flag(
  hypertuneAdapter.declarations.enableAdvancedNodes,
);
```

### 4. Use in Node Generation

When running `pnpm new:node`, specify the flag name:

```bash
? Enter the feature flag name: enableAdvancedNodes
```

## Best Practices

### 1. Flag Naming

- Use descriptive names: `enableAdvancedNodes`, `betaFeatures`, `experimentalAI`
- Follow consistent naming conventions
- Group related features: `ai_advanced`, `ai_basic`

### 2. Fallback Behavior

- Set `fallback: true` for non-critical features
- Set `fallback: false` for experimental features
- Consider user experience when flags are unavailable

### 3. User Experience

- Provide clear disabled messages
- Use `hideWhenDisabled: true` sparingly
- Consider alternative nodes for critical functionality

### 4. Testing

- Test both enabled and disabled states
- Verify fallback behavior
- Test loading states

## Advanced Configuration

### Dynamic Flag Names

You can use dynamic flag names based on node properties:

```typescript
const spec: NodeSpec = {
  // ... other properties
  featureFlag: {
    flag: `enable${feature}Nodes`, // e.g., "enableAINodes"
    fallback: true,
  },
};
```

### Conditional Feature Flags

```typescript
const spec: NodeSpec = {
  // ... other properties
  featureFlag: {
    flag: process.env.NODE_ENV === 'production' ? 'productionFeatures' : 'developmentFeatures',
    fallback: process.env.NODE_ENV === 'development',
  },
};
```

## Troubleshooting

### Common Issues

1. **Flag not found**: Ensure the flag exists in Hypertune and types are generated
2. **Loading forever**: Check network connectivity and flag evaluation
3. **Wrong fallback**: Verify fallback values in NodeSpec

### Debug Commands

```bash
# Generate flag types
npx hypertune

# Check flag evaluation
# Add console.log to useNodeFeatureFlag hook

# Test flag in isolation
import { testFlag } from '@/flag';
const value = await testFlag();
console.log('Flag value:', value);
```

## Integration with Existing Nodes

To add feature flags to existing nodes:

1. **Manual Addition**: Add `featureFlag` property to NodeSpec
2. **Component Update**: Add flag evaluation logic to component
3. **Testing**: Verify flag behavior in both states

### Example: Adding to Existing Node

```typescript
// In existing NodeSpec
export const spec: NodeSpec = {
  // ... existing properties
  featureFlag: {
    flag: "enableLegacyNodes",
    fallback: true,
    disabledMessage: "This legacy node is deprecated",
  },
};

// In existing component
const flagState = useNodeFeatureFlag(spec.featureFlag);
if (!flagState.isEnabled) {
  return <div>{flagState.disabledMessage}</div>;
}
```

## Summary

Feature flag integration with node generation provides:

- ✅ **Automatic flag evaluation** in generated nodes
- ✅ **Graceful degradation** when flags are unavailable
- ✅ **Customizable behavior** (hide/show, messages, fallbacks)
- ✅ **Type-safe integration** with Hypertune
- ✅ **Consistent user experience** across all flagged nodes

This system enables you to easily create feature-flagged nodes and manage their availability through your Hypertune dashboard. 