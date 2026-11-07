import { defineConfig } from 'astro/config';

const base = (process.env.BASE_PATH || '/').replace(/\/+$/, '');

export default defineConfig({
  site: process.env.SITE_URL || 'https://example.github.io',
  base: process.env.BASE_PATH || '/',
  output: 'static',
  trailingSlash: 'always',
  redirects: {
    '/pomogator/vremya': base + '/vremya/',
    '/en/helper/time': base + '/en/time/'
  }
});
