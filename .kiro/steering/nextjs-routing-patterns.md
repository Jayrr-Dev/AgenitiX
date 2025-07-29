---
inclusion: fileMatch
fileMatchPattern: "app/**/page.tsx", "app/**/layout.tsx", "app/**/route.ts", "app/**/loading.tsx", "app/**/error.tsx", "app/**/not-found.tsx", "app/api/**/*"
---

# Next.js App Router & Dynamic Routes Standards

## 🚨 Critical Change: Params as Promises (Next.js 15+)

Dynamic route segments now return **promises** that must be awaited:

```typescript
// ✅ CORRECT: Async function with await
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params;
  return <div>Flow: {slug}</div>;
}

// ❌ INCORRECT: Old synchronous access (deprecated)
export default function Page({
  params,
}: {
  params: { slug: string } // This will be deprecated
}) {
  const { slug } = params; // This won't work in future versions
  return <div>Flow: {slug}</div>;
}
```

## Core Patterns

### Basic Dynamic Routes
```typescript
// app/flows/[flowId]/page.tsx
export default async function FlowPage({ 
  params 
}: { 
  params: Promise<{ flowId: string }> 
}) {
  const { flowId } = await params;
  // ... component logic
}
```

### Layout Components
```typescript
// app/flows/[flowId]/layout.tsx
export default async function FlowLayout({ 
  children, 
  params 
}: { 
  children: React.ReactNode;
  params: Promise<{ flowId: string }>;
}) {
  const { flowId } = await params;
  // ... layout logic
}
```

### API Routes
```typescript
// app/api/flows/[flowId]/route.ts
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ flowId: string }> }
) {
  const { flowId } = await params;
  // ... API logic
}
```

### Client Components with use() Hook
```typescript
// Client component that needs route params
'use client';
import { use } from 'react';

export function FlowHeader({ params }: { params: Promise<{ flowId: string }> }) {
  const { flowId } = use(params);
  // ... component logic
}
```

### Catch-all Routes
```typescript
// app/docs/[...slug]/page.tsx
export default async function DocsPage({ 
  params 
}: { 
  params: Promise<{ slug: string[] }> 
}) {
  const { slug } = await params;
  // slug is an array: ['flows', 'nodes', 'create']
}
```

### Optional Catch-all Routes
```typescript
// app/shop/[[...categories]]/page.tsx
export default async function ShopPage({ 
  params 
}: { 
  params: Promise<{ categories?: string[] }> 
}) {
  const { categories } = await params;
  // categories can be undefined or string[]
}
```

## Type Definitions

```typescript
// types/routing.ts
export interface FlowParams {
  params: Promise<{ flowId: string }>;
}

export interface NodeParams {
  params: Promise<{ flowId: string; nodeId: string }>;
}

export interface DocsParams {
  params: Promise<{ slug: string[] }>;
}

export interface CategoryParams {
  params: Promise<{ categories?: string[] }>;
}
```

## Migration Checklist

- [ ] **Update all page components** to use `async` and `await params`
- [ ] **Update all layout components** to handle promise-based params
- [ ] **Update API routes** to await params destructuring
- [ ] **Update generateMetadata functions** to await params
- [ ] **Update TypeScript interfaces** to use `Promise<{ param: type }>`
- [ ] **Test client components** using the `use()` hook

## File Organization

```
app/
├── (dashboard)/              # Route groups
│   ├── flows/
│   │   ├── page.tsx         # /flows
│   │   └── [flowId]/        # Dynamic route
│   │       ├── page.tsx     # /flows/[flowId]
│   │       ├── layout.tsx   # Layout for flow pages
│   │       └── nodes/
│   │           └── [nodeId]/
│   │               └── page.tsx # /flows/[flowId]/nodes/[nodeId]
├── api/                      # API routes
│   └── flows/
│       └── [flowId]/
│           └── route.ts     # /api/flows/[flowId]
└── docs/
    └── [...slug]/
        └── page.tsx         # /docs/anything/nested
```

## External References

- [Next.js Dynamic Routes Documentation](https://nextjs.org/docs/app/api-reference/file-conventions/dynamic-routes)
- [Next.js App Router Documentation](https://nextjs.org/docs/app)
- [React use() Hook Documentation](https://react.dev/reference/react/use)