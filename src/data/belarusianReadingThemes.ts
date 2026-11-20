import {
  belarusianReadingCatalog,
  type BelarusianReadingCategory,
} from './belarusianReadingCatalog';
import { publicDomainTexts } from './belarusianReadingPublicDomain';

export interface ReadingThemePage {
  grade: 2 | 3 | 4;
  label: string;
  title: string;
  slug: string;
  path: string;
  category: BelarusianReadingCategory;
  entryCount: number;
  textCount: number;
  available: boolean;
}

export interface ReadingTheme {
  title: string;
  slug: string;
  pages: ReadingThemePage[];
  entryCount: number;
  textCount: number;
}

export const readingHubPath = '/2-class/belaruskaya-mova/';

const translit: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'h', д: 'd', е: 'e', ё: 'yo', ж: 'zh',
  з: 'z', і: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o',
  п: 'p', р: 'r', с: 's', т: 't', у: 'u', ў: 'u', ф: 'f', х: 'kh',
  ц: 'ts', ч: 'ch', ш: 'sh', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
};

const slugOverrides: Record<string, string> = {
  'Маёй Радзімы дзіўны свет': 'mayey-radzimy-dzivny-svet',
};

export function readingSlug(title: string): string {
  if (slugOverrides[title]) return slugOverrides[title];
  return title
    .toLowerCase()
    .split('')
    .map((char) => translit[char] ?? char)
    .join('')
    .replace(/[’'«»“”„]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'tema';
}

export function plural(n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few;
  return many;
}

export const worksLabel = (n: number) => plural(n, 'твор', 'творы', 'твораў');
export const textsLabel = (n: number) => plural(n, 'тэкст', 'тэксты', 'тэкстаў');

function hydrateCategory(grade: number, category: BelarusianReadingCategory): BelarusianReadingCategory {
  const entries = category.entries.map((entry) => {
    const pd = publicDomainTexts[`${grade}|${category.title}|${entry.text}`];
    return pd ? { ...entry, body: pd.body, publicDomain: pd.source } : entry;
  });
  return { ...category, entries };
}

const themes = new Map<string, ReadingTheme>();
const usedSlugs = new Set<string>();

for (const cls of belarusianReadingCatalog) {
  for (const rawCategory of cls.categories) {
    const category = hydrateCategory(cls.grade, rawCategory);
    const title = category.title.trim();
    let theme = themes.get(title);
    if (!theme) {
      let slug = readingSlug(title);
      if (usedSlugs.has(slug)) slug = `${slug}-${cls.grade}`;
      usedSlugs.add(slug);
      theme = { title, slug, pages: [], entryCount: 0, textCount: 0 };
      themes.set(title, theme);
    }
    const textCount = category.entries.filter((entry) => entry.body && entry.body.length > 0).length;
    theme.pages.push({
      grade: cls.grade,
      label: cls.label,
      title,
      slug: theme.slug,
      path: `${readingHubPath}tema/${theme.slug}/${cls.grade}/`,
      category,
      entryCount: category.entries.length,
      textCount,
      available: true,
    });
    theme.entryCount += category.entries.length;
    theme.textCount += textCount;
  }
}

for (const theme of themes.values()) {
  for (const grade of [2, 3, 4] as const) {
    if (theme.pages.some((page) => page.grade === grade)) continue;
    theme.pages.push({
      grade,
      label: `${grade} клас`,
      title: theme.title,
      slug: theme.slug,
      path: `${readingHubPath}tema/${theme.slug}/${grade}/`,
      category: { title: theme.title, entries: [] },
      entryCount: 0,
      textCount: 0,
      available: false,
    });
  }
  theme.pages.sort((a, b) => a.grade - b.grade);
}

export const readingThemes: ReadingTheme[] = [...themes.values()];

export const readingThemePages: ReadingThemePage[] = readingThemes
  .flatMap((theme) => theme.pages)
  .sort((a, b) => a.grade - b.grade || a.title.localeCompare(b.title, 'be'));

export const readingThemesByGrade = belarusianReadingCatalog.map((cls) => {
  const themes = cls.categories.map((category) => {
    const theme = readingThemes.find((item) => item.title === category.title.trim())!;
    const page = theme.pages.find((item) => item.grade === cls.grade)!;
    return { theme, page };
  });
  return {
    grade: cls.grade,
    label: cls.label,
    entryCount: themes.reduce((total, item) => total + item.page.entryCount, 0),
    textCount: themes.reduce((total, item) => total + item.page.textCount, 0),
    themes,
  };
});

export function findReadingTheme(slug: string): ReadingTheme | undefined {
  return readingThemes.find((theme) => theme.slug === slug);
}
