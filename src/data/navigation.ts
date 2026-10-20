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

export const navigation: NavItem[] = [
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
      { label: 'Раздел в разработке', soon: true },
    ],
  },
  {
    label: '3 класс',
    path: '/3-class/',
    children: [{ label: 'Раздел в разработке', soon: true }],
  },
];

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
