/**
 * TestNode NODE - Clean content-focused implementation
 *
 * • Focuses ONLY on content and layout - no structural styling
 * • withNodeScaffold handles all borders, sizing, theming, interactive states
 * • Schema-driven controls in Node Inspector
 * • Type-safe data validation with Zod schema
 * • Clean separation of concerns for maximum maintainability
 * 
 * NOTE: This node will have controls in the Node Inspector regardless of category
 * The NodeInspectorAdapter.determineHasControls() method returns true for all categories for consistent UX
 * 
 * ENHANCED APPROACH: Multi-type data handling with automatic type detection
 * Supports JSON, String, Number, Boolean, Array, Object data types
 * Automatic JSON parsing for object/array strings
 * Backward compatible with text-only input
 *
 * Keywords: test-node, content-focused, schema-driven, type-safe, clean-architecture
 */

import type { NodeProps } from "@xyflow/react";
import { z } from "zod";

import { ExpandCollapseButton } from "@/components/nodes/ExpandCollapseButton";
import type { NodeSpec } from "@/features/business-logic-modern/infrastructure/node-core/NodeSpec";
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

import { useCallback, useEffect, useMemo } from "react";

// -- PLOP-INJECTED-IMPORTS --

/**
 * Data schema for TestNode node
 */
const TestNodeDataSchema = z
	.object({
		text: z.string().default(""),
		isActive: z.boolean().default(false),
		isExpanded: z.boolean().default(false),
		isEnabled: z.boolean().default(true), // Data propagation control
		expandedSize: z.string().default("FE0"), // Dynamic expanded size
		collapsedSize: z.string().default("C1"), // Dynamic collapsed size

	})
	.passthrough();

type TestNodeData = z.infer<typeof TestNodeDataSchema>;

// Create enterprise validator
const validateNodeData = createNodeValidator(TestNodeDataSchema, "TestNode");

/**
 * Dynamic node specification that uses data for sizing
 */
const createDynamicSpec = (nodeData: TestNodeData): NodeSpec => ({
  kind: "testNode",
  displayName: "TestNode",
  label: "TestNode",
  category: CATEGORIES.TEST,
  size: {
    expanded: EXPANDED_SIZES[nodeData.expandedSize as keyof typeof EXPANDED_SIZES] || EXPANDED_SIZES.FE0,
    collapsed: COLLAPSED_SIZES[nodeData.collapsedSize as keyof typeof COLLAPSED_SIZES] || COLLAPSED_SIZES.C1,
  },
  handles: [
    { id: "json-input", code: "j", position: "top", type: "target", dataType: "JSON" },
    { id: "output", code: "s", position: "right", type: "source", dataType: "String" },
    { id: "activate", code: "b", position: "left", type: "target", dataType: "Boolean" },
  ],
  inspector: {
    key: "TestNodeInspector",
  },
  version: 1,
  runtime: {
    execute: "testNode_execute_v1",
  },
  initialData: { text: "", isActive: false, isExpanded: false, isEnabled: true, expandedSize: "FE0", collapsedSize: "C1" },
  dataSchema: TestNodeDataSchema,
  controls: {
    autoGenerate: true,
    excludeFields: ["isActive", "expandedSize", "collapsedSize"], // Hide system fields and size fields from main controls
    customFields: [
      {
        key: "isEnabled",
        type: "boolean",
        label: "Enable",
      },
      {
        key: "text",
        type: "textarea",
        label: "Text",
        placeholder: "Enter your text here...",
        ui: {
          rows: 4,
        },
      },
      {
        key: "isExpanded",
        type: "boolean",
        label: "Expand",
      },
    ],
  },
  icon: "FileText",
  author: "Agenitix Team",
  description: "TestNode node for test operations",
  feature: "base",
  tags: ["test", "testNode"],

});

// Static spec for registry (uses default sizes)
const spec: NodeSpec = createDynamicSpec({ expandedSize: "FE0", collapsedSize: "C1" } as TestNodeData);

/**
 * Content-focused styling constants
 * Only handles internal layout and content - no structural styling
 */
const CONTENT_STYLES = {
	// Content area layouts
	content: {
		expanded: "p-4 w-full h-full flex flex-col",
		collapsed: "flex items-center justify-center w-full h-full",
	},

	// Header layouts
	header: {
		container: "flex items-center justify-between mb-3",
	},

	// Main content layouts
	main: {
		container: "flex-1 flex items-center justify-center",
		content: "text-center",
		icon: "text-2xl mb-2",
	},

	// Collapsed state layouts
	collapsed: {
		icon: "text-2xl",
	},
} as const;

/**
 * Category-specific text colors from design system
 */
const CATEGORY_TEXT_COLORS = {
  CREATE: {
    primary: "text-(--node-create-text)",
    secondary: "text-(--node-create-text-secondary)",
  },
  VIEW: {
    primary: "text-(--node-view-text)",
    secondary: "text-(--node-view-text-secondary)",
  },
  TRIGGER: {
    primary: "text-(--node-trigger-text)",
    secondary: "text-(--node-trigger-text-secondary)",
  },
  TEST: {
    primary: "text-(--node-test-text)",
    secondary: "text-(--node-test-text-secondary)",
  },
  CYCLE: {
    primary: "text-(--node-cycle-text)",
    secondary: "text-(--node-cycle-text-secondary)",
  },
} as const;

/**
 * TestNode Node Component
 *
 * Clean content-focused component:
 * • withNodeScaffold handles ALL structural styling
 * • Component focuses ONLY on content and layout
 * • Uses design system tokens for text colors
 * • Schema-driven controls available in Node Inspector
 * • Maintains enterprise validation and type safety
 */
const TestNodeNodeComponent = ({ data, id }: NodeProps) => {
	// Use proper React Flow data management
	const { nodeData, updateNodeData } = useNodeData(id, data);

	// Get isExpanded directly from node data
	const isExpanded = (nodeData as TestNodeData).isExpanded || false;

	// Update expanded state via node data
	const handleToggleExpanded = useCallback(() => {
		updateNodeData({ isExpanded: !isExpanded });
	}, [isExpanded, updateNodeData]);

	// Enterprise validation with comprehensive error handling
	const validationResult = validateNodeData(nodeData);
	const validatedData = validationResult.data;

	// Report validation errors for monitoring
	if (!validationResult.success) {
		reportValidationError("TestNode", id, validationResult.errors, {
			originalData: validationResult.originalData,
			component: "TestNodeNodeComponent",
		});
	}

	// Enterprise data validation hook for real-time updates
	const { getHealthScore } = useNodeDataValidation(
		TestNodeDataSchema,
		"TestNode",
		validatedData,
		id
	);

	// Monitor text content and update active state
	useEffect(() => {
		const currentText = validatedData.text || '';
		const hasValidText = currentText.trim().length > 0;
		
		// If disabled, always set isActive to false
		if (!validatedData.isEnabled) {
			if (validatedData.isActive !== false) {
				updateNodeData({ isActive: false });
			}
		} else {
			// Only update if the active state has actually changed
			if (validatedData.isActive !== hasValidText) {
				updateNodeData({ 
					isActive: hasValidText
				});
			}
		}
	}, [validatedData.text, validatedData.isActive, validatedData.isEnabled, updateNodeData]);

	// Sync output with enabled state to control propagation
	useEffect(() => {
		const desiredOutput = validatedData.isEnabled ? validatedData.text : null;
		if (validatedData.output !== desiredOutput) {
			updateNodeData({ output: desiredOutput });
		}
	}, [validatedData.isEnabled, validatedData.text, validatedData.output, updateNodeData]);

	// Enhanced data handling with type detection and conversion
	const handleDataChange = useCallback((newValue: any, fieldName: string = 'text') => {
		try {
			// Detect data type and convert appropriately
			let processedValue = newValue;
			let outputValue = newValue;
			
			// Handle different data types
			if (typeof newValue === 'string') {
				// Try to parse as JSON if it looks like JSON
				if (newValue.trim().startsWith('{') || newValue.trim().startsWith('[')) {
					try {
						const parsed = JSON.parse(newValue);
						processedValue = parsed;
						outputValue = parsed;
					} catch {
						// Keep as string if JSON parsing fails
						processedValue = newValue;
						outputValue = newValue;
					}
				} else {
					// Regular string
					processedValue = newValue;
					outputValue = newValue;
				}
			} else if (typeof newValue === 'number') {
				processedValue = newValue;
				outputValue = newValue;
			} else if (typeof newValue === 'boolean') {
				processedValue = newValue;
				outputValue = newValue;
			} else if (Array.isArray(newValue)) {
				processedValue = newValue;
				outputValue = newValue;
			} else if (typeof newValue === 'object' && newValue !== null) {
				processedValue = newValue;
				outputValue = newValue;
			} else {
				// Fallback to string conversion
				processedValue = String(newValue);
				outputValue = String(newValue);
			}
			
			// Update node data with type-appropriate values
			updateNodeData({ 
				[fieldName]: processedValue,
				output: validatedData.isEnabled ? outputValue : null // Only propagate if enabled
			});
		} catch (error) {
			console.error("Failed to update TestNode node data:", error);
		}
	}, [updateNodeData]);

	// Backward compatibility for text-only updates
	const handleTextChange = useCallback((newText: string) => {
		handleDataChange(newText, 'text');
	}, [handleDataChange]);



	// Get category-specific text colors
	const categoryKey = spec.category as keyof typeof CATEGORY_TEXT_COLORS;
	const categoryTextColors = CATEGORY_TEXT_COLORS[categoryKey] || CATEGORY_TEXT_COLORS.CREATE;

	return (
		<>
			<ExpandCollapseButton showUI={isExpanded} onToggle={handleToggleExpanded} size="sm" />

      {isExpanded ? (
        <div className={CONTENT_STYLES.content.expanded}>
          <div className={CONTENT_STYLES.header.container}>
       
            {/* {process.env.NODE_ENV === "development" && (
              <span className={`text-xs ${categoryTextColors.secondary}`}>
                Health: {getHealthScore()}%
              </span>
            )} */}
          </div>
          
          <textarea
            value={validatedData.text}
            onChange={(e) => handleTextChange(e.target.value)}
            placeholder="Enter your text here..."
            className={`scrollbar nowheel bg-background rounded-md p-2 text-xs scrollbar-thumb-sky-700 scrollbar-track-sky-300 h-32 overflow-y-scroll focus:outline-none focus:ring-1 focus:ring-white-500 focus:ring-offset-0 ${categoryTextColors.primary}`}
          />
        </div>
      ) : (
        <div className={CONTENT_STYLES.content.collapsed}>
          <div className="text-center">
            <div
              className={`text-xs font-medium ${categoryTextColors.primary} tracking-wide max-w-20 truncate`}
            >
              {validatedData.text}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// Wrapper component that creates dynamic spec based on node data
const TestNodeNodeWithDynamicSpec = (props: NodeProps) => {
  const { nodeData } = useNodeData(props.id, props.data);
  
  // Memoize the dynamic spec to prevent infinite re-renders
  const dynamicSpec = useMemo(() => createDynamicSpec(nodeData as TestNodeData), [
    nodeData.expandedSize,
    nodeData.collapsedSize,
    nodeData.kind,
    nodeData.displayName,
    nodeData.label,
    nodeData.category,
    nodeData.handles,
    nodeData.inspector,
    nodeData.version,
    nodeData.runtime,
    nodeData.initialData,
    nodeData.dataSchema,
    nodeData.controls,
    nodeData.icon,
    nodeData.author,
    nodeData.description,
    nodeData.feature,
    nodeData.tags
  ]);
  
  return withNodeScaffold(dynamicSpec, TestNodeNodeComponent)(props);
};

export default TestNodeNodeWithDynamicSpec;

// Export spec for registry access
export { spec };
