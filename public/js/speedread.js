(function (window, document) {
  'use strict';

  var dataEl = document.getElementById('srData');
  if (!dataEl) return;
  var DATA;
  try {
    DATA = JSON.parse(dataEl.textContent || '{}');
  } catch (e) {
    return;
  }
  var TEXTS = Array.isArray(DATA.texts) ? DATA.texts : [];
  if (!TEXTS.length) return;

  var STORAGE_KEY = 'vivid.speedread.v1';
  var defaults = {
    mode: 'training',
    view: 'full',
    speed: 60,
    time: 1,
    textId: TEXTS[0].id,
    kind: 'all',
    chunk: 1,
    questions: true
  };
  var state = {};
  for (var dk in defaults) {
    if (Object.prototype.hasOwnProperty.call(defaults, dk)) state[dk] = defaults[dk];
  }

  var current = null;
  var quiz = null;
  var timerId = 0;
  var rsvpTimer = 0;
  var startedAt = 0;
  var pausedAt = 0;
  var pausedTotal = 0;
  var paused = false;
  var rsvpRunning = false;
  var rsvpIdx = 0;
  var rsvpShown = 0;
  var marking = false;
  var markedIndex = -1;
  var flashTimer = 0;
  var audioCtx = null;

  function $(id) { return document.getElementById(id); }
  function on(el, type, fn) { if (el) el.addEventListener(type, fn); }
  function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
  function textById(id) {
    for (var i = 0; i < TEXTS.length; i++) if (TEXTS[i].id === id) return TEXTS[i];
    return TEXTS[0];
  }
  function wordsOf(text) {
    var out = [];
    (text.blocks || []).forEach(function (block) {
      block.split(/\s+/).forEach(function (word) {
        if (word) out.push(word);
      });
    });
    return out;
  }
  function plural(n) {
    var mod10 = n % 10;
    var mod100 = n % 100;
    if (mod10 === 1 && mod100 !== 11) return 'слово';
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return 'слова';
    return 'слов';
  }
  function fmtRange(n) { return n + ' ' + plural(n); }
  function pluralText(n) {
    var mod10 = n % 10;
    var mod100 = n % 100;
    if (mod10 === 1 && mod100 !== 11) return 'текст';
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return 'текста';
    return 'текстов';
  }
  function fmtClock(ms) {
    var total = Math.max(0, Math.round(ms / 1000));
    var m = Math.floor(total / 60);
    var s = total % 60;
    return m + ':' + (s < 10 ? '0' : '') + s;
  }
  function elapsed() {
    if (!current) return 0;
    if (paused) return pausedAt - startedAt - pausedTotal;
    return performance.now() - startedAt - pausedTotal;
  }
  function timeMs() { return state.time * 60000; }
  function modeLabel() { return state.mode === 'timed' ? 'На время' : 'Тренировка'; }
  function chunkLabel() {
    if (state.chunk === 'sentence') return 'по предложению';
    var n = state.chunk;
    if (n === 1) return 'по одному слову';
    return 'по ' + n + ' ' + (n === 2 || n === 3 ? 'слова' : 'слов');
  }
  function viewLabel() { return state.view === 'word' ? chunkLabel() : 'весь текст'; }

  function buildChunks(text, words, size) {
    var chunks = [];
    if (size === 'sentence') {
      if (text.poem) {
        (text.blocks || []).forEach(function (block) {
          var lineWords = block.split(/\s+/).filter(Boolean);
          if (lineWords.length) chunks.push({ words: lineWords, text: lineWords.join(' ') });
        });
        return chunks;
      }
      var currentSentence = [];
      words.forEach(function (word) {
        currentSentence.push(word);
        if (/[.!?…]["»)]?$/.test(word)) {
          chunks.push({ words: currentSentence.slice(), text: currentSentence.join(' ') });
          currentSentence = [];
        }
      });
      if (currentSentence.length) {
        chunks.push({ words: currentSentence, text: currentSentence.join(' ') });
      }
      return chunks;
    }
    var n = Number(size) || 1;
    for (var i = 0; i < words.length; i += n) {
      var part = words.slice(i, i + n);
      chunks.push({ words: part, text: part.join(' ') });
    }
    return chunks;
  }

  function chunkDelay(chunk) {
    var base = 60000 / state.speed;
    var delay = 0;
    chunk.words.forEach(function (word) {
      var part = base;
      if (/[.!?…]$/.test(word)) part *= 1.8;
      else if (/[,;:]$/.test(word)) part *= 1.35;
      delay += part;
    });
    return Math.max(120, delay);
  }
  function save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) {}
  }
  function load() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      var data = JSON.parse(raw);
      if (!data) return;
      if (data.mode === 'training' || data.mode === 'timed') state.mode = data.mode;
      if (data.view === 'full' || data.view === 'word') state.view = data.view;
      if (typeof data.speed === 'number' && isFinite(data.speed)) state.speed = clamp(Math.round(data.speed), 30, 180);
      if (data.time === 1 || data.time === 2 || data.time === 3) state.time = data.time;
      if (data.textId === 'random' || (typeof data.textId === 'string' && textById(data.textId).id === data.textId)) {
        state.textId = data.textId;
      }
      if (data.kind === 'all' || data.kind === 'tale' || data.kind === 'story' || data.kind === 'poem' || data.kind === 'fable' || data.kind === 'folk') {
        state.kind = data.kind;
      }
      if (data.chunk === 1 || data.chunk === 2 || data.chunk === 3 || data.chunk === 5 || data.chunk === 'sentence') {
        state.chunk = data.chunk;
      }
      if (typeof data.questions === 'boolean') state.questions = data.questions;
    } catch (e) {}
  }
  function clearTimers() {
    if (timerId) { clearInterval(timerId); timerId = 0; }
    if (rsvpTimer) { clearTimeout(rsvpTimer); rsvpTimer = 0; }
  }
  function getAudioContext() {
    try {
      var Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return null;
      if (!audioCtx) audioCtx = new Ctx();
      return audioCtx;
    } catch (e) {
      return null;
    }
  }
  function unlockAudio() {
    var ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') {
      try { ctx.resume(); } catch (e) {}
    }
  }
  function beep(ctx, freq, at, duration, volume) {
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, at);
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(volume, at + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(at);
    osc.stop(at + duration + 0.03);
  }
  function scheduleTimeUpBeeps(ctx) {
    var at = ctx.currentTime + 0.02;
    beep(ctx, 988, at, 0.11, 0.12);
    beep(ctx, 988, at + 0.19, 0.11, 0.12);
  }
  function playTimeUpSound() {
    var ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') {
      ctx.resume().then(function () { scheduleTimeUpBeeps(ctx); }).catch(function () {});
    } else {
      scheduleTimeUpBeeps(ctx);
    }
  }
  function flashTimeUp() {
    var el = $('srTimesUpFlash');
    if (!el) return;
    if (flashTimer) { clearTimeout(flashTimer); flashTimer = 0; }
    el.hidden = false;
    el.classList.remove('is-on');
    void el.offsetWidth;
    el.classList.add('is-on');
    flashTimer = window.setTimeout(function () {
      el.classList.remove('is-on');
      el.hidden = true;
      flashTimer = 0;
    }, 1350);
  }
  function clearTimeUpFlash() {
    var el = $('srTimesUpFlash');
    if (flashTimer) { clearTimeout(flashTimer); flashTimer = 0; }
    if (!el) return;
    el.classList.remove('is-on');
    el.hidden = true;
  }
  function show(screen) {
    ['srSetup', 'srRead', 'srQuiz', 'srDone'].forEach(function (id) {
      var el = $(id);
      if (el) el.hidden = id !== screen;
    });
    var scroller = document.querySelector('.site-content');
    if (scroller) scroller.scrollTop = 0;
    try { window.scrollTo(0, 0); } catch (e) {}
  }

  function visibleTexts() {
    return state.kind === 'all' ? TEXTS : TEXTS.filter(function (text) { return text.kind === state.kind; });
  }

  function updateTextCount() {
    var el = $('srTextCount');
    if (!el) return;
    var list = visibleTexts();
    var words = list.reduce(function (total, text) {
      return total + (text.wordCount || wordsOf(text).length);
    }, 0);
    el.textContent = list.length + ' ' + pluralText(list.length) + ' · ' + words + ' ' + plural(words);
  }

  function syncKindFilter() {
    var buttons = document.querySelectorAll('#srKindFilter button');
    Array.prototype.forEach.call(buttons, function (btn) {
      var active = btn.getAttribute('data-kind') === state.kind;
      btn.classList.toggle('is-on', active);
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
  }

  function setCardActive(cards) {
    Array.prototype.forEach.call(cards, function (card) {
      var active = card.getAttribute('data-id') === state.textId;
      card.classList.toggle('is-on', active);
      card.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
  }

  function syncTextCards() {
    var cards = document.querySelectorAll('.sr-textcard');
    var firstVisible = null;
    var selectedVisible = false;
    Array.prototype.forEach.call(cards, function (card) {
      var kind = card.getAttribute('data-kind');
      var show = kind === 'random' || state.kind === 'all' || kind === state.kind;
      card.hidden = !show;
      if (show && kind !== 'random' && !firstVisible) firstVisible = card;
      if (show && card.getAttribute('data-id') === state.textId) selectedVisible = true;
    });
    if (state.textId !== 'random' && !selectedVisible && firstVisible) {
      state.textId = firstVisible.getAttribute('data-id');
      save();
    }
    setCardActive(cards);
    var randomMeta = $('srRandomMeta');
    if (randomMeta) randomMeta.textContent = state.kind === 'all' ? 'выберется случайно' : 'из выбранной категории';
    updateTextCount();
  }

  function syncSegs() {
    var segs = document.querySelectorAll('.sr-seg[data-seg], .sr-chunkseg[data-seg]');
    Array.prototype.forEach.call(segs, function (seg) {
      var key = seg.getAttribute('data-seg');
      var value = key === 'questions' ? (state.questions ? 'on' : 'off') : String(state[key]);
      var buttons = seg.querySelectorAll('button[data-v]');
      Array.prototype.forEach.call(buttons, function (btn) {
        var active = btn.getAttribute('data-v') === value;
        btn.classList.toggle('is-on', active);
        btn.setAttribute('aria-pressed', active ? 'true' : 'false');
      });
    });
  }

  function updateStartBar() {
    var title = $('srStartTitle');
    var sub = $('srStartSub');
    if (!title || !sub) return;
    if (state.textId === 'random') {
      title.textContent = 'Случайный текст';
    } else {
      var text = textById(state.textId);
      title.textContent = '«' + text.title + '» · ' + fmtRange(text.wordCount || wordsOf(text).length);
    }
    var parts = [modeLabel(), viewLabel()];
    if (state.view === 'word') parts.push(state.speed + ' сл/мин');
    if (state.mode === 'timed') parts.push(state.time + ' мин');
    parts.push(state.questions ? 'с вопросами' : 'без вопросов');
    sub.textContent = parts.join(' · ');
  }

  function syncSetup() {
    var speedTile = $('srSpeedTile');
    var timeTile = $('srTimeTile');
    var infoTile = $('srInfoTile');
    var chunkRow = $('srChunkRow');
    var wordMode = state.view === 'word';
    var timed = state.mode === 'timed';
    if (speedTile) speedTile.hidden = !wordMode;
    if (timeTile) timeTile.hidden = !timed;
    if (infoTile) infoTile.hidden = wordMode || timed;
    if (chunkRow) chunkRow.hidden = !wordMode;

    var modeNote = $('srModeNote');
    if (modeNote) {
      modeNote.textContent = timed
        ? (wordMode
          ? 'Таймер остановит показ фрагментов. Вопросы — по показанной части.'
          : 'Таймер остановит чтение. В конце отметишь последнее прочитанное слово.')
        : 'Засечём время. Нажмёшь «Я дочитал(а)», когда закончишь.';
    }
    var timeNote = $('srTimeNote');
    if (timeNote) {
      timeNote.textContent = wordMode
        ? 'Когда время выйдет, показ фрагментов остановится. Вопросы — по показанной части.'
        : 'Когда время выйдет, отметишь последнее прочитанное слово. Вопросы — по прочитанной части.';
    }
    var viewNote = $('srViewNote');
    if (viewNote) {
      if (wordMode) {
        if (state.chunk === 'sentence') {
          viewNote.textContent = 'Показываем по одному предложению; в стихах — по строке. Время на экран зависит от длины, запятые и точки дают паузу.';
        } else if (state.chunk === 1) {
          viewNote.textContent = 'Слова появляются по одному. Время на экран — по темпу; запятые и точки дают паузу.';
        } else {
          viewNote.textContent = 'Показываем по ' + state.chunk + ' ' + (state.chunk === 2 || state.chunk === 3 ? 'слова' : 'слов') + ' за раз. Время на экран зависит от длины фрагмента; запятые и точки дают паузу.';
        }
      } else {
        viewNote.textContent = 'Читай спокойно. Скорость посчитаем по времени.';
      }
    }
    var speedVal = $('srSpeedVal');
    if (speedVal) speedVal.textContent = state.speed;
    var quick = document.querySelectorAll('#srQuick button');
    Array.prototype.forEach.call(quick, function (btn) {
      btn.classList.toggle('is-on', Number(btn.getAttribute('data-speed')) === state.speed);
    });
    syncSegs();
    syncKindFilter();
    syncTextCards();
    updateStartBar();
  }

  function setReadMeta(text) {
    $('srReadTitle').textContent = text.title;
    $('srReadSub').textContent = text.author + ' · ' + fmtRange(text.wordCount || wordsOf(text).length);
    $('srPageAuthor').textContent = text.author;
    $('srPageTitle').textContent = text.title;
    $('srQuizMeta').textContent = text.title;
  }

  function renderPage(text) {
    var box = $('srPageText');
    box.innerHTML = '';
    box.classList.toggle('is-poem', !!text.poem);
    var idx = 0;
    (text.blocks || []).forEach(function (block) {
      var p = document.createElement('p');
      var parts = block.split(/\s+/);
      parts.forEach(function (word, i) {
        if (!word) return;
        var span = document.createElement('span');
        span.className = 'sr-tok';
        span.setAttribute('data-i', String(idx));
        span.textContent = word;
        p.appendChild(span);
        if (i < parts.length - 1) p.appendChild(document.createTextNode(' '));
        idx++;
      });
      box.appendChild(p);
    });
    return box.querySelectorAll('.sr-tok');
  }

  function startReading() {
    unlockAudio();
    clearTimeUpFlash();
    var pool = state.kind === 'all' ? TEXTS : TEXTS.filter(function (item) { return item.kind === state.kind; });
    if (!pool.length) pool = TEXTS;
    var text = state.textId === 'random'
      ? pool[Math.floor(Math.random() * pool.length)]
      : textById(state.textId);
    var words = wordsOf(text);
    current = {
      text: text,
      words: words,
      chunks: buildChunks(text, words, state.chunk),
      readCount: 0,
      elapsedMs: 0,
      source: state.view,
      stopped: false,
      askedNone: false
    };
    quiz = null;
    paused = false;
    pausedAt = 0;
    pausedTotal = 0;
    marking = false;
    markedIndex = -1;
    rsvpRunning = false;
    rsvpIdx = 0;
    rsvpShown = 0;
    clearTimers();

    setReadMeta(text);
    $('srPage').classList.remove('is-marking');
    $('srStage').classList.remove('is-marking');
    $('srMarkBar').hidden = true;
    $('srPage').hidden = state.view === 'word';
    $('srRsvp').hidden = state.view !== 'word';
    $('srSpeedBar').hidden = state.view !== 'word';
    $('srPause').hidden = state.mode === 'timed';
    $('srPause').textContent = 'Пауза';
    $('srPauseOver').hidden = true;
    $('srMarkSkip').hidden = false;
    $('srMarkNext').disabled = true;
    $('srMarkText').textContent = 'Отметь последнее прочитанное слово.';
    $('srMarkBar').hidden = true;
    var finish = $('srFinish');
    finish.hidden = false;
    finish.disabled = false;
    finish.textContent = state.view === 'word' ? 'Закончить' : 'Я дочитал(а)';
    $('srClock').classList.remove('is-warn', 'is-low');
    $('srClockBar').classList.toggle('is-free', state.mode !== 'timed');
    $('srClockFill').style.width = '100%';
    $('srClockNote').textContent = state.mode === 'timed' ? 'до конца' : (state.view === 'word' ? 'до конца текста' : 'идут секунды');
    $('srRsvpFill').style.width = '0%';
    $('srWord').textContent = '…';
    $('srWord').classList.remove('is-chunk', 'is-sentence');
    var rsvpChunk = $('srRsvpChunk');
    if (rsvpChunk) rsvpChunk.textContent = chunkLabel();
    $('srRsvpSpeed').textContent = state.speed;
    $('srLiveSpeed').textContent = state.speed;

    if (state.view === 'full') {
      renderPage(text);
      $('srFootInfo').innerHTML = state.mode === 'timed'
        ? 'Время идёт. Можно нажать «Я дочитал(а)» раньше, если закончишь.'
        : 'Читай спокойно. Кнопка — когда закончишь.';
    } else {
      $('srFootInfo').innerHTML = 'Фрагменты сменяются сами. Темп — <b>' + state.speed + ' слов/мин</b>.';
    }

    if (state.mode === 'timed') {
      $('srClock').textContent = fmtClock(timeMs());
    } else {
      $('srClock').textContent = '0:00';
    }

    show('srRead');
    startedAt = performance.now();
    timerId = window.setInterval(tick, 100);
    if (state.view === 'word') {
      rsvpRunning = true;
      playWord();
    }
    tick();
  }

  function tick() {
    if (!current || paused) return;
    var ms = elapsed();
    if (state.mode === 'timed') {
      var left = Math.max(0, timeMs() - ms);
      $('srClock').textContent = fmtClock(left);
      var pct = Math.max(0, Math.min(100, left / timeMs() * 100));
      $('srClockFill').style.width = pct + '%';
      $('srClock').classList.toggle('is-warn', pct <= 30 && pct > 10);
      $('srClock').classList.toggle('is-low', pct <= 10);
      if (left <= 0) onTimeUp();
    } else {
      $('srClock').textContent = fmtClock(ms);
    }
  }

  function playWord() {
    if (!current || !rsvpRunning || paused) return;
    if (state.mode === 'timed' && elapsed() >= timeMs()) {
      onTimeUp();
      return;
    }
    if (rsvpIdx >= current.chunks.length) {
      finishWordReading(current.words.length, elapsed());
      return;
    }
    var chunk = current.chunks[rsvpIdx];
    $('srWord').textContent = chunk.text;
    $('srWord').classList.toggle('is-chunk', chunk.words.length > 1 && state.chunk !== 'sentence');
    $('srWord').classList.toggle('is-sentence', state.chunk === 'sentence');
    rsvpShown += chunk.words.length;
    $('srRsvpFill').style.width = (rsvpShown / current.words.length * 100) + '%';
    var delay = chunkDelay(chunk);
    rsvpIdx++;
    rsvpTimer = window.setTimeout(playWord, delay);
  }

  function pauseToggle() {
    if (!current || state.mode === 'timed') return;
    if (!paused) {
      paused = true;
      pausedAt = performance.now();
      if (rsvpTimer) { clearTimeout(rsvpTimer); rsvpTimer = 0; }
      $('srPauseOver').hidden = false;
      $('srPause').textContent = 'Продолжить';
    } else {
      paused = false;
      pausedTotal += performance.now() - pausedAt;
      pausedAt = 0;
      $('srPauseOver').hidden = true;
      $('srPause').textContent = 'Пауза';
      if (state.view === 'word') {
        rsvpRunning = true;
        playWord();
      }
      tick();
    }
  }

  function onTimeUp() {
    if (!current || current.stopped) return;
    current.stopped = true;
    clearTimers();
    flashTimeUp();
    playTimeUpSound();
    $('srClock').textContent = '0:00';
    $('srClockFill').style.width = '0%';
    $('srClock').classList.add('is-low');
    if (state.view === 'word') {
      rsvpRunning = false;
      finishWordReading(rsvpShown, timeMs());
      return;
    }
    marking = true;
    $('srPage').classList.add('is-marking');
    $('srStage').classList.add('is-marking');
    $('srMarkBar').hidden = false;
    $('srMarkNext').disabled = true;
    $('srMarkSkip').hidden = false;
    $('srMarkText').textContent = 'Отметь последнее прочитанное слово.';
    $('srFinish').hidden = true;
    $('srFootInfo').innerHTML = '<b>Время вышло.</b> Нажми на последнее прочитанное слово.';
  }

  function markWord(index) {
    if (!marking || !current) return;
    markedIndex = index;
    current.readCount = index + 1;
    var tokens = document.querySelectorAll('#srPageText .sr-tok');
    Array.prototype.forEach.call(tokens, function (tok, i) {
      tok.classList.toggle('is-read', i <= index);
      tok.classList.toggle('is-marked', i === index);
    });
    $('srMarkText').textContent = 'Прочитано: ' + current.readCount + ' из ' + current.words.length + ' слов. Можно выбрать другое слово.';
    $('srMarkSkip').hidden = true;
    $('srMarkNext').disabled = false;
    $('srFootInfo').innerHTML = '<b>Прочитано: ' + current.readCount + ' из ' + current.words.length + ' слов.</b> Можно выбрать другое слово.';
  }

  function finishFullReading() {
    if (!current) return;
    if (marking) {
      afterReading(current.readCount || 0, timeMs());
      return;
    }
    if (paused) {
      pausedTotal += performance.now() - pausedAt;
      paused = false;
      pausedAt = 0;
    }
    var ms = elapsed();
    clearTimers();
    afterReading(current.words.length, ms);
  }

  function finishWordReading(count, ms) {
    if (!current) return;
    clearTimers();
    rsvpRunning = false;
    afterReading(Math.max(0, Math.min(current.words.length, count)), ms);
  }

  function afterReading(readCount, ms) {
    if (!current) return;
    current.readCount = Math.max(0, Math.min(current.words.length, readCount));
    current.elapsedMs = Math.max(0, ms || 0);
    clearTimers();
    marking = false;
    markedIndex = -1;
    paused = false;
    $('srMarkBar').hidden = true;
    $('srStage').classList.remove('is-marking');
    $('srPage').classList.remove('is-marking');
    $('srPauseOver').hidden = true;
    var partial = current.readCount < current.words.length;
    var questions = (current.text.questions || []).slice();
    if (partial) {
      questions = questions.filter(function (q) { return q.after <= current.readCount; });
    }
    if (state.questions && questions.length) {
      startQuiz(questions);
      return;
    }
    current.askedNone = state.questions && questions.length === 0;
    quiz = null;
    showResults();
  }

  function startQuiz(questions) {
    quiz = { list: questions, idx: 0, ok: 0, bad: 0, skip: 0, answers: [], locked: false };
    $('srPillOk').textContent = '0';
    $('srPillBad').textContent = '0';
    $('srPillSkip').textContent = '0';
    show('srQuiz');
    renderQuestion();
  }

  function renderQuestion() {
    if (!quiz) return;
    var q = quiz.list[quiz.idx];
    quiz.locked = false;
    $('srQuizCount').textContent = 'Вопрос ' + (quiz.idx + 1) + ' из ' + quiz.list.length;
    $('srQuizFill').style.width = (quiz.idx / quiz.list.length * 100) + '%';
    var box = $('srQuestion');
    box.innerHTML = '';
    var meta = document.createElement('div');
    meta.className = 'sr-qmeta';
    meta.textContent = 'Вопрос ' + (quiz.idx + 1) + ' из ' + quiz.list.length;
    var h = document.createElement('h2');
    h.textContent = q.q;
    var sub = document.createElement('p');
    sub.className = 'sr-qsub';
    sub.textContent = 'Выбери один ответ.';
    box.appendChild(meta);
    box.appendChild(h);
    box.appendChild(sub);

    var opts = $('srOptions');
    opts.innerHTML = '';
    q.options.forEach(function (text, i) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'sr-opt';
      btn.textContent = text;
      btn.addEventListener('click', function () { answerQuestion(i); });
      opts.appendChild(btn);
    });
    var fb = $('srFeedback');
    fb.hidden = true;
    fb.className = 'sr-feedback';
    fb.innerHTML = '';
    $('srQNext').disabled = true;
    $('srQNext').textContent = quiz.idx === quiz.list.length - 1 ? 'К результату' : 'Дальше';
    $('srQSkip').disabled = false;
  }

  function updateQuizPills() {
    $('srPillOk').textContent = quiz.ok;
    $('srPillBad').textContent = quiz.bad;
    $('srPillSkip').textContent = quiz.skip;
  }

  function answerQuestion(index) {
    if (!quiz || quiz.locked) return;
    quiz.locked = true;
    var q = quiz.list[quiz.idx];
    var buttons = $('srOptions').querySelectorAll('.sr-opt');
    var ok = index === q.correct;
    Array.prototype.forEach.call(buttons, function (btn, i) {
      btn.disabled = true;
      if (i === q.correct) btn.classList.add('is-correct');
    });
    if (!ok) {
      if (buttons[index]) buttons[index].classList.add('is-wrong');
      quiz.bad++;
    } else {
      quiz.ok++;
    }
    quiz.answers.push({ q: q, chosen: q.options[index], ok: ok, skipped: false });
    updateQuizPills();

    var fb = $('srFeedback');
    fb.hidden = false;
    fb.className = 'sr-feedback' + (ok ? '' : ' is-bad');
    fb.innerHTML = '';
    var ico = document.createElement('span');
    ico.className = 'sr-fb-ico';
    ico.textContent = ok ? '✓' : '×';
    var main = document.createElement('div');
    main.className = 'sr-fb-main';
    var title = document.createElement('b');
    title.textContent = ok ? 'Верно!' : 'Не совсем. Правильный ответ: ' + q.options[q.correct];
    var why = document.createElement('p');
    why.textContent = q.why;
    var quote = document.createElement('q');
    quote.textContent = q.quote;
    main.appendChild(title);
    main.appendChild(why);
    main.appendChild(quote);
    fb.appendChild(ico);
    fb.appendChild(main);
    $('srQSkip').disabled = true;
    $('srQNext').disabled = false;
  }

  function skipQuestion() {
    if (!quiz || quiz.locked) return;
    quiz.locked = true;
    var q = quiz.list[quiz.idx];
    quiz.skip++;
    quiz.answers.push({ q: q, chosen: '', ok: false, skipped: true });
    updateQuizPills();
    var fb = $('srFeedback');
    fb.hidden = false;
    fb.className = 'sr-feedback is-skip';
    fb.innerHTML = '';
    var ico = document.createElement('span');
    ico.className = 'sr-fb-ico';
    ico.textContent = '⏭';
    var main = document.createElement('div');
    main.className = 'sr-fb-main';
    var title = document.createElement('b');
    title.textContent = 'Пропущено';
    var p = document.createElement('p');
    p.textContent = 'Это не ошибка. Пропуск не пойдёт в точность.';
    main.appendChild(title);
    main.appendChild(p);
    fb.appendChild(ico);
    fb.appendChild(main);
    Array.prototype.forEach.call($('srOptions').querySelectorAll('.sr-opt'), function (btn) {
      btn.disabled = true;
    });
    $('srQSkip').disabled = true;
    $('srQNext').disabled = false;
  }

  function nextQuestion() {
    if (!quiz) return;
    if (quiz.idx + 1 >= quiz.list.length) {
      showResults();
      return;
    }
    quiz.idx++;
    renderQuestion();
  }

  function quizExit() {
    if (!quiz) return;
    while (quiz.answers.length < quiz.list.length) {
      var q = quiz.list[quiz.answers.length];
      quiz.answers.push({ q: q, chosen: '', ok: false, skipped: true });
      quiz.skip++;
    }
    updateQuizPills();
    showResults();
  }

  function verdictFor(wpm, stats, readCount, tooFast, paced) {
    if (readCount === 0) {
      return {
        title: 'Ни одного слова',
        text: 'Попробуй ещё раз: прочитай хотя бы часть текста и отметь последнее слово.'
      };
    }
    if (tooFast) {
      return {
        title: 'Слишком быстро для замера',
        text: 'Похоже, кнопка нажата раньше, чем текст прочитан. Для честного замера дочитай текст и нажми кнопку в конце.'
      };
    }
    var accuracy = stats && stats.asked ? stats.ok / stats.asked : null;
    if (accuracy !== null && stats.asked >= 2 && accuracy < 0.6 && wpm >= 40) {
      return {
        title: 'Скорость есть, понимание хромает',
        text: 'Больше половины вопросов не сошлось. Попробуй читать чуть медленнее и следить за смыслом.'
      };
    }
    if (paced) {
      return {
        title: 'Тренировка в темпе ' + wpm,
        text: 'Слова шли со скоростью ' + wpm + ' слов в минуту. Если было легко, попробуй темп на 5–10 слов быстрее.'
      };
    }
    if (wpm < 25) {
      return {
        title: 'Пока только начало',
        text: 'Читай понемногу каждый день. Для 1 класса ориентир — 25–30 слов в минуту.'
      };
    }
    if (wpm < 40) {
      return {
        title: 'Есть база',
        text: 'Для 2 класса ориентир — 40–60 слов в минуту. Ещё немного практики.'
      };
    }
    if (wpm <= 60) {
      return {
        title: 'Хорошо для 2 класса',
        text: 'Ты в ориентире для второго класса — 40–60 слов в минуту.'
      };
    }
    if (wpm <= 80) {
      return {
        title: 'Быстро для 2 класса',
        text: 'Выше ориентира второго класса. Следи, чтобы смысл не терялся.'
      };
    }
    if (wpm <= 100) {
      return {
        title: 'Очень быстро',
        text: 'Это уровень 4 класса и выше. Главное — понимать прочитанное.'
      };
    }
    return {
      title: 'Очень быстро',
      text: 'Скорость выше 100 слов в минуту. Проверь, что при этом удаётся удерживать смысл.'
    };
  }

  function showResults() {
    if (!current) return;
    clearTimers();
    $('srMarkBar').hidden = true;
    var ms = current.elapsedMs || 0;
    var wpm;
    if (state.view === 'word') {
      wpm = state.speed;
      if (!ms) ms = state.mode === 'timed' ? timeMs() : Math.round(current.words.length / state.speed * 60000);
    } else {
      var minutes = Math.max(ms / 60000, 1 / 60000);
      wpm = Math.round(current.readCount / minutes);
    }
    if (current.readCount === 0) wpm = 0;
    wpm = Math.max(0, Math.round(wpm));
    var tooFast = state.view === 'full' && ms < current.words.length / 300 * 60000;

    var big = $('srWpm');
    big.innerHTML = '';
    big.appendChild(document.createTextNode(tooFast ? '—' : String(wpm)));
    var unit = document.createElement('span');
    unit.textContent = tooFast ? 'не засчитано' : 'слов/мин';
    big.appendChild(unit);

    var text = current.text;
    var subParts = ['«' + text.title + '»'];
    if (state.view === 'word' && current.readCount < current.words.length) {
      subParts.push('показано ' + current.readCount + ' из ' + current.words.length);
    } else if (state.view !== 'word' && current.readCount < current.words.length) {
      subParts.push('отмечено ' + current.readCount + ' из ' + current.words.length);
    } else {
      subParts.push(fmtRange(current.words.length));
    }
    if (state.view === 'word') subParts.push('темп ' + state.speed);
    subParts.push(fmtClock(ms));
    if (tooFast) subParts.push('скорость не засчитана');
    $('srResultSub').textContent = subParts.join(' · ');

    var stats = quiz ? { ok: quiz.ok, bad: quiz.bad, skip: quiz.skip, asked: quiz.ok + quiz.bad } : null;
    var verdict = verdictFor(wpm, stats, current.readCount, tooFast, state.view === 'word');
    var verdictEl = $('srVerdict');
    verdictEl.className = 'sr-verdict' + (tooFast ? ' is-warn' : '');
    verdictEl.innerHTML = '';
    var vb = document.createElement('b');
    vb.textContent = verdict.title;
    verdictEl.appendChild(vb);
    verdictEl.appendChild(document.createTextNode(verdict.text));

    var clamped = Math.max(0, Math.min(120, wpm));
    var pct = clamped / 120 * 100;
    $('srMarkmark').hidden = tooFast;
    $('srMarklabel').hidden = tooFast;
    $('srMarkmark').style.left = pct + '%';
    $('srMarklabel').style.left = pct + '%';
    $('srMarklabel').textContent = wpm > 120 ? '120+' : String(wpm);

    var review = $('srReview');
    review.innerHTML = '';
    var compr = $('srCompr');
    if (quiz && stats && stats.asked + stats.skip > 0) {
      compr.hidden = false;
      var total = stats.asked + stats.skip;
      var percent = stats.asked ? Math.round(stats.ok / stats.asked * 100) : 0;
      $('srQuizStats').hidden = false;
      $('srPercent').textContent = stats.asked ? percent + '%' : '—';
      $('srResOk').textContent = stats.ok;
      $('srResBad').textContent = stats.bad;
      $('srResSkip').textContent = stats.skip;
      var wrong = quiz.answers.filter(function (a) { return !a.skipped && !a.ok; });
      var skipped = quiz.answers.filter(function (a) { return a.skipped; });
      if (!wrong.length && !skipped.length) {
        var good = document.createElement('p');
        good.className = 'sr-allello';
        good.textContent = 'Все вопросы верно — текст понят.';
        review.appendChild(good);
      }
      wrong.forEach(function (a) {
        var row = document.createElement('div');
        row.className = 'sr-rrow';
        var q = document.createElement('b');
        q.textContent = a.q.q;
        var your = document.createElement('span');
        your.className = 'sr-wrong';
        your.textContent = 'Твой ответ: ' + a.chosen;
        var right = document.createElement('span');
        right.className = 'sr-right';
        right.textContent = 'Правильно: ' + a.q.options[a.q.correct];
        var quote = document.createElement('q');
        quote.textContent = a.q.quote;
        row.appendChild(q);
        row.appendChild(your);
        row.appendChild(right);
        row.appendChild(quote);
        review.appendChild(row);
      });
      skipped.forEach(function (a) {
        var row = document.createElement('div');
        row.className = 'sr-rrow';
        var q = document.createElement('b');
        q.textContent = a.q.q;
        var sk = document.createElement('span');
        sk.textContent = 'Пропущено — не ошибка.';
        row.appendChild(q);
        row.appendChild(sk);
        review.appendChild(row);
      });
      var note = $('srComprNote');
      note.hidden = false;
      note.textContent = 'Точность считается только по отвеченным вопросам: ' + stats.asked + ' из ' + total + '.';
    } else {
      compr.hidden = false;
      $('srQuizStats').hidden = true;
      $('srPercent').textContent = '—';
      $('srResOk').textContent = '0';
      $('srResBad').textContent = '0';
      $('srResSkip').textContent = '0';
      var p = document.createElement('p');
      p.className = 'sr-note';
      p.style.margin = '0';
      p.textContent = current.askedNone
        ? 'Вопросы не задавались: отмечено слишком мало слов.'
        : 'Вопросы выключены — результат только по скорости.';
      review.appendChild(p);
      $('srComprNote').hidden = true;
    }

    show('srDone');
  }

  function resetToSetup(focusText) {
    clearTimers();
    clearTimeUpFlash();
    current = null;
    quiz = null;
    marking = false;
    paused = false;
    rsvpRunning = false;
    $('srMarkBar').hidden = true;
    $('srPauseOver').hidden = true;
    show('srSetup');
    syncSetup();
    if (focusText) {
      window.setTimeout(function () {
        var texts = $('srTexts');
        if (texts) {
          try { texts.scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch (e) { texts.scrollIntoView(); }
        }
      }, 60);
    }
  }

  // --- события настройки ---
  document.querySelectorAll('.sr-seg[data-seg], .sr-chunkseg[data-seg]').forEach(function (seg) {
    seg.addEventListener('click', function (e) {
      var btn = e.target.closest ? e.target.closest('button[data-v]') : null;
      if (!btn) return;
      var key = seg.getAttribute('data-seg');
      var value = btn.getAttribute('data-v');
      if (key === 'questions') state.questions = value === 'on';
      else if (key === 'time') state.time = Number(value);
      else if (key === 'chunk') state.chunk = value === 'sentence' ? 'sentence' : Number(value);
      else state[key] = value;
      save();
      syncSetup();
    });
  });

  document.querySelectorAll('#srQuick button').forEach(function (btn) {
    btn.addEventListener('click', function () {
      state.speed = Number(btn.getAttribute('data-speed'));
      save();
      syncSetup();
    });
  });

  document.querySelectorAll('[data-step]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var step = Number(btn.getAttribute('data-step'));
      state.speed = clamp(state.speed + step, 30, 180);
      save();
      syncSetup();
    });
  });

  var textGrid = $('srTexts');
  if (textGrid) {
    textGrid.addEventListener('click', function (e) {
      var card = e.target.closest ? e.target.closest('.sr-textcard') : null;
      if (!card) return;
      state.textId = card.getAttribute('data-id');
      save();
      syncSetup();
    });
  }

  var kindFilter = $('srKindFilter');
  if (kindFilter) {
    kindFilter.addEventListener('click', function (e) {
      var btn = e.target.closest ? e.target.closest('button[data-kind]') : null;
      if (!btn) return;
      state.kind = btn.getAttribute('data-kind');
      save();
      syncSetup();
    });
  }

  on($('srStart'), 'click', startReading);
  on($('srStop'), 'click', function () { resetToSetup(false); });
  on($('srPause'), 'click', pauseToggle);
  on($('srResume'), 'click', pauseToggle);
  on($('srFinish'), 'click', function () {
    if (!current) return;
    if (state.view === 'word') finishWordReading(rsvpShown, elapsed());
    else finishFullReading();
  });

  on($('srMarkNext'), 'click', function () {
    if (!marking || !current) return;
    afterReading(current.readCount || 0, timeMs());
  });
  on($('srMarkSkip'), 'click', function () {
    if (!current) return;
    afterReading(0, timeMs());
  });

  on($('srPageText'), 'click', function (e) {
    if (!marking) return;
    var tok = e.target.closest ? e.target.closest('.sr-tok') : null;
    if (!tok) return;
    markWord(Number(tok.getAttribute('data-i')));
  });

  on($('srSlow'), 'click', function () {
    state.speed = clamp(state.speed - 5, 30, 180);
    $('srLiveSpeed').textContent = state.speed;
    $('srRsvpSpeed').textContent = state.speed;
    save();
  });
  on($('srFast'), 'click', function () {
    state.speed = clamp(state.speed + 5, 30, 180);
    $('srLiveSpeed').textContent = state.speed;
    $('srRsvpSpeed').textContent = state.speed;
    save();
  });

  on($('srQSkip'), 'click', skipQuestion);
  on($('srQNext'), 'click', nextQuestion);
  on($('srQuizExit'), 'click', quizExit);

  on($('srAgain'), 'click', function () {
    if (state.textId === 'random' && current) {
      state.textId = current.text.id;
      save();
    }
    startReading();
  });
  on($('srAnother'), 'click', function () { resetToSetup(true); });
  on($('srSettings'), 'click', function () { resetToSetup(false); });

  load();
  syncSetup();
})(window, document);
