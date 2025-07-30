---
inclusion: manual
---

Create a minimalist steering document for the follwoing null checks & error handling for agenitix app (React / TS / Next.js) 

Turn on "strict": true and "strictNullChecks": true.

Model nullability explicitly: T | null (no silent maybes).

Prefer ?? over ||; never rely on ! unless you own the invariant.

Guard early at boundaries (props, fetch results, env): if (!data) return <Fallback />.

Validate all external data once (Zod/Valibot), pass typed results downward.

Write tiny type guards/helpers (isDefined, assertNever) and reuse them.

Use Error Boundaries per feature island (react-error-boundary); keep fallback dumb, offer a reset.

Pair Suspense (loading) with Error Boundaries (failure) around the same async region.

Throw for unexpected errors; branch for expected states (notFound(), redirect() in Next).

Centralize error types (e.g., AppError enum) and map them to HTTP status / UI messages.

Log every unexpected error with context (Sentry/PostHog); never swallow silently.

Wrap server actions/route handlers with a common try/catch wrapper that returns typed JSON errors.

Test unhappy paths: null props, failed fetches, thrown render errors, boundary fallbacks.

Keep error logic small & pure—no side effects at import time, no global singletons.

Prefer composition/union types over prop flags and switch ladders for fallback logic.

Tiny essentials kit

ts

CopyEdit

export function isDefined<T>(v: T | null | undefined): v is T {   return v != null; }  export function assertNever(x: never): never {   throw new Error("Unhandled case: " + JSON.stringify(x)); } 

tsx

CopyEdit

// Error boundary wrapper <ErrorBoundary>   <Suspense fallback={<Spinner />}>     <Feature />   </Suspense> </ErrorBoundary> 