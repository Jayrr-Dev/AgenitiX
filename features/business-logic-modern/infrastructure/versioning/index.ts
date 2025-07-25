/**
 * VERSIONING SYSTEM - Public API (Client-Safe)
 *
 * • Exports only client-safe version constants
 * • Provides clean imports for version-related functionality
 * • Maintains separation of concerns while offering convenience
 * • Server-side functionality is exported separately
 */

// Main version constant - safe for client-side use
export { VERSION } from "./version";

// Note: Server-side functionality (versionDetector, dashboard, etc.) 
// is available in the server-side versioning module
