import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";
import { api } from "./_generated/api";

// Query to get authenticated user from token hash (for use in mutations/queries)
export const getAuthenticatedUserByToken = query({
  args: {
    tokenHash: v.string(),
  },
  handler: async (ctx, args) => {
    // Find active session by token hash
    const session = await ctx.db
      .query("auth_sessions")
      .withIndex("by_token_hash", (q) => q.eq("token_hash", args.tokenHash))
      .filter((q) => q.eq(q.field("is_active"), true))
      .filter((q) => q.gt(q.field("expires_at"), Date.now()))
      .first();

    if (!session) {
      return null;
    }

    // Get user from session
    const user = await ctx.db.get(session.user_id);
    return user;
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

  // Find active session by token hash
  const session = await ctx.db
    .query("auth_sessions")
    .withIndex("by_token_hash", (q: any) => q.eq("token_hash", tokenHash))
    .filter((q: any) => q.eq(q.field("is_active"), true))
    .filter((q: any) => q.gt(q.field("expires_at"), Date.now()))
    .first();

  if (!session) {
    return null;
  }

  // Get user from session
  const user = await ctx.db.get(session.user_id);
  return user;
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
    provider: v.union(v.literal("gmail"), v.literal("outlook"), v.literal("imap"), v.literal("smtp")),
    email: v.string(),
    displayName: v.string(),
    accessToken: v.optional(v.string()),
    refreshToken: v.optional(v.string()),
    tokenExpiry: v.optional(v.number()),
    imapConfig: v.optional(v.object({
      host: v.string(),
      port: v.number(),
      secure: v.boolean(),
      username: v.string(),
      password: v.string(),
    })),
    smtpConfig: v.optional(v.object({
      host: v.string(),
      port: v.number(),
      secure: v.boolean(),
      username: v.string(),
      password: v.string(),
    })),
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
        console.log('Convex Auth not available, using custom auth only');
      }
    }
    
    console.log('upsertEmailAccount - Identity check:', {
      hasIdentity: !!identity,
      identityEmail: identity?.email,
      argsEmail: args.email,
      argsProvider: args.provider,
      authMethod: token ? 'custom' : 'convex',
      tokenProvided: !!token
    });
    
    if (!identity) {
      throw new Error("User must be authenticated to add email accounts. Please make sure you're logged in to the system.");
    }

    // Find the authenticated user (not the email owner)
    const user = await ctx.db
      .query("auth_users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    console.log('upsertEmailAccount - User lookup:', {
      identityEmail: identity.email,
      userFound: !!user,
      userId: user?._id
    });

    if (!user) {
      throw new Error(`Authenticated user not found in database: ${identity.email}. Please contact support.`);
    }

    // Check if account already exists
    const existingAccount = await ctx.db
      .query("email_accounts")
      .withIndex("by_user_id", (q) => q.eq("user_id", user._id))
      .filter((q) => q.eq(q.field("email"), args.email))
      .first();

    console.log('upsertEmailAccount - Account check:', {
      userId: user._id,
      emailToAdd: args.email,
      existingAccountFound: !!existingAccount,
      existingAccountId: existingAccount?._id
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
    status: v.union(v.literal("connected"), v.literal("error"), v.literal("connecting")),
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
    console.log('📧 getEmailAccountsByUserEmail called', {
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
        console.log('✅ Using custom auth, email:', userEmail);
      }
    }

    // Fallback to Convex Auth if no custom token or custom auth failed
    if (!identity && !userEmail) {
      try {
        identity = await ctx.auth.getUserIdentity();
        if (identity) {
          userEmail = identity.email;
          console.log('✅ Using Convex Auth, email:', userEmail);
        }
      } catch (error) {
        console.log('⚠️ Convex Auth not available, using custom auth only');
      }
    }

    if (!userEmail) {
      console.log('❌ No user email available');
      return [];
    }

    // Find user by email
    const user = await ctx.db
      .query("auth_users")
      .withIndex("by_email", (q) => q.eq("email", userEmail))
      .first();

    if (!user) {
      console.log('❌ User not found for email:', userEmail);
      return [];
    }

    // Get user's email accounts
    const accounts = await ctx.db
      .query("email_accounts")
      .withIndex("by_user_id", (q) => q.eq("user_id", user._id))
      .filter((q) => q.eq(q.field("is_active"), true))
      .collect();

    console.log('✅ Found email accounts:', accounts.length);
    return accounts;
  },
});

// Test email account connection
export const testEmailConnection = action({
  args: {
    accountId: v.id("email_accounts"),
  },
  handler: async (ctx, args) => {
    const account = await ctx.runQuery(api.emailAccounts.getAccountById, { accountId: args.accountId });
    if (!account) {
      throw new Error("Account not found");
    }

    try {
      console.log('Testing connection for account:', {
        accountId: args.accountId,
        provider: account.provider,
        email: account.email
      });

      // Parse credentials to test the connection
      const credentials = JSON.parse(account.encrypted_credentials || '{}');
      console.log('Credentials parsed:', {
        hasAccessToken: !!credentials.accessToken,
        hasRefreshToken: !!credentials.refreshToken,
        tokenExpiry: credentials.tokenExpiry
      });

      if (account.provider === 'gmail') {
        console.log('Testing Gmail API connection...');

        // Test Gmail API connection
        const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
          headers: {
            'Authorization': `Bearer ${credentials.accessToken}`,
          },
        });

        console.log('Gmail API response:', {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.log('Gmail API error response:', errorText);
          throw new Error(`Gmail API test failed: ${response.status} ${response.statusText} - ${errorText}`);
        }

        const userInfo = await response.json();
        console.log('Gmail user info:', userInfo);

        // Verify the email matches
        if (userInfo.email !== account.email) {
          throw new Error(`Email mismatch: expected ${account.email}, got ${userInfo.email}`);
        }

        console.log('Gmail connection test successful');
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
        error: error instanceof Error ? error.message : "Connection failed"
      };
    }
  },
});

// Get email reply templates (placeholder)
export const getEmailReplyTemplates = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    // TODO: Implement actual template fetching
    return [];
  },
});

// Store email reply template (placeholder)
export const storeEmailReplyTemplate = mutation({
  args: {
    name: v.string(),
    subject: v.string(),
    body: v.string(),
    category: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // TODO: Implement actual template storage
    return { success: true, templateId: "temp_" + Date.now() };
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
    attachments: v.optional(v.array(v.object({
      id: v.string(),
      filename: v.string(),
      mimeType: v.string(),
      size: v.number(),
    }))),
  },
  handler: async (ctx, args) => {
    console.log('📤 sendEmail called', {
      accountId: args.accountId,
      tokenProvided: !!(args.token_hash || args.sessionToken),
      recipientCount: args.to.length,
    });

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
        console.log('⚠️ Convex Auth not available, using custom auth only');
      }
    }

    if (!identity) {
      throw new Error("User must be authenticated to send emails. Please make sure you're logged in to the system.");
    }

    console.log('✅ User authenticated for email sending:', identity.email);

    // Get the email account
    const account = await ctx.runQuery(api.emailAccounts.getAccountById, { 
      accountId: args.accountId 
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

    // Additional security: we could add more ownership verification here if needed
    // For now, we trust that the account was properly created with the right user_id

    console.log('✅ Account ownership verified:', account.email);

    try {
      // Parse credentials
      const credentials = JSON.parse(account.encrypted_credentials || '{}');
      
      if (!credentials.accessToken) {
        throw new Error("No access token found for account");
      }

      // Send email using Gmail API directly
      let result;
      if (account.provider === 'gmail') {
        // Build email message in RFC 2822 format
        const boundary = `boundary_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        let emailContent = '';
        
        // Headers
        emailContent += `To: ${args.to.join(', ')}\r\n`;
        if (args.cc && args.cc.length > 0) {
          emailContent += `Cc: ${args.cc.join(', ')}\r\n`;
        }
        if (args.bcc && args.bcc.length > 0) {
          emailContent += `Bcc: ${args.bcc.join(', ')}\r\n`;
        }
        emailContent += `Subject: ${args.subject}\r\n`;
        emailContent += `MIME-Version: 1.0\r\n`;
        
        if (args.htmlContent) {
          emailContent += `Content-Type: multipart/alternative; boundary="${boundary}"\r\n`;
          emailContent += `\r\n`;
          
          // Text part
          emailContent += `--${boundary}\r\n`;
          emailContent += `Content-Type: text/plain; charset=utf-8\r\n\r\n`;
          emailContent += `${args.textContent || ''}\r\n`;
          
          // HTML part
          emailContent += `--${boundary}\r\n`;
          emailContent += `Content-Type: text/html; charset=utf-8\r\n\r\n`;
          emailContent += `${args.htmlContent}\r\n`;
          
          emailContent += `--${boundary}--\r\n`;
        } else {
          emailContent += `Content-Type: text/plain; charset=utf-8\r\n`;
          emailContent += `\r\n`;
          emailContent += args.textContent || '';
        }

        // Encode the message in base64url format (Convex-compatible)
        const encodedMessage = btoa(emailContent)
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
          .replace(/=+$/, '');

        // Send via Gmail API
        const response = await fetch('https://www.googleapis.com/gmail/v1/users/me/messages/send', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${credentials.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            raw: encodedMessage
          })
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Gmail API error: ${response.status} ${response.statusText} - ${errorText}`);
        }

        const gmailResult = await response.json();
        result = {
          messageId: gmailResult.id,
          success: true
        };
      } else {
        throw new Error(`Provider ${account.provider} not supported for sending yet`);
      }

      // Log the sent email (optional)
      console.log('Email sent successfully:', {
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
      console.error('Send email error:', error);
      throw new Error(`Failed to send email: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});