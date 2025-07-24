# Technology Stack & Build System

## Core Technologies

- **Framework**: Next.js 15.2.1 with App Router
- **Runtime**: React 19.1.0 with TypeScript 5.7.2
- **Styling**: Tailwind CSS v4 with CSS custom properties
- **State Management**: Zustand for global state
- **Flow Editor**: @xyflow/react for node-based visual editor
- **UI Components**: Radix UI primitives with custom design system
- **Animation**: Framer Motion for interactions and transitions
- **Icons**: Tabler Icons and Lucide React

## Build System & Tools

- **Package Manager**: pnpm (preferred)
- **Linting & Formatting**: Biome (replaces ESLint + Prettier)
- **Code Generation**: Plop for scaffolding
- **PWA**: next-pwa for Progressive Web App features
- **Analytics**: Vercel Analytics
- **Security**: Custom Anubis protection system

## Development Commands

```bash
# Development
pnpm dev                    # Start development server
pnpm build                  # Production build
pnpm start                  # Start production server

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