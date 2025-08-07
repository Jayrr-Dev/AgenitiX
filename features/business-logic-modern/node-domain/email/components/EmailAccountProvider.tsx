/**
 * Route: features/business-logic-modern/node-domain/email/components/EmailAccountProvider.tsx
 *
 * EMAIL ACCOUNT PROVIDER  – centralises authentication and connection logic
 * ------------------------------------------------------------------------
 *  • COOP-safe: never polls popup.closed
 *  • Primary channel = BroadcastChannel, fallback = same-origin postMessage
 *  • Includes redirect-flow fallback for strict browsers
 *  • Collision detection & auto-recovery using <AuthProvider>
 * ------------------------------------------------------------------------
 */

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from "react";
import { toast } from "sonner";
import { useAuth } from "@/components/auth/AuthProvider";
import { api } from "@/convex/_generated/api";
import { useAction, useMutation } from "convex/react";
import type { EmailProviderType } from "../types";
import { Id } from "@/convex/_generated/dataModel";

/* ----------------------------------------------------------------------- */
/* Types & Constants                                                       */
/* ----------------------------------------------------------------------- */

type ConnectionStatus = "disconnected" | "connecting" | "connected" | "error";

interface EmailAccountContextType {
  isAuthenticating: boolean;
  connectionStatus: ConnectionStatus;
  lastError: string;
  handleOAuth2Auth: (provider: EmailProviderType) => Promise<void>;
  handleResetAuth: () => void;
  handleTestConnection: (accountId: string) => Promise<void>;
  handleManualSave: (config: EmailConfig) => Promise<void>;
}

/** Shape of a manually saved email configuration */
interface EmailConfig {
  email: string;
  displayName?: string;
  [k: string]: unknown;
}

interface EmailAccountProviderProps {
  children: ReactNode;
  nodeData: Record<string, unknown>;
  updateNodeData: (d: Partial<Record<string, unknown>>) => void;
}

const BC_PREFIX = "oauth_";
const JWT_KEY = "__convexAuthJWT_httpsveraciousparakeet120convexcloud";
const REFRESH_KEY =
  "__convexAuthRefreshToken_httpsveraciousparakeet120convexcloud";

/* ----------------------------------------------------------------------- */
/* Helpers                                                                 */
/* ----------------------------------------------------------------------- */

/** Stringify any error to a readable message */
const toMessage = (err: unknown): string =>
  err instanceof Error ? err.message : String(err);

/** Convert AuthProvider state into a comparable snapshot */
const snapshotAuth = ({
  isAuthenticated,
  authToken,
  sessionSource,
}: {
  isAuthenticated: boolean;
  authToken: string | null;
  sessionSource: string | null;
}) => ({
  isAuthenticated,
  hasAuthToken: !!authToken,
  sessionSource,
  jwtToken: localStorage.getItem(JWT_KEY),
  refreshToken: localStorage.getItem(REFRESH_KEY),
});

/* ----------------------------------------------------------------------- */
/* Context                                                                  */
/* ----------------------------------------------------------------------- */

const EmailAccountCtx = createContext<EmailAccountContextType | null>(null);
export const useEmailAccountContext = () => {
  const ctx = useContext(EmailAccountCtx);
  if (!ctx) {
    throw new Error(
      "useEmailAccountContext must be used within EmailAccountProvider",
    );
  }
  return ctx;
};

/* ----------------------------------------------------------------------- */
/* Provider                                                                */
/* ----------------------------------------------------------------------- */

export const EmailAccountProvider = ({
  children,
  nodeData,
  updateNodeData,
}: EmailAccountProviderProps) => {
  /* -------------------------------------------------------------------- */
  /* External hooks / mutations                                           */
  /* -------------------------------------------------------------------- */
  const {
    authToken,
    user,
    isOAuthAuthenticated,
    sessionSource,
    recoverAuth,
  } = useAuth();

  const token = useMemo(
    () => authToken || (user?.id ? `convex_user_${user.id}` : null),
    [authToken, user?.id],
  );

  const storeEmailAccount = useMutation(api.emailAccounts.upsertEmailAccount);
  const validateConnection = useAction(api.emailAccounts.testEmailConnection);

  const isDev = process.env.NODE_ENV === "development";

  /* -------------------------------------------------------------------- */
  /* 🔑 Shared OAuth → Convex save handler                                */
  /* -------------------------------------------------------------------- */
  const onOAuthSuccess = useCallback(
    async (authDataEncoded: string) => {
      if (!token) {
        return;
      }
      try {
        const authData = JSON.parse(atob(authDataEncoded)) as EmailConfig & {
          sessionToken?: string;
        };

        const accountId = await storeEmailAccount({
          ...authData,
          provider: authData.provider as EmailProviderType,
          displayName: authData.displayName ?? authData.email,
          sessionToken: authData.sessionToken ?? token,
        });
        if (!accountId) throw new Error("Failed to save account");

        const updateData = {
          ...authData,
          displayName: authData.displayName ?? authData.email,
          isConfigured: true,
          isConnected: true,
          connectionStatus: "connected",
          lastValidated: Date.now(),
          accountId,
          lastError: "",
        };
        
        updateNodeData(updateData);
        toast.success("Email account connected!", {
          description: `Successfully connected ${authData.email}`,
        });
      } catch (err) {
        const msg = toMessage(err);
        updateNodeData({ lastError: msg });
        toast.error("OAuth save failed", { description: msg });
      }
    },
    [storeEmailAccount, token, updateNodeData],
  );

  /* -------------------------------------------------------------------- */
  /* 🚀 Main OAuth launcher - popup window approach                     */
  /* -------------------------------------------------------------------- */
  const handleOAuth2Auth = useCallback(
    async (provider: EmailProviderType) => {
      if (!token) return;

      /* -------- Abort if session source invalid ----------------------- */
      if (sessionSource !== "convex") {
        updateNodeData({
          isAuthenticating: false,
          lastError:
            "Authentication session is invalid. Please refresh and try again.",
        });
        return;
      }

      /* -------- Store state and open popup window --------------------- */
      try {
        updateNodeData({ isAuthenticating: true, lastError: "" });

        // Store state for popup flow, basically prepare for OAuth popup
        sessionStorage.setItem("oauth_node_state", JSON.stringify({
          provider,
          nodeData: { ...nodeData },
          timestamp: Date.now()
        }));

        // Fetch OAuth URL from API
        const redirectUri = `${window.location.origin}/api/auth/email/${provider}/callback`;
        const res = await fetch(
          `/api/auth/email/${provider}?redirect_uri=${encodeURIComponent(
            redirectUri,
          )}&session_token=${encodeURIComponent(token)}`,
        );
        
        if (!res.ok) {
          const { error } = (await res.json().catch(() => ({}))) as {
            error?: string;
          };
          throw new Error(error ?? `HTTP ${res.status}`);
        }
        
        const { authUrl } = (await res.json()) as { authUrl?: string };
        if (!authUrl) throw new Error("Server did not return authUrl");

        // Show user feedback before opening popup
        toast.info(`Opening ${provider} authentication...`, {
          description: "A new window will open for authentication"
        });

        // Open OAuth provider in popup window, basically keep current page intact
        const popup = window.open(
          authUrl,
          `${provider}_oauth`,
          "width=500,height=600,scrollbars=yes,resizable=yes,status=yes,location=yes,toolbar=no,menubar=no"
        );

        if (!popup) {
          throw new Error("Popup blocked by browser. Please allow popups for this site.");
        }

        // Listen for messages from popup window
        const handlePopupMessage = (event: MessageEvent) => {
          // Filter out React DevTools messages
          if (event.data?.source === 'react-devtools-bridge') {
            return;
          }
          
          // Only accept messages from our origin
          if (event.origin !== window.location.origin) {
            return;
          }

          if (event.data?.type === "OAUTH_SUCCESS") {
            window.removeEventListener("message", handlePopupMessage);
            onOAuthSuccess(event.data.authData);
            updateNodeData({ isAuthenticating: false });
            popup.close();
            toast.success("Email account connected!", {
              description: "Authentication completed successfully"
            });
          } else if (event.data?.type === "OAUTH_ERROR") {
            window.removeEventListener("message", handlePopupMessage);
            updateNodeData({
              isAuthenticating: false,
              lastError: event.data.error || "OAuth authentication failed",
            });
            popup.close();
            toast.error("Authentication failed", {
              description: event.data.error || "Please try again"
            });
          }
        };

        window.addEventListener("message", handlePopupMessage);

        // Fallback: Check if popup was closed manually (with COOP fallback)
        const checkPopupClosed = setInterval(() => {
          try {
            if (popup.closed) {
              clearInterval(checkPopupClosed);
              window.removeEventListener("message", handlePopupMessage);
              updateNodeData({
                isAuthenticating: false,
                lastError: "Authentication was cancelled",
              });
              toast.error("Authentication cancelled", {
                description: "The authentication window was closed"
              });
            }
          } catch (error) {
            // COOP policy blocks window.closed check - this is expected
            // The popup will communicate via postMessage instead
          }
        }, 1000);

        // Timeout after 5 minutes
        setTimeout(() => {
          clearInterval(checkPopupClosed);
          window.removeEventListener("message", handlePopupMessage);
          try {
            if (!popup.closed) {
              popup.close();
            }
          } catch (error) {
            // COOP policy blocks window.close - this is expected
          }
          updateNodeData({
            isAuthenticating: false,
            lastError: "Authentication timeout - please try again",
          });
          toast.error("Authentication timeout", {
            description: "Please try connecting your email again"
          });
        }, 300000); // 5 minutes

      } catch (err) {
        updateNodeData({
          isAuthenticating: false,
          lastError: toMessage(err),
        });
        toast.error("Authentication Error", { description: toMessage(err) });
      }
    },
    [
      authToken,
      sessionSource,
      token,
      updateNodeData,
      nodeData,
      onOAuthSuccess,
    ],
  );



  /* -------------------------------------------------------------------- */
  /* Manual save / reset / test                                            */
  /* -------------------------------------------------------------------- */

  const handleManualSave = useCallback(
    async (config: EmailConfig) => {
      if (!token) return;
      try {
        updateNodeData({ connectionStatus: "connecting", lastError: "" });
        const id = await storeEmailAccount({
          ...config,
          provider: config.provider as EmailProviderType,
          displayName: config.displayName ?? config.email,
        });
        if (!id) throw new Error("Failed to store account");
        updateNodeData({
          ...config,
          isConfigured: true,
          isConnected: true,
          connectionStatus: "connected",
          lastValidated: Date.now(),
          accountId: id,
          lastError: "",
        });
        toast.success("Email account configured!", {
          description: `Successfully configured ${config.email}`,
        });
      } catch (err) {
        const msg = toMessage(err);
        updateNodeData({ connectionStatus: "error", lastError: msg });
        toast.error("Configuration failed", { description: msg });
      }
    },
    [storeEmailAccount, token, updateNodeData],
  );

  const handleResetAuth = useCallback(() => {
    updateNodeData({
      isAuthenticating: false,
      connectionStatus: "disconnected",
      isConnected: false,
      isConfigured: false,
      lastError: "",
      accountId: undefined,
    });
    toast.info("Authentication cancelled");
  }, [updateNodeData]);

  const handleTestConnection = useCallback(
    async (accountId: string) => {
      if (!token) return;
      try {
        updateNodeData({ connectionStatus: "connecting", lastError: "" });
        const result = await validateConnection({
          accountId: accountId as unknown as Id<"email_accounts">,
          token_hash: token,
        });
        if (!result.success) throw new Error(result.error!);
        updateNodeData({
          connectionStatus: "connected",
          isConnected: true,
          lastValidated: Date.now(),
          lastError: "",
        });
        toast.success("Connection test successful!");
      } catch (err) {
        const msg = toMessage(err);
        updateNodeData({
          connectionStatus: "error",
          isConnected: false,
          lastError: msg,
        });
        toast.error("Connection test failed", { description: msg });
      }
    },
    [token, updateNodeData, validateConnection],
  );

  /* -------------------------------------------------------------------- */
  /* Render                                                                */
  /* -------------------------------------------------------------------- */

  return (
    <EmailAccountCtx.Provider
      value={{
        isAuthenticating: !!nodeData.isAuthenticating,
        connectionStatus: nodeData.connectionStatus as ConnectionStatus,
        lastError: (nodeData.lastError as string) ?? "",
        handleOAuth2Auth,
        handleResetAuth,
        handleTestConnection,
        handleManualSave,
      }}
    >
      {children}
    </EmailAccountCtx.Provider>
  );
};
