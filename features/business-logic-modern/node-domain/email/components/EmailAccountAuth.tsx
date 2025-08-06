/**
 * Route: features/business-logic-modern/node-domain/email/components/EmailAccountAuth.tsx
 * EMAIL ACCOUNT AUTHENTICATION - OAuth2 and manual authentication flows
 *
 * • OAuth2 authentication buttons for supported providers
 * • Manual configuration form for IMAP/SMTP
 * • Authentication state management and error handling
 * • Reset functionality for stuck authentication states
 *
 * Keywords: oauth2-authentication, manual-config, auth-flow, error-handling
 */

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { memo, useCallback, useMemo } from "react";
import type { EmailProviderType } from "../types";
import { useEmailAccountContext } from "./EmailAccountProvider";

// Authentication styling constants
const AUTH_STYLES = {
  button: {
    primary:
      "w-full h-6 rounded-md bg-white text-black text-[10px] font-medium hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 flex items-center justify-center",
    secondary:
      "w-full h-6 rounded-md border border-[--node-email-border] bg-transparent text-[--node-email-text] text-[10px] font-medium hover:bg-[--node-email-bg-hover] disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 flex items-center justify-center",
  },
  fieldGroup: "space-y-1",
  inlineGroup: "grid grid-cols-2 gap-2",
  label: "text-[--node-email-text] text-[8px] font-medium mb-0 block",
  input:
    "h-6 text-[10px] border border-[--node-email-border] bg-[--node-email-bg] text-[--node-email-text] rounded-md px-2 focus:ring-1 focus:ring-[--node-email-border-hover] focus:border-[--node-email-border-hover] disabled:opacity-50 disabled:cursor-not-allowed placeholder:text-[--node-email-text-secondary] placeholder:text-[10px] transition-all duration-200",
  checkbox: "mr-1.5 text-[--node-email-text] scale-75",
  divider: "h-px bg-[--node-email-border] my-3",
} as const;

interface EmailAccountAuthProps {
  nodeData: any; // Using any for now to avoid type conflicts
  updateNodeData: (data: any) => void;
  isEnabled: boolean;
}

export const EmailAccountAuth = memo(
  ({ nodeData, updateNodeData, isEnabled }: EmailAccountAuthProps) => {
    const {
      isAuthenticating,
      handleOAuth2Auth,
      handleResetAuth,
      handleManualSave,
    } = useEmailAccountContext();

    const {
      provider,
      email,
      displayName,
      isAuthenticating: localIsAuthenticating,
      // Manual config fields
      imapHost,
      imapPort,
      smtpHost,
      smtpPort,
      username,
      password,
      useSSL,
      useTLS,
    } = nodeData;

    // Provider information
    const currentProvider = useMemo(() => {
      const providers = {
        gmail: { id: "gmail", name: "Gmail", authType: "oauth2" },
        outlook: { id: "outlook", name: "Outlook", authType: "oauth2" },
        yahoo: { id: "yahoo", name: "Yahoo", authType: "oauth2" },
        imap: { id: "imap", name: "IMAP", authType: "manual" },
        smtp: { id: "smtp", name: "SMTP", authType: "manual" },
      };
      return providers[provider as keyof typeof providers];
    }, [provider]);

    const isOAuth2Provider = currentProvider?.authType === "oauth2";
    const isManualProvider = currentProvider?.authType === "manual";

    /** Handle OAuth2 authentication */
    const handleOAuth2Click = useCallback(() => {
      if (isOAuth2Provider && email) {
        handleOAuth2Auth(provider as EmailProviderType);
      }
    }, [isOAuth2Provider, email, provider, handleOAuth2Auth]);

    /** Handle manual field changes */
    const handleManualFieldChange = useCallback(
      (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
        let value: string | number | boolean;

        if (e.target.type === "checkbox") {
          value = e.target.checked;
        } else if (field === "smtpPort" || field === "imapPort") {
          // Number-safe validation for port fields, basically ensures only valid port numbers
          const portValue = e.target.value.replace(/[^0-9]/g, ""); // Remove non-numeric characters
          const portNumber = parseInt(portValue, 10);

          if (portValue === "" || (portNumber >= 1 && portNumber <= 65535)) {
            value = portValue === "" ? "" : portNumber;
          } else {
            // Invalid port number, keep previous value
            return;
          }
        } else {
          value = e.target.value;
        }

        updateNodeData({ [field]: value });
      },
      [updateNodeData]
    );

    /** Handle manual configuration save */
    const handleManualSaveClick = useCallback(() => {
      if (!isManualProvider) return;

      const config = {
        provider,
        email,
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
          secure: useSSL,
          username,
          password,
        },
      };

      handleManualSave(config);
    }, [
      isManualProvider,
      provider,
      email,
      displayName,
      imapHost,
      imapPort,
      smtpHost,
      smtpPort,
      useSSL,
      username,
      password,
      handleManualSave,
    ]);

    return (
      <div className="space-y-3">
        {/* OAuth2 Authentication */}
        {isOAuth2Provider && (
          <div className="pt-2 space-y-2">
            <button
              onClick={handleOAuth2Click}
              disabled={!isEnabled || isAuthenticating || !email}
              className={AUTH_STYLES.button.primary}
              type="button"
            >
              {isAuthenticating
                ? "Signing in... (30s timeout)"
                : `Sign in with ${currentProvider?.name}`}
            </button>

            {/* Reset button for stuck state */}
            {isAuthenticating && (
              <button
                onClick={handleResetAuth}
                className={AUTH_STYLES.button.secondary}
                type="button"
              >
                Cancel & Reset
              </button>
            )}
          </div>
        )}

        {/* Manual Configuration */}
        {isManualProvider && (
          <div className="space-y-1 mt-2 pt-1 border-t border-black/20">
            <div className="text-[11px] font-medium text-[--node-email-text-secondary] mb-1">
              Advanced Settings
            </div>

            {/* Server Configuration */}
            {provider === "imap" && (
              <div className={AUTH_STYLES.inlineGroup}>
                <div className={AUTH_STYLES.fieldGroup}>
                  <label className={AUTH_STYLES.label}>IMAP Server</label>
                  <Input
                    type="text"
                    value={imapHost}
                    onChange={handleManualFieldChange("imapHost")}
                    placeholder="x.y.com"
                    className={AUTH_STYLES.input}
                    disabled={!isEnabled}
                  />
                </div>
                <div className={AUTH_STYLES.fieldGroup}>
                  <label className={AUTH_STYLES.label}>Port</label>
                  <Input
                    value={imapPort}
                    onChange={handleManualFieldChange("imapPort")}
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
                    type="text"
                    value={smtpHost}
                    onChange={handleManualFieldChange("smtpHost")}
                    placeholder="x.y.com"
                    className={AUTH_STYLES.input}
                    disabled={!isEnabled}
                  />
                </div>
                <div className={AUTH_STYLES.fieldGroup}>
                  <label className={AUTH_STYLES.label}>Port</label>
                  <Input
                    value={smtpPort}
                    onChange={handleManualFieldChange("smtpPort")}
                    placeholder="587"
                    className={AUTH_STYLES.input}
                    disabled={!isEnabled}
                  />
                </div>
              </div>
            )}

            {/* Credentials */}
            <div className={AUTH_STYLES.inlineGroup}>
              <div className={AUTH_STYLES.fieldGroup}>
                {/* <label className={AUTH_STYLES.label}>Username</label> */}
                <Input
                  type="text"
                  value={username}
                  onChange={handleManualFieldChange("username")}
                  placeholder="Username"
                  className={AUTH_STYLES.input}
                  disabled={!isEnabled}
                />
              </div>
              <div className={AUTH_STYLES.fieldGroup}>
                {/* <label className={AUTH_STYLES.label}>Password</label> */}
                <Input
                  type="password"
                  value={password}
                  onChange={handleManualFieldChange("password")}
                  placeholder="Password"
                  className={AUTH_STYLES.input}
                  disabled={!isEnabled}
                />
              </div>
            </div>

            {/* Security Options */}
            <div className="flex items-center pt-2">
              <label className="flex items-center text-[11px] text-[--node-email-text]">
                <input
                  type="checkbox"
                  checked={provider === "imap" ? useSSL : useTLS}
                  onChange={handleManualFieldChange(
                    provider === "imap" ? "useSSL" : "useTLS"
                  )}
                  className="mr-2"
                  disabled={!isEnabled}
                />
                Use {provider === "imap" ? "SSL" : "TLS"} encryption
              </label>
            </div>

            <Button
              onClick={handleManualSaveClick}
              disabled={!(isEnabled && email && username && password)}
              variant="outline"
              className="w-full p-0 mt-0 text-xs"
              size="xm"
              type="button"
            >
              Save Settings
            </Button>
          </div>
        )}
      </div>
    );
  }
);

EmailAccountAuth.displayName = "EmailAccountAuth";
