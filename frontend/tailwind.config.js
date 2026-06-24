/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: "var(--color-primary)",
        "on-primary": "var(--color-on-primary)",
        "primary-container": "var(--color-primary-container)",
        "on-primary-container": "var(--color-on-primary-container)",
        secondary: "var(--color-secondary)",
        accent: {
          DEFAULT: "var(--color-accent)",
          hover: "var(--color-accent-hover)",
        },
        success: "var(--color-success)",
        error: "var(--color-error)",
        "error-container": "var(--color-error-container)",
        "on-error-container": "var(--color-on-error-container)",
        surface: "var(--color-surface)",
        "surface-container": "var(--color-surface-container)",
        "surface-container-lowest": "var(--color-surface-container-lowest)",
        "surface-container-low": "var(--color-surface-container-low)",
        "surface-container-high": "var(--color-surface-container-high)",
        outline: { variant: "var(--color-outline-variant)" },
        "on-surface": "var(--color-on-surface)",
        "on-surface-variant": "var(--color-on-surface-variant)",
        "anomaly-bg": "var(--color-anomaly-bg)",
        "anomaly-text": "var(--color-anomaly-text)",
        "anomaly-border": "var(--color-anomaly-border)",
      },
      fontFamily: { sans: ["Inter", "system-ui", "sans-serif"] },
      spacing: { xs: "4px", sm: "8px", md: "16px", lg: "24px", xl: "32px" },
      borderRadius: { lg: "12px", DEFAULT: "8px" },
      boxShadow: { card: "var(--shadow-card)" },
    },
  },
  plugins: [],
}
