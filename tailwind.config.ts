import type { Config } from 'tailwindcss'
import tailwindAnimate from 'tailwindcss-animate'
import typography from '@tailwindcss/typography'

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-poppins)', 'Poppins', 'sans-serif'],
        poppins: ['var(--font-poppins)', 'Poppins', 'sans-serif'],
      },
      fontSize: {
        // 8-Point Grid Typographic Formula (with 4px and 2px micro steps)
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }], // 10px (8+2) / 14px
        'xs': ['0.75rem', { lineHeight: '1rem' }],        // 12px (8+4 / 4*3) / 16px (8*2)
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],    // 14px (16-2) / 20px (4*5)
        'base': ['1rem', { lineHeight: '1.5rem' }],       // 16px (8*2) / 24px (8*3)
        'md': ['1.125rem', { lineHeight: '1.625rem' }],   // 18px (16+2) / 26px
        'lg': ['1.25rem', { lineHeight: '1.75rem' }],     // 20px (16+4 / 4*5) / 28px (4*7)
        'xl': ['1.5rem', { lineHeight: '2rem' }],         // 24px (8*3) / 32px (8*4)
        '2xl': ['2rem', { lineHeight: '2.5rem' }],        // 32px (8*4) / 40px (8*5)
        '3xl': ['2.5rem', { lineHeight: '3rem' }],        // 40px (8*5) / 48px (8*6)
        '4xl': ['3rem', { lineHeight: '3.5rem' }],        // 48px (8*6) / 56px (8*7)
        '5xl': ['3.5rem', { lineHeight: '4rem' }],        // 56px (8*7) / 64px (8*8)
        '6xl': ['4rem', { lineHeight: '4.5rem' }],        // 64px (8*8) / 72px (8*9)
        '7xl': ['4.5rem', { lineHeight: '5rem' }],        // 72px (8*9) / 80px (8*10)
        '8xl': ['5rem', { lineHeight: '5.5rem' }],        // 80px (8*10) / 88px (8*11)
        '9xl': ['6rem', { lineHeight: '6.5rem' }],        // 96px (8*12) / 104px (8*13)
      },
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
          50: '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1D4ED8',
          800: '#1E40AF',
          900: '#1E3A8A',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
          50: '#FFF7ED',
          100: '#FFEDD5',
          200: '#FED7AA',
          300: '#FDBA74',
          400: '#FB923C',
          500: '#F97316',
          600: '#EA580C',
          700: '#C2410C',
          800: '#9A3412',
          900: '#7C2D12',
        },
        action: {
          DEFAULT: 'hsl(var(--action))',
          foreground: 'hsl(var(--action-foreground))',
          hover: '#EA580C',
        },
        cta: {
          DEFAULT: '#F97316',
          hover: '#EA580C',
          active: '#C2410C',
          foreground: '#FFFFFF',
        },
        brand: {
          blue: '#2563EB',
          'blue-dark': '#1D4ED8',
          'blue-deep': '#1E40AF',
          'blue-light': '#EFF6FF',
          orange: '#F97316',
          'orange-hover': '#EA580C',
          'orange-light': '#FFF7ED',
          white: '#FFFFFF',
          slate: '#F8FAFC',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [tailwindAnimate, typography],
}

export default config
