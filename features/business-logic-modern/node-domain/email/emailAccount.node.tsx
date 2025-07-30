/**
 * emailAccount NODE – Email account configuration and authentication
 *
 * • Handles OAuth2 and manual email account setup
 * • Provides secure credential management with Convex integration
 * • Supports Gmail, Outlook, IMAP, and SMTP providers
 * • Real-time connection validation and status updates
 * • Type-safe with comprehensive error handling
 *
 * Keywords: email-account, oauth2, authentication, providers
 */

import type { NodeProps } from "@xyflow/react";
import { type ChangeEvent, memo, useCallback, useEffect, useMemo, useRef } from "react";
import { z } from "zod";

import { ExpandCollapseButton } from "@/components/nodes/ExpandCollapseButton";
import LabelNode from "@/components/nodes/labelNode";
import type { NodeSpec } from "@/features/business-logic-modern/infrastructure/node-core/NodeSpec";
import {
	SafeSchemas,
	createSafeInitialData,
} from "@/features/business-logic-modern/infrastructure/node-core/schema-helpers";
import {
	createNodeValidator,
	reportValidationError,
	useNodeDataValidation,
} from "@/features/business-logic-modern/infrastructure/node-core/validation";
import { withNodeScaffold } from "@/features/business-logic-modern/infrastructure/node-core/withNodeScaffold";
import { CATEGORIES } from "@/features/business-logic-modern/infrastructure/theming/categories";
import {
	COLLAPSED_SIZES,
	EXPANDED_SIZES,
} from "@/features/business-logic-modern/infrastructure/theming/sizing";
import { useNodeData } from "@/hooks/useNodeData";
import { useStore } from "@xyflow/react";
import type { EmailAccountConfig, EmailProviderType } from "./types";

import { useAuthContext } from "@/components/auth/AuthProvider";
import { api } from "@/convex/_generated/api";
// Convex integration
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";

// -----------------------------------------------------------------------------
// 1️⃣  Data schema & validation
// -----------------------------------------------------------------------------

export const EmailAccountDataSchema = z
	.object({
		// Provider configuration
		provider: z.enum(["gmail", "outlook", "imap", "smtp"]).default("gmail"),
		email: z.string().default(""),
		displayName: z.string().default(""),

		// Connection state
		isConfigured: z.boolean().default(false),
		isConnected: z.boolean().default(false),
		connectionStatus: z
			.enum(["disconnected", "connecting", "connected", "error"])
			.default("disconnected"),
		lastValidated: z.number().optional(),
		accountId: z.string().optional(), // Convex document ID

		// Manual configuration fields (IMAP/SMTP)
		imapHost: z.string().default(""),
		imapPort: z.number().default(993),
		smtpHost: z.string().default(""),
		smtpPort: z.number().default(587),
		username: z.string().default(""),
		password: z.string().default(""),
		useSSL: z.boolean().default(true),
		useTLS: z.boolean().default(true),

		// OAuth2 state (not stored, just for UI)
		isAuthenticating: z.boolean().default(false),

		// Error handling
		lastError: z.string().default(""),

		// UI state
		isEnabled: SafeSchemas.boolean(true),
		isActive: SafeSchemas.boolean(false),
		isExpanded: SafeSchemas.boolean(false),
		expandedSize: SafeSchemas.text("VE2"),
		collapsedSize: SafeSchemas.text("C2"),

		// Outputs
		accountOutput: SafeSchemas.optionalText(),
		statusOutput: SafeSchemas.boolean(false),
		label: z.string().optional(), // User-editable node label
	})
	.passthrough();

export type EmailAccountData = z.infer<typeof EmailAccountDataSchema>;

const validateNodeData = createNodeValidator(EmailAccountDataSchema, "EmailAccount");

// -----------------------------------------------------------------------------
// 2️⃣  Constants
// -----------------------------------------------------------------------------

const CATEGORY_TEXT = {
	EMAIL: {
		primary: "text-[--node-email-text]",
	},
} as const;

const CONTENT = {
	expanded: "p-4 w-full h-full flex flex-col",
	collapsed: "flex items-center justify-center w-full h-full",
	header: "flex items-center justify-between mb-3",
	body: "flex-1 flex flex-col gap-3",
	disabled: "opacity-75 bg-zinc-100 dark:bg-zinc-500 rounded-md transition-all duration-300",
} as const;

// -----------------------------------------------------------------------------
// 3️⃣  Dynamic spec factory (pure)
// -----------------------------------------------------------------------------

function createDynamicSpec(data: EmailAccountData): NodeSpec {
	const expanded =
		EXPANDED_SIZES[data.expandedSize as keyof typeof EXPANDED_SIZES] ?? EXPANDED_SIZES.VE2;
	const collapsed =
		COLLAPSED_SIZES[data.collapsedSize as keyof typeof COLLAPSED_SIZES] ?? COLLAPSED_SIZES.C2;

	return {
		kind: "emailAccount",
		displayName: "Email Account",
		label: "Email Account",
		category: CATEGORIES.EMAIL,
		size: { expanded, collapsed },
		handles: [
			{
				id: "trigger-input",
				code: "t",
				position: "top",
				type: "target",
				dataType: "Boolean",
			},
			{
				id: "account-output",
				code: "a",
				position: "right",
				type: "source",
				dataType: "JSON",
			},
			{
				id: "status-output",
				code: "s",
				position: "bottom",
				type: "source",
				dataType: "Boolean",
			},
		],
		inspector: { key: "EmailAccountInspector" },
		version: 1,
		runtime: { execute: "emailAccount_execute_v1" },
		initialData: createSafeInitialData(EmailAccountDataSchema, {
			provider: "gmail",
			email: "",
			displayName: "",
			isConfigured: false,
			isConnected: false,
			connectionStatus: "disconnected",
			accountOutput: "",
			statusOutput: false,
		}),
		dataSchema: EmailAccountDataSchema,
		controls: {
			autoGenerate: true,
			excludeFields: [
				"isActive",
				"accountOutput",
				"statusOutput",
				"expandedSize",
				"collapsedSize",
				"connectionStatus",
				"lastValidated",
				"accountId",
				"isAuthenticating",
				"lastError",
				"isConfigured",
				"isConnected",
			],
			customFields: [
				{ key: "isEnabled", type: "boolean", label: "Enable" },
				{
					key: "provider",
					type: "select",
					label: "Email Provider",
				},
				{
					key: "email",
					type: "text",
					label: "Email Address",
					placeholder: "your.email@example.com",
				},
				{
					key: "displayName",
					type: "text",
					label: "Display Name",
					placeholder: "Your Name",
				},
				{ key: "isExpanded", type: "boolean", label: "Expand" },
			],
		},
		icon: "LuMail",
		author: "Agenitix Team",
		description: "Configure and authenticate email accounts for workflow integration",
		feature: "email",
		tags: ["email", "authentication", "oauth2", "gmail", "outlook"],
		theming: {},
	};
}

/** Static spec for registry (uses default size keys) */
export const spec: NodeSpec = createDynamicSpec({
	expandedSize: "VE2",
	collapsedSize: "C2",
} as EmailAccountData);

// -----------------------------------------------------------------------------
// 4️⃣  React component – data propagation & rendering
// -----------------------------------------------------------------------------

const EmailAccountNode = memo(({ id, spec }: NodeProps & { spec: NodeSpec }) => {
	// -------------------------------------------------------------------------
	// 4.1  Sync with React‑Flow store and auth
	// -------------------------------------------------------------------------
	const { nodeData, updateNodeData } = useNodeData(id, {}) as {
		nodeData: EmailAccountData;
		updateNodeData: (data: Partial<EmailAccountData>) => void;
	};
	const { token } = useAuthContext();

	// -------------------------------------------------------------------------
	// 4.2  Derived state
	// -------------------------------------------------------------------------
	const {
		isExpanded,
		isEnabled,
		provider,
		email,
		displayName,
		connectionStatus,
		isConnected,
		isConfigured,
		lastValidated,
		lastError,
		isAuthenticating,
		// Manual config fields
		imapHost,
		imapPort,
		smtpHost,
		smtpPort,
		username,
		password,
		useSSL,
		useTLS,
	} = nodeData as EmailAccountData;

	const categoryStyles = CATEGORY_TEXT.EMAIL;

	// Global React‑Flow store (nodes & edges) – triggers re‑render on change
	const _nodes = useStore((s) => s.nodes);
	const _edges = useStore((s) => s.edges);

	// Keep last emitted output to avoid redundant writes
	const _lastOutputRef = useRef<string | null>(null);

	// -------------------------------------------------------------------------
	// 4.3  Convex integration
	// -------------------------------------------------------------------------
	const storeEmailAccount = useMutation(api.emailAccounts.storeEmailAccount);
	const validateConnection = useMutation(api.emailAccounts.validateEmailConnection);
	const _emailAccounts = useQuery(
		api.emailAccounts.getEmailAccounts,
		token ? { token_hash: token } : "skip"
	);

	// -------------------------------------------------------------------------
	// 4.4  Provider helpers
	// -------------------------------------------------------------------------
	const currentProvider = useMemo(() => {
		// Simplified provider info
		const providers = {
			gmail: { id: "gmail", name: "Gmail", authType: "oauth2" },
			outlook: { id: "outlook", name: "Outlook", authType: "oauth2" },
			imap: { id: "imap", name: "IMAP", authType: "manual" },
			smtp: { id: "smtp", name: "SMTP", authType: "manual" },
		};
		return providers[provider as keyof typeof providers];
	}, [provider]);

	const availableProviders = useMemo(() => {
		return [
			{ value: "gmail", label: "Gmail" },
			{ value: "outlook", label: "Outlook" },
			{ value: "imap", label: "IMAP" },
			{ value: "smtp", label: "SMTP" },
		];
	}, []);

	const isOAuth2Provider = currentProvider?.authType === "oauth2";
	const isManualProvider = currentProvider?.authType === "manual";

	// -------------------------------------------------------------------------
	// 4.5  Callbacks
	// -------------------------------------------------------------------------

	/** Toggle between collapsed / expanded */
	const toggleExpand = useCallback(() => {
		updateNodeData({ isExpanded: !isExpanded });
	}, [isExpanded, updateNodeData]);

	/** Handle provider change */
	const handleProviderChange = useCallback(
		(e: ChangeEvent<HTMLSelectElement>) => {
			const newProvider = e.target.value as EmailProviderType;
			updateNodeData({
				provider: newProvider,
				connectionStatus: "disconnected",
				isConnected: false,
				isConfigured: false,
				lastError: "",
			});
		},
		[updateNodeData]
	);

	/** Handle email change */
	const handleEmailChange = useCallback(
		(e: ChangeEvent<HTMLInputElement>) => {
			updateNodeData({ email: e.target.value });
		},
		[updateNodeData]
	);

	/** Handle display name change */
	const handleDisplayNameChange = useCallback(
		(e: ChangeEvent<HTMLInputElement>) => {
			updateNodeData({ displayName: e.target.value });
		},
		[updateNodeData]
	);

	// Manual configuration handlers
	const handleManualFieldChange = useCallback(
		(field: string) => (e: ChangeEvent<HTMLInputElement>) => {
			const value =
				e.target.type === "number"
					? Number.parseInt(e.target.value)
					: e.target.type === "checkbox"
						? e.target.checked
						: e.target.value;
			updateNodeData({ [field]: value });
		},
		[updateNodeData]
	);

	/** Handle OAuth2 authentication */
	const handleOAuth2Auth = useCallback(async () => {
		if (!(currentProvider && isOAuth2Provider)) {
			return;
		}

		try {
			updateNodeData({ isAuthenticating: true, lastError: "" });

			// Get OAuth2 URL from API
			const redirectUri = `${window.location.origin}/api/auth/email/${provider}/callback`;
			const response = await fetch(
				`/api/auth/email/${provider}?redirect_uri=${encodeURIComponent(redirectUri)}`
			);

			if (!response.ok) {
				throw new Error("Failed to get OAuth2 URL");
			}

			const { authUrl } = await response.json();

			// Open OAuth2 popup
			const popup = window.open(
				authUrl,
				"oauth2",
				"width=500,height=600,scrollbars=yes,resizable=yes"
			);

			// Listen for popup completion
			const checkClosed = setInterval(() => {
				if (popup?.closed) {
					clearInterval(checkClosed);
					updateNodeData({ isAuthenticating: false });

					// Check URL parameters for auth result
					const urlParams = new URLSearchParams(window.location.search);
					if (urlParams.get("auth_success")) {
						handleAuthSuccess(urlParams.get("auth_data"));
					} else if (urlParams.get("auth_error")) {
						handleAuthError(urlParams.get("auth_error_description") || "Authentication failed");
					}
				}
			}, 1000);
		} catch (error) {
			console.error("OAuth2 authentication error:", error);
			updateNodeData({
				isAuthenticating: false,
				lastError: error instanceof Error ? error.message : "Authentication failed",
			});
			toast.error("Authentication failed", {
				description: error instanceof Error ? error.message : "Unknown error",
			});
		}
	}, [currentProvider, isOAuth2Provider, provider, updateNodeData]);

	/** Handle authentication success */
	const handleAuthSuccess = useCallback(
		async (authDataEncoded: string | null) => {
			if (!(authDataEncoded && token)) {
				return;
			}

			try {
				const authData = JSON.parse(atob(authDataEncoded));

				// Store account in Convex
				const result = await storeEmailAccount({
					token_hash: token,
					provider: authData.provider,
					email: authData.email,
					display_name: authData.displayName,
					credentials: {
						provider: authData.provider,
						email: authData.email,
						accessToken: authData.accessToken,
						refreshToken: authData.refreshToken,
						tokenExpiry: authData.tokenExpiry,
					},
				});

				if (result.success) {
					const accountData = result.data as {
						accountId: string;
						email: string;
						provider: string;
						message: string;
					};
					updateNodeData({
						email: authData.email,
						displayName: authData.displayName || authData.email,
						isConfigured: true,
						isConnected: true,
						connectionStatus: "connected",
						lastValidated: Date.now(),
						accountId: accountData.accountId,
						lastError: "",
					});

					toast.success("Email account connected!", {
						description: `Successfully connected ${authData.email}`,
					});
				} else {
					throw new Error(result.error.message);
				}
			} catch (error) {
				console.error("Auth success handling error:", error);
				updateNodeData({
					lastError: error instanceof Error ? error.message : "Failed to save account",
				});
				toast.error("Failed to save account", {
					description: error instanceof Error ? error.message : "Unknown error",
				});
			}
		},
		[token, storeEmailAccount, updateNodeData]
	);

	/** Handle authentication error */
	const handleAuthError = useCallback(
		(errorMessage: string) => {
			updateNodeData({
				lastError: errorMessage,
				isAuthenticating: false,
			});
			toast.error("Authentication failed", {
				description: errorMessage,
			});
		},
		[updateNodeData]
	);

	/** Handle manual configuration save */
	const handleManualSave = useCallback(async () => {
		if (!(token && isManualProvider)) {
			return;
		}

		try {
			updateNodeData({ connectionStatus: "connecting", lastError: "" });

			const credentials: EmailAccountConfig = {
				provider,
				email,
				displayName,
				imapHost,
				imapPort,
				smtpHost,
				smtpPort,
				username,
				password,
				useSSL,
				useTLS,
			};

			// Store account in Convex
			const result = await storeEmailAccount({
				token_hash: token,
				provider,
				email,
				display_name: displayName,
				credentials,
			});

			if (result.success) {
				const accountData = result.data as {
					accountId: string;
					email: string;
					provider: string;
					message: string;
				};
				updateNodeData({
					isConfigured: true,
					isConnected: true,
					connectionStatus: "connected",
					lastValidated: Date.now(),
					accountId: accountData.accountId,
					lastError: "",
				});

				toast.success("Email account configured!", {
					description: `Successfully configured ${email}`,
				});
			} else {
				throw new Error(result.error.message);
			}
		} catch (error) {
			console.error("Manual save error:", error);
			updateNodeData({
				connectionStatus: "error",
				lastError: error instanceof Error ? error.message : "Configuration failed",
			});
			toast.error("Configuration failed", {
				description: error instanceof Error ? error.message : "Unknown error",
			});
		}
	}, [
		token,
		isManualProvider,
		provider,
		email,
		displayName,
		imapHost,
		imapPort,
		smtpHost,
		smtpPort,
		username,
		password,
		useSSL,
		useTLS,
		storeEmailAccount,
		updateNodeData,
	]);

	/** Test connection */
	const handleTestConnection = useCallback(async () => {
		if (!(token && nodeData.accountId) || typeof nodeData.accountId !== "string") {
			return;
		}

		try {
			updateNodeData({ connectionStatus: "connecting", lastError: "" });

			const result = await validateConnection({
				token_hash: token,
				account_id: nodeData.accountId as any,
			});

			if (result.success) {
				updateNodeData({
					connectionStatus: "connected",
					isConnected: true,
					lastValidated: Date.now(),
					lastError: "",
				});

				toast.success("Connection test successful!");
			} else {
				throw new Error(result.error.message);
			}
		} catch (error) {
			console.error("Connection test error:", error);
			updateNodeData({
				connectionStatus: "error",
				isConnected: false,
				lastError: error instanceof Error ? error.message : "Connection test failed",
			});
			toast.error("Connection test failed", {
				description: error instanceof Error ? error.message : "Unknown error",
			});
		}
	}, [token, nodeData.accountId, validateConnection, updateNodeData]);

	// -------------------------------------------------------------------------
	// 4.6  Effects
	// -------------------------------------------------------------------------

	/** Update outputs when connection state changes */
	useEffect(() => {
		if (isEnabled && isConnected) {
			const accountConfig = {
				provider,
				email,
				displayName,
				accountId: nodeData.accountId,
				lastValidated,
			};

			updateNodeData({
				accountOutput: JSON.stringify(accountConfig),
				statusOutput: true,
				isActive: true,
			});
		} else {
			updateNodeData({
				accountOutput: "",
				statusOutput: false,
				isActive: false,
			});
		}
	}, [
		isEnabled,
		isConnected,
		provider,
		email,
		displayName,
		nodeData.accountId,
		lastValidated,
		updateNodeData,
	]);

	// -------------------------------------------------------------------------
	// 4.7  Validation
	// -------------------------------------------------------------------------
	const validation = validateNodeData(nodeData);
	if (!validation.success) {
		reportValidationError("EmailAccount", id, validation.errors, {
			originalData: validation.originalData,
			component: "EmailAccountNode",
		});
	}

	useNodeDataValidation(EmailAccountDataSchema, "EmailAccount", validation.data, id);

	// -------------------------------------------------------------------------
	// 4.8  Render
	// -------------------------------------------------------------------------
	return (
		<>
			{/* Editable label */}
			        <LabelNode nodeId={id} label={(nodeData as EmailAccountData).label || spec.displayName} />

			{isExpanded ? (
				<div className={`${CONTENT.expanded} ${isEnabled ? "" : CONTENT.disabled}`}>
					<div className={CONTENT.header}>
						<span className="font-medium text-sm">Email Account</span>
						<div
							className={`text-xs ${connectionStatus === "connected" ? "text-green-600" : connectionStatus === "error" ? "text-red-600" : "text-gray-600"}`}
						>
							{connectionStatus === "connected" ? "✓" : connectionStatus === "error" ? "✗" : "○"}{" "}
							{connectionStatus}
						</div>
					</div>

					<div className={CONTENT.body}>
						{/* Provider Selection */}
						<div>
							<label htmlFor="provider-select" className="mb-1 block text-gray-600 text-xs">
								Provider:
							</label>
							<select
								id="provider-select"
								value={provider}
								onChange={handleProviderChange}
								className="w-full rounded border p-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
								disabled={!isEnabled || isAuthenticating}
							>
								{availableProviders.map((p) => (
									<option key={p.value} value={p.value}>
										{p.label}
									</option>
								))}
							</select>
						</div>

						{/* Email Address */}
						<div>
							<label htmlFor="email-input" className="mb-1 block text-gray-600 text-xs">
								Email:
							</label>
							<input
								id="email-input"
								type="email"
								value={email}
								onChange={handleEmailChange}
								placeholder="your.email@example.com"
								className={`w-full rounded border p-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 ${categoryStyles.primary}`}
								disabled={!isEnabled || isAuthenticating}
							/>
						</div>

						{/* Display Name */}
						<div>
							<label htmlFor="display-name-input" className="mb-1 block text-gray-600 text-xs">
								Display Name:
							</label>
							<input
								id="display-name-input"
								type="text"
								value={displayName}
								onChange={handleDisplayNameChange}
								placeholder="Your Name"
								className={`w-full rounded border p-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 ${categoryStyles.primary}`}
								disabled={!isEnabled || isAuthenticating}
							/>
						</div>

						{/* OAuth2 Authentication */}
						{isOAuth2Provider && (
							<div>
								<button
									onClick={handleOAuth2Auth}
									disabled={!isEnabled || isAuthenticating || !email}
									className="w-full rounded bg-blue-500 p-2 text-white text-xs hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
									type="button"
								>
									{isAuthenticating ? "Authenticating..." : `Connect ${currentProvider?.name}`}
								</button>
							</div>
						)}

						{/* Manual Configuration */}
						{isManualProvider && (
							<>
								{provider === "imap" && (
									<div className="grid grid-cols-2 gap-2">
										<div>
											<label htmlFor="imap-host" className="mb-1 block text-gray-600 text-xs">
												IMAP Host:
											</label>
											<input
												id="imap-host"
												type="text"
												value={imapHost}
												onChange={handleManualFieldChange("imapHost")}
												placeholder="imap.example.com"
												className="w-full rounded border p-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
												disabled={!isEnabled}
											/>
										</div>
										<div>
											<label htmlFor="imap-port" className="mb-1 block text-gray-600 text-xs">
												Port:
											</label>
											<input
												id="imap-port"
												type="number"
												value={imapPort}
												onChange={handleManualFieldChange("imapPort")}
												placeholder="993"
												className="w-full rounded border p-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
												disabled={!isEnabled}
											/>
										</div>
									</div>
								)}

								{provider === "smtp" && (
									<div className="grid grid-cols-2 gap-2">
										<div>
											<label htmlFor="smtp-host" className="mb-1 block text-gray-600 text-xs">
												SMTP Host:
											</label>
											<input
												id="smtp-host"
												type="text"
												value={smtpHost}
												onChange={handleManualFieldChange("smtpHost")}
												placeholder="smtp.example.com"
												className="w-full rounded border p-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
												disabled={!isEnabled}
											/>
										</div>
										<div>
											<label htmlFor="smtp-port" className="mb-1 block text-gray-600 text-xs">
												Port:
											</label>
											<input
												id="smtp-port"
												type="number"
												value={smtpPort}
												onChange={handleManualFieldChange("smtpPort")}
												placeholder="587"
												className="w-full rounded border p-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
												disabled={!isEnabled}
											/>
										</div>
									</div>
								)}

								<div className="grid grid-cols-2 gap-2">
									<div>
										<label htmlFor="username" className="mb-1 block text-gray-600 text-xs">
											Username:
										</label>
										<input
											id="username"
											type="text"
											value={username}
											onChange={handleManualFieldChange("username")}
											placeholder="Usually your email"
											className="w-full rounded border p-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
											disabled={!isEnabled}
										/>
									</div>
									<div>
										<label htmlFor="password" className="mb-1 block text-gray-600 text-xs">
											Password:
										</label>
										<input
											id="password"
											type="password"
											value={password}
											onChange={handleManualFieldChange("password")}
											placeholder="Password or app password"
											className="w-full rounded border p-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
											disabled={!isEnabled}
										/>
									</div>
								</div>

								<div className="flex gap-4">
									<label htmlFor={`use-ssl-${provider}`} className="flex items-center text-xs">
										<input
											id={`use-ssl-${provider}`}
											type="checkbox"
											checked={provider === "imap" ? useSSL : useTLS}
											onChange={handleManualFieldChange(provider === "imap" ? "useSSL" : "useTLS")}
											className="mr-1"
											disabled={!isEnabled}
										/>
										Use {provider === "imap" ? "SSL" : "TLS"}
									</label>
								</div>

								<button
									onClick={handleManualSave}
									disabled={!(isEnabled && email && username && password)}
									className="w-full rounded bg-green-500 p-2 text-white text-xs hover:bg-green-600 disabled:cursor-not-allowed disabled:opacity-50"
									type="button"
								>
									Save Configuration
								</button>
							</>
						)}

						{/* Connection Actions */}
						{isConfigured && (
							<div className="flex gap-2">
								<button
									onClick={handleTestConnection}
									disabled={!isEnabled || connectionStatus === "connecting"}
									className="flex-1 rounded bg-blue-500 p-2 text-white text-xs hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
									type="button"
								>
									{connectionStatus === "connecting" ? "Testing..." : "Test Connection"}
								</button>
							</div>
						)}

						{/* Status Information */}
						<div className="rounded bg-gray-50 p-2 text-gray-500 text-xs">
							<div>Status: {connectionStatus}</div>
							{lastValidated && (
								<div>Last validated: {new Date(lastValidated).toLocaleString()}</div>
							)}
							{lastError && <div className="mt-1 text-red-600">Error: {lastError}</div>}
						</div>
					</div>
				</div>
			) : (
				<div className={`${CONTENT.collapsed} ${isEnabled ? "" : CONTENT.disabled}`}>
					<div className="p-2 text-center">
						<div className={`font-mono text-xs ${categoryStyles.primary}`}>{email || provider}</div>
						<div
							className={`text-xs ${connectionStatus === "connected" ? "text-green-600" : connectionStatus === "error" ? "text-red-600" : "text-gray-600"}`}
						>
							{connectionStatus === "connected" ? "✓" : connectionStatus === "error" ? "✗" : "○"}{" "}
							{connectionStatus}
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

const EmailAccountNodeWithDynamicSpec = (props: NodeProps) => {
	const { nodeData } = useNodeData(props.id, props.data);

	// Recompute spec only when the size keys change
	const dynamicSpec = useMemo(
		() => createDynamicSpec(nodeData as EmailAccountData),
		[(nodeData as EmailAccountData).expandedSize, (nodeData as EmailAccountData).collapsedSize]
	);

	// Memoise the scaffolded component to keep focus
	const ScaffoldedNode = useMemo(
		() => withNodeScaffold(dynamicSpec, (p) => <EmailAccountNode {...p} spec={dynamicSpec} />),
		[dynamicSpec]
	);

	return <ScaffoldedNode {...props} />;
};

export default EmailAccountNodeWithDynamicSpec;
