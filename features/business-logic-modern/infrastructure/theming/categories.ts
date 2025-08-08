// features/business-logic-modern/infrastructure/theming/categories.ts
export const CATEGORIES = {
	CREATE: "CREATE",
	VIEW: "VIEW",
	TRIGGER: "TRIGGER",
	TEST: "TEST",
	CYCLE: "CYCLE",
	STORE: "STORE",
	AI: "AI",
	TIME: "TIME",
	FLOW: "FLOW",
	EMAIL: "EMAIL",
	TOOLS: "TOOLS",
	LOGIC: "LOGIC",
} as const;

export type NodeCategory = (typeof CATEGORIES)[keyof typeof CATEGORIES];
