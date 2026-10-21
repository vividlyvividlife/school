import type { Lang } from './site';

export interface PagePair {
  kind: 'home' | 'trainer' | 'examples' | 'reading';
  ru: string;
  en: string;
}

export const pagePairs: PagePair[] = [
  { kind: 'home', ru: '/', en: '/en/' },
  { kind: 'examples', ru: '/2-class/matematika/razdatochnyy-material/', en: '/en/grade-2/math/worksheets/' },
  { kind: 'trainer', ru: '/2-class/matematika/primery/', en: '/en/grade-2/math/practice/' },
  { kind: 'reading', ru: '/2-class/belaruskaya-mova/pazaklasnae-chytanne/', en: '/en/grade-2/belarusian/extracurricular-reading/' }
];

export function pagePairFor(path: string): PagePair {
  return pagePairs.find((pair) => pair.ru === path || pair.en === path) ?? pagePairs[0];
}

export function routeFor(pair: PagePair, lang: Lang): string {
  return pair[lang];
}

export function alternateRoute(path: string, lang: Lang): string {
  return routeFor(pagePairFor(path), lang);
}

export function languageFromRoute(path: string): Lang {
  return path === '/en' || path.startsWith('/en/') ? 'en' : 'ru';
}
