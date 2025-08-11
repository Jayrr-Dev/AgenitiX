# History Memory Optimization Fix

## Problem

The `flowHistory:loadHistoryGraph` Convex query was failing with:

```
Too many bytes read in a single function execution (limit: 16777216 bytes)
```

This occurred when loading large history graphs stored in chunked format, as the function was trying to load all chunks at once using `.collect()` without limits.

## Root Cause

1. **Chunked Storage**: Large history graphs are split into chunks stored in `flow_history_chunks` table
2. **Unlimited Collection**: The function used `.collect()` without pagination, loading all chunks simultaneously
3. **Memory Explosion**: Combined chunk data could easily exceed Convex's 16MB per-function limit
4. **Guardrail Bypass**: Size checks only looked at metadata, not actual chunk data size

## Solutions Implemented

### 1. Fixed `loadHistoryGraph` Function

- **Pagination**: Replaced `.collect()` with `.paginate()` to load chunks in batches
- **Batch Size**: Limited to 100 chunks per batch to prevent memory issues
- **Size Limits**: Added individual chunk size checks (1MB per chunk limit)
- **Total Size Check**: Added final combined size validation before parsing
- **Early Exit**: Return minimal graph if limits are exceeded

### 2. Added `loadLargeHistoryGraph` Function

- **Strict Limits**: 50 chunks per batch, 10MB total limit
- **Node Limiting**: Optional `maxNodes` parameter to limit loaded nodes
- **Truncation Support**: Returns `isTruncated` flag when limits are hit
- **Error Handling**: Graceful fallback to minimal graph on failures

### 3. Added `pruneHistoryGraph` Function

- **Automatic Cleanup**: Remove old history entries based on age or count
- **Storage Optimization**: Convert chunked storage back to inline when possible
- **Memory Management**: Limit chunks loaded during pruning operations
- **Version Control**: Maintain versioning for chunked storage

## Key Changes Made

### In `loadHistoryGraph`:

```typescript
// Before: Unlimited collection
const chunks = await ctx.db
  .query("flow_history_chunks")
  .withIndex("by_history_id", (q) => q.eq("history_id", history._id))
  .collect();

// After: Paginated loading
do {
  const chunkBatch = await ctx.db
    .query("flow_history_chunks")
    .withIndex("by_history_id", (q) => q.eq("history_id", history._id))
    .order("asc")
    .paginate({ numItems: CHUNK_BATCH_SIZE, cursor });

  // Process batch...
  cursor = chunkBatch.continueCursor;
} while (cursor !== null);
```

### Safety Checks Added:

- Individual chunk size limits (1MB per chunk)
- Total combined size limits (15MB safe, 16MB hard limit)
- Maximum chunk count limits (1000-2000 chunks)
- Early exit with minimal graph when limits exceeded

## Benefits

1. **Prevents Crashes**: No more 16MB limit errors
2. **Better Performance**: Smaller, controlled data loading
3. **Graceful Degradation**: Returns minimal graph instead of failing
4. **User Control**: New functions for managing large histories
5. **Automatic Cleanup**: Pruning functions to reduce storage size

## Usage Recommendations

### For Large Histories:

```typescript
// Use the new function for large histories
const largeHistory = await convex.query(api.flowHistory.loadLargeHistoryGraph, {
  flowId,
  userId,
  maxNodes: 1000, // Limit to 1000 nodes
});
```

### For Regular Cleanup:

```typescript
// Prune history to keep only recent entries
await convex.mutation(api.flowHistory.pruneHistoryGraph, {
  flowId,
  userId,
  maxNodes: 500, // Keep only 500 most recent nodes
  maxAge: 7 * 24 * 60 * 60 * 1000, // Keep only last 7 days
});
```

## Monitoring

The functions now include comprehensive logging:

- Warning when chunks are oversized
- Warning when total size exceeds limits
- Warning when truncation occurs
- Error logging for debugging

## Future Improvements

1. **Progressive Loading**: Load history in stages as user navigates
2. **Smart Caching**: Cache frequently accessed history portions
3. **Compression**: Implement better compression algorithms
4. **Background Pruning**: Automatic cleanup of old histories
5. **User Notifications**: Alert users when history is truncated
