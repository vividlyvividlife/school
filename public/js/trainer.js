(function(){
'use strict';

var $ = function(id){ return document.getElementById(id); };
function each(list, fn){ Array.prototype.forEach.call(list, fn); }

var LANG = (document.documentElement.lang || 'ru').toLowerCase().indexOf('en') === 0 ? 'en' : 'ru';
function tr(ru, en){ return LANG === 'en' ? en : ru; }
function tico(i){ return '<span class="tico" aria-hidden="true">' + i + '</span>'; }
function answerText(v){ return v === 'none' ? tr('Нельзя', 'Undefined') : String(v); }
function pluralEx(n){
  if(LANG === 'en') return n === 1 ? 'example' : 'examples';
  return plural(n, 'пример', 'примера', 'примеров');
}
function pluralErr(n){
  if(LANG === 'en') return n === 1 ? 'mistake' : 'mistakes';
  return plural(n, 'ошибка', 'ошибки', 'ошибок');
}

var S = { cls:2, limit:18, from:0, ops:['add','sub'], carry:true, miss:'r', answer:'tiles12', mode:'free', min:2, sec:0, sound:true, trickZero:false, format:'visual', voice:'f', rate:1 };
var OPS_ALL = ['add','sub','mul','div'];
var OP_SIGN = { add:'+', sub:'−', mul:'×', div:'÷' };
var SIGN_OP = { '+':'add', '−':'sub', '×':'mul', '÷':'div' };
var MAX_FACTOR = 10;
var K_SET = 'mathTrainer.settings.v1';
var K_ANSWER12 = 'mathTrainer.answer12.v1';
var K_HIST = 'mathTrainer.history.v1';
var K_HARD = 'mathTrainer.hard.v1';
var HARD_MAX = 60;
var screenName = 'setup';
var run = null, lastHard = false, lastHardList = [], lastHardTrack = false, lastHardKind = 'review', histCache = [], retryState = null, startWaiting = false;

var els = {
  limitChips: $('limitChips'), limitInput: $('limit'), fromInput: $('from'), carry: $('carry'),
  rangeHint: $('rangeHint'), carryHint: $('carryHint'), missHint: $('missHint'),
  trickZero: $('trickZero'), trickHint: $('trickHint'),
  minInput: $('min'), secInput: $('sec'), timeRow: $('timeRow'), sound: $('sound'),
  poolInfo: $('poolInfo'), startBtn: $('startBtn'),
  histList: $('histList'), clearHist: $('clearHist'),
  gInfo: $('gInfo'), scoreOk: $('scoreOk'), scoreBad: $('scoreBad'),
  timeWrap: $('timeWrap'), tfill: $('tfill'), tclock: $('tclock'),
  eqw: $('eqw'), eq: $('eq'), cap: $('cap'), pairInfo: $('pairInfo'), pad: $('pad'), tiles: $('tiles'), stopBtn: $('stopBtn'), pauseBtn: $('pauseBtn'), skipBtn: $('skipBtn'), game: $('game'), cannotBtn: $('cannotBtn'),
  dict: $('dict'), dictRepeat: $('dictRepeat'), dictLeft: $('dictLeft'), dictLabel: $('dictLabel'), dictNote: $('dictNote'), dictAnswer: $('dictAnswer'), formatHint: $('formatHint'),
  verdict: $('verdict'), advice: $('advice'), resTitle: $('resTitle'), rOk: $('rOk'), rBad: $('rBad'), rSkip: $('rSkip'), rAcc: $('rAcc'), rAvg: $('rAvg'), rFast: $('rFast'), rSlow: $('rSlow'), rDur: $('rDur'), skippedCard: $('skippedCard'), skippedTitle: $('skippedTitle'), skippedList: $('skippedList'),
  hardInfo: $('hardInfo'), hardList: $('hardList'), hardBtn: $('hardBtn'), clearHard: $('clearHard'), soundTest: $('soundTest'),
  misTitle: $('misTitle'), misList: $('misList'), slowCard: $('slowCard'), slowTitle: $('slowTitle'), slowList: $('slowList'), slowBtn: $('slowBtn'), unsolvedCard: $('unsolvedCard'), unsolvedTitle: $('unsolvedTitle'), unsolvedList: $('unsolvedList'), unsolvedBtn: $('unsolvedBtn'), pairsCard: $('pairsCard'), pairsList: $('pairsList'), retryCard: $('retryCard'), retryEq: $('retryEq'), retryBtns: $('retryBtns'), againBtn: $('againBtn'), toSetupBtn: $('toSetupBtn')
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
function trickActive(){ return !!(S.trickZero && S.ops.indexOf('div') >= 0); }
function cannotEnabled(){
  return !!(run && !run.hardMode && S.trickZero && run.ops.indexOf('div') >= 0);
}
function cannotRoll(op){
  return !!(cannotEnabled() && (!op || op === '÷') && Math.random() < 0.5);
}
function setCannot(show){
  els.cannotBtn.hidden = !cannotEnabled();
  els.cannotBtn.style.visibility = show ? '' : 'hidden';
}
function effectiveOps(){
  return S.ops.slice();
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
  if(v.format === 'visual' || v.format === 'dictation' || v.format === 'dictation-full') S.format = v.format;
  if(v.voice === 'f' || v.voice === 'm') S.voice = v.voice;
  if([1, 1.5, 2].indexOf(Number(v.rate)) >= 0) S.rate = Number(v.rate);
  if(v.cls === 1 || v.cls === 2 || v.cls === 3) S.cls = v.cls;
  if(!loadJSON(K_ANSWER12, false)){
    if(v.answer === 'type'){
      S.answer = 'tiles12';
      saveJSON(K_SET, S);
    }
    saveJSON(K_ANSWER12, true);
  }
  enforceDictation();
}
function saveSettings(){ saveJSON(K_SET, S); saveJSON(K_ANSWER12, true); }
var dictAllowed = !!document.querySelector('.format-seg');
function isDictation(){ return dictAllowed && (S.format === 'dictation' || S.format === 'dictation-full'); }
function isFullDictation(){ return dictAllowed && S.format === 'dictation-full'; }
function dictBank(){ return isFullDictation() ? 'full' : 'light'; }
function enforceDictation(){
  if(!isDictation()) return;
  S.miss = 'r';
  S.trickZero = false;
}

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
    : tr('Заданий для повторения пока нет', 'No tasks to review yet');
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
  if(p.get('format') === 'visual' || p.get('format') === 'dictation' || p.get('format') === 'dictation-full') S.format = p.get('format');
  if(p.get('voice') === 'f' || p.get('voice') === 'm') S.voice = p.get('voice');
  enforceDictation();
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
  els.carry.disabled = false;
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
  var dict = isDictation();
  var canTrick = S.ops.indexOf('div') >= 0;
  els.trickZero.disabled = false;
  els.trickHint.hidden = dict || (!canTrick && !S.trickZero);
  els.trickHint.textContent = dict
    ? ''
    : !canTrick
      ? tr('Доступно при делении.', 'Available when division is selected.')
      : S.trickZero
        ? tr('Иногда в примерах встретится деление на 0. Верный ответ — «Нельзя».', 'Occasionally a problem will divide by zero. The correct answer is “Undefined”.')
        : '';
  var excl = S.miss === 'all' && !dict;
  els.missHint.hidden = !excl;
  if(excl){
    els.missHint.textContent = tr('Режим «X ★ X»: подбери два числа; подходит любая операция «+ − × ÷».', '“X ★ X” mode: pick two numbers; any of + − × ÷ works.');
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
  } else {
    els.poolInfo.textContent = tr('Для этих настроек примеров нет', 'No examples for these settings');
  }
  els.startBtn.disabled = !n;
}
var CLASS_PRESETS = {
  1: { limit: 20, from: 0, ops: ['add', 'sub'], carry: false, miss: 'r', answer: 'tiles12', mode: 'free', trickZero: false },
  2: { limit: 18, from: 0, ops: ['add', 'sub'], carry: true, miss: 'r', answer: 'tiles12', mode: 'free', trickZero: false },
  3: { limit: 100, from: 0, ops: ['add', 'sub', 'mul', 'div'], carry: false, miss: 'rab', answer: 'type', mode: 'free', trickZero: false }
};
function applyClass(c){
  var preset = CLASS_PRESETS[c];
  if(!preset) return;
  S.cls = c;
  for(var k in preset){
    if(Object.prototype.hasOwnProperty.call(preset, k)) S[k] = k === 'ops' ? preset.ops.slice() : preset[k];
  }
  enforceDictation();
  syncUI();
  saveSettings();
}
function syncClass(){
  each(document.querySelectorAll('.class-seg button'), function(b){
    b.classList.toggle('on', Number(b.getAttribute('data-c')) === S.cls);
  });
}
function syncUI(){
  els.limitInput.value = S.limit;
  els.fromInput.value = S.from;
  syncChips();
  syncSegs();
  syncClass();
  els.carry.checked = S.carry;
  updateHints();
  els.minInput.value = S.min;
  els.secInput.value = S.sec;
  els.sound.checked = S.sound;
  els.trickZero.checked = S.trickZero;
  els.timeRow.style.display = (!isDictation() && S.mode === 'timed') ? '' : 'none';
  syncDictationUI();
  poolInfo();
  hardInfo();
}
function leaveDictation(){
  if(!isDictation()) return;
  S.format = 'visual';
  syncSegs();
  syncDictationUI();
  updateHints();
  els.trickZero.checked = S.trickZero;
  saveSettings();
}

function syncDictationUI(){
  var on = isDictation();
  if(!document.querySelector('.rate-seg')) S.rate = 1;
  els.timeRow.style.display = S.mode === 'timed' ? '' : 'none';
  if(els.formatHint) els.formatHint.hidden = false;
  if(on && window.DictationAudio){
    DictationAudio.setVoice(S.voice);
    DictationAudio.setRate(1);
    DictationAudio.load(dictBank()).catch(function(){});
  }
}

function rangeLabel(){ return (S.from > 0 ? tr('от ', 'from ') + S.from + tr(' до ', ' to ') + S.limit : tr('до ', 'up to ') + S.limit); }

function start(){
  if(startWaiting) return;
  unlockAudio();
  if(isDictation()){
    enforceDictation();
    syncSegs();
    els.trickZero.checked = false;
    updateHints();
    syncDictationUI();
    if(window.DictationAudio){
      DictationAudio.unlock();
      DictationAudio.setRate(Number(S.rate) || 1);
      if(!DictationAudio.isSupported()){
        els.poolInfo.textContent = tr('Браузер не поддерживает звук', 'This browser does not support audio');
        return;
      }
      if(!DictationAudio.isReady(dictBank())){
        startWaiting = true;
        els.startBtn.disabled = true;
        els.startBtn.textContent = tr('Загрузка озвучки…', 'Loading audio…');
        DictationAudio.load(dictBank()).then(function(){
          startWaiting = false;
          els.startBtn.disabled = false;
          els.startBtn.textContent = tr('Начать', 'Start');
          start();
        }, function(){
          startWaiting = false;
          els.startBtn.disabled = false;
          els.startBtn.textContent = tr('Начать', 'Start');
          els.poolInfo.textContent = tr('Не удалось загрузить озвучку. Проверьте интернет и попробуйте ещё раз.', 'Could not load the audio. Check the connection and try again.');
        });
        return;
      }
    } else {
      els.poolInfo.textContent = tr('Браузер не поддерживает звук', 'This browser does not support audio');
      return;
    }
  }
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
    ok: 0, bad: 0, tSum: 0, tN: 0, minMs: 0, maxMs: 0, records: [], mistakes: [], skipped: [], unsolved: [], slow: [],
    curDone: false, start: 0, total: 0, deadline: 0, timer: null, shownAt: 0,
    paused: false, pausedAt: 0, pendingNext: false,
    exCount: 0, trickAt: 5 + Math.floor(Math.random() * 4)
  };
  lastHard = false;
  lastHardList = [];

  els.gInfo.textContent = rangeLabel() + ' · ' + opsLabel(S.ops) +
    (S.carry && hasAddSub() ? tr(' · с переходом', ' · with carry') + (hasMulDiv() ? ' (+, −)' : '') : '') +
    (isFullDictation()
      ? tr(' · математический диктант', ' · math dictation')
      : isDictation() ? tr(' · диктант', ' · dictation') : '');
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
  if(isDictation() && window.DictationAudio){
    DictationAudio.unlock();
    DictationAudio.setVoice(S.voice);
    DictationAudio.load(dictBank()).catch(function(){});
  }
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
    ok: 0, bad: 0, tSum: 0, tN: 0, minMs: 0, maxMs: 0, records: [], mistakes: [], skipped: [], unsolved: [], slow: [],
    curDone: false, start: 0, total: 0, deadline: 0, timer: null, shownAt: 0,
    paused: false, pausedAt: 0, pendingNext: false
  };
  run.next = makeHardDrawer(run, items);
  lastHard = true;
  lastHardList = h;
  lastHardTrack = !!track;
  lastHardKind = kind;
  els.gInfo.textContent = (kind === 'fluency' ? tr('беглость', 'fluency') : tr('ошибки', 'mistakes')) +
    ' · ' + items.length + ' ' + pluralEx(items.length) +
    ' · ' + (S.mode === 'timed' ? tr('на время', 'timed') : tr('тренировка', 'practice')) +
    (isFullDictation()
      ? tr(' · математический диктант', ' · math dictation')
      : isDictation() ? tr(' · диктант', ' · dictation') : '');
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
  run.paused = false;
  run.pausedAt = 0;
  run.pendingNext = false;
  if(els.game) els.game.classList.remove('paused');
  if(S.mode === 'timed'){
    run.total = Math.max(5, S.min * 60 + S.sec) * 1000;
    run.deadline = run.start + run.total;
    els.timeWrap.classList.remove('free');
  } else {
    els.timeWrap.classList.add('free');
  }
  run.timer = setInterval(tick, 100);
  updatePauseUI();
  tick();
}
function setPaused(v){
  if(!run || run.done || S.mode === 'timed' || v === run.paused) return;
  run.paused = v;
  if(v){
    run.pausedAt = Date.now();
    clearInterval(run.timer);
    if(isDictation()) dictStop();
    if(run.shownAt > run.pausedAt) run.shownAt = run.pausedAt;
    if(run.locked && run.curDone) run.pendingNext = true;
    els.game.classList.add('paused');
  } else {
    var d = Date.now() - run.pausedAt;
    run.start += d;
    if(run.deadline) run.deadline += d;
    if(run.shownAt) run.shownAt += d;
    run.pausedAt = 0;
    els.game.classList.remove('paused');
    run.timer = setInterval(tick, 100);
    tick();
    if(run.pendingNext){
      run.pendingNext = false;
      run.tok++;
      run.locked = false;
      nextExercise();
    } else if(isDictation() && run.cur && !run.curDone && !run.locked){
      speakCurrent(false);
    }
  }
  updatePauseUI();
}
function updatePauseUI(){
  if(!els.pauseBtn) return;
  var show = screenName === 'game' && run && !run.done && S.mode !== 'timed';
  var on = !!(show && run.paused);
  els.pauseBtn.hidden = !show;
  els.pauseBtn.textContent = on
    ? els.pauseBtn.getAttribute('data-resume')
    : els.pauseBtn.getAttribute('data-pause');
  els.pauseBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
}
function tick(){
  if(!run || run.done || run.paused) return;
  var now = Date.now();
  if(S.mode === 'timed'){
    var left = Math.max(0, run.deadline - now);
    var frac = left / run.total;
    els.tfill.style.width = (frac * 100).toFixed(1) + '%';
    els.tfill.className = 'tfill' + (frac <= 0.15 ? ' low' : frac <= 0.4 ? ' warn' : '');
    els.tclock.textContent = fmt(left / 1000);
    if(left <= 0) finish('time');
  } else {
    els.tclock.textContent = fmt((now - run.start) / 1000);
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
  } else if(op === '−'){
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
  } else if(op === '×'){
    for(x = lo; x <= MAX_FACTOR; x++){
      for(y = x; y <= MAX_FACTOR; y++){
        if(x * y !== R) continue;
        out.push([x, y]);
      }
    }
  } else if(op === '÷'){
    for(b = Math.max(1, lo); b <= MAX_FACTOR; b++){
      a = R * b;
      if(a < lo || a > lim) continue;
      out.push([a, b]);
    }
  }
  return out;
}

function nextExercise(){
  if(!run || run.done) return;
  if(run.paused){ run.pendingNext = true; return; }
  if(!run.hardMode && trickActive() && run.ops.indexOf('div') >= 0 && run.exCount >= run.trickAt){
    startTrick();
    run.exCount++;
    run.trickAt = run.exCount + 7 + Math.floor(Math.random() * 4);
    return;
  }
  var base = drawBase();
  if(!base){ finish('done'); return; }
  els.pad.hidden = isTiles();
  els.tiles.hidden = !isTiles();
  els.tiles.innerHTML = '';
  run.vmax = run.hardMode ? Math.max(base.a, base.b, base.r) : S.limit;
  run.typed = '';
  run.curDone = false;
  run.shownAt = Date.now();
  els.eqw.className = 'eqwrap eqw v-qcard';
  els.cap.textContent = '';
  els.cap.className = 'cap';
  run.exCount++;
  if(isDictation()){ run.dictLeft = 1; run.dictKeys = null; dictStop(); }


  if(S.miss === 'all' && !run.hardMode){
    var sols, tries = 0;
    do{
      sols = solutionsFor(base.op, base.r, run.vmax);
      var minSols = (base.op === '×' || base.op === '÷') ? 1 : 2;
      if(sols.length >= minSols && sols.length <= 12) break;
      if(run.hardMode) break;
      base = drawBase();
      run.vmax = S.limit;
    }while(tries++ < 20);
    if(!sols.length){
      var cm = base.op === '+' || base.op === '×';
      sols = [cm ? [Math.min(base.a, base.b), Math.max(base.a, base.b)] : [base.a, base.b]];
    }
    var showCannot = cannotRoll(base.op);
    setCannot(showCannot);
    run.cur = { a: base.a, b: base.b, r: base.r, op: base.op, miss: 'all', cannot: showCannot,
      sols: sols, found: [], slots: ['', ''], active: 0, mistakeLogged: false };
    renderAll();
    return;
  }

  els.pairInfo.hidden = true;
  els.pairInfo.innerHTML = '';
  var miss = S.miss === 'all' ? 'r' : S.miss;
  if(miss === 'rab') miss = ['r','a','b'][Math.floor(Math.random() * 3)];
  else if(miss === 'ab') miss = Math.random() < 0.5 ? 'a' : 'b';
  var showCannot = cannotRoll(base.op);
  setCannot(showCannot);
  run.cur = { a: base.a, b: base.b, r: base.r, op: base.op, miss: miss, cannot: showCannot };
  renderEq();
  if(isTiles()) buildTiles();
  if(isDictation()) speakCurrent(false);
}

function startTrick(){
  var lo = Math.max(1, S.from);
  var a = lo + Math.floor(Math.random() * Math.max(1, S.limit - lo + 1));
  run.vmax = S.limit;
  run.typed = '';
  run.curDone = false;
  run.shownAt = Date.now();
  run.cur = { a: a, b: 0, r: null, op: '÷', miss: 'r', trick: true, cannot: true };
  els.eqw.className = 'eqwrap eqw v-qcard';
  els.cap.textContent = '';
  els.cap.className = 'cap';
  els.pairInfo.hidden = true;
  els.pairInfo.innerHTML = '';
  els.eq.innerHTML = '<span class="opd">' + a + '</span><span class="op">÷</span><span class="opd">0</span>' +
    '<span class="op">=</span><span class="slot empty" id="slot"></span>';
  els.cannotBtn.hidden = false;
  els.cannotBtn.style.visibility = '';
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
  if(!run || run.locked || run.done || run.paused || !run.cur || !run.cur.trick) return;
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
  if(els.dict){
    els.eq.hidden = isDictation();
    els.dict.hidden = !isDictation();
    if(isDictation()){
      els.dictNote.textContent = tr('Нажми на динамик, чтобы повторить один раз', 'Tap the speaker to listen once more');
      els.dictLabel.textContent = isFullDictation()
        ? tr('Слушай диктант', 'Listen to the dictation')
        : tr('Слушай пример', 'Listen to the example');
    }
  }
  updateDictUI();
  updateBeadsBtn();
}

function dictStop(){
  if(window.DictationAudio) DictationAudio.stop();
  if(els.dict) els.dict.classList.remove('playing');
}
function revealDictation(){
  if(!isDictation()) return;
  dictStop();
  if(els.eq) els.eq.hidden = false;
  if(els.dict) els.dict.hidden = true;
}
function updateDictUI(){
  if(!els.dict) return;
  var left = run && run.dictLeft ? run.dictLeft : 0;
  els.dictLeft.textContent = left;
  els.dictRepeat.disabled = left <= 0;
  els.dictRepeat.setAttribute('aria-disabled', left <= 0 ? 'true' : 'false');
  updateDictAnswer();
}
function updateDictAnswer(){
  if(!els.dictAnswer) return;
  if(!isDictation() || isTiles()){ els.dictAnswer.hidden = true; els.dictAnswer.textContent = ''; return; }
  els.dictAnswer.hidden = false;
  els.dictAnswer.textContent = run && run.typed ? run.typed : '';
}
function fullSequence(c){
  var a = c.a, b = c.b, variants;
  if(c.op === '+'){
    variants = [
      ['p_sum_find','m'+a,'i'+b],
      ['p_sum_calc','m'+a,'i'+b],
      ['p_term1','m'+a,'p_term2','m'+b,'p_sum_short']
    ];
  } else if(c.op === '−'){
    variants = [
      ['p_diff_find','m'+a,'i'+b],
      ['p_diff_calc','m'+a,'i'+b],
      ['p_minuend','m'+a,'p_subtrahend','m'+b,'p_diff_short']
    ];
    if(a > b){
      variants.push(['p_howmuch','m'+a,'p_more','g'+b]);
      variants.push(['p_howmuch','m'+b,'p_less','g'+a]);
    }
  } else if(c.op === '×'){
    variants = [
      ['p_prod_find','m'+a,'i'+b],
      ['p_prod_calc','m'+a,'i'+b],
      ['p_factor1','m'+a,'p_factor2','m'+b,'p_prod_short']
    ];
  } else {
    variants = [
      ['p_quot_find','m'+a,'i'+b],
      ['p_quot_calc','m'+a,'i'+b],
      ['p_dividend','m'+a,'p_divisor','m'+b,'p_quot_short']
    ];
    if(a > b){
      variants.push(['p_howmany','m'+a,'p_more','g'+b]);
      variants.push(['p_howmany','m'+b,'p_less','g'+a]);
    }
  }
  return variants[Math.floor(Math.random() * variants.length)];
}
function speakCurrent(repeat){
  if(!isDictation() || !run || run.paused || !run.cur || run.curDone || run.done) return;
  if(repeat && (!run.dictLeft || run.dictLeft <= 0)) return;
  if(!window.DictationAudio) return;
  var cur = run.cur, tok = run.tok;
  function playIt(){
    if(!isDictation() || !run || run.tok !== tok || run.curDone || run.done) return;
    var info = isFullDictation()
      ? DictationAudio.playKeys(run.dictKeys || (run.dictKeys = fullSequence(cur)), 'full')
      : DictationAudio.play(cur.a, cur.op, cur.b);
    if(!info) return;
    if(repeat){
      run.dictLeft = Math.max(0, run.dictLeft - 1);
      updateDictUI();
    }
    run.shownAt = Date.now() + Math.round(info.duration * 1000);
    var pt = (run.dictPlayTok || 0) + 1;
    run.dictPlayTok = pt;
    els.dict.classList.add('playing');
    setTimeout(function(){
      if(run && run.cur === cur && run.dictPlayTok === pt) els.dict.classList.remove('playing');
    }, Math.round(info.duration * 1000) + 60);
  }
  if(DictationAudio.isReady(dictBank())){ playIt(); return; }
  els.dict.classList.add('playing');
  DictationAudio.load(dictBank()).then(function(){
    els.dict.classList.remove('playing');
    playIt();
  }, function(){
    els.dict.classList.remove('playing');
    if(els.dictNote) els.dictNote.textContent = tr('Не удалось загрузить озвучку.', 'Could not load the audio.');
  });
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
  updateDictAnswer();
}

function pressAll(k){
  if(!run || run.locked || run.done || run.paused || !run.cur) return;
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
  if(!c || run.locked || run.done || run.paused) return;
  var x = parseInt(c.slots[0], 10), y = parseInt(c.slots[1], 10);
  if(!isFinite(x) || !isFinite(y)) return;
  var mathOk = c.op === '+' ? (x + y === c.r)
    : c.op === '−' ? (x - y === c.r)
    : c.op === '×' ? (x * y === c.r)
    : (y !== 0 && x === c.r * y);
  var comm = c.op === '+' || c.op === '×';
  var key = comm ? [Math.min(x, y), Math.max(x, y)] : [x, y];
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
  if(!run || run.locked || run.done || run.paused || !run.cur) return;
  unlockAudio();
  if(k === 'none'){
    if(run.cur.trick) judgeTrick('none', null);
    else if(run.cur.miss === 'all') judgeAllNone();
    else judge('none', null);
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
  var withCannot = !!c.cannot;
  var n = tileCount(), numerics = n - (withCannot ? 1 : 0);
  var max = Math.max(run.vmax, numerics, correct);
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
  if(withCannot) opts.push('none');
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
  if(!run || run.locked || run.done || run.paused || !run.cur || run.typed === '') return;
  judge(parseInt(run.typed, 10), null);
}

function judge(val, tileBtn){
  if(!run || run.locked || run.done || run.paused || !run.cur) return;
  var cur = run.cur;
  var need = cur.miss === 'r' ? cur.r : cur.miss === 'a' ? cur.a : cur.b;
  var dt = Math.max(0, Date.now() - run.shownAt);
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
  if(isDictation()) revealDictation();
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
    }, isDictation() ? 900 : 380);
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

function judgeAllNone(){
  if(!run || run.locked || run.done || run.paused || !run.cur) return;
  var cur = run.cur, dt = Date.now() - run.shownAt;
  run.locked = true;
  run.tok++;
  run.curDone = true;
  run.tSum += dt;
  run.tN++;
  if(!run.minMs || dt < run.minMs) run.minMs = dt;
  if(dt > run.maxMs) run.maxMs = dt;
  run.bad++;
  run.records.push({ a: cur.a, b: cur.b, op: cur.op, ms: dt, ok: false });
  if(!cur.mistakeLogged){
    cur.mistakeLogged = true;
    run.mistakes.push({ q: '□ ' + cur.op + ' □ = ' + cur.r, ua: answerText('none'), miss: 'all' });
  }
  playWrong();
  if(navigator.vibrate){ try{ navigator.vibrate(80); }catch(e){} }
  els.eqw.classList.add('bad');
  els.cap.textContent = tr('Неверно', 'Incorrect');
  els.cap.className = 'cap bad';
  updateScore();
  var tok = run.tok;
  setTimeout(function(){
    if(run && run.tok === tok && !run.done){ run.locked = false; nextExercise(); }
  }, 1500);
}

function skipExercise(){
  if(!run || run.locked || run.done || run.paused || !run.cur || run.curDone) return;
  var cur = run.cur;
  var q = cur.trick ? cur.a + ' ÷ 0 = ?'
    : cur.miss === 'all' ? '□ ' + cur.op + ' □ = ' + cur.r
    : cur.a + ' ' + cur.op + ' ' + cur.b + ' = ' + cur.r;
  run.locked = true;
  run.curDone = true;
  run.tok++;
  if(isDictation()) dictStop();
  run.skipped.push({ q: q });
  els.cap.textContent = tr('Пропущено', 'Skipped');
  els.cap.className = 'cap note';
  var tok = run.tok;
  setTimeout(function(){
    if(run && run.tok === tok && !run.done){ run.locked = false; nextExercise(); }
  }, 500);
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
  run.unsolved.forEach(function(m){
    if(typeof m.a === 'number') add(m.a, m.b, m.op);
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
  var elapsed = Math.max(0, Date.now() - run.shownAt);
  var avg = run.tSum / run.tN;
  if(elapsed <= avg) return;
  var c = run.cur;
  var dup = run.unsolved.some(function(u){ return u.a === c.a && u.b === c.b && u.op === c.op; });
  if(dup) return;
  run.unsolved.push({
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
  if(isDictation()) dictStop();
  clearInterval(run.timer);
  if(run.paused){
    run.start += Date.now() - run.pausedAt;
    run.paused = false;
    run.pausedAt = 0;
  }
  if(els.game) els.game.classList.remove('paused');
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
  updatePauseUI();
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
  els.resTitle.innerHTML = tico(reason === 'time' ? '⏰' : reason === 'stop' ? '✋' : reason === 'done' ? '🌟' : '🎉') + (
    reason === 'time'
    ? tr('Время вышло', 'Time is up')
    : reason === 'stop'
      ? tr('Тренировка остановлена', 'Training stopped')
      : reason === 'done'
        ? (run.listKind === 'fluency'
            ? tr('Все примеры на беглость пройдены!', 'All fluency problems completed!')
            : tr('Все ошибки проработаны!', 'All mistakes reviewed!'))
        : tr('Готово', 'Done'));
  var total = run.ok + run.bad;
  var skipped = run.skipped || [];
  if(!total){
    els.verdict.textContent = skipped.length
      ? tr('Все задания пропущены. Это не ошибки — просто вернись, когда будет удобно. 🙂', 'All tasks were skipped. Not mistakes — come back when you feel like it. 🙂')
      : tr('Ни одного ответа. Давай попробуем ещё раз — всё получится! 🙂', 'No answers yet. Let’s try again — you can do it! 🙂');
    els.verdict.className = skipped.length ? 'verdict' : 'verdict g0';
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
  els.rSkip.textContent = skipped.length;
  els.rAcc.textContent = total ? Math.round(run.ok / total * 100) + '%' : '—';
  els.rAvg.textContent = run.tN ? fmtSec1(run.tSum / run.tN) : '—';
  els.rFast.textContent = run.tN ? fmtSec1(run.minMs) : '—';
  els.rSlow.textContent = run.tN ? fmtSec1(run.maxMs) : '—';
  els.rDur.textContent = fmt(durSec);
  els.misTitle.innerHTML = tico('🐞') + tr('Ошибки: ', 'Mistakes: ') + run.bad;
  if(!run.bad){
    els.misList.innerHTML = '<div class="none">' + tr('Ошибок нет', 'No mistakes') + '</div>';
  } else {
    els.misList.innerHTML = run.mistakes.map(function(m){
      return '<div class="mrow">' + m.q +
        '<span class="ua">' + tr('вы: ', 'you: ') + m.ua + '</span></div>';
    }).join('');
  }
  els.skippedCard.hidden = !skipped.length;
  if(skipped.length){
    els.skippedTitle.innerHTML = tico('⏭️') + tr('Пропущено: ', 'Skipped: ') + skipped.length;
    els.skippedList.innerHTML = skipped.map(function(s){
      return '<div class="mrow">' + s.q +
        '<span class="ua skipped">' + tr('пропущено', 'skipped') + '</span></div>';
    }).join('');
  } else {
    els.skippedList.innerHTML = '';
  }
  els.unsolvedCard.hidden = !run.unsolved.length;
  if(run.unsolved.length){
    els.unsolvedTitle.innerHTML = tico('🤔') + tr('Не решено: ', 'Not solved: ') + run.unsolved.length;
    els.unsolvedList.innerHTML = run.unsolved.map(function(u){
      return '<div class="mrow">' + u.q +
        '<span class="ua missed">' + tr('не решено', 'not solved') + '</span></div>';
    }).join('');
  } else {
    els.unsolvedList.innerHTML = '';
  }
  renderPairs(run);
  if(reason === 'done'){
    els.verdict.textContent = run.listKind === 'fluency'
      ? tr('Все примеры на беглость пройдены — отличная скорость! 🎉', 'All fluency problems completed — great speed! 🎉')
      : tr('Все задания повторены — список пуст! 🎉', 'All tasks reviewed — the list is empty! 🎉');
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
  els.slowTitle.innerHTML = tico('🐢') + tr('Медленные, но верные: ', 'Slow but correct: ') + slow.length;
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
  return opts.sort(function(a, b){ return a - b; });
}
function renderRetry(){
  retryState = null;
  var m = run.unsolved.length ? run.unsolved[0] : null;
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
    fmt: isDictation() ? (isFullDictation() ? 'full' : 'dictation') : 'visual',
    kind: run.listKind || 'review',
    dur: durSec, ok: run.ok, bad: run.bad, skip: run.skipped.length, psec: S.min * 60 + S.sec, hardEx: hex
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
    desc += r.fmt === 'full'
      ? ' · ' + tr('математический диктант', 'math dictation')
      : r.fmt === 'dictation' ? ' · ' + tr('диктант', 'dictation') : '';
    var skipN = r.skip || 0;
    var html = '<div class="hrow">' + fmtDate(r.t) + ' · ' + desc +
      ' · ' + mode + ' · ' + tr('верно ', 'correct ') + r.ok + ', ' + r.bad + ' ' + pluralErr(r.bad) +
      (skipN ? ', ' + skipN + ' ' + tr('пропущено', 'skipped') : '') +
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
  if(S.carry && !hasAddSub()){
    ['add', 'sub'].forEach(function(op){
      if(S.ops.indexOf(op) < 0) S.ops.push(op);
    });
    S.ops = OPS_ALL.filter(function(o){ return S.ops.indexOf(o) >= 0; });
    syncSegs();
    updateHints();
  }
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
if(els.dictRepeat) els.dictRepeat.addEventListener('click', function(){
  unlockAudio();
  if(window.DictationAudio) DictationAudio.unlock();
  speakCurrent(true);
});
els.trickZero.addEventListener('change', function(){
  if(els.trickZero.checked) leaveDictation();
  S.trickZero = els.trickZero.checked;
  if(S.trickZero && S.ops.indexOf('div') < 0){
    S.ops.push('div');
    S.ops = OPS_ALL.filter(function(o){ return S.ops.indexOf(o) >= 0; });
    syncSegs();
    poolInfo();
  }
  saveSettings();
  updateHints();
});

each(document.querySelectorAll('.class-seg button'), function(b){
  b.addEventListener('click', function(){
    applyClass(Number(b.getAttribute('data-c')));
  });
});

each(document.querySelectorAll('.v-step'), function(b){
  b.addEventListener('click', function(){
    var input = $(b.getAttribute('data-target'));
    if(!input) return;
    var value = parseInt(input.value, 10);
    if(!isFinite(value)) value = 0;
    input.value = value + (Number(b.getAttribute('data-step')) || 0);
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  });
});

each(document.querySelectorAll('.seg'), function(seg){
  seg.addEventListener('click', function(e){
    var b = e.target && e.target.closest ? e.target.closest('button') : null;
    if(!b || !seg.contains(b) || !b.getAttribute('data-v')) return;
    var key = seg.getAttribute('data-key');
    var v = b.getAttribute('data-v');
    if(isDictation() && key === 'miss' && v !== 'r') leaveDictation();
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
    S[key] = key === 'rate' ? Number(v) : v;
    each(seg.querySelectorAll('button'), function(x){
      x.classList.toggle('on', x === b);
    });
    if(key === 'format'){
      enforceDictation();
      syncSegs();
      els.trickZero.checked = S.trickZero;
      updateHints();
      syncDictationUI();
      poolInfo();
      saveSettings();
      return;
    }
    if(key === 'rate'){
      if(window.DictationAudio) DictationAudio.setRate(S.rate);
      saveSettings();
      return;
    }
    if(key === 'voice'){
      if(window.DictationAudio){
        DictationAudio.setVoice(S.voice);
        if(isDictation()) DictationAudio.load(dictBank()).catch(function(){});
      }
      saveSettings();
      return;
    }
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
if(els.pauseBtn) els.pauseBtn.addEventListener('click', function(){ setPaused(!(run && run.paused)); });
if(els.skipBtn) els.skipBtn.addEventListener('click', skipExercise);
els.slowBtn.addEventListener('click', function(){
  if(!run || !run.slow || !run.slow.length) return;
  startHardList(run.slow, false, 'fluency');
});
els.unsolvedBtn.addEventListener('click', function(){
  if(!run || !run.unsolved || !run.unsolved.length) return;
  startHardList(run.unsolved, false, 'review');
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

/* ---- «На бусинах»: разрядный разбор примера ---- */
var beadsEls = {
  btn: document.getElementById('beadsBtn'),
  place: document.getElementById('placeBtn'),
  comp: document.getElementById('compBtn'),
  diff: document.getElementById('diffBtn'),
  panel: document.getElementById('beadsPanel'),
  eq: document.getElementById('beadsEq'),
  legend: document.getElementById('beadsLegend'),
  stage: document.getElementById('beadsStage'),
  note: document.getElementById('beadsNote'),
  next: document.getElementById('beadsNext'),
  prev: document.getElementById('beadsPrev'),
  dots: document.getElementById('beadsDots'),
  title: document.getElementById('beadsTitle'),
  close: document.getElementById('beadsClose')
};
var beadsState = {
  cur: null, mode: 'intro',
  aT: 0, aU: 0, bT: 0, bU: 0,
  wT: 0, wU: 0,
  selU: 0, exchanged: false, needEx: false, carry: false,
  rmT: 0, rmU: 0
};

function beadsCan(c){
  return !!c && c.miss === 'r' && (c.op === '+' || c.op === '−') &&
    c.a < 100 && c.b < 100 && (c.op === '+' ? c.a + c.b <= 100 : c.a >= c.b);
}
function beadsRod(cls){
  var h = '<span class="brod' + (cls || '') + '">', i;
  for(i = 0; i < 10; i++) h += '<i></i>';
  return h + '</span>';
}
function beadsUnit(cls){ return '<i class="bunit' + (cls || '') + '"></i>'; }
function beadsRods(n){
  var h = '', i;
  for(i = 0; i < n; i++) h += beadsRod();
  return h || '<span class="bz0">0</span>';
}
function beadsUnits(n){
  var h = '', i;
  for(i = 0; i < n; i++) h += beadsUnit();
  return h || '<span class="bz0">0</span>';
}
function beadsCard(t, u, live, hot){
  return '<div class="bcard' + (hot ? ' hot' : '') + '">' +
    '<div class="bcol"><span class="bcap">' + tr('десятки', 'tens') + '</span>' +
      '<div class="bz bz-t' + (live ? ' can' : '') + '">' + beadsRods(t) + '</div></div>' +
    '<div class="bcol"><span class="bcap">' + tr('единицы', 'ones') + '</span>' +
      '<div class="bz bz-u' + (live ? ' can' : '') + '">' + beadsUnits(u) + '</div></div>' +
    '</div>';
}
function beadsIsDone(){
  var st = beadsState, c = st.cur;
  if(!c) return false;
  if(c.op === '+') return st.exchanged || !st.carry;
  return st.rmT >= st.bT && st.rmU >= st.bU;
}
function beadsRepr(n, t, u){
  if(t && u) return tr(n + ' — это ' + t + ' дес. и ' + u + ' ед.',
                         n + ' is ' + t + ' tens and ' + u + ' ones');
  if(t) return tr(n + ' — это ' + t + ' дес.', n + ' is ' + t + ' tens');
  if(u) return tr(n + ' — это ' + u + ' ед.', n + ' is ' + u + ' ones');
  return tr(n + ' — это 0', n + ' is 0');
}
function beadsNote(){
  var st = beadsState, c = st.cur, t;
  if(!beadsEls.note || !c) return;
  if(st.mode === 'intro'){
    t = beadsRepr(c.a, st.aT, st.aU) + ', ' +
      beadsRepr(c.b, st.bT, st.bU).replace(/\.$/, '') + '. ';
    t += c.op === '+'
      ? tr('Складываем единицы с единицами, десятки с десятками.', 'Add ones to ones and tens to tens.')
      : tr('Вычитаем единицы из единиц, десятки из десятков.', 'Subtract ones from ones and tens from tens.');
  } else if(c.op === '+'){
    if(beadsIsDone()){
      t = tr('Получилось ' + st.wT + ' дес. и ' + st.wU + ' ед. Ответ: ' + c.r + '.',
             'Result: ' + st.wT + ' tens and ' + st.wU + ' ones. Answer: ' + c.r + '.');
      if(st.carry) t = tr('Десяток собран. ', 'Ten made. ') + t;
    } else {
      t = tr('Собери десяток: нажми на 10 бусин. Выбрано: ' + st.selU + ' из 10.',
             'Make a ten: tap 10 beads. Selected: ' + st.selU + ' of 10.');
    }
  } else if(beadsIsDone()){
    t = tr('Осталось ' + st.wT + ' дес. и ' + st.wU + ' ед. Ответ: ' + c.r + '.',
           'Left: ' + st.wT + ' tens and ' + st.wU + ' ones. Answer: ' + c.r + '.');
  } else if(st.needEx && !st.exchanged){
    t = tr('Единиц не хватает: ' + st.aU + ' меньше ' + st.bU + '. Нажми на палочку — разменяй её на 10 бусин.',
           'Not enough ones: ' + st.aU + ' < ' + st.bU + '. Tap a rod to trade it for 10 beads.');
  } else {
    t = tr('Убери ' + st.bT + ' дес. и ' + st.bU + ' ед. Убрано: ' + st.rmT + '/' + st.bT + ' дес., ' + st.rmU + '/' + st.bU + ' ед.',
           'Remove ' + st.bT + ' tens and ' + st.bU + ' ones. Removed: ' + st.rmT + '/' + st.bT + ' tens, ' + st.rmU + '/' + st.bU + ' ones.');
  }
  beadsEls.note.textContent = t;
}
function beadsRender(){
  var st = beadsState, c = st.cur;
  if(!c) return;
  beadsEls.eq.textContent = c.a + ' ' + c.op + ' ' + c.b;
  var h = '<div class="brow">';
  if(st.mode === 'intro'){
    h += beadsCard(st.aT, st.aU) + '<div class="bsign">' + c.op + '</div>' + beadsCard(st.bT, st.bU);
  } else {
    h += beadsCard(st.wT, st.wU, !beadsIsDone(), !beadsIsDone());
  }
  beadsEls.stage.innerHTML = h + '</div>';
  beadsNote();
  var btn = beadsEls.next;
  if(st.mode === 'intro'){
    btn.hidden = false;
    btn.textContent = tr('Дальше →', 'Next →');
  } else if(beadsIsDone()){
    btn.hidden = false;
    btn.textContent = tr('Понятно', 'Got it');
  } else {
    btn.hidden = true;
  }
}
function beadsClick(e){
  var st = beadsState, c = st.cur;
  if(!c || st.mode !== 'act') return;
  var el = e.target.closest ? e.target.closest('.brod, .bunit') : null;
  if(!el) return;
  var rod = el.classList.contains('brod'), unit = el.classList.contains('bunit');
  if(c.op === '+'){
    if(!unit || !st.carry || st.exchanged || el.classList.contains('sel')) return;
    el.classList.add('sel');
    st.selU++;
    if(st.selU >= 10){
      st.selU = 0;
      st.exchanged = true;
      st.wT += 1;
      st.wU -= 10;
      beadsRender();
    } else {
      beadsNote();
    }
    return;
  }
  if(st.needEx && !st.exchanged){
    if(rod){
      st.exchanged = true;
      st.wT -= 1;
      st.wU += 10;
      beadsRender();
    }
    return;
  }
  if(rod && st.rmT < st.bT){
    st.rmT++; st.wT--; beadsRender();
  } else if(unit && st.rmU < st.bU){
    st.rmU++; st.wU--; beadsRender();
  }
}
function beadsStart(){
  var st = beadsState, c = st.cur;
  if(!c) return;
  st.mode = 'act';
  st.selU = 0; st.rmT = 0; st.rmU = 0; st.exchanged = false;
  if(c.op === '+'){
    st.wT = st.aT + st.bT;
    st.wU = st.aU + st.bU;
    st.carry = st.wU >= 10;
    st.needEx = false;
  } else {
    st.wT = st.aT;
    st.wU = st.aU;
    st.carry = false;
    st.needEx = st.aU < st.bU;
  }
  beadsRender();
}
function beadsNext(){
  if(beadsState.mode === 'ten' || beadsState.mode === 'place' || beadsState.mode === 'sub' || beadsState.mode === 'comp' || beadsState.mode === 'diff'){ bvNext(); return; }
  if(!beadsState.cur) return;
  if(beadsState.mode === 'intro'){ beadsStart(); return; }
  beadsClose();
}
function beadsClose(){ bvClear(); if(beadsEls.panel) beadsEls.panel.hidden = true; }
function beadsOpen(mode){
  if(!run || !run.cur || run.done) return;
  var c = run.cur;
  if(mode !== 'beads'){
    bvOpen(mode);
    return;
  }
  if(!beadsCan(c)) return;
  bvClear();
  var st = beadsState;
  st.cur = c;
  st.mode = 'intro';
  st.aT = Math.floor(c.a / 10); st.aU = c.a % 10;
  st.bT = Math.floor(c.b / 10); st.bU = c.b % 10;
  st.wT = st.aT; st.wU = st.aU;
  st.selU = 0; st.rmT = 0; st.rmU = 0;
  st.exchanged = false; st.needEx = false; st.carry = false;
  beadsEls.panel.hidden = false;
  beadsRender();
  if(beadsEls.prev) beadsEls.prev.hidden = true;
  if(beadsEls.dots) beadsEls.dots.hidden = true;
  if(beadsEls.title) beadsEls.title.hidden = true;
}
function updateBeadsBtn(){
  var c = run && run.cur;
  var on = !!(c && !run.done && !isDictation());
  var okBeads = on && beadsCan(c);
  var okPlace = on && (bvCanTen(c) || bvCanSub(c));
  var okComp = on && bvCanComp(c);
  var okDiff = on && bvCanDiff(c);
  if(beadsEls.btn) beadsEls.btn.hidden = !okBeads;
  if(beadsEls.place) beadsEls.place.hidden = !okPlace;
  if(beadsEls.comp) beadsEls.comp.hidden = !okComp;
  if(beadsEls.diff) beadsEls.diff.hidden = !okDiff;
  if(!okBeads && !okPlace && !okComp && !okDiff) beadsClose();
}

/* ---- разборы: «По разрядам» и «Дополнение» (пошаговые) ---- */
var bvTimers = [];
var bvState = { mode: null, c: null, step: 0 };
function bvCanTen(c){
  return !!c && c.miss === 'r' && c.op === '+' && c.a < 100 && c.b < 100 &&
    c.a + c.b <= 100 && c.a % 10 > 0 && c.b % 10 > 0 && (c.a % 10) + (c.b % 10) >= 10;
}
function bvClear(){
  bvTimers = bvTimers || [];
  bvTimers.forEach(clearTimeout);
  bvTimers = [];
}
function bvParts(){
  var c = bvState.c, need = 10 - c.a % 10;
  return {
    aT: Math.floor(c.a / 10), aU: c.a % 10,
    bT: Math.floor(c.b / 10), bU: c.b % 10,
    need: need, rest: (c.b % 10) - need
  };
}
function bvRods(n){
  var h = '', i;
  for(i = 0; i < n; i++) h += beadsRod();
  return h;
}
function bvDots(n, cls){
  var h = '', i;
  for(i = 0; i < n; i++) h += '<i class="bunit' + (cls ? ' ' + cls : '') + '"></i>';
  return h;
}
function bvFrame(au, need, mode){
  var h = '<div class="bv-frame">', i;
  for(i = 0; i < au; i++) h += '<div class="bv-cell filled"><i class="bunit"></i></div>';
  for(i = 0; i < need; i++){
    h += mode === 'anim'
      ? '<div class="bv-cell" data-dst="1"></div>'
      : mode === 'shown'
        ? '<div class="bv-cell filled"><i class="bunit acc"></i></div>'
        : '<div class="bv-cell"></div>';
  }
  if(mode === 'anim') h += beadsRod(' bv-ten-rod');
  return h + '</div>';
}
function bvSlotRow(rest, need, withSrc){
  var h = '<div class="bv-row">', i;
  for(i = 0; i < rest; i++) h += '<i class="bunit acc"></i>';
  if(withSrc){
    for(i = 0; i < need; i++){
      h += '<span class="bv-slot"><span class="bv-slot-empty"></span>' +
        '<i class="bunit acc bv-src"></i></span>';
    }
  }
  return h + '</div>';
}
function bvPartCard(t, u){
  return '<div class="bcard bv-pcard">' +
    '<div class="bcol"><span class="bcap">' + tr('десятки', 'tens') + '</span>' +
    '<span class="bv-pnum t">' + (t * 10) + '</span>' +
    '<div class="bz bz-t">' + (t ? bvRods(t) : '<span class="bz0">0</span>') + '</div></div>' +
    '<div class="bcol"><span class="bcap">' + tr('единицы', 'ones') + '</span>' +
    '<span class="bv-pnum u">' + u + '</span>' +
    '<div class="bz bz-u">' + (u ? bvDots(u) : '<span class="bz0">0</span>') + '</div></div>' +
  '</div>';
}
function bvUnitsSum(n){
  if(!n) return '<div class="bv-row plain"><span class="bz0">0</span></div>';
  if(n < 10) return '<div class="bv-row plain">' + bvDots(n) + '</div>';
  return '<div class="bv-row plain"><span class="bv-tenout">' + bvDots(10) +
    '</span>' + bvDots(n - 10) + '</div>';
}
function bvSceneAnim(withTens){
  var p = bvParts(), h = '<div class="bv-scene">', i, fly = '';
  if(withTens){
    h += '<div class="bv-tens"><span class="bv-cap tn-cap">' +
      tr('десятки · ' + (p.aT * 10) + ' + ' + (p.bT * 10) + ' = ' + ((p.aT + p.bT) * 10),
         'tens · ' + (p.aT * 10) + ' + ' + (p.bT * 10) + ' = ' + ((p.aT + p.bT) * 10)) +
      '</span><div class="bv-rods">' + bvRods(p.aT + p.bT) + beadsRod(' bv-extra-rod') + '</div></div>';
  }
  h += '<div class="bv-urow">' +
    '<div class="bv-col"><span class="bv-num in">' + p.aU + '</span>' + bvFrame(p.aU, p.need, 'anim') + '</div>' +
    '<div class="bv-col"><span class="bv-num out">' + p.bU + '</span>' + bvSlotRow(p.rest, p.need, true) + '</div>' +
    '</div>';
  for(i = 0; i < p.need; i++) fly += '<i class="bunit bv-flyer"></i>';
  return h + fly + (withTens ? beadsRod(' bv-ten-flyer') : '') + '</div>';
}
function bvCanSub(c){
  return !!c && c.miss === 'r' && c.op === '−' && c.a < 100 && c.b < 100 &&
    c.a >= 10 && c.a > c.b && (c.a % 10) < (c.b % 10);
}
function bvSubVals(){
  var c = bvState.c, au = c.a % 10, bu = c.b % 10;
  return { au: au, bu: bu, at: Math.floor(c.a / 10), bt: Math.floor(c.b / 10), u2: au + 10, rem: au + 10 - bu };
}
function bvSubScene(){
  var v = bvSubVals(), rods = bvRods(v.at), dst = '', i;
  for(i = 0; i < 10; i++) dst += '<i class="bunit acc bv-sdst"></i>';
  return '<div class="bv-scene">' +
    '<div class="bv-tens"><span class="bv-cap">' + tr('десятки', 'tens') + '</span>' +
    '<div class="bv-rods">' + rods + '</div><span class="bv-num tn">' + (v.at * 10) + '</span></div>' +
    '<div class="bv-urow">' +
    '<div class="bv-col"><span class="bv-num in">' + v.au + '</span>' +
    '<div class="bv-units">' + bvDots(v.au) + dst + '</div></div>' +
    '<span class="bsign">−</span>' +
    '<div class="bv-col"><span class="bv-num out">' + v.bu + '</span>' +
    '<div class="bv-row plain">' + bvDots(v.bu, 'acc') + '</div></div>' +
    '</div>' +
    beadsRod(' bv-rod-flyer') +
  '</div>';
}
function bvSubAnimRun(){
  var scene = beadsEls.stage.querySelector('.bv-scene');
  if(!scene) return;
  var v = bvSubVals();
  var inNum = scene.querySelector('.bv-num.in');
  var tnNum = scene.querySelector('.bv-num.tn');
  var flyer = scene.querySelector('.bv-rod-flyer');
  var rods = scene.querySelectorAll('.bv-rods .brod');
  var lastRod = rods[rods.length - 1];
  var units = scene.querySelectorAll('.bv-sdst');
  var unitsBox = scene.querySelector('.bv-units');
  function reset(){
    inNum.textContent = v.au;
    tnNum.textContent = v.at * 10;
    inNum.classList.remove('bump');
    tnNum.classList.remove('bump');
    flyer.style.transition = 'none';
    flyer.style.opacity = '0';
    flyer.style.transform = 'translate(0,0)';
    units.forEach(function(b){ b.style.opacity = '0'; });
    lastRod.style.opacity = '1';
  }
  function center(el, fr){
    var r = el.getBoundingClientRect();
    return { x: r.left - fr.left + r.width / 2, y: r.top - fr.top + r.height / 2 };
  }
  function launch(){
    var fr = scene.getBoundingClientRect();
    var st = center(lastRod, fr), tt = center(unitsBox, fr);
    flyer.style.transition = 'none';
    flyer.style.transform = 'translate(' + (st.x - 28.5) + 'px,' + (st.y - 5) + 'px)';
    flyer.style.opacity = '1';
    void scene.offsetWidth;
    flyer.style.transition = 'transform .85s cubic-bezier(.45,.05,.3,1)';
    flyer.style.transform = 'translate(' + (tt.x - 28.5) + 'px,' + (tt.y - 5) + 'px)';
    lastRod.style.opacity = '0';
    inNum.textContent = v.u2;
    tnNum.textContent = (v.at - 1) * 10;
    inNum.classList.add('bump');
    tnNum.classList.add('bump');
  }
  function land(){
    flyer.style.opacity = '0';
    lastRod.style.opacity = '0';
    units.forEach(function(b){ b.style.opacity = '1'; });
  }
  function cycle(){
    reset();
    bvTimers.push(setTimeout(launch, 2000));
    bvTimers.push(setTimeout(land, 2900));
    bvTimers.push(setTimeout(cycle, 4600));
  }
  cycle();
}
function bvAnimRun(){
  var scene = beadsEls.stage.querySelector('.bv-scene');
  if(!scene) return;
  var p = bvParts();
  var inNum = scene.querySelector('.bv-num.in');
  var outNum = scene.querySelector('.bv-num.out');
  var flyers = scene.querySelectorAll('.bv-flyer');
  var srcs = scene.querySelectorAll('.bv-src');
  var dsts = scene.querySelectorAll('.bv-cell[data-dst]');
  var frameEl = scene.querySelector('.bv-frame');
  var dots = scene.querySelectorAll('.bv-frame .bunit');
  var extraRod = scene.querySelector('.bv-extra-rod');
  var tenFly = scene.querySelector('.bv-ten-flyer');
  var capEl = scene.querySelector('.tn-cap');
  var capInit = capEl ? capEl.textContent : '';
  var frameRod = scene.querySelector('.bv-ten-rod');
  function reset(){
    inNum.textContent = p.aU;
    outNum.textContent = p.bU;
    inNum.classList.remove('bump');
    outNum.classList.remove('bump');
    flyers.forEach(function(f){
      f.style.transition = 'none';
      f.style.opacity = '0';
      f.style.transform = 'translate(0,0)';
    });
    srcs.forEach(function(b){ b.style.opacity = '1'; });
    dsts.forEach(function(c){ c.innerHTML = ''; c.classList.remove('filled'); });
    if(frameEl) frameEl.classList.remove('to-ten');
    if(frameRod) frameRod.style.opacity = '0';
    dots.forEach(function(b){ b.style.opacity = '1'; });
    if(extraRod) extraRod.style.opacity = '0';
    if(tenFly){
      tenFly.style.transition = 'none';
      tenFly.style.opacity = '0';
      tenFly.style.transform = 'translate(0,0)';
    }
    if(capEl) capEl.textContent = capInit;
  }
  function center(el, fr){
    var r = el.getBoundingClientRect();
    return { x: r.left - fr.left + r.width / 2, y: r.top - fr.top + r.height / 2 };
  }
  function launch(){
    var fr = scene.getBoundingClientRect();
    flyers.forEach(function(f, i){
      var s = center(srcs[i], fr);
      f.style.transition = 'none';
      f.style.transform = 'translate(' + (s.x - 7) + 'px,' + (s.y - 7) + 'px)';
      f.style.opacity = '1';
    });
    void scene.offsetWidth;
    flyers.forEach(function(f, i){
      var t = center(dsts[i], fr);
      f.style.transition = 'transform .85s cubic-bezier(.45,.05,.3,1)';
      f.style.transform = 'translate(' + (t.x - 7) + 'px,' + (t.y - 7) + 'px)';
    });
    srcs.forEach(function(b){ b.style.opacity = '0'; });
    inNum.textContent = '10';
    outNum.textContent = p.rest;
    inNum.classList.add('bump');
    outNum.classList.add('bump');
  }
  function land(){
    flyers.forEach(function(f){ f.style.opacity = '0'; });
    srcs.forEach(function(b){ b.style.opacity = '0'; });
    dsts.forEach(function(c){ c.innerHTML = '<i class="bunit acc"></i>'; c.classList.add('filled'); });
  }
  var isPlace = !!scene.querySelector('.bv-extra-rod');
  function morph(){
    if(frameEl) frameEl.classList.add('to-ten');
  }
  function flyTen(){
    if(!tenFly || !extraRod || !frameEl) return;
    scene.querySelectorAll('.bv-frame .bunit').forEach(function(b){ b.style.opacity = '0'; });
    var fr = scene.getBoundingClientRect();
    var st = center(frameEl, fr), tt = center(extraRod, fr);
    tenFly.style.transition = 'none';
    tenFly.style.transform = 'translate(' + (st.x - 28.5) + 'px,' + (st.y - 5) + 'px)';
    tenFly.style.opacity = '1';
    void scene.offsetWidth;
    tenFly.style.transition = 'transform .7s cubic-bezier(.45,.05,.3,1)';
    tenFly.style.transform = 'translate(' + (tt.x - 28.5) + 'px,' + (tt.y - 5) + 'px)';
  }
  function tenLand(){
    if(tenFly) tenFly.style.opacity = '0';
    if(extraRod) extraRod.style.opacity = '1';
    if(capEl){
      var pp = bvParts();
      capEl.textContent = tr('десятки · ' + ((pp.aT + pp.bT) * 10) + ' + 10 = ' + ((pp.aT + pp.bT + 1) * 10),
        'tens · ' + ((pp.aT + pp.bT) * 10) + ' + 10 = ' + ((pp.aT + pp.bT + 1) * 10));
    }
  }
  function cycle(){
    reset();
    bvTimers.push(setTimeout(launch, 2000));
    bvTimers.push(setTimeout(land, 2900));
    if(isPlace){
      bvTimers.push(setTimeout(morph, 3600));
      bvTimers.push(setTimeout(flyTen, 4100));
      bvTimers.push(setTimeout(tenLand, 4850));
      bvTimers.push(setTimeout(cycle, 6700));
    } else {
      bvTimers.push(setTimeout(morph, 3600));
      bvTimers.push(setTimeout(function(){
        scene.querySelectorAll('.bv-frame .bunit').forEach(function(b){ b.style.opacity = '0'; });
        if(frameRod) frameRod.style.opacity = '1';
      }, 4100));
      bvTimers.push(setTimeout(cycle, 6000));
    }
  }
  cycle();
}
function bvFlowWord(n){
  if(n === 1) return tr('Одна единица перетекает', '1 one flows');
  var d = n % 10, r = n % 100;
  if(d >= 2 && d <= 4 && (r < 12 || r > 14)) return tr(n + ' единицы перетекают', n + ' ones flow');
  return tr(n + ' единиц перетекают', n + ' ones flow');
}
function bvRepr(n, t, u){
  if(t && u) return tr(n + ' — это ' + t + ' и ' + u, n + ' is ' + t + ' and ' + u);
  if(t) return tr(n + ' — это ' + t, n + ' is ' + t);
  return tr(n + ' — это ' + u + ' ед.', n + ' is ' + u + ' ones');
}
function bvNote(mode, step){
  var c = bvState.c, p = bvParts();
  if(mode === 'comp') return bvCompNote(c, step);
  if(mode === 'diff') return bvDiffNote(c, step);
  if(mode === 'sub'){
    var v = bvSubVals();
    if(step === 0) return tr(bvRepr(c.a, v.at * 10, v.au) + ', ' + bvRepr(c.b, v.bt * 10, v.bu).replace(/\.$/, '') + '. Вычитаем единицы из единиц, десятки из десятков.',
      bvRepr(c.a, v.at * 10, v.au) + '; ' + bvRepr(c.b, v.bt * 10, v.bu) + '. Subtract ones from ones and tens from tens.');
    if(step === 2) return tr('Единиц не хватало: ' + v.au + ' меньше ' + v.bu + ', поэтому разменяли десяток на 10 единиц.',
      'There were not enough ones: ' + v.au + ' is less than ' + v.bu + ', so we traded a ten for 10 ones.');
    if(step === 1) return tr('Разменяли десяток: стало ' + v.u2 + ' единиц, а десятков ' + (v.at - 1) + '. Теперь можно вычесть ' + v.bu + '.',
      'Traded a ten: now ' + v.u2 + ' ones and ' + (v.at - 1) + ' tens. Now we can subtract ' + v.bu + '.');
    return tr('Убираем ' + v.bu + ': ' + v.u2 + ' − ' + v.bu + ' = ' + v.rem + '. Десятков осталось ' + (v.at - 1 - v.bt) + '. Ответ: ' + c.r + '.',
      'Take away ' + v.bu + ': ' + v.u2 + ' − ' + v.bu + ' = ' + v.rem + '. Tens left: ' + (v.at - 1 - v.bt) + '. Answer: ' + c.r + '.');
  }
  if(mode === 'ten'){
    if(step === 0) return tr('Дополни ' + p.aU + ' до 10: посмотри, сколько мест свободно в рамке. Не хватает ' + p.need + '.',
      'Complete ' + p.aU + ' to 10: count the free places. You need ' + p.need + '.');
    if(step === 1) return tr('Единицы: ' + p.aU + ' + ' + p.bU + ' = ' + (p.aU + p.bU) + '. ' + p.aU + ' + ' + p.need + ' = 10 — это десяток, у ' + p.bU + ' остаётся ' + p.rest + '. Десяток уходит к десяткам.',
      'Ones: ' + p.aU + ' + ' + p.bU + ' = ' + (p.aU + p.bU) + '. ' + p.aU + ' + ' + p.need + ' = 10 — that is a ten, and ' + p.rest + ' is left of ' + p.bU + '. The ten joins the tens.');
    return tr('10 + ' + p.rest + ' = ' + (p.aU + p.bU) + '. Десяток и ' + p.rest + ' — вот и весь разряд единиц.',
      '10 + ' + p.rest + ' = ' + (p.aU + p.bU) + '. That is one ten and ' + p.rest + ' ones.');
  }
  if(step === 0) return tr(bvRepr(c.a, p.aT * 10, p.aU) + ', ' + bvRepr(c.b, p.bT * 10, p.bU).replace(/\.$/, '') + '. Складываем единицы с единицами, десятки с десятками.',
    bvRepr(c.a, p.aT * 10, p.aU) + '; ' + bvRepr(c.b, p.bT * 10, p.bU) + '. Add ones to ones and tens to tens.');
  if(step === 2) return tr('Десятки: ' + (p.aT * 10) + ' + ' + (p.bT * 10) + ' = ' + ((p.aT + p.bT) * 10) + '. Единицы: ' + p.aU + ' + ' + p.bU + ' = ' + (p.aU + p.bU) + ' — это десяток и ' + p.rest + '.',
    'Tens: ' + (p.aT * 10) + ' + ' + (p.bT * 10) + ' = ' + ((p.aT + p.bT) * 10) + '. Ones: ' + p.aU + ' + ' + p.bU + ' = ' + (p.aU + p.bU) + ' — a ten and ' + p.rest + '.');
  if(step === 1) return tr(bvFlowWord(p.need) + ' к ' + p.aU + ' — получается десяток, у ' + p.bU + ' остаётся ' + p.rest + '. Десяток уходит к десяткам: ' + ((p.aT + p.bT) * 10) + ' + 10 = ' + ((p.aT + p.bT + 1) * 10) + '.',
    'Two ones flow to ' + p.aU + ' — a ten forms, and ' + p.rest + ' is left of ' + p.bU + '. The ten joins the tens: ' + ((p.aT + p.bT) * 10) + ' + 10 = ' + ((p.aT + p.bT + 1) * 10) + '.');
  return tr(((p.aT + p.bT) * 10) + ' + 10 = ' + ((p.aT + p.bT + 1) * 10) + ', да ещё ' + p.rest + ' — ответ ' + c.r + '.',
    ((p.aT + p.bT) * 10) + ' + 10 = ' + ((p.aT + p.bT + 1) * 10) + ', plus ' + p.rest + ' — answer ' + c.r + '.');
}
function bvStepHtml(mode, step){
  var c = bvState.c, p = bvParts(), h = '';
  if(mode === 'comp') return bvCompHtml(c, step);
  if(mode === 'diff') return bvDiffHtml(c, step);
  if(mode === 'sub'){
    var v = bvSubVals();
    if(step === 0){
      h = '<div class="bv-scene"><div class="brow">' + bvPartCard(v.at, v.au) +
        '<div class="bsign">−</div>' + bvPartCard(v.bt, v.bu) + '</div></div>';
    } else if(step === 2){
      h = '<div class="bv-scene"><div class="bv-sums">' +
        '<div class="bv-sum t"><span class="bv-eq">' + tr('десятки', 'tens') + ' · ' + (v.at * 10) + '</span>' +
        '<div class="bv-rods">' + bvRods(v.at) + '</div></div>' +
        '<div class="bv-sum u"><span class="bv-eq">' + v.au + ' − ' + v.bu + '</span>' +
        '<div class="bv-row plain">' + bvDots(v.au) + '</div><b>' + tr('не хватает', 'not enough') + '</b></div>' +
        '</div></div>';
    } else if(step === 1){
      h = bvSubScene();
    } else {
      h = '<div class="bv-final">' +
        '<div class="bv-col"><span class="bv-cap">' + tr('десятки', 'tens') + '</span><div class="bv-rods">' +
        bvRods(v.at - 1 - v.bt) + '</div><span class="bv-num">' + ((v.at - 1 - v.bt) * 10) + '</span></div>' +
        '<span class="bsign">+</span>' +
        '<div class="bv-col"><span class="bv-cap">' + tr('единицы', 'ones') + '</span><div class="bv-row plain">' +
        (v.rem ? bvDots(v.rem, 'acc') : '<span class="bz0">0</span>') + '</div><span class="bv-num out">' + v.rem + '</span></div>' +
        '<span class="bsign">=</span><span class="bv-big">' + c.r + '</span></div>';
    }
    return h;
  }
  if(mode === 'ten'){
    if(step === 0){
      h = '<div class="bv-scene"><div class="bv-urow">' +
        '<div class="bv-col"><span class="bv-num in">' + p.aU + '</span>' + bvFrame(p.aU, p.need, 'empty') + '</div>' +
        '<div class="bv-col"><span class="bv-num out">' + p.bU + '</span>' + bvSlotRow(p.bU, 0, false) + '</div>' +
        '</div></div>';
    } else if(step === 1){
      h = bvSceneAnim(false);
    } else {
      h = '<div class="bv-final">' +
        '<div class="bv-col"><div class="bv-frame">' + bvDots(p.aU + p.need) + '</div><span class="bv-num">10</span></div>' +
        '<span class="bsign">+</span>' +
        '<div class="bv-col"><div class="bv-row plain">' + (p.rest ? bvDots(p.rest, 'acc') : '<span class="bz0">0</span>') + '</div><span class="bv-num out">' + p.rest + '</span></div>' +
        '</div>';
    }
    return h;
  }
  if(step === 0){
    h = '<div class="bv-scene"><div class="brow">' + bvPartCard(p.aT, p.aU) +
      '<div class="bsign">+</div>' + bvPartCard(p.bT, p.bU) + '</div></div>';
  } else if(step === 2){
    h = '<div class="bv-scene"><div class="bv-sums">' +
      '<div class="bv-sum t"><span class="bv-eq t-eq">' + (p.aT * 10) + ' + ' + (p.bT * 10) + '</span>' +
      '<div class="bv-rods">' + bvRods(p.aT + p.bT) + beadsRod(' bv-sum-extra') + '</div>' +
      '<b class="t-res">= ' + ((p.aT + p.bT) * 10) + '</b></div>' +
      '<div class="bv-sum u"><span class="bv-eq">' + p.aU + ' + ' + p.bU + '</span>' + bvUnitsSum(p.aU + p.bU) +
      '<b class="u-res">= ' + (p.aU + p.bU) + '</b></div>' +
      '</div>' + beadsRod(' bv-sum-flyer') + '</div>';
  } else if(step === 1){
    h = bvSceneAnim(true);
  } else {
    h = '<div class="bv-final">' +
      '<div class="bv-col"><span class="bv-cap">десятки</span><div class="bv-rods">' +
      bvRods(p.aT + p.bT + 1) + '</div><span class="bv-num">' + ((p.aT + p.bT + 1) * 10) + '</span></div>' +
      '<span class="bsign">+</span>' +
      '<div class="bv-col"><span class="bv-cap">единицы</span><div class="bv-row plain">' +
      (p.rest ? bvDots(p.rest, 'acc') : '<span class="bz0">0</span>') + '</div><span class="bv-num out">' + p.rest + '</span></div>' +
      '<span class="bsign">=</span><span class="bv-big">' + c.r + '</span></div>';
  }
  return h;
}
function bvTitle(mode, step){
  if(mode === 'comp') return bvCompTitle(bvState.c.op === '−', step);
  if(mode === 'diff'){
    if(step === 0) return tr('Уравниваем числа', 'Level both numbers');
    if(step === 1) return tr('Считаем', 'Count');
    return tr('Получаем результат', 'Get the result');
  }
  if(mode === 'ten'){
    if(step === 0) return tr('Сколько не хватает до десятка', 'How many to make ten');
    if(step === 1) return tr('Собираем десяток из единиц', 'Make a ten from ones');
    return tr('Получаем результат', 'Get the result');
  }
  if(mode === 'sub'){
    if(step === 0) return tr('Раскладываем на десятки и единицы', 'Split into tens and ones');
    if(step === 1) return tr('Размениваем десяток на единицы', 'Trade a ten for ones');
    if(step === 2) return tr('Считаем единицы и десятки', 'Count ones and tens');
    return tr('Получаем результат', 'Get the result');
  }
  if(step === 0) return tr('Раскладываем на десятки и единицы', 'Split into tens and ones');
  if(step === 1) return tr('Считаем единицы и собираем десяток', 'Count ones, make a ten');
  if(step === 2) return tr('Считаем десятки и вспоминаем единицы', 'Count tens, recall ones');
  return tr('Получаем результат', 'Get the result');
}
function bvSummaryRun(){
  var scene = beadsEls.stage.querySelector('.bv-scene');
  if(!scene) return;
  var p = bvParts();
  var ten = scene.querySelector('.bv-tenout');
  var flyer = scene.querySelector('.bv-sum-flyer');
  var extraRod = scene.querySelector('.bv-sum-extra');
  var tEq = scene.querySelector('.t-eq');
  var tRes = scene.querySelector('.t-res');
  var uRes = scene.querySelector('.u-res');
  if(!ten || !flyer || !extraRod || !tEq || !tRes || !uRes) return;
  var eqInit = tEq.textContent, resInit = tRes.textContent, uInit = uRes.textContent;
  var newEq = ((p.aT + p.bT) * 10) + ' + 10';
  var newTRes = '= ' + ((p.aT + p.bT + 1) * 10);
  var newURes = '= ' + p.rest;
  function reset(){
    ten.classList.remove('ten-blue');
    ten.style.opacity = '1';
    flyer.style.transition = 'none';
    flyer.style.opacity = '0';
    flyer.style.transform = 'translate(0,0)';
    extraRod.style.opacity = '0';
    extraRod.classList.remove('bump');
    tEq.textContent = eqInit;
    tRes.textContent = resInit;
    tRes.classList.remove('bump');
    uRes.textContent = uInit;
  }
  function center(el, fr){
    var r = el.getBoundingClientRect();
    return { x: r.left - fr.left + r.width / 2, y: r.top - fr.top + r.height / 2 };
  }
  function blue(){
    ten.classList.add('ten-blue');
  }
  function flyTen(){
    ten.style.opacity = '0';
    uRes.textContent = newURes;
    var fr = scene.getBoundingClientRect();
    var st = center(ten, fr), tt = center(extraRod, fr);
    flyer.style.transition = 'none';
    flyer.style.transform = 'translate(' + (st.x - 28.5) + 'px,' + (st.y - 5) + 'px)';
    flyer.style.opacity = '1';
    void scene.offsetWidth;
    flyer.style.transition = 'transform .7s cubic-bezier(.45,.05,.3,1)';
    flyer.style.transform = 'translate(' + (tt.x - 28.5) + 'px,' + (tt.y - 5) + 'px)';
  }
  function land(){
    flyer.style.opacity = '0';
    extraRod.style.opacity = '1';
    extraRod.classList.add('bump');
    tEq.innerHTML = (p.aT * 10) + ' <span class="bv-plus10">+ 10</span>';
    tRes.textContent = newTRes;
    tRes.classList.add('bump');
  }
  function cycle(){
    reset();
    bvTimers.push(setTimeout(blue, 1200));
    bvTimers.push(setTimeout(flyTen, 2800));
    bvTimers.push(setTimeout(land, 3500));
    bvTimers.push(setTimeout(cycle, 6200));
  }
  cycle();
}
function bvRender(){
  var s = bvState.step, mode = bvState.mode;
  bvClear();
  beadsEls.eq.textContent = bvState.c.a + ' ' + bvState.c.op + ' ' + bvState.c.b;
  beadsEls.stage.innerHTML = bvStepHtml(mode, s);
  beadsEls.note.textContent = bvNote(mode, s);
  beadsEls.next.hidden = false;
  var total = (mode === 'ten' || mode === 'diff') ? 3 : 4;
  beadsEls.next.textContent = s >= total - 1 ? tr('Понятно', 'Got it') : tr('Дальше →', 'Next →');
  if(beadsEls.prev){ beadsEls.prev.hidden = false; beadsEls.prev.disabled = s <= 0; }
  if(beadsEls.dots){
    var dh = '', i;
    for(i = 0; i < total; i++) dh += '<i' + (i === s ? ' class="on"' : '') + '></i>';
    beadsEls.dots.innerHTML = dh;
    beadsEls.dots.hidden = false;
  }
  if(beadsEls.title){
    beadsEls.title.textContent = bvTitle(mode, s);
    beadsEls.title.hidden = false;
  }
  if(mode === 'place' && s === 2) bvSummaryRun();
  if(s === 1 && mode !== 'comp' && mode !== 'diff'){
    if(mode === 'sub') bvSubAnimRun();
    else bvAnimRun();
  }
}
function bvCompVals(c){
  var d = c.b % 10;
  var k = d >= 8 ? 10 - d : d <= 2 ? -d : 0;
  if(!k) return null;
  var b2 = c.b + k;
  if(b2 < 10 || b2 > 90) return null;
  return { k: k, b2: b2 };
}
function bvCanComp(c){
  if(!c || c.miss !== 'r' || (c.op !== '+' && c.op !== '−')) return false;
  if(c.a >= 100 || c.b >= 100) return false;
  if(c.op === '+' && c.a + c.b > 100) return false;
  if(c.op === '−' && c.a < c.b) return false;
  return !!bvCompVals(c);
}
function bvDiffVals(c){
  if(!c || c.op !== '−') return null;
  var d = c.b % 10;
  if(!d) return null;
  var k = d <= 5 ? -d : 10 - d;
  var a2 = c.a + k, b2 = c.b + k;
  if(a2 < 0 || a2 > 100 || b2 < 0 || b2 > 100) return null;
  return { k: k, a2: a2, b2: b2 };
}
function bvCanDiff(c){
  return !!c && c.miss === 'r' && c.a >= 10 && c.a < 100 && c.b < 100 &&
    c.a >= c.b && (c.a % 10) < (c.b % 10) && !!bvDiffVals(c);
}
function bvCompTitle(sub, step){
  if(step === 0) return sub ? tr('Округляем вычитаемое', 'Round the subtrahend') : tr('Округляем слагаемое', 'Round the addend');
  if(step === 1) return tr('Считаем с круглым числом', 'Count with the round number');
  if(step === 2) return sub ? tr('Возвращаем разницу', 'Add the difference back') : tr('Поправляем результат', 'Adjust the result');
  return tr('Получаем результат', 'Get the result');
}
function bvCompNote(c, step){
  var v = bvCompVals(c), kk = Math.abs(v.k), b2 = v.b2, d = c.b % 10;
  var inter = c.op === '+' ? c.a + b2 : c.a - b2;
  var sub = c.op === '−';
  if(step === 0){
    if(!sub) return tr(c.b + ' ближе к ' + b2 + ': округляем — ' + (v.k > 0 ? 'прибавили ' + kk + ' лишних.' : 'прибавили на ' + kk + ' меньше.'),
      c.b + ' is close to ' + b2 + ': round it — ' + (v.k > 0 ? 'we added ' + kk + ' extra.' : 'we added ' + kk + ' less.'));
    return tr(c.b + ' ближе к ' + b2 + ': ' + (v.k > 0 ? 'вычли на ' + kk + ' больше — потом вернём.' : 'вычли на ' + kk + ' меньше — потом добавим.'),
      c.b + ' is close to ' + b2 + ': ' + (v.k > 0 ? 'we subtracted ' + kk + ' too many — we will add it back.' : 'we subtracted ' + kk + ' too few — we will add it.'));
  }
  if(step === 1) return tr('Считаем с круглым числом: ' + c.a + ' ' + c.op + ' ' + b2 + ' = ' + inter + '.',
    'Count with the round number: ' + c.a + ' ' + c.op + ' ' + b2 + ' = ' + inter + '.');
  if(step === 2){
    if(!sub) return tr(v.k > 0 ? 'Возвращаем лишнее: ' + inter + ' − ' + kk + ' = ' + c.r + '.' : 'Добавляем недостающее: ' + inter + ' + ' + kk + ' = ' + c.r + '.',
      v.k > 0 ? 'Take the extra back: ' + inter + ' − ' + kk + ' = ' + c.r + '.' : 'Add what was missing: ' + inter + ' + ' + kk + ' = ' + c.r + '.');
    return tr(v.k > 0 ? 'Возвращаем разницу: ' + inter + ' + ' + kk + ' = ' + c.r + '.' : 'Убираем лишнее: ' + inter + ' − ' + kk + ' = ' + c.r + '.',
      v.k > 0 ? 'Add the difference back: ' + inter + ' + ' + kk + ' = ' + c.r + '.' : 'Remove the extra: ' + inter + ' − ' + kk + ' = ' + c.r + '.');
  }
  return tr('Ответ: ' + c.r + '.', 'Answer: ' + c.r + '.');
}
function bvCompHtml(c, step){
  var v = bvCompVals(c), kk = Math.abs(v.k), b2 = v.b2;
  var inter = c.op === '+' ? c.a + b2 : c.a - b2;
  var sign = c.op === '+' ? (v.k > 0 ? '−' : '+') : (v.k > 0 ? '+' : '−');
  if(step === 0){
    return '<div class="bv-scene"><div class="bv-cmp"><span>' + c.a + ' ' + c.op + ' ' + c.b + '</span>' +
      '<span class="bv-cmp-arrow">→</span><span class="bv-cmp-new">' + c.a + ' ' + c.op + ' ' + b2 + '</span></div></div>';
  }
  if(step === 1){
    return '<div class="bv-final"><span class="bv-big">' + c.a + ' ' + c.op + ' ' + b2 + '</span><span class="bsign">=</span><span class="bv-big">' + inter + '</span></div>';
  }
  if(step === 2){
    return '<div class="bv-final"><span class="bv-big">' + inter + '</span><span class="bsign">' + sign + '</span><span class="bv-big">' + kk + '</span><span class="bsign">=</span><span class="bv-big">' + c.r + '</span></div>';
  }
  return '<div class="bv-final"><span class="bv-big">' + c.r + '</span></div>';
}
function bvDiffNote(c, step){
  var v = bvDiffVals(c);
  if(step === 0) return v.k > 0
    ? tr('Прибавим ' + v.k + ' к обоим числам — разность не изменится: ' + c.a + ' − ' + c.b + ' = ' + v.a2 + ' − ' + v.b2 + '.',
      'Add ' + v.k + ' to both numbers — the difference stays the same: ' + c.a + ' − ' + c.b + ' = ' + v.a2 + ' − ' + v.b2 + '.')
    : tr('Отнимем ' + Math.abs(v.k) + ' от обоих чисел — разность не изменится: ' + c.a + ' − ' + c.b + ' = ' + v.a2 + ' − ' + v.b2 + '.',
      'Subtract ' + Math.abs(v.k) + ' from both numbers — the difference stays the same: ' + c.a + ' − ' + c.b + ' = ' + v.a2 + ' − ' + v.b2 + '.');
  if(step === 1) return tr(v.a2 + ' − ' + v.b2 + ' = ' + c.r + '.', v.a2 + ' − ' + v.b2 + ' = ' + c.r + '.');
  return tr('Ответ: ' + c.r + '.', 'Answer: ' + c.r + '.');
}
function bvDiffHtml(c, step){
  var v = bvDiffVals(c);
  if(step === 0){
    return '<div class="bv-scene"><div class="bv-cmp"><span>' + c.a + ' − ' + c.b + '</span>' +
      '<span class="bv-cmp-arrow">→</span><span class="bv-cmp-new">' + v.a2 + ' − ' + v.b2 + '</span></div>' +
      '<div class="bv-hint">' + (v.k > 0 ? '+ ' + v.k : '− ' + Math.abs(v.k)) + ' к обоим числам</div></div>';
  }
  if(step === 1){
    return '<div class="bv-final"><span class="bv-big">' + v.a2 + ' − ' + v.b2 + '</span><span class="bsign">=</span><span class="bv-big">' + c.r + '</span></div>';
  }
  return '<div class="bv-final"><span class="bv-big">' + c.r + '</span></div>';
}
function bvOpen(mode){
  var c = run && run.cur;
  if(!c) return;
  if(mode === 'comp'){
    if(!bvCanComp(c)) return;
  } else if(mode === 'diff'){
    if(!bvCanDiff(c)) return;
  } else {
    var isSub = c.op === '−';
    if(isSub ? !bvCanSub(c) : !bvCanTen(c)) return;
    mode = isSub ? 'sub' : ((c.a < 10 && c.b < 10) ? 'ten' : 'place');
  }
  bvClear();
  bvState.mode = mode;
  bvState.c = c;
  bvState.step = 0;
  beadsState.mode = mode;
  beadsEls.panel.hidden = false;
  bvRender();
}
function bvNext(){
  var total = (bvState.mode === 'ten' || bvState.mode === 'diff') ? 3 : 4;
  if(bvState.step >= total - 1){ beadsClose(); return; }
  bvState.step++;
  bvRender();
}
function bvDebug(){
  var p;
  try{ p = new URLSearchParams(location.search); }catch(e){ return; }
  var mode = p.get('bvtest');
  if(!mode) return;
  var a = clampInt(p.get('a'), 0, 999, 84);
  var b = clampInt(p.get('b'), 0, 999, 37);
  var op = (p.get('op') === 'add' || mode === 'ten' || mode === 'place') ? '+' : '−';
  var r = op === '+' ? a + b : a - b;
  var cur = { a: a, b: b, r: r, op: op, miss: 'r' };
  if(mode === 'comp' && !bvCanComp(cur)) mode = bvCanDiff(cur) ? 'diff' : 'ten';
  if(mode === 'diff' && !bvCanDiff(cur)) mode = 'comp';
  bvClear();
  bvState.mode = mode;
  bvState.c = cur;
  bvState.step = 0;
  beadsState.mode = mode;
  var panel = document.getElementById('beadsPanel');
  if(!panel) return;
  panel.hidden = false;
  bvRender();
}
function bvPrev(){
  if(bvState.step > 0){
    bvState.step--;
    bvRender();
  }
}

if(beadsEls.btn){
  beadsEls.btn.textContent = tr('На бусинах', 'With beads');
  if(beadsEls.place) beadsEls.place.textContent = tr('По разрядам', 'By places');
  if(beadsEls.comp) beadsEls.comp.textContent = tr('Округли и поправь', 'Round and adjust');
  if(beadsEls.diff) beadsEls.diff.textContent = tr('Одинаковая разность', 'Same difference');
  beadsEls.btn.addEventListener('click', function(){ beadsOpen('beads'); });
  if(beadsEls.place) beadsEls.place.addEventListener('click', function(){ beadsOpen('place'); });
  if(beadsEls.comp) beadsEls.comp.addEventListener('click', function(){ beadsOpen('comp'); });
  if(beadsEls.diff) beadsEls.diff.addEventListener('click', function(){ beadsOpen('diff'); });
  beadsEls.close.addEventListener('click', beadsClose);
  beadsEls.next.addEventListener('click', beadsNext);
  beadsEls.stage.addEventListener('click', beadsClick);
  if(beadsEls.prev) beadsEls.prev.addEventListener('click', function(){
    if(beadsState.mode === 'ten' || beadsState.mode === 'place' || beadsState.mode === 'sub' || beadsState.mode === 'comp' || beadsState.mode === 'diff') bvPrev();
  });
  if(beadsEls.legend){
    beadsEls.legend.innerHTML =
      '<span class="lg">' + beadsRod(' lg-rod') + tr(' = 10 (десяток)', ' = 10 (ten)') + '</span>' +
      '<span class="lg">' + beadsUnit(' lg-unit') + tr(' = 1 (единица)', ' = 1 (one)') + '</span>';
  }
}

loadSettings();
applyUrl();
syncUI();
renderHistory();
bvDebug();
showScreen('setup');
})();

