/**
 * File: .kiro/steering/clean-code-principles.md
 * CLEAN CODE PRINCIPLES - Comprehensive clean code guidelines for AgenitiX
 * 
 * • Simplicity and complexity reduction with KISS principle
 * • Boy Scout rule for continuous code improvement
 * • Root cause analysis and proper abstraction patterns
 * • Dependency injection and inversion of control
 * • React/Next.js specific clean code practices
 * • Integration with AgenitiX architecture and domain patterns
 * 
 * Keywords: clean-code, simplicity, boy-scout-rule, dependency-injection, react-patterns
 */

# Clean Code Principles

## Overview

This document establishes clean code principles for the AgenitiX platform, emphasizing simplicity, maintainability, and clarity. These principles integrate with our React/Next.js/TypeScript architecture and Convex backend to ensure high-quality, sustainable code.

## Core Philosophy

### 1. Keep It Simple, Stupid (KISS)
**Rule**: Reduce complexity relentlessly. Choose the simplest solution that works.

**Why**: Simple code is easier to understand, test, debug, and maintain.

```typescript
// ❌ Bad - unnecessary complexity
const getUserDisplayInfo = (user: User) => {
  const displayInfo = {
    name: user.firstName && user.lastName 
      ? `${user.firstName} ${user.lastName}`
      : user.firstName 
        ? user.firstName
        : user.email
          ? user.email.split('@')[0]
          : 'Anonymous',
    avatar: user.avatar || '/default-avatar.png',
    status: user.isActive 
      ? user.lastSeen && Date.now() - user.lastSeen < 300000 
        ? 'online' 
        : 'away'
      : 'offline'
  };
  return displayInfo;
};

// ✅ Good - simple and clear
const getUserDisplayName = (user: User): string => {
  if (user.firstName && user.lastName) {
    return `${user.firstName} ${user.lastName}`;
  }
  if (user.firstName) {
    return user.firstName;
  }
  if (user.email) {
    return user.email.split('@')[0];
  }
  return 'Anonymous';
};

const getUserAvatar = (user: User): string => {
  return user.avatar || '/default-avatar.png';
};

const getUserStatus = (user: User): 'online' | 'away' | 'offline' => {
  if (!user.isActive) return 'offline';
  if (!user.lastSeen) return 'away';
  
  const FIVE_MINUTES = 5 * 60 * 1000;
  return Date.now() - user.lastSeen < FIVE_MINUTES ? 'online' : 'away';
};
```

### 2. Boy Scout Rule
**Rule**: Always leave code cleaner than you found it.

**Why**: Continuous improvement prevents technical debt accumulation.

```typescript
// ❌ Before - found this code
const processFlowData = (data) => {
  let result = [];
  for (let i = 0; i < data.length; i++) {
    if (data[i].type == 'node') {
      result.push({
        id: data[i].id,
        name: data[i].name || 'Untitled',
        pos: data[i].position
      });
    }
  }
  return result;
};

// ✅ After - cleaned up while working on it
interface FlowNode {
  readonly id: string;
  readonly name: string;
  readonly position: Position;
}

interface RawFlowData {
  readonly id: string;
  readonly type: string;
  readonly name?: string;
  readonly position: Position;
}

const extractFlowNodes = (rawData: readonly RawFlowData[]): readonly FlowNode[] => {
  return rawData
    .filter(item => item.type === 'node')
    .map(node => ({
      id: node.id,
      name: node.name || 'Untitled Node',
      position: node.position,
    }));
};
```

## Design Principles

### 3. Search for Root Cause, Not Symptoms
**Rule**: Always dig deeper to find the underlying issue.

```typescript
// ❌ Bad - treating symptoms
const FlowEditor = () => {
  const [nodes, setNodes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Symptom: nodes sometimes disappear
  useEffect(() => {
    const interval = setInterval(() => {
      if (nodes.length === 0) {
        // Band-aid solution
        refetchNodes();
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [nodes]);
};

// ✅ Good - addressing root cause
const FlowEditor = () => {
  const { nodes, error, refetch } = useFlowNodes(flowId);
  
  // Root cause: handle connection errors properly
  useEffect(() => {
    if (error?.code === 'CONNECTION_LOST') {
      // Proper error handling and recovery
      const reconnect = async () => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        refetch();
      };
      reconnect();
    }
  }, [error, refetch]);
};
```

### 4. Keep Configurable Data at High Levels
**Rule**: Configuration should flow down from the top of the application.

```typescript
// ✅ Good - configuration at app level
// app/layout.tsx
const appConfig = createAppConfig();

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        <ConfigProvider config={appConfig}>
          <ConvexProvider>
            {children}
          </ConvexProvider>
        </ConfigProvider>
      </body>
    </html>
  );
}

// ✅ Good - components receive config through context
const FlowEditor = () => {
  const { flowEditor } = useAppConfig();
  
  return (
    <div>
      <Canvas 
        snapToGrid={flowEditor.snapToGrid}
        gridSize={flowEditor.gridSize}
      />
    </div>
  );
};

// ❌ Bad - hardcoded configuration deep in components
const Canvas = () => {
  const snapToGrid = true; // Should come from config
  const gridSize = 20;     // Should come from config
};
```

### 5. Prefer Polymorphism/Composition Over Conditionals
**Rule**: Use polymorphism and composition instead of if/else or switch ladders.

```typescript
// ❌ Bad - switch ladder
const renderNode = (node: FlowNode) => {
  switch (node.type) {
    case 'create':
      return <CreateNode data={node.data} />;
    case 'view':
      return <ViewNode data={node.data} />;
    case 'trigger':
      return <TriggerNode data={node.data} />;
    case 'test':
      return <TestNode data={node.data} />;
    case 'cycle':
      return <CycleNode data={node.data} />;
    default:
      return <UnknownNode />;
  }
};

// ✅ Good - polymorphic approach
interface NodeRenderer {
  render(data: NodeData): JSX.Element;
}

const NODE_RENDERERS: Record<NodeType, NodeRenderer> = {
  create: { render: (data) => <CreateNode data={data} /> },
  view: { render: (data) => <ViewNode data={data} /> },
  trigger: { render: (data) => <TriggerNode data={data} /> },
  test: { render: (data) => <TestNode data={data} /> },
  cycle: { render: (data) => <CycleNode data={data} /> },
};

const renderNode = (node: FlowNode): JSX.Element => {
  const renderer = NODE_RENDERERS[node.type];
  return renderer ? renderer.render(node.data) : <UnknownNode />;
};

// ✅ Even better - composition with discriminated unions
type FlowNodeProps = 
  | { type: 'create'; data: CreateNodeData }
  | { type: 'view'; data: ViewNodeData }
  | { type: 'trigger'; data: TriggerNodeData }
  | { type: 'test'; data: TestNodeData }
  | { type: 'cycle'; data: CycleNodeData };

const FlowNode: React.FC<FlowNodeProps> = (props) => {
  switch (props.type) {
    case 'create':
      return <CreateNode data={props.data} />;
    case 'view':
      return <ViewNode data={props.data} />;
    case 'trigger':
      return <TriggerNode data={props.data} />;
    case 'test':
      return <TestNode data={props.data} />;
    case 'cycle':
      return <CycleNode data={props.data} />;
  }
};
```

### 6. Use Dependency Injection/Inversion
**Rule**: Use contexts, hooks, and factories for dependency management.

```typescript
// ✅ Good - dependency injection with context
interface FlowServices {
  readonly nodeService: NodeService;
  readonly executionService: ExecutionService;
  readonly validationService: ValidationService;
}

const FlowServicesContext = createContext<FlowServices | null>(null);

export const FlowServicesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const services = useMemo((): FlowServices => ({
    nodeService: createNodeService(),
    executionService: createExecutionService(),
    validationService: createValidationService(),
  }), []);

  return (
    <FlowServicesContext.Provider value={services}>
      {children}
    </FlowServicesContext.Provider>
  );
};

export const useFlowServices = (): FlowServices => {
  const services = useContext(FlowServicesContext);
  if (!services) {
    throw new Error('useFlowServices must be used within FlowServicesProvider');
  }
  return services;
};

// ✅ Good - components depend on abstractions
const FlowExecutor = () => {
  const { executionService } = useFlowServices();
  
  const handleExecute = async (flowId: string) => {
    await executionService.execute(flowId);
  };
  
  return <button onClick={() => handleExecute('flow-1')}>Execute</button>;
};
```

## Function Design

### 7. Keep Functions Small and Focused
**Rule**: Functions should do one thing and do it well.

```typescript
// ❌ Bad - function doing too many things
const processUserRegistration = async (userData: any) => {
  // Validation
  if (!userData.email || !userData.password) {
    throw new Error('Missing required fields');
  }
  
  // Password hashing
  const hashedPassword = await bcrypt.hash(userData.password, 10);
  
  // Database insertion
  const user = await db.users.create({
    email: userData.email,
    password: hashedPassword,
    createdAt: new Date(),
  });
  
  // Email sending
  await sendWelcomeEmail(user.email);
  
  // Analytics tracking
  analytics.track('user_registered', { userId: user.id });
  
  return user;
};

// ✅ Good - single responsibility functions
const validateRegistrationData = (userData: RegistrationData): void => {
  if (!userData.email || !userData.password) {
    throw new ValidationError('Email and password are required');
  }
};

const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 10);
};

const createUser = async (userData: ValidatedUserData): Promise<User> => {
  return db.users.create({
    email: userData.email,
    password: userData.hashedPassword,
    createdAt: new Date(),
  });
};

const processUserRegistration = async (userData: RegistrationData): Promise<User> => {
  validateRegistrationData(userData);
  
  const hashedPassword = await hashPassword(userData.password);
  const user = await createUser({ ...userData, hashedPassword });
  
  // Side effects handled separately
  await Promise.all([
    sendWelcomeEmail(user.email),
    trackUserRegistration(user.id),
  ]);
  
  return user;
};
```

### 8. Use Descriptive Function Names
**Rule**: Function names should clearly describe what they do.

```typescript
// ❌ Bad - unclear names
const calc = (n: FlowNode[]) => n.filter(x => x.active).length;
const proc = (data: any) => { /* ... */ };
const handle = () => { /* ... */ };

// ✅ Good - descriptive names
const countActiveNodes = (nodes: readonly FlowNode[]): number => 
  nodes.filter(node => node.isActive).length;

const processFlowExecutionResult = (result: ExecutionResult): ProcessedResult => {
  // Implementation
};

const handleNodeSelectionChange = (selectedNodeIds: readonly string[]): void => {
  // Implementation
};
```

### 9. Prefer Fewer Function Arguments
**Rule**: Group related arguments into objects.

```typescript
// ❌ Bad - too many parameters
const createFlowNode = (
  id: string,
  type: string,
  name: string,
  x: number,
  y: number,
  width: number,
  height: number,
  color: string,
  isActive: boolean
) => {
  // Implementation
};

// ✅ Good - grouped parameters
interface CreateNodeParams {
  readonly id: string;
  readonly type: NodeType;
  readonly name: string;
  readonly position: Position;
  readonly dimensions: Dimensions;
  readonly appearance: NodeAppearance;
  readonly isActive: boolean;
}

const createFlowNode = (params: CreateNodeParams): FlowNode => {
  // Implementation
};

// ✅ Even better - use builder pattern for complex objects
class FlowNodeBuilder {
  private params: Partial<CreateNodeParams> = {};
  
  id(id: string): this {
    this.params.id = id;
    return this;
  }
  
  type(type: NodeType): this {
    this.params.type = type;
    return this;
  }
  
  position(x: number, y: number): this {
    this.params.position = { x, y };
    return this;
  }
  
  build(): FlowNode {
    return createFlowNode(this.params as CreateNodeParams);
  }
}

// Usage
const node = new FlowNodeBuilder()
  .id('node-1')
  .type('create')
  .position(100, 200)
  .build();
```

## Naming Conventions

### 10. Choose Descriptive, Unambiguous Names
**Rule**: Names should be pronounceable, searchable, and meaningful.

```typescript
// ❌ Bad - unclear names
const d = new Date();
const u = users.filter(x => x.a);
const calc = (n1, n2) => n1 * n2 * 0.1;

// ✅ Good - descriptive names
const currentDate = new Date();
const activeUsers = users.filter(user => user.isActive);
const calculateDiscountAmount = (price: number, quantity: number): number => 
  price * quantity * DISCOUNT_RATE;

// ✅ Good - searchable constants
const DISCOUNT_RATE = 0.1 as const;
const MAX_RETRY_ATTEMPTS = 3 as const;
const DEFAULT_TIMEOUT_MS = 5000 as const;
```

### 11. Make Meaningful Distinctions
**Rule**: Avoid noise words and meaningless variations.

```typescript
// ❌ Bad - noise words and unclear distinctions
interface UserInfo {
  userData: UserData;
  userDetails: UserDetails;
  userObject: User;
}

const getUserInfo = () => { /* ... */ };
const getUserData = () => { /* ... */ };
const getUserDetails = () => { /* ... */ };

// ✅ Good - meaningful distinctions
interface UserProfile {
  readonly personalInfo: PersonalInfo;
  readonly preferences: UserPreferences;
  readonly account: UserAccount;
}

const getUserProfile = (userId: string): Promise<UserProfile> => { /* ... */ };
const getUserPreferences = (userId: string): Promise<UserPreferences> => { /* ... */ };
const getUserAccount = (userId: string): Promise<UserAccount> => { /* ... */ };
```

### 12. Replace Magic Numbers with Named Constants
**Rule**: Use descriptive constants instead of magic numbers.

```typescript
// ❌ Bad - magic numbers
const isRecentActivity = (timestamp: number): boolean => {
  return Date.now() - timestamp < 300000; // What is 300000?
};

const paginateResults = (results: any[], page: number) => {
  const start = (page - 1) * 20; // Why 20?
  return results.slice(start, start + 20);
};

// ✅ Good - named constants
const FIVE_MINUTES_MS = 5 * 60 * 1000;
const DEFAULT_PAGE_SIZE = 20;

const isRecentActivity = (timestamp: number): boolean => {
  return Date.now() - timestamp < FIVE_MINUTES_MS;
};

const paginateResults = <T>(results: readonly T[], page: number): readonly T[] => {
  const startIndex = (page - 1) * DEFAULT_PAGE_SIZE;
  return results.slice(startIndex, startIndex + DEFAULT_PAGE_SIZE);
};
```

## Code Organization

### 13. Separate Concepts Vertically
**Rule**: Use whitespace to group related code and separate different concepts.

```typescript
// ✅ Good - proper vertical separation
const FlowEditor: React.FC<FlowEditorProps> = ({ flowId }) => {
  // State declarations
  const [nodes, setNodes] = useState<FlowNode[]>([]);
  const [edges, setEdges] = useState<FlowEdge[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // Custom hooks
  const { saveFlow, isLoading } = useFlowPersistence(flowId);
  const { executeFlow } = useFlowExecution();
  const { validateFlow } = useFlowValidation();

  // Event handlers
  const handleNodeSelect = useCallback((nodeId: string) => {
    setSelectedNodeId(nodeId);
  }, []);

  const handleNodeUpdate = useCallback((nodeId: string, updates: Partial<FlowNode>) => {
    setNodes(prevNodes => 
      prevNodes.map(node => 
        node.id === nodeId ? { ...node, ...updates } : node
      )
    );
  }, []);

  const handleSave = useCallback(async () => {
    const isValid = validateFlow(nodes, edges);
    if (isValid) {
      await saveFlow({ nodes, edges });
    }
  }, [nodes, edges, validateFlow, saveFlow]);

  // Effects
  useEffect(() => {
    const autoSaveInterval = setInterval(handleSave, AUTO_SAVE_INTERVAL);
    return () => clearInterval(autoSaveInterval);
  }, [handleSave]);

  // Render
  return (
    <div className="flow-editor">
      <FlowCanvas 
        nodes={nodes}
        edges={edges}
        onNodeSelect={handleNodeSelect}
        onNodeUpdate={handleNodeUpdate}
      />
      <FlowToolbar onSave={handleSave} isLoading={isLoading} />
    </div>
  );
};
```

### 14. Declare Variables Close to Usage
**Rule**: Variables should be declared as close as possible to where they're used.

```typescript
// ❌ Bad - variables declared far from usage
const FlowProcessor = () => {
  const startTime = Date.now();
  const maxRetries = 3;
  const timeout = 5000;
  const [result, setResult] = useState(null);
  
  const processFlow = async () => {
    // ... lots of other code ...
    
    // Variables used here, far from declaration
    const elapsed = Date.now() - startTime;
    if (elapsed > timeout) {
      throw new Error('Timeout');
    }
  };
};

// ✅ Good - variables declared close to usage
const FlowProcessor = () => {
  const [result, setResult] = useState(null);
  
  const processFlow = async () => {
    const startTime = Date.now();
    const MAX_RETRIES = 3;
    const TIMEOUT_MS = 5000;
    
    // Process logic here
    
    const elapsed = Date.now() - startTime;
    if (elapsed > TIMEOUT_MS) {
      throw new Error('Processing timeout');
    }
  };
};
```

## React/Next.js Specific Principles

### 15. Split useEffects by Concern
**Rule**: Don't cram multiple responsibilities into one useEffect.

```typescript
// ❌ Bad - multiple concerns in one effect
useEffect(() => {
  // Concern 1: Data fetching
  fetchUserData(userId);
  
  // Concern 2: Analytics
  analytics.track('page_view', { page: 'flow-editor' });
  
  // Concern 3: Event listeners
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') closeModal();
  };
  document.addEventListener('keydown', handleKeyDown);
  
  return () => {
    document.removeEventListener('keydown', handleKeyDown);
  };
}, [userId]);

// ✅ Good - separate effects for separate concerns
// Data fetching
useEffect(() => {
  fetchUserData(userId);
}, [userId]);

// Analytics
useEffect(() => {
  analytics.track('page_view', { page: 'flow-editor' });
}, []);

// Event listeners
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') closeModal();
  };
  
  document.addEventListener('keydown', handleKeyDown);
  return () => document.removeEventListener('keydown', handleKeyDown);
}, [closeModal]);
```

### 16. Prefer Component Composition
**Rule**: Use composition and discriminated unions instead of giant prop conditionals.

```typescript
// ❌ Bad - giant prop conditionals
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({ 
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  children 
}) => {
  // Complex conditional rendering logic
};

// ✅ Good - composition approach
const Button: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, 
  className 
}) => (
  <button className={cn('btn', className)}>
    {children}
  </button>
);

const PrimaryButton: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Button className="btn-primary">{children}</Button>
);

const SecondaryButton: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Button className="btn-secondary">{children}</Button>
);

const LoadingButton: React.FC<{ 
  children: React.ReactNode; 
  isLoading: boolean;
  variant?: 'primary' | 'secondary';
}> = ({ children, isLoading, variant = 'primary' }) => {
  const ButtonComponent = variant === 'primary' ? PrimaryButton : SecondaryButton;
  
  return (
    <ButtonComponent>
      {isLoading ? <Spinner /> : children}
    </ButtonComponent>
  );
};
```

### 17. Avoid Side Effects at Module Import Time
**Rule**: Keep top-level constants pure and side-effect free.

```typescript
// ❌ Bad - side effects at import time
console.log('Module loading...'); // Side effect!
const config = fetchConfig(); // Side effect!
const user = getCurrentUser(); // Side effect!

// ✅ Good - pure constants only
const DEFAULT_CONFIG = {
  timeout: 5000,
  retries: 3,
} as const;

const API_ENDPOINTS = {
  users: '/api/users',
  flows: '/api/flows',
} as const;

// ✅ Good - side effects in functions/hooks
export const useAppInitialization = () => {
  useEffect(() => {
    console.log('App initialized');
    initializeAnalytics();
  }, []);
};

export const createConfigFactory = () => {
  return fetchConfig(); // Side effect contained in factory
};
```

## Error Handling and Boundary Conditions

### 18. Encapsulate Boundary Conditions
**Rule**: Handle edge cases and boundary conditions in one place.

```typescript
// ❌ Bad - boundary conditions scattered
const getPageItems = (items: any[], page: number, pageSize: number) => {
  if (page < 1) page = 1; // Boundary condition
  if (pageSize < 1) pageSize = 10; // Boundary condition
  
  const start = (page - 1) * pageSize;
  if (start >= items.length) return []; // Boundary condition
  
  return items.slice(start, start + pageSize);
};

// ✅ Good - boundary conditions encapsulated
class PaginationParams {
  constructor(
    private readonly page: number,
    private readonly pageSize: number
  ) {}
  
  get normalizedPage(): number {
    return Math.max(1, this.page);
  }
  
  get normalizedPageSize(): number {
    return Math.max(1, Math.min(100, this.pageSize)); // Also cap at 100
  }
  
  getSliceIndices(totalItems: number): { start: number; end: number } {
    const start = (this.normalizedPage - 1) * this.normalizedPageSize;
    const end = Math.min(start + this.normalizedPageSize, totalItems);
    
    return { start: Math.max(0, start), end };
  }
}

const getPageItems = <T>(items: readonly T[], page: number, pageSize: number): readonly T[] => {
  const pagination = new PaginationParams(page, pageSize);
  const { start, end } = pagination.getSliceIndices(items.length);
  
  return items.slice(start, end);
};
```

### 19. Prefer Dedicated Value Objects Over Primitives
**Rule**: Use specific types instead of primitive types for domain concepts.

```typescript
// ❌ Bad - primitive obsession
const createUser = (email: string, age: number, score: number) => {
  // What if someone passes age as score and vice versa?
  return { email, age, score };
};

const user = createUser('test@example.com', 85, 25); // Bug: swapped age and score

// ✅ Good - value objects
class Email {
  constructor(private readonly value: string) {
    if (!this.isValid(value)) {
      throw new Error('Invalid email format');
    }
  }
  
  private isValid(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
  
  toString(): string {
    return this.value;
  }
}

class Age {
  constructor(private readonly value: number) {
    if (value < 0 || value > 150) {
      throw new Error('Invalid age');
    }
  }
  
  get years(): number {
    return this.value;
  }
}

class Score {
  constructor(private readonly value: number) {
    if (value < 0 || value > 100) {
      throw new Error('Score must be between 0 and 100');
    }
  }
  
  get points(): number {
    return this.value;
  }
}

const createUser = (email: Email, age: Age, score: Score) => {
  return { 
    email: email.toString(), 
    age: age.years, 
    score: score.points 
  };
};

// Usage - type safety prevents errors
const user = createUser(
  new Email('test@example.com'),
  new Age(25),
  new Score(85)
);
```

## Testing Principles

### 20. Tests Should Be Readable and Independent
**Rule**: Each test should be clear, fast, and not depend on other tests.

```typescript
// ❌ Bad - unclear and dependent tests
let user: User;

beforeEach(() => {
  user = createUser();
});

test('user creation', () => {
  expect(user).toBeDefined();
  user.activate();
});

test('user activation', () => {
  // Depends on previous test
  expect(user.isActive).toBe(true);
});

// ✅ Good - clear and independent tests
describe('User Management', () => {
  describe('when creating a new user', () => {
    it('should create user with default inactive status', () => {
      const user = createUser({
        email: 'test@example.com',
        name: 'Test User',
      });
      
      expect(user.isActive).toBe(false);
      expect(user.email).toBe('test@example.com');
      expect(user.name).toBe('Test User');
    });
  });
  
  describe('when activating a user', () => {
    it('should set user status to active', () => {
      const user = createUser({
        email: 'test@example.com',
        name: 'Test User',
      });
      
      user.activate();
      
      expect(user.isActive).toBe(true);
    });
  });
});
```

### 21. One Logical Assert Per Test
**Rule**: Focus each test on one specific behavior.

```typescript
// ❌ Bad - multiple unrelated assertions
test('user operations', () => {
  const user = createUser({ email: 'test@example.com' });
  expect(user.email).toBe('test@example.com'); // Testing creation
  
  user.updateProfile({ name: 'New Name' });
  expect(user.name).toBe('New Name'); // Testing update
  
  user.deactivate();
  expect(user.isActive).toBe(false); // Testing deactivation
});

// ✅ Good - focused tests
describe('User', () => {
  it('should be created with provided email', () => {
    const user = createUser({ email: 'test@example.com' });
    
    expect(user.email).toBe('test@example.com');
  });
  
  it('should update profile name', () => {
    const user = createUser({ email: 'test@example.com' });
    
    user.updateProfile({ name: 'New Name' });
    
    expect(user.name).toBe('New Name');
  });
  
  it('should become inactive when deactivated', () => {
    const user = createUser({ email: 'test@example.com' });
    
    user.deactivate();
    
    expect(user.isActive).toBe(false);
  });
});
```

## AgenitiX-Specific Patterns

### 22. Flow Node Architecture
**Rule**: Follow clean architecture principles for node development.

```typescript
// ✅ Good - clean node architecture
// Domain layer - pure business logic
export class FlowNode {
  constructor(
    private readonly id: NodeId,
    private readonly type: NodeType,
    private readonly data: NodeData
  ) {}
  
  execute(input: NodeInput): NodeOutput {
    // Pure business logic - no side effects
    return this.processInput(input);
  }
  
  private processInput(input: NodeInput): NodeOutput {
    // Implementation specific to node type
  }
}

// Infrastructure layer - external concerns
export class ConvexNodeRepository {
  async save(node: FlowNode): Promise<void> {
    // Convex-specific persistence logic
  }
  
  async findById(id: NodeId): Promise<FlowNode | null> {
    // Convex-specific retrieval logic
  }
}

// Application layer - use cases
export class NodeExecutionService {
  constructor(
    private readonly nodeRepository: NodeRepository,
    private readonly eventBus: EventBus
  ) {}
  
  async executeNode(nodeId: NodeId, input: NodeInput): Promise<NodeOutput> {
    const node = await this.nodeRepository.findById(nodeId);
    if (!node) {
      throw new NodeNotFoundError(nodeId);
    }
    
    const output = node.execute(input);
    
    await this.eventBus.publish(new NodeExecutedEvent(nodeId, output));
    
    return output;
  }
}
```

### 23. Convex Integration Patterns
**Rule**: Keep Convex operations clean and focused.

```typescript
// ✅ Good - clean Convex functions
// convex/flows.ts
export const createFlow = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    nodes: v.array(v.any()),
    edges: v.array(v.any()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    
    const flowData = validateFlowData(args);
    
    return await ctx.db.insert('flows', {
      ...flowData,
      userId: user.id,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

// Helper functions for clean separation
const getCurrentUser = async (ctx: MutationCtx): Promise<User> => {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new ConvexError('Authentication required');
  }
  
  const user = await ctx.db
    .query('auth_users')
    .withIndex('by_subject', q => q.eq('subject', identity.subject))
    .unique();
    
  if (!user) {
    throw new ConvexError('User not found');
  }
  
  return user;
};

const validateFlowData = (data: any): ValidatedFlowData => {
  // Validation logic separated from Convex handler
  const schema = z.object({
    name: z.string().min(1).max(100),
    description: z.string().max(500).optional(),
    nodes: z.array(nodeSchema),
    edges: z.array(edgeSchema),
  });
  
  return schema.parse(data);
};
```

## Code Smells to Watch For

### 24. Common Code Smells
**Rule**: Actively watch for and refactor these patterns:

```typescript
// 🚨 Rigidity - hard to change
class FlowProcessor {
  process(flow: Flow) {
    // Tightly coupled to specific implementations
    const emailService = new GmailService(); // Hard to test/change
    const dbService = new ConvexService();   // Hard to test/change
    
    // Processing logic tightly coupled to services
  }
}

// ✅ Flexible - easy to change
class FlowProcessor {
  constructor(
    private readonly emailService: EmailService,
    private readonly dbService: DatabaseService
  ) {}
  
  process(flow: Flow) {
    // Uses abstractions - easy to test and change
  }
}

// 🚨 Fragility - breaks in unexpected places
const calculateTotal = (items: any[]) => {
  let total = 0;
  for (let i = 0; i < items.length; i++) {
    total += items[i].price * items[i].quantity; // Assumes structure
  }
  return total;
};

// ✅ Robust - handles edge cases
const calculateTotal = (items: readonly OrderItem[]): number => {
  return items.reduce((total, item) => {
    const price = item.price ?? 0;
    const quantity = item.quantity ?? 0;
    return total + (price * quantity);
  }, 0);
};

// 🚨 Needless Complexity - over-engineered
class FlowNodeFactory {
  createNode(type: string, config: any): FlowNode {
    const builder = new FlowNodeBuilder();
    const configurator = new NodeConfigurator();
    const validator = new NodeValidator();
    const transformer = new NodeTransformer();
    
    // Overly complex for simple node creation
    return transformer.transform(
      validator.validate(
        configurator.configure(
          builder.build(type, config)
        )
      )
    );
  }
}

// ✅ Simple - appropriate complexity
const createFlowNode = (type: NodeType, config: NodeConfig): FlowNode => {
  validateNodeConfig(config);
  
  return {
    id: generateNodeId(),
    type,
    ...config,
    createdAt: Date.now(),
  };
};
```

## Quick Reference Checklist

Before every commit, verify:

### Simplicity & Design
- [ ] **KISS principle** - Chose the simplest solution that works
- [ ] **Boy Scout rule** - Left code cleaner than found
- [ ] **Root cause analysis** - Addressed underlying issues, not symptoms
- [ ] **Configuration at top** - Config flows down from app level
- [ ] **Composition over conditionals** - Used polymorphism instead of switch/if chains

### Functions & Naming
- [ ] **Small functions** - Each function does one thing
- [ ] **Descriptive names** - Names clearly describe purpose
- [ ] **Few arguments** - Related parameters grouped into objects
- [ ] **No side effects** - Pure functions where possible
- [ ] **Named constants** - No magic numbers or strings

### Code Organization
- [ ] **Vertical separation** - Related code grouped, concepts separated
- [ ] **Variables close to usage** - Declared near where they're used
- [ ] **Dependency injection** - Used contexts/hooks for dependencies
- [ ] **Boundary conditions** - Edge cases handled in one place
- [ ] **Value objects** - Domain concepts use specific types

### React/Next.js Specific
- [ ] **Split useEffects** - Separate concerns in different effects
- [ ] **Component composition** - Avoided giant prop conditionals
- [ ] **No import side effects** - Top-level constants are pure
- [ ] **Server/client boundaries** - Proper SSR/RSC awareness
- [ ] **Context over globals** - Used React patterns for state

### Testing & Quality
- [ ] **Readable tests** - Clear, independent, focused tests
- [ ] **One assert per test** - Each test verifies one behavior
- [ ] **No code smells** - Watched for rigidity, fragility, complexity
- [ ] **Clean Convex functions** - Separated concerns in backend code
- [ ] **Proper error handling** - Consistent error patterns

## Integration with AgenitiX Architecture

### Flow Editor Clean Code Example

```typescript
/**
 * Clean implementation of flow editor following all principles
 */

// Domain types - clear, specific
interface FlowEditorState {
  readonly flowId: FlowId | null;
  readonly nodes: readonly FlowNode[];
  readonly edges: readonly FlowEdge[];
  readonly selection: NodeSelection;
}

// Single responsibility services
interface FlowPersistenceService {
  save(flow: FlowData): Promise<void>;
  load(flowId: FlowId): Promise<FlowData>;
}

interface FlowValidationService {
  validate(flow: FlowData): ValidationResult;
}

// Clean component with dependency injection
export const FlowEditor: React.FC<FlowEditorProps> = ({ flowId }) => {
  // Services injected via context
  const { persistenceService, validationService } = useFlowServices();
  
  // State management
  const [state, dispatch] = useReducer(flowEditorReducer, initialState);
  
  // Single-purpose event handlers
  const handleNodeAdd = useCallback((nodeType: NodeType, position: Position) => {
    const newNode = createFlowNode(nodeType, position);
    dispatch({ type: 'ADD_NODE', payload: newNode });
  }, []);
  
  const handleSave = useCallback(async () => {
    const flowData = { nodes: state.nodes, edges: state.edges };
    const validation = validationService.validate(flowData);
    
    if (validation.isValid) {
      await persistenceService.save(flowData);
      dispatch({ type: 'MARK_SAVED' });
    }
  }, [state.nodes, state.edges, persistenceService, validationService]);
  
  // Separate effects for separate concerns
  useEffect(() => {
    if (flowId) {
      loadFlow(flowId);
    }
  }, [flowId]);
  
  useEffect(() => {
    const autoSaveInterval = setInterval(handleSave, AUTO_SAVE_INTERVAL);
    return () => clearInterval(autoSaveInterval);
  }, [handleSave]);
  
  // Clean render with composition
  return (
    <FlowEditorLayout>
      <FlowCanvas 
        nodes={state.nodes}
        edges={state.edges}
        selection={state.selection}
        onNodeAdd={handleNodeAdd}
      />
      <FlowToolbar onSave={handleSave} />
    </FlowEditorLayout>
  );
};
```

## Resources

- [Development Standards](.kiro/steering/development-standards.md)
- [Variable Management](.kiro/steering/variable-management.md)
- [Convex Best Practices](.kiro/steering/convex-best-practices.md)
- [useEffect Best Practices](.kiro/steering/useeffect-best-practices.md)
- [Clean Code by Robert C. Martin](https://www.amazon.com/Clean-Code-Handbook-Software-Craftsmanship/dp/0132350882)
- [Refactoring by Martin Fowler](https://refactoring.com/)
- [React Documentation](https://react.dev/)