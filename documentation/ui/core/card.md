# Card Component

## Overview

**Component**: `Card`  
**File**: `@/components/ui/card.tsx`  
**Category**: Core Component  
**Sub-components**: `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`

A flexible container component for displaying content in a structured layout with header, content, and footer sections.

## Component Specification

### Main Component
- **Card** - Main container with border, background, and shadow

### Sub-components
- **CardHeader** - Header section with padding and spacing
- **CardTitle** - Large, bold title text
- **CardDescription** - Muted description text
- **CardContent** - Main content area with padding
- **CardFooter** - Footer section with flex layout

### Props
```typescript
// Card
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {}

// CardHeader
interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}

// CardTitle
interface CardTitleProps extends React.HTMLAttributes<HTMLDivElement> {}

// CardDescription
interface CardDescriptionProps extends React.HTMLAttributes<HTMLDivElement> {}

// CardContent
interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {}

// CardFooter
interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {}
```

## Usage Examples

### Basic Card
```tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function BasicCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Card Title</CardTitle>
      </CardHeader>
      <CardContent>
        <p>This is the card content.</p>
      </CardContent>
    </Card>
  );
}
```

### Card with Description
```tsx
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export function CardWithDescription() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Overview</CardTitle>
        <CardDescription>
          A brief description of the project and its current status.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p>Detailed project information goes here.</p>
      </CardContent>
    </Card>
  );
}
```

### Card with Footer
```tsx
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function CardWithFooter() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>User Profile</CardTitle>
      </CardHeader>
      <CardContent>
        <p>User information and details.</p>
      </CardContent>
      <CardFooter>
        <Button>Edit Profile</Button>
      </CardFooter>
    </Card>
  );
}
```

### Interactive Card
```tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function InteractiveCard() {
  return (
    <Card className="cursor-pointer hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle>Clickable Card</CardTitle>
      </CardHeader>
      <CardContent>
        <p>This card has hover effects and can be clicked.</p>
      </CardContent>
    </Card>
  );
}
```

### Card Grid
```tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function CardGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Feature 1</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Description of feature 1.</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Feature 2</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Description of feature 2.</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Feature 3</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Description of feature 3.</p>
        </CardContent>
      </Card>
    </div>
  );
}
```

## Design Tokens

### CSS Variables
```css
/* Card uses these design tokens */
--background: hsl(var(--background))
--foreground: hsl(var(--foreground))
--card: hsl(var(--card))
--card-foreground: hsl(var(--card-foreground))
--border: hsl(var(--border))
--muted: hsl(var(--muted))
--muted-foreground: hsl(var(--muted-foreground))
```

### Class Variants
```typescript
// Card
"rounded-lg border bg-card text-card-foreground shadow-xs"

// CardHeader
"flex flex-col space-y-1.5 p-6"

// CardTitle
"text-2xl font-semibold leading-none tracking-tight"

// CardDescription
"text-sm text-muted-foreground"

// CardContent
"p-6 pt-0"

// CardFooter
"flex items-center p-6 pt-0"
```

## Layout Patterns

### Standard Layout
```tsx
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Main content */}
  </CardContent>
  <CardFooter>
    {/* Actions */}
  </CardFooter>
</Card>
```

### Compact Layout
```tsx
<Card className="p-4">
  <CardTitle className="text-lg">Compact Title</CardTitle>
  <CardContent className="p-0 pt-2">
    {/* Content */}
  </CardContent>
</Card>
```

### Image Card
```tsx
<Card>
  <CardContent className="p-0">
    <img src="/image.jpg" alt="Card image" className="w-full h-48 object-cover rounded-t-lg" />
  </CardContent>
  <CardHeader>
    <CardTitle>Image Card</CardTitle>
  </CardHeader>
</Card>
```

## Integration Examples

### With Button
```tsx
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function CardWithButton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Action Card</CardTitle>
      </CardHeader>
      <CardContent>
        <p>This card has action buttons.</p>
      </CardContent>
      <CardFooter className="justify-between">
        <Button variant="outline">Cancel</Button>
        <Button>Confirm</Button>
      </CardFooter>
    </Card>
  );
}
```

### With Dialog
```tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

export function CardWithDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle>Click to Open</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Click this card to open a dialog.</p>
          </CardContent>
        </Card>
      </DialogTrigger>
      <DialogContent>
        <p>Dialog content here</p>
      </DialogContent>
    </Dialog>
  );
}
```

### With Form
```tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function CardWithForm() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Contact Form</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" placeholder="Enter your name" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="Enter your email" />
        </div>
      </CardContent>
    </Card>
  );
}
```

## Best Practices

### 1. Content Organization
- Use `CardHeader` for titles and descriptions
- Use `CardContent` for main content
- Use `CardFooter` for actions and buttons
- Keep content focused and concise

### 2. Styling
- Use consistent spacing with design tokens
- Apply hover effects for interactive cards
- Use appropriate shadows for depth
- Maintain responsive design

### 3. Accessibility
- Provide meaningful titles
- Use semantic HTML structure
- Include proper ARIA labels
- Ensure keyboard navigation

### 4. Performance
- Use forward refs for optimization
- Minimize re-renders with proper props
- Lazy load images in cards
- Optimize for mobile performance

## Technical Details

### Dependencies
- **@/lib/utils** - Utility functions for className merging
- **React.forwardRef** - Optimized ref handling

### Performance
- **Forward ref** - Optimized ref handling
- **Memoization** - React.memo for performance
- **Tree shaking** - Only imports used components

### Bundle Size
- **~1KB** - Minimal bundle impact
- **Tree shakeable** - Only includes used components
- **No external dependencies** - Self-contained

## Related Components

- [Button](./button.md) - Action buttons in card footers
- [Dialog](./dialog.md) - Modal dialogs with card content
- [Input](./input.md) - Form inputs in cards
- [Label](./label.md) - Form labels in cards

---

*This documentation is automatically generated and maintained by the UI Documentation Generator.* 