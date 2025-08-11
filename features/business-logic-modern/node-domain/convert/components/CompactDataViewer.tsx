/**
 * COMPACT DATA VIEWER - Reusable component for displaying array/object data in ViewArray style
 *
 * • ViewArray-style compact display with expandability
 * • Type indicators and color coding
 * • Interactive tooltips and cursor states
 * • Configurable limits and expansion
 * • Handles arrays, objects, and primitive values
 *
 * Keywords: compact-viewer, data-display, reusable, expandable, type-safe
 */

"use client";

import { memo, useCallback, useState } from "react";

interface CompactDataViewerProps {
  /** Data to display (array, object, or primitive) */
  data: unknown;
  /** Label for the data section */
  label?: string;
  /** Initial number of items to show */
  initialLimit?: number;
  /** Maximum height of the container */
  maxHeight?: string;
  /** Whether to show expand/collapse functionality */
  expandable?: boolean;
  /** Whether to enable drill-down navigation like ViewArray */
  drillable?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Custom empty state message */
  emptyMessage?: string;
}

const CompactDataViewer = memo<CompactDataViewerProps>(
  ({
    data,
    label = "Data",
    initialLimit = 20,
    maxHeight = "max-h-32",
    expandable = true,
    drillable = false,
    className = "",
    emptyMessage = "(empty)",
  }) => {
    const [itemLimit, setItemLimit] = useState(initialLimit);
    const [isExpanded, setIsExpanded] = useState(false);
    const [viewPath, setViewPath] = useState<(string | number)[]>([]);

    // Handle expand/collapse
    const toggleExpanded = useCallback(() => {
      setIsExpanded(!isExpanded);
    }, [isExpanded]);

    // Load more items
    const loadMore = useCallback(() => {
      setItemLimit((prev) => prev + 20);
    }, []);

    // Resolve nested value at a given path (like ViewArray)
    const resolveAtPath = useCallback(
      (root: unknown, path: (string | number)[]): unknown => {
        let current: unknown = root;
        for (const segment of path) {
          if (current && typeof current === "object") {
            const asRecord = current as
              | Record<string, unknown>
              | Array<unknown>;
            if (Array.isArray(asRecord)) {
              const index =
                typeof segment === "number" ? segment : Number(segment);
              current = Number.isFinite(index) ? asRecord[index] : undefined;
            } else {
              current = (asRecord as Record<string, unknown>)[String(segment)];
            }
          } else {
            return undefined;
          }
        }
        return current;
      },
      []
    );

    // Drill into a nested key
    const drillIntoKey = useCallback(
      (key: string | number) => {
        const target = resolveAtPath(data, [...viewPath, key]);
        if (target && typeof target === "object") {
          setViewPath([...viewPath, key]);
          setItemLimit(initialLimit); // Reset item limit when drilling
        }
      },
      [data, viewPath, resolveAtPath, initialLimit]
    );

    // Go back one level
    const goBack = useCallback(() => {
      if (viewPath.length > 0) {
        setViewPath(viewPath.slice(0, -1));
        setItemLimit(initialLimit);
      }
    }, [viewPath, initialLimit]);

    // Jump to specific depth
    const jumpToDepth = useCallback(
      (depth: number) => {
        setViewPath(viewPath.slice(0, depth));
        setItemLimit(initialLimit);
      },
      [viewPath, initialLimit]
    );

    // Render individual data item
    const renderItem = useCallback(
      (
        key: string | number,
        value: unknown,
        index: number,
        isArray: boolean,
        totalShown: number
      ) => {
        const isDrillable = value !== null && typeof value === "object";

        // Count actual enumerable properties for objects
        const getObjectSize = (obj: unknown): number => {
          if (!obj || typeof obj !== "object") return 0;
          if (Array.isArray(obj)) return obj?.length ?? 0;
          return Object.keys(obj as Record<string, unknown>).length;
        };

        return (
          <div
            key={`data-item-${key}-${index}`}
            className={`truncate select-text cursor-text nodrag nowheel ${
              isDrillable && drillable ? "cursor-zoom-in" : ""
            }`}
            title={
              isDrillable && drillable
                ? "Double-click to drill down"
                : isDrillable
                  ? "Complex object - not drillable in this view"
                  : `Value: ${String(value)}`
            }
            onDoubleClick={(e) => {
              if (isDrillable && drillable) {
                e.stopPropagation();
                drillIntoKey(key);
              }
            }}
          >
            <span className="text-red-400">
              {isArray ? `[${key}]` : `"${String(key)}"`}
            </span>
            <span className="text-foreground/70">: </span>
            <span className={isDrillable ? "text-blue-400" : "text-blue-300"}>
              {Array.isArray(value)
                ? `array(${getObjectSize(value)})`
                : typeof value === "object" && value !== null
                  ? `object(${getObjectSize(value)})`
                  : typeof value === "string"
                    ? `"${String(value).substring(0, 30)}${String(value).length > 30 ? "..." : ""}"`
                    : String(value)}
            </span>
            {index < totalShown - 1 && (
              <span className="text-foreground/50">,</span>
            )}
          </div>
        );
      },
      [drillable, drillIntoKey]
    );

    // Render data content
    const renderDataContent = useCallback(() => {
      // Get current view based on path
      const currentView =
        drillable && viewPath.length > 0 ? resolveAtPath(data, viewPath) : data;

      if (currentView === null || currentView === undefined) {
        return <div className="text-muted-foreground">{emptyMessage}</div>;
      }

      // Render breadcrumb navigation if drillable and we're not at root
      const breadcrumb = drillable && viewPath.length > 0 && (
        <div className="mb-2 flex items-center gap-1 text-[9px] text-foreground/70">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              goBack();
            }}
            className="px-1 py-[1px] rounded border border-border/40 hover:bg-muted/40"
            aria-label="Back"
            title="Back"
          >
            ←
          </button>
          <div className="truncate">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                jumpToDepth(0);
              }}
              className="hover:underline"
              title="root"
            >
              root
            </button>
            {viewPath.map((seg, i) => (
              <span key={`crumb-${i}`}>
                <span className="mx-1 text-foreground/40">/</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    jumpToDepth(i + 1);
                  }}
                  className="hover:underline"
                  title={String(seg)}
                >
                  {typeof seg === "string" ? seg : `[${seg}]`}
                </button>
              </span>
            ))}
          </div>
        </div>
      );

      // Handle arrays
      if (Array.isArray(currentView)) {
        const arrayData = currentView as unknown[];
        if ((arrayData?.length ?? 0) === 0) {
          return (
            <div>
              {breadcrumb}
              <div className="text-muted-foreground">(empty array)</div>
            </div>
          );
        }

        const shown = arrayData.slice(0, itemLimit);
        return (
          <div>
            {breadcrumb}
            {shown.map((item, idx) =>
              renderItem(idx, item, idx, true, shown.length)
            )}
            {(arrayData?.length ?? 0) > shown.length && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  loadMore();
                }}
                className="text-foreground/50 hover:underline mt-1"
                title="Load more items"
              >
                … +{(arrayData?.length ?? 0) - shown.length} more items
              </button>
            )}
          </div>
        );
      }

      // Handle objects
      if (typeof currentView === "object" && currentView !== null) {
        const objectData = currentView as Record<string, unknown>;
        const entries = Object.entries(objectData);
        if (entries.length === 0) {
          return (
            <div>
              {breadcrumb}
              <div className="text-muted-foreground">(empty object)</div>
            </div>
          );
        }

        const shown = entries.slice(0, itemLimit);
        return (
          <div>
            {breadcrumb}
            {shown.map(([key, value], idx) =>
              renderItem(key, value, idx, false, shown.length)
            )}
            {entries.length > shown.length && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  loadMore();
                }}
                className="text-foreground/50 hover:underline mt-1"
                title="Load more properties"
              >
                … +{entries.length - shown.length} more properties
              </button>
            )}
          </div>
        );
      }

      // Handle primitive values
      const typeText = typeof currentView;
      return (
        <div>
          {breadcrumb}
          <div className="text-blue-300">
            <span className="text-muted-foreground text-[9px]">
              {typeText}:{" "}
            </span>
            {typeof currentView === "string"
              ? `"${String(currentView)}"`
              : String(currentView)}
          </div>
        </div>
      );
    }, [
      data,
      viewPath,
      drillable,
      resolveAtPath,
      emptyMessage,
      goBack,
      jumpToDepth,
      itemLimit,
      loadMore,
      renderItem,
    ]);

    return (
      <div className={className}>
        {/* Header with label and optional expand button */}
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-muted-foreground">
            {label}:
          </label>
          {expandable && (
            <button
              type="button"
              onClick={toggleExpanded}
              className="text-[9px] text-muted-foreground hover:text-foreground px-1 py-0.5 rounded hover:bg-muted/30"
              title={isExpanded ? "Collapse" : "Expand"}
            >
              {isExpanded ? "−" : "+"}
            </button>
          )}
        </div>

        {/* Data content */}
        <div
          className={`mt-1 overflow-y-auto rounded-md border border-border/30 bg-muted/20 p-2 font-mono text-[10px] leading-tight text-foreground/90 nowheel transition-all ${
            isExpanded ? "max-h-64" : maxHeight
          }`}
        >
          {renderDataContent()}
        </div>
      </div>
    );
  }
);

CompactDataViewer.displayName = "CompactDataViewer";

export { CompactDataViewer };
