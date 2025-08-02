/**
 * NODE INSPECTOR - Legacy-styled multi-column node property editor
 *
 * • Legacy multi-column layout with side-by-side panels
 * • Node data display with JSON highlighting
 * • Output and controls in dedicated right column
 * • Error log in separate column when errors exist
 * • Prominent duplicate and delete action buttons
 * • Uses centralized design system for consistent theming
 * • Maintains enterprise-grade backend safety with modern functionality
 *
 * Keywords: node-inspector, multi-column, legacy-style, json-highlighting, action-buttons, design-system
 */

"use client";

import {
	useFlowStore,
	useNodeErrors,
} from "@/features/business-logic-modern/infrastructure/flow-engine/stores/flowStore";
import { getNodeOutput } from "@/features/business-logic-modern/infrastructure/flow-engine/utils/outputUtils";
import { ChevronDown, Copy, Edit3, GripVertical, PanelLeftClose, PanelLeftOpen, Settings, Trash2 } from "lucide-react";
import React, { useCallback, useMemo, useState, memo } from "react";
import { FaLock, FaLockOpen, FaSearch } from "react-icons/fa";

// DnD Kit imports for drag and drop functionality, basically sortable card reordering
import {
	DndContext,
	DragEndEvent,
	DragOverlay,
	DragStartEvent,
	MouseSensor,
	TouchSensor,
	closestCenter,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import {
	SortableContext,
	arrayMove,
	verticalListSortingStrategy,
	rectSortingStrategy,
} from "@dnd-kit/sortable";
import {
	useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import EditableNodeDescription from "@/components/nodes/EditableNodeDescription";
import EditableNodeLabel from "@/components/nodes/EditableNodeLabel";
import EditableNodeId from "@/components/nodes/editableNodeId";
import { renderLucideIcon } from "@/features/business-logic-modern/infrastructure/node-core/iconUtils";
import { NODE_TYPE_CONFIG } from "../flow-engine/constants";
import type { AgenNode, NodeType } from "../flow-engine/types/nodeData";
import { useComponentTheme } from "../theming/components";
import { NODE_INSPECTOR_TOKENS as DESIGN_CONFIG } from "../theming/components/nodeInspector";
import { NodeInspectorAdapter } from "./adapters/NodeInspectorAdapter";
import { EdgeInspector } from "./components/EdgeInspector";
import { EditableJsonEditor } from "./components/EditableJsonEditor";
import { ErrorLog } from "./components/ErrorLog";
import { HandlePositionEditor } from "./components/HandlePositionEditor";
import { NodeControls } from "./components/NodeControls";
import { NodeOutput } from "./components/NodeOutput";
import { SizeControls } from "./components/SizeControls";
// Import card components with explicit naming
import NodeInformation from "./components/cards/NodeInformation";

import NodeDataCard from "./components/cards/NodeData";
import NodeSizeCard from "./components/cards/NodeSize";
import NodeOutputCard from "./components/cards/NodeOutput";
import NodeControlsCard from "./components/cards/NodeControls";
import NodeHandlesCard from "./components/cards/NodeHandles";
import NodeConnectionsCard from "./components/cards/NodeConnections";
import { useInspectorState } from "./hooks/useInspectorState";
import { useInspectorSettings, type CardType } from "./hooks/useInspectorSettings";
import { InspectorSettingsDropdown } from "./components/InspectorSettingsDropdown";

// =====================================================================
// STYLING CONSTANTS - Thin, minimalistic design with original colors
// =====================================================================

// LAYOUT CONTAINERS - Tighter spacing for compact design
const STYLING_CONTAINER_LOCKED = `${DESIGN_CONFIG.layout.flexRow} ${DESIGN_CONFIG.layout.centerContent} ${DESIGN_CONFIG.dimensions.stateContainer}`;
const STYLING_CONTAINER_NODE_INSPECTOR = `${DESIGN_CONFIG.layout.flexColumn} h-full`;
const STYLING_CONTAINER_HEADER_FIXED = `${DESIGN_CONFIG.layout.flexRow} ${DESIGN_CONFIG.layout.justifyBetween} px-2 py-1 ${DESIGN_CONFIG.colors.inspector.background} sticky top-0 z-10 ${DESIGN_CONFIG.effects.borderBottom} ${DESIGN_CONFIG.colors.header.border}`;
const STYLING_CONTAINER_CONTENT_SCROLLABLE = `${DESIGN_CONFIG.layout.flexRow} gap-3 p-3 flex-1 overflow-auto`;
const STYLING_CONTAINER_EMPTY_STATE = `${DESIGN_CONFIG.layout.flexRow} ${DESIGN_CONFIG.layout.centerContent} ${DESIGN_CONFIG.dimensions.stateContainer} ${DESIGN_CONFIG.effects.roundedFull}`;
const STYLING_CONTAINER_EDGE_INSPECTOR = `${DESIGN_CONFIG.layout.flexRow} gap-3 p-3`;

// COLUMN CONTAINERS - Tighter proportions with compact spacing
const STYLING_CONTAINER_COLUMN_LEFT = `flex-2 ${DESIGN_CONFIG.layout.flexColumn} gap-3 min-w-[300px] max-w-[300px] overflow-auto`;
const STYLING_CONTAINER_COLUMN_RIGHT = `flex-1 ${DESIGN_CONFIG.layout.flexColumn} gap-3 min-w-[280px] overflow-auto`;
const STYLING_CONTAINER_COLUMN_ERROR = `flex-1 ${DESIGN_CONFIG.layout.flexColumn} gap-2 min-w-[280px] overflow-auto`;
const STYLING_CONTAINER_EDGE_CONTENT = `${DESIGN_CONFIG.dimensions.flexBasis} ${DESIGN_CONFIG.layout.flexColumn} gap-3 ${DESIGN_CONFIG.dimensions.minWidth} ${DESIGN_CONFIG.dimensions.fullWidth}`;

// SECTION CONTAINERS - Minimal styling with original colors
const _STYLING_CONTAINER_NODE_HEADER = `${DESIGN_CONFIG.effects.borderBottom} ${DESIGN_CONFIG.colors.header.border} ${DESIGN_CONFIG.spacing.headerPadding}`;
const _STYLING_CONTAINER_HEADER_CONTENT = `${DESIGN_CONFIG.layout.flexRow} ${DESIGN_CONFIG.layout.itemsCenter} ${DESIGN_CONFIG.layout.justifyBetween}`;
const STYLING_CONTAINER_HEADER_ICON_TEXT = `${DESIGN_CONFIG.layout.flexRow} ${DESIGN_CONFIG.layout.itemsCenter} ${DESIGN_CONFIG.spacing.iconTextGap}`;
const STYLING_CONTAINER_HEADER_LEFT_SECTION = `${DESIGN_CONFIG.layout.flexColumn}`;
const STYLING_CONTAINER_HEADER_RIGHT_SECTION = `${DESIGN_CONFIG.layout.flexRow} ${DESIGN_CONFIG.layout.itemsCenter} gap-1`;
const _STYLING_CONTAINER_NODE_METADATA_SECTION = `${DESIGN_CONFIG.layout.flexColumn} gap-1`;
const _STYLING_CONTAINER_NODE_DESCRIPTION = `${DESIGN_CONFIG.colors.data.background} ${DESIGN_CONFIG.effects.roundedMd} ${DESIGN_CONFIG.effects.border} ${DESIGN_CONFIG.colors.data.border} ${DESIGN_CONFIG.spacing.descriptionPadding} mb-2`;
const _STYLING_CONTAINER_NODE_DATA = `${DESIGN_CONFIG.dimensions.flexBasis} ${DESIGN_CONFIG.layout.flexColumn} ${DESIGN_CONFIG.dimensions.minWidth} ${DESIGN_CONFIG.dimensions.fullWidth}`;
const _STYLING_CONTAINER_NODE_DATA_ADAPTIVE = `${DESIGN_CONFIG.layout.flexColumn} ${DESIGN_CONFIG.dimensions.fullWidth}`;
const _STYLING_CONTAINER_JSON_DATA = `${DESIGN_CONFIG.colors.data.background} ${DESIGN_CONFIG.effects.roundedMd} ${DESIGN_CONFIG.effects.border} ${DESIGN_CONFIG.colors.data.border} ${DESIGN_CONFIG.spacing.jsonPadding} ${DESIGN_CONFIG.effects.overflow} ${DESIGN_CONFIG.dimensions.flexBasis} ${DESIGN_CONFIG.dimensions.minWidth} ${DESIGN_CONFIG.dimensions.fullWidth}`;
const _STYLING_CONTAINER_JSON_DATA_ADAPTIVE = `${DESIGN_CONFIG.colors.data.background} ${DESIGN_CONFIG.effects.roundedMd} ${DESIGN_CONFIG.effects.border} ${DESIGN_CONFIG.colors.data.border} ${DESIGN_CONFIG.spacing.jsonPadding} ${DESIGN_CONFIG.effects.overflowAdaptive} ${DESIGN_CONFIG.dimensions.fullWidth}`;
const _STYLING_CONTAINER_ACTION_BUTTONS = `${DESIGN_CONFIG.layout.flexRow} ${DESIGN_CONFIG.layout.itemsCenter} gap-1`;
const _STYLING_CONTAINER_OUTPUT_SECTION = `${DESIGN_CONFIG.layout.flexColumn} gap-2`;
const _STYLING_CONTAINER_CONTROLS_SECTION = `${DESIGN_CONFIG.layout.flexColumn} gap-2`;
const _STYLING_CONTAINER_COLUMNS_ROW = `${DESIGN_CONFIG.layout.flexRow} ${DESIGN_CONFIG.spacing.sectionGap} flex-1`;

// BUTTON STYLES - Minimal buttons with original colors
const STYLING_BUTTON_UNLOCK_LARGE = `${DESIGN_CONFIG.colors.inspector.background} ${DESIGN_CONFIG.colors.inspector.text} ${DESIGN_CONFIG.colors.states.locked.textHover} ${DESIGN_CONFIG.colors.states.locked.borderHover} border ${DESIGN_CONFIG.effects.borderTransparent} ${DESIGN_CONFIG.spacing.statePadding} ${DESIGN_CONFIG.effects.roundedFull}`;
const STYLING_BUTTON_MAGNIFYING_GLASS = `${DESIGN_CONFIG.colors.inspector.textSecondary} ${DESIGN_CONFIG.effects.border} ${DESIGN_CONFIG.effects.borderTransparent} ${DESIGN_CONFIG.colors.states.magnifyingGlass.borderHover} ${DESIGN_CONFIG.colors.states.magnifyingGlass.textHover} ${DESIGN_CONFIG.spacing.statePadding} ${DESIGN_CONFIG.effects.roundedFull}`;
const STYLING_BUTTON_LOCK_SMALL = `${DESIGN_CONFIG.layout.flexRow} ${DESIGN_CONFIG.layout.itemsCenter} gap-1 px-2 py-1 ${DESIGN_CONFIG.typography.buttonText} ${DESIGN_CONFIG.colors.actions.lock.background} ${DESIGN_CONFIG.effects.border} ${DESIGN_CONFIG.colors.actions.lock.border} ${DESIGN_CONFIG.colors.actions.lock.text} ${DESIGN_CONFIG.effects.rounded} ${DESIGN_CONFIG.colors.actions.lock.backgroundHover} ${DESIGN_CONFIG.colors.actions.lock.borderHover} ${DESIGN_CONFIG.effects.transition}`;
const STYLING_BUTTON_DUPLICATE = `${DESIGN_CONFIG.layout.flexRow} ${DESIGN_CONFIG.layout.itemsCenter} gap-1 px-2 py-1 ${DESIGN_CONFIG.typography.buttonText} ${DESIGN_CONFIG.colors.actions.duplicate.background} ${DESIGN_CONFIG.effects.border} ${DESIGN_CONFIG.colors.actions.duplicate.border} ${DESIGN_CONFIG.colors.actions.duplicate.text} ${DESIGN_CONFIG.effects.rounded} ${DESIGN_CONFIG.colors.actions.duplicate.backgroundHover} ${DESIGN_CONFIG.effects.transition}`;
const STYLING_BUTTON_DELETE = `${DESIGN_CONFIG.layout.flexRow} ${DESIGN_CONFIG.layout.itemsCenter} gap-1 px-2 py-1 ${DESIGN_CONFIG.typography.buttonText} ${DESIGN_CONFIG.colors.actions.delete.background} ${DESIGN_CONFIG.effects.border} ${DESIGN_CONFIG.colors.actions.delete.border} ${DESIGN_CONFIG.colors.actions.delete.text} ${DESIGN_CONFIG.effects.rounded} ${DESIGN_CONFIG.colors.actions.delete.backgroundHover} ${DESIGN_CONFIG.effects.transition}`;

// TEXT STYLES - Compact typography with tighter spacing
const STYLING_TEXT_NODE_ICON = "text-sm w-3 h-3";
const STYLING_TEXT_NODE_NAME = `${DESIGN_CONFIG.typography.nodeName} ${DESIGN_CONFIG.colors.header.text}`;
const STYLING_TEXT_NODE_METADATA = `${DESIGN_CONFIG.typography.metadata} ${DESIGN_CONFIG.colors.header.textSecondary}`;
const STYLING_TEXT_NODE_DESCRIPTION = `${DESIGN_CONFIG.typography.description} ${DESIGN_CONFIG.colors.data.text}`;
const _STYLING_TEXT_SECTION_HEADER = `${DESIGN_CONFIG.typography.sectionHeader} ${DESIGN_CONFIG.colors.data.text} mb-1`;

// ICON STYLES - Minimal icon sizing
const STYLING_ICON_ACTION_SMALL = "w-3 h-3";
const STYLING_ICON_STATE_LARGE = DESIGN_CONFIG.icons.large;

// COMPONENT STYLES - Minimal component styling
const STYLING_JSON_HIGHLIGHTER = `${DESIGN_CONFIG.dimensions.fullWidth} ${DESIGN_CONFIG.dimensions.minWidth} ${DESIGN_CONFIG.dimensions.flexBasis}`;

// CARD STYLES - Compact card components
const STYLING_CARD_SECTION = "p-3 bg-card rounded-lg border border-border shadow-sm";
const _STYLING_CARD_SECTION_HEADER = "p-3 bg-muted/30 rounded-t-lg border-b border-border/30";
const _STYLING_CARD_SECTION_CONTENT = "p-3 bg-card rounded-b-lg";

// =====================================================================
// ACCORDION COMPONENT
// =====================================================================

interface AccordionSectionProps {
	title: string;
	isOpen: boolean;
	onToggle: () => void;
	children: React.ReactNode;
}

const AccordionSection: React.FC<AccordionSectionProps> = ({
	title,
	isOpen,
	onToggle,
	children,
}) => {
	return (
		<div className={STYLING_CARD_SECTION}>
			<button
				onClick={onToggle}
				className="flex w-full items-center justify-between rounded-t-lg border-border/30 border-b bg-muted/30 px-3 py-0 transition-colors duration-200 hover:bg-muted/50"
				type="button"
			>
				<h4 className="mb-1 font-medium text-muted-foreground text-xs">{title}</h4>
				<ChevronDown
					className={`h-3 w-3 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
				/>
			</button>
			<div
				className={`overflow-hidden transition-all duration-300 ease-in-out ${
					isOpen ? "max-h-none opacity-100" : "max-h-0 opacity-0"
				}`}
			>
				<div className="overflow-y-auto rounded-b-lg bg-card p-3">{children}</div>
			</div>
		</div>
	);
};

// =====================================================================
// SORTABLE ACCORDION COMPONENT
// =====================================================================

interface SortableAccordionSectionProps extends AccordionSectionProps {
	id: CardType;
	isDragging?: boolean;
}

const SortableAccordionSection: React.FC<SortableAccordionSectionProps> = ({
	id,
	title,
	isOpen,
	onToggle,
	children,
	isDragging = false,
}) => {
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging: isSortableDragging,
	} = useSortable({ id });

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
		opacity: isSortableDragging ? 0.5 : 1,
	};

	return (
		<div ref={setNodeRef} style={style} className={`${STYLING_CARD_SECTION} ${isDragging ? 'shadow-lg' : ''}`}>
			<div className="flex w-full items-center rounded-t-lg border-border/30 border-b bg-muted/30">
				{/* Drag Handle */}
				<div
					{...attributes}
					{...listeners}
					className="flex items-center justify-center px-2 py-2 cursor-grab active:cursor-grabbing hover:bg-muted/50 transition-colors duration-200"
					title="Drag to reorder"
				>
					<GripVertical className="h-3 w-3 text-muted-foreground/60" />
				</div>
				
				{/* Accordion Toggle Button */}
				<button
					onClick={onToggle}
					className="flex flex-1 items-center justify-between px-3 py-0 transition-colors duration-200 hover:bg-muted/50"
					type="button"
				>
					<h4 className="mb-1 font-medium text-muted-foreground text-xs">{title}</h4>
					<ChevronDown
						className={`h-3 w-3 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
					/>
				</button>
			</div>
			<div
				className={`overflow-hidden transition-all duration-300 ease-in-out ${
					isOpen ? "max-h-none opacity-100" : "max-h-0 opacity-0"
				}`}
			>
				<div className="overflow-y-auto rounded-b-lg bg-card p-3">{children}</div>
			</div>
		</div>
	);
};

// =====================================================================
// CARD RENDERING HELPERS
// =====================================================================

interface CardRenderProps {
	selectedNode: any;
	nodeInfo: any;
	nodeConfig: any;
	output: any;
	connections: any;
	errors: any[];
	cardVisibility: any;
	accordionState: any;
	toggleAccordion: (section: any) => void;
	updateNodeData: any;
	handleUpdateNodeId: any;
	handleUpdateNodeData: any;
	logNodeError: any;
	handleClearErrors: any;
	nodes: any[];
	edges: any[];
	viewMode: "bottom" | "side";
	hasRightColumn: boolean;
}

/**
 * Renders a single card based on its type, basically creates the appropriate card component
 */
const renderCard = (cardType: CardType, props: CardRenderProps): React.ReactNode | null => {
	const {
		selectedNode,
		nodeInfo,
		nodeConfig,
		output,
		connections,
		errors,
		cardVisibility,
		accordionState,
		toggleAccordion,
		updateNodeData,
		handleUpdateNodeId,
		handleUpdateNodeData,
		logNodeError,
		handleClearErrors,
		nodes,
		edges,
		viewMode,
		hasRightColumn,
	} = props;

	// Check if card should be visible, basically filter out hidden cards
	if (!cardVisibility[cardType]) {
		return null;
	}

	// Special conditions for certain cards, basically handle conditional rendering
	switch (cardType) {
		case 'nodeInfo':
			return (
				<SortableAccordionSection
					key={cardType}
					id={cardType}
					title="Node Information"
					isOpen={accordionState.nodeInfo}
					onToggle={() => toggleAccordion("nodeInfo")}
				>
					<NodeInformation
						selectedNode={selectedNode}
						nodeInfo={nodeInfo}
						updateNodeData={updateNodeData}
						onUpdateNodeId={handleUpdateNodeId}
					/>
				</SortableAccordionSection>
			);

		case 'nodeData':
			return (
				<SortableAccordionSection
					key={cardType}
					id={cardType}
					title="Node Data"
					isOpen={accordionState.nodeData}
					onToggle={() => toggleAccordion("nodeData")}
				>
					<NodeDataCard
						selectedNode={selectedNode}
						nodeInfo={nodeInfo}
						updateNodeData={handleUpdateNodeData}
					/>
				</SortableAccordionSection>
			);

		case 'output':
			if (!(nodeConfig?.hasOutput || viewMode === "side")) return null;
			return (
				<SortableAccordionSection
					key={cardType}
					id={cardType}
					title="Output"
					isOpen={accordionState.output}
					onToggle={() => toggleAccordion("output")}
				>
					<NodeOutputCard output={output} nodeType={selectedNode.type} />
				</SortableAccordionSection>
			);

		case 'controls':
			if (!(nodeInfo.hasControls || viewMode === "side")) return null;
			return (
				<SortableAccordionSection
					key={cardType}
					id={cardType}
					title="Controls"
					isOpen={accordionState.controls}
					onToggle={() => toggleAccordion("controls")}
				>
					<NodeControlsCard
						selectedNode={selectedNode}
						updateNodeData={updateNodeData}
						onLogError={logNodeError}
					/>
				</SortableAccordionSection>
			);

		case 'handles':
			return (
				<SortableAccordionSection
					key={cardType}
					id={cardType}
					title="Handles"
					isOpen={accordionState.handles}
					onToggle={() => toggleAccordion("handles")}
				>
					<NodeHandlesCard
						selectedNode={selectedNode}
						nodeInfo={nodeInfo}
						edges={edges}
						updateNodeData={updateNodeData}
					/>
				</SortableAccordionSection>
			);

		case 'connections':
			return (
				<SortableAccordionSection
					key={cardType}
					id={cardType}
					title="Connections"
					isOpen={accordionState.connections}
					onToggle={() => toggleAccordion("connections")}
				>
					<NodeConnectionsCard
						selectedNode={selectedNode}
						nodes={nodes}
						edges={edges}
					/>
				</SortableAccordionSection>
			);

		case 'size':
			if (!(selectedNode.data && (selectedNode.data as any).expandedSize !== undefined)) return null;
			return (
				<SortableAccordionSection
					key={cardType}
					id={cardType}
					title="Size"
					isOpen={accordionState.size}
					onToggle={() => toggleAccordion("size")}
				>
					<NodeSizeCard selectedNode={selectedNode} updateNodeData={updateNodeData} />
				</SortableAccordionSection>
			);

		case 'errors':
			return (
				<SortableAccordionSection
					key={cardType}
					id={cardType}
					title="Error Log"
					isOpen={accordionState.errors}
					onToggle={() => toggleAccordion("errors")}
				>
					<ErrorLog errors={errors} onClearErrors={handleClearErrors} />
				</SortableAccordionSection>
			);

		default:
			return null;
	}
};

// =====================================================================
// OPTIMIZED SHELL COMPONENT - Handles store subscriptions only
// =====================================================================

interface NodeInspectorProps {
	viewMode?: "bottom" | "side";
}

// Shell component that handles store subscriptions and passes plain data
const NodeInspectorShell: React.FC<NodeInspectorProps> = ({
	viewMode = "bottom",
}) => {
	const {
		nodes,
		edges,
		selectedNodeId,
		selectedEdgeId,
		inspectorLocked,
		inspectorViewMode,
		setInspectorLocked,
		toggleInspectorViewMode,
		updateNodeData,
		updateNodeId,
		logNodeError,
		clearNodeErrors,
		removeNode,
		removeEdge,
		addNode,
		selectNode,
	} = useFlowStore();

	// Settings management with persistence, basically card visibility controls
	const { 
		settings: cardVisibilityWithOrder, 
		toggleSetting, 
		updateCardOrder,
		resetToDefaults,
		isLoaded: settingsLoaded 
	} = useInspectorSettings();

	// Extract card visibility and order, basically separate visibility state from ordering
	const cardVisibility = {
		nodeInfo: cardVisibilityWithOrder.nodeInfo,
		nodeData: cardVisibilityWithOrder.nodeData,
		output: cardVisibilityWithOrder.output,
		controls: cardVisibilityWithOrder.controls,
		handles: cardVisibilityWithOrder.handles,
		connections: cardVisibilityWithOrder.connections,
		errors: cardVisibilityWithOrder.errors,
		size: cardVisibilityWithOrder.size,
	};
	const cardOrder = cardVisibilityWithOrder.cardOrder;

	// Drag and drop state management, basically track active drag item
	const [activeId, setActiveId] = useState<CardType | null>(null);

	// DnD sensors configuration, basically define how drag interactions work
	const sensors = useSensors(
		useSensor(MouseSensor, {
			activationConstraint: {
				distance: 8, // Require 8px movement before drag starts, basically prevent accidental drags
			},
		}),
		useSensor(TouchSensor, {
			activationConstraint: {
				delay: 250,
				tolerance: 8,
			},
		})
	);

	// Accordion state management
	const [accordionState, setAccordionState] = useState({
		nodeInfo: true,
		description: true,
		handles: true,
		nodeData: true,
		output: true,
		controls: true,
		connections: true,
		errors: true,
		size: true,
	});

	const toggleAccordion = (section: keyof typeof accordionState) => {
		setAccordionState((prev) => ({
			...prev,
			[section]: !prev[section],
		}));
	};

	// Drag and drop event handlers, basically manage card reordering
	const handleDragStart = (event: DragStartEvent) => {
		setActiveId(event.active.id as CardType);
	};

	const handleDragEnd = (event: DragEndEvent) => {
		const { active, over } = event;
		
		if (over && active.id !== over.id) {
			const oldIndex = cardOrder.indexOf(active.id as CardType);
			const newIndex = cardOrder.indexOf(over.id as CardType);
			
			if (oldIndex !== -1 && newIndex !== -1) {
				const newOrder = arrayMove(cardOrder, oldIndex, newIndex);
				updateCardOrder(newOrder);
			}
		}
		
		setActiveId(null);
	};

	// Get theme for node inspector
	const _theme = useComponentTheme("nodeInspector");

	// Get selected items - memoized to prevent unnecessary recalculations
	const selectedNode = useMemo(() => {
		return selectedNodeId ? nodes.find((n) => n.id === selectedNodeId) || null : null;
	}, [selectedNodeId, nodes]);
	
	const selectedEdge = useMemo(() => {
		return selectedEdgeId ? edges.find((e) => e.id === selectedEdgeId) || null : null;
	}, [selectedEdgeId, edges]);

	// Pass stable props to the content component to avoid re-renders - MUST be before early returns to avoid conditional hooks
	const shellProps = useMemo(() => ({
		selectedNode,
		selectedEdge,
		nodes,
		edges,
		viewMode,
		inspectorLocked,
		inspectorViewMode,
		setInspectorLocked,
		toggleInspectorViewMode,
		updateNodeData,
		updateNodeId,
		logNodeError,
		clearNodeErrors,
		removeNode,
		removeEdge,
		addNode,
		selectNode,
	}), [
		selectedNode,
		selectedEdge,
		nodes,
		edges,
		viewMode,
		inspectorLocked,
		inspectorViewMode,
		setInspectorLocked,
		toggleInspectorViewMode,
		updateNodeData,
		updateNodeId,
		logNodeError,
		clearNodeErrors,
		removeNode,
		removeEdge,
		addNode,
		selectNode,
	]);

	// Early return for locked state
	if (inspectorLocked) {
		return (
			<div
				className={`${
					viewMode === "side"
						? "flex h-[50px] w-[50px] items-center justify-center rounded-lg border border-border bg-card shadow-lg"
						: STYLING_CONTAINER_LOCKED
				}`}
			>
				<button
					type="button"
					aria-label={DESIGN_CONFIG.content.aria.unlockInspector}
					title={DESIGN_CONFIG.content.tooltips.unlockInspector}
					onClick={() => setInspectorLocked(false)}
					className={STYLING_BUTTON_UNLOCK_LARGE}
				>
					{React.createElement(FaLock as React.ComponentType<any>, { className: STYLING_ICON_STATE_LARGE })}
				</button>
			</div>
		);
	}

	// Early return for no node selected in side mode
	if (!selectedNode && viewMode === "side") {
		return (
			<div className="flex h-[50px] w-[50px] items-center justify-center rounded-lg border border-border bg-card shadow-lg">
				<div className="text-muted-foreground">
					{React.createElement(FaSearch as React.ComponentType<any>, { className: "h-4 w-4" })}
				</div>
			</div>
		);
	}

	return <NodeInspectorContent {...shellProps} />;
};

// =====================================================================
// MEMOIZED CONTENT COMPONENT - Pure presentation layer
// =====================================================================

interface NodeInspectorContentProps {
	selectedNode: any;
	selectedEdge: any;
	nodes: any[];
	edges: any[];
	viewMode: "bottom" | "side";
	inspectorLocked: boolean;
	inspectorViewMode: "bottom" | "side";
	setInspectorLocked: (locked: boolean) => void;
	toggleInspectorViewMode: () => void;
	updateNodeData: any;
	updateNodeId: any;
	logNodeError: any;
	clearNodeErrors: any;
	removeNode: any;
	removeEdge: any;
	addNode: any;
	selectNode: any;
}

const NodeInspectorContent = memo<NodeInspectorContentProps>(({
	selectedNode,
	selectedEdge,
	nodes,
	edges,
	viewMode,
	inspectorLocked,
	inspectorViewMode,
	setInspectorLocked,
	toggleInspectorViewMode,
	updateNodeData,
	updateNodeId,
	logNodeError,
	clearNodeErrors,
	removeNode,
	removeEdge,
	addNode,
	selectNode,
}) => {
	// Settings management with persistence, basically card visibility controls
	const { 
		settings: cardVisibilityWithOrder, 
		toggleSetting, 
		updateCardOrder,
		resetToDefaults,
		isLoaded: settingsLoaded 
	} = useInspectorSettings();

	// Optimized card visibility extraction with selective dependency tracking, basically avoid recreating object unless individual properties change
	const cardVisibility = useMemo(() => ({
		nodeInfo: cardVisibilityWithOrder.nodeInfo,
		nodeData: cardVisibilityWithOrder.nodeData,
		output: cardVisibilityWithOrder.output,
		controls: cardVisibilityWithOrder.controls,
		handles: cardVisibilityWithOrder.handles,
		connections: cardVisibilityWithOrder.connections,
		errors: cardVisibilityWithOrder.errors,
		size: cardVisibilityWithOrder.size,
	}), [
		cardVisibilityWithOrder.nodeInfo,
		cardVisibilityWithOrder.nodeData,
		cardVisibilityWithOrder.output,
		cardVisibilityWithOrder.controls,
		cardVisibilityWithOrder.handles,
		cardVisibilityWithOrder.connections,
		cardVisibilityWithOrder.errors,
		cardVisibilityWithOrder.size,
	]);
	
	const cardOrder = cardVisibilityWithOrder.cardOrder;

	// Drag and drop state management, basically track active drag item
	const [activeId, setActiveId] = useState<CardType | null>(null);

	// DnD sensors configuration, basically define how drag interactions work
	const sensors = useSensors(
		useSensor(MouseSensor, {
			activationConstraint: {
				distance: 8, // Require 8px movement before drag starts, basically prevent accidental drags
			},
		}),
		useSensor(TouchSensor, {
			activationConstraint: {
				delay: 250,
				tolerance: 8,
			},
		})
	);

	// Accordion state management - moved to component level to avoid context re-creation
	const [accordionState, setAccordionState] = useState({
		nodeInfo: true,
		description: true,
		handles: true,
		nodeData: true,
		output: true,
		controls: true,
		connections: true,
		errors: true,
		size: true,
	});

	const toggleAccordion = useCallback((section: keyof typeof accordionState) => {
		setAccordionState((prev) => ({
			...prev,
			[section]: !prev[section],
		}));
	}, []);

	// Drag and drop event handlers, basically manage card reordering
	const handleDragStart = useCallback((event: DragStartEvent) => {
		setActiveId(event.active.id as CardType);
	}, []);

	const handleDragEnd = useCallback((event: DragEndEvent) => {
		const { active, over } = event;
		
		if (over && active.id !== over.id) {
			const oldIndex = cardOrder.indexOf(active.id as CardType);
			const newIndex = cardOrder.indexOf(over.id as CardType);
			
			if (oldIndex !== -1 && newIndex !== -1) {
				const newOrder = arrayMove(cardOrder, oldIndex, newIndex);
				updateCardOrder(newOrder);
			}
		}
		
		setActiveId(null);
	}, [cardOrder, updateCardOrder]);

	// Get theme for node inspector
	const _theme = useComponentTheme("nodeInspector");

	// Get node category for display
	const nodeCategory = useMemo(() => {
		if (!selectedNode) {
			return null;
		}
		// Try to get category from node metadata or spec
		const nodeMetadata = NodeInspectorAdapter.getNodeInfo(selectedNode.type as NodeType);
		return nodeMetadata?.category || "unknown";
	}, [selectedNode]);

	// Always call useNodeErrors to avoid conditional hook usage
	const errors = useNodeErrors(selectedNode?.id || null);

	// Optimized output computation with reduced dependency scope, basically only recalculate when relevant data changes
	const selectedNodeId = selectedNode?.id;
	const output = useMemo(() => {
		if (!selectedNodeId) {
			return null;
		}
		// Get the most up-to-date node data by finding it again
		const currentNode = nodes.find((n) => n.id === selectedNodeId);
		if (!currentNode) {
			return null;
		}
		const result = getNodeOutput(currentNode, nodes, edges);
		return result;
	}, [selectedNodeId, nodes, edges]);

	// Optimized connections computation with early returns, basically minimize expensive operations when node unchanged
	const connections = useMemo(() => {
		if (!selectedNodeId) {
			return { incoming: [], outgoing: [] };
		}

		// Use more efficient filtering approach
		const incoming = [];
		const outgoing = [];
		
		// Single pass through edges, basically avoid double iteration
		for (const edge of edges) {
			if (edge.target === selectedNodeId) {
				const sourceNode = nodes.find((n) => n.id === edge.source);
				incoming.push({
					edge,
					sourceNode,
					sourceOutput: sourceNode ? getNodeOutput(sourceNode, nodes, edges) : null,
				});
			} else if (edge.source === selectedNodeId) {
				const targetNode = nodes.find((n) => n.id === edge.target);
				outgoing.push({
					edge,
					targetNode,
					targetInput: targetNode ? getNodeOutput(targetNode, nodes, edges) : null,
				});
			}
		}

		return { incoming, outgoing };
	}, [selectedNodeId, nodes, edges]);

	const nodeInfo = useMemo(() => {
		if (!selectedNode) {
			return null;
		}
		return NodeInspectorAdapter.getNodeInfo(selectedNode.type as NodeType);
	}, [selectedNode]);

	// Node action handlers
	const handleUpdateNodeId = useCallback(
		(oldId: string, newId: string) => {
			const success = updateNodeId(oldId, newId);
			if (!success) {
				console.warn(
					`Failed to update node ID from "${oldId}" to "${newId}" - ID might already exist`
				);
			}
			return success;
		},
		[updateNodeId]
	);

	const handleDeleteNode = useCallback(
		(nodeId: string) => {
			removeNode(nodeId);
		},
		[removeNode]
	);

	const handleDuplicateNode = useCallback(
		(nodeId: string) => {
			const nodeToDuplicate = nodes.find((n) => n.id === nodeId);
			if (!nodeToDuplicate) {
				return;
			}

			// Create a new node with a unique ID and offset position
			const newId = `${nodeId}-copy-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
			const newNode = {
				...nodeToDuplicate,
				id: newId,
				position: {
					x: nodeToDuplicate.position.x + 40,
					y: nodeToDuplicate.position.y + 40,
				},
				selected: false,
				data: { ...nodeToDuplicate.data },
			} as AgenNode;

			// Add the new node using the Zustand store
			addNode(newNode);

			// Select the new duplicated node
			selectNode(newId);
		},
		[nodes, addNode, selectNode]
	);

	const handleDeleteEdge = useCallback(
		(edgeId: string) => {
			removeEdge(edgeId);
		},
		[removeEdge]
	);

	const handleClearErrors = useCallback(() => {
		if (selectedNode?.id) {
			clearNodeErrors(selectedNode.id);
		}
	}, [selectedNode?.id, clearNodeErrors]);

	// Handle node data updates
	const handleUpdateNodeData = useCallback(
		(nodeId: string, newData: any) => {
			updateNodeData(nodeId, newData);
		},
		[updateNodeData]
	);

	// Show node inspector if node is selected (prioritize nodes over edges)
	if (selectedNode && nodeInfo) {
		// Get node type config for hasOutput information
		const nodeConfig = selectedNode.type ? NODE_TYPE_CONFIG[selectedNode.type as NodeType] : undefined;
		// Check if node has right column content (output or controls)
		const hasRightColumn = nodeConfig?.hasOutput || nodeInfo.hasControls;

		return (
			<div
				id={DESIGN_CONFIG.content.ids.nodeInfoContainer}
				className={STYLING_CONTAINER_NODE_INSPECTOR}
			>
				{/* FIXED HEADER: NODE INFO + ACTION BUTTONS */}
				<div className={STYLING_CONTAINER_HEADER_FIXED}>
					{/* Left Header Section: Node Info */}
					<div className={STYLING_CONTAINER_HEADER_LEFT_SECTION}>
						<div className={STYLING_CONTAINER_HEADER_ICON_TEXT}>
							{nodeInfo.icon && (
								<span className={STYLING_TEXT_NODE_ICON}>
									{renderLucideIcon(nodeInfo.icon, "", 20) }
								</span>
							)}
							<div>
								<EditableNodeLabel
									nodeId={selectedNode.id}
									label={
										(selectedNode.data as any)?.label || nodeInfo.label || nodeInfo.displayName
									}
									displayName={nodeInfo.displayName}
									onUpdateNodeData={updateNodeData}
									className={STYLING_TEXT_NODE_NAME}
								/>
							</div>
						</div>
					</div>

					{/* Right Header Section: Action Buttons */}
					<div className={STYLING_CONTAINER_HEADER_RIGHT_SECTION}>
						{/* Settings Button */}
						<InspectorSettingsDropdown
							settings={cardVisibility}
							onToggleSetting={toggleSetting}
							onResetToDefaults={resetToDefaults}
						>
							<button
								type="button"
								className={STYLING_BUTTON_LOCK_SMALL}
								title="Inspector card visibility settings"
							>
								<Settings className={STYLING_ICON_ACTION_SMALL} />
							</button>
						</InspectorSettingsDropdown>

						{/* Lock Button */}
						<button
							type="button"
							onClick={() => setInspectorLocked(!inspectorLocked)}
							className={STYLING_BUTTON_LOCK_SMALL}
							title={
								inspectorLocked
									? DESIGN_CONFIG.content.tooltips.unlockInspector
									: DESIGN_CONFIG.content.tooltips.lockInspector
							}
						>
							{inspectorLocked ? (
								React.createElement(FaLock as React.ComponentType<any>, { className: STYLING_ICON_ACTION_SMALL })
							) : (
								React.createElement(FaLockOpen as React.ComponentType<any>, { className: STYLING_ICON_ACTION_SMALL })
							)}
						</button>

						{/* View Mode Toggle Button */}
						<button
							type="button"
							onClick={toggleInspectorViewMode}
							className={STYLING_BUTTON_DUPLICATE}
							title={`Switch to ${inspectorViewMode === "bottom" ? "side" : "bottom"} panel view`}
						>
							{inspectorViewMode === "bottom" ? (
								<PanelLeftOpen className={STYLING_ICON_ACTION_SMALL} />
							) : (
								<PanelLeftClose className={STYLING_ICON_ACTION_SMALL} />
							)}
						</button>

						<button
							type="button"
							onClick={() => handleDuplicateNode(selectedNode.id)}
							className={STYLING_BUTTON_DUPLICATE}
							title={DESIGN_CONFIG.content.tooltips.duplicateNode}
						>
							<Copy className={STYLING_ICON_ACTION_SMALL} />
						</button>

						<button
							type="button"
							onClick={() => handleDeleteNode(selectedNode.id)}
							className={STYLING_BUTTON_DELETE}
							title={DESIGN_CONFIG.content.tooltips.deleteNode}
						>
							<Trash2 className={STYLING_ICON_ACTION_SMALL} />
						</button>

						{/* DEV-ONLY ERROR SIMULATION BUTTONS */}
						{/* {process.env.NODE_ENV === "development" && (
							<>
								<button
									onClick={() => {
										console.error(`🔴 Simulated console error from node ${selectedNode.id}`);
									}}
									className={STYLING_BUTTON_DUPLICATE}
									title="Simulate console.error()"
								>
									CE
								</button>
								<button
									onClick={() => {
										logNodeError(
											selectedNode.id,
											"Simulated node error via dev button",
											"error",
											"DEV_BUTTON"
										);
									}}
									className={STYLING_BUTTON_DUPLICATE}
									title="Simulate node error"
								>
									NE
								</button>
								<button
									onClick={() => {
										updateNodeData(selectedNode.id, {
											forceError: Date.now(),
										});
									}}
									className={STYLING_BUTTON_DUPLICATE}
									title="Simulate runtime error (throws)"
								>
									RE
								</button>
							</>
						)} */}
					</div>
				</div>

				{/* SCROLLABLE CONTENT: SORTABLE CARDS */}
				<div
					className={`${
						viewMode === "side"
							? "flex flex-1 flex-col gap-4 overflow-auto p-4"
							: "flex flex-1 flex-col gap-2 p-3 overflow-auto"
					}`}
				>
					<DndContext
						sensors={sensors}
						collisionDetection={closestCenter}
						onDragStart={handleDragStart}
						onDragEnd={handleDragEnd}
					>
						<SortableContext items={cardOrder} strategy={rectSortingStrategy}>
							{viewMode === "side" ? (
								// Single column layout for side mode
								<div className="flex flex-col gap-2">
									{cardOrder.map((cardType) => {
										const cardProps: CardRenderProps = {
											selectedNode,
											nodeInfo,
											nodeConfig,
											output,
											connections,
											errors,
											cardVisibility,
											accordionState,
											toggleAccordion,
											updateNodeData,
											handleUpdateNodeId,
											handleUpdateNodeData,
											logNodeError: logNodeError as any,
											handleClearErrors,
											nodes,
											edges,
											viewMode,
											hasRightColumn,
										};
										
										return renderCard(cardType, cardProps);
									})}
								</div>
							) : (
								// Masonry-style grid layout for bottom mode with 2 columns
								<div className="columns-2 gap-2 space-y-2">
									{cardOrder.map((cardType) => {
										const cardProps: CardRenderProps = {
											selectedNode,
											nodeInfo,
											nodeConfig,
											output,
											connections,
											errors,
											cardVisibility,
											accordionState,
											toggleAccordion,
											updateNodeData,
											handleUpdateNodeId,
											handleUpdateNodeData,
											logNodeError: logNodeError as any,
											handleClearErrors,
											nodes,
											edges,
											viewMode,
											hasRightColumn,
										};
										
										return renderCard(cardType, cardProps);
									})}
								</div>
							)}
						</SortableContext>
						
						<DragOverlay>
							{activeId ? (
								<div className="bg-card border border-border rounded-lg shadow-lg opacity-80">
									<div className="flex w-full items-center rounded-t-lg border-border/30 border-b bg-muted/30 p-3">
										<GripVertical className="h-3 w-3 text-muted-foreground/60 mr-2" />
										<h4 className="font-medium text-muted-foreground text-xs">
											{activeId === 'nodeInfo' ? 'Node Information' :
											 activeId === 'nodeData' ? 'Node Data' :
											 activeId === 'output' ? 'Output' :
											 activeId === 'controls' ? 'Controls' :
											 activeId === 'handles' ? 'Handles' :
											 activeId === 'connections' ? 'Connections' :
											 activeId === 'size' ? 'Size' :
											 activeId === 'errors' ? 'Error Log' : activeId}
										</h4>
									</div>
								</div>
							) : null}
						</DragOverlay>
					</DndContext>
				</div>
			</div>
		);
	}

	// Show edge inspector if edge is selected (only when no node is selected)
	if (selectedEdge && nodes) {
		return (
			<div
				id={DESIGN_CONFIG.content.ids.edgeInfoContainer}
				className={STYLING_CONTAINER_EDGE_INSPECTOR}
			>
				<div className={STYLING_CONTAINER_EDGE_CONTENT}>
					<EdgeInspector edge={selectedEdge} allNodes={nodes} onDeleteEdge={handleDeleteEdge} />
				</div>
			</div>
		);
	}

	// Show empty state if no node or edge selected
	return (
		<div className={STYLING_CONTAINER_EMPTY_STATE}>
			<button
				type="button"
				aria-label={DESIGN_CONFIG.content.aria.lockInspector}
				title={DESIGN_CONFIG.content.tooltips.lockInspectorDescription}
				onClick={() => setInspectorLocked(true)}
				className={STYLING_BUTTON_MAGNIFYING_GLASS}
			>
				{React.createElement(FaSearch as React.ComponentType<any>, { className: STYLING_ICON_STATE_LARGE })}
			</button>
		</div>
	);
}, (prevProps, nextProps) => {
	// Custom comparison for memo optimization
	return (
		prevProps.selectedNode?.id === nextProps.selectedNode?.id &&
		prevProps.selectedNode?.data === nextProps.selectedNode?.data &&
		prevProps.selectedEdge?.id === nextProps.selectedEdge?.id &&
		prevProps.viewMode === nextProps.viewMode &&
		prevProps.inspectorLocked === nextProps.inspectorLocked &&
		prevProps.inspectorViewMode === nextProps.inspectorViewMode
	);
});

// =====================================================================
// MAIN EXPORTED COMPONENT
// =====================================================================

const NodeInspector = memo<NodeInspectorProps>((props) => {
	return <NodeInspectorShell {...props} />;
});

NodeInspector.displayName = "NodeInspector";
NodeInspectorContent.displayName = "NodeInspectorContent";
NodeInspectorShell.displayName = "NodeInspectorShell";

export default NodeInspector;
