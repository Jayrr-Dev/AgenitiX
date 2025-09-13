/**
 * EmailDraftExpanded - Copia EXACTA de EmailSender.tsx
 * 
 * ESTRUCTURA IDÉNTICA:
 * ✅ Account selection PRIMERO
 * ✅ Recipients con CC/BCC logic EXACTO
 * ✅ Subject con layout EXACTO
 * ✅ Message con textarea EXACTO
 * ✅ Attachments en Settings tab EXACTO
 * ✅ Save status logic CORRECTO
 * ✅ No scroll horizontal
 * ✅ Spacing EXACTO
 */

"use client";

import React, { useState, useCallback, memo, useRef, useEffect } from "react";
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
  Send, 
  Upload, 
  FileText, 
  X, 
  Settings, 
  AlertCircle, 
  Save,
  Mail,
  User,
  Check,
  Loader2,
  RotateCcw,
  FileEdit
} from "lucide-react";
import type { EmailDraftData } from "../emailDraft.node";
import { useEmailDraftAutoSave } from "../hooks/useEmailDraftAutoSave";
import { DraftSelector } from "./DraftSelector";

// Estilos EXACTOS del EmailSender
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

interface ConnectedEmailAccount {
  email: string;
  displayName?: string;
  isConnected: boolean;
  accountId: string;
}

interface EmailDraftExpandedProps {
  nodeId: string;
  nodeData: EmailDraftData;
  updateNodeData: (updates: Partial<EmailDraftData>) => void;
  isEnabled: boolean;
  categoryStyles: { primary: string };
  connectedAccount?: ConnectedEmailAccount;
}

// ─────────────────────────────────────────────────────────────────────────────
// RECIPIENT CHIP - EXACTO al EmailSender
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
    to: "bg-muted/80 text-foreground border-muted text-[10px] my-0.5",
    cc: "bg-muted/80 text-foreground border-muted text-[10px] my-0.5", 
    bcc: "bg-muted/80 text-foreground border-muted text-[10px] my-0.5",
  };

  return (
    <div
      className={`inline-flex items-center h-5 px-2 rounded-full border ${variantStyles[variant]} hover:bg-muted`}
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
// RECIPIENT INPUT - EXACTO al EmailSender
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

  const addEmail = useCallback(
    (email: string) => {
      const trimmed = email.trim();
      if (!trimmed) return;

      // Validación básica de email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmed)) return;
      if (emails.includes(trimmed)) return;

      onChange([...emails, trimmed]);
      setInputValue("");
    },
    [emails, onChange]
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
      if (e.key === "Backspace" && !inputValue && emails.length > 0) {
        removeEmail(emails.length - 1);
      }
    },
    [inputValue, addEmail, emails.length, removeEmail]
  );

  const handleBlur = useCallback(() => {
    if (inputValue.trim()) {
      addEmail(inputValue);
    }
  }, [inputValue, addEmail]);

  return (
    <div className="min-h-6 border rounded-md border-border px-2">
      <div className="flex items-center">
        <Label className="text-[10px] self-start pt-1 pl-1 text-muted-foreground w-8 flex items-center">
          {label}
        </Label>
        <div className="flex flex-wrap items-center gap-1 pb-1 flex-1 min-w-0">
          {/* Chips de emails */}
          {emails.map((email, index) => (
            <RecipientChip
              key={index}
              email={email}
              onRemove={() => removeEmail(index)}
              variant={type}
            />
          ))}
          {/* Input inline */}
          <Input
            variant="node"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            placeholder={placeholder}
            disabled={disabled}
            className="border-0 shadow-none bg-transparent p-0 h-6 text-[10px] min-w-32 flex-1 focus-visible:ring-0"
          />
        </div>
        {/* CC/BCC buttons SOLO en el TO */}
        {type === "to" && (
          <div className="flex flex-row gap-1 mr-1 self-end h-6 items-center">
            <Button
              variant="ghost"
              size="sm"
              className={`p-0 text-[10px] text-muted-foreground hover:text-foreground hover:bg-transparent hover:underline ${showCC ? 'text-foreground' : ''}`}
              onClick={() => setShowCC?.(!showCC)}
              disabled={disabled}
            >
              Cc
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={`p-0 text-[10px] text-muted-foreground hover:text-foreground hover:bg-transparent hover:underline ${showBCC ? 'text-foreground' : ''}`}
              onClick={() => setShowBCC?.(!showBCC)}
              disabled={disabled}
            >
              Bcc
            </Button>
          </div>
        )}
      </div>
    </div>
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// MAIN DRAFT EXPANDED - EXACTO al EmailSender
// ─────────────────────────────────────────────────────────────────────────────

export const EmailDraftExpanded = memo(
  function EmailDraftExpanded({
    nodeId,
    nodeData,
    updateNodeData,
    isEnabled,
    categoryStyles,
    connectedAccount,
  }: EmailDraftExpandedProps) {
    const { recipients, subject, body, attachments, autoSave, lastSaved, accountId } = nodeData;
    
    // Debug only if autoSave is undefined (shouldn't happen with schema defaults)
    if (autoSave === undefined) {
      console.warn("EmailDraft autoSave is undefined, using fallback:", { nodeData });
    }
    const [activeTab, setActiveTab] = useState(
      nodeData.draftMode === "browse" ? "browse" : "compose"
    );
    

    const [showCC, setShowCC] = useState((recipients?.cc?.length || 0) > 0);
    const [showBCC, setShowBCC] = useState((recipients?.bcc?.length || 0) > 0);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Real Gmail auto-save hook
    const draftAutoSave = useEmailDraftAutoSave({
      nodeId,
      draftData: nodeData,
      updateNodeData,
      config: {
        enabled: autoSave ?? true, // Default to true if undefined
        intervalMs: 3000, // 3 seconds
        maxRetries: 3,
      },
      onSave: (draftId) => {
        console.log("Draft saved successfully:", draftId);
      },
      onError: (error) => {
        console.error("Draft save error:", error);
      },
    });

    // Hook is automatically logged if there are errors

    // Safe recipients EXACTO al EmailSender
    const safeRecipients = {
      to: recipients?.to || [],
      cc: recipients?.cc || [],
      bcc: recipients?.bcc || [],
    };

    // Safe content EXACTO al EmailSender
    const safeContent = {
      text: (body as any)?.text || "",
      html: (body as any)?.html || "",
    };

    // Available accounts EXACTO al EmailSender
    const availableAccounts = connectedAccount ? [{
      value: connectedAccount.accountId,
      label: connectedAccount.displayName || connectedAccount.email,
      isActive: connectedAccount.isConnected,
    }] : [];

    // HANDLERS EXACTOS al EmailSender
    const handleAccountChange = useCallback(
      (e: React.ChangeEvent<HTMLSelectElement>) => {
        updateNodeData({ accountId: e.target.value });
      },
      [updateNodeData]
    );

    const handleSubjectChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        updateNodeData({ subject: e.target.value });
      },
      [updateNodeData]
    );

    const handleRecipientsChangeForInput = useCallback(
      (type: "to" | "cc" | "bcc") => (emails: string[]) => {
        updateNodeData({
          recipients: {
            ...safeRecipients,
            [type]: emails
          }
        });
      },
      [safeRecipients, updateNodeData]
    );

    const onContentChange = useCallback(
      (field: "text" | "html") => (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        updateNodeData({
          body: {
            text: safeContent.text,
            html: safeContent.html,
            mode: (body as any)?.mode || "text",
            [field]: e.target.value
          }
        });
      },
      [safeContent, updateNodeData, body]
    );

    const onFileAttachment = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        const newAttachments = Array.from(files).map((file, index) => ({
          id: `${Date.now()}-${index}`,
          name: file.name,
          size: file.size,
          type: file.type,
        }));

        updateNodeData({
          attachments: [...(attachments || []), ...newAttachments]
        });

        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      },
      [attachments, updateNodeData]
    );

    const onRemoveAttachment = useCallback(
      (attachmentId: string) => {
        updateNodeData({
          attachments: (attachments || []).filter(att => att.id !== attachmentId)
        });
      },
      [attachments, updateNodeData]
    );

    // Save Draft Function - Uses real Gmail API
    const onSaveDraft = useCallback(async () => {
      console.log("Save draft clicked - Draft data:", {
        accountId: nodeData.accountId,
        isEmpty: draftAutoSave.isEmpty,
        isLoading: draftAutoSave.isLoading,
        hasConnectedAccount: !!connectedAccount,
        recipients: nodeData.recipients,
        subject: nodeData.subject,
      });
      
      const success = await draftAutoSave.forceSave();
      if (!success) {
        console.error("Failed to save draft - Check auto-save state:", {
          autoSaveState: draftAutoSave,
          error: draftAutoSave.error,
        });
      } else {
        console.log("Draft saved successfully");
      }
    }, [draftAutoSave, nodeData, connectedAccount]);

    // Effect to switch tabs when draft mode changes
    useEffect(() => {
      if (nodeData.draftMode === "browse" && activeTab !== "browse") {
        setActiveTab("browse");
      } else if (nodeData.draftMode === "existing" && activeTab !== "compose") {
        setActiveTab("compose");
      } else if (nodeData.draftMode === "new" && activeTab === "browse") {
        setActiveTab("compose");
      }
    }, [nodeData.draftMode, activeTab]);

    // Max attachment size EXACTO al EmailSender
    const maxAttachmentSize = 25 * 1024 * 1024; // 25MB

    // ESTRUCTURA EXACTA del EmailSender
    return (
      <div className={`${SENDER_STYLES.container} ${!isEnabled ? "opacity-75" : ""}`}>
        <div className={SENDER_STYLES.content}>
          <Tabs variant="node" value={activeTab} onValueChange={(value) => {
            setActiveTab(value);
            
            // Update draft mode when tab changes
            if (value === "browse" && nodeData.draftMode !== "browse") {
              updateNodeData({ draftMode: "browse" });
            } else if (value !== "browse" && nodeData.draftMode === "browse") {
              updateNodeData({ draftMode: "new" });
            }
          }} className="h-full flex flex-col overflow-auto nowheel">
            <div className="flex items-center justify-between mt-2">
              <TabsList variant="node" className="">
                <TabsTrigger variant="node" value="compose" className="">
                  Compose
                </TabsTrigger>
                <TabsTrigger variant="node" value="browse" className="">
                  Browse
                </TabsTrigger>
                <TabsTrigger variant="node" value="settings" className="">
                  Settings
                </TabsTrigger>
              </TabsList>

              {/* Header con Save Button EXACTO al EmailSender */}
              <div className={SENDER_STYLES.header}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {connectedAccount && (
                      <Badge variant="icon" className="text-[8px] font-light mr-2">
                        {connectedAccount.displayName || connectedAccount.email}
                      </Badge>
                    )}
                    {nodeData.draftMode === "existing" && nodeData.draftId && (
                      <Badge variant="outline" className="text-[8px] font-light text-blue-600 border-blue-200">
                        <FileEdit className="h-2 w-2 mr-1" />
                        Editing Draft
                      </Badge>
                    )}
                  </div>
                  <Button
                    onClick={onSaveDraft}
                    disabled={!isEnabled || draftAutoSave.isEmpty || draftAutoSave.isLoading}
                    variant="node"
                    size="node"
                  >
                    {draftAutoSave.isLoading ? (
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    ) : (
                      <Save className="h-3 w-3 mr-1" />
                    )}
                    {draftAutoSave.isLoading 
                      ? "Saving..." 
                      : nodeData.draftMode === "existing" 
                        ? "Update Draft" 
                        : "Save Draft"}
                  </Button>
                </div>
              </div>
            </div>

            <TabsContent variant="node" value="compose" className="flex-1">
              {/* Account Selection EXACTO al EmailSender */}
              <div className="space-y-0">
                <div className="min-h-6 border rounded-md border-border px-2">
                  <Label className="text-[10px] self-start pt-1 pl-1 text-muted-foreground w-16 flex items-center">
                    Account
                  </Label>
                  <div className="flex flex-wrap items-center flex-1 min-w-0">
                    <Select
                      value={accountId}
                      onValueChange={(value) => {
                        handleAccountChange({
                          target: { value },
                        } as React.ChangeEvent<HTMLSelectElement>);
                      }}
                      disabled={!isEnabled}
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

              {/* Recipients EXACTO al EmailSender */}
              <div className="space-y-0">
                <RecipientInput
                  type="to"
                  label="To"
                  emails={safeRecipients.to}
                  onChange={handleRecipientsChangeForInput("to")}
                  placeholder="Enter recipient email..."
                  nodeId="emailDraft"
                  showCC={showCC}
                  showBCC={showBCC}
                  setShowCC={setShowCC}
                  setShowBCC={setShowBCC}
                  disabled={!isEnabled}
                />

                {showCC && (
                  <RecipientInput
                    type="cc"
                    label="Cc"
                    emails={safeRecipients.cc}
                    onChange={handleRecipientsChangeForInput("cc")}
                    placeholder="Cc recipients..."
                    nodeId="emailDraft"
                    disabled={!isEnabled}
                  />
                )}
                
                {showBCC && (
                  <RecipientInput
                    type="bcc"
                    label="Bcc"
                    emails={safeRecipients.bcc}
                    onChange={handleRecipientsChangeForInput("bcc")}
                    placeholder="Bcc recipients..."
                    nodeId="emailDraft"
                    disabled={!isEnabled}
                  />
                )}
              </div>

              <Separator className="mb-1" />

              {/* Subject EXACTO al EmailSender */}
              <div id="subject" className="border border-border rounded-md flex flex-row items-center">
                <Label className="text-[10px] self-start pt-1 pl-1 text-muted-foreground w-16 flex items-center">Subject</Label>
                <Input
                  variant="node"
                  value={subject || ""}
                  onChange={handleSubjectChange}
                  placeholder="Email subject..."
                  className={`${INPUT_STYLES.input} ml-1`}
                  disabled={!isEnabled}
                />
              </div>

              <Separator className="mb-1" />

              {/* Message Content EXACTO al EmailSender */}
              <div className="space-y-1 flex-1 flex flex-col">
                <Label className={INPUT_STYLES.label}>Message</Label>
                <textarea
                  value={safeContent.text}
                  onChange={onContentChange("text")}
                  placeholder="Enter your message here..."
                  className={`${INPUT_STYLES.textarea} w-full min-h-[70px] border border-border rounded-md px-2 py-1`}
                  disabled={!isEnabled}
                />
              </div>
            </TabsContent>

            {/* Browse Tab - Draft Management */}
            <TabsContent variant="node" value="browse" className="flex-1 m-0">
              {!accountId || !connectedAccount ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center space-y-2">
                    <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto" />
                    <p className="text-[10px] text-muted-foreground">
                      Connect an email account to browse drafts
                    </p>
                  </div>
                </div>
              ) : (
                <DraftSelector
                  nodeData={nodeData}
                  updateNodeData={updateNodeData}
                  isEnabled={isEnabled}
                  accountId={accountId}
                />
              )}
            </TabsContent>

            {/* Settings Tab EXACTO al EmailSender */}
            <TabsContent variant="node" value="settings" className="pt-3 space-y-3 m-0">
              {/* Attachments EXACTO al EmailSender */}
              <div className="space-y-1">
                <Label className={INPUT_STYLES.label}>Attachments</Label>

                {/* File Input EXACTO al EmailSender */}
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    multiple={true}
                    onChange={onFileAttachment}
                    className="hidden"
                    id="file-input-emailDraft"
                    disabled={!isEnabled}
                    accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif,.zip,.rar"
                  />
                  <Button
                    variant="outline"
                    size="node"
                    asChild
                    disabled={!isEnabled}
                  >
                    <label htmlFor="file-input-emailDraft" className="cursor-pointer">
                      <Upload className="h-3 w-3 mr-1" />
                      Add Files
                    </label>
                  </Button>
                  <span className="text-[10px] text-muted-foreground">
                    Max: {Math.round(maxAttachmentSize / 1024 / 1024)}MB per file
                  </span>
                </div>

                {/* Attachment List EXACTO al EmailSender */}
                {(attachments || []).length > 0 && (
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {(attachments || []).map((attachment) => (
                      <div
                        key={attachment.id}
                        className="flex items-center gap-2 p-2 bg-muted/20 rounded border text-[10px]"
                      >
                        <FileText className="h-3 w-3 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="truncate font-medium">{attachment.name}</p>
                          <p className="text-muted-foreground">
                            {Math.round(attachment.size / 1024)}KB • {attachment.type}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => onRemoveAttachment(attachment.id)}
                          disabled={!isEnabled}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Separator />

              {/* Auto-Save Settings */}
              <div className="space-y-2">
                <Label className="text-[10px] text-muted-foreground">Auto-Save</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={autoSave}
                    onChange={(e) => updateNodeData({ autoSave: e.target.checked })}
                    disabled={!isEnabled}
                    className="h-3 w-3"
                  />
                  <span className="text-[10px] text-muted-foreground">
                    Automatically save changes
                  </span>
                </div>
              </div>

              {/* Future settings EXACTO al EmailSender */}
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Settings className="h-3 w-3" />
                <span>Templates and scheduling coming soon</span>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Footer with real auto-save status - EXACTO al EmailSender */}
        <div className={SENDER_STYLES.footer}>
          <div className="flex items-center gap-2 text-xs">
            {(() => {
              const saveStatus = draftAutoSave.getSaveStatus();
              const IconComponent = saveStatus.icon === "loading" ? Loader2 : 
                                  saveStatus.icon === "success" ? Check :
                                  saveStatus.icon === "error" ? AlertCircle :
                                  saveStatus.icon === "warning" ? AlertCircle : null;
              
              return (
                <>
                  {IconComponent && (
                    <IconComponent 
                      className={`h-3 w-3 ${saveStatus.icon === "loading" ? "animate-spin" : ""} ${saveStatus.color}`} 
                    />
                  )}
                  <span className={saveStatus.color}>
                    {nodeData.draftMode === "existing" && saveStatus.text === "Saved" 
                      ? "Draft Updated" 
                      : saveStatus.text}
                  </span>
                  {nodeData.draftMode === "existing" && nodeData.draftId && (
                    <span className="text-[8px] text-muted-foreground ml-2">
                      • ID: {nodeData.draftId.substring(0, 8)}...
                    </span>
                  )}
                </>
              );
            })()}
          </div>
        </div>
      </div>
    );
  }
);

EmailDraftExpanded.displayName = "EmailDraftExpanded";

export default EmailDraftExpanded;