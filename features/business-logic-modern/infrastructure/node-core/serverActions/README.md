# Server Actions for Nodes

This directory contains the enhanced server action system that allows nodes to perform server-side operations.

## ✅ **What Your Nodes Can Do**

### 1. **Database Operations via Convex**
```typescript
import { useConvexQuery, useConvexMutation } from './convexServerActions';

// In your node component:
const { data, loading, error } = useConvexQuery(
  'getNodeById', 
  { nodeId: id },
  { enabled: !!id, staleTime: 60000 }
);

const mutation = useConvexMutation('updateNode', {
  onSuccess: (result) => updateNodeData({ status: 'updated' }),
  onError: (error) => updateNodeData({ status: 'error' })
});
```

### 2. **Network Requests to External APIs**
```typescript
import { useCachedNetworkRequest } from './serverActionRegistry';

const { data } = useCachedNetworkRequest(
  nodeId,
  {
    url: 'https://api.example.com/data',
    method: 'GET',
    headers: { 'Authorization': 'Bearer token' }
  },
  { enabled: true, staleTime: 300000 }
);
```

### 3. **File System Operations**
```typescript
import { executeFileOperation } from './serverActionRegistry';

const fileResult = await executeFileOperation({
  type: 'write',
  path: `/tmp/node-${nodeId}-log.json`,
  content: JSON.stringify({ nodeId, timestamp: new Date() })
});
```

### 4. **UI State Updates**
```typescript
// Server actions automatically update node data via callbacks
const ctx = {
  nodeId,
  nodeKind,
  data,
  onStateUpdate: (updates) => updateNodeData(updates),
  onError: (error) => console.error('Server action failed:', error),
  onSuccess: (result) => console.log('Server action succeeded:', result)
};
```

## ✅ **How to Use in Your Nodes**

### **Step 1: Import Server Action Hooks**
```typescript
import { 
  useConvexQuery, 
  useConvexMutation 
} from '@/features/business-logic-modern/infrastructure/node-core/serverActions/convexServerActions';

import { 
  useCachedNetworkRequest,
  executeFileOperation 
} from '@/features/business-logic-modern/infrastructure/node-core/serverActions/serverActionRegistry';
```

### **Step 2: Use in Your Node Component**
```typescript
const MyNode = (props: NodeProps) => {
  const { id, data } = props;
  const { nodeData, updateNodeData } = useNodeData(id, data);

  // Database query
  const { data: dbData, loading } = useConvexQuery(
    'getNodeData',
    { nodeId: id },
    { enabled: !!id }
  );

  // Network request
  const { data: apiData } = useCachedNetworkRequest(
    id,
    { url: 'https://api.example.com', method: 'GET' }
  );

  // Update node data with results
  useEffect(() => {
    if (dbData) {
      updateNodeData({ 
        serverResult: dbData,
        lastUpdate: new Date().toISOString()
      });
    }
  }, [dbData, updateNodeData]);

  return (
    <div>
      {/* Your node UI */}
      {loading && <div>Loading...</div>}
      {dbData && <div>Data: {JSON.stringify(dbData)}</div>}
    </div>
  );
};
```

### **Step 3: Automatic Server Actions**
Server actions run automatically when nodes are mounted via `withNodeScaffold`. You can register custom server actions:

```typescript
import { registerServerAction } from './serverActionRegistry';

const myServerAction = async (ctx) => {
  const { nodeId, nodeKind, data, onStateUpdate, onError, onSuccess } = ctx;
  
  try {
    // Your server-side logic here
    const result = await someServerOperation(nodeId);
    
    onStateUpdate({ 
      serverActionCompleted: true,
      result 
    });
    
    onSuccess(result);
  } catch (error) {
    onError(error);
  }
};

registerServerAction(myServerAction);
```

## ✅ **Benefits**

1. **Type Safety**: Full TypeScript support with Convex
2. **Caching**: React Query handles caching automatically
3. **Real-time**: Convex provides real-time updates
4. **Error Handling**: Built-in error handling and retry logic
5. **Performance**: Direct Convex calls, no API route overhead
6. **UI Updates**: Automatic node data updates via callbacks

## ✅ **Examples**

### **Database Node**
```typescript
// Fetches data from Convex and updates node
const { data } = useConvexQuery('getUserData', { userId: id });
```

### **API Node**
```typescript
// Makes external API calls with caching
const { data } = useCachedNetworkRequest(id, {
  url: 'https://api.github.com/users/octocat',
  method: 'GET'
});
```

### **File Node**
```typescript
// Writes node data to server files
const fileResult = await executeFileOperation({
  type: 'write',
  path: `/logs/node-${id}.json`,
  content: JSON.stringify(nodeData)
});
```

## ✅ **Integration Points**

- **Node Mount**: Server actions run automatically
- **Node Data**: Results update node data automatically
- **UI State**: Callbacks update UI state
- **Error Handling**: Errors are caught and handled
- **Caching**: React Query provides intelligent caching

Your nodes can now perform powerful server-side operations while maintaining clean, type-safe code! 