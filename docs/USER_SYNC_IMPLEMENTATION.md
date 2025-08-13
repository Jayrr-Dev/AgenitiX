# User Synchronization Implementation

This document outlines the implementation of bidirectional synchronization between Convex Auth's `users` table and the custom `auth_users` table.

## Overview

The synchronization system ensures data consistency between:
- **`users` table**: Convex Auth's standard authentication table
- **`auth_users` table**: Custom table with domain-specific fields and naming conventions

## Key Features

### 1. Bidirectional Sync
- Changes in either table are automatically synchronized to the other
- Cross-reference IDs maintain relationships between records
- Automatic conflict resolution with data source priority

### 2. Schema Enhancements
- Added `auth_user_id` field to `users` table
- Added `convex_user_id` field to `auth_users` table
- Indexed cross-references for efficient lookups

### 3. Authentication Flow Integration
- `afterUserCreatedOrUpdated` callback in `convex/auth.ts` handles automatic sync
- New users get records in both tables immediately
- Existing users are linked during next authentication

## Files Modified

### Core Authentication (`convex/auth.ts`)
- Enhanced `afterUserCreatedOrUpdated` callback
- Automatic sync during OAuth authentication
- Cross-reference establishment

### Schema Updates (`convex/schema.ts`)
- Added cross-reference fields to both tables
- New indexes for efficient cross-table queries
- Maintained backward compatibility

### Sync Utilities (`convex/userSync.ts`)
- `syncAuthUserToConvexUser`: Sync from auth_users to users
- `syncConvexUserToAuthUser`: Sync from users to auth_users
- `getUserByEmail`: Find user in either table
- `syncAllUsers`: Bulk migration utility

### User Queries (`convex/users.ts`)
- `getCurrentUser`: Get authenticated user with complete data
- `getUserById`: Flexible user lookup with fallbacks
- `updateUserProfile`: Update profile across both tables
- `getUserByEmail`: Email-based user lookup

### Migration (`convex/migrations/syncUserTables.ts`)
- One-time migration to sync existing data
- Establishes cross-references for existing records
- Safe to run multiple times (idempotent)

## Usage Examples

### Get Current User
```typescript
const user = await api.users.getCurrentUser();
// Returns unified user data from both tables
```

### Update User Profile
```typescript
await api.users.updateUserProfile({
  name: "John Doe",
  company: "Acme Corp",
  role: "Developer"
});
// Updates both tables automatically
```

### Manual Sync (if needed)
```typescript
// Sync specific user from auth_users to users
await api.userSync.syncAuthUserToConvexUser({
  authUserId: "auth_user_id",
});

// Bulk sync all users
await api.userSync.syncAllUsers();
```

## Migration Process

1. **Deploy Schema Changes**
   ```bash
   npx convex deploy
   ```

2. **Run Migration**
   ```bash
   npx convex run migrations/syncUserTables:syncUserTables
   ```

3. **Verify Sync**
   - Check that cross-references are established
   - Verify data consistency between tables

## Data Flow

### New User Registration (OAuth)
1. Convex Auth creates record in `users` table
2. `afterUserCreatedOrUpdated` callback triggered
3. Corresponding record created in `auth_users` table
4. Cross-references established in both tables
5. Starter templates provisioned for new users

### User Authentication
1. User authenticates via OAuth
2. `users` table updated with latest profile data
3. Corresponding `auth_users` record synchronized
4. Last login timestamp updated in both tables

### Profile Updates
1. Client calls `updateUserProfile`
2. Both tables updated simultaneously
3. Cross-references maintained
4. Timestamp consistency preserved

## Best Practices

### Query Patterns
- Use `users.getCurrentUser()` for authenticated user data
- Use `users.getUserByEmail()` for email-based lookups
- Prefer unified query functions over direct table access

### Data Consistency
- Always update through provided mutation functions
- Don't modify tables directly for user data
- Use cross-references for efficient joins

### Performance
- Cross-reference indexes enable O(1) lookups
- Avoid querying by email when IDs are available
- Batch operations when possible

## Troubleshooting

### Missing Cross-References
If users exist without cross-references:
```bash
npx convex run migrations/syncUserTables:syncUserTables
```

### Data Inconsistency
If data differs between tables:
```bash
npx convex run userSync:syncAllUsers
```

### New User Issues
Check that `afterUserCreatedOrUpdated` callback is working:
1. Verify auth configuration
2. Check for callback errors in logs
3. Ensure both tables have proper permissions

## Future Considerations

### Migration to Single Table
When ready to migrate to a single table:
1. All data will be in both tables
2. Cross-references provide migration path
3. Can gradually deprecate `auth_users` table

### Additional Sync Triggers
Consider adding triggers for:
- Profile image updates
- Email verification changes
- Account status modifications

## Security Notes

- Cross-references don't expose sensitive data
- Authentication still uses Convex Auth standards
- User permissions preserved across tables
- Session management unchanged