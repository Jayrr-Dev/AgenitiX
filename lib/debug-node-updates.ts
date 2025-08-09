/**
 * TEMPORARY DEBUG HELPER - Track excessive node updates
 *
 * Add this to components to see which nodes update most during lag
 * Remove after debugging
 */

let updateCounts = new Map<string, number>();
let lastReset = Date.now();

export function trackNodeUpdate(nodeId: string, reason: string) {
  if (process.env.NODE_ENV !== "development") return;

  const count = updateCounts.get(nodeId) || 0;
  updateCounts.set(nodeId, count + 1);

  // Log excessive updates
  if (count > 5) {
    console.warn(
      `[node-update] ${nodeId} updated ${count + 1} times (${reason})`
    );
  }

  // Reset every 5 seconds to avoid memory buildup
  if (Date.now() - lastReset > 5000) {
    const top = Array.from(updateCounts.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);
    if (top.length > 0) {
      console.table(top);
    }
    updateCounts.clear();
    lastReset = Date.now();
  }
}
