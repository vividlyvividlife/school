(function(){
'use strict';

var $ = function(id){ return document.getElementById(id); };
function each(list, fn){ Array.prototype.forEach.call(list, fn); }

var LANG = (document.documentElement.lang || 'ru').toLowerCase().indexOf('en') === 0 ? 'en' : 'ru';
function tr(ru, en){ return LANG === 'en' ? en : ru; }
function answerText(v){ return v === 'none' ? tr('Нельзя', 'Undefined') : String(v); }
function pluralEx(n){
  if(LANG === 'en') return n === 1 ? 'example' : 'examples';
  return plural(n, 'пример', 'примера', 'примеров');
}
function pluralErr(n){
  if(LANG === 'en') return n === 1 ? 'mistake' : 'mistakes';
  return plural(n, 'ошибка', 'ошибки', 'ошибок');
}

var S = { limit:18, from:0, ops:['add','sub'], carry:true, miss:'r', answer:'type', mode:'free', min:2, sec:0, sound:true, trickZero:false };
var OPS_ALL = ['add','sub','mul','div'];
var OP_SIGN = { add:'+', sub:'−', mul:'×', div:'÷' };
var SIGN_OP = { '+':'add', '−':'sub', '×':'mul', '÷':'div' };
var MAX_FACTOR = 10;
var K_SET = 'mathTrainer.settings.v1';
var K_HIST = 'mathTrainer.history.v1';
var K_HARD = 'mathTrainer.hard.v1';
var HARD_MAX = 60;
var screenName = 'setup';
var run = null, lastHard = false, lastHardList = [], lastHardTrack = false, lastHardKind = 'review', histCache = [], retryState = null;

var els = {
  limitChips: $('limitChips'), limitInput: $('limit'), fromInput: $('from'), carry: $('carry'),
  rangeHint: $('rangeHint'), carryHint: $('carryHint'), missHint: $('missHint'),
  trickZero: $('trickZero'), trickHint: $('trickHint'),
  minInput: $('min'), secInput: $('sec'), timeRow: $('timeRow'), sound: $('sound'),
  poolInfo: $('poolInfo'), startBtn: $('startBtn'),
  histList: $('histList'), clearHist: $('clearHist'),
  gInfo: $('gInfo'), scoreOk: $('scoreOk'), scoreBad: $('scoreBad'),
  timeWrap: $('timeWrap'), tfill: $('tfill'), tclock: $('tclock'),
  eqw: $('eqw'), eq: $('eq'), cap: $('cap'), pairInfo: $('pairInfo'), pad: $('pad'), tiles: $('tiles'), stopBtn: $('stopBtn'), cannotBtn: $('cannotBtn'),
  verdict: $('verdict'), advice: $('advice'), resTitle: $('resTitle'), rOk: $('rOk'), rBad: $('rBad'), rAcc: $('rAcc'), rAvg: $('rAvg'), rFast: $('rFast'), rSlow: $('rSlow'), rDur: $('rDur'),
  hardInfo: $('hardInfo'), hardList: $('hardList'), hardBtn: $('hardBtn'), clearHard: $('clearHard'), soundTest: $('soundTest'),
  misTitle: $('misTitle'), misList: $('misList'), slowCard: $('slowCard'), slowTitle: $('slowTitle'), slowList: $('slowList'), slowBtn: $('slowBtn'), pairsCard: $('pairsCard'), pairsList: $('pairsList'), retryCard: $('retryCard'), retryEq: $('retryEq'), retryBtns: $('retryBtns'), againBtn: $('againBtn'), toSetupBtn: $('toSetupBtn')
};

function showScreen(n){
  each(['setup','game','results'], function(id){
    $(id).classList.toggle('active', id === n);
  });
  screenName = n;
  window.scrollTo(0, 0);
}

/* наборы примеров: главное число (сумма, уменьшаемое, произведение, делимое) в границах from..limit */
function operandMin(){ return S.from <= 0 ? 0 : 1; }
function poolAdd(limit, carry, from){
  var out = [], a, b, s, lo = operandMin();
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
  var out = [], m, s, r, lo = operandMin(), m0 = carry ? 11 : lo;
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
  var out = [], a, b, p, lo = operandMin();
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
  var out = [], a, b, q, lo = operandMin(), b0 = Math.max(1, lo);
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
function missAmbiguous(a, b, r, opCode, miss){
  if(opCode === 'mul' && r === 0 && (miss === 'a' || miss === 'b' || miss === 'ab' || miss === 'rab')){
    if(miss === 'a') return b === 0;
    if(miss === 'b') return a === 0;
    return a === 0 || b === 0;
  }
  if(opCode === 'div' && a === 0 && (miss === 'b' || miss === 'ab' || miss === 'rab')) return true;
  return false;
}
function poolFor(op){
  var items;
  if(op === 'add') items = poolAdd(S.limit, S.carry, S.from);
  else if(op === 'sub') items = poolSub(S.limit, S.carry, S.from);
  else if(op === 'mul') items = poolMul(S.limit, S.from);
  else if(op === 'div') items = poolDiv(S.limit, S.from);
  else return [];
  if(S.miss === 'a' || S.miss === 'b' || S.miss === 'ab' || S.miss === 'rab'){
    items = items.filter(function(x){ return !missAmbiguous(x[0], x[1], x[2], op, S.miss); });
  }
  return items;
}
function hasAddSub(ops){ ops = ops || S.ops; return ops.indexOf('add') >= 0 || ops.indexOf('sub') >= 0; }
function hasMulDiv(ops){ ops = ops || S.ops; return ops.indexOf('mul') >= 0 || ops.indexOf('div') >= 0; }
function trickActive(){ return !!(S.trickZero && S.miss === 'r' && S.ops.indexOf('div') >= 0); }
function effectiveOps(){
  return S.ops.filter(function(o){ return !(S.miss === 'all' && (o === 'mul' || o === 'div')); });
}
function computeResult(op, a, b){
  if(op === '+') return a + b;
  if(op === '−') return a - b;
  if(op === '×') return a * b;
  if(op === '÷') return b ? a / b : NaN;
  return NaN;
}
function shuffle(arr){
  var a = arr.slice(), i, j, t;
  for(i = a.length - 1; i > 0; i--){ j = Math.floor(Math.random() * (i + 1)); t = a[i]; a[i] = a[j]; a[j] = t; }
  return a;
}
function makeDrawer(items){
  var rest = [];
  return function(){
    if(!rest.length) rest = shuffle(items);
    return rest.pop();
  };
}
/* перебор примеров для повторения по кругу: повторно берём только те, что ещё не отработаны */
function makeHardDrawer(r, all){
  var queue = [];
  function alive(it){
    for(var i = 0; i < r.hardRemaining.length; i++) if(r.hardRemaining[i].k === it.k) return true;
    return false;
  }
  return function(){
    var guard = 0;
    while(guard++ < 2000){
      if(!r.hardRemaining.length) return null;
      if(!queue.length) queue = shuffle(r.hardRemaining);
      var it = queue.pop();
      if(alive(it)) return it;
    }
    return null;
  };
}

function clampInt(v, min, max, dflt){
  v = parseInt(v, 10);
  if(!isFinite(v)) v = dflt;
  return Math.max(min, Math.min(max, v));
}
function clampLevel(v){ return clampInt(v, 1, 100, 18); }
function plural(n, one, few, many){
  n = Math.abs(n) % 100;
  var n1 = n % 10;
  if(n > 10 && n < 20) return many;
  if(n1 > 1 && n1 < 5) return few;
  if(n1 === 1) return one;
  return many;
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
  var locale = LANG === 'en' ? 'en-US' : 'ru-RU';
  return d.toLocaleDateString(locale, { day:'2-digit', month:'2-digit' }) + ' ' +
         d.toLocaleTimeString(locale, { hour:'2-digit', minute:'2-digit' });
}
function normalizeOps(v){
  var out = [];
  if(Array.isArray(v)){
    out = OPS_ALL.filter(function(o){ return v.indexOf(o) >= 0; });
  } else if(v === 'mix'){
    out = ['add','sub'];
  } else if(OPS_ALL.indexOf(v) >= 0){
    out = [v];
  }
  return out.length ? out : ['add','sub'];
}
function opsLabel(ops){
  ops = normalizeOps(ops);
  var names = { add:'+', sub:'−', mul:'×', div:'÷' };
  if(ops.length === 1) return tr('только ', 'only ') + names[ops[0]];
  if(ops.length === 2 && ops[0] === 'add' && ops[1] === 'sub') return tr('сложение и вычитание', 'addition and subtraction');
  if(ops.length === 2 && ops[0] === 'mul' && ops[1] === 'div') return tr('умножение и деление', 'multiplication and division');
  if(ops.length === 4) return tr('все действия', 'all operations');
  return ops.map(function(o){ return names[o]; }).join(', ');
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

function loadSettings(){
  var v = loadJSON(K_SET, null);
  if(!v || typeof v !== 'object') return;
  if(v.limit !== undefined) S.limit = clampLevel(v.limit);
  if(v.from !== undefined) S.from = clampInt(v.from, 0, 100, 0);
  if(v.ops !== undefined) S.ops = normalizeOps(v.ops);
  if(typeof v.carry === 'boolean') S.carry = v.carry;
  if(['r','a','b','ab','rab','all'].indexOf(v.miss) >= 0) S.miss = v.miss;
  if(v.answer === 'tiles') S.answer = 'tiles9';
  if(['type','tiles6','tiles9','tiles12'].indexOf(v.answer) >= 0) S.answer = v.answer;
  if(['free','timed'].indexOf(v.mode) >= 0) S.mode = v.mode;
  if(v.min !== undefined) S.min = clampInt(v.min, 0, 300, 2);
  if(v.sec !== undefined) S.sec = clampInt(v.sec, 0, 59, 0);
  if(typeof v.sound === 'boolean') S.sound = v.sound;
  if(typeof v.trickZero === 'boolean') S.trickZero = v.trickZero;
}
function saveSettings(){ saveJSON(K_SET, S); }

/* ошибки для повторения: хранятся как {a,b,op,ts}, op — '+', '−', '×' или '÷' */
function loadHard(){
  var h = loadJSON(K_HARD, []);
  if(!Array.isArray(h)) h = [];
  return h.filter(function(x){
    if(!x || typeof x.a !== 'number' || typeof x.b !== 'number') return false;
    if(['+','−','×','÷'].indexOf(x.op) < 0) return false;
    if(x.op === '÷') return x.b > 0 && x.a % x.b === 0;
    return true;
  });
}
function hardKey(x){ return x.a + x.op + x.b; }
function saveHard(list){ saveJSON(K_HARD, list.slice(0, HARD_MAX)); }
function addHard(items){
  if(!items.length) return;
  var seen = {}, out = [];
  items.forEach(function(x){
    var k = hardKey(x);
    if(!seen[k]){ seen[k] = 1; out.push(x); }
  });
  loadHard().forEach(function(x){
    var k = hardKey(x);
    if(!seen[k]){ seen[k] = 1; out.push(x); }
  });
  out.sort(function(p, q){ return (q.ts || 0) - (p.ts || 0); });
  saveHard(out);
}
function removeHard(keys){
  saveHard(loadHard().filter(function(x){ return keys.indexOf(hardKey(x)) < 0; }));
}
function exStr(x){ return x.a + ' ' + x.op + ' ' + x.b; }
function exChips(list){
  return list.map(function(x){ return '<span class="ex">' + exStr(x) + '</span>'; }).join('');
}
function hardInfo(){
  var list = loadHard();
  var n = list.length;
  els.hardInfo.textContent = n
    ? tr('Для повторения: ', 'To review: ') + n + ' ' + pluralEx(n)
    : tr('Ошибок для повторения пока нет', 'No mistakes to review yet');
  els.hardList.innerHTML = exChips(list.slice().sort(function(p, q){
    return p.a - q.a || p.b - q.b;
  }));
  els.hardList.hidden = !n;
  els.hardBtn.disabled = !n;
  els.clearHard.hidden = !n;
}

/* звук: короткие синтезированные сигналы (Web Audio), без внешних файлов */
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

function applyUrl(){
  var p;
  try{ p = new URLSearchParams(location.search); }catch(e){ return; }
  if(p.has('limit')) S.limit = clampLevel(p.get('limit'));
  if(p.has('from')) S.from = clampInt(p.get('from'), 0, 100, 0);
  if(p.has('ops')){
    var raw = p.get('ops');
    S.ops = normalizeOps(raw.indexOf(',') >= 0 ? raw.split(',') : raw);
  }
  if(p.has('carry')) S.carry = p.get('carry') !== '0';
  if(['r','a','b','ab','rab','all'].indexOf(p.get('miss')) >= 0) S.miss = p.get('miss');
  if(p.get('answer') === 'tiles') S.answer = 'tiles9';
  if(['type','tiles6','tiles9','tiles12'].indexOf(p.get('answer')) >= 0) S.answer = p.get('answer');
  if(['free','timed'].indexOf(p.get('mode')) >= 0) S.mode = p.get('mode');
  if(p.has('min')) S.min = clampInt(p.get('min'), 0, 300, 2);
  if(p.has('sec')) S.sec = clampInt(p.get('sec'), 0, 59, 0);
  if(p.has('sound')) S.sound = p.get('sound') !== '0';
  if(p.has('trick')) S.trickZero = p.get('trick') !== '0';
}

function syncChips(){
  each(els.limitChips.querySelectorAll('button'), function(b){
    b.classList.toggle('on', parseInt(b.getAttribute('data-v'), 10) === S.limit);
  });
}
function syncSegs(){
  each(document.querySelectorAll('.seg'), function(seg){
    var key = seg.getAttribute('data-key');
    each(seg.querySelectorAll('button'), function(b){
      var v = b.getAttribute('data-v');
      var on = key === 'ops' ? S.ops.indexOf(v) >= 0 : String(S[key]) === v;
      b.classList.toggle('on', on);
    });
  });
}
function updateHints(){
  var addsub = hasAddSub(), muldiv = hasMulDiv();
  els.carry.disabled = !addsub;
  els.carryHint.hidden = !muldiv;
  var parts = [];
  if(muldiv){
    var lo = operandMin();
    var factors = lo === 0
      ? tr('множители — от 0 до 10, делители — от 1 до 10', 'factors range from 0 to 10, divisors from 1 to 10')
      : tr('множители и делители — от 1 до 10', 'factors and divisors range from 1 to 10');
    parts.push(tr('Для «×» и «÷» границы «от» и «до» относятся к произведению или делимому; ', 'For × and ÷, “from” and “to” refer to the product or dividend; ') + factors + '.');
  }
  els.rangeHint.hidden = !parts.length;
  els.rangeHint.textContent = parts.join(' ');
  var canTrick = S.ops.indexOf('div') >= 0 && S.miss === 'r';
  els.trickZero.disabled = !canTrick;
  els.trickHint.hidden = !canTrick && !S.trickZero;
  els.trickHint.textContent = !canTrick
    ? tr('Доступно при делении, если пропущен ответ.', 'Available for division when the answer is missing.')
    : S.trickZero
      ? tr('Иногда в примерах встретится деление на 0. Верный ответ — «Нельзя».', 'Occasionally a problem will divide by zero. The correct answer is “Undefined”.')
      : '';
  var excl = S.miss === 'all' && muldiv;
  els.missHint.hidden = !excl;
  if(excl){
    els.missHint.textContent = addsub
      ? tr('«X + X = 10» — только сложение и вычитание: «×» и «÷» в этом режиме не участвуют.', '“X + X = 10” uses only addition and subtraction: × and ÷ are not included in this mode.')
      : tr('Выберите «+» или «−»: режим «X + X = 10» работает только со сложением и вычитанием.', 'Choose + or −: “X + X = 10” works only with addition and subtraction.');
  }
}
function poolCount(){
  var n = 0;
  effectiveOps().forEach(function(o){ n += poolFor(o).length; });
  return n;
}
function poolInfo(){
  var n = poolCount();
  if(n){
    els.poolInfo.textContent = tr('В наборе: ', 'In the set: ') + n + ' ' + pluralEx(n);
  } else if(S.miss === 'all' && !hasAddSub()){
    els.poolInfo.textContent = tr('Режим «X + X = 10» работает только с «+» и «−»', '“X + X = 10” works only with + and −');
  } else {
    els.poolInfo.textContent = tr('Для этих настроек примеров нет', 'No examples for these settings');
  }
  els.startBtn.disabled = !n;
}
function syncUI(){
  els.limitInput.value = S.limit;
  els.fromInput.value = S.from;
  syncChips();
  syncSegs();
  els.carry.checked = S.carry;
  updateHints();
  els.minInput.value = S.min;
  els.secInput.value = S.sec;
  els.sound.checked = S.sound;
  els.trickZero.checked = S.trickZero;
  els.timeRow.style.display = S.mode === 'timed' ? '' : 'none';
  poolInfo();
  hardInfo();
}

function rangeLabel(){ return (S.from > 0 ? tr('от ', 'from ') + S.from + tr(' до ', ' to ') + S.limit : tr('до ', 'up to ') + S.limit); }

function start(){
  unlockAudio();
  S.limit = clampLevel(els.limitInput.value);
  els.limitInput.value = S.limit;
  S.from = Math.min(clampInt(els.fromInput.value, 0, 100, 0), S.limit);
  els.fromInput.value = S.from;
  S.min = clampInt(els.minInput.value, 0, 300, 2);
  S.sec = clampInt(els.secInput.value, 0, 59, 0);
  if(S.mode === 'timed' && S.min * 60 + S.sec < 5){
    S.sec = 5;
  }
  els.minInput.value = S.min;
  els.secInput.value = S.sec;
  saveSettings();

  var ops = effectiveOps(), drawers = {}, useOps = [];
  ops.forEach(function(o){
    var p = poolFor(o);
    if(p.length){ drawers[o] = makeDrawer(p); useOps.push(o); }
  });
  if(!useOps.length) return;

  run = {
    hardMode: false, trackHard: false, listKind: 'review',
    next: null, ops: useOps, drawers: drawers,
    cur: null, typed: '', locked: false, done: false, tok: 0, vmax: S.limit,
    ok: 0, bad: 0, tSum: 0, tN: 0, minMs: 0, maxMs: 0, records: [], mistakes: [], slow: [],
    curDone: false, start: 0, total: 0, deadline: 0, timer: null, shownAt: 0,
    exCount: 0, trickAt: 5 + Math.floor(Math.random() * 4)
  };
  lastHard = false;
  lastHardList = [];

  els.gInfo.textContent = rangeLabel() + ' · ' + opsLabel(S.ops) +
    (S.carry && hasAddSub() ? tr(' · с переходом', ' · with carry') + (hasMulDiv() ? ' (+, −)' : '') : '');
  els.pad.hidden = isTiles();
  els.tiles.hidden = !isTiles();
  els.tiles.innerHTML = '';
  updateScore();
  showScreen('game');
  if(document.activeElement && document.activeElement.blur) document.activeElement.blur();
  startClock();
  nextExercise();
}

function startHard(){ startHardList(loadHard(), true, 'review'); }
function startHardList(h, track, kind){
  unlockAudio();
  if(!h.length){ hardInfo(); return; }
  kind = kind === 'fluency' ? 'fluency' : 'review';
  S.min = clampInt(els.minInput.value, 0, 300, 2);
  S.sec = clampInt(els.secInput.value, 0, 59, 0);
  if(S.mode === 'timed' && S.min * 60 + S.sec < 5) S.sec = 5;
  els.minInput.value = S.min;
  els.secInput.value = S.sec;
  saveSettings();

  var items = h.map(function(x){
    var r = computeResult(x.op, x.a, x.b);
    return { a: x.a, b: x.b, r: r, op: x.op, k: x.a + x.op + x.b };
  }).filter(function(x){
    return isFinite(x.r) && (x.op !== '÷' || x.a % x.b === 0) &&
      !missAmbiguous(x.a, x.b, x.r, SIGN_OP[x.op], S.miss);
  });
  if(!items.length){ hardInfo(); return; }
  run = {
    hardMode: true, trackHard: !!track, listKind: kind,
    next: null, ops: [], drawers: null, hardRemaining: items.slice(),
    cur: null, typed: '', locked: false, done: false, tok: 0, vmax: S.limit,
    ok: 0, bad: 0, tSum: 0, tN: 0, minMs: 0, maxMs: 0, records: [], mistakes: [], slow: [],
    curDone: false, start: 0, total: 0, deadline: 0, timer: null, shownAt: 0
  };
  run.next = makeHardDrawer(run, items);
  lastHard = true;
  lastHardList = h;
  lastHardTrack = !!track;
  lastHardKind = kind;
  els.gInfo.textContent = (kind === 'fluency' ? tr('беглость', 'fluency') : tr('ошибки', 'mistakes')) +
    ' · ' + items.length + ' ' + pluralEx(items.length) +
    ' · ' + (S.mode === 'timed' ? tr('на время', 'timed') : tr('тренировка', 'practice'));
  els.pad.hidden = isTiles();
  els.tiles.hidden = !isTiles();
  els.tiles.innerHTML = '';
  updateScore();
  showScreen('game');
  if(document.activeElement && document.activeElement.blur) document.activeElement.blur();
  startClock();
  nextExercise();
}

function updateScore(){
  els.scoreOk.textContent = run.ok;
  els.scoreBad.textContent = run.bad;
}

function startClock(){
  run.start = Date.now();
  if(S.mode === 'timed'){
    run.total = Math.max(5, S.min * 60 + S.sec) * 1000;
    run.deadline = run.start + run.total;
    els.timeWrap.classList.remove('free');
  } else {
    els.timeWrap.classList.add('free');
  }
  run.timer = setInterval(tick, 100);
  tick();
}
function tick(){
  if(!run || run.done) return;
  var now = Date.now();
  if(S.mode === 'timed'){
    var left = Math.max(0, run.deadline - now);
    var frac = left / run.total;
    els.tfill.style.width = (frac * 100).toFixed(1) + '%';
    els.tfill.className = 'tfill' + (frac <= 0.15 ? ' low' : frac <= 0.4 ? ' warn' : '');
    els.tclock.textContent = fmt(left / 1000);
    if(left <= 0) finish('time');
  } else {
    els.tclock.textContent = tr('Время: ', 'Time: ') + fmt((now - run.start) / 1000);
  }
}

function drawBase(){
  if(run.hardMode){
    var x = run.next();
    if(!x) return null;
    return { a: x.a, b: x.b, r: x.r, op: x.op };
  }
  var op = run.ops[Math.floor(Math.random() * run.ops.length)];
  var it = run.drawers[op]();
  return { a: it[0], b: it[1], r: it[2], op: OP_SIGN[op] };
}

function solutionsFor(op, R, lim){
  var out = [], x, y, a, b, lo = operandMin();
  if(op === '+'){
    for(x = lo; x * 2 <= R; x++){
      y = R - x;
      if(y < lo) continue;
      if(S.carry){
        if((x % 10) + (y % 10) < 10) continue;
        if(R % 10 === 0 && R <= 20) continue;
      }
      out.push([x, y]);
    }
  } else {
    var a0 = S.carry ? 11 : lo;
    for(a = a0; a <= lim; a++){
      b = a - R;
      if(b < lo) continue;
      if(b !== 0 && b % 10 === 0) continue;
      if(S.carry){
        if((a % 10) >= (b % 10)) continue;
        if(a <= 20 && a % 10 === 0 && b > 10) continue;
      }
      out.push([a, b]);
    }
  }
  return out;
}

function nextExercise(){
  if(!run || run.done) return;
  if(!run.hardMode && trickActive() && run.ops.indexOf('div') >= 0 && run.exCount >= run.trickAt){
    startTrick();
    run.exCount++;
    run.trickAt = run.exCount + 7 + Math.floor(Math.random() * 4);
    return;
  }
  var base = drawBase();
  if(!base){ finish('done'); return; }
  els.cannotBtn.hidden = (S.miss === 'all' && !run.hardMode);
  els.pad.hidden = isTiles();
  els.tiles.hidden = !isTiles();
  els.tiles.innerHTML = '';
  run.vmax = run.hardMode ? Math.max(base.a, base.b, base.r) : S.limit;
  run.typed = '';
  run.curDone = false;
  run.shownAt = Date.now();
  els.eqw.className = 'eqwrap';
  els.cap.textContent = '';
  els.cap.className = 'cap';
  run.exCount++;


  if(S.miss === 'all' && !run.hardMode){
    var sols, tries = 0;
    do{
      sols = solutionsFor(base.op, base.r, run.vmax);
      if(sols.length >= 2 && sols.length <= 12) break;
      if(run.hardMode) break;
      base = drawBase();
      run.vmax = S.limit;
    }while(tries++ < 20);
    if(!sols.length){
      sols = [base.op === '+' ? [Math.min(base.a, base.b), Math.max(base.a, base.b)] : [base.a, base.b]];
    }
    run.cur = { a: base.a, b: base.b, r: base.r, op: base.op, miss: 'all',
      sols: sols, found: [], slots: ['', ''], active: 0, mistakeLogged: false };
    renderAll();
    return;
  }

  els.pairInfo.hidden = true;
  els.pairInfo.innerHTML = '';
  var miss = S.miss === 'all' ? 'r' : S.miss;
  if(miss === 'rab') miss = ['r','a','b'][Math.floor(Math.random() * 3)];
  else if(miss === 'ab') miss = Math.random() < 0.5 ? 'a' : 'b';
  run.cur = { a: base.a, b: base.b, r: base.r, op: base.op, miss: miss };
  renderEq();
  if(isTiles()) buildTiles();
}

function startTrick(){
  var lo = Math.max(1, S.from);
  var a = lo + Math.floor(Math.random() * Math.max(1, S.limit - lo + 1));
  run.vmax = S.limit;
  run.typed = '';
  run.curDone = false;
  run.shownAt = Date.now();
  run.cur = { a: a, b: 0, r: null, op: '÷', miss: 'r', trick: true };
  els.eqw.className = 'eqwrap';
  els.cap.textContent = '';
  els.cap.className = 'cap';
  els.pairInfo.hidden = true;
  els.pairInfo.innerHTML = '';
  els.eq.innerHTML = '<span class="opd">' + a + '</span><span class="op">÷</span><span class="opd">0</span>' +
    '<span class="op">=</span><span class="slot empty" id="slot">?</span>';
  els.cannotBtn.hidden = false;
  if(isTiles()){
    els.pad.hidden = true;
    els.tiles.hidden = false;
    els.tiles.innerHTML = '';
    buildTrickTiles();
  } else {
    els.pad.hidden = false;
    els.tiles.hidden = true;
    els.tiles.innerHTML = '';
  }
}

function buildTrickTiles(){
  var c = run.cur, n = tileCount();
  var max = Math.max(S.limit, n - 1);
  var nums = [0, c.a, c.a - 1, c.a + 1, Math.floor(c.a / 2), 1, 2, 3];
  var opts = [];
  nums.forEach(function(v){
    if(opts.length < n - 1 && v >= 0 && v <= max && opts.indexOf(v) < 0) opts.push(v);
  });
  var guard = 0;
  while(opts.length < n - 1 && guard++ < 500){
    var v = Math.floor(Math.random() * (max + 1));
    if(opts.indexOf(v) < 0) opts.push(v);
  }
  opts.sort(function(x, y){ return x - y; });
  opts.push('none');
  els.tiles.classList.toggle('dense', n >= 10);
  els.tiles.innerHTML = opts.map(function(v){
    return '<button type="button" data-v="' + v + '"' + (v === 'none' ? ' class="cannot"' : '') + '>' +
      (v === 'none' ? '<span class="tlabel">' + answerText(v) + '</span>' : answerText(v)) + '</button>';
  }).join('');
  fitCannotTile();
}

function judgeTrick(val, btn){
  if(!run || run.locked || run.done || !run.cur || !run.cur.trick) return;
  unlockAudio();
  var cur = run.cur, dt = Date.now() - run.shownAt;
  var correct = val === 'none';
  run.locked = true;
  run.curDone = true;
  run.tok++;
  run.tSum += dt;
  run.tN++;
  if(!run.minMs || dt < run.minMs) run.minMs = dt;
  if(dt > run.maxMs) run.maxMs = dt;
  run.records.push({ a: cur.a, b: 0, op: '÷', ms: dt, ok: correct });
  var tok = run.tok;
  var good = isTiles() ? els.tiles.querySelector('button[data-v="none"]') : null;
  each(els.tiles.querySelectorAll('button'), function(b){ b.disabled = true; });
  fillSlot(answerText(val));
  if(correct){
    run.ok++;
    playCorrect();
    if(btn) btn.classList.add('correct');
    els.eqw.classList.add('ok');
    els.cap.textContent = tr('Верно! На 0 делить нельзя.', 'Correct! You cannot divide by zero.');
    els.cap.className = 'cap ok';
    setTimeout(function(){
      if(run && run.tok === tok && !run.done){ run.locked = false; nextExercise(); }
    }, 900);
  } else {
    run.bad++;
    playWrong();
    run.mistakes.push({ q: cur.a + ' ÷ 0 = ?', ua: val });
    if(navigator.vibrate){ try{ navigator.vibrate(80); }catch(e){} }
    if(btn) btn.classList.add('wrong');
    if(good) good.classList.add('correct');
    els.eqw.classList.add('bad');
    els.cap.textContent = tr('Правильный ответ: Нельзя', 'Correct answer: Undefined');
    els.cap.className = 'cap bad';
    setTimeout(function(){
      if(run && run.tok === tok && !run.done){ run.locked = false; nextExercise(); }
    }, 1500);
  }
  updateScore();
}

function eqHtml(c, slot){
  function cell(v){ return '<span class="opd">' + v + '</span>'; }
  return (c.miss === 'a' ? slot : cell(c.a)) +
    '<span class="op">' + c.op + '</span>' +
    (c.miss === 'b' ? slot : cell(c.b)) +
    '<span class="op">=</span>' +
    (c.miss === 'r' ? slot : cell(c.r));
}
function renderEq(){
  els.eq.innerHTML = eqHtml(run.cur, '<span class="slot empty" id="slot"></span>');
}

function renderAll(){
  var c = run.cur;
  var slot0 = '<span class="slot empty" id="slot0"></span>';
  var slot1 = '<span class="slot empty" id="slot1"></span>';
  els.eq.innerHTML = slot0 + '<span class="op">' + c.op + '</span>' + slot1 +
    '<span class="op">=</span><span class="opd">' + c.r + '</span>';
  els.pairInfo.hidden = false;
  els.cap.textContent = tr('Введи два числа, между ними — OK', 'Enter two numbers, then press OK');
  els.cap.className = 'cap';
  paintAll();
  updatePairInfo();
}
function paintAll(){
  var c = run.cur;
  var s0 = $('slot0'), s1 = $('slot1');
  if(!s0 || !s1) return;
  s0.textContent = c.slots[0];
  s1.textContent = c.slots[1];
  s0.classList.toggle('empty', c.slots[0] === '');
  s1.classList.toggle('empty', c.slots[1] === '');
  s0.classList.toggle('active', c.active === 0);
  s1.classList.toggle('active', c.active === 1);
}
function updatePairInfo(){
  var c = run.cur;
  var txt = tr('Найдено <b>', 'Found <b>') + c.found.length + tr('</b> из ', '</b> of ') + c.sols.length;
  if(c.found.length){
    txt += ' · ' + c.found.map(function(p){
      return '<span class="foundpair">' + p[0] + ' ' + c.op + ' ' + p[1] + '</span>';
    }).join('');
  }
  els.pairInfo.innerHTML = txt;
}

function paint(){
  var slot = $('slot');
  if(!slot) return;
  slot.textContent = run.typed;
  slot.classList.toggle('empty', run.typed === '');
}

function pressAll(k){
  var c = run.cur;
  var maxLen = String(run.vmax).length;
  if(k === 'del'){
    if(c.slots[c.active] !== '') c.slots[c.active] = c.slots[c.active].slice(0, -1);
    else if(c.active === 1) c.active = 0;
    paintAll();
    return;
  }
  if(k === 'ok'){
    if(c.active === 0){
      if(c.slots[0] !== ''){ c.active = 1; paintAll(); }
    } else if(c.slots[1] !== ''){
      submitPair();
    }
    return;
  }
  if(c.slots[c.active].length >= maxLen) return;
  var next = c.slots[c.active] + k;
  if(parseInt(next, 10) > run.vmax) return;
  c.slots[c.active] = next;
  paintAll();
}

function submitPair(){
  var c = run.cur;
  if(!c || run.locked || run.done) return;
  var x = parseInt(c.slots[0], 10), y = parseInt(c.slots[1], 10);
  if(!isFinite(x) || !isFinite(y)) return;
  var mathOk = c.op === '+' ? (x + y === c.r) : (x - y === c.r);
  var key = c.op === '+' ? [Math.min(x, y), Math.max(x, y)] : [x, y];
  var dup = c.found.some(function(p){ return p[0] === key[0] && p[1] === key[1]; });
  var allowed = c.sols.some(function(p){ return p[0] === key[0] && p[1] === key[1]; });
  if(mathOk && allowed && !dup){
    var dt = Date.now() - run.shownAt;
    run.shownAt = Date.now();
    c.found.push(key);
    run.ok++;
    run.tok++;
    run.tSum += dt; run.tN++;
    if(!run.minMs || dt < run.minMs) run.minMs = dt;
    if(dt > run.maxMs) run.maxMs = dt;
    run.records.push({ a: c.a, b: c.b, op: c.op, ms: dt, ok: true });
    playCorrect();
    c.slots = ['', '']; c.active = 0;
    paintAll(); updatePairInfo(); updateScore();
    if(c.found.length >= c.sols.length){
      run.curDone = true;
      var tok = run.tok;
      run.locked = true;
      els.cap.textContent = tr('Все пары найдены!', 'All pairs found!');
      els.cap.className = 'cap ok';
      setTimeout(function(){
        if(run && run.tok === tok && !run.done){ run.locked = false; nextExercise(); }
      }, 700);
    } else {
      els.cap.textContent = tr('Верно!', 'Correct!');
      els.cap.className = 'cap ok';
    }
    return;
  }
  if(dup && mathOk && allowed){
    els.cap.textContent = tr('Такая пара уже есть', 'This pair is already there');
    els.cap.className = 'cap';
    c.slots = ['', '']; c.active = 0; paintAll();
    return;
  }
  run.bad++;
  var wdt = Date.now() - run.shownAt;
  run.tok++;
  run.tSum += wdt; run.tN++;
  if(!run.minMs || wdt < run.minMs) run.minMs = wdt;
  if(wdt > run.maxMs) run.maxMs = wdt;
  run.records.push({ a: c.a, b: c.b, op: c.op, ms: wdt, ok: false });
  playWrong();
  if(navigator.vibrate){ try{ navigator.vibrate(80); }catch(e){} }
  if(!c.mistakeLogged){
    c.mistakeLogged = true;
    run.mistakes.push({ q: '□ ' + c.op + ' □ = ' + c.r, ua: x + ' ' + c.op + ' ' + y, miss: 'all' });
  }
  c.slots = ['', '']; c.active = 0; paintAll(); updateScore();
  els.cap.textContent = (mathOk && !allowed && S.carry) ? tr('Нужен переход через десяток', 'A carry over ten is required') : tr('Неверно', 'Incorrect');
  els.cap.className = 'cap bad';
  run.locked = true;
  setTimeout(function(){ if(run && !run.done){ run.locked = false; run.shownAt = Date.now(); } }, 500);
}

function press(k){
  if(!run || run.locked || run.done || !run.cur) return;
  unlockAudio();
  if(k === 'none'){
    if(run.cur.trick) judgeTrick('none', null);
    else if(run.cur.miss !== 'all') judge('none', null);
    return;
  }
  if(run.cur.trick){
    if(k === 'del'){ run.typed = run.typed.slice(0, -1); paint(); return; }
    if(k === 'ok'){ if(run.typed !== '') judgeTrick(parseInt(run.typed, 10), null); return; }
    var tmax = String(run.vmax).length;
    if(run.typed.length >= tmax) return;
    run.typed += k;
    paint();
    if(run.typed.length >= tmax) judgeTrick(parseInt(run.typed, 10), null);
    return;
  }
  if(run.cur.miss === 'all'){ pressAll(k); return; }
  if(k === 'del'){ run.typed = run.typed.slice(0, -1); paint(); return; }
  if(k === 'ok'){ submit(); return; }
  var maxLen = String(run.vmax).length;
  if(run.typed.length >= maxLen) return;
  run.typed += k;
  paint();
  if(run.typed.length >= maxLen || parseInt(run.typed + '0', 10) > run.vmax) submit();
}

function isTiles(){
  if(S.miss === 'all' && !(run && run.hardMode)) return false;
  return String(S.answer).indexOf('tiles') === 0;
}
function tileCount(){
  var n = parseInt(String(S.answer).replace('tiles', ''), 10);
  return n === 6 || n === 12 ? n : 9;
}

function buildTiles(){
  var c = run.cur;
  var correct = c.miss === 'r' ? c.r : c.miss === 'a' ? c.a : c.b;
  var n = tileCount(), numerics = n - 1;
  var max = Math.max(run.vmax, n - 1, correct);
  var opts = [correct];
  var cands = shuffle([correct - 1, correct + 1, correct - 2, correct + 2, correct - 10, correct + 10, 0, 1, 2, 3]);
  var i, guard;
  for(i = 0; i < cands.length && opts.length < numerics; i++){
    if(cands[i] >= 0 && cands[i] <= max && opts.indexOf(cands[i]) < 0) opts.push(cands[i]);
  }
  guard = 0;
  while(opts.length < numerics && guard++ < 500){
    var v = Math.floor(Math.random() * (max + 1));
    if(opts.indexOf(v) < 0) opts.push(v);
  }
  opts.sort(function(x, y){ return x - y; });
  opts.push('none');
  els.tiles.classList.toggle('dense', n >= 10);
  els.tiles.innerHTML = opts.map(function(v){
    return '<button type="button" data-v="' + v + '"' + (v === 'none' ? ' class="cannot"' : '') + '>' +
      (v === 'none' ? '<span class="tlabel">' + answerText(v) + '</span>' : answerText(v)) + '</button>';
  }).join('');
  fitCannotTile();
}

function fitCannotTile(){
  if(!els.tiles || els.tiles.hidden) return;
  var btn = els.tiles.querySelector('button.cannot');
  var label = btn && btn.querySelector('.tlabel');
  if(!label) return;
  var num = els.tiles.querySelector('button:not(.cannot)');
  var base = num ? parseFloat(getComputedStyle(num).fontSize) : 20;
  btn.style.fontSize = base + 'px';
  var cs = getComputedStyle(btn);
  var avail = btn.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
  var textW = label.getBoundingClientRect().width;
  if(avail > 0 && textW > avail - 2){
    btn.style.fontSize = Math.max(9, Math.floor(base * (avail - 2) / textW)) + 'px';
  }
}
window.addEventListener('resize', fitCannotTile);

function fillSlot(v){
  var slot = $('slot');
  if(!slot) return;
  slot.textContent = String(v);
  slot.classList.remove('empty');
}

function submit(){
  if(!run || run.locked || run.done || !run.cur || run.typed === '') return;
  judge(parseInt(run.typed, 10), null);
}

function judge(val, tileBtn){
  if(!run || run.locked || run.done || !run.cur) return;
  var cur = run.cur;
  var need = cur.miss === 'r' ? cur.r : cur.miss === 'a' ? cur.a : cur.b;
  var dt = Date.now() - run.shownAt;
  var correct = val === need;
  run.locked = true;
  run.tSum += dt;
  run.tN++;
  run.tok++;
  run.curDone = true;
  if(!run.minMs || dt < run.minMs) run.minMs = dt;
  if(dt > run.maxMs) run.maxMs = dt;
  run.records.push({ a: cur.a, b: cur.b, op: cur.op, ms: dt, ok: correct });
  var tok = run.tok;
  if(correct){
    run.ok++;
    playCorrect();
    var hk = cur.a + cur.op + cur.b;
    if(run.trackHard){
      removeHard([hk]);
      run.hardRemaining = run.hardRemaining.filter(function(x){ return x.k !== hk; });
    } else if(run.listKind === 'fluency'){
      run.hardRemaining = run.hardRemaining.filter(function(x){ return x.k !== hk; });
    }
    if(tileBtn) tileBtn.classList.add('correct');
    if(isTiles()) fillSlot(val);
    els.eqw.classList.add('ok');
    els.cap.textContent = tr('Верно', 'Correct');
    els.cap.className = 'cap ok';
    setTimeout(function(){
      if(run.tok === tok && !run.done){ run.locked = false; nextExercise(); }
    }, 380);
  } else {
    run.bad++;
    playWrong();
    run.mistakes.push({ q: cur.a + ' ' + cur.op + ' ' + cur.b + ' = ' + cur.r, ua: answerText(val) });
    if(navigator.vibrate){ try{ navigator.vibrate(80); }catch(e){} }
    if(tileBtn){
      tileBtn.classList.add('wrong');
      var good = els.tiles.querySelector('button[data-v="' + need + '"]');
      if(good) good.classList.add('correct');
    }
    if(tileBtn || val === 'none') fillSlot(answerText(val));
    els.eqw.classList.add('bad');
    els.cap.textContent = tr('Правильный ответ: ', 'Correct answer: ') + need;
    els.cap.className = 'cap bad';
    setTimeout(function(){
      if(run.tok === tok && !run.done){ run.locked = false; nextExercise(); }
    }, 1500);
  }
  updateScore();
}

function collectErrors(){
  var now = Date.now(), seen = {}, out = [];
  function add(a, b, op){
    if(op === '÷' && b === 0) return;
    var k = a + op + b;
    if(seen[k]) return;
    seen[k] = 1;
    out.push({ a: a, b: b, op: op, ts: now });
  }
  run.records.forEach(function(r){
    if(!r.ok) add(r.a, r.b, r.op);
  });
  run.mistakes.forEach(function(m){
    if(m.missed && typeof m.a === 'number') add(m.a, m.b, m.op);
  });
  return out;
}

function collectSlow(errors){
  var out = [], okRecs = [], seen = {}, errSeen = {}, i, sum = 0;
  errors.forEach(function(x){ errSeen[x.a + x.op + x.b] = 1; });
  run.records.forEach(function(r){
    if(r.ok) okRecs.push(r);
  });
  if(run.tN < 4 || !okRecs.length) return out;
  for(i = 0; i < okRecs.length; i++) sum += okRecs[i].ms;
  var avg = sum / okRecs.length, thr = avg * 1.2;
  okRecs.forEach(function(r){
    if(r.op === '÷' && r.b === 0) return;
    var k = r.a + r.op + r.b;
    if(errSeen[k] || seen[k] || r.ms < thr) return;
    seen[k] = 1;
    out.push({ a: r.a, b: r.b, op: r.op, ms: r.ms, avg: avg, ts: Date.now() });
  });
  return out;
}

function markUnsolved(){
  if(!run.cur || run.curDone || !run.tN) return;
  if(run.cur.miss === 'all' || run.cur.trick) return;
  var elapsed = Date.now() - run.shownAt;
  var avg = run.tSum / run.tN;
  if(elapsed <= avg) return;
  run.bad++;
  var c = run.cur;
  run.mistakes.push({
    q: c.a + ' ' + c.op + ' ' + c.b + ' = ' + c.r,
    ua: null, missed: true, a: c.a, b: c.b, r: c.r, op: c.op, miss: c.miss,
    need: c.miss === 'r' ? c.r : c.miss === 'a' ? c.a : c.b
  });
}

function finish(reason){
  if(!run || run.done) return;
  run.done = true;
  run.locked = true;
  run.tok++;
  clearInterval(run.timer);
  var durSec = Math.round((Date.now() - run.start) / 1000);
  markUnsolved();
  var newHard = [];
  run.slow = [];
  if(!run.hardMode && S.miss !== 'all'){
    newHard = collectErrors();
    addHard(newHard);
    run.slow = collectSlow(newHard);
  } else if(run.hardMode && run.listKind === 'fluency' && S.miss !== 'all'){
    newHard = collectErrors();
    addHard(newHard);
  }
  showResults(reason, durSec);
  saveSession(durSec, newHard);
  if(run.hardMode && run.trackHard) lastHardList = loadHard();
  hardInfo();
  showScreen('results');
}

var VERDICTS = [
  { min:95, cls:'g5', msgs:[
    'Невероятно! Почти без ошибок — настоящий математик! 🏆',
    'Блестяще! Ты щёлкаешь примеры как орешки! 🥇',
    'Идеально! Переход через десяток тебе больше не страшен! 💯',
    'Вот это счёт! Так держать! 🚀',
    'Великолепно! Можно только позавидовать! 🌟',
    'Ты сегодня супергерой математики! 🦸',
    'Отличный результат! Математика тебя любит! ❤️',
    'Точность снайпера! Молодец! ✨',
    'Пятёрка с плюсом! Продолжай в том же духе! 🎉',
    'Безупречно! Учительница будет в восторге! 👏'
  ]},
  { min:80, cls:'g4', msgs:[
    'Отличная работа! Ещё чуть-чуть — и будет идеально! 😀',
    'Очень хорошо! Ты почти не ошибался! 💪',
    'Крепкий результат! Повтори ошибки — и они исчезнут! 📚',
    'Молодец! Точность растёт с каждым разом! 📈',
    'Здорово! Несколько примеров стоит повторить ещё раз. ✏️',
    'Хороший счёт! Ещё одна тренировка — и рекорд! 🚀',
    'Почти всё верно! Так держать! 👏',
    'Супер! Загляни в ошибки и щёлкни их ещё раз. 🧮',
    'Верных ответов больше, чем ошибок — так и надо! 🌟',
    'Отлично идёшь! Осталось отшлифовать мелочи. ✨'
  ]},
  { min:60, cls:'g3', msgs:[
    'Хороший старт! Повтори ошибочные примеры — и всё получится. 💪',
    'Неплохо! С каждой тренировкой получается лучше. 📈',
    'Уже неплохо! Давай разберём ошибки вместе. 🧮',
    'Продолжай тренироваться — результат обязательно придёт! 🚀',
    'Больше половины верных — хорошая база! 🧱',
    'Стараешься — это главное! Повтори ошибки. ✏️',
    'Счёт до 20 — дело привычки, а привычка — дело времени. 🕐',
    'Молодец, что не бросил! Разбери ошибки — и вперёд. 💡',
    'Растёшь! Ещё пара тренировок — и будет отлично. 🌱',
    'Совет: в конце разбери каждый пример из списка ошибок. 🔍'
  ]},
  { min:40, cls:'g2', msgs:[
    'Не сдавайся! Ошибаться — нормально, главное тренироваться. 💪',
    'Тяжело? Значит, ты растёшь! Повтори ошибки ещё раз. 🌱',
    'Около половины верных — уже неплохо! Давай закрепим. ✏️',
    'Попробуй решать медленнее и проговаривать шаги вслух. 🐢',
    'Каждая ошибка — подсказка, что повторить. Загляни в список! 🔍',
    'Ещё потренируемся — и цифры начнут складываться сами! 🧮',
    'Упорство важнее скорости. Ты справишься! 🚀',
    'Переход через десяток — хитрый, но ты хитрее. 😉',
    'Разбери ошибки с мамой или папой — сразу станет понятнее. 🤝',
    'Не расстраивайся, у всех бывает! Ещё разок? 🔄'
  ]},
  { min:20, cls:'g1', msgs:[
    'Ничего страшного! Начни с примеров попроще. 🐣',
    'Не спеши — в математике главное разобраться, а не успеть. 🐢',
    'Попробуй уровень «до 20» — там всё по силам! 💪',
    'Ошибок многовато, но это только начало пути. 🌱',
    'Разбери каждый пример по шагам: сначала до 10, потом остаток. 💡',
    'Совет: потренируйся с плитками и без таймера. 🧩',
    'Спокойно, всему своё время. Повтори состав числа 10! 🔢',
    'Тяжёлая тренировка — тоже опыт. Ещё разок? 🔄',
    'Сначала потренируйся без времени, а таймер включим позже. ⏱️',
    'Главное — не сдаваться! У тебя получится. 🌈'
  ]},
  { min:0, cls:'g0', msgs:[
    'Ох! Похоже, сегодня сложный день. Начни с простого уровня. 🐣',
    'Не переживай! Попроси взрослых помочь разобраться. 🤝',
    'Начни с примеров до 10, а к десятку вернёмся позже. 🔢',
    'Совет: решай без таймера и проговаривай шаги вслух. 🗣️',
    'Ошибки — это ступеньки. Шаг за шагом — и получится! 🧗',
    'Давай повторим состав числа 10 — он всему голова! 👑',
    'Ничего, потренируемся ещё — и всё наладится. 💪',
    'Попробуй плитки: выбирать ответ легче, чем писать. 🧩',
    'Отдохни немного и попробуй ещё раз. 🌤️',
    'Каждый чемпион когда-то начинал с нуля. Ты сможешь! 🏅'
  ]}
];

var EN_VERDICTS = [
  { min:95, cls:'g5', msgs:[
    'Incredible! Almost no mistakes — a real mathematician! 🏆',
    'Brilliant! You solve problems like a pro! 🥇',
    'Perfect! Carrying over ten does not scare you anymore! 💯',
    'What a score! Keep it up! 🚀',
    'Amazing! That is something to be proud of! 🌟',
    'You are a math superhero today! 🦸'
  ]},
  { min:80, cls:'g4', msgs:[
    'Great job! Just a little more and it will be perfect! 😀',
    'Very good! You barely made any mistakes! 💪',
    'Solid result! Review your mistakes and they will disappear! 📚',
    'Well done! Your accuracy is growing every time! 📈',
    'Nice! A few problems are worth repeating. ✏️',
    'Good score! One more practice and you will set a record! 🚀'
  ]},
  { min:60, cls:'g3', msgs:[
    'Good start! Repeat the problems you missed and you will get there. 💪',
    'Not bad! You improve with every practice. 📈',
    'Getting there! Let us go over the mistakes together. 🧮',
    'Keep practicing — results will definitely come! 🚀',
    'More than half correct — a good foundation! 🧱',
    'Effort is what matters! Review your mistakes. ✏️'
  ]},
  { min:40, cls:'g2', msgs:[
    'Do not give up! Mistakes are normal — practice is what counts. 💪',
    'Hard? That means you are growing! Try the mistakes again. 🌱',
    'About half correct — not bad! Let us reinforce it. ✏️',
    'Try solving more slowly and saying the steps out loud. 🐢',
    'Every mistake shows what to review. Check the list! 🔍',
    'Let us practice more — the numbers will start adding up! 🧮'
  ]},
  { min:20, cls:'g1', msgs:[
    'No worries! Start with easier problems. 🐣',
    'Take your time — understanding matters more than speed. 🐢',
    'Try the “up to 20” level — you can do it! 💪',
    'Quite a few mistakes, but this is just the beginning. 🌱',
    'Break each problem into steps: first to 10, then the rest. 💡',
    'Tip: practice with tiles and no timer. 🧩'
  ]},
  { min:0, cls:'g0', msgs:[
    'Oh! Looks like today is a tricky day. Start with an easy level. 🐣',
    'Do not worry! Ask an adult to help you figure it out. 🤝',
    'Start with problems up to 10, and come back to bigger numbers later. 🔢',
    'Tip: solve without a timer and say the steps out loud. 🗣️',
    'Mistakes are steps. Step by step, you will get there! 🧗',
    'Let us review the number bonds of 10 — they are the foundation! 👑'
  ]}
];
if(LANG === 'en') VERDICTS = EN_VERDICTS;

var GENERAL = {
  hi: {
    fast: [
      'Точно и быстро — вот это уровень! Настоящий математик! 🏆',
      'И правильно, и молниеносно! Так держать! ⚡',
      'Скорость плюс точность — суперсчёт! 🏎️',
      'Щёлкаешь примеры как орешки — и почти без ошибок! 🥇',
      'Быстро, чётко, верно! Пятёрка с плюсом! 🎉',
      'Ты в отличной форме: считаешь быстро и без ошибок! 💪',
      'Молния и снайпер в одном лице! 🎯',
      'Так быстро и так точно — хоть рекорды ставь! ⏱️',
      'Великолепно! Скорость и точность на высоте! 🌟',
      'Ух! Быстрее всех и почти без промахов! 🚀'
    ],
    mid: [
      'Почти без ошибок — отлично! Ещё чуть-чуть скорости — и идеально! 🚀',
      'Точно решаешь — молодец! Скорость придёт с тренировками! 💪',
      'Ошибок почти нет! Поработаем над темпом! ⏱️',
      'Каждое решение верное — а быстрота догонит! 🌟',
      'Точность чемпиона! Пара тренировок — и скорость подтянется! 🏅',
      'Решаешь надёжно! Разгонишься — будет совсем супер! ⚡',
      'Верно и уверенно! Добавим бодрости — и рекорд! 🥁',
      'Отлично считаешь! Секундочки пока не рекордные, но близко! 🕐',
      'Правильность на высоте! Тренируй скорость — она догонит! 📈',
      'Молодец! Скорость — дело тренировки, а точность у тебя уже есть! 👏'
    ],
    slow: [
      'Ошибок почти нет — главное! Со скоростью разберёмся! 🐢',
      'Считаешь без ошибок — супер! Спешить некуда, всё придёт! 🌱',
      'Правильно и старательно! Скорость — следующий шаг! 👣',
      'Точность уже есть — теперь тренируем быстроту! ⏱️',
      'Ни одной лишней ошибки! Медленно — не значит плохо! 💪',
      'Каждый ответ верный — здорово! Тренируйся, секунды побегут! 🏃',
      'Надёжно решаешь! Учись думать быстрее — тренируйся! 💡',
      'Точно — это самое важное! Скорость подтянется! 🌟',
      'Ошибаться не хочешь — молодец! Учись решать увереннее! 🚀',
      'Точность есть, скорость впереди! Ты на верном пути! 🗺️'
    ]
  },
  mid: {
    fast: [
      'Скорость отличная! Чуть внимательнее — и ошибок не будет! 🎯',
      'Быстро отвечаешь — здорово! Но не торопись с ответом! 🐢',
      'Молния! Осталось стать снайпером — проверяй себя! 🔍',
      'Темп огонь! Добавь чуточку внимания — и супер! 💪',
      'Быстро — да! Теперь бы ещё и без ошибок! ✏️',
      'Скорость есть! Повтори ошибки — и будет отлично! 📚',
      'Летишь быстро! Притормози у сложных примеров! 🏎️',
      'Торопишься — и ошибки проскакивают. Замедлись капельку! ⏳',
      'Огонь в темпе! Собранности — и вообще красота! 🔥',
      'Быстрый ты! Пара тренировок на внимание — и всё сложится! 🧩'
    ],
    mid: [
      'Хороший темп и неплохой счёт — так и растут мастера! 🌱',
      'Всё идёт своим чередом! Тренируйся — точность и скорость подрастут! 📈',
      'Серединка на половинку — но ты растёшь! Ещё практики! 💪',
      'Совет: разбери ошибки и следи за временем — получится отлично! 🧮',
      'Хорошая тренировка! Повтори сложные примеры — и вперёд! ✏️',
      'Решаешь в нормальном темпе — отшлифуем точность! 🌟',
      'Нормальный результат! Каждый день по чуть-чуть — и рекорд! 🚀',
      'Есть над чем поработать — и это здорово! Повторение — мать учения! 🔄',
      'Спокойно идёшь к цели! Ещё тренировка — и цифры порадуют! 🕐',
      'Хорошо стараешься! Разбери ошибки, ускорься — и отличный результат! 🏅'
    ],
    slow: [
      'Решаешь вдумчиво — это правильно! Тренировки добавят скорости! 🐢',
      'Старательно и с потенциалом — продолжай! 🌱',
      'Совет: потренируйся без таймера, ускоряйся постепенно! 💡',
      'Медленно? Не беда — шаг за шагом придёт и скорость! 👣',
      'Каждая тренировка делает счёт крепче! Продолжай! 💪',
      'Поработаем над примерами из списка ошибок! 📚',
      'Всё придёт: и точность, и быстрота! Главное — не бросать! 🌟',
      'Решай по шагам: сначала до 10, потом остаток — станет легче! 🔢',
      'Ещё пара недель практики — и ты себя не узнаешь! 🚀',
      'Спокойствие и тренировка — твои лучшие друзья! 🍀'
    ]
  },
  lo: {
    fast: [
      'Отвечаешь молниеносно, но торопишься — будь внимательнее! 🎯',
      'Скорость есть! Теперь главное — думать перед ответом! 🤔',
      'Не гони: сначала подумай — потом отвечай! 💪',
      'Быстро — не всегда верно. Замедлись и проверь! 🐢',
      'Темп супер, а вот ошибки спешат за тобой — притормози! ⏳',
      'Сначала правильный ответ, потом скорость! Всё получится! 🌟',
      'Соберись: решай чуть медленнее и внимательнее! 🧘',
      'Молодчина по скорости! Осталось подружиться с вниманием! ✏️',
      'Проговори пример вслух перед ответом — ошибки спрячутся! 🗣️',
      'Потише, потише! Внимательность — твой лучший помощник! 🛡️'
    ],
    mid: [
      'Есть над чем поработать! Начни с разбора ошибок! 📚',
      'Ничего страшного — потренируемся, и всё получится! 💪',
      'Совет: решай по шагам — сначала до 10, потом остаток! 🔢',
      'Попробуй без таймера: точность важнее скорости! 🐢',
      'Разбери каждый пример из ошибок — там и кроется секрет! 🔍',
      'Старайся, шаг за шагом — и ошибки отступят! 🌱',
      'Потренируй состав числа 10 — он всему голова! 👑',
      'Каждый пример — шаг к мастерству! Продолжай! 🚀',
      'Разбери ошибки с мамой или папой — сразу станет понятнее! 🤝',
      'Не расстраивайся: у всех бывает! Ещё разок? 🔄'
    ],
    slow: [
      'Не спеши! Начни с примеров полегче, без таймера! 🐣',
      'Всему своё время: сначала правильно, потом быстро! 🌱',
      'Потренируйся с плитками и без времени — так легче! 🧩',
      'Повтори состав числа 10 — с него всё начинается! 🔢',
      'Шаг за шагом — и всё получится! Мы с тобой! 💪',
      'Тяжело? Значит, ты учишься! Отдохни и попробуй снова! 🌤️',
      'Совет: решай вдумчиво и проговаривай шаги вслух! 🗣️',
      'Начни с уровня «до 20» — там всё по силам! 👣',
      'Каждый день понемногу — и счёт станет лёгким! 🍀',
      'Не сдавайся! У тебя обязательно получится! 🌈'
    ]
  }
};

var EN_GENERAL = {
  hi: {
    fast: [
      'Accurate and fast — that is the level! A real mathematician! 🏆',
      'Right and lightning-fast! Keep it up! ⚡',
      'Speed plus accuracy — super counting! 🏎️'
    ],
    mid: [
      'Almost no mistakes — excellent! A little more speed and it is perfect! 🚀',
      'You solve accurately — well done! Speed will come with practice! 💪',
      'Hardly any mistakes! Now let us work on pace! ⏱️'
    ],
    slow: [
      'Almost no mistakes — that is what matters! We will work on speed! 🐢',
      'You solve without mistakes — great! There is no rush, it will come! 🌱',
      'Accurate and careful! Speed is the next step! 👣'
    ]
  },
  mid: {
    fast: [
      'Great speed! Just a bit more attention and there will be no mistakes! 🎯',
      'You answer fast — great! But do not rush! 🐢',
      'Lightning fast! Now become a sharpshooter — check yourself! 🔍'
    ],
    mid: [
      'Good pace and decent counting — that is how masters grow! 🌱',
      'Everything is going well! Practice — accuracy and speed will improve! 📈',
      'A solid middle — but you are growing! More practice! 💪'
    ],
    slow: [
      'You solve thoughtfully — that is right! Practice will add speed! 🐢',
      'Careful and full of potential — keep going! 🌱',
      'Tip: practice without a timer and speed up gradually! 💡'
    ]
  },
  lo: {
    fast: [
      'You answer lightning-fast, but you are rushing — be more careful! 🎯',
      'Speed is there! Now the main thing is to think before answering! 🤔',
      'Do not rush: think first, then answer! 💪'
    ],
    mid: [
      'There is work to do! Start by reviewing your mistakes! 📚',
      'No worries — we will practice and you will get there! 💪',
      'Tip: solve step by step — first to 10, then the rest! 🔢'
    ],
    slow: [
      'Take your time! Start with easier problems, without a timer! 🐣',
      'Everything has its time: first correctly, then quickly! 🌱',
      'Practice with tiles and no timer — it is easier! 🧩'
    ]
  }
};
if(LANG === 'en') GENERAL = EN_GENERAL;

function showResults(reason, durSec){
  var md = false, ri;
  for(ri = 0; ri < run.records.length; ri++){
    if(run.records[ri].op === '×' || run.records[ri].op === '÷'){ md = true; break; }
  }
  if(!md && !run.records.length) md = hasMulDiv();
  function pick(list){
    var arr = list;
    if(md){
      var ok = list.filter(function(s){ return !/(десят|до 10(?!\d)|до 20(?!\d)|состав числа|переход)/i.test(s); });
      arr = ok.length ? ok : [tr('Продолжай тренироваться — точность и скорость придут с практикой! 💪', 'Keep practicing — accuracy and speed will come with practice! 💪')];
    }
    return arr[Math.floor(Math.random() * arr.length)];
  }
  els.resTitle.textContent = reason === 'time'
    ? tr('Время вышло', 'Time is up')
    : reason === 'stop'
      ? tr('Тренировка остановлена', 'Training stopped')
      : reason === 'done'
        ? (run.listKind === 'fluency'
            ? tr('Все примеры на беглость пройдены!', 'All fluency problems completed!')
            : tr('Все ошибки проработаны!', 'All mistakes reviewed!'))
        : tr('Готово', 'Done');
  var total = run.ok + run.bad;
  if(!total){
    els.verdict.textContent = tr('Ни одного ответа. Давай попробуем ещё раз — всё получится! 🙂', 'No answers yet. Let’s try again — you can do it! 🙂');
    els.verdict.className = 'verdict g0';
    els.advice.hidden = true;
    els.advice.textContent = '';
  } else {
    var acc = run.ok / total * 100;
    var tier = VERDICTS[VERDICTS.length - 1];
    for(var vi = 0; vi < VERDICTS.length; vi++){
      if(acc >= VERDICTS[vi].min){ tier = VERDICTS[vi]; break; }
    }
    els.verdict.textContent = pick(tier.msgs);
    els.verdict.className = 'verdict ' + tier.cls;
    var avg = run.tN ? run.tSum / run.tN : null;
    if(avg === null){
      els.advice.hidden = true;
      els.advice.textContent = '';
    } else {
      var aLvl = acc >= 80 ? 'hi' : acc >= 50 ? 'mid' : 'lo';
      var sLvl = avg < 5000 ? 'fast' : avg < 11000 ? 'mid' : 'slow';
      var pool = GENERAL[aLvl][sLvl];
      els.advice.textContent = pick(pool);
      els.advice.className = 'verdict ' + (aLvl === 'hi' ? 'g4' : aLvl === 'mid' ? 'g3' : 'g2');
      els.advice.hidden = false;
    }
  }
  els.rOk.textContent = run.ok;
  els.rBad.textContent = run.bad;
  els.rAcc.textContent = total ? Math.round(run.ok / total * 100) + '%' : '—';
  els.rAvg.textContent = run.tN ? fmtSec1(run.tSum / run.tN) : '—';
  els.rFast.textContent = run.tN ? fmtSec1(run.minMs) : '—';
  els.rSlow.textContent = run.tN ? fmtSec1(run.maxMs) : '—';
  els.rDur.textContent = fmt(durSec);
  els.misTitle.textContent = tr('Ошибки: ', 'Mistakes: ') + run.bad;
  if(!run.bad){
    els.misList.innerHTML = '<div class="none">' + tr('Ошибок нет', 'No mistakes') + '</div>';
  } else {
    els.misList.innerHTML = run.mistakes.map(function(m){
      return '<div class="mrow">' + m.q +
        (m.missed ? '<span class="ua missed">' + tr('не успел решить', 'not solved in time') + '</span>' : '<span class="ua">' + tr('вы: ', 'you: ') + m.ua + '</span>') +
        '</div>';
    }).join('');
  }
  renderPairs(run);
  if(reason === 'done'){
    els.verdict.textContent = run.listKind === 'fluency'
      ? tr('Все примеры на беглость пройдены — отличная скорость! 🎉', 'All fluency problems completed — great speed! 🎉')
      : tr('Все ошибки проработаны — список пуст! 🎉', 'All mistakes reviewed — the list is empty! 🎉');
    els.verdict.className = 'verdict g5';
    els.advice.hidden = true;
    els.advice.textContent = '';
  }
  renderSlow(run);
  renderRetry();
}

function renderPairs(r){
  if(!r.cur || r.cur.miss !== 'all'){
    els.pairsCard.hidden = true;
    els.pairsList.innerHTML = '';
    return;
  }
  var op = r.cur.op, found = r.cur.found, sols = r.cur.sols;
  var pend = sols.filter(function(p){
    return !found.some(function(q){ return q[0] === p[0] && q[1] === p[1]; });
  });
  function chip(p, cls){ return '<span class="' + cls + '">' + p[0] + ' ' + op + ' ' + p[1] + '</span>'; }
  els.pairsList.innerHTML =
    '<div class="pairrow dim">' + tr('Пример: ', 'Problem: ') + '□ ' + op + ' □ = ' + r.cur.r + '</div>' +
    '<div class="pairrow"><span class="dim">' + tr('Успел (', 'Solved (') + found.length + '):</span> ' +
      (found.length ? found.map(function(p){ return chip(p, 'foundpair'); }).join('') : '<span class="dim">' + tr('ничего', 'nothing') + '</span>') +
    '</div>' +
    '<div class="pairrow"><span class="dim">' + tr('Не успел (', 'Not solved (') + pend.length + '):</span> ' +
      (pend.length ? pend.map(function(p){ return chip(p, 'misspair'); }).join('') : '<span class="none">' + tr('всё найдено', 'all found') + '</span>') +
    '</div>';
  els.pairsCard.hidden = false;
}

function renderSlow(r){
  var slow = r.slow || [];
  els.slowCard.hidden = !slow.length;
  if(!slow.length){
    els.slowList.innerHTML = '';
    return;
  }
  els.slowTitle.textContent = tr('Медленные, но верные: ', 'Slow but correct: ') + slow.length;
  els.slowList.innerHTML = slow.map(function(x){
    return '<div class="mrow">' + x.a + ' ' + x.op + ' ' + x.b + ' = ' + computeResult(x.op, x.a, x.b) +
      '<span class="ua slow">' + fmtSec1(x.ms) + '</span></div>';
  }).join('');
}

function retryOptions(need, vmax){
  var opts = [need];
  var max = Math.max(vmax, need + 2, 2);
  var cands = shuffle([need - 1, need + 1, need - 2, need + 2, need - 10, need + 10, 0, 1, 2]);
  for(var i = 0; i < cands.length && opts.length < 3; i++){
    if(cands[i] >= 0 && cands[i] <= max && opts.indexOf(cands[i]) < 0) opts.push(cands[i]);
  }
  var guard = 0;
  while(opts.length < 3 && guard++ < 200){
    var v = Math.floor(Math.random() * (max + 1));
    if(opts.indexOf(v) < 0) opts.push(v);
  }
  return shuffle(opts);
}
function renderRetry(){
  retryState = null;
  var m = null;
  for(var i = 0; i < run.mistakes.length; i++){
    if(run.mistakes[i].missed){ m = run.mistakes[i]; break; }
  }
  if(!m){
    els.retryCard.hidden = true;
    els.retryEq.innerHTML = '';
    els.retryBtns.innerHTML = '';
    return;
  }
  retryState = { need: m.need, done: false };
  els.retryEq.innerHTML = eqHtml(m, '<span class="slot empty" id="retrySlot"></span>');
  var vmax = Math.max(m.a, m.b, m.r);
  els.retryBtns.innerHTML = retryOptions(m.need, vmax).map(function(v){
    return '<button type="button" data-v="' + v + '">' + v + '</button>';
  }).join('');
  els.retryCard.hidden = false;
}

function saveSession(durSec, hardEx){
  var h = loadJSON(K_HIST, []);
  if(!Array.isArray(h)) h = [];
  var hex = (hardEx || []).slice(0, 20).map(function(x){ return { a: x.a, b: x.b, op: x.op }; });
  h.unshift({
    t: Date.now(), mode: S.mode, limit: S.limit, from: S.from, ops: S.ops, carry: S.carry, hard: !!run.hardMode,
    kind: run.listKind || 'review',
    dur: durSec, ok: run.ok, bad: run.bad, psec: S.min * 60 + S.sec, hardEx: hex
  });
  saveJSON(K_HIST, h.slice(0, 15));
}

function renderHistory(){
  var h = loadJSON(K_HIST, []);
  histCache = Array.isArray(h) ? h : [];
  if(!histCache.length){
    els.histList.innerHTML = '<div class="hrow dim">' + tr('Пока пусто', 'Nothing yet') + '</div>';
    els.clearHist.style.display = 'none';
    return;
  }
  els.clearHist.style.display = '';
  els.histList.innerHTML = histCache.map(function(r, i){
    var total = r.ok + r.bad;
    var acc = total ? Math.round(r.ok / total * 100) + '%' : '—';
    var mode = r.mode === 'timed' ? tr('на время ', 'timed ') + fmt(r.psec || 0) : tr('тренировка', 'practice');
    var desc = r.hard
      ? (r.kind === 'fluency' ? tr('беглость', 'fluency practice') : tr('проработка ошибок', 'mistake review'))
      : (r.from > 0 ? tr('от ', 'from ') + r.from + tr(' до ', ' to ') + r.limit : tr('до ', 'up to ') + r.limit) + ' · ' + opsLabel(r.ops);
    var html = '<div class="hrow">' + fmtDate(r.t) + ' · ' + desc +
      ' · ' + mode + ' · ' + tr('верно ', 'correct ') + r.ok + ', ' + r.bad + ' ' + pluralErr(r.bad) +
      ' · ' + acc;
    var hex = Array.isArray(r.hardEx) ? r.hardEx : [];
    if(hex.length){
      var practice = hex.length === 1
        ? tr('Проработать этот пример', 'Practice this example')
        : tr('Проработать эти ', 'Practice these ') + hex.length + ' ' + pluralEx(hex.length);
      html += '<div class="exlist left">' + exChips(hex) + '</div>' +
        '<button class="btn small hbtn" type="button" data-hi="' + i + '">' + practice + '</button>';
    }
    return html + '</div>';
  }).join('');
}

each(els.limitChips.querySelectorAll('button'), function(b){
  b.addEventListener('click', function(){
    S.limit = clampLevel(b.getAttribute('data-v'));
    els.limitInput.value = S.limit;
    if(S.from > S.limit){ S.from = S.limit; els.fromInput.value = S.from; }
    updateHints();
    syncChips();
    poolInfo();
    saveSettings();
  });
});
els.limitInput.addEventListener('input', function(){
  var v = parseInt(els.limitInput.value, 10);
  if(isFinite(v)){
    S.limit = clampLevel(v);
    if(S.from > S.limit){ S.from = S.limit; els.fromInput.value = S.from; }
    updateHints();
    syncChips();
    poolInfo();
    saveSettings();
  }
});
els.limitInput.addEventListener('change', function(){
  S.limit = clampLevel(els.limitInput.value);
  els.limitInput.value = S.limit;
  if(S.from > S.limit){ S.from = S.limit; els.fromInput.value = S.from; }
  syncChips();
  poolInfo();
  saveSettings();
});
els.fromInput.addEventListener('input', function(){
  var v = parseInt(els.fromInput.value, 10);
  if(isFinite(v)){
    S.from = clampInt(v, 0, S.limit, S.from);
    updateHints();
    poolInfo();
    saveSettings();
  }
});
els.fromInput.addEventListener('change', function(){
  S.from = Math.min(clampInt(els.fromInput.value, 0, 100, 0), S.limit);
  els.fromInput.value = S.from;
  updateHints();
  poolInfo();
  saveSettings();
});
els.carry.addEventListener('change', function(){
  S.carry = els.carry.checked;
  poolInfo();
  saveSettings();
});
els.minInput.addEventListener('input', function(){
  S.min = clampInt(els.minInput.value, 0, 300, S.min);
  saveSettings();
});
els.secInput.addEventListener('input', function(){
  S.sec = clampInt(els.secInput.value, 0, 59, S.sec);
  saveSettings();
});
els.sound.addEventListener('change', function(){
  S.sound = els.sound.checked;
  saveSettings();
  if(S.sound){ unlockAudio(); playCorrect(); }
});
els.soundTest.addEventListener('click', function(){
  unlockAudio();
  if(!audioCtx) return;
  tone(880, 0, 0.11, 'sine', 0.16);
  tone(1174.7, 0.085, 0.16, 'sine', 0.14);
});
els.trickZero.addEventListener('change', function(){
  S.trickZero = els.trickZero.checked;
  saveSettings();
  updateHints();
});

each(document.querySelectorAll('.seg'), function(seg){
  seg.addEventListener('click', function(e){
    var b = e.target && e.target.closest ? e.target.closest('button') : null;
    if(!b || !seg.contains(b) || !b.getAttribute('data-v')) return;
    var key = seg.getAttribute('data-key');
    var v = b.getAttribute('data-v');
    if(key === 'ops'){
      var i = S.ops.indexOf(v);
      if(i >= 0){
        if(S.ops.length === 1) return;
        S.ops.splice(i, 1);
      } else {
        S.ops.push(v);
      }
      S.ops = OPS_ALL.filter(function(o){ return S.ops.indexOf(o) >= 0; });
      syncSegs();
      updateHints();
      poolInfo();
      saveSettings();
      return;
    }
    S[key] = v;
    each(seg.querySelectorAll('button'), function(x){
      x.classList.toggle('on', x === b);
    });
    if(key === 'mode') els.timeRow.style.display = S.mode === 'timed' ? '' : 'none';
    if(key === 'miss'){ updateHints(); poolInfo(); }
    saveSettings();
  });
});

function padButton(e){
  var b = e.target && e.target.closest ? e.target.closest('button[data-k]') : null;
  return b && els.pad.contains(b) ? b : null;
}
function tileButton(e){
  var b = e.target && e.target.closest ? e.target.closest('button[data-v]') : null;
  return b && els.tiles.contains(b) ? b : null;
}
function tileVal(v){ return v === 'none' ? 'none' : parseInt(v, 10); }

els.pad.addEventListener('pointerdown', function(e){
  if(e.pointerType === 'mouse' && e.button !== 0) return;
  var b = padButton(e);
  if(!b) return;
  e.preventDefault();
  press(b.getAttribute('data-k'));
});
els.pad.addEventListener('click', function(e){
  if(e.detail !== 0 && window.PointerEvent) return;
  var b = padButton(e);
  if(!b) return;
  press(b.getAttribute('data-k'));
});

els.tiles.addEventListener('pointerdown', function(e){
  if(e.pointerType === 'mouse' && e.button !== 0) return;
  var b = tileButton(e);
  if(!b) return;
  e.preventDefault();
  var v = tileVal(b.getAttribute('data-v'));
  if(run && run.cur && run.cur.trick) judgeTrick(v, b);
  else judge(v, b);
});
els.tiles.addEventListener('click', function(e){
  if(e.detail !== 0 && window.PointerEvent) return;
  var b = tileButton(e);
  if(!b) return;
  var v = tileVal(b.getAttribute('data-v'));
  if(run && run.cur && run.cur.trick) judgeTrick(v, b);
  else judge(v, b);
});

document.addEventListener('keydown', function(e){
  if(screenName === 'game'){
    if(!isTiles()){
      if(e.key.length === 1 && e.key >= '0' && e.key <= '9'){ press(e.key); e.preventDefault(); return; }
      if(e.key === 'Backspace'){ press('del'); e.preventDefault(); return; }
      if(e.key === 'Enter'){ press('ok'); e.preventDefault(); return; }
    }
    if(e.key === 'Escape'){ finish('stop'); }
  } else if(screenName === 'results'){
    if(e.key === 'Enter'){ againAction(); e.preventDefault(); }
  } else if(screenName === 'setup'){
    var ae = document.activeElement;
    if(e.key === 'Enter' && (!ae || ae.tagName !== 'BUTTON')){ start(); e.preventDefault(); }
  }
});

els.startBtn.addEventListener('click', start);
els.hardBtn.addEventListener('click', startHard);
els.clearHard.addEventListener('click', function(){ saveHard([]); hardInfo(); });
els.stopBtn.addEventListener('click', function(){ finish('stop'); });
els.slowBtn.addEventListener('click', function(){
  if(!run || !run.slow || !run.slow.length) return;
  startHardList(run.slow, false, 'fluency');
});
els.againBtn.addEventListener('click', function(){ againAction(); });
function againAction(){
  if(lastHard && lastHardList.length){ startHardList(lastHardList, lastHardTrack, lastHardKind); return; }
  if(lastHard){ showScreen('setup'); renderHistory(); hardInfo(); return; }
  start();
}
els.toSetupBtn.addEventListener('click', function(){ showScreen('setup'); renderHistory(); hardInfo(); });
els.clearHist.addEventListener('click', function(){ saveJSON(K_HIST, []); renderHistory(); });
els.histList.addEventListener('click', function(e){
  var b = e.target && e.target.closest ? e.target.closest('button[data-hi]') : null;
  if(!b) return;
  var rec = histCache[parseInt(b.getAttribute('data-hi'), 10)];
  if(!rec || !Array.isArray(rec.hardEx) || !rec.hardEx.length) return;
  startHardList(rec.hardEx, false, 'review');
});
function retryAnswer(b){
  if(!b || !retryState || retryState.done) return;
  retryState.done = true;
  var val = parseInt(b.getAttribute('data-v'), 10);
  var slot = $('retrySlot');
  if(slot){ slot.textContent = String(val); slot.classList.remove('empty'); }
  if(val === retryState.need){
    b.classList.add('correct');
    playCorrect();
  } else {
    b.classList.add('wrong');
    playWrong();
    var good = els.retryBtns.querySelector('button[data-v="' + retryState.need + '"]');
    if(good) good.classList.add('correct');
  }
}
els.retryBtns.addEventListener('pointerdown', function(e){
  if(e.pointerType === 'mouse' && e.button !== 0) return;
  var b = e.target && e.target.closest ? e.target.closest('button[data-v]') : null;
  if(!b || !els.retryBtns.contains(b)) return;
  e.preventDefault();
  retryAnswer(b);
});
els.retryBtns.addEventListener('click', function(e){
  if(e.detail !== 0 && window.PointerEvent) return;
  var b = e.target && e.target.closest ? e.target.closest('button[data-v]') : null;
  if(!b || !els.retryBtns.contains(b)) return;
  retryAnswer(b);
});

loadSettings();
applyUrl();
syncUI();
renderHistory();
showScreen('setup');
})();

