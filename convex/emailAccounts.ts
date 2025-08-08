import { v } from "convex/values";
import { api } from "./_generated/api";
import { action, mutation, query, internalMutation } from "./_generated/server";
import { 
  getAuthContext,
  requireAuth,
  requireUser,
  logAuthState,
  debug,
} from "./authHelpers";

// Query to get authenticated user from token hash (for use in mutations/queries)
// Removed legacy token lookup – Convex Auth only

// Helper function for actions to get authenticated user via Convex Auth only
async function getAuthenticatedUserInAction(ctx: any) {
  try {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.email) return null;
    const user = await ctx.runQuery(api.users.getUserByEmail as any, { email: identity.email });
    return user;
  } catch {
    return null;
  }
}

// Helper function to simulate ctx.auth.getUserIdentity() for compatibility in actions
async function getUserIdentityFromTokenInAction(ctx: any) {
  const user = await getAuthenticatedUserInAction(ctx);
  if (!user) {
    return null;
  }

  return {
    email: user.email,
    name: user.name,
    subject: user._id,
  };
}

// Helper function for mutations/queries to get authenticated user from token hash or Convex Auth
async function getAuthenticatedUser(ctx: any) {
  try {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.email) return null;
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q: any) => q.eq("email", identity.email))
      .first();
    return user;
  } catch {
    return null;
  }
}

// Helper function to simulate ctx.auth.getUserIdentity() for compatibility in mutations/queries
async function getUserIdentityFromToken(ctx: any) {
  const user = await getAuthenticatedUser(ctx);
  if (!user) {
    return null;
  }

  return {
    email: user.email,
    name: user.name,
    subject: user._id,
  };
}

// Create or update email account (COLLISION-SAFE with authHelpers)
export const upsertEmailAccount = mutation({
  args: {
    provider: v.union(
      v.literal("gmail"),
      v.literal("outlook"),
      v.literal("yahoo"),
      v.literal("imap"),
      v.literal("smtp")
    ),
    email: v.string(),
    displayName: v.string(),
    accessToken: v.optional(v.string()),
    refreshToken: v.optional(v.string()),
    tokenExpiry: v.optional(v.number()),
    imapConfig: v.optional(
      v.object({
        host: v.string(),
        port: v.number(),
        secure: v.boolean(),
        username: v.string(),
        password: v.string(),
      })
    ),
    smtpConfig: v.optional(
      v.object({
        host: v.string(),
        port: v.number(),
        secure: v.boolean(),
        username: v.string(),
        password: v.string(),
      })
    ),
  },
  handler: async (ctx, args) => {
    debug("upsertEmailAccount", "=== EMAIL ACCOUNT UPSERT START ===", {
      provider: args.provider,
      email: args.email,
    });

    // 🔑 Resolve authentication via Convex Auth
    const { authContext, user } = await requireUser(ctx);

    logAuthState("upsertEmailAccount_auth", authContext, {
      provider: args.provider,
      email: args.email,
    });

    // Continue with simplified authentication approach

    // Check if account already exists
    const existingAccount = await ctx.db
      .query("email_accounts")
      .withIndex("by_user_id", (q) => q.eq("user_id", user._id))
      .filter((q) => q.eq(q.field("email"), args.email))
      .first();

    debug("upsertEmailAccount", "Account existence check:", {
      userId: user._id,
      emailToAdd: args.email,
      existingAccountFound: !!existingAccount,
      existingAccountId: existingAccount?._id,
    });

    // Encrypt credentials (TODO: Use proper encryption in production)
    const credentials = {
      accessToken: args.accessToken,
      refreshToken: args.refreshToken,
      tokenExpiry: args.tokenExpiry,
      imapConfig: args.imapConfig,
      smtpConfig: args.smtpConfig,
    };

    const accountData = {
      user_id: user._id,
      provider: args.provider,
      email: args.email,
      display_name: args.displayName,
      encrypted_credentials: JSON.stringify(credentials),
      connection_status: "connected" as const,
      created_at: Date.now(),
      updated_at: Date.now(),
      is_active: true,
    };

    let accountId: string;
    if (existingAccount) {
      // Update existing account
      await ctx.db.patch(existingAccount._id, {
        ...accountData,
        created_at: existingAccount.created_at, // Keep original creation date
      });
      accountId = existingAccount._id;
      debug("upsertEmailAccount", "✅ Updated existing account:", { accountId });
    } else {
      // Create new account
      accountId = await ctx.db.insert("email_accounts", accountData);
      debug("upsertEmailAccount", "✅ Created new account:", { accountId });
    }

    // 🔍 Final auth state verification
    logAuthState("upsertEmailAccount_complete", authContext, {
      accountId,
      operation: "email_account_created",
      isUpdate: !!existingAccount,
    });

    return accountId;
  },
});

// Internal mutation used by the action to avoid client auth races
export const upsertEmailAccountForUser = mutation({
  args: {
    userId: v.id("users"),
    provider: v.union(
      v.literal("gmail"),
      v.literal("outlook"),
      v.literal("yahoo"),
      v.literal("imap"),
      v.literal("smtp"),
    ),
    email: v.string(),
    displayName: v.string(),
    accessToken: v.optional(v.string()),
    refreshToken: v.optional(v.string()),
    tokenExpiry: v.optional(v.number()),
    imapConfig: v.optional(
      v.object({
        host: v.string(),
        port: v.number(),
        secure: v.boolean(),
        username: v.string(),
        password: v.string(),
      }),
    ),
    smtpConfig: v.optional(
      v.object({
        host: v.string(),
        port: v.number(),
        secure: v.boolean(),
        username: v.string(),
        password: v.string(),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const { userId } = args;
    debug("upsertEmailAccountForUser", "=== EMAIL ACCOUNT UPSERT START ===", {
      provider: args.provider,
      email: args.email,
      userId,
    });

    // Check if account already exists for this user + email
    const existingAccount = await ctx.db
      .query("email_accounts")
      .withIndex("by_user_id", (q) => q.eq("user_id", userId))
      .filter((q) => q.eq(q.field("email"), args.email))
      .first();

    // Prepare credentials payload
    const credentials = {
      accessToken: args.accessToken,
      refreshToken: args.refreshToken,
      tokenExpiry: args.tokenExpiry,
      imapConfig: args.imapConfig,
      smtpConfig: args.smtpConfig,
    };

    const accountData = {
      user_id: userId,
      provider: args.provider,
      email: args.email,
      display_name: args.displayName,
      encrypted_credentials: JSON.stringify(credentials),
      connection_status: "connected" as const,
      created_at: Date.now(),
      updated_at: Date.now(),
      is_active: true,
    };

    let accountId: string;
    if (existingAccount) {
      await ctx.db.patch(existingAccount._id, {
        ...accountData,
        created_at: existingAccount.created_at,
      });
      accountId = existingAccount._id;
      debug("upsertEmailAccountForUser", "✅ Updated existing account:", { accountId });
    } else {
      accountId = await ctx.db.insert("email_accounts", accountData);
      debug("upsertEmailAccountForUser", "✅ Created new account:", { accountId });
    }

    return accountId;
  },
});

// Action wrapper to ensure auth over HTTP and avoid WS auth races
export const upsertEmailAccountAction = action({
  args: {
    provider: v.union(
      v.literal("gmail"),
      v.literal("outlook"),
      v.literal("yahoo"),
      v.literal("imap"),
      v.literal("smtp"),
    ),
    email: v.string(),
    displayName: v.string(),
    accessToken: v.optional(v.string()),
    refreshToken: v.optional(v.string()),
    tokenExpiry: v.optional(v.number()),
    imapConfig: v.optional(
      v.object({
        host: v.string(),
        port: v.number(),
        secure: v.boolean(),
        username: v.string(),
        password: v.string(),
      }),
    ),
    smtpConfig: v.optional(
      v.object({
        host: v.string(),
        port: v.number(),
        secure: v.boolean(),
        username: v.string(),
        password: v.string(),
      }),
    ),
    // Optional client-provided hint to recover user context if auth propagation lags
    userEmailHint: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<string> => {
    let userObj: any | null = null;
    try {
      const { authContext, user } = await requireUser(ctx);
      logAuthState("upsertEmailAccount_action", authContext, {
        provider: args.provider,
        email: args.email,
      });
      userObj = user;
    } catch {
      // Fallback: recover via userEmailHint if provided
      if (args.userEmailHint) {
        try {
          userObj = await ctx.runQuery(api.users.getUserByEmail as any, { email: args.userEmailHint });
        } catch {}
      }
      if (!userObj) {
        throw new Error("Authentication required. Please sign in to continue.");
      }
    }

    const { userEmailHint: _omit, ...rest } = args as any;
    const resolvedUserId = (userObj as any)._id ?? (userObj as any).id;
    if (!resolvedUserId) {
      throw new Error("Authentication required. Please sign in to continue.");
    }

    const accountId: string = await ctx.runMutation(
      api.emailAccounts.upsertEmailAccountForUser as any,
      {
        userId: resolvedUserId,
        ...rest,
      },
    );

    return accountId;
  },
});

// Get account by ID (helper for actions)
export const getAccountById = query({
  args: {
    accountId: v.id("email_accounts"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.accountId);
  },
});

// Update account status (helper for actions)
export const updateAccountStatus = mutation({
  args: {
    accountId: v.id("email_accounts"),
    status: v.union(
      v.literal("connected"),
      v.literal("error"),
      v.literal("connecting")
    ),
    lastValidated: v.union(v.number(), v.null()),
  },
  handler: async (ctx, args) => {
    const updateData: any = {
      connection_status: args.status,
      updated_at: Date.now(),
    };

    if (args.lastValidated !== null) {
      updateData.last_validated = args.lastValidated;
    }

    await ctx.db.patch(args.accountId, updateData);
  },
});

// Deactivate (logout) an email account
export const deactivateEmailAccount = mutation({
  args: {
    accountId: v.id("email_accounts"),
  },
  handler: async (ctx, args): Promise<{ success: boolean }> => {
    const account = await ctx.db.get(args.accountId);
    if (!account) {
      throw new Error("Account not found");
    }

    // Soft-deactivate: keep record for history but mark inactive and disconnected
    await ctx.db.patch(args.accountId, {
      is_active: false,
      connection_status: "disconnected",
      last_validated: undefined,
      updated_at: Date.now(),
    } as any);

    return { success: true };
  },
});

// Action wrapper to ensure HTTP auth path and avoid WS auth races
export const deactivateEmailAccountAction = action({
  args: {
    accountId: v.id("email_accounts"),
    userEmailHint: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<{ success: boolean }> => {
    // Resolve user (Convex Auth preferred, fallback to userEmailHint)
    let userObj: any | null = null;
    try {
      const { authContext, user } = await requireUser(ctx);
      logAuthState("deactivateEmailAccount_action", authContext, {
        accountId: args.accountId,
        operation: "email_account_deactivate",
      });
      userObj = user;
    } catch {
      if (args.userEmailHint) {
        try {
          userObj = await ctx.runQuery(api.users.getUserByEmail as any, { email: args.userEmailHint });
        } catch {}
      }
      if (!userObj) {
        throw new Error("Authentication required. Please sign in to continue.");
      }
    }

    // Verify account ownership before deactivation
    const account = await ctx.runQuery(api.emailAccounts.getAccountById as any, {
      accountId: args.accountId,
    });
    if (!account) {
      throw new Error("Account not found");
    }
    const resolvedUserId = (userObj as any)._id ?? (userObj as any).id;
    if (!resolvedUserId || String(account.user_id) !== String(resolvedUserId)) {
      throw new Error("Forbidden: account does not belong to the current user");
    }

    const result = await ctx.runMutation(
      api.emailAccounts.deactivateEmailAccount as any,
      { accountId: args.accountId }
    );
    return result as { success: boolean };
  },
});

// Get user's email accounts (COLLISION-SAFE)
export const getUserEmailAccounts = query({
  args: {},
  handler: async (ctx, args) => {
    const authContext = await getAuthContext(ctx);
    
    if (!authContext.isAuthenticated || !authContext.user) {
      debug("getUserEmailAccounts", "No authentication available");
      return [];
    }

    logAuthState("getUserEmailAccounts", authContext);

    // Get user's email accounts
    const accounts = await ctx.db
      .query("email_accounts")
      .withIndex("by_user_id", (q) => q.eq("user_id", authContext.user._id))
      .filter((q) => q.eq(q.field("is_active"), true))
      .collect();

    debug("getUserEmailAccounts", "Retrieved accounts:", { 
      count: accounts.length,
      userId: authContext.user._id 
    });

    return accounts;
  },
});

// Get email accounts by user email (with hybrid authentication support)
export const getEmailAccountsByUserEmail = query({
  args: {
    userEmail: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let userEmail = args.userEmail;
    if (!userEmail) {
      const identity = await ctx.auth.getUserIdentity();
      userEmail = identity?.email ?? undefined;
    }
    if (!userEmail) {
      return [];
    }

    // Find user by email
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", userEmail))
      .first();

    if (!user) {
      return [];
    }

    // Get user's email accounts
    const accounts = await ctx.db
      .query("email_accounts")
      .withIndex("by_user_id", (q) => q.eq("user_id", user._id))
      .filter((q) => q.eq(q.field("is_active"), true))
      .collect();

    return accounts;
  },
});

// Test email account connection (COLLISION-SAFE)
export const testEmailConnection = action({
  args: {
    accountId: v.id("email_accounts"),
  },
  handler: async (ctx, args) => {
    debug("testEmailConnection", "=== CONNECTION TEST START ===", {
      accountId: args.accountId,
    });

    const authContext = await requireAuth(ctx);

    logAuthState("testEmailConnection", authContext, {
      accountId: args.accountId,
      operation: "connection_test",
    });
    const account = await ctx.runQuery(api.emailAccounts.getAccountById, {
      accountId: args.accountId,
    });
    if (!account) {
      throw new Error("Account not found");
    }

    try {
      debug("testEmailConnection", "Testing connection:", {
        accountId: args.accountId,
        provider: account.provider,
        email: account.email,
      });

      // Parse credentials to test the connection
      const credentials = JSON.parse(account.encrypted_credentials || "{}");
      debug("testEmailConnection", "Credentials parsed:", {
        hasAccessToken: !!credentials.accessToken,
        hasRefreshToken: !!credentials.refreshToken,
        tokenExpiry: credentials.tokenExpiry,
      });

      if (account.provider === "gmail") {
        // Test Gmail API connection
        const response = await fetch(
          "https://www.googleapis.com/oauth2/v2/userinfo",
          {
            headers: {
              Authorization: `Bearer ${credentials.accessToken}`,
            },
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(
            `Gmail API test failed: ${response.status} ${response.statusText} - ${errorText}`
          );
        }

        const userInfo = await response.json();

        // Verify the email matches
        if (userInfo.email !== account.email) {
          throw new Error(
            `Email mismatch: expected ${account.email}, got ${userInfo.email}`
          );
        }
      }

      // Update connection status
      await ctx.runMutation(api.emailAccounts.updateAccountStatus, {
        accountId: args.accountId,
        status: "connected",
        lastValidated: Date.now(),
      });

      return { success: true, status: "connected" };
    } catch (error) {
      await ctx.runMutation(api.emailAccounts.updateAccountStatus, {
        accountId: args.accountId,
        status: "error",
        lastValidated: null,
      });

      return {
        success: false,
        status: "error",
        error: error instanceof Error ? error.message : "Connection failed",
      };
    }
  },
});

// Get email reply templates (with hybrid authentication)
export const getEmailReplyTemplates = query({
  args: {},
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.email) return [];
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user) {
      return [];
    }

    // Fetch templates from database
    const templates = await ctx.db
      .query("email_reply_templates")
      .withIndex("by_user_id", (q) => q.eq("user_id", user._id))
      .filter((q) => q.eq(q.field("is_active"), true))
      .collect();

    return templates.map((template) => ({
      id: template._id,
      name: template.name,
      category: template.category,
      subject_template: template.subject_template,
      content_template: template.content_template,
      variables: template.variables,
      description: template.description,
      created_at: template.created_at,
      updated_at: template.updated_at,
    }));
  },
});

// Store email reply template (with hybrid authentication)
export const storeEmailReplyTemplate = mutation({
  args: {
    name: v.string(),
    subject: v.string(),
    body: v.string(),
    category: v.string(),
    description: v.optional(v.string()),
    variables: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.email) throw new Error("Not authenticated");
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Check if template with same name already exists for this user
    const existingTemplate = await ctx.db
      .query("email_reply_templates")
      .withIndex("by_user_id", (q) => q.eq("user_id", user._id))
      .filter((q) => q.eq(q.field("name"), args.name))
      .filter((q) => q.eq(q.field("is_active"), true))
      .first();

    const now = Date.now();
    const templateData = {
      user_id: user._id,
      name: args.name,
      category: args.category,
      subject_template: args.subject,
      content_template: args.body,
      variables: args.variables || [],
      description: args.description || "",
      is_active: true,
      created_at: now,
      updated_at: now,
    };

    let templateId;
    if (existingTemplate) {
      // Update existing template
      templateId = existingTemplate._id;
      await ctx.db.patch(templateId, {
        ...templateData,
        created_at: existingTemplate.created_at, // Keep original creation date
      });
    } else {
      // Create new template
      templateId = await ctx.db.insert("email_reply_templates", templateData);
    }

    return {
      success: true,
      templateId: templateId,
      isUpdate: !!existingTemplate,
    };
  },
});

// Send email (COLLISION-SAFE)
export const sendEmail = action({
  args: {
    accountId: v.id("email_accounts"),
    to: v.array(v.string()),
    cc: v.optional(v.array(v.string())),
    bcc: v.optional(v.array(v.string())),
    subject: v.string(),
    textContent: v.optional(v.string()),
    htmlContent: v.optional(v.string()),
    attachments: v.optional(
      v.array(
        v.object({
          id: v.string(),
          filename: v.string(),
          mimeType: v.string(),
          size: v.number(),
          content: v.optional(v.string()), // Base64 content
        })
      )
    ),
  },
  handler: async (ctx, args): Promise<{ success: boolean; messageId: string; sentAt: number }> => {
    debug("sendEmail", "=== EMAIL SEND START ===", {
      accountId: args.accountId,
      to: args.to,
      subject: args.subject,
      hasAttachments: !!(args.attachments && args.attachments.length > 0),
    });

    const authContext = await requireAuth(ctx);

    logAuthState("sendEmail", authContext, {
      accountId: args.accountId,
      operation: "email_send",
      recipients: args.to.length,
    });

    // Get the email account
    const account: any = await ctx.runQuery(api.emailAccounts.getAccountById, {
      accountId: args.accountId,
    });

    if (!account) {
      throw new Error("Email account not found");
    }

    // Verify account ownership by checking if the account belongs to the authenticated user
    // We can check this by comparing the account's email with the authenticated user's email
    // or by using a helper query to find the user and verify ownership

    // For now, we'll use a simple approach: verify the account is active and belongs to a valid user
    if (!account.is_active) {
      throw new Error("Email account is not active");
    }

    try {
      // Use Convex Resend component for durable sending
      const { Resend } = await import("@convex-dev/resend");
      const { components } = (await import("./_generated/api")) as any;
      const resendInstance: InstanceType<typeof Resend> = new Resend(components.resend, {} as any) as any;

      const fromAddress: string = `${account.display_name || "Agenitix"} <${account.email}>`;

      const emailId: unknown = await (resendInstance as any).sendEmail(ctx as any, {
        from: fromAddress,
        to: args.to,
        subject: args.subject,
        html: args.htmlContent || undefined,
        text: args.textContent || undefined,
        cc: args.cc && args.cc.length > 0 ? args.cc : undefined,
        bcc: args.bcc && args.bcc.length > 0 ? args.bcc : undefined,
        attachments: (args.attachments || []).map((a) => ({
          filename: a.filename,
          content: a.content || "",
          contentType: a.mimeType,
        })),
      } as any);

      debug("sendEmail", "Email enqueued via Resend:", {
        accountId: args.accountId,
        to: args.to,
        subject: args.subject,
        emailId,
      });

      return {
        success: true,
        messageId: String(emailId),
        sentAt: Date.now(),
      };
    } catch (error) {
      debug("sendEmail", "Resend error:", error);
      throw new Error(
        `Failed to send email: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  },
});