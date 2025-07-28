---
inclusion: always
---

# Project Structure & Organization

## Root Level Organization

```
├── app/                    # Next.js App Router pages and layouts
├── components/             # Shared UI components
├── features/              # Feature-based business logic
├── hooks/                 # Custom React hooks
├── lib/                   # Utility libraries
├── types/                 # TypeScript type definitions
├── utils/                 # Utility functions
├── documentation/         # Auto-generated documentation
├── scripts/               # Build and generation scripts
└── public/                # Static assets
```

## App Directory (Next.js App Router)

```
app/
├── (auth-pages)/          # Authentication routes
├── (legal-pages)/         # Legal pages (privacy, terms)
├── (user-pages)/          # User-specific pages
├── admin/                 # Admin interface
├── api/                   # API routes
├── business-logic/        # Legacy business logic
├── layout.tsx             # Root layout with providers
├── page.tsx               # Home page
└── provider.tsx           # App-wide providers
```

## Modern Business Logic Architecture

```
features/business-logic-modern/
├── dashboard/             # Main dashboard interface
├── infrastructure/        # Core systems and infrastructure
│   ├── flow-engine/       # Node-based editor engine
│   ├── node-core/         # Core node infrastructure
│   ├── node-inspector/    # Node configuration UI
│   ├── node-registry/     # Node type registry
│   ├── sidebar/           # Navigation sidebar
│   ├── theming/           # Design system and tokens
│   └── ...               # Other infrastructure systems
└── node-domain/           # Node business logic domains
    ├── create/            # Create-type nodes
    ├── view/              # View-type nodes
    ├── trigger/           # Trigger-type nodes
    ├── test/              # Test-type nodes
    └── cycle/             # Cycle-type nodes
```

## Path Mapping Conventions

The project uses extensive TypeScript path mapping for clean imports:

- `@/*` - Root level imports
- `@/app/*` - App directory
- `@/components/*` - Shared components
- `@/features/*` - Feature modules
- `@modern/*` - Modern business logic system
- `@domains/*` - Node domain logic
- `@infrastructure/*` - Infrastructure components
- `@infra-components/*` - Infrastructure UI components
- `@flow-engine/*` - Flow editor engine

## Component Organization

```
components/
├── ui/                    # Base UI components (shadcn/ui style)
├── typography/            # Text and typography components
├── nav-bar/              # Navigation components
├── nodes/                # Node-specific components
└── anubis/               # Security system components
```

## File Naming Conventions

- **Components**: PascalCase (e.g., `FlowEditor.tsx`, `NodeInspector.tsx`)
- **Hooks**: camelCase with `use` prefix (e.g., `useNodeData.ts`)
- **Utilities**: camelCase (e.g., `utils.ts`, `iconUtils.ts`)
- **Types**: camelCase with descriptive names (e.g., `node-payloads.ts`)
- **Constants**: UPPER_SNAKE_CASE or camelCase files

## Documentation Structure

```
documentation/
├── api/                   # API documentation
├── Commands/              # Script and command docs
├── infrastructure/        # Infrastructure system docs
├── NodeCore/              # Node core system docs
├── nodes/                 # Individual node docs
├── theming/               # Design system docs
└── ui/                    # UI component docs
```

## Key Architectural Principles

1. **Domain-Driven Design (DDD)**: Infrastructure supports node domains like city infrastructure supports population
2. **Feature-based organization**: Group related functionality together
3. **Infrastructure separation**: Core systems isolated from business logic
4. **NodeSpec Architecture**: Type-safe node definitions with automatic scaffolding
5. **Server Actions Pattern**: Backend operations for database and external API calls
6. **Auto-generated documentation**: All docs generated from source code
7. **Type-safe development**: Comprehensive TypeScript coverage
8. **Modern patterns**: Hooks, context, and modern React patterns

## Node Development Structure

```
node-domain/[category]/[nodeName]/
├── [nodeName].tsx          # Main node component
├── [nodeName].spec.ts      # NodeSpec definition
├── server-actions.ts       # Backend operations (if needed)
└── README.md              # Auto-generated documentation
```

## Node Naming Convention

- **Format**: `verb + Noun/category + Feature` (camelCase)
- **Examples**: `createText`, `viewCsv`, `triggerToggle`, `testEmail`, `cycleTimer`
- **Categories**: create, view, trigger, test, cycle

## Legacy vs Modern Systems

- **Legacy**: `features/business-logic/` (deprecated)
- **Modern**: `features/business-logic-modern/` (active development)
- **Migration**: Gradual migration from legacy to modern architecture

## Special Directories

- `.deperciated/` - Deprecated code kept for reference
- `backups/` - Automated backups with timestamps
- `tooling/` - Development tools and utilities
- `branding/` - Brand assets and logos
- `convex/` - Convex backend with database schema and server functions
- `anubis-standalone/` - Security system components
- `generated/` - Auto-generated files and documentation

## Convex Backend Structure

```
convex/
├── _generated/            # Auto-generated Convex API
├── schema.ts             # Database schema definitions
├── auth.ts               # Authentication functions
├── nodes.ts              # Node-related server functions
├── workflows.ts          # Workflow management functions
└── emails.ts             # Email integration functions
```

## Current Development Focus Areas

### Week 1 Critical Path
1. **Authentication** (`convex/auth.ts`) - User management system
2. **Storage System** (`convex/schema.ts`) - Database schema for all data
3. **Email Integration** (`convex/emails.ts`) - Email provider connections

### Email Node Implementation
- **Receiving Logic**: Nodes that can read and process incoming emails
- **Sending Logic**: Nodes that can compose and send emails
- **Template System**: Email template creation and management
- **Analytics**: Email performance tracking and reporting
- **Error Handling**: Robust error management and retry logic