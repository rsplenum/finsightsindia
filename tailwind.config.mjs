/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Geist Sans"', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"Geist Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      transitionTimingFunction: {
        'geist': 'cubic-bezier(0.32, 0.72, 0, 1)',
        'geist-out': 'cubic-bezier(0, 0, 0.2, 1)',
      },
      animation: {
        'fade-in': 'geistFadeIn 0.2s ease-out forwards',
        'slide-up-fade': 'geistSlideUpFade 0.4s cubic-bezier(0.32, 0.72, 0, 1) forwards',
      },
      keyframes: {
        geistFadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        geistSlideUpFade: {
          '0%': { opacity: '0', transform: 'translateY(12px) scale(0.98)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
      },
    },
  },
};
