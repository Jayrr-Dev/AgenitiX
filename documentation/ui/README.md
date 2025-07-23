# UI Components Documentation

Welcome to the comprehensive UI components documentation for Agenitix-2. This documentation covers all UI elements in the `@/components/ui/` directory.

## 📚 Documentation Structure

### Component Categories
- **🎯 Core Components** - Button, Card, Dialog, Input, Label
- **🎨 Interactive Elements** - Accordion, Tabs, Dropdown Menu, Navigation Menu
- **✨ Animation Components** - 3D Marquee, Canvas Reveal, Infinite Moving Cards
- **📱 Layout Components** - Sheet, Scroll Area, Container Scroll Animation
- **🎪 Special Effects** - Apple Cards Carousel, Google Gemini Effect, Animated Testimonials

### Documentation Features
- **📄 Markdown Documentation** - Comprehensive guides with examples
- **🌐 HTML Documentation** - Interactive documentation with search
- **🔧 API Reference** - TypeScript types and interfaces
- **💡 Usage Examples** - Real-world implementation examples
- **🎨 Design Tokens** - Theming and styling information

## 🎯 Component Categories

### Core Components
Essential UI elements used throughout the application.

### Interactive Elements
Components that respond to user interactions and state changes.

### Animation Components
Advanced components with motion and animation capabilities.

### Layout Components
Structural components for organizing content and layouts.

### Special Effects
Unique components with advanced visual effects and interactions.

## 🚀 Quick Start

### Using UI Components
```tsx
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ExampleComponent() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Example</CardTitle>
      </CardHeader>
      <CardContent>
        <Button>Click me</Button>
      </CardContent>
    </Card>
  );
}
```

### Theming Integration
All components automatically integrate with the design system:
- **CSS Variables** - Uses design tokens from `tokens.json`
- **Dark/Light Mode** - Automatic theme switching
- **Responsive Design** - Works across all screen sizes
- **Accessibility** - ARIA labels and keyboard navigation

## 📖 Documentation Features

### Auto-Generated Content
- **Component Specification** - Props, variants, and configuration
- **TypeScript Types** - Complete type definitions
- **Usage Examples** - Basic and advanced usage patterns
- **Design Tokens** - Theming and styling information
- **Accessibility** - ARIA support and keyboard navigation

### Interactive Features
- **Search & Filter** - Find specific components or features
- **Category Navigation** - Browse by component category
- **Code Examples** - Syntax-highlighted TypeScript examples
- **Live Preview** - Interactive component demonstrations

## 🎨 Design System Integration

All components integrate with the design system:

- **Design Tokens** - Uses CSS variables from `tokens.json`
- **Component Variants** - Consistent variant patterns
- **Responsive Design** - Mobile-first approach
- **Dark/Light Mode** - Automatic theme switching
- **Accessibility** - WCAG 2.1 AA compliance

## 🔧 Development Workflow

### 1. Component Structure
Each component follows a consistent structure:
- TypeScript interfaces
- Variant definitions
- Forward refs for accessibility
- Display names for debugging

### 2. Theming Integration
Components use design tokens:
- CSS variables for theming
- Class variance authority for variants
- Consistent spacing and typography

### 3. Accessibility
All components include:
- ARIA labels and roles
- Keyboard navigation
- Focus management
- Screen reader support

## 📁 File Structure

```
documentation/ui/
├── core/              # Core component documentation
│   ├── button.md      # Button component docs
│   ├── card.md        # Card component docs
│   └── dialog.md      # Dialog component docs
├── interactive/       # Interactive component docs
│   ├── accordion.md   # Accordion component docs
│   ├── tabs.md        # Tabs component docs
│   └── dropdown-menu.md # Dropdown menu docs
├── animation/         # Animation component docs
│   ├── 3d-marquee.md # 3D Marquee docs
│   ├── canvas-reveal-effect.md # Canvas reveal docs
│   └── infinite-moving-cards.md # Infinite cards docs
├── layout/            # Layout component docs
│   ├── sheet.md       # Sheet component docs
│   ├── scroll-area.md # Scroll area docs
│   └── container-scroll-animation.md # Container animation docs
├── effects/           # Special effects docs
│   ├── apple-cards-carousel.md # Apple cards docs
│   ├── google-gemini-effect.md # Gemini effect docs
│   └── animated-testimonials.md # Testimonials docs
├── overview.html      # Interactive UI overview
├── OVERVIEW.md        # Markdown UI overview
└── README.md          # This file
```

## 🎯 Component Standards

All components follow these standards:

- ✅ **Type-safe** - Full TypeScript support
- ✅ **Accessible** - WCAG 2.1 AA compliance
- ✅ **Themed** - Design system integration
- ✅ **Responsive** - Mobile-first design
- ✅ **Documented** - Comprehensive documentation
- ✅ **Tested** - Unit and integration tests

## 🔍 Finding Documentation

### By Category
- **Core Components**: `documentation/ui/core/`
- **Interactive Elements**: `documentation/ui/interactive/`
- **Animation Components**: `documentation/ui/animation/`
- **Layout Components**: `documentation/ui/layout/`
- **Special Effects**: `documentation/ui/effects/`

### By Component Type
Each component has documentation files:
- `component-name.md` - Markdown documentation
- `component-name.html` - Interactive HTML documentation
- `api/component-name.ts` - API reference

## 🚀 Next Steps

1. **Browse Components** - Check out the documentation for existing components
2. **Use Components** - Import and use components in your code
3. **Customize Theming** - Modify design tokens for your needs
4. **Add New Components** - Follow the established patterns

---

*This documentation is automatically generated and maintained by the UI Documentation Generator.*

## 📋 Component Index

### Core Components
- [Button](./core/button.md) - Versatile button component with multiple variants
- [Card](./core/card.md) - Container component with header, content, and footer
- [Dialog](./core/dialog.md) - Modal dialog component with overlay
- [Input](./core/input.md) - Form input component
- [Label](./core/label.md) - Form label component
- [Checkbox](./core/checkbox.md) - Checkbox input component
- [Badge](./core/badge.md) - Status and label badge component

### Interactive Elements
- [Accordion](./interactive/accordion.md) - Collapsible content sections
- [Tabs](./interactive/tabs.md) - Tabbed content navigation
- [Dropdown Menu](./interactive/dropdown-menu.md) - Context menu component
- [Navigation Menu](./interactive/navigation-menu.md) - Navigation component
- [Tooltip](./interactive/tooltip.md) - Hover tooltip component
- [Sheet](./interactive/sheet.md) - Slide-out panel component

### Animation Components
- [3D Marquee](./animation/3d-marquee.md) - 3D rotating image gallery
- [Canvas Reveal Effect](./animation/canvas-reveal-effect.md) - Animated reveal component
- [Infinite Moving Cards](./animation/infinite-moving-cards.md) - Continuously scrolling cards
- [Container Scroll Animation](./animation/container-scroll-animation.md) - Scroll-triggered animations
- [Flip Words](./animation/flip-words.md) - Text flip animation
- [Logo Ticker](./animation/logo-ticker.md) - Scrolling logo display

### Layout Components
- [Scroll Area](./layout/scroll-area.md) - Custom scrollable container
- [Carousel](./layout/carousel.md) - Image/content carousel
- [Carousel Dot Buttons](./layout/carousel-dot-buttons.md) - Carousel navigation

### Special Effects
- [Apple Cards Carousel](./effects/apple-cards-carousel.md) - Apple-style card carousel
- [Google Gemini Effect](./effects/google-gemini-effect.md) - Gemini-style visual effect
- [Animated Testimonials](./effects/animated-testimonials.md) - Animated testimonial display
- [Blur Image](./effects/blur-image.md) - Blur effect image component
- [Sonner](./effects/sonner.md) - Toast notification component 