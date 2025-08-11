/**
 * TIME Domain Utilities - Professional data handling and formatting
 * 
 * Provides flexible, type-safe utilities for TIME nodes to handle any data type
 * with professional visualization and output formatting.
 */

// -----------------------------------------------------------------------------
// Data Type Detection & Classification
// -----------------------------------------------------------------------------

export type DataType = 'string' | 'number' | 'boolean' | 'object' | 'array' | 'null' | 'undefined' | 'function' | 'date';

/**
 * Detects the actual type of any value with high precision
 */
export function detectDataType(value: any): DataType {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (Array.isArray(value)) return 'array';
  if (value instanceof Date) return 'date';
  if (typeof value === 'function') return 'function';
  return typeof value as DataType;
}

/**
 * Checks if a value is a primitive type (string, number, boolean, null, undefined)
 */
export function isPrimitive(value: any): boolean {
  const type = detectDataType(value);
  return ['string', 'number', 'boolean', 'null', 'undefined'].includes(type);
}

/**
 * Checks if a value is a complex type (object, array, function, date)
 */
export function isComplex(value: any): boolean {
  return !isPrimitive(value);
}

// -----------------------------------------------------------------------------
// Professional Data Formatting
// -----------------------------------------------------------------------------

/**
 * Formats any value for display with intelligent truncation and type awareness
 */
export function formatValueForDisplay(value: any, maxLength: number = 50): string {
  const type = detectDataType(value);
  
  switch (type) {
    case 'null':
      return 'null';
    
    case 'undefined':
      return 'undefined';
    
    case 'string':
      if (value.length <= maxLength) return `"${value}"`;
      return `"${value.substring(0, maxLength - 3)}..."`;
    
    case 'number':
      // Handle special numbers
      if (Number.isNaN(value)) return 'NaN';
      if (!Number.isFinite(value)) return value > 0 ? 'Infinity' : '-Infinity';
      
      // Format large numbers with commas
      if (Math.abs(value) >= 1000) {
        return value.toLocaleString();
      }
      
      // Format decimals nicely
      if (value % 1 !== 0) {
        return Number.parseFloat(value.toFixed(6)).toString();
      }
      
      return value.toString();
    
    case 'boolean':
      return value ? 'true' : 'false';
    
    case 'date':
      return value.toISOString();
    
    case 'function':
      const funcStr = value.toString();
      const firstLine = funcStr.split('\n')[0];
      if (firstLine.length <= maxLength) return firstLine;
      return `${firstLine.substring(0, maxLength - 3)}...`;
    
    case 'array':
      if (value.length === 0) return '[]';
      if (value.length === 1) {
        const itemStr = formatValueForDisplay(value[0], maxLength - 4);
        return `[${itemStr}]`;
      }
      
      const preview = value.slice(0, 3).map((item: any) => 
        formatValueForDisplay(item, 15)
      ).join(', ');
      
      if (value.length <= 3) {
        return `[${preview}]`;
      }
      
      return `[${preview}, ...+${value.length - 3}]`;
    
    case 'object':
      if (value.constructor !== Object) {
        // Custom class instance
        const className = value.constructor.name;
        return `${className} {...}`;
      }
      
      const keys = Object.keys(value);
      if (keys.length === 0) return '{}';
      
      if (keys.length === 1) {
        const key = keys[0];
        const val = formatValueForDisplay(value[key], maxLength - key.length - 6);
        return `{${key}: ${val}}`;
      }
      
      const keyPreview = keys.slice(0, 2).map(key => {
        const val = formatValueForDisplay(value[key], 10);
        return `${key}: ${val}`;
      }).join(', ');
      
      if (keys.length <= 2) {
        return `{${keyPreview}}`;
      }
      
      return `{${keyPreview}, ...+${keys.length - 2}}`;
    
    default:
      return String(value);
  }
}

/**
 * Formats a value for compact display (single line, very short)
 */
export function formatValueCompact(value: any): string {
  return formatValueForDisplay(value, 20);
}

/**
 * Formats a value for detailed display (multi-line if needed)
 */
export function formatValueDetailed(value: any): string {
  const type = detectDataType(value);
  
  switch (type) {
    case 'object':
      try {
        return JSON.stringify(value, null, 2);
      } catch {
        return '[Circular Object]';
      }
    
    case 'array':
      try {
        return JSON.stringify(value, null, 2);
      } catch {
        return '[Circular Array]';
      }
    
    default:
      return formatValueForDisplay(value, 200);
  }
}

// -----------------------------------------------------------------------------
// Handle Type Detection & Adaptation
// -----------------------------------------------------------------------------

/**
 * Maps data types to appropriate handle codes for ReactFlow connections
 */
export function getHandleCodeForType(type: DataType): string {
  switch (type) {
    case 'string': return 's';
    case 'number': return 'n';
    case 'boolean': return 'b';
    case 'array': return 'a';
    case 'object': return 'j'; // JSON
    case 'date': return 's'; // Treat as string
    case 'function': return 'x'; // Any
    case 'null':
    case 'undefined':
    default:
      return 'x'; // Any
  }
}

/**
 * Maps data types to human-readable type names
 */
export function getTypeDisplayName(type: DataType): string {
  switch (type) {
    case 'string': return 'String';
    case 'number': return 'Number';
    case 'boolean': return 'Boolean';
    case 'array': return 'Array';
    case 'object': return 'Object';
    case 'date': return 'Date';
    case 'function': return 'Function';
    case 'null': return 'Null';
    case 'undefined': return 'Undefined';
    default: return 'Any';
  }
}

/**
 * Gets appropriate ReactFlow dataType string for a value
 */
export function getDataTypeForValue(value: any): string {
  const type = detectDataType(value);
  
  switch (type) {
    case 'string': return 'String';
    case 'number': return 'Number';
    case 'boolean': return 'Boolean';
    case 'array': return 'Array';
    case 'object': return 'JSON';
    case 'date': return 'String';
    case 'function': return 'Any';
    case 'null':
    case 'undefined':
    default:
      return 'Any';
  }
}

// -----------------------------------------------------------------------------
// Time Formatting Utilities
// -----------------------------------------------------------------------------

/**
 * Converts time amount and unit to milliseconds
 */
export function convertToMs(amount: number, unit: string): number {
  switch (unit) {
    case 'ms': return amount;
    case 's': return amount * 1000;
    case 'min': return amount * 60 * 1000;
    case 'h': return amount * 60 * 60 * 1000;
    default: return amount;
  }
}

/**
 * Formats time interval for display
 */
export function formatInterval(amount: number, unit: string): string {
  if (unit === 'ms') return `${amount}ms`;
  if (unit === 's') return `${amount}s`;
  if (unit === 'min') return `${amount}min`;
  if (unit === 'h') return `${amount}h`;
  return `${amount}${unit}`;
}

/**
 * Formats milliseconds to human readable format
 */
export function formatMs(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  if (ms < 3600000) return `${(ms / 60000).toFixed(1)}min`;
  return `${(ms / 3600000).toFixed(1)}h`;
}

/**
 * Formats a timestamp to relative time (e.g., "2s ago", "in 5s")
 */
export function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = timestamp - now;
  const absDiff = Math.abs(diff);
  
  if (absDiff < 1000) {
    return diff >= 0 ? 'now' : 'just now';
  }
  
  const formatted = formatMs(absDiff);
  return diff >= 0 ? `in ${formatted}` : `${formatted} ago`;
}

// -----------------------------------------------------------------------------
// Value Transformation & Cloning
// -----------------------------------------------------------------------------

/**
 * Deep clones a value to prevent mutation issues
 */
export function deepClone<T>(value: T): T {
  if (value === null || typeof value !== 'object') {
    return value;
  }
  
  if (value instanceof Date) {
    return new Date(value.getTime()) as T;
  }
  
  if (Array.isArray(value)) {
    return value.map(item => deepClone(item)) as T;
  }
  
  if (typeof value === 'object') {
    const cloned = {} as T;
    for (const key in value) {
      if (value.hasOwnProperty(key)) {
        (cloned as any)[key] = deepClone((value as any)[key]);
      }
    }
    return cloned;
  }
  
  return value;
}

/**
 * Safely converts any value to a string representation
 */
export function safeStringify(value: any): string {
  try {
    if (typeof value === 'string') return value;
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    
    return JSON.stringify(value);
  } catch {
    return '[Unstringifiable Value]';
  }
}

/**
 * Safely parses a string to its original type if possible
 */
export function safeParse(value: string): any {
  if (typeof value !== 'string') return value;
  
  // Try to parse as JSON first
  try {
    return JSON.parse(value);
  } catch {
    // If JSON parsing fails, return as string
    return value;
  }
}

// -----------------------------------------------------------------------------
// Professional Status & State Utilities
// -----------------------------------------------------------------------------

/**
 * Generates professional status text with appropriate styling classes
 */
export function getStatusDisplay(isRunning: boolean, isEnabled: boolean): {
  text: string;
  className: string;
} {
  if (!isEnabled) {
    return {
      text: 'Disabled',
      className: 'text-slate-500 dark:text-slate-400'
    };
  }
  
  if (isRunning) {
    return {
      text: 'Running',
      className: 'text-emerald-600 dark:text-emerald-400'
    };
  }
  
  return {
    text: 'Stopped',
    className: 'text-red-500 dark:text-red-400'
  };
}

/**
 * Generates professional count display with formatting
 */
export function formatCount(count: number, label: string): string {
  if (count === 0) return `No ${label}`;
  if (count === 1) return `1 ${label.slice(0, -1)}`; // Remove 's' for singular
  if (count < 1000) return `${count} ${label}`;
  if (count < 1000000) return `${(count / 1000).toFixed(1)}k ${label}`;
  return `${(count / 1000000).toFixed(1)}M ${label}`;
}