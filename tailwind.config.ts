/**
 * TAILWIND CONFIGURATION — v4-Ready
 *
 * This configuration file is structured for Tailwind CSS v4, embracing
 * a CSS-first approach where design tokens are defined in CSS files
 * and referenced here. This provides a single source of truth for theming
 * and enables Tailwind's JIT engine to generate utilities on-demand.
 *
 * • Content sources defined for app, src, and features directories.
 * • All theme colors mapped to CSS variables for opacity modifiers.
 * • Font families and border radii linked to CSS variables.
 * • `tailwind-scrollbar` plugin integrated for custom scrollbars.
 *
 * Keywords: tailwind-config, v4, design-tokens, hsl, css-variables
 */
import type { Config } from 'tailwindcss';
import scrollbarPlugin from 'tailwind-scrollbar';

export default {
  content: [
    './app/**/*.{ts,tsx,jsx,mdx}',
    './pages/**/*.{ts,tsx,jsx,mdx}',
    './components/**/*.{ts,tsx,jsx,mdx}',
    './features/**/*.{ts,tsx,jsx,mdx}',
    './src/**/*.{ts,tsx,jsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border) / <alpha-value>)',
        input: 'hsl(var(--input) / <alpha-value>)',
        ring: 'hsl(var(--ring) / <alpha-value>)',
        background: 'hsl(var(--background) / <alpha-value>)',
        foreground: 'hsl(var(--foreground) / <alpha-value>)',
        primary: {
          DEFAULT: 'hsl(var(--primary) / <alpha-value>)',
          foreground: 'hsl(var(--primary-foreground) / <alpha-value>)',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary) / <alpha-value>)',
          foreground: 'hsl(var(--secondary-foreground) / <alpha-value>)',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive) / <alpha-value>)',
          foreground: 'hsl(var(--destructive-foreground) / <alpha-value>)',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted) / <alpha-value>)',
          foreground: 'hsl(var(--muted-foreground) / <alpha-value>)',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent) / <alpha-value>)',
          foreground: 'hsl(var(--accent-foreground) / <alpha-value>)',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover) / <alpha-value>)',
          foreground: 'hsl(var(--popover-foreground) / <alpha-value>)',
        },
        card: {
          DEFAULT: 'hsl(var(--card) / <alpha-value>)',
          foreground: 'hsl(var(--card-foreground) / <alpha-value>)',
        },
      },
      borderRadius: {
        lg: 'var(--radius-lg)',
        md: 'calc(var(--radius-lg) - 2px)',
        sm: 'calc(var(--radius-lg) - 4px)',
      },
      fontFamily: {
        sans: ['var(--font-sans)'],
        serif: ['var(--font-serif)'],
        ui: ['var(--font-ui)'],
        brand: ['var(--font-brand)'],
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [scrollbarPlugin],
} satisfies Config; 