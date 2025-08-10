/**
 * SAVE HISTORY PATH - Server-first; local/IDB path backup removed
 *
 * • No-ops to keep call sites intact while removing local persistence
 *
 * Keywords: persistence, indexeddb, localstorage, path-backup
 */

export async function savePathBackup(
  flowId: string | undefined,
  ids: string[]
): Promise<void> {
  // No-op: local/IDB backup removed
}

export async function getPathBackup(flowId?: string): Promise<string[] | null> {
  // No-op: server-first
  return null;
}

export async function clearPathBackup(flowId?: string): Promise<void> {
  // No-op
}
