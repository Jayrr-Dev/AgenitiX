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
import { useState, useCallback, memo } from "react";
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
  input: "h-6 text-[10px] outline-none focus:ring-0 focus:outline-none border-none bg-transparent",
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
    to: "bg-primary/10 text-primary border-primary/20 mx-1",
    cc: "bg-primary/10 text-primary border-primary/20 mx-1",
    bcc: "bg-primary/10 text-primary border-primary/20 mx-1",
  };

  return (
    <Badge
      variant="outline"
      className={`text-xs h-6 gap-1 ${variantStyles[variant]}`}
    >
      <span className="truncate max-w-32">{email}</span>
      <X
        className="h-3 w-3 cursor-pointer hover:opacity-70"
        onClick={onRemove}
      />
    </Badge>
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

    
  

  return (
    <div className="space-y-2">
      
      <div className="flex flex-row gap-1 mt-1 border border-border rounded-md min-h-0 bg-background px-2">
      <Label className={INPUT_STYLES.label}>{label}</Label>
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
          className="outline-none focus:ring-0 focus:outline-none border-none bg-transparent" 
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          placeholder={emails.length === 0 ? placeholder : ""}
        />
 
      {/* CC/BCC Toggle */}
      {recipients.cc.length === 0 && recipients.bcc.length === 0 && (
            <>
                <Button
                  variant="ghost"
                  size="node"
                  className="h-6 rounded-xs px-1 text-[8px] hover:bg-transparent hover:underline"
                  onClick={() => onRecipientsChange("cc", [""])}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  CC
                </Button>
                <Button
                  variant="ghost"
                  size="node"
                  className="h-6 rounded-xs px-1 text-[8px] hover:bg-transparent hover:underline"
                  onClick={() => onRecipientsChange("bcc", [""])}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  BCC
                    </Button>
            </>
            )}
        </div>
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

  // Determine send button state
  const isSending = connectionStatus === "sending" || connectionStatus === "composing";
  const hasError = connectionStatus === "error";
  const hasRecipients = recipients.to.length > 0;
  const hasContent = subject.trim().length > 0 || messageContent.trim().length > 0;

  const sendButtonText = isSending
    ? connectionStatus === "composing"
      ? "Composing..."
      : "Sending..."
    : "Send";

  return (
    <div className={COMPOSER_STYLES.container}>
   

      {/* Content Area */}
      <div className={COMPOSER_STYLES.content}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
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
                    <Badge variant="secondary" className="text-xs">
                        {sentCount} sent
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

          <TabsContent value="compose" className="flex-1"> 
            {/* Recipients */}
            <RecipientInput
              type="to"
              label="To"
              emails={recipients.to}
              onChange={(emails) => onRecipientsChange("to", emails)}
              placeholder="Enter recipient email..."
              recipients={recipients}
              onRecipientsChange={onRecipientsChange}
              nodeId={nodeId}
            />

            {(recipients.cc.length > 0 || recipients.bcc.length > 0) && (
              <>
                {recipients.cc.length > 0 && (
                  <RecipientInput
                    type="cc"
                    label="CC"
                    emails={recipients.cc}
                    onChange={(emails) => onRecipientsChange("cc", emails)}
                    placeholder="CC recipients..."
                    recipients={recipients}
                    onRecipientsChange={onRecipientsChange}
                    nodeId={nodeId}
                  />
                )}
                {recipients.bcc.length > 0 && (
                  <RecipientInput
                    type="bcc"
                    label="BCC"
                    emails={recipients.bcc}
                    onChange={(emails) => onRecipientsChange("bcc", emails)}
                    placeholder="BCC recipients..."
                    recipients={recipients}
                    onRecipientsChange={onRecipientsChange}
                    nodeId={nodeId}
                  />
                )}
              </>
            )}

            

            <Separator className="mb-1" />

            {/* Subject */}
            <div id="subject" className=" border border-border rounded-md flex flex-row items-center">
              <Input
                value={subject}
                onChange={onSubjectChange}
                placeholder="Subject"
                className={`${INPUT_STYLES.input}`}
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
                    onMessageContentChange({
                      target: { value: text },
                    } as unknown as React.ChangeEvent<HTMLTextAreaElement>);
                  } catch (error) {
                    console.warn("Failed to process editor content change:", error);
                    // Fallback to empty string to prevent crashes, basically graceful degradation
                    onMessageContentChange({
                      target: { value: "" },
                    } as unknown as React.ChangeEvent<HTMLTextAreaElement>);
                  }
                }}
                // Do not alter layout/styling wrappers; editor has its own internal styles
              />
            </div>
          </TabsContent>

          <TabsContent value="settings" className="pt-3 space-y-3 m-0">
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