// tailwind-config.js

tailwind.config = {
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        surface: {
          DEFAULT: "var(--surface)",
          foreground: "var(--surface-foreground)",
        },
        overlay: {
          DEFAULT: "var(--overlay)",
          foreground: "var(--overlay-foreground)",
        },
        default: {
          DEFAULT: "var(--default)",
          foreground: "var(--default-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        success: {
          DEFAULT: "var(--success)",
          foreground: "var(--success-foreground)",
        },
        warning: {
          DEFAULT: "var(--warning)",
          foreground: "var(--warning-foreground)",
        },
        danger: {
          DEFAULT: "var(--danger)",
          foreground: "var(--danger-foreground)",
        },
        muted: "var(--muted)",
        border: "var(--border)",
        focus: "var(--focus)",
        link: "var(--link)",
        separator: "var(--separator)",
        field: {
          background: "var(--field-background)",
          foreground: "var(--field-foreground)",
          placeholder: "var(--field-placeholder)",
          border: "var(--field-border)",
        },
        segment: {
          DEFAULT: "var(--segment)",
          foreground: "var(--segment-foreground)",
        },
      },
      boxShadow: {
        surface: "var(--surface-shadow)",
        overlay: "var(--overlay-shadow)",
        field: "var(--field-shadow)",
      },
      borderRadius: {
        DEFAULT: "var(--radius)",
        field: "var(--field-radius)",
      },
    },
  },
};
