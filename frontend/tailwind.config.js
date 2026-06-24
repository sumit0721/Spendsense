/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: "#0f172a", // Slate 900
        "on-primary": "#ffffff",
        "primary-container": "#1e293b", // Slate 800 for dark/primary containers
        "on-primary-container": "#f8fafc",
        secondary: "#505f76",
        accent: {
          DEFAULT: "#ea580c", // Burnt Orange
          hover: "#c2410c",
        },
        success: "#059669", // Emerald 600
        error: "#ba1a1a",
        "error-container": "#fde8e8",
        "on-error-container": "#ba1a1a",
        surface: "#fcf8fa",
        "surface-container": "#ffffff",
        "surface-container-lowest": "#ffffff",
        "surface-container-low": "#f5f1f3", // slightly darker than #fcf8fa
        "surface-container-high": "#e8e3e6", // a bit darker for tabs/separators
        outline: {
          variant: "#c6c6cd",
        },
        "on-surface": "#1b1b1d",
        "on-surface-variant": "#45464d",
        
        // Academic Ledger Anomaly styles (Burnt Orange)
        "anomaly-bg": "#ffedd5", 
        "anomaly-text": "#c2410c",
        "anomaly-border": "#ea580c",

        // ---- Dark Mode Palette ----
        dark: {
          surface: "#0d1117",
          "surface-container": "#161b22",
          "surface-container-lowest": "#161b22",
          "surface-container-low": "#1c2128",
          "surface-container-high": "#252c36",
          primary: "#f0f6ff",
          "on-primary": "#0f172a",
          "primary-container": "#1e293b",
          "on-primary-container": "#94a3b8",
          secondary: "#8b949e",
          "on-surface": "#e6edf3",
          "on-surface-variant": "#8b949e",
          outline: {
            variant: "#30363d",
          },
          error: "#f85149",
          "error-container": "#3d1a1a",
          "on-error-container": "#f85149",
          success: "#3fb950",
          "anomaly-bg": "#3d1f0a",
          "anomaly-text": "#fb923c",
          "anomaly-border": "#ea580c",
          accent: "#ea580c",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      spacing: {
        xs: "4px",
        sm: "8px",
        md: "16px",
        lg: "24px",
        xl: "32px",
      },
      borderRadius: {
        lg: "12px",
        DEFAULT: "8px",
      },
      boxShadow: {
        card: "0px 4px 12px rgba(15, 23, 42, 0.08)",
      },
    },
  },
  plugins: [],
}
