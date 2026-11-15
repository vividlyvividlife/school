(function () {
  if (!document.getElementById('langTopicList')) return;

  let STORAGE_KEY = 'vivid.russian.2.orfogrammy.v1';

  const DEFAULT_TOPICS = [
    { id: 'bolshaya', month: 'Сентябрь', label: 'Большая буква', short: 'имена и названия' },
    { id: 'zhishi', month: 'Октябрь', label: 'жи-ши, же-ше', short: 'шипящие' },
    { id: 'chashcha', month: 'Ноябрь', label: 'ча-ща', short: 'шипящие' },
    { id: 'chushchu', month: 'Ноябрь', label: 'чу-щу', short: 'шипящие' },
    { id: 'chkchn', month: 'Декабрь', label: 'чк-чн', short: 'сочетания с ч' },
    { id: 'parnye', month: 'Декабрь', label: 'Парные согласные', short: 'в корне слова' },
    { id: 'bezudarnye', month: 'Январь', label: 'Безударные гласные', short: 'в корне слова' },
    { id: 'razdelnyy', month: 'Февраль', label: 'Разделительный ь', short: 'семья, вьюга' }
  ];

  const MONTHS = ['Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь', 'Январь', 'Февраль', 'Март', 'Апрель', 'Май'];

  const DEFAULT_PROGRAM = {
    'Сентябрь': { 1: ['bolshaya'], 2: ['bolshaya'], 3: ['bolshaya'], 4: ['bolshaya'] },
    'Октябрь': { 1: ['zhishi'], 2: ['zhishi'], 3: ['zhishi'], 4: ['zhishi'] },
    'Ноябрь': {
      1: ['zhishi'],
      2: ['chashcha'],
      3: ['chushchu'],
      4: ['zhishi', 'chashcha', 'chushchu']
    },
    'Декабрь': {
      1: ['chkchn'],
      2: ['parnye'],
      3: ['chkchn', 'parnye'],
      4: ['chkchn', 'parnye']
    },
    'Январь': {
      1: ['bezudarnye'],
      2: ['bezudarnye'],
      3: ['parnye'],
      4: ['bezudarnye', 'parnye']
    },
    'Февраль': {
      1: ['razdelnyy'],
      2: ['bolshaya'],
      3: ['razdelnyy', 'bolshaya'],
      4: ['razdelnyy']
    },
    'Март': {
      1: ['bezudarnye'],
      2: ['parnye'],
      3: ['bezudarnye', 'parnye'],
      4: ['bezudarnye', 'parnye']
    },
    'Апрель': {
      1: ['chashcha'],
      2: ['chushchu'],
      3: ['chashcha', 'chushchu'],
      4: ['chashcha', 'chushchu']
    },
    'Май': {
      1: ['zhishi', 'chashcha', 'chushchu', 'chkchn', 'parnye', 'bezudarnye', 'razdelnyy', 'bolshaya'],
      2: ['zhishi', 'chashcha', 'chushchu', 'chkchn', 'parnye', 'bezudarnye', 'razdelnyy', 'bolshaya'],
      3: ['zhishi', 'chashcha', 'chushchu', 'chkchn', 'parnye', 'bezudarnye', 'razdelnyy', 'bolshaya'],
      4: ['zhishi', 'chashcha', 'chushchu', 'chkchn', 'parnye', 'bezudarnye', 'razdelnyy', 'bolshaya']
    }
  };

  const DEFAULT_TASKS = [
    { topic: 'bolshaya', label: 'Выбери букву', before: 'Мою сестру зовут ', after: 'нна.', answer: 'А', options: ['А', 'а'], rule: 'Имена людей пишутся с большой буквы.' },
    { topic: 'bolshaya', label: 'Выбери букву', before: 'Мы живём в ', after: 'инске.', answer: 'М', options: ['М', 'м'], rule: 'Названия городов пишутся с большой буквы.' },
    { topic: 'bolshaya', label: 'Выбери букву', before: 'Кошку зовут ', after: 'урка.', answer: 'М', options: ['М', 'м'], rule: 'Клички животных пишутся с большой буквы.' },
    { topic: 'bolshaya', label: 'Выбери букву', before: 'Ученик ', after: 'етров получил пятёрку.', answer: 'П', options: ['П', 'п'], rule: 'Фамилии пишутся с большой буквы.' },

    { topic: 'zhishi', label: 'Вставь пропущенную букву', before: 'У Маши новые лыж', after: '.', answer: 'и', options: ['и', 'ы'], rule: 'жи-ши пишем с и.' },
    { topic: 'zhishi', label: 'Вставь пропущенную букву', before: 'В саду растут груш', after: '.', answer: 'и', options: ['и', 'ы'], rule: 'жи-ши пишем с и.' },
    { topic: 'zhishi', label: 'Вставь пропущенную букву', before: 'В зоопарке живёт ж', after: 'раф.', answer: 'и', options: ['и', 'ы'], rule: 'жи-ши пишем с и.' },
    { topic: 'zhishi', label: 'Вставь пропущенную букву', before: 'На клумбе растёт ш', after: 'повник.', answer: 'и', options: ['и', 'ы'], rule: 'жи-ши пишем с и.' },

    { topic: 'chashcha', label: 'Вставь пропущенную букву', before: 'На столе стоит ч', after: 'йник.', answer: 'а', options: ['а', 'я'], rule: 'ча-ща пишем с а.' },
    { topic: 'chashcha', label: 'Вставь пропущенную букву', before: 'У реки растёт рощ', after: '.', answer: 'а', options: ['а', 'я'], rule: 'ча-ща пишем с а.' },
    { topic: 'chashcha', label: 'Вставь пропущенную букву', before: 'Мама купила ч', after: 'шку.', answer: 'а', options: ['а', 'я'], rule: 'ча-ща пишем с а.' },

    { topic: 'chushchu', label: 'Вставь пропущенную букву', before: 'В реке плавает щ', after: 'ка.', answer: 'у', options: ['у', 'ю'], rule: 'чу-щу пишем с у.' },
    { topic: 'chushchu', label: 'Вставь пропущенную букву', before: 'В сказке случилось ч', after: 'до.', answer: 'у', options: ['у', 'ю'], rule: 'чу-щу пишем с у.' },
    { topic: 'chushchu', label: 'Вставь пропущенную букву', before: 'Бабушка связала ч', after: 'лки.', answer: 'у', options: ['у', 'ю'], rule: 'чу-щу пишем с у.' },

    { topic: 'chkchn', label: 'Выбери: с мягким знаком или без', before: 'У девочки новая ру', after: 'а.', answer: 'чк', options: ['чк', 'чьк'], rule: 'чк и чн пишем без мягкого знака.' },
    { topic: 'chkchn', label: 'Выбери: с мягким знаком или без', before: 'В деревне течёт ре', after: 'а.', answer: 'чк', options: ['чк', 'чьк'], rule: 'чк и чн пишем без мягкого знака.' },
    { topic: 'chkchn', label: 'Выбери: с мягким знаком или без', before: 'На стене висит про', after: 'ый плакат.', answer: 'чн', options: ['чн', 'чьн'], rule: 'чк и чн пишем без мягкого знака.' },

    { topic: 'parnye', label: 'Вставь пропущенную букву', before: 'На улице сильный моро', after: '.', answer: 'з', options: ['з', 'с'], rule: 'Проверяем: морозы.' },
    { topic: 'parnye', label: 'Вставь пропущенную букву', before: 'У меня болит зу', after: '.', answer: 'б', options: ['б', 'п'], rule: 'Проверяем: зубы.' },
    { topic: 'parnye', label: 'Вставь пропущенную букву', before: 'Мы пришли в горо', after: '.', answer: 'д', options: ['д', 'т'], rule: 'Проверяем: города.' },

    { topic: 'bezudarnye', label: 'Вставь пропущенную букву', before: 'На лугу растёт тр', after: 'ва.', answer: 'а', options: ['а', 'о'], rule: 'Проверочное слово: травы.' },
    { topic: 'bezudarnye', label: 'Вставь пропущенную букву', before: 'Мы поднимаемся на г', after: 'ру.', answer: 'о', options: ['о', 'а'], rule: 'Проверочное слово: горы.' },
    { topic: 'bezudarnye', label: 'Вставь пропущенную букву', before: 'Дети несут вёдра с в', after: 'дой.', answer: 'о', options: ['о', 'а'], rule: 'Проверочное слово: воды.' },
    { topic: 'bezudarnye', label: 'Вставь пропущенную букву', before: 'На цветок села пч', after: 'ла.', answer: 'е', options: ['е', 'и'], rule: 'Проверочное слово: пчёлы.' },

    { topic: 'razdelnyy', label: 'Вставь пропущенную букву', before: 'Сем', after: 'я села за стол.', answer: 'ь', options: ['ь', 'ъ'], rule: 'Разделительный ь пишется после согласного перед е, ё, ю, я.' },
    { topic: 'razdelnyy', label: 'Вставь пропущенную букву', before: 'На улице метёт в', after: 'юга.', answer: 'ь', options: ['ь', 'ъ'], rule: 'Разделительный ь пишется после согласного перед е, ё, ю, я.' },
    { topic: 'razdelnyy', label: 'Вставь пропущенную букву', before: 'Осенью с деревьев падают лист', after: 'я.', answer: 'ь', options: ['ь', 'ъ'], rule: 'Разделительный ь пишется после согласного перед е, ё, ю, я.' },

    // Большая буква: дополнительные задания
    { topic: 'bolshaya', label: 'Выбери букву', before: 'Мою подругу зовут ', after: 'ля.', answer: 'О', options: ['О', 'о'], rule: 'Имена людей пишутся с большой буквы.' },
    { topic: 'bolshaya', label: 'Выбери букву', before: 'Мы поедем в ', after: 'омель.', answer: 'Г', options: ['Г', 'г'], rule: 'Названия городов пишутся с большой буквы.' },
    { topic: 'bolshaya', label: 'Выбери букву', before: 'Собаку зовут ', after: 'арик.', answer: 'Ш', options: ['Ш', 'ш'], rule: 'Клички животных пишутся с большой буквы.' },
    { topic: 'bolshaya', label: 'Выбери букву', before: 'Кот ', after: 'арсик спит.', answer: 'Б', options: ['Б', 'б'], rule: 'Клички животных пишутся с большой буквы.' },
    { topic: 'bolshaya', label: 'Выбери букву', before: 'Город ', after: 'рест стоит на реке.', answer: 'Б', options: ['Б', 'б'], rule: 'Названия городов пишутся с большой буквы.' },
    { topic: 'bolshaya', label: 'Выбери букву', before: 'Мою сестру зовут ', after: 'ера.', answer: 'В', options: ['В', 'в'], rule: 'Имена людей пишутся с большой буквы.' },
    { topic: 'bolshaya', label: 'Выбери букву', before: 'Мы живём в ', after: 'олоцке.', answer: 'П', options: ['П', 'п'], rule: 'Названия городов пишутся с большой буквы.' },
    { topic: 'bolshaya', label: 'Выбери букву', before: 'Ученик ', after: 'идоров решил задачу.', answer: 'С', options: ['С', 'с'], rule: 'Фамилии пишутся с большой буквы.' },
    { topic: 'bolshaya', label: 'Выбери букву', before: 'Река ', after: 'ерезина течёт через лес.', answer: 'Б', options: ['Б', 'б'], rule: 'Названия рек пишутся с большой буквы.' },
    { topic: 'bolshaya', label: 'Выбери букву', before: 'Кошку зовут ', after: 'аска.', answer: 'Л', options: ['Л', 'л'], rule: 'Клички животных пишутся с большой буквы.' },

    // жи-ши: дополнительные задания
    { topic: 'zhishi', label: 'Вставь пропущенную букву', before: 'На сосне растут ш', after: 'шки.', answer: 'и', options: ['и', 'ы'], rule: 'жи-ши пишем с и.' },
    { topic: 'zhishi', label: 'Вставь пропущенную букву', before: 'В лесу живут еж', after: '.', answer: 'и', options: ['и', 'ы'], rule: 'жи-ши пишем с и.' },
    { topic: 'zhishi', label: 'Вставь пропущенную букву', before: 'В море живут морж', after: '.', answer: 'и', options: ['и', 'ы'], rule: 'жи-ши пишем с и.' },
    { topic: 'zhishi', label: 'Вставь пропущенную букву', before: 'В небе летят стриж', after: '.', answer: 'и', options: ['и', 'ы'], rule: 'жи-ши пишем с и.' },
    { topic: 'zhishi', label: 'Вставь пропущенную букву', before: 'В саду цветут ландыш', after: '.', answer: 'и', options: ['и', 'ы'], rule: 'жи-ши пишем с и.' },
    { topic: 'zhishi', label: 'Вставь пропущенную букву', before: 'На столе лежат нож', after: '.', answer: 'и', options: ['и', 'ы'], rule: 'жи-ши пишем с и.' },
    { topic: 'zhishi', label: 'Вставь пропущенную букву', before: 'В реке плавают ерш', after: '.', answer: 'и', options: ['и', 'ы'], rule: 'жи-ши пишем с и.' },
    { topic: 'zhishi', label: 'Вставь пропущенную букву', before: 'В саду растёт ж', after: 'молость.', answer: 'и', options: ['и', 'ы'], rule: 'жи-ши пишем с и.' },

    // ча-ща: дополнительные задания
    { topic: 'chashcha', label: 'Вставь пропущенную букву', before: 'На краю леса растёт чащ', after: '.', answer: 'а', options: ['а', 'я'], rule: 'ча-ща пишем с а.' },
    { topic: 'chashcha', label: 'Вставь пропущенную букву', before: 'На поляне растёт щ', after: 'вель.', answer: 'а', options: ['а', 'я'], rule: 'ча-ща пишем с а.' },
    { topic: 'chashcha', label: 'Вставь пропущенную букву', before: 'Мы поймали лещ', after: '.', answer: 'а', options: ['а', 'я'], rule: 'ча-ща пишем с а.' },
    { topic: 'chashcha', label: 'Вставь пропущенную букву', before: 'В небе летит ч', after: 'йка.', answer: 'а', options: ['а', 'я'], rule: 'ча-ща пишем с а.' },
    { topic: 'chashcha', label: 'Вставь пропущенную букву', before: 'Мама купила ч', after: 'й.', answer: 'а', options: ['а', 'я'], rule: 'ча-ща пишем с а.' },
    { topic: 'chashcha', label: 'Вставь пропущенную букву', before: 'Пищ', after: ' нужна человеку.', answer: 'а', options: ['а', 'я'], rule: 'ча-ща пишем с а.' },
    { topic: 'chashcha', label: 'Вставь пропущенную букву', before: 'В саду растёт алыч', after: '.', answer: 'а', options: ['а', 'я'], rule: 'ча-ща пишем с а.' },
    { topic: 'chashcha', label: 'Вставь пропущенную букву', before: 'У бабушки есть дач', after: '.', answer: 'а', options: ['а', 'я'], rule: 'ча-ща пишем с а.' },

    // чу-щу: дополнительные задания
    { topic: 'chushchu', label: 'Вставь пропущенную букву', before: 'В пруду плавает щ', after: 'ка.', answer: 'у', options: ['у', 'ю'], rule: 'чу-щу пишем с у.' },
    { topic: 'chushchu', label: 'Вставь пропущенную букву', before: 'Я поймал щ', after: 'ку.', answer: 'у', options: ['у', 'ю'], rule: 'чу-щу пишем с у.' },
    { topic: 'chushchu', label: 'Вставь пропущенную букву', before: 'В саду стоит ч', after: 'чело.', answer: 'у', options: ['у', 'ю'], rule: 'чу-щу пишем с у.' },
    { topic: 'chushchu', label: 'Вставь пропущенную букву', before: 'В реке живут щ', after: 'ки.', answer: 'у', options: ['у', 'ю'], rule: 'чу-щу пишем с у.' },
    { topic: 'chushchu', label: 'Вставь пропущенную букву', before: 'На столе лежит ч', after: 'гунный горшок.', answer: 'у', options: ['у', 'ю'], rule: 'чу-щу пишем с у.' },
    { topic: 'chushchu', label: 'Вставь пропущенную букву', before: 'В сказке был ч', after: 'десный сад.', answer: 'у', options: ['у', 'ю'], rule: 'чу-щу пишем с у.' },
    { topic: 'chushchu', label: 'Вставь пропущенную букву', before: 'Мы встретили ч', after: 'дака.', answer: 'у', options: ['у', 'ю'], rule: 'чу-щу пишем с у.' },
    { topic: 'chushchu', label: 'Вставь пропущенную букву', before: 'В реке плавает щ', after: 'рёнок.', answer: 'у', options: ['у', 'ю'], rule: 'чу-щу пишем с у.' },

    // чк-чн: дополнительные задания
    { topic: 'chkchn', label: 'Выбери: с мягким знаком или без', before: 'На клумбе растут цвето', after: 'и.', answer: 'чк', options: ['чк', 'чьк'], rule: 'чк и чн пишем без мягкого знака.' },
    { topic: 'chkchn', label: 'Выбери: с мягким знаком или без', before: 'В небе летит ласто', after: 'а.', answer: 'чк', options: ['чк', 'чьк'], rule: 'чк и чн пишем без мягкого знака.' },
    { topic: 'chkchn', label: 'Выбери: с мягким знаком или без', before: 'На столе стоит вазо', after: 'а.', answer: 'чк', options: ['чк', 'чьк'], rule: 'чк и чн пишем без мягкого знака.' },
    { topic: 'chkchn', label: 'Выбери: с мягким знаком или без', before: 'У бабушки есть вну', after: 'а.', answer: 'чк', options: ['чк', 'чьк'], rule: 'чк и чн пишем без мягкого знака.' },
    { topic: 'chkchn', label: 'Выбери: с мягким знаком или без', before: 'В саду поёт пти', after: 'а.', answer: 'чк', options: ['чк', 'чьк'], rule: 'чк и чн пишем без мягкого знака.' },
    { topic: 'chkchn', label: 'Выбери: с мягким знаком или без', before: 'На стене висит лампо', after: 'а.', answer: 'чк', options: ['чк', 'чьк'], rule: 'чк и чн пишем без мягкого знака.' },
    { topic: 'chkchn', label: 'Выбери: с мягким знаком или без', before: 'Мы пили моло', after: 'ый коктейль.', answer: 'чн', options: ['чн', 'чьн'], rule: 'чк и чн пишем без мягкого знака.' },
    { topic: 'chkchn', label: 'Выбери: с мягким знаком или без', before: 'В комнате стоит ёло', after: 'ая игрушка.', answer: 'чн', options: ['чн', 'чьн'], rule: 'чк и чн пишем без мягкого знака.' },

    // парные согласные: дополнительные задания
    { topic: 'parnye', label: 'Вставь пропущенную букву', before: 'На столе лежит хле', after: '.', answer: 'б', options: ['б', 'п'], rule: 'Проверяем: хлеба.' },
    { topic: 'parnye', label: 'Вставь пропущенную букву', before: 'В саду растёт ду', after: '.', answer: 'б', options: ['б', 'п'], rule: 'Проверяем: дубы.' },
    { topic: 'parnye', label: 'Вставь пропущенную букву', before: 'В лесу растёт гри', after: '.', answer: 'б', options: ['б', 'п'], rule: 'Проверяем: грибы.' },
    { topic: 'parnye', label: 'Вставь пропущенную букву', before: 'На грядке вырос укро', after: '.', answer: 'п', options: ['п', 'б'], rule: 'Проверяем: укропа.' },
    { topic: 'parnye', label: 'Вставь пропущенную букву', before: 'Мы купили арбу', after: '.', answer: 'з', options: ['з', 'с'], rule: 'Проверяем: арбузы.' },
    { topic: 'parnye', label: 'Вставь пропущенную букву', before: 'В саду созрел виногра', after: '.', answer: 'д', options: ['д', 'т'], rule: 'Проверяем: винограда.' },
    { topic: 'parnye', label: 'Вставь пропущенную букву', before: 'На столе лежит тетра', after: 'ь.', answer: 'д', options: ['д', 'т'], rule: 'Проверяем: тетради.' },
    { topic: 'parnye', label: 'Вставь пропущенную букву', before: 'У меня есть бра', after: '.', answer: 'т', options: ['т', 'д'], rule: 'Проверяем: брата.' },

    // безударные гласные: дополнительные задания
    { topic: 'bezudarnye', label: 'Вставь пропущенную букву', before: 'На дереве сидит с', after: 'ва.', answer: 'о', options: ['о', 'а'], rule: 'Проверочное слово: совы.' },
    { topic: 'bezudarnye', label: 'Вставь пропущенную букву', before: 'У меня болит г', after: 'лова.', answer: 'о', options: ['о', 'а'], rule: 'Проверочное слово: головы.' },
    { topic: 'bezudarnye', label: 'Вставь пропущенную букву', before: 'На столе лежит д', after: 'ска.', answer: 'о', options: ['о', 'а'], rule: 'Проверочное слово: доски.' },
    { topic: 'bezudarnye', label: 'Вставь пропущенную букву', before: 'В лесу растёт с', after: 'сна.', answer: 'о', options: ['о', 'а'], rule: 'Проверочное слово: сосны.' },
    { topic: 'bezudarnye', label: 'Вставь пропущенную букву', before: 'На небе светит зв', after: 'зда.', answer: 'е', options: ['е', 'и'], rule: 'Проверочное слово: звёзды.' },
    { topic: 'bezudarnye', label: 'Вставь пропущенную букву', before: 'В саду растёт цв', after: 'ток.', answer: 'е', options: ['е', 'и'], rule: 'Проверочное слово: цвет.' },
    { topic: 'bezudarnye', label: 'Вставь пропущенную букву', before: 'На столе лежит п', after: 'сьмо.', answer: 'и', options: ['и', 'е'], rule: 'Проверочное слово: письма.' },
    { topic: 'bezudarnye', label: 'Вставь пропущенную букву', before: 'В реке течёт в', after: 'да.', answer: 'о', options: ['о', 'а'], rule: 'Проверочное слово: воды.' },

    // разделительный ь: дополнительные задания
    { topic: 'razdelnyy', label: 'Вставь пропущенную букву', before: 'В театре идёт п', after: 'еса.', answer: 'ь', options: ['ь', 'ъ'], rule: 'Разделительный ь пишется после согласного перед е, ё, ю, я.' },
    { topic: 'razdelnyy', label: 'Вставь пропущенную букву', before: 'На столе стоит варен', after: 'е.', answer: 'ь', options: ['ь', 'ъ'], rule: 'Разделительный ь пишется после согласного перед е, ё, ю, я.' },
    { topic: 'razdelnyy', label: 'Вставь пропущенную букву', before: 'В зоопарке живёт обез', after: 'яна.', answer: 'ь', options: ['ь', 'ъ'], rule: 'Разделительный ь пишется после согласного перед е, ё, ю, я.' },
    { topic: 'razdelnyy', label: 'Вставь пропущенную букву', before: 'В саду растут дерев', after: 'я.', answer: 'ь', options: ['ь', 'ъ'], rule: 'Разделительный ь пишется после согласного перед е, ё, ю, я.' },
    { topic: 'razdelnyy', label: 'Вставь пропущенную букву', before: 'У Анны красивое плат', after: 'е.', answer: 'ь', options: ['ь', 'ъ'], rule: 'Разделительный ь пишется после согласного перед е, ё, ю, я.' },
    { topic: 'razdelnyy', label: 'Вставь пропущенную букву', before: 'Мы пьём чай с печен', after: 'ем.', answer: 'ь', options: ['ь', 'ъ'], rule: 'Разделительный ь пишется после согласного перед е, ё, ю, я.' },
    { topic: 'razdelnyy', label: 'Вставь пропущенную букву', before: 'У меня есть брат', after: 'я.', answer: 'ь', options: ['ь', 'ъ'], rule: 'Разделительный ь пишется после согласного перед е, ё, ю, я.' }
  ];

  function dream(topic, rows, defaultRule) {
    return rows.map(function (row) {
      return {
        topic: topic,
        label: 'Фантазия',
        before: row[0],
        after: row[1],
        answer: row[2],
        options: [row[2], row[3]],
        rule: row[4] || defaultRule
      };
    });
  }

  const DEFAULT_DREAM_TASKS = [].concat(
    dream('bolshaya', [
      ['Мальчика-волшебника зовут ', 'ван Иваныч.', 'И', 'и', 'Имена людей пишутся с большой буквы.'],
      ['Девочку-фею зовут ', 'ария.', 'М', 'м', 'Имена людей пишутся с большой буквы.'],
      ['Девочку из облачного города зовут ', 'уша.', 'Л', 'л', 'Имена людей пишутся с большой буквы.'],
      ['Мальчика-гнома зовут ', 'апожок.', 'С', 'с', 'Имена людей пишутся с большой буквы.'],
      ['Кота-звездочёта зовут ', 'ублик.', 'Б', 'б', 'Клички животных пишутся с большой буквы.'],
      ['Пса с пропеллером зовут ', 'явка.', 'Т', 'т', 'Клички животных пишутся с большой буквы.'],
      ['Хомяка-великана зовут ', 'румстик.', 'Х', 'х', 'Клички животных пишутся с большой буквы.'],
      ['Летающую черепаху зовут ', 'едли.', 'М', 'м', 'Клички животных пишутся с большой буквы.'],
      ['Дракона зовут ', 'гонёк.', 'О', 'о', 'Имена и клички пишутся с большой буквы.'],
      ['Сову-волшебницу зовут ', 'хушка.', 'У', 'у', 'Клички животных пишутся с большой буквы.'],
      ['Город ', 'афельск стоит на горе из мороженого.', 'В', 'в', 'Названия городов пишутся с большой буквы.'],
      ['Город ', 'ряничбург построили из пряников.', 'П', 'п', 'Названия городов пишутся с большой буквы.'],
      ['Город ', 'ефирск плывёт по небу.', 'З', 'з', 'Названия городов пишутся с большой буквы.'],
      ['Город ', 'армеладск встречает гостей.', 'М', 'м', 'Названия городов пишутся с большой буквы.'],
      ['Река ', 'иселька течёт через лес.', 'К', 'к', 'Названия рек пишутся с большой буквы.'],
      ['Река ', 'олочка впадает в море.', 'М', 'м', 'Названия рек пишутся с большой буквы.'],
      ['Планета ', 'армеладка светится ночью.', 'М', 'м', 'Названия планет пишутся с большой буквы.'],
      ['Планета ', 'люшевая крутится вокруг звезды.', 'П', 'п', 'Названия планет пишутся с большой буквы.'],
      ['Гора ', 'ахарная выросла за ночь.', 'С', 'с', 'Названия гор пишутся с большой буквы.'],
      ['Море ', 'имонное пахнет лимоном.', 'Л', 'л', 'Названия морей пишутся с большой буквы.'],
      ['Остров ', 'люшка плывёт по волнам.', 'П', 'п', 'Названия островов пишутся с большой буквы.'],
      ['Улица ', 'еденцовая сделана из сахара.', 'Л', 'л', 'Названия улиц пишутся с большой буквы.'],
      ['Деревня ', 'еченькино стоит у реки.', 'П', 'п', 'Названия деревень пишутся с большой буквы.'],
      ['Корабль ', 'мешинка приплыл к острову.', 'С', 'с', 'Названия кораблей пишутся с большой буквы.'],
      ['Площадь ', 'убликовая украшена шарами.', 'Б', 'б', 'Названия площадей пишутся с большой буквы.']
    ]),
    dream('zhishi', [
      ['В сахарном аквариуме живут морж', '.', 'и', 'ы'],
      ['В чайнике плавают ерш', '.', 'и', 'ы'],
      ['На люстре сидят стриж', '.', 'и', 'ы'],
      ['В шкафу спят уж', '.', 'и', 'ы'],
      ['В шляпе волшебника живут колючие еж', '.', 'и', 'ы'],
      ['На крыше танцуют мыш', '.', 'и', 'ы'],
      ['В супе плавают ш', 'шки.', 'и', 'ы'],
      ['На дереве растут ландыш', '.', 'и', 'ы'],
      ['В кармане у кота лежат карандаш', '.', 'и', 'ы'],
      ['На балконе растут камыш', ' до неба.', 'и', 'ы'],
      ['В холодильнике живут чиж', '.', 'и', 'ы'],
      ['У дракона новые лыж', '.', 'и', 'ы'],
      ['На потолке висят нож', '.', 'и', 'ы'],
      ['В чашке плавают кувш', 'нки.', 'и', 'ы'],
      ['По небу едут маш', 'ны.', 'и', 'ы'],
      ['У дракона на лапах ш', 'ны.', 'и', 'ы'],
      ['В луже отражаются этаж', ' радуги.', 'и', 'ы'],
      ['В шоколадном городе построили гараж', '.', 'и', 'ы'],
      ['В театре из плюша висят витраж', '.', 'и', 'ы'],
      ['На сахарном берегу стоят шалаш', '.', 'и', 'ы'],
      ['Кот нарисовал чертеж', '.', 'и', 'ы'],
      ['В космосе летают ж', 'рафы.', 'и', 'ы'],
      ['На луне растёт ш', 'повник.', 'и', 'ы'],
      ['У мыши в лапке ш', 'ло.', 'и', 'ы'],
      ['В старом самоваре живут ж', 'льцы.', 'и', 'ы']
    ], 'жи-ши пишем с и.'),
    dream('chashcha', [
      ['В чайнике живёт ч', 'йка.', 'а', 'я'],
      ['На облаке спит туч', '.', 'а', 'я'],
      ['У Бабы Яги есть дач', '.', 'а', 'я'],
      ['В кармане у гнома ч', 'шка.', 'а', 'я'],
      ['На сахарной горе растёт рощ', '.', 'а', 'я'],
      ['В шкафу выросла чащ', '.', 'а', 'я'],
      ['Коту досталась задач', '.', 'а', 'я'],
      ['Дракон потерял перч', 'тку.', 'а', 'я'],
      ['На люстре висят ч', 'сы с крыльями.', 'а', 'я'],
      ['В супе плавает свеч', '.', 'а', 'я'],
      ['У совы новая дач', '.', 'а', 'я'],
      ['В космосе летит ч', 'йник.', 'а', 'я'],
      ['На дереве растёт ч', 'йный лист.', 'а', 'я'],
      ['У кота на хвосте ч', 'шка.', 'а', 'я'],
      ['В мармеладном домике живёт овч', 'рка.', 'а', 'я'],
      ['Мышь нашла ч', 'сть радуги.', 'а', 'я'],
      ['В роще поёт ч', 'йник.', 'а', 'я'],
      ['На летающей площади растёт щ', 'вель.', 'а', 'я'],
      ['Кот умеет ворч', 'ть по-медвежьи.', 'а', 'я'],
      ['Пёс научился молч', 'ть по-кошачьи.', 'а', 'я'],
      ['Дракон начал кач', 'ться.', 'а', 'я'],
      ['В ледяном замке идёт встреч', '.', 'а', 'я'],
      ['На площ', 'ди пряничного города танцуют звёзды.', 'а', 'я'],
      ['Бабушка начала угощ', 'ть звёзды.', 'а', 'я'],
      ['Птицы начали трещ', 'ть по-драконьи.', 'а', 'я']
    ], 'ча-ща пишем с а.'),
    dream('chushchu', [
      ['В чайнике живёт щ', 'ка.', 'у', 'ю'],
      ['На огороде великана стоит ч', 'чело.', 'у', 'ю'],
      ['В шкафу спрятан ч', 'лан.', 'у', 'ю'],
      ['У дракона восемь щ', 'палец.', 'у', 'ю'],
      ['Я тащ', ' домой тучу.', 'у', 'ю'],
      ['В шоколадном городе случилось ч', 'до.', 'у', 'ю'],
      ['Гном надел ч', 'лки.', 'у', 'ю'],
      ['У кота ч', 'б на макушке.', 'у', 'ю'],
      ['Я ищ', ' кость в звёздном сундуке.', 'у', 'ю'],
      ['Я свищ', ' вместе с драконом.', 'у', 'ю'],
      ['Я тащ', ' за собой радугу.', 'у', 'ю'],
      ['В супе плавает ч', 'гунок.', 'у', 'ю'],
      ['В роще живёт ч', 'дак с пропеллером.', 'у', 'ю'],
      ['В избушке на курьих ножках бывают ч', 'деса.', 'у', 'ю'],
      ['Я угощ', ' всех волшебным пирогом.', 'у', 'ю'],
      ['Я защищ', ' дракона от дождя.', 'у', 'ю'],
      ['В кастрюле плещется щ', 'ка.', 'у', 'ю'],
      ['Я почищ', ' сапоги от звёзд.', 'у', 'ю'],
      ['На дереве растут ч', 'десные яблоки.', 'у', 'ю'],
      ['В небе летит ч', 'гунная туча.', 'у', 'ю'],
      ['Ёжик нашёл ч', 'десный месяц.', 'у', 'ю'],
      ['В чулане живёт ч', 'дище.', 'у', 'ю'],
      ['Я посещ', ' облачный город.', 'у', 'ю'],
      ['Я не упущ', ' свою тучу.', 'у', 'ю'],
      ['Я щ', 'рюсь от яркой кометы.', 'у', 'ю']
    ], 'чу-щу пишем с у.'),
    dream('chkchn', [
      ['У гнома волшебная ру', 'а.', 'чк', 'чьк'],
      ['В пироге течёт ре', 'а.', 'чк', 'чьк'],
      ['В чайнике стоит пе', 'а.', 'чк', 'чьк'],
      ['На люстре горит све', 'а из звёзд.', 'чк', 'чьк'],
      ['У луны тёмная но', 'а.', 'чк', 'чьк'],
      ['Кот поставил то', 'у в тетради.', 'чк', 'чьк'],
      ['У дракона маленькая до', 'а.', 'чк', 'чьк'],
      ['В кастрюле выросла ко', 'а.', 'чк', 'чьк'],
      ['В небе плывёт бо', 'а.', 'чк', 'чьк'],
      ['У белки есть па', 'а звёзд.', 'чк', 'чьк'],
      ['Дед Мороз потерял та', 'у.', 'чк', 'чьк'],
      ['У кота на дереве да', 'а.', 'чк', 'чьк'],
      ['В кармане великана лежит ку', 'а снега.', 'чк', 'чьк'],
      ['В чайнике летит ту', 'а.', 'чк', 'чьк'],
      ['У бабушки есть вну', 'а с крыльями.', 'чк', 'чьк'],
      ['Собака Жу', 'а научилась летать.', 'чк', 'чьк'],
      ['У богатыря про', 'ый щит из драконьей чешуи.', 'чн', 'чьн'],
      ['В хрустальном аэропорту сро', 'ый рейс.', 'чн', 'чьн'],
      ['У кота то', 'ый глаз на хвосте.', 'чн', 'чьн'],
      ['В лесу ве', 'ый праздник.', 'чн', 'чьн'],
      ['Над замком шумит мра', 'ый лес.', 'чн', 'чьн'],
      ['На берегу лежит ре', 'ой песок из сахара.', 'чн', 'чьн'],
      ['В небе горит но', 'ой фонарь.', 'чн', 'чьн'],
      ['В чашке скачет солне', 'ый зайчик.', 'чн', 'чьн'],
      ['У дракона уда', 'ый день.', 'чн', 'чьн']
    ], 'чк и чн пишем без мягкого знака.'),
    dream('parnye', [
      ['В тыкве лежит арбу', '.', 'з', 'с', 'Проверяем: арбузы.'],
      ['В чайнике живёт моро', '.', 'з', 'с', 'Проверяем: морозы.'],
      ['В шоколадном городе выпал сне', '.', 'г', 'к', 'Проверяем: снега.'],
      ['У кота есть летающий шка', '.', 'ф', 'в', 'Проверяем: шкафы.'],
      ['Над замком реет фла', ' из радуги.', 'г', 'к', 'Проверяем: флаги.'],
      ['У реки сахарный бере', '.', 'г', 'к', 'Проверяем: берега.'],
      ['Бабушка испекла пиро', ' из звёзд.', 'г', 'к', 'Проверяем: пироги.'],
      ['Гном потерял сапо', '.', 'г', 'к', 'Проверяем: сапоги.'],
      ['У дракона острый зу', '.', 'б', 'п', 'Проверяем: зубы.'],
      ['В шкафу лежит хле', ' из звёзд.', 'б', 'п', 'Проверяем: хлеба.'],
      ['У дракона красный шар', '.', 'ф', 'в', 'Проверяем: шарфы.'],
      ['Кот вырастил огоро', ' на спине кита.', 'д', 'т', 'Проверяем: огороды.'],
      ['На облаке стоит горо', '.', 'д', 'т', 'Проверяем: города.'],
      ['Под шкафом спит кро', ' в валенках.', 'т', 'д', 'Проверяем: кроты.'],
      ['В чашке плавает сне', '.', 'г', 'к', 'Проверяем: снега.'],
      ['На столе лежит волшебный су', '.', 'п', 'б', 'Проверяем: супы.'],
      ['У снеговика тёплый шар', '.', 'ф', 'в', 'Проверяем: шарфы.'],
      ['В облаке стоит шка', '.', 'ф', 'в', 'Проверяем: шкафы.'],
      ['На площади вырос сугро', ' из мороженого.', 'б', 'п', 'Проверяем: сугробы.'],
      ['Под деревом спрятан говорящий гри', '.', 'б', 'п', 'Проверяем: грибы.'],
      ['У зайца молочный зу', ' из сахара.', 'б', 'п', 'Проверяем: зубы.'],
      ['В кастрюле варится су', ' из радуги.', 'п', 'б', 'Проверяем: супы.'],
      ['В печке печётся хле', ' из звёзд.', 'б', 'п', 'Проверяем: хлеба.'],
      ['На грядке сидит кро', ' в шляпе.', 'т', 'д', 'Проверяем: кроты.'],
      ['На люстре висит хле', ' в банке.', 'б', 'п', 'Проверяем: хлеба.']
    ]),
    dream('bezudarnye', [
      ['В шляпе великана растёт тр', 'ва.', 'а', 'о', 'Проверочное слово: травы.'],
      ['В чайнике течёт в', 'да из радуги.', 'о', 'а', 'Проверочное слово: воды.'],
      ['У избушки на курьих ножках есть г', 'лова.', 'о', 'а', 'Проверочное слово: головы.'],
      ['В карамельном лесу растёт с', 'сна.', 'о', 'а', 'Проверочное слово: сосны.'],
      ['В чайнике горит зв', 'зда.', 'е', 'и', 'Проверочное слово: звёзды.'],
      ['В шкафу расцвёл цв', 'ток.', 'е', 'и', 'Проверочное слово: цвет.'],
      ['Кот написал п', 'сьмо.', 'и', 'е', 'Проверочное слово: письма.'],
      ['На люстре спит пч', 'ла.', 'е', 'и', 'Проверочное слово: пчёлы.'],
      ['В чашке шумит в', 'лна.', 'о', 'а', 'Проверочное слово: волны.'],
      ['У дракона з', 'ма в кармане.', 'и', 'е', 'Проверочное слово: зимы.'],
      ['В чайнике наступила в', 'сна.', 'е', 'и', 'Проверочное слово: вёсны.'],
      ['У замка высокая ст', 'на из драконьей чешуи.', 'е', 'и', 'Проверочное слово: стены.'],
      ['В самоваре светится ', 'кно.', 'о', 'а', 'Проверочное слово: окна.'],
      ['В бороде великана растут цв', 'ты.', 'е', 'и', 'Проверочное слово: цвет.'],
      ['За рекой растут цв', 'ты из сахара.', 'е', 'и', 'Проверочное слово: цвет.'],
      ['У кота в глазах синие м', 'ря.', 'о', 'а', 'Проверочное слово: море.'],
      ['Гном несёт в', 'дро звёзд.', 'е', 'и', 'Проверочное слово: вёдра.'],
      ['В кармане звенит з', 'рно.', 'е', 'и', 'Проверочное слово: зёрна.'],
      ['На крыше замка пасётся к', 'рова.', 'о', 'а', 'Проверочное слово: коровы.'],
      ['У луны белая ', 'вца.', 'о', 'а', 'Проверочное слово: овцы.'],
      ['На дереве растут гр', 'бы из сахара.', 'и', 'е', 'Проверочное слово: гриб.'],
      ['В шкафу растут гр', 'бы.', 'и', 'е', 'Проверочное слово: гриб.'],
      ['Через реку стоят м', 'сты из макарон.', 'о', 'а', 'Проверочное слово: мост.'],
      ['В хрустальном сундуке тикают ч', 'сы.', 'а', 'о', 'Проверочное слово: час.'],
      ['В сундуке лежит в', 'дро из звёзд.', 'е', 'и', 'Проверочное слово: вёдра.']
    ]),
    dream('razdelnyy', [
      ['У дракона большая сем', 'я.', 'ь', 'ъ'],
      ['В чайнике воет в', 'юга.', 'ь', 'ъ'],
      ['На спине кита растут дерев', 'я.', 'ь', 'ъ'],
      ['С дерева падают лист', 'я из звёзд.', 'ь', 'ъ'],
      ['У птицы разноцветные пер', 'я из радуги.', 'ь', 'ъ'],
      ['В замке стоят стул', 'я на потолке.', 'ь', 'ъ'],
      ['У дракона есть брат', 'я.', 'ь', 'ъ'],
      ['У кота есть друз', 'я в звёздном городе.', 'ь', 'ъ'],
      ['Гном сшил плат', 'е.', 'ь', 'ъ'],
      ['Бабушка сварила варен', 'е из радуги.', 'ь', 'ъ'],
      ['На столе лежит печен', 'е из звёзд.', 'ь', 'ъ'],
      ['У богатыря богатырское здоров', 'е из звёздного родника.', 'ь', 'ъ'],
      ['В ледяном замке шумное весел', 'е.', 'ь', 'ъ'],
      ['У кота новосел', 'е в старом самоваре.', 'ь', 'ъ'],
      ['В облачной школе живёт счаст', 'е.', 'ь', 'ъ'],
      ['Дождь л', 'ёт из чайника.', 'ь', 'ъ'],
      ['Кот п', 'ёт молоко из звёздного кувшина.', 'ь', 'ъ'],
      ['Бабушка ш', 'ёт рубашку из радуги.', 'ь', 'ъ'],
      ['Ветер в', 'ёт из радуги нити.', 'ь', 'ъ'],
      ['Во дворце растут колос', 'я.', 'ь', 'ъ'],
      ['В чашке плавают хлоп', 'я из звёзд.', 'ь', 'ъ'],
      ['У свин', 'и в пряничном домике пятачок.', 'ь', 'ъ'],
      ['В небе летят вороб', 'и на самокатах.', 'ь', 'ъ'],
      ['В бороде великана поют солов', 'и.', 'ь', 'ъ'],
      ['В звёздном чайнике живут мурав', 'и.', 'ь', 'ъ']
    ], 'Разделительный ь пишется после согласного перед е, ё, ю, я.')
  );

  const PACK_KEY = document.querySelector('.lang-app')
    ? document.querySelector('.lang-app').getAttribute('data-pack') || ''
    : '';
  const PACK = (window.VIVID_LANG_PACKS || {})[PACK_KEY];
  const TOPICS = PACK ? PACK.topics : DEFAULT_TOPICS;
  const PROGRAM = PACK ? (PACK.program || null) : DEFAULT_PROGRAM;
  const NORMAL_TASKS = PACK ? PACK.tasks : DEFAULT_TASKS;
  const DREAM_TASKS = PACK ? [] : DEFAULT_DREAM_TASKS;
  if (PACK_KEY) STORAGE_KEY = 'vivid.lang.pack.' + PACK_KEY + '.v1';

  function currentPeriod() {
    const now = new Date();
    const map = {
      8: 'Сентябрь', 9: 'Октябрь', 10: 'Ноябрь', 11: 'Декабрь',
      0: 'Январь', 1: 'Февраль', 2: 'Март', 3: 'Апрель', 4: 'Май'
    };
    const month = map[now.getMonth()] || 'Сентябрь';
    const week = Math.min(4, Math.max(1, Math.ceil(now.getDate() / 7)));
    return { month: month, week: week };
  }

  const period = currentPeriod();

  const state = {
    mode: 'year',
    kind: 'normal',
    selected: new Set(TOPICS.map(function (t) { return t.id; })),
    month: period.month,
    week: period.week,
    round: [],
    index: 0,
    correct: 0,
    skipped: 0,
    answered: false,
    current: null,
    mistakes: {},
    mistakeItems: [],
    skippedItems: [],
    orderPicked: [],
    orderBank: []
  };

  function loadState() {
    var saved = null;
    try {
      saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    } catch (e) {
      saved = null;
    }
    if (!saved || typeof saved !== 'object') return;
    if (Array.isArray(saved.selected)) {
      state.selected = new Set(saved.selected.filter(function (id) {
        return TOPICS.some(function (t) { return t.id === id; });
      }));
    }
    if (saved.mode === 'year' || saved.mode === 'program' || saved.mode === 'manual') {
      state.mode = saved.mode;
    }
    if (PACK && state.mode === 'program') state.mode = 'year';
    if (!PACK && saved.kind === 'dream') state.kind = 'dream';
    if (MONTHS.indexOf(saved.month) >= 0) state.month = saved.month;
    if (saved.week === 'all' || (Number.isInteger(saved.week) && saved.week >= 1 && saved.week <= 4)) {
      state.week = saved.week;
    }
    if (state.mode === 'year') {
      state.selected = new Set(TOPICS.map(function (t) { return t.id; }));
    }
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        mode: state.mode,
        kind: state.kind,
        selected: Array.from(state.selected),
        month: state.month,
        week: state.week
      }));
    } catch (e) {}
  }

  const el = {
    setup: document.getElementById('langSetup'),
    game: document.getElementById('langGame'),
    results: document.getElementById('langResults'),
    resultBody: document.getElementById('langResultBody'),
    start: document.getElementById('langStart'),
    startInfo: document.getElementById('langStartInfo'),
    back: document.getElementById('langBack'),
    scoreOk: document.getElementById('langScoreOk'),
    scoreBad: document.getElementById('langScoreBad'),
    scoreSkip: document.getElementById('langScoreSkip'),
    progressText: document.getElementById('langProgressText'),
    count: document.getElementById('langCount'),
    panel: document.getElementById('langPanel'),
    program: document.getElementById('langProgram'),
    months: document.getElementById('langMonths'),
    weeks: document.getElementById('langWeeks'),
    hint: document.getElementById('langHint'),
    topicList: document.getElementById('langTopicList'),
    fantasy: document.getElementById('langFantasy'),
    fantasyNote: document.getElementById('langFantasyNote'),
    progress: document.getElementById('langProgressBar'),
    task: document.getElementById('langTask'),
    feedback: document.getElementById('langFeedback'),
    skip: document.getElementById('langSkip'),
    next: document.getElementById('langNext'),
    all: document.getElementById('langAll'),
    clear: document.getElementById('langClear'),
    reset: document.getElementById('langReset')
  };

  function topicById(id) {
    for (var i = 0; i < TOPICS.length; i++) {
      if (TOPICS[i].id === id) return TOPICS[i];
    }
    return null;
  }

  function topicLabel(id) {
    var topic = topicById(id);
    return topic ? topic.label : id;
  }

  function activeTasks() {
    return state.kind === 'dream' ? DREAM_TASKS : NORMAL_TASKS;
  }

  function taskCount(id) {
    return activeTasks().filter(function (t) { return t.topic === id; }).length;
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, function (ch) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
    });
  }

  function shuffle(list) {
    var copy = list.slice();
    for (var i = copy.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = copy[i];
      copy[i] = copy[j];
      copy[j] = tmp;
    }
    return copy;
  }

  function pluralTopics(n) {
    if (n === 1) return 'тема';
    if (n >= 2 && n <= 4) return 'темы';
    return 'тем';
  }

  function pluralTasks(n) {
    var mod10 = n % 10;
    var mod100 = n % 100;
    if (mod10 === 1 && mod100 !== 11) return 'задание';
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'задания';
    return 'заданий';
  }

  function buildTopicList() {
    var groups = [];
    TOPICS.forEach(function (t) {
      var group = t.group || t.month;
      if (groups.indexOf(group) === -1) groups.push(group);
    });
    el.topicList.innerHTML = groups.map(function (group) {
      var items = TOPICS.filter(function (t) { return (t.group || t.month) === group; });
      return '<div class="lang-month-group">' +
        '<div class="lang-month-label">' + escapeHtml(group) + '</div>' +
        items.map(function (t) {
          return '<label class="lang-topic">' +
            '<input type="checkbox" data-topic="' + t.id + '"' + (state.selected.has(t.id) ? ' checked' : '') + '>' +
            '<span class="lang-check"></span>' +
            '<span class="lang-topic-text"><b>' + escapeHtml(t.label) + '</b><small>' + escapeHtml(t.short) + ' · ' + taskCount(t.id) + ' ' + pluralTasks(taskCount(t.id)) + '</small></span>' +
          '</label>';
        }).join('') +
      '</div>';
    }).join('');
  }

  function syncCheckboxes() {
    el.topicList.querySelectorAll('input[data-topic]').forEach(function (input) {
      input.checked = state.selected.has(input.getAttribute('data-topic'));
    });
  }

  function buildProgram() {
    if (!PROGRAM) {
      var programBtn = document.querySelector('.lang-modes button[data-mode="program"]');
      if (programBtn) programBtn.hidden = true;
      var yearBtn = document.querySelector('.lang-modes button[data-mode="year"]');
      if (yearBtn) yearBtn.textContent = 'Все темы';
      var modes = document.querySelector('.lang-modes');
      if (modes) modes.classList.add('is-two');
      if (el.program) el.program.hidden = true;
      return;
    }
    el.months.innerHTML = MONTHS.map(function (month) {
      return '<button type="button" data-month="' + escapeHtml(month) + '" title="' + escapeHtml(month) + '">' + escapeHtml(month.slice(0, 3)) + '</button>';
    }).join('');
    var weekOptions = [
      { value: 'all', label: 'все' },
      { value: 1, label: '1' },
      { value: 2, label: '2' },
      { value: 3, label: '3' },
      { value: 4, label: '4' }
    ];
    weekOptions.forEach(function (option) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.dataset.week = String(option.value);
      btn.textContent = option.label;
      if (option.value === 'all') btn.title = 'Все недели месяца';
      el.weeks.appendChild(btn);
    });

    el.months.addEventListener('click', function (event) {
      var btn = event.target.closest('button[data-month]');
      if (!btn) return;
      state.month = btn.getAttribute('data-month');
      state.week = 1;
      applyProgram();
    });

    el.weeks.addEventListener('click', function (event) {
      var btn = event.target.closest('button[data-week]');
      if (!btn) return;
      var raw = btn.getAttribute('data-week');
      state.week = raw === 'all' ? 'all' : Number(raw);
      applyProgram();
    });
  }

  function updateProgramUI() {
    if (!PROGRAM || !el.months || !el.weeks || !el.hint) return;
    el.months.querySelectorAll('button[data-month]').forEach(function (btn) {
      var active = btn.getAttribute('data-month') === state.month;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
    el.weeks.querySelectorAll('button[data-week]').forEach(function (btn) {
      var active = btn.getAttribute('data-week') === String(state.week);
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
    var labels = Array.from(state.selected).map(topicLabel);
    var weekLabel = state.week === 'all' ? 'все недели' : 'неделя ' + state.week;
    el.hint.textContent = state.month + ', ' + weekLabel + ': ' +
      (labels.length ? labels.join(', ') : 'нет тем') +
      '. Это готовый набор — можно поправить вручную.';
  }

  function updateModeButtons() {
    document.querySelectorAll('.lang-modes button[data-mode]').forEach(function (btn) {
      var active = btn.getAttribute('data-mode') === state.mode;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
  }

  function updateFantasyUI() {
    if (!el.fantasy) return;
    el.fantasy.querySelectorAll('button[data-kind]').forEach(function (btn) {
      var active = btn.getAttribute('data-kind') === state.kind;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
    if (el.fantasyNote) el.fantasyNote.hidden = state.kind !== 'dream';
  }

  function setKind(kind) {
    if (PACK) return;
    state.kind = kind === 'dream' ? 'dream' : 'normal';
    updateFantasyUI();
    buildTopicList();
    syncCheckboxes();
    updateCounts();
    saveState();
    prepareRound();
  }

  function currentPool() {
    return activeTasks().filter(function (t) { return state.selected.has(t.topic); });
  }

  function updateCounts() {
    el.count.innerHTML = 'Выбрано <b>' + state.selected.size + '</b> из ' + TOPICS.length + ' тем';
    updateStartInfo();
  }

  function updateStartInfo() {
    if (!el.start || !el.startInfo) return;
    var pool = currentPool();
    var size = Math.min(5, pool.length);
    if (!state.selected.size) {
      el.startInfo.innerHTML = '<b>Темы не выбраны</b><span>Отметьте хотя бы одну тему, чтобы начать раунд.</span>';
    } else if (!pool.length) {
      el.startInfo.innerHTML = '<b>Нет заданий</b><span>В выбранных темах пока нет заданий. Выберите другие.</span>';
    } else {
      el.startInfo.innerHTML = '<b>' + size + ' ' + pluralTasks(size) + ' · ' +
        state.selected.size + ' ' + pluralTopics(state.selected.size) + '</b>' +
        '<span>Раунд из пяти заданий. После ответа — правило, в конце — разбор ошибок.</span>';
    }
    el.start.disabled = !pool.length;
  }

  function programTopics(month, week) {
    if (!PROGRAM) return [];
    var monthPlan = PROGRAM[month] || {};
    if (week === 'all') {
      var ids = new Set();
      Object.keys(monthPlan).forEach(function (key) {
        monthPlan[key].forEach(function (id) { ids.add(id); });
      });
      return Array.from(ids);
    }
    return monthPlan[week] || [];
  }

  function applyProgram() {
    if (!PROGRAM) return;
    var ids = programTopics(state.month, state.week);
    state.selected = new Set(ids);
    state.mode = 'program';
    syncCheckboxes();
    updateModeButtons();
    updateProgramUI();
    updateCounts();
    saveState();
    prepareRound();
  }

  function setAll(checked) {
    state.mode = 'manual';
    state.selected = checked ? new Set(TOPICS.map(function (t) { return t.id; })) : new Set();
    syncCheckboxes();
    updateModeButtons();
    if (el.program) el.program.hidden = true;
    updateCounts();
    saveState();
    prepareRound();
  }

  function setMode(mode) {
    if (mode === 'program' && !PROGRAM) return;
    state.mode = mode;
    if (mode === 'year') {
      var now = currentPeriod();
      state.month = now.month;
      state.week = now.week;
      state.selected = new Set(TOPICS.map(function (t) { return t.id; }));
      if (el.program) el.program.hidden = true;
      syncCheckboxes();
      updateModeButtons();
      updateCounts();
      saveState();
      prepareRound();
      return;
    }
    if (mode === 'program') {
      if (el.program) el.program.hidden = false;
      applyProgram();
      return;
    }
    if (el.program) el.program.hidden = true;
    updateModeButtons();
    updateCounts();
    saveState();
    prepareRound();
  }

  function buildRound() {
    state.index = 0;
    state.correct = 0;
    state.skipped = 0;
    state.answered = false;
    state.current = null;
    state.mistakes = {};
    state.mistakeItems = [];
    state.skippedItems = [];
    state.round = shuffle(currentPool()).slice(0, 5);
    el.next.textContent = 'Дальше';
    updateScores();
    updateProgress();
  }

  function prepareRound() {
    buildRound();
  }

  function startRound() {
    buildRound();
    if (!state.round.length) {
      showSetup(true);
      return;
    }
    showScreen('game');
    renderTask();
  }

  function showScreen(name) {
    var screens = { setup: el.setup, game: el.game, results: el.results };
    Object.keys(screens).forEach(function (key) {
      var node = screens[key];
      if (!node) return;
      node.hidden = key !== name;
      node.classList.toggle('is-active', key === name);
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function showSetup(focus) {
    showScreen('setup');
    if (focus) focusPanel();
  }

  function updateScores() {
    if (el.scoreOk) el.scoreOk.textContent = state.correct;
    if (el.scoreBad) el.scoreBad.textContent = state.mistakeItems.length;
    if (el.scoreSkip) el.scoreSkip.textContent = state.skipped;
  }

  function updateProgress() {
    if (!state.round.length) {
      el.progress.style.width = '0%';
      if (el.progressText) el.progressText.textContent = '';
      return;
    }
    var value = (state.index + (state.answered ? 1 : 0)) / state.round.length * 100;
    el.progress.style.width = value + '%';
    if (el.progressText) {
      el.progressText.textContent = state.index >= state.round.length
        ? 'Готово'
        : 'Задание ' + (state.index + 1) + ' из ' + state.round.length;
    }
  }

  function setFeedback(kind, title, body) {
    var icons = { ok: '✓', bad: '✕', skip: '⏭' };
    el.feedback.className = 'lang-feedback is-' + kind;
    el.feedback.innerHTML = '<span class="lang-feedback-ico" aria-hidden="true">' + (icons[kind] || '') + '</span>' +
      '<div class="lang-feedback-text"><b>' + title + '</b> ' + body + '</div>';
  }

  function answerHtml(value) {
    var text = String(value);
    return '<b>' + escapeHtml(text) + '</b>' + (/[.!?]$/.test(text) ? '' : '.');
  }

  function taskLabel(task) {
    return '<div class="lang-task-label">' + escapeHtml(task.label) + ' · ' + escapeHtml(topicLabel(task.topic)) + '</div>';
  }

  function renderTask() {
    if (!state.round.length) {
      showSetup(true);
      return;
    }
    if (state.index >= state.round.length) {
      renderResult();
      return;
    }
    var task = state.round[state.index];
    state.current = task;
    state.answered = false;
    state.orderPicked = [];
    el.feedback.textContent = '';
    el.feedback.className = 'lang-feedback';
    el.skip.disabled = false;
    el.next.disabled = true;
    el.next.textContent = 'Дальше';
    updateScores();

    if (task.type === 'choice' || task.type === 'riddle') {
      renderChoiceTask(task);
    } else if (task.type === 'order') {
      renderOrderTask(task);
    } else {
      renderLetterTask(task);
    }
    updateProgress();
  }

  function renderLetterTask(task) {
    var options = shuffle(task.options).map(function (option) {
      return '<button class="lang-option' + (option.length > 1 ? ' is-wide' : '') + '" type="button" data-answer="' + escapeHtml(option) + '">' + escapeHtml(option) + '</button>';
    }).join('');

    el.task.innerHTML = '<div class="lang-task-card">' +
      taskLabel(task) +
      '<div class="lang-sentence">' + escapeHtml(task.before) + '<span class="lang-blank" id="langBlank">?</span>' + escapeHtml(task.after) + '</div>' +
      '<div class="lang-options">' + options + '</div>' +
    '</div>';

    el.task.querySelectorAll('.lang-option').forEach(function (btn) {
      btn.addEventListener('click', function () {
        answerTask(btn.getAttribute('data-answer'), btn);
      });
    });  }

  function renderChoiceTask(task) {
    var options = shuffle(task.options).map(function (option) {
      return '<button class="lang-option is-word" type="button" data-answer="' + escapeHtml(option) + '">' + escapeHtml(option) + '</button>';
    }).join('');

    el.task.innerHTML = '<div class="lang-task-card">' +
      taskLabel(task) +
      '<div class="lang-prompt">' + escapeHtml(task.prompt) + '</div>' +
      '<div class="lang-options">' + options + '</div>' +
    '</div>';

    el.task.querySelectorAll('.lang-option').forEach(function (btn) {
      btn.addEventListener('click', function () {
        answerChoice(btn.getAttribute('data-answer'), btn);
      });
    });  }

  function renderOrderTask(task) {
    state.orderPicked = [];
    state.orderBank = shuffle(task.words.map(function (word, index) {
      return { word: word, index: index };
    }));
    el.task.innerHTML = '<div class="lang-task-card">' +
      taskLabel(task) +
      '<div class="lang-prompt">Собери предложение из слов.</div>' +
      '<div class="lang-order-line" id="langOrderLine"></div>' +
      '<div class="lang-order-bank" id="langOrderBank"></div>' +
    '</div>';
    renderOrderParts();
    el.next.textContent = 'Проверить';
    el.next.disabled = true;  }

  function renderOrderParts() {
    var task = state.current;
    var line = document.getElementById('langOrderLine');
    var bank = document.getElementById('langOrderBank');
    if (!task || !line || !bank) return;

    line.innerHTML = state.orderPicked.length
      ? state.orderPicked.map(function (item) {
          return '<button class="lang-order-chip" type="button" data-pick="' + item.index + '">' + escapeHtml(item.word) + '</button>';
        }).join('')
      : '<span class="lang-order-placeholder">Нажимай на слова, чтобы собрать предложение</span>';

    var picked = new Set(state.orderPicked.map(function (item) { return item.index; }));
    bank.innerHTML = state.orderBank.map(function (item) {
      return picked.has(item.index) ? '' : '<button class="lang-order-chip" type="button" data-bank="' + item.index + '">' + escapeHtml(item.word) + '</button>';
    }).join('');

    line.querySelectorAll('button[data-pick]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (state.answered) return;
        var index = Number(btn.getAttribute('data-pick'));
        state.orderPicked = state.orderPicked.filter(function (item) { return item.index !== index; });
        renderOrderParts();
      });
    });

    bank.querySelectorAll('button[data-bank]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (state.answered) return;
        var index = Number(btn.getAttribute('data-bank'));
        if (state.orderPicked.some(function (item) { return item.index === index; })) return;
        var item = state.orderBank.find(function (x) { return x.index === index; });
        if (item) state.orderPicked.push(item);
        renderOrderParts();
      });
    });

    if (state.answered) {
      line.querySelectorAll('button').forEach(function (btn) { btn.disabled = true; });
      bank.querySelectorAll('button').forEach(function (btn) { btn.disabled = true; });
      el.next.disabled = true;
    } else {
      el.next.disabled = state.orderPicked.length !== task.words.length;
    }
  }

  function fillBlank(value, status) {
    var blank = document.getElementById('langBlank');
    if (!blank) return;
    blank.textContent = value;
    blank.classList.add('is-filled');
    blank.classList.remove('is-ok', 'is-bad');
    if (status) blank.classList.add(status);
  }

  function answerTask(value, btn) {
    if (state.answered || !state.current) return;
    state.answered = true;
    var task = state.current;
    var isCorrect = value === task.answer;
    el.task.querySelectorAll('.lang-option').forEach(function (option) {
      option.disabled = true;
      if (option.getAttribute('data-answer') === task.answer) option.classList.add('is-correct');
    });
    if (!isCorrect) {
      btn.classList.add('is-wrong');
      state.mistakes[task.topic] = true;
      state.mistakeItems.push({ task: task, given: value });
      fillBlank(value, 'is-bad');
      setFeedback('bad', 'Пока нет.', 'Правильно: ' + answerHtml(task.answer) + ' ' + escapeHtml(task.rule));
    } else {
      state.correct += 1;
      fillBlank(value, 'is-ok');
      setFeedback('ok', 'Верно.', escapeHtml(task.rule));
    }
    el.skip.disabled = true;
    el.next.disabled = false;
    updateScores();
    updateProgress();
  }

  function answerChoice(value, btn) {
    if (state.answered || !state.current) return;
    state.answered = true;
    var task = state.current;
    var isCorrect = value === task.answer;
    el.task.querySelectorAll('.lang-option').forEach(function (option) {
      option.disabled = true;
      if (option.getAttribute('data-answer') === task.answer) option.classList.add('is-correct');
    });
    if (!isCorrect) {
      btn.classList.add('is-wrong');
      state.mistakes[task.topic] = true;
      state.mistakeItems.push({ task: task, given: value });
      setFeedback('bad', 'Пока нет.', 'Правильно: ' + answerHtml(task.answer) + ' ' + escapeHtml(task.rule || ''));
    } else {
      state.correct += 1;
      setFeedback('ok', 'Верно.', escapeHtml(task.rule || ''));
    }
    el.skip.disabled = true;
    el.next.disabled = false;
    updateScores();
    updateProgress();
  }

  function skipChoice() {
    if (state.answered || !state.current) return;
    state.answered = true;
    state.skipped += 1;
    var task = state.current;
    state.skippedItems.push({ task: task });
    el.task.querySelectorAll('.lang-option').forEach(function (option) {
      option.disabled = true;
      if (option.getAttribute('data-answer') === task.answer) option.classList.add('is-correct');
    });
    setFeedback('skip', 'Пропущено.', 'Правильно: ' + answerHtml(task.answer) + ' ' + escapeHtml(task.rule || ''));
    el.skip.disabled = true;
    el.next.disabled = false;
    updateScores();
    updateProgress();
  }

  function checkOrder() {
    if (state.answered || !state.current || state.current.type !== 'order') return;
    var task = state.current;
    if (state.orderPicked.length !== task.words.length) return;
    state.answered = true;
    var value = state.orderPicked.map(function (item) { return item.word; }).join(' ');
    var isCorrect = value === task.answer;
    if (!isCorrect) {
      state.mistakes[task.topic] = true;
      state.mistakeItems.push({ task: task, given: value });
      setFeedback('bad', 'Пока нет.', 'Правильно: ' + answerHtml(task.answer) + ' ' + escapeHtml(task.rule || ''));
    } else {
      state.correct += 1;
      setFeedback('ok', 'Верно.', escapeHtml(task.rule || ''));
    }
    el.skip.disabled = true;
    renderOrderParts();
    el.next.textContent = 'Дальше';
    el.next.disabled = false;
    updateScores();
    updateProgress();
  }

  function skipOrder() {
    if (state.answered || !state.current) return;
    var task = state.current;
    state.answered = true;
    state.skipped += 1;
    state.skippedItems.push({ task: task });
    state.orderPicked = task.words.map(function (word, index) {
      return { word: word, index: index };
    });
    renderOrderParts();
    setFeedback('skip', 'Пропущено.', 'Правильно: ' + answerHtml(task.answer) + ' ' + escapeHtml(task.rule || ''));
    el.skip.disabled = true;
    el.next.textContent = 'Дальше';
    el.next.disabled = false;
    updateScores();
    updateProgress();
  }

  function skipTask() {
    if (state.answered || !state.current) return;
    if (state.current.type === 'order') {
      skipOrder();
      return;
    }
    if (state.current.type === 'choice' || state.current.type === 'riddle') {
      skipChoice();
      return;
    }
    state.answered = true;
    state.skipped += 1;
    var task = state.current;
    state.skippedItems.push({ task: task });
    el.task.querySelectorAll('.lang-option').forEach(function (option) {
      option.disabled = true;
      if (option.getAttribute('data-answer') === task.answer) option.classList.add('is-correct');
    });
    fillBlank(task.answer, 'is-ok');
    setFeedback('skip', 'Пропущено.', 'Правильно: ' + answerHtml(task.answer) + ' ' + escapeHtml(task.rule));
    el.skip.disabled = true;
    el.next.disabled = false;
    updateScores();
    updateProgress();
  }

  function goNext() {
    if (!state.current) return;
    if (state.current.type === 'order' && !state.answered) {
      checkOrder();
      return;
    }
    if (!state.answered) return;
    state.index += 1;
    renderTask();
  }

  function resultTaskLine(task) {
    if (task.type === 'letter' || !task.type) {
      return escapeHtml(task.before) + '<b class="lang-review-answer">' + escapeHtml(task.answer) + '</b>' + escapeHtml(task.after);
    }
    if (task.type === 'order') {
      return '<b class="lang-review-answer">' + escapeHtml(task.answer) + '</b>';
    }
    return escapeHtml(task.prompt || '');
  }

  function resultGiven(item) {
    var task = item.task;
    if (task.type === 'order') return 'Твой ответ: «' + escapeHtml(item.given) + '» ';
    return 'Ты выбрал: «' + escapeHtml(item.given) + '» ';
  }

  function renderReviewItem(item, skipped) {
    var task = item.task;
    return '<div class="lang-review-item">' +
      '<div class="lang-review-task">' + escapeHtml(task.label) + ' · ' + escapeHtml(topicLabel(task.topic)) + '</div>' +
      '<div class="lang-review-line">' + resultTaskLine(task) + '</div>' +
      '<div class="lang-review-given">' + (skipped ? '' : resultGiven(item)) +
        'Правильно: ' + answerHtml(task.answer) + '</div>' +
      '<div class="lang-review-rule">' + escapeHtml(task.rule || '') + '</div>' +
    '</div>';
  }

  function renderResult() {
    var total = state.round.length;
    var wrong = state.mistakeItems.length;
    var answered = state.correct + wrong;
    var accuracy = answered ? Math.round(state.correct / answered * 100) : null;
    var allSkipped = total > 0 && state.skipped === total;
    var verdict;
    if (allSkipped) verdict = 'Все задания пропущены. Это не ошибки — просто вернись, когда будет удобно.';
    else if (state.correct === total) verdict = 'Отлично! Все задания выполнены верно.';
    else if (accuracy !== null && accuracy >= 80) verdict = 'Хорошо! Осталось разобрать ошибки.';
    else if (accuracy !== null && accuracy >= 60) verdict = 'Неплохо. Повтори правила по ошибкам и попробуй ещё раз.';
    else verdict = 'Не сдавайся: разбери ошибки и попробуй снова.';

    var review = state.mistakeItems.length
      ? state.mistakeItems.map(function (item) { return renderReviewItem(item, false); }).join('')
      : '<div class="lang-review-none">Ошибок нет.</div>';
    var skipped = state.skippedItems.length
      ? '<div class="lang-review-block"><h3>Пропущенные задания</h3>' +
        state.skippedItems.map(function (item) { return renderReviewItem(item, true); }).join('') + '</div>'
      : '';
    var topics = Object.keys(state.mistakes).map(topicLabel);

    el.resultBody.innerHTML = '<div class="lang-result">' +
      '<div class="lang-kicker">Раунд завершён</div>' +
      '<div class="lang-result-top">' +
        '<div class="lang-result-score"><b>' + state.correct + '</b><span>из ' + total + '</span></div>' +
        '<p class="lang-result-verdict">' + verdict + '</p>' +
      '</div>' +
      '<div class="lang-result-stats">' +
        '<div class="lang-stat is-ok"><span aria-hidden="true">✅</span><b>' + state.correct + '</b><span>верно</span></div>' +
        '<div class="lang-stat is-bad"><span aria-hidden="true">❌</span><b>' + wrong + '</b><span>ошибок</span></div>' +
        '<div class="lang-stat is-skip"><span aria-hidden="true">⏭️</span><b>' + state.skipped + '</b><span>пропущено</span></div>' +
        '<div class="lang-stat"><span aria-hidden="true">🎯</span><b>' + (accuracy === null ? '—' : accuracy + '%') + '</b><span>точность</span></div>' +
      '</div>' +
      (topics.length ? '<p class="lang-review-topics">Повторить темы: <b>' + escapeHtml(topics.join(', ')) + '</b></p>' : '') +
      '<div class="lang-review-block"><h3>Разбор ошибок</h3>' + review + '</div>' +
      skipped +
      '<div class="lang-result-actions">' +
        '<button class="lang-primary" type="button" id="langAgain">Ещё раз</button>' +
        '<button class="lang-ghost" type="button" id="langResultEdit">Изменить темы</button>' +
      '</div>' +
    '</div>';

    el.feedback.textContent = '';
    el.feedback.className = 'lang-feedback';
    el.skip.disabled = true;
    el.next.disabled = true;
    el.progress.style.width = '100%';
    if (el.progressText) el.progressText.textContent = 'Готово';
    updateScores();
    showScreen('results');

    var again = document.getElementById('langAgain');
    if (again) again.addEventListener('click', startRound);
    var edit = document.getElementById('langResultEdit');
    if (edit) edit.addEventListener('click', function () { showSetup(true); });
  }

  function focusPanel() {
    el.panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    var first = el.topicList.querySelector('input[data-topic]');
    if (first) window.setTimeout(function () { first.focus({ preventScroll: true }); }, 250);
  }

  document.querySelectorAll('.lang-modes button[data-mode]').forEach(function (btn) {
    btn.addEventListener('click', function () { setMode(btn.getAttribute('data-mode')); });
  });

  if (el.fantasy) {
    el.fantasy.querySelectorAll('button[data-kind]').forEach(function (btn) {
      btn.addEventListener('click', function () { setKind(btn.getAttribute('data-kind')); });
    });
  }

  el.topicList.addEventListener('change', function (event) {
    var input = event.target.closest('input[data-topic]');
    if (!input) return;
    var id = input.getAttribute('data-topic');
    if (input.checked) state.selected.add(id);
    else state.selected.delete(id);
    state.mode = 'manual';
    if (el.program) el.program.hidden = true;
    updateModeButtons();
    updateCounts();
    saveState();
    prepareRound();
  });

  el.all.addEventListener('click', function () { setAll(true); });
  el.clear.addEventListener('click', function () { setAll(false); });
  el.reset.addEventListener('click', function () { setMode('year'); });
  el.start.addEventListener('click', startRound);
  el.back.addEventListener('click', function () { showSetup(false); });
  el.skip.addEventListener('click', skipTask);
  el.next.addEventListener('click', goNext);

  function init() {
    loadState();
    buildTopicList();
    buildProgram();
    if (state.mode === 'program' && PROGRAM) {
      if (el.program) el.program.hidden = false;
      updateProgramUI();
    } else {
      if (el.program) el.program.hidden = true;
    }
    updateModeButtons();
    updateFantasyUI();
    updateCounts();
    prepareRound();
    showScreen('setup');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
