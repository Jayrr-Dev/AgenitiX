/**
 * VERSIONING SYSTEM - Public API
 *
 * • Exports the main version constant for application use
 * • Provides clean imports for version-related functionality
 * • Maintains separation of concerns while offering convenience
 */

// Main version constant - most commonly imported
export { VERSION } from "./version";

// Version configuration for advanced use cases
export { VERSION_CONFIG } from "./auto-version";

// Version detector for programmatic version checking
export { versionDetector } from "./version-detector";

// Dashboard for status monitoring
export { dashboard } from "./status-dashboard";

// Auto-migrator for data migrations
export { autoMigrator } from "./auto-migrate";
