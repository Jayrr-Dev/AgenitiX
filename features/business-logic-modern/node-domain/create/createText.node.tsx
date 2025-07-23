/**
 * CREATE TEXT NODE - Clean content-focused implementation
 *
 * • Focuses ONLY on content and layout - no structural styling
 * • withNodeScaffold handles all borders, sizing, theming, interactive states
 * • Schema-driven controls in Node Inspector
 * • Type-safe data validation with Zod schema
 * • Clean separation of concerns for maximum maintainability
 *
 * Keywords: create-text, content-focused, schema-driven, type-safe, clean-architecture
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


import { useCallback, useEffect, useRef, useMemo } from "react";

/**
 * Data schema for CreateText node
 */
const CreateTextDataSchema = z
	.object({
		text: z.string().default(""),
		isActive: z.boolean().default(false),
		isExpanded: z.boolean().default(false),
		isEnabled: z.boolean().default(true), // Data propagation control
		expandedSize: z.string().default("VE2"), // Dynamic expanded size
		collapsedSize: z.string().default("C1W"), // Dynamic collapsed size
	})
	.passthrough();

type CreateTextData = z.infer<typeof CreateTextDataSchema>;

// Create enterprise validator
const validateNodeData = createNodeValidator(CreateTextDataSchema, "CreateText");

/**
 * Dynamic node specification that uses data for sizing
 */
const createDynamicSpec = (nodeData: CreateTextData): NodeSpec => ({
  kind: "createText",
  displayName: "Create Text",
  label: "Create Text",
  category: CATEGORIES.CREATE,
  size: {
    expanded: EXPANDED_SIZES[nodeData.expandedSize as keyof typeof EXPANDED_SIZES] || EXPANDED_SIZES.VE2,
    collapsed: COLLAPSED_SIZES[nodeData.collapsedSize as keyof typeof COLLAPSED_SIZES] || COLLAPSED_SIZES.C1W,
  },
  handles: [
    { id: "json-input", code: "j", position: "top", type: "target", dataType: "JSON" },
    { id: "output", code: "s", position: "right", type: "source", dataType: "String" },
    { id: "activate", code: "b", position: "left", type: "target", dataType: "Boolean" },
  ],
  inspector: {
    key: "CreateTextInspector",
  },
  version: 1,
  runtime: {
    execute: "createText_execute_v1",
  },
  initialData: { text: "", isActive: false, isExpanded: false, isEnabled: true, expandedSize: "VE2", collapsedSize: "C1W" },
  dataSchema: CreateTextDataSchema,
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
  icon: "LuFileText",
  author: "Agenitix Team",
  description: "Creates text content with customizable formatting and styling options",
  feature: "base",
  tags: ["content", "formatting"],
  theming: {
    // Custom dark mode theming for Create Text node
    bgDark: "hsla(140, 80%, 15%, 1)", // Darker green background
    borderDark: "hsla(140, 100%, 35%, 1)", // Brighter green border
    borderHoverDark: "hsla(140, 100%, 45%, 1)", // Even brighter on hover
    textDark: "hsla(0, 0%, 90%, 1)", // Light text for readability
    textSecondaryDark: "hsla(0, 0%, 80%, 1)", // Slightly dimmer secondary text
    bgHoverDark: "hsla(140, 72%, 25%, 1)", // Slightly lighter on hover
  },
});

// Static spec for registry (uses default sizes)
const spec: NodeSpec = createDynamicSpec({ expandedSize: "VE2", collapsedSize: "C1W" } as CreateTextData);

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
} as const;



/**
 * createText Node Component
 *
 * Clean content-focused component:
 * • withNodeScaffold handles ALL structural styling
 * • Component focuses ONLY on content and layout
 * • Uses design system tokens for text colors
 * • Schema-driven controls available in Node Inspector
 * • Maintains enterprise validation and type safety
 */
const CreateTextNodeComponent = ({ data, id }: NodeProps) => {
	// Use proper React Flow data management
	const { nodeData, updateNodeData } = useNodeData(id, data);



	// Get isExpanded directly from node data
	const isExpanded = (nodeData as CreateTextData).isExpanded || false;

	// Update expanded state via node data
	const handleToggleExpanded = useCallback(() => {
		updateNodeData({ isExpanded: !isExpanded });
	}, [isExpanded]);

	// Enterprise validation with comprehensive error handling
	const validationResult = validateNodeData(nodeData);
	const validatedData = validationResult.data;

	// Report validation errors for monitoring
	if (!validationResult.success) {
		reportValidationError("CreateText", id, validationResult.errors, {
			originalData: validationResult.originalData,
			component: "CreateTextNodeComponent",
		});
	}

	// Enterprise data validation hook for real-time updates
	const { getHealthScore } = useNodeDataValidation(
		CreateTextDataSchema,
		"CreateText",
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

	// Handle text updates with immediate propagation
	const handleTextChange = useCallback((newText: string) => {
		try {
			// Update text and output immediately for responsive UI
			updateNodeData({ 
				text: newText,
				output: validatedData.isEnabled ? newText : null // Only propagate if enabled
			});
		} catch (error) {
			console.error("Failed to update CreateText node data:", error);
		}
	}, [updateNodeData, validatedData.isEnabled]);

	// Sync output with enabled state to control propagation
	useEffect(() => {
		const desiredOutput = validatedData.isEnabled ? validatedData.text : null;
		if (validatedData.output !== desiredOutput) {
			updateNodeData({ output: desiredOutput });
		}
	}, [validatedData.isEnabled, validatedData.text, validatedData.output, updateNodeData]);

	// Get category-specific text colors
	const categoryTextColors = CATEGORY_TEXT_COLORS.CREATE;

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
                          className={`scrollbar nowheel  bg-background rounded-md p-2 text-xs scrollbar-thumb-sky-700 scrollbar-track-sky-300 h-32 overflow-y-scroll focus:outline-none focus:ring-1 focus:ring-white-500 focus:ring-offset-0 ${categoryTextColors.primary}`}
           
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
const CreateTextNodeWithDynamicSpec = (props: NodeProps) => {
  const { nodeData } = useNodeData(props.id, props.data);
  
  // Memoize the dynamic spec to prevent infinite re-renders
  const dynamicSpec = useMemo(() => createDynamicSpec(nodeData as CreateTextData), [
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
  
  return withNodeScaffold(dynamicSpec, CreateTextNodeComponent)(props);
};

export default CreateTextNodeWithDynamicSpec;

// Export spec for registry access
export { spec };
