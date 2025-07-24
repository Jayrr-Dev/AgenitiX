# Node Memory System Guide

> **Transform each node into an independent programmable computer with persistent memory, intelligent caching, and advanced analytics**

---

## 🧠 **Overview**

The Node Memory System turns each node in AgenitiX into a **mini programmable computer** with its own isolated memory space. Each node can store, cache, and compute data independently, making workflows more intelligent and efficient.

### **Key Features**
- **🔒 Isolated Memory** - Each node has its own secure memory space
- **💾 Persistent Storage** - Data survives across workflow executions
- **🧹 Smart Cleanup** - Automatic garbage collection with configurable policies
- **📊 Real-time Analytics** - Memory usage monitoring and optimization
- **⚡ High Performance** - LRU, LFU, FIFO, and TTL eviction strategies
- **🎯 Type Safety** - Full TypeScript integration with validation

---

## 🚀 **Quick Start**

### **1. Enable Memory in NodeSpec**
```typescript
const spec: NodeSpec = {
  kind: "myNode",
  displayName: "My Node",
  // ... other properties
  
  // Enable memory with configuration
  memory: {
    maxSize: 10 * 1024 * 1024,  // 10MB
    maxEntries: 1000,           // Max 1000 cache entries
    defaultTTL: 3600 * 1000,    // 1 hour TTL
    persistent: true,           // Survive page refreshes
    evictionPolicy: 'LRU',      // Least Recently Used
    analytics: true             // Enable monitoring
  }
};
```

### **2. Use Memory in Your Node Component**
```typescript
import { useNodeMemory } from "@/infrastructure/node-core/useNodeMemory";

const MyNodeComponent = ({ data, id }: NodeProps) => {
  const memory = useNodeMemory(id);
  
  // Store data
  const cacheResult = memory.set('user_data', { name: 'John', age: 30 });
  
  // Retrieve data
  const userData = memory.get('user_data');
  if (userData.success) {
    console.log('Retrieved:', userData.data);
  }
  
  // Computed caching
  const expensiveResult = await memory.compute('expensive_calc', async () => {
    return performExpensiveCalculation();
  }, 300000); // Cache for 5 minutes
  
  return <div>My Node Content</div>;
};
```

---

## 💾 **Memory Operations**

### **Basic Operations**
```typescript
const memory = useNodeMemory(nodeId);

// Store data with optional TTL
memory.set('key', value, 60000); // Cache for 1 minute

// Retrieve data
const result = memory.get('key');
if (result.success) {
  console.log(result.data);
}

// Check existence
if (memory.has('key')) {
  console.log('Key exists');
}

// Delete data
memory.delete('key');

// Clear all memory
memory.clear();
```

### **Advanced Operations**
```typescript
// Computed caching - cache expensive operations
const result = await memory.compute('api_data', async () => {
  const response = await fetch('/api/data');
  return response.json();
}, 300000); // Cache for 5 minutes

// Tag-based operations
memory.setWithTags('user_1', userData, ['user', 'active']);
memory.setWithTags('user_2', userData2, ['user', 'inactive']);

// Get all keys with tag
const activeUsers = memory.getByTag('active');

// Delete all entries with tag
memory.deleteByTag('inactive');

// Batch operations for efficiency
memory.batch()
  .set('key1', value1)
  .set('key2', value2)
  .delete('old_key')
  .execute();
```

---

## 🎛️ **Memory Configuration**

### **Configuration Options**
```typescript
interface NodeMemoryConfig {
  maxSize?: number;           // Max memory in bytes (default: 1MB)
  maxEntries?: number;        // Max number of entries (default: 1000)
  defaultTTL?: number;        // Default TTL in ms (default: 1 hour)
  persistent?: boolean;       // Persist across sessions (default: false)
  evictionPolicy?: 'LRU' | 'LFU' | 'FIFO' | 'TTL'; // Eviction strategy
  analytics?: boolean;        // Enable analytics (default: true)
  serializer?: 'json' | 'msgpack' | 'custom'; // Serialization method
}
```

### **Eviction Policies**
- **LRU (Least Recently Used)** - Evicts least recently accessed items
- **LFU (Least Frequently Used)** - Evicts least frequently accessed items  
- **FIFO (First In, First Out)** - Evicts oldest items first
- **TTL (Time To Live)** - Evicts expired items first

### **Dynamic Configuration**
```typescript
// Configure memory based on node data
const memory = useNodeMemory(nodeId, {
  maxSize: nodeData.cacheSize * 1024 * 1024, // User-configurable
  evictionPolicy: nodeData.strategy,          // User-selectable
  persistent: nodeData.enablePersistence     // User toggle
});
```

---

## 📊 **Memory Analytics & Monitoring**

### **Real-time Metrics**
```typescript
const { metrics, isHealthy, needsCleanup } = useMemoryAnalytics(nodeId);

console.log({
  totalSize: metrics.totalSize,      // Memory usage in bytes
  entryCount: metrics.entryCount,    // Number of cached items
  hitRate: metrics.hitRate,          // Cache hit rate (0-1)
  missRate: metrics.missRate,        // Cache miss rate (0-1)
  memoryPressure: metrics.memoryPressure, // Memory pressure (0-1)
  evictionCount: metrics.evictionCount     // Number of evictions
});
```

### **Memory Monitor Component**
```typescript
import { NodeMemoryMonitor } from "@/infrastructure/node-core/NodeMemoryMonitor";

// Full memory monitor with controls
<NodeMemoryMonitor nodeId={nodeId} showControls={true} />

// Compact indicator for node headers
<NodeMemoryIndicator nodeId={nodeId} />

// Memory usage chart
<NodeMemoryChart nodeId={nodeId} height={100} />
```

### **Health Monitoring**
```typescript
const analytics = useMemoryAnalytics(nodeId);

if (analytics.needsCleanup) {
  // High memory pressure - suggest cleanup
  analytics.performGC();
}

if (!analytics.isHealthy) {
  // Memory issues detected
  console.warn('Node memory health issues detected');
}
```

---

## 🔧 **React Hooks**

### **useNodeMemory**
Primary hook for memory operations:
```typescript
const memory = useNodeMemory(nodeId, config);

// All memory operations available
memory.set(key, value, ttl);
memory.get(key);
memory.compute(key, computeFn, ttl);
memory.batch();
// ... etc
```

### **useMemoryState**
Combines React state with persistent memory:
```typescript
const [value, setValue, result] = useMemoryState(
  nodeId, 
  'my_key', 
  'default_value',
  60000 // TTL
);

// Acts like useState but persists to node memory
setValue('new_value');
```

### **useMemoryComputed**
For computed values with caching:
```typescript
const { data, loading, error, refresh } = useMemoryComputed(
  nodeId,
  'expensive_data',
  () => performExpensiveCalculation(),
  [dependency1, dependency2], // Dependencies
  300000 // Cache TTL
);
```

### **useMemoryAnalytics**
For monitoring and analytics:
```typescript
const {
  metrics,
  history,
  isHealthy,
  needsCleanup,
  performGC,
  clearMemory
} = useMemoryAnalytics(nodeId);
```

---

## 🎯 **Use Cases & Examples**

### **1. Email Template Caching**
```typescript
const EmailCacheNode = ({ data, id }: NodeProps) => {
  const memory = useNodeMemory(id);
  
  const cacheTemplate = async (template: EmailTemplate) => {
    return memory.setWithTags(
      `template_${template.id}`,
      template,
      ['template', 'email', template.category],
      3600000 // 1 hour TTL
    );
  };
  
  const getTemplate = async (templateId: string) => {
    return memory.compute(`template_${templateId}`, async () => {
      // Fetch from API if not cached
      const response = await fetch(`/api/templates/${templateId}`);
      return response.json();
    });
  };
};
```

### **2. API Response Caching**
```typescript
const APINode = ({ data, id }: NodeProps) => {
  const memory = useNodeMemory(id);
  
  const fetchData = async (endpoint: string) => {
    return memory.compute(`api_${endpoint}`, async () => {
      const response = await fetch(endpoint);
      return response.json();
    }, 300000); // Cache for 5 minutes
  };
};
```

### **3. User Session Management**
```typescript
const UserSessionNode = ({ data, id }: NodeProps) => {
  const memory = useNodeMemory(id, { persistent: true });
  
  const storeSession = (userId: string, sessionData: any) => {
    memory.setWithTags(
      `session_${userId}`,
      sessionData,
      ['session', 'user', userId],
      86400000 // 24 hour TTL
    );
  };
  
  const getActiveSessions = () => {
    return memory.getByTag('session');
  };
};
```

### **4. Machine Learning Model Cache**
```typescript
const MLModelNode = ({ data, id }: NodeProps) => {
  const memory = useNodeMemory(id, {
    maxSize: 100 * 1024 * 1024, // 100MB for models
    evictionPolicy: 'LFU'        // Keep frequently used models
  });
  
  const loadModel = async (modelId: string) => {
    return memory.compute(`model_${modelId}`, async () => {
      // Load expensive ML model
      const model = await loadMLModel(modelId);
      return model;
    }, 3600000); // Cache for 1 hour
  };
};
```

---

## 🔒 **Security & Best Practices**

### **Data Isolation**
- Each node has completely isolated memory
- No cross-node memory access possible
- Secure serialization prevents code injection

### **Memory Limits**
```typescript
// Set appropriate limits based on use case
const memory = useNodeMemory(nodeId, {
  maxSize: 10 * 1024 * 1024,  // 10MB limit
  maxEntries: 1000,           // Entry limit
  defaultTTL: 3600000         // 1 hour default TTL
});
```

### **Error Handling**
```typescript
const result = memory.set('key', value);
if (!result.success) {
  switch (result.code) {
    case 'MEMORY_FULL':
      // Handle memory full
      memory.gc(); // Force cleanup
      break;
    case 'INVALID_KEY':
      // Handle invalid key
      break;
    case 'SERIALIZATION_ERROR':
      // Handle serialization issues
      break;
  }
}
```

### **Performance Optimization**
```typescript
// Use batch operations for multiple updates
memory.batch()
  .set('key1', value1)
  .set('key2', value2)
  .set('key3', value3)
  .execute();

// Use appropriate TTL values
memory.set('short_lived', data, 60000);    // 1 minute
memory.set('medium_lived', data, 3600000); // 1 hour
memory.set('long_lived', data, 86400000);  // 24 hours

// Monitor memory pressure
if (memory.memoryPressure > 0.8) {
  memory.gc(); // Force cleanup
}
```

---

## 🛠️ **Development & Debugging**

### **Memory Inspector**
Add to your node component for debugging:
```typescript
{process.env.NODE_ENV === 'development' && (
  <NodeMemoryMonitor nodeId={id} showControls={true} />
)}
```

### **Console Debugging**
```typescript
// Log memory state
console.log('Memory metrics:', memory.getMetrics());
console.log('Memory keys:', memory.keys());
console.log('Memory size:', memory.size());

// Test memory operations
const testResult = memory.set('test', { data: 'test' });
console.log('Set result:', testResult);

const getResult = memory.get('test');
console.log('Get result:', getResult);
```

### **Performance Profiling**
```typescript
const startTime = performance.now();
const result = await memory.compute('expensive', expensiveFunction);
const endTime = performance.now();
console.log(`Operation took ${endTime - startTime}ms`);
```

---

## 🔮 **Advanced Features**

### **Custom Serialization**
```typescript
// For complex objects that need special handling
const memory = useNodeMemory(nodeId, {
  serializer: 'custom' // Implement custom serialization
});
```

### **Memory Snapshots**
```typescript
// Export memory state for debugging
const snapshot = {
  keys: memory.keys(),
  metrics: memory.getMetrics(),
  size: memory.size()
};
console.log('Memory snapshot:', snapshot);
```

### **Cross-Node Communication**
```typescript
// While nodes have isolated memory, you can use global state
// for controlled cross-node communication
const globalData = useGlobalState('shared_data');
memory.set('local_copy', globalData);
```

---

## 📈 **Performance Characteristics**

### **Operation Complexity**
- **Set/Get/Has/Delete**: O(1) average case
- **Tag operations**: O(n) where n = entries with tag
- **Garbage collection**: O(n) where n = total entries
- **Batch operations**: O(k) where k = batch size

### **Memory Overhead**
- **Per entry**: ~100-200 bytes metadata
- **Per node**: ~1-5KB base overhead
- **Analytics**: ~500 bytes per node

### **Recommended Limits**
- **Small nodes**: 1-10MB, 100-1000 entries
- **Medium nodes**: 10-50MB, 1000-5000 entries  
- **Large nodes**: 50-100MB, 5000-10000 entries

---

## 🎯 **Migration Guide**

### **From Simple State to Memory**
```typescript
// Before: Simple React state
const [data, setData] = useState(initialData);

// After: Persistent memory state
const [data, setData] = useMemoryState(nodeId, 'data_key', initialData);
```

### **From External Cache to Node Memory**
```typescript
// Before: External cache service
const cachedData = await externalCache.get(key);

// After: Node memory
const result = memory.get(key);
const cachedData = result.success ? result.data : null;
```

---

**The Node Memory System transforms AgenitiX nodes into truly independent, programmable computers with persistent memory, intelligent caching, and comprehensive monitoring. Each node becomes a mini-computer capable of sophisticated data management and computation.**