"use client";
/**
 * StoreSheetCollapsed – Professional collapsed view following emailMessage design principles
 *
 * • 10px text consistency throughout
 * • SkueButton for primary interactions
 * • RenderStatusDot for connection states
 * • Proper spacing and gradients matching emailMessage
 * • Smooth transitions and hover effects
 *
 * Keywords: store-sheet, collapsed, professional-ui, google-sheets
 */

import RenderStatusDot from "@/components/RenderStatusDot";
import { memo, useMemo } from "react";
import { FiDatabase } from "react-icons/fi";
import SkueButton from "@/components/ui/skue-button";
import type { StoreSheetData } from "../storeSheet.node";

const COLLAPSED_STYLES = {
  container: "flex items-center justify-center w-full h-full",
  content: "p-3 text-center space-y-3 mt-2",
  iconButton:
    "relative w-10 h-10 bg-gradient-to-br from-white to-gray-50 dark:from-gray-100 dark:to-gray-200 rounded-full flex items-center justify-center transform transition-all duration-300 hover:scale-105 active:scale-95 shadow-[0_8px_32px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.3)] cursor-pointer",
  iconWrapper: "relative z-10 text-white dark:text-black opacity-75",
  textInfo: "space-y-1",
  primaryText: "font-medium text-[10px] truncate",
  statusIndicator: "flex items-center justify-center gap-1",
} as const;

interface StoreSheetCollapsedProps {
  nodeData: StoreSheetData;
  categoryStyles: { primary: string; secondary: string };
  onToggleExpand?: () => void;
  onConnect?: () => void;
}

export const StoreSheetCollapsed = memo(
  ({
    nodeData,
    categoryStyles,
    onToggleExpand,
    onConnect,
  }: StoreSheetCollapsedProps) => {
    const { 
      rowsStored, 
      connectionStatus, 
      spreadsheetId, 
      sheetName,
      isAuthenticated 
    } = nodeData;

    const statusProps = useMemo(() => {
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

    const displayText = useMemo(() => {
      if (spreadsheetId && sheetName) {
        return `${rowsStored} rows stored`;
      }
      return "No sheet configured";
    }, [spreadsheetId, sheetName, rowsStored]);

    const sheetDisplayName = useMemo(() => {
      if (!spreadsheetId) return "No sheet";
      if (sheetName) return sheetName;
      return `Sheet ${spreadsheetId.slice(0, 8)}...`;
    }, [spreadsheetId, sheetName]);

    return (
      <div className={COLLAPSED_STYLES.container}>
        <div className={COLLAPSED_STYLES.content}>
          {/* Icon */}
          <div className="flex justify-center">
            <SkueButton
              onClick={connectionStatus === "disconnected" ? onConnect : onToggleExpand}
              className={COLLAPSED_STYLES.iconButton}
              aria-label={connectionStatus === "disconnected" ? "Connect to Google Sheets" : "Expand node"}
            >
              <div className={COLLAPSED_STYLES.iconWrapper}>
                <FiDatabase size={16} />
              </div>
            </SkueButton>
          </div>

          {/* Text Info */}
          <div className={COLLAPSED_STYLES.textInfo}>
            <div className={`${COLLAPSED_STYLES.primaryText} ${categoryStyles.primary}`}>
              {sheetDisplayName}
            </div>
            <div className={`text-[10px] text-muted-foreground`}>
              {displayText}
            </div>
          </div>

          {/* Status Indicator */}
          <div className={COLLAPSED_STYLES.statusIndicator}>
            <RenderStatusDot {...statusProps} />
            <span className="text-[10px] text-muted-foreground ml-1">
              {statusProps.titleText}
            </span>
          </div>
        </div>
      </div>
    );
  }
);

StoreSheetCollapsed.displayName = "StoreSheetCollapsed";