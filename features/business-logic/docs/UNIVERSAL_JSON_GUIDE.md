# Universal JSON Input System Guide

## 🎯 Overview

The NodeFactory includes a **universal JSON input system** that allows any node to receive JSON data and update its properties programmatically. **Every factory-created node automatically has a JSON input handle** that's always available, and **Vibe Mode** enhances the experience with visual highlighting and advanced processing.

## 🚀 How It Works

### 1. JSON Handles Always Available
- **Every factory node** automatically gets a gray JSON handle (indigo `j` type)
- JSON handles are **always visible and functional**
- No setup required - just connect and use!

### 2. Enable Vibe Mode (Optional Enhancement)
- Click the purple **X** button in the top-right Action Toolbar
- JSON handles turn **purple** and get enhanced styling
- The button will pulse to indicate Vibe Mode is active
- Enhanced processing and visual feedback

### 3. Create JSON Data
Use the **TestJson** node to create and validate JSON:
```json
{
  "heldText": "Hello from JSON!",
  "text": "Updated via JSON",
  "someProperty": "value"
}
```

### 4. Connect and Update
1. Connect TestJson's output to **any node's JSON handle** (always visible)
2. Node data updates automatically in real-time
3. Changes apply immediately to node behavior

## 🔧 Universal Support

**Every factory-created node automatically has JSON input!** Zero configuration needed.

### Automatic Features:
- ✅ **JSON input handle** on every factory node (always visible)
- ✅ **Safe parsing** with error handling
- ✅ **Property filtering** (excludes dangerous properties like `error`)
- ✅ **Change detection** (only updates when data actually changes)
- ✅ **Real-time updates** with immediate visual feedback
- ✅ **Enhanced styling** when Vibe Mode is active (purple glow)

### Node Examples:

#### CreateText Node
```json
{
  "heldText": "Dynamic text from JSON",
  "text": "Output text"
}
```

#### CyclePulse Node
```json
{
  "cycleDuration": 1000,
  "pulseDuration": 200,
  "maxCycles": 5,
  "infinite": false
}
```

#### CountInput Node
```json
{
  "count": 42,
  "step": 5,
  "active": true
}
```

## 🎨 Adding JSON Support to New Nodes

### Automatic Support (Recommended)
All factory nodes get JSON support automatically. Just create your node normally:

```typescript
const MyNode = createNodeComponent<MyNodeData>({
  nodeType: 'myNode',
  category: 'create',
  displayName: 'My Node',
  defaultData: { 
    myProperty: 'default value',
    anotherProperty: 123
  },
  handles: [
    // Your regular handles - JSON handle added automatically in Vibe Mode
    { id: 's', dataType: 's', position: Position.Right, type: 'source' }
  ],
  // ... rest of config
});
```

### Manual JSON Handle (Optional)
If you want a permanent JSON input handle:

```typescript
import { addJsonInputSupport } from '../factory/NodeFactory';

const MyNode = createNodeComponent<MyNodeData>({
  nodeType: 'myNode',
  handles: addJsonInputSupport([
    // Your existing handles
    { id: 's', dataType: 's', position: Position.Right, type: 'source' }
  ]),
  // ... rest of config
});
```

### Manual JSON Processing (Advanced)
For custom JSON handling:

```typescript
import { processJsonInput } from '../factory/NodeFactory';

// In your processLogic function:
processLogic: ({ data, connections, nodesData, updateNodeData, id }) => {
  // Get JSON input
  const jsonConnections = connections.filter(c => c.targetHandle === 'j');
  if (jsonConnections.length > 0) {
    const jsonData = nodesData.find(n => n.id === jsonConnections[0].source)?.data?.json;
    
    if (jsonData) {
      processJsonInput(jsonData, data, updateNodeData, id);
    }
  }
  
  // Your regular processing logic...
}
```

## 📝 TestJson Node Features

### Built-in Examples
The TestJson node includes quick example buttons:

- **Text Update**: Updates CreateText properties
- **CyclePulse Config**: Configures automation timing
- **CountInput Config**: Sets counter values

### JSON Validation
- ✅ Real-time parse validation
- ✅ Visual feedback (green = valid, orange = error)
- ✅ Property count display
- ✅ Formatted preview

### Editor Features
- 📝 Syntax highlighting
- 🔍 Error detection
- 📋 Copy/paste support
- 💾 Inspector panel editing

## 🛡️ Safety Features

### Automatic Protections:
- **Error property filtering**: Prevents system corruption
- **Type validation**: Only accepts JSON objects
- **Parse error handling**: Graceful failure without breaking nodes
- **Change detection**: Prevents infinite update loops
- **Memory limits**: Prevents oversized data

### Best Practices:
1. **Validate JSON** in TestJson before connecting
2. **Use exact property names** from node data interfaces
3. **Test changes** on individual nodes first
4. **Disconnect when done** to avoid unnecessary processing

## 🎯 Common Use Cases

### 1. Rapid Prototyping
Quickly test different node configurations without manual input:
```json
{
  "text": "Test content",
  "duration": 500,
  "enabled": true
}
```

### 2. Automation Configuration
Programmatically configure complex automation sequences:
```json
{
  "cycleDuration": 2000,
  "pulseDuration": 100,
  "maxCycles": 10,
  "infinite": false
}
```

### 3. Batch Updates
Update multiple properties simultaneously:
```json
{
  "title": "Updated Title",
  "description": "Updated Description", 
  "color": "red",
  "size": "large"
}
```

### 4. External Data Integration
Connect to external APIs or databases (future enhancement):
```json
{
  "apiEndpoint": "https://api.example.com/data",
  "refreshRate": 30000,
  "autoUpdate": true
}
```

## 🚨 Troubleshooting

### JSON Not Applying
1. **Check connections**: Ensure TestJson output is connected to the JSON handle
2. **Validate JSON**: Use TestJson to verify syntax
3. **Property Names**: Ensure exact match with node data structure
4. **Console Logs**: Check browser console for error messages

### JSON Handles Not Showing
1. **Factory Nodes Only**: Only factory-created nodes have automatic JSON handles
2. **Cache Issues**: Refresh page if handles don't appear
3. **Check Handle Type**: Look for gray `j` handles (purple when Vibe Mode is active)

### Enhanced Styling Not Showing (Vibe Mode)
1. **Vibe Mode Disabled**: Click purple X to enable enhanced JSON handle styling
2. **Check Connection**: JSON handles should turn purple when Vibe Mode is active

### Performance Issues
1. **Disconnect Unused**: Remove JSON connections when not needed
2. **Simplify JSON**: Use only necessary properties
3. **Disable Vibe Mode**: Turn off when not actively using

## 🔮 Future Enhancements

### Planned Features:
- **JSON Schema Validation**: Type-safe property validation
- **Batch Operations**: Update multiple nodes simultaneously  
- **Templates**: Pre-built JSON configurations for common patterns
- **External Sources**: API and database integration
- **Visual Feedback**: Highlight nodes receiving JSON updates

### Integration Ideas:
- **Flow Export/Import**: Save entire flow configurations as JSON
- **Real-time Collaboration**: Share JSON configurations between users
- **Version Control**: Track changes to node configurations
- **Automation**: Trigger JSON updates based on external events

---

## 🎉 Ready to Use!

The universal JSON input system is **ready to use right now**:

1. ✅ **Add TestJson node** to your flow
2. ✅ **Add CreateText node** (or any factory node) - JSON handle is automatically there!
3. ✅ **Connect JSON output to gray JSON handle** 
4. ✅ **Watch real-time updates**
5. ✅ **Optional**: Enable Vibe Mode (purple X) for enhanced styling

**It's that simple!** Every factory node automatically has a JSON input handle with zero additional code required. 