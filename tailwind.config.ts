import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#f0114f",
          dark: "#c20e40",
          purple: "#5b0fc7",
          pink: "#f0114f",
        },
        ink: {
          DEFAULT: "#0b1330",
          light: "#161f45",
        },
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      backgroundImage: {
        "brand-gradient": "linear-gradient(90deg, #5b0fc7 0%, #b5149c 50%, #f0114f 100%)",
        "brand-gradient-diag": "linear-gradient(135deg, #5b0fc7 0%, #b5149c 50%, #f0114f 100%)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "gradient-pan": {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.6s ease-out both",
        "gradient-pan": "gradient-pan 6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
