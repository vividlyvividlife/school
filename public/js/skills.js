/* Тренажёры навыков: разряды, сравнение, пропущенное число, скобки, величины, периметр. */
(function(){
'use strict';

var setup = document.getElementById('setup');
if(!setup) return;
var SKILL = setup.getAttribute('data-skill') || 'digits';
var LANG = document.documentElement.getAttribute('lang') === 'en' ? 'en' : 'ru';
var K_SET = 'mathSkills.' + SKILL + '.settings.v1';
var K_HARD = 'mathSkills.' + SKILL + '.hard.v1';
var K_HIST = 'mathSkills.' + SKILL + '.history.v1';

function tr(ru, en){ return LANG === 'en' ? en : ru; }
function $(id){ return document.getElementById(id); }
function each(list, fn){ Array.prototype.forEach.call(list || [], fn); }
function ri(a, b){ return a + Math.floor(Math.random() * (b - a + 1)); }
function pick(arr){ return arr[Math.floor(Math.random() * arr.length)]; }
function shuffle(arr){
  var a = arr.slice(), i, j, t;
  for(i = a.length - 1; i > 0; i--){
    j = Math.floor(Math.random() * (i + 1));
    t = a[i]; a[i] = a[j]; a[j] = t;
  }
  return a;
}
function clampInt(v, min, max, dflt){
  v = parseInt(v, 10);
  if(!isFinite(v)) v = dflt;
  return Math.max(min, Math.min(max, v));
}
function loadJSON(key, dflt){
  try{
    var v = JSON.parse(localStorage.getItem(key) || 'null');
    return v || dflt;
  }catch(e){ return dflt; }
}
function saveJSON(key, v){
  try{ localStorage.setItem(key, JSON.stringify(v)); }catch(e){}
}
function fmt(sec){
  sec = Math.max(0, Math.round(sec));
  var m = Math.floor(sec / 60);
  sec = sec % 60;
  return m + ':' + (sec < 10 ? '0' : '') + sec;
}
function fmtSec1(ms){
  var s = (ms / 1000).toFixed(1);
  if(LANG === 'ru') s = s.replace('.', ',');
  return s + tr(' с', ' s');
}
function fmtDate(t){
  var d = new Date(t);
  return d.toLocaleDateString(LANG === 'en' ? 'en-US' : 'ru-RU', { day:'2-digit', month:'2-digit' }) + ' ' +
    d.toLocaleTimeString(LANG === 'en' ? 'en-US' : 'ru-RU', { hour:'2-digit', minute:'2-digit' });
}
function pluralErr(n){
  if(LANG === 'en') return n === 1 ? 'mistake' : 'mistakes';
  var n10 = n % 10, n100 = n % 100;
  if(n10 === 1 && n100 !== 11) return 'ошибка';
  if(n10 >= 2 && n10 <= 4 && (n100 < 10 || n100 >= 20)) return 'ошибки';
  return 'ошибок';
}
function pluralOk(n){
  if(LANG === 'en') return n === 1 ? 'correct answer' : 'correct answers';
  var n10 = n % 10, n100 = n % 100;
  if(n10 === 1 && n100 !== 11) return 'верный ответ';
  if(n10 >= 2 && n10 <= 4 && (n100 < 10 || n100 >= 20)) return 'верных ответа';
  return 'верных ответов';
}

var els = {
  setup: $('setup'), game: $('game'), results: $('results'),
  playarea: document.querySelector('.playarea'),
  from: $('from'), to: $('to'), toChips: $('toChips'),
  types: document.querySelector('#setup .types-seg'),
  ops: document.querySelector('#setup .ops-seg'),
  timeRow: $('timeRow'), min: $('min'), sec: $('sec'),
  carry: $('carry'), star: $('starBtn'), sound: $('sound'), soundTest: $('soundTest'),
  poolInfo: $('poolInfo'), startBtn: $('startBtn'),
  hardInfo: $('hardInfo'), hardList: $('hardList'), hardBtn: $('hardBtn'), clearHard: $('clearHard'),
  histList: $('histList'), clearHist: $('clearHist'),
  gInfo: $('gInfo'), scoreOk: $('scoreOk'), scoreBad: $('scoreBad'),
  stopBtn: $('stopBtn'), timeWrap: $('timeWrap'), tfill: $('tfill'), tclock: $('tclock'),
  eqw: $('eqw'), eq: $('eq'), cap: $('cap'),
  figWrap: $('figWrap'), figSummary: $('figSummary'), fig: $('fig'),
  signpad: $('signpad'), tiles: $('tiles'), pad: $('pad'),
  resTitle: $('resTitle'), verdict: $('verdict'),
  rOk: $('rOk'), rBad: $('rBad'), rAcc: $('rAcc'), rAvg: $('rAvg'),
  rFast: $('rFast'), rSlow: $('rSlow'), rDur: $('rDur'),
  misTitle: $('misTitle'), misList: $('misList'),
  slowCard: $('slowCard'), slowTitle: $('slowTitle'), slowList: $('slowList'), slowBtn: $('slowBtn'),
  unsolvedCard: $('unsolvedCard'), unsolvedTitle: $('unsolvedTitle'), unsolvedList: $('unsolvedList'), unsolvedBtn: $('unsolvedBtn'),
  againBtn: $('againBtn'), toSetupBtn: $('toSetupBtn')
};
var hardEmptyText = els.hardInfo.textContent;

function availableTypes(){
  if(!els.types) return [];
  var out = [];
  each(els.types.querySelectorAll('button'), function(b){ out.push(b.getAttribute('data-v')); });
  return out;
}

var isProblems = SKILL === 'problems';
function typeAllowed(t){
  if(!isProblems || !window.MathProblems) return true;
  return window.MathProblems.problemTypesForOps([t], S.ops, S.star).length > 0;
}
function activeTypes(){
  if(!isProblems || !window.MathProblems) return S.types;
  return window.MathProblems.problemTypesForOps(S.types, S.ops, S.star);
}
function visibleHard(){
  if(!isProblems) return hardCache;
  return hardCache.filter(function(x){ return typeAllowed(x.type); });
}

var S = {
  from: parseInt(els.from.value, 10) || 10,
  to: parseInt(els.to.value, 10) || 99,
  types: availableTypes(),
  ops: SKILL === 'brackets' ? ['add', 'sub', 'mul', 'div'] : ['add', 'sub'],
  miss: 'r',
  carry: false,
  star: false,
  answer: 'type',
  mode: 'free',
  min: parseInt(els.min.value, 10) || 2,
  sec: parseInt(els.sec.value, 10) || 0,
  sound: true
};

function loadSettings(){
  var v = loadJSON(K_SET, null);
  if(!v || typeof v !== 'object') return;
  if(v.from !== undefined) S.from = v.from;
  if(v.to !== undefined) S.to = v.to;
  if(Array.isArray(v.types)){
    var av = availableTypes();
    var t = v.types.filter(function(x){ return av.indexOf(x) >= 0; });
    if(t.length) S.types = t;
  }
  if(Array.isArray(v.ops)){
    var ops = v.ops.filter(function(x){ return ['add', 'sub', 'mul', 'div'].indexOf(x) >= 0; });
    if(ops.length) S.ops = ops;
  }
  if(['r', 'a', 'b', 'ab', 'rab'].indexOf(v.miss) >= 0) S.miss = v.miss;
  if(typeof v.carry === 'boolean') S.carry = v.carry;
  if(typeof v.star === 'boolean') S.star = v.star;
  if(['type', 'tiles6', 'tiles9', 'tiles12'].indexOf(v.answer) >= 0) S.answer = v.answer;
  if(['free', 'timed'].indexOf(v.mode) >= 0) S.mode = v.mode;
  if(v.min !== undefined) S.min = clampInt(v.min, 0, 300, 2);
  if(v.sec !== undefined) S.sec = clampInt(v.sec, 0, 59, 0);
  if(typeof v.sound === 'boolean') S.sound = v.sound;
}
function saveSettings(){ saveJSON(K_SET, S); }

function limits(){
  if(SKILL === 'digits') return { min: 10, max: 99 };
  if(SKILL === 'units') return { min: 1, max: 10000 };
  if(SKILL === 'thousand') return { min: 100, max: 999 };
  if(SKILL === 'round') return { min: 1, max: 99 };
  if(SKILL === 'tree') return { min: 2, max: 6 };
  if(SKILL === 'geometry' || SKILL === 'perimeter' || SKILL === 'polylines' || SKILL === 'area') return { min: 1, max: 20 };
  return { min: 1, max: 100 };
}
function normalize(){
  var lm = limits();
  S.from = clampInt(S.from, lm.min, lm.max, lm.min);
  S.to = clampInt(S.to, lm.min, lm.max, lm.max);
  if(S.from > S.to){ var t = S.from; S.from = S.to; S.to = t; }
  var av = availableTypes();
  if(av.length){
    S.types = S.types.filter(function(x){ return av.indexOf(x) >= 0; });
    if(!S.types.length) S.types = av;
  }
  if(!S.ops.length) S.ops = SKILL === 'brackets' ? ['add', 'sub', 'mul', 'div'] : ['add', 'sub'];
  S.min = clampInt(S.min, 0, 300, 2);
  S.sec = clampInt(S.sec, 0, 59, 0);
}
function bounds(){
  var lm = limits();
  var a = clampInt(S.from, lm.min, lm.max, lm.min);
  var b = clampInt(S.to, lm.min, lm.max, lm.max);
  if(a > b){ var t = a; a = b; b = t; }
  return { a: a, b: b };
}

/* ---------- настройки на экране ---------- */
function syncChips(){
  each(els.toChips.querySelectorAll('button'), function(b){
    b.classList.toggle('on', parseInt(b.getAttribute('data-v'), 10) === S.to);
  });
}
function syncSegs(){
  each(document.querySelectorAll('#setup .seg[data-key]'), function(seg){
    var key = seg.getAttribute('data-key');
    each(seg.querySelectorAll('button'), function(b){
      var v = b.getAttribute('data-v'), on;
      if(key === 'ops') on = S.ops.indexOf(v) >= 0;
      else if(key === 'types'){
        var ok = typeAllowed(v);
        on = ok && S.types.indexOf(v) >= 0;
        if(isProblems){
          b.disabled = !ok;
          b.setAttribute('aria-disabled', ok ? 'false' : 'true');
          if(ok){
            b.title = '';
          } else if(window.MathProblems.problemIsStarred(v)){
            b.title = tr('Включите ★', 'Turn on ★');
          } else {
            var opsNames = { add: '+', sub: '−', mul: '×', div: '÷' };
            b.title = tr('Нужно включить: ', 'Requires: ') +
              window.MathProblems.problemTypeNeeds(v).map(function(route){
                return route.map(function(o){ return opsNames[o]; }).join(' ');
              }).join(tr(' или ', ' or '));
          }
        }
      }
      else on = String(S[key]) === v;
      b.classList.toggle('on', on);
    });
  });
  if(els.carry) els.carry.checked = S.carry;
  if(els.star){
    els.star.classList.toggle('on', S.star);
    els.star.setAttribute('aria-pressed', S.star ? 'true' : 'false');
  }
  if(els.sound) els.sound.checked = S.sound;
  if(els.timeRow) els.timeRow.hidden = S.mode !== 'timed';
}
function unitsConvCount(a, b){
  var c10 = Math.max(0, Math.floor(b / 10) - Math.ceil(a / 10) + 1);
  var c100 = Math.max(0, Math.floor(b / 100) - Math.ceil(a / 100) + 1);
  return Math.max(1, c10 * 2 + c100 * 4);
}
function unitsCalcCount(a, b){
  var c10 = Math.max(0, Math.floor(b / 10) - Math.ceil(a / 10) + 1);
  var c100 = Math.max(0, Math.floor(b / 100) - Math.ceil(a / 100) + 1);
  var ccm = Math.max(0, b - a + 1 - c10);
  return Math.max(1, (c10 + ccm) * 18 + c100 * 108);
}
function poolCount(){
  var r = bounds(), m = r.b - r.a + 1, n = 0;
  if(SKILL === 'digits'){
    S.types.forEach(function(t){ n += t === 'totalTens' ? 9 : m; });
  } else if(SKILL === 'compare'){
    S.types.forEach(function(t){
      if(t === 'tensUnits') n += 81;
      else if(t === 'lengths') n += 10;
      else if(t === 'products') n += Math.min(100, Math.max(1, Math.floor(m * m / 4)));
      else if(t === 'quotients') n += Math.min(100, Math.max(1, Math.floor(m * m / 6)));
      else n += m * m;
    });
  } else if(SKILL === 'missing'){
    S.ops.forEach(function(op){
      n += (op === 'add' || op === 'sub') ? Math.max(1, Math.floor(m * m / 2)) : 100;
    });
  } else if(SKILL === 'brackets'){
    S.types.forEach(function(){ n += Math.max(1, Math.floor(m * m / 2)); });
  } else if(SKILL === 'units'){
    S.types.forEach(function(t){
      if(t === 'millimeters' || t === 'kilometers') n += 16;
      else n += t === 'convert' ? unitsConvCount(r.a, r.b) : unitsCalcCount(r.a, r.b);
    });
  } else if(SKILL === 'perimeter'){
    S.types.forEach(function(t){
      if(t === 'square' || t === 'pentagon' || t === 'hexagon') n += m;
      else n += Math.max(1, m * m);
    });
  } else if(SKILL === 'equations'){
    n = Math.max(1, m * S.types.length);
  } else if(SKILL === 'remainders'){
    n = Math.max(1, m * S.types.length);
  } else if(SKILL === 'area'){
    S.types.forEach(function(t){
      n += t === 'volume' ? Math.max(1, m * m * Math.min(m, 10)) : Math.max(1, m * m);
    });
  } else if(SKILL === 'operations'){
    S.types.forEach(function(t){
      n += t === 'result1' || t === 'start1' ? Math.max(1, m * 4) : Math.max(1, m * m);
    });
  } else if(SKILL === 'divisibility'){
    n = Math.max(1, m * S.types.length);
  } else if(SKILL === 'geometry'){
    S.types.forEach(function(t){
      n += t === 'segments' || t === 'rays' ? 3 : t === 'intersections' ? 4 : m;
    });
  } else if(SKILL === 'thousand' || SKILL === 'round'){
    n = Math.max(1, m * S.types.length);
  } else if(SKILL === 'tree'){
    S.types.forEach(function(t){
      n += t === 'digits' ? 24 : Math.max(1, m * m);
    });
  } else if(window.MathProblems){
    if(SKILL === 'problems') return window.MathProblems.problemPoolCount(activeTypes(), r.a, r.b);
    if(SKILL === 'polylines') return window.MathProblems.polylinePoolCount(S.types, r.a, r.b);
  }
  return n;
}
function poolInfo(){
  var noTasks = SKILL !== 'missing' && !(isProblems ? activeTypes() : S.types).length;
  if(noTasks){
    var needStar = isProblems && !S.star && window.MathProblems && S.types.some(function(t){
      return window.MathProblems.problemIsStarred(t);
    });
    els.poolInfo.textContent = needStar
      ? tr('Включите ★: звёздные задачи решаются повторным сложением и вычитанием', 'Turn on ★: star tasks are solved by repeated addition and subtraction')
      : isProblems && S.types.length
        ? tr('Для выбранных действий задач нет. Включите действие или задание', 'No tasks match the selected operations. Enable an operation or a task')
        : tr('Выберите хотя бы одно задание', 'Choose at least one task');
    els.startBtn.disabled = true;
    return;
  }
  els.startBtn.disabled = false;
  var n = poolCount();
  var big = n > 999;
  var shown = big ? '1000+' : String(n);
  var word;
  if(LANG === 'en'){
    word = (!big && n === 1) ? 'variant' : 'variants';
  } else {
    var d = n % 10, h = n % 100;
    if(!big && d === 1 && h !== 11) word = 'вариант';
    else if(!big && d >= 2 && d <= 4 && (h < 10 || h >= 20)) word = 'варианта';
    else word = 'вариантов';
  }
  els.poolInfo.textContent = tr('В наборе: ', 'In the set: ') + shown + ' ' + word;
}

/* ---------- звук ---------- */
var audioCtx = null;
function unlockAudio(){
  try{
    if(!audioCtx){
      var AC = window.AudioContext || window.webkitAudioContext;
      if(!AC) return;
      audioCtx = new AC();
    }
    if(audioCtx.state === 'suspended' && audioCtx.resume) audioCtx.resume();
  }catch(e){}
}
function tone(freq, delay, dur, type, vol){
  if(!audioCtx) return;
  var t0 = audioCtx.currentTime + delay;
  var osc = audioCtx.createOscillator();
  var g = audioCtx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g); g.connect(audioCtx.destination);
  osc.start(t0); osc.stop(t0 + dur + 0.03);
}
function playCorrect(){
  if(!S.sound) return;
  unlockAudio(); if(!audioCtx) return;
  tone(880, 0, 0.11, 'sine', 0.12);
  tone(1174.7, 0.085, 0.16, 'sine', 0.11);
}
function playWrong(){
  if(!S.sound) return;
  unlockAudio(); if(!audioCtx) return;
  tone(330, 0, 0.13, 'triangle', 0.11);
  tone(247, 0.11, 0.2, 'triangle', 0.11);
}

/* ---------- упражнения ---------- */
function ex(id, prompt, text, need, answerKind, layout, max, opts){
  var o = { id:id, prompt:prompt, text:text, need:need, answerKind:answerKind, layout:layout, max:max || 100 };
  if(opts){
    for(var k in opts){
      if(Object.prototype.hasOwnProperty.call(opts, k)) o[k] = opts[k];
    }
  }
  return o;
}

function digitNumber(){
  var r = bounds();
  var n = ri(r.a, r.b);
  return { n:n, t:Math.floor(n / 10), o:n % 10 };
}
function digitsGen(type){
  var de = tr('дес.', 'tens'), ed = tr('ед.', 'ones');
  var d = digitNumber(), n = d.n, t = d.t, o = d.o;
  if(type === 'tens'){
    return ex('dg:tens:' + n,
      '<div class="sk-q">' + tr('Сколько десятков в числе ', 'How many tens are in ') + '<b>' + n + '</b>?</div><div class="sk-answer">{{slot}}</div>',
      tr('Сколько десятков в числе ', 'How many tens are in ') + n + '?',
      t, 'number', 'text', 99);
  }
  if(type === 'ones'){
    return ex('dg:ones:' + n,
      '<div class="sk-q">' + tr('Сколько единиц в числе ', 'How many ones are in ') + '<b>' + n + '</b>?</div><div class="sk-answer">{{slot}}</div>',
      tr('Сколько единиц в числе ', 'How many ones are in ') + n + '?',
      o, 'number', 'text', 99);
  }
  if(type === 'build'){
    return ex('dg:build:' + n,
      '<div class="sk-q">' + tr('Запиши число: ', 'Write the number: ') + '<b>' + t + ' ' + de + ' ' + o + ' ' + ed + '</b></div><div class="sk-answer">{{slot}}</div>',
      tr('Запиши число: ', 'Write the number: ') + t + ' ' + de + ' ' + o + ' ' + ed,
      n, 'number', 'text', 99);
  }
  if(type === 'expand'){
    var guard = 0;
    while(o === 0 && guard++ < 40){ d = digitNumber(); n = d.n; t = d.t; o = d.o; }
    return ex('dg:expand:' + n,
      '<span>' + n + '</span><span class="op">=</span><span>' + (t * 10) + '</span><span class="op">+</span>{{slot}}',
      n + ' = ' + (t * 10) + ' + ?',
      o, 'number', 'expr', 99);
  }
  var r = bounds();
  var tlo = Math.ceil(r.a / 10), thi = Math.floor(r.b / 10);
  if(tlo > thi){ tlo = thi = 1; }
  var tt = ri(tlo, thi);
  var n2 = tt * 10;
  return ex('dg:totalTens:' + n2,
    '<div class="sk-q">' + tr('Сколько всего десятков в числе ', 'How many tens in total are in ') + '<b>' + n2 + '</b>?</div><div class="sk-answer">{{slot}}</div>',
    tr('Сколько всего десятков в числе ', 'How many tens in total are in ') + n2 + '?',
    tt, 'number', 'text', 99);
}

function cmpEx(id, leftHtml, rightHtml, leftVal, rightVal, plain){
  var need = leftVal < rightVal ? '<' : leftVal > rightVal ? '>' : '=';
  return ex(id, leftHtml + '{{slot}}' + rightHtml, plain, need, 'sign', 'compare', 0, { long: plain.length > 10 });
}
function unitLabel(code){
  if(code === 'm') return tr('м', 'm');
  if(code === 'dm') return tr('дм', 'dm');
  return tr('см', 'cm');
}
function randProduct(lo, hi){
  var top = Math.min(10, hi);
  for(var i = 0; i < 200; i++){
    var x = ri(1, top), y = ri(1, top), v = x * y;
    if(v >= lo && v <= hi) return { x: x, y: y, v: v };
  }
  return null;
}
function randQuotient(lo, hi){
  var top = Math.min(10, hi);
  if(top < 2) return null;
  for(var i = 0; i < 200; i++){
    var d = ri(2, top), q = ri(1, top), a = d * q;
    if(a <= hi && q >= lo && q <= hi) return { a: a, d: d, v: q };
  }
  return null;
}
function compareGen(type){
  var de = tr('дес.', 'tens'), ed = tr('ед.', 'ones');
  var r = bounds();
  var lo = r.a, hi = Math.max(r.a, r.b);
  var lo2 = Math.max(2, lo), dlo = Math.min(Math.max(3, lo + 1), hi);
  var num = function(){
    var a = ri(lo, hi), b = ri(lo, hi);
    if(Math.random() < 0.2) b = a;
    return cmpEx('cp:num:' + a + ':' + b,
      '<span>' + a + '</span>', '<span>' + b + '</span>', a, b, a + ' ? ' + b);
  };
  if(type === 'numbers') return num();
  if(type === 'sums'){
    var s1 = ri(lo2, hi), s2 = ri(lo2, hi);
    var x1 = ri(1, s1 - 1), x2 = s1 - x1, y1 = ri(1, s2 - 1), y2 = s2 - y1;
    if(Math.random() < 0.25){ y1 = x1; y2 = x2; }
    return cmpEx('cp:sum:' + x1 + ':' + x2 + ':' + y1 + ':' + y2,
      '<span>' + x1 + '</span><span class="op">+</span><span>' + x2 + '</span>',
      '<span>' + y1 + '</span><span class="op">+</span><span>' + y2 + '</span>',
      x1 + x2, y1 + y2,
      x1 + ' + ' + x2 + ' ? ' + y1 + ' + ' + y2);
  }
  if(type === 'diffs'){
    var d1 = ri(dlo, hi), d3 = ri(dlo, hi);
    var d2 = ri(1, Math.min(9, d1 - 1)), d4 = ri(1, Math.min(9, d3 - 1));
    if(Math.random() < 0.25){ d3 = d1; d4 = d2; }
    return cmpEx('cp:diff:' + d1 + ':' + d2 + ':' + d3 + ':' + d4,
      '<span>' + d1 + '</span><span class="op">−</span><span>' + d2 + '</span>',
      '<span>' + d3 + '</span><span class="op">−</span><span>' + d4 + '</span>',
      d1 - d2, d3 - d4,
      d1 + ' − ' + d2 + ' ? ' + d3 + ' − ' + d4);
  }
  if(type === 'products'){
    var p1 = randProduct(lo, hi), p2 = randProduct(lo, hi);
    if(!p1 || !p2) return num();
    if(Math.random() < 0.25){ p2 = { x: p1.x, y: p1.y, v: p1.v }; }
    return cmpEx('cp:prod:' + p1.x + ':' + p1.y + ':' + p2.x + ':' + p2.y,
      '<span>' + p1.x + '</span><span class="op">×</span><span>' + p1.y + '</span>',
      '<span>' + p2.x + '</span><span class="op">×</span><span>' + p2.y + '</span>',
      p1.v, p2.v,
      p1.x + ' × ' + p1.y + ' ? ' + p2.x + ' × ' + p2.y);
  }
  if(type === 'quotients'){
    var q1 = randQuotient(lo, hi), q2 = randQuotient(lo, hi);
    if(!q1 || !q2) return num();
    if(Math.random() < 0.25){ q2 = { a: q1.a, d: q1.d, v: q1.v }; }
    return cmpEx('cp:quot:' + q1.a + ':' + q1.d + ':' + q2.a + ':' + q2.d,
      '<span>' + q1.a + '</span><span class="op">÷</span><span>' + q1.d + '</span>',
      '<span>' + q2.a + '</span><span class="op">÷</span><span>' + q2.d + '</span>',
      q1.v, q2.v,
      q1.a + ' ÷ ' + q1.d + ' ? ' + q2.a + ' ÷ ' + q2.d);
  }
  if(type === 'tensUnits'){
    var maxT = Math.floor(hi / 10);
    if(maxT < 1) return num();
    var t = ri(1, maxT), x = ri(1, Math.min(9, hi));
    var lh = '<span>' + t + '</span><span class="ku">' + de + '</span>';
    if(Math.random() < 0.5){
      return cmpEx('cp:tu:' + t + ':0:' + (t * 10), lh, '<span>' + (t * 10) + '</span>', t * 10, t * 10, t + ' ' + de + ' ? ' + (t * 10));
    }
    return cmpEx('cp:tu:' + t + ':' + x,
      lh, '<span>' + x + '</span><span class="ku">' + ed + '</span>',
      t * 10, x, t + ' ' + de + ' ? ' + x + ' ' + ed);
  }
  var conv = [];
  if(hi >= 100) conv.push({ big: 'm', small: 'cm', f: 100 });
  if(hi >= 10){ conv.push({ big: 'm', small: 'dm', f: 10 }); conv.push({ big: 'dm', small: 'cm', f: 10 }); }
  if(!conv.length) return num();
  var o = pick(conv);
  var k = ri(1, Math.floor(hi / o.f)), v1 = k * o.f;
  var v2 = Math.random() < 0.25 ? v1 : ri(Math.max(1, v1 - 2), Math.min(hi, v1 + 2));
  var au = unitLabel(o.big), bu = unitLabel(o.small);
  return cmpEx('cp:len:' + k + o.big + ':' + v2 + o.small,
    '<span>' + k + '</span><span class="ku">' + au + '</span>',
    '<span>' + v2 + '</span><span class="ku">' + bu + '</span>',
    v1, v2, k + ' ' + au + ' ? ' + v2 + ' ' + bu);
}

function missingGen(){
  var r = bounds();
  var op = pick(S.ops.length ? S.ops : ['add', 'sub']);
  var role = S.miss === 'ab' ? pick(['a', 'b']) : S.miss === 'rab' ? pick(['r', 'a', 'b']) : S.miss;
  if(['r', 'a', 'b'].indexOf(role) < 0) role = 'r';
  var wantCarry = S.carry && (op === 'add' || op === 'sub');
  var vals = null;
  for(var pass = 0; pass < 2 && !vals; pass++){
    for(var i = 0; i < 400; i++){
      var a, b, res;
      if(op === 'add'){
        var hi = Math.max(1, Math.min(r.b, 100));
        a = ri(1, hi); b = ri(1, hi); res = a + b;
        if(res > 100) continue;
        if(wantCarry && pass === 0 && (a % 10 + b % 10) < 10) continue;
      } else if(op === 'sub'){
        a = ri(Math.max(2, r.a), Math.max(2, r.b));
        b = ri(1, a - 1); res = a - b;
        if(wantCarry && pass === 0 && (a % 10) >= (b % 10)) continue;
      } else if(op === 'mul'){
        a = ri(2, 10); b = ri(2, 10); res = a * b;
        if(res > 100) continue;
      } else {
        b = ri(2, 10); res = ri(2, 10); a = b * res;
        if(a > 100) continue;
      }
      vals = { a:a, b:b, r:res };
      break;
    }
  }
  if(!vals) vals = { a:2, b:3, r:5 };

  var sym = op === 'add' ? '+' : op === 'sub' ? '−' : op === 'mul' ? '×' : '÷';
  var A = '<span>' + vals.a + '</span>', B = '<span>' + vals.b + '</span>', R = '<span>' + vals.r + '</span>';
  var OP = '<span class="op">' + sym + '</span>', EQ = '<span class="op">=</span>';
  var html, plain, need;
  if(role === 'r'){
    html = A + OP + B + EQ + '{{slot}}';
    plain = vals.a + ' ' + sym + ' ' + vals.b + ' = ?';
    need = vals.r;
  } else if(role === 'a'){
    html = '{{slot}}' + OP + B + EQ + R;
    plain = '? ' + sym + ' ' + vals.b + ' = ' + vals.r;
    need = vals.a;
  } else {
    html = A + OP + '{{slot}}' + EQ + R;
    plain = vals.a + ' ' + sym + ' ? = ' + vals.r;
    need = vals.b;
  }
  return ex('ms:' + op + ':' + role + ':' + vals.a + ':' + vals.b, html, plain, need, 'number', 'expr', 100, { long: plain.length > 12 });
}

function applyOp(x, o, y){
  if(o === '+') return { ok: true, v: x + y };
  if(o === '−') return x >= y ? { ok: true, v: x - y } : { ok: false };
  if(o === '×') return (x <= 10 && y <= 10) ? { ok: true, v: x * y } : { ok: false };
  return (y !== 0 && x % y === 0) ? { ok: true, v: x / y } : { ok: false };
}
function prec(o){ return (o === '×' || o === '÷') ? 2 : 1; }
/* mode 0 = приоритет без скобок; 1 = (a○1 b)○2 c; 2 = a○1 (b○2 c) */
function evalTri(a, o1, b, o2, c, mode, cap){
  var left, right, res;
  if(mode === 2){
    right = applyOp(b, o2, c); if(!right.ok || right.v > cap) return null;
    res = applyOp(a, o1, right.v); if(!res.ok) return null;
  } else if(mode === 1){
    left = applyOp(a, o1, b); if(!left.ok || left.v > cap) return null;
    res = applyOp(left.v, o2, c); if(!res.ok) return null;
  } else {
    if(prec(o1) >= prec(o2)){
      left = applyOp(a, o1, b); if(!left.ok || left.v > cap) return null;
      res = applyOp(left.v, o2, c); if(!res.ok) return null;
    } else {
      right = applyOp(b, o2, c); if(!right.ok || right.v > cap) return null;
      res = applyOp(a, o1, right.v); if(!res.ok) return null;
    }
  }
  if(res.v < 0 || res.v > cap) return null;
  return res.v;
}
function bracketsGen(type){
  var r = bounds();
  var cap = Math.min(r.b, 100);
  var hi = Math.max(2, Math.min(12, cap));
  var OPNAME = { add: '+', sub: '−', mul: '×', div: '÷' };
  var sel = (S.ops && S.ops.length ? S.ops : ['add', 'sub', 'mul', 'div'])
    .map(function(o){ return OPNAME[o]; }).filter(Boolean);
  var OPS = sel.length ? sel : ['+', '−', '×', '÷'];
  var hasHigh = OPS.some(function(o){ return prec(o) === 2; });
  var mode = type === 'chains' ? 0 : pick([1, 2]);
  function num(v){ return '<span>' + v + '</span>'; }
  function op(s){ return '<span class="op">' + s + '</span>'; }
  function par(s){ return '<span class="op">' + s + '</span>'; }
  function render(m, a, o1, b, o2, c){
    if(m === 1) return { plain: '(' + a + ' ' + o1 + ' ' + b + ') ' + o2 + ' ' + c,
      html: par('(') + num(a) + op(o1) + num(b) + par(')') + op(o2) + num(c) + op('=') + '{{slot}}' };
    if(m === 2) return { plain: a + ' ' + o1 + ' (' + b + ' ' + o2 + ' ' + c + ')',
      html: num(a) + op(o1) + par('(') + num(b) + op(o2) + num(c) + par(')') + op('=') + '{{slot}}' };
    return { plain: a + ' ' + o1 + ' ' + b + ' ' + o2 + ' ' + c,
      html: num(a) + op(o1) + num(b) + op(o2) + num(c) + op('=') + '{{slot}}' };
  }
  function scan(m){
    for(var x = 0; x < OPS.length; x++)
      for(var y = 0; y < OPS.length; y++)
        for(var A = 1; A <= hi; A++)
          for(var B = 1; B <= hi; B++)
            for(var C = 1; C <= hi; C++){
              var v = evalTri(A, OPS[x], B, OPS[y], C, m, cap);
              if(v === null) continue;
              if(m === 0 && hasHigh && prec(OPS[x]) === 1 && prec(OPS[y]) === 1) continue;
              var rr = render(m, A, OPS[x], B, OPS[y], C); rr.v = v; return rr;
            }
    return null;
  }
  for(var i = 0; i < 900; i++){
    var a = ri(1, hi), b = ri(1, hi), c = ri(1, hi);
    var o1 = pick(OPS), o2 = pick(OPS);
    if(hasHigh && prec(o1) === 1 && prec(o2) === 1) continue;
    var v = evalTri(a, o1, b, o2, c, mode, cap);
    if(v === null) continue;
    var rr = render(mode, a, o1, b, o2, c);
    return ex('br:' + rr.plain, rr.html, rr.plain, rr.v, 'number', 'expr', 100, { long: rr.plain.length > 12 });
  }
  var fb = scan(mode) || scan(0) || scan(1) || scan(2);
  if(!fb) return ex('br:1 + 1 + 1', num(1) + op('+') + num(1) + op('+') + num(1) + op('=') + '{{slot}}', '1 + 1 + 1', 3, 'number', 'expr', 100, {});
  return ex('br:' + fb.plain, fb.html, fb.plain, fb.v, 'number', 'expr', 100, { long: fb.plain.length > 12 });
}

function unitsGen(type){
  var r = bounds(), a = r.a, b = r.b;
  var M = tr('м', 'm'), DM = tr('дм', 'dm'), CM = tr('см', 'cm');
  var MM = tr('мм', 'mm'), KM = tr('км', 'km');

  function uEx(id, leftHtml, leftText, ansUnit, need){
    return ex(id, leftHtml + '<span class="op">=</span>{{slot}}<span class="unit">' + ansUnit + '</span>',
      leftText + ' = ? ' + ansUnit, need, 'number', 'expr', 10000, { long: leftText.length > 18 });
  }
  function num(v, u){ return '<span>' + v + '</span><span class="unit">' + u + '</span>'; }
  function op(s){ return '<span class="op">' + s + '</span>'; }

  if(type === 'millimeters'){
    var mm = ri(2, 9);
    if(ri(1, 2) === 1){
      return uEx('un:mm:cm:' + mm, num(mm, CM), mm + ' ' + CM, MM, mm * 10);
    }
    return uEx('un:mm:mm:' + (mm * 10), num(mm * 10, MM), (mm * 10) + ' ' + MM, CM, mm);
  }
  if(type === 'kilometers'){
    var km = ri(2, 9);
    if(ri(1, 2) === 1){
      return uEx('un:km:m:' + km, num(km, KM), km + ' ' + KM, M, km * 1000);
    }
    return uEx('un:km:km:' + (km * 1000), num(km * 1000, M), (km * 1000) + ' ' + M, KM, km);
  }
  function parts(v){
    return { m: Math.floor(v / 100), d: Math.floor((v % 100) / 10), c: v % 10 };
  }
  function compHtml(v){
    var p = parts(v), h = '';
    if(p.m) h += num(p.m, M);
    if(p.d) h += num(p.d, DM);
    if(p.c || (!p.m && !p.d)) h += num(p.c, CM);
    return h;
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
    return lo + step * ri(0, (hi - lo) / step);
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
    var v = ri(lo, hi);
    if(v % 10 === 0){
      if(v - 1 >= lo) v--;
      else if(v + 1 <= hi) v++;
      else return null;
    }
    return v;
  }
  function plainUnit(){
    var x = ri(a, b), y = ri(a, b);
    return uEx('un:addcm:' + x + ':' + y,
      num(x, CM) + op('+') + num(y, CM), x + ' ' + CM + ' + ' + y + ' ' + CM, CM, x + y);
  }
  function convertFallback(){
    var fd = ri(1, 9);
    if(ri(1, 2) === 1){
      return uEx('un:conv:fb:dm:cm:' + fd, num(fd, DM), fd + ' ' + DM, CM, fd * 10);
    }
    return uEx('un:conv:fb:cm:dm:' + fd, num(fd * 10, CM), (fd * 10) + ' ' + CM, DM, fd);
  }

  if(type === 'convert'){
    var kinds = [];
    if(multExists(10, b)) kinds = kinds.concat(['dm2cm', 'cm2dm']);
    if(multExists(100, b)) kinds = kinds.concat(['m2cm', 'cm2m', 'm2dm', 'dm2m']);
    if(!kinds.length) return convertFallback();
    var k = pick(kinds);
    var isM = k === 'm2cm' || k === 'cm2m' || k === 'm2dm' || k === 'dm2m';
    var v = isM ? pickMult(100, b) : pickMult(10, b);
    var p = parts(v);
    if(k === 'm2cm') return uEx('un:conv:m:cm:' + v, num(p.m, M), p.m + ' ' + M, CM, v);
    if(k === 'cm2m') return uEx('un:conv:cm:m:' + v, num(v, CM), v + ' ' + CM, M, p.m);
    if(k === 'm2dm') return uEx('un:conv:m:dm:' + v, num(p.m, M), p.m + ' ' + M, DM, v / 10);
    if(k === 'dm2m') return uEx('un:conv:dm:m:' + v, num(v / 10, DM), (v / 10) + ' ' + DM, M, p.m);
    if(k === 'dm2cm') return uEx('un:conv:dm:cm:' + v, num(v / 10, DM), (v / 10) + ' ' + DM, CM, v);
    return uEx('un:conv:cm:dm:' + v, num(v, CM), v + ' ' + CM, DM, v / 10);
  }

  var fams = [];
  if(multExists(10, b - 1)) fams.push('add1');
  if(nonTenExists(Math.max(a, 11), b - 1)) fams.push('add3');
  if(multExists(10, b)) fams.push('sub1');
  if(nonTenExists(Math.max(a, 11), b)) fams.push('sub2');
  if(multExists(100, b)) fams.push('msubcm', 'msubdm');
  if(!fams.length) return plainUnit();

  var fam = pick(fams), base, e;
  if(fam === 'add1'){
    base = pickMult(10, b - 1);
    e = ri(1, Math.min(9, b - base));
    return uEx('un:add1:' + base + ':' + e,
      compHtml(base) + op('+') + num(e, CM), compText(base) + ' + ' + e + ' ' + CM, CM, base + e);
  }
  if(fam === 'add3'){
    base = pickNonTen(Math.max(a, 11), b - 1);
    e = ri(1, Math.min(9, b - base));
    return uEx('un:add3:' + base + ':' + e,
      compHtml(base) + op('+') + num(e, CM), compText(base) + ' + ' + e + ' ' + CM, CM, base + e);
  }
  if(fam === 'sub1'){
    base = pickMult(10, b);
    e = ri(1, 9);
    return uEx('un:sub1:' + base + ':' + e,
      compHtml(base) + op('−') + num(e, CM), compText(base) + ' − ' + e + ' ' + CM, CM, base - e);
  }
  if(fam === 'sub2'){
    base = pickNonTen(Math.max(a, 11), b);
    e = ri(1, 9);
    return uEx('un:sub2:' + base + ':' + e,
      compHtml(base) + op('−') + num(e, CM), compText(base) + ' − ' + e + ' ' + CM, CM, base - e);
  }
  base = pickMult(100, b);
  if(fam === 'msubcm'){
    e = ri(1, Math.min(99, base - 1));
    return uEx('un:msubcm:' + base + ':' + e,
      compHtml(base) + op('−') + num(e, CM), compText(base) + ' − ' + e + ' ' + CM, CM, base - e);
  }
  e = ri(1, 9);
  return uEx('un:msubdm:' + base + ':' + e,
    compHtml(base) + op('−') + num(e, DM), compText(base) + ' − ' + e + ' ' + DM, DM, base / 10 - e);
}

function joinWords(arr){
  if(!arr.length) return '';
  if(arr.length === 1) return arr[0];
  return arr.slice(0, -1).join(', ') + ' ' + tr('и', 'and') + ' ' + arr[arr.length - 1];
}
function perQuestion(kind, sides){
  var cm = tr('см', 'cm');
  var hv = sides.map(function(v){ return '<b>' + v + '</b> ' + cm; });
  var tv = sides.map(function(v){ return v + ' ' + cm; });
  if(kind === 'rectangle'){
    return {
      html: tr('Прямоугольник со сторонами ', 'A rectangle with sides ') + joinWords(hv) + tr('. Найди периметр.', '. Find the perimeter.'),
      text: tr('Прямоугольник со сторонами ', 'A rectangle with sides ') + joinWords(tv) + tr('. Найди периметр.', '. Find the perimeter.')
    };
  }
  if(kind === 'square'){
    return {
      html: tr('Квадрат со стороной ', 'A square with a side of ') + hv[0] + tr('. Найди периметр.', '. Find the perimeter.'),
      text: tr('Квадрат со стороной ', 'A square with a side of ') + tv[0] + tr('. Найди периметр.', '. Find the perimeter.')
    };
  }
  if(kind === 'pentagon' || kind === 'hexagon'){
    var name = kind === 'pentagon' ? tr('Пятиугольник', 'A pentagon') : tr('Шестиугольник', 'A hexagon');
    return {
      html: name + tr(' со стороной ', ' with a side of ') + hv[0] + tr('. Найди периметр.', '. Find the perimeter.'),
      text: name + tr(' со стороной ', ' with a side of ') + tv[0] + tr('. Найди периметр.', '. Find the perimeter.')
    };
  }
  var shape = kind === 'triangle' ? tr('треугольника', 'triangle') : tr('четырёхугольника', 'quadrilateral');
  return {
    html: tr('Стороны ', 'Sides of the ') + shape + ': ' + joinWords(hv) + tr('. Найди периметр.', '. Find the perimeter.'),
    text: tr('Стороны ', 'Sides of the ') + shape + ': ' + joinWords(tv) + tr('. Найди периметр.', '. Find the perimeter.')
  };
}
function perEx(kind, sides, need){
  var q = perQuestion(kind, sides);
  return ex('per:' + kind + ':' + sides.join('-'),
    '<div class="sk-q">' + q.html + '</div><div class="sk-answer">{{slot}}<span class="unit">' + tr('см', 'cm') + '</span></div>',
    q.text, need, 'number', 'text', need + 100, { figure: { kind:kind, sides:sides }, long: true });
}
function perimeterGen(type){
  var r = bounds();
  var lo = Math.max(1, r.a), hi = Math.max(lo, r.b);
  var i, a, b, c, s, w, h;
  if(type === 'triangle'){
    for(i = 0; i < 300; i++){
      a = ri(lo, hi); b = ri(lo, hi); c = ri(lo, hi);
      if(a + b > c && a + c > b && b + c > a) return perEx('triangle', [a, b, c], a + b + c);
    }
    return perEx('triangle', [3, 4, 5], 12);
  }
  if(type === 'quad'){
    s = [ri(lo, hi), ri(lo, hi), ri(lo, hi), ri(lo, hi)];
    return perEx('quad', s, s[0] + s[1] + s[2] + s[3]);
  }
  if(type === 'rectangle'){
    w = ri(lo, hi); h = ri(lo, hi);
    if(w === h) h = w < hi ? w + 1 : (w > lo ? w - 1 : w);
    return perEx('rectangle', [w, h], 2 * (w + h));
  }
  s = ri(lo, hi);
  if(type === 'square') return perEx('square', [s], 4 * s);
  if(type === 'pentagon') return perEx('pentagon', [s, s, s, s, s], 5 * s);
  return perEx('hexagon', [s, s, s, s, s, s], 6 * s);
}

function genAny(){
  var types = S.types.length ? S.types : availableTypes();
  if(isProblems) types = activeTypes().length ? activeTypes() : ['total'];
  if(SKILL === 'missing') return missingGen();
  for(var i = 0; i < 60; i++){
    var t = pick(types), e = null;
    if(SKILL === 'digits') e = digitsGen(t);
    else if(SKILL === 'compare') e = compareGen(t);
    else if(SKILL === 'brackets') e = bracketsGen(t);
    else if(SKILL === 'units') e = unitsGen(t);
    else if(SKILL === 'perimeter') e = perimeterGen(t);
    else if(SKILL === 'problems' && window.MathProblems) e = window.MathProblems.generateProblem(t, Math.random, { from: S.from, to: S.to, star: S.star });
    else if(SKILL === 'polylines' && window.MathProblems) e = window.MathProblems.generatePolyline(t, Math.random, { from: S.from, to: S.to });
    else if(SKILL === 'equations') e = equationsGen(t);
    else if(SKILL === 'remainders') e = remainderGen(t);
    else if(SKILL === 'area') e = areaGen(t);
    else if(SKILL === 'operations') e = operationsGen(t);
    else if(SKILL === 'divisibility') e = divisibilityGen(t);
    else if(SKILL === 'geometry') e = geometryGen(t);
    else if(SKILL === 'thousand') e = thousandGen(t);
    else if(SKILL === 'round') e = roundGen(t);
    else if(SKILL === 'tree') e = treeGen(t);
    if(!e) continue;
    if(run && run.recent.indexOf(e.id) >= 0) continue;
    if(run){
      run.recent.push(e.id);
      if(run.recent.length > 4) run.recent.shift();
    }
    return e;
  }
  if(SKILL === 'digits') return digitsGen(types[0]);
  if(SKILL === 'compare') return compareGen(types[0]);
  if(SKILL === 'brackets') return bracketsGen(types[0]);
  if(SKILL === 'units') return unitsGen(types[0]);
  if(SKILL === 'perimeter') return perimeterGen(types[0]);
  if(SKILL === 'problems' && window.MathProblems) return window.MathProblems.generateProblem(types[0], Math.random, { from: S.from, to: S.to, star: S.star });
  if(SKILL === 'polylines' && window.MathProblems) return window.MathProblems.generatePolyline(types[0], Math.random, { from: S.from, to: S.to });
  if(SKILL === 'equations') return equationsGen(types[0]);
  if(SKILL === 'remainders') return remainderGen(types[0]);
  if(SKILL === 'area') return areaGen(types[0]);
  if(SKILL === 'operations') return operationsGen(types[0]);
  if(SKILL === 'divisibility') return divisibilityGen(types[0]);
  if(SKILL === 'geometry') return geometryGen(types[0]);
  if(SKILL === 'thousand') return thousandGen(types[0]);
  if(SKILL === 'round') return roundGen(types[0]);
  if(SKILL === 'tree') return treeGen(types[0]);
  return missingGen();
}

/* ---------- уравнения ---------- */
function eqEx(id, html, plain, need, max){
  return ex(id, html, plain, need, 'number', 'expr', max || 100, { long: plain.length > 12 });
}
function equationsGen(type){
  var r = bounds();
  var hi = Math.max(3, Math.min(100, r.b));
  var lo = Math.max(1, Math.min(r.a, hi - 1));
  function num(v){ return '<span>' + v + '</span>'; }
  function op(s){ return '<span class="op">' + s + '</span>'; }
  function eqn(html, plain, need, id){
    return eqEx(id, html, plain, need, 100);
  }
  if(type === 'plus'){
    var b = ri(Math.max(2, lo), hi), a = ri(1, b - 1), x = b - a;
    return eqn(num('{{slot}}') + op('+') + num(a) + op('=') + num(b), '? + ' + a + ' = ' + b, x, 'eq:plus:' + a + ':' + b);
  }
  if(type === 'minus'){
    var m = ri(Math.max(2, lo), hi), s = ri(1, m - 1), d = m - s;
    return eqn(num('{{slot}}') + op('−') + num(s) + op('=') + num(d), '? − ' + s + ' = ' + d, m, 'eq:minus:' + s + ':' + d);
  }
  if(type === 'subFrom'){
    var a2 = ri(Math.max(2, lo), hi), s2 = ri(1, a2 - 1), d2 = a2 - s2;
    return eqn(num(a2) + op('−') + num('{{slot}}') + op('=') + num(d2), a2 + ' − ? = ' + d2, s2, 'eq:sub:' + a2 + ':' + d2);
  }
  if(type === 'times'){
    var f = ri(2, 10), x2 = ri(2, 10), p = f * x2;
    if(p > hi){ x2 = Math.max(2, Math.floor(hi / f)); p = f * x2; }
    return eqn(num('{{slot}}') + op('×') + num(f) + op('=') + num(p), '? × ' + f + ' = ' + p, x2, 'eq:mul:' + f + ':' + p);
  }
  if(type === 'divide'){
    var dv = ri(2, 10), q = ri(2, 10), dd = dv * q;
    if(dd > hi){ q = Math.max(2, Math.floor(hi / dv)); dd = dv * q; }
    return eqn(num('{{slot}}') + op('÷') + num(dv) + op('=') + num(q), '? ÷ ' + dv + ' = ' + q, dd, 'eq:div:' + dv + ':' + q);
  }
  var b3 = ri(2, 10), q3 = ri(2, 10), a3 = b3 * q3;
  if(a3 > hi){ q3 = Math.max(2, Math.floor(hi / b3)); a3 = b3 * q3; }
  return eqn(num(a3) + op('÷') + num('{{slot}}') + op('=') + num(q3), a3 + ' ÷ ? = ' + q3, b3, 'eq:divby:' + a3 + ':' + q3);
}

/* ---------- деление с остатком ---------- */
function remainderGen(type){
  var r = bounds();
  var hi = Math.max(5, Math.min(100, r.b));
  var lo = Math.max(1, Math.min(r.a, hi));
  var b = 3, q = 3, rem = 1, a = 10, i;
  for(i = 0; i < 400; i++){
    b = ri(2, 9); q = ri(2, 10); rem = ri(1, b - 1); a = b * q + rem;
    if(a <= hi && a >= lo) break;
  }
  if(a > hi || a < lo){
    b = 3; q = 2; rem = 2; a = 8;
    if(a > hi){ b = 2; q = 2; rem = 0; a = 4; }
  }
  var OST = tr('ост.', 'r.');
  function num(v){ return '<span>' + v + '</span>'; }
  function op(s){ return '<span class="op">' + s + '</span>'; }
  var base = num(a) + op('÷') + num(b) + op('=');
  var tail = ' (' + OST + ' ' + rem + ')';
  if(type === 'quotient'){
    return ex('rm:q:' + a + ':' + b,
      base + '{{slot}}' + '<span class="unit">' + tail + '</span>',
      a + ' ÷ ' + b + ' = ?' + tail, q, 'number', 'expr', 100, { long: true });
  }
  if(type === 'remainder'){
    return ex('rm:r:' + a + ':' + b,
      base + num(q) + '<span class="unit"> (' + OST + ' {{slot}})</span>',
      a + ' ÷ ' + b + ' = ' + q + ' (ост. ?)', rem, 'number', 'expr', 100, { long: true });
  }
  if(type === 'dividend'){
    return ex('rm:a:' + b + ':' + q + ':' + rem,
      '{{slot}}' + op('÷') + num(b) + op('=') + num(q) + '<span class="unit">' + tail + '</span>',
      '? ÷ ' + b + ' = ' + q + tail, a, 'number', 'expr', 100, { long: true });
  }
  return ex('rm:b:' + a + ':' + q + ':' + rem,
    num(a) + op('÷') + '{{slot}}' + op('=') + num(q) + '<span class="unit">' + tail + '</span>',
    a + ' ÷ ? = ' + q + tail, b, 'number', 'expr', 100, { long: true });
}

/* ---------- площадь и объём ---------- */
function areaGen(type){
  var r = bounds();
  var lo = Math.max(1, r.a), hi = Math.max(lo, Math.min(20, r.b));
  var w = ri(lo, hi), h = ri(lo, hi), s = ri(lo, hi);
  var CM = tr('см', 'cm'), CM2 = tr('см²', 'cm²'), CM3 = tr('см³', 'cm³');
  function num(v){ return '<span>' + v + '</span>'; }
  function answer(unit){
    return '<div class="sk-answer">{{slot}}<span class="unit">' + unit + '</span></div>';
  }
  function ask(q){ return '<div class="sk-q">' + q + '</div>'; }
  if(type === 'rectangle'){
    return ex('ar:rect:' + w + ':' + h,
      ask(tr('Прямоугольник со сторонами ', 'A rectangle with sides ') + w + ' ' + CM + tr(' и ', ' and ') + h + ' ' + CM + tr('. Найди площадь.', '. Find the area.')) + answer(CM2),
      tr('Прямоугольник ', 'Rectangle ') + w + ' × ' + h + ' ' + CM, w * h, 'number', 'text', 400,
      { figure: { kind: 'rectangle', sides: [w, h] } });
  }
  if(type === 'square'){
    return ex('ar:sq:' + s,
      ask(tr('Квадрат со стороной ', 'A square with a side of ') + s + ' ' + CM + tr('. Найди площадь.', '. Find the area.')) + answer(CM2),
      tr('Квадрат ', 'Square ') + s + ' ' + CM, s * s, 'number', 'text', 400,
      { figure: { kind: 'square', sides: [s] } });
  }
  if(type === 'side'){
    var area = w * h;
    return ex('ar:side:' + w + ':' + h,
      ask(tr('Площадь прямоугольника — ', 'The area of a rectangle is ') + area + ' ' + CM2 + tr(', одна сторона — ', ', one side is ') + w + ' ' + CM + tr('. Найди другую сторону.', '. Find the other side.')) + answer(CM),
      tr('S = ', 'S = ') + area + ' ' + CM2 + ', a = ' + w + ' ' + CM, h, 'number', 'text', 20);
  }
  var c = ri(lo, Math.min(hi, 10));
  return ex('ar:vol:' + w + ':' + h + ':' + c,
    ask(tr('Коробка: ', 'A box: ') + w + ' ' + CM + ', ' + h + ' ' + CM + ', ' + c + ' ' + CM + tr('. Найди объём.', '. Find the volume.')) + answer(CM3),
    tr('Коробка ', 'Box ') + w + ' × ' + h + ' × ' + c + ' ' + CM, w * h * c, 'number', 'text', 8000,
    { figure: { kind: 'box', a: w, b: h, c: c } });
}

/* ---------- операции и алгоритмы ---------- */
function opToken(op, n){
  return (op === 'add' ? '+' : op === 'sub' ? '−' : op === 'mul' ? '×' : '÷') + n;
}
function applyNum(x, op, y){
  if(op === 'add') return x + y;
  if(op === 'sub') return x >= y ? x - y : null;
  if(op === 'mul') return (x <= 10 && y <= 10) ? x * y : null;
  return (y !== 0 && x % y === 0) ? x / y : null;
}
function operationsGen(type){
  var r = bounds();
  var hi = Math.max(4, Math.min(100, r.b));
  var lo = Math.max(1, Math.min(r.a, hi - 1));
  var ops = (S.ops && S.ops.length ? S.ops : ['add', 'sub']);
  function num(v){ return '<span>' + v + '</span>'; }
  function arrow(){ return '<span class="op">→</span>'; }
  function token(op, n){ return '<span class="op">' + opToken(op, n) + '</span>'; }
  function trialChain(len){
    for(var i = 0; i < 500; i++){
      var x = ri(lo, hi), vals = [x], cur = x, ok = true;
      for(var k = 0; k < len; k++){
        var op = pick(ops), b = ri(1, Math.min(10, hi));
        var y = applyNum(cur, op, b);
        if(y === null || y < 0 || y > hi){ ok = false; break; }
        vals.push({ op: op, b: b, v: y });
        cur = y;
      }
      if(ok && cur >= 0) return { start: x, steps: vals.slice(1) };
    }
    return null;
  }
  if(type === 'result1'){
    var one = trialChain(1) || { start: lo, steps: [{ op: 'add', b: 1, v: lo + 1 }] };
    var st = one.steps[0];
    var stSym = st.op === 'add' ? '+' : st.op === 'sub' ? '−' : st.op === 'mul' ? '×' : '÷';
    return ex('op:r1:' + one.start + ':' + st.op + ':' + st.b,
      num(one.start) + '<span class="op">' + stSym + '</span>' + num(st.b) + '<span class="op">=</span>{{slot}}',
      one.start + ' ' + stSym + ' ' + st.b + ' = ?', st.v, 'number', 'expr', 100);
  }
  if(type === 'result2'){
    var two = trialChain(2) || { start: lo, steps: [{ op: 'add', b: 1, v: lo + 1 }, { op: 'add', b: 1, v: lo + 2 }] };
    var h = num(two.start), p = String(two.start);
    two.steps.forEach(function(s){
      h += arrow() + token(s.op, s.b);
      p += ' → ' + opToken(s.op, s.b);
    });
    return ex('op:r2:' + p,
      h + arrow() + '{{slot}}', p + ' → ?', two.steps[1].v, 'number', 'expr', 100, { long: true });
  }
  if(type === 'result3'){
    var three = trialChain(3) || { start: lo, steps: [{ op: 'add', b: 1, v: lo + 1 }, { op: 'add', b: 1, v: lo + 2 }, { op: 'add', b: 1, v: lo + 3 }] };
    var h3 = num(three.start), p3 = String(three.start);
    three.steps.forEach(function(s){
      h3 += arrow() + token(s.op, s.b);
      p3 += ' → ' + opToken(s.op, s.b);
    });
    return ex('op:r3:' + p3,
      h3 + arrow() + '{{slot}}', p3 + ' → ?', three.steps[2].v, 'number', 'expr', 100, { long: true });
  }
  if(type === 'start1'){
    var s1 = trialChain(1) || { start: lo, steps: [{ op: 'add', b: 1, v: lo + 1 }] };
    var last = s1.steps[0];
    return ex('op:s1:' + s1.start + ':' + last.op + ':' + last.b,
      '{{slot}}' + arrow() + token(last.op, last.b) + arrow() + num(last.v),
      '? → ' + opToken(last.op, last.b) + ' → ' + last.v, s1.start, 'number', 'expr', 100);
  }
  if(type === 'start3'){
    var st3 = trialChain(3) || { start: lo, steps: [{ op: 'add', b: 1, v: lo + 1 }, { op: 'add', b: 1, v: lo + 2 }, { op: 'add', b: 1, v: lo + 3 }] };
    var hs = '{{slot}}', ps = '?';
    st3.steps.forEach(function(s){
      hs += arrow() + token(s.op, s.b);
      ps += ' → ' + opToken(s.op, s.b);
    });
    return ex('op:s3:' + ps,
      hs + arrow() + num(st3.steps[2].v),
      ps + ' → ' + st3.steps[2].v, st3.start, 'number', 'expr', 100, { long: true });
  }
  var s2 = trialChain(2) || { start: lo, steps: [{ op: 'add', b: 1, v: lo + 1 }, { op: 'add', b: 1, v: lo + 2 }] };
  var html = '{{slot}}', plain = '?';
  s2.steps.forEach(function(s){
    html += arrow() + token(s.op, s.b);
    plain += ' → ' + opToken(s.op, s.b);
  });
  return ex('op:s2:' + plain,
    html + arrow() + num(s2.steps[1].v),
    plain + ' → ' + s2.steps[1].v, s2.start, 'number', 'expr', 100, { long: true });
}

/* ---------- чётные, нечётные, кратные ---------- */
function divisibilityGen(type){
  var r = bounds();
  var lo = Math.max(1, r.a), hi = Math.max(lo + 1, Math.min(100, r.b));
  function ask(html, plain, need, id, max){
    return ex(id, '<div class="sk-q">' + html + '</div><div class="sk-answer">{{slot}}</div>', plain, need, 'number', 'text', max || 100);
  }
  var n, ans, k, a, b, i;
  if(type === 'nextEven' || type === 'nextOdd'){
    var wantOdd = type === 'nextOdd';
    for(i = 0; i < 200; i++){
      n = ri(lo, hi - 1);
      ans = n + 1;
      if((ans % 2 === 0) === !wantOdd && ans <= hi) break;
      ans = n + 2;
      if((ans % 2 === 0) === !wantOdd && ans <= hi) break;
    }
    if(!ans || ans > hi) ans = wantOdd ? (hi % 2 ? hi : hi - 1) : (hi % 2 ? hi - 1 : hi);
    if(wantOdd){
      return ask(tr('Запиши следующее нечётное число после ', 'Write the next odd number after ') + n + '.',
        'next odd after ' + n, ans, 'dv:no:' + n);
    }
    return ask(tr('Запиши следующее чётное число после ', 'Write the next even number after ') + n + '.',
      'next even after ' + n, ans, 'dv:ne:' + n);
  }
  if(type === 'prevEven' || type === 'prevOdd'){
    var prevOdd = type === 'prevOdd';
    for(i = 0; i < 200; i++){
      n = ri(lo + 1, hi);
      ans = n - 1;
      if((ans % 2 === 0) === !prevOdd && ans >= lo) break;
      ans = n - 2;
      if((ans % 2 === 0) === !prevOdd && ans >= lo) break;
    }
    if(!ans || ans < lo) ans = prevOdd ? (lo % 2 ? lo : lo + 1) : (lo % 2 ? lo + 1 : lo);
    if(prevOdd){
      return ask(tr('Запиши предыдущее нечётное число перед ', 'Write the previous odd number before ') + n + '.',
        'previous odd before ' + n, ans, 'dv:po:' + n);
    }
    return ask(tr('Запиши предыдущее чётное число перед ', 'Write the previous even number before ') + n + '.',
      'previous even before ' + n, ans, 'dv:pe:' + n);
  }
  if(type === 'multipleNext'){
    for(i = 0; i < 200; i++){
      k = ri(2, 9); n = ri(lo, hi - 1);
      ans = Math.ceil((n + 1) / k) * k;
      if(ans <= hi) break;
    }
    if(!ans || ans > hi){ k = 2; ans = n + (n % 2 ? 1 : 2); }
    return ask(tr('Наименьшее число, кратное ', 'The smallest multiple of ') + k + tr(', больше ', ' greater than ') + n + '.',
      'next multiple of ' + k + ' after ' + n, ans, 'dv:mn:' + k + ':' + n);
  }
  if(type === 'multiplePrev'){
    for(i = 0; i < 200; i++){
      k = ri(2, 9); n = ri(lo + 1, hi);
      ans = Math.floor((n - 1) / k) * k;
      if(ans >= lo && ans > 0) break;
    }
    if(!ans || ans < lo){ k = 2; ans = Math.max(lo, n - 2); }
    return ask(tr('Наибольшее число, кратное ', 'The greatest multiple of ') + k + tr(', меньше ', ' less than ') + n + '.',
      'previous multiple of ' + k + ' before ' + n, ans, 'dv:mp:' + k + ':' + n);
  }
  a = ri(lo, Math.max(lo, hi - 2));
  b = ri(a + 1, Math.min(hi, a + 9));
  ans = Math.floor(b / 2) - Math.floor((a - 1) / 2);
  return ask(tr('Сколько чётных чисел от ', 'How many even numbers from ') + a + tr(' до ', ' to ') + b + '?',
    'even count ' + a + '..' + b, ans, 'dv:ce:' + a + ':' + b, 10);
}

/* ---------- геометрия ---------- */
function geometryGen(type){
  var hi = Math.max(2, Math.min(20, bounds().b));
  function ask(html, plain, need, max, fig, unit, id){
    return ex('geo:' + id,
      '<div class="sk-q">' + html + '</div><div class="sk-answer">{{slot}}' +
        (unit ? '<span class="unit">' + unit + '</span>' : '') + '</div>',
      plain, need, 'number', 'text', max, { figure: { kind: 'geometry', shape: fig.shape, n: fig.n, layout: fig.layout, value: fig.value }, long: true });
  }
  var CM = tr('см', 'cm');
  if(type === 'segments'){
    var n = ri(3, 5), ans = n * (n - 1) / 2;
    return ask(tr('На прямой отмечены точки. Сколько отрезков с концами в этих точках?', 'Points are marked on a line. How many segments have their ends at these points?'),
      'segments on a line', ans, 20, { shape: 'points', n: n }, '', 'seg:' + n);
  }
  if(type === 'rays'){
    var m = ri(3, 5);
    return ask(tr('Из точки O проведены лучи. Сколько лучей на рисунке?', 'Rays start at point O. How many rays are in the picture?'),
      'rays from a point', m, 20, { shape: 'rays', n: m }, '', 'ray:' + m);
  }
  if(type === 'intersections'){
    var layout = ri(0, 3), count = layout === 0 ? 1 : layout === 1 ? 2 : layout === 2 ? 3 : 0;
    return ask(tr('Сколько точек пересечения на рисунке?', 'How many intersection points are in the picture?'),
      'intersection points', count, 20, { shape: 'intersections', layout: layout }, '', 'int:' + layout);
  }
  if(type === 'diameter'){
    var r = ri(2, hi), d = r * 2;
    return ask(tr('Радиус окружности — ', 'The radius of the circle is ') + r + ' ' + CM + tr('. Найди диаметр.', '. Find the diameter.'),
      'radius ' + r, d, 40, { shape: 'radius', value: r }, CM, 'dia:' + r);
  }
  var rr = ri(2, hi), dd = rr * 2;
  return ask(tr('Диаметр окружности — ', 'The diameter of the circle is ') + dd + ' ' + CM + tr('. Найди радиус.', '. Find the radius.'),
    'diameter ' + dd, rr, 20, { shape: 'diameter', value: dd }, CM, 'rad:' + dd);
}

/* ---------- тысяча и трёхзначные числа ---------- */
function thousandGen(type){
  var r = bounds();
  var lo = Math.max(100, Math.min(999, r.a)), hi = Math.max(lo, Math.min(999, r.b));
  var n = ri(lo, hi), h = Math.floor(n / 100), t = Math.floor(n / 10) % 10, o = n % 10;
  var guard = 0;
  while((t === 0 || o === 0) && guard++ < 40){
    n = ri(lo, hi); h = Math.floor(n / 100); t = Math.floor(n / 10) % 10; o = n % 10;
  }
  function ask(html, plain, need, id, max){
    return ex('th:' + id + ':' + n, '<div class="sk-q">' + html + '</div><div class="sk-answer">{{slot}}</div>',
      plain, need, 'number', 'text', max || 999);
  }
  var de = tr('дес.', 'tens'), ed = tr('ед.', 'ones'), sot = tr('сот.', 'hundreds');
  if(type === 'hundreds'){
    return ask(tr('Сколько сотен в числе ', 'How many hundreds are in ') + '<b>' + n + '</b>?',
      'hundreds in ' + n, h, 'h');
  }
  if(type === 'tens'){
    return ask(tr('Сколько всего десятков в числе ', 'How many tens in total are in ') + '<b>' + n + '</b>?',
      'tens in total in ' + n, Math.floor(n / 10), 't');
  }
  if(type === 'ones'){
    return ask(tr('Сколько единиц в числе ', 'How many ones are in ') + '<b>' + n + '</b>?',
      'ones in ' + n, o, 'o');
  }
  if(type === 'build'){
    return ask(tr('Запиши число: ', 'Write the number: ') + '<b>' + h + ' ' + sot + ' ' + t + ' ' + de + ' ' + o + ' ' + ed + '</b>',
      'build ' + h + '-' + t + '-' + o, n, 'b');
  }
  if(type === 'expand'){
    return ex('th:x:' + n,
      '<span>' + n + '</span><span class="op">=</span><span>' + (h * 100) + '</span><span class="op">+</span><span>' + (t * 10) + '</span><span class="op">+</span>{{slot}}',
      n + ' = ' + (h * 100) + ' + ' + (t * 10) + ' + ?', o, 'number', 'expr', 999, { long: true });
  }
  if(type === 'roundAdd'){
    var a = ri(1, 9) * 100, b = ri(1, 9) * 10;
    return ex('th:add:' + a + ':' + b,
      '<span>' + a + '</span><span class="op">+</span><span>' + b + '</span><span class="op">=</span>{{slot}}',
      a + ' + ' + b + ' = ?', a + b, 'number', 'expr', 999);
  }
  var s = ri(2, 9) * 100, sub = ri(1, 9) * 10;
  return ex('th:sub:' + s + ':' + sub,
    '<span>' + s + '</span><span class="op">−</span><span>' + sub + '</span><span class="op">=</span>{{slot}}',
    s + ' − ' + sub + ' = ?', s - sub, 'number', 'expr', 999);
}

/* ---------- умножение и деление на 10 и 100, круглые числа ---------- */
function roundGen(type){
  var r = bounds();
  var lo = Math.max(1, Math.min(99, r.a)), hi = Math.max(lo, Math.min(99, r.b));
  function expr(a, sym, b, need, id, max){
    return ex('rd:' + id,
      '<span>' + a + '</span><span class="op">' + sym + '</span><span>' + b + '</span><span class="op">=</span>{{slot}}',
      a + ' ' + sym + ' ' + b + ' = ?', need, 'number', 'expr', max);
  }
  var n, a, b, q;
  if(type === 'timesTen'){
    n = ri(lo, hi);
    return expr(n, '×', 10, n * 10, 'mt:' + n, 999);
  }
  if(type === 'divTen'){
    n = ri(lo, hi);
    return expr(n * 10, '÷', 10, n, 'dt:' + n, 99);
  }
  if(type === 'timesHundred'){
    n = ri(1, 9);
    return expr(n, '×', 100, n * 100, 'mh:' + n, 999);
  }
  if(type === 'divHundred'){
    n = ri(1, 9);
    return expr(n * 100, '÷', 100, n, 'dh:' + n, 99);
  }
  if(type === 'roundMul'){
    a = ri(2, 9) * 10; b = ri(2, 5);
    return expr(a, '×', b, a * b, 'rm:' + a + ':' + b, 450);
  }
  b = ri(2, 9) * 10; q = ri(2, 9);
  return expr(b * q, '÷', b, q, 'rd:' + b + ':' + q, 99);
}

/* ---------- дерево возможностей ---------- */
var TREE_PAIR = [
  ['Красных кубиков — {a}, синих — {b}. Сколько разных пар «красный + синий» можно составить?',
   'There are {a} red bricks and {b} blue bricks. How many different red + blue pairs can be made?'],
  ['Книг о животных — {a}, книг о путешествиях — {b}. Сколько разных пар, по одной книге из каждой группы, можно выбрать?',
   'There are {a} animal books and {b} travel books. How many different pairs, one from each group, can be chosen?'],
  ['Машинок — {a}, прицепов — {b}. Сколько разных сцепок «машинка + прицеп» можно получить?',
   'There are {a} toy cars and {b} trailers. How many different car + trailer combinations can be made?']
];
function fillTree(text, vals){
  return text.replace(/\{([abc])\}/g, function(_, k){ return vals[k]; });
}
function treeGen(type){
  var r = bounds();
  var lo = Math.max(2, Math.min(6, r.a)), hi = Math.max(lo, Math.min(6, r.b));
  var m = ri(lo, hi), n = ri(lo, hi), k = ri(2, 3);
  function ask(html, plain, need, id, fig){
    return ex('tr:' + id, '<div class="sk-q">' + html + '</div><div class="sk-answer">{{slot}}</div>',
      plain, need, 'number', 'text', 100, fig ? { figure: fig, long: true } : { long: true });
  }
  if(type === 'pairs'){
    var c = pick(TREE_PAIR);
    var html = fillTree(tr(c[0], c[1]), { a: m, b: n });
    return ask(html, 'pairs ' + m + '×' + n, m * n, 'p:' + m + ':' + n, m * n <= 12 ? { kind: 'geometry', shape: 'tree', a: m, b: n } : null);
  }
  if(type === 'three'){
    var html3 = tr(
      'В кафе есть сок, печенье и фрукты нескольких видов: {a}, {b} и {c}. Сколько разных наборов из сока, печенья и фрукта можно составить?',
      'A cafe offers {a} kinds of juice, {b} kinds of cookies and {c} kinds of fruit. How many different sets of juice, cookies and fruit can be made?'
    );
    return ask(fillTree(html3, { a: m, b: n, c: k }), 'sets ' + m + '×' + n + '×' + k, m * n * k, 't:' + m + ':' + n + ':' + k);
  }
  if(type === 'paths'){
    var htmlp = tr(
      'Дорог от дома до моста — {a}, от моста до школы — {b}. Сколько разных путей от дома до школы через мост?',
      'There are {a} roads from home to the bridge and {b} roads from the bridge to school. How many different routes from home to school go through the bridge?'
    );
    return ask(fillTree(htmlp, { a: m, b: n }), 'routes ' + m + '×' + n, m * n, 'w:' + m + ':' + n, m * n <= 12 ? { kind: 'geometry', shape: 'tree', a: m, b: n } : null);
  }
  var count = ri(3, 4), nums = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, count);
  var list = nums.join(', ');
  return ask(tr('Сколько двузначных чисел можно составить из цифр ', 'How many two-digit numbers can be made from the digits ') + list +
    tr(', если цифры в числе не повторяются?', ', if a digit cannot repeat in a number?'),
    'two-digit numbers from ' + list, count * (count - 1), 'd:' + list);
}

/* ---------- фигура к периметру ---------- */
function fitPts(pts, W, H, pad){
  var minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity, i, p;
  for(i = 0; i < pts.length; i++){
    p = pts[i];
    if(p[0] < minX) minX = p[0];
    if(p[0] > maxX) maxX = p[0];
    if(p[1] < minY) minY = p[1];
    if(p[1] > maxY) maxY = p[1];
  }
  var dw = Math.max(maxX - minX, 0.0001), dh = Math.max(maxY - minY, 0.0001);
  var s = Math.min((W - pad * 2) / dw, (H - pad * 2) / dh);
  var ox = (W - dw * s) / 2, oy = (H - dh * s) / 2;
  return pts.map(function(q){ return [ox + (q[0] - minX) * s, oy + (q[1] - minY) * s]; });
}
function svgShape(fig){
  var kind = fig.kind, sides = fig.sides || [], pts, labels;
  if(kind === 'geometry' && window.MathProblems && window.MathProblems.geometryFigure){
    return window.MathProblems.geometryFigure(fig, false);
  }
  if(kind === 'box'){
    var W = 116, H = 62, dx = 44, dy = 28, ox = 40, oy = 56;
    var front = [[ox, oy], [ox + W, oy], [ox + W, oy + H], [ox, oy + H]];
    var top = [[ox, oy], [ox + dx, oy - dy], [ox + W + dx, oy - dy], [ox + W, oy]];
    var side = [[ox + W, oy], [ox + W + dx, oy - dy], [ox + W + dx, oy + H - dy], [ox + W, oy + H]];
    function poly(a){
      return '<polygon class="fshape" points="' + a.map(function(pt){ return pt[0].toFixed(1) + ',' + pt[1].toFixed(1); }).join(' ') + '"/>';
    }
    var svg = '<svg viewBox="0 0 260 186" role="img" aria-hidden="true">' + poly(front) + poly(top) + poly(side);
    svg += '<text class="fside" x="' + (ox + W / 2) + '" y="' + (oy + H + 18) + '" text-anchor="middle">' + fig.a + '</text>';
    svg += '<text class="fside" x="' + (ox - 14) + '" y="' + (oy + H / 2) + '" text-anchor="middle">' + fig.b + '</text>';
    svg += '<text class="fside" x="' + (ox + W + dx / 2) + '" y="' + (oy - dy - 8) + '" text-anchor="middle">' + fig.c + '</text>';
    return svg + '</svg>';
  }
  if(kind === 'square'){
    var v = sides[0];
    pts = [[0, 0], [v, 0], [v, v], [0, v]];
    labels = [v, v, v, v];
  } else if(kind === 'rectangle'){
    var w = sides[0], h = sides[1];
    pts = [[0, 0], [w, 0], [w, h], [0, h]];
    labels = [w, h, w, h];
  } else if(kind === 'triangle'){
    var a = sides[0], b = sides[1], c = sides[2];
    var x = (b * b + c * c - a * a) / (2 * c);
    var y2 = b * b - x * x;
    var y = Math.sqrt(Math.max(y2, 0.0001));
    pts = [[0, 0], [c, 0], [x, y]];
    labels = [c, a, b];
  } else if(kind === 'quad'){
    pts = [[8, 14], [100, 6], [108, 96], [2, 104]];
    labels = [sides[0], sides[1], sides[2], sides[3]];
  } else {
    var n = kind === 'pentagon' ? 5 : 6;
    pts = []; labels = [];
    for(var i = 0; i < n; i++){
      var ang = -Math.PI / 2 + i * 2 * Math.PI / n;
      pts.push([Math.cos(ang) * 50, Math.sin(ang) * 50]);
      labels.push(sides[i]);
    }
  }
  var f = fitPts(pts, 260, 186, 30);
  var cx = 0, cy = 0, j, p, q;
  for(j = 0; j < f.length; j++){ cx += f[j][0]; cy += f[j][1]; }
  cx /= f.length; cy /= f.length;
  var html = '<svg viewBox="0 0 260 186" role="img" aria-hidden="true">';
  html += '<polygon class="fshape" points="' + f.map(function(pt){ return pt[0].toFixed(1) + ',' + pt[1].toFixed(1); }).join(' ') + '"/>';
  for(j = 0; j < f.length; j++){
    p = f[j]; q = f[(j + 1) % f.length];
    var mx = (p[0] + q[0]) / 2, my = (p[1] + q[1]) / 2;
    var dx = mx - cx, dy = my - cy, len = Math.sqrt(dx * dx + dy * dy) || 1;
    var tx = mx + dx / len * 16, ty = my + dy / len * 16;
    html += '<text class="fside" x="' + tx.toFixed(1) + '" y="' + ty.toFixed(1) + '" text-anchor="middle" dominant-baseline="middle">' + labels[j] + '</text>';
  }
  return html + '</svg>';
}

/* ---------- ошибки, история ---------- */
var hardCache = [];

function loadHard(){
  var v = loadJSON(K_HARD, []);
  if(!Array.isArray(v)) return [];
  return v.filter(function(x){
    return x && typeof x.id === 'string' && typeof x.prompt === 'string' && x.need !== undefined && x.answerKind;
  }).slice(-16);
}
function saveHard(){ saveJSON(K_HARD, hardCache); }
function renderHard(){
  var list = visibleHard();
  var n = list.length;
  els.hardList.innerHTML = n
    ? list.map(function(x){ return '<span class="ex">' + x.text + '</span>'; }).join('')
    : '';
  els.hardList.hidden = !n;
  els.hardBtn.disabled = !n;
  els.clearHard.hidden = !n;
  els.hardInfo.textContent = n
    ? tr('Заданий для повторения: ', 'Tasks to review: ') + n
    : hardEmptyText;
}
function addHard(list){
  list.forEach(function(x){
    var found = false;
    for(var i = 0; i < hardCache.length; i++){
      if(hardCache[i].id === x.id){ found = true; break; }
    }
    if(!found) hardCache.push(x);
  });
  if(hardCache.length > 16) hardCache = hardCache.slice(-16);
  saveHard();
}
function missLabel(m){
  if(m === 'r') return tr('ответ', 'answer');
  if(m === 'a') return tr('1-е число', 'first number');
  if(m === 'b') return tr('2-е число', 'second number');
  if(m === 'ab') return tr('1-е или 2-е', 'first or second');
  return tr('вперемешку', 'mixed');
}
function summaryText(){
  var tasks = [];
  if(SKILL === 'missing'){
    var names = { add:'+', sub:'−', mul:'×', div:'÷' };
    S.ops.forEach(function(o){ tasks.push(names[o]); });
    tasks.push(missLabel(S.miss));
  } else if(SKILL === 'brackets'){
    var brNames = { add:'+', sub:'−', mul:'×', div:'÷' };
    if(els.types) each(els.types.querySelectorAll('button'), function(b){
      if(S.types.indexOf(b.getAttribute('data-v')) >= 0) tasks.push(b.textContent.trim());
    });
    S.ops.forEach(function(o){ tasks.push(brNames[o]); });
  } else if(els.types){
    var chosen = isProblems ? activeTypes() : S.types;
    each(els.types.querySelectorAll('button'), function(b){
      if(chosen.indexOf(b.getAttribute('data-v')) >= 0) tasks.push(b.textContent.trim());
    });
  }
  return S.from + '–' + S.to + ' · ' + tasks.join(', ');
}
function saveSession(durSec){
  var h = loadJSON(K_HIST, []);
  if(!Array.isArray(h)) h = [];
  h.unshift({
    t: Date.now(), mode: S.mode, psec: S.min * 60 + S.sec,
    dur: durSec, ok: run.ok, bad: run.bad, hard: !!run.hardMode,
    summary: run.summary || summaryText()
  });
  saveJSON(K_HIST, h.slice(0, 12));
}
function renderHistory(){
  var h = loadJSON(K_HIST, []);
  if(!Array.isArray(h) || !h.length){
    els.histList.innerHTML = '<div class="hrow dim">' + tr('Пока пусто', 'Nothing yet') + '</div>';
    els.clearHist.style.display = 'none';
    return;
  }
  els.clearHist.style.display = '';
  els.histList.innerHTML = h.map(function(r){
    var total = r.ok + r.bad;
    var acc = total ? Math.round(r.ok / total * 100) + '%' : '—';
    var mode = r.mode === 'timed' ? tr('на время ', 'timed ') + fmt(r.psec) : tr('тренировка', 'practice');
    var desc = r.hard ? tr('повторение ошибок', 'mistake review') : (r.summary || '');
    return '<div class="hrow">' + fmtDate(r.t) + ' · ' + desc + ' · ' + mode + ' · ' +
      tr('верно ', 'correct ') + r.ok + ', ' + r.bad + ' ' + pluralErr(r.bad) + ' · ' + acc + '</div>';
  }).join('');
}

/* ---------- игра ---------- */
var run = null;

function showScreen(id){
  each(document.querySelectorAll('.screen'), function(s){ s.classList.remove('active'); });
  var el = $(id);
  if(el) el.classList.add('active');
  if(id === 'setup'){ setup.scrollTop = 0; }
  if(id === 'results'){ els.results.scrollTop = 0; }
}
function startClock(){
  run.start = Date.now();
  run.endAt = run.limitMs ? run.start + run.limitMs : 0;
  clearInterval(run.timer);
  run.timer = setInterval(tick, 200);
  tick();
}
function tick(){
  if(!run || run.done) return;
  var now = Date.now();
  if(run.endAt){
    var left = Math.max(0, run.endAt - now);
    var pct = run.limitMs ? left / run.limitMs : 0;
    els.tclock.textContent = fmt(Math.ceil(left / 1000));
    els.tfill.style.width = (pct * 100) + '%';
    els.tfill.className = 'tfill' + (pct < 0.15 ? ' low' : pct < 0.35 ? ' warn' : '');
    if(left <= 0) finish('time');
  } else {
    els.tclock.textContent = fmt((now - run.start) / 1000);
  }
}
function startRun(list, kind){
  normalize();
  saveSettings();
  var limitMs = S.mode === 'timed' ? Math.max(10, S.min * 60 + S.sec) * 1000 : 0;
  run = {
    ok: 0, bad: 0, tN: 0, tSum: 0, minMs: 0, maxMs: 0,
    records: [], mistakes: [], unsolved: [], slow: [], recent: [],
    done: false, locked: false, typed: '', cur: null, shownAt: 0,
    timer: 0, advanceTimer: 0, start: 0, endAt: 0, limitMs: limitMs,
    listKind: kind || 'normal', hardMode: kind === 'hard',
    queue: [], hardRemaining: [],
    summary: summaryText()
  };
  if(kind === 'hard'){
    run.queue = shuffle(list.slice());
    run.hardRemaining = list.slice();
    run.hardHidden = hardCache.filter(function(x){
      for(var i = 0; i < list.length; i++){
        if(list[i].id === x.id) return false;
      }
      return true;
    });
    run.summary = tr('повторение', 'review');
  } else if(kind === 'fluency'){
    run.queue = shuffle(list.slice());
    run.summary = tr('беглость', 'fluency practice');
  } else if(kind === 'retry'){
    run.queue = shuffle(list.slice());
    run.summary = tr('непройденные задания', 'skipped tasks');
  }
  showScreen('game');
  els.scoreOk.textContent = '0';
  els.scoreBad.textContent = '0';
  els.gInfo.textContent = kind === 'hard'
    ? tr('Повторение: ', 'Review: ') + list.length
    : kind === 'fluency'
      ? tr('Тренировка беглости: ', 'Fluency practice: ') + list.length
      : kind === 'retry'
        ? tr('Не решено: ', 'Not solved: ') + list.length
        : run.summary;
  els.timeWrap.classList.toggle('free', S.mode !== 'timed');
  els.tfill.style.width = '100%';
  els.tfill.className = 'tfill';
  els.tclock.textContent = S.mode === 'timed' ? fmt(limitMs / 1000) : '0:00';
  startClock();
  next();
}
function nextExercise(){
  if(run.listKind === 'hard' || run.listKind === 'fluency' || run.listKind === 'retry'){
    if(!run.queue.length) return null;
    return run.queue.shift();
  }
  return genAny();
}
function renderCurrent(){
  var e = run.cur;
  if(e.long && els.playarea) els.playarea.scrollTop = 0;
  els.eqw.classList.remove('ok', 'bad');
  els.cap.className = 'cap';
  els.cap.textContent = '';
  each(els.signpad.querySelectorAll('button'), function(b){ b.classList.remove('correct', 'wrong'); });
  els.eq.className = 'eq ' + e.layout + (e.long ? ' long' : '');
  els.eq.innerHTML = e.prompt.replace('{{slot}}', '<span class="slot empty" id="skSlot"></span>');
  if(e.figure && e.figure.kind){
    els.figWrap.hidden = false;
    els.figWrap.open = SKILL === 'geometry' || SKILL === 'tree';
    els.figSummary.textContent = tr('Показать фигуру', 'Show the shape');
    els.fig.innerHTML = svgShape(e.figure);
  } else {
    els.figWrap.hidden = true;
    els.figWrap.open = false;
    els.fig.innerHTML = '';
  }
  if(e.answerKind === 'sign'){
    els.signpad.hidden = false;
    els.pad.hidden = true;
    els.tiles.hidden = true;
  } else if(S.answer === 'type'){
    els.signpad.hidden = true;
    els.pad.hidden = false;
    els.tiles.hidden = true;
  } else {
    els.signpad.hidden = true;
    els.pad.hidden = true;
    els.tiles.hidden = false;
    buildTiles(e, parseInt(S.answer.replace(/\D/g, ''), 10) || 9);
  }
}
function next(){
  if(!run || run.done) return;
  clearTimeout(run.advanceTimer);
  var e = nextExercise();
  if(!e){ finish('done'); return; }
  run.cur = e;
  run.typed = '';
  run.shownAt = Date.now();
  run.locked = false;
  renderCurrent();
}
function buildTiles(e, count){
  var need = Number(e.need);
  var max = Math.max(Number(e.max) || 100, need + 10, 10);
  var out = [need];
  var cands = shuffle([need + 1, need - 1, need + 2, need - 2, need + 10, need - 10, need + 100, need - 100]);
  var i;
  for(i = 0; i < cands.length && out.length < count; i++){
    if(cands[i] >= 0 && cands[i] <= max && out.indexOf(cands[i]) < 0) out.push(cands[i]);
  }
  var guard = 0;
  while(out.length < count && guard++ < 400){
    var v = ri(0, max);
    if(out.indexOf(v) < 0) out.push(v);
  }
  out.sort(function(a, b){ return a - b; });
  els.tiles.innerHTML = out.map(function(v){ return '<button type="button" data-v="' + v + '">' + v + '</button>'; }).join('');
}
function updateSlot(){
  var slot = $('skSlot');
  if(!slot) return;
  slot.textContent = run.typed;
  slot.classList.toggle('empty', !run.typed);
}
function typeDigit(d){
  if(!run || run.locked || !run.cur || run.cur.answerKind !== 'number') return;
  if(run.typed.length >= 5) return;
  run.typed += d;
  updateSlot();
}
function backspace(){
  if(!run || run.locked || !run.cur) return;
  run.typed = run.typed.slice(0, -1);
  updateSlot();
}
function submitTyped(){
  if(!run || run.locked || !run.cur || run.typed === '') return;
  submitValue(Number(run.typed));
}
function submitValue(val, btn){
  if(!run || run.locked || !run.cur) return;
  run.locked = true;
  var e = run.cur;
  var ok;
  if(e.answerKind === 'sign') ok = String(val) === String(e.need);
  else ok = Number(val) === Number(e.need);
  var ms = Date.now() - run.shownAt;
  run.tN++;
  run.tSum += ms;
  if(!run.minMs || ms < run.minMs) run.minMs = ms;
  if(ms > run.maxMs) run.maxMs = ms;
  run.records.push({ ok: ok, ms: ms, ex: e });
  var slot = $('skSlot');
  if(slot){
    slot.textContent = String(val);
    slot.classList.remove('empty');
  }
  if(ok){
    run.ok++;
    els.eqw.classList.add('ok');
    els.cap.className = 'cap ok';
    els.cap.textContent = tr('Верно', 'Correct');
    if(btn) btn.classList.add('correct');
    playCorrect();
    if(run.hardMode){
      for(var i = run.hardRemaining.length - 1; i >= 0; i--){
        if(run.hardRemaining[i].id === e.id) run.hardRemaining.splice(i, 1);
      }
    }
  } else {
    run.bad++;
    var dup = false;
    for(var j = 0; j < run.mistakes.length; j++){
      if(run.mistakes[j].ex.id === e.id){ dup = true; break; }
    }
    if(!dup) run.mistakes.push({ ex: e, ua: val });
    els.eqw.classList.add('bad');
    els.cap.className = 'cap bad';
    els.cap.textContent = tr('Правильно: ', 'Correct answer: ') + (e.answerText || e.need);
    if(btn) btn.classList.add('wrong');
    playWrong();
    if(run.listKind === 'hard' || run.listKind === 'fluency' || run.listKind === 'retry') run.queue.push(e);
  }
  els.scoreOk.textContent = run.ok;
  els.scoreBad.textContent = run.bad;
  run.advanceTimer = setTimeout(function(){
    if(run && !run.done) next();
  }, e.long ? (ok ? 1300 : 2600) : (ok ? 420 : 1500));
}
function markUnsolved(){
  if(!run.cur || run.locked || !run.tN) return;
  var elapsed = Date.now() - run.shownAt;
  var avg = run.tSum / run.tN;
  if(elapsed <= avg) return;
  var e = run.cur;
  var dup = false;
  for(var i = 0; i < run.unsolved.length; i++){
    if(run.unsolved[i].id === e.id){ dup = true; break; }
  }
  if(!dup) run.unsolved.push(e);
  if(run.listKind === 'hard' || run.listKind === 'fluency' || run.listKind === 'retry') run.queue.push(e);
}
function collectSlow(){
  var okRecs = [], wrong = {}, seen = {}, out = [], i;
  if(run.tN < 4) return out;
  run.records.forEach(function(r){
    if(r.ok) okRecs.push(r);
    else wrong[r.ex.id] = 1;
  });
  if(!okRecs.length) return out;
  var avg = run.tSum / run.tN, thr = avg * 1.2;
  okRecs.forEach(function(r){
    if(wrong[r.ex.id] || seen[r.ex.id] || r.ms < thr) return;
    seen[r.ex.id] = 1;
    out.push({ ex: r.ex, ms: r.ms, avg: avg });
  });
  return out;
}
function finish(reason){
  if(!run || run.done) return;
  run.done = true;
  clearInterval(run.timer);
  clearTimeout(run.advanceTimer);
  if(reason === 'time' || reason === 'stop') markUnsolved();
  var durSec = Math.round((Date.now() - run.start) / 1000);
  if(run.listKind === 'normal' || run.listKind === 'fluency'){
    addHard(run.mistakes.map(function(m){ return m.ex; }).concat(run.unsolved));
  }
  if(run.hardMode){
    hardCache = run.hardRemaining.concat(run.hardHidden || []).slice(0, 16);
    saveHard();
  }
  run.slow = run.listKind === 'normal' ? collectSlow() : [];
  showResults(reason, durSec);
  saveSession(durSec);
  renderHard();
  renderHistory();
  showScreen('results');
}

var VERDICTS = {
  ru: [
    { min:95, cls:'g5', msgs:['Отлично! Почти без ошибок.', 'Блестяще! Всё получается.', 'Точность на высоте!'] },
    { min:80, cls:'g4', msgs:['Хорошо! Ещё чуть-чуть — и будет идеально.', 'Верных ответов много, ошибки можно разобрать.', 'Крепкий результат!'] },
    { min:60, cls:'g3', msgs:['Неплохо! Повтори ошибки — и станет легче.', 'Больше половины верно — хорошая база.', 'Продолжай, результат растёт.'] },
    { min:40, cls:'g2', msgs:['Не сдавайся! Ошибки — часть тренировки.', 'Попробуй решать медленнее и внимательнее.', 'Разбери ошибки, и всё получится.'] },
    { min:20, cls:'g1', msgs:['Начни с простых заданий и не спеши.', 'Повтори правило и попробуй ещё раз.', 'Не расстраивайся, главное — тренировка.'] },
    { min:0, cls:'g0', msgs:['Пока трудно — начни с малого.', 'Отдохни и попробуй снова.', 'Разберись с примером вместе со взрослым.'] }
  ],
  en: [
    { min:95, cls:'g5', msgs:['Excellent! Almost no mistakes.', 'Brilliant! Everything works out.', 'Great accuracy!'] },
    { min:80, cls:'g4', msgs:['Good job! A little more and it will be perfect.', 'Many correct answers — review the few mistakes.', 'Solid result!'] },
    { min:60, cls:'g3', msgs:['Not bad! Review your mistakes and it will get easier.', 'More than half correct — a good base.', 'Keep going, you are improving.'] },
    { min:40, cls:'g2', msgs:['Do not give up! Mistakes are part of practice.', 'Try to solve more slowly and carefully.', 'Review the mistakes and you will get there.'] },
    { min:20, cls:'g1', msgs:['Start with easier tasks and take your time.', 'Review the rule and try again.', 'Do not worry, practice is what matters.'] },
    { min:0, cls:'g0', msgs:['It is hard for now — start small.', 'Take a break and try again.', 'Go through an example with an adult.'] }
  ]
};
function showResults(reason, durSec){
  var list = VERDICTS[LANG];
  var total = run.ok + run.bad;
  els.resTitle.textContent = reason === 'time'
    ? tr('Время вышло', 'Time is up')
    : reason === 'stop'
      ? tr('Тренировка остановлена', 'Training stopped')
      : reason === 'done'
        ? (run.listKind === 'fluency'
            ? tr('Все задания на беглость пройдены', 'All fluency tasks completed')
            : run.hardMode
              ? tr('Все ошибки проработаны', 'All mistakes reviewed')
              : tr('Готово', 'Done'))
        : tr('Готово', 'Done');
  if(!total){
    els.verdict.textContent = tr('Ни одного ответа. Попробуй ещё раз.', 'No answers yet. Try again.');
    els.verdict.className = 'verdict g0';
  } else {
    var acc = run.ok / total * 100;
    var tier = list[list.length - 1];
    for(var i = 0; i < list.length; i++){
      if(acc >= list[i].min){ tier = list[i]; break; }
    }
    els.verdict.textContent = pick(tier.msgs);
    els.verdict.className = 'verdict ' + tier.cls;
  }
  if(reason === 'done' && (run.hardMode || run.listKind === 'fluency' || run.listKind === 'retry')){
    els.verdict.textContent = run.listKind === 'fluency'
      ? tr('Все задания на беглость пройдены — отличная скорость!', 'All fluency tasks completed — great speed!')
      : run.listKind === 'retry'
        ? tr('Все непройденные задания решены!', 'All skipped tasks are solved!')
        : tr('Все задания повторены — список пуст!', 'All tasks reviewed — the list is empty!');
    els.verdict.className = 'verdict g5';
  }
  els.rOk.textContent = run.ok;
  els.rOk.nextElementSibling.textContent = pluralOk(run.ok);
  els.rBad.textContent = run.bad;
  els.rBad.nextElementSibling.textContent = pluralErr(run.bad);
  els.rAcc.textContent = total ? Math.round(run.ok / total * 100) + '%' : '—';
  els.rAvg.textContent = run.tN ? fmtSec1(run.tSum / run.tN) : '—';
  els.rFast.textContent = run.tN ? fmtSec1(run.minMs) : '—';
  els.rSlow.textContent = run.tN ? fmtSec1(run.maxMs) : '—';
  els.rDur.textContent = fmt(durSec);
  els.misTitle.textContent = tr('Ошибки: ', 'Mistakes: ') + run.bad;
  if(!total){
    els.misList.innerHTML = '<div class="dim">' + tr('Ответов пока нет', 'No answers yet') + '</div>';
  } else if(!run.bad){
    els.misList.innerHTML = '<div class="none">' + tr('Ошибок нет', 'No mistakes') + '</div>';
  } else {
    els.misList.innerHTML = run.mistakes.map(function(m){
      return '<div class="mrow">' + m.ex.text +
        '<span class="ua">' + tr('вы: ', 'you: ') + m.ua + '</span>' +
        (m.ex.answerText ? '<span class="ua ok">' + tr('верно: ', 'correct: ') + m.ex.answerText + '</span>' : '') +
        '</div>';
    }).join('');
  }
  els.unsolvedCard.hidden = !run.unsolved.length;
  if(run.unsolved.length){
    els.unsolvedTitle.textContent = tr('Не решено: ', 'Not solved: ') + run.unsolved.length;
    els.unsolvedList.innerHTML = run.unsolved.map(function(x){
      return '<div class="mrow">' + x.text + '<span class="ua missed">' + tr('не решено', 'not solved') + '</span></div>';
    }).join('');
  } else {
    els.unsolvedList.innerHTML = '';
  }
  els.slowCard.hidden = !run.slow.length;
  if(run.slow.length){
    els.slowTitle.textContent = tr('Медленные, но верные: ', 'Slow but correct: ') + run.slow.length;
    els.slowList.innerHTML = run.slow.map(function(x){
      return '<div class="mrow">' + x.ex.text + '<span class="ua slow">' + fmtSec1(x.ms) + '</span></div>';
    }).join('');
  } else {
    els.slowList.innerHTML = '';
  }
}

/* ---------- события ---------- */
loadSettings();
if(SKILL === 'brackets' && !loadJSON('mathSkills.brackets.opsAll.v1', false)){
  S.ops = ['add', 'sub', 'mul', 'div'];
  saveJSON('mathSkills.brackets.opsAll.v1', true);
}
if(SKILL === 'units' && !loadJSON('mathSkills.units.cmRange.v3', false)){
  S.from = 1;
  S.to = 100;
  saveJSON('mathSkills.units.cmRange.v3', true);
  saveSettings();
}
normalize();
els.from.value = S.from;
els.to.value = S.to;
els.min.value = S.min;
els.sec.value = S.sec;
syncChips();
syncSegs();
hardCache = loadHard();
renderHard();
renderHistory();
poolInfo();

els.figWrap.addEventListener('toggle', function(){
  els.figSummary.textContent = els.figWrap.open
    ? tr('Скрыть фигуру', 'Hide the shape')
    : tr('Показать фигуру', 'Show the shape');
});

each(els.toChips.querySelectorAll('button'), function(b){
  b.addEventListener('click', function(){
    S.to = clampInt(b.getAttribute('data-v'), limits().min, limits().max, limits().max);
    if(S.from > S.to) S.from = S.to;
    els.from.value = S.from;
    els.to.value = S.to;
    syncChips();
    poolInfo();
    saveSettings();
  });
});
els.from.addEventListener('input', function(){
  S.from = clampInt(els.from.value, limits().min, limits().max, limits().min);
  poolInfo();
  saveSettings();
});
els.from.addEventListener('change', function(){
  normalize();
  els.from.value = S.from;
  els.to.value = S.to;
  syncChips();
  poolInfo();
  saveSettings();
});
els.to.addEventListener('input', function(){
  S.to = clampInt(els.to.value, limits().min, limits().max, limits().max);
  poolInfo();
  saveSettings();
});
els.to.addEventListener('change', function(){
  normalize();
  els.from.value = S.from;
  els.to.value = S.to;
  syncChips();
  poolInfo();
  saveSettings();
});

if(els.types){
  each(els.types.querySelectorAll('button'), function(b){
    b.addEventListener('click', function(){
      var v = b.getAttribute('data-v'), i = S.types.indexOf(v);
      if(i >= 0){
        if(S.types.length > 1) S.types.splice(i, 1);
      } else {
        S.types.push(v);
      }
      syncSegs();
      poolInfo();
      saveSettings();
    });
  });
}
/* звезда переключает звёздные задачи — решение повторным сложением/вычитанием */
function setStarGroup(on){
  S.star = !!on;
}

if(els.ops){
  each(els.ops.querySelectorAll('button'), function(b){
    b.addEventListener('click', function(){
      var v = b.getAttribute('data-v'), i = S.ops.indexOf(v);
      if(i >= 0){
        if(S.ops.length > 1) S.ops.splice(i, 1);
      } else {
        S.ops.push(v);
      }
      syncSegs();
      if(isProblems){ poolInfo(); renderHard(); }
      saveSettings();
    });
  });
}
if(els.star){
  els.star.addEventListener('click', function(){
    setStarGroup(!S.star);
    syncSegs();
    poolInfo();
    renderHard();
    saveSettings();
  });
}
each(document.querySelectorAll('#setup .seg[data-key="miss"] button'), function(b){
  b.addEventListener('click', function(){
    S.miss = b.getAttribute('data-v');
    syncSegs();
    saveSettings();
  });
});
each(document.querySelectorAll('#setup .seg[data-key="answer"] button'), function(b){
  b.addEventListener('click', function(){
    S.answer = b.getAttribute('data-v');
    syncSegs();
    saveSettings();
  });
});
each(document.querySelectorAll('#setup .seg[data-key="mode"] button'), function(b){
  b.addEventListener('click', function(){
    S.mode = b.getAttribute('data-v');
    syncSegs();
    saveSettings();
  });
});
els.min.addEventListener('input', function(){
  S.min = clampInt(els.min.value, 0, 300, 2);
  saveSettings();
});
els.min.addEventListener('change', function(){
  S.min = clampInt(els.min.value, 0, 300, 2);
  els.min.value = S.min;
  saveSettings();
});
els.sec.addEventListener('input', function(){
  S.sec = clampInt(els.sec.value, 0, 59, 0);
  saveSettings();
});
els.sec.addEventListener('change', function(){
  S.sec = clampInt(els.sec.value, 0, 59, 0);
  els.sec.value = S.sec;
  saveSettings();
});
if(els.carry){
  els.carry.addEventListener('change', function(){
    S.carry = els.carry.checked;
    saveSettings();
  });
}
els.sound.addEventListener('change', function(){
  S.sound = els.sound.checked;
  saveSettings();
});
els.soundTest.addEventListener('click', function(){
  unlockAudio();
  if(!audioCtx) return;
  tone(880, 0, 0.11, 'sine', 0.12);
  tone(1174.7, 0.085, 0.16, 'sine', 0.11);
});
els.startBtn.addEventListener('click', function(){
  normalize();
  saveSettings();
  startRun(null, 'normal');
});
els.hardBtn.addEventListener('click', function(){
  var list = visibleHard();
  if(list.length) startRun(list.slice(), 'hard');
});
els.clearHard.addEventListener('click', function(){
  hardCache = [];
  saveHard();
  renderHard();
});
els.clearHist.addEventListener('click', function(){
  saveJSON(K_HIST, []);
  renderHistory();
});
els.stopBtn.addEventListener('click', function(){ finish('stop'); });
els.againBtn.addEventListener('click', function(){ startRun(null, 'normal'); });
els.toSetupBtn.addEventListener('click', function(){
  renderHard();
  renderHistory();
  poolInfo();
  showScreen('setup');
});
els.slowBtn.addEventListener('click', function(){
  if(run && run.slow.length) startRun(run.slow.map(function(x){ return x.ex; }), 'fluency');
});
els.unsolvedBtn.addEventListener('click', function(){
  if(run && run.unsolved.length) startRun(run.unsolved.slice(), 'retry');
});

els.pad.addEventListener('click', function(e){
  var b = e.target.closest('button');
  if(!b) return;
  var k = b.getAttribute('data-k');
  if(k === 'del') backspace();
  else if(k === 'ok') submitTyped();
  else if(/^[0-9]$/.test(k)) typeDigit(k);
});
els.signpad.addEventListener('click', function(e){
  var b = e.target.closest('button');
  if(b) submitValue(b.getAttribute('data-s'), b);
});
els.tiles.addEventListener('click', function(e){
  var b = e.target.closest('button');
  if(b) submitValue(parseInt(b.getAttribute('data-v'), 10), b);
});

document.addEventListener('keydown', function(e){
  if(!els.game.classList.contains('active') || !run || !run.cur) return;
  if(e.target && /INPUT|TEXTAREA/.test(e.target.tagName)) return;
  if(run.cur.answerKind === 'sign'){
    if(e.key === '<' || e.key === '>'){ e.preventDefault(); submitValue(e.key); }
    else if(e.key === '='){ e.preventDefault(); submitValue('='); }
    return;
  }
  if(S.answer !== 'type') return;
  if(/^[0-9]$/.test(e.key)){ e.preventDefault(); typeDigit(e.key); }
  else if(e.key === 'Backspace'){ e.preventDefault(); backspace(); }
  else if(e.key === 'Enter'){ e.preventDefault(); submitTyped(); }
});
})();
