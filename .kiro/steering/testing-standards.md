---
inclusion: fileMatch
fileMatchPattern: "**/*.test.*, **/*.spec.*, **/__tests__/**/*"
---

# Testing Standards & Patterns

## Testing Philosophy

**Rule**: Test behavior, not implementation. Focus on user outcomes and business logic.

### Testing Pyramid
- **Unit Tests** (70%): Pure functions, utilities, isolated components
- **Integration Tests** (20%): Component interactions, API flows
- **E2E Tests** (10%): Critical user journeys

## Unit Testing Standards

### Component Testing Pattern
```typescript
// components/ui/Button.test.tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { Button } from "./Button";

describe("Button Component", () => {
  it("renders with correct text", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole("button", { name: /click me/i })).toBeInTheDocument();
  });

  it("calls onClick when clicked", () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(screen.getByRole("button"));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("applies variant styles correctly", () => {
    render(<Button variant="destructive">Delete</Button>);
    const button = screen.getByRole("button");
    expect(button).toHaveClass("bg-destructive");
  });

  it("is disabled when loading", () => {
    render(<Button loading>Submit</Button>);
    expect(screen.getByRole("button")).toBeDisabled();
  });
});
```

### Hook Testing Pattern
```typescript
// hooks/useNodeData.test.ts
import { renderHook, act } from "@testing-library/react";
import { useNodeData } from "./useNodeData";

describe("useNodeData", () => {
  it("returns initial node data", () => {
    const { result } = renderHook(() => useNodeData("node-1"));
    
    expect(result.current.nodeData).toBeDefined();
    expect(result.current.isLoading).toBe(true);
  });

  it("updates node data when changed", async () => {
    const { result } = renderHook(() => useNodeData("node-1"));
    
    await act(async () => {
      result.current.updateNodeData({ name: "Updated Node" });
    });
    
    expect(result.current.nodeData.name).toBe("Updated Node");
  });
});
```

### Utility Function Testing
```typescript
// utils/nodeUtils.test.ts
import { validateNodeSpec, createNodeInstance } from "./nodeUtils";

describe("Node Utilities", () => {
  describe("validateNodeSpec", () => {
    it("validates correct node spec", () => {
      const validSpec = {
        type: "createText",
        inputs: [{ name: "text", type: "string" }],
        outputs: [{ name: "result", type: "string" }],
      };
      
      expect(validateNodeSpec(validSpec)).toBe(true);
    });

    it("rejects invalid node spec", () => {
      const invalidSpec = {
        type: "createText",
        // Missing required fields
      };
      
      expect(() => validateNodeSpec(invalidSpec)).toThrow();
    });
  });

  describe("createNodeInstance", () => {
    it("creates node with default values", () => {
      const node = createNodeInstance("createText", { x: 100, y: 200 });
      
      expect(node.id).toBeDefined();
      expect(node.type).toBe("createText");
      expect(node.position).toEqual({ x: 100, y: 200 });
    });
  });
});
```

## Convex Function Testing

### Mutation Testing
```typescript
// convex/emails.test.ts
import { ConvexError } from "convex/values";
import { api } from "./_generated/api";
import { runMutation, runQuery } from "./_generated/test";

describe("Email Functions", () => {
  describe("createEmailTemplate", () => {
    it("creates email template successfully", async () => {
      const result = await runMutation(api.emails.createEmailTemplate, {
        name: "Welcome Email",
        subject: "Welcome to AgenitiX",
        body: "Hello {{name}}, welcome!",
        variables: ["name"],
      });

      expect(result.success).toBe(true);
      expect(result.data.templateId).toBeDefined();
    });

    it("validates required fields", async () => {
      await expect(
        runMutation(api.emails.createEmailTemplate, {
          name: "",
          subject: "",
          body: "",
        })
      ).rejects.toThrow(ConvexError);
    });

    it("enforces user authentication", async () => {
      // Test without authentication context
      await expect(
        runMutation(api.emails.createEmailTemplate, {
          name: "Test",
          subject: "Test",
          body: "Test",
        })
      ).rejects.toThrow("Unauthorized");
    });
  });

  describe("getEmailTemplates", () => {
    it("returns user's templates", async () => {
      const templates = await runQuery(api.emails.getEmailTemplates);
      
      expect(Array.isArray(templates)).toBe(true);
      expect(templates.every(t => t.userId === "test-user")).toBe(true);
    });
  });
});
```

### Action Testing
```typescript
// convex/workflows.test.ts
import { runAction } from "./_generated/test";

describe("Workflow Actions", () => {
  it("executes workflow successfully", async () => {
    const result = await runAction(api.workflows.executeWorkflow, {
      workflowId: "workflow-1",
      inputs: { email: "test@example.com" },
    });

    expect(result.success).toBe(true);
    expect(result.executionId).toBeDefined();
  });

  it("handles workflow errors gracefully", async () => {
    const result = await runAction(api.workflows.executeWorkflow, {
      workflowId: "invalid-workflow",
      inputs: {},
    });

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});
```

## Integration Testing

### Component Integration Testing
```typescript
// features/flow-editor/FlowEditor.test.tsx
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { FlowEditor } from "./FlowEditor";
import { ConvexTestProvider } from "convex/react";

describe("Flow Editor Integration", () => {
  it("loads and displays nodes", async () => {
    render(
      <ConvexTestProvider>
        <FlowEditor />
      </ConvexTestProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("Create Text")).toBeInTheDocument();
      expect(screen.getByText("Send Email")).toBeInTheDocument();
    });
  });

  it("creates connections between nodes", async () => {
    render(
      <ConvexTestProvider>
        <FlowEditor />
      </ConvexTestProvider>
    );

    const createTextNode = screen.getByTestId("node-createText");
    const sendEmailNode = screen.getByTestId("node-sendEmail");

    // Simulate connection creation
    fireEvent.mouseDown(createTextNode.querySelector("[data-handle-id='output']"));
    fireEvent.mouseUp(sendEmailNode.querySelector("[data-handle-id='input']"));

    await waitFor(() => {
      expect(screen.getByTestId("connection")).toBeInTheDocument();
    });
  });
});
```

### API Integration Testing
```typescript
// app/api/email/templates/route.test.ts
import { createMocks } from "node-mocks-http";
import { POST, GET } from "./route";

describe("/api/email/templates", () => {
  describe("POST", () => {
    it("creates email template", async () => {
      const { req, res } = createMocks({
        method: "POST",
        body: {
          name: "Test Template",
          subject: "Test Subject",
          body: "Test Body",
        },
      });

      await POST(req, res);

      expect(res._getStatusCode()).toBe(201);
      expect(JSON.parse(res._getData())).toMatchObject({
        success: true,
        data: { templateId: expect.any(String) },
      });
    });

    it("validates required fields", async () => {
      const { req, res } = createMocks({
        method: "POST",
        body: {},
      });

      await POST(req, res);

      expect(res._getStatusCode()).toBe(400);
      expect(JSON.parse(res._getData())).toMatchObject({
        error: expect.stringContaining("required"),
      });
    });
  });
});
```

## E2E Testing

### Critical User Journey Testing
```typescript
// e2e/workflow-creation.test.ts
import { test, expect } from "@playwright/test";

test.describe("Workflow Creation", () => {
  test("user can create and execute email workflow", async ({ page }) => {
    // Navigate to flow editor
    await page.goto("/flow-editor");
    
    // Add nodes
    await page.dragAndDrop('[data-testid="node-createText"]', '[data-testid="canvas"]');
    await page.dragAndDrop('[data-testid="node-sendEmail"]', '[data-testid="canvas"]');
    
    // Connect nodes
    await page.drag('[data-handle-id="output"]', '[data-handle-id="input"]');
    
    // Configure nodes
    await page.click('[data-testid="node-createText"]');
    await page.fill('[data-testid="text-input"]', "Hello {{name}}");
    
    await page.click('[data-testid="node-sendEmail"]');
    await page.fill('[data-testid="to-input"]', "test@example.com");
    await page.fill('[data-testid="subject-input"]', "Welcome");
    
    // Execute workflow
    await page.click('[data-testid="execute-workflow"]');
    
    // Verify execution
    await expect(page.locator('[data-testid="execution-success"]')).toBeVisible();
  });
});
```

## Testing Utilities & Helpers

### Custom Testing Utilities
```typescript
// test-utils/renderWithProviders.tsx
import { render, RenderOptions } from "@testing-library/react";
import { ConvexTestProvider } from "convex/react";

interface CustomRenderOptions extends Omit<RenderOptions, "wrapper"> {
  convexTestData?: Record<string, any>;
}

export function renderWithProviders(
  ui: React.ReactElement,
  options: CustomRenderOptions = {}
) {
  const { convexTestData, ...renderOptions } = options;

  const AllTheProviders = ({ children }: { children: React.ReactNode }) => (
    <ConvexTestProvider testData={convexTestData}>
      {children}
    </ConvexTestProvider>
  );

  return render(ui, { wrapper: AllTheProviders, ...renderOptions });
}

// Usage
const { getByText } = renderWithProviders(<MyComponent />, {
  convexTestData: {
    "email_templates": [
      { _id: "1", name: "Welcome", subject: "Welcome", body: "Hello" }
    ]
  }
});
```

### Mock Data Factories
```typescript
// test-utils/factories.ts
export const createNodeSpec = (overrides = {}) => ({
  type: "createText",
  inputs: [{ name: "text", type: "string" }],
  outputs: [{ name: "result", type: "string" }],
  ...overrides,
});

export const createEmailTemplate = (overrides = {}) => ({
  _id: "template-1",
  name: "Test Template",
  subject: "Test Subject",
  body: "Test Body",
  userId: "user-1",
  createdAt: new Date(),
  ...overrides,
});

export const createWorkflow = (overrides = {}) => ({
  _id: "workflow-1",
  name: "Test Workflow",
  nodes: [],
  connections: [],
  userId: "user-1",
  createdAt: new Date(),
  ...overrides,
});
```

## Accessibility Testing

### Component A11y Testing
```typescript
// components/ui/Button.test.tsx
import { render, screen } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import { Button } from "./Button";

expect.extend(toHaveNoViolations);

describe("Button Accessibility", () => {
  it("has no accessibility violations", async () => {
    const { container } = render(<Button>Click me</Button>);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("supports keyboard navigation", () => {
    render(<Button>Click me</Button>);
    const button = screen.getByRole("button");
    
    expect(button).toHaveAttribute("tabindex", "0");
    expect(button).toHaveAttribute("role", "button");
  });

  it("announces loading state to screen readers", () => {
    render(<Button loading aria-label="Submit form">Submit</Button>);
    
    expect(screen.getByLabelText("Submit form")).toHaveAttribute("aria-busy", "true");
  });
});
```

## File References

- **Test Configuration**: #[[file:jest.config.js]]
- **Testing Utilities**: #[[file:test-utils/]]
- **Component Tests**: #[[file:components/**/*.test.tsx]]
- **Convex Tests**: #[[file:convex/**/*.test.ts]]
- **E2E Tests**: #[[file:e2e/]]
- **Test Factories**: #[[file:test-utils/factories.ts]]