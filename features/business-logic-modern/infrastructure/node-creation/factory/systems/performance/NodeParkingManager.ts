/**
 * NODE PARKING MANAGER - Viewport-based performance optimization
 *
 * • Provides intelligent node parking based on viewport visibility
 * • Implements Intersection Observer for performance monitoring
 * • Features automatic node lifecycle management
 * • Supports lazy loading and rendering optimizations
 *
 * Keywords: parking, viewport, intersection-observer, lazy-loading, performance
 */

// ============================================================================
// TYPES
// ============================================================================

export interface NodeParkingManager {
  observeNode: (nodeId: string, element: HTMLElement) => void;
  unobserveNode: (nodeId: string) => void;
  isNodeParked: (nodeId: string) => boolean;
  getStats: () => {
    totalNodes: number;
    parkedNodes: number;
    activeNodes: number;
  };
}

// ============================================================================
// IMPLEMENTATION
// ============================================================================

/**
 * Creates a node parking manager using Intersection Observer
 * Automatically parks nodes when they go out of viewport
 * @returns NodeParkingManager instance
 */
export function createNodeParkingManager(): NodeParkingManager {
  let observer: IntersectionObserver | null = null;
  const nodeStates = new Map<
    string,
    { element: HTMLElement; isParked: boolean }
  >();

  const initializeObserver = () => {
    if (typeof window === "undefined" || observer) return;

    try {
      observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            const nodeId = entry.target.getAttribute("data-node-id");
            if (!nodeId) continue;

            const nodeState = nodeStates.get(nodeId);
            if (!nodeState) continue;

            const isVisible = entry.isIntersecting;
            const wasParked = nodeState.isParked;

            // Park node when it goes out of viewport
            if (!isVisible && !wasParked) {
              nodeState.isParked = true;
              entry.target.setAttribute("data-parked", "true");

              // Optional: Hide expensive child components
              const expensiveElements =
                entry.target.querySelectorAll("[data-expensive]");
              expensiveElements.forEach((el) => {
                (el as HTMLElement).style.display = "none";
              });
            }

            // Unpark node when it comes back into viewport
            else if (isVisible && wasParked) {
              nodeState.isParked = false;
              entry.target.removeAttribute("data-parked");

              // Restore expensive child components
              const expensiveElements =
                entry.target.querySelectorAll("[data-expensive]");
              expensiveElements.forEach((el) => {
                (el as HTMLElement).style.display = "";
              });
            }
          }
        },
        {
          root: null, // Use viewport as root
          rootMargin: "50px", // Start observing 50px before element enters viewport
          threshold: [0, 0.1], // Trigger at 0% and 10% visibility
        }
      );
    } catch (error) {
      console.warn(
        "[NodeParkingManager] Failed to initialize IntersectionObserver:",
        error
      );
    }
  };

  const observeNode = (nodeId: string, element: HTMLElement) => {
    if (!observer) {
      initializeObserver();
    }

    if (!observer) {
      console.warn("[NodeParkingManager] Observer not available");
      return;
    }

    // Set data attribute for identification
    element.setAttribute("data-node-id", nodeId);

    // Store node state
    nodeStates.set(nodeId, { element, isParked: false });

    // Start observing
    observer.observe(element);
  };

  const unobserveNode = (nodeId: string) => {
    const nodeState = nodeStates.get(nodeId);
    if (!nodeState || !observer) return;

    observer.unobserve(nodeState.element);
    nodeStates.delete(nodeId);
  };

  const isNodeParked = (nodeId: string) => {
    const nodeState = nodeStates.get(nodeId);
    return nodeState?.isParked ?? false;
  };

  const getStats = () => {
    const totalNodes = nodeStates.size;
    let parkedNodes = 0;

    for (const state of nodeStates.values()) {
      if (state.isParked) parkedNodes++;
    }

    return {
      totalNodes,
      parkedNodes,
      activeNodes: totalNodes - parkedNodes,
    };
  };

  return {
    observeNode,
    unobserveNode,
    isNodeParked,
    getStats,
  };
}

// ============================================================================
// ADVANCED PARKING STRATEGIES
// ============================================================================

export interface ParkingStrategy {
  shouldPark: (
    element: HTMLElement,
    entry: IntersectionObserverEntry
  ) => boolean;
  onPark: (element: HTMLElement) => void;
  onUnpark: (element: HTMLElement) => void;
}

/**
 * Creates a custom parking manager with configurable strategies
 * @param strategy - Custom parking strategy
 * @returns Configured parking manager
 */
export function createCustomParkingManager(
  strategy: ParkingStrategy
): NodeParkingManager {
  let observer: IntersectionObserver | null = null;
  const nodeStates = new Map<
    string,
    { element: HTMLElement; isParked: boolean }
  >();

  const initializeObserver = () => {
    if (typeof window === "undefined" || observer) return;

    try {
      observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            const nodeId = entry.target.getAttribute("data-node-id");
            if (!nodeId) continue;

            const nodeState = nodeStates.get(nodeId);
            if (!nodeState) continue;

            const shouldPark = strategy.shouldPark(nodeState.element, entry);
            const wasParked = nodeState.isParked;

            if (shouldPark && !wasParked) {
              nodeState.isParked = true;
              strategy.onPark(nodeState.element);
            } else if (!shouldPark && wasParked) {
              nodeState.isParked = false;
              strategy.onUnpark(nodeState.element);
            }
          }
        },
        {
          root: null,
          rootMargin: "50px",
          threshold: [0, 0.1, 0.5, 1.0],
        }
      );
    } catch (error) {
      console.warn("[CustomParkingManager] Failed to initialize:", error);
    }
  };

  const observeNode = (nodeId: string, element: HTMLElement) => {
    if (!observer) {
      initializeObserver();
    }

    if (!observer) return;

    element.setAttribute("data-node-id", nodeId);
    nodeStates.set(nodeId, { element, isParked: false });
    observer.observe(element);
  };

  const unobserveNode = (nodeId: string) => {
    const nodeState = nodeStates.get(nodeId);
    if (!nodeState || !observer) return;

    observer.unobserve(nodeState.element);
    nodeStates.delete(nodeId);
  };

  const isNodeParked = (nodeId: string) => {
    return nodeStates.get(nodeId)?.isParked ?? false;
  };

  const getStats = () => {
    const totalNodes = nodeStates.size;
    let parkedNodes = 0;

    for (const state of nodeStates.values()) {
      if (state.isParked) parkedNodes++;
    }

    return {
      totalNodes,
      parkedNodes,
      activeNodes: totalNodes - parkedNodes,
    };
  };

  return {
    observeNode,
    unobserveNode,
    isNodeParked,
    getStats,
  };
}

// ============================================================================
// PREDEFINED STRATEGIES
// ============================================================================

/**
 * Default parking strategy - park when not visible
 */
export const defaultParkingStrategy: ParkingStrategy = {
  shouldPark: (element, entry) => !entry.isIntersecting,
  onPark: (element) => {
    element.setAttribute("data-parked", "true");
    element.style.visibility = "hidden";
  },
  onUnpark: (element) => {
    element.removeAttribute("data-parked");
    element.style.visibility = "visible";
  },
};

/**
 * Aggressive parking strategy - park when less than 50% visible
 */
export const aggressiveParkingStrategy: ParkingStrategy = {
  shouldPark: (element, entry) => entry.intersectionRatio < 0.5,
  onPark: (element) => {
    element.setAttribute("data-parked", "true");
    element.style.transform = "scale(0.1)";
    element.style.opacity = "0.1";
  },
  onUnpark: (element) => {
    element.removeAttribute("data-parked");
    element.style.transform = "";
    element.style.opacity = "";
  },
};
