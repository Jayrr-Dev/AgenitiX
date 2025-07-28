---
inclusion: always
---

# AgenitiX Development Standards

**Rule 0**: Ship small, typed, tested, documented slices. Leave it cleaner.

## Core Principles

1. **Plan → Code → Test → Document** - Always follow this sequence
2. **Single Source of Truth** - One authoritative source for data/config
3. **Tiny, Pure Units** - Immutable by default, small focused functions
4. **Fail Gracefully** - Log centrally (Sentry), handle errors gracefully
5. **Measure First** - Optimize last, measure performance first

## Naming Conventions

### File Naming
- **Components**: `PascalCase.tsx` (e.g., `FlowEditor.tsx`, `NodeInspector.tsx`)
- **Hooks**: `use-thing.ts` (e.g., `useNodeData.ts`, `useWorkflowExecution.ts`)
- **Everything else**: `kebab-case.ts` (e.g., `node-utils.ts`, `email-helpers.ts`)

### Function/Variable Naming
- **Functions/Variables**: `camelCase`
- **Constants**: `CONSTANT_CASE` for true globals only
- **Types/Interfaces**: `PascalCase` (e.g., `NodeData`, `WorkflowConfig`)

### Database/Convex Naming
- **Tables**: `domain_resource_plural` (snake_case)
  - Examples: `auth_users`, `email_templates`, `workflow_runs`
- **Join Tables**: Two singulars, alphabetical order
  - Examples: `project_users`, `user_roles`
- **Columns**: `singular_names` (snake_case)
  - Examples: `user_name`, `email_address`, `created_at`

## Documentation Standards (JSDoc Lite)

### Component Documentation
```typescript
/**
 * Flow Editor Component
 * 
 * Main visual workflow editor with drag-and-drop node functionality.
 * Supports real-time collaboration and automatic saving.
 * 
 * @example
 * <FlowEditor 
 *   workflowId="workflow-123"
 *   onSave={handleSave}
 *   readOnly={false}
 * />
 */
```

### Function Documentation
```typescript
/**
 * Validates node specification against schema requirements
 * @param spec - NodeSpec to validate
 * @returns true if valid, throws error if invalid
 * @example
 * validateNodeSpec(createTextSpec) // true
 * validateNodeSpec({}) // throws ValidationError
 */
```

### Type Documentation
```typescript
/**
 * Node execution context with access to database and external services
 * @see NodeSpec for node definition structure
 */
interface NodeExecutionContext {
  convex: ConvexClient;
  userId: string;
  workflowId: string;
}
```

## Architecture Patterns (DDD-inspired)

### Directory Structure
```
app/            # UI entry & routes (Next.js App Router)
convex/         # Schema + queries/mutations
features/       # Feature-based business logic
  business-logic-modern/
    node-domain/     # Node business logic
    infrastructure/  # Core systems
domain/         # Pure business logic
application/    # Use-cases, DTOs, events
infrastructure/ # Adapters (repos, email, APIs)
lib/            # Utils, DI, stores, constants
components/     # UI pieces (ui/, features/, layouts/)
```

### Architecture Rules
- **Domain ← Clean**: Business logic isolated from infrastructure
- **UI Never Holds Business Rules**: UI is presentation only
- **Infrastructure Implements Interfaces**: Adapters follow domain contracts

## React/Next.js Standards

### Component Patterns
```typescript
// Server Components by default
export default async function WorkflowList() {
  const workflows = await getWorkflows();
  return <WorkflowListClient workflows={workflows} />;
}

// Client Components only when needed
"use client";
export function WorkflowListClient({ workflows }: { workflows: Workflow[] }) {
  const [selected, setSelected] = useState<string>();
  return <div>...</div>;
}
```

### Hook Patterns
```typescript
// One concern per hook
export function useNodeData(nodeId: string) {
  const [data, setData] = useState<NodeData>();
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Single concern: fetch node data
  }, [nodeId]);
  
  return { data, loading, setData };
}

// Separate hook for node execution
export function useNodeExecution(nodeId: string) {
  const [executing, setExecuting] = useState(false);
  const [result, setResult] = useState<any>();
  
  const execute = useCallback(async () => {
    // Single concern: execute node
  }, [nodeId]);
  
  return { execute, executing, result };
}
```

### State Management
```typescript
// Local UI state stays local
const [isExpanded, setIsExpanded] = useState(false);

// Shared state in Zustand/Convex
const useWorkflowStore = create<WorkflowStore>((set) => ({
  workflows: [],
  addWorkflow: (workflow) => set((state) => ({
    workflows: [...state.workflows, workflow]
  })),
}));
```

### Magic Values
```typescript
// Extract to top-level constants
const NODE_EXECUTION_TIMEOUT = 30000; // 30 seconds
const MAX_WORKFLOW_NODES = 100;
const EMAIL_RATE_LIMIT = 10; // per minute

// Use in components
if (executionTime > NODE_EXECUTION_TIMEOUT) {
  throw new Error("Execution timeout");
}
```

## UI/UX Standards

### Design System
```typescript
// Use shadcn + Tailwind tokens
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// No hard-coded magic numbers
const spacing = {
  xs: "0.25rem",
  sm: "0.5rem",
  md: "1rem",
  lg: "1.5rem",
  xl: "2rem",
} as const;
```

### Accessibility
```typescript
// Semantic HTML + ARIA
<button
  aria-label="Execute workflow"
  aria-describedby="execution-status"
  onClick={handleExecute}
>
  Execute
</button>

// Focus management
const focusRef = useRef<HTMLButtonElement>(null);
useEffect(() => {
  focusRef.current?.focus();
}, []);
```

### Responsive Design
```typescript
// Mobile-first approach
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {nodes.map(node => (
    <NodeCard key={node.id} node={node} />
  ))}
</div>
```

## Error Handling

### Error Types
```typescript
// Custom error classes
export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export class WorkflowExecutionError extends Error {
  constructor(message: string, public nodeId?: string) {
    super(message);
    this.name = "WorkflowExecutionError";
  }
}
```

### Error Handling Pattern
```typescript
// Centralized error handling
export const handleError = (error: unknown, context: string) => {
  // Normalize error
  const normalizedError = normalizeError(error);
  
  // Log to Sentry
  Sentry.captureException(normalizedError, {
    tags: { context },
    extra: { error: normalizedError },
  });
  
  // Map to user-friendly message
  return mapErrorToUserMessage(normalizedError);
};
```

## Testing Standards

### Unit Testing
```typescript
// Test pure logic and components
describe("NodeUtils", () => {
  it("validates node spec correctly", () => {
    const validSpec = createValidNodeSpec();
    expect(validateNodeSpec(validSpec)).toBe(true);
  });
  
  it("rejects invalid node spec", () => {
    const invalidSpec = {};
    expect(() => validateNodeSpec(invalidSpec)).toThrow();
  });
});
```

### Integration Testing
```typescript
// Test data + UI flows
describe("Workflow Execution", () => {
  it("executes workflow successfully", async () => {
    const { result } = renderWithProviders(<WorkflowEditor />);
    
    // Add nodes
    fireEvent.click(screen.getByText("Add Node"));
    
    // Execute workflow
    fireEvent.click(screen.getByText("Execute"));
    
    // Verify execution
    await waitFor(() => {
      expect(screen.getByText("Execution Complete")).toBeInTheDocument();
    });
  });
});
```

## Pre-Commit Checklist

### Code Quality
- [ ] **Linting**: `pnpm lint` passes
- [ ] **Formatting**: `pnpm format` applied
- [ ] **Types**: TypeScript compilation succeeds
- [ ] **Tests**: All tests pass

### Documentation
- [ ] **JSDoc**: Non-trivial functions documented
- [ ] **README**: Updated if needed
- [ ] **Comments**: Complex logic explained

### Security
- [ ] **Input Validation**: All inputs validated
- [ ] **Error Handling**: Errors handled gracefully
- [ ] **Sensitive Data**: No secrets in code

### Performance
- [ ] **Bundle Size**: No unnecessary dependencies
- [ ] **Rendering**: No unnecessary re-renders
- [ ] **Memory**: No memory leaks

## File References

- **Convex Standards**: #[[file:.kiro/steering/convex-best-practices.md]]
- **Sentry Rules**: #[[file:.kiro/steering/sentry-rules.md]]
- **TypeScript Best Practices**: #[[file:.kiro/steering/typescript-best-practices.md]]
- **useEffect Guidelines**: #[[file:.kiro/steering/useeffect-best-practices.md]]
- **GitHub Workflow**: #[[file:.kiro/steering/github-workflow.md]]
- **Project Structure**: #[[file:.kiro/steering/structure.md]]
- **Technology Stack**: #[[file:.kiro/steering/tech.md]]

## Development Workflow

### Feature Development
1. **Plan**: Define requirements and acceptance criteria
2. **Code**: Implement with TDD approach
3. **Test**: Unit + integration tests
4. **Document**: Update docs and add JSDoc
5. **Review**: Self-review before PR

### Bug Fixes
1. **Reproduce**: Create minimal reproduction
2. **Test**: Write failing test
3. **Fix**: Implement solution
4. **Verify**: Test passes
5. **Document**: Update relevant docs

**Remember**: Done > Perfect. Tested + Documented > Done.