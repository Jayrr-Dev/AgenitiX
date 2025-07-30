/**
 * Link Dialog Component for Rich Text Editor
 *
 * • Modal dialog for inserting/editing links
 * • URL validation and preview
 * • Accessibility support with keyboard navigation
 * • Integration with rich text editor
 *
 * Keywords: link-dialog, url-validation, modal, accessibility
 */

"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";

interface LinkDialogProps {
	isOpen: boolean;
	onClose: () => void;
	onInsert: (url: string, text: string) => void;
	initialUrl?: string;
	initialText?: string;
}

/**
 * Validate URL format
 */
function isValidUrl(url: string): boolean {
	try {
		const urlObj = new URL(url);
		return ["http:", "https:", "mailto:"].includes(urlObj.protocol);
	} catch {
		return false;
	}
}

export function LinkDialog({ 
	isOpen, 
	onClose, 
	onInsert, 
	initialUrl = "", 
	initialText = "" 
}: LinkDialogProps) {
	const [url, setUrl] = useState(initialUrl);
	const [text, setText] = useState(initialText);
	const [error, setError] = useState("");
	const urlInputRef = useRef<HTMLInputElement>(null);
	
	// Reset form when dialog opens
	useEffect(() => {
		if (isOpen) {
			setUrl(initialUrl);
			setText(initialText);
			setError("");
			// Focus URL input after a short delay
			setTimeout(() => {
				urlInputRef.current?.focus();
			}, 100);
		}
	}, [isOpen, initialUrl, initialText]);
	
	// Handle form submission
	const handleSubmit = useCallback((e: React.FormEvent) => {
		e.preventDefault();
		
		if (!url.trim()) {
			setError("URL is required");
			return;
		}
		
		if (!isValidUrl(url)) {
			setError("Please enter a valid URL (http://, https://, or mailto:)");
			return;
		}
		
		if (!text.trim()) {
			setError("Link text is required");
			return;
		}
		
		onInsert(url.trim(), text.trim());
		onClose();
	}, [url, text, onInsert, onClose]);
	
	// Handle keyboard events
	const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
		if (e.key === "Escape") {
			onClose();
		}
	}, [onClose]);
	
	// Auto-generate text from URL if text is empty
	const handleUrlChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
		const newUrl = e.target.value;
		setUrl(newUrl);
		setError("");
		
		// Auto-fill text if it's empty
		if (!text && newUrl) {
			try {
				const urlObj = new URL(newUrl);
				setText(urlObj.hostname);
			} catch {
				// If URL is not valid yet, use the input as-is
				setText(newUrl);
			}
		}
	}, [text]);
	
	if (!isOpen) return null;
	
	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
			<div 
				className="bg-white rounded-lg shadow-lg p-6 w-96 max-w-full mx-4"
				onKeyDown={handleKeyDown}
			>
				<h3 className="text-lg font-semibold mb-4">Insert Link</h3>
				
				<form onSubmit={handleSubmit}>
					<div className="mb-4">
						<label htmlFor="url-input" className="block text-sm font-medium text-gray-700 mb-1">
							URL
						</label>
						<input
							ref={urlInputRef}
							id="url-input"
							type="text"
							value={url}
							onChange={handleUrlChange}
							placeholder="https://example.com or mailto:user@example.com"
							className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
						/>
					</div>
					
					<div className="mb-4">
						<label htmlFor="text-input" className="block text-sm font-medium text-gray-700 mb-1">
							Link Text
						</label>
						<input
							id="text-input"
							type="text"
							value={text}
							onChange={(e) => {
								setText(e.target.value);
								setError("");
							}}
							placeholder="Click here"
							className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
						/>
					</div>
					
					{error && (
						<div className="mb-4 text-sm text-red-600 bg-red-50 p-2 rounded">
							{error}
						</div>
					)}
					
					<div className="flex justify-end gap-2">
						<button
							type="button"
							onClick={onClose}
							className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
						>
							Cancel
						</button>
						<button
							type="submit"
							className="px-4 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
						>
							Insert Link
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}