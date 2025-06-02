# 🎯 COMPREHENSIVE NODE STANDARDS v1.1.0

**Updated:** June 2025 v1.1.0
**Summary:** Complete high-level overview of node standards covering styling, behaviors, properties, capabilities, and restrictions for the modern node-based workflow system.

## 📋 OVERVIEW

This document defines the comprehensive standards for all nodes in the Agenitix modern workflow system. Every node follows these patterns to ensure consistency, predictability, and maintainability across the entire platform.

## 🎨 STYLING STANDARDS

### **Visual States**

All nodes maintain exactly **two visual states**:

- **Collapsed State**: Compact icon view for canvas overview
- **Expanded State**: Full UI view for detailed interaction

### **State Transition**

- Toggle button positioned in **top-left corner** of every node
- Smooth animation between collapsed and expanded states
- State preserved during workflow operations

### **Standardized Sizing**

All nodes use **Tailwind CSS classes** for consistent dimensions:

- **Collapsed**: 60x60, 120x60, 120x120, or 180x180 pixels
- **Expanded**: Fixed heights (60-240px) or variable width with auto height
- **Responsive**: Adapts to content while maintaining visual hierarchy

### **Category-Based Theming**

Visual appearance determined by **functional category**:

- **Create Nodes**: Blue color scheme for content generation
- **Trigger Nodes**: Purple color scheme for action initiation
- **Test Nodes**: Yellow/Orange color scheme for debugging/testing
- **View Nodes**: Green color scheme for data visualization
- **Cycle Nodes**: Gray color scheme for automation (reserved)

### **Selection & Activation Indicators**

- **Selected State**: White glow around node border
- **Active State**: Green glow indicating data processing/passing
- **Error State**: Red/Orange glow with error type indicators
- **Loading State**: Subtle animation during processing

## 🔧 UNIVERSAL NODE PROPERTIES

### **What ALL Nodes Have**

#### **Core Structure**

- **Display Name**: Human-readable identifier
- **Node Type**: Unique system identifier
- **Category Assignment**: Functional domain classification
- **Size Configuration**: Standardized dimensional properties

#### **Data Management**

- **Internal Data**: Private node state not passed to other nodes
- **Output Data**: Processed information available to connected nodes
- **Default Data**: Initial state configuration
- **Error Recovery Data**: Fallback state for error scenarios

#### **Connection System**

- **Input Handles**: Typed connection points for receiving data
- **Output Handles**: Typed connection points for sending data
- **JSON Parameter Input**: Universal configuration interface
- **JSON Data Input**: Universal external data interface

#### **Interactive Elements**

- **Inspector Controls**: Runtime parameter adjustment interface
- **Selection Capability**: Click-to-select functionality
- **Drag & Drop Support**: Canvas repositioning
- **Context Menu Integration**: Right-click options

#### **State Management**

- **Persistent Storage**: Configuration and state backup
- **Type Safety**: TypeScript validation throughout
- **Error Handling**: Graceful failure and recovery systems
- **Version Compatibility**: Forward and backward compatibility support

## ⚡ UNIVERSAL NODE CAPABILITIES

### **What ALL Nodes Can Do**

#### **Data Operations**

- **Receive External Data**: Accept input from connected nodes
- **Process Information**: Transform or analyze received data
- **Generate Output**: Produce data for downstream nodes
- **Validate Input**: Ensure data integrity and type safety

#### **State Management**

- **Maintain Internal State**: Preserve configuration between sessions
- **Update Configuration**: Modify parameters through inspector
- **Reset to Defaults**: Return to initial state when needed
- **Handle Errors**: Recover from processing failures

#### **Connection Behavior**

- **Multi-Input Support**: Accept multiple simultaneous connections
- **Output Broadcasting**: Send data to multiple connected nodes
- **Conditional Processing**: React to trigger states and boolean inputs
- **Type Negotiation**: Validate connection compatibility

#### **User Interaction**

- **Real-time Updates**: Reflect changes immediately in UI
- **Parameter Adjustment**: Allow runtime configuration changes
- **Visual Feedback**: Provide status and state indicators
- **Context Sensitivity**: Adapt behavior based on workflow context

## 🚫 UNIVERSAL NODE RESTRICTIONS

### **What ALL Nodes Cannot Do**

#### **System Boundaries**

- **File System Access**: Cannot read/write local files directly
- **Network Requests**: Cannot make external HTTP/API calls independently
- **System Commands**: Cannot execute shell commands or system operations
- **Memory Manipulation**: Cannot access or modify system memory directly

#### **Cross-Domain Limitations**

- **Legacy Integration**: Cannot directly interface with legacy node systems
- **External Dependencies**: Cannot require external libraries not in framework
- **Database Operations**: Cannot perform direct database transactions
- **Authentication**: Cannot handle user authentication or security tokens

#### **State Violations**

- **Global State Mutation**: Cannot modify application-wide state directly
- **Node Interference**: Cannot access or modify other nodes' internal data
- **System Configuration**: Cannot change framework settings or configurations
- **Version Conflicts**: Cannot operate outside version compatibility matrix

## 🔄 CONDITIONAL NODE FEATURES

### **What Nodes Sometimes Have**

#### **Optional Input Systems**

- **Boolean Trigger Input**: Activation control (common in automation nodes)
- **Multiple Data Inputs**: Various typed connection points as needed
- **Parameter Inputs**: External configuration interfaces
- **File Upload Capability**: For nodes requiring external content

#### **Enhanced UI Elements**

- **Custom Inspector Controls**: Specialized parameter interfaces
- **Real-time Previews**: Live output visualization
- **Progress Indicators**: For long-running operations
- **Error Detail Panels**: Comprehensive error reporting

#### **Advanced Behaviors**

- **Memory/Cache Systems**: For performance optimization
- **Background Processing**: For non-blocking operations
- **Event Scheduling**: For time-based operations
- **Data Transformation**: For format conversion operations

### **What Nodes Sometimes Can Do**

#### **Specialized Processing**

- **Asynchronous Operations**: Background processing for complex tasks
- **Batch Processing**: Handle multiple inputs simultaneously
- **Data Validation**: Enforce business rules and constraints
- **Format Conversion**: Transform data between different types

#### **Advanced Interactions**

- **Multi-step Workflows**: Coordinate complex operation sequences
- **Conditional Logic**: Branch execution based on input conditions
- **Loop Operations**: Repeat processing with iteration control
- **State Persistence**: Maintain data across workflow sessions

#### **Integration Capabilities**

- **Template Systems**: Generate dynamic content from patterns
- **Configuration Profiles**: Save and load different parameter sets
- **Export Functionality**: Package results for external use
- **Import Processing**: Handle external data sources

## ❌ ABSOLUTE NODE PROHIBITIONS

### **What Nodes Can NEVER Do**

#### **Security Violations**

- **Arbitrary Code Execution**: Cannot run unvalidated or dynamic code
- **Privilege Escalation**: Cannot gain elevated system permissions
- **Data Exfiltration**: Cannot transmit data to unauthorized destinations
- **System Exploitation**: Cannot exploit vulnerabilities or backdoors

#### **Framework Violations**

- **Type System Bypass**: Cannot circumvent TypeScript type safety
- **Factory Pattern Breaking**: Cannot operate outside factory creation patterns
- **Registry Manipulation**: Cannot modify node registry at runtime
- **Version Incompatibility**: Cannot operate with incompatible versions

#### **Architectural Violations**

- **Circular Dependencies**: Cannot create infinite reference loops
- **Memory Leaks**: Cannot create unmanaged memory allocations
- **Performance Blocking**: Cannot block main thread indefinitely
- **State Corruption**: Cannot corrupt workflow or system state

## 📊 NODE DOMAIN CLASSIFICATION

### **Create Domain**

- **Purpose**: Content and data generation
- **Examples**: Text creation, data input, content templates
- **Characteristics**: Source nodes, minimal inputs, rich outputs

### **Trigger Domain**

- **Purpose**: Workflow activation and control
- **Examples**: Manual triggers, boolean toggles, event listeners
- **Characteristics**: Control flow, conditional logic, state management

### **Test Domain**

- **Purpose**: Debugging, testing, and development support
- **Examples**: Error generators, data viewers, validation nodes
- **Characteristics**: Development tools, debugging aids, test harnesses

### **View Domain**

- **Purpose**: Data visualization and output display
- **Examples**: Data viewers, output formatters, display components
- **Characteristics**: Terminal nodes, data presentation, user feedback

### **Cycle Domain** (Reserved)

- **Purpose**: Automation and recurring operations
- **Examples**: Scheduled tasks, loops, batch processing
- **Characteristics**: Time-based, iterative, automated workflows

## 🔗 INTEGRATION STANDARDS

### **Inspector Integration**

- All nodes provide standardized inspector controls
- Parameter types automatically generate appropriate UI elements
- Real-time validation and feedback for all inputs
- Consistent styling and interaction patterns

### **Registry Integration**

- All nodes registered through centralized modern registry
- Automatic handle generation and validation
- Type-safe registration with full metadata
- Version-aware compatibility checking

### **Factory Integration**

- All nodes created through standardized factory pattern
- Consistent lifecycle management and error handling
- Automatic sizing and theming application
- Unified processing and rendering pipeline

## 🚀 QUALITY STANDARDS

### **Performance Requirements**

- **Rendering**: Sub-100ms response for state changes
- **Processing**: Non-blocking operations for UI responsiveness
- **Memory**: Efficient cleanup and garbage collection
- **Scalability**: Support for workflows with 100+ nodes

### **Reliability Standards**

- **Error Recovery**: Graceful handling of all error scenarios
- **Data Integrity**: Type-safe operations with validation
- **State Consistency**: Reliable state management across sessions
- **Version Stability**: Backward compatibility preservation

### **Usability Standards**

- **Discoverability**: Clear naming and categorization
- **Learnability**: Intuitive operation patterns
- **Accessibility**: Keyboard navigation and screen reader support
- **Responsiveness**: Consistent behavior across different contexts

---

**This comprehensive standard ensures all nodes provide a consistent, reliable, and predictable experience while maintaining the flexibility needed for diverse workflow requirements. Every node implementation must adhere to these standards to ensure system integrity and user experience quality.**
