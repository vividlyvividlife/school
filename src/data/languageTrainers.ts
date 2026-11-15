export type LanguageSubjectId = 'russian' | 'belarusian';

export interface LanguageTrainerMeta {
  slug: string;
  title: string;
  subtitle: string;
  cardDesc: string;
  description: string;
  keywords: string;
  path: string;
  subject: LanguageSubjectId;
  pack?: string;
  engine: 'orfogrammy' | 'pack';
}

export const languageSubjects: Record<LanguageSubjectId, {
  label: string;
  shortLabel: string;
  path: string;
  icon: string;
  kicker: string;
  hubSub: string;
  schemaSubject: string;
}> = {
  russian: {
    label: 'Русский язык',
    shortLabel: 'Русский',
    path: '/russkiy-yazyk/',
    icon: 'Р',
    kicker: 'VIVID·ШКОЛА · русский язык',
    hubSub: 'Тренажёры для 2 класса: орфограммы, словарные слова, части речи, предложение, однокоренные слова и загадки. Внутри можно выбрать темы.',
    schemaSubject: 'Русский язык',
  },
  belarusian: {
    label: 'Беларуская мова',
    shortLabel: 'Беларуская',
    path: '/belaruskaya-mova/',
    icon: 'Б',
    kicker: 'VIVID·ШКОЛА · беларуская мова',
    hubSub: 'Трэнажоры для 2 класа: гукі і літары, слоўнікавыя словы, словы і сказ, перанос і націск, загадкі.',
    schemaSubject: 'Беларуская мова',
  },
};

const russianBase = '/russkiy-yazyk/2-klass/';

export const russianTrainers: LanguageTrainerMeta[] = [
  {
    slug: 'orfogrammy',
    title: 'Орфограммы',
    subtitle: 'Выберите темы, месяц или неделю — задания соберутся только из отмеченных тем.',
    cardDesc: 'большая буква, жи-ши, ча-ща, чу-щу, чк-чн, парные, безударные, разделительный ь',
    description: 'Тренажёр по орфограммам 2 класса: большая буква, жи-ши, ча-ща, чу-щу, чк-чн, парные согласные, безударные гласные и разделительный ь. 92 задания, выбор тем по программе или вручную.',
    keywords: 'русский язык, 2 класс, орфограммы, большая буква, жи-ши, ча-ща, чу-щу, чк-чн, безударные гласные, парные согласные, разделительный ь, тренажёр',
    path: russianBase + 'orfogrammy/',
    subject: 'russian',
    engine: 'orfogrammy',
  },
  {
    slug: 'slovarnye-slova',
    title: 'Словарные слова',
    subtitle: 'Послушайте слово и выберите правильную букву. После ответа слово показывается целиком.',
    cardDesc: 'слова с озвучкой и выбором написания',
    description: 'Тренажёр словарных слов 2 класса: 50 слов с озвучкой, выбором правильной буквы и проверкой. Темы по типам орфограмм.',
    keywords: 'русский язык, 2 класс, словарные слова, озвучка, правописание, тренажёр',
    path: russianBase + 'slovarnye-slova/',
    subject: 'russian',
    pack: 'ru-slova',
    engine: 'pack',
  },
  {
    slug: 'chasti-rechi',
    title: 'Части речи',
    subtitle: 'Определите, что обозначает слово: предмет, признак, действие или предлог.',
    cardDesc: 'предметы, признаки, действия и предлоги',
    description: 'Тренажёр частей речи для 2 класса: предметы, признаки, действия и предлоги. 20 заданий с объяснением.',
    keywords: 'русский язык, 2 класс, части речи, предмет, признак, действие, предлог, тренажёр',
    path: russianBase + 'chasti-rechi/',
    subject: 'russian',
    pack: 'ru-chasti',
    engine: 'pack',
  },
  {
    slug: 'predlozhenie-i-tekst',
    title: 'Предложение и текст',
    subtitle: 'Соберите предложение, выберите знак и разберитесь, что такое текст.',
    cardDesc: 'порядок слов, знаки, заголовок',
    description: 'Тренажёр по предложению и тексту для 2 класса: порядок слов, знаки в конце, заголовок и части текста. 20 заданий.',
    keywords: 'русский язык, 2 класс, предложение, текст, порядок слов, знаки препинания, заголовок, тренажёр',
    path: russianBase + 'predlozhenie-i-tekst/',
    subject: 'russian',
    pack: 'ru-predlozhenie',
    engine: 'pack',
  },
  {
    slug: 'odnokorennye-slova',
    title: 'Однокоренные слова',
    subtitle: 'Найдите корень, родственные слова и лишнее слово.',
    cardDesc: 'корень, родственные слова, лишнее слово',
    description: 'Тренажёр по однокоренным словам для 2 класса: корень, родственные слова, лишнее слово. 20 заданий.',
    keywords: 'русский язык, 2 класс, однокоренные слова, корень, родственные слова, лишнее слово, тренажёр',
    path: russianBase + 'odnokorennye-slova/',
    subject: 'russian',
    pack: 'ru-odnokorennye',
    engine: 'pack',
  },
  {
    slug: 'zagadki-i-rebusy',
    title: 'Загадки и ребусы',
    subtitle: 'Короткая перемена: отгадайте загадку или ребус.',
    cardDesc: 'загадки и ребусы на 2–3 минуты',
    description: 'Загадки и ребусы для 2 класса: отгадай слово, разгадай ребус, объяснение после ответа. 20 заданий.',
    keywords: 'русский язык, 2 класс, загадки, ребусы, отгадай слово, тренажёр',
    path: russianBase + 'zagadki-i-rebusy/',
    subject: 'russian',
    pack: 'ru-zagadki',
    engine: 'pack',
  },
];

const belarusianBase = '/belaruskaya-mova/2-klass/';

export const belarusianTrainers: LanguageTrainerMeta[] = [
  {
    slug: 'guki-i-litary',
    title: 'Гукі і літары',
    subtitle: 'Выберы літару або спалучэнне: ў, апостраф, дз, дж, ц.',
    cardDesc: 'ў, апостраф, дз, дж, ц і т',
    description: 'Трэнажор па гуках і літарах для 2 класа: ў, апостраф, дз, дж, ц, т. 21 заданне з тлумачэннем.',
    keywords: 'беларуская мова, 2 клас, гукі і літары, ў, апостраф, дз, дж, ц, трэнажор',
    path: belarusianBase + 'guki-i-litary/',
    subject: 'belarusian',
    pack: 'be-guki',
    engine: 'pack',
  },
  {
    slug: 'slounikavyya-slova',
    title: 'Слоўнікавыя словы',
    subtitle: 'Паслухай слова і выберы правільную літару.',
    cardDesc: 'словы з агучваннем і выбарам напісання',
    description: 'Трэнажор слоўнікавых слоў для 2 класа: 28 слоў з агучваннем і выбарам літары. Тэмы па тыпах арфаграм.',
    keywords: 'беларуская мова, 2 клас, слоўнікавыя словы, агучванне, правапіс, трэнажор',
    path: belarusianBase + 'slounikavyya-slova/',
    subject: 'belarusian',
    pack: 'be-slova',
    engine: 'pack',
  },
  {
    slug: 'slovy-i-skaz',
    title: 'Словы і сказ',
    subtitle: 'Вызнач, што абазначае слова: прадмет, прымета, дзеянне ці прыназоўнік.',
    cardDesc: 'прадметы, прыметы, дзеянні, прыназоўнікі',
    description: 'Трэнажор па словах і сказе для 2 класа: прадметы, прыметы, дзеянні, прыназоўнікі. 20 заданняў.',
    keywords: 'беларуская мова, 2 клас, словы і сказ, прадмет, прымета, дзеянне, прыназоўнік, трэнажор',
    path: belarusianBase + 'slovy-i-skaz/',
    subject: 'belarusian',
    pack: 'be-slovy',
    engine: 'pack',
  },
  {
    slug: 'peranos-i-natsisk',
    title: 'Перанос і націск',
    subtitle: 'Выберы правільны перанос і склад з націскам.',
    cardDesc: 'перанос слоў і націск',
    description: 'Трэнажор па пераносе і націску для 2 класа: 20 заданняў з тлумачэннем.',
    keywords: 'беларуская мова, 2 клас, перанос, націск, склады, трэнажор',
    path: belarusianBase + 'peranos-i-natsisk/',
    subject: 'belarusian',
    pack: 'be-peranos',
    engine: 'pack',
  },
  {
    slug: 'zagadki',
    title: 'Загадкі і рэбусы',
    subtitle: 'Кароткая перамена: адгадай загадку або рэбус.',
    cardDesc: 'загадкі і рэбусы на 2–3 хвіліны',
    description: 'Загадкі і рэбусы для 2 класа: адгадай слова, разгадай рэбус, тлумачэнне пасля адказу. 21 заданне.',
    keywords: 'беларуская мова, 2 клас, загадкі, рэбусы, адгадай слова, трэнажор',
    path: belarusianBase + 'zagadki/',
    subject: 'belarusian',
    pack: 'be-zagadki',
    engine: 'pack',
  },
];

export const trainersBySubject: Record<LanguageSubjectId, LanguageTrainerMeta[]> = {
  russian: russianTrainers,
  belarusian: belarusianTrainers,
};
