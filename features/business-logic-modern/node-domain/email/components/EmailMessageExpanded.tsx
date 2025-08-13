"use client";
/**
 * Route: features/business-logic-modern/node-domain/email/components/EmailMessageExpanded.tsx
 * EMAIL MESSAGE – Minimalist expanded view using reusable EmailComposer
 *
 * • Clean, focused interface for email composition
 * • Integrates with new EmailComposer component
 * • Simplified prop handling and state management
 * • Maintains compatibility with existing node architecture
 *
 * Keywords: email-message, expanded, minimalist, clean-design
 */

import * as React from "react";
import type { EmailMessageData } from "../emailMessage.node";
import { EmailComposer } from "./EmailComposer";

// Minimalist container styles
const EXPANDED_STYLES = {
  container: "w-full h-full",
  disabled: "opacity-75 pointer-events-none",
} as const;

export interface EmailMessageExpandedProps {
  nodeId: string;
  nodeData: EmailMessageData;
  isEnabled: boolean;
  connectionStatus: EmailMessageData["connectionStatus"];
  /** Whether the current configuration is valid for sending */
  canSend?: boolean;
  onMessageContentChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSubjectChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onPriorityChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onRecipientsChange: (type: "to" | "cc" | "bcc", recipients: string[]) => void;
  onComposeMessage: () => void;
}

export const EmailMessageExpanded = React.memo(
  function EmailMessageExpanded(props: EmailMessageExpandedProps) {
    const {
      nodeId,
      nodeData,
      isEnabled,
      connectionStatus,
      canSend,
      onMessageContentChange,
      onSubjectChange,
      onPriorityChange,
      onRecipientsChange,
      onComposeMessage,
    } = props;

    // Wrapper for priority change to match string signature
    const handlePriorityChange = React.useCallback(
      (priority: string) => {
        onPriorityChange({
          target: { value: priority },
        } as React.ChangeEvent<HTMLSelectElement>);
      },
      [onPriorityChange]
    );

    return (
      <div
        className={`${EXPANDED_STYLES.container} ${isEnabled ? "" : EXPANDED_STYLES.disabled}`}
      >
        <EmailComposer
          nodeId={nodeId}
          nodeData={nodeData}
          isEnabled={isEnabled}
          connectionStatus={connectionStatus}
          canSend={canSend}
          onMessageContentChange={onMessageContentChange}
          onSubjectChange={onSubjectChange}
          onRecipientsChange={onRecipientsChange}
          onPriorityChange={handlePriorityChange}
          onComposeMessage={onComposeMessage}
        />
      </div>
    );
  },
  (prev, next) => {
    // Compare primitive props
    if (
      prev.isEnabled !== next.isEnabled ||
      prev.connectionStatus !== next.connectionStatus ||
      prev.canSend !== next.canSend
    ) {
      return false;
    }

    // Compare essential nodeData fields for composer
    const keys: (keyof EmailMessageData)[] = [
      "messageContent",
      "subject",
      "priority",
      "recipients",
      "sentCount",
      "lastError",
    ];
    for (const k of keys) {
      if ((prev.nodeData as any)[k] !== (next.nodeData as any)[k]) return false;
    }
    return true;
  }
);

export default EmailMessageExpanded;
