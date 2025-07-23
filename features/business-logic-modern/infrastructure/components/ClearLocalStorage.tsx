/**
 * DEBUG TOOL - Development utility for clearing application state
 *
 * • Fixed position button for clearing localStorage data
 * • Confirmation dialog to prevent accidental data loss
 * • Page reload after clearing to reset application state
 * • Development-focused utility for testing and debugging
 * • Simple one-click solution for state reset during development
 *
 * Keywords: debug, localStorage, clear-data, development, reset, utility
 */

"use client";

import type React from "react";

/* -------------------------------------------------------------------------- */
/*  DESIGN CONSTANTS                                                          */
/* -------------------------------------------------------------------------- */

/** Wrapper positioning utility */
const positionWrapper = "fixed top-4 left-1/2 -translate-x-1/2 z-50" as const;

/** Core button styling – spacing, radius, etc. */
const styleButtonBase =
	"px-4 py-2 rounded-md shadow-lg transition-transform transition-colors duration-200 text-sm font-medium" as const;

/** Semantic colour tokens for destructive action – uses global destructive tokens to ensure good contrast in both themes */
const styleButtonColour = "bg-destructive text-destructive-foreground" as const;

/** Interactive hover/active feedback */
const styleButtonInteraction =
	"hover:shadow-effect-glow-error hover:scale-105 active:scale-100" as const;

/* -------------------------------------------------------------------------- */
/*  TYPES                                                                     */
/* -------------------------------------------------------------------------- */
interface ClearLocalStorageProps {
	className?: string;
}

/* -------------------------------------------------------------------------- */
/*  COMPONENT                                                                 */
/* -------------------------------------------------------------------------- */
const ClearLocalStorage: React.FC<ClearLocalStorageProps> = ({ className = "" }) => {
	// HANDLERS
	const handleClearLocalStorage = () => {
		if (window.confirm("Are you sure you want to clear all local storage data?")) {
			localStorage.clear();
			window.location.reload();
		}
	};

	// RENDER
	return (
		<div className={`${positionWrapper} ${className}`}>
			<button
				onClick={handleClearLocalStorage}
				className={`${styleButtonBase} ${styleButtonColour} ${styleButtonInteraction}`}
				title="Clear all local storage data"
			>
				Clear Local Storage
			</button>
		</div>
	);
};

export default ClearLocalStorage;
