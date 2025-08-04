/**
 * Route: features/business-logic-modern/node-domain/email/components/EmailAccountExpanded.tsx
 * EMAIL ACCOUNT EXPANDED VIEW - Full configuration interface for email accounts
 *
 * • Combines form, authentication, and status components
 * • Manages expanded state layout and styling
 * • Handles disabled state and loading conditions
 * • Provides unified interface for all email account operations
 *
 * Keywords: expanded-view, form-layout, component-composition, unified-interface
 */

import { memo } from "react";
import { EmailAccountAuth } from "./EmailAccountAuth";
import { EmailAccountForm } from "./EmailAccountForm";
import { EmailAccountStatus } from "./EmailAccountStatus";
// No import needed for types

// Expanded view styling constants
const EXPANDED_STYLES = {
  container: "p-4 w-full h-full flex flex-col",
  disabled:
    "opacity-75 bg-[--node-email-bg-hover] dark:bg-[--node-email-bg] rounded-md transition-all duration-300",
  content: "flex-1 space-y-1",
} as const;

interface EmailAccountExpandedProps {
  nodeData: any; // Using any for now to avoid type conflicts
  updateNodeData: (data: any) => void;
  isEnabled: boolean;
  isAuthenticating: boolean;
}

export const EmailAccountExpanded = memo(
  ({
    nodeData,
    updateNodeData,
    isEnabled,
    isAuthenticating,
  }: EmailAccountExpandedProps) => {
    return (
      <div
        className={`${EXPANDED_STYLES.container} ${isEnabled ? "" : EXPANDED_STYLES.disabled}`}
      >
        <div className={EXPANDED_STYLES.content}>
          {/* Configuration Form */}
          <EmailAccountForm
            nodeData={nodeData}
            updateNodeData={updateNodeData}
            isEnabled={isEnabled}
            isAuthenticating={isAuthenticating}
          />

          {/* Authentication Section */}
          <EmailAccountAuth
            nodeData={nodeData}
            updateNodeData={updateNodeData}
            isEnabled={isEnabled}
          />

          {/* Status Section */}
          <EmailAccountStatus nodeData={nodeData} isEnabled={isEnabled} />
        </div>
      </div>
    );
  }
);

EmailAccountExpanded.displayName = "EmailAccountExpanded";
