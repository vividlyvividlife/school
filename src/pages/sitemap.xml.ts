import type { APIRoute } from 'astro';
import { pagePairs } from '../i18n/routes';

export const GET: APIRoute = ({ site }) => {
  const base = import.meta.env.BASE_URL.replace(/\/+$/, '');
  const origin = site ?? new URL(import.meta.env.SITE ?? 'https://example.github.io');
  const abs = (path: string) => new URL(base + path, origin).href;
  const urls = pagePairs.flatMap((pair) => {
    const ru = abs(pair.ru);
    const en = abs(pair.en);
    return [pair.ru, pair.en].map((path) => {
      const loc = abs(path);
      return `  <url>
    <loc>${loc}</loc>
    <xhtml:link rel="alternate" hreflang="ru" href="${ru}"/>
    <xhtml:link rel="alternate" hreflang="en" href="${en}"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="${ru}"/>
  </url>`;
    });
  });

  const extra = ['/1-class/chtenie/razdatochnyy-material/'].map((path) =>
    '  <url>\n    <loc>' + abs(path) + '</loc>\n  </url>').join('\n');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.join('\n')}
${extra}
</urlset>
`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' }
  });
};
