/**
 * Test Toast Node - Demonstrates the node toast system
 * 
 * A test node that showcases all toast types and functionality.
 * Useful for testing and demonstrating the toast notification system.
 * 
 * @example
 * <TestToastNode 
 *   id="node-123"
 *   data={{}}
 * />
 */

import type { NodeProps } from "@xyflow/react";
import { memo, useCallback } from "react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import type { NodeSpec } from "@/features/business-logic-modern/infrastructure/node-core/NodeSpec";
import {
  SafeSchemas,
  createSafeInitialData,
} from "@/features/business-logic-modern/infrastructure/node-core/utils/schema-helpers";
import { withNodeScaffold } from "@/features/business-logic-modern/infrastructure/node-core/withNodeScaffold";
import { CATEGORIES } from "@/features/business-logic-modern/infrastructure/theming/categories";
import {
  COLLAPSED_SIZES,
  EXPANDED_SIZES,
} from "@/features/business-logic-modern/infrastructure/theming/sizing";
import { useNodeData } from "@/hooks/useNodeData";
import { useNodeToast } from "@/hooks/useNodeToast";

// Schema & Types
export const TestToastDataSchema = z
  .object({
    isEnabled: SafeSchemas.boolean(true),
    isActive: SafeSchemas.boolean(false),
    isExpanded: SafeSchemas.boolean(true),
    expandedSize: SafeSchemas.text("VE2"),
    collapsedSize: SafeSchemas.text("C2"),
    label: z.string().optional(),
  })
  .passthrough();

export type TestToastData = z.infer<typeof TestToastDataSchema>;

// Dynamic spec factory
function createDynamicSpec(data: TestToastData): NodeSpec {
  const expanded = EXPANDED_SIZES[data.expandedSize as keyof typeof EXPANDED_SIZES];
  const collapsed = COLLAPSED_SIZES[data.collapsedSize as keyof typeof COLLAPSED_SIZES];

  return {
    kind: "testToast",
    displayName: "Test Toast",
    label: "Test Toast",
    category: CATEGORIES.TEST,
    size: { expanded, collapsed },
    handles: [],
    inspector: { key: "TestToastInspector" },
    version: 1,
    initialData: createSafeInitialData(TestToastDataSchema, {}),
    dataSchema: TestToastDataSchema,
    controls: {
      autoGenerate: true,
      excludeFields: ["isActive"],
      customFields: [
        { key: "isEnabled", type: "boolean", label: "Enable" },
        { key: "isExpanded", type: "boolean", label: "Expand" },
      ],
    },
    icon: "LuMessageSquare",
    author: "Agenitix Team",
    description: "Test node for demonstrating toast notifications",
    feature: "test",
    tags: ["test", "toast", "notifications", "demo"],
    theming: {},
  };
}

/** Static spec for registry */
export const spec: NodeSpec = createDynamicSpec({
  expandedSize: "VE2",
  collapsedSize: "C2",
} as TestToastData);

// Component
const TestToastNode = memo(({ id, data, spec }: NodeProps & { spec: NodeSpec }) => {
  const { nodeData } = useNodeData(id, data);
  const { showSuccess, showError, showWarning, showInfo, showToast, clearToasts } = useNodeToast(id);

  const { isExpanded, isEnabled } = nodeData as TestToastData;

  // Toast demo handlers
  const handleSuccess = useCallback(() => {
    showSuccess("Operation successful!", "This is a success message");
  }, [showSuccess]);

  const handleError = useCallback(() => {
    showError("Something went wrong", "This is an error message with details");
  }, [showError]);

  const handleWarning = useCallback(() => {
    showWarning("Warning message", "This is a warning about something important");
  }, [showWarning]);

  const handleInfo = useCallback(() => {
    showInfo("Information", "This is an informational message");
  }, [showInfo]);

  const handleCustom = useCallback(() => {
    showToast({
      type: "success",
      message: "Custom toast",
      description: "This toast has custom settings",
      duration: 8000,
      dismissible: true,
    });
  }, [showToast]);

  const handleMultiple = useCallback(() => {
    showSuccess("First toast");
    setTimeout(() => showWarning("Second toast"), 500);
    setTimeout(() => showInfo("Third toast"), 1000);
    setTimeout(() => showError("Fourth toast"), 1500);
  }, [showSuccess, showWarning, showInfo, showError]);

  const handlePersistent = useCallback(() => {
    showToast({
      type: "info",
      message: "Persistent toast",
      description: "This toast won't auto-dismiss",
      duration: 0,
      dismissible: true,
    });
  }, [showToast]);

  const handleClear = useCallback(() => {
    clearToasts();
  }, [clearToasts]);

  if (!isExpanded) {
    return (
      <div className="flex items-center justify-center w-full h-full">
        <Button
          size="sm"
          onClick={handleSuccess}
          disabled={!isEnabled}
          className="text-xs"
        >
          Test
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-3">
      <div className="text-sm font-medium text-center mb-4">
        Toast Test Panel
      </div>
      
      <div className="grid grid-cols-2 gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={handleSuccess}
          disabled={!isEnabled}
          className="text-xs bg-green-50 hover:bg-green-100 border-green-200 text-green-800"
        >
          Success
        </Button>
        
        <Button
          size="sm"
          variant="outline"
          onClick={handleError}
          disabled={!isEnabled}
          className="text-xs bg-red-50 hover:bg-red-100 border-red-200 text-red-800"
        >
          Error
        </Button>
        
        <Button
          size="sm"
          variant="outline"
          onClick={handleWarning}
          disabled={!isEnabled}
          className="text-xs bg-yellow-50 hover:bg-yellow-100 border-yellow-200 text-yellow-800"
        >
          Warning
        </Button>
        
        <Button
          size="sm"
          variant="outline"
          onClick={handleInfo}
          disabled={!isEnabled}
          className="text-xs bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-800"
        >
          Info
        </Button>
      </div>

      <div className="space-y-2">
        <Button
          size="sm"
          variant="outline"
          onClick={handleCustom}
          disabled={!isEnabled}
          className="w-full text-xs"
        >
          Custom Toast
        </Button>
        
        <Button
          size="sm"
          variant="outline"
          onClick={handleMultiple}
          disabled={!isEnabled}
          className="w-full text-xs"
        >
          Multiple Toasts
        </Button>
        
        <Button
          size="sm"
          variant="outline"
          onClick={handlePersistent}
          disabled={!isEnabled}
          className="w-full text-xs"
        >
          Persistent Toast
        </Button>
        
        <Button
          size="sm"
          variant="destructive"
          onClick={handleClear}
          className="w-full text-xs"
        >
          Clear All
        </Button>
      </div>
    </div>
  );
});

// Wrapper with dynamic spec
const TestToastNodeWithDynamicSpec = memo((props: NodeProps) => {
  const { nodeData } = useNodeData(props.id, props.data);
  const typedData = nodeData as TestToastData;

  const dynamicSpec = createDynamicSpec(typedData);
  const ScaffoldedNode = withNodeScaffold(dynamicSpec, (p) => 
    <TestToastNode {...p} spec={dynamicSpec} />
  );

  return <ScaffoldedNode {...props} />;
});

TestToastNode.displayName = "TestToastNode";
TestToastNodeWithDynamicSpec.displayName = "TestToastNodeWithDynamicSpec";

export default TestToastNodeWithDynamicSpec;