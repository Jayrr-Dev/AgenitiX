// tailwind.config.ts
import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],              // <html class="dark"> by default
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './features/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: '',
  theme: {
    /* 1. container helper — unchanged */
    container: {
      center: true,
      padding: '2rem',
      screens: { '2xl': '1400px' },
    },

    /* 2. core design-token hook-ups */
    extend: {
      /* radius pulled from CSS custom prop */
      borderRadius: { lg: 'var(--radius)' },

      /* fonts point at the variables we set in theme.css */
      fontFamily: {
        sans  : ['var(--font-sans)'],
        ui    : ['var(--font-ui)'],
        serif : ['var(--font-serif)'],
        brand : ['var(--font-sans)'],
      },

      /* colour utilities -> HSL custom props (includes a few extras) */
      colors: {
        /* surfaces & text */
        background : 'hsl(var(--background) / <alpha-value>)',
        foreground : 'hsl(var(--foreground) / <alpha-value>)',

        /* brand colours */
        primary    : 'hsl(var(--primary) / <alpha-value>)',
        primaryFg  : 'hsl(var(--primary-foreground) / <alpha-value>)',
        secondary  : 'hsl(var(--secondary) / <alpha-value>)',
        secondaryFg: 'hsl(var(--secondary-foreground) / <alpha-value>)',

        /* UI utility colours */
        muted      : 'hsl(var(--muted) / <alpha-value>)',
        mutedFg    : 'hsl(var(--muted-foreground) / <alpha-value>)',
        accent     : 'hsl(var(--accent) / <alpha-value>)',
        accentFg   : 'hsl(var(--accent-foreground) / <alpha-value>)',
        border     : 'hsl(var(--border) / <alpha-value>)',
        ring       : 'hsl(var(--ring) / <alpha-value>)',

        /* state colours */
        destructive: 'hsl(var(--destructive) / <alpha-value>)',
        destructiveFg: 'hsl(var(--destructive-foreground) / <alpha-value>)',
      },
    },
  },

  /* 3. plugins — keep your animation helpers */
  plugins: [require('tailwindcss-animate')],
};

export default config;
