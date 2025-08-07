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
import { useAuthContext } from "@/components/auth/AuthProvider";
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
  } = useAuthContext();

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
      if (!token) return;
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

        updateNodeData({
          ...authData,
          displayName: authData.displayName ?? authData.email,
          isConfigured: true,
          isConnected: true,
          connectionStatus: "connected",
          lastValidated: Date.now(),
          accountId,
          lastError: "",
        });
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
  /* 🚀 Main OAuth launcher - redirect-only approach                     */
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

      /* -------- Store state and redirect directly --------------------- */
      try {
        updateNodeData({ isAuthenticating: true, lastError: "" });

        // Store state for redirect flow, basically prepare for OAuth redirect
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

        // Show user feedback before redirect
        toast.info(`Redirecting to ${provider} authentication...`, {
          description: "You'll be redirected back after signing in"
        });

        // Redirect to OAuth provider
        window.location.href = authUrl;
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
    ],
  );

  /* -------------------------------------------------------------------- */
  /* 🌀 Handle redirect-flow OAuth callback                              */
  /* -------------------------------------------------------------------- */
  useEffect(() => {
    const url = new URL(window.location.href);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const error = url.searchParams.get("error");
    const nodeStateRaw = sessionStorage.getItem("oauth_node_state");

    const cleanUrl = () => {
      ["code", "state", "error"].forEach((k) => url.searchParams.delete(k));
      window.history.replaceState({}, "", url.toString());
    };

    (async () => {
      if (!code || !nodeStateRaw) return;
      
      try {
        const { provider, nodeData: savedNodeData } = JSON.parse(nodeStateRaw) as {
          provider: EmailProviderType;
          nodeData: Record<string, unknown>;
          timestamp: number;
        };
        
        // Restore node state for redirect flow, basically sync UI with OAuth process
        if (savedNodeData) {
          updateNodeData({
            ...savedNodeData,
            isAuthenticating: true,
            lastError: ""
          });
        }
        
        sessionStorage.removeItem("oauth_node_state");
        
        // Process OAuth callback directly via hidden iframe
        const iframe = document.createElement("iframe");
        iframe.style.display = "none";
        iframe.src = `${window.location.origin}/api/auth/email/${provider}/callback?code=${encodeURIComponent(
          code,
        )}${state ? `&state=${encodeURIComponent(state)}` : ""}`;
        document.body.appendChild(iframe);

        // Listen for success via BroadcastChannel
        const channel = new BroadcastChannel(`${BC_PREFIX}${provider}`);
        const timer = window.setTimeout(() => {
          updateNodeData({
            isAuthenticating: false,
            lastError: "OAuth processing timeout - please try again",
          });
          channel.close();
          if (iframe.parentNode) document.body.removeChild(iframe);
          toast.error("Authentication timeout", {
            description: "Please try connecting your email again"
          });
        }, 30_000);

        channel.onmessage = (ev) => {
          window.clearTimeout(timer);
          channel.close();
          if (iframe.parentNode) document.body.removeChild(iframe);
          
          if (ev.data?.type === "OAUTH_SUCCESS") {
            onOAuthSuccess(ev.data.authData);
            updateNodeData({ isAuthenticating: false });
          } else if (ev.data?.type === "OAUTH_ERROR") {
            updateNodeData({
              isAuthenticating: false,
              lastError: ev.data.error || "OAuth authentication failed",
            });
            toast.error("Authentication failed", {
              description: ev.data.error || "Please try again"
            });
          }
        };
      } catch (e) {
        const msg = toMessage(e);
        updateNodeData({
          isAuthenticating: false,
          lastError: msg,
        });
        toast.error("OAuth processing failed", { description: msg });
      } finally {
        cleanUrl();
      }
    })();
  }, [onOAuthSuccess, updateNodeData]);

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
