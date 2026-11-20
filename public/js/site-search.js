(function (window, document) {
  'use strict';

  var dialog = document.getElementById('siteSearch');
  var openBtn = document.getElementById('siteSearchOpen');
  if (!dialog || !openBtn) return;

  var input = document.getElementById('siteSearchInput');
  var results = document.getElementById('siteSearchResults');
  var status = document.getElementById('siteSearchStatus');
  var closeBtn = dialog.querySelector('.site-search-close');
  var indexUrl = dialog.getAttribute('data-index');
  var labels = {
    loading: dialog.getAttribute('data-loading') || '',
    empty: dialog.getAttribute('data-empty') || '',
    error: dialog.getAttribute('data-error') || '',
    found: dialog.getAttribute('data-found') || '',
    work: dialog.getAttribute('data-work') || '',
    page: dialog.getAttribute('data-page') || '',
    theme: dialog.getAttribute('data-theme') || ''
  };

  var items = null;
  var loading = false;
  var active = -1;
  var timer = 0;

  function norm(value) {
    return String(value)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/ё/g, 'е')
      .replace(/[^a-zа-яіў0-9]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function esc(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function escReg(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function highlight(text, tokens) {
    var safe = esc(text);
    if (!tokens.length) return safe;
    var pattern = tokens.map(escReg).filter(Boolean).sort(function (a, b) { return b.length - a.length; }).join('|');
    if (!pattern) return safe;
    try {
      return safe.replace(new RegExp('(' + pattern + ')', 'gi'), '<mark>$1</mark>');
    } catch (e) {
      return safe;
    }
  }

  function hasToken(text, token) {
    if (!text || !token) return false;
    if (token.length <= 4) return (' ' + text).indexOf(' ' + token) >= 0;
    return text.indexOf(token) >= 0;
  }

  function load() {
    if (items || loading) return Promise.resolve(items);
    loading = true;
    status.textContent = labels.loading;
    return fetch(indexUrl, { cache: 'force-cache' })
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then(function (data) {
        items = (data.items || []).map(function (item) {
          var text = norm((item.t || '') + ' ' + (item.d || '') + ' ' + (item.x || ''));
          return { raw: item, hay: text, title: norm(item.t || ''), desc: norm(item.d || ''), body: norm(item.x || '') };
        });
        return items;
      })
      .catch(function () {
        status.textContent = labels.error;
        return null;
      })
      .then(function (value) {
        loading = false;
        if (value && input.value.trim()) render();
        return value;
      });
  }

  function kindLabel(item) {
    var kind = item.k === 'work' ? labels.work : item.k === 'theme' ? labels.theme : labels.page;
    return kind + (item.d ? ' · ' + item.d : '');
  }

  function snippet(item, tokens) {
    var text = item.x || item.d || '';
    if (!text) return '';
    var lower = text.toLowerCase();
    var pos = -1;
    for (var i = 0; i < tokens.length; i++) {
      pos = lower.indexOf(tokens[i]);
      if (pos >= 0) break;
    }
    if (pos < 0) return text.slice(0, 140) + (text.length > 140 ? '…' : '');
    var start = Math.max(0, pos - 45);
    var end = Math.min(text.length, pos + 95);
    return (start > 0 ? '…' : '') + text.slice(start, end).trim() + (end < text.length ? '…' : '');
  }

  function render() {
    var query = input.value.trim();
    var rawTokens = query.split(/\s+/).filter(function (token) { return token.length > 0; });
    var tokens = rawTokens.map(norm).filter(function (token) { return token.length > 0; });
    results.innerHTML = '';
    active = -1;

    if (!items) {
      if (!loading) status.textContent = '';
      return;
    }
    if (!query) {
      status.textContent = '';
      return;
    }
    if (!tokens.length) {
      status.textContent = labels.empty;
      return;
    }

    var found = [];
    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      var ok = true;
      var score = 0;
      for (var t = 0; t < tokens.length; t++) {
        var token = tokens[t];
        if (!hasToken(item.hay, token)) { ok = false; break; }
        if (item.title === token) score += 120;
        else if (hasToken(item.title, token)) score += 70;
        else if (item.title.indexOf(token) >= 0) score += 45;
        else if (hasToken(item.desc, token)) score += 12;
        else if (hasToken(item.body, token)) score += 4;
      }
      if (!ok) continue;
      if (item.raw.k === 'work') score += 8;
      else if (item.raw.k === 'theme') score += 4;
      found.push({ item: item.raw, score: score });
    }

    found.sort(function (a, b) {
      return b.score - a.score || String(a.item.t).localeCompare(String(b.item.t), 'be');
    });
    if (!found.length) {
      status.textContent = labels.empty;
      return;
    }
    var total = found.length;
    found = found.slice(0, 30);
    status.textContent = labels.found + ': ' + total;

    var html = '';
    for (var f = 0; f < found.length; f++) {
      var raw = found[f].item;
      html += '<li><a href="' + esc(raw.u) + '">' +
        '<span class="site-search-kind">' + esc(kindLabel(raw)) + '</span>' +
        '<span class="site-search-name">' + highlight(raw.t, rawTokens) + '</span>' +
        '<span class="site-search-snippet">' + highlight(snippet(raw, tokens), rawTokens) + '</span>' +
        '</a></li>';
    }
    results.innerHTML = html;
  }

  function setActive(next) {
    var links = results.querySelectorAll('a');
    if (!links.length) return;
    if (active >= 0 && links[active]) links[active].classList.remove('is-active');
    active = (next + links.length) % links.length;
    links[active].classList.add('is-active');
    links[active].scrollIntoView({ block: 'nearest' });
  }

  function open() {
    if (!dialog.hidden) return;
    dialog.hidden = false;
    document.body.classList.add('site-search-open');
    input.value = '';
    status.textContent = '';
    results.innerHTML = '';
    window.setTimeout(function () { input.focus(); }, 20);
    load();
  }

  function close() {
    if (dialog.hidden) return;
    dialog.hidden = true;
    document.body.classList.remove('site-search-open');
    openBtn.focus();
  }

  openBtn.addEventListener('click', open);
  dialog.querySelectorAll('[data-search-close]').forEach(function (el) {
    el.addEventListener('click', close);
  });

  input.addEventListener('input', function () {
    window.clearTimeout(timer);
    timer = window.setTimeout(render, 120);
  });

  input.addEventListener('keydown', function (event) {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActive(active + 1);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActive(active - 1);
    } else if (event.key === 'Enter') {
      var links = results.querySelectorAll('a');
      if (active >= 0 && links[active]) {
        event.preventDefault();
        links[active].click();
      } else if (links.length) {
        event.preventDefault();
        links[0].click();
      }
    }
  });

  document.addEventListener('keydown', function (event) {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      open();
    } else if (event.key === 'Escape' && !dialog.hidden) {
      event.preventDefault();
      close();
    } else if (event.key === 'Tab' && !dialog.hidden) {
      var focusables = dialog.querySelectorAll('input, button, a[href]');
      if (!focusables.length) return;
      var first = focusables[0];
      var last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  });

  dialog.addEventListener('click', function (event) {
    var link = event.target.closest('a[href]');
    if (link) close();
  });
})(window, document);
