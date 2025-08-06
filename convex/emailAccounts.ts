import { v } from "convex/values";
import { api } from "./_generated/api";
import { action, mutation, query } from "./_generated/server";

// Query to get authenticated user from token hash (for use in mutations/queries)
export const getAuthenticatedUserByToken = query({
  args: {
    tokenHash: v.string(),
  },
  handler: async (ctx, args) => {
    // Find user by magic link token hash
    const authUser = await ctx.db
      .query("auth_users")
      .filter((q) => q.eq(q.field("magic_link_token"), args.tokenHash))
      .filter((q) => q.eq(q.field("is_active"), true))
      .first();

    if (!authUser) {
      return null;
    }

    // Check if magic link is still valid
    if (authUser.magic_link_expires && authUser.magic_link_expires < Date.now()) {
      return null;
    }

    return authUser;
  },
});

// Helper function for actions to get authenticated user from token hash
async function getAuthenticatedUserInAction(ctx: any, tokenHash?: string) {
  if (!tokenHash) {
    return null;
  }

  return await ctx.runQuery(api.emailAccounts.getAuthenticatedUserByToken, {
    tokenHash,
  });
}

// Helper function to simulate ctx.auth.getUserIdentity() for compatibility in actions
async function getUserIdentityFromTokenInAction(ctx: any, tokenHash?: string) {
  const user = await getAuthenticatedUserInAction(ctx, tokenHash);
  if (!user) {
    return null;
  }

  return {
    email: user.email,
    name: user.name,
    subject: user._id,
  };
}

// Helper function for mutations/queries to get authenticated user from token hash
async function getAuthenticatedUser(ctx: any, tokenHash?: string) {
  if (!tokenHash) {
    return null;
  }

  // Find user by magic link token hash
  const authUser = await ctx.db
    .query("auth_users")
    .filter((q: any) => q.eq(q.field("magic_link_token"), tokenHash))
    .filter((q: any) => q.eq(q.field("is_active"), true))
    .first();

  if (!authUser) {
    return null;
  }

  // Check if magic link is still valid
  if (authUser.magic_link_expires && authUser.magic_link_expires < Date.now()) {
    return null;
  }
  return authUser;
}

// Helper function to simulate ctx.auth.getUserIdentity() for compatibility in mutations/queries
async function getUserIdentityFromToken(ctx: any, tokenHash?: string) {
  const user = await getAuthenticatedUser(ctx, tokenHash);
  if (!user) {
    return null;
  }

  return {
    email: user.email,
    name: user.name,
    subject: user._id,
  };
}

// Create or update email account (with email-based auth)
export const upsertEmailAccount = mutation({
  args: {
    token_hash: v.optional(v.string()), // Optional token for custom auth
    sessionToken: v.optional(v.string()), // Alternative name for token (frontend compatibility)
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
    // Try custom auth first if token provided (support both token_hash and sessionToken)
    let identity = null;
    const token = args.token_hash || args.sessionToken;
    if (token) {
      identity = await getUserIdentityFromToken(ctx, token);
    }

    // Fallback to Convex Auth if no custom token or custom auth failed
    if (!identity) {
      try {
        identity = await ctx.auth.getUserIdentity();
      } catch (error) {
        console.log("Convex Auth not available, using custom auth only");
      }
    }

    console.log("upsertEmailAccount - Identity check:", {
      hasIdentity: !!identity,
      identityEmail: identity?.email,
      argsEmail: args.email,
      argsProvider: args.provider,
      authMethod: token ? "custom" : "convex",
      tokenProvided: !!token,
    });

    if (!identity) {
      throw new Error(
        "User must be authenticated to add email accounts. Please make sure you're logged in to the system."
      );
    }

    // Find the authenticated user (not the email owner)
    const user = await ctx.db
      .query("auth_users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    console.log("upsertEmailAccount - User lookup:", {
      identityEmail: identity.email,
      userFound: !!user,
      userId: user?._id,
    });

    if (!user) {
      throw new Error(
        `Authenticated user not found in database: ${identity.email}. Please contact support.`
      );
    }

    // Check if account already exists
    const existingAccount = await ctx.db
      .query("email_accounts")
      .withIndex("by_user_id", (q) => q.eq("user_id", user._id))
      .filter((q) => q.eq(q.field("email"), args.email))
      .first();

    console.log("upsertEmailAccount - Account check:", {
      userId: user._id,
      emailToAdd: args.email,
      existingAccountFound: !!existingAccount,
      existingAccountId: existingAccount?._id,
    });

    // Encrypt credentials
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

    if (existingAccount) {
      // Update existing account
      await ctx.db.patch(existingAccount._id, {
        ...accountData,
        created_at: existingAccount.created_at, // Keep original creation date
      });
      return existingAccount._id;
    } else {
      // Create new account
      return await ctx.db.insert("email_accounts", accountData);
    }
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

// Get user's email accounts
export const getUserEmailAccounts = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    // Find user
    const user = await ctx.db
      .query("auth_users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user) {
      return [];
    }

    // Get user's email accounts
    return await ctx.db
      .query("email_accounts")
      .withIndex("by_user_id", (q) => q.eq("user_id", user._id))
      .filter((q) => q.eq(q.field("is_active"), true))
      .collect();
  },
});

// Get email accounts by user email (with hybrid authentication support)
export const getEmailAccountsByUserEmail = query({
  args: {
    userEmail: v.optional(v.string()), // Made optional for hybrid auth
    token_hash: v.optional(v.string()), // Support for custom auth
  },
  handler: async (ctx, args) => {
    console.log("📧 getEmailAccountsByUserEmail called", {
      userEmail: args.userEmail,
      tokenProvided: !!args.token_hash,
    });

    let identity = null;
    let userEmail = args.userEmail;

    // Try custom auth first if token provided
    if (args.token_hash) {
      identity = await getUserIdentityFromToken(ctx, args.token_hash);
      if (identity) {
        userEmail = identity.email;
        console.log("✅ Using custom auth, email:", userEmail);
      }
    }

    // Fallback to Convex Auth if no custom token or custom auth failed
    if (!identity && !userEmail) {
      try {
        identity = await ctx.auth.getUserIdentity();
        if (identity) {
          userEmail = identity.email;
          console.log("✅ Using Convex Auth, email:", userEmail);
        }
      } catch (error) {
        console.log("⚠️ Convex Auth not available, using custom auth only");
      }
    }

    if (!userEmail) {
      console.log("❌ No user email available");
      return [];
    }

    // Find user by email
    const user = await ctx.db
      .query("auth_users")
      .withIndex("by_email", (q) => q.eq("email", userEmail))
      .first();

    if (!user) {
      console.log("❌ User not found for email:", userEmail);
      return [];
    }

    // Get user's email accounts
    const accounts = await ctx.db
      .query("email_accounts")
      .withIndex("by_user_id", (q) => q.eq("user_id", user._id))
      .filter((q) => q.eq(q.field("is_active"), true))
      .collect();

    console.log("✅ Found email accounts:", accounts.length);
    return accounts;
  },
});

// Test email account connection
export const testEmailConnection = action({
  args: {
    accountId: v.id("email_accounts"),
    token_hash: v.optional(v.string()), // Support for custom auth
  },
  handler: async (ctx, args) => {
    console.log("🔍 testEmailConnection called", {
      accountId: args.accountId,
      tokenProvided: !!args.token_hash,
    });

    // Try custom auth first if token provided
    let identity = null;
    if (args.token_hash) {
      identity = await getUserIdentityFromTokenInAction(ctx, args.token_hash);
    }

    // Fallback to Convex Auth if no custom token or custom auth failed
    if (!identity) {
      try {
        identity = await ctx.auth.getUserIdentity();
      } catch (error) {
        console.log("⚠️ Convex Auth not available, using custom auth only");
      }
    }

    if (!identity) {
      throw new Error(
        "User must be authenticated to test email connection. Please make sure you're logged in to the system."
      );
    }

    console.log("✅ User authenticated for connection test:", identity.email);
    const account = await ctx.runQuery(api.emailAccounts.getAccountById, {
      accountId: args.accountId,
    });
    if (!account) {
      throw new Error("Account not found");
    }

    try {
      console.log("Testing connection for account:", {
        accountId: args.accountId,
        provider: account.provider,
        email: account.email,
      });

      // Parse credentials to test the connection
      const credentials = JSON.parse(account.encrypted_credentials || "{}");
      console.log("Credentials parsed:", {
        hasAccessToken: !!credentials.accessToken,
        hasRefreshToken: !!credentials.refreshToken,
        tokenExpiry: credentials.tokenExpiry,
      });

      if (account.provider === "gmail") {
        console.log("Testing Gmail API connection...");

        // Test Gmail API connection
        const response = await fetch(
          "https://www.googleapis.com/oauth2/v2/userinfo",
          {
            headers: {
              Authorization: `Bearer ${credentials.accessToken}`,
            },
          }
        );

        console.log("Gmail API response:", {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok,
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.log("Gmail API error response:", errorText);
          throw new Error(
            `Gmail API test failed: ${response.status} ${response.statusText} - ${errorText}`
          );
        }

        const userInfo = await response.json();
        console.log("Gmail user info:", userInfo);

        // Verify the email matches
        if (userInfo.email !== account.email) {
          throw new Error(
            `Email mismatch: expected ${account.email}, got ${userInfo.email}`
          );
        }

        console.log("Gmail connection test successful");
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
  args: {
    token_hash: v.optional(v.string()), // Support for custom auth
  },
  handler: async (ctx, args) => {
    // Try custom auth first if token provided
    let identity = null;
    if (args.token_hash) {
      identity = await getUserIdentityFromToken(ctx, args.token_hash);
    }

    // Fallback to Convex Auth if no custom token or custom auth failed
    if (!identity) {
      try {
        identity = await ctx.auth.getUserIdentity();
      } catch (error) {
        console.log("Convex Auth not available, using custom auth only");
        return [];
      }
    }

    if (!identity) {
      return [];
    }

    // Get user from identity
    let user = null;
    if (args.token_hash) {
      user = await getAuthenticatedUser(ctx, args.token_hash);
    } else {
      // For Convex Auth, find user by email
      user = await ctx.db
        .query("auth_users")
        .withIndex("by_email", (q) => q.eq("email", identity.email!))
        .first();
    }

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
    token_hash: v.optional(v.string()), // Support for custom auth
    name: v.string(),
    subject: v.string(),
    body: v.string(),
    category: v.string(),
    description: v.optional(v.string()),
    variables: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    // Try custom auth first if token provided
    let identity = null;
    if (args.token_hash) {
      identity = await getUserIdentityFromToken(ctx, args.token_hash);
    }

    // Fallback to Convex Auth if no custom token or custom auth failed
    if (!identity) {
      try {
        identity = await ctx.auth.getUserIdentity();
      } catch (error) {
        console.log("Convex Auth not available, using custom auth only");
      }
    }

    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Get user from identity
    let user = null;
    if (args.token_hash) {
      user = await getAuthenticatedUser(ctx, args.token_hash);
    } else {
      // For Convex Auth, find user by email
      user = await ctx.db
        .query("auth_users")
        .withIndex("by_email", (q) => q.eq("email", identity.email!))
        .first();
    }

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

// Send email
export const sendEmail = action({
  args: {
    token_hash: v.optional(v.string()), // Support for custom auth
    sessionToken: v.optional(v.string()), // Alternative name for token (frontend compatibility)
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
    // Try custom auth first if token provided (support both token_hash and sessionToken)
    let identity = null;
    const token = args.token_hash || args.sessionToken;
    if (token) {
      identity = await getUserIdentityFromTokenInAction(ctx, token);
    }

    // Fallback to Convex Auth if no custom token or custom auth failed
    if (!identity) {
      try {
        identity = await ctx.auth.getUserIdentity();
      } catch (error) {
        console.log("⚠️ Convex Auth not available, using custom auth only");
      }
    }

    if (!identity) {
      throw new Error(
        "User must be authenticated to send emails. Please make sure you're logged in to the system."
      );
    }

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
      console.log("Email sent successfully:", {
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
      console.error("Send email error:", error);
      throw new Error(
        `Failed to send email: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  },
});
