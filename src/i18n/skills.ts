import type { Lang } from './site';

export type SkillId = 'digits' | 'compare' | 'brackets' | 'units' | 'perimeter' | 'problems' | 'polylines'
  | 'equations' | 'remainders' | 'area' | 'operations' | 'divisibility'
  | 'geometry' | 'thousand' | 'round' | 'tree';

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
        description: 'Тренажёр по математике для 2 класса: миллиметры, сантиметры, дециметры, метры и километры — перевод единиц и вычисления.',
        keywords: 'единицы длины, миллиметр, метр, дециметр, сантиметр, километр, 2 класс, тренажёр, математика'
      },
      h1: 'Величины: длина',
      sub: 'Миллиметры, сантиметры, дециметры, метры и километры — перевод и вычисления.',
      rangeHint: 'Длины от 1 до 10 000 см; по умолчанию — до 100 см. Ответы в сантиметрах или дециметрах.',
      chips: [100, 1000, 10000],
      tasks: {
        convert: 'Перевод единиц',
        addsub: 'Сложение и вычитание',
        millimeters: 'Миллиметры и сантиметры',
        kilometers: 'Километры и метры'
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
    },
    problems: {
      meta: {
        title: 'Задачи — тренажёр',
        description: 'Тренажёр по математике для 2 класса: текстовые задачи в одно и два действия — на сложение, вычитание, умножение и деление, цена, «в … раз», возраст, уравнивание.',
        keywords: 'задачи, текстовые задачи, 2 класс, тренажёр, математика, цена, умножение, деление, Петерсон'
      },
      h1: 'Задачи',
      sub: 'Текстовые задачи с картинкой и разбором в аккордеоне.',
      rangeHint: 'Числа и ответы — до 100. Если задача не помещается в «до», числа уменьшатся автоматически.',
      chips: [20, 50, 100],
      tasks: {
        total: 'Всего',
        leftover: 'Осталось',
        arriveLeave: 'Приехали и уехали',
        reverse: 'Обратная',
        difference: 'На сколько больше',
        moreBy: 'На … больше',
        lessBy: 'На … меньше',
        twoGroups: 'Две группы',
        diffTotal: 'Разница и сумма',
        mulAdd: 'Умножение и плюс',
        price: 'Цена',
        mulTotal: 'По … в каждом',
        share: 'Делёж поровну',
        groups: 'Сколько групп',
        timesMore: 'В … раз больше',
        timesLess: 'В … раз меньше',
        timesCompare: 'Во сколько раз',
        sumDiff: 'Возраст',
        equalize: 'Уравнять',
        wasUnknown: 'Было сначала'
      }
    },
    polylines: {
      meta: {
        title: 'Ломаные — тренажёр',
        description: 'Тренажёр по математике для 2 класса: длина ломаной — сумма длин всех звеньев. В раздатке — начертить отрезок такой длины.',
        keywords: 'ломаная, длина ломаной, звенья, 2 класс, тренажёр, математика, отрезок'
      },
      h1: 'Ломаные',
      sub: 'Найди длину ломаной — сумму длин всех звеньев.',
      rangeHint: 'Длины звеньев — от 1 до 20 см; по умолчанию до 10 см.',
      chips: [5, 10, 20],
      tasks: {
        open3: '3 звена',
        open4: '4 звена',
        open5: '5 звеньев',
        mixed: 'Разные'
      }
    },
    equations: {
      meta: {
        title: 'Уравнения — тренажёр',
        description: 'Тренажёр по математике для 2 класса: уравнения с неизвестным слагаемым, уменьшаемым, вычитаемым, множителем, делимым и делителем.',
        keywords: 'уравнения, неизвестное число, 2 класс, тренажёр, математика, Петерсон'
      },
      h1: 'Уравнения',
      sub: 'Найди неизвестное число в уравнении.',
      rangeHint: 'Числа и ответы — от 1 до 100.',
      chips: [20, 50, 100],
      tasks: {
        plus: 'Слагаемое',
        minus: 'Уменьшаемое',
        subFrom: 'Вычитаемое',
        times: 'Множитель',
        divide: 'Делимое',
        divBy: 'Делитель'
      }
    },
    remainders: {
      meta: {
        title: 'Деление с остатком — тренажёр',
        description: 'Тренажёр по математике для 2 класса: деление с остатком — частное, остаток, делимое и делитель.',
        keywords: 'деление с остатком, частное, остаток, 2 класс, тренажёр, математика, Петерсон'
      },
      h1: 'Деление с остатком',
      sub: 'Найди частное, остаток, делимое или делитель.',
      rangeHint: 'Делимое — от 10 до 100; делитель — от 2 до 9.',
      chips: [20, 50, 100],
      tasks: {
        quotient: 'Частное',
        remainder: 'Остаток',
        dividend: 'Делимое',
        divisor: 'Делитель'
      }
    },
    area: {
      meta: {
        title: 'Площадь и объём — тренажёр',
        description: 'Тренажёр по математике для 2 класса: площадь прямоугольника и квадрата, сторона по площади, объём фигуры.',
        keywords: 'площадь, объём, прямоугольник, квадрат, 2 класс, тренажёр, математика, Петерсон'
      },
      h1: 'Площадь и объём',
      sub: 'Площадь прямоугольника и квадрата, объём фигуры.',
      rangeHint: 'Стороны — от 1 до 20 см. Площадь — в см², объём — в см³.',
      chips: [5, 10, 20],
      tasks: {
        rectangle: 'Площадь прямоугольника',
        square: 'Площадь квадрата',
        side: 'Сторона по площади',
        volume: 'Объём'
      }
    },
    operations: {
      meta: {
        title: 'Операции и алгоритмы — тренажёр',
        description: 'Тренажёр по математике для 2 класса: операции и обратные операции, программы действий — прямой и обратный ход.',
        keywords: 'операции, обратные операции, программа действий, алгоритм, 2 класс, тренажёр, математика, Петерсон'
      },
      h1: 'Операции и алгоритмы',
      sub: 'Операции, обратные операции и программы действий.',
      rangeHint: 'Числа и результаты — от 1 до 100.',
      chips: [20, 50, 100],
      tasks: {
        result1: 'Одна операция',
        result2: 'Программа из двух действий',
        result3: 'Программа из трёх действий',
        start1: 'Обратная операция',
        start2: 'Обратная программа',
        start3: 'Обратная программа из трёх действий'
      }
    },
    divisibility: {
      meta: {
        title: 'Чётные, нечётные, кратные — тренажёр',
        description: 'Тренажёр по математике для 2 класса: чётные и нечётные числа, числа, кратные данному.',
        keywords: 'чётные и нечётные числа, кратные, делимость, 2 класс, тренажёр, математика, Петерсон'
      },
      h1: 'Чётные, нечётные, кратные',
      sub: 'Чётность чисел и кратные числа.',
      rangeHint: 'Числа — от 1 до 100.',
      chips: [20, 50, 100],
      tasks: {
        nextEven: 'Следующее чётное',
        nextOdd: 'Следующее нечётное',
        prevEven: 'Предыдущее чётное',
        prevOdd: 'Предыдущее нечётное',
        multipleNext: 'Кратное после числа',
        multiplePrev: 'Кратное перед числом',
        countEven: 'Сколько чётных'
      }
    },
    geometry: {
      meta: {
        title: 'Геометрия: точки, отрезки, окружность — тренажёр',
        description: 'Тренажёр по математике для 2 класса: отрезки и лучи, точки пересечения, радиус и диаметр окружности.',
        keywords: 'геометрия, отрезок, луч, точки пересечения, окружность, радиус, диаметр, 2 класс, тренажёр'
      },
      h1: 'Геометрия',
      sub: 'Отрезки и лучи, пересечения прямых, окружность.',
      rangeHint: 'Длины и числа — от 1 до 20. Диаметр не больше 40.',
      chips: [5, 10, 20],
      tasks: {
        segments: 'Сколько отрезков',
        rays: 'Сколько лучей',
        intersections: 'Точки пересечения',
        diameter: 'Диаметр по радиусу',
        radius: 'Радиус по диаметру'
      }
    },
    thousand: {
      meta: {
        title: 'Тысяча и трёхзначные числа — тренажёр',
        description: 'Тренажёр по математике для 2 класса: сотни, десятки и единицы, состав трёхзначного числа, сложение и вычитание сотен.',
        keywords: 'трёхзначные числа, тысяча, сотни, десятки, единицы, разряды, 2 класс, тренажёр'
      },
      h1: 'Тысяча и трёхзначные числа',
      sub: 'Разряды трёхзначного числа и действия с сотнями.',
      rangeHint: 'Числа от 100 до 999.',
      chips: [200, 500, 999],
      tasks: {
        hundreds: 'Сколько сотен',
        tens: 'Всего десятков',
        ones: 'Сколько единиц',
        build: 'Число по разрядам',
        expand: 'Разложение',
        roundAdd: 'Сотни плюс десятки',
        roundSub: 'Сотни минус десятки'
      }
    },
    round: {
      meta: {
        title: 'Круглые числа и ×/÷ на 10 и 100 — тренажёр',
        description: 'Тренажёр по математике для 2 класса: умножение и деление на 10 и 100, действия с круглыми числами.',
        keywords: 'круглые числа, умножение на 10, деление на 10, умножение на 100, 2 класс, тренажёр'
      },
      h1: 'Круглые числа',
      sub: 'Умножение и деление на 10 и 100, действия с круглыми числами.',
      rangeHint: 'Множимое и делимое — от 1 до 99.',
      chips: [10, 50, 99],
      tasks: {
        timesTen: 'Умножить на 10',
        divTen: 'Разделить на 10',
        timesHundred: 'Умножить на 100',
        divHundred: 'Разделить на 100',
        roundMul: 'Круглое × однозначное',
        roundDiv: 'Круглое ÷ круглое'
      }
    },
    tree: {
      meta: {
        title: 'Дерево возможностей — тренажёр',
        description: 'Тренажёр по математике для 2 класса: перебор вариантов, дерево возможностей, комбинаторные задачи.',
        keywords: 'дерево возможностей, перебор вариантов, комбинаторика, 2 класс, тренажёр'
      },
      h1: 'Дерево возможностей',
      sub: 'Перебор вариантов и подсчёт комбинаций.',
      rangeHint: 'Количество вариантов в каждой группе — от 2 до 6.',
      chips: [2, 4, 6],
      tasks: {
        pairs: 'Пары из двух групп',
        three: 'Набор из трёх групп',
        paths: 'Пути через мост',
        digits: 'Двузначные из цифр'
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
        description: 'Grade 2 math trainer: millimetres, centimetres, decimetres, metres and kilometres — conversions and calculations.',
        keywords: 'units of length, millimetre, metre, decimetre, centimetre, kilometre, grade 2, math trainer'
      },
      h1: 'Units of length',
      sub: 'Millimetres, centimetres, decimetres, metres and kilometres — conversions and calculations.',
      rangeHint: 'Lengths from 1 to 10,000 cm; default is up to 100 cm. Answers are in centimetres or decimetres.',
      chips: [100, 1000, 10000],
      tasks: {
        convert: 'Unit conversion',
        addsub: 'Addition and subtraction',
        millimeters: 'Millimetres and centimetres',
        kilometers: 'Kilometres and metres'
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
    },
    problems: {
      meta: {
        title: 'Word problems — trainer',
        description: 'Grade 2 math trainer: one- and two-step word problems — addition, subtraction, multiplication and division, price, “times as many”, ages, equalising.',
        keywords: 'word problems, grade 2, math trainer, price, multiplication, division'
      },
      h1: 'Word problems',
      sub: 'Word problems with a picture and a solution breakdown.',
      rangeHint: 'Numbers and answers up to 100. If a problem does not fit the “to” limit, the numbers shrink automatically.',
      chips: [20, 50, 100],
      tasks: {
        total: 'Total',
        leftover: 'Left over',
        arriveLeave: 'Arrived and left',
        reverse: 'Reverse',
        difference: 'How many more',
        moreBy: 'More by',
        lessBy: 'Fewer by',
        twoGroups: 'Two groups',
        diffTotal: 'Difference and total',
        mulAdd: 'Multiply and add',
        price: 'Price',
        mulTotal: 'Equal groups',
        share: 'Share equally',
        groups: 'How many groups',
        timesMore: 'Times as many',
        timesLess: 'Times fewer',
        timesCompare: 'How many times',
        sumDiff: 'Ages',
        equalize: 'Make equal',
        wasUnknown: 'At first'
      }
    },
    polylines: {
      meta: {
        title: 'Polylines — trainer',
        description: 'Grade 2 math trainer: the length of a polyline is the sum of all its links. The worksheet asks to draw a segment of that length.',
        keywords: 'polyline, length, links, grade 2, math trainer, segment'
      },
      h1: 'Polylines',
      sub: 'Find the length of a polyline — the sum of all its links.',
      rangeHint: 'Link lengths from 1 to 20 cm; default is up to 10 cm.',
      chips: [5, 10, 20],
      tasks: {
        open3: '3 links',
        open4: '4 links',
        open5: '5 links',
        mixed: 'Mixed'
      }
    },
    equations: {
      meta: {
        title: 'Equations — trainer',
        description: 'Grade 2 math trainer: equations with an unknown addend, minuend, subtrahend, factor, dividend or divisor.',
        keywords: 'equations, unknown number, grade 2, math trainer'
      },
      h1: 'Equations',
      sub: 'Find the unknown number in each equation.',
      rangeHint: 'Numbers and answers from 1 to 100.',
      chips: [20, 50, 100],
      tasks: {
        plus: 'Addend',
        minus: 'Minuend',
        subFrom: 'Subtrahend',
        times: 'Factor',
        divide: 'Dividend',
        divBy: 'Divisor'
      }
    },
    remainders: {
      meta: {
        title: 'Division with remainder — trainer',
        description: 'Grade 2 math trainer: division with remainder — quotient, remainder, dividend and divisor.',
        keywords: 'division with remainder, quotient, remainder, grade 2, math trainer'
      },
      h1: 'Division with remainder',
      sub: 'Find the quotient, remainder, dividend or divisor.',
      rangeHint: 'Dividend from 10 to 100; divisor from 2 to 9.',
      chips: [20, 50, 100],
      tasks: {
        quotient: 'Quotient',
        remainder: 'Remainder',
        dividend: 'Dividend',
        divisor: 'Divisor'
      }
    },
    area: {
      meta: {
        title: 'Area and volume — trainer',
        description: 'Grade 2 math trainer: area of rectangles and squares, missing side, volume of a box.',
        keywords: 'area, volume, rectangle, square, grade 2, math trainer'
      },
      h1: 'Area and volume',
      sub: 'Area of rectangles and squares, volume of a box.',
      rangeHint: 'Sides from 1 to 20 cm. Area is in cm², volume in cm³.',
      chips: [5, 10, 20],
      tasks: {
        rectangle: 'Rectangle area',
        square: 'Square area',
        side: 'Missing side',
        volume: 'Volume'
      }
    },
    operations: {
      meta: {
        title: 'Operations and algorithms — trainer',
        description: 'Grade 2 math trainer: operations and inverse operations, action programs — forward and backward.',
        keywords: 'operations, inverse operations, action program, algorithm, grade 2, math trainer'
      },
      h1: 'Operations and algorithms',
      sub: 'Operations, inverse operations and action programs.',
      rangeHint: 'Numbers and results from 1 to 100.',
      chips: [20, 50, 100],
      tasks: {
        result1: 'One operation',
        result2: 'Two-step program',
        result3: 'Three-step program',
        start1: 'Inverse operation',
        start2: 'Inverse program',
        start3: 'Three-step inverse program'
      }
    },
    divisibility: {
      meta: {
        title: 'Even, odd and multiples — trainer',
        description: 'Grade 2 math trainer: even and odd numbers, multiples of a number.',
        keywords: 'even and odd numbers, multiples, divisibility, grade 2, math trainer'
      },
      h1: 'Even, odd and multiples',
      sub: 'Parity of numbers and multiples.',
      rangeHint: 'Numbers from 1 to 100.',
      chips: [20, 50, 100],
      tasks: {
        nextEven: 'Next even',
        nextOdd: 'Next odd',
        prevEven: 'Previous even',
        prevOdd: 'Previous odd',
        multipleNext: 'Multiple after',
        multiplePrev: 'Multiple before',
        countEven: 'How many even'
      }
    },
    geometry: {
      meta: {
        title: 'Geometry: points, segments, circles — trainer',
        description: 'Grade 2 math trainer: segments and rays, intersection points, radius and diameter.',
        keywords: 'geometry, segment, ray, intersection points, circle, radius, diameter, grade 2, math trainer'
      },
      h1: 'Geometry',
      sub: 'Segments and rays, line intersections, circles.',
      rangeHint: 'Lengths and numbers from 1 to 20. Diameter up to 40.',
      chips: [5, 10, 20],
      tasks: {
        segments: 'How many segments',
        rays: 'How many rays',
        intersections: 'Intersection points',
        diameter: 'Diameter from radius',
        radius: 'Radius from diameter'
      }
    },
    thousand: {
      meta: {
        title: 'The thousand and three-digit numbers — trainer',
        description: 'Grade 2 math trainer: hundreds, tens and ones, three-digit number composition, adding and subtracting hundreds.',
        keywords: 'three-digit numbers, thousand, hundreds, tens, ones, place value, grade 2, math trainer'
      },
      h1: 'The thousand and three-digit numbers',
      sub: 'Place value of three-digit numbers and operations with hundreds.',
      rangeHint: 'Numbers from 100 to 999.',
      chips: [200, 500, 999],
      tasks: {
        hundreds: 'How many hundreds',
        tens: 'Tens in total',
        ones: 'How many ones',
        build: 'Build the number',
        expand: 'Expanded form',
        roundAdd: 'Hundreds plus tens',
        roundSub: 'Hundreds minus tens'
      }
    },
    round: {
      meta: {
        title: 'Round numbers and ×/÷ by 10 and 100 — trainer',
        description: 'Grade 2 math trainer: multiplying and dividing by 10 and 100, operations with round numbers.',
        keywords: 'round numbers, multiply by 10, divide by 10, multiply by 100, grade 2, math trainer'
      },
      h1: 'Round numbers',
      sub: 'Multiplying and dividing by 10 and 100, operations with round numbers.',
      rangeHint: 'Multiplicand and dividend from 1 to 99.',
      chips: [10, 50, 99],
      tasks: {
        timesTen: 'Multiply by 10',
        divTen: 'Divide by 10',
        timesHundred: 'Multiply by 100',
        divHundred: 'Divide by 100',
        roundMul: 'Round × one-digit',
        roundDiv: 'Round ÷ round'
      }
    },
    tree: {
      meta: {
        title: 'Tree of possibilities — trainer',
        description: 'Grade 2 math trainer: listing options, tree of possibilities, counting combinations.',
        keywords: 'tree of possibilities, listing options, combinations, grade 2, math trainer'
      },
      h1: 'Tree of possibilities',
      sub: 'Listing options and counting combinations.',
      rangeHint: 'Number of options in each group from 2 to 6.',
      chips: [2, 4, 6],
      tasks: {
        pairs: 'Pairs from two groups',
        three: 'Sets from three groups',
        paths: 'Routes through a bridge',
        digits: 'Two-digit numbers from digits'
      }
    }
  }
};
