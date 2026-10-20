(function(global){
'use strict';

/* --- генератор случайных чисел с ключом: одинаковый ключ = одинаковый вариант --- */
function mulberry32(seed){
  var a = seed >>> 0;
  return function(){
    a = (a + 0x6D2B79F5) >>> 0;
    var t = a;
    t = Math.imul(t ^ (t >>> 15), 1 | t);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function shuffle(arr, rnd){
  var a = arr.slice(), i, j, t;
  for(i = a.length - 1; i > 0; i--){ j = Math.floor(rnd() * (i + 1)); t = a[i]; a[i] = a[j]; a[j] = t; }
  return a;
}
function clampInt(v, min, max, dflt){
  v = parseInt(v, 10);
  if(!isFinite(v)) return dflt;
  return Math.max(min, Math.min(max, v));
}

/* --- все примеры «с переходом через 10» ---
   сложение:   a + b,  a,b = 2..9,  сумма 11..18   (8+5, 9+9, …)
   вычитание:  m − s,  m = 11..18, s = 2..9, единицы уменьшаемого меньше s (занимаем десяток)  (13−8, 15−7, …) */
function addPool(){
  var out = [], a, b;
  for(a = 2; a <= 9; a++) for(b = 2; b <= 9; b++) if(a + b >= 11 && a + b <= 18) out.push([a, b]);
  return out;
}
function subPool(){
  var out = [], m, s;
  for(m = 11; m <= 18; m++) for(s = 2; s <= 9; s++) if((m % 10) < s) out.push([m, s]);
  return out;
}
/* выдаёт пачку из n примеров на лист так, чтобы:
   — внутри листа не было повторов;
   — раньше остальных шли примеры, которых ещё не было в текущем круге и не было на прошлом листе;
   — круг из всех 36 примеров прокручивался целиком, прежде чем что-то повторится;
   — при одном и том же ключе варианта порядок всегда одинаковый. */
function makeDrawer(items, rnd){
  var used = new Set(), prev = new Set();
  function key(x){ return x[0] + '|' + x[1]; }

  return function(take){
    var i, k, x, t1 = [], t2 = [], t3 = [], t4 = [];
    if(used.size >= items.length){ used = new Set(); }    /* круг прокручен — начинаем новый */
    var ord = shuffle(items, rnd);
    for(i = 0; i < ord.length; i++){
      k = key(ord[i]);
      if(!used.has(k) && !prev.has(k))       t1.push(ord[i]);
      else if(!used.has(k))                  t2.push(ord[i]);
      else if(!prev.has(k))                  t3.push(ord[i]);
      else                                   t4.push(ord[i]);
    }
    ord = t1.concat(t2, t3, t4);

    var out = [];
    for(i = 0; i < take; i++){
      if(i >= ord.length){                               /* примеров на листе больше 36 — добавляем ещё круг */
        var next = shuffle(items, rnd);
        if(out.length && next.length > 1 && key(next[0]) === key(out[out.length - 1])){
          x = next[0]; next[0] = next[1]; next[1] = x;   /* не ставим одинаковые примеры подряд */
        }
        ord = ord.concat(next);
      }
      out.push(ord[i]);
      used.add(key(ord[i]));
    }
    prev = new Set(out.map(key));
    return out;
  };
}
function typeSequence(n, type, rnd){
  var arr = [], half, k;
  if(type === 'add' || type === 'sub'){
    for(k = 0; k < n; k++) arr.push(type === 'add' ? '+' : '-');
    return arr;
  }
  half = Math.round(n / 2);
  for(k = 0; k < n; k++) arr.push(k < half ? '+' : '-');
  return shuffle(arr, rnd);
}
/* что пропущено в примере: 'r' — ответ (8 + 5 = __), 'a' — первое число (__ + 5 = 13),
   'b' — второе (8 + __ = 13). Комбинации: 'ra', 'rb', 'ab', 'all' (все три) — виды чередуются поровну. */
function missKinds(miss){
  var s = (miss === 'all') ? 'rab' : String(miss || 'r');
  var out = '', i, ch;
  for(i = 0; i < s.length; i++){
    ch = s.charAt(i);
    if('rab'.indexOf(ch) >= 0 && out.indexOf(ch) < 0) out += ch;
  }
  return out.length ? out : 'r';
}
function missSequence(n, miss, rnd){
  var kinds = missKinds(miss), arr = [], i;
  for(i = 0; i < n; i++) arr.push(kinds.charAt(i % kinds.length));
  return shuffle(arr, rnd);
}

function makeVariant(opts){
  opts = opts || {};
  var rows  = clampInt(opts.rows, 2, 20, 8);
  var cols  = clampInt(opts.cols, 2, 6, 3);
  var pages = clampInt(opts.pages, 1, 12, 1);
  var type  = (opts.type === 'add' || opts.type === 'sub') ? opts.type : 'mix';
  var miss  = missKinds(opts.miss);
  var seed  = clampInt(opts.seed, 1, 4294967295, 1);
  var rnd   = mulberry32(seed);
  var nextAdd = makeDrawer(addPool(), rnd);
  var nextSub = makeDrawer(subPool(), rnd);
  var per = rows * cols;
  var sheets = [], p, k, seq, mseq, items, pair, adds, addItems, subItems, ai, si;
  for(p = 0; p < pages; p++){
    seq = typeSequence(per, type, rnd);
    mseq = missSequence(per, miss, rnd);
    adds = 0;
    for(k = 0; k < per; k++) if(seq[k] === '+') adds++;
    addItems = nextAdd(adds);
    subItems = nextSub(per - adds);
    ai = 0; si = 0; items = [];
    for(k = 0; k < per; k++){
      if(seq[k] === '+'){
        pair = addItems[ai++];
        items.push({ op:'+', a:pair[0], b:pair[1], r:pair[0] + pair[1], miss:mseq[k] });
      } else {
        pair = subItems[si++];
        items.push({ op:'−', a:pair[0], b:pair[1], r:pair[0] - pair[1], miss:mseq[k] });
      }
    }
    sheets.push(items);
  }
  return { rows:rows, cols:cols, pages:pages, type:type, miss:miss, seed:seed, per:per, sheetPages:sheets };
}

/* --- размер шрифта: ширина ячейки на A4 (186 мм полезной ширины) важнее высоты --- */
function fontSizePt(cols, rows){
  var usableMm = 186, gapMm = 4, padMm = 6;
  var availMm  = 255;                          /* высота под примеры: A4 − поля − шапка */
  var cellMm = (usableMm - (cols - 1) * gapMm) / cols;
  var byWidth  = (cellMm - padMm) / 2.33;      /* «8 + 5 = ____» ≈ 6,4 em */
  var byHeight = (availMm - (rows - 1) * 5) / (rows * 0.42);   /* строка ≈ 1,19 em + отступы */
  return Math.max(10, Math.min(30, Math.round(Math.min(byWidth, byHeight))));
}

global.MathSheet = {
  mulberry32: mulberry32,
  makeVariant: makeVariant,
  fontSizePt: fontSizePt,
  addPool: addPool,
  subPool: subPool,
  clampInt: clampInt
};
})(typeof window !== 'undefined' ? window : globalThis);
