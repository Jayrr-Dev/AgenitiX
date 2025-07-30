---
inclusion: always
---

# Core Technology Stack

## Essential Technologies

- **Framework**: Next.js 15.2.1 with App Router
- **Runtime**: React 19.1.0 with TypeScript 5.7.2
- **Backend**: Convex for real-time database and server functions
- **Styling**: Tailwind CSS v4 with CSS custom properties
- **State Management**: Zustand for global state
- **Flow Editor**: @xyflow/react for node-based visual editor
- **UI Components**: Radix UI primitives with custom design system
- **Animation**: Framer Motion for interactions and transitions
- **Icons**: Tabler Icons and Lucide React

## Build System & Tools

- **Package Manager**: pnpm (preferred)
- **Database**: Convex for real-time backend with TypeScript
- **Linting & Formatting**: Biome (replaces ESLint + Prettier)
- **Code Generation**: Plop for scaffolding
- **PWA**: next-pwa for Progressive Web App features
- **Analytics**: Vercel Analytics
- **Security**: Custom Anubis protection system

## Convex Database Guidelines

### Table Naming Convention
- **Format**: `<domain>_<resource_plural>` (snake_case, lowercase + underscores)
- **Examples**: `auth_users`, `email_templates`, `workflow_runs`, `ai_prompts`
- **Join Tables**: Use alphabetical order with singular nouns: `project_users`, `user_roles`
- **System Tables**: Use standard suffixes: `_log`, `_history`, `_settings`, `_queue`, `_mapping`

### Security Rules
- **NEVER** put Convex keys inline in code
- **ALWAYS** use `.env.local` for sensitive data
- **Production Key**: `CONVEX_DEPLOY_KEY` must be kept secure
- **Deployment URL**: `https://avid-condor-564.convex.cloud/`
- **HTTP Actions URL**: `https://avid-condor-564.convex.site/`

### Recommended Table Names
```
auth_users          # User accounts and profiles
auth_sessions       # User sessions and tokens
email_templates     # Email template definitions
email_logs          # Email sending/receiving logs
email_queue         # Scheduled email queue
workflow_runs       # Flow execution history
flow_nodes          # Node definitions and state
ai_prompts          # AI prompt templates
project_users       # Project membership
billing_customers   # Customer billing info
billing_invoices    # Invoice records
```

## Week 1 Development Priorities

### Critical Path (Must Complete First)
1. **Authentication System**: ✅ COMPLETED - Magic link authentication with Convex
2. **Storage System**: ✅ COMPLETED - Comprehensive database schema implemented
3. **Email Account Integration**: 🎯 NEXT PRIORITY - Connect email providers (Gmail, Outlook, etc.)

### Parallel Development Tracks
- **Storage Types**: All storage can be built simultaneously
- **Advanced Email Features**: Templates, branding, analytics (independent)
- **AI Development**: Can develop parallel with email analytics
- **Documentation**: Start early and build throughout development

## Development Commands

```bash
# Development
pnpm dev                    # Start development server (Convex + Frontend)
pnpm dev:setup              # Setup Convex until success
pnpm dev:parallel           # Run Convex and Frontend in parallel
pnpm build                  # Production build (Convex + Frontend)
pnpm start                  # Start production server

# Convex Backend Commands
pnpm convex:dev             # Start Convex development server
pnpm convex:deploy          # Deploy Convex functions
pnpm convex:dashboard       # Open Convex dashboard
pnpm convex:logs            # View Convex logs
pnpm db:seed                # Seed database with initial data
pnpm db:clear               # Clear database
pnpm db:backup              # Create database backup
pnpm db:restore             # Restore database from backup

# Code Quality
pnpm lint                   # Run Biome linter
pnpm lint:fix              # Fix linting issues
pnpm format                # Format code with Biome

# Code Generation
pnpm new:node              # Generate new node component
pnpm plop                  # Run Plop generators

# Documentation Generation
pnpm generate:docs         # Generate all documentation
pnpm generate:node-docs    # Generate node documentation
pnpm generate:handle-docs  # Generate handle system docs
pnpm generate:ui-overview  # Generate UI component docs

# Token & Type Generation
pnpm generate:tokens       # Generate design tokens
pnpm generate:handle-types # Generate TypeScript types

# Validation
pnpm validate:tokens       # Validate design tokens
pnpm validate:adapter      # Validate adapter logic
```

## Architecture Patterns

- **Domain-Driven Design (DDD)**: Infrastructure supports node domains like a city supports its population
- **Feature-based organization**: Code organized by business domains
- **Modern business logic system**: Located in `features/business-logic-modern/`
- **Infrastructure layer**: Shared systems in `infrastructure/` subdirectories
- **Node domain architecture**: Separate domains for Create, View, Trigger, Test, Cycle
- **NodeSpec System**: Type-safe node definitions with automatic scaffolding
- **Server Actions**: Backend operations for database and external API integration
- **Auto-generated documentation**: All docs generated from source code
- **Type-safe development**: Comprehensive TypeScript coverage

## Node Development Workflow

```bash
# Create new node (interactive prompts)
pnpm new:node

# Node naming convention: verb + Noun/category + Feature
# Examples: createText, viewCsv, triggerToggle, testEmail, cycleTimer
```

## Code Style Conventions

- **Formatting**: Tabs for indentation, 100 character line width
- **Imports**: Auto-organized with Biome
- **Quotes**: Double quotes for strings
- **Semicolons**: Always required
- **File naming**: kebab-case for files, PascalCase for components