/**
 * MARKETING TYPES - Type definitions for marketing components
 */

import type React from "react";

export type typeFeatureBoxesIconed = {
	src: string;
	heading: string;
	title: string | React.ReactNode;
	message: string;
	ctaText: string;
	ctaLink: string;
	component?: React.ReactNode;
};

export type slide = {
	type: "video" | "image" | "component";
	src: string;
	heading: string;
	title: string | React.ReactNode;
	message: string;
	ctaText: string;
	ctaLink: string;
	component?: React.ReactNode;
};

export type imageMarquee = string[];
