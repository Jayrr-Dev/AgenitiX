# Accordion Component

## Overview

**Component**: `Accordion`  
**File**: `@/components/ui/accordion.tsx`  
**Category**: Interactive Component  
**Dependencies**: `@radix-ui/react-accordion`

A collapsible content component that allows users to expand and collapse sections of content with smooth animations.

## Component Specification

### Main Components
- **Accordion** - Root container component
- **AccordionItem** - Individual collapsible item
- **AccordionTrigger** - Clickable trigger for expanding/collapsing
- **AccordionContent** - Collapsible content area

### Props
```typescript
// Accordion
interface AccordionProps extends React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Root> {
  type?: "single" | "multiple"
  collapsible?: boolean
  defaultValue?: string | string[]
  value?: string | string[]
  onValueChange?: (value: string | string[]) => void
}

// AccordionItem
interface AccordionItemProps extends React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item> {
  value: string
}

// AccordionTrigger
interface AccordionTriggerProps extends React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger> {}

// AccordionContent
interface AccordionContentProps extends React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content> {}
```

## Usage Examples

### Basic Accordion
```tsx
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export function BasicAccordion() {
  return (
    <Accordion type="single" collapsible>
      <AccordionItem value="item-1">
        <AccordionTrigger>What is Agenitix?</AccordionTrigger>
        <AccordionContent>
          Agenitix is a modern AI-powered platform for building and managing intelligent workflows.
        </AccordionContent>
      </AccordionItem>
      
      <AccordionItem value="item-2">
        <AccordionTrigger>How does it work?</AccordionTrigger>
        <AccordionContent>
          Agenitix uses advanced AI algorithms to automate complex tasks and streamline your workflow.
        </AccordionContent>
      </AccordionItem>
      
      <AccordionItem value="item-3">
        <AccordionTrigger>What are the benefits?</AccordionTrigger>
        <AccordionContent>
          Increased productivity, reduced manual work, and intelligent automation of repetitive tasks.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
```

### Multiple Selection
```tsx
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export function MultipleAccordion() {
  return (
    <Accordion type="multiple" defaultValue={["item-1"]}>
      <AccordionItem value="item-1">
        <AccordionTrigger>Getting Started</AccordionTrigger>
        <AccordionContent>
          <div className="space-y-2">
            <p>Follow these steps to get started:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Create your account</li>
              <li>Set up your first workflow</li>
              <li>Configure your integrations</li>
              <li>Start automating tasks</li>
            </ol>
          </div>
        </AccordionContent>
      </AccordionItem>
      
      <AccordionItem value="item-2">
        <AccordionTrigger>Advanced Features</AccordionTrigger>
        <AccordionContent>
          <div className="space-y-2">
            <p>Explore advanced features:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Custom AI models</li>
              <li>API integrations</li>
              <li>Advanced analytics</li>
              <li>Team collaboration</li>
            </ul>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
```

### Controlled Accordion
```tsx
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useState } from "react";

export function ControlledAccordion() {
  const [value, setValue] = useState<string[]>([]);

  return (
    <Accordion type="multiple" value={value} onValueChange={setValue}>
      <AccordionItem value="item-1">
        <AccordionTrigger>Section 1</AccordionTrigger>
        <AccordionContent>
          <p>This section is controlled by React state.</p>
        </AccordionContent>
      </AccordionItem>
      
      <AccordionItem value="item-2">
        <AccordionTrigger>Section 2</AccordionTrigger>
        <AccordionContent>
          <p>You can programmatically control which sections are open.</p>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
```

### Custom Styled Accordion
```tsx
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export function StyledAccordion() {
  return (
    <Accordion type="single" collapsible className="w-full max-w-2xl">
      <AccordionItem value="item-1" className="border rounded-lg mb-2">
        <AccordionTrigger className="px-4 py-3 hover:bg-gray-50 rounded-t-lg">
          <span className="font-semibold">Frequently Asked Questions</span>
        </AccordionTrigger>
        <AccordionContent className="px-4 pb-3">
          <div className="space-y-3">
            <p>Find answers to common questions about our platform.</p>
            <div className="bg-blue-50 p-3 rounded">
              <p className="text-sm text-blue-800">
                Need more help? Contact our support team.
              </p>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
```

## Design Tokens

### CSS Variables
```css
/* Accordion uses these design tokens */
--background: hsl(var(--background))
--foreground: hsl(var(--foreground))
--muted: hsl(var(--muted))
--muted-foreground: hsl(var(--muted-foreground))
--border: hsl(var(--border))
--accent: hsl(var(--accent))
--accent-foreground: hsl(var(--accent-foreground))
```

### Class Variants
```typescript
// Accordion
"w-full"

// AccordionItem
"border-b"

// AccordionTrigger
"flex flex-1 items-center justify-between py-4 font-medium transition-all hover:underline [&[data-state=open]>svg]:rotate-180"

// AccordionContent
"overflow-hidden text-sm transition-all data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down"
```

## Animation Features

### Smooth Transitions
```css
/* Accordion animations */
@keyframes accordion-down {
  from {
    height: 0;
  }
  to {
    height: var(--radix-accordion-content-height);
  }
}

@keyframes accordion-up {
  from {
    height: var(--radix-accordion-content-height);
  }
  to {
    height: 0;
  }
}

.animate-accordion-down {
  animation: accordion-down 0.2s ease-out;
}

.animate-accordion-up {
  animation: accordion-up 0.2s ease-out;
}
```

### Icon Rotation
```tsx
// Chevron icon rotates when expanded
<ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
```

## Accessibility Features

### Keyboard Navigation
- **Tab** - Navigate between accordion items
- **Enter/Space** - Toggle accordion sections
- **Arrow Keys** - Navigate between items
- **Home/End** - Jump to first/last item

### ARIA Support
- **role="region"** - Semantic region role
- **aria-expanded** - Expansion state
- **aria-controls** - Content relationship
- **aria-labelledby** - Label association

### Screen Reader Support
- Proper heading structure
- Announcement of state changes
- Descriptive trigger text
- Content relationship indicators

## Integration Examples

### With Form
```tsx
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AccordionWithForm() {
  return (
    <Accordion type="single" collapsible>
      <AccordionItem value="personal-info">
        <AccordionTrigger>Personal Information</AccordionTrigger>
        <AccordionContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input id="name" placeholder="Enter your name" />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="Enter your email" />
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
      
      <AccordionItem value="preferences">
        <AccordionTrigger>Preferences</AccordionTrigger>
        <AccordionContent>
          <div className="space-y-4">
            <p>Configure your account preferences here.</p>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
```

### With Card
```tsx
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function AccordionWithCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Documentation</CardTitle>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible>
          <AccordionItem value="setup">
            <AccordionTrigger>Setup Guide</AccordionTrigger>
            <AccordionContent>
              <p>Step-by-step setup instructions for new users.</p>
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="api">
            <AccordionTrigger>API Reference</AccordionTrigger>
            <AccordionContent>
              <p>Complete API documentation and examples.</p>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}
```

## Best Practices

### 1. Content Organization
- Use clear, descriptive trigger text
- Keep content focused and concise
- Group related information together
- Use consistent heading hierarchy

### 2. User Experience
- Provide visual feedback on hover
- Use smooth animations for state changes
- Include appropriate icons for clarity
- Maintain consistent spacing

### 3. Accessibility
- Use semantic HTML structure
- Provide keyboard navigation
- Include proper ARIA attributes
- Test with screen readers

### 4. Performance
- Lazy load content when possible
- Optimize animations for smooth 60fps
- Minimize re-renders with proper state management
- Use appropriate content loading strategies

## Technical Details

### Dependencies
- **@radix-ui/react-accordion** - Base accordion functionality
- **@/lib/utils** - Utility functions for className merging
- **lucide-react** - ChevronDown icon

### Performance
- **Forward ref** - Optimized ref handling
- **Memoization** - React.memo for performance
- **Tree shaking** - Only imports used components

### Bundle Size
- **~2KB** - Minimal bundle impact
- **Tree shakeable** - Only includes used components
- **Radix UI** - Optimized accessibility library

## Related Components

- [Tabs](./tabs.md) - Alternative content organization
- [Collapsible](./collapsible.md) - Simple collapsible content
- [Dialog](./dialog.md) - Modal dialogs for detailed content

---

*This documentation is automatically generated and maintained by the UI Documentation Generator.* 