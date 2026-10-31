import type { Lang } from '../i18n/site';

export interface NavItem {
  label: string;
  path?: string;
  page?: string;
  soon?: boolean;
  desc?: string;
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
            desc: 'Печатные карточки по всем темам',
          },
          {
            label: 'Примеры',
            path: '/2-class/matematika/primery/',
            page: 'trainer',
            desc: 'Тренажёр устного счёта',
          },
          {
            label: 'Разряды и двузначные числа',
            path: '/2-class/matematika/razryady/',
            page: 'trainer',
            desc: 'Десятки и единицы, разряды',
          },
          {
            label: 'Сравнение',
            path: '/2-class/matematika/sravnenie/',
            page: 'trainer',
            desc: 'Больше, меньше, равно',
          },
          {
            label: 'Скобки и порядок действий',
            path: '/2-class/matematika/skobki/',
            page: 'trainer',
            desc: 'Порядок действий и скобки',
          },
          {
            label: 'Величины: длина',
            path: '/2-class/matematika/velichiny/',
            page: 'trainer',
            desc: 'м, дм, см: перевод и вычисления',
          },
          {
            label: 'Периметр',
            path: '/2-class/matematika/perimetr/',
            page: 'trainer',
            desc: 'Периметр фигур',
          },
          {
            label: 'Задачи',
            path: '/2-class/matematika/zadachi/',
            page: 'trainer',
            desc: 'Текстовые задачи с разбором',
          },
          {
            label: 'Ломаные',
            path: '/2-class/matematika/lomanye/',
            page: 'trainer',
            desc: 'Длина ломаной по звеньям',
          },
          {
            label: 'Уравнения',
            path: '/2-class/matematika/uravneniya/',
            page: 'trainer',
            desc: 'Неизвестное число в уравнении',
          },
          {
            label: 'Деление с остатком',
            path: '/2-class/matematika/delenie-s-ostatkom/',
            page: 'trainer',
            desc: 'Частное, остаток, делимое, делитель',
          },
          {
            label: 'Площадь и объём',
            path: '/2-class/matematika/ploshchad-i-obem/',
            page: 'trainer',
            desc: 'Площадь прямоугольника, объём фигуры',
          },
          {
            label: 'Операции и алгоритмы',
            path: '/2-class/matematika/operacii-i-algoritmy/',
            page: 'trainer',
            desc: 'Обратные операции и программы действий',
          },
          {
            label: 'Чётные, нечётные, кратные',
            path: '/2-class/matematika/delimost/',
            page: 'trainer',
            desc: 'Чётность чисел и кратные',
          },
          {
            label: 'Геометрия',
            path: '/2-class/matematika/geometriya/',
            page: 'trainer',
            desc: 'Отрезки, лучи, окружность',
          },
          {
            label: 'Тысяча и трёхзначные',
            path: '/2-class/matematika/tysyacha/',
            page: 'trainer',
            desc: 'Разряды трёхзначных чисел',
          },
          {
            label: 'Круглые числа',
            path: '/2-class/matematika/kruglye-chisla/',
            page: 'trainer',
            desc: '× и ÷ на 10 и 100',
          },
          {
            label: 'Дерево возможностей',
            path: '/2-class/matematika/derevo-vozmozhnostey/',
            page: 'trainer',
            desc: 'Перебор вариантов',
          },
        ],
      },
      {
        label: 'Літаратурнае чытанне',
        path: '/2-class/belaruskaya-mova/',
        children: [
          {
            label: 'Восень',
            path: '/2-class/belaruskaya-mova/pazaklasnae-chytanne/',
            page: 'reading',
            desc: 'Спіс твораў з тэкстамі',
          },
          {
            label: 'Зіма',
            path: '/2-class/belaruskaya-mova/zima/',
            page: 'reading',
            desc: 'Спіс твораў з тэкстамі',
          },
          {
            label: 'Вясна',
            path: '/2-class/belaruskaya-mova/viasna/',
            page: 'reading',
            desc: 'Спіс твораў з тэкстамі',
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
  {
    label: 'Помогатор',
    children: [
      {
        label: 'Таймер уроков',
        path: '/pomogator/',
        page: 'helper',
        desc: 'Стрелочные часы и расписание уроков',
      },
      {
        label: 'Тренажёр времени',
        path: '/pomogator/vremya/',
        page: 'clock',
        desc: 'Часы и минуты: чтение, задачи, на время',
      },
    ],
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
            desc: 'Printable cards for all topics',
          },
          {
            label: 'Practice',
            path: '/en/grade-2/math/practice/',
            page: 'trainer',
            desc: 'Mental math trainer',
          },
          {
            label: 'Place value',
            path: '/en/grade-2/math/place-value/',
            page: 'trainer',
            desc: 'Tens, ones and place value',
          },
          {
            label: 'Comparison',
            path: '/en/grade-2/math/comparison/',
            page: 'trainer',
            desc: 'Greater, less, equal',
          },
          {
            label: 'Brackets',
            path: '/en/grade-2/math/brackets/',
            page: 'trainer',
            desc: 'Order of operations and brackets',
          },
          {
            label: 'Units of length',
            path: '/en/grade-2/math/units/',
            page: 'trainer',
            desc: 'm, dm, cm: convert and calculate',
          },
          {
            label: 'Perimeter',
            path: '/en/grade-2/math/perimeter/',
            page: 'trainer',
            desc: 'Perimeter of shapes',
          },
          {
            label: 'Word problems',
            path: '/en/grade-2/math/word-problems/',
            page: 'trainer',
            desc: 'Word problems with a breakdown',
          },
          {
            label: 'Polylines',
            path: '/en/grade-2/math/polylines/',
            page: 'trainer',
            desc: 'Length of a polyline',
          },
          {
            label: 'Equations',
            path: '/en/grade-2/math/equations/',
            page: 'trainer',
            desc: 'Find the unknown number',
          },
          {
            label: 'Division with remainder',
            path: '/en/grade-2/math/remainders/',
            page: 'trainer',
            desc: 'Quotient, remainder, dividend, divisor',
          },
          {
            label: 'Area and volume',
            path: '/en/grade-2/math/area-and-volume/',
            page: 'trainer',
            desc: 'Rectangle area, volume of a box',
          },
          {
            label: 'Operations and algorithms',
            path: '/en/grade-2/math/operations-and-algorithms/',
            page: 'trainer',
            desc: 'Inverse operations and action programs',
          },
          {
            label: 'Even, odd and multiples',
            path: '/en/grade-2/math/divisibility/',
            page: 'trainer',
            desc: 'Parity and multiples',
          },
          {
            label: 'Geometry',
            path: '/en/grade-2/math/geometry/',
            page: 'trainer',
            desc: 'Segments, rays, circles',
          },
          {
            label: 'Thousand and three-digit',
            path: '/en/grade-2/math/three-digit-numbers/',
            page: 'trainer',
            desc: 'Place value of three-digit numbers',
          },
          {
            label: 'Round numbers',
            path: '/en/grade-2/math/round-numbers/',
            page: 'trainer',
            desc: '× and ÷ by 10 and 100',
          },
          {
            label: 'Tree of possibilities',
            path: '/en/grade-2/math/tree-of-possibilities/',
            page: 'trainer',
            desc: 'Listing options',
          },
        ],
      },
      {
        label: 'Literary Reading',
        path: '/en/grade-2/belarusian/',
        children: [
          {
            label: 'Autumn',
            path: '/en/grade-2/belarusian/extracurricular-reading/',
            page: 'reading',
            desc: 'Reading list with full texts',
          },
          {
            label: 'Winter',
            path: '/en/grade-2/belarusian/winter/',
            page: 'reading',
            desc: 'Reading list with full texts',
          },
          {
            label: 'Spring',
            path: '/en/grade-2/belarusian/spring/',
            page: 'reading',
            desc: 'Reading list with full texts',
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
  {
    label: 'Helper',
    children: [
      {
        label: 'Lesson timer',
        path: '/en/helper/',
        page: 'helper',
        desc: 'Analog clock and lesson schedule',
      },
      {
        label: 'Time trainer',
        path: '/en/helper/time/',
        page: 'clock',
        desc: 'Clocks and minutes: read, calculate, timed',
      },
    ],
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
