# Theming System Documentation

**Route:** `documentation/theming/README.md`
**COMPONENT THEME SYSTEM - Comprehensive theming architecture and design tokens**

This documentation covers the complete theming system for the Agenitix application, including design tokens, CSS architecture, component theming, and development guidelines.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Design Tokens](#design-tokens)
- [CSS Structure](#css-structure)
- [Component Theming](#component-theming)
- [Development Guidelines](#development-guidelines)
- [Tools and Scripts](#tools-and-scripts)
- [Best Practices](#best-practices)

## Overview

The theming system provides a comprehensive, scalable approach to styling the entire application. It uses a token-based design system with automatic generation, dark/light theme support, and component-specific theming.

### Key Features

- **Token-Based Design**: All visual properties are defined as CSS custom properties
- **Automatic Generation**: Tokens are generated from JSON configuration
- **Theme Switching**: Seamless dark/light theme support
- **Component Isolation**: Each component has its own theming scope
- **Performance Optimized**: Minimal CSS with efficient selectors

## Architecture

### File Structure

```
app/styles/
├── _generated_tokens.css    # Auto-generated design tokens
├── _globals.css            # Global styles and theme definitions
├── _nodes.css              # Node-specific theming
├── _infra.css              # Infrastructure component theming
└── entry.css               # Main entry point

documentation/theming/
├── README.md               # This documentation
├── tokens-preview.html     # Interactive token preview
└── core-tokens.md          # Token reference
```

### Token Hierarchy

1. **Core Tokens**: Base design system (spacing, typography, colors)
2. **Component Tokens**: Component-specific theming (nodes, infrastructure)
3. **Semantic Tokens**: Meaningful abstractions (success, warning, error)
4. **Effect Tokens**: Visual effects (shadows, glows, animations)

## Design Tokens

### Core Tokens

The foundation of the design system, covering essential visual properties:

#### Spacing
```css
--core-spacing-xs: 0.25rem;   /* 4px */
--core-spacing-sm: 0.5rem;    /* 8px */
--core-spacing-md: 0.75rem;   /* 12px */
--core-spacing-lg: 1rem;      /* 16px */
--core-spacing-xl: 1.5rem;    /* 24px */
--core-spacing-2xl: 2rem;     /* 32px */
--core-spacing-3xl: 3rem;     /* 48px */
```

#### Typography
```css
--core-typography-sizes-xs: 0.75rem;    /* 12px */
--core-typography-sizes-sm: 0.875rem;   /* 14px */
--core-typography-sizes-base: 1rem;     /* 16px */
--core-typography-sizes-lg: 1.125rem;   /* 18px */
--core-typography-sizes-xl: 1.25rem;    /* 20px */
--core-typography-sizes-2xl: 1.5rem;    /* 24px */
```

#### Colors
```css
--core-colors-background: hsl(var(--background));
--core-colors-foreground: hsl(var(--foreground));
--core-colors-muted: hsl(var(--muted));
--core-colors-border: hsl(var(--border));
```

### Component Tokens

#### Node Theming
Each node type has its own theming scope:

```css
/* Create Nodes */
--node-create-bg: hsla(140, 80%, 40%, 1);
--node-create-border: hsla(140, 100%, 20%, 1);
--node-create-text: hsla(0, 0%, 15%, 1);

/* View Nodes */
--node-view-bg: hsla(225, 72%, 85%, 1);
--node-view-border: hsla(225, 72%, 40%, 1);
--node-view-text: hsla(0, 0%, 15%, 1);

/* Trigger Nodes */
--node-trigger-bg: hsla(45, 72%, 85%, 1);
--node-trigger-border: hsla(45, 72%, 40%, 1);
--node-trigger-text: hsla(0, 0%, 15%, 1);
```

#### Infrastructure Theming
```css
/* Inspector */
--infra-inspector-bg: hsl(var(--card));
--infra-inspector-border: hsl(var(--border));

/* Toolbar */
--infra-toolbar-bg: hsl(var(--background));
--infra-toolbar-border: hsl(var(--border));
```

### Semantic Tokens

Meaningful abstractions for consistent behavior:

```css
/* Status Colors */
--core-colors-success: hsla(120, 100%, 40%, 1);
--core-colors-warning: hsla(45, 100%, 50%, 1);
--core-colors-error: hsla(0, 100%, 50%, 1);
--core-colors-info: hsla(210, 100%, 50%, 1);
```

### Effect Tokens

Visual effects and animations:

```css
/* Glow Effects */
--effect-glow-selection: 0 0 4px 1px rgba(255, 255, 255, 0.6);
--effect-glow-hover: 0 0 3px 0px rgba(255, 255, 255, 0.1);
--effect-glow-activation: 0 0 8px 2px rgba(34, 197, 94, 0.8);

/* Shadows */
--core-effects-shadow-sm: shadow-sm;
--core-effects-shadow-md: shadow-md;
--core-effects-shadow-lg: shadow-lg;
```

## CSS Structure

### Global Styles (`_globals.css`)

The foundation file that establishes the theme:

```css
/* Theme Definition */
@theme {
  --font-sans: "Inter", system-ui, sans-serif;
  --background: 0 0% 6%;
  --foreground: 0 0% 98%;
  /* ... more tokens */
}

/* Light Theme Override */
html.light {
  --background: 0 0% 100%;
  --foreground: 0 0% 6%;
  /* ... light theme tokens */
}
```

### Generated Tokens (`_generated_tokens.css`)

Auto-generated from JSON configuration:

```css
:root {
  --core-spacing-xs: 0.25rem;
  --core-spacing-sm: 0.5rem;
  /* ... all generated tokens */
}
```

### Component-Specific Styles

#### Node Styles (`_nodes.css`)
```css
.node-create {
  background: var(--node-create-bg);
  border: var(--node-global-border-width) var(--node-global-border-style) var(--node-create-border);
  color: var(--node-create-text);
}
```

#### Infrastructure Styles (`_infra.css`)
```css
.node-inspector {
  background: var(--infra-inspector-bg);
  border: 1px solid var(--infra-inspector-border);
}
```

## Component Theming

### Node Components

Each node type follows a consistent theming pattern:

1. **Background**: Primary background color
2. **Border**: Border color and style
3. **Text**: Primary and secondary text colors
4. **Hover States**: Interactive state colors
5. **Custom Classes**: Additional utility classes

### Infrastructure Components

Infrastructure components use semantic theming:

- **Inspector**: Card-based theming with borders
- **Toolbar**: Background-based theming
- **Sidebar**: Muted background with accent borders
- **Canvas**: Transparent with overlay effects

### Theme Switching

The system supports seamless theme switching:

```css
/* Dark theme (default) */
:root {
  --background: 0 0% 6%;
  --foreground: 0 0% 98%;
}

/* Light theme */
html.light {
  --background: 0 0% 100%;
  --foreground: 0 0% 6%;
}
```

## Development Guidelines

### Adding New Tokens

1. **Update JSON Configuration**: Add tokens to the source configuration
2. **Regenerate**: Run `pnpm run generate:docs` to update generated files
3. **Test**: Verify tokens appear in the preview
4. **Document**: Update this documentation if needed

### Component Theming

When creating new components:

1. **Use Existing Tokens**: Leverage core tokens when possible
2. **Create Component Tokens**: Add component-specific tokens if needed
3. **Follow Naming Convention**: Use `component-property` format
4. **Test Both Themes**: Ensure compatibility with light/dark themes

### Best Practices

1. **Token-First**: Always use design tokens instead of hardcoded values
2. **Semantic Names**: Use meaningful token names
3. **Consistent Structure**: Follow established patterns
4. **Performance**: Minimize CSS complexity
5. **Accessibility**: Ensure sufficient contrast ratios

## Tools and Scripts

### Generation Scripts

- `pnpm run generate:docs`: Generate tokens and documentation
- `pnpm run generate:tokens`: Generate CSS tokens only
- `pnpm run validate:tokens`: Validate token consistency
- `pnpm run validate:colors`: Validate color accessibility

### Preview Tools

- **Token Preview**: `documentation/theming/tokens-preview.html`
- **Interactive Explorer**: Browse all tokens with search and filtering
- **Theme Testing**: Test tokens in different contexts

### Validation

The system includes automated validation:

- **Token Consistency**: Ensures all tokens are properly defined
- **Color Accessibility**: Validates contrast ratios
- **Theme Compatibility**: Checks light/dark theme support

## Best Practices

### Token Management

1. **Single Source of Truth**: All tokens defined in JSON configuration
2. **Automatic Generation**: Tokens generated programmatically
3. **Version Control**: Track token changes in git
4. **Documentation**: Keep documentation up to date

### Performance

1. **Minimal CSS**: Use efficient selectors and minimal rules
2. **Token Caching**: Leverage CSS custom properties for performance
3. **Lazy Loading**: Load theme-specific styles on demand
4. **Optimization**: Minimize CSS bundle size

### Accessibility

1. **Contrast Ratios**: Ensure sufficient color contrast
2. **Theme Support**: Support both light and dark themes
3. **Focus States**: Clear focus indicators
4. **Reduced Motion**: Respect user motion preferences

### Maintenance

1. **Regular Updates**: Keep tokens current with design changes
2. **Testing**: Test tokens across all components
3. **Documentation**: Maintain comprehensive documentation
4. **Validation**: Run validation scripts regularly

## Future Enhancements

### Planned Features

- **CSS-in-JS Integration**: Better integration with React components
- **Theme Variants**: Support for multiple theme variants
- **Advanced Animations**: More sophisticated animation tokens
- **Design System Integration**: Better integration with design tools

### Roadmap

1. **Enhanced Preview**: More interactive token preview
2. **Theme Builder**: Visual theme customization tool
3. **Component Library**: Comprehensive component documentation
4. **Design Tokens API**: Programmatic access to tokens

---

**Keywords:** theming-system, design-tokens, css-architecture, component-theming, theme-switching, accessibility, performance, best-practices 