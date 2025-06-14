/**
 * MODULE DECLARATION - lz-string
 *
 * Minimal ambient declarations to satisfy TypeScript when bundling.
 * We only expose the UTF-16 compression helpers used for localStorage persistence.
 */

declare module "lz-string" {
  /** Compress a string into UTF-16 safe text */
  export function compressToUTF16(input: string): string;
  /** Decompress a UTF-16 string */
  export function decompressFromUTF16(compressed: string): string | null;
}
