import typography from "@tailwindcss/typography";

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  darkMode: ["class"],
  plugins: [typography],
  theme: {
    extend: {
      typography: {
        DEFAULT: {
          css: {
            maxWidth: "full",
          },
        },
      },
    },
  },
};
