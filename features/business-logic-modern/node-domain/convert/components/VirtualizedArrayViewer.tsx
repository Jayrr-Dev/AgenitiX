/**
 * VIRTUALIZED ARRAY VIEWER - Efficient rendering for large arrays in ToArray node
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
  /** Number of items to render outside viewport */
  overscan?: number;
  /** Additional CSS classes */
  className?: string;
}

const VirtualizedArrayViewer = memo<VirtualizedArrayViewerProps>(
  ({
    data,
    containerHeight,
    itemHeight = 100, // [Explanation], basically increased height for complex objects
    overscan = 3, // [Explanation], basically fewer overscan items since they're taller
    className = "",
  }) => {
    const [scrollTop, setScrollTop] = useState(0);
    const scrollElementRef = useRef<HTMLDivElement>(null);

    const totalHeight = (data?.length ?? 0) * itemHeight;
    const containerViewportHeight = containerHeight - 32; // [Explanation], basically subtract header height

    // Calculate visible range with overscan
    const startIndex = Math.max(
      0,
      Math.floor(scrollTop / itemHeight) - overscan
    );
    const endIndex = Math.min(
      (data?.length ?? 0) - 1,
      Math.ceil((scrollTop + containerViewportHeight) / itemHeight) + overscan
    );

    // Handle scroll events
    const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
      setScrollTop(e.currentTarget.scrollTop);
    }, []);

    // Render individual array item
    const renderItem = useCallback(
      (item: unknown, index: number, offsetTop: number) => {
        const isObject =
          item && typeof item === "object" && !Array.isArray(item);
        const isArray = Array.isArray(item);
        const isPrimitive = !isObject && !isArray;

        return (
          <div
            key={index}
            className="absolute w-full border-b border-muted/20 hover:bg-muted/30 transition-colors"
            style={{
              top: offsetTop,
              height: itemHeight,
            }}
          >
            <div className="flex h-full p-2 gap-2">
              {/* Index badge */}
              <div className="flex-shrink-0">
                <span className="text-[9px] text-muted-foreground min-w-[2rem] text-right font-mono bg-muted/20 px-1.5 py-0.5 rounded">
                  [{index}]
                </span>
              </div>

              {/* Content area */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-col h-full">
                  {/* Type indicator */}
                  <div className="flex items-center gap-1 mb-1">
                    <span className="text-[8px] text-muted-foreground/70 px-1 py-0.5 bg-muted/30 rounded">
                      {isArray
                        ? `Array(${(item as unknown[])?.length ?? 0})`
                        : isObject
                          ? "Object"
                          : typeof item}
                    </span>
                  </div>

                  {/* Value display */}
                  <div className="flex-1 min-h-0 overflow-auto bg-muted/10 rounded p-1.5">
                    <div className="text-[9px] font-mono leading-tight">
                      {isPrimitive ? (
                        <span
                          className={`${
                            typeof item === "string"
                              ? "text-green-600 dark:text-green-400"
                              : typeof item === "number"
                                ? "text-blue-600 dark:text-blue-400"
                                : typeof item === "boolean"
                                  ? "text-purple-600 dark:text-purple-400"
                                  : "text-gray-600 dark:text-gray-400"
                          }`}
                        >
                          {typeof item === "string"
                            ? `"${item}"`
                            : String(item)}
                        </span>
                      ) : (
                        <JsonHighlighter
                          value={item}
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
        if (i >= 0 && i < (data?.length ?? 0)) {
          const offsetTop = i * itemHeight;
          items.push(renderItem(data[i], i, offsetTop));
        }
      }
      return items;
    }, [startIndex, endIndex, data, itemHeight, renderItem]);

    // Handle empty state
    if ((data?.length ?? 0) === 0) {
      return (
        <div
          className={`flex items-center justify-center h-full text-xs text-muted-foreground ${className}`}
        >
          No array items to display
        </div>
      );
    }

    return (
      <div
        className={`relative border border-muted/20 rounded bg-background ${className}`}
      >
        {/* Header with array info */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-muted/20 px-3 py-2">
          <span className="text-[10px] text-muted-foreground font-medium">
            Array({data?.length ?? 0} items)
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
        {data.length > Math.ceil(containerViewportHeight / itemHeight) && (
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

VirtualizedArrayViewer.displayName = "VirtualizedArrayViewer";

export { VirtualizedArrayViewer };
