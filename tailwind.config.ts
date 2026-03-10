import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: "#0A0A0A",
          secondary: "#141414",
        },
        text: {
          primary: "#E8E4DF",
          secondary: "#8A8478",
        },
        accent: {
          DEFAULT: "#C4A265",
          hover: "#D4B87A",
        },
        border: "#2A2A2A",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
        serif: ["var(--font-cormorant-garamond)", "serif"],
      },
    },
  },
};

export default config;
