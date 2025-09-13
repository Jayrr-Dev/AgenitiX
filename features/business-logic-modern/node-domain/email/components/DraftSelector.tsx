/**
 * DraftSelector - Component for browsing and selecting Gmail drafts
 * 
 * Features:
 * • List existing drafts with preview
 * • Load selected draft into composer
 * • Delete unwanted drafts
 * • New draft creation
 * • Visual indicators for draft status
 * 
 * Keywords: draft, selector, gmail, browse, management
 */

"use client";

import React, { useState, useCallback, memo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  Mail, 
  Plus, 
  Trash2, 
  Clock,
  Search,
  FileText,
  Loader2,
  RotateCcw,
  Edit3,
  AlertCircle,
  Check
} from "lucide-react";
import { useEmailDraftList } from "../hooks/useEmailDraftList";
import type { EmailDraftData } from "../emailDraft.node";

// Estilos EXACTOS del EmailSender para coherencia
const SELECTOR_STYLES = {
  container: "flex flex-col h-full bg-background border border-border rounded-lg",
  header: "p-3 border-b border-border bg-muted/30",
  content: "flex-1 flex flex-col min-h-0 p-2 space-y-2",
  footer: "p-3 border-t border-border bg-muted/30",
  searchBox: "flex items-center gap-2 mb-2",
  draftList: "flex-1 overflow-y-auto space-y-1",
  draftItem: "p-2 border border-border rounded-md bg-background hover:bg-muted/50 cursor-pointer transition-colors",
  draftItemSelected: "bg-muted border-primary",
  actions: "flex items-center gap-2",
} as const;

const TEXT_STYLES = {
  title: "text-[10px] font-medium text-foreground",
  subtitle: "text-[8px] text-muted-foreground",
  label: "text-[10px] text-muted-foreground",
  button: "text-[10px]",
} as const;

interface DraftSelectorProps {
  nodeData: EmailDraftData;
  updateNodeData: (updates: Partial<EmailDraftData>) => void;
  isEnabled: boolean;
  accountId: string;
}

interface DraftItemProps {
  draft: {
    id: string;
    subject: string;
    snippet: string;
    lastModified: number;
    hasAttachments: boolean;
  };
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  isEnabled: boolean;
}

const DraftItem = memo(function DraftItem({
  draft,
  isSelected,
  onSelect,
  onDelete,
  isEnabled,
}: DraftItemProps) {
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffHours < 24) {
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      });
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  return (
    <div 
      className={`${SELECTOR_STYLES.draftItem} ${isSelected ? SELECTOR_STYLES.draftItemSelected : ''}`}
      onClick={onSelect}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0 mr-2">
          <div className="flex items-center gap-1 mb-1">
            <Mail className="h-3 w-3 text-muted-foreground flex-shrink-0" />
            <span className={`${TEXT_STYLES.title} truncate`}>
              {draft.subject || "No subject"}
            </span>
            {draft.hasAttachments && (
              <FileText className="h-2 w-2 text-muted-foreground flex-shrink-0" />
            )}
          </div>
          <p className={`${TEXT_STYLES.subtitle} truncate mb-1`}>
            {draft.snippet || "Empty draft"}
          </p>
          <div className="flex items-center gap-1">
            <Clock className="h-2 w-2 text-muted-foreground" />
            <span className={TEXT_STYLES.subtitle}>
              {formatTime(draft.lastModified)}
            </span>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 hover:bg-destructive/20 hover:text-destructive"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          disabled={!isEnabled}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
});

export const DraftSelector = memo(function DraftSelector({
  nodeData,
  updateNodeData,
  isEnabled,
  accountId,
}: DraftSelectorProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  // Draft management hook
  const draftList = useEmailDraftList({
    accountId,
    enabled: isEnabled && !!accountId,
    maxResults: 50,
  });

  // Filter drafts based on search
  const filteredDrafts = draftList.drafts.filter(draft => 
    draft.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    draft.snippet.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle draft selection
  const handleSelectDraft = useCallback(async (draftId: string) => {
    if (!isEnabled) return;

    // Load draft details
    const draftDetails = await draftList.loadDraft(draftId);
    if (draftDetails) {
      // Update node data with loaded draft - Set mode to "existing"
      updateNodeData({
        draftId: draftDetails.id,
        draftMode: "existing",
        selectedDraftId: draftId,
        recipients: draftDetails.recipients,
        subject: draftDetails.subject,
        body: draftDetails.body,
        lastSaved: draftDetails.lastModified,
        isExpanded: true,
      });
    }
  }, [draftList, updateNodeData, isEnabled]);

  // Handle draft deletion
  const handleDeleteDraft = useCallback(async (draftId: string) => {
    if (!isEnabled) return;

    setIsDeleting(draftId);
    try {
      const success = await draftList.deleteDraft(draftId);
      if (success) {
        // If this was the selected draft, clear it
        if (nodeData.selectedDraftId === draftId) {
          updateNodeData({
            draftId: undefined,
            selectedDraftId: undefined,
            draftMode: "new",
            recipients: { to: [], cc: [], bcc: [] },
            subject: "",
            body: { text: "", html: "", mode: "text" },
            lastSaved: undefined,
          });
        }
      }
    } finally {
      setIsDeleting(null);
    }
  }, [draftList, isEnabled, nodeData.selectedDraftId, updateNodeData]);

  // Handle new draft creation
  const handleCreateNewDraft = useCallback(() => {
    updateNodeData({
      draftId: undefined,
      selectedDraftId: undefined,
      draftMode: "new",
      recipients: { to: [], cc: [], bcc: [] },
      subject: "",
      body: { text: "", html: "", mode: "text" },
      lastSaved: undefined,
    });
  }, [updateNodeData]);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    draftList.refreshDrafts();
  }, [draftList]);

  return (
    <div className={SELECTOR_STYLES.container}>
      {/* Header */}
      <div className={SELECTOR_STYLES.header}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            <Label className={TEXT_STYLES.title}>Draft Manager</Label>
          </div>
          <Badge variant="outline" className={TEXT_STYLES.subtitle}>
            {draftList.getTotalCount()} drafts
          </Badge>
        </div>
        
        {/* Search and Actions */}
        <div className={SELECTOR_STYLES.searchBox}>
          <div className="flex-1 relative">
            <Search className="absolute left-2 top-1.5 h-3 w-3 text-muted-foreground" />
            <Input
              variant="node"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search drafts..."
              className="pl-7 h-6 text-[10px]"
              disabled={!isEnabled}
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-6 px-2"
            onClick={handleRefresh}
            disabled={!isEnabled || draftList.isLoading}
          >
            {draftList.isLoading ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <RotateCcw className="h-3 w-3" />
            )}
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className={SELECTOR_STYLES.content}>
        {/* New Draft Button */}
        <Button
          variant="outline"
          size="sm"
          className={`w-full justify-start text-[10px] ${
            nodeData.draftMode === "new" ? "bg-muted border-primary" : ""
          }`}
          onClick={handleCreateNewDraft}
          disabled={!isEnabled}
        >
          <Plus className="h-3 w-3 mr-2" />
          Create New Draft
        </Button>

        <Separator />

        {/* Drafts List */}
        <div className={SELECTOR_STYLES.draftList}>
          {draftList.isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              <span className={TEXT_STYLES.subtitle}>Loading drafts...</span>
            </div>
          ) : draftList.error ? (
            <div className="flex items-center justify-center py-8">
              <AlertCircle className="h-4 w-4 text-destructive mr-2" />
              <span className={`${TEXT_STYLES.subtitle} text-destructive`}>
                {draftList.error}
              </span>
            </div>
          ) : filteredDrafts.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <FileText className="h-4 w-4 text-muted-foreground mr-2" />
              <span className={TEXT_STYLES.subtitle}>
                {searchQuery ? "No drafts match your search" : "No drafts found"}
              </span>
            </div>
          ) : (
            <div className="space-y-1 group">
              {filteredDrafts.map((draft) => (
                <DraftItem
                  key={draft.id}
                  draft={draft}
                  isSelected={nodeData.selectedDraftId === draft.id}
                  onSelect={() => handleSelectDraft(draft.id)}
                  onDelete={() => handleDeleteDraft(draft.id)}
                  isEnabled={isEnabled && isDeleting !== draft.id}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className={SELECTOR_STYLES.footer}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {nodeData.draftMode === "existing" && nodeData.selectedDraftId ? (
              <>
                <Edit3 className="h-3 w-3 text-green-500" />
                <span className={`${TEXT_STYLES.subtitle} text-green-500`}>
                  Editing existing draft
                </span>
              </>
            ) : (
              <>
                <Plus className="h-3 w-3 text-blue-500" />
                <span className={`${TEXT_STYLES.subtitle} text-blue-500`}>
                  Creating new draft
                </span>
              </>
            )}
          </div>
          
          {draftList.isLoadingDraft && (
            <div className="flex items-center gap-2">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span className={TEXT_STYLES.subtitle}>Loading...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

DraftSelector.displayName = "DraftSelector";

export default DraftSelector;
