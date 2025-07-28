/**
 * FLOW CONTEXT - Provides flow metadata to components
 *
 * • Shares flow information across the editor
 * • Provides flow name, privacy status, and permissions
 * • Used by WorkflowManager and other components
 * • Integrates with Convex flow data
 *
 * Keywords: context, flow-metadata, sharing, permissions
 */

"use client";

import React, { createContext, useContext, type ReactNode } from "react";

// Flow metadata interface
export interface FlowMetadata {
	id: string;
	name: string;
	description?: string;
	icon?: string;
	is_private: boolean;
	user_id: string;
	created_at: string;
	updated_at: string;
	// Access control fields
	userPermission?: "view" | "edit" | "admin";
	canEdit?: boolean;
	canView?: boolean;
	isOwner?: boolean;
}

interface FlowContextValue {
	flow: FlowMetadata | null;
	setFlow: (flow: FlowMetadata | null) => void;
}

const FlowContext = createContext<FlowContextValue | undefined>(undefined);

interface FlowProviderProps {
	children: ReactNode;
	initialFlow?: FlowMetadata | null;
}

export const FlowProvider: React.FC<FlowProviderProps> = ({ children, initialFlow = null }) => {
	const [flow, setFlow] = React.useState<FlowMetadata | null>(initialFlow);

	return <FlowContext.Provider value={{ flow, setFlow }}>{children}</FlowContext.Provider>;
};

export const useFlowContext = () => {
	const context = useContext(FlowContext);
	if (context === undefined) {
		throw new Error("useFlowContext must be used within a FlowProvider");
	}
	return context;
};

export const useFlowMetadata = () => {
	const { flow } = useFlowContext();
	return flow;
};
