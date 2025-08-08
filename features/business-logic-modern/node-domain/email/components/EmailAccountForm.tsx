/**
 * Route: features/business-logic-modern/node-domain/email/components/EmailAccountForm.tsx
 * EMAIL ACCOUNT FORM - Configuration form for email account setup
 *
 * • Provider selection with icons and labels
 * • Email address and display name inputs
 * • Form validation and state management
 * • Responsive design with proper styling
 *
 * Keywords: form-inputs, provider-selection, validation, responsive-design
 */

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { memo, useCallback, useMemo } from "react";
import { FaMicrosoft, FaYahoo } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import { MdEmail } from "react-icons/md";
import type { EmailProviderType } from "../types";

// Form styling constants
const FORM_STYLES = {
  label: "text-[--node-email-text] text-[10px] font-medium mb-1 block",
  fieldGroup: "space-y-1",
  input:
    "h-6 text-[10px] border border-[--node-email-border] bg-[--node-email-bg] text-[--node-email-text] rounded-md px-2 focus:ring-1 focus:ring-[--node-email-border-hover] focus:border-[--node-email-border-hover] disabled:opacity-50 disabled:cursor-not-allowed placeholder:text-[--node-email-text-secondary] placeholder:text-[10px] transition-all duration-200",
  select:
    "h-6 text-[10px] border border-[--node-email-border] bg-[--node-email-bg] text-[--node-email-text] rounded-md px-2 focus:ring-1 focus:ring-[--node-email-border-hover] focus:border-[--node-email-border-hover] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200",
} as const;

interface EmailAccountFormProps {
  nodeData: any; // Using any for now to avoid type conflicts
  updateNodeData: (data: any) => void;
  isEnabled: boolean;
  isAuthenticating: boolean;
}

export const EmailAccountForm = memo(
  ({
    nodeData,
    updateNodeData,
    isEnabled,
    isAuthenticating,
  }: EmailAccountFormProps) => {
    const { provider, email, displayName, isConnected } = nodeData;

    // Available providers with icons
    const availableProviders = useMemo(() => {
      return [
        { value: "gmail", label: "Gmail", icon: FcGoogle },
        { value: "outlook", label: "Outlook", icon: FaMicrosoft },
        { value: "yahoo", label: "Yahoo", icon: FaYahoo },
        { value: "imap", label: "IMAP", icon: MdEmail },
        { value: "smtp", label: "SMTP", icon: MdEmail },
      ];
    }, []);

    /** Handle provider change */
    const handleProviderChange = useCallback(
      (value: string) => {
        const newProvider = value as EmailProviderType;
        updateNodeData({
          provider: newProvider,
          connectionStatus: "disconnected",
          isConnected: false,
          isConfigured: false,
          lastError: "",
        });
      },
      [updateNodeData]
    );

    /** Handle email change */
    const handleEmailChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        updateNodeData({ email: e.target.value });
      },
      [updateNodeData]
    );

    /** Handle display name change */
    const handleDisplayNameChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        updateNodeData({ displayName: e.target.value });
      },
      [updateNodeData]
    );

    return (
      <div className="space-y-1">
        {/* Provider Selection */}
        <div className={FORM_STYLES.fieldGroup}>
          <label className={FORM_STYLES.label}>Provider</label>
          <Select
            onValueChange={handleProviderChange}
            defaultValue={provider}
            disabled={!isEnabled || isAuthenticating || isConnected}
          >
            <SelectTrigger className={`${FORM_STYLES.select} w-full`}>
              <SelectValue placeholder="Select Provider" />
            </SelectTrigger>
            <SelectContent>
              {availableProviders.map((option) => {
                const IconComponent = option.icon;
                return (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      <IconComponent className="w-3 h-3" />
                      <span>{option.label}</span>
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        {/* Email Address */}
        <div className={FORM_STYLES.fieldGroup}>
          {/* <label className={FORM_STYLES.label}>Email Address</label> */}
          <Input
            type="email"
            value={email}
            onChange={handleEmailChange}
            placeholder="Email"
            className={FORM_STYLES.input}
            disabled={!isEnabled || isAuthenticating || isConnected}
          />
        </div>

        {/* Display Name */}
        <div className={FORM_STYLES.fieldGroup}>
          {/* <label className={FORM_STYLES.label}>Display Name</label> */}
          <Input
            type="text"
            value={displayName}
            onChange={handleDisplayNameChange}
            placeholder="Name"
            className={FORM_STYLES.input}
            disabled={!isEnabled || isAuthenticating}
          />
        </div>
      </div>
    );
  }
);

EmailAccountForm.displayName = "EmailAccountForm";
