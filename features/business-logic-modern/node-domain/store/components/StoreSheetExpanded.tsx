"use client";
/**
 * StoreSheetExpanded – Professional expanded view following emailMessage design principles
 *
 * • Clean, focused interface for Google Sheets configuration
 * • 10px text consistency and proper spacing
 * • Professional form controls and status indicators
 * • Real-time connection status and sync controls
 * • Maintains compatibility with node architecture
 *
 * Keywords: store-sheet, expanded, google-sheets, professional-ui
 */

import * as React from "react";
import { FiDatabase, FiSettings, FiRefreshCw, FiCheck, FiAlertCircle } from "react-icons/fi";
import RenderStatusDot from "@/components/RenderStatusDot";
import SkueButton from "@/components/ui/skue-button";
import type { StoreSheetData } from "../storeSheet.node";

// Professional expanded styles following emailMessage patterns
const EXPANDED_STYLES = {
  container: "w-full h-full p-3 space-y-3",
  disabled: "opacity-75 pointer-events-none",
  
  // Header section
  header: "flex items-center justify-between pb-2 border-b border-border/20",
  headerTitle: "flex items-center gap-2 text-[10px] font-medium",
  headerIcon: "text-muted-foreground",
  
  // Configuration sections
  section: "space-y-2",
  sectionTitle: "text-[10px] font-medium text-muted-foreground uppercase tracking-wide",
  
  // Form controls
  formGroup: "space-y-1",
  label: "text-[10px] font-medium text-foreground",
  input: "w-full px-2 py-1 text-[10px] border border-border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent transition-colors",
  select: "w-full px-2 py-1 text-[10px] border border-border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent transition-colors",
  
  // Status section
  statusSection: "bg-muted/20 rounded-lg p-3 space-y-2",
  statusRow: "flex items-center justify-between",
  statusLabel: "text-[10px] font-medium text-muted-foreground",
  statusValue: "text-[10px] font-medium",
  
  // Action buttons
  buttonGroup: "flex gap-2 pt-2",
  primaryButton: "flex-1 px-3 py-2 text-[10px] font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
  secondaryButton: "flex-1 px-3 py-2 text-[10px] font-medium border border-border rounded-md hover:bg-muted/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
  
  // Data preview
  dataPreview: "bg-muted/10 rounded-md p-2 max-h-20 overflow-y-auto",
  dataText: "text-[10px] font-mono text-muted-foreground",
} as const;

export interface StoreSheetExpandedProps {
  nodeId: string;
  nodeData: StoreSheetData;
  isEnabled: boolean;
  connectionStatus: StoreSheetData["connectionStatus"];
  onConnect?: () => void;
  onSync?: () => void;
}

export const StoreSheetExpanded = React.memo(
  function StoreSheetExpanded(props: StoreSheetExpandedProps) {
    const {
      nodeId,
      nodeData,
      isEnabled,
      connectionStatus,
      onConnect,
      onSync,
    } = props;

    const {
      spreadsheetId,
      sheetName,
      rowsStored,
      lastSyncTime,
      lastError,
      inputData,
      isAuthenticated,
    } = nodeData;

    // Status indicators
    const statusProps = React.useMemo(() => {
      const isConnected = connectionStatus === "connected" || connectionStatus === "synced";
      const isConnecting = connectionStatus === "connecting";
      const isSyncing = connectionStatus === "syncing";
      const isError = connectionStatus === "error";

      return {
        eventActive: isConnected,
        isProcessing: isConnecting || isSyncing,
        hasError: isError,
        enableGlow: true,
        size: "sm" as const,
        titleText: isError
          ? "error"
          : isSyncing
            ? "syncing"
          : isConnecting
            ? "connecting"
          : isConnected
            ? "connected"
            : "disconnected",
      };
    }, [connectionStatus]);

    // Format last sync time
    const lastSyncDisplay = React.useMemo(() => {
      if (!lastSyncTime) return "Never";
      return new Date(lastSyncTime).toLocaleString();
    }, [lastSyncTime]);

    // Can connect/sync checks
    const canConnect = spreadsheetId && !isConnecting && connectionStatus === "disconnected";
    const canSync = inputData && connectionStatus === "connected" && !isSyncing;

    return (
      <div
        className={`${EXPANDED_STYLES.container} ${isEnabled ? "" : EXPANDED_STYLES.disabled}`}
      >
        {/* Header */}
        <div className={EXPANDED_STYLES.header}>
          <div className={EXPANDED_STYLES.headerTitle}>
            <FiDatabase className={EXPANDED_STYLES.headerIcon} size={12} />
            Google Sheets Storage
          </div>
          <RenderStatusDot {...statusProps} />
        </div>

        {/* Configuration Section */}
        <div className={EXPANDED_STYLES.section}>
          <div className={EXPANDED_STYLES.sectionTitle}>Configuration</div>
          
          <div className={EXPANDED_STYLES.formGroup}>
            <label className={EXPANDED_STYLES.label}>Spreadsheet ID</label>
            <input
              type="text"
              className={EXPANDED_STYLES.input}
              value={spreadsheetId}
              placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
              readOnly
            />
          </div>

          <div className={EXPANDED_STYLES.formGroup}>
            <label className={EXPANDED_STYLES.label}>Sheet Name</label>
            <input
              type="text"
              className={EXPANDED_STYLES.input}
              value={sheetName}
              placeholder="Sheet1"
              readOnly
            />
          </div>
        </div>

        {/* Status Section */}
        <div className={EXPANDED_STYLES.statusSection}>
          <div className={EXPANDED_STYLES.statusRow}>
            <span className={EXPANDED_STYLES.statusLabel}>Connection Status</span>
            <div className="flex items-center gap-1">
              <RenderStatusDot {...statusProps} />
              <span className={EXPANDED_STYLES.statusValue}>
                {statusProps.titleText}
              </span>
            </div>
          </div>

          <div className={EXPANDED_STYLES.statusRow}>
            <span className={EXPANDED_STYLES.statusLabel}>Rows Stored</span>
            <span className={EXPANDED_STYLES.statusValue}>{rowsStored}</span>
          </div>

          <div className={EXPANDED_STYLES.statusRow}>
            <span className={EXPANDED_STYLES.statusLabel}>Last Sync</span>
            <span className={EXPANDED_STYLES.statusValue}>{lastSyncDisplay}</span>
          </div>

          {lastError && (
            <div className={EXPANDED_STYLES.statusRow}>
              <span className={EXPANDED_STYLES.statusLabel}>Error</span>
              <span className="text-[10px] text-destructive font-medium truncate max-w-32">
                {lastError}
              </span>
            </div>
          )}
        </div>

        {/* Input Data Preview */}
        {inputData && (
          <div className={EXPANDED_STYLES.section}>
            <div className={EXPANDED_STYLES.sectionTitle}>Input Data Preview</div>
            <div className={EXPANDED_STYLES.dataPreview}>
              <div className={EXPANDED_STYLES.dataText}>
                {JSON.stringify(inputData, null, 2).substring(0, 200)}
                {JSON.stringify(inputData).length > 200 && "..."}
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className={EXPANDED_STYLES.buttonGroup}>
          {connectionStatus === "disconnected" ? (
            <button
              className={EXPANDED_STYLES.primaryButton}
              onClick={onConnect}
              disabled={!canConnect || !isEnabled}
            >
              <FiDatabase size={12} className="inline mr-1" />
              Connect
            </button>
          ) : (
            <button
              className={EXPANDED_STYLES.secondaryButton}
              onClick={onSync}
              disabled={!canSync || !isEnabled}
            >
              <FiRefreshCw size={12} className="inline mr-1" />
              Sync Data
            </button>
          )}
          
          <button
            className={EXPANDED_STYLES.secondaryButton}
            disabled={!isEnabled}
          >
            <FiSettings size={12} className="inline mr-1" />
            Configure
          </button>
        </div>
      </div>
    );
  },
  (prev, next) => {
    // Optimize re-renders by comparing essential props
    return (
      prev.isEnabled === next.isEnabled &&
      prev.connectionStatus === next.connectionStatus &&
      prev.nodeData.spreadsheetId === next.nodeData.spreadsheetId &&
      prev.nodeData.sheetName === next.nodeData.sheetName &&
      prev.nodeData.rowsStored === next.nodeData.rowsStored &&
      prev.nodeData.lastSyncTime === next.nodeData.lastSyncTime &&
      prev.nodeData.lastError === next.nodeData.lastError &&
      JSON.stringify(prev.nodeData.inputData) === JSON.stringify(next.nodeData.inputData)
    );
  }
);

StoreSheetExpanded.displayName = "StoreSheetExpanded";