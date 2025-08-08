/* ----------------------------------------------------------------------
 * Route: features/business-logic-modern/node-domain/email/components/EmailAccountAuth.tsx
 * EMAIL ACCOUNT AUTH – OAuth2 & manual config UI for an email-connection node
 * ----------------------------------------------------------------------
 */

import { memo, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEmailAccountContext } from "./EmailAccountProvider";
import type { EmailProviderType } from "../types";

/* -------------------------------------------------------------------- */
/* Types                                                                */
/* -------------------------------------------------------------------- */

type ConnectionMode = "oauth2" | "manual";

/** Shape of the node’s local state (extend as needed) */
export interface EmailNodeData {
  provider: EmailProviderType;
  email?: string;
  displayName?: string;
  isAuthenticating?: boolean;

  /* Manual config */
  imapHost?: string;
  imapPort?: number | "";
  smtpHost?: string;
  smtpPort?: number | "";
  username?: string;
  password?: string;
  useSSL?: boolean;
  useTLS?: boolean;
}

interface EmailAccountAuthProps {
  nodeData: EmailNodeData;
  updateNodeData: (d: Partial<EmailNodeData>) => void;
  isEnabled: boolean;
}

/* -------------------------------------------------------------------- */
/* Provider metadata (one source of truth)                              */
/* -------------------------------------------------------------------- */

const PROVIDER_MAP: Record<
  EmailProviderType,
  { name: string; mode: ConnectionMode }
> = {
  gmail: { name: "Gmail", mode: "oauth2" },
  outlook: { name: "Outlook", mode: "oauth2" },
  yahoo: { name: "Yahoo", mode: "oauth2" },
  imap: { name: "IMAP", mode: "manual" },
  smtp: { name: "SMTP", mode: "manual" },
};

/* -------------------------------------------------------------------- */
/* Styling constants – keep in sync with Tailwind / Radix tokens        */
/* -------------------------------------------------------------------- */

const AUTH_STYLES = {
  button: {
    primary:
      "w-full h-6 rounded-md bg-white text-black text-[10px] font-medium hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 transition-all flex items-center justify-center",
    secondary:
      "w-full h-6 rounded-md border border-[--node-email-border] bg-transparent text-[--node-email-text] text-[10px] font-medium hover:bg-[--node-email-bg-hover] disabled:cursor-not-allowed disabled:opacity-50 transition-all flex items-center justify-center",
  },
  fieldGroup: "space-y-1",
  inlineGroup: "grid grid-cols-2 gap-2",
  label: "text-[--node-email-text] text-[8px] font-medium mb-0 block",
  input:
    "h-6 text-[10px] border border-[--node-email-border] bg-[--node-email-bg] text-[--node-email-text] rounded-md px-2 focus:ring-1 focus:ring-[--node-email-border-hover] focus:border-[--node-email-border-hover] disabled:opacity-50 disabled:cursor-not-allowed placeholder:text-[--node-email-text-secondary] placeholder:text-[10px] transition-all",
} as const;

/* -------------------------------------------------------------------- */
/* Utilities                                                            */
/* -------------------------------------------------------------------- */

/** Port helper – returns valid number or empty string */
const sanitizePort = (v: string): number | "" => {
  const digits = v.replace(/\D/g, "");
  if (!digits) return "";
  const n = Number(digits);
  return n >= 1 && n <= 65_535 ? n : "";
};

/* -------------------------------------------------------------------- */
/* Component                                                            */
/* -------------------------------------------------------------------- */

export const EmailAccountAuth = memo(
  ({ nodeData, updateNodeData, isEnabled }: EmailAccountAuthProps) => {
    /* ---------------- Context: shared auth handlers ------------------ */
    const {
      isAuthenticating: globalAuthenticating,
      handleOAuth2Auth,
      handleResetAuth,
      handleManualSave,
      handleDisconnect,
    } = useEmailAccountContext();

    const {
      provider,
      email,
      displayName,
      imapHost,
      imapPort,
      smtpHost,
      smtpPort,
      username,
      password,
      useSSL = false,
      useTLS = true,
    } = nodeData;

    const meta = PROVIDER_MAP[provider];
    const isOAuth = meta.mode === "oauth2";
    const isManual = meta.mode === "manual";
    const isLocked = !!nodeData.isConnected; // When connected, lock auth UI to enforce one email per node

    /* ---------------- Handlers --------------------------------------- */

    /** Launch OAuth2 redirect flow */
    const onOAuthClick = useCallback(() => {
      if (isOAuth && email) {
        // Dispatch debug event for OAuth initiation
        window.dispatchEvent(new CustomEvent('email-debug', {
          detail: {
            type: 'OAUTH_INITIATED',
            provider,
            email,
            timestamp: Date.now()
          }
        }));
        handleOAuth2Auth(provider);
      }
    }, [isOAuth, email, provider, handleOAuth2Auth]);

    /** Generic field updater */
    const updateField = useCallback(
      <K extends keyof EmailNodeData>(key: K) =>
        (e: React.ChangeEvent<HTMLInputElement>) => {
          const { type, checked, value } = e.target;

          const nextValue: EmailNodeData[K] =
            type === "checkbox"
              ? (checked as EmailNodeData[K])
              : (["imapPort", "smtpPort"].includes(key as string)
                  ? sanitizePort(value)
                  : value) as EmailNodeData[K];

          updateNodeData({ [key]: nextValue } as Partial<EmailNodeData>);
        },
      [updateNodeData],
    );

    /** Persist manual settings */
    const onSaveManual = useCallback(() => {
      if (!isManual) return;

      handleManualSave({
        provider,
        email: email ?? "",
        displayName,
        imapConfig: {
          host: imapHost,
          port: imapPort,
          secure: useSSL,
          username,
          password,
        },
        smtpConfig: {
          host: smtpHost,
          port: smtpPort,
          secure: useTLS,
          username,
          password,
        },
      });
    }, [
      isManual,
      provider,
      email,
      displayName,
      imapHost,
      imapPort,
      smtpHost,
      smtpPort,
      useSSL,
      useTLS,
      username,
      password,
      handleManualSave,
    ]);

    /* ---------------- Memo helpers ----------------------------------- */
    const isAuthInProgress = !!nodeData.isAuthenticating || !!globalAuthenticating;
    const oauthBtnLabel = useMemo(() => {
      if (nodeData.isConnected && email) return `Logout ${meta.name}`;
      if (isAuthInProgress) return "Cancel";
      return `Connect ${meta.name}`;
    }, [meta.name, nodeData.isConnected, email, isAuthInProgress]);

    /* ---------------- Render ----------------------------------------- */
    return (
      <div className="space-y-3">
        {/* ---------- OAuth2 block ---------- */}
        {isOAuth && (
          <div className="space-y-2 pt-2">
            <button
              type="button"
              className={
                nodeData.isConnected
                  ? AUTH_STYLES.button.secondary
                  : isAuthInProgress
                    ? AUTH_STYLES.button.secondary
                    : AUTH_STYLES.button.primary
              }
              disabled={
                nodeData.isConnected
                  ? !isEnabled
                  : isAuthInProgress
                    ? !isEnabled
                    : (!isEnabled || !email || isLocked)
              }
              onClick={() => {
                if (nodeData.isConnected && nodeData.accountId) {
                  handleDisconnect(nodeData.accountId);
                } else if (isAuthInProgress) {
                  handleResetAuth();
                } else {
                  onOAuthClick();
                }
              }}
              aria-label={
                nodeData.isConnected
                  ? `Logout ${meta.name}`
                  : isAuthInProgress
                    ? "Cancel authentication"
                    : `Authenticate ${meta.name} account`
              }
            >
              {oauthBtnLabel}
            </button>
          </div>
        )}

        {/* ---------- Manual block ---------- */}
        {isManual && !isLocked && (
          <div className="space-y-1 mt-2 pt-1 border-t border-black/20">
            <p className="text-[11px] font-medium text-[--node-email-text-secondary] mb-1">
              Advanced Settings
            </p>

            {/* ---------------- Server host / port -------------------- */}
            {provider === "imap" && (
              <div className={AUTH_STYLES.inlineGroup}>
                <div className={AUTH_STYLES.fieldGroup}>
                  <label className={AUTH_STYLES.label}>IMAP Server</label>
                  <Input
                    value={imapHost ?? ""}
                    onChange={updateField("imapHost")}
                    placeholder="imap.example.com"
                    className={AUTH_STYLES.input}
                    disabled={!isEnabled}
                  />
                </div>

                <div className={AUTH_STYLES.fieldGroup}>
                  <label className={AUTH_STYLES.label}>Port</label>
                  <Input
                    value={imapPort ?? ""}
                    onChange={updateField("imapPort")}
                    placeholder="993"
                    className={AUTH_STYLES.input}
                    disabled={!isEnabled}
                  />
                </div>
              </div>
            )}

            {provider === "smtp" && (
              <div className={AUTH_STYLES.inlineGroup}>
                <div className={AUTH_STYLES.fieldGroup}>
                  <label className={AUTH_STYLES.label}>SMTP Server</label>
                  <Input
                    value={smtpHost ?? ""}
                    onChange={updateField("smtpHost")}
                    placeholder="smtp.example.com"
                    className={AUTH_STYLES.input}
                    disabled={!isEnabled}
                  />
                </div>

                <div className={AUTH_STYLES.fieldGroup}>
                  <label className={AUTH_STYLES.label}>Port</label>
                  <Input
                    value={smtpPort ?? ""}
                    onChange={updateField("smtpPort")}
                    placeholder="587"
                    className={AUTH_STYLES.input}
                    disabled={!isEnabled}
                  />
                </div>
              </div>
            )}

            {/* ---------------- Credentials --------------------------- */}
            <div className={AUTH_STYLES.inlineGroup}>
              <Input
                value={username ?? ""}
                onChange={updateField("username")}
                placeholder="Username"
                className={AUTH_STYLES.input}
                disabled={!isEnabled}
                aria-label="Username"
              />

              <Input
                type="password"
                value={password ?? ""}
                onChange={updateField("password")}
                placeholder="Password"
                className={AUTH_STYLES.input}
                disabled={!isEnabled}
                aria-label="Password"
              />
            </div>

            {/* ---------------- Security opts ------------------------- */}
            <label className="flex items-center gap-2 pt-2 text-[11px] text-[--node-email-text]">
              <input
                type="checkbox"
                checked={provider === "imap" ? useSSL : useTLS}
                onChange={updateField(provider === "imap" ? "useSSL" : "useTLS")}
                className="scale-75"
                disabled={!isEnabled}
                aria-label={`Use ${provider === "imap" ? "SSL" : "TLS"} encryption`}
              />
              Use {provider === "imap" ? "SSL" : "TLS"} encryption
            </label>

            <Button
              type="button"
              size="xm"
              variant="outline"
              className="w-full p-0 mt-0 text-xs"
              onClick={onSaveManual}
              disabled={
                !(
                  isEnabled &&
                  email &&
                  username &&
                  password &&
                  (provider === "imap"
                    ? imapHost && imapPort
                    : smtpHost && smtpPort)
                )
              }
            >
              Save Settings
            </Button>
          </div>
        )}
      </div>
    );
  },
);

EmailAccountAuth.displayName = "EmailAccountAuth";
