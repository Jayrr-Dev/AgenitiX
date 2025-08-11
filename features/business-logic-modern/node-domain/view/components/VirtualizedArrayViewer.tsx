/**
 * VIRTUALIZED ARRAY VIEWER - Efficient rendering for large arrays in ViewArray node
 *
 * • Virtual scrolling for performance with large datasets
 * • Only renders visible items plus buffer for smooth scrolling
 * • Handles nested objects and primitive values
 * • Fixed-height item rendering for consistent scrolling
 * • Lightweight JSON highlighting for array items
 *
 * Keywords: virtualization, array-viewer, performance, scrolling, large-data
 */

"use client";

import { JsonHighlighter } from "@/features/business-logic-modern/infrastructure/node-inspector/utils/JsonHighlighter";
import { memo, useCallback, useMemo, useRef, useState } from "react";

interface VirtualizedArrayViewerProps {
  /** Array data to display */
  data: unknown[];
  /** Height of the container in pixels */
  containerHeight: number;
  /** Height of each item in pixels */
  itemHeight?: number;
  /** Number of items to render outside visible area for smoother scrolling */
  overscan?: number;
  /** CSS classes for styling */
  className?: string;
}

const VirtualizedArrayViewer = memo<VirtualizedArrayViewerProps>(
  ({
    data,
    containerHeight,
    itemHeight = 120, // [Explanation], basically increased height for complex objects
    overscan = 3, // [Explanation], basically fewer overscan items since they're taller
    className = "",
  }) => {
    const scrollElementRef = useRef<HTMLDivElement>(null);
    const [scrollTop, setScrollTop] = useState(0);

    // Calculate visible range based on scroll position
    const visibleRange = useMemo(() => {
      const visibleStart = Math.floor(scrollTop / itemHeight);
      const visibleEnd = Math.min(
        visibleStart + Math.ceil(containerHeight / itemHeight),
        data.length - 1
      );

      // Add overscan buffer
      const start = Math.max(0, visibleStart - overscan);
      const end = Math.min(data.length - 1, visibleEnd + overscan);

      return { start, end };
    }, [scrollTop, itemHeight, containerHeight, data.length, overscan]);

    // Handle scroll events with throttling
    const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
      setScrollTop(e.currentTarget.scrollTop);
    }, []);

    // Calculate total height and visible items
    const totalHeight = data.length * itemHeight;
    const visibleItems = useMemo(() => {
      const items = [];
      for (let i = visibleRange.start; i <= visibleRange.end; i++) {
        items.push({
          index: i,
          data: data[i],
          offsetTop: i * itemHeight,
        });
      }
      return items;
    }, [data, visibleRange, itemHeight]);

    // Format item for display
    const formatItem = useCallback((item: unknown, index: number) => {
      if (item === null) return "null";
      if (item === undefined) return "undefined";

      const type = typeof item;

      if (type === "string" || type === "number" || type === "boolean") {
        return JSON.stringify(item);
      }

      if (type === "object") {
        if (Array.isArray(item)) {
          return `Array(${item.length})`;
        }
        return "Object";
      }

      return String(item);
    }, []);

    // Render individual array item
    const renderItem = useCallback(
      (item: unknown, index: number, offsetTop: number) => {
        const isObject = item && typeof item === "object";

        return (
          <div
            key={index}
            className="absolute w-full border-b border-muted/20 px-3 py-3 hover:bg-muted/30 transition-colors flex flex-col"
            style={{
              top: offsetTop,
              minHeight: itemHeight,
              maxHeight: itemHeight,
            }}
          >
            {/* Index header */}
            <div className="flex items-center gap-2 mb-2 flex-shrink-0">
              <span className="text-[10px] text-muted-foreground font-mono bg-muted/40 px-2 py-0.5 rounded">
                [{index}]
              </span>
              {isObject ? (
                <span className="text-[9px] text-muted-foreground">
                  {Array.isArray(item)
                    ? `Array(${(item as unknown[]).length})`
                    : "Object"}
                </span>
              ) : null}
            </div>

            {/* Content with proper overflow handling */}
            <div className="flex-1 min-h-0 overflow-hidden">
              {isObject ? (
                <div className="h-full overflow-auto">
                  <JsonHighlighter
                    data={item}
                    maxDepth={2}
                    className="text-[9px] select-text cursor-text nodrag nowheel leading-tight"
                  />
                </div>
              ) : (
                <div className="font-mono text-[10px] text-foreground/80 break-words">
                  {formatItem(item, index)}
                </div>
              )}
            </div>
          </div>
        );
      },
      [itemHeight, formatItem]
    );

    // Show loading state for empty data
    if (!Array.isArray(data) || data.length === 0) {
      return (
        <div
          className={`flex items-center justify-center text-muted-foreground text-[10px] ${className}`}
        >
          {!Array.isArray(data) ? "Not an array" : "Empty array"}
        </div>
      );
    }

    return (
      <div
        className={`relative ${className}`}
        style={{ height: containerHeight }}
      >
        {/* Header with array info */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-muted/20 px-3 py-2">
          <span className="text-[10px] text-muted-foreground font-medium">
            Array({data.length} items)
          </span>
        </div>

        {/* Virtualized content */}
        <div
          ref={scrollElementRef}
          className="relative overflow-auto"
          style={{ height: containerHeight - 32 }} // [Explanation], basically subtract header height (increased)
          onScroll={handleScroll}
        >
          {/* Virtual space container */}
          <div style={{ height: totalHeight, position: "relative" }}>
            {/* Rendered items */}
            {visibleItems.map(({ index, data: itemData, offsetTop }) =>
              renderItem(itemData, index, offsetTop)
            )}
          </div>
        </div>

        {/* Scroll indicator */}
        {data.length > Math.ceil((containerHeight - 32) / itemHeight) && (
          <div className="absolute right-1 top-8 bottom-1 w-1 bg-muted/20 rounded">
            <div
              className="bg-muted-foreground/40 rounded w-full transition-all"
              style={{
                height: `${Math.max(10, ((containerHeight - 32) / totalHeight) * 100)}%`,
                transform: `translateY(${(scrollTop / totalHeight) * (containerHeight - 32)}px)`,
              }}
            />
          </div>
        )}
      </div>
    );
  }
);

VirtualizedArrayViewer.displayName = "VirtualizedArrayViewer";

export { VirtualizedArrayViewer };
