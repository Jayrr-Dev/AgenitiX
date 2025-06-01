/**
 * BUSINESS LOGIC PAGE - Modern flow editor interface
 *
 * • Renders the modern business logic flow editor
 * • Provides full-screen canvas for workflow creation
 * • Integrates with modern infrastructure components
 * • Uses client-side rendering for interactive flow editing
 *
 * Keywords: flow-editor, business-logic, modern, workflow, canvas
 */

import FlowEditor from "@/features/business-logic-modern/infrastructure/flow-engine/FlowEditor";

// MAIN PAGE COMPONENT
export default function BusinessLogicPage() {
  return (
    <div className="h-[100vh] w-[100vw]">
      <FlowEditor />
    </div>
  );
}
