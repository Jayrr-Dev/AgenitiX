/**
 * EmailComposer COMPONENT – Minimalist, reusable email drafting interface
 *
 * • Clean, minimal design following email client best practices
 * • Proper visual hierarchy with clear separation of concerns
 * • Intuitive tab-based interface for recipients and settings
 * • Responsive design with consistent spacing and typography
 * • Optimized for fast composition with keyboard shortcuts
 *
 * Keywords: email-composer, minimalist, reusable, clean-design
 */

"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SerializedEditorState } from "lexical";
import { Editor } from "../../../../../components/blocks/editor-00/editor";
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
import { Send, Plus, X, Clock, Palette, AlertCircle } from "lucide-react";
import { useState, useCallback, memo, useRef, useEffect } from "react";
import { z } from "zod";
import { useNodeToast } from "@/hooks/useNodeToast";
import type { EmailMessageData } from "../emailMessage.node";

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

const COMPOSER_STYLES = {
  container: "flex flex-col h-full bg-background border border-border rounded-lg",
  header: "pl-2 ",
  content: "flex-1 flex flex-col min-h-0 border-border  p-2",
  footer: "p-3 border-t border-border bg-muted/30",
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// RICH TEXT HELPERS - Minimal adapters for shadcn/editor
// ─────────────────────────────────────────────────────────────────────────────

const buildEditorStateFromText = (text: string): SerializedEditorState => {
  // [Explanation], basically wrap the given text in a minimal Lexical root/paragraph structure
  if (!text || text.trim() === "") {
    // Return empty state for empty text, basically initialize with empty paragraph
    return {
      root: {
        children: [
          {
            children: [],
            direction: "ltr",
            format: "",
            indent: 0,
            type: "paragraph",
            version: 1,
          },
        ],
        direction: "ltr",
        format: "",
        indent: 0,
        type: "root",
        version: 1,
      },
    } as unknown as SerializedEditorState;
  }

  return {
    root: {
      children: [
        {
          children: [
            {
              detail: 0,
              format: 0,
              mode: "normal",
              style: "",
              text: text,
              type: "text",
              version: 1,
            },
          ],
          direction: "ltr",
          format: "",
          indent: 0,
          type: "paragraph",
          version: 1,
        },
      ],
      direction: "ltr",
      format: "",
      indent: 0,
      type: "root",
      version: 1,
    },
  } as unknown as SerializedEditorState;
};

const extractPlainTextFromEditor = (
  editorState: SerializedEditorState
): string => {
  // [Explanation], basically traverse the serialized nodes and collect text
  try {
    const root: any = (editorState as any)?.root;
    if (!root || !Array.isArray(root.children)) return "";

    let text = "";
    let paragraphCount = 0;
    
    const visit = (node: any) => {
      if (!node) return;
      if (node.type === "text") {
        text += node.text || "";
        return;
      }
      if (Array.isArray(node.children)) {
        const wasEmpty = text.length === 0;
        for (const child of node.children) visit(child);
        // Add paragraph breaks between paragraphs, basically preserve structure
        if (node.type === "paragraph") {
          paragraphCount++;
          if (!wasEmpty && text && !text.endsWith("\n") && paragraphCount > 1) {
            text += "\n";
          }
        }
      }
    };
    
    for (const child of root.children) visit(child);
    return text.trim();
  } catch (error) {
    console.warn("Failed to extract text from editor state:", error);
    return "";
  }
};

const INPUT_STYLES = {
  field: "text-xs",
  label: "text-[10px] text-muted-foreground flex items-center pl-1",
  input: "h-6 text-[10px]",
  textarea: "text-[10px] resize-none",
  select: "h-6 text-[10px]",
} as const;

interface RecipientChipProps {
  email: string;
  onRemove: () => void;
  variant?: "to" | "cc" | "bcc";
}

// ─────────────────────────────────────────────────────────────────────────────
// RECIPIENT CHIP - Clean email badge component
// ─────────────────────────────────────────────────────────────────────────────

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
  
  // Use ref to persist input value across renders, basically survive page reloads
  const inputValueRef = useRef(inputValue);
  
  // Sync ref with state, basically keep them in sync
  useEffect(() => {
    inputValueRef.current = inputValue;
  }, [inputValue]);

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
    <div className="flex min-h-6 border rounded-md border-border px-2">
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
        />
      </div>
      {/* CC/BCC Toggle - Only show on "To" field */}
      {type === "to" && (
        <div className="flex flex-row gap-1 mr-1 self-end h-6 items-center">
          <Button
            variant="ghost"
            size="sm"
            className={`p-0 text-[10px] text-muted-foreground hover:text-foreground hover:bg-transparent hover:underline ${showCC ? 'text-foreground' : ''}`}
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

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPOSER - Primary email composition interface
// ─────────────────────────────────────────────────────────────────────────────

export interface EmailComposerProps {
  nodeId: string;
  nodeData: EmailMessageData;
  isEnabled: boolean;
  connectionStatus: EmailMessageData["connectionStatus"];
  canSend?: boolean;
  onMessageContentChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSubjectChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRecipientsChange: (type: "to" | "cc" | "bcc", recipients: string[]) => void;
  onPriorityChange: (priority: string) => void;
  onComposeMessage: () => void;
}

export const EmailComposer = memo(function EmailComposer({
  nodeId,
  nodeData,
  isEnabled,
  connectionStatus,
  canSend = true,
  onMessageContentChange,
  onSubjectChange,
  onRecipientsChange,
  onPriorityChange,
  onComposeMessage,
}: EmailComposerProps) {
  const {
    messageContent = "",
    subject = "",
    priority = "normal",
    recipients = { to: [], cc: [], bcc: [] },
    sentCount = 0,
    lastError = "",
  } = nodeData;

  const [activeTab, setActiveTab] = useState("compose");
  const [showCC, setShowCC] = useState(recipients.cc.length > 0);
  const [showBCC, setShowBCC] = useState(recipients.bcc.length > 0);

  // Provide safe defaults for critical objects that might be undefined
  const safeRecipients = recipients || { to: [], cc: [], bcc: [] };
  
  // Use refs to persist values across page loads, basically maintain state
  const subjectRef = useRef(subject);
  const messageContentRef = useRef(messageContent);
  const recipientsRef = useRef(safeRecipients);
  
  // Sync refs with props, basically keep them updated
  useEffect(() => {
    subjectRef.current = subject;
  }, [subject]);
  
  useEffect(() => {
    messageContentRef.current = messageContent;
  }, [messageContent]);
  
  useEffect(() => {
    recipientsRef.current = safeRecipients;
  }, [safeRecipients]);

  // Helper function to convert textarea change to recipient array change
  const handleRecipientsChangeForInput = useCallback(
    (type: "to" | "cc" | "bcc") => (emails: string[]) => {
      // Update ref immediately for persistence, basically keep ref current
      recipientsRef.current = {
        ...recipientsRef.current,
        [type]: emails,
      };
      onRecipientsChange(type, emails);
    },
    [onRecipientsChange]
  );

  // Determine send button state using refs for persistence, basically use latest values
  const isSending = connectionStatus === "sending" || connectionStatus === "composing";
  const hasError = connectionStatus === "error";
  const hasRecipients = recipientsRef.current.to.length > 0;
  const hasContent = subjectRef.current.trim().length > 0 || messageContentRef.current.trim().length > 0;

  const sendButtonText = isSending
    ? connectionStatus === "composing"
      ? "Composing..."
      : "Sending..."
    : "Send";

  // Enhanced handlers that update refs for persistence, basically keep refs current
  const handleSubjectChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      subjectRef.current = e.target.value;
      onSubjectChange(e);
    },
    [onSubjectChange]
  );

  const handleMessageContentChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      messageContentRef.current = e.target.value;
      onMessageContentChange(e);
    },
    [onMessageContentChange]
  );

  return (
    <div className={COMPOSER_STYLES.container}>
   

      {/* Content Area */}
      <div className={COMPOSER_STYLES.content}>
        <Tabs variant="node" value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col overflow-auto nowheel">
            <div className="flex items-center justify-between mt-2">
          <TabsList variant="node" className="">
            <TabsTrigger variant="node" value="compose" className="">
              Compose
            </TabsTrigger>
            <TabsTrigger variant="node" value="settings" className="">
              Settings
            </TabsTrigger>
               {/* Header with Send Button */}
         
          </TabsList>

          {/*  */}
          <div className={COMPOSER_STYLES.header}>
                <div className="flex items-center justify-between ">
                <div className="flex items-center gap-2">
                    {sentCount > 0 && (
                    <Badge variant="icon" className="text-[8px] font-light mr-2">
                        {sentCount} 
                    </Badge>
                    )}
                </div>
                <Button
                    onClick={onComposeMessage}
                    disabled={!isEnabled || isSending || !canSend || !hasRecipients || !hasContent}
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
            {/* Recipients */}
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
            <div id="subject" className=" border border-border rounded-md flex flex-row items-center ">
              <Input
                variant="node"
                value={subject}
                onChange={handleSubjectChange}
                placeholder="Subject"
                className={`${INPUT_STYLES.input} ml-1`}
                disabled={!isEnabled || isSending}
              />
            </div>
            <Separator className="mb-1" />
            {/* Message Content */}
            <div className="space-y-1 flex-1 flex flex-col">
              <Editor
                editorSerializedState={buildEditorStateFromText(messageContent)}
                placeholder="Compose your message..."
                onSerializedChange={(state: SerializedEditorState) => {
                  try {
                    // Convert rich state to plain text for store, basically keep existing data model
                    const text = extractPlainTextFromEditor(state);
                    // Reuse existing handler signature by constructing a synthetic event
                    handleMessageContentChange({
                      target: { value: text },
                    } as unknown as React.ChangeEvent<HTMLTextAreaElement>);
                  } catch (error) {
                    console.warn("Failed to process editor content change:", error);
                    // Fallback to empty string to prevent crashes, basically graceful degradation
                    handleMessageContentChange({
                      target: { value: "" },
                    } as unknown as React.ChangeEvent<HTMLTextAreaElement>);
                  }
                }}
                // Do not alter layout/styling wrappers; editor has its own internal styles
              />
            </div>
          </TabsContent>

          <TabsContent variant="node" value="settings" className="pt-3 space-y-3 m-0">
            {/* Priority */}
            <div className="space-y-1">
              <Label className={INPUT_STYLES.label}>Priority</Label>
              <Select
                value={priority}
                onValueChange={onPriorityChange}
                disabled={!isEnabled}
              >
                <SelectTrigger className={INPUT_STYLES.select}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Future settings can go here */}
            {/* <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>Scheduling and templates coming soon</span>
            </div> */}
          </TabsContent>
        </Tabs>
      </div>

      {/* Footer with Status */}
      {(hasError || lastError) && (
        <div className={COMPOSER_STYLES.footer}>
          <div className="flex items-center gap-2 text-xs text-destructive">
            <AlertCircle className="h-3 w-3" />
            <span>{lastError || "An error occurred"}</span>
          </div>
        </div>
      )}
    </div>
  );
});

export default EmailComposer;