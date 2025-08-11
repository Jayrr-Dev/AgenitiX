/**
 * VIRTUALIZED OBJECT VIEWER - Efficient rendering for large objects in ToObject node
 *
 * • Virtual scrolling for performance with large key-value datasets
 * • Only renders visible items plus buffer for smooth scrolling
 * • Handles nested objects and primitive values
 * • Fixed-height item rendering for consistent scrolling
 * • Lightweight JSON highlighting for object entries
 *
 * Keywords: virtualization, object-viewer, performance, scrolling, large-data
 */

"use client";

import { JsonHighlighter } from "@/features/business-logic-modern/infrastructure/node-inspector/utils/JsonHighlighter";
import { memo, useCallback, useMemo, useRef, useState } from "react";

interface VirtualizedObjectViewerProps {
  /** Object data to display */
  data: Record<string, unknown>;
  /** Height of the container in pixels */
  containerHeight: number;
  /** Height of each item in pixels */
  itemHeight?: number;
  /** Number of items to render outside viewport */
  overscan?: number;
  /** Additional CSS classes */
  className?: string;
}

const VirtualizedObjectViewer = memo<VirtualizedObjectViewerProps>(
  ({
    data,
    containerHeight,
    itemHeight = 100, // [Explanation], basically increased height for complex objects
    overscan = 3, // [Explanation], basically fewer overscan items since they're taller
    className = "",
  }) => {
    const [scrollTop, setScrollTop] = useState(0);
    const scrollElementRef = useRef<HTMLDivElement>(null);

    // Convert object to entries array for virtualization
    const entries = useMemo(() => Object.entries(data), [data]);

    const totalHeight = entries.length * itemHeight;
    const containerViewportHeight = containerHeight - 32; // [Explanation], basically subtract header height

    // Calculate visible range with overscan
    const startIndex = Math.max(
      0,
      Math.floor(scrollTop / itemHeight) - overscan
    );
    const endIndex = Math.min(
      entries.length - 1,
      Math.ceil((scrollTop + containerViewportHeight) / itemHeight) + overscan
    );

    // Handle scroll events
    const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
      setScrollTop(e.currentTarget.scrollTop);
    }, []);

    // Render individual object entry
    const renderEntry = useCallback(
      (key: string, value: unknown, index: number, offsetTop: number) => {
        const isObject =
          value && typeof value === "object" && !Array.isArray(value);
        const isArray = Array.isArray(value);
        const isPrimitive = !isObject && !isArray;

        return (
          <div
            key={`${key}-${index}`}
            className="absolute w-full border-b border-muted/20 hover:bg-muted/30 transition-colors"
            style={{
              top: offsetTop,
              height: itemHeight,
            }}
          >
            <div className="flex h-full p-2 gap-2">
              {/* Key badge */}
              <div className="flex-shrink-0">
                <span className="text-[9px] text-blue-600 dark:text-blue-400 font-mono bg-blue-50 dark:bg-blue-950 px-1.5 py-0.5 rounded font-medium">
                  {key}
                </span>
              </div>

              {/* Content area */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-col h-full">
                  {/* Type indicator */}
                  <div className="flex items-center gap-1 mb-1">
                    <span className="text-[8px] text-muted-foreground/70 px-1 py-0.5 bg-muted/30 rounded">
                      {isArray
                        ? `Array(${(value as unknown[]).length})`
                        : isObject
                          ? "Object"
                          : typeof value}
                    </span>
                  </div>

                  {/* Value display */}
                  <div className="flex-1 min-h-0 overflow-auto bg-muted/10 rounded p-1.5">
                    <div className="text-[9px] font-mono leading-tight">
                      {isPrimitive ? (
                        <span
                          className={`${
                            typeof value === "string"
                              ? "text-green-600 dark:text-green-400"
                              : typeof value === "number"
                                ? "text-blue-600 dark:text-blue-400"
                                : typeof value === "boolean"
                                  ? "text-purple-600 dark:text-purple-400"
                                  : "text-gray-600 dark:text-gray-400"
                          }`}
                        >
                          {typeof value === "string"
                            ? `"${value}"`
                            : String(value)}
                        </span>
                      ) : (
                        <JsonHighlighter
                          value={value}
                          className="text-[8px] leading-relaxed"
                          maxLines={4}
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      },
      [itemHeight]
    );

    // Render visible items
    const visibleItems = useMemo(() => {
      const items = [];
      for (let i = startIndex; i <= endIndex; i++) {
        if (i >= 0 && i < entries.length) {
          const [key, value] = entries[i];
          const offsetTop = i * itemHeight;
          items.push(renderEntry(key, value, i, offsetTop));
        }
      }
      return items;
    }, [startIndex, endIndex, entries, itemHeight, renderEntry]);

    // Handle empty state
    if (entries.length === 0) {
      return (
        <div
          className={`flex items-center justify-center h-full text-xs text-muted-foreground ${className}`}
        >
          No object properties to display
        </div>
      );
    }

    return (
      <div
        className={`relative border border-muted/20 rounded bg-background ${className}`}
      >
        {/* Header with object info */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-muted/20 px-3 py-2">
          <span className="text-[10px] text-muted-foreground font-medium">
            Object({entries.length} keys)
          </span>
        </div>

        {/* Virtualized content */}
        <div
          ref={scrollElementRef}
          className="nowheel relative overflow-auto"
          style={{ height: containerViewportHeight }}
          onScroll={handleScroll}
        >
          {/* Total height spacer */}
          <div style={{ height: totalHeight, position: "relative" }}>
            {/* Visible items */}
            {visibleItems}
          </div>
        </div>

        {/* Scroll indicator */}
        {entries.length > Math.ceil(containerViewportHeight / itemHeight) && (
          <div className="absolute right-1 top-8 bottom-1 w-1 bg-muted/20 rounded">
            <div
              className="bg-muted-foreground/40 rounded w-full transition-all"
              style={{
                height: `${Math.max(10, (containerViewportHeight / totalHeight) * 100)}%`,
                transform: `translateY(${(scrollTop / totalHeight) * containerViewportHeight}px)`,
              }}
            />
          </div>
        )}
      </div>
    );
  }
);

VirtualizedObjectViewer.displayName = "VirtualizedObjectViewer";

export { VirtualizedObjectViewer };
