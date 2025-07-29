import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./client/index.html", "./client/src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        chart: {
          "1": "var(--chart-1)",
          "2": "var(--chart-2)",
          "3": "var(--chart-3)",
          "4": "var(--chart-4)",
          "5": "var(--chart-5)",
        },
        // Biomorphic Natural Color Palette
        sage: {
          "50": "var(--sage-50)",
          "100": "var(--sage-100)",
          "200": "var(--sage-200)",
          "300": "var(--sage-300)",
          "400": "var(--sage-400)",
          "500": "var(--sage-500)",
          "600": "var(--sage-600)",
          "700": "var(--sage-700)",
          "800": "var(--sage-800)",
          "900": "var(--sage-900)",
        },
        moss: {
          "50": "var(--moss-50)",
          "100": "var(--moss-100)",
          "200": "var(--moss-200)",
          "300": "var(--moss-300)",
          "400": "var(--moss-400)",
          "500": "var(--moss-500)",
          "600": "var(--moss-600)",
          "700": "var(--moss-700)",
          "800": "var(--moss-800)",
          "900": "var(--moss-900)",
        },
        clay: {
          "50": "var(--clay-50)",
          "100": "var(--clay-100)",
          "200": "var(--clay-200)",
          "300": "var(--clay-300)",
          "400": "var(--clay-400)",
          "500": "var(--clay-500)",
          "600": "var(--clay-600)",
          "700": "var(--clay-700)",
          "800": "var(--clay-800)",
          "900": "var(--clay-900)",
        },
        stone: {
          "50": "var(--stone-50)",
          "100": "var(--stone-100)",
          "200": "var(--stone-200)",
          "300": "var(--stone-300)",
          "400": "var(--stone-400)",
          "500": "var(--stone-500)",
          "600": "var(--stone-600)",
          "700": "var(--stone-700)",
          "800": "var(--stone-800)",
          "900": "var(--stone-900)",
        },
        forest: {
          "50": "var(--forest-50)",
          "100": "var(--forest-100)",
          "200": "var(--forest-200)",
          "300": "var(--forest-300)",
          "400": "var(--forest-400)",
          "500": "var(--forest-500)",
          "600": "var(--forest-600)",
          "700": "var(--forest-700)",
          "800": "var(--forest-800)",
          "900": "var(--forest-900)",
        },
        earth: {
          "50": "var(--earth-50)",
          "100": "var(--earth-100)",
          "200": "var(--earth-200)",
          "300": "var(--earth-300)",
          "400": "var(--earth-400)",
          "500": "var(--earth-500)",
          "600": "var(--earth-600)",
          "700": "var(--earth-700)",
          "800": "var(--earth-800)",
          "900": "var(--earth-900)",
        },
        sidebar: {
          DEFAULT: "var(--sidebar-background)",
          foreground: "var(--sidebar-foreground)",
          primary: "var(--sidebar-primary)",
          "primary-foreground": "var(--sidebar-primary-foreground)",
          accent: "var(--sidebar-accent)",
          "accent-foreground": "var(--sidebar-accent-foreground)",
          border: "var(--sidebar-border)",
          ring: "var(--sidebar-ring)",
        },
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
} satisfies Config;
