# Trigger Nodes Guide

Documentation for all trigger-based nodes that manage boolean states and activation events.

---

## TriggerOnToggle

**File:** `domains/trigger/TriggerOnToggle.tsx`
**Display Name:** 🔧 Toggle Trigger (Refactored)
**Category:** trigger

### Overview

• **Boolean State Management** - Maintains internal triggered/untriggered state with visual indicators
• **Manual Toggle Control** - Click-to-toggle functionality with immediate state updates
• **External Input Support** - Accepts boolean connections from other nodes for remote triggering
• **Factory Architecture** - Built using the refactored node factory system for enhanced reliability
• **Inspector Integration** - Full inspector panel support with runtime state monitoring and debug info

### Key Features

- **Input Handles:** Boolean input (`b_in`) for external triggering
- **Output Handles:** Boolean output (`b_out`) propagating current state
- **Visual States:** ON/OFF indicator with size-adaptive display (60x60 collapsed, 120x120 expanded)
- **Error Recovery:** Built-in error injection support for testing scenarios
- **State Persistence:** Maintains toggle state across UI interactions and connections

---

_Total Trigger Nodes: 1_
