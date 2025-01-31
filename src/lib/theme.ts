export const themeConfig = {
  colors: {
    brand: {
      primary: {
        50: '#f0f9ff',
        100: '#e0f2fe',
        200: '#bae6fd',
        300: '#7dd3fc',
        400: '#38bdf8',
        500: '#0ea5e9',
        600: '#0284c7',
        700: '#0369a1',
        800: '#075985',
        900: '#0c4a6e',
      },
      secondary: {
        50: '#f5f3ff',
        100: '#ede9fe',
        200: '#ddd6fe',
        300: '#c4b5fd',
        400: '#a78bfa',
        500: '#8b5cf6',
        600: '#7c3aed',
        700: '#6d28d9',
        800: '#5b21b6',
        900: '#4c1d95',
      },
      accent: {
        50: '#fff1f2',
        100: '#ffe4e6',
        200: '#fecdd3',
        300: '#fda4af',
        400: '#fb7185',
        500: '#f43f5e',
        600: '#e11d48',
        700: '#be123c',
        800: '#9f1239',
        900: '#881337',
      },
    },
    semantic: {
      success: {
        light: '#86efac',
        DEFAULT: '#22c55e',
        dark: '#15803d',
      },
      warning: {
        light: '#fde047',
        DEFAULT: '#eab308',
        dark: '#a16207',
      },
      error: {
        light: '#fca5a5',
        DEFAULT: '#ef4444',
        dark: '#b91c1c',
      },
      info: {
        light: '#93c5fd',
        DEFAULT: '#3b82f6',
        dark: '#1d4ed8',
      },
    },
    surface: {
      background: 'hsl(var(--background))',
      foreground: 'hsl(var(--foreground))',
      card: 'hsl(var(--card))',
      'card-foreground': 'hsl(var(--card-foreground))',
      popover: 'hsl(var(--popover))',
      'popover-foreground': 'hsl(var(--popover-foreground))',
      primary: 'hsl(var(--primary))',
      'primary-foreground': 'hsl(var(--primary-foreground))',
      secondary: 'hsl(var(--secondary))',
      'secondary-foreground': 'hsl(var(--secondary-foreground))',
      muted: 'hsl(var(--muted))',
      'muted-foreground': 'hsl(var(--muted-foreground))',
      accent: 'hsl(var(--accent))',
      'accent-foreground': 'hsl(var(--accent-foreground))',
      destructive: 'hsl(var(--destructive))',
      'destructive-foreground': 'hsl(var(--destructive-foreground))',
      border: 'hsl(var(--border))',
      input: 'hsl(var(--input))',
      ring: 'hsl(var(--ring))',
    },
  },
  fonts: {
    sans: 'var(--font-sans)',
    heading: 'var(--font-heading)',
    mono: 'var(--font-mono)',
  },
  spacing: {
    px: '1px',
    0: '0',
    0.5: '0.125rem',
    1: '0.25rem',
    1.5: '0.375rem',
    2: '0.5rem',
    2.5: '0.625rem',
    3: '0.75rem',
    3.5: '0.875rem',
    4: '1rem',
    5: '1.25rem',
    6: '1.5rem',
    7: '1.75rem',
    8: '2rem',
    9: '2.25rem',
    10: '2.5rem',
    11: '2.75rem',
    12: '3rem',
    14: '3.5rem',
    16: '4rem',
    20: '5rem',
    24: '6rem',
    28: '7rem',
    32: '8rem',
    36: '9rem',
    40: '10rem',
    44: '11rem',
    48: '12rem',
    52: '13rem',
    56: '14rem',
    60: '15rem',
    64: '16rem',
    72: '18rem',
    80: '20rem',
    96: '24rem',
  },
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },
  radii: {
    none: '0',
    sm: 'calc(var(--radius) - 4px)',
    DEFAULT: 'var(--radius)',
    md: 'calc(var(--radius) - 2px)',
    lg: 'var(--radius)',
    xl: 'calc(var(--radius) + 4px)',
    '2xl': 'calc(var(--radius) + 8px)',
    '3xl': 'calc(var(--radius) + 12px)',
    full: '9999px',
  },
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
    none: 'none',
  },
  animations: {
    keyframes: {
      'accordion-down': {
        from: { height: '0' },
        to: { height: 'var(--radix-accordion-content-height)' },
      },
      'accordion-up': {
        from: { height: 'var(--radix-accordion-content-height)' },
        to: { height: '0' },
      },
      'collapsible-down': {
        from: { height: '0' },
        to: { height: 'var(--radix-collapsible-content-height)' },
      },
      'collapsible-up': {
        from: { height: 'var(--radix-collapsible-content-height)' },
        to: { height: '0' },
      },
      'slide-down': {
        from: { transform: 'translateY(-10px)', opacity: '0' },
        to: { transform: 'translateY(0)', opacity: '1' },
      },
      'slide-up': {
        from: { transform: 'translateY(10px)', opacity: '0' },
        to: { transform: 'translateY(0)', opacity: '1' },
      },
      'fade-in': {
        from: { opacity: '0' },
        to: { opacity: '1' },
      },
      'fade-out': {
        from: { opacity: '1' },
        to: { opacity: '0' },
      },
      'scale-in': {
        from: { transform: 'scale(0.95)', opacity: '0' },
        to: { transform: 'scale(1)', opacity: '1' },
      },
      'scale-out': {
        from: { transform: 'scale(1)', opacity: '1' },
        to: { transform: 'scale(0.95)', opacity: '0' },
      },
      'enter-from-right': {
        from: { transform: 'translateX(200px)', opacity: '0' },
        to: { transform: 'translateX(0)', opacity: '1' },
      },
      'enter-from-left': {
        from: { transform: 'translateX(-200px)', opacity: '0' },
        to: { transform: 'translateX(0)', opacity: '1' },
      },
      'exit-to-right': {
        from: { transform: 'translateX(0)', opacity: '1' },
        to: { transform: 'translateX(200px)', opacity: '0' },
      },
      'exit-to-left': {
        from: { transform: 'translateX(0)', opacity: '1' },
        to: { transform: 'translateX(-200px)', opacity: '0' },
      },
      'scale-in-content': {
        from: { transform: 'rotateX(-30deg) scale(0.9)', opacity: '0' },
        to: { transform: 'rotateX(0deg) scale(1)', opacity: '1' },
      },
      'scale-out-content': {
        from: { transform: 'rotateX(0deg) scale(1)', opacity: '1' },
        to: { transform: 'rotateX(-10deg) scale(0.95)', opacity: '0' },
      },
      'rise': {
        '0%': { transform: 'translateY(20px)', opacity: '0' },
        '100%': { transform: 'translateY(0)', opacity: '1' },
      },
      'shine': {
        '0%': { backgroundPosition: '-200% center' },
        '100%': { backgroundPosition: '200% center' },
      },
      'ping': {
        '75%, 100%': {
          transform: 'scale(2)',
          opacity: '0',
        },
      },
      'pulse': {
        '50%': {
          opacity: '.5',
        },
      },
      'bounce': {
        '0%, 100%': {
          transform: 'translateY(-25%)',
          animationTimingFunction: 'cubic-bezier(0.8,0,1,1)',
        },
        '50%': {
          transform: 'none',
          animationTimingFunction: 'cubic-bezier(0,0,0.2,1)',
        },
      },
    },
    durations: {
      fastest: '50ms',
      faster: '100ms',
      fast: '150ms',
      normal: '200ms',
      slow: '300ms',
      slower: '400ms',
      slowest: '500ms',
    },
    easings: {
      default: 'cubic-bezier(0.4, 0, 0.2, 1)',
      linear: 'linear',
      in: 'cubic-bezier(0.4, 0, 1, 1)',
      out: 'cubic-bezier(0, 0, 0.2, 1)',
      'in-out': 'cubic-bezier(0.4, 0, 0.2, 1)',
      'in-expo': 'cubic-bezier(0.7, 0, 0.84, 0)',
      'out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
      'in-out-expo': 'cubic-bezier(0.87, 0, 0.13, 1)',
    },
  },
  effects: {
    blur: {
      none: '0',
      sm: '4px',
      DEFAULT: '8px',
      md: '12px',
      lg: '16px',
      xl: '24px',
      '2xl': '40px',
      '3xl': '64px',
    },
    dropShadow: {
      sm: '0 1px 1px rgb(0 0 0 / 0.05)',
      DEFAULT: ['0 1px 2px rgb(0 0 0 / 0.1)', '0 1px 1px rgb(0 0 0 / 0.06)'],
      md: ['0 4px 3px rgb(0 0 0 / 0.07)', '0 2px 2px rgb(0 0 0 / 0.06)'],
      lg: ['0 10px 8px rgb(0 0 0 / 0.04)', '0 4px 3px rgb(0 0 0 / 0.1)'],
      xl: ['0 20px 13px rgb(0 0 0 / 0.03)', '0 8px 5px rgb(0 0 0 / 0.08)'],
      '2xl': '0 25px 25px rgb(0 0 0 / 0.15)',
      none: '0 0 #0000',
    },
  },
  gradients: {
    subtle: 'linear-gradient(to bottom right, var(--subtle-gradient))',
    radial: 'radial-gradient(circle at center, var(--radial-gradient))',
    conic: 'conic-gradient(from 180deg at 50% 50%, var(--conic-gradient))',
    shine: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)',
    glow: 'radial-gradient(circle at center, var(--glow-color), transparent 50%)',
  },
} as const; 