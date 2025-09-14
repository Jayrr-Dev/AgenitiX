/**
 * Gmail Authentication Hook
 *
 * Provides utilities for Gmail OAuth2 authentication and account management
 */

import { api } from "@/convex/_generated/api";
import { useAction, useQuery } from "convex/react";
import { useCallback } from "react";

export interface GmailAuthState {
  isAuthenticated: boolean;
  hasAccounts: boolean;
  accounts: any[];
  isLoading: boolean;
  error: string | null;
}

export interface GmailAuthActions {
  connectGmail: () => void;
  refreshConnection: () => Promise<void>;
  getAccountToken: (accountId?: string) => any;
}

export function useGmailAuth(): GmailAuthState & GmailAuthActions {
  // Get user's email accounts - this will be undefined if not authenticated
  const emailAccounts = useQuery(api.emailAccounts.getUserEmailAccounts);

  // Get Google Sheets token - this will be null if not authenticated
  const sheetsToken = useQuery(api.googleSheets.getGoogleSheetsToken, {});

  // Actions
  const testConnection = useAction(api.emailAccounts.testEmailConnection);

  // Filter Gmail accounts
  const gmailAccounts =
    emailAccounts?.filter(
      (account: any) => account.provider === "gmail" && account.is_active
    ) || [];

  const isAuthenticated = gmailAccounts.length > 0 && sheetsToken !== null;
  const hasAccounts = gmailAccounts.length > 0;
  const isLoading = emailAccounts === undefined;

  // Connect to Gmail (redirect to OAuth flow)
  const connectGmail = useCallback(() => {
    // Redirect to Gmail OAuth flow
    const redirectUri = encodeURIComponent(
      `${window.location.origin}/api/auth/email/gmail/callback`
    );
    const clientId = process.env.GMAIL_CLIENT_ID;
    const scope = encodeURIComponent(
      "https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/spreadsheets"
    );

    const authUrl =
      `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${clientId}&` +
      `redirect_uri=${redirectUri}&` +
      `response_type=code&` +
      `scope=${scope}&` +
      `access_type=offline&` +
      `prompt=consent`;

    window.location.href = authUrl;
  }, []);

  // Refresh connection
  const refreshConnection = useCallback(async () => {
    if (gmailAccounts.length > 0) {
      try {
        await testConnection({ accountId: gmailAccounts[0]._id });
      } catch (error) {
        console.error("Failed to refresh Gmail connection:", error);
      }
    }
  }, [gmailAccounts, testConnection]);

  // Get account token
  const getAccountToken = useCallback(
    (accountId?: string) => {
      if (accountId) {
        // Return token for specific account
        return sheetsToken;
      }
      // Return token for first available account
      return sheetsToken;
    },
    [sheetsToken]
  );

  return {
    isAuthenticated,
    hasAccounts,
    accounts: gmailAccounts,
    isLoading,
    error: null,
    connectGmail,
    refreshConnection,
    getAccountToken,
  };
}
