# V2U Node Inspector Upgrade Guide

## 🎯 **V2U Node Inspector - Complete System Integration**

The Node Inspector has been successfully upgraded to support the **V2U (V2 Upgrade) system** with complete integration of the `defineNode()` architecture, providing enterprise-grade monitoring, debugging, and management capabilities.

---

## 📋 **What's New in V2U**

### **🚀 Core V2U Features**

- ✅ **Complete `defineNode()` integration** - Automatic detection and enhanced support for V2U nodes
- ✅ **Real-time lifecycle monitoring** - Track onMount, onUnmount, onDataChange, onValidation hooks
- ✅ **Security violation tracking** - Monitor auth failures, permission violations, rate limiting
- ✅ **Performance metrics visualization** - Execution time, memory usage, cache hit rates
- ✅ **Event system integration** - Real-time event monitoring and history
- ✅ **Plugin status monitoring** - Track enabled plugins and their health
- ✅ **Advanced debugging tools** - Enhanced debugging with V2U system insights
- ✅ **Backwards compatibility** - Existing code works without changes

### **🎨 Enhanced UI Features**

- **Tabbed interface** for organized V2U system inspection
- **System health indicators** with visual status badges
- **Real-time metrics** with automatic refresh
- **Debug mode toggle** for advanced diagnostics
- **V2U metadata display** with migration status
- **Interactive controls** for testing lifecycle hooks

---

## 🚀 **Quick Start**

### **Using the Enhanced Inspector**

```typescript
// Option 1: Use V2U Enhanced Inspector (Recommended)
import { NodeInspectorV2U } from '@/infrastructure/node-inspector';

function MyFlowEditor() {
  return (
    <div className="flow-editor">
      <ReactFlow>
        {/* Your flow content */}
      </ReactFlow>

      {/* V2U Enhanced Inspector */}
      <NodeInspectorV2U />
    </div>
  );
}

// Option 2: Continue using original (automatic V2U enhancement)
import { NodeInspector } from '@/infrastructure/node-inspector';

function LegacyFlowEditor() {
  return (
    <div className="flow-editor">
      <ReactFlow>
        {/* Your flow content */}
      </ReactFlow>

      {/* Original Inspector with V2U detection */}
      <NodeInspector />
    </div>
  );
}
```

### **V2U State Monitoring**

```typescript
import { useV2UState } from '@/infrastructure/node-inspector';

function V2UNodeMonitor({ node }) {
  const {
    v2uState,
    isV2UNode,
    systemHealth,
    hasLifecycleHooks,
    hasSecurityViolations,
    hasPerformanceIssues,
    refreshV2UState,
    triggerLifecycleHook,
  } = useV2UState(node);

  if (!isV2UNode) {
    return <div>Legacy node - consider migrating to defineNode()</div>;
  }

  return (
    <div className="v2u-monitor">
      <div>System Health: {systemHealth}</div>
      <div>Lifecycle Hooks: {hasLifecycleHooks ? 'Active' : 'Inactive'}</div>
      <div>Security Status: {hasSecurityViolations ? 'Issues' : 'Clean'}</div>
      <div>Performance: {hasPerformanceIssues ? 'Issues' : 'Good'}</div>

      <button onClick={refreshV2UState}>Refresh State</button>
      <button onClick={() => triggerLifecycleHook('onMount')}>
        Test onMount
      </button>
    </div>
  );
}
```

---

## 📊 **V2U Inspector Interface**

### **Tab Navigation**

The V2U inspector provides a tabbed interface for organized system inspection:

| Tab                | Description                  | Features                                |
| ------------------ | ---------------------------- | --------------------------------------- |
| **📋 Overview**    | System status and metadata   | V2U info, health status, quick stats    |
| **🔄 Lifecycle**   | Lifecycle hooks monitoring   | Hook execution status, timing, testing  |
| **🔒 Security**    | Security violations tracking | Auth failures, permissions, rate limits |
| **⚡ Performance** | Performance metrics          | Execution time, memory, cache rates     |
| **📡 Events**      | Event system integration     | Event history, real-time monitoring     |
| **🧩 Plugins**     | Plugin status monitoring     | Enabled plugins, health checks          |
| **🐛 Debug**       | Advanced debugging tools     | System state, validation, diagnostics   |

### **System Health Indicators**

Visual indicators show the overall health of V2U nodes:

- 🟢 **Healthy** - All systems operating normally
- 🟡 **Warning** - Performance issues detected
- 🔴 **Error** - Security violations or critical issues
- ⚫ **Critical** - System failures requiring immediate attention

---

## 🔧 **Advanced Configuration**

### **V2U Inspector Configuration**

```typescript
import { V2U_INSPECTOR_CONFIG } from "@/infrastructure/node-inspector";

// Customize V2U inspector behavior
const customConfig = {
  ...V2U_INSPECTOR_CONFIG,
  DEFAULT_REFRESH_INTERVAL: 3000, // 3 seconds
  AUTO_REFRESH_ON_CHANGES: true,
  DEBUG_MODE_STORAGE_KEY: "my-app-v2u-debug",
  HIGHLIGHT_PERFORMANCE_ISSUES: true,
  HIGHLIGHT_SECURITY_VIOLATIONS: true,
};
```

### **Custom V2U Lifecycle Inspector**

```typescript
import { V2ULifecycleInspector } from '@/infrastructure/node-inspector';

function CustomLifecycleMonitor({ node }) {
  const { v2uState, refreshV2UState } = useV2UState(node);

  const handleCustomLifecycleAction = async (hook) => {
    console.log(`Custom action for ${hook}`);
    // Your custom logic here
  };

  return (
    <V2ULifecycleInspector
      node={node}
      v2uState={v2uState}
      onRefresh={refreshV2UState}
      debugMode={true}
      onTriggerLifecycle={handleCustomLifecycleAction}
    />
  );
}
```

---

## 🎨 **Styling and Theming**

### **V2U Status Colors**

The inspector uses consistent color schemes for status indication:

```typescript
import { V2U_UI_CONFIG } from "@/infrastructure/node-inspector";

const statusColors = V2U_UI_CONFIG.STATUS_COLORS;
// {
//   healthy: 'text-green-600 bg-green-50 border-green-200',
//   warning: 'text-yellow-600 bg-yellow-50 border-yellow-200',
//   error: 'text-red-600 bg-red-50 border-red-200',
//   critical: 'text-red-800 bg-red-100 border-red-300',
//   unknown: 'text-gray-600 bg-gray-50 border-gray-200',
// }
```

### **Custom Styling**

```css
/* Custom V2U Inspector Styles */
.v2u-inspector-enhanced {
  --v2u-primary: #3b82f6;
  --v2u-success: #10b981;
  --v2u-warning: #f59e0b;
  --v2u-error: #ef4444;
  --v2u-critical: #dc2626;
}

.v2u-tab-active {
  background: var(--v2u-primary);
  color: white;
}

.v2u-health-indicator {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0.75rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
}
```

---

## 🧪 **Testing and Debugging**

### **V2U Debug Mode**

Enable debug mode for detailed V2U system insights:

```typescript
// Enable via UI toggle or programmatically
localStorage.setItem("v2u-inspector-debug-mode", "true");

// Or use the hook
const { v2uDebugState } = useInspectorState(node);
v2uDebugState.toggle(); // Toggle debug mode
```

### **Manual Lifecycle Testing**

Test lifecycle hooks manually for debugging:

```typescript
const { triggerLifecycleHook } = useV2UState(node);

// Test individual hooks
await triggerLifecycleHook("onMount");
await triggerLifecycleHook("onDataChange");
await triggerLifecycleHook("onValidation");
```

### **Performance Monitoring**

Monitor V2U performance metrics:

```typescript
const { v2uState, clearPerformanceMetrics } = useV2UState(node);

const performanceMetrics = v2uState?.performance;
console.log("Execution Count:", performanceMetrics?.executionCount);
console.log("Average Time:", performanceMetrics?.averageExecutionTime);
console.log("Memory Usage:", performanceMetrics?.memoryUsage);

// Clear metrics for fresh monitoring
clearPerformanceMetrics();
```

---

## 🔄 **Migration Guide**

### **From Original NodeInspector**

No breaking changes! The upgrade is backwards compatible:

```typescript
// Before (still works)
import { NodeInspector } from "@/infrastructure/node-inspector";

// After (enhanced features)
import { NodeInspectorV2U } from "@/infrastructure/node-inspector";
// OR
import NodeInspector from "@/infrastructure/node-inspector"; // Now defaults to V2U
```

### **Detecting V2U Nodes**

Check if a node supports V2U features:

```typescript
import { isV2UNode, getV2UCapabilities } from "@/infrastructure/node-inspector";

// Simple check
if (isV2UNode(node)) {
  console.log("Node supports V2U features");
}

// Detailed capabilities
const capabilities = getV2UCapabilities(node);
console.log("V2U Capabilities:", capabilities);
// {
//   isV2U: true,
//   capabilities: ['lifecycle', 'security', 'performance'],
//   version: '2.0.0',
//   migrationDate: 1703123456789
// }
```

### **Enhanced Error Handling**

V2U provides enhanced error categorization:

```typescript
// V2U enhanced error types
const errorTypes = [
  "error", // General errors
  "warning", // Warnings
  "info", // Information
  "security", // Security violations
  "performance", // Performance issues
  "lifecycle", // Lifecycle hook errors
];

// Enhanced error objects include:
const enhancedError = {
  timestamp: Date.now(),
  message: "Error message",
  type: "security",
  category: "system",
  severity: "high",
  recoverable: true,
  nodeId: "node-123",
  stackTrace: "...",
  context: { userId: "user-456" },
};
```

---

## 📈 **Performance Benefits**

### **V2U System Optimizations**

- **Real-time monitoring** with minimal performance impact
- **Intelligent caching** of V2U state and metrics
- **Debounced updates** to prevent excessive re-renders
- **Memory-efficient** event history management
- **Lazy loading** of V2U components when not needed

### **Performance Metrics**

The V2U inspector tracks:

- **Execution time** - Average, min, max execution times
- **Memory usage** - Current memory consumption
- **Cache hit rates** - Performance of caching systems
- **Timeout violations** - Executions exceeding time limits
- **Retry counts** - Number of retry attempts

---

## 🔧 **Troubleshooting**

### **Common Issues**

**Q: V2U features not showing for my node**

```typescript
// Check if node is V2U compatible
const capabilities = getV2UCapabilities(node);
if (!capabilities.isV2U) {
  console.log("Node needs to be migrated to defineNode()");
}
```

**Q: Performance metrics not updating**

```typescript
// Manually refresh V2U state
const { refreshV2UState } = useV2UState(node);
await refreshV2UState();
```

**Q: Debug mode not persisting**

```typescript
// Check localStorage availability
if (typeof localStorage !== "undefined") {
  localStorage.setItem("v2u-inspector-debug-mode", "true");
}
```

### **Debug Information**

Access comprehensive debug information:

```typescript
const { debugInfo } = useInspectorState(node);
console.log("V2U Debug Info:", debugInfo);
// {
//   nodeId: 'node-123',
//   nodeType: 'createTextV2U',
//   isV2UNode: true,
//   systemHealth: 'healthy',
//   hasLifecycleHooks: true,
//   hasSecurityViolations: false,
//   hasPerformanceIssues: false,
//   lastRefresh: 1703123456789,
//   isLoading: false,
//   error: null
// }
```

---

## 📚 **API Reference**

### **Main Components**

- `NodeInspectorV2U` - Enhanced inspector with V2U features
- `V2ULifecycleInspector` - Lifecycle hooks monitoring
- `NodeInspector` - Original inspector (V2U enhanced)

### **Hooks**

- `useV2UState(node)` - Complete V2U state management
- `useInspectorState(node)` - Enhanced inspector state (V2U compatible)
- `useEnhancedInspectorState(node)` - Alias for compatibility

### **Utilities**

- `isV2UNode(node)` - Check V2U compatibility
- `getV2UCapabilities(node)` - Get V2U feature set
- `V2U_INSPECTOR_INFO` - System information

---

## 🎯 **Next Steps**

1. **Try the V2U inspector** with your existing nodes
2. **Migrate nodes to `defineNode()`** for full V2U features
3. **Enable debug mode** to explore V2U capabilities
4. **Monitor performance** using V2U metrics
5. **Customize styling** to match your application

The V2U upgrade provides a solid foundation for advanced node system monitoring and debugging while maintaining complete backwards compatibility with existing code.

---

**🚀 The V2U Node Inspector is ready for production use!**
