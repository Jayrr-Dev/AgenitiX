# 3D Marquee Component

## Overview

**Component**: `ThreeDMarquee`  
**File**: `@/components/ui/3d-marquee.tsx`  
**Category**: Animation Component  
**Dependencies**: `motion/react`, `@/lib/utils`

A sophisticated 3D rotating image gallery component that creates an immersive visual experience with motion effects and grid overlays.

## Component Specification

### Props
```typescript
interface ThreeDMarqueeProps {
  images: string[]           // Array of image URLs
  className?: string         // Optional CSS classes
}
```

### Features
- **3D Rotation** - Images rotate in 3D space with perspective
- **Grid Layout** - 4-column grid with staggered animations
- **Motion Effects** - Smooth animations with Framer Motion
- **Hover Interactions** - Images lift on hover
- **Grid Overlays** - Decorative grid lines for visual depth
- **Responsive Design** - Scales appropriately on different screen sizes

## Usage Examples

### Basic Usage
```tsx
import { ThreeDMarquee } from "@/components/ui/3d-marquee";

export function BasicMarquee() {
  const images = [
    "/image1.jpg",
    "/image2.jpg",
    "/image3.jpg",
    "/image4.jpg",
    "/image5.jpg",
    "/image6.jpg",
    "/image7.jpg",
    "/image8.jpg"
  ];

  return <ThreeDMarquee images={images} />;
}
```

### With Custom Styling
```tsx
import { ThreeDMarquee } from "@/components/ui/3d-marquee";

export function StyledMarquee() {
  const images = [
    "/product1.jpg",
    "/product2.jpg",
    "/product3.jpg",
    "/product4.jpg"
  ];

  return (
    <ThreeDMarquee 
      images={images} 
      className="max-w-6xl mx-auto"
    />
  );
}
```

### In a Layout
```tsx
import { ThreeDMarquee } from "@/components/ui/3d-marquee";

export function MarqueeLayout() {
  const galleryImages = [
    "/gallery1.jpg",
    "/gallery2.jpg",
    "/gallery3.jpg",
    "/gallery4.jpg",
    "/gallery5.jpg",
    "/gallery6.jpg",
    "/gallery7.jpg",
    "/gallery8.jpg"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="container mx-auto py-12">
        <h1 className="text-4xl font-bold text-center mb-8">
          Our Gallery
        </h1>
        <ThreeDMarquee images={galleryImages} />
      </div>
    </div>
  );
}
```

## Technical Implementation

### 3D Transform
```tsx
// Main 3D transformation
style={{
  transform: "rotateX(55deg) rotateY(0deg) rotateZ(-45deg) translatey(800px)",
}}
className="relative top-96 right-[50%] grid size-full origin-top-left grid-cols-4 gap-8 transform-3d"
```

### Animation Configuration
```tsx
// Staggered column animations
animate={{ y: colIndex % 2 === 0 ? 100 : -100 }}
transition={{
  duration: colIndex % 2 === 0 ? 10 : 15,
  repeat: Number.POSITIVE_INFINITY,
  repeatType: "reverse",
}}
```

### Hover Effects
```tsx
// Image hover animation
whileHover={{
  y: -10,
}}
transition={{
  duration: 0.3,
  ease: "easeInOut",
}}
```

## Grid System

### Column Distribution
```tsx
// Split images into 4 columns
const chunkSize = Math.ceil(images.length / 4);
const chunks = Array.from({ length: 4 }, (_, colIndex) => {
  const start = colIndex * chunkSize;
  return images.slice(start, start + chunkSize);
});
```

### Grid Lines
The component includes decorative grid lines:

#### Horizontal Grid Lines
```tsx
const GridLineHorizontal = ({ className, offset }) => {
  return (
    <div
      style={{
        "--background": "#ffffff",
        "--color": "rgba(0, 0, 0, 0.2)",
        "--height": "1px",
        "--width": "5px",
        "--fade-stop": "90%",
        "--offset": offset || "200px",
        "--color-dark": "rgba(255, 255, 255, 0.2)",
        maskComposite: "exclude",
      }}
      className={cn(
        "absolute left-[calc(var(--offset)/2*-1)] h-[var(--height)] w-[calc(100%+var(--offset))]",
        "bg-[linear-gradient(to_right,var(--color),var(--color)_50%,transparent_0,transparent)]",
        "[background-size:var(--width)_var(--height)]",
        "[mask:linear-gradient(to_left,var(--background)_var(--fade-stop),transparent),_linear-gradient(to_right,var(--background)_var(--fade-stop),transparent),_linear-gradient(black,black)]",
        "[mask-composite:exclude]",
        "z-30",
        "dark:bg-[linear-gradient(to_right,var(--color-dark),var(--color-dark)_50%,transparent_0,transparent)]",
        className
      )}
    />
  );
};
```

#### Vertical Grid Lines
```tsx
const GridLineVertical = ({ className, offset }) => {
  return (
    <div
      style={{
        "--background": "#ffffff",
        "--color": "rgba(0, 0, 0, 0.2)",
        "--height": "5px",
        "--width": "1px",
        "--fade-stop": "90%",
        "--offset": offset || "150px",
        "--color-dark": "rgba(255, 255, 255, 0.2)",
        maskComposite: "exclude",
      }}
      className={cn(
        "absolute top-[calc(var(--offset)/2*-1)] h-[calc(100%+var(--offset))] w-[var(--width)]",
        "bg-[linear-gradient(to_bottom,var(--color),var(--color)_50%,transparent_0,transparent)]",
        "[background-size:var(--width)_var(--height)]",
        "[mask:linear-gradient(to_top,var(--background)_var(--fade-stop),transparent),_linear-gradient(to_bottom,var(--background)_var(--fade-stop),transparent),_linear-gradient(black,black)]",
        "[mask-composite:exclude]",
        "z-30",
        "dark:bg-[linear-gradient(to_bottom,var(--color-dark),var(--color-dark)_50%,transparent_0,transparent)]",
        className
      )}
    />
  );
};
```

## Responsive Design

### Breakpoint Scaling
```tsx
// Responsive scaling
<div className="size-[1720px] shrink-0 scale-50 sm:scale-75 lg:scale-100">
```

### Mobile Optimization
```tsx
// Mobile height adjustment
className={cn(
  "mx-auto block h-[calc(100vh-96px)] overflow-hidden rounded-2xl max-sm:h-100",
  className
)}
```

## Performance Considerations

### Image Optimization
- Use optimized images (WebP format recommended)
- Implement lazy loading for large galleries
- Consider image preloading for smooth animations

### Animation Performance
- Uses `transform` for GPU acceleration
- Implements `will-change` for performance hints
- Optimizes animation timing for smooth 60fps

### Bundle Size
- **~3KB** - Minimal bundle impact
- **Tree shakeable** - Only imports used features
- **Framer Motion** - Optimized animation library

## Accessibility Features

### Screen Reader Support
- Images include proper `alt` attributes
- Grid structure is semantically correct
- Focus management for keyboard navigation

### Reduced Motion
```tsx
// Respect user's motion preferences
@media (prefers-reduced-motion: reduce) {
  .transform-3d {
    transform: none;
  }
}
```

## Integration Examples

### With Navigation
```tsx
import { ThreeDMarquee } from "@/components/ui/3d-marquee";
import { Button } from "@/components/ui/button";

export function MarqueeWithNavigation() {
  const images = [
    "/portfolio1.jpg",
    "/portfolio2.jpg",
    "/portfolio3.jpg",
    "/portfolio4.jpg"
  ];

  return (
    <div className="relative">
      <ThreeDMarquee images={images} />
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
        <Button variant="outline" className="bg-white/80 backdrop-blur">
          View All Projects
        </Button>
      </div>
    </div>
  );
}
```

### With Loading State
```tsx
import { ThreeDMarquee } from "@/components/ui/3d-marquee";
import { useState, useEffect } from "react";

export function MarqueeWithLoading() {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading images
    setTimeout(() => {
      setImages([
        "/image1.jpg",
        "/image2.jpg",
        "/image3.jpg",
        "/image4.jpg"
      ]);
      setLoading(false);
    }, 2000);
  }, []);

  if (loading) {
    return <div className="h-96 flex items-center justify-center">Loading...</div>;
  }

  return <ThreeDMarquee images={images} />;
}
```

## Best Practices

### 1. Image Selection
- Use high-quality images (minimum 970x700px)
- Maintain consistent aspect ratios
- Optimize file sizes for web

### 2. Performance
- Implement image lazy loading
- Use appropriate image formats (WebP, AVIF)
- Consider CDN for image delivery

### 3. Accessibility
- Provide meaningful alt text
- Test with screen readers
- Respect motion preferences

### 4. Responsive Design
- Test on various screen sizes
- Ensure mobile performance
- Consider reduced motion on mobile

## Related Components

- [Canvas Reveal Effect](./canvas-reveal-effect.md) - Alternative animation component
- [Infinite Moving Cards](./infinite-moving-cards.md) - Horizontal scrolling cards
- [Container Scroll Animation](./container-scroll-animation.md) - Scroll-triggered animations

---

*This documentation is automatically generated and maintained by the UI Documentation Generator.* 