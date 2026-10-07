/** @type {import('tailwindcss').Config} */

function withOpacity(variableName) {
  return ({ opacityValue }) => {
    if (opacityValue !== undefined) {
      return `rgba(var(${variableName}-rgb), ${opacityValue})`
    }
    return `var(${variableName})`
  }
}

export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        // DEVSTUDIO Core Design Palette
        'bg-page': withOpacity('--bg-page'),
        'bg-surface': withOpacity('--bg-surface'),
        'border-default': withOpacity('--border-default'),

        'accent-primary': withOpacity('--accent-primary'),
        'accent-teal': withOpacity('--accent-teal'),
        'accent-purple': withOpacity('--accent-purple'),
        'accent-amber': withOpacity('--accent-amber'),

        'text-primary': withOpacity('--text-primary'),
        'text-muted': withOpacity('--text-muted'),

        'status-success': withOpacity('--status-success'),
        'status-pending': withOpacity('--status-pending'),
        'status-destructive': withOpacity('--status-destructive'),
        'on-accent': 'var(--on-accent)',

        // Compatibility Shadcn bindings
        border: "var(--border-default)",
        input: "var(--border-default)",
        ring: "var(--accent-primary)",
        background: "var(--bg-page)",
        foreground: "var(--text-primary)",
        primary: {
          DEFAULT: "var(--accent-primary)",
          foreground: "var(--text-primary)",
        },
        secondary: {
          DEFAULT: "var(--bg-surface)",
          foreground: "var(--text-primary)",
        },
        destructive: {
          DEFAULT: "var(--status-destructive)",
          foreground: "var(--text-primary)",
        },
        muted: {
          DEFAULT: "var(--bg-surface)",
          foreground: "var(--text-muted)",
        },
        accent: {
          DEFAULT: "var(--bg-surface)",
          foreground: "var(--text-primary)",
        },
        popover: {
          DEFAULT: "var(--bg-surface)",
          foreground: "var(--text-primary)",
        },
        card: {
          DEFAULT: "var(--bg-surface)",
          foreground: "var(--text-primary)",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ["'Plus Jakarta Sans'", "Inter", "-apple-system", "BlinkMacSystemFont", "system-ui", "sans-serif"],
        mono: ["'JetBrains Mono'", "'IBM Plex Mono'", "Menlo", "monospace"],
        plex: ["'IBM Plex Mono'", "'JetBrains Mono'", "monospace"],
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        pulseGlow: {
          "0%, 100%": { opacity: "0.4" },
          "50%": { opacity: "0.8" },
        }
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "pulse-glow": "pulseGlow 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
    },
  },
  plugins: [],
}
