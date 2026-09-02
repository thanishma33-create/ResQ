/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        resq: {
          bg: '#f8fafc',
          surface: '#ffffff',
          sidebar: '#0f172a',
          'sidebar-hover': '#1e293b',
          border: '#e2e8f0',
          card: '#ffffff',
          primary: '#2563eb',
          secondary: '#475569',
          danger: '#dc2626',
          warning: '#d97706',
          success: '#16a34a',
          accent: '#7c3aed',
          dark: '#0f172a',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace']
      },
      boxShadow: {
        sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        card: '0 1px 3px 0 rgba(0, 0, 0, 0.07), 0 1px 2px -1px rgba(0, 0, 0, 0.05)',
        md: '0 4px 6px -1px rgba(0, 0, 0, 0.08), 0 2px 4px -2px rgba(0, 0, 0, 0.05)',
        lg: '0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -4px rgba(0, 0, 0, 0.04)',
        glow: '0 0 15px -3px rgba(37, 99, 235, 0.25)',
        'glow-danger': '0 0 15px -3px rgba(220, 38, 38, 0.25)',
      }
    },
  },
  plugins: [],
}
