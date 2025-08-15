/**
 * EmailSender COMPONENT – Minimalist, reusable email sending interface
 *
 * • Clean, minimal design following EmailReader best practices
 * • Proper visual hierarchy with clear separation of concerns
 * • Intuitive tab-based interface for composition and settings
 * • Responsive design with consistent spacing and typography
 * • Optimized for fast email composition with keyboard shortcuts
 *
 * Keywords: email-sender, minimalist, reusable, clean-design
 */

"use client";

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
import { Send, Upload, FileText, X, Settings, AlertCircle, RotateCcw } from "lucide-react";
import { useState, useCallback, memo, useRef, useEffect } from "react";
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
// CONSTANTS - Clean, minimal styling tokens matching EmailReader
// ─────────────────────────────────────────────────────────────────────────────

const SENDER_STYLES = {
  container: "flex flex-col h-full bg-background border border-border rounded-lg",
  header: "pl-2",
  content: "flex-1 flex flex-col min-h-0 border-border p-2",
  footer: "p-3 border-t border-border bg-muted/30",
} as const;

const INPUT_STYLES = {
  field: "text-xs",
  label: "text-[10px] text-muted-foreground flex items-center pl-1",
  input: "h-6 text-[10px]",
  textarea: "text-[10px] resize-none",
  select: "h-6 text-[10px]",
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
  nodeId: string;
  showCC?: boolean;
  showBCC?: boolean;
  setShowCC?: (show: boolean) => void;
  setShowBCC?: (show: boolean) => void;
  disabled?: boolean;
}

const RecipientInput = memo(function RecipientInput({
  type,
  label,
  emails,
  onChange,
  placeholder,
  nodeId,
  showCC,
  showBCC,
  setShowCC,
  setShowBCC,
  disabled = false,
}: RecipientInputProps) {
  const [inputValue, setInputValue] = useState("");
  const { showError } = useNodeToast(nodeId);

  const addEmail = useCallback(
    (email: string) => {
      const trimmed = email.trim();
      if (!trimmed) return;

      // Validate email format
      const validation = validateEmail(trimmed);
      if (!validation.isValid) {
        showError("Invalid Email", validation.error || "Please enter a valid email address");
        return;
      }

      // Check for duplicates
      if (emails.includes(trimmed)) {
        showError("Duplicate Email", "This email address has already been added");
        return;
      }

      // Add valid email
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

    // Extract emails anywhere in the text
    const emailRegex = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
    const matches = pastedText.match(emailRegex) || [];

    if (matches.length > 0) {
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

      setInputValue("");
    }
  }, [emails, addEmail]);

  return (
    <div className="min-h-6 border rounded-md border-border px-2">
      <Label className="text-[10px] self-start pt-1 pl-1 text-muted-foreground w-8 flex items-center">{label}</Label>
      <div className="flex flex-wrap items-center flex-1 min-w-0">
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
          disabled={disabled}
        />
      </div>
      {/* CC/BCC Toggle - Only show on "To" field */}
      {type === "to" && (
        <div className="flex flex-row gap-1 ml-2 self-end h-6 items-center">
          <Button
            variant="ghost"
            size="sm"
            className={`p-0 text-[10px] text-muted-foreground hover:text-foreground hover:bg-transparent hover:underline ${showCC ? 'text-foreground' : ''}`}
            onClick={() => {
              const newShowCC = !showCC;
              setShowCC?.(newShowCC);
              if (!newShowCC) {
                onChange([]);
              }
            }}
            disabled={disabled}
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
                onChange([]);
              }
            }}
            disabled={disabled}
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

// ─────────────────────────────────────────────────────────────────────────────
// MAIN SENDER - Primary email sending interface
// ─────────────────────────────────────────────────────────────────────────────

export interface EmailSenderProps {
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

export const EmailSender = memo(function EmailSender({
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
}: EmailSenderProps) {
  const {
    accountId = "",
    recipients,
    subject = "",
    content,
    attachments,
    maxAttachmentSize = 25 * 1024 * 1024,
    sendMode = "immediate",
    batchSize = 10,
    delayBetweenSends = 1000,
    trackDelivery = true,
    trackReads = false,
    trackClicks = false,
    retryAttempts = 3,
    continueOnError = true,
    sentCount = 0,
    failedCount = 0,
    lastError = "",
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

  const [activeTab, setActiveTab] = useState("compose");
  const [showCC, setShowCC] = useState(safeRecipients.cc.length > 0);
  const [showBCC, setShowBCC] = useState(safeRecipients.bcc.length > 0);

  // Use refs to persist values across page loads
  const accountIdRef = useRef(accountId);
  const subjectRef = useRef(subject);
  
  // Sync refs with props
  useEffect(() => {
    accountIdRef.current = accountId;
  }, [accountId]);
  
  useEffect(() => {
    subjectRef.current = subject;
  }, [subject]);

  // Determine send button state using refs for persistence
  const isSending = sendingStatus === "sending" || sendingStatus === "composing";
  const hasError = sendingStatus === "error";
  const hasAccount = accountIdRef.current.length > 0;
  const hasRecipients = safeRecipients.to.length > 0;
  const hasContent = subjectRef.current.trim().length > 0 || safeContent.text.trim().length > 0;
  const canSend = hasAccount && hasRecipients && hasContent;

  const sendButtonText = isSending
    ? sendingStatus === "composing"
      ? "Composing..."
      : "Sending..."
    : "Send";

  // Enhanced handlers that update refs for persistence
  const handleAccountChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      accountIdRef.current = e.target.value;
      onAccountChange(e);
    },
    [onAccountChange]
  );

  const handleSubjectChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      subjectRef.current = e.target.value;
      onSubjectChange(e);
    },
    [onSubjectChange]
  );

  // Helper function to convert recipient array change to textarea change
  const handleRecipientsChangeForInput = useCallback(
    (type: "to" | "cc" | "bcc") => (emails: string[]) => {
      // Create synthetic event to match existing interface
      const syntheticEvent = {
        target: { value: emails.join(", ") },
      } as React.ChangeEvent<HTMLTextAreaElement>;
      onRecipientsChange(type)(syntheticEvent);
    },
    [onRecipientsChange]
  );

  return (
    <div className={SENDER_STYLES.container}>
      {/* Content Area */}
      <div className={SENDER_STYLES.content}>
        <Tabs variant="node" value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col overflow-auto nowheel">
          <div className="flex items-center justify-between mt-2">
            <TabsList variant="node" className="">
              <TabsTrigger variant="node" value="compose" className="">
                Compose
              </TabsTrigger>
              <TabsTrigger variant="node" value="settings" className="">
                Settings
              </TabsTrigger>
            </TabsList>

            {/* Header with Send Button */}
            <div className={SENDER_STYLES.header}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {sentCount > 0 && (
                    <Badge variant="icon" className="text-[8px] font-light mr-2">
                      {sentCount} sent
                    </Badge>
                  )}
                  {failedCount > 0 && (
                    <Badge variant="destructive" className="text-[8px] font-light mr-2">
                      {failedCount} failed
                    </Badge>
                  )}
                </div>
                <Button
                  onClick={onSendEmail}
                  disabled={!isEnabled || isSending || !canSend}
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
            <div className="space-y-0">
              <div className="min-h-6 border rounded-md border-border px-2">
                <Label className="text-[10px] self-start pt-1 pl-1 text-muted-foreground w-16 flex items-center">
                  Account
                  {onRefreshAccount && (
                    <Button
                      onClick={onRefreshAccount}
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 hover:bg-transparent ml-1"
                      disabled={isSending}
                    >
                      <RotateCcw className="h-3 w-3" />
                    </Button>
                  )}
                </Label>
                <div className="flex flex-wrap items-center flex-1 min-w-0">
                  <Select
                    value={accountId}
                    onValueChange={(value) => {
                      handleAccountChange({
                        target: { value },
                      } as React.ChangeEvent<HTMLSelectElement>);
                    }}
                    disabled={!isEnabled || isSending}
                  >
                    <SelectTrigger className="border-0 shadow-none bg-transparent p-0 h-6 text-[10px] min-w-32 flex-1 focus-visible:ring-0">
                      <SelectValue placeholder="Select email account..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableAccounts.map((account) => (
                        <SelectItem 
                          key={account.value} 
                          value={account.value}
                          disabled={!account.isActive}
                        >
                          {account.label} {account.isActive ? "" : "(inactive)"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
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
                nodeId={nodeId}
                showCC={showCC}
                showBCC={showBCC}
                setShowCC={setShowCC}
                setShowBCC={setShowBCC}
                disabled={!isEnabled || isSending}
              />

              {showCC && (
                <RecipientInput
                  type="cc"
                  label="Cc"
                  emails={safeRecipients.cc}
                  onChange={handleRecipientsChangeForInput("cc")}
                  placeholder="Cc recipients..."
                  nodeId={nodeId}
                  disabled={!isEnabled || isSending}
                />
              )}
              
              {showBCC && (
                <RecipientInput
                  type="bcc"
                  label="Bcc"
                  emails={safeRecipients.bcc}
                  onChange={handleRecipientsChangeForInput("bcc")}
                  placeholder="Bcc recipients..."
                  nodeId={nodeId}
                  disabled={!isEnabled || isSending}
                />
              )}
            </div>

            <Separator className="mb-1" />

            {/* Subject */}
            <div id="subject" className="border border-border rounded-md flex flex-row items-center">
              <Label className="text-[10px] self-start pt-1 pl-1 text-muted-foreground w-16 flex items-center">Subject</Label>
              <Input
                variant="node"
                value={subject}
                onChange={handleSubjectChange}
                placeholder="Email subject..."
                className={`${INPUT_STYLES.input} ml-1`}
                disabled={!isEnabled || isSending}
              />
            </div>

            <Separator className="mb-1" />

            {/* Message Content */}
            <div className="space-y-1 flex-1 flex flex-col">
              <Label className={INPUT_STYLES.label}>Message</Label>
              <textarea
                value={safeContent.text}
                onChange={onContentChange("text")}
                placeholder="Enter your message here..."
                className={`${INPUT_STYLES.textarea} w-full min-h-[70px] border border-border rounded-md px-2 py-1`}
                disabled={!isEnabled || isSending}
              />
            </div>
          </TabsContent>

          <TabsContent variant="node" value="settings" className="pt-3 space-y-3 m-0">
            {/* Attachments */}
            <div className="space-y-1">
              <Label className={INPUT_STYLES.label}>Attachments</Label>

              {/* File Input */}
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  multiple={true}
                  onChange={onFileAttachment}
                  className="hidden"
                  id={`file-input-${nodeId}`}
                  disabled={!isEnabled || isSending}
                  accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif,.zip,.rar"
                />
                <Button
                  variant="outline"
                  size="node"
                  asChild
                  disabled={!isEnabled || isSending}
                >
                  <label htmlFor={`file-input-${nodeId}`} className="cursor-pointer">
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

            {/* Send Options */}
            <div className="space-y-2">
              <div className="space-y-1">
                <Label className={INPUT_STYLES.label}>Send Mode</Label>
                <Select
                  value={sendMode}
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

              {/* Batch Options */}
              {sendMode === "batch" && (
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className={INPUT_STYLES.label}>Batch Size</Label>
                    <Input
                      variant="node"
                      type="number"
                      value={batchSize}
                      onChange={onNumberChange("batchSize", 1, 100)}
                      min="1"
                      max="100"
                      className={INPUT_STYLES.input}
                      disabled={!isEnabled || isSending}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className={INPUT_STYLES.label}>Delay (ms)</Label>
                    <Input
                      variant="node"
                      type="number"
                      value={delayBetweenSends}
                      onChange={onNumberChange("delayBetweenSends", 0, 60000)}
                      min="0"
                      max="60000"
                      className={INPUT_STYLES.input}
                      disabled={!isEnabled || isSending}
                    />
                  </div>
                </div>
              )}

              {/* Tracking Options */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-[10px] text-foreground">
                  <input
                    type="checkbox"
                    checked={trackDelivery}
                    onChange={onCheckboxChange("trackDelivery")}
                    className="h-3 w-3"
                    disabled={!isEnabled}
                  />
                  Track Delivery
                </label>
                <label className="flex items-center gap-2 text-[10px] text-foreground">
                  <input
                    type="checkbox"
                    checked={trackReads}
                    onChange={onCheckboxChange("trackReads")}
                    className="h-3 w-3"
                    disabled={!isEnabled}
                  />
                  Track Reads
                </label>
                <label className="flex items-center gap-2 text-[10px] text-foreground">
                  <input
                    type="checkbox"
                    checked={trackClicks}
                    onChange={onCheckboxChange("trackClicks")}
                    className="h-3 w-3"
                    disabled={!isEnabled}
                  />
                  Track Clicks
                </label>
                <label className="flex items-center gap-2 text-[10px] text-foreground">
                  <input
                    type="checkbox"
                    checked={continueOnError}
                    onChange={onCheckboxChange("continueOnError")}
                    className="h-3 w-3"
                    disabled={!isEnabled}
                  />
                  Continue on Error
                </label>
              </div>

              {/* Retry Attempts */}
              <div className="space-y-1">
                <Label className={INPUT_STYLES.label}>Retry Attempts</Label>
                <Input
                  variant="node"
                  type="number"
                  value={retryAttempts}
                  onChange={onNumberChange("retryAttempts", 0, 5)}
                  min="0"
                  max="5"
                  className={INPUT_STYLES.input}
                  disabled={!isEnabled}
                />
              </div>
            </div>

            {/* Future settings can go here */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Settings className="h-3 w-3" />
              <span>Templates and scheduling coming soon</span>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Footer with Status */}
      {(hasError || lastError) && (
        <div className={SENDER_STYLES.footer}>
          <div className="flex items-center gap-2 text-xs text-destructive">
            <AlertCircle className="h-3 w-3" />
            <span>{lastError || "An error occurred"}</span>
          </div>
        </div>
      )}
    </div>
  );
});

export default EmailSender;