import type { APIRoute } from 'astro';
import { readingThemes, textsLabel, worksLabel } from '../data/belarusianReadingThemes';
import { navigationByLang, type NavItem } from '../data/navigation';

interface SearchItem {
  k: 'work' | 'theme' | 'page';
  t: string;
  d?: string;
  u: string;
  x?: string;
}

const B = import.meta.env.BASE_URL;
const base = B.replace(/\/+$/, '');
const withBase = (path: string) => `${base}/${path.replace(/^\/+/, '')}`;

function walkNav(items: NavItem[], lang: string, trail: string[], out: Map<string, SearchItem>) {
  for (const item of items) {
    if (!item.path || item.soon) continue;
    if (item.path.startsWith('/2-class/belaruskaya-mova/tema/')) continue;
    const url = withBase(item.path);
    const key = `${lang}:${url}`;
    if (!out.has(key)) {
      out.set(key, {
        k: 'page',
        t: item.label,
        d: [...trail, item.desc || item.note].filter(Boolean).join(' · '),
        u: url,
      });
    }
    if (item.children) walkNav(item.children, lang, [...trail, item.label], out);
  }
}

export const GET: APIRoute = () => {
  const items = new Map<string, SearchItem>();

  items.set('home:ru', { k: 'page', t: 'Главная', d: 'VIVID·ШКОЛА', u: withBase('/') });
  items.set('home:en', { k: 'page', t: 'Home', d: 'VIVID·SCHOOL', u: withBase('/en/') });
  walkNav(navigationByLang.ru, 'ru', [], items);
  walkNav(navigationByLang.en, 'en', [], items);

  for (const theme of readingThemes) {
    for (const page of theme.pages) {
      const themeUrl = withBase(page.path);
      const counts = `${page.entryCount} ${worksLabel(page.entryCount)} · ${page.textCount} ${textsLabel(page.textCount)}`;
      if (!items.has(`theme:${themeUrl}`)) {
        items.set(`theme:${themeUrl}`, {
          k: 'theme',
          t: theme.title,
          d: `${page.label} · ${counts}`,
          u: themeUrl,
        });
      }
      page.category.entries.forEach((entry, index) => {
        const workUrl = `${themeUrl}#${theme.slug}-${page.grade}-${index}`;
        items.set(`work:${workUrl}`, {
          k: 'work',
          t: entry.text,
          d: `${page.label} · ${theme.title}`,
          u: workUrl,
          x: entry.body?.join(' ') || '',
        });
      });
    }
  }

  return new Response(JSON.stringify({ v: 1, items: [...items.values()] }), {
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
};
