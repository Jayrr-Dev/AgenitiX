export interface NodeStencil {
	id: string;
	nodeType: string;
	label: string;
	description: string;
	icon?: string;
	category?: string;
	folder?: string;
}

export type SidebarVariant = "A" | "B" | "C" | "D" | "E";

// Variant display names
export const VARIANT_NAMES: Record<SidebarVariant, string> = {
	A: "Main",
	B: "Media",
	C: "Integration",
	D: "Automation",
	E: "Misc",
};

export interface TabConfig {
	key: string;
	label: string;
}

// Tab configurations for each variant
export const TAB_CONFIG_A: readonly TabConfig[] = [
	{ key: "MAIN", label: "Main" },
	{ key: "ADVANCED", label: "Advanced" },
	{ key: "IO", label: "I/O" },
];

export const TAB_CONFIG_B: readonly TabConfig[] = [
	{ key: "CREATE", label: "Create" },
	{ key: "VIEW", label: "View" },
	{ key: "TRIGGER", label: "Trigger" },
	{ key: "TEST", label: "Test" },
	{ key: "CYCLE", label: "Cycle" },
	{ key: "STORE", label: "Store" },
];

export const TAB_CONFIG_C: readonly TabConfig[] = [{ key: "ALL", label: "All Nodes" }];

export const TAB_CONFIG_D: readonly TabConfig[] = [{ key: "TOP_NODES", label: "Top Nodes" }];

export const TAB_CONFIG_E: readonly TabConfig[] = [{ key: "ESSENTIALS", label: "Essentials" }];

export type TabKeyA = (typeof TAB_CONFIG_A)[number]["key"];
export type TabKeyB = (typeof TAB_CONFIG_B)[number]["key"];
export type TabKeyC = (typeof TAB_CONFIG_C)[number]["key"];
export type TabKeyD = (typeof TAB_CONFIG_D)[number]["key"];
export type TabKeyE = (typeof TAB_CONFIG_E)[number]["key"];

export type AnyTabKey = TabKeyA | TabKeyB | TabKeyC | TabKeyD | TabKeyE;

// Generic TabKey type for specific variants
export type TabKey<V extends SidebarVariant> = V extends "A"
	? TabKeyA
	: V extends "B"
		? TabKeyB
		: V extends "C"
			? TabKeyC
			: V extends "D"
				? TabKeyD
				: V extends "E"
					? TabKeyE
					: never;

export interface VariantConfig {
	[key: string]: {
		tabs: readonly TabConfig[];
		stencils: Record<string, NodeStencil[]>;
	};
}
