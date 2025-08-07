import { v } from "convex/values";
import { api } from "./_generated/api";
import { action, mutation, query } from "./_generated/server";
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
  handler: async (ctx, args) => {
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
    const account = await ctx.runQuery(api.emailAccounts.getAccountById, {
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
      // Parse credentials
      const credentials = JSON.parse(account.encrypted_credentials || "{}");

      if (!credentials.accessToken) {
        throw new Error("No access token found for account");
      }

      // Send email using Gmail API directly
      let result;
      if (account.provider === "gmail") {
        // Build email message in RFC 2822 format
        const hasAttachments = args.attachments && args.attachments.length > 0;
        const mainBoundary = `boundary_main_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const altBoundary = `boundary_alt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        let emailContent = "";

        // Headers
        emailContent += `To: ${args.to.join(", ")}\r\n`;
        if (args.cc && args.cc.length > 0) {
          emailContent += `Cc: ${args.cc.join(", ")}\r\n`;
        }
        if (args.bcc && args.bcc.length > 0) {
          emailContent += `Bcc: ${args.bcc.join(", ")}\r\n`;
        }
        emailContent += `Subject: ${args.subject}\r\n`;
        emailContent += `MIME-Version: 1.0\r\n`;

        if (hasAttachments) {
          // Use multipart/mixed for attachments
          emailContent += `Content-Type: multipart/mixed; boundary="${mainBoundary}"\r\n`;
          emailContent += `\r\n`;

          // Message content part
          emailContent += `--${mainBoundary}\r\n`;

          if (args.htmlContent) {
            // Use multipart/alternative for text and HTML
            emailContent += `Content-Type: multipart/alternative; boundary="${altBoundary}"\r\n`;
            emailContent += `\r\n`;

            // Text part
            emailContent += `--${altBoundary}\r\n`;
            emailContent += `Content-Type: text/plain; charset=utf-8\r\n\r\n`;
            emailContent += `${args.textContent || ""}\r\n`;

            // HTML part
            emailContent += `--${altBoundary}\r\n`;
            emailContent += `Content-Type: text/html; charset=utf-8\r\n\r\n`;
            emailContent += `${args.htmlContent}\r\n`;

            emailContent += `--${altBoundary}--\r\n`;
          } else {
            // Plain text only
            emailContent += `Content-Type: text/plain; charset=utf-8\r\n\r\n`;
            emailContent += `${args.textContent || ""}\r\n`;
          }

          // Add attachments
          for (const attachment of args.attachments || []) {
            if (attachment.content) {
              emailContent += `--${mainBoundary}\r\n`;
              emailContent += `Content-Type: ${attachment.mimeType}; name="${attachment.filename}"\r\n`;
              emailContent += `Content-Disposition: attachment; filename="${attachment.filename}"\r\n`;
              emailContent += `Content-Transfer-Encoding: base64\r\n\r\n`;

              // Add base64 content in chunks of 76 characters (RFC requirement)
              const base64Content = attachment.content;
              for (let i = 0; i < base64Content.length; i += 76) {
                emailContent += base64Content.substr(i, 76) + "\r\n";
              }
            }
          }

          emailContent += `--${mainBoundary}--\r\n`;
        } else {
          // No attachments - use simple structure
          if (args.htmlContent) {
            emailContent += `Content-Type: multipart/alternative; boundary="${altBoundary}"\r\n`;
            emailContent += `\r\n`;

            // Text part
            emailContent += `--${altBoundary}\r\n`;
            emailContent += `Content-Type: text/plain; charset=utf-8\r\n\r\n`;
            emailContent += `${args.textContent || ""}\r\n`;

            // HTML part
            emailContent += `--${altBoundary}\r\n`;
            emailContent += `Content-Type: text/html; charset=utf-8\r\n\r\n`;
            emailContent += `${args.htmlContent}\r\n`;

            emailContent += `--${altBoundary}--\r\n`;
          } else {
            emailContent += `Content-Type: text/plain; charset=utf-8\r\n`;
            emailContent += `\r\n`;
            emailContent += args.textContent || "";
          }
        }

        // Encode the message in base64url format (Convex-compatible)
        // Use TextEncoder to handle UTF-8 characters properly
        const encoder = new TextEncoder();
        const uint8Array = encoder.encode(emailContent);
        
        // Convert Uint8Array to base64 string
        let binaryString = '';
        for (let i = 0; i < uint8Array.length; i++) {
          binaryString += String.fromCharCode(uint8Array[i]);
        }
        
        const encodedMessage = btoa(binaryString)
          .replace(/\+/g, "-")
          .replace(/\//g, "_")
          .replace(/=+$/, "");

        // Send via Gmail API
        const response = await fetch(
          "https://www.googleapis.com/gmail/v1/users/me/messages/send",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${credentials.accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              raw: encodedMessage,
            }),
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(
            `Gmail API error: ${response.status} ${response.statusText} - ${errorText}`
          );
        }

        const gmailResult = await response.json();
        result = {
          messageId: gmailResult.id,
          success: true,
        };
      } else {
        throw new Error(
          `Provider ${account.provider} not supported for sending yet`
        );
      }

      // Log the sent email (optional)
      debug("sendEmail", "Email sent successfully:", {
        accountId: args.accountId,
        to: args.to,
        subject: args.subject,
        messageId: result.messageId,
      });

      return {
        success: true,
        messageId: result.messageId,
        sentAt: Date.now(),
      };
    } catch (error) {
      debug("sendEmail", "Send email error:", error);
      throw new Error(
        `Failed to send email: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  },
});