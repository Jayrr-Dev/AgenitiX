# useEffect Best Practices & Guidelines

## Overview

This document outlines best practices for using the `useEffect` hook in our React/Next.js application. Following these guidelines ensures optimal performance, prevents memory leaks, and maintains clean, maintainable code across the AgenitiX platform.

## When You Might NOT Need useEffect

Before reaching for `useEffect`, consider these alternatives. Effects are an "escape hatch" from React's paradigm - use them only when synchronizing with external systems.

### ❌ Don't Use useEffect For:
- **Data transformations for rendering** - Calculate during render instead
- **Handling user events** - Use event handlers instead
- **Resetting state on prop changes** - Use `key` prop or calculate during render
- **Expensive calculations** - Use `useMemo` instead
- **Chains of state updates** - Calculate in event handlers instead

### ✅ DO Use useEffect For:
- **Synchronizing with external systems** (APIs, DOM, subscriptions)
- **Side effects triggered by component visibility** (analytics, logging)
- **Cleanup operations** (timers, event listeners, subscriptions)

## Core Principles

### 1. Use useEffect Only for Side Effects
- **DO**: API calls, subscriptions, DOM manipulation, timers
- **DON'T**: Calculations, data transformations, rendering logic

```typescript
// ❌ Bad - calculation should be outside useEffect
const [total, setTotal] = useState(0);
useEffect(() => {
  setTotal(items.reduce((sum, item) => sum + item.price, 0));
}, [items]);

// ✅ Good - use useMemo for calculations
const total = useMemo(() => 
  items.reduce((sum, item) => sum + item.price, 0), 
  [items]
);
```

### 2. Optimize Dependencies Carefully
Always include all values from component scope that are used inside the effect.

```typescript
// ❌ Bad - missing dependency
useEffect(() => {
  fetchUserData(userId);
}, []); // userId is missing

// ✅ Good - all dependencies included
useEffect(() => {
  fetchUserData(userId);
}, [userId]);
```

### 3. Separate Concerns with Multiple Effects
Keep different concerns in separate `useEffect` hooks for better organization and debugging.

```typescript
// ❌ Bad - mixed concerns
useEffect(() => {
  // Analytics tracking
  analytics.track('page_view', { page: 'dashboard' });
  
  // Data fetching
  fetchDashboardData();
  
  // Event listener
  window.addEventListener('resize', handleResize);
  
  return () => {
    window.removeEventListener('resize', handleResize);
  };
}, []);

// ✅ Good - separated concerns
useEffect(() => {
  analytics.track('page_view', { page: 'dashboard' });
}, []);

useEffect(() => {
  fetchDashboardData();
}, []);

useEffect(() => {
  window.addEventListener('resize', handleResize);
  return () => window.removeEventListener('resize', handleResize);
}, []);
```

## Alternatives to useEffect

### 1. Calculate During Rendering (Not useEffect)
```typescript
// ❌ Bad - unnecessary state and effect
const [firstName, setFirstName] = useState('Taylor');
const [lastName, setLastName] = useState('Swift');
const [fullName, setFullName] = useState('');

useEffect(() => {
  setFullName(firstName + ' ' + lastName);
}, [firstName, lastName]);

// ✅ Good - calculate during rendering
const [firstName, setFirstName] = useState('Taylor');
const [lastName, setLastName] = useState('Swift');
const fullName = firstName + ' ' + lastName; // No effect needed!
```

### 2. Use useMemo for Expensive Calculations
```typescript
// ❌ Bad - recalculates on every render
function FlowList({ flows, filter }) {
  const visibleFlows = getFilteredFlows(flows, filter); // Runs every render
  return <div>{visibleFlows.map(...)}</div>;
}

// ✅ Good - memoized calculation
function FlowList({ flows, filter }) {
  const visibleFlows = useMemo(() => 
    getFilteredFlows(flows, filter), 
    [flows, filter]
  );
  return <div>{visibleFlows.map(...)}</div>;
}
```

### 3. Reset State with Key Prop
```typescript
// ❌ Bad - using effect to reset state
function ProfilePage({ userId }) {
  const [comment, setComment] = useState('');
  
  useEffect(() => {
    setComment(''); // Reset on user change
  }, [userId]);
  
  return <CommentForm comment={comment} setComment={setComment} />;
}

// ✅ Good - use key to reset component state
function ProfilePage({ userId }) {
  return (
    <Profile 
      userId={userId} 
      key={userId} // React resets state when key changes
    />
  );
}

function Profile({ userId }) {
  const [comment, setComment] = useState(''); // Automatically resets
  return <CommentForm comment={comment} setComment={setComment} />;
}
```

### 4. Handle Events in Event Handlers (Not Effects)
```typescript
// ❌ Bad - using effect for user interactions
function ProductPage({ product, addToCart }) {
  useEffect(() => {
    if (product.isInCart) {
      showNotification(`Added ${product.name} to cart!`);
    }
  }, [product]);

  function handleBuyClick() {
    addToCart(product);
  }
}

// ✅ Good - handle in event handler
function ProductPage({ product, addToCart }) {
  function buyProduct() {
    addToCart(product);
    showNotification(`Added ${product.name} to cart!`);
  }

  function handleBuyClick() {
    buyProduct();
  }
}
```

### 5. Update Parent State in Event Handlers
```typescript
// ❌ Bad - using effect to notify parent
function Toggle({ onChange }) {
  const [isOn, setIsOn] = useState(false);
  
  useEffect(() => {
    onChange(isOn); // Runs after render
  }, [isOn, onChange]);

  function handleClick() {
    setIsOn(!isOn);
  }
}

// ✅ Good - update both states in event handler
function Toggle({ onChange }) {
  const [isOn, setIsOn] = useState(false);
  
  function updateToggle(nextIsOn) {
    setIsOn(nextIsOn);
    onChange(nextIsOn); // Synchronous update
  }

  function handleClick() {
    updateToggle(!isOn);
  }
}
```

### 6. Use useSyncExternalStore for External Data
```typescript
// ❌ Bad - manual subscription in effect
function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(true);
  
  useEffect(() => {
    function updateState() {
      setIsOnline(navigator.onLine);
    }
    
    window.addEventListener('online', updateState);
    window.addEventListener('offline', updateState);
    
    return () => {
      window.removeEventListener('online', updateState);
      window.removeEventListener('offline', updateState);
    };
  }, []);
  
  return isOnline;
}

// ✅ Good - use built-in hook for external stores
function subscribe(callback) {
  window.addEventListener('online', callback);
  window.addEventListener('offline', callback);
  return () => {
    window.removeEventListener('online', callback);
    window.removeEventListener('offline', callback);
  };
}

function useOnlineStatus() {
  return useSyncExternalStore(
    subscribe,
    () => navigator.onLine,
    () => true // Server-side value
  );
}
```

## Common Patterns & Solutions

### 1. Data Fetching with Cleanup
Always handle component unmounting and race conditions.

```typescript
// ✅ Recommended pattern for data fetching
useEffect(() => {
  let isCancelled = false;
  
  const fetchData = async () => {
    try {
      const response = await api.get(`/flows/${flowId}`);
      if (!isCancelled) {
        setFlowData(response.data);
      }
    } catch (error) {
      if (!isCancelled) {
        console.error('Failed to fetch flow data:', error);
        setError(error.message);
      }
    }
  };
  
  fetchData();
  
  return () => {
    isCancelled = true;
  };
}, [flowId]);
```

### 2. Event Listeners with Proper Cleanup
Always remove event listeners to prevent memory leaks.

```typescript
// ✅ Event listener pattern
useEffect(() => {
  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      closeModal();
    }
  };
  
  document.addEventListener('keydown', handleKeyDown);
  
  return () => {
    document.removeEventListener('keydown', handleKeyDown);
  };
}, [closeModal]);
```

### 3. Timers and Intervals
Always clear timers to prevent memory leaks and unexpected behavior.

```typescript
// ✅ Timer pattern
useEffect(() => {
  const timeoutId = setTimeout(() => {
    setShowNotification(false);
  }, 5000);
  
  return () => {
    clearTimeout(timeoutId);
  };
}, []);

// ✅ Interval pattern
useEffect(() => {
  const intervalId = setInterval(() => {
    refreshData();
  }, 30000);
  
  return () => {
    clearInterval(intervalId);
  };
}, [refreshData]);
```

### 4. Subscriptions (WebSocket, EventEmitter)
Properly manage subscriptions to prevent memory leaks.

```typescript
// ✅ Subscription pattern
useEffect(() => {
  const unsubscribe = convex.onUpdate('flows', (flows) => {
    setFlows(flows);
  });
  
  return unsubscribe;
}, []);
```

## AgenitiX-Specific Patterns

### 1. Convex Real-time Subscriptions
Use Convex's built-in subscription patterns with proper cleanup.

```typescript
// ✅ Convex subscription pattern
import { useQuery } from "convex/react";

// Prefer useQuery over useEffect for Convex data
const flows = useQuery(api.flows.list, { userId });

// Only use useEffect for side effects, not data fetching
useEffect(() => {
  if (flows?.length > 0) {
    // Side effect: analytics tracking
    analytics.track('flows_loaded', { count: flows.length });
  }
}, [flows]);
```

### 2. Node Editor Integration
Handle node editor lifecycle events properly.

```typescript
// ✅ Node editor pattern
useEffect(() => {
  const handleNodeChange = (changes: NodeChange[]) => {
    // Update node state
    applyNodeChanges(changes);
    
    // Auto-save after changes
    debouncedSave();
  };
  
  const handleEdgeChange = (changes: EdgeChange[]) => {
    applyEdgeChanges(changes);
    debouncedSave();
  };
  
  // Register event handlers
  reactFlowInstance?.on('nodeschange', handleNodeChange);
  reactFlowInstance?.on('edgeschange', handleEdgeChange);
  
  return () => {
    reactFlowInstance?.off('nodeschange', handleNodeChange);
    reactFlowInstance?.off('edgeschange', handleEdgeChange);
  };
}, [reactFlowInstance, applyNodeChanges, applyEdgeChanges, debouncedSave]);
```

### 3. Authentication State Management
Handle auth state changes with proper cleanup.

```typescript
// ✅ Auth state pattern
useEffect(() => {
  const handleAuthChange = (user: User | null) => {
    if (user) {
      // User logged in
      initializeUserSession(user);
    } else {
      // User logged out
      clearUserData();
      router.push('/login');
    }
  };
  
  const unsubscribe = auth.onAuthStateChanged(handleAuthChange);
  
  return unsubscribe;
}, []);
```

## Performance Optimization

### 1. Debounce Expensive Operations
Use debouncing for operations that shouldn't run on every change.

```typescript
// ✅ Debounced effect pattern
import { useDebouncedCallback } from 'use-debounce';

const debouncedSave = useDebouncedCallback(
  (data: FlowData) => {
    saveFlow(data);
  },
  1000
);

useEffect(() => {
  if (flowData) {
    debouncedSave(flowData);
  }
}, [flowData, debouncedSave]);
```

### 2. Memoize Callback Dependencies
Prevent unnecessary effect re-runs by memoizing callbacks.

```typescript
// ✅ Memoized callback pattern
const handleNodeUpdate = useCallback((nodeId: string, data: any) => {
  updateNode(nodeId, data);
}, [updateNode]);

useEffect(() => {
  nodeEditor.on('node:update', handleNodeUpdate);
  
  return () => {
    nodeEditor.off('node:update', handleNodeUpdate);
  };
}, [handleNodeUpdate]); // Won't re-run unnecessarily
```

## Data Fetching Best Practices

### Race Condition Prevention
```typescript
// ❌ Bad - race conditions possible
useEffect(() => {
  fetchResults(query, page).then(json => {
    setResults(json); // May set stale results
  });
}, [query, page]);

// ✅ Good - prevent race conditions
useEffect(() => {
  let ignore = false;
  
  fetchResults(query, page).then(json => {
    if (!ignore) {
      setResults(json);
    }
  });
  
  return () => {
    ignore = true;
  };
}, [query, page]);
```

### Custom Data Fetching Hook
```typescript
// ✅ Recommended pattern for data fetching
function useData(url) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    let ignore = false;
    
    setLoading(true);
    setError(null);
    
    fetch(url)
      .then(response => response.json())
      .then(json => {
        if (!ignore) {
          setData(json);
          setLoading(false);
        }
      })
      .catch(err => {
        if (!ignore) {
          setError(err);
          setLoading(false);
        }
      });
    
    return () => {
      ignore = true;
    };
  }, [url]);
  
  return { data, loading, error };
}

// Usage
function SearchResults({ query }) {
  const [page, setPage] = useState(1);
  const params = new URLSearchParams({ query, page });
  const { data: results, loading, error } = useData(`/api/search?${params}`);
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  return <div>{results?.map(...)}</div>;
}
```

## Application Initialization

### One-Time Setup Logic
```typescript
// ❌ Bad - runs twice in development
function App() {
  useEffect(() => {
    loadDataFromLocalStorage();
    checkAuthToken();
  }, []);
}

// ✅ Good - prevent double execution
let didInit = false;

function App() {
  useEffect(() => {
    if (!didInit) {
      didInit = true;
      loadDataFromLocalStorage();
      checkAuthToken();
    }
  }, []);
}

// ✅ Even better - run during module initialization
if (typeof window !== 'undefined') {
  checkAuthToken();
  loadDataFromLocalStorage();
}

function App() {
  // No initialization effect needed
}
```

## Common Anti-Patterns to Avoid

### 1. Missing Dependencies
```typescript
// ❌ Bad - ESLint will warn about this
useEffect(() => {
  fetchData(userId, filters);
}, []); // Missing userId and filters

// ✅ Good
useEffect(() => {
  fetchData(userId, filters);
}, [userId, filters]);
```

### 2. Infinite Loops
```typescript
// ❌ Bad - creates infinite loop
const [data, setData] = useState([]);

useEffect(() => {
  setData([...data, newItem]); // data changes, effect re-runs
}, [data]);

// ✅ Good - use functional update
useEffect(() => {
  setData(prevData => [...prevData, newItem]);
}, [newItem]);
```

### 3. Unnecessary Object/Array Dependencies
```typescript
// ❌ Bad - object recreated on every render
const config = { apiKey: 'abc', timeout: 5000 };

useEffect(() => {
  initializeService(config);
}, [config]); // Runs on every render

// ✅ Good - memoize or move outside component
const config = useMemo(() => ({ 
  apiKey: 'abc', 
  timeout: 5000 
}), []);

useEffect(() => {
  initializeService(config);
}, [config]);
```

### 4. Chains of Effects
```typescript
// ❌ Bad - cascading effects cause multiple re-renders
function Game() {
  const [card, setCard] = useState(null);
  const [goldCardCount, setGoldCardCount] = useState(0);
  const [round, setRound] = useState(1);
  const [isGameOver, setIsGameOver] = useState(false);

  useEffect(() => {
    if (card !== null && card.gold) {
      setGoldCardCount(c => c + 1);
    }
  }, [card]);

  useEffect(() => {
    if (goldCardCount > 3) {
      setRound(r => r + 1);
      setGoldCardCount(0);
    }
  }, [goldCardCount]);

  useEffect(() => {
    if (round > 5) {
      setIsGameOver(true);
    }
  }, [round]);
}

// ✅ Good - calculate in event handler
function Game() {
  const [card, setCard] = useState(null);
  const [goldCardCount, setGoldCardCount] = useState(0);
  const [round, setRound] = useState(1);
  
  const isGameOver = round > 5; // Calculate during render

  function handlePlaceCard(nextCard) {
    if (isGameOver) {
      throw Error('Game already ended.');
    }
    
    // Calculate all next state in event handler
    setCard(nextCard);
    if (nextCard.gold) {
      if (goldCardCount <= 3) {
        setGoldCardCount(goldCardCount + 1);
      } else {
        setGoldCardCount(0);
        setRound(round + 1);
        if (round === 5) {
          alert('Good game!');
        }
      }
    }
  }
}
```

## Testing useEffect

### 1. Test Side Effects, Not Implementation
```typescript
// ✅ Good test - focuses on behavior
test('should fetch user data when userId changes', async () => {
  const { rerender } = render(<UserProfile userId="1" />);
  
  await waitFor(() => {
    expect(screen.getByText('User 1')).toBeInTheDocument();
  });
  
  rerender(<UserProfile userId="2" />);
  
  await waitFor(() => {
    expect(screen.getByText('User 2')).toBeInTheDocument();
  });
});
```

### 2. Test Cleanup Functions
```typescript
// ✅ Good test - verifies cleanup
test('should cleanup event listener on unmount', () => {
  const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener');
  
  const { unmount } = render(<Component />);
  
  unmount();
  
  expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
});
```

## Debugging Tips

### 1. Use React DevTools Profiler
- Enable "Record why each component rendered"
- Look for unnecessary effect executions
- Check dependency arrays for unexpected changes

### 2. Add Debug Logging
```typescript
// ✅ Debug pattern
useEffect(() => {
  console.log('Effect running with dependencies:', { userId, filters });
  
  fetchData(userId, filters);
}, [userId, filters]);
```

### 3. Use ESLint Plugin
Ensure you have `eslint-plugin-react-hooks` configured:

```json
{
  "extends": ["plugin:react-hooks/recommended"]
}
```

## Decision Tree: Do I Need useEffect?

Ask yourself these questions before using `useEffect`:

1. **Is this for rendering/display logic?** → Use regular variables or `useMemo`
2. **Is this triggered by user interaction?** → Use event handlers
3. **Is this resetting state when props change?** → Use `key` prop or calculate during render
4. **Is this an expensive calculation?** → Use `useMemo`
5. **Is this synchronizing with external system?** → ✅ Use `useEffect`
6. **Is this a side effect from component being displayed?** → ✅ Use `useEffect`

## Summary Checklist

Before committing code with useEffect:

- [ ] **Considered alternatives**: Could this be calculated during render, handled in event handler, or use `useMemo`?
- [ ] **External synchronization**: Effect is only used for synchronizing with external systems
- [ ] **Dependencies**: All dependencies are included in the dependency array
- [ ] **Cleanup function**: Provided when needed (subscriptions, timers, listeners)
- [ ] **Separated concerns**: Different concerns are in different effects
- [ ] **No infinite loops**: No unnecessary re-renders or dependency issues
- [ ] **Race conditions**: Handled for async operations (data fetching)
- [ ] **Error handling**: Proper error handling for async operations
- [ ] **Resource cleanup**: Event listeners, subscriptions, timers are cleaned up
- [ ] **ESLint compliance**: All ESLint warnings are addressed
- [ ] **Performance**: No unnecessary effects that could be calculations or event handlers

## Resources

- [React useEffect Documentation](https://react.dev/reference/react/useEffect)
- [You Might Not Need an Effect](https://react.dev/learn/you-might-not-need-an-effect) - Official React guide
- [A Complete Guide to useEffect](https://overreacted.io/a-complete-guide-to-useeffect/)
- [useSyncExternalStore Documentation](https://react.dev/reference/react/useSyncExternalStore)
- [ESLint Plugin React Hooks](https://www.npmjs.com/package/eslint-plugin-react-hooks)