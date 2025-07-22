/**
 * NODE ERROR BOUNDARY - Isolates runtime errors to individual nodes
 *
 * • Catches any rendering/runtime error thrown by a node component
 * • Prevents the entire React Flow canvas from unmounting
 * • Logs the error via flowStore.logNodeError so it appears in inspector
 * • Displays a minimal fallback UI inside the node (red background + icon)
 * • Active only for its wrapped node; other nodes remain functional
 *
 * Keywords: error-boundary, react, node-isolation, runtime-errors, flowStore
 */

import { useFlowStore } from "@/features/business-logic-modern/infrastructure/flow-engine/stores/flowStore";
import React from "react";

interface NodeErrorBoundaryProps {
	nodeId: string;
	children: React.ReactNode;
}

interface NodeErrorBoundaryState {
	hasError: boolean;
	message: string;
}

// Stable class component
class NodeErrorBoundaryClass extends React.Component<
	{
		nodeId: string;
		onError: (msg: string) => void;
		onReset: () => void;
		children: React.ReactNode;
	},
	NodeErrorBoundaryState
> {
	state: NodeErrorBoundaryState = { hasError: false, message: "" };

	static getDerivedStateFromError(error: Error): NodeErrorBoundaryState {
		return { hasError: true, message: error.message };
	}

	componentDidCatch(error: Error) {
		this.props.onError(error.message);
	}

	handleReset = () => {
		this.setState({ hasError: false, message: "" });
		this.props.onReset();
	};

	render() {
		if (this.state.hasError) {
			return (
				<div
					className="flex flex-col items-center justify-center w-full h-full bg-red-500/20 text-red-700 p-2 text-xs select-none"
					onDoubleClick={this.handleReset}
					title="Double-click to reset error state"
				>
					<span className="text-lg">💥</span>
					<span className="mt-1">Node Error</span>
				</div>
			);
		}
		return this.props.children as React.ReactElement;
	}
}

// Functional wrapper to inject store callbacks once (stable refs)
const NodeErrorBoundary: React.FC<NodeErrorBoundaryProps> = ({ nodeId, children }) => {
	const { logNodeError, clearNodeErrors } = useFlowStore();

	const onError = React.useCallback(
		(msg: string) => logNodeError(nodeId, msg, "error", "ERROR_BOUNDARY"),
		[logNodeError, nodeId]
	);

	const onReset = React.useCallback(() => clearNodeErrors(nodeId), [clearNodeErrors, nodeId]);

	return (
		<NodeErrorBoundaryClass nodeId={nodeId} onError={onError} onReset={onReset}>
			{children}
		</NodeErrorBoundaryClass>
	);
};

export default NodeErrorBoundary;
