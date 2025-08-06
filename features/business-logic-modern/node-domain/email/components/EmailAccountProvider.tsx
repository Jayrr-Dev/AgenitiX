/**
 * Route: features/business-logic-modern/node-domain/email/components/EmailAccountProvider.tsx
 * EMAIL ACCOUNT PROVIDER - Authentication state management for email accounts
 *
 * • Manages OAuth2 authentication flow state
 * • Handles connection status and validation
 * • Provides authentication context to child components
 * • Centralizes auth-related callbacks and state updates
 *
 * Keywords: authentication-provider, oauth2-state, connection-management, context
 */

import { useAuthContext } from "@/components/auth/AuthProvider";
import { api } from "@/convex/_generated/api";
import { useAction, useMutation } from "convex/react";
import { createContext, ReactNode, useCallback, useContext } from "react";
import { toast } from "sonner";
import type { EmailProviderType } from "../types";

interface EmailAccountContextType {
  // Authentication state
  isAuthenticating: boolean;
  connectionStatus: "disconnected" | "connecting" | "connected" | "error";
  lastError: string;

  // Authentication methods
  handleOAuth2Auth: (provider: EmailProviderType) => Promise<void>;
  handleAuthSuccess: (authDataEncoded: string | null) => Promise<void>;
  handleAuthError: (errorMessage: string) => void;
  handleResetAuth: () => void;
  handleTestConnection: (accountId: string) => Promise<void>;
  handleManualSave: (config: any) => Promise<void>;

  // Convex mutations
  storeEmailAccount: any;
  validateConnection: any;
}

const EmailAccountContext = createContext<EmailAccountContextType | null>(null);

export const useEmailAccountContext = () => {
  const context = useContext(EmailAccountContext);
  if (!context) {
    throw new Error(
      "useEmailAccountContext must be used within EmailAccountProvider"
    );
  }
  return context;
};

interface EmailAccountProviderProps {
  children: ReactNode;
  nodeData: any; // Using any for now to avoid type conflicts
  updateNodeData: (data: any) => void;
}

export const EmailAccountProvider = ({
  children,
  nodeData,
  updateNodeData,
}: EmailAccountProviderProps) => {
  const { authToken, user } = useAuthContext();
  
  // For Convex Auth users, we'll use the user ID as the session token
  // For Magic Link users, they would have a session token stored differently
  const token = authToken || (user?.id ? `convex_user_${user.id}` : null);
  
  // Debug logging (development only)
  if (process.env.NODE_ENV === 'development') {
    console.log('EmailAccountProvider Auth Debug:', {
      authToken: !!authToken,
      user: !!user,
      userId: user?.id,
      hasToken: !!token,
    });
  }
  const storeEmailAccount = useMutation(api.emailAccounts.upsertEmailAccount);
  const validateConnection = useAction(api.emailAccounts.testEmailConnection);

  /**
   * Process successful OAuth2 authentication
   * Decodes auth data and stores account in Convex
   */
  const handleAuthSuccess = useCallback(
    async (authDataEncoded: string | null) => {
      if (!(authDataEncoded && token)) {
        return;
      }

      try {
        const authData = JSON.parse(atob(authDataEncoded));

        // Store account in Convex
        const accountId = await storeEmailAccount({
          provider: authData.provider,
          email: authData.email,
          displayName: authData.displayName,
          accessToken: authData.accessToken,
          refreshToken: authData.refreshToken,
          tokenExpiry: authData.tokenExpiry,
          sessionToken: authData.sessionToken || token, // Pass session token
        });

        if (accountId) {
          updateNodeData({
            email: authData.email,
            displayName: authData.displayName || authData.email,
            isConfigured: true,
            isConnected: true,
            connectionStatus: "connected",
            lastValidated: Date.now(),
            accountId: accountId,
            lastError: "",
          });

          toast.success("Email account connected!", {
            description: `Successfully connected ${authData.email}`,
          });
        } else {
          throw new Error("Failed to store account");
        }
      } catch (error) {
        updateNodeData({
          lastError:
            error instanceof Error ? error.message : "Failed to save account",
        });
        toast.error("Failed to save account", {
          description: error instanceof Error ? error.message : "Unknown error",
        });
      }
    },
    [token, storeEmailAccount, updateNodeData]
  );

  /** Handle authentication error */
  const handleAuthError = useCallback(
    (errorMessage: string) => {
      updateNodeData({
        lastError: errorMessage,
        isAuthenticating: false,
      });
      toast.error("Authentication failed", {
        description: errorMessage,
      });
    },
    [updateNodeData]
  );

  /**
   * Handle OAuth2 authentication flow
   * Opens popup window for OAuth2 authorization and handles the response
   */
  const handleOAuth2Auth = useCallback(
    async (provider: EmailProviderType) => {
      try {
        updateNodeData({ isAuthenticating: true, lastError: "" });

        // Get OAuth2 URL from API
        const redirectUri = `${window.location.origin}/api/auth/email/${provider}/callback`;
        const response = await fetch(
          `/api/auth/email/${provider}?redirect_uri=${encodeURIComponent(redirectUri)}&session_token=${encodeURIComponent(token || "")}`
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.error || `HTTP ${response.status}: ${response.statusText}`
          );
        }

        const { authUrl } = await response.json();

        if (!authUrl) {
          throw new Error("No authentication URL received from server");
        }

        // Open OAuth2 popup
        const popup = window.open(
          authUrl,
          "oauth2",
          "width=500,height=600,scrollbars=yes,resizable=yes"
        );

        if (!popup) {
          throw new Error(
            "Popup blocked by browser. Please allow popups for this site."
          );
        }

        // Timeout after 30 seconds for better UX
        const timeoutId = setTimeout(() => {
          if (!popup?.closed) {
            popup?.close();
            updateNodeData({
              isAuthenticating: false,
              lastError: "Authentication timed out after 30 seconds. Please try again.",
            });
            toast.error("Authentication timed out", {
              description:
                "The authentication took too long. Please check your internet connection and try again.",
            });
          }
        }, 30000); // 30 seconds

        // Listen for messages from the popup
        const handleMessage = (event: MessageEvent) => {
          // Clear timeout when we get a response
          clearTimeout(timeoutId);
          
          // Verify origin for security
          if (event.origin !== window.location.origin) {
            return;
          }

          if (event.data.type === "OAUTH_SUCCESS") {
            handleAuthSuccess(event.data.authData);
            popup?.close();
            window.removeEventListener("message", handleMessage);
            updateNodeData({ isAuthenticating: false });
          } else if (event.data.type === "OAUTH_ERROR") {
            handleAuthError(event.data.error);
            popup?.close();
            window.removeEventListener("message", handleMessage);
            updateNodeData({ isAuthenticating: false });
          }
        };

        window.addEventListener("message", handleMessage);

        // Listen for localStorage communication bridge (COOP fallback)
        const handleStorageAuth = (event: StorageEvent) => {
          console.log('🔍 Storage event received:', event.key, !!event.newValue);
          if (event.key === 'gmail_oauth_result' && event.newValue) {
            try {
              const authResult = JSON.parse(event.newValue);
              console.log('✅ Gmail OAuth result from localStorage:', authResult.type);
              if (authResult.type === 'OAUTH_SUCCESS' && authResult.authData) {
                // Clear the localStorage item
                localStorage.removeItem('gmail_oauth_result');
                // Handle the success
                handleAuthSuccess(authResult.authData);
                // Try to close popup (may fail due to COOP)
                try { popup?.close(); } catch (e) { console.log('Could not close popup:', e); }
                clearTimeout(timeoutId);
                window.removeEventListener("message", handleMessage);
                window.removeEventListener("storage", handleStorageAuth);
                updateNodeData({ isAuthenticating: false });
              }
            } catch (error) {
              console.error('Failed to parse localStorage auth result:', error);
            }
          }
        };

        window.addEventListener("storage", handleStorageAuth);

        // Also check localStorage immediately in case the event didn't fire
        const checkLocalStorage = () => {
          const stored = localStorage.getItem('gmail_oauth_result');
          if (stored) {
            console.log('📦 Found Gmail OAuth result in localStorage');
            try {
              const authResult = JSON.parse(stored);
              if (authResult.type === 'OAUTH_SUCCESS' && authResult.authData) {
                console.log('🎉 Processing Gmail OAuth success from localStorage');
                localStorage.removeItem('gmail_oauth_result');
                handleAuthSuccess(authResult.authData);
                // Try to close popup (may fail due to COOP)
                try { popup?.close(); } catch (e) { console.log('Could not close popup:', e); }
                clearTimeout(timeoutId);
                window.removeEventListener("message", handleMessage);
                window.removeEventListener("storage", handleStorageAuth);
                clearInterval(storageCheck);
                updateNodeData({ isAuthenticating: false });
              }
            } catch (error) {
              console.error('Failed to parse stored auth result:', error);
            }
          }
        };

        // Check localStorage more frequently for faster response
        const storageCheck = setInterval(checkLocalStorage, 500);

        // Fallback: Check if popup was closed manually
        const checkClosed = setInterval(() => {
          if (popup?.closed) {
            clearInterval(checkClosed);
            clearInterval(storageCheck);
            clearTimeout(timeoutId);
            window.removeEventListener("message", handleMessage);
            window.removeEventListener("storage", handleStorageAuth);
            updateNodeData({ isAuthenticating: false });
          }
        }, 1000);
      } catch (error) {
        console.error("OAuth2 authentication error:", error);
        updateNodeData({
          isAuthenticating: false,
          lastError:
            error instanceof Error ? error.message : "Authentication failed",
        });
        toast.error("Authentication failed", {
          description: error instanceof Error ? error.message : "Unknown error",
        });
      }
    },
    [token, updateNodeData, handleAuthSuccess, handleAuthError]
  );

  /** Handle manual configuration save */
  const handleManualSave = useCallback(
    async (config: any) => {
      if (!token) {
        return;
      }

      try {
        updateNodeData({ connectionStatus: "connecting", lastError: "" });

        // Store account in Convex
        const accountId = await storeEmailAccount(config);

        if (accountId) {
          updateNodeData({
            isConfigured: true,
            isConnected: true,
            connectionStatus: "connected",
            lastValidated: Date.now(),
            accountId: accountId,
            lastError: "",
          });

          toast.success("Email account configured!", {
            description: `Successfully configured ${config.email}`,
          });
        } else {
          throw new Error("Failed to store account");
        }
      } catch (error) {
        console.error("Manual save error:", error);
        updateNodeData({
          connectionStatus: "error",
          lastError:
            error instanceof Error ? error.message : "Configuration failed",
        });
        toast.error("Configuration failed", {
          description: error instanceof Error ? error.message : "Unknown error",
        });
      }
    },
    [token, storeEmailAccount, updateNodeData]
  );

  /** Reset authentication state and close any open popups */
  const handleResetAuth = useCallback(() => {
    // Close any open OAuth2 popups
    const popups = [];
    try {
      // Try to close OAuth2 popup if it exists
      if (window.opener) {
        window.close();
      }
    } catch (error) {
      // Ignore popup closing errors
    }

    updateNodeData({
      isAuthenticating: false,
      connectionStatus: "disconnected",
      isConnected: false,
      isConfigured: false,
      lastError: "",
      accountId: undefined,
    });
    toast.info("Authentication cancelled", {
      description: "You can try signing in again",
    });
  }, [updateNodeData]);

  /** Test connection */
  const handleTestConnection = useCallback(
    async (accountId: string) => {
      if (!token) {
        return;
      }

      try {
        updateNodeData({ connectionStatus: "connecting", lastError: "" });

        const result = await validateConnection({
          accountId: accountId as any,
          token_hash: token,
        });

        if (result.success) {
          updateNodeData({
            connectionStatus: "connected",
            isConnected: true,
            lastValidated: Date.now(),
            lastError: "",
          });

          toast.success("Connection test successful!");
        } else {
          throw new Error(result.error || "Connection test failed");
        }
      } catch (error) {
        updateNodeData({
          connectionStatus: "error",
          isConnected: false,
          lastError:
            error instanceof Error ? error.message : "Connection test failed",
        });
        toast.error("Connection test failed", {
          description: error instanceof Error ? error.message : "Unknown error",
        });
      }
    },
    [token, validateConnection, updateNodeData]
  );

  const contextValue: EmailAccountContextType = {
    isAuthenticating: nodeData.isAuthenticating,
    connectionStatus: nodeData.connectionStatus,
    lastError: nodeData.lastError,
    handleOAuth2Auth,
    handleAuthSuccess,
    handleAuthError,
    handleResetAuth,
    handleTestConnection,
    handleManualSave,
    storeEmailAccount,
    validateConnection,
  };

  return (
    <EmailAccountContext.Provider value={contextValue}>
      {children}
    </EmailAccountContext.Provider>
  );
};
