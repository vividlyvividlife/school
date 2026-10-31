/* Общий генератор текстовых задач и ломаных для тренажёров и раздатки. */
(function(global){
'use strict';

var LANG = (document.documentElement.lang || 'ru').toLowerCase().indexOf('en') === 0 ? 'en' : 'ru';
function tr(ru, en){ return LANG === 'en' ? en : ru; }
function ri(rnd, a, b){ return a + Math.floor(rnd() * (b - a + 1)); }
function pick(rnd, arr){ return arr[Math.floor(rnd() * arr.length)]; }
function b(v){ return '<b>' + v + '</b>'; }
function strip(html){
  return String(html).replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

function basePath(){
  var b = document.documentElement.getAttribute('data-base') || '/';
  return b.replace(/\/+$/, '') + '/';
}
function sceneUrl(name){
  var map = global.__PROBLEM_IMG__;
  if(map && map[name]) return map[name];
  return basePath() + 'img/problems/' + name + '.webp';
}

var UNITS = {
  kg:      { ru: ['кг', 'кг', 'кг'], en: ['kg', 'kg'] },
  dm:      { ru: ['дм', 'дм', 'дм'], en: ['dm', 'dm'] },
  m:       { ru: ['м', 'м', 'м'], en: ['m', 'm'] },
  boats:   { ru: ['катер', 'катера', 'катеров'], en: ['boat', 'boats'] },
  cars:    { ru: ['машина', 'машины', 'машин'], en: ['car', 'cars'] },
  plums:   { ru: ['слива', 'сливы', 'слив'], en: ['plum', 'plums'] },
  tulips:  { ru: ['тюльпан', 'тюльпана', 'тюльпанов'], en: ['tulip', 'tulips'] },
  daisies: { ru: ['ромашка', 'ромашки', 'ромашек'], en: ['daisy', 'daisies'] },
  girls:   { ru: ['девочка', 'девочки', 'девочек'], en: ['girl', 'girls'] },
  boys:    { ru: ['мальчик', 'мальчика', 'мальчиков'], en: ['boy', 'boys'] },
  students:{ ru: ['ученик', 'ученика', 'учеников'], en: ['student', 'students'] },
  pencils: { ru: ['карандаш', 'карандаша', 'карандашей'], en: ['pencil', 'pencils'] },
  rubles:  { ru: ['рубль', 'рубля', 'рублей'], en: ['rouble', 'roubles'] },
  sets:    { ru: ['набор', 'набора', 'наборов'], en: ['set', 'sets'] },
  baskets: { ru: ['корзина', 'корзины', 'корзин'], en: ['basket', 'baskets'] },
  appleTrees: { ru: ['яблоня', 'яблони', 'яблонь'], en: ['apple tree', 'apple trees'] },
  pearTrees:  { ru: ['груша', 'груши', 'груш'], en: ['pear tree', 'pear trees'] },
  times:   { ru: ['раз', 'раза', 'раз'], en: ['time', 'times'] },
  years:   { ru: ['год', 'года', 'лет'], en: ['year', 'years'] },
  fish:    { ru: ['рыбка', 'рыбки', 'рыбок'], en: ['fish', 'fish'] },
  buns:    { ru: ['булочка', 'булочки', 'булочек'], en: ['bun', 'buns'] },
  plates:  { ru: ['тарелка', 'тарелки', 'тарелок'], en: ['plate', 'plates'] }
};

function pluralRu(n, forms){
  var n10 = n % 10, n100 = n % 100;
  if(n10 === 1 && n100 !== 11) return forms[0];
  if(n10 >= 2 && n10 <= 4 && (n100 < 10 || n100 >= 20)) return forms[1];
  return forms[2];
}
function unitText(n, key){
  var u = UNITS[key] || { ru: ['', '', ''], en: ['', ''] };
  if(LANG === 'en') return Math.abs(n) === 1 ? u.en[0] : u.en[1];
  return pluralRu(Math.abs(n), u.ru);
}
function q(n, key){ return b(n) + ' ' + unitText(n, key); }

function sceneImg(name){
  return '<img class="wp-img" src="' + sceneUrl(name) + '" alt="" decoding="async">';
}
function answerRow(slot, unit, label){
  return '<div class="wp-answer"><span class="wp-answer-label">' + label + '</span>' +
    slot + '<span class="unit">' + unit + '</span></div>';
}
function helpBox(html){
  if(!html) return '';
  return '<details class="wp-help"><summary>' + tr('Разбор', 'How to solve') + '</summary>' +
    '<div class="wp-help-body">' + html + '</div></details>';
}
function eqLine(html){ return '<div class="wp-eq">' + html + '</div>'; }
function repAdd(a, k, unitKey){
  var parts = [], i;
  for(i = 0; i < k; i++) parts.push(b(a));
  return eqLine(parts.join(' + ') + ' = ' + q(a * k, unitKey));
}
function addChainOf(a, k){
  var parts = [], i;
  for(i = 0; i < k; i++) parts.push(a);
  return parts.join(' + ');
}
function subChain(total, step){
  var parts = [total], i, rounds = Math.round(total / step);
  for(i = 0; i < rounds; i++) parts.push(step);
  return parts.join(' − ');
}
function repSub(total, step){
  return eqLine(subChain(total, step) + ' = 0');
}

function makeProblem(type, id, scene, ruHtml, enHtml, answer, unitKey, explainRu, explainEn, work){
  var html = LANG === 'en' ? enHtml : ruHtml;
  var explain = LANG === 'en' ? explainEn : explainRu;
  var unit = unitText(answer, unitKey);
  var prompt = '<div class="wp">' +
      '<figure class="wp-fig">' + sceneImg(scene) + '</figure>' +
      '<div class="wp-text">' + html + '</div>' +
      answerRow('{{slot}}', unit, tr('Ответ: ', 'Answer: ')) +
      helpBox(explain) +
    '</div>';
  var sheet = '<span class="wp-sheet-img">' + sceneImg(scene) + '</span>' +
    '<span class="wp-t">' + html + '</span>' +
    '{{work}}' +
    '<span class="wp-a">' + tr('Ответ: ', 'Answer: ') + '{{b}} ' + unit + '</span>';
  return {
    id: 'wp:' + type + ':' + id,
    type: type,
    prompt: prompt,
    html: html,
    sheetHtml: sheet,
    text: strip(html),
    need: answer,
    answerText: answer + ' ' + unit,
    unit: unit,
    answerKind: 'number',
    layout: 'word',
    max: answer + 10,
    long: true,
    scene: scene,
    explain: strip(explain),
    work: work ? (LANG === 'en' ? work.en : work.ru) : null
  };
}

/* краткая запись и ход решения для печати: { given: [[подпись, значение]], steps: [[выражение, результат]] } */
function W(ruGiven, ruSteps, enGiven, enSteps){
  return { ru: { given: ruGiven, steps: ruSteps }, en: { given: enGiven, steps: enSteps } };
}
function pv(n, key){ return n + ' ' + unitText(n, key); }

/* ---------- числовые помощники ---------- */
function limits(opts){
  opts = opts || {};
  var lo = Math.max(1, parseInt(opts.from, 10) || 1);
  var hi = Math.max(lo, Math.min(100, parseInt(opts.to, 10) || 100));
  return { lo: lo, hi: hi };
}
function sumWithin(rnd, count, lo, hi, cap){
  for(var i = 0; i < 300; i++){
    var vals = [], sum = 0;
    for(var j = 0; j < count; j++){
      var v = ri(rnd, lo, Math.max(lo, Math.min(hi, cap - sum - (count - j - 1) * lo)));
      vals.push(v); sum += v;
    }
    if(sum <= cap) return vals;
  }
  return null;
}
function sumExact(rnd, count, lo, hi, cap){
  var v = sumWithin(rnd, count, lo, hi, cap);
  if(v) return v;
  var out = [], rest = cap;
  for(var i = 0; i < count; i++){
    var n = i === count - 1 ? rest : Math.max(1, Math.floor(rest / (count - i)));
    out.push(n); rest -= n;
  }
  return out;
}

/* ---------- типы задач ---------- */
var PROBLEM_TYPES = [
  'total', 'leftover', 'arriveLeave', 'reverse', 'difference', 'moreBy', 'lessBy', 'twoGroups',
  'diffTotal', 'mulAdd', 'price', 'mulTotal', 'share', 'groups',
  'timesMore', 'timesLess', 'timesCompare', 'sumDiff', 'equalize', 'wasUnknown'
];

var PROBLEM_OPS = {
  total: ['add'],
  leftover: ['sub'],
  arriveLeave: ['add', 'sub'],
  reverse: ['sub', 'add'],
  difference: ['sub'],
  moreBy: ['add'],
  lessBy: ['sub'],
  twoGroups: ['add'],
  diffTotal: ['sub', 'add'],
  mulAdd: ['mul', 'add'],
  price: ['mul'],
  mulTotal: ['mul'],
  share: ['div'],
  groups: ['div'],
  timesMore: ['mul'],
  timesLess: ['div'],
  timesCompare: ['div'],
  sumDiff: ['sub', 'div'],
  equalize: ['sub', 'div'],
  wasUnknown: ['add', 'sub']
};

/* Задачи со звёздочкой: те же сюжеты, но решение — повторное сложение
   или вычитание. Без звезды они решаются умножением и делением. */
var PROBLEM_STAR = ['mulAdd', 'price', 'mulTotal', 'share', 'groups',
  'timesMore', 'timesLess', 'timesCompare'];
/* звёздный способ решения: чем заменяем × и ÷ */
var PROBLEM_ALT = {
  mulAdd: ['add'],
  price: ['add'],
  mulTotal: ['add'],
  share: ['sub'],
  groups: ['sub'],
  timesMore: ['add'],
  timesLess: ['sub'],
  timesCompare: ['sub']
};

function problemIsStarred(type){
  return PROBLEM_STAR.indexOf(type) >= 0;
}

function problemStarRoute(type){
  var alt = PROBLEM_ALT[type];
  return alt ? alt.slice() : (PROBLEM_OPS[type] || []).slice();
}
function problemRoutes(type, star){
  if(star && problemIsStarred(type)) return [problemStarRoute(type)];
  if(!star && problemIsStarred(type) && !PROBLEM_ALT[type]) return [];
  return [(PROBLEM_OPS[type] || []).slice()];
}
function routeFits(route, ops){
  for(var i = 0; i < route.length; i++){
    if(ops.indexOf(route[i]) < 0) return false;
  }
  return true;
}
function problemTypeOps(type){
  return (PROBLEM_OPS[type] || []).slice();
}
function problemTypeNeeds(type, star){
  var routes = problemRoutes(type, star);
  return routes.filter(function(r, i){
    return !routes.some(function(o, j){
      return j !== i && o.length < r.length && routeFits(o, r);
    });
  });
}
function problemTypesForOps(types, ops, star){
  ops = ops || [];
  return (types && types.length ? types : PROBLEM_TYPES).filter(function(t){
    /* звёздные задачи включаются самой звездой, действия их не фильтруют */
    if(star && problemIsStarred(t)) return true;
    return problemRoutes(t, star).some(function(r){ return routeFits(r, ops); });
  });
}

function genTotal(rnd, L){
  var s = sumExact(rnd, 3, Math.max(2, L.lo), L.hi, L.hi);
  var a = s[0], bb = s[1], c = s[2], n = a + bb + c;
  return makeProblem('total', a + ':' + bb + ':' + c, 'port',
    'У причала ' + q(a, 'boats') + '. Утром приплыли ещё ' + q(bb, 'boats') + ', а днём — ещё ' + q(c, 'boats') + '. Сколько катеров стало у причала?',
    'There are ' + q(a, 'boats') + ' at the pier. In the morning ' + q(bb, 'boats') + ' arrived, and in the afternoon ' + q(c, 'boats') + ' more. How many boats are at the pier now?',
    n, 'boats',
    eqLine(q(a, 'boats') + ' + ' + q(bb, 'boats') + ' = ' + q(a + bb, 'boats')) +
      eqLine(q(a + bb, 'boats') + ' + ' + q(c, 'boats') + ' = ' + q(n, 'boats')),
    eqLine(q(a, 'boats') + ' + ' + q(bb, 'boats') + ' = ' + q(a + bb, 'boats')) +
      eqLine(q(a + bb, 'boats') + ' + ' + q(c, 'boats') + ' = ' + q(n, 'boats')),
    W(
      [['Было', pv(a, 'boats')], ['Утром', pv(bb, 'boats')], ['Днём', pv(c, 'boats')], ['Стало', '?']],
      [[a + ' + ' + bb, a + bb], [a + bb + ' + ' + c, n]],
      [['At first', pv(a, 'boats')], ['Morning', pv(bb, 'boats')], ['Afternoon', pv(c, 'boats')], ['Now', '?']],
      [[a + ' + ' + bb, a + bb], [a + bb + ' + ' + c, n]]));
}

function genLeftover(rnd, L){
  var cap = Math.max(5, L.hi);
  var m = ri(rnd, 4, cap);
  var a = ri(rnd, 1, Math.max(1, m - 2));
  var bb = ri(rnd, 1, Math.max(1, m - a - 1));
  if(a + bb >= m){ bb = 1; }
  var n = m - a - bb;
  if(n < 1){ a = 1; bb = 1; n = m - 2; }
  return makeProblem('leftover', m + ':' + a + ':' + bb, 'ribbon',
    'В мастерской был моток ленты длиной ' + b(m) + ' дм. Сначала отрезали ' + b(a) + ' дм, а потом ещё ' + b(bb) + ' дм. Сколько дециметров ленты осталось?',
    'A roll of ribbon was ' + b(m) + ' dm long. First ' + b(a) + ' dm was cut off, then another ' + b(bb) + ' dm. How many decimetres are left?',
    n, 'dm',
    eqLine(b(m) + ' − ' + b(a) + ' − ' + b(bb) + ' = ' + b(n) + ' дм') +
      '<p>Можно вычитать по частям: ' + b(m) + ' − ' + b(a) + ' = ' + b(m - a) + ', затем ' + b(m - a) + ' − ' + b(bb) + ' = ' + b(n) + '.</p>',
    eqLine(b(m) + ' − ' + b(a) + ' − ' + b(bb) + ' = ' + b(n) + ' dm') +
      '<p>You can subtract in steps: ' + b(m) + ' − ' + b(a) + ' = ' + b(m - a) + ', then ' + b(m - a) + ' − ' + b(bb) + ' = ' + b(n) + '.</p>',
    W(
      [['Было', m + ' дм'], ['Отрезали', a + ' дм и ' + bb + ' дм'], ['Осталось', '?']],
      [[m + ' − ' + a, m - a], [m - a + ' − ' + bb, n]],
      [['At first', m + ' dm'], ['Cut off', a + ' dm and ' + bb + ' dm'], ['Left', '?']],
      [[m + ' − ' + a, m - a], [m - a + ' − ' + bb, n]]));
}

function genArriveLeave(rnd, L){
  var m, a, bb, n;
  for(var i = 0; i < 80; i++){
    m = ri(rnd, Math.max(2, L.lo), Math.max(3, Math.min(L.hi, 80)));
    a = ri(rnd, 5, Math.max(5, Math.min(25, L.hi - m)));
    bb = ri(rnd, 5, Math.max(5, Math.min(25, m + a - 1)));
    n = m + a - bb;
    if(n >= 1 && n <= L.hi) break;
  }
  if(n < 1 || n > L.hi){ m = 20; a = 10; bb = 5; n = 25; }
  return makeProblem('arriveLeave', m + ':' + a + ':' + bb, 'parking',
    'На стоянке было ' + q(m, 'cars') + '. Приехало ещё ' + q(a, 'cars') + ', а ' + q(bb, 'cars') + ' уехало. Сколько машин стало на стоянке?',
    'There were ' + q(m, 'cars') + ' in the car park. ' + q(a, 'cars') + ' arrived, and ' + q(bb, 'cars') + ' left. How many cars are in the car park now?',
    n, 'cars',
    eqLine(q(m, 'cars') + ' + ' + q(a, 'cars') + ' = ' + q(m + a, 'cars')) +
      eqLine(q(m + a, 'cars') + ' − ' + q(bb, 'cars') + ' = ' + q(n, 'cars')),
    eqLine(q(m, 'cars') + ' + ' + q(a, 'cars') + ' = ' + q(m + a, 'cars')) +
      eqLine(q(m + a, 'cars') + ' − ' + q(bb, 'cars') + ' = ' + q(n, 'cars')),
    W(
      [['Было', pv(m, 'cars')], ['Приехало', pv(a, 'cars')], ['Уехало', pv(bb, 'cars')], ['Стало', '?']],
      [[m + ' + ' + a, m + a], [m + a + ' − ' + bb, n]],
      [['At first', pv(m, 'cars')], ['Arrived', pv(a, 'cars')], ['Left', pv(bb, 'cars')], ['Now', '?']],
      [[m + ' + ' + a, m + a], [m + a + ' − ' + bb, n]]));
}

function genReverse(rnd, L){
  var m, a, bb, n;
  for(var i = 0; i < 80; i++){
    m = ri(rnd, Math.max(4, L.lo), L.hi);
    a = ri(rnd, 2, Math.max(2, m - 1));
    bb = ri(rnd, 2, Math.max(2, Math.min(30, L.hi - (m - a))));
    n = m - a + bb;
    if(n >= 1 && n <= L.hi) break;
  }
  if(n < 1 || n > L.hi){ m = 20; a = 8; bb = 5; n = 17; }
  return makeProblem('reverse', m + ':' + a + ':' + bb, 'plums',
    'В вазе было ' + q(m, 'plums') + '. За завтраком съели ' + q(a, 'plums') + ', а после обеда положили ещё ' + q(bb, 'plums') + '. Сколько слив стало в вазе?',
    'There were ' + q(m, 'plums') + ' in a bowl. At breakfast ' + q(a, 'plums') + ' were eaten, and after lunch ' + q(bb, 'plums') + ' more were added. How many plums are in the bowl now?',
    n, 'plums',
    eqLine(q(m, 'plums') + ' − ' + q(a, 'plums') + ' = ' + q(m - a, 'plums')) +
      eqLine(q(m - a, 'plums') + ' + ' + q(bb, 'plums') + ' = ' + q(n, 'plums')),
    eqLine(q(m, 'plums') + ' − ' + q(a, 'plums') + ' = ' + q(m - a, 'plums')) +
      eqLine(q(m - a, 'plums') + ' + ' + q(bb, 'plums') + ' = ' + q(n, 'plums')),
    W(
      [['Было', pv(m, 'plums')], ['Съели', pv(a, 'plums')], ['Положили', pv(bb, 'plums')], ['Стало', '?']],
      [[m + ' − ' + a, m - a], [m - a + ' + ' + bb, n]],
      [['At first', pv(m, 'plums')], ['Eaten', pv(a, 'plums')], ['Added', pv(bb, 'plums')], ['Now', '?']],
      [[m + ' − ' + a, m - a], [m - a + ' + ' + bb, n]]));
}

function genDifference(rnd, L){
  var h = ri(rnd, Math.max(3, L.lo), Math.max(3, L.hi));
  var low = ri(rnd, 1, Math.max(1, h - 1));
  var n = h - low;
  return makeProblem('difference', h + ':' + low, 'forest',
    'Высота ели ' + b(h) + ' м, а сосны — ' + b(low) + ' м. На сколько метров ель выше сосны?',
    'A fir tree is ' + b(h) + ' m tall, and a pine is ' + b(low) + ' m tall. How many metres taller is the fir?',
    n, 'm',
    '<p>Чтобы узнать, на сколько одно число больше другого, вычтем из большего меньшее.</p>' + eqLine(b(h) + ' − ' + b(low) + ' = ' + b(n) + ' м'),
    '<p>To find how much larger one number is, subtract the smaller from the larger.</p>' + eqLine(b(h) + ' − ' + b(low) + ' = ' + b(n) + ' m'),
    W(
      [['Ель', h + ' м'], ['Сосна', low + ' м'], ['Разница', '?']],
      [[h + ' − ' + low, n]],
      [['Fir', h + ' m'], ['Pine', low + ' m'], ['Difference', '?']],
      [[h + ' − ' + low, n]]));
}

function genMoreBy(rnd, L){
  var aLo = Math.max(2, L.lo);
  var a = ri(rnd, aLo, Math.max(aLo, L.hi - 2));
  var k = ri(rnd, 2, Math.max(2, L.hi - a));
  var n = a + k;
  return makeProblem('moreBy', a + ':' + k, 'garden',
    'На клумбе расцвели ' + q(a, 'tulips') + ', а ромашек — на ' + b(k) + ' больше. Сколько ромашек расцвело на клумбе?',
    'There are ' + q(a, 'tulips') + ' in the flower bed, and ' + b(k) + ' more daisies. How many daisies are there?',
    n, 'daisies',
    '<p>«На ' + k + ' больше» — значит столько же и ещё ' + k + '.</p>' + eqLine(q(a, 'tulips') + ' + ' + b(k) + ' = ' + q(n, 'daisies')),
    '<p>“' + k + ' more” means the same amount plus ' + k + '.</p>' + eqLine(q(a, 'tulips') + ' + ' + b(k) + ' = ' + q(n, 'daisies')),
    W(
      [['Тюльпаны', pv(a, 'tulips')], ['Ромашки', '?, на ' + k + ' больше']],
      [[a + ' + ' + k, n]],
      [['Tulips', pv(a, 'tulips')], ['Daisies', '?, ' + k + ' more']],
      [[a + ' + ' + k, n]]));
}

function genLessBy(rnd, L){
  var girls = ri(rnd, Math.max(12, L.lo), Math.max(13, Math.min(L.hi, 30)));
  var k = ri(rnd, 2, Math.max(2, Math.min(9, girls - 1)));
  var n = girls - k;
  return makeProblem('lessBy', girls + ':' + k, 'classroom',
    'В классе ' + q(girls, 'girls') + ', а мальчиков — на ' + b(k) + ' меньше. Сколько мальчиков в классе?',
    'There are ' + q(girls, 'girls') + ' in the class. There are ' + b(k) + ' fewer boys. How many boys are there?',
    n, 'boys',
    '<p>«На ' + k + ' меньше» — значит столько же, но без ' + k + '.</p>' + eqLine(q(girls, 'girls') + ' − ' + b(k) + ' = ' + q(n, 'boys')),
    '<p>“' + k + ' fewer” means the same amount minus ' + k + '.</p>' + eqLine(q(girls, 'girls') + ' − ' + b(k) + ' = ' + q(n, 'boys')),
    W(
      [['Девочки', pv(girls, 'girls')], ['Мальчики', '?, на ' + k + ' меньше']],
      [[girls + ' − ' + k, n]],
      [['Girls', pv(girls, 'girls')], ['Boys', '?, ' + k + ' fewer']],
      [[girls + ' − ' + k, n]]));
}

function genTwoGroups(rnd, L){
  var a = ri(rnd, L.lo, Math.max(L.lo, L.hi - 1));
  var bb = ri(rnd, 1, Math.max(1, L.hi - a));
  var n = a + bb;
  return makeProblem('twoGroups', a + ':' + bb, 'orchard',
    'В саду собрали ' + q(a, 'kg') + ' яблок и ' + q(bb, 'kg') + ' груш. Сколько килограммов фруктов собрали?',
    'They picked ' + q(a, 'kg') + ' of apples and ' + q(bb, 'kg') + ' of pears in the orchard. How many kilograms of fruit did they pick?',
    n, 'kg',
    '<p>Фрукты собрали в двух группах — нужно найти общее количество.</p>' + eqLine(q(a, 'kg') + ' + ' + q(bb, 'kg') + ' = ' + q(n, 'kg')),
    '<p>The fruit is in two groups — find the total.</p>' + eqLine(q(a, 'kg') + ' + ' + q(bb, 'kg') + ' = ' + q(n, 'kg')),
    W(
      [['Яблоки', pv(a, 'kg')], ['Груши', pv(bb, 'kg')], ['Всего', '?']],
      [[a + ' + ' + bb, n]],
      [['Apples', pv(a, 'kg')], ['Pears', pv(bb, 'kg')], ['Total', '?']],
      [[a + ' + ' + bb, n]]));
}

function genDiffTotal(rnd, L){
  var a, k, second, n;
  for(var i = 0; i < 80; i++){
    a = ri(rnd, Math.max(10, L.lo), Math.max(11, Math.min(L.hi, 35)));
    k = ri(rnd, 2, Math.max(2, Math.min(a - 1, 9)));
    second = a - k;
    n = a + second;
    if(n <= L.hi) break;
  }
  if(n > L.hi){ a = 20; k = 4; second = 16; n = 36; }
  return makeProblem('diffTotal', a + ':' + k, 'classroom',
    'В 2-А классе ' + q(a, 'students') + ', а в 2-Б — на ' + b(k) + ' меньше. Сколько учеников в двух классах?',
    'There are ' + q(a, 'students') + ' in class 2-A, and ' + b(k) + ' fewer in class 2-B. How many students are in both classes?',
    n, 'students',
    eqLine(q(a, 'students') + ' − ' + b(k) + ' = ' + q(second, 'students') + ' — во 2-Б') +
      eqLine(q(a, 'students') + ' + ' + q(second, 'students') + ' = ' + q(n, 'students')),
    eqLine(q(a, 'students') + ' − ' + b(k) + ' = ' + q(second, 'students') + ' in 2-B') +
      eqLine(q(a, 'students') + ' + ' + q(second, 'students') + ' = ' + q(n, 'students')),
    W(
      [['2-А', pv(a, 'students')], ['2-Б', '?, на ' + k + ' меньше'], ['Всего', '?']],
      [[a + ' − ' + k, second], [second + ' + ' + a, n]],
      [['2-A', pv(a, 'students')], ['2-B', '?, ' + k + ' fewer'], ['Total', '?']],
      [[a + ' − ' + k, second], [second + ' + ' + a, n]]));
}

function genMulAdd(rnd, L){
  var p, qn, base, rest, n;
  for(var i = 0; i < 80; i++){
    p = ri(rnd, 2, 6); qn = ri(rnd, 2, 9);
    base = p * qn;
    rest = ri(rnd, 2, Math.max(2, Math.min(20, L.hi - base)));
    n = base + rest;
    if(n <= L.hi) break;
  }
  if(n > L.hi){ p = 3; qn = 4; base = 12; rest = 5; n = 17; }
  var addChain = [], ci;
  for(ci = 0; ci < p; ci++) addChain.push(qn);
  var firstStep = L.alt === 'add' ? addChain.join(' + ') : p + ' × ' + qn;
  var hintRu, hintEn;
  if(L.alt === 'add'){
    hintRu = '<p>Сначала сложим карандаши из наборов, потом прибавим остаток.</p>' +
      repAdd(qn, p, 'pencils') +
      eqLine(q(base, 'pencils') + ' + ' + q(rest, 'pencils') + ' = ' + q(n, 'pencils'));
    hintEn = '<p>First add the pencils from the sets, then add the extra ones.</p>' +
      repAdd(qn, p, 'pencils') +
      eqLine(q(base, 'pencils') + ' + ' + q(rest, 'pencils') + ' = ' + q(n, 'pencils'));
  } else {
    hintRu = eqLine(b(p) + ' × ' + b(qn) + ' = ' + q(base, 'pencils') + ' — в наборах') +
      eqLine(q(base, 'pencils') + ' + ' + q(rest, 'pencils') + ' = ' + q(n, 'pencils'));
    hintEn = eqLine(b(p) + ' × ' + b(qn) + ' = ' + q(base, 'pencils') + ' in the sets') +
      eqLine(q(base, 'pencils') + ' + ' + q(rest, 'pencils') + ' = ' + q(n, 'pencils'));
  }
  return makeProblem('mulAdd', p + ':' + qn + ':' + rest, 'classroom',
    'Купили ' + q(p, 'sets') + ' по ' + q(qn, 'pencils') + ' и ещё ' + q(rest, 'pencils') + '. Сколько карандашей купили?',
    'They bought ' + q(p, 'sets') + ' of ' + q(qn, 'pencils') + ' and ' + q(rest, 'pencils') + ' extra. How many pencils did they buy?',
    n, 'pencils', hintRu, hintEn,
    W(
      [['В наборах', p + ' по ' + qn], ['Отдельно', pv(rest, 'pencils')], ['Всего', '?']],
      [[firstStep, base], [base + ' + ' + rest, n]],
      [['In sets', p + ' of ' + qn], ['Extra', pv(rest, 'pencils')], ['Total', '?']],
      [[firstStep, base], [base + ' + ' + rest, n]]));
}

function genPrice(rnd, L){
  var price, count, n;
  for(var i = 0; i < 80; i++){
    price = ri(rnd, 2, 9); count = ri(rnd, 2, 9);
    n = price * count;
    if(n <= L.hi) break;
  }
  if(n > L.hi){ price = 5; count = 6; n = 30; }
  var pricePieces = [], pi;
  for(pi = 0; pi < count; pi++) pricePieces.push(price);
  var priceStep = L.alt === 'add' ? pricePieces.join(' + ') : price + ' × ' + count;
  var hintRu, hintEn;
  if(L.alt === 'add'){
    hintRu = '<p>Стоимость — это цена, взятая столько раз, сколько булочек.</p>' + repAdd(price, count, 'rubles');
    hintEn = '<p>Cost is the price taken as many times as there are buns.</p>' + repAdd(price, count, 'rubles');
  } else {
    hintRu = '<p>Стоимость = цена × количество.</p>' + eqLine(q(price, 'rubles') + ' × ' + b(count) + ' = ' + q(n, 'rubles'));
    hintEn = '<p>Cost = price × quantity.</p>' + eqLine(q(price, 'rubles') + ' × ' + b(count) + ' = ' + q(n, 'rubles'));
  }
  return makeProblem('price', price + ':' + count, 'bakery',
    'Одна булочка стоит ' + q(price, 'rubles') + '. Сколько стоят ' + q(count, 'buns') + '?',
    'One bun costs ' + q(price, 'rubles') + '. How much do ' + q(count, 'buns') + ' cost?',
    n, 'rubles', hintRu, hintEn,
    W(
      [['Цена', pv(price, 'rubles')], ['Количество', pv(count, 'buns')], ['Стоимость', '?']],
      [[priceStep, n]],
      [['Price', pv(price, 'rubles')], ['Quantity', pv(count, 'buns')], ['Cost', '?']],
      [[priceStep, n]]));
}

function genMulTotal(rnd, L){
  var baskets, per, n;
  for(var i = 0; i < 80; i++){
    baskets = ri(rnd, 2, 8); per = ri(rnd, 2, 9);
    n = baskets * per;
    if(n <= L.hi) break;
  }
  if(n > L.hi){ baskets = 4; per = 5; n = 20; }
  var basketPieces = [], bi;
  for(bi = 0; bi < baskets; bi++) basketPieces.push(per);
  var basketStep = L.alt === 'add' ? basketPieces.join(' + ') : baskets + ' × ' + per;
  var hintRu, hintEn;
  if(L.alt === 'add'){
    hintRu = '<p>В каждой корзине одинаково — сложим это число столько раз, сколько корзин.</p>' + repAdd(per, baskets, 'kg');
    hintEn = '<p>Each basket holds the same amount — add it once per basket.</p>' + repAdd(per, baskets, 'kg');
  } else {
    hintRu = '<p>В каждой корзине одинаково — значит умножаем.</p>' + eqLine(b(baskets) + ' × ' + b(per) + ' = ' + q(n, 'kg'));
    hintEn = '<p>Each basket holds the same amount — multiply.</p>' + eqLine(b(baskets) + ' × ' + b(per) + ' = ' + q(n, 'kg'));
  }
  return makeProblem('mulTotal', baskets + ':' + per, 'orchard',
    'Собрали ' + q(baskets, 'baskets') + ' яблок, по ' + q(per, 'kg') + ' в каждой. Сколько килограммов яблок собрали?',
    'They picked ' + q(baskets, 'baskets') + ' of apples, ' + q(per, 'kg') + ' in each. How many kilograms of apples did they pick?',
    n, 'kg', hintRu, hintEn,
    W(
      [['В корзине', pv(per, 'kg')], ['Корзин', baskets], ['Всего', '?']],
      [[basketStep, n]],
      [['In a basket', pv(per, 'kg')], ['Baskets', baskets], ['Total', '?']],
      [[basketStep, n]]));
}

function genShare(rnd, L){
  var plates, per, total;
  for(var i = 0; i < 80; i++){
    plates = ri(rnd, 2, 8); per = ri(rnd, 2, 9);
    total = plates * per;
    if(total <= L.hi) break;
  }
  if(total > L.hi){ plates = 4; per = 5; total = 20; }
  var hintRu, hintEn;
  if(L.alt === 'sub'){
    hintRu = '<p>Раздаём по одной булочке на каждую тарелку: вычитаем число тарелок, пока булочки не закончатся.</p>' +
      repSub(total, plates) +
      '<p>Вычли ' + per + ' ' + unitText(per, 'times') + ' — по ' + q(per, 'buns') + ' на тарелке.</p>';
    hintEn = '<p>Give one bun to every plate at a time: subtract the number of plates until no buns are left.</p>' +
      repSub(total, plates) +
      '<p>We subtracted ' + per + ' ' + unitText(per, 'times') + ' — ' + q(per, 'buns') + ' on each plate.</p>';
  } else {
    hintRu = '<p>«Разложили поровну» — значит делим на равные части.</p>' + eqLine(q(total, 'buns') + ' ÷ ' + b(plates) + ' = ' + q(per, 'buns'));
    hintEn = '<p>“Shared equally” means dividing into equal parts.</p>' + eqLine(q(total, 'buns') + ' ÷ ' + b(plates) + ' = ' + q(per, 'buns'));
  }
  return makeProblem('share', total + ':' + plates, 'bakery',
    'Испекли ' + q(total, 'buns') + ' и разложили их поровну на ' + q(plates, 'plates') + '. Сколько булочек на каждой тарелке?',
    'They baked ' + q(total, 'buns') + ' and shared them equally between ' + q(plates, 'plates') + '. How many buns are on each plate?',
    per, 'buns', hintRu, hintEn,
    W(
      [['Всего', pv(total, 'buns')], ['Тарелок', plates], ['На каждой', '?']],
      L.alt === 'sub'
        ? [[subChain(total, plates), 0], ['Вычли ' + per + ' ' + unitText(per, 'times') + ' — по ' + per + ' на тарелке', null]]
        : [[total + ' ÷ ' + plates, per]],
      [['Total', pv(total, 'buns')], ['Plates', plates], ['On each', '?']],
      L.alt === 'sub'
        ? [[subChain(total, plates), 0], ['Subtracted ' + per + ' ' + unitText(per, 'times') + ' — ' + per + ' on each plate', null]]
        : [[total + ' ÷ ' + plates, per]]));
}

function genGroups(rnd, L){
  var plates, per, total;
  for(var i = 0; i < 80; i++){
    plates = ri(rnd, 2, 8); per = ri(rnd, 2, 9);
    total = plates * per;
    if(total <= L.hi) break;
  }
  if(total > L.hi){ plates = 4; per = 5; total = 20; }
  var hintRu, hintEn;
  if(L.alt === 'sub'){
    hintRu = '<p>Отсчитываем по ' + q(per, 'buns') + ', пока они не закончатся.</p>' +
      repSub(total, per) +
      '<p>Получилось ' + plates + ' ' + unitText(plates, 'times') + ' по ' + per + ' — значит, ' + q(plates, 'plates') + '.</p>';
    hintEn = '<p>Count off groups of ' + q(per, 'buns') + ' until none are left.</p>' +
      repSub(total, per) +
      '<p>That gives ' + plates + ' ' + unitText(plates, 'times') + ' of ' + per + ' — ' + q(plates, 'plates') + ' in all.</p>';
  } else {
    hintRu = '<p>Узнаём, сколько групп по ' + per + ' получится.</p>' + eqLine(q(total, 'buns') + ' ÷ ' + b(per) + ' = ' + q(plates, 'plates'));
    hintEn = '<p>Find how many groups of ' + per + ' fit into the total.</p>' + eqLine(q(total, 'buns') + ' ÷ ' + b(per) + ' = ' + q(plates, 'plates'));
  }
  return makeProblem('groups', total + ':' + per, 'bakery',
    'Испекли ' + q(total, 'buns') + ' и разложили по ' + q(per, 'buns') + ' на каждую тарелку. Сколько тарелок понадобилось?',
    'They baked ' + q(total, 'buns') + ' and put ' + q(per, 'buns') + ' on each plate. How many plates did they use?',
    plates, 'plates', hintRu, hintEn,
    W(
      [['Всего', pv(total, 'buns')], ['На тарелке', pv(per, 'buns')], ['Тарелок', '?']],
      L.alt === 'sub'
        ? [[subChain(total, per), 0], ['Получилось ' + plates + ' ' + unitText(plates, 'plates'), null]]
        : [[total + ' ÷ ' + per, plates]],
      [['Total', pv(total, 'buns')], ['On a plate', pv(per, 'buns')], ['Plates', '?']],
      L.alt === 'sub'
        ? [[subChain(total, per), 0], ['That makes ' + plates + ' ' + unitText(plates, 'plates'), null]]
        : [[total + ' ÷ ' + per, plates]]));
}

function genTimesMore(rnd, L){
  var base, k, n;
  for(var i = 0; i < 80; i++){
    base = ri(rnd, 2, 8); k = ri(rnd, 2, 5);
    n = base * k;
    if(n <= L.hi) break;
  }
  if(n > L.hi){ base = 4; k = 3; n = 12; }
  var hintRu, hintEn;
  if(L.alt === 'add'){
    hintRu = '<p>«В ' + k + ' ' + unitText(k, 'times') + ' больше» — значит взять число ' + k + ' раз.</p>' + repAdd(base, k, 'pearTrees');
    hintEn = '<p>“' + k + ' times as many” means taking the number ' + k + ' times.</p>' + repAdd(base, k, 'pearTrees');
  } else {
    hintRu = '<p>«В ' + k + ' ' + unitText(k, 'times') + ' больше» — значит повторить число ' + k + ' ' + unitText(k, 'times') + '.</p>' + eqLine(q(base, 'appleTrees') + ' × ' + b(k) + ' = ' + q(n, 'pearTrees'));
    hintEn = '<p>“' + k + ' times as many” means repeating the number ' + k + ' times.</p>' + eqLine(q(base, 'appleTrees') + ' × ' + b(k) + ' = ' + q(n, 'pearTrees'));
  }
  return makeProblem('timesMore', base + ':' + k, 'orchard',
    'В саду ' + q(base, 'appleTrees') + ', а груш — в ' + b(k) + ' ' + unitText(k, 'times') + ' больше. Сколько груш в саду?',
    'There are ' + q(base, 'appleTrees') + ' in the orchard, and ' + b(k) + ' times as many pear trees. How many pear trees are there?',
    n, 'pearTrees', hintRu, hintEn,
    W(
      [['Яблони', pv(base, 'appleTrees')], ['Груши', '?, в ' + k + ' ' + unitText(k, 'times') + ' больше']],
      [[L.alt === 'add' ? addChainOf(base, k) : base + ' × ' + k, n]],
      [['Apple trees', pv(base, 'appleTrees')], ['Pear trees', '?, ' + k + ' times as many']],
      [[L.alt === 'add' ? addChainOf(base, k) : base + ' × ' + k, n]]));
}

function genTimesLess(rnd, L){
  var per, k, total;
  for(var i = 0; i < 80; i++){
    per = ri(rnd, 2, 8); k = ri(rnd, 2, 5);
    total = per * k;
    if(total <= L.hi) break;
  }
  if(total > L.hi){ per = 4; k = 3; total = 12; }
  var parts = k < 5 ? 'равные части' : 'равных частей';
  var hintRu, hintEn;
  if(L.alt === 'sub'){
    hintRu = '<p>«В ' + k + ' ' + unitText(k, 'times') + ' меньше» — делим на ' + k + '. Отсчитываем по ' + b(k) + ', пока яблони не закончатся.</p>' +
      repSub(total, k) +
      '<p>Получилось ' + per + ' ' + unitText(per, 'times') + ' — значит, ' + q(per, 'pearTrees') + '.</p>';
    hintEn = '<p>“' + k + ' times fewer” means dividing by ' + k + '. Count off groups of ' + b(k) + ' until no apple trees are left.</p>' +
      repSub(total, k) +
      '<p>That gives ' + per + ' ' + unitText(per, 'times') + ' — ' + q(per, 'pearTrees') + '.</p>';
  } else {
    hintRu = '<p>«В ' + k + ' ' + unitText(k, 'times') + ' меньше» — значит разделить на ' + k + ' ' + parts + '.</p>' + eqLine(q(total, 'appleTrees') + ' ÷ ' + b(k) + ' = ' + q(per, 'pearTrees'));
    hintEn = '<p>“' + k + ' times fewer” means dividing into ' + k + ' equal parts.</p>' + eqLine(q(total, 'appleTrees') + ' ÷ ' + b(k) + ' = ' + q(per, 'pearTrees'));
  }
  return makeProblem('timesLess', total + ':' + k, 'orchard',
    'В саду ' + q(total, 'appleTrees') + ', а груш — в ' + b(k) + ' ' + unitText(k, 'times') + ' меньше. Сколько груш в саду?',
    'There are ' + q(total, 'appleTrees') + ' in the orchard, and ' + b(k) + ' times fewer pear trees. How many pear trees are there?',
    per, 'pearTrees', hintRu, hintEn,
    W(
      [['Яблони', pv(total, 'appleTrees')], ['Груши', '?, в ' + k + ' ' + unitText(k, 'times') + ' меньше']],
      L.alt === 'sub'
        ? [[subChain(total, k), 0], ['Разделили на ' + k + ' ' + parts, null]]
        : [[total + ' ÷ ' + k, per]],
      [['Apple trees', pv(total, 'appleTrees')], ['Pear trees', '?, ' + k + ' times fewer']],
      L.alt === 'sub'
        ? [[subChain(total, k), 0], ['Split into ' + k + ' equal parts', null]]
        : [[total + ' ÷ ' + k, per]]));
}

function genTimesCompare(rnd, L){
  var per = ri(rnd, 2, 9), k = ri(rnd, 2, 5);
  var total = per * k;
  var hintRu, hintEn;
  if(L.alt === 'sub'){
    hintRu = '<p>Вычитаем меньшее из большего, пока не останется 0. Сколько раз вычли — во столько раз больше.</p>' + repSub(total, per);
    hintEn = '<p>Subtract the smaller number from the larger until nothing is left. The number of subtractions is how many times more.</p>' + repSub(total, per);
  } else {
    hintRu = '<p>Чтобы узнать «во сколько раз больше», делим большее число на меньшее.</p>' + eqLine(q(total, 'appleTrees') + ' ÷ ' + q(per, 'pearTrees') + ' = ' + q(k, 'times'));
    hintEn = '<p>To find “how many times more”, divide the larger number by the smaller.</p>' + eqLine(q(total, 'appleTrees') + ' ÷ ' + q(per, 'pearTrees') + ' = ' + q(k, 'times'));
  }
  return makeProblem('timesCompare', total + ':' + per, 'orchard',
    'В саду ' + q(total, 'appleTrees') + ' и ' + q(per, 'pearTrees') + '. Во сколько раз яблонь больше, чем груш?',
    'There are ' + q(total, 'appleTrees') + ' and ' + q(per, 'pearTrees') + '. How many times more apple trees are there?',
    k, 'times', hintRu, hintEn,
    W(
      [['Яблони', pv(total, 'appleTrees')], ['Груши', pv(per, 'pearTrees')], ['Во сколько раз', '?']],
      L.alt === 'sub'
        ? [[subChain(total, per), 0], ['Вычли ' + k + ' ' + unitText(k, 'times'), null]]
        : [[total + ' ÷ ' + per, k]],
      [['Apple trees', pv(total, 'appleTrees')], ['Pear trees', pv(per, 'pearTrees')], ['How many times', '?']],
      L.alt === 'sub'
        ? [[subChain(total, per), 0], ['Subtracted ' + k + ' times', null]]
        : [[total + ' ÷ ' + per, k]]));
}

function genSumDiff(rnd, L){
  var younger = ri(rnd, 3, 12), diff = ri(rnd, 1, 6);
  var older = younger + diff, sum = younger + older;
  var askOlder = rnd() < 0.5;
  var answer = askOlder ? older : younger;
  var ruAsk = askOlder ? 'Сколько лет брату?' : 'Сколько лет сестре?';
  var enAsk = askOlder ? 'How old is the brother?' : 'How old is the sister?';
  return makeProblem('sumDiff', younger + ':' + diff + ':' + (askOlder ? 'o' : 'y'), 'classroom',
    'Брату и сестре вместе ' + b(sum) + ' лет. Брат на ' + b(diff) + ' ' + unitText(diff, 'years') + ' старше сестры. ' + ruAsk,
    'A brother and sister are ' + b(sum) + ' years old together. The brother is ' + b(diff) + ' ' + unitText(diff, 'years') + ' older. ' + enAsk,
    answer, 'years',
    '<p>Если убрать разницу, останутся две равные части — возраст сестры и «возраст брата без разницы».</p>' +
      eqLine(b(sum) + ' − ' + b(diff) + ' = ' + b(younger * 2)) +
      eqLine(b(younger * 2) + ' ÷ 2 = ' + b(younger) + ' — сестре') +
      eqLine(b(younger) + ' + ' + b(diff) + ' = ' + b(older) + ' — брату') +
      '<p>Проверка: ' + b(younger) + ' + ' + b(older) + ' = ' + b(sum) + '.</p>',
    '<p>Remove the difference: the two remaining parts are equal.</p>' +
      eqLine(b(sum) + ' − ' + b(diff) + ' = ' + b(younger * 2)) +
      eqLine(b(younger * 2) + ' ÷ 2 = ' + b(younger) + ' — sister') +
      eqLine(b(younger) + ' + ' + b(diff) + ' = ' + b(older) + ' — brother') +
      '<p>Check: ' + b(younger) + ' + ' + b(older) + ' = ' + b(sum) + '.</p>',
    W(
      [['Вместе', pv(sum, 'years')], ['Разница', pv(diff, 'years')], ['Сестра', '?'], ['Брат', '?']],
      [[sum + ' − ' + diff, younger * 2], [younger * 2 + ' ÷ 2', younger], [younger + ' + ' + diff, older]],
      [['Together', pv(sum, 'years')], ['Difference', pv(diff, 'years')], ['Sister', '?'], ['Brother', '?']],
      [[sum + ' − ' + diff, younger * 2], [younger * 2 + ' ÷ 2', younger], [younger + ' + ' + diff, older]]));
}

function genEqualize(rnd, L){
  var bb, extra, a = 0;
  for(var i = 0; i < 80; i++){
    bb = ri(rnd, 2, Math.max(2, Math.floor(L.hi / 2)));
    extra = 2 * ri(rnd, 1, 6);
    a = bb + extra;
    if(a <= L.hi) break;
  }
  if(a > L.hi){ bb = 8; extra = 4; a = 12; }
  var n = (a - bb) / 2;
  return makeProblem('equalize', a + ':' + bb, 'orchard',
    'У Ани ' + q(a, 'plums') + ', а у Оли — ' + q(bb, 'plums') + '. Сколько слив Аня должна отдать Оле, чтобы у девочек стало поровну?',
    'Anna has ' + q(a, 'plums') + ', and Olga has ' + q(bb, 'plums') + '. How many plums should Anna give Olga so that they have the same amount?',
    n, 'plums',
    '<p>Сначала найдём разницу, а потом разделим её пополам — половину и нужно передать.</p>' +
      eqLine(q(a, 'plums') + ' − ' + q(bb, 'plums') + ' = ' + q(extra, 'plums')) +
      eqLine(q(extra, 'plums') + ' ÷ 2 = ' + q(n, 'plums')) +
      '<p>Проверка: у Ани станет ' + b(a - n) + ', у Оли — ' + b(bb + n) + ', поровну.</p>',
    '<p>First find the difference, then split it in half — that half is what Anna should give.</p>' +
      eqLine(q(a, 'plums') + ' − ' + q(bb, 'plums') + ' = ' + q(extra, 'plums')) +
      eqLine(q(extra, 'plums') + ' ÷ 2 = ' + q(n, 'plums')) +
      '<p>Check: Anna will have ' + b(a - n) + ', Olga will have ' + b(bb + n) + '.</p>',
    W(
      [['У Ани', pv(a, 'plums')], ['У Оли', pv(bb, 'plums')], ['Отдать', '?']],
      [[a + ' − ' + bb, extra], [extra + ' ÷ 2', n]],
      [['Anna', pv(a, 'plums')], ['Olga', pv(bb, 'plums')], ['Give away', '?']],
      [[a + ' − ' + bb, extra], [extra + ' ÷ 2', n]]));
}

function genWasUnknown(rnd, L){
  var a = ri(rnd, 2, Math.max(2, Math.min(20, L.hi - 2)));
  var n = ri(rnd, 2, Math.max(2, L.hi - a));
  if(rnd() < 0.5){
    var total = n + a;
    return makeProblem('wasUnknown', 'add:' + a + ':' + total, 'aquarium',
      'В аквариуме было несколько рыбок. Когда запустили ещё ' + q(a, 'fish') + ', их стало ' + b(total) + '. Сколько рыбок было в аквариуме сначала?',
      'There were some fish in the aquarium. After ' + q(a, 'fish') + ' were added, there were ' + b(total) + '. How many fish were there at first?',
      n, 'fish',
      '<p>Это обратная задача. Чтобы найти начальное количество, выполним обратное действие — вычитание.</p>' +
        eqLine(b(total) + ' − ' + b(a) + ' = ' + q(n, 'fish')) +
        '<p>Проверка: ' + b(n) + ' + ' + b(a) + ' = ' + b(total) + '.</p>',
      '<p>This is a reverse problem. To find the starting amount, undo the addition.</p>' +
        eqLine(b(total) + ' − ' + b(a) + ' = ' + q(n, 'fish')) +
        '<p>Check: ' + b(n) + ' + ' + b(a) + ' = ' + b(total) + '.</p>',
      W(
        [['Было', '?'], ['Запустили', pv(a, 'fish')], ['Стало', pv(total, 'fish')]],
        [[total + ' − ' + a, n]],
        [['At first', '?'], ['Added', pv(a, 'fish')], ['Then', pv(total, 'fish')]],
        [[total + ' − ' + a, n]]));
  }
  var start = n + a;
  return makeProblem('wasUnknown', 'sub:' + a + ':' + n, 'aquarium',
    'В аквариуме было несколько рыбок. Когда ' + q(a, 'fish') + ' пересадили в другой аквариум, осталось ' + b(n) + '. Сколько рыбок было сначала?',
    'There were some fish in the aquarium. After ' + q(a, 'fish') + ' were moved to another tank, ' + b(n) + ' were left. How many fish were there at first?',
    start, 'fish',
    '<p>Это обратная задача. К оставшимся рыбкам прибавляем тех, кого пересадили.</p>' +
      eqLine(q(n, 'fish') + ' + ' + q(a, 'fish') + ' = ' + q(start, 'fish')) +
      '<p>Проверка: ' + b(start) + ' − ' + b(a) + ' = ' + b(n) + '.</p>',
    '<p>This is a reverse problem. Add the fish that were moved to the ones that stayed.</p>' +
      eqLine(q(n, 'fish') + ' + ' + q(a, 'fish') + ' = ' + q(start, 'fish')) +
      '<p>Check: ' + b(start) + ' − ' + b(a) + ' = ' + b(n) + '.</p>',
    W(
      [['Было', '?'], ['Пересадили', pv(a, 'fish')], ['Осталось', pv(n, 'fish')]],
      [[n + ' + ' + a, start]],
      [['At first', '?'], ['Moved', pv(a, 'fish')], ['Left', pv(n, 'fish')]],
      [[n + ' + ' + a, start]]));
}

var GEN = {
  total: genTotal,
  leftover: genLeftover,
  arriveLeave: genArriveLeave,
  reverse: genReverse,
  difference: genDifference,
  moreBy: genMoreBy,
  lessBy: genLessBy,
  twoGroups: genTwoGroups,
  diffTotal: genDiffTotal,
  mulAdd: genMulAdd,
  price: genPrice,
  mulTotal: genMulTotal,
  share: genShare,
  groups: genGroups,
  timesMore: genTimesMore,
  timesLess: genTimesLess,
  timesCompare: genTimesCompare,
  sumDiff: genSumDiff,
  equalize: genEqualize,
  wasUnknown: genWasUnknown
};

function generateProblem(type, rnd, opts){
  if(!GEN[type]) type = 'total';
  var L = limits(opts);
  /* звезда: те же задачи, но решение через повторное сложение или вычитание */
  L.alt = (opts && opts.star && PROBLEM_ALT[type]) ? PROBLEM_ALT[type][0] : '';
  for(var i = 0; i < 30; i++){
    var e = GEN[type](rnd || Math.random, L);
    if(e && e.need >= 0) return e;
  }
  return GEN.total(rnd || Math.random, { lo: 2, hi: 20 });
}

/* ---------- ломаные ---------- */
var POLY_UID = 0;
var POLY_TYPES = ['open3', 'open4', 'open5', 'mixed'];

function polyLengths(type, rnd, L, maxTotal){
  var count = type === 'open3' ? 3 : type === 'open4' ? 4 : type === 'open5' ? 5 : ri(rnd, 3, 5);
  var out = [], sum = 0, i;
  var hi = Math.max(1, Math.min(20, L.hi));
  var lo = Math.min(Math.max(1, L.lo), maxTotal ? Math.max(1, Math.floor(maxTotal / count)) : hi);
  for(i = 0; i < count; i++){
    var top = hi;
    if(maxTotal) top = Math.min(top, maxTotal - sum - (count - i - 1) * lo);
    if(top < lo) top = lo;
    var v = ri(rnd, lo, top);
    out.push(v); sum += v;
  }
  return out;
}

function polySvg(lengths, idPrefix){
  var total = 0, i;
  for(i = 0; i < lengths.length; i++) total += lengths[i];
  var W = 480, H = 176, padX = 32, padY = 26;
  var scale = Math.min(30, Math.max(4, (W - 2 * padX) / Math.max(1, total)));
  var x = padX, y = H / 2;
  var pts = [{ x: x, y: y }];
  for(i = 0; i < lengths.length; i++){
    x += lengths[i] * scale;
    var dir = i % 2 === 0 ? -1 : 1;
    var dy = Math.min(44, 18 + lengths[i] * 1.1);
    y += dir * dy;
    if(y < padY) y = padY;
    if(y > H - padY) y = H - padY;
    pts.push({ x: x, y: y });
  }
  var uid = 'pg' + (++POLY_UID) + '-' + idPrefix;
  var svg = '<svg class="poly-svg" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' +
    tr('Ломаная из ', 'Polyline with ') + lengths.length + tr(' звеньев', ' links') + '">';
  svg += '<defs><pattern id="' + uid + '" width="12" height="12" patternUnits="userSpaceOnUse">' +
    '<path class="poly-grid" d="M12 0H0V12"/></pattern></defs>';
  svg += '<rect class="poly-bg" x="0" y="0" width="' + W + '" height="' + H + '" rx="10"/>';
  svg += '<rect class="poly-paper" x="0" y="0" width="' + W + '" height="' + H + '" rx="10" fill="url(#' + uid + ')"/>';
  svg += '<polyline class="poly-line" points="' + pts.map(function(p){ return p.x.toFixed(1) + ',' + p.y.toFixed(1); }).join(' ') + '"/>';
  for(i = 0; i < pts.length; i++){
    svg += '<circle class="poly-dot" cx="' + pts[i].x.toFixed(1) + '" cy="' + pts[i].y.toFixed(1) + '" r="3.6"/>';
  }
  for(i = 0; i < lengths.length; i++){
    var p = pts[i], q2 = pts[i + 1];
    var mx = (p.x + q2.x) / 2, my = (p.y + q2.y) / 2;
    var above = i % 2 === 0;
    var ly = above ? my - 13 : my + 20;
    var label = lengths[i] + ' ' + tr('см', 'cm');
    svg += '<text class="poly-label" x="' + mx.toFixed(1) + '" y="' + ly.toFixed(1) + '" text-anchor="middle">' + label + '</text>';
  }
  svg += '</svg>';
  return svg;
}

function generatePolyline(type, rnd, opts){
  if(POLY_TYPES.indexOf(type) < 0) type = 'mixed';
  var L = limits(opts);
  var lengths = polyLengths(type, rnd || Math.random, L, opts && opts.maxTotal);
  var total = 0, i;
  for(i = 0; i < lengths.length; i++) total += lengths[i];
  var id = type + ':' + lengths.join('-');
  var figure = polySvg(lengths, id.replace(/[:]/g, ''));
  var ruText = 'Найди длину ломаной.';
  var enText = 'Find the length of the polyline.';
  var ruSheet = 'Начерти отрезок, длина которого равна длине ломаной.';
  var enSheet = 'Draw a segment whose length equals the length of the polyline.';
  var ruExplain = '<p>Длина ломаной — это сумма длин всех её звеньев.</p>' +
    eqLine(lengths.map(function(v){ return b(v) + ' ' + tr('см', 'cm'); }).join(' + ') + ' = ' + b(total) + ' ' + tr('см', 'cm'));
  var enExplain = '<p>The length of a polyline is the sum of all its links.</p>' +
    eqLine(lengths.map(function(v){ return b(v) + ' ' + tr('см', 'cm'); }).join(' + ') + ' = ' + b(total) + ' ' + tr('см', 'cm'));
  var prompt = '<div class="wp wp-poly">' +
      '<div class="poly-fig">' + figure + '</div>' +
      '<div class="wp-text">' + tr(ruText, enText) + '</div>' +
      answerRow('{{slot}}', tr('см', 'cm'), tr('Длина: ', 'Length: ')) +
      helpBox(LANG === 'en' ? enExplain : ruExplain) +
    '</div>';
  var sheet = '<span class="poly-fig">' + figure + '</span>' +
    '<span class="wp-t">' + tr(ruSheet, enSheet) + '</span>' +
    '<span class="wp-a">' + tr('Длина ломаной: ', 'Polyline length: ') + '{{b}} ' + tr('см', 'cm') + '</span>' +
    '<span class="poly-draw" aria-hidden="true"></span>';
  return {
    id: 'poly:' + id,
    type: type,
    prompt: prompt,
    html: tr(ruSheet, enSheet),
    sheetHtml: sheet,
    text: tr('Ломаная: ', 'Polyline: ') + lengths.join(' + ') + ' ' + tr('см', 'cm'),
    need: total,
    answerText: total + ' ' + tr('см', 'cm'),
    unit: tr('см', 'cm'),
    answerKind: 'number',
    layout: 'word',
    max: total + 10,
    long: true,
    explain: strip(LANG === 'en' ? enExplain : ruExplain)
  };
}

function geoFigureSvg(fig, inline){
  var shape = fig.shape || 'points';
  var line = inline
    ? ' style="fill:none;stroke:#2b6f66;stroke-width:2.2;stroke-linecap:round"'
    : ' class="fline"';
  var dot = inline ? ' style="fill:#2b6f66;stroke:none"' : ' class="fpoint"';
  var txt = inline
    ? ' style="fill:#1f2937;font:600 13px sans-serif"'
    : ' class="ftext"';
  var circle = inline
    ? ' style="fill:none;stroke:#2b6f66;stroke-width:2.2"'
    : ' class="fline"';
  var svg = '<svg viewBox="0 0 260 186" role="img" aria-hidden="true"' +
    (inline ? ' width="170" height="122"' : '') + '>';
  var i, x, y, pts = [];
  if(shape === 'points'){
    var n = fig.n || 4;
    svg += '<line x1="34" y1="104" x2="226" y2="104"' + line + '/>';
    for(i = 0; i < n; i++){
      x = 46 + i * (168 / (n - 1));
      svg += '<circle cx="' + x.toFixed(1) + '" cy="104" r="4.4"' + dot + '/>';
      svg += '<text x="' + x.toFixed(1) + '" y="126" text-anchor="middle"' + txt + '>' + String.fromCharCode(65 + i) + '</text>';
    }
  } else if(shape === 'rays'){
    var m = fig.n || 4, cx = 55, cy = 96;
    var spread = 110, start = -spread / 2;
    for(i = 0; i < m; i++){
      var ang = (start + (m === 1 ? 0 : i * spread / (m - 1))) * Math.PI / 180;
      var ex = cx + Math.cos(ang) * 150, ey = cy + Math.sin(ang) * 150;
      svg += '<line x1="' + cx + '" y1="' + cy + '" x2="' + ex.toFixed(1) + '" y2="' + ey.toFixed(1) + '"' + line + '/>';
      var ux = Math.cos(ang), uy = Math.sin(ang);
      var bx = ex - ux * 10, by = ey - uy * 10;
      svg += '<polygon points="' + ex.toFixed(1) + ',' + ey.toFixed(1) + ' ' +
        (bx - uy * 4.2).toFixed(1) + ',' + (by + ux * 4.2).toFixed(1) + ' ' +
        (bx + uy * 4.2).toFixed(1) + ',' + (by - ux * 4.2).toFixed(1) + '"' + dot + '/>';
    }
    svg += '<circle cx="' + cx + '" cy="' + cy + '" r="4.6"' + dot + '/>';
    svg += '<text x="' + (cx - 4) + '" y="' + (cy + 22) + '" text-anchor="middle"' + txt + '>O</text>';
  } else if(shape === 'intersections'){
    var layout = fig.layout || 0;
    function seg(a, b, c, d){ svg += '<line x1="' + a + '" y1="' + b + '" x2="' + c + '" y2="' + d + '"' + line + '/>'; }
    if(layout === 1){
      seg(40, 62, 220, 62); seg(40, 126, 220, 126); seg(100, 30, 160, 158);
    } else if(layout === 2){
      seg(40, 60, 220, 120); seg(40, 140, 200, 30); seg(120, 20, 210, 160);
    } else if(layout === 3){
      seg(44, 58, 216, 92); seg(44, 118, 216, 152);
    } else {
      seg(40, 60, 220, 126); seg(40, 126, 220, 60);
    }
  } else if(shape === 'tree'){
    var a = fig.a || 2, b = fig.b || 2, ai, bi;
    var totalLeaves = a * b;
    for(ai = 0; ai < a; ai++){
      var y1 = a > 1 ? 24 + ai * (138 / (a - 1)) : 93;
      svg += '<line x1="32" y1="93" x2="124" y2="' + y1.toFixed(1) + '"' + line + '/>';
      svg += '<circle cx="124" cy="' + y1.toFixed(1) + '" r="3.2"' + dot + '/>';
      for(bi = 0; bi < b; bi++){
        var idx = ai * b + bi;
        var y2 = totalLeaves > 1 ? 20 + idx * (146 / (totalLeaves - 1)) : 93;
        svg += '<line x1="124" y1="' + y1.toFixed(1) + '" x2="226" y2="' + y2.toFixed(1) + '"' + line + '/>';
        svg += '<circle cx="226" cy="' + y2.toFixed(1) + '" r="2.8"' + dot + '/>';
      }
    }
    svg += '<circle cx="32" cy="93" r="4"' + dot + '/>';
  } else if(shape === 'radius' || shape === 'diameter'){
    var ccx = 130, ccy = 94, r = 56;
    svg += '<circle cx="' + ccx + '" cy="' + ccy + '" r="' + r + '"' + circle + '/>';
    if(shape === 'radius'){
      svg += '<line x1="' + ccx + '" y1="' + ccy + '" x2="' + (ccx + 40) + '" y2="' + (ccy - 40) + '"' + line + '/>';
      svg += '<circle cx="' + ccx + '" cy="' + ccy + '" r="3.6"' + dot + '/>';
      svg += '<text x="' + ccx + '" y="' + (ccy + r + 20) + '" text-anchor="middle"' + txt + '>' + fig.value + ' ' + tr('см', 'cm') + '</text>';
    } else {
      svg += '<line x1="' + (ccx - 40) + '" y1="' + (ccy + 40) + '" x2="' + (ccx + 40) + '" y2="' + (ccy - 40) + '"' + line + '/>';
      svg += '<text x="' + ccx + '" y="' + (ccy + r + 20) + '" text-anchor="middle"' + txt + '>' + fig.value + ' ' + tr('см', 'cm') + '</text>';
    }
    svg += '<circle cx="' + (ccx - 40) + '" cy="' + (ccy + 40) + '" r="3.4"' + dot + '/>';
    svg += '<circle cx="' + (ccx + 40) + '" cy="' + (ccy - 40) + '" r="3.4"' + dot + '/>';
  }
  return svg + '</svg>';
}

function problemPoolCount(types, from, to){
  var lo = Math.max(1, parseInt(from, 10) || 1);
  var hi = Math.max(lo, parseInt(to, 10) || 100);
  var span = hi - lo + 1;
  return (types && types.length ? types.length : PROBLEM_TYPES.length) * Math.max(8, span * 2);
}

function polylinePoolCount(types, from, to){
  var lo = Math.max(1, parseInt(from, 10) || 1);
  var hi = Math.max(lo, Math.min(20, parseInt(to, 10) || 20));
  var n = hi - lo + 1;
  var sum = 0;
  (types && types.length ? types : ['open3']).forEach(function(t){
    sum += t === 'open3' ? n * n * n : t === 'open4' ? n * n * n * n : t === 'open5' ? Math.pow(n, 5) : Math.pow(n, 3) * 3;
  });
  return Math.max(1, sum);
}

global.MathProblems = {
  problemTypes: PROBLEM_TYPES.slice(),
  polylineTypes: POLY_TYPES.slice(),
  problemTypeOps: problemTypeOps,
  problemTypeNeeds: problemTypeNeeds,
  problemIsStarred: problemIsStarred,
  problemStarTypes: function(){ return PROBLEM_STAR.slice(); },
  problemTypesForOps: problemTypesForOps,
  generateProblem: generateProblem,
  generatePolyline: generatePolyline,
  problemPoolCount: problemPoolCount,
  polylinePoolCount: polylinePoolCount,
  pluralUnit: unitText,
  sceneUrl: sceneUrl,
  geometryFigure: geoFigureSvg,
  strip: strip
};

})(typeof window !== 'undefined' ? window : globalThis);
