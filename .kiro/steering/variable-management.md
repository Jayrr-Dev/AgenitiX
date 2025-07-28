Variable Management

Mantra: const by default • smallest scope • no side‑effects at import • one source of truth.

1. The 8 Core Rules

Const first. Use let only if you truly reassign. Never var.

Tight scope. Declare vars where they’re used (component/hook/func). Hoist only real constants.

Hoist only pure & cheap. Regex, Zod schemas, tokens ✅. Heavy/dynamic/env-dependent ❌ (load lazily).

Lazy-load heavy/env/dynamic values. Use factories/hooks/providers (createConfig(), useAppConfig()), not top-level reads.

No top-level mutation. Mutable app state lives in Zustand/Context, not in module variables.

Name & type for intent. ALL_CAPS for exported constants, camelCase for runtime values, PascalCase for types/components. Use explicit TS types / as const.

Respect SSR/RSC boundaries. No window/document in Server Components; no Node-only libs (fs, path) in Client Components.

Single source of truth. Centralize constants/config; import them — don’t duplicate.

2. constants.ts (and friends) Pattern

Prefer many small domain files over one giant constants.ts.

lib/
  constants/
    ui-constants.ts        // tokens, spacing, z-index, durations
    api-constants.ts       // endpoints, timeouts, status codes
    flow-constants.ts      // flow editor defaults & limits
    feature-flags.ts       // default feature flags
    index.ts               // (optional) side-effect-free barrel re-export

Authoring rules

Pure & cheap only: no env reads, no fetches, no heavy compute.

Freeze & type:

export const UI_SPACING = Object.freeze({ xs: 4, sm: 8, md: 16 }) as const;
export type UiSpacing = typeof UI_SPACING;

Const unions over enums:

export const FLOW_STATUSES = ["draft", "active", "archived"] as const;
export type FlowStatus = (typeof FLOW_STATUSES)[number];

No mutation: treat constants as read-only values.

Quick routing guide:

UI tokens → ui-constants.ts

API paths / HTTP codes → api-constants.ts

Domain defaults (flows, emails, nodes) → <feature>-constants.ts

Feature flags → feature-flags.ts

3. Mini Patterns

Lazy config factory

export const createClientConfig = () => ({
  apiUrl: process.env.NEXT_PUBLIC_API_URL!,
  convexUrl: process.env.NEXT_PUBLIC_CONVEX_URL!,
});

Zustand store for mutable state

interface UserState { user: User | null; updateUser(u: User): void }
export const useUserStore = create<UserState>((set) => ({
  user: null,
  updateUser: (user) => set({ user }),
}));

Pure constants at top level

export const MAX_RETRY = 3 as const;
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

Heavy/dynamic value lazily

const getExpensive = () => heavyCompute();

4. Env Vars (Server-only Parse)

Validate once with Zod in lib/config/env.ts.

Expose public pieces through client-safe factories/hooks.

Never read process.env directly in client code.

// lib/config/env.ts (server only)
export const env = EnvSchema.parse(process.env);

5. SSR / RSC Safety

Server Components: OK to use Node APIs & env.

Client Components: add 'use client'; avoid Node-only imports.

Browser globals only in client (or inside effects).

6. Anti‑Patterns

Module-level let or object mutation.

Duplicated constants across files.

Env reads at import time in shared/client code.

Heavy work at import (JSON parsing huge files, sync FS reads).

Mixing server-only & client-only code in a single file.



Small scope, frozen values, lazy heavy stuff. Everything mutable goes in a store.

