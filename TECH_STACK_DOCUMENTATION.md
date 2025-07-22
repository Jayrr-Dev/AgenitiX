# AgenitiX Tech Stack Documentation

> **Comprehensive technical architecture overview for the AgenitiX workflow automation platform**

---

## 🏗️ **Core Architecture**

### **Framework & Runtime**
- **Next.js 15.2.1** - React-based full-stack framework with App Router
- **React 19.1.0** - Latest React with concurrent features and server components
- **TypeScript 5.7.2** - Strict type safety with comprehensive path mappings
- **Node.js** - Server-side runtime environment

### **Build & Development Tools**
- **Turbopack** - Next.js native bundler for fast development
- **PostCSS 8.4.49** - CSS processing with Tailwind integration
- **PWA Support** - Progressive Web App capabilities with `next-pwa`

---

## 🎨 **Frontend & UI**

### **Styling & Design System**
- **Tailwind CSS 4.1.4** - Utility-first CSS framework with v4 features
- **CSS Variables** - HSL-based design tokens for theming
- **Tailwind Plugins**:
  - `tailwind-scrollbar` - Custom scrollbar styling
  - `tailwindcss-animate` - Animation utilities
  - `tailwindcss-animated` - Extended animation library

### **UI Component Libraries**
- **Radix UI** - Headless, accessible component primitives:
  - Accordion, Checkbox, Dialog, Dropdown Menu
  - Label, Navigation Menu, Slot, Tabs, Tooltip
- **Lucide React** - Modern icon library (468+ icons)
- **Tabler Icons** - Additional icon set for comprehensive coverage
- **React Icons** - Popular icon library integration

### **Advanced UI Components**
- **Framer Motion 12.5.0** - Advanced animations and gestures
- **Motion 12.9.2** - Additional animation utilities
- **Embla Carousel** - Touch-friendly carousel with autoplay
- **React Select** - Customizable select components
- **Sonner** - Toast notification system

---

## 🔄 **Flow & Node System**

### **Visual Flow Editor**
- **@xyflow/react 12.6.0** - Advanced node-based editor with:
  - Drag-and-drop node creation
  - Custom node types and handles
  - Real-time flow execution
  - Visual debugging capabilities

### **Drag & Drop**
- **@dnd-kit** - Modern drag-and-drop toolkit:
  - Core functionality, sortable lists
  - Accessibility-first design
  - Touch device support

### **Node Architecture**
- **Custom NodeSpec System** - Enterprise-grade node architecture
- **Schema-driven Validation** - Zod-based type safety
- **Dynamic Node Loading** - Hot-swappable node system
- **Registry Pattern** - Centralized node management

---

## 📊 **Data Management**

### **State Management**
- **Zustand 5.0.3** - Lightweight state management
- **Immer 10.1.1** - Immutable state updates
- **React Query (@tanstack/react-query 5.74.4)** - Server state management

### **Data Validation & Processing**
- **Zod 3.25.55** - Runtime type validation and schema definition
- **AJV 8.12.0** - JSON schema validation
- **Superjson 2.2.2** - Enhanced JSON serialization
- **YAML 2.8.0** - YAML parsing and generation

### **Database & Backend**
- **Convex 1.23.0** - Real-time database and backend platform
- **Supabase Integration** - PostgreSQL database with real-time features

---

## 🛠️ **Development Tools**

### **Code Quality & Formatting**
- **Biome 1.9.4** - Fast linter and formatter (ESLint + Prettier replacement)
- **ESLint** - Additional linting with Next.js integration
- **TypeScript Strict Mode** - Maximum type safety

### **Code Generation & Automation**
- **Plop 4.0.1** - Code generation and scaffolding
- **ts-morph 26.0.0** - TypeScript AST manipulation
- **Handlebars 4.7.8** - Template engine for code generation

### **Build & Optimization**
- **CSSnano** - CSS minification for production
- **Fast-glob 3.3.3** - High-performance file globbing
- **Chokidar 4.0.3** - File system watching

---

## 🧪 **Testing & Quality Assurance**

### **Testing Frameworks**
- **Vitest 2.1.9** - Fast unit testing framework
- **Jest 29.7.0** - JavaScript testing framework
- **@testing-library/react 16.3.0** - React component testing
- **@testing-library/jest-dom 6.6.3** - Custom Jest matchers
- **Playwright 1.52.0** - End-to-end testing

### **Type Safety**
- **ts-json-schema-generator 2.4.0** - JSON schema from TypeScript
- **Comprehensive path mappings** - 20+ TypeScript path aliases
- **Strict TypeScript configuration** - Maximum type safety

---

## 🎯 **Specialized Features**

### **3D & Visualization**
- **Three.js 0.176.0** - 3D graphics and visualization
- **@react-three/fiber 9.0.0-alpha.8** - React renderer for Three.js
- **Cobe 0.6.3** - Interactive globe visualization
- **Recharts 2.15.3** - Responsive chart library

### **Data Handling**
- **React Datasheet Grid 4.11.5** - Excel-like data grid
- **React Markdown 10.1.0** - Markdown rendering with GFM support
- **Date-fns 4.1.0** - Modern date utility library
- **iCal Generator 8.1.1** - Calendar event generation

### **Utilities & Helpers**
- **Nanoid 5.1.5** - Unique ID generation
- **Slugify 1.6.6** - URL-friendly string conversion
- **Use-debounce 10.0.5** - React debouncing hooks
- **JWT-decode 4.0.0** - JWT token decoding
- **Class-variance-authority 0.7.0** - Conditional CSS classes

---

## 🔧 **Configuration & Setup**

### **Package Management**
- **pnpm** - Fast, disk space efficient package manager
- **Custom .npmrc** - Optimized package installation settings
- **Pre/post script support** - Automated build processes

### **Path Mapping System**
```typescript
// Comprehensive TypeScript path mappings
"@/*": ["./*"]                    // Root alias
"@modern/*": ["./features/business-logic-modern/*"]
"@domains/*": ["./node-domain/*"] // Node domains
"@infrastructure/*": ["./infrastructure/*"]
"@legacy/*": ["./features/business-logic-legacy/*"]
```

### **Environment Configuration**
- **Multiple environment files** - `.env`, `.env.local`
- **Type-safe environment variables** - `env.d.ts`
- **Development/production optimization**

---

## 🚀 **Performance & Optimization**

### **Build Optimization**
- **Next.js 15 optimizations** - Turbopack, App Router
- **Dynamic imports** - Code splitting and lazy loading
- **Image optimization** - Next.js Image component
- **CSS optimization** - PostCSS with cssnano

### **Runtime Performance**
- **React 19 concurrent features** - Improved rendering
- **Zustand lightweight state** - Minimal re-renders
- **Debounced inputs** - Optimized user interactions
- **Lazy loading** - On-demand component loading

### **Development Experience**
- **Hot module replacement** - Instant development feedback
- **TypeScript strict mode** - Compile-time error catching
- **Comprehensive linting** - Code quality enforcement
- **Automated code generation** - Reduced boilerplate

---

## 📦 **Deployment & Production**

### **Build Process**
```bash
# Production build pipeline
pnpm generate:tokens    # Generate design tokens
pnpm generate:handle-types  # Generate TypeScript types
pnpm build             # Next.js production build
```

### **PWA Features**
- **Service worker** - Offline functionality
- **App manifest** - Native app-like experience
- **Caching strategies** - Optimized performance

### **Monitoring & Analytics**
- **Vercel Analytics** - Performance monitoring
- **Custom error handling** - Comprehensive error reporting
- **Development debugging** - Enhanced development tools

---

## 🏛️ **Architecture Patterns**

### **Modern Business Logic System**
- **Domain-driven design** - Organized by business domains
- **NodeSpec architecture** - Standardized node creation
- **Registry pattern** - Centralized component management
- **Scaffold pattern** - Reusable component wrappers

### **Infrastructure Layer**
- **Theming system** - CSS variable-based design tokens
- **Validation layer** - Zod schema-driven validation
- **Flow engine** - Custom workflow execution
- **Inspector system** - Dynamic property panels

### **Legacy System Management**
- **Gradual migration** - Legacy system isolation
- **Backward compatibility** - Smooth transition path
- **Modern alternatives** - YAML-based node registry

---

## 🔮 **Future-Ready Architecture**

### **Planned Enhancements**
- **Visual Node Builder** - Drag-and-drop node creation
- **Node Registry & Marketplace** - Community-driven ecosystem
- **Custom Code Functionality** - In-browser code editing
- **Advanced AI Integration** - LLM-powered workflow assistance

### **Scalability Considerations**
- **Modular architecture** - Easy feature addition
- **Plugin system** - Extensible functionality
- **Performance monitoring** - Proactive optimization
- **Enterprise features** - Security and compliance ready

---

## 📋 **Development Commands**

### **Core Development**
```bash
pnpm dev                    # Start development server
pnpm build                  # Production build
pnpm start                  # Start production server
pnpm lint                   # Run linting
```

### **Code Generation**
```bash
pnpm create-node           # Generate new node
pnpm new:node              # Alternative node creation
pnpm generate:handle-types # Generate TypeScript types
pnpm generate:tokens       # Generate CSS tokens
```

### **Testing & Validation**
```bash
pnpm node:validate         # Validate node registry
pnpm version:check         # Check version consistency
pnpm validate:tokens       # Validate design tokens
```

---

## 🎯 **Key Strengths**

### **Developer Experience**
- **Type-safe development** - Comprehensive TypeScript integration
- **Hot reloading** - Instant feedback during development
- **Code generation** - Automated boilerplate creation
- **Comprehensive tooling** - Linting, formatting, testing

### **Performance**
- **Modern React features** - Concurrent rendering, suspense
- **Optimized bundling** - Turbopack and Next.js optimizations
- **Efficient state management** - Zustand and React Query
- **Progressive enhancement** - PWA capabilities

### **Maintainability**
- **Modular architecture** - Clear separation of concerns
- **Consistent patterns** - Standardized development approaches
- **Comprehensive documentation** - Self-documenting code
- **Automated quality checks** - Linting and testing integration

---

**AgenitiX represents a modern, scalable, and developer-friendly approach to workflow automation platforms, built with enterprise-grade architecture and cutting-edge web technologies.**