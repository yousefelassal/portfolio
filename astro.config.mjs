import { defineConfig } from 'astro/config';
import tailwind from "@astrojs/tailwind";
import sitemap from "@astrojs/sitemap";
export default defineConfig({
  site: 'https://yousefelassal.me',
  compressHTML: true,
  integrations: [tailwind(), sitemap()]
});