/**
 * FLOW EDITOR LOADING COMPONENT - Loading state handler
 *
 * • Displays loading screen with appropriate messages during hydration
 * • Handles different loading states (mounting vs data loading)
 * • Provides user feedback during application initialization
 * • Clean loading UI with proper accessibility considerations
 * • Manages SSR/client-side hydration states gracefully
 *
 * Keywords: loading, hydration, SSR, mounting, user-feedback, accessibility
 */

// ============================================================================
// TYPESCRIPT INTERFACES
// ============================================================================

interface FlowEditorLoadingProps {
	mounted: boolean;
	hasHydrated: boolean;
}

// ============================================================================
// LOADING COMPONENT
// ============================================================================

/**
 * Loading screen component with proper hydration handling
 */
export function FlowEditorLoading({ mounted }: FlowEditorLoadingProps) {
	// LOADING MESSAGE LOGIC
	const loadingMessage = mounted ? "Loading saved data..." : "Loading Flow Editor...";

	// RENDER LOADING SCREEN
	return (
		<div className="flex h-screen items-center justify-center">
			<div className="text-lg">{loadingMessage}</div>
		</div>
	);
}
