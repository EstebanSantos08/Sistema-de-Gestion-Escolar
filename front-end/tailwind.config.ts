import type { Config } from 'tailwindcss';

const config: Config = {
  safelist: ['accent-turquoise', 'accent-blue', 'accent-lime', 'accent-yellow', 'accent-pink', 'accent-violet', 'accent-lilac'],
  darkMode: ['class'],
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: { '2xl': '1400px' },
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
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
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },

        // Paleta accesible institucional basada en el logo
        school: {
          bg: '#F4FAF9',
          surface: '#FFFFFF',
          primary: '#087F79',
          'primary-hover': '#066863',
          'primary-active': '#05524E',
          'error-hover': '#971D2C',
          'error-border': '#F7C3C9',
          'success-border': '#C6E7C8',
          'warning-border': '#F6E4AC',
          subtle: '#E3F5F3',
          background: '#F4FAF9',
          blue: '#23688F',
          'primary-subtle': '#E3F5F3',
          accent: '#41C4BD',
          heading: '#183B3A',
          body: '#365451',
          muted: '#5E7A77',
          'muted-readable': '#4F6965',
          border: '#D6E5E3',
          input: '#718B88',
          success: '#287A32',
          'success-bg': '#EAF5EB',
          warning: '#805D00',
          'warning-bg': '#FEF8E7',
          error: '#B42335',
          'error-bg': '#FDF0F1',
          // Acentos secundarios controlados
          pink: '#FF5DA0',
          'pink-bg': '#FDF0F6',
          lime: '#9DD31B',
          'lime-bg': '#F4FBE8',
          yellow: '#F2C700',
          'yellow-bg': '#FEF9E6',
          lightblue: '#64B6E5',
          'lightblue-bg': '#EFF7FC',
          violet: '#9731AC',
          'violet-bg': '#F6EDF8',
          lilac: '#EE7DCC',
        },
        surface: {
          turquoise: '#E6F8F6', blue: '#EEF8FD', lime: '#F3F9E7',
          yellow: '#FFF9DF', pink: '#FFF0F6', violet: '#F7EFFA', lilac: '#FAEFF8',
        },
        ink: {
          turquoise: '#066863', blue: '#23688F', lime: '#4F6C0C',
          yellow: '#765D00', pink: '#A92760', violet: '#813092', lilac: '#8F3977',
        },
        line: {
          turquoise: '#ABDCD6', blue: '#B7DCEF', lime: '#CCE39A',
          yellow: '#E9D889', pink: '#F0B7D0', violet: '#D8B7E1', lilac: '#E8BEDF',
        },
        brand: {
          turquoise: '#41C4BD',
          primary: '#087F79',
          pink: '#FF5DA0',
          lime: '#9DD31B',
          yellow: '#F2C700',
          lightblue: '#64B6E5',
          violet: '#9731AC',
          lilac: '#EE7DCC',
          white: '#FFFFFF',
          gray: '#D6E5E3',
        },
      },
      borderRadius: {
        card: '1.25rem',
        panel: '1.5rem',
        banner: '1.75rem',
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
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
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'float-delayed': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(10px)' },
        },
        'bounce-soft': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
        'pulse-soft': {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.03)', opacity: '0.9' },
        },
        wiggle: {
          '0%, 100%': { transform: 'rotate(-3deg)' },
          '50%': { transform: 'rotate(3deg)' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        float: 'float 4s ease-in-out infinite',
        'float-delayed': 'float-delayed 5s ease-in-out infinite 1s',
        'bounce-soft': 'bounce-soft 2s ease-in-out infinite',
        'pulse-soft': 'pulse-soft 3s ease-in-out infinite',
        wiggle: 'wiggle 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

export default config;
