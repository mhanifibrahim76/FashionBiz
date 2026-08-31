/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'oklch(0.975 0.012 92)',
        foreground: 'oklch(0.19 0.025 250)',
        card: 'oklch(0.995 0.006 90)',
        'card-foreground': 'oklch(0.19 0.025 250)',
        popover: 'oklch(0.995 0.006 90)',
        'popover-foreground': 'oklch(0.19 0.025 250)',
        primary: 'oklch(0.205 0.045 250)',
        'primary-foreground': 'oklch(0.985 0.01 90)',
        secondary: 'oklch(0.94 0.018 90)',
        'secondary-foreground': 'oklch(0.25 0.025 250)',
        muted: 'oklch(0.945 0.016 92)',
        'muted-foreground': 'oklch(0.49 0.025 250)',
        accent: 'oklch(0.83 0.19 111)',
        'accent-foreground': 'oklch(0.27 0.055 130)',
        destructive: 'oklch(0.58 0.2 25)',
        border: 'oklch(0.88 0.018 90)',
        input: 'oklch(0.86 0.02 90)',
        ring: 'oklch(0.65 0.12 110)',
        sidebar: 'oklch(0.205 0.045 250)',
        'sidebar-foreground': 'oklch(0.94 0.015 90)',
        'chart-3': 'oklch(0.47 0.035 250)',
        'chart-4': 'oklch(0.32 0.03 250)',
      },
      fontFamily: {
        sans: ['Arial', 'Helvetica', 'sans-serif'],
      },
      borderRadius: {
        lg: '0.85rem',
      },
    },
  },
  plugins: [],
}
