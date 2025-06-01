# Create Nodes Guide

Documentation for all creation and input nodes that generate or capture data for the flow system.

---

## CreateText

**File:** `domains/create/CreateText.tsx`
**Display Name:** Create Text (Refactored)
**Category:** create

### Overview

• **Text Input System** - Inline text editing with real-time output to connected nodes
• **Trigger-Based Control** - Conditional text output based on boolean trigger connections
• **Memory-Safe Processing** - Built-in validation preventing memory issues with large text inputs (100k character limit)
• **Error State Support** - Vibe Mode error injection for testing error handling scenarios
• **Factory Architecture** - Enhanced factory-created component with comprehensive error recovery

### Key Features

- **Input Handles:** Boolean input (`b`) for trigger-based output control
- **Output Handles:** String output (`s`) providing text content to connected nodes
- **Inline Editing:** Direct text editing in both collapsed and expanded states
- **Text Storage:** Maintains `heldText` (user input) and `text` (current output) separately
- **Visual States:** Adaptive UI showing text preview in collapsed mode, full editor in expanded mode

### Behavior Logic

- **No Trigger Connected:** Always outputs the held text
- **Trigger Connected + Active:** Outputs the held text when trigger is true
- **Trigger Connected + Inactive:** Outputs empty string when trigger is false
- **Error States:** Visual error indicators with type-specific styling (warning/error/critical)
- **Input Validation:** Prevents memory issues and provides user feedback for invalid inputs

---

_Total Create Nodes: 1_
