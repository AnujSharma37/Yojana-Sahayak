import type { Config } from "tailwindcss";

// Palette from the brief: deep navy primary, white, light grey surfaces,
// subtle teal secondary, saffron only for small highlights.
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: { DEFAULT: "#13295B", dark: "#0C1D45", soft: "#E8EDF6" },
        teal: { DEFAULT: "#0E6F68", soft: "#E3F2F0" },
        saffron: { DEFAULT: "#E58A1F", ink: "#9A4B00", soft: "#FDF1E2" },
        ink: { DEFAULT: "#1B2433", muted: "#4A5568" },
        surface: { DEFAULT: "#F4F6F9", line: "#D5DBE5" },
        danger: { DEFAULT: "#B42318", soft: "#FDECEA" },
      },
      fontFamily: {
        sans: ["\"Noto Sans\"", "\"Noto Sans Devanagari\"", "system-ui", "sans-serif"],
      },
      minHeight: { touch: "44px" },
      minWidth: { touch: "44px" },
    },
  },
  plugins: [],
};
export default config;
