# Design Document

## Overview

The enhanced StoreLocal node transforms the current placeholder implementation into a comprehensive localStorage management system. The design leverages the existing node architecture while adding sophisticated data handling, mode switching, and visual feedback capabilities. The node will provide a clean, intuitive interface for storing and deleting complex data structures in browser localStorage.

## Architecture

### Core Components

```typescript
// Enhanced data schema with mode switching and status tracking
const StoreLocalDataSchema = z.object({
  // Core functionality
  mode: z.enum(["store", "delete"]).default("store"),
  inputData: z.record(z.unknown()).nullable().default(null),
  triggerInput: z.boolean().default(false),
  lastTriggerState: z.boolean().default(false),

  // Status and feedback
  isProcessing: z.boolean().default(false),
  lastOperation: z.enum(["none", "store", "delete"]).default("none"),
  lastOperationSuccess: z.boolean().default(false),
  lastOperationTime: z.number().optional(),
  operationMessage: z.string().default(""),

  // UI state (existing)
  isEnabled: z.boolean().default(true),
  isActive: z.boolean().default(false),
  isExpanded: z.boolean().default(false),
  expandedSize: z.string().default("VE2"),
  collapsedSize: z.string().default("C2"),

  // output
  statusOutput: z.boolean().default(false),
});
```

### Handle Configuration

```typescript
handles: [
  {
    id: "data-input",
    code: "j",
    position: "top",
    type: "target",
    dataType: "JSON",
  },
  {
    id: "trigger-input",
    code: "b",
    position: "left",
    type: "target",
    dataType: "Boolean",
  },
  {
    id: "status-output",
    code: "b",
    position: "right",
    type: "source",
    dataType: "Boolean",
  },
];
```

## Components and Interfaces

### 1. Mode Toggle Button Component

```typescript
interface ModeToggleButtonProps {
  mode: "store" | "delete";
  onToggle: () => void;
  disabled?: boolean;
  isProcessing?: boolean;
}

const ModeToggleButton: React.FC<ModeToggleButtonProps> = ({
  mode,
  onToggle,
  disabled = false,
  isProcessing = false,
}) => {
  return (
    <button
      onClick={onToggle}
      disabled={disabled || isProcessing}
      className={cn(
        "px-3 py-2 rounded-md font-medium text-sm transition-all duration-200",
        "border-2 min-w-[80px] h-[36px]",
        mode === "store"
          ? "bg-blue-500 text-white border-blue-600 hover:bg-blue-600"
          : "bg-red-500 text-white border-red-600 hover:bg-red-600",
        disabled && "opacity-50 cursor-not-allowed",
        isProcessing && "animate-pulse"
      )}
    >
      {isProcessing ? "..." : mode === "store" ? "Store" : "Delete"}
    </button>
  );
};
```

### 2. Status Display Component

```typescript
interface StatusDisplayProps {
  lastOperation: "none" | "store" | "delete";
  lastOperationSuccess: boolean;
  operationMessage: string;
  lastOperationTime?: number;
  isProcessing: boolean;
}

const StatusDisplay: React.FC<StatusDisplayProps> = ({
  lastOperation,
  lastOperationSuccess,
  operationMessage,
  lastOperationTime,
  isProcessing,
}) => {
  const getStatusColor = () => {
    if (isProcessing) return "text-yellow-600";
    if (lastOperation === "none") return "text-gray-500";
    return lastOperationSuccess ? "text-green-600" : "text-red-600";
  };

  const getStatusIcon = () => {
    if (isProcessing) return "⏳";
    if (lastOperation === "none") return "⚪";
    return lastOperationSuccess ? "✅" : "❌";
  };

  return (
    <div className={cn("text-xs", getStatusColor())}>
      <div className="flex items-center gap-1">
        <span>{getStatusIcon()}</span>
        <span>
          {isProcessing
            ? "Processing..."
            : lastOperation === "none"
              ? "Ready"
              : `${lastOperation} ${lastOperationSuccess ? "success" : "failed"}`
          }
        </span>
      </div>
      {operationMessage && (
        <div className="mt-1 text-xs opacity-75">
          {operationMessage}
        </div>
      )}
      {lastOperationTime && (
        <div className="mt-1 text-xs opacity-50">
          {new Date(lastOperationTime).toLocaleTimeString()}
        </div>
      )}
    </div>
  );
};
```

### 3. Data Preview Component

```typescript
interface DataPreviewProps {
  data: Record<string, unknown> | null;
  mode: "store" | "delete";
  maxItems?: number;
}

const DataPreview: React.FC<DataPreviewProps> = ({
  data,
  mode,
  maxItems = 5
}) => {
  if (!data || Object.keys(data).length === 0) {
    return (
      <div className="text-xs text-gray-500 italic">
        No data to {mode}
      </div>
    );
  }

  const entries = Object.entries(data).slice(0, maxItems);
  const hasMore = Object.keys(data).length > maxItems;

  return (
    <div className="text-xs space-y-1">
      <div className="font-medium text-gray-700">
        {mode === "store" ? "Will store:" : "Will delete keys:"}
      </div>
      {entries.map(([key, value]) => (
        <div key={key} className="flex items-start gap-2">
          <span className="font-mono text-blue-600">{key}:</span>
          {mode === "store" && (
            <span className="text-gray-600 truncate">
              {typeof value === "object"
                ? JSON.stringify(value).slice(0, 30) + "..."
                : String(value).slice(0, 30)
              }
            </span>
          )}
        </div>
      ))}
      {hasMore && (
        <div className="text-gray-500 italic">
          ...and {Object.keys(data).length - maxItems} more
        </div>
      )}
    </div>
  );
};
```

## Data Models

### LocalStorage Operations Interface

```typescript
interface LocalStorageOperations {
  store: (data: Record<string, unknown>) => Promise<{
    success: boolean;
    message: string;
    keysProcessed: string[];
    errors: Array<{ key: string; error: string }>;
  }>;

  delete: (keys: string[]) => Promise<{
    success: boolean;
    message: string;
    keysDeleted: string[];
    keysNotFound: string[];
  }>;

  isAvailable: () => boolean;
  getQuotaInfo: () => Promise<{
    used: number;
    available: number;
    total: number;
  }>;
}
```

### Implementation

```typescript
const createLocalStorageOperations = (): LocalStorageOperations => {
  const isAvailable = (): boolean => {
    try {
      const test = "__localStorage_test__";
      localStorage.setItem(test, "test");
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  };

  const store = async (data: Record<string, unknown>) => {
    const result = {
      success: true,
      message: "",
      keysProcessed: [] as string[],
      errors: [] as Array<{ key: string; error: string }>,
    };

    if (!isAvailable()) {
      result.success = false;
      result.message = "localStorage is not available";
      return result;
    }

    for (const [key, value] of Object.entries(data)) {
      try {
        let serializedValue: string;

        if (typeof value === "string") {
          serializedValue = JSON.stringify(value);
        } else if (typeof value === "number" || typeof value === "boolean") {
          serializedValue = String(value);
        } else if (value === null || value === undefined) {
          serializedValue = String(value);
        } else {
          serializedValue = JSON.stringify(value);
        }

        localStorage.setItem(key, serializedValue);
        result.keysProcessed.push(key);
      } catch (error) {
        result.errors.push({
          key,
          error: error instanceof Error ? error.message : "Unknown error",
        });
        result.success = false;
      }
    }

    result.message = result.success
      ? `Successfully stored ${result.keysProcessed.length} items`
      : `Stored ${result.keysProcessed.length} items with ${result.errors.length} errors`;

    return result;
  };

  const deleteKeys = async (keys: string[]) => {
    const result = {
      success: true,
      message: "",
      keysDeleted: [] as string[],
      keysNotFound: [] as string[],
    };

    if (!isAvailable()) {
      result.success = false;
      result.message = "localStorage is not available";
      return result;
    }

    for (const key of keys) {
      try {
        if (localStorage.getItem(key) !== null) {
          localStorage.removeItem(key);
          result.keysDeleted.push(key);
        } else {
          result.keysNotFound.push(key);
        }
      } catch (error) {
        result.success = false;
        result.message = `Error deleting key "${key}": ${error}`;
      }
    }

    result.message = `Deleted ${result.keysDeleted.length} items`;
    if (result.keysNotFound.length > 0) {
      result.message += `, ${result.keysNotFound.length} keys not found`;
    }

    return result;
  };

  const getQuotaInfo = async () => {
    // Estimate localStorage usage
    let used = 0;
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        used += localStorage[key].length + key.length;
      }
    }

    return {
      used,
      available: 5 * 1024 * 1024 - used, // Assume 5MB limit
      total: 5 * 1024 * 1024,
    };
  };

  return {
    store,
    delete: deleteKeys,
    isAvailable,
    getQuotaInfo,
  };
};
```

## Error Handling

### Error Types and Handling Strategy

```typescript
enum LocalStorageErrorType {
  NOT_AVAILABLE = "NOT_AVAILABLE",
  QUOTA_EXCEEDED = "QUOTA_EXCEEDED",
  SERIALIZATION_ERROR = "SERIALIZATION_ERROR",
  INVALID_DATA = "INVALID_DATA",
  OPERATION_FAILED = "OPERATION_FAILED",
}

interface LocalStorageError {
  type: LocalStorageErrorType;
  message: string;
  key?: string;
  originalError?: Error;
}

const handleLocalStorageError = (
  error: unknown,
  key?: string
): LocalStorageError => {
  if (error instanceof DOMException) {
    if (error.name === "QuotaExceededError") {
      return {
        type: LocalStorageErrorType.QUOTA_EXCEEDED,
        message: "localStorage quota exceeded",
        key,
      };
    }
  }

  if (error instanceof Error) {
    if (error.message.includes("JSON")) {
      return {
        type: LocalStorageErrorType.SERIALIZATION_ERROR,
        message: `Failed to serialize data: ${error.message}`,
        key,
        originalError: error,
      };
    }
  }

  return {
    type: LocalStorageErrorType.OPERATION_FAILED,
    message: error instanceof Error ? error.message : "Unknown error",
    key,
    originalError: error instanceof Error ? error : undefined,
  };
};
```

## Testing Strategy

### Unit Tests

```typescript
describe("StoreLocal Node", () => {
  describe("localStorage operations", () => {
    beforeEach(() => {
      localStorage.clear();
    });

    it("should store simple data types correctly", async () => {
      const operations = createLocalStorageOperations();
      const data = {
        theme: "dark",
        loggedIn: true,
        count: 42,
      };

      const result = await operations.store(data);

      expect(result.success).toBe(true);
      expect(result.keysProcessed).toEqual(["theme", "loggedIn", "count"]);
      expect(localStorage.getItem("theme")).toBe('"dark"');
      expect(localStorage.getItem("loggedIn")).toBe("true");
      expect(localStorage.getItem("count")).toBe("42");
    });

    it("should store complex objects as JSON", async () => {
      const operations = createLocalStorageOperations();
      const data = {
        user: { id: "abc123", name: "Sam" },
        settings: { theme: "dark", notifications: true },
      };

      const result = await operations.store(data);

      expect(result.success).toBe(true);
      expect(JSON.parse(localStorage.getItem("user")!)).toEqual({
        id: "abc123",
        name: "Sam",
      });
    });

    it("should delete specified keys", async () => {
      const operations = createLocalStorageOperations();

      // Setup data
      localStorage.setItem("key1", "value1");
      localStorage.setItem("key2", "value2");
      localStorage.setItem("key3", "value3");

      const result = await operations.delete(["key1", "key3"]);

      expect(result.success).toBe(true);
      expect(result.keysDeleted).toEqual(["key1", "key3"]);
      expect(localStorage.getItem("key1")).toBeNull();
      expect(localStorage.getItem("key2")).toBe("value2");
      expect(localStorage.getItem("key3")).toBeNull();
    });
  });

  describe("pulse detection", () => {
    it("should detect rising edge trigger", () => {
      const { result } = renderHook(() => {
        const [lastState, setLastState] = useState(false);
        const [currentState, setCurrentState] = useState(false);

        const isPulse = currentState && !lastState;

        return { isPulse, setCurrentState, setLastState };
      });

      // Initial state - no pulse
      expect(result.current.isPulse).toBe(false);

      // Rising edge - should detect pulse
      act(() => {
        result.current.setCurrentState(true);
      });
      expect(result.current.isPulse).toBe(true);

      // Update last state
      act(() => {
        result.current.setLastState(true);
      });
      expect(result.current.isPulse).toBe(false);
    });
  });

  describe("mode switching", () => {
    it("should toggle between store and delete modes", () => {
      const { result } = renderHook(() => {
        const [mode, setMode] = useState<"store" | "delete">("store");

        const toggleMode = () => {
          setMode((prev) => (prev === "store" ? "delete" : "store"));
        };

        return { mode, toggleMode };
      });

      expect(result.current.mode).toBe("store");

      act(() => {
        result.current.toggleMode();
      });
      expect(result.current.mode).toBe("delete");

      act(() => {
        result.current.toggleMode();
      });
      expect(result.current.mode).toBe("store");
    });
  });
});
```

### Integration Tests

```typescript
describe("StoreLocal Node Integration", () => {
  it("should perform complete store operation flow", async () => {
    const { getByRole, getByText } = render(
      <StoreLocalNode
        id="test-node"
        data={{
          mode: "store",
          inputData: { theme: "dark", count: 42 },
          triggerInput: true,
          lastTriggerState: false,
        }}
      />
    );

    // Should show store mode
    expect(getByText("Store")).toBeInTheDocument();

    // Should process the data
    await waitFor(() => {
      expect(localStorage.getItem("theme")).toBe('"dark"');
      expect(localStorage.getItem("count")).toBe("42");
    });

    // Should show success status
    expect(getByText(/success/i)).toBeInTheDocument();
  });

  it("should perform complete delete operation flow", async () => {
    // Setup initial data
    localStorage.setItem("theme", '"dark"');
    localStorage.setItem("count", "42");

    const { getByText } = render(
      <StoreLocalNode
        id="test-node"
        data={{
          mode: "delete",
          inputData: { theme: "dark", count: 42 },
          triggerInput: true,
          lastTriggerState: false,
        }}
      />
    );

    // Should show delete mode
    expect(getByText("Delete")).toBeInTheDocument();

    // Should delete the data
    await waitFor(() => {
      expect(localStorage.getItem("theme")).toBeNull();
      expect(localStorage.getItem("count")).toBeNull();
    });

    // Should show success status
    expect(getByText(/success/i)).toBeInTheDocument();
  });
});
```

## Visual Design

### Collapsed State (C2 - 120x120px)

- Mode toggle button centered in upper portion
- Status indicator (icon + text) in lower portion
- Minimal data preview if space allows

### Expanded State (VE2 - 180px width, auto height)

- Mode toggle button at top
- Data preview section showing keys and values
- Status display with detailed information
- Operation history (last few operations)
- Error messages if any

### Color Scheme

- Store mode: Blue theme (#3B82F6)
- Delete mode: Red theme (#EF4444)
- Success states: Green (#10B981)
- Error states: Red (#EF4444)
- Processing states: Yellow (#F59E0B)
- Disabled states: Gray (#6B7280)

## Performance Considerations

### Optimization Strategies

1. **Debounced Operations**: Prevent rapid-fire operations
2. **Memoized Components**: Prevent unnecessary re-renders
3. **Lazy Serialization**: Only serialize when actually storing
4. **Batch Operations**: Group multiple key operations
5. **Error Boundaries**: Isolate localStorage failures

### Memory Management

- Clear operation history after 10 entries
- Limit data preview to 5 items
- Use weak references for temporary data
- Clean up event listeners on unmount

## Security Considerations

### Data Validation

- Validate input data structure before processing
- Sanitize keys to prevent localStorage pollution
- Limit maximum data size per operation
- Prevent circular reference serialization

### Error Information

- Don't expose sensitive data in error messages
- Log detailed errors to console only in development
- Provide user-friendly error messages
- Rate limit error reporting to prevent spam
