# Node Guide - Visual Flow Editor

A comprehensive guide to all available nodes in the visual flow editor, organized by category and function.

## 📋 Quick Reference

### Naming Convention
All nodes follow the **Function + Object** pattern:
- **Function**: Action verb (Create, Turn, Edit, View, Test, Count, Delay, Cycle)
- **Object**: Target noun (Text, Input, Output, Array, Object, Pulse, Toggle)
- **Optional Preposition**: To, From, With, etc.

Examples: `CreateText`, `TurnToUppercase`, `EditObject`, `ViewOutput`, `CyclePulse`, `CycleToggle`

---

## 🎨 Media & Text Processing

### CreateText
**Purpose**: Create and edit text content  
**Inputs**: 
- Trigger (boolean) - Optional trigger to control output
**Outputs**: 
- Text (string) - The created text content
**Controls**: 
- Text area for writing and editing content
**Use Cases**: 
- Writing messages, labels, or content
- Creating text templates
- Manual text input for flows

---

### TurnToUppercase  
**Purpose**: Convert text to uppercase letters  
**Inputs**: 
- Text (string) - Text to convert
**Outputs**: 
- Text (string) - Uppercase version of input
**Use Cases**: 
- Formatting headers and titles
- Creating emphasis in text
- Standardizing text case

---

### TurnToText
**Purpose**: Convert any data type to readable text  
**Inputs**: 
- Any (any) - Any data type to convert
**Outputs**: 
- Text (string) - String representation of input
**Use Cases**: 
- Converting numbers to text
- Displaying object contents as text
- Creating readable output from complex data

---

## 🔧 Core Logic & Data

### ViewOutput
**Purpose**: Display final results in a clean format  
**Inputs**: 
- Any (any) - Data to display
**Outputs**: 
- None (terminal node)
**Controls**: 
- Label customization
**Use Cases**: 
- Showing final flow results
- Debugging intermediate values
- Creating output displays

---

### TestInput
**Purpose**: Create test values for experimentation  
**Inputs**: 
- None (source node)
**Outputs**: 
- Any (any) - The test value
**Controls**: 
- Value input field with type detection
**Use Cases**: 
- Testing flows with sample data
- Providing mock inputs
- Debugging and development

---

### EditObject
**Purpose**: Create and edit structured data objects  
**Inputs**: 
- Object (object) - Optional base object to edit
**Outputs**: 
- Object (object) - The edited object
**Controls**: 
- Key-value pair editor
- Add/remove properties
**Use Cases**: 
- Creating user profiles
- Building configuration objects
- Structured data management

---

### EditArray
**Purpose**: Create and edit lists of items  
**Inputs**: 
- Array (array) - Optional base array to edit
**Outputs**: 
- Array (array) - The edited array
**Controls**: 
- Item list editor
- Add/remove items
**Use Cases**: 
- Managing lists and collections
- Creating data sets
- Building arrays for processing

---

## ⚡ Logic Operations

### LogicAnd (⋀)
**Purpose**: Output TRUE only when ALL inputs are true  
**Inputs**: 
- Multiple boolean inputs (configurable count)
**Outputs**: 
- Boolean (boolean) - Result of AND operation
**Controls**: 
- Input count selector (2-10)
**Use Cases**: 
- Requiring multiple conditions
- "All must be true" logic
- Complex conditional flows

---

### LogicOr (⋁)
**Purpose**: Output TRUE when ANY input is true  
**Inputs**: 
- Multiple boolean inputs (configurable count)
**Outputs**: 
- Boolean (boolean) - Result of OR operation
**Controls**: 
- Input count selector (2-10)
**Use Cases**: 
- Alternative conditions
- "Any can be true" logic
- Fallback scenarios

---

### LogicNot (¬)
**Purpose**: Flip boolean values (TRUE ↔ FALSE)  
**Inputs**: 
- Boolean (boolean) - Value to invert
**Outputs**: 
- Boolean (boolean) - Inverted value
**Use Cases**: 
- Creating opposite conditions
- Negating boolean logic
- Inverting flow control

---

### LogicXor (⊕)
**Purpose**: TRUE when exactly one input is true  
**Inputs**: 
- Two boolean inputs
**Outputs**: 
- Boolean (boolean) - Result of XOR operation
**Use Cases**: 
- "Either/or but not both" logic
- Exclusive conditions
- Toggle-like behavior

---

### LogicXnor (⊙)
**Purpose**: TRUE when all inputs match (all true OR all false)  
**Inputs**: 
- Two boolean inputs
**Outputs**: 
- Boolean (boolean) - Result of XNOR operation
**Use Cases**: 
- Checking if values are "in sync"
- Equality testing
- Matching conditions

---

## 🤖 Automation & Control

### TriggerOnClick
**Purpose**: Manual trigger button for flow control  
**Inputs**: 
- Any (any) - Data to pass through when triggered
**Outputs**: 
- Any (any) - Input data when button is clicked
**Controls**: 
- Trigger button
- Pass-through toggle
**Use Cases**: 
- Manual flow initiation
- Testing and debugging
- User interaction points

---

### TriggerPulse
**Purpose**: Generate recurring pulses at set intervals  
**Inputs**: 
- Trigger (boolean) - Start/stop the pulse generator
**Outputs**: 
- Pulse (boolean) - TRUE pulse at each interval
**Controls**: 
- Interval setting (milliseconds)
- Start/stop button
**Use Cases**: 
- Periodic data updates
- Animation timing
- Scheduled operations

---

### TriggerToggle
**Purpose**: Toggle between TRUE/FALSE states  
**Inputs**: 
- Trigger (boolean) - Toggle the state when triggered
**Outputs**: 
- State (boolean) - Current toggle state
**Controls**: 
- Manual toggle button
- Reset button
**Use Cases**: 
- On/off switches
- State management
- Boolean flag control

---

### CountPulse
**Purpose**: Count and track pulses or events  
**Inputs**: 
- Pulse (boolean) - Input to count
- Reset (boolean) - Reset counter to zero
**Outputs**: 
- Count (number) - Current count value
**Controls**: 
- Manual reset button
- Count display
**Use Cases**: 
- Event counting
- Progress tracking
- Accumulating totals

---

### CountToggle
**Purpose**: Count toggle state changes  
**Inputs**: 
- Toggle (boolean) - State changes to count
- Reset (boolean) - Reset counter
**Outputs**: 
- Count (number) - Number of state changes
**Controls**: 
- Reset controls
- Count display
**Use Cases**: 
- Tracking state changes
- Monitoring toggles
- Change detection

---

### DelayPulse
**Purpose**: Delay pulses by a specified time  
**Inputs**: 
- Pulse (boolean) - Input pulse to delay
**Outputs**: 
- Delayed (boolean) - Pulse after delay period
**Controls**: 
- Delay duration setting
**Use Cases**: 
- Creating timing sequences
- Debouncing signals
- Delayed reactions

---

### CyclePulse
**Purpose**: Cycle through a sequence of pulses  
**Inputs**: 
- Trigger (boolean) - Advance to next pulse
- Reset (boolean) - Reset to first pulse
**Outputs**: 
- Pulse (boolean) - Current cycle pulse
- Index (number) - Current position in cycle
**Controls**: 
- Cycle length setting
- Manual controls
**Use Cases**: 
- Sequential operations
- Pattern generation
- State machines

---

### CycleToggle
**Purpose**: Cycle through multiple toggle states  
**Inputs**: 
- Advance (boolean) - Move to next state
- Reset (boolean) - Reset to first state
**Outputs**: 
- State (any) - Current cycle state
- Index (number) - Current position
**Controls**: 
- State configuration
- Cycle controls
**Use Cases**: 
- Multi-state switches
- Sequential modes
- Pattern cycling

---

## 📊 Handle Types & Colors

### Data Type Reference:
- **`s` (String)**: Blue `#3b82f6` - Text and string data
- **`n` (Number)**: Orange `#f59e42` - Numeric values
- **`b` (Boolean)**: Green `#10b981` - True/false values
- **`j` (JSON)**: Indigo `#6366f1` - JSON objects and data
- **`a` (Array)**: Pink `#f472b6` - Lists and arrays
- **`x` (Any)**: Gray `#6b7280` - Any data type
- **`N` (BigInt)**: Purple `#a21caf` - Large integer values
- **`f` (Float)**: Yellow `#fbbf24` - Floating-point numbers
- **`u` (Undefined)**: Light Gray `#d1d5db` - Undefined values
- **`S` (Symbol)**: Gold `#eab308` - JavaScript symbols
- **`∅` (Null)**: Red `#ef4444` - Null values

---

## 🎯 Node Categories

### Main Logic
Core building blocks for logical operations and data processing.

### Media & Text
Tools for creating, editing, and transforming text and media content.

### Automation
Triggers, timers, and control mechanisms for flow automation.

### Integrations
Connections to external APIs, services, and data sources.

### Utilities
Helper nodes for debugging, testing, and development support.

---

## 🔍 Quick Search

Use Ctrl+F to quickly find specific nodes:
- **Text**: CreateText, TurnToUppercase, TurnToText
- **Logic**: LogicAnd, LogicOr, LogicNot, LogicXor, LogicXnor
- **Triggers**: TriggerOnClick, TriggerPulse, TriggerToggle
- **Counters**: CountPulse, CountToggle
- **Timing**: DelayPulse, CyclePulse, CycleToggle
- **Data**: EditObject, EditArray, ViewOutput, TestInput

---

## 💡 Tips for Node Usage

### Flow Design Patterns:
1. **Input → Process → Output**: Classic data transformation
2. **Trigger → Logic → Action**: Event-driven workflows
3. **Source → Transform → Display**: Data presentation flows
4. **Timer → Counter → Condition**: Automated sequences

### Best Practices:
- Use ViewOutput nodes to debug intermediate values
- Group related operations with consistent data types
- Use TestInput for development and testing
- Combine logic nodes for complex conditions
- Use triggers to control flow execution timing

### Performance Tips:
- Minimize unnecessary data conversions
- Use appropriate data types for handles
- Avoid deeply nested object operations
- Consider using delays for intensive operations

---

## 📚 Related Documentation

- **Creating New Nodes**: `docs/creating-new-nodes.md` - Step-by-step node development
- **Node Styling Guide**: `docs/node-styling-guide.md` - Comprehensive styling system
- **Architecture Overview**: `docs/documentation.md` - System architecture and patterns

---

*This guide is regularly updated as new nodes are added to the visual flow editor. Last updated: Current session.* 