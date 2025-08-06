/**
 * CLEANUP ORPHANED SESSIONS - Remove auth sessions pointing to deleted users
 * 
 * This will clean up authentication sessions that reference user IDs that
 * no longer exist in the users table, which happens after schema migrations.
 */

import { mutation } from "./_generated/server";

export const cleanupOrphanedAuthSessions = mutation({
  args: {},
  handler: async (ctx) => {
    try {
      // Get all auth sessions
      const allSessions = await ctx.db.query("authSessions").collect();
      
      let cleanedCount = 0;
      let errorCount = 0;
      
      // Process each session
      for (const session of allSessions) {
        try {
          // Check if the user exists
          const user = await ctx.db.get(session.userId);
          
          if (!user) {
            // User doesn't exist, delete the orphaned session
            await ctx.db.delete(session._id);
            cleanedCount++;
            console.log(`Deleted orphaned session ${session._id} for non-existent user ${session.userId}`);
          }
        } catch (error) {
          console.error(`Error processing session ${session._id}:`, error);
          errorCount++;
        }
      }
      
      // Also clean up auth refresh tokens for orphaned sessions
      const allRefreshTokens = await ctx.db.query("authRefreshTokens").collect();
      let refreshTokensDeleted = 0;
      
      for (const token of allRefreshTokens) {
        try {
          // Check if the session still exists
          const session = await ctx.db.get(token.sessionId);
          if (!session) {
            await ctx.db.delete(token._id);
            refreshTokensDeleted++;
          }
        } catch (error) {
          console.error(`Error processing refresh token ${token._id}:`, error);
        }
      }

      // Clean up orphaned auth accounts
      const allAuthAccounts = await ctx.db.query("authAccounts").collect();
      let authAccountsDeleted = 0;
      
      for (const account of allAuthAccounts) {
        try {
          // Check if the user exists
          const user = await ctx.db.get(account.userId);
          if (!user) {
            await ctx.db.delete(account._id);
            authAccountsDeleted++;
            console.log(`Deleted orphaned auth account ${account._id} for non-existent user ${account.userId}`);
          }
        } catch (error) {
          console.error(`Error processing auth account ${account._id}:`, error);
        }
      }

      // Clean up orphaned auth verifiers for non-existent sessions
      const allVerifiers = await ctx.db.query("authVerifiers").collect();
      let verifiersDeleted = 0;
      
      for (const verifier of allVerifiers) {
        try {
          if (verifier.sessionId) {
            const session = await ctx.db.get(verifier.sessionId);
            if (!session) {
              await ctx.db.delete(verifier._id);
              verifiersDeleted++;
            }
          }
        } catch (error) {
          console.error(`Error processing verifier ${verifier._id}:`, error);
        }
      }
      
      return {
        success: true,
        sessionsDeleted: cleanedCount,
        refreshTokensDeleted: refreshTokensDeleted,
        authAccountsDeleted: authAccountsDeleted,
        verifiersDeleted: verifiersDeleted,
        errors: errorCount,
        message: `Cleanup completed: ${cleanedCount} orphaned sessions, ${refreshTokensDeleted} refresh tokens, ${authAccountsDeleted} auth accounts, and ${verifiersDeleted} verifiers deleted`
      };
    } catch (error) {
      console.error("Cleanup failed:", error);
      return {
        success: false,
        error: error.message
      };
    }
  },
});