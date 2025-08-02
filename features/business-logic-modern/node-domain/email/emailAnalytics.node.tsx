/**
 * emailAnalytics NODE – Email performance tracking and metrics
 *
 * • Track email open rates, click rates, and engagement metrics
 * • Generate performance reports and analytics dashboards
 * • Monitor bounce rates and delivery statistics
 * • A/B test results and campaign comparisons
 * • Real-time analytics and historical data visualization
 *
 * Keywords: email-analytics, metrics, tracking, performance, reporting
 */

import type { NodeProps } from "@xyflow/react";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
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

import { useAuthContext } from "@/components/auth/AuthProvider";
import { toast } from "sonner";

// -----------------------------------------------------------------------------
// 1️⃣  Data schema & validation
// -----------------------------------------------------------------------------

export const EmailAnalyticsDataSchema = z
	.object({
		// Data Source Configuration
		campaignIds: z.array(z.string()).default([]),
		dateRange: z.object({
			start: z.string().default(""),
			end: z.string().default(""),
		}).default({ start: "", end: "" }),
		
		// Metrics Configuration
		trackingMetrics: z.object({
			opens: z.boolean().default(true),
			clicks: z.boolean().default(true),
			bounces: z.boolean().default(true),
			unsubscribes: z.boolean().default(true),
			forwards: z.boolean().default(false),
			replies: z.boolean().default(false),
			conversions: z.boolean().default(false),
		}).default({
			opens: true,
			clicks: true,
			bounces: true,
			unsubscribes: true,
			forwards: false,
			replies: false,
			conversions: false,
		}),
		
		// Analytics Data
		metrics: z.object({
			totalSent: z.number().default(0),
			totalDelivered: z.number().default(0),
			totalOpened: z.number().default(0),
			totalClicked: z.number().default(0),
			totalBounced: z.number().default(0),
			totalUnsubscribed: z.number().default(0),
			totalForwarded: z.number().default(0),
			totalReplied: z.number().default(0),
			totalConverted: z.number().default(0),
			
			// Calculated Rates
			deliveryRate: z.number().default(0),
			openRate: z.number().default(0),
			clickRate: z.number().default(0),
			bounceRate: z.number().default(0),
			unsubscribeRate: z.number().default(0),
			conversionRate: z.number().default(0),
		}).default({
			totalSent: 0,
			totalDelivered: 0,
			totalOpened: 0,
			totalClicked: 0,
			totalBounced: 0,
			totalUnsubscribed: 0,
			totalForwarded: 0,
			totalReplied: 0,
			totalConverted: 0,
			deliveryRate: 0,
			openRate: 0,
			clickRate: 0,
			bounceRate: 0,
			unsubscribeRate: 0,
			conversionRate: 0,
		}),
		
		// Time Series Data
		timeSeriesData: z.array(
			z.object({
				date: z.string(),
				sent: z.number().default(0),
				delivered: z.number().default(0),
				opened: z.number().default(0),
				clicked: z.number().default(0),
				bounced: z.number().default(0),
			})
		).default([]),
		
		// Top Performing Content
		topLinks: z.array(
			z.object({
				url: z.string(),
				clicks: z.number(),
				clickRate: z.number(),
			})
		).default([]),
		
		topSubjects: z.array(
			z.object({
				subject: z.string(),
				openRate: z.number(),
				clickRate: z.number(),
			})
		).default([]),
		
		// Geographic Data
		geographicData: z.array(
			z.object({
				country: z.string(),
				opens: z.number(),
				clicks: z.number(),
			})
		).default([]),
		
		// Device/Client Data
		deviceData: z.array(
			z.object({
				device: z.string(),
				opens: z.number(),
				percentage: z.number(),
			})
		).default([]),
		
		// Report Configuration
		reportType: z.enum(["summary", "detailed", "comparison", "trends"]).default("summary"),
		exportFormat: z.enum(["json", "csv", "pdf", "html"]).default("json"),
		
		// Processing State
		isLoading: z.boolean().default(false),
		lastUpdated: z.string().default(""),
		
		// UI State
		activeTab: z.enum(["overview", "trends", "content", "audience"]).default("overview"),
		isEnabled: SafeSchemas.boolean(true),
		isActive: SafeSchemas.boolean(false),
		isExpanded: SafeSchemas.boolean(false),
		expandedSize: SafeSchemas.text("VE3"),
		collapsedSize: SafeSchemas.text("C2"),
		
		// Outputs
		reportData: z.record(z.unknown()).optional(),
		exportedReport: z.string().default(""),
		errorOutput: z.string().default(""),
		
		label: z.string().optional(),
	})
	.passthrough();

export type EmailAnalyticsData = z.infer<typeof EmailAnalyticsDataSchema>;

const validateNodeData = createNodeValidator(EmailAnalyticsDataSchema, "EmailAnalytics");

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

function createDynamicSpec(data: EmailAnalyticsData): NodeSpec {
	const expanded =
		EXPANDED_SIZES[data.expandedSize as keyof typeof EXPANDED_SIZES] ?? EXPANDED_SIZES.VE3;
	const collapsed =
		COLLAPSED_SIZES[data.collapsedSize as keyof typeof COLLAPSED_SIZES] ?? COLLAPSED_SIZES.C2;

	return {
		kind: "emailAnalytics",
		displayName: "Email Analytics",
		label: "Email Analytics",
		category: CATEGORIES.EMAIL,
		size: { expanded, collapsed },
		handles: [
			{
				id: "campaign-input",
				code: "c",
				position: "left",
				type: "target",
				dataType: "Array",
			},
			{
				id: "report-output",
				code: "r",
				position: "right",
				type: "source",
				dataType: "JSON",
			},
			{
				id: "metrics-output",
				code: "m",
				position: "bottom",
				type: "source",
				dataType: "JSON",
			},
		],
		inspector: { key: "EmailAnalyticsInspector" },
		version: 1,
		runtime: { execute: "emailAnalytics_execute_v1" },
		initialData: createSafeInitialData(EmailAnalyticsDataSchema, {
			campaignIds: [],
			dateRange: { start: "", end: "" },
			trackingMetrics: {
				opens: true,
				clicks: true,
				bounces: true,
				unsubscribes: true,
				forwards: false,
				replies: false,
				conversions: false,
			},
			metrics: {
				totalSent: 0,
				totalDelivered: 0,
				totalOpened: 0,
				totalClicked: 0,
				totalBounced: 0,
				totalUnsubscribed: 0,
				totalForwarded: 0,
				totalReplied: 0,
				totalConverted: 0,
				deliveryRate: 0,
				openRate: 0,
				clickRate: 0,
				bounceRate: 0,
				unsubscribeRate: 0,
				conversionRate: 0,
			},
			timeSeriesData: [],
			topLinks: [],
			topSubjects: [],
			geographicData: [],
			deviceData: [],
			reportType: "summary",
			exportFormat: "json",
			isLoading: false,
			lastUpdated: "",
			activeTab: "overview",
			reportData: {},
			exportedReport: "",
			errorOutput: "",
		}),
		dataSchema: EmailAnalyticsDataSchema,
		controls: {
			autoGenerate: true,
			excludeFields: [
				"isActive",
				"reportData",
				"exportedReport",
				"errorOutput",
				"isLoading",
				"lastUpdated",
				"metrics",
				"timeSeriesData",
				"topLinks",
				"topSubjects",
				"geographicData",
				"deviceData",
				"expandedSize",
				"collapsedSize",
			],
			customFields: [
				{ key: "isEnabled", type: "boolean", label: "Enable" },
				{ key: "dateRange.start", type: "date", label: "Start Date" },
				{ key: "dateRange.end", type: "date", label: "End Date" },
				{
					key: "reportType",
					type: "select",
					label: "Report Type",
					validation: {
						options: [
							{ value: "summary", label: "Summary" },
							{ value: "detailed", label: "Detailed" },
							{ value: "comparison", label: "Comparison" },
							{ value: "trends", label: "Trends" },
						],
					},
				},
				{
					key: "exportFormat",
					type: "select",
					label: "Export Format",
					validation: {
						options: [
							{ value: "json", label: "JSON" },
							{ value: "csv", label: "CSV" },
							{ value: "pdf", label: "PDF" },
							{ value: "html", label: "HTML" },
						],
					},
				},
				{ key: "trackingMetrics.opens", type: "boolean", label: "Track Opens" },
				{ key: "trackingMetrics.clicks", type: "boolean", label: "Track Clicks" },
				{ key: "trackingMetrics.bounces", type: "boolean", label: "Track Bounces" },
				{ key: "trackingMetrics.unsubscribes", type: "boolean", label: "Track Unsubscribes" },
				{ key: "trackingMetrics.conversions", type: "boolean", label: "Track Conversions" },
				{ key: "isExpanded", type: "boolean", label: "Expand" },
			],
		},
		icon: "LuBarChart3",
		author: "Agenitix Team",
		description: "Analyze email campaign performance with detailed metrics and reporting",
		feature: "email",
		tags: ["email", "analytics", "metrics", "reporting", "tracking"],
		theming: {},
	};
}

/** Static spec for registry (uses default size keys) */
export const spec: NodeSpec = createDynamicSpec({
	expandedSize: "VE3",
	collapsedSize: "C2",
} as EmailAnalyticsData);

// -----------------------------------------------------------------------------
// 4️⃣  Utility Functions
// -----------------------------------------------------------------------------

/** Generate mock analytics data for demonstration */
const generateMockAnalytics = (campaignIds: string[]): Partial<EmailAnalyticsData> => {
	if (campaignIds.length === 0) {
		return {};
	}

	// Generate mock metrics
	const totalSent = Math.floor(Math.random() * 10000) + 1000;
	const totalDelivered = Math.floor(totalSent * (0.95 + Math.random() * 0.04)); // 95-99% delivery
	const totalOpened = Math.floor(totalDelivered * (0.15 + Math.random() * 0.25)); // 15-40% open rate
	const totalClicked = Math.floor(totalOpened * (0.05 + Math.random() * 0.15)); // 5-20% click rate
	const totalBounced = totalSent - totalDelivered;
	const totalUnsubscribed = Math.floor(totalOpened * (0.001 + Math.random() * 0.009)); // 0.1-1% unsub rate

	const metrics = {
		totalSent,
		totalDelivered,
		totalOpened,
		totalClicked,
		totalBounced,
		totalUnsubscribed,
		totalForwarded: Math.floor(totalOpened * 0.02),
		totalReplied: Math.floor(totalOpened * 0.01),
		totalConverted: Math.floor(totalClicked * 0.1),
		deliveryRate: Math.round((totalDelivered / totalSent) * 100 * 100) / 100,
		openRate: Math.round((totalOpened / totalDelivered) * 100 * 100) / 100,
		clickRate: Math.round((totalClicked / totalOpened) * 100 * 100) / 100,
		bounceRate: Math.round((totalBounced / totalSent) * 100 * 100) / 100,
		unsubscribeRate: Math.round((totalUnsubscribed / totalDelivered) * 100 * 100) / 100,
		conversionRate: Math.round((Math.floor(totalClicked * 0.1) / totalClicked) * 100 * 100) / 100,
	};

	// Generate time series data (last 7 days)
	const timeSeriesData = [];
	for (let i = 6; i >= 0; i--) {
		const date = new Date();
		date.setDate(date.getDate() - i);
		timeSeriesData.push({
			date: date.toISOString().split('T')[0],
			sent: Math.floor(totalSent / 7 + (Math.random() - 0.5) * 200),
			delivered: Math.floor(totalDelivered / 7 + (Math.random() - 0.5) * 180),
			opened: Math.floor(totalOpened / 7 + (Math.random() - 0.5) * 50),
			clicked: Math.floor(totalClicked / 7 + (Math.random() - 0.5) * 10),
			bounced: Math.floor(totalBounced / 7 + (Math.random() - 0.5) * 20),
		});
	}

	// Generate top links
	const topLinks = [
		{ url: "https://example.com/product1", clicks: Math.floor(totalClicked * 0.3), clickRate: 30 },
		{ url: "https://example.com/product2", clicks: Math.floor(totalClicked * 0.25), clickRate: 25 },
		{ url: "https://example.com/blog", clicks: Math.floor(totalClicked * 0.2), clickRate: 20 },
		{ url: "https://example.com/contact", clicks: Math.floor(totalClicked * 0.15), clickRate: 15 },
		{ url: "https://example.com/about", clicks: Math.floor(totalClicked * 0.1), clickRate: 10 },
	];

	// Generate top subjects
	const topSubjects = [
		{ subject: "Special Offer - 50% Off!", openRate: 45.2, clickRate: 12.8 },
		{ subject: "Your Weekly Newsletter", openRate: 32.1, clickRate: 8.5 },
		{ subject: "New Product Launch", openRate: 28.7, clickRate: 15.2 },
		{ subject: "Don't Miss Out!", openRate: 25.3, clickRate: 6.9 },
		{ subject: "Important Update", openRate: 22.1, clickRate: 4.2 },
	];

	// Generate geographic data
	const geographicData = [
		{ country: "United States", opens: Math.floor(totalOpened * 0.4), clicks: Math.floor(totalClicked * 0.4) },
		{ country: "United Kingdom", opens: Math.floor(totalOpened * 0.15), clicks: Math.floor(totalClicked * 0.15) },
		{ country: "Canada", opens: Math.floor(totalOpened * 0.12), clicks: Math.floor(totalClicked * 0.12) },
		{ country: "Australia", opens: Math.floor(totalOpened * 0.1), clicks: Math.floor(totalClicked * 0.1) },
		{ country: "Germany", opens: Math.floor(totalOpened * 0.08), clicks: Math.floor(totalClicked * 0.08) },
	];

	// Generate device data
	const deviceData = [
		{ device: "Mobile", opens: Math.floor(totalOpened * 0.6), percentage: 60 },
		{ device: "Desktop", opens: Math.floor(totalOpened * 0.3), percentage: 30 },
		{ device: "Tablet", opens: Math.floor(totalOpened * 0.1), percentage: 10 },
	];

	return {
		metrics,
		timeSeriesData,
		topLinks,
		topSubjects,
		geographicData,
		deviceData,
		lastUpdated: new Date().toISOString(),
	};
};

// -----------------------------------------------------------------------------
// 5️⃣  React component – data propagation & rendering
// -----------------------------------------------------------------------------

const EmailAnalyticsNode = memo(({ id, spec }: NodeProps & { spec: NodeSpec }) => {
	// -------------------------------------------------------------------------
	const { nodeData, updateNodeData } = useNodeData(id, {});
	const { token } = useAuthContext();

	// -------------------------------------------------------------------------
	// STATE MANAGEMENT (grouped for clarity)
	// -------------------------------------------------------------------------
	const {
		isExpanded,
		isEnabled,
		campaignIds,
		dateRange,
		trackingMetrics,
		metrics,
		timeSeriesData,
		topLinks,
		topSubjects,
		reportType,
		exportFormat,
		isLoading,
		lastUpdated,
		activeTab,
		isActive,
	} = nodeData as EmailAnalyticsData;

	const categoryStyles = CATEGORY_TEXT.EMAIL;

	// Global React‑Flow store (nodes & edges) – triggers re‑render on change
	const _nodes = useStore((s) => s.nodes);
	const _edges = useStore((s) => s.edges);

	// Keep last emitted output to avoid redundant writes
	const _lastOutputRef = useRef<string | null>(null);

	// -------------------------------------------------------------------------
	// 4.3  Callbacks
	// -------------------------------------------------------------------------

	/** Toggle between collapsed / expanded */
	const toggleExpand = useCallback(() => {
		updateNodeData({ isExpanded: !isExpanded });
	}, [isExpanded, updateNodeData]);

	/** Refresh analytics data */
	const refreshAnalytics = useCallback(() => {
		if (campaignIds.length === 0) {
			toast.error("No campaigns selected for analysis");
			return;
		}

		updateNodeData({ isLoading: true });

		// Simulate API call
		setTimeout(() => {
			const mockData = generateMockAnalytics(campaignIds);
			updateNodeData({
				...mockData,
				isLoading: false,
				isActive: true,
				reportData: mockData,
			});
			toast.success("Analytics data refreshed");
		}, 1500);
	}, [campaignIds, updateNodeData]);

	/** Export report */
	const exportReport = useCallback(() => {
		if (!metrics.totalSent) {
			toast.error("No data to export");
			return;
		}

		const reportData = {
			campaigns: campaignIds,
			dateRange,
			metrics,
			generatedAt: new Date().toISOString(),
		};

		let exportedContent = "";
		switch (exportFormat) {
			case "json":
				exportedContent = JSON.stringify(reportData, null, 2);
				break;
			case "csv":
				exportedContent = `Metric,Value\n`;
				exportedContent += `Total Sent,${metrics.totalSent}\n`;
				exportedContent += `Total Delivered,${metrics.totalDelivered}\n`;
				exportedContent += `Total Opened,${metrics.totalOpened}\n`;
				exportedContent += `Total Clicked,${metrics.totalClicked}\n`;
				exportedContent += `Delivery Rate,${metrics.deliveryRate}%\n`;
				exportedContent += `Open Rate,${metrics.openRate}%\n`;
				exportedContent += `Click Rate,${metrics.clickRate}%\n`;
				break;
			case "html":
				exportedContent = `
					<h1>Email Analytics Report</h1>
					<h2>Summary</h2>
					<ul>
						<li>Total Sent: ${metrics.totalSent}</li>
						<li>Total Delivered: ${metrics.totalDelivered}</li>
						<li>Total Opened: ${metrics.totalOpened}</li>
						<li>Total Clicked: ${metrics.totalClicked}</li>
						<li>Delivery Rate: ${metrics.deliveryRate}%</li>
						<li>Open Rate: ${metrics.openRate}%</li>
						<li>Click Rate: ${metrics.clickRate}%</li>
					</ul>
				`;
				break;
			default:
				exportedContent = JSON.stringify(reportData, null, 2);
		}

		updateNodeData({ exportedReport: exportedContent });
		toast.success(`Report exported as ${exportFormat.toUpperCase()}`);
	}, [metrics, campaignIds, dateRange, exportFormat, updateNodeData]);

	// -------------------------------------------------------------------------
	// 4.4  Effects
	// -------------------------------------------------------------------------

	/** Update outputs when analytics data changes */
	useEffect(() => {
		if (isEnabled && campaignIds.length > 0) {
			updateNodeData({
				isActive: true,
			});
		} else {
			updateNodeData({
				isActive: false,
			});
		}
	}, [isEnabled, campaignIds, updateNodeData]);

	// -------------------------------------------------------------------------
	// 4.5  Validation
	// -------------------------------------------------------------------------
	const validation = validateNodeData(nodeData);
	if (!validation.success) {
		reportValidationError("EmailAnalytics", id, validation.errors, {
			originalData: validation.originalData,
			component: "EmailAnalyticsNode",
		});
	}

	useNodeDataValidation(EmailAnalyticsDataSchema, "EmailAnalytics", validation.data, id);

	// -------------------------------------------------------------------------
	// 4.6  Render
	// -------------------------------------------------------------------------

	if (!isExpanded) {
		return (
			<div className={CONTENT.collapsed}>
				<div className="flex flex-col items-center gap-1">
					<div className="text-xs font-medium text-gray-600 dark:text-gray-300">
						Analytics
					</div>
					<div className="text-xs text-gray-500 dark:text-gray-400">
						{campaignIds.length > 0 ? `${campaignIds.length} campaigns` : "No campaigns"}
					</div>
					{metrics.totalSent > 0 && (
						<div className="text-xs text-gray-500 dark:text-gray-400">
							{metrics.openRate.toFixed(1)}% open rate
						</div>
					)}
					{isLoading && (
						<div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
					)}
					{isActive && !isLoading && (
						<div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
					)}
				</div>
			</div>
		);
	}

	return (
		<div className={`${CONTENT.expanded} ${!isEnabled ? CONTENT.disabled : ""}`}>
			{/* Header */}
			<div className={CONTENT.header}>
				<LabelNode
					nodeId={id}
					label="Email Analytics"
				/>
				<ExpandCollapseButton showUI={isExpanded} onToggle={toggleExpand} />
			</div>

			{/* Body */}
			<div className={CONTENT.body}>
				{/* Campaign Info */}
				<div className="mb-3">
					<div className="text-xs text-gray-600 dark:text-gray-300 mb-1">Campaigns:</div>
					<div className="text-sm">
						{campaignIds.length > 0 ? `${campaignIds.length} campaigns selected` : "No campaigns selected"}
					</div>
					{lastUpdated && (
						<div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
							Last updated: {new Date(lastUpdated).toLocaleString()}
						</div>
					)}
				</div>

				{/* Key Metrics */}
				{metrics.totalSent > 0 && (
					<div className="mb-3">
						<div className="text-xs text-gray-600 dark:text-gray-300 mb-2">Key Metrics:</div>
						
						{/* Primary Metrics */}
						<div className="grid grid-cols-2 gap-2 mb-2">
							<div className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
								<div className="text-lg font-bold text-blue-600 dark:text-blue-400">
									{metrics.totalSent.toLocaleString()}
								</div>
								<div className="text-xs text-gray-500 dark:text-gray-400">Sent</div>
							</div>
							<div className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
								<div className="text-lg font-bold text-green-600 dark:text-green-400">
									{metrics.totalDelivered.toLocaleString()}
								</div>
								<div className="text-xs text-gray-500 dark:text-gray-400">Delivered</div>
							</div>
						</div>

						{/* Rate Metrics */}
						<div className="grid grid-cols-3 gap-2 mb-2">
							<div className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
								<div className="text-sm font-bold text-purple-600 dark:text-purple-400">
									{metrics.openRate.toFixed(1)}%
								</div>
								<div className="text-xs text-gray-500 dark:text-gray-400">Open Rate</div>
							</div>
							<div className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
								<div className="text-sm font-bold text-orange-600 dark:text-orange-400">
									{metrics.clickRate.toFixed(1)}%
								</div>
								<div className="text-xs text-gray-500 dark:text-gray-400">Click Rate</div>
							</div>
							<div className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
								<div className="text-sm font-bold text-red-600 dark:text-red-400">
									{metrics.bounceRate.toFixed(1)}%
								</div>
								<div className="text-xs text-gray-500 dark:text-gray-400">Bounce Rate</div>
							</div>
						</div>
					</div>
				)}

				{/* Top Performing Content */}
				{topLinks.length > 0 && (
					<div className="mb-3">
						<div className="text-xs text-gray-600 dark:text-gray-300 mb-2">Top Links:</div>
						<div className="space-y-1">
							{topLinks.slice(0, 3).map((link, i) => (
								<div key={i} className="flex justify-between items-center text-xs p-1 bg-gray-50 dark:bg-gray-800 rounded">
									<span className="truncate flex-1 mr-2" title={link.url}>
										{link.url.replace(/^https?:\/\//, '')}
									</span>
									<span className="font-medium text-blue-600 dark:text-blue-400">
										{link.clicks}
									</span>
								</div>
							))}
						</div>
					</div>
				)}

				{/* Controls */}
				<div className="mt-auto space-y-2">
					<button
						onClick={refreshAnalytics}
						disabled={!isEnabled || isLoading || campaignIds.length === 0}
						className="w-full px-3 py-2 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{isLoading ? "Loading..." : "Refresh Analytics"}
					</button>
					
					{metrics.totalSent > 0 && (
						<button
							onClick={exportReport}
							disabled={!isEnabled}
							className="w-full px-3 py-2 text-xs bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
						>
							Export Report ({exportFormat.toUpperCase()})
						</button>
					)}
				</div>

				{/* Status */}
				{isActive && (
					<div className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1 mt-2">
						<div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
						Analytics active
					</div>
				)}
			</div>
		</div>
	);
});

EmailAnalyticsNode.displayName = "EmailAnalyticsNode";

// -----------------------------------------------------------------------------
// 6️⃣  Dynamic spec wrapper component
// -----------------------------------------------------------------------------

const EmailAnalyticsNodeWithDynamicSpec = (props: NodeProps) => {
	const { nodeData } = useNodeData(props.id, {});

	const dynamicSpec = useMemo(
		() => createDynamicSpec(nodeData as EmailAnalyticsData),
		[(nodeData as EmailAnalyticsData).expandedSize, (nodeData as EmailAnalyticsData).collapsedSize]
	);

	// Memoise the scaffolded component to keep focus
	const ScaffoldedNode = useMemo(
		() => withNodeScaffold(dynamicSpec, (p) => <EmailAnalyticsNode {...p} spec={dynamicSpec} />),
		[dynamicSpec]
	);

	return <ScaffoldedNode {...props} />;
};

export default EmailAnalyticsNodeWithDynamicSpec;