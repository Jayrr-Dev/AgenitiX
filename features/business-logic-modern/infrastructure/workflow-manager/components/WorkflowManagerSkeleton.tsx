/**
 * WORKFLOW MANAGER SKELETON - Loading state for workflow manager
 *
 * • Provides skeleton UI while workflow data is loading
 * • Matches the layout structure of the actual component
 * • Improves perceived performance and user experience
 * • Uses consistent theming with the rest of the application
 *
 * Keywords: skeleton-loading, loading-state, perceived-performance, ui-feedback
 */

"use client";

import React from "react";

interface WorkflowManagerSkeletonProps {
	className?: string;
}

export const WorkflowManagerSkeleton: React.FC<WorkflowManagerSkeletonProps> = ({ 
	className = "" 
}) => {
	return (
		<div className={`flex items-center justify-between gap-4 p-3 rounded-lg shadow-sm border animate-pulse ${className}`}>
			{/* Left Section - Back Button & Workflow Info */}
			<div className="flex items-center gap-3">
				{/* Back button skeleton */}
				<div className="h-10 w-10 bg-gray-200 rounded-md" />
				
				<div className="flex flex-col gap-2">
					{/* Title and badges skeleton */}
					<div className="flex items-center gap-2">
						<div className="h-6 w-48 bg-gray-200 rounded" />
						<div className="h-5 w-16 bg-gray-200 rounded-full" />
						<div className="h-5 w-20 bg-gray-200 rounded-full" />
					</div>
					
					{/* Stats skeleton */}
					<div className="flex items-center gap-2">
						<div className="h-3 w-12 bg-gray-200 rounded" />
						<div className="h-3 w-1 bg-gray-200 rounded" />
						<div className="h-3 w-20 bg-gray-200 rounded" />
					</div>
				</div>
			</div>

			{/* Center Section - Action Buttons */}
			<div className="flex items-center gap-2">
				<div className="h-10 w-10 bg-gray-200 rounded-md" />
				<div className="h-10 w-10 bg-gray-200 rounded-md" />
				<div className="h-10 w-10 bg-gray-200 rounded-md" />
			</div>

			{/* Right Section - Settings */}
			<div className="flex items-center gap-3">
				<div className="h-10 w-10 bg-gray-200 rounded-md" />
			</div>
		</div>
	);
};