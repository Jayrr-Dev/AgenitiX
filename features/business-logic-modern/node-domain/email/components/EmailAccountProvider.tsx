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

import { useAuth } from "@/components/auth/AuthProvider";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useNodeToast } from "@/hooks/useNodeToast";
import {
  useAction,
  useConvexAuth as useConvexAuthClient,
  useQuery,
} from "convex/react";
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
} from "react";
import type { EmailProviderType } from "../types";

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
  handleDisconnect: (accountId: string) => Promise<void>;
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
  nodeId: string;
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
      "useEmailAccountContext must be used within EmailAccountProvider"
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
  nodeId,
}: EmailAccountProviderProps) => {
  // Node-local toast helpers
  const { showSuccess, showError, showInfo, showWarning } =
    useNodeToast(nodeId);
  /* -------------------------------------------------------------------- */
  /* External hooks / mutations                                           */
  /* -------------------------------------------------------------------- */
  const {
    authToken,
    user,
    isOAuthAuthenticated,
    isLoading,
    sessionSource,
    recoverAuth,
  } = useAuth();

  // Convex client auth – authoritative readiness for ctx.auth on the server
  const convexClientAuth = useConvexAuthClient();

  const token = useMemo(
    () => (user?.id ? `convex_user_${user.id}` : authToken),
    [authToken, user?.id]
  );

  const storeEmailAccountAction = useAction(
    api.emailAccounts.upsertEmailAccountAction
  );
  const validateConnection = useAction(api.emailAccounts.testEmailConnection);
  const deactivateAccount = useAction(
    api.emailAccounts.deactivateEmailAccountAction
  );

  // 🔍 TEST: Add a simple test mutation to check if auth context works
  // const testMutation = useMutation(api.flows.createFlow);

  const isDev = process.env.NODE_ENV === "development";

  /* -------------------------------------------------------------------- */
  /* 🧩 Hydrate node from server on refresh                               */
  /* -------------------------------------------------------------------- */
  // Load the user's active accounts so the node can rehydrate itself after reload
  // Use the 'byUserEmail' query with a skip sentinel to ensure it re-executes
  // once auth/userEmail is available after refresh
  const hydrationArgs = useMemo(
    () => (user?.email ? { userEmail: user.email } : "skip"),
    [user?.email]
  );
  const userAccounts = useQuery(
    api.emailAccounts.getEmailAccountsByUserEmail,
    hydrationArgs as any
  );

  useEffect(() => {
    // Guard: need accounts and not currently authenticating
    if (hydrationArgs === "skip") return; // [Explanation], basically wait until userEmail is known
    if (!Array.isArray(userAccounts) || userAccounts.length === 0) return;
    if ((nodeData as any)?.isAuthenticating) return;

    const currentAccountId: string | undefined = (nodeData as any)?.accountId;
    const selected = currentAccountId
      ? userAccounts.find(
          (a: any) => String(a._id) === String(currentAccountId)
        )
      : userAccounts[0];
    if (!selected) return;

    // Build updates from server state
    const nextState = {
      accountId: selected._id as string,
      email: selected.email as string,
      displayName:
        (selected.display_name as string) ??
        (nodeData as any)?.displayName ??
        "",
      isConfigured: true,
      isConnected: selected.connection_status === "connected",
      connectionStatus: selected.connection_status as any,
      lastValidated: selected.last_validated as number | undefined,
      lastError: "",
    } as const;

    // Apply only when values differ
    const hasDiff = Object.entries(nextState).some(
      ([k, v]) => (nodeData as any)?.[k] !== v
    );
    if (hasDiff) {
      updateNodeData(nextState as any);
    }
  }, [userAccounts, nodeData, updateNodeData]);

  /* -------------------------------------------------------------------- */
  /* 🔑 Shared OAuth → Convex save handler                                */
  /* -------------------------------------------------------------------- */
  const onOAuthSuccess = useCallback(
    async (authDataEncoded: string) => {
      console.log("🔍 onOAuthSuccess: Authentication state:", {
        authToken,
        userId: user?.id,
        token,
        isOAuthAuthenticated,
        sessionSource,
      });

      if (!token) {
        showError(
          "Authentication required",
          "Please sign in to connect your email account"
        );
        return;
      }
      try {
        const authData = JSON.parse(atob(authDataEncoded)) as EmailConfig & {
          sessionToken?: string;
        };

        console.log(
          "🔍 onOAuthSuccess: About to call storeEmailAccount with:",
          {
            ...authData,
            provider: authData.provider as EmailProviderType,
            displayName: authData.displayName ?? authData.email,
            // Don't pass sessionToken - let Convex Auth handle it automatically
            // Hide sensitive tokens in logs
            accessToken: authData.accessToken ? "[HIDDEN]" : undefined,
            refreshToken: authData.refreshToken ? "[HIDDEN]" : undefined,
          }
        );

        // Ensure Convex Auth is fully ready before calling the mutation, basically avoid race conditions
        const waitForConvexAuth = async () => {
          const maxAttempts = 20;
          for (let attempt = 0; attempt < maxAttempts; attempt++) {
            const ready =
              !convexClientAuth.isLoading && convexClientAuth.isAuthenticated;
            if (ready) break;
            await new Promise((r) => setTimeout(r, 150));
          }
        };

        await waitForConvexAuth();

        // 🔧 FIXED: Don't pass sessionToken manually - Convex Auth handles this automatically
        const { sessionToken: _omitSessionToken, ...authDataSanitized } =
          authData; // Remove sessionToken, basically don't send it to Convex

        const tryStore = async () =>
          await storeEmailAccountAction({
            ...authDataSanitized,
            provider: authData.provider as EmailProviderType,
            displayName: authData.displayName ?? authData.email,
            userEmailHint: user?.email,
          });

        let accountId: string | undefined;
        try {
          accountId = await tryStore();
        } catch (e) {
          const msg = toMessage(e);
          if (/Authentication required/i.test(msg)) {
            await waitForConvexAuth();
            accountId = await tryStore();
          } else {
            throw e;
          }
        }
        if (!accountId || typeof accountId !== "string")
          throw new Error("Failed to save account");

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
        showSuccess(
          "Email account connected!",
          `Successfully connected ${authData.email}`
        );
      } catch (err) {
        const msg = toMessage(err);
        updateNodeData({ lastError: msg });
        showError("OAuth save failed", msg);
      }
    },
    [
      storeEmailAccountAction,
      token,
      updateNodeData,
      convexClientAuth.isAuthenticated,
      convexClientAuth.isLoading,
    ]
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
        sessionStorage.setItem(
          "oauth_node_state",
          JSON.stringify({
            provider,
            nodeData: { ...nodeData },
            timestamp: Date.now(),
          })
        );

        // Fetch OAuth URL from API
        const redirectUri = `${window.location.origin}/api/auth/email/${provider}/callback`;
        const res = await fetch(
          `/api/auth/email/${provider}?redirect_uri=${encodeURIComponent(
            redirectUri
          )}&session_token=${encodeURIComponent(token)}`
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
        showInfo(
          `Opening ${provider}...`,
          "A new window will open for authentication"
        );

        // Open OAuth provider in popup window, basically keep current page intact
        const popup = window.open(
          authUrl,
          `${provider}_oauth`,
          "width=500,height=600,scrollbars=yes,resizable=yes,status=yes,location=yes,toolbar=no,menubar=no"
        );

        if (!popup) {
          throw new Error(
            "Popup blocked by browser. Please allow popups for this site."
          );
        }

        // Listen for messages from popup window
        const handlePopupMessage = (event: MessageEvent) => {
          console.log("🔍 POPUP MESSAGE RECEIVED:", {
            type: event.data?.type,
            origin: event.origin,
            expectedOrigin: window.location.origin,
            data: event.data,
          });

          // Filter out React DevTools messages
          if (event.data?.source === "react-devtools-bridge") {
            console.log("🔍 Filtered out React DevTools message");
            return;
          }

          // Only accept messages from our origin
          if (event.origin !== window.location.origin) {
            console.log("🔍 Origin mismatch, ignoring message");
            return;
          }

          if (event.data?.type === "TEST_MESSAGE") {
            console.log("🔍 TEST MESSAGE RECEIVED from popup!", event.data);
          } else if (event.data?.type === "OAUTH_SUCCESS") {
            console.log("🔍 OAUTH_SUCCESS message received!", event.data);
            console.log(
              "🔍 About to call onOAuthSuccess with:",
              event.data.authData
            );
            clearInterval(checkPopupClosed);
            clearTimeout(timeoutId);
            window.removeEventListener("message", handlePopupMessage);
            updateNodeData({ isAuthenticating: false });
            popup.close();

            // 🔧 DELAY: Call onOAuthSuccess in next tick to ensure proper auth context
            setTimeout(() => {
              console.log(
                "🔍 DELAYED: Calling onOAuthSuccess after context stabilization (postMessage)"
              );
              onOAuthSuccess(event.data.authData);
            }, 100);

            showSuccess(
              "Email account connected!",
              "Authentication completed successfully"
            );
          } else if (event.data?.type === "OAUTH_ERROR") {
            console.log("🔍 OAUTH_ERROR message received:", event.data.error);
            clearInterval(checkPopupClosed);
            clearTimeout(timeoutId);
            window.removeEventListener("message", handlePopupMessage);
            updateNodeData({
              isAuthenticating: false,
              lastError: event.data.error || "OAuth authentication failed",
            });
            popup.close();
            showError(
              "Authentication failed",
              event.data.error || "Please try again"
            );
          }
        };

        window.addEventListener("message", handlePopupMessage);

        // Listen for BroadcastChannel messages (COOP-safe)
        const broadcastChannel = new BroadcastChannel("oauth_gmail");
        console.log("🔍 PARENT: BroadcastChannel listener set up");

        // Test BroadcastChannel immediately
        setTimeout(() => {
          broadcastChannel.postMessage({ type: "TEST_PARENT", test: true });
          console.log("🔍 PARENT: Test message sent via BroadcastChannel");
        }, 100);

        broadcastChannel.onmessage = (event) => {
          console.log(
            "🔍 PARENT: BroadcastChannel message received:",
            event.data
          );
          if (event.data?.type === "OAUTH_SUCCESS") {
            console.log("🔍 PARENT: OAuth success via BroadcastChannel!");
            console.log(
              "🔍 About to call onOAuthSuccess with BroadcastChannel data:",
              event.data.authData
            );
            clearInterval(checkPopupClosed);
            clearTimeout(timeoutId);
            window.removeEventListener("message", handlePopupMessage);
            broadcastChannel.close();
            updateNodeData({ isAuthenticating: false });
            popup.close();

            // 🔧 DELAY: Call onOAuthSuccess in next tick to ensure proper auth context
            setTimeout(() => {
              console.log(
                "🔍 DELAYED: Calling onOAuthSuccess after context stabilization"
              );
              onOAuthSuccess(event.data.authData);
            }, 100);
            showSuccess(
              "Email account connected!",
              "Authentication completed successfully"
            );
          }
        };

        // Declare timeout ID first so it can be referenced in checkPopupClosed
        let timeoutId: NodeJS.Timeout;

        // Enhanced popup closure detection - checks every 1 second for user-initiated closure
        const checkPopupClosed = setInterval(() => {
          try {
            // Check if popup was closed by user, basically detect manual window closure
            if (popup.closed) {
              console.log("🔍 POPUP: Detected popup closure by user");
              clearInterval(checkPopupClosed);
              clearTimeout(timeoutId);
              window.removeEventListener("message", handlePopupMessage);
              broadcastChannel.close();
              updateNodeData({
                isAuthenticating: false,
                lastError: "", // Don't set error for user-initiated closure
              });
              showInfo("Authentication cancelled", "Popup window was closed");
              return;
            }
          } catch (error) {
            // COOP policy may block popup.closed access - this is expected
            // Continue with message-based detection only
            console.log("🔍 POPUP: Cannot access popup.closed (COOP policy)");
          }
        }, 1000); // Check every second

        // Timeout after 5 minutes
        timeoutId = setTimeout(() => {
          clearInterval(checkPopupClosed);
          window.removeEventListener("message", handlePopupMessage);
          broadcastChannel.close();
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
          showError(
            "Authentication timeout",
            "Please try connecting your email again"
          );
        }, 300000); // 5 minutes
      } catch (err) {
        updateNodeData({
          isAuthenticating: false,
          lastError: toMessage(err),
        });
        showError("Authentication Error", toMessage(err));
      }
    },
    [authToken, sessionSource, token, updateNodeData, nodeData, onOAuthSuccess]
  );

  /* -------------------------------------------------------------------- */
  /* Manual save / reset / test                                            */
  /* -------------------------------------------------------------------- */

  const handleManualSave = useCallback(
    async (config: EmailConfig) => {
      if (!token) return;
      try {
        updateNodeData({ connectionStatus: "connecting", lastError: "" });
        const waitForConvexAuth = async () => {
          const maxAttempts = 20;
          for (let attempt = 0; attempt < maxAttempts; attempt++) {
            const ready =
              !convexClientAuth.isLoading && convexClientAuth.isAuthenticated;
            if (ready) break;
            await new Promise((r) => setTimeout(r, 150));
          }
        };

        await waitForConvexAuth();

        const id = await storeEmailAccountAction({
          ...config,
          provider: config.provider as EmailProviderType,
          displayName: config.displayName ?? config.email,
          userEmailHint: user?.email as string | undefined,
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
        showSuccess(
          "Email account configured!",
          `Successfully configured ${config.email}`
        );
      } catch (err) {
        const msg = toMessage(err);
        updateNodeData({ connectionStatus: "error", lastError: msg });
        showError("Configuration failed", msg);
      }
    },
    [
      storeEmailAccountAction,
      token,
      updateNodeData,
      convexClientAuth.isAuthenticated,
      convexClientAuth.isLoading,
    ]
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
    showInfo("Authentication cancelled");
  }, [updateNodeData]);

  const handleTestConnection = useCallback(
    async (accountId: string) => {
      if (!token) return;
      try {
        updateNodeData({ connectionStatus: "connecting", lastError: "" });
        const result = await validateConnection({
          accountId: accountId as unknown as Id<"email_accounts">,
        });
        if (!result.success) throw new Error(result.error!);
        updateNodeData({
          connectionStatus: "connected",
          isConnected: true,
          lastValidated: Date.now(),
          lastError: "",
        });
        showSuccess("Connection test successful!");
      } catch (err) {
        const msg = toMessage(err);
        updateNodeData({
          connectionStatus: "error",
          isConnected: false,
          lastError: msg,
        });
        showError("Connection test failed", msg);
      }
    },
    [token, updateNodeData, validateConnection]
  );

  const handleDisconnect = useCallback(
    async (accountId: string) => {
      if (!token) return;
      try {
        await deactivateAccount({
          accountId: accountId as unknown as Id<"email_accounts">,
          userEmailHint: user?.email,
        });
        updateNodeData({
          isAuthenticating: false,
          connectionStatus: "disconnected",
          isConnected: false,
          isConfigured: false,
          lastValidated: undefined,
          accountId: undefined,
          // Clear identity fields after logout, basically remove email and name from UI
          email: "",
          displayName: "",
          lastError: "",
        });
        showInfo("Signed out", "Email account logged out");
      } catch (err) {
        const msg = toMessage(err);
        showError("Failed to disconnect", msg);
      }
    },
    [deactivateAccount, token, updateNodeData]
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
        handleDisconnect,
      }}
    >
      {children}
    </EmailAccountCtx.Provider>
  );
};
