/**
 * BUSINESS LOGIC PAGE - Modern flow editor interface
 *
 * • Renders the modern business logic flow editor
 * • Provides full-screen canvas for workflow creation
 * • Integrates with modern infrastructure components
 * • Uses client-side rendering for interactive flow editing
 * • Displays version information for debugging and tracking
 * • Protected route requiring authentication
 *
 * Keywords: flow-editor, business-logic, modern, workflow, canvas, version, protected
 */

"use client";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import FlowEditor from "@/features/business-logic-modern/infrastructure/flow-engine/FlowEditor";
import { VERSION } from "@/features/business-logic-modern/infrastructure/versioning";

const BusinessLogicContent = () => {
	return (
		<div className="relative h-[100vh] w-[100vw]">
			<FlowEditor />

			{/* VERSION DISPLAY - Bottom right corner */}
			<div className="pointer-events-none absolute right-2 bottom-2 z-50 select-none">
				<span className="rounded bg-black/10 px-2 py-1 font-mono text-gray-400/60 text-xs backdrop-blur-sm">
					v{VERSION.full}
				</span>
			</div>
		</div>
	);
};

// MAIN PAGE COMPONENT - PROTECTED
export default function BusinessLogicPage() {
	return (
		<ProtectedRoute>
			<BusinessLogicContent />
		</ProtectedRoute>
	);
}
