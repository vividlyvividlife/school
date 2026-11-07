(function (window, document) {
  'use strict';

  function mount(cfg) {
    var copy = cfg.copy;
    var KEY = cfg.key;
    var defaults = cfg.defaults;
    var settings = {};
    for (var dk in defaults) {
      if (Object.prototype.hasOwnProperty.call(defaults, dk)) settings[dk] = defaults[dk];
    }

    function $(id) { return document.getElementById(id); }
    var setupEl = $('setup');
    var gameEl = $('game');
    var resultsEl = $('results');
    if (!setupEl || !gameEl || !resultsEl) return;

    var timeRow = $('timeRow');
    var minEl = $('min');
    var secEl = $('sec');
    var soundEl = $('sound');
    var soundTest = $('soundTest');
    var startBtn = $('startBtn');
    var stopBtn = $('stopBtn');
    var pauseBtn = $('pauseBtn');
    var skipBtn = $('skipBtn');
    var againBtn = $('againBtn');
    var toSetupBtn = $('toSetupBtn');
    var gInfo = $('gInfo');
    var scoreOk = $('scoreOk');
    var scoreBad = $('scoreBad');
    var timeWrap = $('timeWrap');
    var tfill = $('tfill');
    var tclock = $('tclock');
    var qPrompt = $('qPrompt');
    var qSub = $('qSub');
    var qBody = $('qBody');
    var capEl = $('cap');
    var optsEl = $('opts');
    var verdictEl = $('verdict');
    var rOk = $('rOk');
    var rBad = $('rBad');
    var rSkip = $('rSkip');
    var rAcc = $('rAcc');
    var rAvg = $('rAvg');
    var rFast = $('rFast');
    var rSlow = $('rSlow');
    var rDur = $('rDur');
    var misList = $('misList');
    var skippedCard = $('skippedCard');
    var skippedTitle = $('skippedTitle');
    var skippedList = $('skippedList');

    var game = null;
    var timerId = 0;
    var audioCtx = null;

    function pad(n) { return (n < 10 ? '0' : '') + n; }
    function fmtClock(ms) {
      var total = Math.max(0, Math.round(ms / 1000));
      var s = total % 60;
      var m = Math.floor(total / 60) % 60;
      var h = Math.floor(total / 3600);
      return h ? h + ':' + pad(m) + ':' + pad(s) : m + ':' + pad(s);
    }
    function fmtSec(ms) { return (ms / 1000).toFixed(1) + ' ' + copy.secShort; }
    function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

    function ensureAudio() {
      if (audioCtx) {
        if (audioCtx.state === 'suspended') audioCtx.resume().catch(function () {});
        return audioCtx;
      }
      try {
        var AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return null;
        audioCtx = new AC();
      } catch (e) {
        audioCtx = null;
      }
      return audioCtx;
    }

    function beep(ok) {
      var ctx = ensureAudio();
      if (!ctx) return;
      var notes = ok ? [[880, 0], [1174.66, 0.1]] : [[233.08, 0], [185, 0.14]];
      var peak = ok ? 0.1 : 0.12;
      var tail = ok ? 0.16 : 0.22;
      function play() {
        var t0 = ctx.currentTime + 0.02;
        notes.forEach(function (n) {
          var osc = ctx.createOscillator();
          var gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.value = n[0];
          var at = t0 + n[1];
          gain.gain.setValueAtTime(0.0001, at);
          gain.gain.exponentialRampToValueAtTime(peak, at + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.0001, at + tail);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(at);
          osc.stop(at + tail + 0.02);
        });
      }
      if (ctx.state === 'suspended') ctx.resume().then(play).catch(function () {});
      else play();
    }

    function show(name) {
      [setupEl, gameEl, resultsEl].forEach(function (el) {
        el.classList.toggle('active', el.id === name);
      });
    }

    function save() {
      try { localStorage.setItem(KEY, JSON.stringify(settings)); } catch (e) {}
    }

    function load() {
      try {
        var raw = localStorage.getItem(KEY);
        if (!raw) return;
        var data = JSON.parse(raw);
        if (!data) return;
        for (var key in defaults) {
          if (!Object.prototype.hasOwnProperty.call(defaults, key)) continue;
          if (!Object.prototype.hasOwnProperty.call(data, key)) continue;
          var val = data[key];
          if (typeof defaults[key] === 'number' && typeof val === 'number' && isFinite(val)) settings[key] = val;
          else if (typeof defaults[key] === 'string' && typeof val === 'string') settings[key] = val;
          else if (typeof defaults[key] === 'boolean' && typeof val === 'boolean') settings[key] = val;
        }
        if ('sound' in defaults) settings.sound = data.sound !== false;
        if (cfg.normalize) cfg.normalize(settings);
      } catch (e) {}
    }

    function syncControls() {
      document.querySelectorAll('.seg[data-key]').forEach(function (seg) {
        var key = seg.getAttribute('data-key');
        seg.querySelectorAll('button[data-v]').forEach(function (b) {
          b.classList.toggle('on', String(settings[key]) === b.getAttribute('data-v'));
        });
      });
      if (timeRow) timeRow.hidden = settings.mode !== 'timed';
      if (minEl) minEl.value = settings.min;
      if (secEl) secEl.value = settings.sec;
      if (soundEl) soundEl.checked = settings.sound;
      if (cfg.onSync) cfg.onSync(settings);
    }

    function optionButton(q, opt, index) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'opt ' + (q.optionClass || 'opt-txt');
      if (opt.aria) b.setAttribute('aria-label', opt.aria);
      if (opt.html) b.appendChild(opt.html);
      else b.textContent = opt.text;
      b.addEventListener('click', function () { answer(b, opt, index); });
      return b;
    }

    function renderFree(q) {
      optsEl.className = 'freebox';
      if (q.free.hint) {
        var hint = document.createElement('div');
        hint.className = 'freehint';
        hint.textContent = q.free.hint;
        optsEl.appendChild(hint);
      }
      var form = document.createElement('form');
      form.className = 'freeform';
      form.noValidate = true;
      var input = document.createElement('input');
      input.className = 'freeinput';
      input.type = 'number';
      input.inputMode = 'numeric';
      input.min = q.free.min;
      input.max = q.free.max;
      input.step = '1';
      input.placeholder = q.free.placeholder || '';
      input.setAttribute('aria-label', q.free.label || q.prompt || '');
      var unit = document.createElement('span');
      unit.className = 'freeunit';
      unit.textContent = q.free.unit || '';
      var btn = document.createElement('button');
      btn.type = 'submit';
      btn.className = 'btn primary freebtn';
      btn.textContent = copy.freeCheck;
      form.appendChild(input);
      if (q.free.unit) form.appendChild(unit);
      form.appendChild(btn);
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        submitFree(q, input, btn);
      });
      optsEl.appendChild(form);
    }

    function submitFree(q, input, btn) {
      if (!game || game.lock || game.paused || !game.current || game.current.answered) return;
      var raw = String(input.value).trim();
      var n = Number(raw.replace(',', '.'));
      var min = q.free.min || 1;
      var max = q.free.max || 180;
      var unit = q.free.unit || '';
      if (!raw || !isFinite(n) || n < min || n > max) {
        capEl.textContent = (copy.freeInvalid || '')
          .replace('{min}', min).replace('{max}', max).replace('{unit}', unit);
        capEl.className = 'cap bad';
        input.focus();
        return;
      }
      n = Math.round(n);
      game.lock = true;
      game.current.answered = true;
      input.disabled = true;
      btn.disabled = true;
      capEl.textContent = (copy.freeSaved || '').replace('{n}', n).replace('{unit}', unit);
      capEl.className = 'cap note';
      game.advanceId = window.setTimeout(nextQuestion, 1400);
    }

    function skipQuestion() {
      if (!game || game.lock || game.paused || !game.current || game.current.answered) return;
      var q = game.current;
      game.lock = true;
      q.answered = true;
      game.skipped.push({ q: q.questionText || q.prompt });
      capEl.textContent = copy.capSkip;
      capEl.className = 'cap note';
      Array.prototype.forEach.call(optsEl.querySelectorAll('button, input'), function (el) {
        el.disabled = true;
      });
      game.advanceId = window.setTimeout(nextQuestion, 650);
    }

    function nextQuestion() {
      if (!game) return;
      window.clearTimeout(game.advanceId);
      if (game.paused) { game.pendingNext = true; return; }
      var now = Date.now();
      if (game.mode === 'timed' && now >= game.endsAt) {
        finish();
        return;
      }
      var q = cfg.generate(settings);
      q.startedAt = now;
      q.answered = false;
      game.current = q;
      game.lock = false;

      if (qPrompt) {
        qPrompt.textContent = q.prompt || '';
        qPrompt.hidden = !q.prompt;
      }
      if (qSub) {
        qSub.textContent = q.sub || '';
        qSub.hidden = !q.sub;
      }
      qBody.innerHTML = '';
      qBody.className = q.bodyClass || '';
      if (q.visual) qBody.appendChild(q.visual);

      capEl.textContent = '';
      capEl.className = 'cap';
      optsEl.innerHTML = '';
      optsEl.removeAttribute('data-count');
      if (q.free) {
        renderFree(q);
        return;
      }
      optsEl.className = q.optionsClass || 'opts texts';
      optsEl.setAttribute('data-count', q.options.length);
      q.options.forEach(function (opt, i) {
        optsEl.appendChild(optionButton(q, opt, i));
      });
    }

    function answer(btn, opt, index) {
      if (!game || game.lock || game.paused || !game.current || game.current.answered) return;
      var q = game.current;
      game.lock = true;
      q.answered = true;

      var ok = !!opt.right;
      var ms = Math.max(0, Date.now() - q.startedAt);
      game.answers.push({ q: q.questionText || q.prompt, your: opt.text, ok: ok, ms: ms });

      if (ok) {
        btn.classList.add('correct');
        capEl.textContent = copy.capOk;
        capEl.className = 'cap ok';
        game.ok++;
        scoreOk.textContent = game.ok;
      } else {
        btn.classList.add('wrong');
        capEl.textContent = copy.capBad + ' ' + (q.answerText || '');
        capEl.className = 'cap bad';
        game.bad++;
        scoreBad.textContent = game.bad;
        var rightIndex = -1;
        q.options.forEach(function (o, i) { if (o.right) rightIndex = i; });
        var correct = optsEl.children[rightIndex];
        if (correct) correct.classList.add('correct');
      }
      if (settings.sound) beep(ok);
      game.advanceId = window.setTimeout(nextQuestion, ok ? 650 : 1250);
    }

    function tick() {
      if (!game || game.paused) return;
      var now = Date.now();
      if (game.mode === 'timed') {
        var left = Math.max(0, game.endsAt - now);
        tclock.textContent = fmtClock(left);
        tfill.style.width = (left / game.dur * 100) + '%';
        tfill.classList.toggle('warn', left / game.dur <= 0.3 && left / game.dur > 0.1);
        tfill.classList.toggle('low', left / game.dur <= 0.1);
        if (left <= 0) finish();
      } else {
        tclock.textContent = fmtClock(now - game.startedAt);
      }
    }

    function startGame() {
      var secs = settings.mode === 'timed' ? Math.max(10, Math.round(settings.min) * 60 + Math.round(settings.sec)) : 0;
      if (settings.mode === 'timed' && secs !== settings.min * 60 + settings.sec) {
        settings.min = Math.floor(secs / 60);
        settings.sec = secs % 60;
        if (minEl) minEl.value = settings.min;
        if (secEl) secEl.value = settings.sec;
        save();
      }
      game = {
        mode: settings.mode,
        startedAt: Date.now(),
        endsAt: Date.now() + secs * 1000,
        dur: secs * 1000,
        answers: [],
        skipped: [],
        ok: 0,
        bad: 0,
        lock: false,
        current: null,
        paused: false,
        pausedAt: 0,
        pendingNext: false,
        advanceId: 0
      };
      scoreOk.textContent = '0';
      scoreBad.textContent = '0';
      gInfo.textContent = cfg.info(settings);
      timeWrap.classList.toggle('free', settings.mode !== 'timed');
      tfill.classList.remove('warn', 'low');
      tfill.style.width = '100%';
      if (settings.mode === 'timed') tclock.textContent = fmtClock(game.dur);
      else tclock.textContent = '0:00';
      show('game');
      updatePauseUI();
      nextQuestion();
      window.clearInterval(timerId);
      timerId = window.setInterval(tick, 200);
      tick();
    }

    function setPaused(v) {
      if (!game || game.mode === 'timed' || v === game.paused) return;
      game.paused = v;
      if (v) {
        game.pausedAt = Date.now();
        window.clearInterval(timerId);
        timerId = 0;
        window.clearTimeout(game.advanceId);
        if (game.lock) game.pendingNext = true;
        gameEl.classList.add('paused');
      } else {
        var delta = Date.now() - game.pausedAt;
        game.startedAt += delta;
        if (game.endsAt) game.endsAt += delta;
        if (game.current) game.current.startedAt += delta;
        game.pausedAt = 0;
        gameEl.classList.remove('paused');
        timerId = window.setInterval(tick, 200);
        tick();
        if (game.pendingNext) {
          game.pendingNext = false;
          nextQuestion();
        }
      }
      updatePauseUI();
    }

    function updatePauseUI() {
      if (!pauseBtn) return;
      var visible = !!game && game.mode !== 'timed';
      var on = !!(visible && game.paused);
      pauseBtn.hidden = !visible;
      pauseBtn.textContent = on ? pauseBtn.getAttribute('data-resume') : pauseBtn.getAttribute('data-pause');
      pauseBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
    }

    function finish() {
      if (!game) return;
      window.clearInterval(timerId);
      timerId = 0;
      window.clearTimeout(game.advanceId);
      if (game.paused) {
        game.startedAt += Date.now() - game.pausedAt;
        game.paused = false;
        game.pausedAt = 0;
      }
      gameEl.classList.remove('paused');
      var endedAt = Date.now();
      var answers = game.answers;
      var skipped = game.skipped || [];
      var ok = 0;
      var bad = 0;
      var totalMs = 0;
      var fast = Infinity;
      var slow = -Infinity;
      answers.forEach(function (a) {
        if (a.ok) ok++;
        else bad++;
        totalMs += a.ms;
        if (a.ok) {
          if (a.ms < fast) fast = a.ms;
          if (a.ms > slow) slow = a.ms;
        }
      });
      var answered = answers.length;
      var acc = answered ? Math.round(ok / answered * 100) : 0;

      rOk.textContent = String(ok);
      rBad.textContent = String(bad);
      rSkip.textContent = String(skipped.length);
      rAcc.textContent = answered ? acc + '%' : '—';
      rAvg.textContent = answered ? fmtSec(totalMs / answered) : '—';
      rFast.textContent = fast !== Infinity ? fmtSec(fast) : '—';
      rSlow.textContent = slow > -Infinity ? fmtSec(slow) : '—';
      rDur.textContent = fmtClock(endedAt - game.startedAt);

      if (!answered) {
        verdictEl.hidden = true;
        verdictEl.className = 'verdict';
      } else {
        var g = acc >= 95 ? 5 : acc >= 85 ? 4 : acc >= 70 ? 3 : acc >= 50 ? 2 : acc >= 30 ? 1 : 0;
        verdictEl.hidden = false;
        verdictEl.className = 'verdict g' + g;
        verdictEl.textContent = copy['v' + g];
      }

      var mistakes = answers.filter(function (a) { return !a.ok; });
      misList.innerHTML = '';
      if (!mistakes.length) {
        var none = document.createElement('div');
        none.className = 'none';
        none.textContent = copy.none;
        misList.appendChild(none);
      } else {
        mistakes.forEach(function (a) {
          var row = document.createElement('div');
          row.className = 'mrow';
          var b = document.createElement('b');
          b.textContent = a.q;
          var ua = document.createElement('span');
          ua.className = 'ua';
          ua.textContent = copy.yourAnswer + ': ' + a.your;
          row.appendChild(b);
          row.appendChild(ua);
          misList.appendChild(row);
        });
      }

      skippedCard.hidden = !skipped.length;
      skippedList.innerHTML = '';
      if (skipped.length) {
        skippedTitle.innerHTML = '<span class="tico" aria-hidden="true">⏭️</span>' + copy.skippedTitle + ': ' + skipped.length;
        skipped.forEach(function (s) {
          var row = document.createElement('div');
          row.className = 'mrow';
          var b = document.createElement('b');
          b.textContent = s.q;
          var ua = document.createElement('span');
          ua.className = 'ua skipped';
          ua.textContent = copy.skippedMark;
          row.appendChild(b);
          row.appendChild(ua);
          skippedList.appendChild(row);
        });
      }

      game = null;
      show('results');
      updatePauseUI();
    }

    startBtn.addEventListener('click', startGame);
    if (againBtn) againBtn.addEventListener('click', startGame);
    if (toSetupBtn) toSetupBtn.addEventListener('click', function () { show('setup'); });
    if (stopBtn) stopBtn.addEventListener('click', finish);
    if (pauseBtn) pauseBtn.addEventListener('click', function () { setPaused(!(game && game.paused)); });
    if (skipBtn) skipBtn.addEventListener('click', skipQuestion);

    document.querySelectorAll('.seg[data-key]').forEach(function (seg) {
      seg.addEventListener('click', function (e) {
        var b = e.target.closest ? e.target.closest('button[data-v]') : null;
        if (!b) return;
        var key = seg.getAttribute('data-key');
        var v = b.getAttribute('data-v');
        var num = typeof defaults[key] === 'number';
        settings[key] = cfg.coerce ? cfg.coerce(key, v) : (num ? Number(v) : v);
        if (cfg.onChange) cfg.onChange(key, settings);
        syncControls();
        save();
      });
    });

    [minEl, secEl].forEach(function (input) {
      if (!input) return;
      input.addEventListener('change', function () {
        var v = Number(input.value);
        if (!isFinite(v)) v = input === minEl ? 2 : 0;
        v = Math.round(v);
        v = input === minEl ? clamp(v, 0, 300) : clamp(v, 0, 59);
        input.value = v;
        settings[input === minEl ? 'min' : 'sec'] = v;
        save();
      });
    });

    if (soundEl) soundEl.addEventListener('change', function () {
      settings.sound = soundEl.checked;
      save();
    });

    if (soundTest) soundTest.addEventListener('click', function () { beep(true); });

    document.addEventListener('pointerdown', ensureAudio, { once: true });

    load();
    if (minEl) settings.min = clamp(Math.round(settings.min), 0, 300);
    if (secEl) settings.sec = clamp(Math.round(settings.sec), 0, 59);
    syncControls();
  }

  window.TimeQuiz = { mount: mount };
})(window, document);
