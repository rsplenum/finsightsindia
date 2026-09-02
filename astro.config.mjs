// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import react from '@astrojs/react';
import AstroPWA from '@vite-pwa/astro';

// https://astro.build/config
export default defineConfig({
  server: {
    host: '0.0.0.0',
    port: 3000
  },
  site: 'https://finsightindia.in',
  integrations: [
    react(),
    mdx(), 
    sitemap(),
    AstroPWA({
      registerType: 'autoUpdate',
      injectRegister: null,
      devOptions: {
        enabled: false,
      },
      manifest: {
        name: 'FinSight India',
        short_name: 'FinSight',
        description: 'Expert analysis, loopholes, and strategic guidance on Indian Taxation.',
        theme_color: '#0A192F',
        background_color: '#0A192F',
        display: 'standalone',
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        navigateFallback: null
      }
    })
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
