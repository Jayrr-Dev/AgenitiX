# Preventing Node Validation Issues

## Overview
This guide explains how to prevent the common validation error: `"CreateText node data validation failed: {}"` and similar issues when creating nodes with the Plop system.

## Root Cause
The validation error occurs when:
1. **Empty Schema**: Node schema is empty (`z.object({}).strict()`)
2. **Schema/InitialData Mismatch**: Schema has required fields but initialData is empty `{}`
3. **Improper Defaults**: Using `.default()` on complex schemas incorrectly

## ✅ **Prevention Solutions**

### **1. Updated Plop Template (Automatic)**
The Plop template now automatically generates nodes with:
- **Safe schemas** using `SafeSchemas` helpers
- **Auto-generated initialData** using `createSafeInitialData()`
- **Working UI controls** that match the schema

**Generated nodes will work out-of-the-box without validation errors.**

### **2. SafeSchemas Helper (Manual Development)**
When manually creating schemas, use `SafeSchemas` instead of raw Zod:

```typescript
// ❌ PROBLEMATIC - Can cause validation errors
const BadSchema = z.object({
  text: z.string().min(1).default(''), // Empty default fails validation
  number: CommonSchemas.number.default(0), // Complex schema issues
}).strict();

// ✅ SAFE - Prevents validation errors
const GoodSchema = z.object({
  text: SafeSchemas.text('Hello World'), // Safe text with proper default
  number: SafeSchemas.number(0, 0, 100), // Safe number with min/max
  isEnabled: SafeSchemas.boolean(true), // Safe boolean
  url: SafeSchemas.url(), // Safe optional URL
}).strict();
```

### **3. Safe InitialData Generation**
Always use `createSafeInitialData()` for NodeSpec:

```typescript
// ❌ PROBLEMATIC
const spec: NodeSpec = {
  // ...
  initialData: MySchema.parse({}), // Can fail if schema has required fields
};

// ✅ SAFE
const spec: NodeSpec = {
  // ...
  initialData: createSafeInitialData(MySchema), // Auto-extracts safe defaults
};
```

## 🔧 **Available SafeSchemas**

| Type | Usage | Example |
|------|-------|---------|
| **Text** | `SafeSchemas.text(default)` | `SafeSchemas.text('Hello')` |
| **Optional Text** | `SafeSchemas.optionalText(default?)` | `SafeSchemas.optionalText()` |
| **Number** | `SafeSchemas.number(default, min, max?)` | `SafeSchemas.number(0, 0, 100)` |
| **Boolean** | `SafeSchemas.boolean(default)` | `SafeSchemas.boolean(true)` |
| **URL** | `SafeSchemas.url(default?)` | `SafeSchemas.url()` |
| **Email** | `SafeSchemas.email(default?)` | `SafeSchemas.email()` |
| **Enum** | `SafeSchemas.enum(values, default)` | `SafeSchemas.enum(['A', 'B'], 'A')` |

## 🚨 **Common Mistakes to Avoid**

### **1. Empty Schemas**
```typescript
// ❌ DON'T DO THIS
const EmptySchema = z.object({}).strict();
```

### **2. Schema/InitialData Mismatch**
```typescript
// ❌ DON'T DO THIS
const schema = z.object({ text: z.string().min(1) });
const initialData = {}; // Missing required 'text' field
```

### **3. Invalid Defaults**
```typescript
// ❌ DON'T DO THIS
const schema = z.object({
  text: z.string().min(1).default(''), // Empty string fails min(1)
});
```

## 🧪 **Testing Schema Compatibility**
Use the validation helper in development:

```typescript
import { validateSchemaCompatibility } from '@/features/business-logic-modern/infrastructure/node-core/schema-helpers';

// Test your schema and initialData
const isValid = validateSchemaCompatibility(
  MyNodeSchema,
  myInitialData,
  'MyNode'
);

if (!isValid) {
  console.error('Schema/InitialData mismatch detected!');
}
```

## 📋 **Checklist for New Nodes**

When creating a new node, ensure:

- [ ] **Schema uses SafeSchemas** instead of raw Zod
- [ ] **InitialData uses createSafeInitialData()**
- [ ] **All schema fields have valid defaults**
- [ ] **UI controls match schema fields**
- [ ] **Test drag-and-drop from sidebar**
- [ ] **No console validation errors**

## 🔄 **Migration Guide**

If you have existing nodes with validation issues:

1. **Update Schema**:
   ```typescript
   // Replace raw Zod with SafeSchemas
   text: z.string().min(1) → text: SafeSchemas.text('Default')
   ```

2. **Update InitialData**:
   ```typescript
   // Replace manual object with safe generation
   initialData: {} → initialData: createSafeInitialData(MySchema)
   ```

3. **Test the Node**:
   - Drag from sidebar to canvas
   - Check console for errors
   - Verify UI controls work

## 🎯 **Future-Proofing**

The updated Plop system automatically prevents these issues by:
- Generating safe schemas by default
- Using proper initialData generation
- Including working UI controls
- Following enterprise validation patterns

**New nodes created with `pnpm new:node` will not have validation issues.** 