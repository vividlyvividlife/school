import type { Lang } from './site';

export type SkillId = 'digits' | 'compare' | 'brackets' | 'units' | 'perimeter';

export interface SkillCopy {
  meta: { title: string; description: string; keywords: string };
  h1: string;
  sub: string;
  rangeHint: string;
  chips: number[];
  tasks: Record<string, string>;
}

export const skillCommon = {
  ru: {
    rangeTitle: 'Диапазон',
    tasksTitle: 'Задания',
    tasksHint: 'Можно выбрать несколько.',
    signHint: 'Ответ — знак: меньше, равно или больше.',
    signLess: 'меньше',
    signEqual: 'равно',
    signMore: 'больше',
    noTasks: 'Выберите хотя бы одно задание',
    poolPrefix: 'В наборе: ',
    poolSuffix: ' вариантов',
    figShow: 'Показать фигуру',
    figHide: 'Скрыть фигуру',
    answerHint: 'Введи ответ и нажми OK.'
  },
  en: {
    rangeTitle: 'Range',
    tasksTitle: 'Tasks',
    tasksHint: 'You can choose several.',
    signHint: 'Answer with a sign: less than, equal to, or greater than.',
    signLess: 'less',
    signEqual: 'equal',
    signMore: 'greater',
    noTasks: 'Choose at least one task',
    poolPrefix: 'In the set: ',
    poolSuffix: ' variants',
    figShow: 'Show the shape',
    figHide: 'Hide the shape',
    answerHint: 'Type the answer and press OK.'
  }
} satisfies Record<Lang, Record<string, string>>;

export const skillCopy: Record<Lang, Record<SkillId, SkillCopy>> = {
  ru: {
    digits: {
      meta: {
        title: 'Разряды и двузначные числа — тренажёр',
        description: 'Тренажёр по математике для 2 класса: десятки и единицы, состав двузначных чисел, разложение на разрядные слагаемые.',
        keywords: 'разряды, десятки, единицы, двузначные числа, 2 класс, тренажёр, математика, состав числа'
      },
      h1: 'Разряды и двузначные числа',
      sub: 'Десятки и единицы, состав числа и запись по разрядам.',
      rangeHint: 'Числа от 10 до 99. «От» и «до» ограничивают двузначные числа.',
      chips: [20, 50, 99],
      tasks: {
        tens: 'Сколько десятков',
        ones: 'Сколько единиц',
        build: 'Число по разрядам',
        expand: 'Разложение',
        totalTens: 'Всего десятков'
      }
    },
    compare: {
      meta: {
        title: 'Сравнение чисел и выражений — тренажёр',
        description: 'Тренажёр по математике для 2 класса: сравнение чисел, сумм, разностей, произведений, частных, десятков и единиц, длин.',
        keywords: 'сравнение чисел, больше меньше равно, 2 класс, тренажёр, математика, выражения'
      },
      h1: 'Сравнение',
      sub: 'Числа, выражения, десятки и единицы, длины.',
      rangeHint: 'Диапазон ограничивает все сравнения: числа, суммы, разности, произведения, частные, десятки и единицы, длины.',
      chips: [10, 20, 50, 100],
      tasks: {
        numbers: 'Числа',
        sums: 'Суммы',
        diffs: 'Разности',
        products: 'Произведения',
        quotients: 'Частные',
        tensUnits: 'Десятки и единицы',
        lengths: 'Длины'
      }
    },
    brackets: {
      meta: {
        title: 'Скобки и порядок действий — тренажёр',
        description: 'Тренажёр по математике для 2 класса: выражения со скобками и цепочки действий в пределах 100.',
        keywords: 'скобки, порядок действий, выражения, 2 класс, тренажёр, математика'
      },
      h1: 'Скобки и порядок действий',
      sub: 'Выражения со скобками и цепочки действий.',
      rangeHint: 'Числа и значения выражений — от 1 до 100.',
      chips: [20, 50, 100],
      tasks: {
        brackets: 'Со скобками',
        chains: 'Цепочки'
      }
    },
    units: {
      meta: {
        title: 'Величины: длина — тренажёр',
        description: 'Тренажёр по математике для 2 класса: метры, дециметры и сантиметры — перевод единиц и вычисления.',
        keywords: 'единицы длины, метр, дециметр, сантиметр, 2 класс, тренажёр, математика'
      },
      h1: 'Величины: длина',
      sub: 'Метры, дециметры и сантиметры — перевод и вычисления.',
      rangeHint: 'Длины от 1 до 10 000 см; по умолчанию — до 100 см. Ответы в сантиметрах или дециметрах.',
      chips: [100, 1000, 10000],
      tasks: {
        convert: 'Перевод единиц',
        addsub: 'Сложение и вычитание'
      }
    },
    perimeter: {
      meta: {
        title: 'Периметр — тренажёр',
        description: 'Тренажёр по математике для 2 класса: периметр треугольника, прямоугольника, квадрата и других многоугольников.',
        keywords: 'периметр, многоугольник, прямоугольник, квадрат, 2 класс, тренажёр, математика'
      },
      h1: 'Периметр',
      sub: 'Найди сумму длин всех сторон фигуры.',
      rangeHint: 'Длины сторон — от 1 до 20 см. Ответ — в сантиметрах.',
      chips: [5, 10, 20],
      tasks: {
        triangle: 'Треугольник',
        quad: 'Четырёхугольник',
        rectangle: 'Прямоугольник',
        square: 'Квадрат',
        pentagon: 'Пятиугольник',
        hexagon: 'Шестиугольник'
      }
    }
  },
  en: {
    digits: {
      meta: {
        title: 'Place value and two-digit numbers — trainer',
        description: 'Grade 2 math trainer: tens and ones, two-digit number composition, expanded form.',
        keywords: 'place value, tens, ones, two-digit numbers, grade 2, math trainer'
      },
      h1: 'Place value and two-digit numbers',
      sub: 'Tens and ones, number composition, and expanded form.',
      rangeHint: 'Numbers from 10 to 99. “From” and “to” limit the two-digit numbers.',
      chips: [20, 50, 99],
      tasks: {
        tens: 'How many tens',
        ones: 'How many ones',
        build: 'Build the number',
        expand: 'Expanded form',
        totalTens: 'Tens in total'
      }
    },
    compare: {
      meta: {
        title: 'Comparing numbers and expressions — trainer',
        description: 'Grade 2 math trainer: compare numbers, sums, differences, products, quotients, tens and ones, lengths.',
        keywords: 'comparing numbers, greater less equal, grade 2, math trainer, expressions'
      },
      h1: 'Comparison',
      sub: 'Numbers, expressions, tens and ones, lengths.',
      rangeHint: 'The range bounds every comparison: numbers, sums, differences, products, quotients, tens and ones, lengths.',
      chips: [10, 20, 50, 100],
      tasks: {
        numbers: 'Numbers',
        sums: 'Sums',
        diffs: 'Differences',
        products: 'Products',
        quotients: 'Quotients',
        tensUnits: 'Tens and ones',
        lengths: 'Lengths'
      }
    },
    brackets: {
      meta: {
        title: 'Brackets and order of operations — trainer',
        description: 'Grade 2 math trainer: expressions with brackets and action chains within 100.',
        keywords: 'brackets, order of operations, expressions, grade 2, math trainer'
      },
      h1: 'Brackets and order of operations',
      sub: 'Expressions with brackets and chains of actions.',
      rangeHint: 'Numbers and expression values range from 1 to 100.',
      chips: [20, 50, 100],
      tasks: {
        brackets: 'With brackets',
        chains: 'Chains'
      }
    },
    units: {
      meta: {
        title: 'Units of length — trainer',
        description: 'Grade 2 math trainer: metres, decimetres and centimetres — conversions and calculations.',
        keywords: 'units of length, metre, decimetre, centimetre, grade 2, math trainer'
      },
      h1: 'Units of length',
      sub: 'Metres, decimetres and centimetres — conversions and calculations.',
      rangeHint: 'Lengths from 1 to 10,000 cm; default is up to 100 cm. Answers are in centimetres or decimetres.',
      chips: [100, 1000, 10000],
      tasks: {
        convert: 'Unit conversion',
        addsub: 'Addition and subtraction'
      }
    },
    perimeter: {
      meta: {
        title: 'Perimeter — trainer',
        description: 'Grade 2 math trainer: perimeter of triangles, rectangles, squares and other polygons.',
        keywords: 'perimeter, polygon, rectangle, square, grade 2, math trainer'
      },
      h1: 'Perimeter',
      sub: 'Find the sum of all side lengths of a shape.',
      rangeHint: 'Side lengths from 1 to 20 cm. The answer is in centimetres.',
      chips: [5, 10, 20],
      tasks: {
        triangle: 'Triangle',
        quad: 'Quadrilateral',
        rectangle: 'Rectangle',
        square: 'Square',
        pentagon: 'Pentagon',
        hexagon: 'Hexagon'
      }
    }
  }
};
