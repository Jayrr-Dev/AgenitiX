# View Nodes Guide

Documentation for all data viewing and output display nodes that visualize flow data.

---

## ViewOutputEnhanced

**File:** `domains/view/ViewOutputEnhanced.tsx`
**Display Name:** 📤 Enhanced View
**Category:** test

### Overview

• **Advanced Data Viewer** - Multi-format data display with comprehensive type detection and formatting
• **Smart Filtering System** - Configurable filters for empty values, duplicates, and specific data types
• **Historical Tracking** - Maintains value history with timestamps and configurable limits (default 10 items)
• **Type-Aware Display** - Color-coded type indicators with icons for strings, numbers, booleans, objects, arrays, etc.
• **Interactive Controls** - Toggle options for filtering, type icons, grouping, and display preferences

### Key Features

- **Input Handles:** Any type input (`x`) accepting all data types from connected nodes
- **Data Type Support:** Comprehensive handling of strings, numbers, booleans, objects, arrays, null, undefined, BigInt
- **Visual Indicators:** Color-coded type badges with icons and size information for collections
- **Filter Options:** Empty value filtering, duplicate detection, type-specific inclusion/exclusion
- **Performance Optimized:** Smart change detection prevents unnecessary re-renders and memory optimization

---

## ViewOutputRefactor

**File:** `domains/view/ViewOutputRefactor.tsx`
**Display Name:** 🔧 View Output (Refactored)
**Category:** view

### Overview

• **Simplified Data Display** - Streamlined viewer focused on core functionality with clean type indicators
• **Factory-Based Architecture** - Built using centralized registry system for consistency and maintainability
• **Smart Value Extraction** - Type-aware extraction with special handling for different node types (TestInput, etc.)
• **Meaningful Filtering** - Intelligent filtering excluding truly empty or meaningless values
• **Responsive Design** - Adaptive sizing (120x120 collapsed, 180x180 expanded) with overflow handling

### Key Features

- **Input Handles:** Any type input (`x`) for universal data acceptance
- **Type Detection:** Color-coded type indicators (string/blue, number/orange, boolean/green, etc.)
- **Content Formatting:** Safe stringification with fallback handling for complex data types
- **Change Detection:** Only updates when values actually change to optimize performance
- **Error Recovery:** Graceful error handling with fallback to empty state

### Display Logic

- **Collapsed State:** Shows preview of values with truncation for space efficiency
- **Expanded State:** Full data display with type labels and formatted content
- **Empty State Handling:** Clear messaging when no meaningful data is connected
- **Error State Display:** Dedicated error visualization with recovery guidance

---

_Total View Nodes: 2_
