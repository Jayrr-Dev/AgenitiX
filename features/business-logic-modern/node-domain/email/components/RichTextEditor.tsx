/**
 * Rich Text Editor Component for Email Creator
 *
 * • WYSIWYG editor with formatting toolbar
 * • HTML/Text/Rich mode switching
 * • Content sanitization and validation
 * • Keyboard shortcuts and accessibility
 * • Integration with email composition workflow
 *
 * Keywords: rich-text, wysiwyg, email-editor, formatting, sanitization
 */

"use client";

import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { LinkDialog } from "./LinkDialog";

// Types
interface RichTextEditorProps {
	value: {
		text: string;
		html: string;
		mode: "text" | "html" | "rich";
	};
	onChange: (content: { text: string; html: string; mode: "text" | "html" | "rich" }) => void;
	disabled?: boolean;
	placeholder?: string;
}

// Formatting commands for rich text
const FORMATTING_COMMANDS = {
	bold: { command: "bold", icon: "B", title: "Bold (Ctrl+B)" },
	italic: { command: "italic", icon: "I", title: "Italic (Ctrl+I)" },
	underline: { command: "underline", icon: "U", title: "Underline (Ctrl+U)" },
	strikethrough: { command: "strikeThrough", icon: "S", title: "Strikethrough" },
} as const;

const LIST_COMMANDS = {
	bulletList: { command: "insertUnorderedList", icon: "•", title: "Bullet List" },
	numberList: { command: "insertOrderedList", icon: "1.", title: "Numbered List" },
} as const;

const ALIGNMENT_COMMANDS = {
	left: { command: "justifyLeft", icon: "⬅", title: "Align Left" },
	center: { command: "justifyCenter", icon: "⬌", title: "Align Center" },
	right: { command: "justifyRight", icon: "➡", title: "Align Right" },
} as const;

const LINK_COMMANDS = {
	link: { icon: "🔗", title: "Insert Link" },
	unlink: { command: "unlink", icon: "🔗⃠", title: "Remove Link" },
} as const;

/**
 * HTML Sanitization - Basic XSS protection
 */
function sanitizeHTML(html: string): string {
	// Create a temporary div to parse HTML
	const temp = document.createElement("div");
	temp.innerHTML = html;

	// Remove script tags and event handlers
	const scripts = temp.querySelectorAll("script");
	scripts.forEach((script) => script.remove());

	// Remove dangerous attributes
	const allElements = temp.querySelectorAll("*");
	allElements.forEach((element) => {
		// Remove event handlers
		Array.from(element.attributes).forEach((attr) => {
			if (attr.name.startsWith("on")) {
				element.removeAttribute(attr.name);
			}
		});

		// Remove javascript: links
		if (element.getAttribute("href")?.startsWith("javascript:")) {
			element.removeAttribute("href");
		}
	});

	return temp.innerHTML;
}

/**
 * Convert HTML to plain text
 */
function htmlToText(html: string): string {
	const temp = document.createElement("div");
	temp.innerHTML = html;
	return temp.textContent || temp.innerText || "";
}

/**
 * Convert plain text to HTML with line breaks
 */
function textToHTML(text: string): string {
	return text
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/\n/g, "<br>");
}

export function RichTextEditor({
	value,
	onChange,
	disabled = false,
	placeholder = "Enter your message...",
}: RichTextEditorProps) {
	const editorRef = useRef<HTMLDivElement>(null);
	const [isEditorFocused, setIsEditorFocused] = useState(false);
	const [showLinkDialog, setShowLinkDialog] = useState(false);
	const [selectedRange, setSelectedRange] = useState<Range | null>(null);

	// Update editor content when value changes externally
	useEffect(() => {
		if (editorRef.current && value.mode === "rich") {
			const currentHTML = editorRef.current.innerHTML;
			if (currentHTML !== value.html) {
				editorRef.current.innerHTML = value.html;
			}
		}
	}, [value.html, value.mode]);

	// Handle content changes from the editor
	const handleEditorInput = useCallback(() => {
		if (!editorRef.current || disabled) {
			return;
		}

		const html = sanitizeHTML(editorRef.current.innerHTML);
		const text = htmlToText(html);

		onChange({
			...value,
			html,
			text,
		});
	}, [value, onChange, disabled]);

	// Handle mode switching
	const handleModeChange = useCallback(
		(newMode: "text" | "html" | "rich") => {
			const newContent = { ...value, mode: newMode };

			// Convert content when switching modes
			if (newMode === "text" && value.mode !== "text") {
				// Converting to text mode
				newContent.text = htmlToText(value.html);
			} else if (newMode === "html" && value.mode === "text") {
				// Converting from text to HTML
				newContent.html = textToHTML(value.text);
			} else if (newMode === "rich" && value.mode === "text") {
				// Converting from text to rich
				newContent.html = textToHTML(value.text);
			}

			onChange(newContent);
		},
		[value, onChange]
	);

	// Execute formatting command
	const executeCommand = useCallback(
		(command: string, value?: string) => {
			if (disabled) {
				return;
			}

			document.execCommand(command, false, value);
			handleEditorInput();

			// Keep focus on editor
			if (editorRef.current) {
				editorRef.current.focus();
			}
		},
		[disabled, handleEditorInput]
	);

	// Handle link insertion
	const handleLinkClick = useCallback(() => {
		if (disabled) {
			return;
		}

		// Save current selection
		const selection = window.getSelection();
		if (selection && selection.rangeCount > 0) {
			setSelectedRange(selection.getRangeAt(0).cloneRange());
		}

		setShowLinkDialog(true);
	}, [disabled]);

	// Insert link
	const handleInsertLink = useCallback(
		(url: string, text: string) => {
			if (!editorRef.current || disabled) {
				return;
			}

			// Restore selection
			if (selectedRange) {
				const selection = window.getSelection();
				if (selection) {
					selection.removeAllRanges();
					selection.addRange(selectedRange);
				}
			}

			// Create link HTML
			const linkHtml = `<a href="${url}" target="_blank" rel="noopener noreferrer">${text}</a>`;

			// Insert the link
			document.execCommand("insertHTML", false, linkHtml);
			handleEditorInput();

			// Focus back on editor
			editorRef.current.focus();
		},
		[selectedRange, disabled, handleEditorInput]
	);

	// Handle keyboard shortcuts
	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			if (disabled) {
				return;
			}

			if (e.ctrlKey || e.metaKey) {
				switch (e.key.toLowerCase()) {
					case "b":
						e.preventDefault();
						executeCommand("bold");
						break;
					case "i":
						e.preventDefault();
						executeCommand("italic");
						break;
					case "u":
						e.preventDefault();
						executeCommand("underline");
						break;
				}
			}
		},
		[disabled, executeCommand]
	);

	// Render mode buttons
	const renderModeButtons = () => (
		<div className="flex gap-1 mb-2">
			{(["rich", "html", "text"] as const).map((mode) => (
				<button
					key={mode}
					type="button"
					onClick={() => handleModeChange(mode)}
					className={`px-2 py-1 text-xs rounded border ${
						value.mode === mode
							? "bg-blue-500 text-white border-blue-500"
							: "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
					} ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
					disabled={disabled}
				>
					{mode.charAt(0).toUpperCase() + mode.slice(1)}
				</button>
			))}
		</div>
	);

	// Render formatting toolbar for rich mode
	const renderToolbar = () => {
		if (value.mode !== "rich" || disabled) {
			return null;
		}

		return (
			<div className="border-b border-gray-200 p-2 mb-2 flex flex-wrap gap-1">
				{/* Formatting buttons */}
				{Object.entries(FORMATTING_COMMANDS).map(([key, cmd]) => (
					<button
						key={key}
						type="button"
						onClick={() => executeCommand(cmd.command)}
						className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50 font-bold"
						title={cmd.title}
						disabled={disabled}
					>
						{cmd.icon}
					</button>
				))}

				<div className="w-px h-6 bg-gray-300 mx-1" />

				{/* List buttons */}
				{Object.entries(LIST_COMMANDS).map(([key, cmd]) => (
					<button
						key={key}
						type="button"
						onClick={() => executeCommand(cmd.command)}
						className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50"
						title={cmd.title}
						disabled={disabled}
					>
						{cmd.icon}
					</button>
				))}

				<div className="w-px h-6 bg-gray-300 mx-1" />

				{/* Alignment buttons */}
				{Object.entries(ALIGNMENT_COMMANDS).map(([key, cmd]) => (
					<button
						key={key}
						type="button"
						onClick={() => executeCommand(cmd.command)}
						className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50"
						title={cmd.title}
						disabled={disabled}
					>
						{cmd.icon}
					</button>
				))}

				<div className="w-px h-6 bg-gray-300 mx-1" />

				{/* Link buttons */}
				<button
					type="button"
					onClick={handleLinkClick}
					className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50"
					title={LINK_COMMANDS.link.title}
					disabled={disabled}
				>
					{LINK_COMMANDS.link.icon}
				</button>
				<button
					type="button"
					onClick={() => executeCommand(LINK_COMMANDS.unlink.command)}
					className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50"
					title={LINK_COMMANDS.unlink.title}
					disabled={disabled}
				>
					{LINK_COMMANDS.unlink.icon}
				</button>
			</div>
		);
	};

	// Render editor based on mode
	const renderEditor = () => {
		if (value.mode === "rich") {
			return (
				<div
					ref={editorRef}
					contentEditable={!disabled}
					onInput={handleEditorInput}
					onFocus={() => setIsEditorFocused(true)}
					onBlur={() => setIsEditorFocused(false)}
					onKeyDown={handleKeyDown}
					className={`w-full min-h-[120px] p-3 border rounded text-sm ${
						disabled ? "bg-gray-100 cursor-not-allowed" : "bg-white"
					} ${isEditorFocused ? "border-blue-500 ring-1 ring-blue-500" : "border-gray-300"}`}
					style={{ outline: "none" }}
					suppressContentEditableWarning={true}
				/>
			);
		}

		if (value.mode === "html") {
			return (
				<Textarea
					value={value.html}
					onChange={(e) =>
						onChange({
							...value,
							html: sanitizeHTML(e.target.value),
							text: htmlToText(e.target.value),
						})
					}
					placeholder="Enter HTML content..."
					className="w-full h-32 p-3 text-sm font-mono resize-none"
					disabled={disabled}
				/>
			);
		}

		// Text mode
		return (
			<Textarea
				value={value.text}
				onChange={(e) =>
					onChange({
						...value,
						text: e.target.value,
						html: textToHTML(e.target.value),
					})
				}
				placeholder={placeholder}
				className="w-full h-32 p-3 text-sm resize-none"
				disabled={disabled}
			/>
		);
	};

	return (
		<div className="rich-text-editor">
			{renderModeButtons()}
			{renderToolbar()}
			{renderEditor()}

			{/* Content info */}
			<div className="mt-2 text-xs text-gray-500 flex justify-between">
				<span>
					Mode: {value.mode} | Characters: {value.text.length}
				</span>
				{value.mode === "rich" && <span>Use Ctrl+B, Ctrl+I, Ctrl+U for formatting</span>}
			</div>

			{/* Link Dialog */}
			<LinkDialog
				isOpen={showLinkDialog}
				onClose={() => setShowLinkDialog(false)}
				onInsert={handleInsertLink}
			/>
		</div>
	);
}
