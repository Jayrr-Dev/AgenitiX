/**
 * WORKFLOW ERROR BOUNDARY - Error handling for workflow manager components
 *
 * • Catches and handles React component errors gracefully
 * • Provides fallback UI for better user experience
 * • Logs errors for debugging and monitoring
 * • Follows React error boundary best practices
 *
 * Keywords: error-boundary, error-handling, fallback-ui, react-error-boundary
 */

"use client";

import React, { Component, type ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface WorkflowErrorBoundaryState {
	hasError: boolean;
	error?: Error;
	errorInfo?: React.ErrorInfo;
}

interface WorkflowErrorBoundaryProps {
	children: ReactNode;
	fallback?: ReactNode;
	onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

export class WorkflowErrorBoundary extends Component<
	WorkflowErrorBoundaryProps,
	WorkflowErrorBoundaryState
> {
	constructor(props: WorkflowErrorBoundaryProps) {
		super(props);
		this.state = { hasError: false };
	}

	static getDerivedStateFromError(error: Error): WorkflowErrorBoundaryState {
		// Update state to show fallback UI, basically prevents app crash
		return { hasError: true, error };
	}

	componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
		// Log error details for debugging
		console.error('WorkflowManager Error Boundary caught an error:', error, errorInfo);
		
		// Update state with error details
		this.setState({
			error,
			errorInfo,
		});

		// Call optional error handler
		this.props.onError?.(error, errorInfo);
	}

	handleRetry = () => {
		this.setState({ hasError: false, error: undefined, errorInfo: undefined });
	};

	render() {
		if (this.state.hasError) {
			// Custom fallback UI or default error display
			if (this.props.fallback) {
				return this.props.fallback;
			}

			return (
				<div className="flex items-center justify-center p-6 border border-red-200 bg-red-50 rounded-lg">
					<div className="text-center space-y-4">
						<div className="flex justify-center">
							<AlertTriangle className="h-12 w-12 text-red-500" />
						</div>
						<div>
							<h3 className="text-lg font-semibold text-red-900">
								Workflow Manager Error
							</h3>
							<p className="text-red-700 mt-2">
								Something went wrong while loading the workflow manager.
							</p>
							{this.state.error && (
								<details className="mt-4 text-sm text-red-600">
									<summary className="cursor-pointer hover:text-red-800">
										Error Details
									</summary>
									<pre className="mt-2 text-left bg-red-100 p-2 rounded text-xs overflow-auto">
										{this.state.error.message}
									</pre>
								</details>
							)}
						</div>
						<button
							onClick={this.handleRetry}
							className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
						>
							<RefreshCw className="h-4 w-4" />
							Try Again
						</button>
					</div>
				</div>
			);
		}

		return this.props.children;
	}
}