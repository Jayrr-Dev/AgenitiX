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
		<div className="h-[100vh] w-[100vw] relative">
			<FlowEditor />

			{/* VERSION DISPLAY - Bottom right corner */}
			<div className="absolute bottom-2 right-2 z-50 pointer-events-none select-none">
				<span className="text-xs text-gray-400/60 font-mono bg-black/10 backdrop-blur-sm px-2 py-1 rounded">
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
