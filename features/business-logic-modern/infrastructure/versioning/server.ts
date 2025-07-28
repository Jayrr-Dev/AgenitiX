/**
 * VERSIONING SYSTEM - Server-Side API
 *
 * • Exports server-side versioning functionality
 * • Contains Node.js specific modules (fs, path, etc.)
 * • Should only be imported in server-side code
 * • Provides version detection, dashboard, and migration tools
 */

// Version configuration for advanced use cases
export { VERSION_CONFIG } from "./auto-version";

// Version detector for programmatic version checking
export { versionDetector } from "./version-detector";

// Dashboard for status monitoring
export { dashboard } from "./status-dashboard";

// Auto-migrator for data migrations
export { autoMigrator } from "./auto-migrate";
