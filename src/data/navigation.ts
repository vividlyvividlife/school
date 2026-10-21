import type { Lang } from '../i18n/site';

export interface NavItem {
  label: string;
  path?: string;
  page?: string;
  soon?: boolean;
  children?: NavItem[];
}

export function normalizePath(value: string): string {
  const path = '/' + value.replace(/^\/+/, '').replace(/\/+$/, '');
  return path === '/' ? '/' : path + '/';
}

const navigationRu: NavItem[] = [
  {
    label: '2 класс',
    path: '/2-class/',
    children: [
      {
        label: 'Математика',
        path: '/2-class/matematika/',
        children: [
          {
            label: 'Раздаточный материал',
            path: '/2-class/matematika/razdatochnyy-material/',
            page: 'examples',
          },
          {
            label: 'Примеры',
            path: '/2-class/matematika/primery/',
            page: 'trainer',
          },
        ],
      },
      {
        label: 'Беларуская мова',
        path: '/2-class/belaruskaya-mova/',
        children: [
          {
            label: 'Пазакласнае чытанне',
            path: '/2-class/belaruskaya-mova/pazaklasnae-chytanne/',
            page: 'reading',
          },
        ],
      },
      { label: 'Раздел в разработке', soon: true },
    ],
  },
  {
    label: '3 класс',
    path: '/3-class/',
    children: [{ label: 'Раздел в разработке', soon: true }],
  },
];

const navigationEn: NavItem[] = [
  {
    label: 'Grade 2',
    path: '/en/grade-2/',
    children: [
      {
        label: 'Math',
        path: '/en/grade-2/math/',
        children: [
          {
            label: 'Worksheets',
            path: '/en/grade-2/math/worksheets/',
            page: 'examples',
          },
          {
            label: 'Practice',
            path: '/en/grade-2/math/practice/',
            page: 'trainer',
          },
        ],
      },
      {
        label: 'Belarusian',
        path: '/en/grade-2/belarusian/',
        children: [
          {
            label: 'Extracurricular reading',
            path: '/en/grade-2/belarusian/extracurricular-reading/',
            page: 'reading',
          },
        ],
      },
      { label: 'Coming soon', soon: true },
    ],
  },
  {
    label: 'Grade 3',
    path: '/en/grade-3/',
    children: [{ label: 'Coming soon', soon: true }],
  },
];

export const navigationByLang: Record<Lang, NavItem[]> = {
  ru: navigationRu,
  en: navigationEn,
};

export const navigation = navigationRu;

export function findTrail(
  items: NavItem[],
  target: string,
  trail: NavItem[] = [],
): NavItem[] | null {
  for (const item of items) {
    const next = [...trail, item];
    if (item.path && normalizePath(item.path) === target) return next;
    if (item.children) {
      const found = findTrail(item.children, target, next);
      if (found) return found;
    }
  }
  return null;
}
