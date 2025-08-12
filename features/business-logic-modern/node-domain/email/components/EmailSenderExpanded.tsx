"use client";
/**
 * Route: features/business-logic-modern/node-domain/email/components/EmailSenderExpanded.tsx
 * EMAIL SENDER – Minimalist expanded view using modern design patterns
 *
 * • Clean, focused interface for email sending with advanced features
 * • Integrates EmailComposer-style design patterns
 * • Tab-based interface for organization and settings
 * • Maintains compatibility with existing node architecture
 *
 * Keywords: email-sender, expanded, minimalist, clean-design
 */

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Send, Plus, X, Clock, Palette, AlertCircle, Upload, FileText, RotateCcw } from "lucide-react";
import { useState, useCallback, memo, useEffect } from "react";
import { z } from "zod";
import { useNodeToast } from "@/hooks/useNodeToast";
import RenderStatusDot from "@/components/RenderStatusDot";
import type { EmailSenderData } from "../emailSender.node";

// ─────────────────────────────────────────────────────────────────────────────
// VALIDATION SCHEMAS - Email validation using Zod
// ─────────────────────────────────────────────────────────────────────────────

const emailSchema = z.string().email({ message: "Please enter a valid email address" });

const validateEmail = (email: string): { isValid: boolean; error?: string } => {
  const result = emailSchema.safeParse(email);
  return {
    isValid: result.success,
    error: result.success ? undefined : result.error.errors[0]?.message,
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS - Clean, minimal styling tokens
// ─────────────────────────────────────────────────────────────────────────────

const SENDER_STYLES = {
  container: "flex flex-col bg-background border border-border rounded-lg p-0 ",
  header: "pl-2",
  content: "flex-1 flex flex-col min-h-0 border-border p-2 ",
  footer: "p-3 border-t border-border bg-muted/30",
} as const;

const INPUT_STYLES = {
  field: "text-xs",
  label: "text-[10px] text-muted-foreground flex items-center",
  input: "h-6 text-[10px]",
  textarea: "text-[10px] resize-none",
  select: "h-6 text-[10px] w-full break-all p-2 ",
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// RECIPIENT CHIP - Clean email badge component
// ─────────────────────────────────────────────────────────────────────────────

interface RecipientChipProps {
  email: string;
  onRemove: () => void;
  variant?: "to" | "cc" | "bcc";
}

const RecipientChip = memo(function RecipientChip({
  email,
  onRemove,
  variant = "to",
}: RecipientChipProps) {
  const variantStyles = {
    to: "bg-muted/80 text-foreground border-muted text-[10px] mt-0.5",
    cc: "bg-muted/80 text-foreground border-muted text-[10px] mt-0.5",
    bcc: "bg-muted/80 text-foreground border-muted text-[10px] mt-0.5",
  };

  return (
    <div
      className={`inline-flex items-center gap-1 h-5 px-2 rounded-full border ${variantStyles[variant]} hover:bg-muted`}
    >
      <span className="truncate max-w-32">{email}</span>
      <X
        className="h-3 w-3 cursor-pointer hover:bg-muted-foreground/20 rounded-full p-0.5"
        onClick={onRemove}
      />
    </div>
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// RECIPIENT INPUT - Inline email input with chip display
// ─────────────────────────────────────────────────────────────────────────────

interface RecipientInputProps {
  type: "to" | "cc" | "bcc";
  label: string;
  emails: string[];
  onChange: (emails: string[]) => void;
  placeholder?: string;
  recipients: { to: string[]; cc: string[]; bcc: string[] };
  onRecipientsChange: (type: "to" | "cc" | "bcc", recipients: string[]) => void;
  nodeId: string;
  showCC?: boolean;
  showBCC?: boolean;
  setShowCC?: (show: boolean) => void;
  setShowBCC?: (show: boolean) => void;
}

const RecipientInput = memo(function RecipientInput({
  type,
  label,
  emails,
  onChange,
  placeholder,
  recipients,
  onRecipientsChange,
  nodeId,
  showCC,
  showBCC,
  setShowCC,
  setShowBCC,
}: RecipientInputProps) {
  const [inputValue, setInputValue] = useState("");
  const { showError } = useNodeToast(nodeId);

  const addEmail = useCallback(
    (email: string) => {
      const trimmed = email.trim();
      if (!trimmed) return;

      // Validate email format, basically check if it's a proper email
      const validation = validateEmail(trimmed);
      if (!validation.isValid) {
        showError("Invalid Email", validation.error || "Please enter a valid email address");
        return;
      }

      // Check for duplicates, basically ensure no duplicate emails
      if (emails.includes(trimmed)) {
        showError("Duplicate Email", "This email address has already been added");
        return;
      }

      // Add valid email, basically success path
      onChange([...emails, trimmed]);
      setInputValue("");
    },
    [emails, onChange, showError]
  );

  const removeEmail = useCallback(
    (index: number) => {
      onChange(emails.filter((_, i) => i !== index));
    },
    [emails, onChange]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === ",") {
        e.preventDefault();
        addEmail(inputValue);
      }
    },
    [inputValue, addEmail]
  );

  const handleBlur = useCallback(() => {
    if (inputValue.trim()) {
      addEmail(inputValue);
    }
  }, [inputValue, addEmail]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  }, []);

  const handlePaste = useCallback((e: React.ClipboardEvent<HTMLInputElement>) => {
    const pastedText = e.clipboardData.getData("text");

    // Extract emails anywhere in the text (supports: Name <email@x.com>, CSV, semicolons, newlines)
    const emailRegex = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
    const matches = pastedText.match(emailRegex) || [];

    if (matches.length > 0) {
      // Prevent default only when we're handling the paste ourselves
      e.preventDefault();

      // Deduplicate and add valid emails
      const uniqueEmails = Array.from(new Set(matches.map((m) => m.trim())));
      uniqueEmails.forEach((email) => {
        if (!emails.includes(email)) {
          const validation = validateEmail(email);
          if (validation.isValid) {
            addEmail(email);
          }
        }
      });

      // Clear input after we add chips, basically reset for next input
      setInputValue("");
    }
    // If no emails were detected, let the browser perform a normal paste so the user can continue typing
  }, [emails, addEmail]);

  return (
    <div className="flex min-h-6 border rounded-md border-border px-2  ">
      <Label className="text-[10px] self-start pt-1 text-muted-foreground w-8 flex items-center ">{label}</Label>
      <div className="flex flex-wrap items-center flex-1 min-w-0 ">
        {emails.map((email, index) => (
          <RecipientChip
            key={`${email}-${index}`}
            email={email}
            onRemove={() => removeEmail(index)}
            variant={type}
          />
        ))}
        <Input
          variant="node"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          onPaste={handlePaste}
          placeholder={emails.length === 0 ? placeholder : ""}
          className="border-0 shadow-none bg-transparent p-0 h-6 text-[10px] min-w-32 flex-1 focus-visible:ring-0"
        />
      </div>
      {/* CC/BCC Toggle - Only show on "To" field */}
      {type === "to" && (
        <div className="flex flex-row gap-1 ml-2 self-end h-6  items-center">
          <Button
            variant="ghost"
            size="sm"
            className={`p-0 text-[10px] text-muted-foreground  hover:text-foreground hover:bg-transparent hover:underline ${showCC ? 'text-foreground' : ''}`}
            onClick={() => {
              const newShowCC = !showCC;
              setShowCC?.(newShowCC);
              if (!newShowCC) {
                onRecipientsChange("cc", []);
              }
            }}
          >
            Cc
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={`p-0 text-[10px] text-muted-foreground hover:text-foreground hover:bg-transparent hover:underline ${showBCC ? 'text-foreground' : ''}`}
            onClick={() => {
              const newShowBCC = !showBCC;
              setShowBCC?.(newShowBCC);
              if (!newShowBCC) {
                onRecipientsChange("bcc", []);
              }
            }}
          >
            Bcc
          </Button>
        </div>
      )}
    </div>
  );
});

type AvailableAccount = {
  value: string;
  label: string;
  provider: string;
  email: string;
  isActive: boolean;
  isConnected: boolean;
  lastValidated?: number;
};

type AttachmentType = {
  id: string;
  filename: string;
  size: number;
  mimeType: string;
  content?: string;
  file?: any;
};

export interface EmailSenderExpandedProps {
  nodeId: string;
  nodeData: EmailSenderData;
  isEnabled: boolean;
  sendingStatus: EmailSenderData["sendingStatus"];
  availableAccounts: AvailableAccount[];
  selectedAccount?: AvailableAccount;
  accountErrors: string[];
  onAccountChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onSubjectChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRecipientsChange: (
    field: "to" | "cc" | "bcc"
  ) => (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onContentChange: (
    field: "text" | "html"
  ) => (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onCheckboxChange: (
    field: string
  ) => (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFileAttachment: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveAttachment: (attachmentId: string) => void;
  onNumberChange: (
    field: string,
    min: number,
    max: number
  ) => (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSendModeChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onSendEmail: () => void;
  onRefreshAccount?: () => void;
}

export const EmailSenderExpanded = React.memo(
  function EmailSenderExpanded(props: EmailSenderExpandedProps) {
    const {
      nodeId,
      nodeData,
      isEnabled,
      sendingStatus,
      availableAccounts,
      selectedAccount,
      accountErrors,
      onAccountChange,
      onSubjectChange,
      onRecipientsChange,
      onContentChange,
      onCheckboxChange,
      onFileAttachment,
      onRemoveAttachment,
      onNumberChange,
      onSendModeChange,
      onSendEmail,
      onRefreshAccount,
    } = props;

    // Initialize node toast system for errors and warnings, basically modal notifications
    const { showError, showWarning, showInfo } = useNodeToast(nodeId);

    const {
      accountId,
      recipients,
      subject,
      content,
      attachments,
      maxAttachmentSize,
      sendMode,
      batchSize,
      delayBetweenSends,
      trackDelivery,
      trackReads,
      trackClicks,
      retryAttempts,
      continueOnError,
      sentCount,
      failedCount,
      lastError,
    } = nodeData;

    // Provide safe defaults for critical objects that might be undefined
    const safeRecipients = recipients || { to: [], cc: [], bcc: [] };
    const safeContent = content || {
      text: "",
      html: "",
      useHtml: false,
      useTemplate: false,
      templateId: "",
      variables: {},
    };
    const safeAttachments = (attachments || []) as AttachmentType[];
    const safeSubject = subject || "";

    // Memoize heavy/derived UI values to avoid recalculation during drags
    const accountOptions = React.useMemo(() => {
      return availableAccounts.map((account) => (
        <option
          key={account.value}
          value={account.value}
          disabled={!account.isActive}
        >
          {account.email}
        </option>
      ));
    }, [availableAccounts]);

    // State for UI management
    const [activeTab, setActiveTab] = useState("compose");
    const [showCC, setShowCC] = useState(safeRecipients.cc.length > 0);
    const [showBCC, setShowBCC] = useState(safeRecipients.bcc.length > 0);

    // Determine send button state
    const isSending = sendingStatus === "sending" || sendingStatus === "composing";
    const hasError = sendingStatus === "error";
    const hasRecipients = safeRecipients.to.length > 0;
    const hasContent = safeSubject.trim().length > 0 || safeContent.text.trim().length > 0;
    const hasAccount = accountId && selectedAccount?.isConnected;

    const sendButtonText = isSending
      ? sendingStatus === "composing"
        ? "Composing..."
        : "Sending..."
      : "Email";

    // Removed account error toasts – UI will show placeholder instead when no selection

    // Removed warning toasts for no accounts, basically rely on the UI state instead

    // Show info when sending status changes, basically provide feedback
    useEffect(() => {
      if (sendingStatus === "composing") {
        showInfo("Composing Email", "Preparing email for delivery...");
      } else if (sendingStatus === "sending") {
        showInfo("Sending Email", "Email is being sent...");
      } else if (sendingStatus === "sent") {
        showInfo("Email Sent", "Email has been delivered successfully");
      }
    }, [sendingStatus, showInfo]);

    // Show error modal for last errors, basically display sending failures
    useEffect(() => {
      if (lastError && sendingStatus === "error") {
        showError("Email Sending Failed", lastError);
      }
    }, [lastError, sendingStatus, showError]);

    /**
     * retryAttemptsInput – local UI state for numeric input
     * [Explanation], basically allow empty string while editing without forcing defaults
     */
    const [retryAttemptsInput, setRetryAttemptsInput] = useState<string>(() =>
      typeof retryAttempts === "number" ? String(retryAttempts) : ""
    );

    // Keep local input in sync with node data when it changes externally
    useEffect(() => {
      const next =
        typeof retryAttempts === "number" ? String(retryAttempts) : "";
      setRetryAttemptsInput(next);
    }, [retryAttempts]);

    /**
     * Handle retry attempts typing
     * [Explanation], basically restrict to digits and allow empty while editing
     */
    const handleRetryAttemptsInputChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const next = e.target.value;
        if (next === "" || /^\d+$/.test(next)) {
          setRetryAttemptsInput(next);
          // Propagate valid numeric edits immediately
          if (next !== "") {
            const syntheticEvent = {
              target: { value: next },
            } as React.ChangeEvent<HTMLInputElement>;
            onNumberChange("retryAttempts", 0, 5)(syntheticEvent);
          }
        }
      },
      [onNumberChange]
    );

    /**
     * Commit on blur
     * [Explanation], basically clamp and save if not empty; keep empty if cleared
     */
    const handleRetryAttemptsBlur = useCallback(() => {
      if (retryAttemptsInput === "") {
        return;
      }
      const syntheticEvent = {
        target: { value: retryAttemptsInput },
      } as React.ChangeEvent<HTMLInputElement>;
      onNumberChange("retryAttempts", 0, 5)(syntheticEvent);
    }, [retryAttemptsInput, onNumberChange]);

    // Helper function to convert textarea change to recipient array change
    const handleRecipientsChangeForInput = useCallback(
      (type: "to" | "cc" | "bcc") => (emails: string[]) => {
        // Create synthetic event to match existing interface, basically maintain compatibility
        const syntheticEvent = {
          target: { value: emails.join(", ") },
        } as React.ChangeEvent<HTMLTextAreaElement>;
        onRecipientsChange(type)(syntheticEvent);
      },
      [onRecipientsChange]
    );

    return (
      <div
        className={` ${SENDER_STYLES.container} ${isEnabled ? "" : "opacity-75"}`}
      >
        {/* Content Area */}
        <div className={`${SENDER_STYLES.content} max-h-[234px] overflow-y-auto nowheel rounded-lg`}>
          <Tabs variant="node" value={activeTab} onValueChange={setActiveTab} className=" flex flex-col  rounded-lg">
            <div className="flex items-center justify-between mt-2">
              <TabsList variant="node">
                <TabsTrigger variant="node" value="compose">
                  Compose
                </TabsTrigger>
                <TabsTrigger variant="node" value="settings">
                  Settings
                </TabsTrigger>
              </TabsList>

              {/* Header with Send Button */}
              <div className={SENDER_STYLES.header}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {sentCount > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {sentCount} sent
                      </Badge>
                    )}
                    {failedCount > 0 && (
                      <Badge variant="destructive" className="text-xs">
                        {failedCount} failed
                      </Badge>
                    )}
                  </div>
                  <Button
                    onClick={onSendEmail}
                    disabled={!isEnabled || isSending || !hasRecipients || !hasContent || !hasAccount}
                    variant="node"
                    size="node"
                  >
                    <Send className="h-3 w-3 mr-1" />
                    {sendButtonText}
                  </Button>
                </div>
              </div>
            </div>

            <TabsContent variant="node" value="compose" className="flex-1">
              {/* Account Selection */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label className={INPUT_STYLES.label}>
                    <span className="inline-flex items-center gap-1">
                      Email Account
                      {onRefreshAccount && (
                        <Button
                          onClick={onRefreshAccount}
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0 hover:bg-transparent"
                          disabled={isSending}
                        >
                          <RotateCcw className="h-3 w-3" />
                        </Button>
                      )}
                    </span>
                  </Label>
                  <RenderStatusDot
                    eventActive={sendingStatus === "sent"}
                    isProcessing={sendingStatus === "sending"}
                    hasError={sendingStatus === "error" || accountErrors.length > 0}
                    enableGlow
                    size="sm"
                    titleText={sendingStatus}
                  />
                </div>
                <Select
                  value={accountId || ""}
                  onValueChange={(value) => {
                    const syntheticEvent = {
                      target: { value },
                    } as React.ChangeEvent<HTMLSelectElement>;
                    onAccountChange(syntheticEvent);
                  }}
                  disabled={!isEnabled || isSending}
                >
                  <SelectTrigger className={INPUT_STYLES.select}>
                    <SelectValue placeholder="No account selected" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableAccounts.map((account) => (
                      <SelectItem
                        key={account.value}
                        value={account.value}
                        disabled={!account.isActive}
                      >
                        {account.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>




              </div>

              <Separator className="mb-1" />

              {/* To Recipients */}
              <div className="space-y-0">
                <RecipientInput
                  type="to"
                  label="To"
                  emails={safeRecipients.to}
                  onChange={handleRecipientsChangeForInput("to")}
                  placeholder="Enter recipient email..."
                  recipients={safeRecipients}
                  onRecipientsChange={(type, emails) => handleRecipientsChangeForInput(type)(emails)}
                  nodeId={nodeId}
                  showCC={showCC}
                  showBCC={showBCC}
                  setShowCC={setShowCC}
                  setShowBCC={setShowBCC}
                />

                {showCC && (
                  <RecipientInput
                    type="cc"
                    label="Cc"
                    emails={safeRecipients.cc}
                    onChange={handleRecipientsChangeForInput("cc")}
                    placeholder="Cc recipients..."
                    recipients={safeRecipients}
                    onRecipientsChange={(type, emails) => handleRecipientsChangeForInput(type)(emails)}
                    nodeId={nodeId}
                  />
                )}
                
                {showBCC && (
                  <RecipientInput
                    type="bcc"
                    label="Bcc"
                    emails={safeRecipients.bcc}
                    onChange={handleRecipientsChangeForInput("bcc")}
                    placeholder="Bcc recipients..."
                    recipients={safeRecipients}
                    onRecipientsChange={(type, emails) => handleRecipientsChangeForInput(type)(emails)}
                    nodeId={nodeId}
                  />
                )}
              </div>

              <Separator className="mb-1" />

              {/* Subject */}
              <div className="space-y-1">
                <div className="border border-border rounded-md flex flex-row items-center">
                  <Input
                    variant="node"
                    value={safeSubject}
                    onChange={onSubjectChange}
                    placeholder="Subject"
                    className={INPUT_STYLES.input}
                    disabled={!isEnabled || isSending}
                  />
                </div>
              </div>

              <Separator className="mb-1" />

              {/* Message Content */}
              <div className="space-y-1 flex-1 flex flex-col">

                <textarea
                  value={safeContent.text}
                  onChange={onContentChange("text")}
                  placeholder="Enter your message here..."
                  className={`${INPUT_STYLES.textarea} w-full min-h-[70px] border border-border rounded-md px-2 py-1`}
                  disabled={!isEnabled || isSending}
                />
              </div>
            </TabsContent>

            <TabsContent variant="node" value="settings" className=" m-0">
              {/* Attachments */}
              <div className="">
                <Label className={INPUT_STYLES.label}>Attachments</Label>

                {/* File Input */}
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    multiple={true}
                    onChange={onFileAttachment}
                    className="hidden"
                    id="file-input"
                    disabled={!isEnabled || isSending}
                    accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif,.zip,.rar"
                  />
                  <Button
                    variant="outline"
                    size="node"
                    asChild
                    disabled={!isEnabled || isSending}
                  >
                    <label htmlFor="file-input" className="cursor-pointer">
                      <Upload className="h-3 w-3 mr-1" />
                      Add Files
                    </label>
                  </Button>
                  <span className="text-[10px] text-muted-foreground">
                    Max: {Math.round(maxAttachmentSize / 1024 / 1024)}MB per file
                  </span>
                </div>

                {/* Attachments List */}
                {safeAttachments.length > 0 && (
                  <div className="space-y-1 max-h-16 overflow-y-auto">
                    {safeAttachments.map((attachment) => (
                      <div
                        key={attachment.id}
                        className="flex items-center justify-between p-2 bg-muted/30 rounded text-[10px]"
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <FileText className="h-3 w-3 text-blue-600" />
                          <span className="truncate font-medium">
                            {attachment.filename}
                          </span>
                          <span className="text-muted-foreground flex-shrink-0">
                            ({Math.round(attachment.size / 1024)}KB)
                          </span>
                        </div>
                        <Button
                          onClick={() => onRemoveAttachment(attachment.id)}
                          variant="ghost"
                          size="node"
                          className="text-red-500 hover:text-red-700 ml-2 flex-shrink-0"
                          disabled={!isEnabled || isSending}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Attachments Summary */}
                {safeAttachments.length > 0 && (
                  <div className="text-[10px] text-muted-foreground">
                    {safeAttachments.length} file(s) • Total:{" "}
                    {Math.round(
                      safeAttachments.reduce((sum, att) => sum + att.size, 0) / 1024
                    )}
                    KB
                  </div>
                )}
              </div>

              <Separator className="mb-2" />

              {/* Send Mode */}
              <div className="">
                <Label className={INPUT_STYLES.label}>Send Mode</Label>
                <Select
                  value={sendMode || "immediate"}
                  onValueChange={(value) => {
                    const syntheticEvent = {
                      target: { value },
                    } as React.ChangeEvent<HTMLSelectElement>;
                    onSendModeChange(syntheticEvent);
                  }}
                  disabled={!isEnabled || isSending}
                >
                  <SelectTrigger className={INPUT_STYLES.select}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="immediate">Immediate</SelectItem>
                    <SelectItem value="batch">Batch</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              

              <Separator className="mb-2" />
              {/* Batch Options */}
              {sendMode === "batch" && (
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Label className={`${INPUT_STYLES.label} cursor-help`}>
                          Batch Size
                        </Label>
                      </TooltipTrigger>
                      <TooltipContent sideOffset={6} className="text-[10px]">
                        Number of emails to send in each batch, basically the chunk size.
                      </TooltipContent>
                    </Tooltip>
                    <Input
                      variant="node"
                      type="number"
                      value={batchSize || 10}
                      onChange={onNumberChange("batchSize", 1, 100)}
                      min="1"
                      max="100"
                      className={INPUT_STYLES.input}
                      disabled={!isEnabled || isSending}
                    />
                  </div>
                  <div className="space-y-1">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Label className={`${INPUT_STYLES.label} cursor-help`}>
                          Delay (ms)
                        </Label>
                      </TooltipTrigger>
                      <TooltipContent sideOffset={6} className="text-[10px]">
                        Delay between batches in milliseconds, basically the wait time.
                      </TooltipContent>
                    </Tooltip>
                    <Input
                      variant="node"
                      type="number"
                      value={delayBetweenSends || 0}
                      onChange={onNumberChange("delayBetweenSends", 0, 60000)}
                      min="0"
                      max="60000"
                      className={INPUT_STYLES.input}
                      disabled={!isEnabled || isSending}
                    />
                  </div>
                </div>
              )}

            <Separator className="mb-0" />

              {/* Tracking Options */}
              <div className="">
                <Label className={INPUT_STYLES.label}>Tracking Options</Label>
                <div className="flex flex-col gap-1">
                  <label className="flex items-center gap-2 text-[10px]">
                    <input
                      type="checkbox"
                      checked={!!trackDelivery}
                      onChange={onCheckboxChange("trackDelivery")}
                      className="mr-2"
                      disabled={!isEnabled || isSending}
                    />
                    Track Delivery
                  </label>
                  <label className="flex items-center gap-2 text-[10px]">
                    <input
                      type="checkbox"
                      checked={!!trackReads}
                      onChange={onCheckboxChange("trackReads")}
                      className="mr-2"
                      disabled={!isEnabled || isSending}
                    />
                    Track Reads
                  </label>
                  <label className="flex items-center gap-2 text-[10px]">
                    <input
                      type="checkbox"
                      checked={!!trackClicks}
                      onChange={onCheckboxChange("trackClicks")}
                      className="mr-2"
                      disabled={!isEnabled || isSending}
                    />
                    Track Clicks
                  </label>
                  <label className="flex items-center gap-2 text-[10px]">
                    <input
                      type="checkbox"
                      checked={!!continueOnError}
                      onChange={onCheckboxChange("continueOnError")}
                      className="mr-2"
                      disabled={!isEnabled || isSending}
                    />
                    Continue on Error
                  </label>
                </div>
              </div>

              <Separator className="mb-2" />

              {/* Retry Settings */}
              <div className="">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Label className={`${INPUT_STYLES.label} cursor-help`}>
                      Retry Attempts
                    </Label>
                  </TooltipTrigger>
                  <TooltipContent sideOffset={6} className="text-[10px]">
                    Number of retry attempts on failure, basically the resilience setting.
                  </TooltipContent>
                </Tooltip>
                <Input
                  variant="node"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={retryAttemptsInput}
                  onChange={handleRetryAttemptsInputChange}
                  onBlur={handleRetryAttemptsBlur}
                  onWheel={(e) => e.currentTarget.blur()}
                  min="0"
                  max="5"
                  className={INPUT_STYLES.input}
                  disabled={!isEnabled || isSending}
                />
              </div>

              {/* Status Information */}
              <div className="rounded-md border border-border bg-muted/30 p-2 text-[10px] space-y-1">
                <div>
                  <span>Sent:</span> {sentCount}{" "}
                  <span>| Failed:</span> {failedCount}
                </div>
                <div>
                  Recipients:{" "}
                  {safeRecipients.to.length +
                    safeRecipients.cc.length +
                    safeRecipients.bcc.length}
                </div>
                <div>
                  Attachments: {safeAttachments.length}
                  {safeAttachments.length > 0 && (
                    <span className="ml-1">
                      (
                      {Math.round(
                        safeAttachments.reduce((sum, att) => sum + att.size, 0) / 1024
                      )}
                      KB)
                    </span>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>


      </div>
    );
  },
  // Memoization comparison for performance
  (prev, next) => {
    // Compare primitive props
    if (
      prev.isEnabled !== next.isEnabled ||
      prev.sendingStatus !== next.sendingStatus
    ) {
      return false;
    }
    // Shallow compare available accounts by id + length
    const a = prev.availableAccounts;
    const b = next.availableAccounts;
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (a[i].value !== b[i].value || a[i].isConnected !== b[i].isConnected) {
        return false;
      }
    }
    // Compare frequently edited fields (recipients + content) and core fields
    const prevData: any = prev.nodeData as any;
    const nextData: any = next.nodeData as any;
    const recipientsChanged = ["to", "cc", "bcc"].some((field) => {
      const p = Array.isArray(prevData?.recipients?.[field])
        ? prevData.recipients[field].join(",")
        : "";
      const n = Array.isArray(nextData?.recipients?.[field])
        ? nextData.recipients[field].join(",")
        : "";
      return p !== n;
    });
    if (recipientsChanged) return false;
    if (
      (prevData?.content?.text || "") !== (nextData?.content?.text || "") ||
      (prevData?.content?.html || "") !== (nextData?.content?.html || "") ||
      Boolean(prevData?.content?.useHtml) !==
        Boolean(nextData?.content?.useHtml)
    ) {
      return false;
    }
    const keys: (keyof EmailSenderData)[] = [
      "accountId",
      "subject",
      "sentCount",
      "failedCount",
      "lastError",
      "sendMode",
      "batchSize",
      "delayBetweenSends",
      "trackDelivery",
      "trackReads",
      "trackClicks",
      "retryAttempts",
      "continueOnError",
    ];
    for (const k of keys) {
      if (prevData[k] !== nextData[k]) return false;
    }
    return true;
  }
);

export default EmailSenderExpanded;
