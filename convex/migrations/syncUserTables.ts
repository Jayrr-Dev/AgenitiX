/**
 * Route: convex/migrations/syncUserTables.ts
 * USER TABLE SYNC MIGRATION - One-time migration to sync users and auth_users tables
 *
 * • Performs initial sync between Convex Auth users table and custom auth_users table
 * • Establishes cross-references between the two tables for future sync operations
 * • Handles cases where data exists in one table but not the other
 * • Safe to run multiple times (idempotent operation)
 *
 * Keywords: migration, user-sync, data-consistency, cross-references, idempotent
 */

import { internalMutation } from "../_generated/server";

export const syncUserTables = internalMutation({
  handler: async (ctx) => {
    console.log("Starting user table synchronization...");
    
    // Get all records from both tables
    const [users, authUsers] = await Promise.all([
      ctx.db.query("users").collect(),
      ctx.db.query("auth_users").collect(),
    ]);

    console.log(`Found ${users.length} users and ${authUsers.length} auth_users`);

    const results = {
      synced: 0,
      created: 0,
      errors: 0,
      skipped: 0,
    };

    // Process each user in the users table
    for (const user of users) {
      try {
        if (!user.email) {
          console.log(`Skipping user ${user._id} - no email`);
          results.skipped++;
          continue;
        }

        // Find corresponding auth_user by email
        const authUser = authUsers.find(au => au.email === user.email);
        
        if (authUser) {
          // Update both records with cross-references
          const now = Date.now();
          
          await Promise.all([
            ctx.db.patch(user._id, { 
              auth_user_id: authUser._id,
              updated_at: now,
            }),
            ctx.db.patch(authUser._id, { 
              convex_user_id: user._id,
              updated_at: now,
            }),
          ]);
          
          console.log(`Synced user ${user.email}`);
          results.synced++;
        } else {
          // Create new auth_user record
          const now = Date.now();
          const newAuthUserId = await ctx.db.insert("auth_users", {
            email: user.email,
            name: user.name || "User",
            avatar_url: user.image || user.avatar_url,
            email_verified: !!user.emailVerificationTime || !!user.email_verified,
            created_at: user.created_at || now,
            updated_at: now,
            last_login: user.last_login || now,
            is_active: user.is_active ?? true,
            company: user.company,
            role: user.role,
            timezone: user.timezone,
            magic_link_token: user.magic_link_token,
            magic_link_expires: user.magic_link_expires,
            login_attempts: user.login_attempts || 0,
            last_login_attempt: user.last_login_attempt,
            convex_user_id: user._id,
          });

          await ctx.db.patch(user._id, { 
            auth_user_id: newAuthUserId,
            updated_at: now,
          });

          console.log(`Created auth_user for ${user.email}`);
          results.created++;
        }
      } catch (error) {
        console.error(`Error processing user ${user._id}:`, error);
        results.errors++;
      }
    }

    // Process orphaned auth_users (exist in auth_users but not in users)
    for (const authUser of authUsers) {
      try {
        const user = users.find(u => u.email === authUser.email);
        
        if (!user) {
          // Create new user record
          const now = Date.now();
          const newUserId = await ctx.db.insert("users", {
            name: authUser.name,
            email: authUser.email,
            avatar_url: authUser.avatar_url,
            email_verified: authUser.email_verified,
            created_at: authUser.created_at,
            updated_at: now,
            last_login: authUser.last_login,
            is_active: authUser.is_active,
            company: authUser.company,
            role: authUser.role,
            timezone: authUser.timezone,
            magic_link_token: authUser.magic_link_token,
            magic_link_expires: authUser.magic_link_expires,
            login_attempts: authUser.login_attempts,
            last_login_attempt: authUser.last_login_attempt,
            auth_user_id: authUser._id,
          });

          await ctx.db.patch(authUser._id, { 
            convex_user_id: newUserId,
            updated_at: now,
          });

          console.log(`Created user for ${authUser.email}`);
          results.created++;
        }
      } catch (error) {
        console.error(`Error processing auth_user ${authUser._id}:`, error);
        results.errors++;
      }
    }

    console.log("User table synchronization completed:", results);
    return results;
  },
});