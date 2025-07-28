---
inclusion: fileMatch
fileMatchPattern: "app/**/page.tsx", "app/**/layout.tsx", "app/**/route.ts", "app/**/loading.tsx", "app/**/error.tsx", "app/**/not-found.tsx", "app/api/**/*"
---

# Next.js App Router & Dynamic Routes Standards

## Overview

AgenitiX uses [Next.js App Router](https://nextjs.org/docs/app) with modern routing patterns. A critical change in **Next.js 15** is that [dynamic route params are now promises](https://nextjs.org/docs/app/api-reference/file-conventions/dynamic-routes), requiring `async/await` or React's `use()` hook to access parameter values.

## 🚨 Critical Change: Params as Promises

### New Behavior in Next.js 15+

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
```

```typescript
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

### Migration Strategy

**Step 1: Update Page Components**
```typescript
// Before (Next.js 14 and earlier)
export default function FlowPage({ params }: { params: { flowId: string } }) {
  const { flowId } = params;
  // ... component logic
}

// After (Next.js 15+)
export default async function FlowPage({ 
  params 
}: { 
  params: Promise<{ flowId: string }> 
}) {
  const { flowId } = await params;
  // ... component logic
}
```

**Step 2: Update Layout Components**
```typescript
// Before
export default function FlowLayout({ 
  children, 
  params 
}: { 
  children: React.ReactNode;
  params: { flowId: string };
}) {
  const { flowId } = params;
  // ... layout logic
}

// After
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

## Dynamic Route Patterns

### Basic Dynamic Routes

```typescript
// app/flows/[flowId]/page.tsx
/**
 * FLOW DETAIL PAGE - Individual flow display
 *
 * • Displays flow details based on dynamic flowId parameter
 * • Uses async/await pattern for Next.js 15+ compatibility
 * • Integrates with AgenitiX flow management
 * • Demonstrates proper error handling
 *
 * Keywords: dynamic-routes, flow-detail, nextjs-15, async-params
 */

import { notFound } from 'next/navigation';
import { api } from '@/convex/_generated/api';
import { convex } from '@/lib/convex';
import { FlowEditor } from '@/components/flow-editor/FlowEditor';

interface FlowPageProps {
  params: Promise<{ flowId: string }>;
}

export default async function FlowPage({ params }: FlowPageProps) {
  const { flowId } = await params;
  
  try {
    const flow = await convex.query(api.flows.getFlow, { flowId });
    
    if (!flow) {
      notFound();
    }
    
    return (
      <div className="flow-page">
        <h1>{flow.name}</h1>
        <FlowEditor flow={flow} />
      </div>
    );
  } catch (error) {
    console.error('Failed to load flow:', error);
    notFound();
  }
}

// Generate metadata for the page
export async function generateMetadata({ params }: FlowPageProps) {
  const { flowId } = await params;
  
  try {
    const flow = await convex.query(api.flows.getFlow, { flowId });
    
    return {
      title: flow?.name || 'Flow',
      description: flow?.description || 'Visual automation flow',
    };
  } catch {
    return {
      title: 'Flow Not Found',
      description: 'The requested flow could not be found',
    };
  }
}
```

### Catch-all Routes

```typescript
// app/docs/[...slug]/page.tsx
/**
 * DOCUMENTATION CATCH-ALL PAGE - Dynamic documentation routing
 *
 * • Handles nested documentation paths with catch-all segments
 * • Supports unlimited nesting like /docs/flows/nodes/create
 * • Uses promise-based params for Next.js 15+ compatibility
 * • Demonstrates breadcrumb generation from slug array
 *
 * Keywords: catch-all-routes, documentation, breadcrumbs, nested-paths
 */

interface DocsPageProps {
  params: Promise<{ slug: string[] }>;
}

export default async function DocsPage({ params }: DocsPageProps) {
  const { slug } = await params;
  
  // slug is an array: ['flows', 'nodes', 'create']
  const breadcrumbs = slug.map((segment, index) => ({
    label: segment.charAt(0).toUpperCase() + segment.slice(1),
    href: `/docs/${slug.slice(0, index + 1).join('/')}`,
  }));
  
  return (
    <div className="docs-page">
      <nav className="breadcrumbs">
        {breadcrumbs.map((crumb, index) => (
          <span key={index}>
            <a href={crumb.href}>{crumb.label}</a>
            {index < breadcrumbs.length - 1 && ' / '}
          </span>
        ))}
      </nav>
      
      <main>
        <h1>Documentation: {slug.join(' > ')}</h1>
        {/* Documentation content */}
      </main>
    </div>
  );
}

// Type definition for catch-all segments
export type CatchAllParams = Promise<{ slug: string[] }>;
```

### Optional Catch-all Routes

```typescript
// app/shop/[[...categories]]/page.tsx
/**
 * SHOP OPTIONAL CATCH-ALL PAGE - Flexible category routing
 *
 * • Handles both /shop and /shop/category/subcategory
 * • Uses optional catch-all with double brackets
 * • Demonstrates conditional rendering based on route depth
 * • Promise-based params for Next.js 15+ compatibility
 *
 * Keywords: optional-catch-all, categories, conditional-rendering
 */

interface ShopPageProps {
  params: Promise<{ categories?: string[] }>;
}

export default async function ShopPage({ params }: ShopPageProps) {
  const { categories } = await params;
  
  if (!categories) {
    // Route: /shop (no categories)
    return (
      <div className="shop-home">
        <h1>Shop Home</h1>
        <div className="category-grid">
          {/* Show all categories */}
        </div>
      </div>
    );
  }
  
  if (categories.length === 1) {
    // Route: /shop/templates
    const [category] = categories;
    return (
      <div className="category-page">
        <h1>Category: {category}</h1>
        <div className="subcategory-grid">
          {/* Show subcategories */}
        </div>
      </div>
    );
  }
  
  // Route: /shop/templates/workflows
  const [category, subcategory] = categories;
  return (
    <div className="subcategory-page">
      <h1>{category} > {subcategory}</h1>
      <div className="product-grid">
        {/* Show products */}
      </div>
    </div>
  );
}

// Type definition for optional catch-all
export type OptionalCatchAllParams = Promise<{ categories?: string[] }>;
```

## Client Component Patterns

### Using `use()` Hook in Client Components

```typescript
// app/flows/[flowId]/components/FlowHeader.tsx
/**
 * FLOW HEADER CLIENT COMPONENT - Client-side dynamic routing
 *
 * • Client component that needs access to route parameters
 * • Uses React's use() hook for promise-based params
 * • Demonstrates client-side parameter handling
 * • Integrates with client-side state management
 *
 * Keywords: client-component, use-hook, dynamic-params, state-management
 */

'use client';

import { use } from 'react';
import { useFlowQuery } from '@/hooks/useFlowsQuery';

interface FlowHeaderProps {
  params: Promise<{ flowId: string }>;
}

export function FlowHeader({ params }: FlowHeaderProps) {
  const { flowId } = use(params);
  const { data: flow, isLoading } = useFlowQuery(flowId);
  
  if (isLoading) {
    return <div className="flow-header-skeleton">Loading...</div>;
  }
  
  return (
    <header className="flow-header">
      <h1>{flow?.name}</h1>
      <p>{flow?.description}</p>
      <div className="flow-actions">
        {/* Flow action buttons */}
      </div>
    </header>
  );
}
```

### Using `useParams` Hook Alternative

```typescript
// app/flows/[flowId]/components/FlowSidebar.tsx
/**
 * FLOW SIDEBAR CLIENT COMPONENT - Alternative param access
 *
 * • Client component using useParams hook
 * • Alternative to prop-based parameter passing
 * • Useful for deeply nested client components
 * • Demonstrates hook-based parameter access
 *
 * Keywords: useParams, client-component, nested-components, hooks
 */

'use client';

import { useParams } from 'next/navigation';
import { useFlowNodes } from '@/hooks/useFlowNodes';

export function FlowSidebar() {
  const params = useParams<{ flowId: string }>();
  const { flowId } = params;
  
  const { data: nodes, isLoading } = useFlowNodes(flowId);
  
  return (
    <aside className="flow-sidebar">
      <h2>Flow Nodes</h2>
      {isLoading ? (
        <div>Loading nodes...</div>
      ) : (
        <div className="node-list">
          {nodes?.map((node) => (
            <div key={node.id} className="node-item">
              {node.type}
            </div>
          ))}
        </div>
      )}
    </aside>
  );
}
```

## Static Generation with Dynamic Routes

### generateStaticParams with Promises

```typescript
// app/flows/[flowId]/page.tsx
/**
 * STATIC GENERATION FOR FLOWS - Build-time route generation
 *
 * • Generates static pages for popular flows at build time
 * • Uses generateStaticParams for performance optimization
 * • Demonstrates ISR (Incremental Static Regeneration)
 * • Promise-based params compatible with Next.js 15+
 *
 * Keywords: static-generation, generateStaticParams, performance, ISR
 */

import { api } from '@/convex/_generated/api';
import { convex } from '@/lib/convex';

// Generate static params at build time
export async function generateStaticParams() {
  try {
    const flows = await convex.query(api.flows.getPublishedFlows, {
      limit: 100, // Generate top 100 flows statically
    });
    
    return flows.map((flow) => ({
      flowId: flow._id,
    }));
  } catch (error) {
    console.error('Failed to generate static params:', error);
    return [];
  }
}

interface FlowPageProps {
  params: Promise<{ flowId: string }>;
}

export default async function FlowPage({ params }: FlowPageProps) {
  const { flowId } = await params;
  
  // This will be statically generated for popular flows
  // and rendered on-demand for others
  const flow = await convex.query(api.flows.getFlow, { flowId });
  
  if (!flow) {
    notFound();
  }
  
  return (
    <div className="flow-page">
      <h1>{flow.name}</h1>
      <FlowViewer flow={flow} />
    </div>
  );
}

// Enable ISR with revalidation
export const revalidate = 3600; // Revalidate every hour
```

## API Routes with Dynamic Segments

### API Route with Promise Params

```typescript
// app/api/flows/[flowId]/route.ts
/**
 * FLOW API ROUTE - RESTful API endpoint for flows
 *
 * • Handles GET, PUT, DELETE operations for individual flows
 * • Uses promise-based params for Next.js 15+ compatibility
 * • Demonstrates proper error handling and status codes
 * • Integrates with Convex backend operations
 *
 * Keywords: api-routes, rest-api, dynamic-params, convex-integration
 */

import { NextRequest, NextResponse } from 'next/server';
import { api } from '@/convex/_generated/api';
import { convex } from '@/lib/convex';

interface RouteParams {
  params: Promise<{ flowId: string }>;
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { flowId } = await params;
    
    const flow = await convex.query(api.flows.getFlow, { flowId });
    
    if (!flow) {
      return NextResponse.json(
        { error: 'Flow not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(flow);
  } catch (error) {
    console.error('Failed to fetch flow:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { flowId } = await params;
    const body = await request.json();
    
    const updatedFlow = await convex.mutation(api.flows.updateFlow, {
      flowId,
      data: body,
    });
    
    return NextResponse.json(updatedFlow);
  } catch (error) {
    console.error('Failed to update flow:', error);
    return NextResponse.json(
      { error: 'Failed to update flow' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { flowId } = await params;
    
    await convex.mutation(api.flows.deleteFlow, { flowId });
    
    return NextResponse.json(
      { message: 'Flow deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Failed to delete flow:', error);
    return NextResponse.json(
      { error: 'Failed to delete flow' },
      { status: 500 }
    );
  }
}
```

## Layout Patterns with Dynamic Routes

### Nested Layout with Promise Params

```typescript
// app/flows/[flowId]/layout.tsx
/**
 * FLOW LAYOUT - Nested layout for flow pages
 *
 * • Provides consistent layout for all flow-related pages
 * • Uses promise-based params for Next.js 15+ compatibility
 * • Demonstrates data fetching in layouts
 * • Includes navigation and breadcrumbs
 *
 * Keywords: nested-layout, flow-navigation, breadcrumbs, data-fetching
 */

import { notFound } from 'next/navigation';
import { api } from '@/convex/_generated/api';
import { convex } from '@/lib/convex';
import { FlowNavigation } from '@/components/flows/FlowNavigation';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

interface FlowLayoutProps {
  children: React.ReactNode;
  params: Promise<{ flowId: string }>;
}

export default async function FlowLayout({ 
  children, 
  params 
}: FlowLayoutProps) {
  const { flowId } = await params;
  
  try {
    const flow = await convex.query(api.flows.getFlow, { flowId });
    
    if (!flow) {
      notFound();
    }
    
    const breadcrumbs = [
      { label: 'Home', href: '/' },
      { label: 'Flows', href: '/flows' },
      { label: flow.name, href: `/flows/${flowId}` },
    ];
    
    return (
      <div className="flow-layout">
        <header className="flow-header">
          <Breadcrumbs items={breadcrumbs} />
          <h1>{flow.name}</h1>
        </header>
        
        <div className="flow-content">
          <aside className="flow-sidebar">
            <FlowNavigation flowId={flowId} />
          </aside>
          
          <main className="flow-main">
            {children}
          </main>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Failed to load flow layout:', error);
    notFound();
  }
}

// Generate metadata for flow layouts
export async function generateMetadata({ params }: FlowLayoutProps) {
  const { flowId } = await params;
  
  try {
    const flow = await convex.query(api.flows.getFlow, { flowId });
    
    return {
      title: `${flow?.name} - AgenitiX`,
      description: flow?.description,
    };
  } catch {
    return {
      title: 'Flow - AgenitiX',
      description: 'Visual automation flow',
    };
  }
}
```

## TypeScript Patterns

### Type Definitions for Route Params

```typescript
// types/routing.ts
/**
 * ROUTING TYPES - Type definitions for Next.js routing
 *
 * • Centralized type definitions for route parameters
 * • Promise-based types for Next.js 15+ compatibility
 * • Reusable across pages, layouts, and API routes
 * • Ensures type safety for dynamic routing
 *
 * Keywords: typescript, routing-types, promise-params, type-safety
 */

// Basic dynamic route params
export interface FlowParams {
  params: Promise<{ flowId: string }>;
}

export interface NodeParams {
  params: Promise<{ flowId: string; nodeId: string }>;
}

export interface UserParams {
  params: Promise<{ userId: string }>;
}

// Catch-all route params
export interface DocsParams {
  params: Promise<{ slug: string[] }>;
}

export interface CategoryParams {
  params: Promise<{ categories?: string[] }>;
}

// API route params
export interface APIFlowParams {
  params: Promise<{ flowId: string }>;
}

export interface APINodeParams {
  params: Promise<{ flowId: string; nodeId: string }>;
}

// Search params (these remain synchronous)
export interface SearchParams {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

// Combined params for complex routes
export interface FlowPageProps extends FlowParams {
  searchParams: Promise<{ 
    view?: 'editor' | 'preview' | 'settings';
    tab?: string;
  }>;
}

// Helper type for extracting param values
export type ExtractParams<T> = T extends Promise<infer U> ? U : never;

// Usage example:
// type FlowId = ExtractParams<FlowParams['params']>['flowId']; // string
```

### Async Route Component Pattern

```typescript
// app/flows/[flowId]/nodes/[nodeId]/page.tsx
/**
 * NODE DETAIL PAGE - Deeply nested dynamic route
 *
 * • Demonstrates multiple dynamic segments
 * • Uses promise-based params for Next.js 15+ compatibility
 * • Proper error handling for nested resources
 * • Type-safe parameter extraction
 *
 * Keywords: nested-routes, multiple-params, error-handling, type-safety
 */

import { notFound } from 'next/navigation';
import { api } from '@/convex/_generated/api';
import { convex } from '@/lib/convex';
import type { NodeParams } from '@/types/routing';

export default async function NodeDetailPage({ params }: NodeParams) {
  const { flowId, nodeId } = await params;
  
  try {
    // Fetch both flow and node data
    const [flow, node] = await Promise.all([
      convex.query(api.flows.getFlow, { flowId }),
      convex.query(api.nodes.getNode, { nodeId }),
    ]);
    
    if (!flow || !node) {
      notFound();
    }
    
    // Verify node belongs to flow
    if (!flow.nodes.some(n => n.id === nodeId)) {
      notFound();
    }
    
    return (
      <div className="node-detail-page">
        <header>
          <h1>Node: {node.type}</h1>
          <p>Flow: {flow.name}</p>
        </header>
        
        <main>
          <NodeEditor node={node} flow={flow} />
        </main>
      </div>
    );
  } catch (error) {
    console.error('Failed to load node:', error);
    notFound();
  }
}

// Generate static paths for popular flow-node combinations
export async function generateStaticParams() {
  try {
    const popularFlows = await convex.query(api.flows.getPopularFlows, {
      limit: 20,
    });
    
    const params = [];
    
    for (const flow of popularFlows) {
      for (const node of flow.nodes.slice(0, 5)) { // Top 5 nodes per flow
        params.push({
          flowId: flow._id,
          nodeId: node.id,
        });
      }
    }
    
    return params;
  } catch (error) {
    console.error('Failed to generate static params:', error);
    return [];
  }
}
```

## Error Handling Patterns

### Custom Error Pages with Dynamic Routes

```typescript
// app/flows/[flowId]/error.tsx
/**
 * FLOW ERROR BOUNDARY - Custom error page for flows
 *
 * • Handles errors within flow-related pages
 * • Provides user-friendly error messages
 * • Includes recovery actions
 * • Maintains flow context in error state
 *
 * Keywords: error-boundary, user-experience, error-recovery, flow-context
 */

'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';

interface FlowErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function FlowError({ error, reset }: FlowErrorProps) {
  const params = useParams<{ flowId: string }>();
  const { flowId } = params;
  
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Flow page error:', error);
  }, [error]);
  
  return (
    <div className="flow-error-page">
      <div className="error-content">
        <h1>Something went wrong with this flow</h1>
        <p>
          We encountered an error while loading flow: <code>{flowId}</code>
        </p>
        
        {error.message && (
          <details className="error-details">
            <summary>Error details</summary>
            <pre>{error.message}</pre>
          </details>
        )}
        
        <div className="error-actions">
          <Button onClick={reset}>
            Try again
          </Button>
          <Button variant="outline" asChild>
            <a href="/flows">Back to flows</a>
          </Button>
        </div>
      </div>
    </div>
  );
}
```

## Performance Optimization

### Route Prefetching Patterns

```typescript
// components/FlowCard.tsx
/**
 * FLOW CARD COMPONENT - Optimized flow preview with prefetching
 *
 * • Prefetches flow routes on hover for better performance
 * • Uses Next.js Link component for client-side navigation
 * • Demonstrates route prefetching best practices
 * • Integrates with flow data display
 *
 * Keywords: prefetching, performance, navigation, client-side-routing
 */

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Flow } from '@/types/flows';

interface FlowCardProps {
  flow: Flow;
}

export function FlowCard({ flow }: FlowCardProps) {
  const router = useRouter();
  
  // Prefetch on hover for instant navigation
  const handleMouseEnter = () => {
    router.prefetch(`/flows/${flow._id}`);
  };
  
  return (
    <Link 
      href={`/flows/${flow._id}`}
      className="flow-card"
      onMouseEnter={handleMouseEnter}
    >
      <div className="flow-card-content">
        <h3>{flow.name}</h3>
        <p>{flow.description}</p>
        
        <div className="flow-meta">
          <span className="flow-category">{flow.category}</span>
          <span className="flow-nodes">{flow.nodes.length} nodes</span>
        </div>
      </div>
    </Link>
  );
}
```

## File Organization

```
app/
├── (dashboard)/              # Route groups (don't affect URL)
│   ├── flows/
│   │   ├── page.tsx         # /flows
│   │   ├── loading.tsx      # Loading UI for flows
│   │   └── [flowId]/        # Dynamic route
│   │       ├── page.tsx     # /flows/[flowId]
│   │       ├── layout.tsx   # Layout for flow pages
│   │       ├── loading.tsx  # Loading UI for flow detail
│   │       ├── error.tsx    # Error boundary for flow pages
│   │       ├── edit/
│   │       │   └── page.tsx # /flows/[flowId]/edit
│   │       └── nodes/
│   │           └── [nodeId]/
│   │               └── page.tsx # /flows/[flowId]/nodes/[nodeId]
│   └── users/
│       └── [userId]/
│           ├── page.tsx     # /users/[userId]
│           └── flows/
│               └── page.tsx # /users/[userId]/flows
├── api/                      # API routes
│   ├── flows/
│   │   ├── route.ts         # /api/flows
│   │   └── [flowId]/
│   │       └── route.ts     # /api/flows/[flowId]
│   └── health/
│       └── route.ts         # /api/health
├── docs/
│   └── [...slug]/
│       └── page.tsx         # /docs/anything/nested
└── shop/
    └── [[...categories]]/
        └── page.tsx         # /shop or /shop/category/sub
```

## Migration Checklist

### From Next.js 14 to 15

- [ ] **Update all page components** to use `async` and `await params`
- [ ] **Update all layout components** to handle promise-based params
- [ ] **Update API routes** to await params destructuring
- [ ] **Update generateMetadata functions** to await params
- [ ] **Update generateStaticParams** if using dynamic segments
- [ ] **Update TypeScript interfaces** to use `Promise<{ param: type }>`
- [ ] **Test client components** using the `use()` hook
- [ ] **Update error boundaries** that depend on route parameters
- [ ] **Review and update custom hooks** that access route params

## File References

- **Page Components**: #[[file:app/**/page.tsx]]
- **Layout Components**: #[[file:app/**/layout.tsx]]
- **API Routes**: #[[file:app/api/**/route.ts]]
- **Route Types**: #[[file:types/routing.ts]]
- **Navigation Components**: #[[file:components/navigation/]]
- **Error Boundaries**: #[[file:app/**/error.tsx]]

## External References

- [Next.js Dynamic Routes Documentation](https://nextjs.org/docs/app/api-reference/file-conventions/dynamic-routes)
- [Next.js App Router Documentation](https://nextjs.org/docs/app)
- [React use() Hook Documentation](https://react.dev/reference/react/use)
- [Next.js Migration Guide](https://nextjs.org/docs/app/building-your-application/upgrading)