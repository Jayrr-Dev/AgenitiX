Clean Code Principles (Minimalist Core)

Same intent, far fewer words. Keep this as the living "why/how" backbone for AgenitiX.

0. Mantras

KISS. Boy Scout Rule. Fix root causes. No side effects at import. Composition over conditionals. DI over globals. One thing per function/effect/test.

1. Simplicity & Design

KISS: Ship the simplest working thing. Refactor when reality proves it wrong.

Boy Scout Rule: Touch code? Leave it cleaner (naming, typing, splitting, docs).

Root Cause > Band‑Aid: Diagnose before patching. Instrument, log, test.

Config Up Top: App-level config/context providers; components read, never hardcode.

Composition/Polymorphism > if/switch: Tables/registries, discriminated unions, render maps.

DI/IoC: Pass services via context/factories. Depend on interfaces, not concretes.

2. Functions & Naming

Single Purpose: One reason to change. Extract helpers ruthlessly.

Descriptive Names: verbObject, searchable constants (FIVE_MINUTES_MS).

Few Params: Group related args into objects; builders only when truly complex.

No Magic Anything: Numbers/strings become const.

Variables Near Use: Declare right before you need them.

3. React / Next.js Specifics

Split useEffects by concern (fetching, analytics, listeners).

Component Composition: Small shells + specialized variants instead of mega-props.

SSR/RSC Aware: Pure top-level code, side effects in hooks/server actions only.

No Import-Time Side Effects: Only pure constants at module scope.

Context/Zustand over Globals: Centralize state, but keep slices tiny and typed.

4. Boundaries, Errors & Types

Encapsulate Edge Cases: Centralize boundary checks (pagination, timeouts, etc.).

Value Objects > Primitives: Encode domain rules in types/classes (Email, Age, Score).

Consistent Error Strategy: Typed errors, clear messages, user-safe surfaces.

5. Testing

Readable, Isolated, Fast: Each test can run alone.

One Logical Assert (or one behavior) per test.

Given/When/Then naming and clear fixtures/builders.

6. Code Smells to Hunt

Rigidity (hard to change), Fragility (breaks elsewhere), Needless Complexity (over‑engineering). Prefer small, pure, typed utilities.

7. AgenitiX Patterns (Essentials)

Node Architecture: Domain (pure) → App (use cases) → Infra (Convex, APIs).

Convex Functions: Validate args, auth lookup, perform single job, return typed data.

Flow Editor: Services via context, reducer for state, effects separated, autosave isolated.

8. Pre-Commit Checklist

Simplicity & Design: KISS? Boy Scout? Root cause fixed? Config at top? Composition used?

Code Quality: Small functions? Clear names? Fewer args? No magic? Vars near use?

React/Next: Split effects? Composed components? No import side effects? Server/client boundaries respected?

Safety: Boundaries encapsulated? Value objects? Typed errors?

Tests: Independent? One behavior? Clear?

Backend: Convex handlers clean? Separation of concerns?