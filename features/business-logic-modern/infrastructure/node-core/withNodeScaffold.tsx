/**
 * UNIFIED NODE SCAFFOLD - Complete structural and theming system
 *
 * • Handles ALL structural styling: borders, sizing, shadows, category theming
 * • Manages interactive states: hover, selection, activation, error
 * • Integrates with design system tokens for consistency
 * • Node components focus ONLY on content and layout
 * • Single source of truth for node appearance
 *
 * Keywords: node-scaffold, structural-styling, theming, interactive-states, design-system
 */

import TypeSafeHandle from "@/components/nodes/handles/TypeSafeHandle";
import LabelNode from "@/components/nodes/labelNode";
import {
	useCategoryThemeWithSpec,
	useNodeStyleClasses,
} from "@/features/business-logic-modern/infrastructure/theming/stores/nodeStyleStore";
import type { NodeProps, Position } from "@xyflow/react";
import { useTheme } from "next-themes";
import React from "react";
import NodeErrorBoundary from "./ErrorBoundary";
import type { NodeSpec } from "./NodeSpec";
import NodeTelemetry from "./NodeTelemetry";
import { getNodePlugins } from "./plugins/nodePluginRegistry";
import { runServerActions } from "./serverActions/serverActionRegistry";
import { globalNodeMemoryManager } from "./NodeMemory";

/**
 * Utility to get CSS custom property value from the DOM
 * This allows us to inject Tailwind classes from tokens.json
 */
const getInjectableClasses = (cssVar: string): string => {
	if (typeof window === "undefined") return "";
	const value = getComputedStyle(document.documentElement).getPropertyValue(cssVar).trim();
	return value || "";
};

/**
 * Enhanced scaffold wrapper that provides complete structural styling
 * while delegating content rendering to the wrapped node component.
 *
 * RESPONSIBILITIES:
 * • Structural styling (borders, shadows, sizing, rounded corners)
 * • Category-based theming (backgrounds, border colors)
 * • Interactive states (hover, selection, activation, error)
 * • Handle positioning and rendering
 * • Design system token integration
 */
const NodeScaffoldWrapper = ({
	children,
	style,
	className,
	spec,
}: {
	children: React.ReactNode;
	style: React.CSSProperties;
	className?: string;
	spec: NodeSpec;
}) => {
	// Get theme for dark mode detection
	const { resolvedTheme } = useTheme();
	const [mounted, setMounted] = React.useState(false);

	// Ensure client-side rendering to avoid hydration mismatch
	React.useEffect(() => {
		setMounted(true);
	}, []);

	// Get injectable classes for core node styling
	const wrapperClasses = getInjectableClasses("--core-coreNode-classes-wrapper");
	const containerClasses = getInjectableClasses("--core-coreNode-classes-container");
	const borderClasses = getInjectableClasses("--core-coreNode-classes-border");

	// Build complete structural styling
	const structuralClasses = [
		// Base structural classes
		"relative rounded-lg transition-all duration-200",
		// Injectable classes from tokens
		wrapperClasses,
		containerClasses,
		borderClasses,
		// Theme classes from parent (includes activation glow)
		className,
	]
		.filter(Boolean)
		.join(" ");

	// Get custom theming if available
	const customTheming = spec.theming;
	const isDarkMode = mounted && resolvedTheme === "dark";

	// Complete style object with all structural properties
	const completeStyle: React.CSSProperties = {
		...style,
		// Scaffold handles ALL border styling
		borderWidth: `var(--node-${spec.category.toLowerCase()}-border-width)`,
		borderStyle: "solid",
		// Use custom theming if available and in dark mode, otherwise fall back to tokens
		borderColor: isDarkMode && customTheming?.borderDark 
			? customTheming.borderDark 
			: `var(--node-${spec.category.toLowerCase()}-border)`,
		// Background from category tokens or custom theming
		backgroundColor: isDarkMode && customTheming?.bgDark 
			? customTheming.bgDark 
			: `var(--node-${spec.category.toLowerCase()}-bg)`,
		// Ensure proper layering
		position: "relative",
		// Smooth transitions for all properties
		transition: "all 200ms ease-in-out",
	};

	return (
		<div className={structuralClasses} style={completeStyle}>
			{children}
		</div>
	);
};

/**
 * A Higher-Order Component that wraps a node's UI component.
 * It reads the static NodeSpec to apply standard features like sizing, theming,
 * error boundaries, analytics hooks, and glow effects.
 *
 * @param spec The static NodeSpec object for the node.
 * @param Component The node's raw React UI component.
 * @returns A complete, production-ready node component with theming integration.
 */
export function withNodeScaffold(spec: NodeSpec, Component: React.FC<NodeProps>) {
	// The returned component is what React Flow will render.
	const WrappedComponent = (props: NodeProps) => {
		// Extract React Flow state for theming
		const isSelected = props.selected || false;
		const isError = false; // TODO: Extract from node data or validation state
		const isActive = (props.data as any)?.isActive || false;

		// Get theming classes from the theming system
		const nodeStyleClasses = useNodeStyleClasses(isSelected, isError, isActive);
		const categoryTheme = useCategoryThemeWithSpec(spec.kind, spec);

		// Build the complete className with theming
		const themeClasses = React.useMemo(() => {
			const baseClasses = [
				nodeStyleClasses, // Includes hover, selection, error, and activation glow effects
			];

			// Apply category-based theming if available
			if (categoryTheme) {
				baseClasses.push(
					categoryTheme.background.light,
					categoryTheme.background.dark,
					categoryTheme.border.light,
					categoryTheme.border.dark
				);
			}

			return baseClasses.join(" ");
		}, [nodeStyleClasses, categoryTheme]);

		// Extract expanded state from component data or use collapsed as default
		// Node components manage isExpanded through their data schema and useNodeData hook
		const isExpanded = (props.data as any)?.isExpanded || false;
		const currentSize = isExpanded ? spec.size.expanded : spec.size.collapsed;

		const sizeConfig = currentSize as any;
		const style: React.CSSProperties = {
			minWidth: typeof sizeConfig.width === "number" ? `${sizeConfig.width}px` : sizeConfig.width,
			minHeight:
				typeof sizeConfig.height === "number" ? `${sizeConfig.height}px` : sizeConfig.height,
			width: typeof sizeConfig.width === "number" ? `${sizeConfig.width}px` : sizeConfig.width,
			height:
				sizeConfig.height === "auto"
					? "auto"
					: typeof sizeConfig.height === "number"
						? `${sizeConfig.height}px`
						: sizeConfig.height,
		};

		// Calculate handle positioning for multiple handles on same side
		const handlesByPosition = React.useMemo(() => {
			const grouped: Record<string, typeof spec.handles> = {};
			spec.handles?.forEach((handle) => {
				const pos = handle.position;
				if (!grouped[pos]) grouped[pos] = [];
				grouped[pos].push(handle);
			});
			return grouped;
		}, []);

		// Determine label (persisted or fallback)
		const nodeLabel = (props.data as any)?.label || spec.displayName;

    // Inner component to throw inside ErrorBoundary, not outside
    const MaybeError: React.FC = () => {
      if (
        process.env.NODE_ENV === "development" &&
        (props.data as any)?.forceError
      ) {
        throw new Error(
          `🧨 Simulated runtime error from node ${props.id} (forceError flag)`
        );
      }
      return null;
    };

    // Initialize node memory if configured
    React.useEffect(() => {
      if (spec.memory) {
        globalNodeMemoryManager.get(props.id, spec.memory);
      }
    }, [props.id]);

		// side-effect: run server actions once
		React.useEffect(() => {
			runServerActions({
				nodeId: props.id,
				nodeKind: spec.kind,
				data: props.data as any,
			});
		}, []);

		return (
			<NodeScaffoldWrapper style={style} className={themeClasses} spec={spec}>
				{/* Render registered node plugins */}
				{getNodePlugins().map((Plugin, idx) => (
					<Plugin key={idx} nodeId={props.id} nodeKind={spec.kind} data={props.data as any} />
				))}
				{/* Telemetry event: node created */}
				<NodeTelemetry nodeId={props.id} nodeKind={spec.kind} />

				{/* Editable label */}
				<LabelNode nodeId={props.id} label={nodeLabel} />

				{/* Render handles defined in the spec with smart positioning */}
				{spec.handles?.map((handle, index) => {
					const handlesOnSameSide = handlesByPosition[handle.position] || [];
					const handleIndex = handlesOnSameSide.findIndex((h) => h.id === handle.id);
					const totalHandlesOnSide = handlesOnSameSide.length;

					return (
						<TypeSafeHandle
							key={handle.id}
							id={handle.id + "__" + (handle.code ?? handle.dataType ?? "x")}
							type={handle.type}
							position={handle.position as Position}
							dataType={handle.dataType}
							code={(handle as any).code}
							tsSymbol={(handle as any).tsSymbol}
							nodeId={props.id}
							handleIndex={handleIndex}
							totalHandlesOnSide={totalHandlesOnSide}
						/>
					);
				})}

				{/* Error boundary isolates runtime errors per node */}
				<NodeErrorBoundary nodeId={props.id}>
					<>
						<MaybeError />
						<Component {...props} />
					</>
				</NodeErrorBoundary>
			</NodeScaffoldWrapper>
		);
	};

	WrappedComponent.displayName = `withNodeScaffold(${spec.displayName})`;
	return WrappedComponent;
}
