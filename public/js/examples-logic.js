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

var OP_KEYS = ['add', 'sub', 'mul', 'div'];
var OP_SIGN = { add:'+', sub:'−', mul:'×', div:'÷' };
var MAX_FACTOR = 10;

/* главное число (сумма, уменьшаемое, произведение, делимое) в границах from..limit */
function operandMin(from){ return from <= 0 ? 0 : 1; }

function poolAdd(limit, carry, from){
  var out = [], a, b, s, lo = operandMin(from);
  from = from || 0;
  for(a = lo; a <= limit - lo; a++){
    for(b = lo; a + b <= limit; b++){
      s = a + b;
      if(s < from) continue;
      if(carry){
        if((a % 10) + (b % 10) < 10) continue;
        if(s % 10 === 0 && s <= 20) continue;
      }
      out.push([a, b, s]);
    }
  }
  return out;
}
function poolSub(limit, carry, from){
  var out = [], m, s, r, lo = operandMin(from), m0 = carry ? 11 : lo;
  from = from || 0;
  if(from > m0) m0 = from;
  for(m = m0; m <= limit; m++){
    for(s = lo; s <= m; s++){
      if(s !== 0 && s % 10 === 0) continue;
      r = m - s;
      if(r < 0) continue;
      if(r === 0 && from > 0) continue;
      if(carry){
        if((m % 10) >= (s % 10)) continue;
        if(m <= 20 && m % 10 === 0 && s > 10) continue;
      }
      out.push([m, s, r]);
    }
  }
  return out;
}
function poolMul(limit, from){
  var out = [], a, b, p, lo = operandMin(from);
  from = from || 0;
  for(a = lo; a <= MAX_FACTOR; a++){
    for(b = lo; b <= MAX_FACTOR; b++){
      p = a * b;
      if(p < from || p > limit) continue;
      out.push([a, b, p]);
    }
  }
  return out;
}
function poolDiv(limit, from){
  var out = [], a, b, q, lo = operandMin(from), b0 = Math.max(1, lo);
  from = from || 0;
  for(b = b0; b <= MAX_FACTOR; b++){
    for(q = lo; q <= MAX_FACTOR; q++){
      a = b * q;
      if(a < from || a > limit) continue;
      out.push([a, b, q]);
    }
  }
  return out;
}
function missAmbiguous(a, b, r, kind){
  if(kind === 'mul' && r === 0){
    return a === 0 || b === 0;
  }
  if(kind === 'div' && a === 0) return true;
  return false;
}
function poolFor(kind, limit, carry, from, miss){
  var items;
  if(kind === 'add') items = poolAdd(limit, carry, from);
  else if(kind === 'sub') items = poolSub(limit, carry, from);
  else if(kind === 'mul') items = poolMul(limit, from);
  else if(kind === 'div') items = poolDiv(limit, from);
  else return [];
  if(miss === 'a' || miss === 'b' || miss === 'ab' || miss === 'ra' || miss === 'rb' || miss === 'all'){
    items = items.filter(function(x){ return !missAmbiguous(x[0], x[1], x[2], kind); });
  }
  return items;
}

/* выдаёт пачку из n примеров на лист так, чтобы:
   — внутри листа не было повторов;
   — раньше остальных шли примеры, которых ещё не было в текущем круге и не было на прошлом листе;
   — круг прокручивался целиком, прежде чем что-то повторится;
   — при одном и том же ключе варианта порядок всегда одинаковый. */
function makeDrawer(items, rnd){
  var used = new Set(), prev = new Set();
  function key(x){ return x[0] + '|' + x[1]; }
  if(!items.length) return function(){ return null; };

  return function(take){
    var i, k, x, t1 = [], t2 = [], t3 = [], t4 = [];
    if(used.size >= items.length){ used = new Set(); }
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
      if(i >= ord.length){
        var next = shuffle(items, rnd);
        if(out.length && next.length > 1 && key(next[0]) === key(out[out.length - 1])){
          x = next[0]; next[0] = next[1]; next[1] = x;
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

function normalizeOps(value){
  var raw, s, out = [], i, key;
  if(Array.isArray(value)){
    raw = value;
  } else {
    s = String(value == null ? '' : value).trim();
    if(!s || s === 'mix') raw = ['add', 'sub'];
    else if(s === 'all') raw = OP_KEYS.slice();
    else if(s === 'muldiv') raw = ['mul', 'div'];
    else raw = s.split(/[,\s]+/);
  }
  for(i = 0; i < raw.length; i++){
    key = String(raw[i]).trim();
    if(OP_KEYS.indexOf(key) >= 0 && out.indexOf(key) < 0) out.push(key);
  }
  return out.length ? out : ['add', 'sub'];
}

function typeSequence(n, ops, rnd){
  if(!Array.isArray(ops)) ops = normalizeOps(ops);
  var arr = [], i;
  for(i = 0; i < n; i++) arr.push(ops[i % ops.length]);
  return shuffle(arr, rnd);
}

/* 'r' — ответ, 'a' — первое число, 'b' — второе; 'ra', 'rb', 'ab', 'all' — комбинации. */
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
  var rows = clampInt(opts.rows, 2, 40, 8);
  var cols = clampInt(opts.cols, 2, 10, 3);
  var pages = clampInt(opts.pages, 1, 12, 1);
  var from = clampInt(opts.from, 0, 100, 0);
  var limit = clampInt(opts.limit, 1, 100, 18);
  if(from > limit) from = limit;
  var carry = !(opts.carry === false || opts.carry === '0' || opts.carry === 'false');
  var ops = normalizeOps(opts.ops !== undefined ? opts.ops : opts.type);
  var miss = missKinds(opts.miss);
  var seed = clampInt(opts.seed, 1, 4294967295, 1);
  var rnd = mulberry32(seed);
  var pools = {}, usable = [], emptyOps = [];
  ops.forEach(function(op){
    pools[op] = poolFor(op, limit, carry, from, miss);
    if(pools[op].length) usable.push(op);
    else emptyOps.push(op);
  });
  if(!usable.length){
    return { rows:rows, cols:cols, pages:pages, from:from, limit:limit, carry:carry,
      ops:ops, miss:miss, seed:seed, per:rows * cols, emptyOps:emptyOps, sheetPages:[] };
  }
  ops = usable;
  var drawers = {};
  ops.forEach(function(op){ drawers[op] = makeDrawer(pools[op], rnd); });
  var per = rows * cols;
  var sheets = [], p, k, seq, mseq, items, counts, byOp, indexes, triple, kind, a, b, r;

  for(p = 0; p < pages; p++){
    seq = typeSequence(per, ops, rnd);
    mseq = missSequence(per, miss, rnd);
    counts = { add:0, sub:0, mul:0, div:0 };
    for(k = 0; k < per; k++) counts[seq[k]]++;
    byOp = {};
    indexes = {};
    ops.forEach(function(key){
      byOp[key] = drawers[key](counts[key]);
      indexes[key] = 0;
    });

    items = [];
    for(k = 0; k < per; k++){
      kind = seq[k];
      triple = byOp[kind][indexes[kind]++];
      a = triple[0]; b = triple[1]; r = triple[2];
      items.push({ op: OP_SIGN[kind], a: a, b: b, r: r, miss: mseq[k] });
    }
    sheets.push(items);
  }
  return { rows:rows, cols:cols, pages:pages, from:from, limit:limit, carry:carry,
    ops:ops, miss:miss, seed:seed, per:per, emptyOps:emptyOps, sheetPages:sheets };
}

/* Шрифт подбирается по ширине ячейки с учётом до трёхзначных чисел и двух пропусков. */
function fontSizePt(cols, rows, opts){
  opts = opts || {};
  var usableMm = 186, gapMm = 3, padMm = 1.5, availMm = 255;
  var cellMm = (usableMm - (cols - 1) * gapMm) / cols;
  var maxDigits = opts.maxDigits || 3;
  var blanks = opts.twoBlanks ? 2 : 1;
  var prefixEm = opts.numbered ? 1.9 : 0;
  var exprEm = prefixEm + 5.4 + (maxDigits - 1) * 0.35 + blanks * 1.8;
  var byWidth = (cellMm - padMm) * 2.83465 / exprEm;
  var byHeight = (availMm / rows) * 2.83465 / 1.15;
  var fs = Math.min(byWidth, byHeight);
  fs = Math.max(5.5, Math.min(26, fs));
  return Math.round(fs * 2) / 2;
}

function keyLayout(count){
  var cols = Math.max(4, Math.min(8, Math.ceil(count / 60)));
  var fs = count > 300 ? 7 : count > 120 ? 8 : count > 48 ? 10 : 12;
  return { cols: cols, fontSizePt: fs };
}

global.MathSheet = {
  mulberry32: mulberry32,
  makeVariant: makeVariant,
  fontSizePt: fontSizePt,
  keyLayout: keyLayout,
  addPool: function(limit, carry, from){ return poolAdd(limit, carry, from); },
  subPool: function(limit, carry, from){ return poolSub(limit, carry, from); },
  mulPool: function(limit, from){ return poolMul(limit, from); },
  divPool: function(limit, from){ return poolDiv(limit, from); },
  normalizeOps: normalizeOps,
  missKinds: missKinds,
  clampInt: clampInt
};
})(typeof window !== 'undefined' ? window : globalThis);
