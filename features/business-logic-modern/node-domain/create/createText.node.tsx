/**
 * createText NODE – Content‑focused, schema‑driven, type‑safe
 *
 * • Shows only internal layout; the scaffold provides borders, sizing, theming, and interactivity.
 * • Zod schema auto‑generates type‑checked Inspector controls.
 * • Dynamic sizing (expandedSize / collapsedSize) drives the spec.
 * • Output propagation is gated by `isActive` *and* `isEnabled` to prevent runaway loops.
 * • Code is fully commented and follows current React + TypeScript best practices.
 *
 * Keywords: create-text, schema-driven, type‑safe, clean‑architecture
 */

import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from "react";
import type { NodeProps } from "@xyflow/react";
import { z } from "zod";

import { ExpandCollapseButton } from "@/components/nodes/ExpandCollapseButton";
import LabelNode from "@/components/nodes/labelNode";
import {
  createNodeValidator,
  reportValidationError,
  useNodeDataValidation,
} from "@/features/business-logic-modern/infrastructure/node-core/validation";
import { withNodeScaffold } from "@/features/business-logic-modern/infrastructure/node-core/withNodeScaffold";
import type { NodeSpec } from "@/features/business-logic-modern/infrastructure/node-core/NodeSpec";
import { SafeSchemas, createSafeInitialData } from "@/features/business-logic-modern/infrastructure/node-core/schema-helpers";
import { renderLucideIcon } from "@/features/business-logic-modern/infrastructure/node-core/iconUtils";
import { CATEGORIES } from "@/features/business-logic-modern/infrastructure/theming/categories";
import {
  COLLAPSED_SIZES,
  EXPANDED_SIZES,
} from "@/features/business-logic-modern/infrastructure/theming/sizing";
import { useNodeData } from "@/hooks/useNodeData";

// -----------------------------------------------------------------------------
// 1️⃣  Data schema & validation
// -----------------------------------------------------------------------------

export const CreateTextDataSchema = z
  .object({
    store: SafeSchemas.text('Default text'),
    isEnabled: SafeSchemas.boolean(true),
    isActive: SafeSchemas.boolean(false),
    isExpanded: SafeSchemas.boolean(false),
    inputs: SafeSchemas.optionalText(),
    outputs: SafeSchemas.optionalText(),
    expandedSize: SafeSchemas.text('VE2'),
    collapsedSize: SafeSchemas.text('C1W'),
  })
  .passthrough();

export type CreateTextData = z.infer<typeof CreateTextDataSchema>;

const validateNodeData = createNodeValidator(CreateTextDataSchema, 'CreateText');

// -----------------------------------------------------------------------------
// 2️⃣  Constants
// -----------------------------------------------------------------------------

const CATEGORY_TEXT = {
  CREATE: {
    primary: 'text-[--node-create-text]',
  },
} as const;

const CONTENT = {
  expanded: 'p-4 w-full h-full flex flex-col',
  collapsed: 'flex items-center justify-center w-full h-full',
  header: 'flex items-center justify-between mb-3',
  body: 'flex-1 flex items-center justify-center',
} as const;

// -----------------------------------------------------------------------------
// 3️⃣  Dynamic spec factory (pure)
// -----------------------------------------------------------------------------

function createDynamicSpec(data: CreateTextData): NodeSpec {
  const expanded =
    EXPANDED_SIZES[data.expandedSize as keyof typeof EXPANDED_SIZES] ||
    EXPANDED_SIZES.VE2;
  const collapsed =
    COLLAPSED_SIZES[data.collapsedSize as keyof typeof COLLAPSED_SIZES] ||
    COLLAPSED_SIZES.C1W;

  return {
    kind: 'createText',
    displayName: 'Create Text',
    label: 'Create Text',
    category: CATEGORIES.CREATE,
    size: { expanded, collapsed },
    handles: [
      { id: 'json-input', code: 'j', position: 'top', type: 'target', dataType: 'JSON' },
      { id: 'output', code: 's', position: 'right', type: 'source', dataType: 'String' },
      { id: 'input', code: 'b', position: 'left', type: 'target', dataType: 'Boolean' },
    ],
    inspector: { key: 'CreateTextInspector' },
    version: 1,
    runtime: { execute: 'createText_execute_v1' },
    initialData: createSafeInitialData(CreateTextDataSchema),
    dataSchema: CreateTextDataSchema,
    controls: {
      autoGenerate: true,
      excludeFields: ['isActive', 'inputs', 'outputs', 'expandedSize', 'collapsedSize'],
      customFields: [
        { key: 'isEnabled', type: 'boolean', label: 'Enable' },
        {
          key: 'store',
          type: 'textarea',
          label: 'Store',
          placeholder: 'Enter your content here…',
          ui: { rows: 4 },
        },
        { key: 'isExpanded', type: 'boolean', label: 'Expand' },
      ],
    },
    icon: 'LuFileText',
    author: 'Agenitix Team',
    description: 'Creates text content with customizable formatting and styling options',
    feature: 'base',
    tags: ['content', 'formatting'],
    theming: {},
  };
}

// Static spec for registry (default sizes)
export const spec: NodeSpec = createDynamicSpec({
  expandedSize: 'VE2',
  collapsedSize: 'C1W',
} as CreateTextData);

// -----------------------------------------------------------------------------
// 4️⃣  React component – data propagation & rendering
// -----------------------------------------------------------------------------

const CreateTextNode = memo(({ id, data, spec }: NodeProps & { spec: NodeSpec }) => {
  // Sync with React‑Flow store
  const { nodeData, updateNodeData } = useNodeData(id, data);

  // Derived state -------------------------------------------------------------
  const isExpanded = (nodeData as CreateTextData).isExpanded || false;
  const categoryStyles = CATEGORY_TEXT.CREATE;

  // Helpers -------------------------------------------------------------------
  const lastOutputRef = useRef<string | null>(null);

  /** Toggle between collapsed / expanded */
  const toggleExpand = useCallback(() => {
    updateNodeData({ isExpanded: !isExpanded });
  }, [isExpanded, updateNodeData]);

  /** Propagate output ONLY when node is active AND enabled */
  const propagate = useCallback(
    (value: string) => {
      const shouldSend = (nodeData as CreateTextData).isActive && (nodeData as CreateTextData).isEnabled;
      const out = shouldSend ? value : null;
      if (out !== lastOutputRef.current) {
        lastOutputRef.current = out;
        updateNodeData({ outputs: out });
      }
    },
    [nodeData, updateNodeData]
  );

  /** Clear JSON‑ish fields when inactive or disabled */
  const blockJsonWhenInactive = useCallback(() => {
    if (!(nodeData as CreateTextData).isActive || !(nodeData as CreateTextData).isEnabled) {
      updateNodeData({ 
        json: null, 
        data: null, 
        payload: null, 
        result: null, 
        response: null 
      });
    }
  }, [nodeData, updateNodeData]);

  // Monitor store content and update active state ------------------------------
  useEffect(() => {
    const currentStore = (nodeData as CreateTextData).store || '';
    const hasValidStore = currentStore.trim().length > 0 && currentStore !== 'Default text';
    const isEnabled = (nodeData as CreateTextData).isEnabled;
    
    // If disabled, always set isActive to false
    if (!isEnabled) {
      if ((nodeData as CreateTextData).isActive !== false) {
        updateNodeData({ isActive: false });
      }
    } else {
      // Only update if the active state has actually changed
      if ((nodeData as CreateTextData).isActive !== hasValidStore) {
        updateNodeData({ isActive: hasValidStore });
      }
    }
  }, [(nodeData as CreateTextData).store, (nodeData as CreateTextData).isActive, (nodeData as CreateTextData).isEnabled, updateNodeData]);

  // Sync outputs with active and enabled state --------------------------------
  useEffect(() => {
    const currentStore = (nodeData as CreateTextData).store || '';
    // Only propagate actual user content, not default values
    const actualContent = currentStore === 'Default text' ? '' : currentStore;
    propagate(actualContent);
    blockJsonWhenInactive();
  }, [(nodeData as CreateTextData).isActive, (nodeData as CreateTextData).isEnabled, (nodeData as CreateTextData).store, propagate, blockJsonWhenInactive]);

  // Validate ------------------------------------------------------------------
  const validation = validateNodeData(nodeData);
  if (!validation.success) {
    reportValidationError('CreateText', id, validation.errors, {
      originalData: validation.originalData,
      component: 'CreateTextNode',
    });
  }

  useNodeDataValidation(CreateTextDataSchema, 'CreateText', validation.data, id);

  // Render --------------------------------------------------------------------
  return (
    <>
      {/* Editable label or icon */}
      {!isExpanded && spec.size.collapsed.width === 60 && spec.size.collapsed.height === 60 ? (
        <div className="absolute inset-0 flex justify-center text-lg p-1 text-foreground/80">
          {spec.icon && renderLucideIcon(spec.icon, "", 16)}
        </div>
      ) : (
        <LabelNode nodeId={id} label={spec.displayName} />
      )}

      {!isExpanded ? (
        <div className={CONTENT.collapsed}>
          <div className="text-center">
            <div className={`text-xs font-medium ${categoryStyles.primary} tracking-wide max-w-20 truncate`}>
              {validation.data.store === 'Default text' ? '' : (validation.data.store || '')}
            </div>
          </div>
        </div>
      ) : (
        <div className={CONTENT.expanded}>
          <textarea
            value={validation.data.store === 'Default text' ? '' : (validation.data.store || '')}
            onChange={(e) => updateNodeData({ store: e.target.value })}
            placeholder="Enter your content here…"
            className={`scrollbar nowheel bg-background rounded-md p-2 text-xs scrollbar-thumb-sky-700 scrollbar-track-sky-300 h-32 overflow-y-scroll focus:outline-none focus:ring-1 focus:ring-white-500 ${categoryStyles.primary}`}
          />
        </div>
      )}

      <ExpandCollapseButton showUI={isExpanded} onToggle={toggleExpand} size="sm" />
    </>
  );
});

// -----------------------------------------------------------------------------
// 5️⃣  High‑order wrapper – inject scaffold with dynamic spec
// -----------------------------------------------------------------------------

const CreateTextNodeWithDynamicSpec = (props: NodeProps) => {
  const { nodeData } = useNodeData(props.id, props.data);

  const dynamicSpec = useMemo(() => createDynamicSpec(nodeData as CreateTextData), [
    (nodeData as CreateTextData).expandedSize,
    (nodeData as CreateTextData).collapsedSize,
  ]);

  return withNodeScaffold(dynamicSpec, (p) => <CreateTextNode {...p} spec={dynamicSpec} />)(props);
};

export default CreateTextNodeWithDynamicSpec;
