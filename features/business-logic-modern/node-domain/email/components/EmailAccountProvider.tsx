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
  /* 🚀 Main OAuth launcher                                               */
  /* -------------------------------------------------------------------- */
  const handleOAuth2Auth = useCallback(
    async (provider: EmailProviderType) => {
      if (!token) return;

      /* -------- Snapshot pre-OAuth state ------------------------------ */
      const preState = snapshotAuth({
        isAuthenticated: isOAuthAuthenticated,
        authToken,
        sessionSource,
      });

      /* -------- Abort if session source invalid ----------------------- */
      if (sessionSource !== "convex") {
        updateNodeData({
          isAuthenticating: false,
          lastError:
            "Authentication session is invalid. Please refresh and try again.",
        });
        return;
      }

      /* -------- Fetch OAuth URL --------------------------------------- */
      const redirectUri = `${window.location.origin}/api/auth/email/${provider}/callback`;

      try {
        updateNodeData({ isAuthenticating: true, lastError: "" });

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

        /* -------- Open popup + wire listeners ------------------------- */
        const popup = window.open(
          authUrl,
          "oauth2",
          "width=500,height=600,scrollbars=yes,resizable=yes,noopener",
        );
        if (!popup) {
          updateNodeData({
            isAuthenticating: false,
            lastError:
              "Popup blocked. Please enable popups for this site and try again.",
          });
          return;
        }

        const channel = new BroadcastChannel(`${BC_PREFIX}${provider}`);
        const timeoutId = isDev
          ? window.setTimeout(() => {
              updateNodeData({
                isAuthenticating: false,
                lastError:
                  "Dev timeout: popup did not respond in 30 s. Check console.",
              });
              popup.close();
              channel.close();
            }, 30_000)
          : undefined;

        /** Helper: verify auth collision & attempt recovery */
        const verifyCollision = () => {
          const postState = snapshotAuth({
            isAuthenticated: isOAuthAuthenticated,
            authToken,
            sessionSource,
          });

          if (preState.isAuthenticated && !postState.isAuthenticated) {
            toast.error("Authentication was lost, trying to recover…");
            if (!recoverAuth()) {
              updateNodeData({
                lastError:
                  "Authentication was lost during email connection. Please sign in again.",
              });
            }
          }
        };

        /** Unified clean-up */
        const clean = () => {
          channel.close();
          window.removeEventListener("message", onMessage);
          window.clearTimeout(timeoutId);
          if (!popup.closed) popup.close();
        };

        /** BroadcastChannel handler */
        channel.onmessage = (ev) => {
          if (ev.data?.type === "OAUTH_SUCCESS") {
            onOAuthSuccess(ev.data.authData);
            verifyCollision();
            updateNodeData({ isAuthenticating: false });
            clean();
          }
        };

        /** Same-origin postMessage fallback */
        const onMessage = (ev: MessageEvent) => {
          if (ev.origin !== window.location.origin) return;
          if (ev.data?.type === "OAUTH_SUCCESS") {
            onOAuthSuccess(ev.data.authData);
            verifyCollision();
            updateNodeData({ isAuthenticating: false });
            clean();
          }
        };
        window.addEventListener("message", onMessage);
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
      isOAuthAuthenticated,
      onOAuthSuccess,
      recoverAuth,
      sessionSource,
      token,
      updateNodeData,
    ],
  );

  /* -------------------------------------------------------------------- */
  /* 🌀 Redirect-flow fallback (no popup)                                */
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
        const { provider } = JSON.parse(nodeStateRaw) as {
          provider: EmailProviderType;
        };
        sessionStorage.removeItem("oauth_node_state");
        // Exchange code in a hidden iframe so CORS is identical to popup path
        const iframe = document.createElement("iframe");
        iframe.style.display = "none";
        iframe.src = `${window.location.origin}/api/auth/email/${provider}/callback?code=${encodeURIComponent(
          code,
        )}${state ? `&state=${encodeURIComponent(state)}` : ""}`;
        document.body.appendChild(iframe);

        const channel = new BroadcastChannel(`${BC_PREFIX}${provider}`);
        const timer = window.setTimeout(() => {
          updateNodeData({
            isAuthenticating: false,
            lastError: "OAuth processing timeout",
          });
          channel.close();
          document.body.removeChild(iframe);
        }, 30_000);

        channel.onmessage = (ev) => {
          window.clearTimeout(timer);
          channel.close();
          document.body.removeChild(iframe);
          if (ev.data?.type === "OAUTH_SUCCESS") {
            onOAuthSuccess(ev.data.authData);
          } else if (ev.data?.type === "OAUTH_ERROR") {
            updateNodeData({
              isAuthenticating: false,
              lastError: ev.data.error,
            });
          }
        };
      } catch (e) {
        updateNodeData({
          isAuthenticating: false,
          lastError: toMessage(e),
        });
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
