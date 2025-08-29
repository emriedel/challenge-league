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
        primary: {
          50: '#f0f9ff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
        // App theme colors - Instagram dark mode inspired
        app: {
          // Backgrounds
          'bg': '#000000',              // Main app background (pure black)
          'surface': '#1a1a1a',        // Cards, modals, elevated content
          'surface-dark': '#0a0a0a',   // Darker surfaces when needed
          'surface-light': '#262626',  // Lighter surfaces (hover states)
          
          // Borders and dividers
          'border': '#404040',         // Primary border color
          'border-light': '#525252',   // Lighter borders
          'border-dark': '#262626',    // Darker borders
          
          // Text colors
          'text': '#ffffff',           // Primary text (white)
          'text-secondary': '#a3a3a3', // Secondary text (light gray)
          'text-muted': '#737373',     // Muted text (medium gray)
          'text-subtle': '#525252',    // Very subtle text
          
          // Interactive states
          'hover': 'rgba(255, 255, 255, 0.1)', // White overlay for hovers
          'active': 'rgba(255, 255, 255, 0.2)', // White overlay for active states
          
          // Status colors (adjusted for dark theme)
          'success': '#22c55e',        // Green for success
          'success-bg': 'rgba(34, 197, 94, 0.1)', // Success background
          'error': '#ef4444',          // Red for errors  
          'error-bg': 'rgba(239, 68, 68, 0.1)',   // Error background
          'warning': '#f59e0b',        // Warning color
          'info': '#3b82f6',          // Info color (blue)
        },
      },
    },
  },
  plugins: [],
}