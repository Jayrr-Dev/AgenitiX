"use client";
/**
 * Route: features/business-logic-modern/node-domain/email/components/EmailReaderExpanded.tsx
 * EMAIL READER – Minimalist expanded view following EmailMessage design principles
 *
 * • Clean, focused interface for email reading configuration
 * • Tab-based interface for settings and status
 * • Consistent 10px text size and spacing with EmailMessage
 * • Maintains compatibility with existing node architecture
 *
 * Keywords: email-reader, expanded, minimalist, clean-design
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
import { Mail, Settings, AlertCircle, RotateCcw } from "lucide-react";
import RenderStatusDot from "@/components/RenderStatusDot";
import type { EmailReaderData } from "../emailReader.node";

// Minimalist container styles matching EmailMessage
const EXPANDED_STYLES = {
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

type AvailableAccount = {
  value: string;
  label: string;
  provider: string;
  email: string;
  isActive: boolean;
  isConnected: boolean;
  lastValidated?: number;
};

export interface EmailReaderExpandedProps {
  nodeData: EmailReaderData;
  isEnabled: boolean;
  connectionStatus: EmailReaderData["connectionStatus"];
  availableAccounts: AvailableAccount[];
  canActivate?: boolean;
  onAccountChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onBatchSizeChange: (numericText: string) => void;
  onMaxMessagesChange: (numericText: string) => void;
  onIncludeAttachmentsChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onMarkAsReadChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onEnableRealTimeChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onCheckIntervalChange: (numericText: string) => void;
  onReadMessages: () => void;
}

export const EmailReaderExpanded = React.memo(
  function EmailReaderExpanded(props: EmailReaderExpandedProps) {
    const {
      nodeData,
      isEnabled,
      connectionStatus,
      availableAccounts,
      canActivate,
      onAccountChange,
      onBatchSizeChange,
      onMaxMessagesChange,
      onIncludeAttachmentsChange,
      onMarkAsReadChange,
      onEnableRealTimeChange,
      onCheckIntervalChange,
      onReadMessages,
    } = props;

    const {
      accountId = "",
      maxMessages = 10,
      includeAttachments = false,
      markAsRead = false,
      enableRealTime = false,
      checkInterval = 5,
      processedCount = 0,
      messageCount = 0,
      lastSync,
      lastError = "",
      retryCount = 0,
    } = nodeData;

    const [activeTab, setActiveTab] = React.useState("read");

    // Use refs to persist values across page loads
    const accountIdRef = React.useRef(accountId);
    const maxMessagesRef = React.useRef(maxMessages);
    
    // Sync refs with props
    React.useEffect(() => {
      accountIdRef.current = accountId;
    }, [accountId]);
    
    React.useEffect(() => {
      maxMessagesRef.current = maxMessages;
    }, [maxMessages]);

    // Determine read button state using refs for persistence
    const isReading = connectionStatus === "reading" || connectionStatus === "processing";
    const hasError = connectionStatus === "error";
    const hasAccount = accountIdRef.current.length > 0;
    const canRead = hasAccount && canActivate !== false;

    const readButtonText = isReading
      ? connectionStatus === "processing"
        ? "Processing..."
        : "Reading..."
      : "Read Messages";

    // Enhanced handlers that update refs for persistence
    const handleAccountChange = React.useCallback(
      (e: React.ChangeEvent<HTMLSelectElement>) => {
        accountIdRef.current = e.target.value;
        onAccountChange(e);
      },
      [onAccountChange]
    );

    const handleMaxMessagesChange = React.useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        const parsed = Number.parseInt(value || "1", 10);
        const clamped = Math.max(1, Math.min(1000, isNaN(parsed) ? 1 : parsed));
        maxMessagesRef.current = clamped;
        onMaxMessagesChange(clamped.toString());
        // Also update batch size to match
        onBatchSizeChange(Math.min(clamped, 100).toString());
      },
      [onMaxMessagesChange, onBatchSizeChange]
    );

    const handleCheckIntervalChange = React.useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        const parsed = Number.parseInt(value || "1", 10);
        const clamped = Math.max(1, Math.min(60, isNaN(parsed) ? 1 : parsed));
        onCheckIntervalChange(clamped.toString());
      },
      [onCheckIntervalChange]
    );

    const formattedLastSync = React.useMemo(() => {
      return lastSync ? new Date(lastSync).toLocaleString() : null;
    }, [lastSync]);

    return (
      <div className={`${EXPANDED_STYLES.container} ${isEnabled ? "" : "opacity-75 pointer-events-none"}`}>
        {/* Content Area */}
        <div className={EXPANDED_STYLES.content}>
          <Tabs variant="node" value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col overflow-auto nowheel">
            <div className="flex items-center justify-between mt-2">
              <TabsList variant="node" className="">
                <TabsTrigger variant="node" value="read" className="">
                  Read
                </TabsTrigger>
                <TabsTrigger variant="node" value="settings" className="">
                  Settings
                </TabsTrigger>
              </TabsList>

              {/* Header with Read Button */}
              <div className={EXPANDED_STYLES.header}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {messageCount > 0 && (
                      <Badge variant="icon" className="text-[8px] font-light mr-2">
                        {messageCount} messages
                      </Badge>
                    )}
                    {processedCount > 0 && (
                      <Badge variant="secondary" className="text-[8px] font-light mr-2">
                        {processedCount} processed
                      </Badge>
                    )}
                  </div>
                  <Button
                    onClick={onReadMessages}
                    disabled={!isEnabled || isReading || !canRead}
                    variant="node"
                    size="node"
                  >
                    <Mail className="h-3 w-3 mr-1" />
                    {readButtonText}
                  </Button>
                </div>
              </div>
            </div>

            <TabsContent variant="node" value="read" className="flex-1">
              {/* Account Selection */}
              <div className="space-y-0">
                <div className="min-h-6 border rounded-md border-border px-2">
                  <Label className="text-[10px] self-start pt-1 pl-1 text-muted-foreground w-16 flex items-center">
                    Account
                    <div className="ml-2">
                      <RenderStatusDot
                        eventActive={connectionStatus === "connected"}
                        isProcessing={connectionStatus === "reading" || connectionStatus === "processing"}
                        hasError={connectionStatus === "error"}
                        enableGlow
                        size="sm"
                        titleText={connectionStatus}
                      />
                    </div>
                  </Label>
                  <div className="flex flex-wrap items-center flex-1 min-w-0">
                    <Select
                      value={accountId}
                      onValueChange={(value) => {
                        handleAccountChange({
                          target: { value },
                        } as React.ChangeEvent<HTMLSelectElement>);
                      }}
                      disabled={!isEnabled || isReading}
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

              {/* Number of Messages */}
              <div id="maxMessages" className="border border-border rounded-md flex flex-row items-center">
                <Label className="text-[10px] self-start pt-1 pl-1 text-muted-foreground w-16 flex items-center"># Emails</Label>
                <Input
                  variant="node"
                  type="number"
                  value={maxMessages}
                  onChange={handleMaxMessagesChange}
                  placeholder="10"
                  min="1"
                  max="1000"
                  className={`${INPUT_STYLES.input} ml-1`}
                  disabled={!isEnabled || isReading}
                />
              </div>

              <Separator className="mb-1" />

              {/* Options */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-[10px] text-foreground">
                  <input
                    type="checkbox"
                    checked={includeAttachments}
                    onChange={onIncludeAttachmentsChange}
                    className="h-3 w-3"
                    disabled={!isEnabled}
                  />
                  Include Attachments
                </label>
                <label className="flex items-center gap-2 text-[10px] text-foreground">
                  <input
                    type="checkbox"
                    checked={markAsRead}
                    onChange={onMarkAsReadChange}
                    className="h-3 w-3"
                    disabled={!isEnabled}
                  />
                  Mark as Read
                </label>
                <label className="flex items-center gap-2 text-[10px] text-foreground">
                  <input
                    type="checkbox"
                    checked={enableRealTime}
                    onChange={onEnableRealTimeChange}
                    className="h-3 w-3"
                    disabled={!isEnabled}
                  />
                  Real-time Monitoring
                </label>
              </div>

              {/* Real-time Interval */}
              {enableRealTime && (
                <>
                  <Separator className="mb-1" />
                  <div id="checkInterval" className="border border-border rounded-md flex flex-row items-center">
                    <Label className="text-[10px] self-start pt-1 pl-1 text-muted-foreground w-16 flex items-center">Interval</Label>
                    <Input
                      variant="node"
                      type="number"
                      value={checkInterval}
                      onChange={handleCheckIntervalChange}
                      placeholder="5"
                      min="1"
                      max="60"
                      className={`${INPUT_STYLES.input} ml-1`}
                      disabled={!isEnabled}
                    />
                    <span className="text-[10px] text-muted-foreground pr-2">min</span>
                  </div>
                </>
              )}
            </TabsContent>

            <TabsContent variant="node" value="settings" className="pt-3 space-y-3 m-0">
              {/* Status Information */}
              <div className="space-y-2">
                <Label className={INPUT_STYLES.label}>Status</Label>
                <div className="p-2 bg-muted/30 rounded text-[10px] space-y-1">
                  <div className="flex justify-between">
                    <span>Messages:</span>
                    <span>{messageCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Processed:</span>
                    <span>{processedCount}</span>
                  </div>
                  {formattedLastSync && (
                    <div className="flex justify-between">
                      <span>Last sync:</span>
                      <span>{formattedLastSync}</span>
                    </div>
                  )}
                  {retryCount > 0 && (
                    <div className="flex justify-between text-yellow-600">
                      <span>Retries:</span>
                      <span>{retryCount}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Future settings can go here */}
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Settings className="h-3 w-3" />
                <span>Advanced filtering coming soon</span>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Footer with Status */}
        {(hasError || lastError) && (
          <div className={EXPANDED_STYLES.footer}>
            <div className="flex items-center gap-2 text-xs text-destructive">
              <AlertCircle className="h-3 w-3" />
              <span>{lastError || "An error occurred"}</span>
            </div>
          </div>
        )}
      </div>
    );
  },
  (prev, next) => {
    // Compare primitive props
    if (
      prev.isEnabled !== next.isEnabled ||
      prev.connectionStatus !== next.connectionStatus ||
      prev.canActivate !== next.canActivate
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

    // Compare essential nodeData fields for reader
    const keys: (keyof EmailReaderData)[] = [
      "accountId",
      "maxMessages",
      "includeAttachments",
      "markAsRead",
      "enableRealTime",
      "checkInterval",
      "processedCount",
      "messageCount",
      "lastSync",
      "lastError",
      "retryCount",
    ];
    for (const k of keys) {
      if ((prev.nodeData as any)[k] !== (next.nodeData as any)[k]) return false;
    }
    return true;
  }
);

export default EmailReaderExpanded;