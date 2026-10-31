(function(global){
'use strict';

var LANG = (document.documentElement.lang || 'ru').toLowerCase().indexOf('en') === 0 ? 'en' : 'ru';
function tr(ru, en){ return LANG === 'en' ? en : ru; }

var TASKS = {
  digits: ['tens', 'ones', 'build', 'expand', 'totalTens'],
  compare: ['numbers', 'sums', 'diffs', 'products', 'quotients', 'tensUnits', 'lengths'],
  missing: ['missing'],
  brackets: ['brackets', 'chains'],
  units: ['convert', 'addsub', 'millimeters', 'kilometers'],
  perimeter: ['triangle', 'quad', 'rectangle', 'square', 'pentagon', 'hexagon'],
  problems: ['total', 'leftover', 'arriveLeave', 'reverse', 'difference', 'moreBy', 'lessBy', 'twoGroups', 'diffTotal', 'mulAdd', 'price', 'mulTotal', 'share', 'groups', 'timesMore', 'timesLess', 'timesCompare', 'sumDiff', 'equalize', 'wasUnknown'],
  polylines: ['open3', 'open4', 'open5', 'mixed'],
  equations: ['plus', 'minus', 'subFrom', 'times', 'divide', 'divBy'],
  remainders: ['quotient', 'remainder', 'dividend', 'divisor'],
  area: ['rectangle', 'square', 'side', 'volume'],
  operations: ['result1', 'result2', 'result3', 'start1', 'start2', 'start3'],
  divisibility: ['nextEven', 'nextOdd', 'prevEven', 'prevOdd', 'multipleNext', 'multiplePrev', 'countEven'],
  geometry: ['segments', 'rays', 'intersections', 'diameter', 'radius'],
  thousand: ['hundreds', 'tens', 'ones', 'build', 'expand', 'roundAdd', 'roundSub'],
  round: ['timesTen', 'divTen', 'timesHundred', 'divHundred', 'roundMul', 'roundDiv'],
  tree: ['pairs', 'three', 'paths', 'digits']
};
var OPS = ['add', 'sub', 'mul', 'div'];
var FONT_BASE = { digits: 17, compare: 20, missing: 20, brackets: 18, units: 16, perimeter: 14, problems: 12, polylines: 12,
  equations: 18, remainders: 18, area: 16, operations: 18, divisibility: 16,
  geometry: 14, thousand: 16, round: 18, tree: 14 };

function clampInt(v, min, max, dflt){ return MathSheet.clampInt(v, min, max, dflt); }
function ri(rnd, a, b){ return a + Math.floor(rnd() * (b - a + 1)); }
function pick(rnd, arr){ return arr[Math.floor(rnd() * arr.length)]; }
function shuffle(rnd, arr){
  var a = arr.slice(), i, j, t;
  for(i = a.length - 1; i > 0; i--){ j = Math.floor(rnd() * (i + 1)); t = a[i]; a[i] = a[j]; a[j] = t; }
  return a;
}
function joinWords(arr){
  if(!arr.length) return '';
  if(arr.length === 1) return arr[0];
  return arr.slice(0, -1).join(', ') + ' ' + tr('и', 'and') + ' ' + arr[arr.length - 1];
}
function cm(){ return tr('см', 'cm'); }
function dm(){ return tr('дм', 'dm'); }
function m(){ return tr('м', 'm'); }

function taskSequence(count, tasks, rnd){
  var order = shuffle(rnd, tasks), arr = [], i;
  for(i = 0; i < count; i++) arr.push(order[i % order.length]);
  return shuffle(rnd, arr);
}
function missRoles(miss){
  var map = { r:'r', a:'a', b:'b', ra:'ra', rb:'rb', ab:'ab', all:'rab' };
  var s = map[miss] || 'r';
  return s.split('');
}

/* ---------- разряды ---------- */
function digitsItem(rnd, task, from, to){
  var n = ri(rnd, from, to), t = Math.floor(n / 10), o = n % 10;
  var de = tr('дес.', 'tens'), ed = tr('ед.', 'ones');
  if(task === 'tens'){
    return {
      id: 'd:tens:' + n,
      html: tr('Сколько десятков в числе ', 'How many tens are in ') + '<b>' + n + '</b>? {{b}}',
      answer: t, key: String(t), blank: 'num'
    };
  }
  if(task === 'ones'){
    return {
      id: 'd:ones:' + n,
      html: tr('Сколько единиц в числе ', 'How many ones are in ') + '<b>' + n + '</b>? {{b}}',
      answer: o, key: String(o), blank: 'num'
    };
  }
  if(task === 'build'){
    return {
      id: 'd:build:' + n,
      html: tr('Запиши число: ', 'Write the number: ') + '<b>' + t + ' ' + de + ' ' + o + ' ' + ed + '</b> {{b}}',
      answer: n, key: String(n), blank: 'num'
    };
  }
  if(task === 'expand'){
    var guard = 0;
    while(o === 0 && guard++ < 30){ n = ri(rnd, from, to); t = Math.floor(n / 10); o = n % 10; }
    return {
      id: 'd:expand:' + n,
      html: '<b>' + n + '</b> = <b>' + (t * 10) + '</b> + {{b}}',
      answer: o, key: n + ' = ' + (t * 10) + ' + ' + o, blank: 'num'
    };
  }
  var tlo = Math.ceil(from / 10), thi = Math.floor(to / 10);
  if(tlo > thi){ tlo = thi = 1; }
  var total = ri(rnd, tlo, thi), n2 = total * 10;
  return {
    id: 'd:totalTens:' + n2,
    html: tr('Сколько всего десятков в числе ', 'How many tens in total are in ') + '<b>' + n2 + '</b>? {{b}}',
    answer: total, key: String(total), blank: 'num'
  };
}

/* ---------- сравнение ---------- */
function cmpItem(id, left, right, lv, rv){
  var ans = lv < rv ? '<' : lv > rv ? '>' : '=';
  return { id: id, html: left + ' {{b}} ' + right, answer: ans, key: left + ' ' + ans + ' ' + right, blank: 'sign' };
}
function compareItem(rnd, task, from, to){
  var de = tr('дес.', 'tens'), ed = tr('ед.', 'ones');
  var lo = from, hi = Math.max(from, to);
  var lo2 = Math.max(2, lo), dlo = Math.min(Math.max(3, lo + 1), hi);
  var num = function(tag){
    var a = ri(rnd, lo, hi), b = ri(rnd, lo, hi);
    if(rnd() < 0.2) b = a;
    return cmpItem('c:num:' + a + ':' + b, String(a), String(b), a, b);
  };
  if(task === 'numbers') return num();
  if(task === 'sums'){
    var s1 = ri(rnd, lo2, hi), s2 = ri(rnd, lo2, hi);
    var x1 = ri(rnd, 1, s1 - 1), x2 = s1 - x1, y1 = ri(rnd, 1, s2 - 1), y2 = s2 - y1;
    if(rnd() < 0.25){ y1 = x1; y2 = x2; }
    return cmpItem('c:sum:' + x1 + ':' + x2 + ':' + y1 + ':' + y2,
      x1 + ' + ' + x2, y1 + ' + ' + y2, x1 + x2, y1 + y2);
  }
  if(task === 'diffs'){
    var d1 = ri(rnd, dlo, hi), d3 = ri(rnd, dlo, hi);
    var d2 = ri(rnd, 1, Math.min(9, d1 - 1)), d4 = ri(rnd, 1, Math.min(9, d3 - 1));
    if(rnd() < 0.25){ d3 = d1; d4 = d2; }
    return cmpItem('c:diff:' + d1 + ':' + d2 + ':' + d3 + ':' + d4,
      d1 + ' − ' + d2, d3 + ' − ' + d4, d1 - d2, d3 - d4);
  }
  if(task === 'products' || task === 'quotients'){
    var top = Math.min(10, hi);
    var side = function(){
      for(var i = 0; i < 200; i++){
        if(task === 'products'){
          var x = ri(rnd, 1, top), y = ri(rnd, 1, top), v = x * y;
          if(v >= lo && v <= hi) return { l: x + ' × ' + y, v: v };
        } else {
          if(top < 2) return null;
          var d = ri(rnd, 2, top), q = ri(rnd, 1, top), a = d * q;
          if(a <= hi && q >= lo && q <= hi) return { l: a + ' ÷ ' + d, v: q };
        }
      }
      return null;
    };
    var s1 = side(), s2 = side();
    if(!s1 || !s2) return num('prod');
    if(rnd() < 0.25) s2 = { l: s1.l, v: s1.v };
    var tag = task === 'products' ? 'prod' : 'quot';
    return cmpItem('c:' + tag + ':' + s1.l.replace(/ /g, '') + ':' + s2.l.replace(/ /g, ''),
      s1.l, s2.l, s1.v, s2.v);
  }
  if(task === 'tensUnits'){
    var maxT = Math.floor(hi / 10);
    if(maxT < 1) return num();
    var t = ri(rnd, 1, maxT), x = ri(rnd, 1, Math.min(9, hi));
    if(rnd() < 0.5){
      return cmpItem('c:tu:' + t + ':0:' + (t * 10), t + ' ' + de, String(t * 10), t * 10, t * 10);
    }
    return cmpItem('c:tu:' + t + ':' + x, t + ' ' + de, x + ' ' + ed, t * 10, x);
  }
  var conv = [];
  if(hi >= 100) conv.push({ big: 'm', small: 'cm', f: 100 });
  if(hi >= 10){ conv.push({ big: 'm', small: 'dm', f: 10 }); conv.push({ big: 'dm', small: 'cm', f: 10 }); }
  if(!conv.length) return num();
  var o = pick(rnd, conv);
  var k = ri(rnd, 1, Math.floor(hi / o.f)), v1 = k * o.f;
  var v2 = rnd() < 0.25 ? v1 : ri(rnd, Math.max(1, v1 - 2), Math.min(hi, v1 + 2));
  var u1 = o.big === 'm' ? m() : dm(), u2 = o.small === 'cm' ? cm() : dm();
  return cmpItem('c:len:' + k + o.big + ':' + v2 + o.small,
    k + ' ' + u1, v2 + ' ' + u2, v1, v2);
}

/* ---------- пропущенное число ---------- */
function missingItem(rnd, opts){
  var from = opts.from, to = opts.to;
  var op = pick(rnd, opts.ops.length ? opts.ops : ['add', 'sub']);
  var role = pick(rnd, missRoles(opts.miss));
  var vals = null, pass, i;
  for(pass = 0; pass < 2 && !vals; pass++){
    for(i = 0; i < 400; i++){
      var a, b, res;
      if(op === 'add'){
        var hi = Math.max(1, Math.min(to, 100));
        a = ri(rnd, 1, hi); b = ri(rnd, 1, hi); res = a + b;
        if(res > 100) continue;
        if(opts.carry && pass === 0 && (a % 10 + b % 10) < 10) continue;
      } else if(op === 'sub'){
        var lo = Math.max(2, from), subHi = Math.max(2, to);
        a = ri(rnd, lo, subHi); b = ri(rnd, 1, a - 1); res = a - b;
        if(opts.carry && pass === 0 && (a % 10) >= (b % 10)) continue;
      } else if(op === 'mul'){
        a = ri(rnd, 2, 10); b = ri(rnd, 2, 10); res = a * b;
        if(res > 100) continue;
      } else {
        b = ri(rnd, 2, 10); res = ri(rnd, 2, 10); a = b * res;
        if(a > 100) continue;
      }
      vals = { a: a, b: b, r: res };
      break;
    }
  }
  if(!vals) vals = { a: 2, b: 3, r: 5 };
  var sym = op === 'add' ? '+' : op === 'sub' ? '−' : op === 'mul' ? '×' : '÷';
  var html, key, answer;
  if(role === 'a'){
    html = '{{b}} ' + sym + ' ' + vals.b + ' = ' + vals.r;
    key = vals.a + ' ' + sym + ' ' + vals.b + ' = ' + vals.r;
    answer = vals.a;
  } else if(role === 'b'){
    html = vals.a + ' ' + sym + ' {{b}} = ' + vals.r;
    key = vals.a + ' ' + sym + ' ' + vals.b + ' = ' + vals.r;
    answer = vals.b;
  } else {
    html = vals.a + ' ' + sym + ' ' + vals.b + ' = {{b}}';
    key = vals.a + ' ' + sym + ' ' + vals.b + ' = ' + vals.r;
    answer = vals.r;
  }
  return { id: 'm:' + op + ':' + role + ':' + vals.a + ':' + vals.b, html: html, answer: answer, key: key, blank: 'num' };
}

/* ---------- скобки ---------- */
function wsApply(x, o, y){
  if(o === '+') return { ok: true, v: x + y };
  if(o === '−') return x >= y ? { ok: true, v: x - y } : { ok: false };
  if(o === '×') return (x <= 10 && y <= 10) ? { ok: true, v: x * y } : { ok: false };
  return (y !== 0 && x % y === 0) ? { ok: true, v: x / y } : { ok: false };
}
function wsPrec(o){ return (o === '×' || o === '÷') ? 2 : 1; }
function wsEvalTri(a, o1, b, o2, c, mode, cap){
  var left, right, res;
  if(mode === 2){
    right = wsApply(b, o2, c); if(!right.ok || right.v > cap) return null;
    res = wsApply(a, o1, right.v); if(!res.ok) return null;
  } else if(mode === 1){
    left = wsApply(a, o1, b); if(!left.ok || left.v > cap) return null;
    res = wsApply(left.v, o2, c); if(!res.ok) return null;
  } else {
    if(wsPrec(o1) >= wsPrec(o2)){
      left = wsApply(a, o1, b); if(!left.ok || left.v > cap) return null;
      res = wsApply(left.v, o2, c); if(!res.ok) return null;
    } else {
      right = wsApply(b, o2, c); if(!right.ok || right.v > cap) return null;
      res = wsApply(a, o1, right.v); if(!res.ok) return null;
    }
  }
  if(res.v < 0 || res.v > cap) return null;
  return res.v;
}
function bracketsItem(rnd, task, opts){
  var cap = Math.max(2, Math.min(opts.to, 100));
  var hi = Math.max(2, Math.min(12, cap));
  var OPNAME = { add: '+', sub: '−', mul: '×', div: '÷' };
  var requested = (opts.ops && opts.ops.length ? opts.ops : ['add', 'sub', 'mul', 'div']);
  var sel = requested.map(function(o){ return OPNAME[o]; }).filter(Boolean);
  var OPS = sel.length ? sel : ['+', '−', '×', '÷'];
  var hasHigh = OPS.some(function(o){ return wsPrec(o) === 2; });
  var mode = task === 'chains' ? 0 : pick(rnd, [1, 2]);
  function expr(m, a, o1, b, o2, c){
    if(m === 1) return '(' + a + ' ' + o1 + ' ' + b + ') ' + o2 + ' ' + c;
    if(m === 2) return a + ' ' + o1 + ' (' + b + ' ' + o2 + ' ' + c + ')';
    return a + ' ' + o1 + ' ' + b + ' ' + o2 + ' ' + c;
  }
  function scan(m){
    for(var x = 0; x < OPS.length; x++)
      for(var y = 0; y < OPS.length; y++)
        for(var A = 1; A <= hi; A++)
          for(var B = 1; B <= hi; B++)
            for(var C = 1; C <= hi; C++){
              var v = wsEvalTri(A, OPS[x], B, OPS[y], C, m, cap);
              if(v === null) continue;
              if(m === 0 && hasHigh && wsPrec(OPS[x]) === 1 && wsPrec(OPS[y]) === 1) continue;
              return { e: expr(m, A, OPS[x], B, OPS[y], C), v: v };
            }
    return null;
  }
  for(var i = 0; i < 900; i++){
    var a = ri(rnd, 1, hi), b = ri(rnd, 1, hi), c = ri(rnd, 1, hi);
    var o1 = pick(rnd, OPS), o2 = pick(rnd, OPS);
    if(hasHigh && wsPrec(o1) === 1 && wsPrec(o2) === 1) continue;
    var v = wsEvalTri(a, o1, b, o2, c, mode, cap);
    if(v === null) continue;
    var e = expr(mode, a, o1, b, o2, c);
    return { id: 'br:' + e, html: e + ' = {{b}}', answer: v, key: e + ' = ' + v, blank: 'num' };
  }
  var fb = scan(mode) || scan(0) || scan(1) || scan(2) || { e: '1 + 1 + 1', v: 3 };
  return { id: 'br:' + fb.e, html: fb.e + ' = {{b}}', answer: fb.v, key: fb.e + ' = ' + fb.v, blank: 'num' };
}

/* ---------- единицы длины ---------- */
function unitsItem(rnd, task, from, to){
  var M = m(), DM = dm(), CM = cm();
  var MM = tr('мм', 'mm'), KM = tr('км', 'km');
  var a = from, b = to;

  function item(id, html, answer, key){
    return { id:id, html:html.replace(/\{\{b\}\}\s+(\S+)$/, '<span class="ansu">{{b}} $1</span>'), answer:answer, key:key, blank:'num' };
  }
  function parts(v){
    return { m: Math.floor(v / 100), d: Math.floor((v % 100) / 10), c: v % 10 };
  }
  function compText(v){
    var p = parts(v), t = [];
    if(p.m) t.push(p.m + ' ' + M);
    if(p.d) t.push(p.d + ' ' + DM);
    if(p.c || (!p.m && !p.d)) t.push(p.c + ' ' + CM);
    return t.join(' ');
  }
  function multExists(step, hiCap){
    var lo = Math.ceil(a / step) * step;
    var hi = Math.floor(Math.min(b, hiCap) / step) * step;
    return lo <= hi;
  }
  function pickMult(step, hiCap){
    var lo = Math.ceil(a / step) * step;
    var hi = Math.floor(Math.min(b, hiCap) / step) * step;
    if(lo > hi) return null;
    return lo + step * ri(rnd, 0, (hi - lo) / step);
  }
  function nonTenExists(lo, hi){
    lo = Math.max(lo, 1);
    hi = Math.min(hi, 10000);
    if(lo > hi) return false;
    return (lo % 10 ? lo : lo + 1) <= hi;
  }
  function pickNonTen(lo, hi){
    lo = Math.max(lo, 1);
    hi = Math.min(hi, 10000);
    if(lo > hi) return null;
    var v = ri(rnd, lo, hi);
    if(v % 10 === 0){
      if(v - 1 >= lo) v--;
      else if(v + 1 <= hi) v++;
      else return null;
    }
    return v;
  }
  function plainUnit(){
    var x = ri(rnd, a, b), y = ri(rnd, a, b);
    return item('u:addcm:' + x + ':' + y,
      x + ' ' + CM + ' + ' + y + ' ' + CM + ' = {{b}} ' + CM, x + y,
      x + ' ' + CM + ' + ' + y + ' ' + CM + ' = ' + (x + y) + ' ' + CM);
  }
  function convertFallback(){
    var fd = ri(rnd, 1, 9);
    if(ri(rnd, 1, 2) === 1){
      return item('u:conv:fb:dm:cm:' + fd, fd + ' ' + DM + ' = {{b}} ' + CM, fd * 10,
        fd + ' ' + DM + ' = ' + (fd * 10) + ' ' + CM);
    }
    return item('u:conv:fb:cm:dm:' + fd, (fd * 10) + ' ' + CM + ' = {{b}} ' + DM, fd,
      (fd * 10) + ' ' + CM + ' = ' + fd + ' ' + DM);
  }

  if(task === 'millimeters'){
    var mm = ri(rnd, 2, 9);
    if(rnd() < 0.5){
      return item('u:mm:cm:' + mm, mm + ' ' + CM + ' = {{b}} ' + MM, mm * 10,
        mm + ' ' + CM + ' = ' + (mm * 10) + ' ' + MM);
    }
    return item('u:mm:mm:' + (mm * 10), (mm * 10) + ' ' + MM + ' = {{b}} ' + CM, mm,
      (mm * 10) + ' ' + MM + ' = ' + mm + ' ' + CM);
  }
  if(task === 'kilometers'){
    var km = ri(rnd, 2, 9);
    if(rnd() < 0.5){
      return item('u:km:m:' + km, km + ' ' + KM + ' = {{b}} ' + M, km * 1000,
        km + ' ' + KM + ' = ' + (km * 1000) + ' ' + M);
    }
    return item('u:km:km:' + (km * 1000), (km * 1000) + ' ' + M + ' = {{b}} ' + KM, km,
      (km * 1000) + ' ' + M + ' = ' + km + ' ' + KM);
  }

  if(task === 'convert'){
    var kinds = [];
    if(multExists(10, b)) kinds = kinds.concat(['dm2cm', 'cm2dm']);
    if(multExists(100, b)) kinds = kinds.concat(['m2cm', 'cm2m', 'm2dm', 'dm2m']);
    if(!kinds.length) return convertFallback();
    var k = pick(rnd, kinds);
    var isM = k === 'm2cm' || k === 'cm2m' || k === 'm2dm' || k === 'dm2m';
    var v = isM ? pickMult(100, b) : pickMult(10, b);
    var p = parts(v);
    if(k === 'm2cm') return item('u:conv:m:cm:' + v, p.m + ' ' + M + ' = {{b}} ' + CM, v, p.m + ' ' + M + ' = ' + v + ' ' + CM);
    if(k === 'cm2m') return item('u:conv:cm:m:' + v, v + ' ' + CM + ' = {{b}} ' + M, p.m, v + ' ' + CM + ' = ' + p.m + ' ' + M);
    if(k === 'm2dm') return item('u:conv:m:dm:' + v, p.m + ' ' + M + ' = {{b}} ' + DM, v / 10, p.m + ' ' + M + ' = ' + (v / 10) + ' ' + DM);
    if(k === 'dm2m') return item('u:conv:dm:m:' + v, (v / 10) + ' ' + DM + ' = {{b}} ' + M, p.m, (v / 10) + ' ' + DM + ' = ' + p.m + ' ' + M);
    if(k === 'dm2cm') return item('u:conv:dm:cm:' + v, (v / 10) + ' ' + DM + ' = {{b}} ' + CM, v, (v / 10) + ' ' + DM + ' = ' + v + ' ' + CM);
    return item('u:conv:cm:dm:' + v, v + ' ' + CM + ' = {{b}} ' + DM, v / 10, v + ' ' + CM + ' = ' + (v / 10) + ' ' + DM);
  }

  var fams = [];
  if(multExists(10, b - 1)) fams.push('add1');
  if(nonTenExists(Math.max(a, 11), b - 1)) fams.push('add3');
  if(multExists(10, b)) fams.push('sub1');
  if(nonTenExists(Math.max(a, 11), b)) fams.push('sub2');
  if(multExists(100, b)) fams.push('msubcm', 'msubdm');
  if(!fams.length) return plainUnit();

  var fam = pick(rnd, fams), base, e;
  function make(id, left, answer){
    return item(id, left + ' = {{b}} ' + (fam === 'msubdm' ? DM : CM), answer,
      left + ' = ' + answer + ' ' + (fam === 'msubdm' ? DM : CM));
  }
  if(fam === 'add1'){
    base = pickMult(10, b - 1);
    e = ri(rnd, 1, Math.min(9, b - base));
    return make('u:add1:' + base + ':' + e, compText(base) + ' + ' + e + ' ' + CM, base + e);
  }
  if(fam === 'add3'){
    base = pickNonTen(Math.max(a, 11), b - 1);
    e = ri(rnd, 1, Math.min(9, b - base));
    return make('u:add3:' + base + ':' + e, compText(base) + ' + ' + e + ' ' + CM, base + e);
  }
  if(fam === 'sub1'){
    base = pickMult(10, b);
    e = ri(rnd, 1, 9);
    return make('u:sub1:' + base + ':' + e, compText(base) + ' − ' + e + ' ' + CM, base - e);
  }
  if(fam === 'sub2'){
    base = pickNonTen(Math.max(a, 11), b);
    e = ri(rnd, 1, 9);
    return make('u:sub2:' + base + ':' + e, compText(base) + ' − ' + e + ' ' + CM, base - e);
  }
  base = pickMult(100, b);
  if(fam === 'msubcm'){
    e = ri(rnd, 1, Math.min(99, base - 1));
    return make('u:msubcm:' + base + ':' + e, compText(base) + ' − ' + e + ' ' + CM, base - e);
  }
  e = ri(rnd, 1, 9);
  return make('u:msubdm:' + base + ':' + e, compText(base) + ' − ' + e + ' ' + DM, base / 10 - e);
}

/* ---------- периметр ---------- */
function perItem(kind, sides, answer){
  var CM = cm(), values = sides.map(function(v){ return v + ' ' + CM; });
  var name, text;
  if(kind === 'rectangle'){
    name = tr('Прямоугольник', 'A rectangle');
    text = tr(' со сторонами ', ' with sides ') + joinWords(values);
  } else if(kind === 'square'){
    name = tr('Квадрат', 'A square');
    text = tr(' со стороной ', ' with a side of ') + values[0];
  } else if(kind === 'pentagon'){
    name = tr('Пятиугольник', 'A pentagon');
    text = tr(' со стороной ', ' with a side of ') + values[0];
  } else if(kind === 'hexagon'){
    name = tr('Шестиугольник', 'A hexagon');
    text = tr(' со стороной ', ' with a side of ') + values[0];
  } else if(kind === 'triangle'){
    name = tr('Стороны треугольника: ', 'Sides of the triangle: ');
    text = joinWords(values);
  } else {
    name = tr('Стороны четырёхугольника: ', 'Sides of the quadrilateral: ');
    text = joinWords(values);
  }
  var q = name + text + tr('. Найди периметр.', '. Find the perimeter.');
  return {
    id: 'p:' + kind + ':' + sides.join('-'),
    html: q + ' {{b}} ' + CM,
    answer: answer,
    key: tr('P = ', 'P = ') + answer + ' ' + CM,
    blank: 'num'
  };
}
function perimeterItem(rnd, task, from, to){
  var lo = Math.max(1, from), hi = Math.max(lo, to), i, a, b, c;
  if(task === 'triangle'){
    for(i = 0; i < 300; i++){
      a = ri(rnd, lo, hi); b = ri(rnd, lo, hi); c = ri(rnd, lo, hi);
      if(a + b > c && a + c > b && b + c > a) return perItem('triangle', [a, b, c], a + b + c);
    }
    return perItem('triangle', [3, 4, 5], 12);
  }
  if(task === 'quad'){
    for(i = 0; i < 300; i++){
      var sides = [ri(rnd, lo, hi), ri(rnd, lo, hi), ri(rnd, lo, hi), ri(rnd, lo, hi)];
      sides.sort(function(x, y){ return x - y; });
      if(sides[3] < sides[0] + sides[1] + sides[2]){
        return perItem('quad', sides, sides[0] + sides[1] + sides[2] + sides[3]);
      }
    }
    return perItem('quad', [3, 4, 5, 6], 18);
  }
  if(task === 'rectangle'){
    var w = ri(rnd, lo, hi), h = ri(rnd, lo, hi);
    if(w === h) h = w < hi ? w + 1 : (w > lo ? w - 1 : w);
    return perItem('rectangle', [w, h], 2 * (w + h));
  }
  var s = ri(rnd, lo, hi), count = task === 'square' ? 4 : task === 'pentagon' ? 5 : 6;
  var rep = [], j;
  for(j = 0; j < (task === 'square' ? 1 : count); j++) rep.push(s);
  return perItem(task, rep, count * s);
}

/* ---------- уравнения ---------- */
function equationsItem(rnd, task, from, to){
  var hi = Math.max(3, Math.min(100, to));
  var lo = Math.max(1, Math.min(from, hi - 1));
  var a, b, x, f, q;
  if(task === 'plus'){
    b = ri(rnd, Math.max(2, lo), hi); a = ri(rnd, 1, b - 1); x = b - a;
    return { id: 'eq:p:' + a + ':' + b, html: '{{b}} + ' + a + ' = ' + b, answer: x, key: 'x = ' + x, blank: 'num' };
  }
  if(task === 'minus'){
    x = ri(rnd, Math.max(2, lo), hi); a = ri(rnd, 1, x - 1); b = x - a;
    return { id: 'eq:m:' + a + ':' + b, html: '{{b}} − ' + a + ' = ' + b, answer: x, key: 'x = ' + x, blank: 'num' };
  }
  if(task === 'subFrom'){
    a = ri(rnd, Math.max(2, lo), hi); x = ri(rnd, 1, a - 1); b = a - x;
    return { id: 'eq:s:' + a + ':' + b, html: a + ' − {{b}} = ' + b, answer: x, key: 'x = ' + x, blank: 'num' };
  }
  if(task === 'times'){
    f = ri(rnd, 2, 10); x = ri(rnd, 2, 10);
    if(f * x > hi) x = Math.max(2, Math.floor(hi / f));
    return { id: 'eq:t:' + f + ':' + x, html: '{{b}} × ' + f + ' = ' + (f * x), answer: x, key: 'x = ' + x, blank: 'num' };
  }
  if(task === 'divide'){
    f = ri(rnd, 2, 10); q = ri(rnd, 2, 10);
    if(f * q > hi) q = Math.max(2, Math.floor(hi / f));
    return { id: 'eq:d:' + f + ':' + q, html: '{{b}} ÷ ' + f + ' = ' + q, answer: f * q, key: 'x = ' + (f * q), blank: 'num' };
  }
  f = ri(rnd, 2, 10); q = ri(rnd, 2, 10);
  if(f * q > hi) q = Math.max(2, Math.floor(hi / f));
  return { id: 'eq:b:' + f + ':' + q, html: (f * q) + ' ÷ {{b}} = ' + q, answer: f, key: 'x = ' + f, blank: 'num' };
}

/* ---------- деление с остатком ---------- */
function remaindersItem(rnd, task, from, to){
  var hi = Math.max(5, Math.min(100, to));
  var lo = Math.max(1, Math.min(from, hi));
  var b = 3, q = 3, rem = 1, a = 10, i;
  for(i = 0; i < 300; i++){
    b = ri(rnd, 2, 9); q = ri(rnd, 2, 10); rem = ri(rnd, 1, b - 1); a = b * q + rem;
    if(a <= hi && a >= lo) break;
  }
  if(a > hi || a < lo){ b = 3; q = 2; rem = 2; a = 8; }
  var OST = tr('ост.', 'r.');
  var tail = ' (' + OST + ' ' + rem + ')';
  if(task === 'quotient') return { id: 'rm:q:' + a + ':' + b, html: a + ' ÷ ' + b + ' = {{b}}' + tail, answer: q, key: a + ' ÷ ' + b + ' = ' + q + tail, blank: 'num' };
  if(task === 'remainder') return { id: 'rm:r:' + a + ':' + b, html: a + ' ÷ ' + b + ' = ' + q + ' (' + OST + ' {{b}})', answer: rem, key: a + ' ÷ ' + b + ' = ' + q + tail, blank: 'num' };
  if(task === 'dividend') return { id: 'rm:a:' + b + ':' + q + ':' + rem, html: '{{b}} ÷ ' + b + ' = ' + q + tail, answer: a, key: a + ' ÷ ' + b + ' = ' + q + tail, blank: 'num' };
  return { id: 'rm:b:' + a + ':' + q + ':' + rem, html: a + ' ÷ {{b}} = ' + q + tail, answer: b, key: a + ' ÷ ' + b + ' = ' + q + tail, blank: 'num' };
}

/* ---------- площадь и объём ---------- */
function areaItem(rnd, task, from, to){
  var lo = Math.max(1, from), hi = Math.max(lo, Math.min(20, to));
  var CM = tr('см', 'cm'), CM2 = tr('см²', 'cm²'), CM3 = tr('см³', 'cm³');
  var w = ri(rnd, lo, hi), h = ri(rnd, lo, hi), s = ri(rnd, lo, hi);
  if(task === 'rectangle'){
    return {
      id: 'ar:r:' + w + ':' + h,
      html: tr('Прямоугольник со сторонами ', 'A rectangle with sides ') + w + ' ' + CM + tr(' и ', ' and ') + h + ' ' + CM + tr('. Найди площадь. ', '. Find the area. ') + '{{b}} ' + CM2,
      answer: w * h, key: 'S = ' + (w * h) + ' ' + CM2, blank: 'num'
    };
  }
  if(task === 'square'){
    return {
      id: 'ar:s:' + s,
      html: tr('Квадрат со стороной ', 'A square with a side of ') + s + ' ' + CM + tr('. Найди площадь. ', '. Find the area. ') + '{{b}} ' + CM2,
      answer: s * s, key: 'S = ' + (s * s) + ' ' + CM2, blank: 'num'
    };
  }
  if(task === 'side'){
    return {
      id: 'ar:x:' + w + ':' + h,
      html: tr('Площадь прямоугольника — ', 'The area of a rectangle is ') + (w * h) + ' ' + CM2 + tr(', одна сторона — ', ', one side is ') + w + ' ' + CM + tr('. Найди другую сторону. ', '. Find the other side. ') + '{{b}} ' + CM,
      answer: h, key: 'b = ' + h + ' ' + CM, blank: 'num'
    };
  }
  var c = ri(rnd, lo, Math.min(hi, 10));
  return {
    id: 'ar:v:' + w + ':' + h + ':' + c,
    html: tr('Коробка: ', 'A box: ') + w + ' ' + CM + ', ' + h + ' ' + CM + ', ' + c + ' ' + CM + tr('. Найди объём. ', '. Find the volume. ') + '{{b}} ' + CM3,
    answer: w * h * c, key: 'V = ' + (w * h * c) + ' ' + CM3, blank: 'num'
  };
}

/* ---------- операции и алгоритмы ---------- */
function wsApply(x, op, y){
  if(op === 'add') return x + y;
  if(op === 'sub') return x >= y ? x - y : null;
  if(op === 'mul') return (x <= 10 && y <= 10) ? x * y : null;
  return (y !== 0 && x % y === 0) ? x / y : null;
}
function wsOpSym(op){ return op === 'add' ? '+' : op === 'sub' ? '−' : op === 'mul' ? '×' : '÷'; }
function wsOpToken(op, n){ return wsOpSym(op) + n; }
function operationsItem(rnd, task, ops, from, to){
  var hi = Math.max(4, Math.min(100, to));
  var lo = Math.max(1, Math.min(from, hi - 1));
  var use = (ops && ops.length ? ops : ['add', 'sub']);
  function trial(len){
    for(var i = 0; i < 500; i++){
      var x = ri(rnd, lo, hi), steps = [], cur = x, ok = true;
      for(var k = 0; k < len; k++){
        var op = pick(rnd, use), b = ri(rnd, 1, Math.min(10, hi));
        var y = wsApply(cur, op, b);
        if(y === null || y < 0 || y > hi){ ok = false; break; }
        steps.push({ op: op, b: b, v: y }); cur = y;
      }
      if(ok) return { start: x, steps: steps };
    }
    return null;
  }
  if(task === 'result1'){
    var one = trial(1) || { start: lo, steps: [{ op: 'add', b: 1, v: lo + 1 }] };
    var st = one.steps[0];
    return {
      id: 'op:r1:' + one.start + ':' + st.op + ':' + st.b,
      html: one.start + ' ' + wsOpSym(st.op) + ' ' + st.b + ' = {{b}}',
      answer: st.v, key: one.start + ' ' + wsOpSym(st.op) + ' ' + st.b + ' = ' + st.v, blank: 'num'
    };
  }
  if(task === 'result2'){
    var two = trial(2) || { start: lo, steps: [{ op: 'add', b: 1, v: lo + 1 }, { op: 'add', b: 1, v: lo + 2 }] };
    var h = String(two.start), p = String(two.start);
    two.steps.forEach(function(s){ h += ' → ' + wsOpToken(s.op, s.b); p += ' → ' + wsOpToken(s.op, s.b); });
    return { id: 'op:r2:' + p, html: h + ' → {{b}}', answer: two.steps[1].v, key: p + ' → ' + two.steps[1].v, blank: 'num' };
  }
  if(task === 'result3'){
    var three = trial(3) || { start: lo, steps: [{ op: 'add', b: 1, v: lo + 1 }, { op: 'add', b: 1, v: lo + 2 }, { op: 'add', b: 1, v: lo + 3 }] };
    var h3 = String(three.start), p3 = String(three.start);
    three.steps.forEach(function(s){ h3 += ' → ' + wsOpToken(s.op, s.b); p3 += ' → ' + wsOpToken(s.op, s.b); });
    return { id: 'op:r3:' + p3, html: h3 + ' → {{b}}', answer: three.steps[2].v, key: p3 + ' → ' + three.steps[2].v, blank: 'num' };
  }
  if(task === 'start1'){
    var s1 = trial(1) || { start: lo, steps: [{ op: 'add', b: 1, v: lo + 1 }] };
    var last = s1.steps[0];
    return {
      id: 'op:s1:' + s1.start + ':' + last.op + ':' + last.b,
      html: '{{b}} → ' + wsOpToken(last.op, last.b) + ' → ' + last.v,
      answer: s1.start, key: s1.start + ' → ' + wsOpToken(last.op, last.b) + ' → ' + last.v, blank: 'num'
    };
  }
  if(task === 'start3'){
    var st3 = trial(3) || { start: lo, steps: [{ op: 'add', b: 1, v: lo + 1 }, { op: 'add', b: 1, v: lo + 2 }, { op: 'add', b: 1, v: lo + 3 }] };
    var ps = '?';
    st3.steps.forEach(function(s){ ps += ' → ' + wsOpToken(s.op, s.b); });
    return {
      id: 'op:s3:' + ps,
      html: '{{b}}' + ps.slice(1) + ' → ' + st3.steps[2].v,
      answer: st3.start, key: st3.start + ps.slice(1) + ' → ' + st3.steps[2].v, blank: 'num'
    };
  }
  var s2 = trial(2) || { start: lo, steps: [{ op: 'add', b: 1, v: lo + 1 }, { op: 'add', b: 1, v: lo + 2 }] };
  var pt = '?';
  s2.steps.forEach(function(s){ pt += ' → ' + wsOpToken(s.op, s.b); });
  return {
    id: 'op:s2:' + pt,
    html: '{{b}}' + pt.slice(1) + ' → ' + s2.steps[1].v,
    answer: s2.start, key: s2.start + pt.slice(1) + ' → ' + s2.steps[1].v, blank: 'num'
  };
}

/* ---------- чётные, нечётные, кратные ---------- */
function divisibilityItem(rnd, task, from, to){
  var lo = Math.max(1, from), hi = Math.max(lo + 1, Math.min(100, to));
  var n, ans, k, a, b, i;
  if(task === 'nextEven' || task === 'nextOdd'){
    var odd = task === 'nextOdd';
    for(i = 0; i < 200; i++){
      n = ri(rnd, lo, hi - 1); ans = n + 1;
      if((ans % 2 === 0) === !odd && ans <= hi) break;
      ans = n + 2;
      if((ans % 2 === 0) === !odd && ans <= hi) break;
    }
    if(!ans || ans > hi) ans = odd ? (hi % 2 ? hi : hi - 1) : (hi % 2 ? hi - 1 : hi);
    return {
      id: 'dv:' + task + ':' + n,
      html: (odd ? tr('Запиши следующее нечётное число после ', 'Write the next odd number after ')
        : tr('Запиши следующее чётное число после ', 'Write the next even number after ')) + n + '. {{b}}',
      answer: ans, key: String(ans), blank: 'num'
    };
  }
  if(task === 'prevEven' || task === 'prevOdd'){
    var podd = task === 'prevOdd';
    for(i = 0; i < 200; i++){
      n = ri(rnd, lo + 1, hi); ans = n - 1;
      if((ans % 2 === 0) === !podd && ans >= lo) break;
      ans = n - 2;
      if((ans % 2 === 0) === !podd && ans >= lo) break;
    }
    if(!ans || ans < lo) ans = podd ? (lo % 2 ? lo : lo + 1) : (lo % 2 ? lo + 1 : lo);
    return {
      id: 'dv:' + task + ':' + n,
      html: (podd ? tr('Запиши предыдущее нечётное число перед ', 'Write the previous odd number before ')
        : tr('Запиши предыдущее чётное число перед ', 'Write the previous even number before ')) + n + '. {{b}}',
      answer: ans, key: String(ans), blank: 'num'
    };
  }
  if(task === 'multipleNext'){
    for(i = 0; i < 200; i++){
      k = ri(rnd, 2, 9); n = ri(rnd, lo, hi - 1); ans = Math.ceil((n + 1) / k) * k;
      if(ans <= hi) break;
    }
    if(!ans || ans > hi){ k = 2; ans = n + (n % 2 ? 1 : 2); }
    return {
      id: 'dv:mna:' + k + ':' + n,
      html: tr('Наименьшее число, кратное ', 'The smallest multiple of ') + k + tr(', больше ', ' greater than ') + n + '. {{b}}',
      answer: ans, key: String(ans), blank: 'num'
    };
  }
  if(task === 'multiplePrev'){
    for(i = 0; i < 200; i++){
      k = ri(rnd, 2, 9); n = ri(rnd, lo + 1, hi); ans = Math.floor((n - 1) / k) * k;
      if(ans >= lo && ans > 0) break;
    }
    if(!ans || ans < lo){ k = 2; ans = Math.max(lo, n - 2); }
    return {
      id: 'dv:mpb:' + k + ':' + n,
      html: tr('Наибольшее число, кратное ', 'The greatest multiple of ') + k + tr(', меньше ', ' less than ') + n + '. {{b}}',
      answer: ans, key: String(ans), blank: 'num'
    };
  }
  a = ri(rnd, lo, Math.max(lo, hi - 2));
  b = ri(rnd, a + 1, Math.min(hi, a + 9));
  ans = Math.floor(b / 2) - Math.floor((a - 1) / 2);
  return {
    id: 'dv:ce:' + a + ':' + b,
    html: tr('Сколько чётных чисел от ', 'How many even numbers from ') + a + tr(' до ', ' to ') + b + '? {{b}}',
    answer: ans, key: String(ans), blank: 'num'
  };
}

/* ---------- геометрия ---------- */
function geoSheetFigure(fig){
  return global.MathProblems && global.MathProblems.geometryFigure
    ? global.MathProblems.geometryFigure(fig, true)
    : '';
}
function geometryItem(rnd, task, from, to){
  var hi = Math.max(2, Math.min(20, to));
  var CM = cm();
  function q(fig, text, answer, key, id, unit){
    return {
      id: 'geo:' + id,
      html: '<span class="geo-fig">' + geoSheetFigure(fig) + '</span><span class="geo-q">' + text + '</span> {{b}}' + (unit ? ' ' + unit : ''),
      answer: answer, key: key, blank: 'num', cls: 'geo-task'
    };
  }
  if(task === 'segments'){
    var n = ri(rnd, 3, 5), ans = n * (n - 1) / 2;
    return q({ shape: 'points', n: n }, tr('Сколько отрезков с концами в отмеченных точках?', 'How many segments have their ends at the marked points?'),
      ans, tr('Отрезков: ', 'Segments: ') + ans, 'seg:' + n);
  }
  if(task === 'rays'){
    var m = ri(rnd, 3, 5);
    return q({ shape: 'rays', n: m }, tr('Сколько лучей выходит из точки O?', 'How many rays start at point O?'),
      m, tr('Лучей: ', 'Rays: ') + m, 'ray:' + m);
  }
  if(task === 'intersections'){
    var layout = ri(rnd, 0, 3), count = layout === 0 ? 1 : layout === 1 ? 2 : layout === 2 ? 3 : 0;
    return q({ shape: 'intersections', layout: layout }, tr('Сколько точек пересечения?', 'How many intersection points?'),
      count, tr('Точек пересечения: ', 'Intersection points: ') + count, 'int:' + layout);
  }
  if(task === 'diameter'){
    var r = ri(rnd, 2, hi);
    return q({ shape: 'radius', value: r }, tr('Радиус окружности — ', 'The radius is ') + r + ' ' + CM + tr('. Найди диаметр.', '. Find the diameter.'),
      r * 2, tr('Диаметр: ', 'Diameter: ') + (r * 2) + ' ' + CM, 'dia:' + r, CM);
  }
  var rr = ri(rnd, 2, hi), dd = rr * 2;
  return q({ shape: 'diameter', value: dd }, tr('Диаметр окружности — ', 'The diameter is ') + dd + ' ' + CM + tr('. Найди радиус.', '. Find the radius.'),
    rr, tr('Радиус: ', 'Radius: ') + rr + ' ' + CM, 'rad:' + dd, CM);
}

/* ---------- тысяча ---------- */
function thousandItem(rnd, task, from, to){
  var lo = Math.max(100, Math.min(999, from)), hi = Math.max(lo, Math.min(999, to));
  var n = ri(rnd, lo, hi), h = Math.floor(n / 100), t = Math.floor(n / 10) % 10, o = n % 10, guard = 0;
  while((t === 0 || o === 0) && guard++ < 30){
    n = ri(rnd, lo, hi); h = Math.floor(n / 100); t = Math.floor(n / 10) % 10; o = n % 10;
  }
  var de = tr('дес.', 'tens'), ed = tr('ед.', 'ones'), sot = tr('сот.', 'hundreds');
  if(task === 'hundreds') return { id: 'th:h:' + n, html: tr('Сколько сотен в числе ', 'How many hundreds are in ') + '<b>' + n + '</b>? {{b}}', answer: h, key: String(h), blank: 'num' };
  if(task === 'tens') return { id: 'th:t:' + n, html: tr('Сколько всего десятков в числе ', 'How many tens in total are in ') + '<b>' + n + '</b>? {{b}}', answer: Math.floor(n / 10), key: String(Math.floor(n / 10)), blank: 'num' };
  if(task === 'ones') return { id: 'th:o:' + n, html: tr('Сколько единиц в числе ', 'How many ones are in ') + '<b>' + n + '</b>? {{b}}', answer: o, key: String(o), blank: 'num' };
  if(task === 'build') return { id: 'th:b:' + n, html: tr('Запиши число: ', 'Write the number: ') + '<b>' + h + ' ' + sot + ' ' + t + ' ' + de + ' ' + o + ' ' + ed + '</b> {{b}}', answer: n, key: String(n), blank: 'num' };
  if(task === 'expand') return { id: 'th:x:' + n, html: '<b>' + n + '</b> = <b>' + (h * 100) + '</b> + <b>' + (t * 10) + '</b> + {{b}}', answer: o, key: n + ' = ' + (h * 100) + ' + ' + (t * 10) + ' + ' + o, blank: 'num' };
  if(task === 'roundAdd'){
    var a = ri(rnd, 1, 9) * 100, b = ri(rnd, 1, 9) * 10;
    return { id: 'th:add:' + a + ':' + b, html: a + ' + ' + b + ' = {{b}}', answer: a + b, key: a + ' + ' + b + ' = ' + (a + b), blank: 'num' };
  }
  var s = ri(rnd, 2, 9) * 100, sub = ri(rnd, 1, 9) * 10;
  return { id: 'th:sub:' + s + ':' + sub, html: s + ' − ' + sub + ' = {{b}}', answer: s - sub, key: s + ' − ' + sub + ' = ' + (s - sub), blank: 'num' };
}

/* ---------- круглые числа ---------- */
function roundItem(rnd, task, from, to){
  var lo = Math.max(1, Math.min(99, from)), hi = Math.max(lo, Math.min(99, to));
  function expr(a, sym, b, answer, id){
    return { id: 'rd:' + id, html: a + ' ' + sym + ' ' + b + ' = {{b}}', answer: answer, key: a + ' ' + sym + ' ' + b + ' = ' + answer, blank: 'num' };
  }
  var n, a, b, q;
  if(task === 'timesTen'){ n = ri(rnd, lo, hi); return expr(n, '×', 10, n * 10, 'mt:' + n); }
  if(task === 'divTen'){ n = ri(rnd, lo, hi); return expr(n * 10, '÷', 10, n, 'dt:' + n); }
  if(task === 'timesHundred'){ n = ri(rnd, 1, 9); return expr(n, '×', 100, n * 100, 'mh:' + n); }
  if(task === 'divHundred'){ n = ri(rnd, 1, 9); return expr(n * 100, '÷', 100, n, 'dh:' + n); }
  if(task === 'roundMul'){ a = ri(rnd, 2, 9) * 10; b = ri(rnd, 2, 5); return expr(a, '×', b, a * b, 'rm:' + a + ':' + b); }
  b = ri(rnd, 2, 9) * 10; q = ri(rnd, 2, 9);
  return expr(b * q, '÷', b, q, 'rd:' + b + ':' + q);
}

/* ---------- дерево возможностей ---------- */
function treeItem(rnd, task, from, to){
  var lo = Math.max(2, Math.min(6, from)), hi = Math.max(lo, Math.min(6, to));
  var m = ri(rnd, lo, hi), n = ri(rnd, lo, hi), k = ri(rnd, 2, 3);
  if(task === 'pairs'){
    var html = tr('Красных кубиков — {a}, синих — {b}. Сколько разных пар «красный + синий» можно составить?',
      'There are {a} red bricks and {b} blue bricks. How many different red + blue pairs can be made?');
    html = html.replace('{a}', m).replace('{b}', n);
    return { id: 'tr:p:' + m + ':' + n, html: html + ' {{b}}', answer: m * n, key: String(m * n), blank: 'num' };
  }
  if(task === 'three'){
    var h3 = tr('В кафе есть сок, печенье и фрукты нескольких видов: {a}, {b} и {c}. Сколько разных наборов из сока, печенья и фрукта можно составить?',
      'A cafe offers {a} kinds of juice, {b} kinds of cookies and {c} kinds of fruit. How many different sets can be made?');
    h3 = h3.replace('{a}', m).replace('{b}', n).replace('{c}', k);
    return { id: 'tr:t:' + m + ':' + n + ':' + k, html: h3 + ' {{b}}', answer: m * n * k, key: String(m * n * k), blank: 'num' };
  }
  if(task === 'paths'){
    var hp = tr('Дорог от дома до моста — {a}, от моста до школы — {b}. Сколько разных путей от дома до школы через мост?',
      'There are {a} roads from home to the bridge and {b} roads from the bridge to school. How many routes go through the bridge?');
    hp = hp.replace('{a}', m).replace('{b}', n);
    return { id: 'tr:w:' + m + ':' + n, html: hp + ' {{b}}', answer: m * n, key: String(m * n), blank: 'num' };
  }
  var count = ri(rnd, 3, 4), nums = shuffle(rnd, [1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, count);
  var list = nums.join(', ');
  return {
    id: 'tr:d:' + list,
    html: tr('Сколько двузначных чисел можно составить из цифр ', 'How many two-digit numbers can be made from the digits ') + list +
      tr(', если цифры в числе не повторяются?', ', if a digit cannot repeat in a number?') + ' {{b}}',
    answer: count * (count - 1), key: String(count * (count - 1)), blank: 'num'
  };
}

function generate(kind, task, rnd, opts){
  if(kind === 'digits') return digitsItem(rnd, task, opts.from, opts.to);
  if(kind === 'compare') return compareItem(rnd, task, opts.from, opts.to);
  if(kind === 'missing') return missingItem(rnd, opts);
  if(kind === 'brackets') return bracketsItem(rnd, task, opts);
  if(kind === 'units') return unitsItem(rnd, task, opts.from, opts.to);
  if(kind === 'perimeter') return perimeterItem(rnd, task, opts.from, opts.to);
  if(kind === 'equations') return equationsItem(rnd, task, opts.from, opts.to);
  if(kind === 'remainders') return remaindersItem(rnd, task, opts.from, opts.to);
  if(kind === 'area') return areaItem(rnd, task, opts.from, opts.to);
  if(kind === 'operations') return operationsItem(rnd, task, opts.ops, opts.from, opts.to);
  if(kind === 'divisibility') return divisibilityItem(rnd, task, opts.from, opts.to);
  if(kind === 'geometry') return geometryItem(rnd, task, opts.from, opts.to);
  if(kind === 'thousand') return thousandItem(rnd, task, opts.from, opts.to);
  if(kind === 'round') return roundItem(rnd, task, opts.from, opts.to);
  if(kind === 'tree') return treeItem(rnd, task, opts.from, opts.to);
  if((kind === 'problems' || kind === 'polylines') && global.MathProblems){
    var e = kind === 'problems'
      ? global.MathProblems.generateProblem(task, rnd, opts)
      : global.MathProblems.generatePolyline(task, rnd, { from: opts.from, to: opts.to, maxTotal: 16 });
    return {
      id: e.id,
      html: e.sheetHtml,
      answer: e.need,
      key: e.text + ' → ' + e.answerText,
      blank: 'num',
      cls: kind === 'problems' ? 'wp-task' : 'poly-task',
      answerText: e.answerText,
      work: e.work || null
    };
  }
  return null;
}

function makeVariant(opts){
  opts = opts || {};
  var kind = String(opts.kind || '');
  if(!TASKS[kind]) return { kind: kind, sheets: [] };
  var rows = clampInt(opts.rows, 2, 24, 8);
  var oneCol = kind === 'problems' || kind === 'polylines';
  var twoCol = kind === 'perimeter' || kind === 'area' || kind === 'operations' || kind === 'geometry';
  var maxCols = oneCol ? 1 : twoCol ? 2 : 4;
  var cols = oneCol ? 1 : clampInt(opts.cols, 2, maxCols, twoCol ? 2 : 3);
  var pageCount = clampInt(opts.pages, 1, 12, 1);
  var limit = kind === 'units' ? 10000 : kind === 'thousand' ? 999 : kind === 'round' ? 99 : kind === 'tree' ? 6 : (kind === 'polylines' || kind === 'area' || kind === 'geometry') ? 20 : 100;
  var from = clampInt(opts.from, kind === 'thousand' ? 100 : 1, limit, kind === 'thousand' ? 100 : 1);
  var to = clampInt(opts.to, 1, limit, limit);
  if(from > to){ var t = from; from = to; to = t; }
  var seed = clampInt(opts.seed, 1, 4294967295, 1);
  var rnd = MathSheet.mulberry32(seed);
  var ops = (opts.ops || []).filter(function(x){ return OPS.indexOf(x) >= 0; });
  if(!ops.length) ops = ['add', 'sub'];
  var tasks = (opts.tasks || []).filter(function(x){ return TASKS[kind].indexOf(x) >= 0; });
  if(kind === 'problems' && global.MathProblems){
    tasks = global.MathProblems.problemTypesForOps(tasks.length ? tasks : TASKS[kind], ops, opts.star);
  } else if(!tasks.length){
    tasks = TASKS[kind].slice();
  }
  if(!tasks.length) return { kind: kind, rows: rows, cols: cols, pages: pageCount, from: from, to: to, seed: seed, per: 0, sheets: [] };
  var carry = !(opts.carry === false || opts.carry === '0' || opts.carry === 'false');
  var per = rows * cols;
  var sheets = [], p, k, seq, items, seen, last, cand, tries, it;

  for(p = 0; p < pageCount; p++){
    seq = taskSequence(per, tasks, rnd);
    items = [];
    seen = {};
    last = '';
    for(k = 0; k < per; k++){
      it = null;
      for(tries = 0; tries < 140; tries++){
        cand = generate(kind, seq[k], rnd, { from: from, to: to, ops: ops, miss: opts.miss, carry: carry, star: !!opts.star });
        if(!cand) break;
        if(cand.id === last) continue;
        if(!seen[cand.id]){ it = cand; break; }
        if(!it) it = cand;
      }
      if(!it) continue;
      items.push(it);
      seen[it.id] = 1;
      last = it.id;
    }
    sheets.push({ items: items });
  }
  return { kind: kind, rows: rows, cols: cols, pages: pageCount, from: from, to: to, seed: seed, per: per, sheets: sheets };
}

function taskFontPt(kind, cols, rows){
  if(kind === 'problems' || kind === 'polylines') return kind === 'problems' ? 11 : 12;
  var base = FONT_BASE[kind] || 16;
  var byCols = base * (2 / Math.max(1, cols));
  var availMm = 252 - 2 * Math.max(0, rows - 1);
  var perRowMm = availMm / Math.max(1, rows);
  var byHeight = perRowMm * 2.83465 / (2 * 1.25);
  var fs = Math.min(byCols, byHeight);
  return Math.max(7, Math.min(24, Math.round(fs * 2) / 2));
}

global.WorksheetTasks = {
  makeVariant: makeVariant,
  taskFontPt: taskFontPt,
  tasksFor: function(kind){ return (TASKS[kind] || []).slice(); }
};
})(typeof window !== 'undefined' ? window : globalThis);
