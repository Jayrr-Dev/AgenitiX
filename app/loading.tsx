import React from "react";
import { twMerge } from "tailwind-merge";
import { CustomLogo } from "@/branding/custom-logo";
import { CustomBrandWordmark } from "@/branding/custom-logo";
import { cn } from "@/lib/utils";

// LOADING COMPONENT FOLLOWING DASHBOARD PATTERN
export default function Loading() {
    // CONTAINER CLASSES FOR CENTERING
    const containerClasses = twMerge(
        "flex items-center justify-center w-full h-full min-h-screen"
    );

    // OUTER RING: GRADIENT BACKGROUND, SPINNING - RED & BLUE
    const outerClasses = twMerge(
        "inline-block animate-spin rounded-full",
        "w-12 h-12", // Size
        "p-0.5", // Ring thickness
        "bg-gradient-to-r from-red-500 via-blue-500 to-red-500" // Red & Blue gradient
    );

    // INNER CIRCLE: COVERS GRADIENT CENTER, CREATES RING EFFECT
    const innerClasses = twMerge(
        "rounded-full w-full h-full",
        "bg-background" // Matches page background
    );

    return (
        <div className={containerClasses}>
            <div className={outerClasses}>
                <div
                    role="status"
                    aria-label="Loading"
                    className={innerClasses}
                />
            </div>
        </div>
    );
}

