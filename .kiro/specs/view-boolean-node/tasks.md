# Implementation Plan

## Current Status Analysis

The existing `viewBoolean.node.tsx` file is **incorrectly implemented** as a text input/display node rather than a boolean visualization node. It needs to be completely rewritten to match the requirements.

- [x] 1. ~~Set up core node structure and schema~~ **NEEDS COMPLETE REWRITE**

  - ❌ Current schema uses `store: text` instead of `booleanValue: boolean`
  - ❌ Current handles include JSON and String instead of Boolean input/output
  - ❌ Current implementation is a textarea-based text node, not boolean visualization
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [ ] 2. **REWRITE: Fix data schema for boolean visualization**

  - Replace text-based schema with proper boolean schema from design
  - Add `booleanValue`, `inputs`, `output` as boolean/nullable fields
  - Remove text-related fields like `store`
  - Update TypeScript types to match boolean visualization purpose
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [ ] 3. **REWRITE: Fix NodeSpec configuration for boolean handles**

  - Replace current handles with boolean-input (left) and boolean-output (right)
  - Remove JSON and String handles, use only Boolean dataType
  - Update icon from "LuDatabase" to boolean-appropriate icon (e.g., "LuToggleLeft")
  - Fix description and tags to reflect boolean visualization purpose
  - _Requirements: 1.1, 2.1, 2.2, 2.3_

- [ ] 4. **REWRITE: Implement boolean input processing logic**

  - Replace text input logic with boolean value detection
  - Implement computeInput function to read boolean values from connected nodes
  - Add type validation and coercion for non-boolean inputs (as per design)
  - Handle null/undefined inputs gracefully with proper state indication
  - _Requirements: 1.1, 1.2, 4.1, 4.2, 4.3_

- [ ] 5. **REWRITE: Implement boolean output propagation**

  - Replace text output with boolean pass-through functionality
  - Ensure output updates immediately when input changes
  - Handle disabled/inactive states properly
  - Add output clearing when disconnected
  - _Requirements: 2.1, 2.2, 2.3_

- [ ] 6. **REWRITE: Build boolean visual display components**

  - Remove textarea and replace with boolean state indicators
  - Create true state visual (green, checkmark, "TRUE")
  - Create false state visual (red, X mark, "FALSE")
  - Create null/undefined state (gray, dash, "NULL")
  - Create disconnected state (muted, "NO INPUT")
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [ ] 7. **REWRITE: Implement collapsed state boolean rendering**

  - Replace text display with compact boolean indicator (60x60)
  - Add color coding for different boolean states
  - Implement icon-only display with tooltips
  - Ensure visual clarity in minimal space
  - _Requirements: 3.1, 3.3_

- [ ] 8. **REWRITE: Implement expanded state boolean rendering**

  - Replace expanded textarea with icon + text boolean display (120x120)
  - Add clear boolean value text indicators
  - Implement readable layout for debugging boolean states
  - Keep expand/collapse toggle functionality
  - _Requirements: 3.2, 3.3_

- [ ] 9. **REWRITE: Fix state management for boolean values**

  - Replace text-based state management with boolean state tracking
  - Update active state based on boolean input availability
  - Create proper boolean output propagation effects
  - Handle boolean connection/disconnection state changes
  - _Requirements: 1.1, 1.2, 2.1, 2.2, 4.3_

- [ ] 10. **UPDATE: Fix validation for boolean schema**

  - Update Zod schema validation to use new boolean schema
  - Fix error reporting for boolean validation failures
  - Add graceful handling of invalid boolean inputs
  - Create fallback states for boolean error conditions
  - _Requirements: 4.1, 4.2, 4.3_

- [ ] 11. **UPDATE: Add boolean-specific accessibility features**

  - Implement ARIA labels for boolean states (true/false/null/disconnected)
  - Add screen reader support for boolean state changes
  - Ensure keyboard navigation works with boolean indicators
  - Test color contrast ratios for boolean state indicators
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [ ] 12. **KEEP: Maintain performance optimization patterns**

  - Keep React.memo for component optimization
  - Keep useCallback for stable function references
  - Update dependencies for boolean-specific logic
  - Keep refs for preventing unnecessary updates
  - _Requirements: 3.3_

- [ ] 13. **KEEP: Maintain scaffolded component structure**

  - Keep ViewBooleanNodeWithDynamicSpec wrapper pattern
  - Keep withNodeScaffold integration
  - Update spec injection for boolean functionality
  - Keep dynamic sizing functionality
  - _Requirements: 3.1, 3.2, 3.3_

- [ ] 14. Write comprehensive unit tests for boolean functionality

  - Test boolean input processing (true, false, null)
  - Test type coercion for non-boolean inputs
  - Test boolean output propagation functionality
  - Test visual state rendering for all boolean states
  - Test edge cases and error handling for boolean values
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 4.1, 4.2, 4.3_

- [ ] 15. Add integration tests for boolean node

  - Test node connections with boolean source nodes
  - Test connections with non-boolean source nodes (type coercion)
  - Test connection removal and reconnection
  - Test integration with other view nodes in workflows
  - _Requirements: 2.1, 2.2, 2.3, 4.1, 4.2, 4.3_

- [ ] 16. Create view domain index export

  - Create `features/business-logic-modern/node-domain/view/index.ts`
  - Export the viewBoolean node for registration
  - Add proper TypeScript exports for the domain
  - _Requirements: All requirements (enables node usage)_

- [ ] 17. Implement visual and accessibility testing
  - Test collapsed vs expanded boolean state rendering
  - Test theme compatibility (light/dark mode) for boolean indicators
  - Test screen reader compatibility with boolean states
  - Test keyboard navigation and focus management
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 3.1, 3.2, 3.3_
