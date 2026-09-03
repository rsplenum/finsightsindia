// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

// Change `site` to the live domain before go-live. It is used by the sitemap,
// by canonical tags and by every absolute URL in the structured data.
export default defineConfig({
  site: 'https://www.tripadiinternational.com',
  trailingSlash: 'ignore',
  server: { host: '0.0.0.0', port: 4321 },
  integrations: [sitemap()],
  vite: { plugins: [tailwindcss()] },
  build: { inlineStylesheets: 'auto' },
});
