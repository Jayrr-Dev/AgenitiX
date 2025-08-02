# Design Document

## Overview

The createObject node is a specialized content creation node that enables users to construct JSON objects within the visual workflow editor. It follows the established NodeSpec architecture while providing object-specific functionality including JSON validation, visual feedback with curly braces, and seamless integration with the existing node ecosystem.

## Architecture

### Core Components

1. **CreateObjectNode Component**: Main React component implementing the node UI and behavior
2. **Dynamic Spec Factory**: Function that generates NodeSpec based on current node data
3. **Schema Definition**: Zod schema for type-safe data validation
4. **JSON Validation System**: Real-time JSON parsing and validation
5. **Handle Configuration**: Input/output handles for data flow integration

### Data Flow Architecture

```
Input Handles → JSON Validation → Object Construction → Output Handle
     ↓                ↓                    ↓              ↓
Boolean Input    Error Handling    State Management   JSON Output
JSON Input       Visual Feedback   Active/Inactive    Type Safety
```

## Components and Interfaces

### Data Schema

```typescript
export const CreateObjectDataSchema = z.object({
  // Core object content
  objectContent: z.string().default("{}"),
  parsedObject: z.any().optional(),
  
  // State management
  isEnabled: SafeSchemas.boolean(true),
  isActive: SafeSchemas.boolean(false),
  isExpanded: SafeSchemas.boolean(false),
  
  // Input/output data
  inputs: SafeSchemas.optionalText().nullable().default(null),
  outputs: z.any().optional(),
  
  // UI configuration
  expandedSize: SafeSchemas.text("FE1"),
  collapsedSize: SafeSchemas.text("C1"),
  label: z.string().optional(),
  
  // Validation state
  isValidJson: SafeSchemas.boolean(true),
  validationError: z.string().optional(),
}).passthrough();
```

### Handle Configuration

```typescript
handles: [
  {
    id: "json-input",
    code: "j",
    position: "top",
    type: "target",
    dataType: "JSON",
  },
  {
    id: "object-output",
    code: "j",
    position: "right", 
    type: "source",
    dataType: "JSON",
  },
  {
    id: "trigger-input",
    code: "b",
    position: "left",
    type: "target",
    dataType: "Boolean",
  },
]
```

### Visual States

#### Collapsed State
- **Size**: C1 (60x60px) by default
- **Display**: Fixed curly braces `{}` centered
- **Icon**: Custom JSON braces icon or LuBraces from Lucide
- **Interaction**: Click to expand, shows tooltip with current object preview

#### Expanded State  
- **Size**: FE1 (120x120px) by default, configurable
- **Display**: Full textarea for JSON editing
- **Features**: 
  - Syntax highlighting (if feasible)
  - Real-time validation
  - Error messages below textarea
  - Line numbers for larger objects

## Data Models

### Node Data Structure

```typescript
interface CreateObjectData {
  // Primary content
  objectContent: string;        // Raw JSON string input
  parsedObject?: any;          // Parsed JavaScript object
  
  // State flags
  isEnabled: boolean;          // Node enabled/disabled
  isActive: boolean;           // Has valid content
  isExpanded: boolean;         // UI state
  
  // Data flow
  inputs: string | null;       // Incoming data
  outputs?: any;               // Outgoing object
  
  // Configuration
  expandedSize: string;        // Dynamic sizing
  collapsedSize: string;       // Dynamic sizing
  label?: string;              // Custom label
  
  // Validation
  isValidJson: boolean;        // JSON validity flag
  validationError?: string;    // Error message
}
```

### JSON Processing Pipeline

1. **Input Reception**: Raw string from textarea or input handles
2. **Validation**: JSON.parse() with error catching
3. **State Update**: Update isValidJson and validationError
4. **Object Storage**: Store parsed object in parsedObject field
5. **Output Propagation**: Send valid objects to output handle

## Error Handling

### JSON Validation Errors

```typescript
const validateJsonContent = (content: string): ValidationResult => {
  try {
    const parsed = JSON.parse(content);
    return {
      isValid: true,
      parsedObject: parsed,
      error: null
    };
  } catch (error) {
    return {
      isValid: false,
      parsedObject: null,
      error: error.message
    };
  }
};
```

### Error Display Strategy

- **Collapsed State**: Red border around braces icon
- **Expanded State**: Error message below textarea with specific issue
- **Handle Propagation**: No output when JSON is invalid
- **Recovery**: Auto-clear errors when valid JSON is entered

### Default Object Handling

- **Initial State**: Empty object `{}`
- **Reset Behavior**: Return to `{}` when cleared
- **Merge Strategy**: When receiving input, merge with existing object or replace based on user preference

## Testing Strategy

### Unit Tests

1. **JSON Validation**: Test valid/invalid JSON parsing
2. **State Management**: Test isActive/isEnabled logic
3. **Data Propagation**: Test input/output handle behavior
4. **Error Handling**: Test error states and recovery

### Integration Tests

1. **Node Creation**: Test node instantiation with default values
2. **Handle Connections**: Test connecting to other nodes
3. **Dynamic Sizing**: Test size changes and UI updates
4. **Persistence**: Test save/load of node state

### Visual Tests

1. **Collapsed Display**: Verify braces icon rendering
2. **Expanded Interface**: Verify textarea and validation UI
3. **Error States**: Verify error styling and messages
4. **Responsive Behavior**: Test different screen sizes

## Implementation Details

### Key Features

1. **Fixed Braces Display**: Custom icon or styled text showing `{}`
2. **Real-time Validation**: JSON parsing on every keystroke with debouncing
3. **Smart Defaults**: Intelligent handling of empty states and initialization
4. **Type Safety**: Full TypeScript integration with Zod schemas
5. **Performance**: Memoized components to prevent unnecessary re-renders

### Integration Points

- **Node Registry**: Auto-registration in create domain
- **Inspector Panel**: Auto-generated controls from schema
- **Flow Engine**: Standard handle integration
- **Theming System**: Consistent styling with other nodes
- **Feature Flags**: Optional feature flag support

### Performance Considerations

- **JSON Parsing**: Debounced validation to avoid excessive parsing
- **Memoization**: Memoized spec generation and component rendering
- **Handle Updates**: Efficient edge detection and input processing
- **Memory Management**: Proper cleanup of parsed objects

## Future Enhancements

1. **Syntax Highlighting**: Rich JSON editor with syntax coloring
2. **Object Builder UI**: Visual object construction interface
3. **Template System**: Pre-defined object templates
4. **Schema Validation**: JSON Schema validation support
5. **Import/Export**: Load objects from external sources