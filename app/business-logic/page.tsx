/**
 * BUSINESS LOGIC PAGE - Modern flow editor interface
 *
 * • Renders the modern business logic flow editor
 * • Provides full-screen canvas for workflow creation
 * • Integrates with modern infrastructure components
 * • Uses client-side rendering for interactive flow editing
 * • Displays version information for debugging and tracking
 *
 * Keywords: flow-editor, business-logic, modern, workflow, canvas, version
 */

import FlowEditor from "@/features/business-logic-modern/infrastructure/flow-engine/FlowEditor";
import { VERSION } from "@/features/business-logic-modern/infrastructure/versioning/version";

// MAIN PAGE COMPONENT
export default function BusinessLogicPage() {
  return (
    <div className="h-screen w-screen relative">
      <FlowEditor />

      {/* VERSION DISPLAY - Bottom right corner */}
      <div className="absolute bottom-2 right-2 z-50 pointer-events-none select-none">
        <span className="text-xs text-gray-400/60 font-mono bg-black/10 backdrop-blur-sm px-2 py-1 rounded">
          v{VERSION.full}
        </span>
      </div>
    </div>
  );
}
