// features/business-logic-modern/infrastructure/theming/sizing.ts
export const COLLAPSED_SIZES = {
  C1: { width: 60, height: 60 },
  C1W: { width: 120, height: 60 },
  C2: { width: 120, height: 120 },
  C3: { width: 180, height: 180 },
} as const;

export const EXPANDED_FIXED_SIZES = {
  FE0: { width: 60, height: 60 },
  FE1: { width: 120, height: 120 },
  FE1H: { width: 120, height: 180 },
  FE2: { width: 180, height: 180 },
  FE3: { width: 240, height: 240 },
} as const;

export const EXPANDED_VARIABLE_SIZES = {
  VE0: { width: 60, height: 'auto' },
  VE1: { width: 120, height: 'auto' },
  VE2: { width: 180, height: 'auto' },
  VE3: { width: 240, height: 'auto' },
} as const; 