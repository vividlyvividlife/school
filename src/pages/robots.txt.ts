import type { APIRoute } from 'astro';

export const GET: APIRoute = ({ site }) => {
  const base = import.meta.env.BASE_URL.replace(/\/+$/, '');
  const origin = site ?? new URL(import.meta.env.SITE ?? 'https://example.github.io');
  const sitemap = new URL(`${base}/sitemap.xml`, origin).href;
  return new Response(`User-agent: *\nAllow: /\n\nSitemap: ${sitemap}\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' }
  });
};
