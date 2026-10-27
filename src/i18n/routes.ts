import type { Lang } from './site';

export interface PagePair {
  kind: 'home' | 'trainer' | 'examples' | 'reading' | 'skill' | 'helper' | 'clock';
  ru: string;
  en: string;
}

export const pagePairs: PagePair[] = [
  { kind: 'home', ru: '/', en: '/en/' },
  { kind: 'examples', ru: '/2-class/matematika/razdatochnyy-material/', en: '/en/grade-2/math/worksheets/' },
  { kind: 'trainer', ru: '/2-class/matematika/primery/', en: '/en/grade-2/math/practice/' },
  { kind: 'skill', ru: '/2-class/matematika/razryady/', en: '/en/grade-2/math/place-value/' },
  { kind: 'skill', ru: '/2-class/matematika/sravnenie/', en: '/en/grade-2/math/comparison/' },
  { kind: 'skill', ru: '/2-class/matematika/skobki/', en: '/en/grade-2/math/brackets/' },
  { kind: 'skill', ru: '/2-class/matematika/velichiny/', en: '/en/grade-2/math/units/' },
  { kind: 'skill', ru: '/2-class/matematika/perimetr/', en: '/en/grade-2/math/perimeter/' },
  { kind: 'reading', ru: '/2-class/belaruskaya-mova/pazaklasnae-chytanne/', en: '/en/grade-2/belarusian/extracurricular-reading/' },
  { kind: 'reading', ru: '/2-class/belaruskaya-mova/zima/', en: '/en/grade-2/belarusian/winter/' },
  { kind: 'reading', ru: '/2-class/belaruskaya-mova/viasna/', en: '/en/grade-2/belarusian/spring/' },
  { kind: 'helper', ru: '/pomogator/', en: '/en/helper/' },
  { kind: 'clock', ru: '/pomogator/vremya/', en: '/en/helper/time/' }
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
