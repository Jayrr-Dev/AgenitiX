AgenitiX Dev Standards — Ultra‑Simple Version

Rule 0: Ship small, typed, tested, documented slices. Leave it cleaner.

1. Principles

Plan → Code → Test → Document.

One source of truth for data/config.

Tiny, pure units; immutable by default.

Fail gracefully; log centrally (Sentry).

Optimize last; measure first.

2. Names

Files: Components PascalCase.tsx, hooks use-thing.ts, everything else kebab-case.ts.
Funcs/vars: camelCase; true globals in CONSTANT_CASE only.
DB/Convex: domain_resource_plural (snake_case). Joins = two singulars alpha-ordered.

3. Docs (JSDoc Lite)

/** What it does (1 line). @example <TaskList id="123" /> */

Only for non-trivial code. Link types with @see if useful.

4. Architecture (DDD-ish)

app/            UI entry & routes (Next.js)
convex/         Schema + queries/mutations
domain/         Pure business logic
application/    Use-cases, DTOs, events
infrastructure/ Adapters (repos, email, APIs)
lib/            Utils, DI, stores, constants
components/     UI pieces (ui/, features/, layouts/)

Rules: Domain ← clean; UI never holds business rules; infra implements interfaces.

5. React / Next.js

Server Components by default; Client only when needed.

Each component/hook = one concern. Split early.

useEffect rarely, one concern per effect.

Local UI state local; shared state in Zustand/Convex.

Extract magic values to top-level const.

Wrap risky trees in Error Boundaries; toast friendly messages.

6. UI / UX

Shadcn + Tailwind tokens; no hard-coded magic numbers.

Dark & light both pass contrast (≥4.5:1).

Mobile-first: build small, enhance up.

A11y: semantics, focus rings, 44px targets.

No emojis in UI chrome.

7. Errors & Logging

Use AppError subclasses (Validation, Auth, etc.).

handleError(err, ctx) → normalize + Sentry.

Map codes → user-friendly text.

8. Tests

Unit: pure logic & components.

Integration: data + UI flows (ConvexTestingHelper).

A11y: jest-axe no violations.

Responsive & error states covered.

9. Pre-Commit Mini-Checklist



10. Pointers

.kiro/steering/convex-*, sentry-rules.md, useeffect-best-practices.md, github-workflow.md, structure.md, tech.md.

Done > Perfect. Tested + Documented > Done.