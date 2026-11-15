(function () {
  var page = document.body ? document.body.getAttribute('data-page') : '';
  if (['trainer', 'clock', 'calendar', 'durations', 'language'].indexOf(page) < 0) return;

  var TEST = /[?&]breaktest=1(?:&|$)/.test(location.search);
  var SESSION_LIMIT = TEST ? 10 : 10 * 60;
  var DAILY_LIMIT = TEST ? 20 : 80 * 60;
  var BREAK_PAUSE = TEST ? 5 : 5 * 60;
  var STORAGE_KEY = TEST ? 'vivid.break.test.v1' : 'vivid.break.v1';

  var overlay = null;
  var titleEl = null;
  var textEl = null;
  var noteEl = null;
  var continueBtn = null;
  var breakBtn = null;
  var overlayOpen = false;
  var continuous = 0;
  var pausedUntil = 0;
  var lastTick = Date.now();
  var saveAt = 0;
  var daily = loadDaily();

  function today() {
    var now = new Date();
    return now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
  }

  function loadDaily() {
    var fallback = { date: today(), seconds: 0, warned80: false };
    try {
      var saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if (!saved || saved.date !== today()) return fallback;
      return {
        date: saved.date,
        seconds: Number(saved.seconds) || 0,
        warned80: !!saved.warned80
      };
    } catch (e) {
      return fallback;
    }
  }

  function saveDaily() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(daily));
    } catch (e) {}
  }

  function isActive() {
    if (document.hidden || overlayOpen) return false;
    var game = document.getElementById('game');
    if (game && !game.classList.contains('active')) return false;
    return true;
  }

  function build() {
    if (overlay) return;
    var style = document.createElement('style');
    style.textContent = [
      '.vivid-break{position:fixed;inset:0;z-index:80;display:flex;align-items:center;justify-content:center;padding:1rem;background:rgba(15,23,42,.45);-webkit-backdrop-filter:blur(3px);backdrop-filter:blur(3px)}',
      '.vivid-break[hidden]{display:none}',
      '.vivid-break-card{width:min(100%,28rem);padding:1.4rem;border:1px solid var(--site-line,#e2e8f0);border-radius:1.25rem;background:var(--site-surface,#fff);color:var(--site-ink,#0f172a);box-shadow:0 24px 60px -20px rgba(15,23,42,.45);font-family:"Nunito","DM Sans","Segoe UI",sans-serif}',
      '.vivid-break-kicker{font-size:.68rem;font-weight:900;letter-spacing:.14em;text-transform:uppercase;color:var(--site-teal,#6366f1)}',
      '.vivid-break-card h2{margin:.35rem 0 .55rem;font-size:1.45rem;line-height:1.15;letter-spacing:-.03em}',
      '.vivid-break-card p{margin:0;color:var(--site-muted,#64748b);font-size:.9rem;line-height:1.55}',
      '.vivid-break-actions{display:flex;flex-wrap:wrap;gap:.55rem;margin-top:1.1rem}',
      '.vivid-break-actions button{border:0;border-radius:.75rem;padding:.75rem 1rem;font:inherit;font-size:.85rem;font-weight:900;cursor:pointer}',
      '.vivid-break-primary{background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;box-shadow:0 8px 18px rgba(99,102,241,.25)}',
      '.vivid-break-ghost{border:1px solid var(--site-line,#e2e8f0)!important;background:var(--site-surface,#fff);color:var(--site-muted,#64748b)}',
      '.vivid-break-note{margin-top:.9rem!important;padding-top:.75rem;border-top:1px solid var(--site-line,#e2e8f0);font-size:.68rem!important;line-height:1.5}',
      'html[data-theme="dark"] .vivid-break-card{box-shadow:0 24px 60px -20px #000}'
    ].join('');
    document.head.appendChild(style);

    overlay = document.createElement('div');
    overlay.className = 'vivid-break';
    overlay.hidden = true;
    overlay.innerHTML = '<div class="vivid-break-card" role="dialog" aria-modal="false" aria-labelledby="vividBreakTitle">' +
      '<div class="vivid-break-kicker">Перерыв</div>' +
      '<h2 id="vividBreakTitle"></h2>' +
      '<p id="vividBreakText"></p>' +
      '<div class="vivid-break-actions">' +
        '<button class="vivid-break-primary" type="button" id="vividBreakContinue">Продолжить</button>' +
        '<button class="vivid-break-ghost" type="button" id="vividBreakStop">Сделать перерыв</button>' +
      '</div>' +
      '<p class="vivid-break-note" id="vividBreakNote"></p>' +
    '</div>';
    document.body.appendChild(overlay);
    titleEl = document.getElementById('vividBreakTitle');
    textEl = document.getElementById('vividBreakText');
    noteEl = document.getElementById('vividBreakNote');
    continueBtn = document.getElementById('vividBreakContinue');
    breakBtn = document.getElementById('vividBreakStop');

    continueBtn.addEventListener('click', function () {
      hide();
    });
    breakBtn.addEventListener('click', function () {
      hide(BREAK_PAUSE);
    });
    overlay.addEventListener('click', function (event) {
      if (event.target === overlay) hide();
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && overlayOpen) hide();
    });
  }

  function show(kind) {
    build();
    overlayOpen = true;
    continuous = 0;
    lastTick = Date.now();
    if (kind === 'daily') {
      titleEl.textContent = 'На сегодня 80 минут';
      textEl.textContent = 'Это верхняя граница для 2 класса. Лучше закончить и вернуться завтра.';
      breakBtn.textContent = 'Закончить';
      noteEl.textContent = 'Сайт считает только время в тренажёре, а не весь день. Если сегодня уже были уроки и другие экраны, сделай перерыв.';
    } else {
      titleEl.textContent = '10 минут — пора отдохнуть';
      textEl.textContent = 'Встань, попей воды, посмотри в окно. Вернёшься — продолжим.';
      breakBtn.textContent = 'Сделать перерыв';
      noteEl.textContent = 'Сайт считает только время в тренажёре. 80 минут в день — с учётом уроков и других экранов.';
    }
    overlay.hidden = false;
    continueBtn.focus();
  }

  function hide(pauseSeconds) {
    if (!overlay || !overlayOpen) return;
    overlayOpen = false;
    overlay.hidden = true;
    continuous = 0;
    lastTick = Date.now();
    if (pauseSeconds) pausedUntil = Date.now() + pauseSeconds * 1000;
    saveDaily();
  }

  function tick() {
    if (!isActive()) {
      lastTick = Date.now();
      return;
    }
    if (pausedUntil > Date.now()) {
      lastTick = Date.now();
      return;
    }
    var now = Date.now();
    var dt = Math.min(3, Math.max(0, (now - lastTick) / 1000));
    lastTick = now;
    continuous += dt;
    daily.seconds += dt;
    if (!daily.warned80 && daily.seconds >= DAILY_LIMIT) {
      daily.warned80 = true;
      saveDaily();
      show('daily');
      return;
    }
    if (!daily.warned80 && continuous >= SESSION_LIMIT) {
      show('break');
      return;
    }
    if (now >= saveAt) {
      saveAt = now + 5000;
      saveDaily();
    }
  }

  document.addEventListener('visibilitychange', function () {
    lastTick = Date.now();
    if (document.hidden) saveDaily();
  });
  window.addEventListener('beforeunload', saveDaily);
  window.setInterval(tick, 1000);
})();
