import type { Config } from 'tailwindcss';
import defaultTheme from 'tailwindcss/defaultTheme';

const config: Config = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', ...defaultTheme.fontFamily.sans],
        display: ['Outfit', 'Inter', ...defaultTheme.fontFamily.sans],
      },
      colors: {
        primary: {
          DEFAULT: 'hsl(var(--primary) / <alpha-value>)',
          light: '#5eead4',
          dark: '#0f766e',
        },
        background: {
          DEFAULT: 'hsl(var(--background) / <alpha-value>)',
          dark: 'hsl(var(--background) / <alpha-value>)',
        },
        foreground: {
          DEFAULT: 'hsl(var(--foreground) / <alpha-value>)',
          dark: 'hsl(var(--foreground) / <alpha-value>)',
        },
        surface: {
          DEFAULT: 'hsl(var(--surface) / <alpha-value>)',
          dark: 'hsl(var(--surface) / <alpha-value>)',
        },
        card: {
          DEFAULT: 'hsl(var(--card) / <alpha-value>)',
          foreground: 'hsl(var(--card-foreground) / <alpha-value>)',
        },
        border: {
          DEFAULT: 'hsl(var(--border) / <alpha-value>)',
          dark: 'hsl(var(--border) / <alpha-value>)',
        },
        'muted-foreground': {
          DEFAULT: 'hsl(var(--muted-foreground) / <alpha-value>)',
        },
      },
      backdropBlur: {
        xs: '2px',
        sm: '8px',
        md: '16px',
        xl: '32px',
      },
      boxShadow: {
        glass: '0 4px 30px rgba(0, 0, 0, 0.08)',
        'glow-primary': '0 0 20px rgba(13, 148, 136, 0.3)',
        'glow-primary-lg': '0 0 40px rgba(13, 148, 136, 0.4)',
        'glow-amber': '0 0 20px rgba(245, 158, 11, 0.3)',
      },
      animation: {
        'spin-slow': 'spin 3s linear infinite',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'bounce-slow': 'bounce 2s infinite',
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '24px',
        '4xl': '32px',
      },
    },
  },
  plugins: [],
};

export default config;
