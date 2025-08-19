/**
 * Email Drafts - Convex Actions for Gmail API Integration
 * 
 * Implements real Gmail API draft functionality:
 * • Create draft
 * • Update draft 
 * • Delete draft
 * • List drafts
 * 
 * Keywords: convex, gmail, drafts, api, oauth2
 */

import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

// Gmail API endpoints for drafts
const GMAIL_API_BASE = "https://www.googleapis.com/gmail/v1";

interface GmailDraftResponse {
  id: string;
  message: {
    id: string;
    threadId: string;
    snippet: string;
  };
}

interface CreateDraftRequest {
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  textContent?: string;
  htmlContent?: string;
}

/**
 * Create a new draft in Gmail
 */
export const createEmailDraft = action({
  args: {
    accountId: v.id("email_accounts"),
    to: v.array(v.string()),
    cc: v.optional(v.array(v.string())),
    bcc: v.optional(v.array(v.string())),
    subject: v.string(),
    textContent: v.optional(v.string()),
    htmlContent: v.optional(v.string()),
    userEmailHint: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<{ success: boolean; draftId?: string; error?: string }> => {
    try {
      // Get email account and validate access
      const account = await ctx.runQuery(api.emailAccounts.getAccountById, {
        accountId: args.accountId,
      });

      if (!account) {
        return { success: false, error: "Email account not found" };
      }

      if (account.provider !== "gmail") {
        return { success: false, error: "Draft functionality only available for Gmail accounts" };
      }

      // Get access token from encrypted credentials
      const { accessToken, error: tokenError } = getAccessTokenFromAccount(account);
      if (tokenError) {
        return { success: false, error: tokenError };
      }

      // Build email message in RFC 2822 format
      const emailMessage = buildRFC2822Message({
        to: args.to,
        cc: args.cc || [],
        bcc: args.bcc || [],
        subject: args.subject,
        textContent: args.textContent || "",
        htmlContent: args.htmlContent || "",
      });

      // Base64 encode the email message
      const encodedMessage = btoa(emailMessage)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      // Create draft via Gmail API
      const response = await fetch(`${GMAIL_API_BASE}/users/me/drafts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: {
            raw: encodedMessage
          }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Gmail API error:", errorText);
        return { success: false, error: `Gmail API error: ${response.status}` };
      }

      const result: GmailDraftResponse = await response.json();

      // Increment Gmail API usage
      try {
        await ctx.runMutation(api.apiUsage.incrementEmailApiUsage as any, {
          provider: "gmail",
          method: "drafts.create",
          user_id: account.user_id,
          enforce: true,
        });
      } catch (e) {
        console.warn("API usage tracking failed:", e);
        // Don't fail the operation for usage tracking issues
      }

      return {
        success: true,
        draftId: result.id,
      };

    } catch (error) {
      console.error("Create draft error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  },
});

/**
 * Update an existing draft in Gmail
 */
export const updateEmailDraft = action({
  args: {
    accountId: v.id("email_accounts"),
    draftId: v.string(),
    to: v.array(v.string()),
    cc: v.optional(v.array(v.string())),
    bcc: v.optional(v.array(v.string())),
    subject: v.string(),
    textContent: v.optional(v.string()),
    htmlContent: v.optional(v.string()),
    userEmailHint: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<{ success: boolean; draftId?: string; error?: string }> => {
    try {
      // Get email account and validate access
      const account = await ctx.runQuery(api.emailAccounts.getAccountById, {
        accountId: args.accountId,
      });

      if (!account) {
        return { success: false, error: "Email account not found" };
      }

      if (account.provider !== "gmail") {
        return { success: false, error: "Draft functionality only available for Gmail accounts" };
      }

      // Get access token from encrypted credentials
      const { accessToken, error: tokenError } = getAccessTokenFromAccount(account);
      if (tokenError) {
        return { success: false, error: tokenError };
      }

      // Build updated email message
      const emailMessage = buildRFC2822Message({
        to: args.to,
        cc: args.cc || [],
        bcc: args.bcc || [],
        subject: args.subject,
        textContent: args.textContent || "",
        htmlContent: args.htmlContent || "",
      });

      // Base64 encode the email message
      const encodedMessage = btoa(emailMessage)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      // Update draft via Gmail API
      const response = await fetch(`${GMAIL_API_BASE}/users/me/drafts/${args.draftId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: {
            raw: encodedMessage
          }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Gmail API error:", errorText);
        return { success: false, error: `Gmail API error: ${response.status}` };
      }

      const result: GmailDraftResponse = await response.json();

      // Increment Gmail API usage
      try {
        await ctx.runMutation(api.apiUsage.incrementEmailApiUsage as any, {
          provider: "gmail",
          method: "drafts.update",
          user_id: account.user_id,
          enforce: true,
        });
      } catch (e) {
        console.warn("API usage tracking failed:", e);
      }

      return {
        success: true,
        draftId: result.id,
      };

    } catch (error) {
      console.error("Update draft error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  },
});

/**
 * Delete a draft from Gmail
 */
export const deleteEmailDraft = action({
  args: {
    accountId: v.id("email_accounts"),
    draftId: v.string(),
    userEmailHint: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<{ success: boolean; error?: string }> => {
    try {
      // Get email account and validate access
      const account = await ctx.runQuery(api.emailAccounts.getAccountById, {
        accountId: args.accountId,
      });

      if (!account) {
        return { success: false, error: "Email account not found" };
      }

      if (account.provider !== "gmail") {
        return { success: false, error: "Draft functionality only available for Gmail accounts" };
      }

      // Get access token from encrypted credentials
      const { accessToken, error: tokenError } = getAccessTokenFromAccount(account);
      if (tokenError) {
        return { success: false, error: tokenError };
      }

      // Delete draft via Gmail API
      const response = await fetch(`${GMAIL_API_BASE}/users/me/drafts/${args.draftId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Gmail API error:", errorText);
        return { success: false, error: `Gmail API error: ${response.status}` };
      }

      // Increment Gmail API usage
      try {
        await ctx.runMutation(api.apiUsage.incrementEmailApiUsage as any, {
          provider: "gmail",
          method: "drafts.delete",
          user_id: account.user_id,
          enforce: true,
        });
      } catch (e) {
        console.warn("API usage tracking failed:", e);
      }

      return { success: true };

    } catch (error) {
      console.error("Delete draft error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  },
});

/**
 * List all drafts for a Gmail account
 */
export const listEmailDrafts = action({
  args: {
    accountId: v.id("email_accounts"),
    maxResults: v.optional(v.number()),
    pageToken: v.optional(v.string()),
    userEmailHint: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<{ success: boolean; drafts?: any[]; nextPageToken?: string; error?: string }> => {
    try {
      // Get email account and validate access
      const account = await ctx.runQuery(api.emailAccounts.getAccountById, {
        accountId: args.accountId,
      });

      if (!account) {
        return { success: false, error: "Email account not found" };
      }

      if (account.provider !== "gmail") {
        return { success: false, error: "Draft functionality only available for Gmail accounts" };
      }

      // Get access token from encrypted credentials
      const { accessToken, error: tokenError } = getAccessTokenFromAccount(account);
      if (tokenError) {
        return { success: false, error: tokenError };
      }

      // Build query parameters - include message details
      const params = new URLSearchParams();
      if (args.maxResults) params.append("maxResults", String(Math.min(args.maxResults, 100)));
      if (args.pageToken) params.append("pageToken", args.pageToken);
      params.append("format", "metadata"); // Get message metadata including headers

      // List drafts via Gmail API
      const response = await fetch(`${GMAIL_API_BASE}/users/me/drafts?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Gmail API error:", errorText);
        return { success: false, error: `Gmail API error: ${response.status}` };
      }

      const result = await response.json();

      // Process drafts to extract subjects from headers
      const processedDrafts = (result.drafts || []).map((draft: any) => {
        const message = draft.message;
        const payload = message?.payload || {};
        const headers = payload.headers || [];
        
        // Extract subject from headers
        const getHeader = (name: string) => 
          headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value || "";
        
        const subject = getHeader("Subject");
        
        return {
          id: draft.id,
          subject: subject || "No subject",
          snippet: message?.snippet || "",
          messageId: message?.id,
          threadId: message?.threadId,
          lastModified: message?.internalDate ? parseInt(message.internalDate) : Date.now(),
          sizeEstimate: message?.sizeEstimate || 0,
        };
      });

      // Increment Gmail API usage
      try {
        await ctx.runMutation(api.apiUsage.incrementEmailApiUsage as any, {
          provider: "gmail",
          method: "drafts.list",
          user_id: account.user_id,
          enforce: true,
        });
      } catch (e) {
        console.warn("API usage tracking failed:", e);
      }

      return {
        success: true,
        drafts: processedDrafts,
        nextPageToken: result.nextPageToken,
      };

    } catch (error) {
      console.error("List drafts error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  },
});

/**
 * Get detailed information about a specific draft
 */
export const getDraftDetails = action({
  args: {
    accountId: v.id("email_accounts"),
    draftId: v.string(),
    userEmailHint: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<{ success: boolean; draft?: any; error?: string }> => {
    try {
      // Get email account and validate access
      const account = await ctx.runQuery(api.emailAccounts.getAccountById, {
        accountId: args.accountId,
      });

      if (!account) {
        return { success: false, error: "Email account not found" };
      }

      if (account.provider !== "gmail") {
        return { success: false, error: "Draft functionality only available for Gmail accounts" };
      }

      // Get access token from encrypted credentials
      const { accessToken, error: tokenError } = getAccessTokenFromAccount(account);
      if (tokenError) {
        return { success: false, error: tokenError };
      }

      // Get draft details via Gmail API
      const response = await fetch(`${GMAIL_API_BASE}/users/me/drafts/${args.draftId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Gmail API error:", errorText);
        return { success: false, error: `Gmail API error: ${response.status}` };
      }

      const draft = await response.json();

      // Parse email message for easier consumption
      const message = draft.message;
      const payload = message?.payload || {};
      const headers = payload.headers || [];

      // Extract common headers
      const getHeader = (name: string) => 
        headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value || "";

      const subject = getHeader("Subject");
      const to = getHeader("To");
      const cc = getHeader("Cc");
      const bcc = getHeader("Bcc");

      // Extract body content
      let textContent = "";
      let htmlContent = "";

      const extractContent = (part: any) => {
        if (part.mimeType === "text/plain" && part.body?.data) {
          try {
            textContent = atob(part.body.data.replace(/-/g, '+').replace(/_/g, '/'));
          } catch (e) {
            console.warn("Failed to decode text content:", e);
          }
        } else if (part.mimeType === "text/html" && part.body?.data) {
          try {
            htmlContent = atob(part.body.data.replace(/-/g, '+').replace(/_/g, '/'));
          } catch (e) {
            console.warn("Failed to decode HTML content:", e);
          }
        } else if (part.parts) {
          part.parts.forEach(extractContent);
        }
      };

      if (payload.parts) {
        payload.parts.forEach(extractContent);
      } else if (payload.body?.data) {
        extractContent(payload);
      }

      // Increment Gmail API usage
      try {
        await ctx.runMutation(api.apiUsage.incrementEmailApiUsage as any, {
          provider: "gmail",
          method: "drafts.get",
          user_id: account.user_id,
          enforce: true,
        });
      } catch (e) {
        console.warn("API usage tracking failed:", e);
      }

      return {
        success: true,
        draft: {
          id: draft.id,
          messageId: message?.id,
          threadId: message?.threadId,
          subject,
          recipients: {
            to: to ? to.split(",").map((email: string) => email.trim()).filter(Boolean) : [],
            cc: cc ? cc.split(",").map((email: string) => email.trim()).filter(Boolean) : [],
            bcc: bcc ? bcc.split(",").map((email: string) => email.trim()).filter(Boolean) : [],
          },
          body: {
            text: textContent,
            html: htmlContent,
            mode: htmlContent ? "html" : "text",
          },
          snippet: message?.snippet || "",
          lastModified: message?.internalDate ? parseInt(message.internalDate) : Date.now(),
          sizeEstimate: message?.sizeEstimate || 0,
        },
      };

    } catch (error) {
      console.error("Get draft details error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  },
});

/**
 * Helper to extract and validate access token from account
 */
function getAccessTokenFromAccount(account: any): { accessToken?: string; error?: string } {
  try {
    const credentials = JSON.parse(account.encrypted_credentials || "{}");
    
    if (!credentials.accessToken) {
      return { error: "No access token available for Gmail account" };
    }

    // TODO: Check token expiry and refresh if needed
    // if (credentials.tokenExpiry && Date.now() > credentials.tokenExpiry) {
    //   // Token refresh logic would go here
    // }

    return { accessToken: credentials.accessToken };
  } catch (e) {
    return { error: "Failed to parse account credentials" };
  }
}

/**
 * Build RFC 2822 email message format
 */
function buildRFC2822Message(options: CreateDraftRequest): string {
  const { to, cc, bcc, subject, textContent, htmlContent } = options;
  
  let emailContent = '';
  
  // Headers
  emailContent += `To: ${to.join(', ')}\r\n`;
  if (cc && cc.length > 0) {
    emailContent += `Cc: ${cc.join(', ')}\r\n`;
  }
  if (bcc && bcc.length > 0) {
    emailContent += `Bcc: ${bcc.join(', ')}\r\n`;
  }
  emailContent += `Subject: ${subject}\r\n`;
  emailContent += `MIME-Version: 1.0\r\n`;
  
  if (htmlContent && htmlContent.trim()) {
    // Multipart message with both text and HTML
    const boundary = `boundary_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    emailContent += `Content-Type: multipart/alternative; boundary="${boundary}"\r\n`;
    emailContent += `\r\n`;
    
    // Text part
    emailContent += `--${boundary}\r\n`;
    emailContent += `Content-Type: text/plain; charset=utf-8\r\n`;
    emailContent += `\r\n`;
    emailContent += `${textContent || ''}\r\n`;
    
    // HTML part
    emailContent += `--${boundary}\r\n`;
    emailContent += `Content-Type: text/html; charset=utf-8\r\n`;
    emailContent += `\r\n`;
    emailContent += `${htmlContent}\r\n`;
    
    emailContent += `--${boundary}--\r\n`;
  } else {
    // Plain text only
    emailContent += `Content-Type: text/plain; charset=utf-8\r\n`;
    emailContent += `\r\n`;
    emailContent += `${textContent || ''}\r\n`;
  }
  
  return emailContent;
}
