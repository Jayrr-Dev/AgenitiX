# Open Source Migration Guide

This document outlines the database migration process for transitioning AgenitiX to open source.

## Overview

The open source migration adds community features, contribution tracking, and metadata to support the open source ecosystem around AgenitiX.

## Migration Details

### Version: 0.12.0

### Migration Name: `open_source_preparation`

### Applied: 2025-01-23

## New Tables Added

### 1. `open_source_metadata`

Stores project-level open source information.

```typescript
{
  project_name: string,
  license: string,
  version: string,
  open_source_since: number,
  github_url: string,
  documentation_url: string,
  community_features_enabled: boolean,
  contribution_tracking_enabled: boolean,
  created_at: number,
  updated_at: number
}
```

### 2. `feature_flags`

Manages feature flags for community features.

```typescript
{
  flag_name: string,
  description: string,
  enabled: boolean,
  created_at: number,
  updated_at: number
}
```

### 3. `migrations`

Tracks applied database migrations.

```typescript
{
  version: string,
  name: string,
  description: string,
  applied_at: number,
  changes: string[]
}
```

## Updated Tables

### 1. `users` Table

Added open source community fields:

```typescript
{
  // ... existing fields
  contribution_metadata?: {
    is_contributor: boolean,
    contribution_count: number,
    first_contribution_at?: number,
    last_contribution_at?: number,
    contribution_types: string[]
  },
  open_source_user?: boolean
}
```

### 2. `flows` Table

Added open source metadata:

```typescript
{
  // ... existing fields
  open_source_metadata?: {
    is_community_template: boolean,
    contribution_status: "private" | "public" | "featured" | "archived",
    license: string,
    tags: string[],
    created_for_open_source: boolean
  }
}
```

## Running the Migration

### Using Convex Functions

```typescript
// Check migration status
const status = await ctx.runQuery(api.migrationRunner.checkMigrationStatus, {
  migrationName: "open_source_preparation",
});

// Run the migration
const result = await ctx.runMutation(
  api.migrationRunner.runOpenSourceMigration,
  {}
);

// List all migrations
const migrations = await ctx.runQuery(api.migrationRunner.listMigrations, {});
```

### Using Convex Dashboard

1. Navigate to your Convex dashboard
2. Go to the Functions tab
3. Find `migrationRunner:runOpenSourceMigration`
4. Click "Run" to execute the migration

### Using CLI

```bash
# Check if migration exists
npx convex run migrationRunner:checkMigrationStatus --args '{"migrationName": "open_source_preparation"}'

# Run the migration
npx convex run migrationRunner:runOpenSourceMigration

# List all migrations
npx convex run migrationRunner:listMigrations
```

## Feature Flags

The migration creates three feature flags:

1. **`community_contributions`** - Enable community contribution features
2. **`open_source_analytics`** - Enable open source usage analytics
3. **`community_templates`** - Enable community template sharing

### Managing Feature Flags

```typescript
// Get all feature flags
const flags = await ctx.runQuery(api.migrationRunner.getFeatureFlags, {});

// Update a feature flag
await ctx.runMutation(api.migrationRunner.updateFeatureFlag, {
  flagName: "community_contributions",
  enabled: true,
});
```

## Rollback

If you need to rollback the migration, you can use the rollback function:

```typescript
// Note: This will remove all open source data
await ctx.runMutation(api.migrations.rollbackOpenSourcePreparation, {});
```

## Verification

After running the migration, verify it was successful:

```typescript
// Check migration was applied
const status = await ctx.runQuery(api.migrationRunner.checkMigrationStatus, {
  migrationName: "open_source_preparation",
});

// Verify open source metadata exists
const metadata = await ctx.runQuery(
  api.migrationRunner.getOpenSourceMetadata,
  {}
);

// Check feature flags were created
const flags = await ctx.runQuery(api.migrationRunner.getFeatureFlags, {});
```

## Data Impact

### Existing Data

- **Flows**: All existing flows will be marked as `private` with MIT license
- **Users**: All existing users will be marked as `open_source_user: true`
- **No data loss**: The migration only adds new fields, existing data remains intact

### New Capabilities

- Community template sharing
- Contribution tracking
- Open source analytics
- Feature flag management
- Migration history tracking

## Troubleshooting

### Migration Already Applied

If you see "migration has already been applied", the migration was successful. You can check the status:

```typescript
const status = await ctx.runQuery(api.migrationRunner.checkMigrationStatus, {
  migrationName: "open_source_preparation",
});
```

### Schema Conflicts

If you encounter schema conflicts, ensure your `convex/schema.ts` includes the new tables and fields before running the migration.

### Permission Issues

Ensure your Convex deployment has the necessary permissions to create tables and modify existing ones.

## Next Steps

After running the migration:

1. **Update your application code** to use the new open source features
2. **Configure feature flags** based on your needs
3. **Set up community templates** for sharing workflows
4. **Enable contribution tracking** for community members
5. **Monitor open source analytics** to understand usage patterns

## Support

For issues with the migration:

1. Check the Convex logs for error messages
2. Verify your schema includes all required tables
3. Ensure you have the latest version of the migration code
4. Contact the AgenitiX team for assistance

## Migration History

| Version | Name                    | Date       | Description                   |
| ------- | ----------------------- | ---------- | ----------------------------- |
| 0.12.0  | open_source_preparation | 2025-01-23 | Initial open source migration |
