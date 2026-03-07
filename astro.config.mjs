import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://blog.typemd.io',
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'zh-tw'],
    routing: {
      prefixDefaultLocale: false,
    },
  },
});
