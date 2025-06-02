export interface NodeStencil {
  id: string;
  nodeType: string;
  label: string;
  description: string;
  icon?: string;
  category?: string;
  folder?: string;
}

export type SidebarVariant = "a" | "b" | "c" | "d" | "e";

// Variant display names
export const VARIANT_NAMES: Record<SidebarVariant, string> = {
  a: "Main",
  b: "Media",
  c: "Integration",
  d: "Automation",
  e: "Misc",
};

export interface TabConfig {
  key: string;
  label: string;
}

// Tab configurations for each variant
export const TAB_CONFIG_A = [
  { key: "core", label: "Core" },
  { key: "logic", label: "Logic" },
  { key: "stores", label: "Stores" },
  { key: "testing", label: "Testing" },
  { key: "time", label: "Time" },
] as const;

export const TAB_CONFIG_B = [
  { key: "images", label: "Images" },
  { key: "audio", label: "Audio" },
  { key: "text", label: "Text" },
  { key: "interface", label: "Interface" },
  { key: "transform", label: "Transform" },
] as const;

export const TAB_CONFIG_C = [
  { key: "api", label: "API" },
  { key: "web", label: "Web" },
  { key: "email", label: "Email" },
  { key: "files", label: "Files" },
  { key: "crypto", label: "Crypto" },
] as const;

export const TAB_CONFIG_D = [
  { key: "triggers", label: "Triggers" },
  { key: "flow", label: "Flow" },
  { key: "cyclers", label: "Cyclers" },
  { key: "smart", label: "Smart" },
  { key: "tools", label: "Tools" },
] as const;

export const TAB_CONFIG_E = [
  { key: "special", label: "Special" },
  { key: "math", label: "Math" },
  { key: "stuff", label: "Stuff" },
  { key: "filler", label: "Filler" },
  { key: "custom", label: "Custom" },
] as const;

export type TabKeyA = (typeof TAB_CONFIG_A)[number]["key"];
export type TabKeyB = (typeof TAB_CONFIG_B)[number]["key"];
export type TabKeyC = (typeof TAB_CONFIG_C)[number]["key"];
export type TabKeyD = (typeof TAB_CONFIG_D)[number]["key"];
export type TabKeyE = (typeof TAB_CONFIG_E)[number]["key"];

export type TabKey<V extends SidebarVariant> = V extends "a"
  ? TabKeyA
  : V extends "b"
    ? TabKeyB
    : V extends "c"
      ? TabKeyC
      : V extends "d"
        ? TabKeyD
        : TabKeyE;

export interface VariantConfig<V extends SidebarVariant = SidebarVariant> {
  tabs: readonly TabConfig[];
  defaults: Record<TabKey<V>, NodeStencil[]>;
}
