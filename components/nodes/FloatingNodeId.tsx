/**
 * FLOATING NODE ID COMPONENT - Displays node ID with copy functionality
 *
 * • Shows node ID in a floating overlay with copy-to-clipboard functionality
 * • Provides visual feedback for copy operations with toast notifications
 * • Supports keyboard shortcuts for quick copying and dismissal
 * • Integrates with node theming system for consistent styling
 * • Auto-hides after successful copy or on outside click
 *
 * Keywords: node-id, floating-overlay, copy-clipboard, keyboard-shortcuts, theming
 */

"use client";

import { Check, Copy } from "lucide-react";
import type React from "react";
import { useCallback, useState } from "react";

interface FloatingNodeIdProps {
	nodeId: string;
	position: { x: number; y: number };
	onClose: () => void;
}

export const FloatingNodeId: React.FC<FloatingNodeIdProps> = ({ nodeId, position, onClose }) => {
	const [copied, setCopied] = useState(false);

	const handleCopy = useCallback(async () => {
		try {
			await navigator.clipboard.writeText(nodeId);
			setCopied(true);
			setTimeout(() => {
				setCopied(false);
				onClose();
			}, 1000);
		} catch (error) {
			console.error("Failed to copy node ID:", error);
		}
	}, [nodeId, onClose]);

	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			if (e.key === "Enter" || e.key === " ") {
				e.preventDefault();
				handleCopy();
			} else if (e.key === "Escape") {
				e.preventDefault();
				onClose();
			}
		},
		[handleCopy, onClose]
	);

	return (
		<div
			className="pointer-events-auto fixed z-50"
			style={{
				left: position.x,
				top: position.y,
				transform: "translate(-50%, -100%)",
			}}
		>
			<div className="min-w-48 rounded-lg border-info bg-info p-3 shadow-lg">
				<div className="flex items-center gap-2">
					<div className="flex-1">
						<div className="mb-1 font-medium text-info-text text-xs">Node ID</div>
						<div className="break-all font-mono text-info-text-secondary text-sm">{nodeId}</div>
					</div>
					<button
						type="button"
						onClick={handleCopy}
						onKeyDown={handleKeyDown}
						className="rounded p-2 transition-colors hover:bg-info-hover focus:outline-none focus:ring-2 focus:ring-primary"
						title={copied ? "Copied!" : "Copy to clipboard"}
					>
						{copied ? (
							<Check className="h-4 w-4 text-success" />
						) : (
							<Copy className="h-4 w-4 text-info-text-secondary" />
						)}
					</button>
				</div>
				{copied && (
					<div className="mt-2 font-medium text-success text-xs">Copied to clipboard!</div>
				)}
			</div>
		</div>
	);
};
