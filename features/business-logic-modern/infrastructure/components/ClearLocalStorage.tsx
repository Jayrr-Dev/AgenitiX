/**
 * DEBUG TOOL - Development utility for clearing application state
 *
 * • Fixed position button for clearing localStorage data
 * • Confirmation dialog to prevent accidental data loss
 * • Page reload after clearing to reset application state
 * • Development-focused utility for testing and debugging
 * • Simple one-click solution for state reset during development
 * • Preserves authentication session to maintain user login
 *
 * Keywords: debug, localStorage, clear-data, development, reset, utility, session-preservation
 */

"use client";

import { Trash2 } from "lucide-react";
import type React from "react";

/* -------------------------------------------------------------------------- */
/*  DESIGN CONSTANTS                                                          */
/* -------------------------------------------------------------------------- */

/** Wrapper positioning utility - left center */
const positionWrapper = "fixed left-4 top-1/2 -translate-y-1/2 z-50" as const;

/** Core button styling – square with icon */
const styleButtonBase =
	"w-10 h-10 rounded-md shadow-lg transition-transform transition-colors duration-200 flex items-center justify-center" as const;

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
			// Preserve important session data
			const preservedData = {
				authToken: localStorage.getItem("agenitix_auth_token"),
				// Add other important keys here as needed
			};

			// Clear all localStorage
			localStorage.clear();

			// Restore preserved data
			if (preservedData.authToken) {
				localStorage.setItem("agenitix_auth_token", preservedData.authToken);
			}

			window.location.reload();
		}
	};

	// RENDER
	return (
		<div className={`${positionWrapper} ${className}`}>
			<button
				type="button"
				onClick={handleClearLocalStorage}
				className={`${styleButtonBase} ${styleButtonColour} ${styleButtonInteraction}`}
				title="Clear all local storage data"
			>
				<Trash2 className="h-4 w-4" />
			</button>
		</div>
	);
};

export default ClearLocalStorage;
