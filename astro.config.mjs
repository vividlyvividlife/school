import { defineConfig } from 'astro/config';

const base = (process.env.BASE_PATH || '/').replace(/\/+$/, '');

export default defineConfig({
  site: process.env.SITE_URL || 'https://example.github.io',
  base: process.env.BASE_PATH || '/',
  output: 'static',
  trailingSlash: 'always',
  redirects: {
    '/pomogator/vremya': base + '/vremya/',
    '/en/helper/time': base + '/en/time/',
    '/2-class/belaruskaya-mova/katalog': base + '/2-class/belaruskaya-mova/',
    '/2-class/belaruskaya-mova/katalog/mayey-radzimy-dzivny-svet': base + '/2-class/belaruskaya-mova/tema/mayey-radzimy-dzivny-svet/2/',
    '/2-class/belaruskaya-mova/zadanze/mayey-radzimy-dzivny-svet': base + '/2-class/belaruskaya-mova/tema/mayey-radzimy-dzivny-svet/2/'
  }
});
