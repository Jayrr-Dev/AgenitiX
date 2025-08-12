"use client";

import * as TabsPrimitive from "@radix-ui/react-tabs";
import type * as React from "react";

import { cn } from "@/lib/utils";

function Tabs({ className, variant = "default", ...props }: React.ComponentProps<typeof TabsPrimitive.Root> & { variant?: "default" | "node" }) {
	const variants = {
		default: "flex flex-col gap-1",
		node: "flex flex-col gap-1"
	};

	return (
		<TabsPrimitive.Root
			data-slot="tabs"
			className={cn(variants[variant], className)}
			{...props}
		/>
	);
}

function TabsList({ className, variant = "default", ...props }: React.ComponentProps<typeof TabsPrimitive.List> & { variant?: "default" | "node" }) {
	const variants = {
		default: "inline-flex h-8 w-fit items-center justify-center rounded-sm bg-muted p-[0px] text-muted-foreground mb-1",
		node: "inline-flex h-5.5 w-fit items-center justify-center rounded-sm bg-muted p-[2px] text-muted-foreground"
	};

	return (
		<TabsPrimitive.List
			data-slot="tabs-list"
			className={cn(variants[variant], className)}
			{...props}
		/>
	);
}

function TabsTrigger({ className, variant = "default", ...props }: React.ComponentProps<typeof TabsPrimitive.Trigger> & { variant?: "default" | "node" }) {
	const variants = {
		default: "inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1 whitespace-nowrap rounded-md border border-transparent px-1 py-1 font-medium text-foreground text-sm transition-[ color,box-shadow] focus-visible:border-ring focus-visible:outline-1 focus-visible:outline-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:shadow-sm dark:text-muted-foreground dark:data-[state=active]:border-input dark:data-[state=active]:bg-input/30 dark:data-[state=active]:text-foreground [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
		node: "inline-flex h-[calc(100%-0px)] flex-1 items-center justify-center gap-1 whitespace-nowrap rounded-sm border border-transparent px-3 pb-0.5 font-medium text-foreground text-[10px] transition-[color,box-shadow] focus-visible:border-ring focus-visible:outline-1 focus-visible:outline-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:shadow-sm dark:text-muted-foreground dark:data-[state=active]:border-input dark:data-[state=active]:bg-input/30 dark:data-[state=active]:text-foreground [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0"
	};

	return (
		<TabsPrimitive.Trigger
			data-slot="tabs-trigger"
			className={cn(variants[variant], className)}
			{...props}
		/>
	);
}

function TabsContent({ className, variant = "default", ...props }: React.ComponentProps<typeof TabsPrimitive.Content> & { variant?: "default" | "node" }) {
	const variants = {
		default: "flex-1 outline-none",
		node: "flex-1 outline-none"
	};

	return (
		<TabsPrimitive.Content
			data-slot="tabs-content"
			className={cn(variants[variant], className)}
			{...props}
		/>
	);
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
