# Test Nodes Guide

Documentation for all testing and debugging nodes used for error generation and system validation.

---

## TestError

**File:** `domains/test/TestError.tsx`
**Display Name:** Error Generator (Refactored)
**Category:** test

### Overview

• **Error Generation System** - Creates configurable errors for testing error handling throughout the flow
• **Multiple Error Types** - Supports warning (yellow), error (orange), and critical (red) error levels
• **Trigger Mode Control** - Three activation modes: always generate, trigger on, or trigger off
• **Connected Node Impact** - Propagates error states to connected nodes via JSON output for comprehensive testing
• **Manual/Automatic Activation** - Both manual button activation and trigger-based automatic error generation

### Key Features

- **Input Handles:** Boolean input (`b`) for trigger-based activation
- **Output Handles:** JSON output (`j`) for Vibe Mode error propagation to connected nodes
- **Activation Controls:** Activate/Reset button with visual state indicators
- **Error Configuration:** Customizable error messages, types, and trigger modes
- **System Integration:** Creates actual console errors (warn/error) for debugging purposes

### Configuration Options

- **Error Types:** Warning, Error, Critical (with different visual styling)
- **Trigger Modes:** Always, Trigger On (when input is true), Trigger Off (when input is false)
- **Error Messages:** Fully customizable error text for specific testing scenarios
- **State Management:** Tracks activation state, generation status, and manual override conditions

---

_Total Test Nodes: 1_
