/**
 * FLOW METADATA CONTEXT - Provides flow metadata to the editor
 *
 * • Provides flow name, privacy status, and other metadata
 * • Used by WorkflowManager and other components that need flow info
 * • Separate from flow store to avoid coupling with editor state
 *
 * Keywords: flow-metadata, context, provider, workflow-info
 */

"use client";

import type React from "react";
import { type ReactNode, createContext, useContext } from "react";

export interface FlowMetadata {
	id: string;
	name: string;
	description?: string;
	is_private: boolean;
	isOwner?: boolean;
	canEdit?: boolean;
	userPermission?: "view" | "edit" | "admin";
}

interface FlowMetadataContextType {
	flow: FlowMetadata | null;
}

const FlowMetadataContext = createContext<FlowMetadataContextType>({
	flow: null,
});

interface FlowMetadataProviderProps {
	children: ReactNode;
	flow: FlowMetadata | null;
}

export const FlowMetadataProvider: React.FC<FlowMetadataProviderProps> = ({ children, flow }) => {
	return <FlowMetadataContext.Provider value={{ flow }}>{children}</FlowMetadataContext.Provider>;
};

export const useFlowMetadata = () => {
	const context = useContext(FlowMetadataContext);
	if (context === undefined) {
		throw new Error("useFlowMetadata must be used within a FlowMetadataProvider");
	}
	return context;
};

// Optional hook that doesn't throw if used outside provider
export const useFlowMetadataOptional = () => {
	return useContext(FlowMetadataContext);
};
