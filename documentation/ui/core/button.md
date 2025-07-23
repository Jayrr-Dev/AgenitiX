# Button Component

## Overview

**Component**: `Button`  
**File**: `@/components/ui/button.tsx`  
**Category**: Core Component  
**Dependencies**: `@radix-ui/react-slot`, `class-variance-authority`

A versatile button component with multiple variants, sizes, and accessibility features.

## Component Specification

### Variants
- **default** - Primary button with background color
- **destructive** - Red button for dangerous actions
- **outline** - Bordered button with transparent background
- **secondary** - Secondary button with muted styling
- **ghost** - Transparent button with hover effects
- **link** - Text button that looks like a link

### Sizes
- **default** - Standard button size (h-10 px-4 py-2)
- **sm** - Small button (h-9 px-3)
- **lg** - Large button (h-11 px-8)
- **icon** - Square button for icons (h-10 w-10)

### Props
```typescript
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
  asChild?: boolean
}
```

## Usage Examples

### Basic Usage
```tsx
import { Button } from "@/components/ui/button";

export function BasicButton() {
  return <Button>Click me</Button>;
}
```

### Variants
```tsx
import { Button } from "@/components/ui/button";

export function ButtonVariants() {
  return (
    <div className="flex gap-2">
      <Button variant="default">Default</Button>
      <Button variant="destructive">Delete</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="link">Link</Button>
    </div>
  );
}
```

### Sizes
```tsx
import { Button } from "@/components/ui/button";

export function ButtonSizes() {
  return (
    <div className="flex items-center gap-2">
      <Button size="sm">Small</Button>
      <Button size="default">Default</Button>
      <Button size="lg">Large</Button>
      <Button size="icon">🚀</Button>
    </div>
  );
}
```

### With Icons
```tsx
import { Button } from "@/components/ui/button";
import { Plus, Download, Settings } from "lucide-react";

export function ButtonWithIcons() {
  return (
    <div className="flex gap-2">
      <Button>
        <Plus className="mr-2 h-4 w-4" />
        Add Item
      </Button>
      <Button variant="outline">
        <Download className="mr-2 h-4 w-4" />
        Download
      </Button>
      <Button size="icon" variant="ghost">
        <Settings className="h-4 w-4" />
      </Button>
    </div>
  );
}
```

### As Child (Polymorphic)
```tsx
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function ButtonAsLink() {
  return (
    <Button asChild>
      <Link href="/dashboard">Go to Dashboard</Link>
    </Button>
  );
}
```

## Design Tokens

### CSS Variables
```css
/* Button uses these design tokens */
--background: hsl(var(--background))
--foreground: hsl(var(--foreground))
--primary: hsl(var(--primary))
--primary-foreground: hsl(var(--primary-foreground))
--secondary: hsl(var(--secondary))
--secondary-foreground: hsl(var(--secondary-foreground))
--destructive: hsl(var(--destructive))
--destructive-foreground: hsl(var(--destructive-foreground))
--accent: hsl(var(--accent))
--accent-foreground: hsl(var(--accent-foreground))
--ring: hsl(var(--ring))
```

### Class Variants
```typescript
const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)
```

## Accessibility Features

### Keyboard Navigation
- **Enter/Space** - Activates the button
- **Tab** - Focus management
- **Escape** - Closes modals (when used in dialogs)

### ARIA Support
- **role="button"** - Semantic button role
- **aria-disabled** - Disabled state
- **aria-pressed** - Toggle state (when applicable)

### Focus Management
- **focus-visible:ring-2** - Focus indicator
- **focus-visible:ring-offset-2** - Focus offset
- **disabled:pointer-events-none** - Disabled interaction

## Integration Examples

### With Form
```tsx
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function FormExample() {
  return (
    <form className="space-y-4">
      <Input placeholder="Enter your name" />
      <Button type="submit">Submit</Button>
    </form>
  );
}
```

### With Dialog
```tsx
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

export function DialogExample() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Open Dialog</Button>
      </DialogTrigger>
      <DialogContent>
        <p>Dialog content here</p>
      </DialogContent>
    </Dialog>
  );
}
```

### Loading State
```tsx
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export function LoadingButton() {
  return (
    <Button disabled>
      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      Loading...
    </Button>
  );
}
```

## Best Practices

### 1. Use Appropriate Variants
- **default** - Primary actions
- **destructive** - Delete/remove actions
- **outline** - Secondary actions
- **ghost** - Subtle actions
- **link** - Navigation actions

### 2. Choose Right Sizes
- **default** - Most common use case
- **sm** - Compact spaces
- **lg** - Prominent actions
- **icon** - Icon-only buttons

### 3. Accessibility
- Always provide meaningful text
- Use `asChild` for semantic HTML
- Include loading states
- Handle disabled states properly

### 4. Theming
- Uses design tokens for consistency
- Supports dark/light mode
- Responsive design included

## Technical Details

### Dependencies
- **@radix-ui/react-slot** - Polymorphic component support
- **class-variance-authority** - Variant management
- **@/lib/utils** - Utility functions

### Performance
- **Forward ref** - Optimized ref handling
- **Memoization** - React.memo for performance
- **Tree shaking** - Only imports used variants

### Bundle Size
- **~2KB** - Minimal bundle impact
- **Tree shakeable** - Only includes used variants
- **No external dependencies** - Self-contained

## Related Components

- [Card](./card.md) - Container for button groups
- [Dialog](./dialog.md) - Modal dialogs with buttons
- [Input](./input.md) - Form inputs with buttons
- [Label](./label.md) - Form labels for buttons

---

*This documentation is automatically generated and maintained by the UI Documentation Generator.* 