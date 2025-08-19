/**
 * StoreSheet NODE – Google Sheets integration with OAuth2 authentication
 *
 * • Stores JSON data to Google Sheets using existing Gmail OAuth2 authentication
 * • Professional collapsed/expanded views with improved UX
 * • Real-time connection status and data sync indicators
 * • Auto-detects spreadsheet ID from URLs
 * • Schema-driven with type-safe validation
 *
 * Keywords: store-sheet, google-sheets, json-storage, oauth2-auth
 */

import type { NodeProps } from "@xyflow/react";
import { memo, useCallback, useEffect, useMemo, useRef } from "react";
import { z } from "zod";

import { ExpandCollapseButton } from "@/components/nodes/ExpandCollapseButton";
import LabelNode from "@/components/nodes/labelNode";
import type { NodeSpec } from "@/features/business-logic-modern/infrastructure/node-core/NodeSpec";
import { renderLucideIcon } from "@/features/business-logic-modern/infrastructure/node-core/utils/iconUtils";
import { normalizeHandleId } from "@/features/business-logic-modern/infrastructure/node-core/utils/handleOutputUtils";
import {
	SafeSchemas,
	createSafeInitialData,
} from "@/features/business-logic-modern/infrastructure/node-core/utils/schema-helpers";
import {
	createNodeValidator,
	reportValidationError,
	useNodeDataValidation,
} from "@/features/business-logic-modern/infrastructure/node-core/utils/validation";
import { withNodeScaffold } from "@/features/business-logic-modern/infrastructure/node-core/withNodeScaffold";
import { CATEGORIES } from "@/features/business-logic-modern/infrastructure/theming/categories";
import {
	COLLAPSED_SIZES,
	EXPANDED_SIZES,
} from "@/features/business-logic-modern/infrastructure/theming/sizing";
import { useNodeData } from "@/hooks/useNodeData";
import { useStore } from "@xyflow/react";

import { useNodeToast } from "@/hooks/useNodeToast";

import { extractSpreadsheetId } from "./services/googleSheetsService";

// Convex imports
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";

// -----------------------------------------------------------------------------
// 1️⃣  Data schema & validation
// -----------------------------------------------------------------------------

export const StoreSheetDataSchema = z
	.object({
		// Google Sheets Configuration
		spreadsheetId: SafeSchemas.text(""),
		sheetName: SafeSchemas.text("Sheet1"),
		
		// Connected Account Data (from emailAccount node)
		connectedAccount: z.any().optional(), // Account data from emailAccount node
		accountEmail: SafeSchemas.text(""), // Email from connected account

		// Connection & Status
		connectionStatus: z
			.enum(["disconnected", "connecting", "connected", "error"])
			.default("disconnected"),
		isAuthenticated: SafeSchemas.boolean(false),
		lastSyncTime: SafeSchemas.text(""),
		lastError: SafeSchemas.text(""),
		requiresAuth: SafeSchemas.boolean(false),

		// Spreadsheet Info
		spreadsheetTitle: SafeSchemas.text(""),
		availableSheets: z.array(z.string()).default([]),

		// Data Management
		inputData: z.any().optional(),
		rowsStored: z.number().default(0),
		autoSync: SafeSchemas.boolean(true),
		syncInterval: z.number().default(5000), // 5 seconds

		// UI State
		isEnabled: SafeSchemas.boolean(true),
		isActive: SafeSchemas.boolean(false),
		isExpanded: SafeSchemas.boolean(false),
		expandedSize: SafeSchemas.text("VE2"),
		collapsedSize: SafeSchemas.text("C2"),

		// Output
		syncOutput: SafeSchemas.boolean(false),
		statusOutput: SafeSchemas.text("disconnected"),

		// Node metadata
		label: z.string().optional(),
	})
	.passthrough();

export type StoreSheetData = z.infer<typeof StoreSheetDataSchema>;

const validateNodeData = createNodeValidator(StoreSheetDataSchema, "StoreSheet");

// -----------------------------------------------------------------------------
// 2️⃣  Constants & Utilities - Professional STORE theming inspired by TRIGGER
// -----------------------------------------------------------------------------

const CATEGORY_TEXT = {
	STORE: {
		primary: "text-[--node-store-text]",
		secondary: "text-[--node-store-text-secondary]",
		connected: "text-green-500",
		disconnected: "text-red-500",
		syncing: "text-blue-500",
		error: "text-red-600",
	},
} as const;

const CONTENT = {
	// Professional expanded layout with STORE theming (teal/cyan gradients)
	expanded:
		"p-3 w-full h-full flex flex-col bg-gradient-to-br from-teal-50 to-cyan-100 dark:from-teal-900/30 dark:to-cyan-900/30 rounded-lg border border-teal-200 dark:border-teal-700 shadow-sm",

	// Professional collapsed layout with STORE theming  
	collapsed:
		"flex items-center justify-center w-full h-full bg-gradient-to-br from-teal-50 to-cyan-100 dark:from-teal-900/30 dark:to-cyan-900/30 rounded-lg border border-teal-200 dark:border-teal-700 shadow-sm",

	header: "flex items-center justify-between mb-2",
	body: "flex-1 flex flex-col gap-2",
	disabled: "opacity-60 grayscale transition-all duration-300",

	// Active indicator with STORE theming
	activeIndicator: "absolute top-1 right-1 w-2 h-2 bg-green-400 rounded-full animate-pulse",

	// Professional configuration sections
	configSection:
		"bg-white dark:bg-slate-800 rounded-lg p-2 border border-teal-200 dark:border-teal-700 shadow-sm",
	configHeader:
		"text-[8px] font-semibold text-teal-700 dark:text-teal-300 mb-1 flex items-center gap-1",
	configGrid: "grid grid-cols-1 gap-1",

	// Professional form controls with STORE theming
	formGroup: "flex flex-col gap-1",
	formRow: "flex items-center justify-between gap-1",
	label:
		"text-[8px] font-medium text-teal-600 dark:text-teal-400 min-w-0 flex-shrink-0",
	input:
		"flex-1 min-w-0 px-1.5 py-0.5 text-[8px] border border-teal-300 dark:border-teal-600 rounded-md bg-white dark:bg-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-transparent transition-colors",
	select:
		"flex-1 min-w-0 px-1.5 py-0.5 text-[8px] border border-teal-300 dark:border-teal-600 rounded-md bg-white dark:bg-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-transparent transition-colors",
	textarea:
		"flex-1 min-w-0 px-1.5 py-0.5 text-[8px] border border-teal-300 dark:border-teal-600 rounded-md bg-white dark:bg-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-transparent transition-colors resize-none",

	// Professional status section with STORE theming
	statusSection:
		"bg-gradient-to-r from-teal-50 to-cyan-100 dark:from-teal-800 dark:to-cyan-700 rounded-lg p-2 border border-teal-200 dark:border-teal-700",

	// Control buttons with STORE theming
	buttonPrimary:
		"px-2 py-1 text-[8px] font-medium text-white bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 disabled:from-slate-400 disabled:to-slate-500 disabled:cursor-not-allowed rounded-md transition-all duration-200 shadow-sm hover:shadow-md",
	buttonSecondary:
		"px-2 py-1 text-[8px] font-medium text-teal-600 dark:text-teal-400 bg-white dark:bg-slate-700 border border-teal-300 dark:border-teal-600 hover:bg-teal-50 dark:hover:bg-slate-600 rounded-md transition-all duration-200",

	// Professional collapsed view with STORE theming
	collapsedIcon: "text-lg mb-1 text-teal-600 dark:text-teal-400",
	collapsedTitle:
		"text-[10px] font-semibold text-slate-700 dark:text-slate-300 mb-1",
	collapsedSubtitle: "text-[8px] text-slate-500 dark:text-slate-400",
	collapsedStatus: "mt-1 px-1 py-0.5 rounded-full text-[8px] font-medium",
	collapsedConnected:
		"bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
	collapsedDisconnected:
		"bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
	collapsedConnecting:
		"bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
	collapsedError:
		"bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
} as const;

// -----------------------------------------------------------------------------
// 3️⃣  Dynamic spec factory (pure)
// -----------------------------------------------------------------------------

/**
 * Builds a NodeSpec whose size keys can change at runtime via node data.
 */
function createDynamicSpec(data: StoreSheetData): NodeSpec {
	const expanded =
		EXPANDED_SIZES[data.expandedSize as keyof typeof EXPANDED_SIZES] ?? EXPANDED_SIZES.VE2;
	const collapsed =
		COLLAPSED_SIZES[data.collapsedSize as keyof typeof COLLAPSED_SIZES] ?? COLLAPSED_SIZES.C2;

	return {
		kind: "storeSheet",
		displayName: "Store Sheet",
		label: "Store Sheet",
		category: CATEGORIES.STORE,
		size: { expanded, collapsed },
		handles: [
			{
				id: "account-input",
				code: "account", // Match exactly with emailAccount output code
				position: "top",
				type: "target",
				dataType: "JSON", // Match exactly with emailAccount output dataType
			},
			{
				id: "data-input",
				code: "j",
				position: "left",
				type: "target",
				dataType: "JSON",
			},
			{
				id: "sync-output",
				code: "b",
				position: "right",
				type: "source",
				dataType: "Boolean",
			},
			{
				id: "status-output",
				code: "s",
				position: "bottom",
				type: "source",
				dataType: "String",
			},
		],
		inspector: { key: "StoreSheetInspector" },
		version: 1,
		runtime: { execute: "storeSheet_execute_v1" },
		initialData: createSafeInitialData(StoreSheetDataSchema, {
			spreadsheetId: "",
			sheetName: "Sheet1",
			connectedAccount: undefined,
			accountEmail: "",
			connectionStatus: "disconnected",
			isAuthenticated: false,
			lastSyncTime: "",
			lastError: "",
			requiresAuth: false,
			spreadsheetTitle: "",
			availableSheets: [],
			rowsStored: 0,
			autoSync: true,
			syncInterval: 5000,
			syncOutput: false,
			statusOutput: "disconnected",
		}),
		dataSchema: StoreSheetDataSchema,
		controls: {
			autoGenerate: true,
			excludeFields: [
				"isActive",
				"inputData",
				"syncOutput",
				"statusOutput",
				"expandedSize",
				"collapsedSize",
				"lastSyncTime",
				"lastError",
				"rowsStored",
				"requiresAuth",
				"spreadsheetTitle",
				"availableSheets",
				"connectedAccount",
				"accountEmail",
			],
			customFields: [
				{ key: "isEnabled", type: "boolean", label: "Enable" },
				{
					key: "spreadsheetId",
					type: "text",
					label: "Spreadsheet ID or URL",
					placeholder: "Paste Google Sheets URL or ID here",
				},
				{ key: "sheetName", type: "text", label: "Sheet Name", placeholder: "Sheet1" },
				{ key: "autoSync", type: "boolean", label: "Auto Sync" },
				{ key: "syncInterval", type: "number", label: "Sync Interval (ms)" },
				{ key: "isExpanded", type: "boolean", label: "Expand" },
			],
		},
		icon: "LuDatabase",
		author: "Agenitix Team",
		description: "Store JSON data in Google Sheets with real-time sync and connection management",
		feature: "store",
		tags: ["google-sheets", "storage", "database", "sync", "spreadsheet"],
		theming: {},
	};
}

/** Static spec for registry (uses default size keys) */
export const spec: NodeSpec = createDynamicSpec({
	expandedSize: "VE2",
	collapsedSize: "C2",
} as StoreSheetData);

// -----------------------------------------------------------------------------
// 4️⃣  React component – data propagation & rendering
// -----------------------------------------------------------------------------

const StoreSheetNode = memo(({ id, data }: NodeProps) => {
	// -------------------------------------------------------------------------
	// 4.1  Sync with React‑Flow store
	// -------------------------------------------------------------------------
	const { nodeData, updateNodeData } = useNodeData(id, data);

	// -------------------------------------------------------------------------
	// 4.2  Derived state
	// -------------------------------------------------------------------------
	const typedNodeData: StoreSheetData = nodeData as StoreSheetData;
	const { 
		isExpanded, 
		isEnabled, 
		isActive, 
		connectionStatus, 
		spreadsheetId, 
		inputData,
		sheetName,
		requiresAuth,
		connectedAccount,
		accountEmail
	} = typedNodeData;

	// 4.2  Global React‑Flow store (nodes & edges) – triggers re‑render on change
	const nodes = useStore((s) => s.nodes);
	const edges = useStore((s) => s.edges);

	// Keep last emitted outputs to avoid redundant writes
	const lastSyncOutputRef = useRef<boolean | null>(null);
	const lastStatusOutputRef = useRef<string | null>(null);

	const categoryStyles = CATEGORY_TEXT.STORE;
	const toast = useNodeToast(id);

	// -------------------------------------------------------------------------
	// 4.3  Convex actions
	// -------------------------------------------------------------------------
	
	// Actions for Google Sheets integration
	const testConnection = useAction(api.googleSheets.testGoogleSheetsConnection);
	const syncData = useAction(api.googleSheets.syncDataToGoogleSheets);

	// -------------------------------------------------------------------------
	// 4.4  Callbacks
	// -------------------------------------------------------------------------

	/** Toggle between collapsed / expanded */
	const toggleExpand = useCallback(() => {
		updateNodeData({ isExpanded: !isExpanded });
	}, [isExpanded, updateNodeData]);

	/** Connect to Google Sheets */
	const handleConnect = useCallback(async () => {
		if (!spreadsheetId) {
			toast.showError("Please provide a Spreadsheet ID or URL");
			return;
		}

		// Check if we have a connected account
		const currentData = typedNodeData;
		if (!currentData.connectedAccount || !currentData.accountEmail) {
			toast.showError("Please connect an Email Account node first");
			updateNodeData({ 
				requiresAuth: true,
				connectionStatus: "error",
				lastError: "No email account connected - please connect an Email Account node"
			});
			return;
		}

		// Check if the connected account is Gmail
		if (currentData.connectedAccount?.provider !== 'gmail') {
			toast.showError("Google Sheets requires a Gmail account. Please connect a Gmail account.");
			updateNodeData({ 
				connectionStatus: "error",
				lastError: "Google Sheets requires Gmail authentication"
			});
			return;
		}

		updateNodeData({ connectionStatus: "connecting", lastError: "" });

		try {


			const result = await testConnection({
				spreadsheetId,
				accountId: currentData.connectedAccount?.accountId as any,
			});

			if (result.success && result.spreadsheetInfo) {
				updateNodeData({
					connectionStatus: "connected",
					isAuthenticated: true,
					lastSyncTime: new Date().toISOString(),
					lastError: "",
					requiresAuth: false,
					spreadsheetTitle: result.spreadsheetInfo.title,
					availableSheets: result.spreadsheetInfo.sheets,
				});

				toast.showSuccess(`Connected to "${result.spreadsheetInfo.title}" using ${currentData.accountEmail}`);
			} else {
				updateNodeData({
					connectionStatus: "error",
					lastError: result.error || "Connection failed",
					isAuthenticated: false,
					requiresAuth: result.requiresAuth || false,
				});
				
				if (result.requiresAuth || (result.error && result.error.includes("Authentication required"))) {
					toast.showError("Gmail account needs Google Sheets permissions. Please reconnect your Gmail account and grant Google Sheets access.");
				} else {
					toast.showError(result.error || "Failed to connect to Google Sheets");
				}
			}
		} catch (error) {
			updateNodeData({
				connectionStatus: "error",
				lastError: error instanceof Error ? error.message : "Connection failed",
				isAuthenticated: false,
			});
			toast.showError("Failed to connect to Google Sheets");
		}
	}, [spreadsheetId, nodeData, testConnection, updateNodeData, toast]);

	/** Sync data to Google Sheets */
	const handleSync = useCallback(async () => {
		if (!inputData) {
			toast.showError("No data to sync. Connect a data source or use 'Send Test Data'");
			return;
		}

		if (connectionStatus !== "connected") {
			toast.showError("Please connect to Google Sheets first");
			return;
		}

		if (!spreadsheetId || !sheetName) {
			toast.showError("Spreadsheet ID and sheet name are required");
			return;
		}

		const currentData = typedNodeData;
		if (!currentData.connectedAccount) {
			toast.showError("No email account connected");
			return;
		}

		try {
			const result = await syncData({
				spreadsheetId,
				sheetName,
				data: inputData,
				accountId: currentData.connectedAccount?.accountId as any,
			});

			if (result.success) {
				const newRowCount = currentData.rowsStored + result.rowsAffected;

				updateNodeData({
					rowsStored: newRowCount,
					lastSyncTime: new Date().toISOString(),
					lastError: "",
					syncOutput: true,
				});

				toast.showSuccess(`Synced ${result.rowsAffected} row(s) to ${currentData.spreadsheetTitle || 'Google Sheets'}`);
			} else {
				updateNodeData({
					lastError: result.error || "Sync failed",
					syncOutput: false,
				});
				toast.showError(result.error || "Failed to sync data");
			}
		} catch (error) {
			updateNodeData({
				lastError: error instanceof Error ? error.message : "Sync failed",
				syncOutput: false,
			});
			toast.showError("Failed to sync data");
		}
	}, [inputData, connectionStatus, spreadsheetId, sheetName, nodeData, syncData, updateNodeData, toast]);

	/** Propagate outputs ONLY when node is active AND enabled */
	const propagateOutputs = useCallback(() => {
		const shouldSend = isActive && isEnabled;

		const syncOut = shouldSend ? typedNodeData.syncOutput : false;
		const statusOut = shouldSend ? connectionStatus : "disconnected";

		if (syncOut !== lastSyncOutputRef.current) {
			lastSyncOutputRef.current = syncOut;
			updateNodeData({ syncOutput: syncOut });
		}

		if (statusOut !== lastStatusOutputRef.current) {
			lastStatusOutputRef.current = statusOut;
			updateNodeData({ statusOutput: statusOut });
		}
	}, [isActive, isEnabled, nodeData, connectionStatus, updateNodeData]);

	/**
	 * Compute the latest data coming from connected input handles.
	 */
	const computeInputData = useCallback((): any => {
		const dataInputEdge = edges.find(
			(e) => e.target === id && normalizeHandleId(e.targetHandle || "") === "data-input"
		);

		if (!dataInputEdge) {
			return null;
		}

		const src = nodes.find((n) => n.id === dataInputEdge.source);
		if (!src) {
			return null;
		}

		// Get the output data from the source node - try multiple possible locations
		const outputData = src.data?.output ?? src.data?.store ?? src.data?.data ?? src.data;

		return outputData;
	}, [edges, nodes, id]);

	/**
	 * Compute the connected account data from emailAccount node.
	 */
	const computeAccountData = useCallback((): any => {
		// Look for any edge connecting to our account-input handle
		const accountInputEdge = edges.find((e) => {
			const isTargetingUs = e.target === id;
			const targetHandle = e.targetHandle || "";
			const normalizedHandle = normalizeHandleId(targetHandle);
			
			return isTargetingUs && (normalizedHandle === "account" || targetHandle === "account-input");
		});

		if (!accountInputEdge) {
			return null;
		}

		const src = nodes.find((n) => n.id === accountInputEdge.source);
		if (!src) {
			return null;
		}

		// Get account data from emailAccount node
		// The emailAccount node stores data in "account-output" field
		const accountData = src.data?.["account-output"] ?? src.data?.account ?? src.data?.output ?? src.data;

		return accountData;
	}, [edges, nodes, id]);

	/** Handle spreadsheet ID change */
	const handleSpreadsheetIdChange = useCallback((value: string) => {
		// Extract ID from URL if needed
		const cleanId = extractSpreadsheetId(value) || value;

		updateNodeData({
			spreadsheetId: cleanId,
			connectionStatus: "disconnected",
			isAuthenticated: false,
			lastError: "",
			requiresAuth: false,
			spreadsheetTitle: "",
			availableSheets: [],
			rowsStored: 0, // Reset row count when changing spreadsheet
		});
	}, [updateNodeData]);

	/** Handle sheet name change */
	const handleSheetNameChange = useCallback((value: string) => {
		updateNodeData({ sheetName: value });
	}, [updateNodeData]);

	/** Clear error state and reset to disconnected */
	const handleClearError = useCallback(() => {
		updateNodeData({
			connectionStatus: "disconnected",
			lastError: "",
			isAuthenticated: false,
			requiresAuth: false,
		});

		toast.showInfo("Error cleared. Ready to reconnect.");
	}, [updateNodeData, toast]);

	/** Handle sign-in redirect */
	const handleSignIn = useCallback(() => {
		// Redirect to Gmail OAuth flow
		const redirectUri = encodeURIComponent(`${window.location.origin}/api/auth/email/gmail/callback`);
		const clientId = process.env.NEXT_PUBLIC_GMAIL_CLIENT_ID || "924539398543-ojqqummnk3593k1fm1803cl28t274tmo.apps.googleusercontent.com";
		const scope = encodeURIComponent("https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/spreadsheets");
		
		const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
			`client_id=${clientId}&` +
			`redirect_uri=${redirectUri}&` +
			`response_type=code&` +
			`scope=${scope}&` +
			`access_type=offline&` +
			`prompt=consent`;
		
		window.location.href = authUrl;
	}, []);

	/** Send test data to verify the connection works */
	const handleSendTestData = useCallback(async () => {
		// Create sample test data
		const testData = {
			name: "John Doe",
			email: "john@example.com",
			department: "Engineering",
			salary: 75000,
			start_date: "2024-01-15",
			timestamp: new Date().toISOString(),
		};

		if (!spreadsheetId) {
			toast.showError("Please configure a Spreadsheet ID first");
			return;
		}

		try {
			// Set the test data as input
			updateNodeData({ inputData: testData });

			toast.showInfo("Sending test data to Google Sheets...");

			// Ensure we have a connection
			if (connectionStatus !== "connected") {
				await handleConnect();
				// Wait a bit for connection to establish
				await new Promise(resolve => setTimeout(resolve, 1000));
			}

			// Now sync the test data
			const currentData = typedNodeData;
			if (!currentData.connectedAccount) {
				toast.showError("No email account connected");
				return;
			}
			
			const syncResult = await syncData({
				spreadsheetId,
				sheetName,
				data: testData,
				accountId: currentData.connectedAccount?.accountId as any,
			});

			if (syncResult.success) {
				const currentData = typedNodeData;
				const newRowCount = currentData.rowsStored + syncResult.rowsAffected;

				updateNodeData({
					rowsStored: newRowCount,
					lastSyncTime: new Date().toISOString(),
					lastError: "",
					syncOutput: true,
				});

				toast.showSuccess(`✅ Synced ${syncResult.rowsAffected} row(s) to Google Sheets!`);
			} else {
				updateNodeData({
					lastError: syncResult.error || "Sync failed",
					syncOutput: false,
				});
				toast.showError(syncResult.error || "Failed to sync test data");
			}
		} catch (error) {
			updateNodeData({
				connectionStatus: "error",
				lastError: error instanceof Error ? error.message : "Failed to send test data",
				syncOutput: false,
			});
			toast.showError("Failed to send test data");
		}
	}, [spreadsheetId, sheetName, connectionStatus, syncData, nodeData, updateNodeData, toast, handleConnect]);

	// -------------------------------------------------------------------------
	// 4.5  Effects
	// -------------------------------------------------------------------------

	/* 🔄 Whenever nodes/edges change, recompute inputs and account data. */
	useEffect(() => {
		const newInputData = computeInputData();
		const newAccountData = computeAccountData();
		
		const currentData = nodeData as StoreSheetData;
		const updates: Partial<StoreSheetData> = {};
		
		// Update input data if changed
		if (JSON.stringify(newInputData) !== JSON.stringify(currentData.inputData)) {
			updates.inputData = newInputData;
		}
		
		// Update account data if changed
		if (JSON.stringify(newAccountData) !== JSON.stringify(currentData.connectedAccount)) {
			updates.connectedAccount = newAccountData;
			
			// Extract account email if available
			if (newAccountData?.email) {
				updates.accountEmail = newAccountData.email;
				updates.isAuthenticated = true;
				updates.requiresAuth = false;
			} else {
				updates.accountEmail = "";
				updates.isAuthenticated = false;
				updates.requiresAuth = true;
			}
		}
		
		// Apply updates if any
		if (Object.keys(updates).length > 0) {
			updateNodeData(updates);
		}
	}, [computeInputData, computeAccountData, nodeData, updateNodeData]);

	/* 🔄 Auto-enable when there is a connected, non-empty input. Never auto-disable. */
	useEffect(() => {
		const hasInputData = inputData !== null && inputData !== undefined;
		if (hasInputData && !isEnabled) {
			updateNodeData({ isEnabled: true });
		}
	}, [inputData, isEnabled, updateNodeData]);

	/* 🔄 Auto-sync when new data arrives and we're connected */
	useEffect(() => {
		const hasNewData = inputData !== null && inputData !== undefined;
		const isConnectedAndReady = connectionStatus === "connected" && isEnabled && isActive;
		const currentData = nodeData as StoreSheetData;

		if (hasNewData && isConnectedAndReady && currentData.autoSync) {
			// Debounce auto-sync to prevent spam
			const timeoutId = setTimeout(() => {
				handleSync();
			}, 1000);

			return () => clearTimeout(timeoutId);
		}
	}, [inputData, connectionStatus, isEnabled, isActive, nodeData, handleSync]);

	// Monitor configuration and update active state
	useEffect(() => {
		const hasValidConfig = Boolean(spreadsheetId?.trim()?.length);
		const hasData = inputData !== null && inputData !== undefined;
		const shouldBeActive = hasValidConfig && hasData;

		// If disabled, always set isActive to false
		if (!isEnabled) {
			if (isActive) updateNodeData({ isActive: false });
		} else {
			if (isActive !== shouldBeActive) {
				updateNodeData({ isActive: shouldBeActive });
			}
		}
	}, [spreadsheetId, inputData, isEnabled, isActive, updateNodeData]);

	// Propagate outputs when state changes
	useEffect(() => {
		propagateOutputs();
	}, [propagateOutputs]);



	// -------------------------------------------------------------------------
	// 4.6  Validation
	// -------------------------------------------------------------------------
	const validation = validateNodeData(nodeData);
	if (!validation.success) {
		reportValidationError("StoreSheet", id, validation.errors, {
			originalData: validation.originalData,
			component: "StoreSheetNode",
		});
	}

	useNodeDataValidation(StoreSheetDataSchema, "StoreSheet", validation.data, id);

	// -------------------------------------------------------------------------
	// 4.7  Computed display values
	// -------------------------------------------------------------------------
	const lastSyncDisplay = typedNodeData.lastSyncTime
		? new Date(typedNodeData.lastSyncTime).toLocaleString()
		: "Never";

	const formatRowCount = (count: number | undefined | null): string => {
		const validCount = Number(count) || 0;
		if (validCount === 0) return "No rows";
		if (validCount === 1) return "1 row";
		if (validCount < 1000) return `${validCount} rows`;
		if (validCount < 1000000) return `${(validCount / 1000).toFixed(1)}k rows`;
		return `${(validCount / 1000000).toFixed(1)}M rows`;
	};

	// -------------------------------------------------------------------------
	// 4.8  Professional Render - Startup Quality with STORE theming
	// -------------------------------------------------------------------------
	return (
		<>
			{/* Active indicator when syncing or connected */}
			{(connectionStatus === "connected" || connectionStatus === "connecting") && (
				<div className={CONTENT.activeIndicator} />
			)}

			{/* Editable label or icon */}
			{!isExpanded &&
				spec.size.collapsed.width === 60 &&
				spec.size.collapsed.height === 60 ? (
				<div className="absolute inset-0 flex justify-center text-lg p-0 text-foreground/80">
					{spec.icon && renderLucideIcon(spec.icon, "", 16)}
				</div>
			) : (
				<LabelNode nodeId={id} label={typedNodeData.label || spec.displayName} />
			)}

			{!isExpanded ? (
				// ===== COLLAPSED VIEW - Professional & Compact =====
				<div className={`${CONTENT.collapsed} ${!isEnabled ? CONTENT.disabled : ''}`}>
					<div className="flex flex-col items-center justify-center w-full h-full p-2">
						{/* Icon */}
						<div className={CONTENT.collapsedIcon}>
							{spec.icon && renderLucideIcon(spec.icon, "", 18)}
						</div>

						{/* Connection Status */}
						<div className={CONTENT.collapsedTitle}>
							{connectionStatus === "connected" ? "Connected" : 
							 connectionStatus === "connecting" ? "Connecting" :
							 connectionStatus === "error" ? "Error" : "Disconnected"}
						</div>

						{/* Row Count */}
						<div className={CONTENT.collapsedSubtitle}>
							{formatRowCount(typedNodeData.rowsStored)}
						</div>

						{/* Account Email Preview */}
						{typedNodeData.accountEmail && (
							<div className="text-[7px] text-slate-400 dark:text-slate-500 mt-1 truncate max-w-full">
								{(typedNodeData.accountEmail?.length || 0) > 15 ? 
									`...${typedNodeData.accountEmail.slice(-12)}` : 
									typedNodeData.accountEmail}
							</div>
						)}

						{/* Status Badge */}
						<div
							className={`${CONTENT.collapsedStatus} ${
								connectionStatus === "connected" ? CONTENT.collapsedConnected :
								connectionStatus === "connecting" ? CONTENT.collapsedConnecting :
								connectionStatus === "error" ? CONTENT.collapsedError :
								CONTENT.collapsedDisconnected
							}`}
						>
							{connectionStatus === "connected" ? "✓ Synced" :
							 connectionStatus === "connecting" ? "⏳ Connecting" :
							 connectionStatus === "error" ? "✗ Error" : "○ Ready"}
						</div>
					</div>
				</div>
			) : (
				// ===== EXPANDED VIEW - Professional Interface =====
				<div className={`${CONTENT.expanded} ${!isEnabled ? CONTENT.disabled : ''}`}>
					<div className={CONTENT.body}>
						{/* Google Sheets Configuration Section */}
						<div className={CONTENT.configSection}>
							<div className={CONTENT.configHeader}>
								{renderLucideIcon("LuDatabase", "text-teal-500", 10)}
								Google Sheets Configuration
							</div>
							<div className={CONTENT.configGrid}>
								{/* Spreadsheet ID */}
								<div className={CONTENT.formGroup}>
									<div className={CONTENT.formRow}>
										<label className={CONTENT.label}>Spreadsheet:</label>
										<input
											type="text"
											className={CONTENT.input}
											value={spreadsheetId}
											onChange={(e) => handleSpreadsheetIdChange(e.target.value)}
											placeholder="Paste Google Sheets URL or ID"
											disabled={connectionStatus === "connecting"}
										/>
									</div>
								</div>

								{/* Sheet Name */}
								<div className={CONTENT.formGroup}>
									<div className={CONTENT.formRow}>
										<label className={CONTENT.label}>Sheet Name:</label>
										<input
											type="text"
											className={CONTENT.input}
											value={typedNodeData.sheetName}
											onChange={(e) => handleSheetNameChange(e.target.value)}
											placeholder="Sheet1"
											disabled={connectionStatus === "connecting"}
										/>
									</div>
								</div>

								{/* Available Sheets (if connected) */}
								{(typedNodeData.availableSheets?.length || 0) > 0 && (
									<div className={CONTENT.formGroup}>
										<div className={CONTENT.formRow}>
											<label className={CONTENT.label}>Available:</label>
											<select
												className={CONTENT.select}
												value={typedNodeData.sheetName}
												onChange={(e) => handleSheetNameChange(e.target.value)}
											>
												{(typedNodeData.availableSheets || []).map((sheet) => (
													<option key={sheet} value={sheet}>
														{sheet}
													</option>
												))}
											</select>
										</div>
									</div>
								)}
							</div>
						</div>

						{/* Account Status Section */}
						<div className={CONTENT.configSection}>
							<div className={CONTENT.configHeader}>
								{renderLucideIcon("LuUser", "text-teal-500", 10)}
								Account Status
							</div>
							<div className="bg-slate-100 dark:bg-slate-700 rounded p-2 border">
								<div className="text-[8px] font-mono text-slate-600 dark:text-slate-300">
									{typedNodeData.accountEmail ? 
										`Connected: ${typedNodeData.accountEmail}` : 
										"No account connected"}
								</div>
								{typedNodeData.requiresAuth && (
									<div className="flex gap-1 mt-1">
										<button
											className={CONTENT.buttonSecondary}
											onClick={handleSignIn}
										>
											Connect Gmail
										</button>
									</div>
								)}
							</div>
						</div>

						{/* Spreadsheet Info (if connected) */}
						{typedNodeData.spreadsheetTitle && (
							<div className={CONTENT.configSection}>
								<div className={CONTENT.configHeader}>
									{renderLucideIcon("LuFileSpreadsheet", "text-teal-500", 10)}
									Spreadsheet Info
								</div>
								<div className="bg-slate-100 dark:bg-slate-700 rounded p-2 border">
									<div className="text-[8px] font-mono text-slate-600 dark:text-slate-300 break-all">
										{typedNodeData.spreadsheetTitle}
									</div>
								</div>
							</div>
						)}

						{/* Sync Statistics */}
						<div className={CONTENT.statusSection}>
							<div className="flex flex-col gap-1">
								<div className="flex items-center justify-between">
									<span className="text-[8px] font-medium text-teal-600 dark:text-teal-400">Status:</span>
									<div className="flex items-center gap-1">
										<div className={`w-2 h-2 rounded-full ${
											connectionStatus === "connected" ? 'bg-green-400 animate-pulse' :
											connectionStatus === "connecting" ? 'bg-blue-400 animate-pulse' :
											connectionStatus === "error" ? 'bg-red-400' : 'bg-gray-400'
										}`} />
										<span className={`text-[8px] font-medium ${
											connectionStatus === "connected" ? 'text-green-600 dark:text-green-400' :
											connectionStatus === "connecting" ? 'text-blue-600 dark:text-blue-400' :
											connectionStatus === "error" ? 'text-red-500 dark:text-red-400' :
											'text-gray-500 dark:text-gray-400'
										}`}>
											{connectionStatus === "connected" ? "Connected" :
											 connectionStatus === "connecting" ? "Connecting" :
											 connectionStatus === "error" ? "Error" : "Disconnected"}
										</span>
									</div>
								</div>

								<div className="flex items-center justify-between">
									<span className="text-[8px] font-medium text-teal-600 dark:text-teal-400">Rows Stored:</span>
									<span className="text-[8px] font-medium text-slate-600 dark:text-slate-300">
										{formatRowCount(typedNodeData.rowsStored)}
									</span>
								</div>

								<div className="flex items-center justify-between">
									<span className="text-[8px] font-medium text-teal-600 dark:text-teal-400">Last Sync:</span>
									<span className="text-[8px] font-medium text-slate-600 dark:text-slate-300">
										{lastSyncDisplay}
									</span>
								</div>

								{/* Auto-sync status */}
								<div className="flex items-center justify-between">
									<span className="text-[8px] font-medium text-teal-600 dark:text-teal-400">Auto-sync:</span>
									<span className={`text-[8px] font-medium ${
										typedNodeData.autoSync ? 
										'text-green-600 dark:text-green-400' : 
										'text-slate-500 dark:text-slate-400'
									}`}>
										{typedNodeData.autoSync ? 'Enabled' : 'Disabled'}
									</span>
								</div>

								{/* Error display */}
								{typedNodeData.lastError && (
									<div className="mt-1 p-1 bg-red-100 dark:bg-red-900/30 rounded text-[7px] font-mono">
										<div className="text-red-600 dark:text-red-400 font-semibold mb-0.5">Error:</div>
										<div className="text-red-700 dark:text-red-300 truncate">
											{typedNodeData.lastError}
										</div>
									</div>
								)}
							</div>
						</div>

						{/* Control Buttons */}
						<div className="flex gap-1 mt-2">
							<button
								className={CONTENT.buttonPrimary}
								onClick={connectionStatus === "connected" ? handleSync : handleConnect}
								disabled={!isEnabled}
							>
								{connectionStatus === "connected" ? "Sync Data" : "Connect"}
							</button>

							<button
								className={CONTENT.buttonSecondary}
								onClick={handleSendTestData}
								disabled={!isEnabled}
							>
								Send Test
							</button>

							{typedNodeData.lastError && (
								<button
									className={CONTENT.buttonSecondary}
									onClick={handleClearError}
									disabled={!isEnabled}
								>
									Clear Error
								</button>
							)}
						</div>
					</div>
				</div>
			)}

			<ExpandCollapseButton showUI={isExpanded} onToggle={toggleExpand} size="sm" />
		</>
	);
});

// -----------------------------------------------------------------------------
// 5️⃣  High‑order wrapper – inject scaffold with dynamic spec
// -----------------------------------------------------------------------------

/**
 * ⚠️ THIS is the piece that fixes the focus‑loss issue.
 *
 * `withNodeScaffold` returns a *component function*.  Re‑creating that function
 * on every keystroke causes React to unmount / remount the subtree (and your
 * textarea loses focus).  We memoise the scaffolded component so its identity
 * stays stable across renders unless the *spec itself* really changes.
 */
const StoreSheetNodeWithDynamicSpec = (props: NodeProps) => {
	const { nodeData } = useNodeData(props.id, props.data);

	// Recompute spec only when the size keys change to prevent focus loss
	const typedNodeData: StoreSheetData = nodeData as StoreSheetData;
	const dynamicSpec = useMemo(() => createDynamicSpec(typedNodeData), [typedNodeData]);

	// Memoise the scaffolded component to keep focus
	const ScaffoldedNode = useMemo(
		() => withNodeScaffold(dynamicSpec, StoreSheetNode),
		[dynamicSpec]
	);

	return <ScaffoldedNode {...props} />;
};

StoreSheetNode.displayName = "StoreSheetNode";

export default StoreSheetNodeWithDynamicSpec;
