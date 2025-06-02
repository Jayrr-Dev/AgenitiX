/**
 * AUTO-VERSIONING SYSTEM - Set it and forget it
 *
 * • Automatically detects changes and bumps versions
 * • Uses file hashes and timestamps for version detection
 * • Zero maintenance after initial setup
 * • Self-migrating and self-documenting
 */

interface AutoVersionConfig {
  // Simple rules - the system handles everything else
  bumpRules: {
    major: string[]; // File patterns that trigger major bumps
    minor: string[]; // File patterns that trigger minor bumps
    patch: string[]; // Everything else gets patch bumps
  };
  autoMigrate: boolean; // Auto-run migrations
  trackFiles: string[]; // Files to monitor for changes
}

export const VERSION_CONFIG: AutoVersionConfig = {
  bumpRules: {
    // Major: Breaking changes
    major: [
      "*/types/nodeData.ts", // Type changes = breaking
      "*/factory/NodeFactory.tsx", // Factory changes = breaking
      "*/node-registry/nodeRegistry.ts", // Registry structure changes
    ],

    // Minor: New features
    minor: [
      "*/node-domain/**/*.tsx", // New nodes = minor
      "*/infrastructure/**/*.ts", // New infrastructure = minor
    ],

    // Patch: Everything else (bug fixes, docs, etc.)
    patch: ["**/*"],
  },

  autoMigrate: true,
  trackFiles: [
    "features/business-logic-modern/**/*.ts",
    "features/business-logic-modern/**/*.tsx",
  ],
};
