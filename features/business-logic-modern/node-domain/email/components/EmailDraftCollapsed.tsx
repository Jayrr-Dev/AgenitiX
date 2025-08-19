/**
 * EmailDraftCollapsed - Vista compacta siguiendo exactamente los principios del EmailSender
 * 
 * • Tamaño de texto: 10px consistente
 * • Status dot con glow y estados de procesamiento
 * • Botón central (compose) con estados
 * • Espaciado y padding exacto como EmailSender
 * • Información resumida del draft
 */

import React, { memo, useMemo } from "react";
import { Edit3, Mail, Save, AlertCircle, LoaderCircle, Plus, FileEdit } from "lucide-react";
import RenderStatusDot from "@/components/RenderStatusDot";
import SkueButton from "@/components/ui/skue-button";
import type { EmailDraftData } from "../emailDraft.node";
import { LuMail } from "react-icons/lu";

// Estilos exactos del EmailSender
const COLLAPSED_STYLES = {
  container: "flex items-center justify-center w-full h-full",
  content: "p-3 text-center space-y-3 mt-2",
  textInfo: "space-y-1",
  primaryText: "font-medium text-[10px] truncate",
  statusIndicator: "flex items-center justify-center gap-1",
} as const;

interface EmailDraftCollapsedProps {
  nodeData: EmailDraftData;
  isEnabled: boolean;
  categoryStyles: { primary: string };
  onToggleExpand?: () => void;
}

export const EmailDraftCollapsed = memo(
  ({
    nodeData,
    isEnabled,
    categoryStyles,
    onToggleExpand,
  }: EmailDraftCollapsedProps) => {
    const { recipients, subject, lastSaved, autoSave, draftId, draftMode, selectedDraftId } = nodeData;

    // Estado del draft siguiendo la lógica del EmailSender
    const draftStatus = useMemo(() => {
      const hasRecipients = recipients?.to?.length > 0;
      const hasSubject = subject?.trim().length > 0;
      const hasChanges = !lastSaved || Date.now() - lastSaved > 5000;
      
      if (!hasRecipients && !hasSubject) {
        return "empty";
      }
      
      if (hasChanges && autoSave) {
        return "saving";
      }
      
      if (hasRecipients && hasSubject) {
        return "ready";
      }
      
      return "composing";
    }, [recipients, subject, lastSaved, autoSave]);

    // Props del status dot siguiendo el patrón del EmailSender
    const statusProps = useMemo(() => {
      const isReady = draftStatus === "ready";
      const isSaving = draftStatus === "saving";
      const isEmpty = draftStatus === "empty";

      return {
        eventActive: isReady,
        isProcessing: isSaving,
        hasError: false,
        enableGlow: true,
        size: "sm" as const,
        titleText: isEmpty
          ? "neutral"
          : isSaving
            ? "processing"
            : isReady
              ? "active"
              : "neutral",
      };
    }, [draftStatus]);

    // Texto a mostrar siguiendo el patrón del EmailSender
    const displayText = useMemo(() => {
      // Show mode info if relevant
      if (draftMode === "existing" && selectedDraftId) {
        return "Editing draft";
      }
      if (draftMode === "browse") {
        return "Browse drafts";
      }
      
      // Otherwise show recipient count
      const recipientCount = recipients?.to?.length || 0;
      
      if (recipientCount > 0) {
        const mainRecipient = recipients?.to?.[0] || "";
        const emailPart = mainRecipient.includes("@") 
          ? mainRecipient.split("@")[0] 
          : mainRecipient;
        return recipientCount > 1 
          ? `${emailPart} +${recipientCount - 1}`
          : emailPart;
      }
      
      return "No recipient";
    }, [recipients, draftMode, selectedDraftId]);

    // Icono basado en el estado
    const IconComponent = useMemo(() => {
      // First check mode
      if (draftMode === "existing" && selectedDraftId) {
        return FileEdit; // Editing existing draft
      }
      if (draftMode === "new") {
        return Plus; // Creating new draft
      }
      
      // Then check status
      switch (draftStatus) {
        case "saving":
          return Save;
        case "ready":
          return Mail;
        case "empty":
          return AlertCircle;
        default:
          return Edit3;
      }
    }, [draftStatus, draftMode, selectedDraftId]);

    // Estado de procesamiento para el botón
    const isProcessing = draftStatus === "saving";

    return (
      <div className={COLLAPSED_STYLES.container}>
        <div className={COLLAPSED_STYLES.content}>
          {/* Botón central siguiendo el patrón del EmailSender */}
          <div className="flex justify-center">
            <SkueButton
              ariaLabel="Compose"
              title="Compose Draft"
              checked={false}
              processing={isProcessing}
              onCheckedChange={(checked) => {
                if (checked) onToggleExpand?.();
              }}
              size="sm"
              className={`cursor-pointer translate-y-2 ${!isEnabled ? 'opacity-50 pointer-events-none' : ''}`}
              style={{ transform: "scale(1.1)", transformOrigin: "center" }}
              surfaceBgVar="--node-email-bg"
            >
              <IconComponent />
            </SkueButton>
          </div>

          {/* Texto y Status siguiendo el layout del EmailSender */}
          <div className={COLLAPSED_STYLES.textInfo}>
            <div
              className={`${COLLAPSED_STYLES.primaryText} ${categoryStyles.primary}`}
            >
              {displayText}
            </div>
            <div className={COLLAPSED_STYLES.statusIndicator}>
              <RenderStatusDot {...statusProps} />
            </div>
          </div>

          {/* Subject preview si existe, texto 10px como EmailSender */}
          {subject && subject.trim() && (
            <div className="text-[10px] text-muted-foreground truncate max-w-[80px]">
              {subject.length > 12 ? `${subject.substring(0, 12)}...` : subject}
            </div>
          )}
        </div>
      </div>
    );
  }
);

EmailDraftCollapsed.displayName = "EmailDraftCollapsed";

export default EmailDraftCollapsed;