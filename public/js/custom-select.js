(function () {
  'use strict';

  var uid = 0;
  var openInstance = null;

  function firstChildSpan(el) {
    if (!el) return null;
    for (var i = 0; i < el.children.length; i++) {
      if (el.children[i].tagName === 'SPAN') return el.children[i];
    }
    return null;
  }

  function labelFor(select) {
    var label = select.closest('label');
    if (label) {
      var span = firstChildSpan(label);
      if (span) return span.textContent.trim();
    }
    var field = select.closest('.slogi-field, .h-field, .v-field');
    if (field) {
      var fieldSpan = firstChildSpan(field);
      if (fieldSpan) return fieldSpan.textContent.trim();
    }
    return select.getAttribute('aria-label') || 'Выбор';
  }

  function enhance(select) {
    if (!select || select.dataset.vSelectReady === '1') return;
    if (select.multiple || Number(select.size) > 1) return;

    var rect = select.getBoundingClientRect();
    var compact = !!select.closest('.slogi-field');
    var baseLabel = labelFor(select);

    var wrap = document.createElement('span');
    wrap.className = 'v-select' + (compact ? ' v-select--compact' : '');
    if (compact && rect.width) wrap.style.width = Math.max(88, Math.round(rect.width)) + 'px';

    select.parentNode.insertBefore(wrap, select);
    wrap.appendChild(select);
    select.dataset.vSelectReady = '1';
    select.classList.add('v-select-enhanced');
    select.setAttribute('tabindex', '-1');

    var trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'v-select-trigger';
    trigger.setAttribute('role', 'combobox');
    trigger.setAttribute('aria-haspopup', 'listbox');
    trigger.setAttribute('aria-expanded', 'false');

    var valueEl = document.createElement('span');
    valueEl.className = 'v-select-value';
    trigger.appendChild(valueEl);

    var menu = document.createElement('div');
    menu.className = 'v-select-menu';
    menu.hidden = true;
    menu.setAttribute('role', 'listbox');
    menu.id = 'v-select-menu-' + (++uid);
    trigger.setAttribute('aria-controls', menu.id);
    trigger.setAttribute('aria-label', baseLabel);
    menu.setAttribute('aria-label', baseLabel);

    wrap.appendChild(trigger);
    wrap.appendChild(menu);

    var options = [];
    var activeIndex = -1;
    var search = '';
    var searchTimer = 0;
    var instance = { close: close };

    function selectedOption() {
      var idx = select.selectedIndex;
      return idx >= 0 ? select.options[idx] : null;
    }

    function sync() {
      var selected = selectedOption();
      var value = selected ? selected.textContent.trim() : '';
      valueEl.textContent = value;
      trigger.setAttribute('aria-label', baseLabel + (value ? ': ' + value : ''));
      trigger.disabled = !!select.disabled;
      wrap.classList.toggle('is-disabled', !!select.disabled);
      options.forEach(function (item) {
        var on = item.opt === selected;
        item.el.setAttribute('aria-selected', on ? 'true' : 'false');
        item.el.classList.toggle('is-selected', on);
      });
    }

    function setActive(index) {
      if (!options.length) return;
      var count = options.length;
      var start = index;
      for (var n = 0; n < count; n++) {
        var i = (start + n + count * 2) % count;
        if (!options[i].el.disabled) {
          activeIndex = i;
          options.forEach(function (item, j) {
            item.el.classList.toggle('is-active', i === j);
          });
          trigger.setAttribute('aria-activedescendant', options[i].el.id);
          options[i].el.scrollIntoView({ block: 'nearest' });
          return;
        }
      }
    }

    function moveActive(delta) {
      if (!options.length) return;
      var start = activeIndex < 0 ? (delta > 0 ? -1 : 0) : activeIndex;
      var count = options.length;
      for (var n = 1; n <= count; n++) {
        var i = (start + delta * n + count * 2) % count;
        if (!options[i].el.disabled) {
          setActive(i);
          return;
        }
      }
    }

    function firstEnabled() {
      for (var i = 0; i < options.length; i++) if (!options[i].el.disabled) return i;
      return -1;
    }

    function lastEnabled() {
      for (var i = options.length - 1; i >= 0; i--) if (!options[i].el.disabled) return i;
      return -1;
    }

    function choose(opt) {
      if (!opt || opt.disabled) return;
      var index = -1;
      for (var i = 0; i < select.options.length; i++) {
        if (select.options[i] === opt) { index = i; break; }
      }
      if (index < 0) return;
      if (select.selectedIndex !== index) {
        select.selectedIndex = index;
        select.dispatchEvent(new Event('change', { bubbles: true }));
      }
      sync();
      close();
      trigger.focus();
    }

    function addOption(opt) {
      if (!opt || (!opt.value && !opt.textContent.trim())) return;
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'v-select-option';
      btn.setAttribute('role', 'option');
      btn.setAttribute('tabindex', '-1');
      btn.id = menu.id + '-opt-' + options.length;
      var text = document.createElement('span');
      text.textContent = opt.textContent.trim();
      btn.appendChild(text);
      if (opt.style && opt.style.fontFamily) btn.style.fontFamily = opt.style.fontFamily;
      if (opt.disabled) {
        btn.disabled = true;
        btn.classList.add('is-disabled');
      }
      btn.addEventListener('click', function () { choose(opt); });
      btn.addEventListener('mouseenter', function () {
        setActive(options.findIndex ? options.findIndex(function (x) { return x.opt === opt; }) : 0);
      });
      menu.appendChild(btn);
      options.push({ el: btn, opt: opt });
    }

    function rebuild() {
      menu.innerHTML = '';
      options = [];
      Array.prototype.forEach.call(select.children, function (child) {
        if (child.tagName === 'OPTGROUP') {
          var group = document.createElement('div');
          group.className = 'v-select-group';
          group.textContent = child.label || '';
          menu.appendChild(group);
          Array.prototype.forEach.call(child.children, addOption);
        } else if (child.tagName === 'OPTION') {
          addOption(child);
        }
      });
      sync();
    }

    function onOutside(event) {
      if (!wrap.contains(event.target)) close();
    }

    function onDocKey(event) {
      if (event.key === 'Escape') {
        event.preventDefault();
        close();
        trigger.focus();
      }
    }

    function open() {
      if (trigger.disabled) return;
      if (openInstance && openInstance !== instance) openInstance.close();
      openInstance = instance;
      menu.hidden = false;
      trigger.setAttribute('aria-expanded', 'true');
      wrap.classList.add('is-open');
      var selectedIndex = options.findIndex ? options.findIndex(function (x) { return x.opt === selectedOption(); }) : -1;
      setActive(selectedIndex >= 0 ? selectedIndex : firstEnabled());
      wrap.classList.remove('is-up', 'is-right');
      var r = trigger.getBoundingClientRect();
      var menuHeight = Math.min(menu.scrollHeight || 0, window.innerHeight * 0.65);
      if (window.innerHeight - r.bottom < menuHeight + 12 && r.top > menuHeight + 12) {
        wrap.classList.add('is-up');
      }
      var menuWidth = menu.getBoundingClientRect().width;
      if (r.left + menuWidth > window.innerWidth - 8) {
        wrap.classList.add('is-right');
      }
      document.addEventListener('pointerdown', onOutside, true);
      document.addEventListener('keydown', onDocKey, true);
      window.addEventListener('resize', close);
    }

    function close() {
      if (menu.hidden) return;
      menu.hidden = true;
      trigger.setAttribute('aria-expanded', 'false');
      wrap.classList.remove('is-open', 'is-up', 'is-right');
      trigger.removeAttribute('aria-activedescendant');
      activeIndex = -1;
      document.removeEventListener('pointerdown', onOutside, true);
      document.removeEventListener('keydown', onDocKey, true);
      window.removeEventListener('resize', close);
      if (openInstance === instance) openInstance = null;
    }

    function typeAhead(ch) {
      search += ch.toLowerCase();
      clearTimeout(searchTimer);
      searchTimer = setTimeout(function () { search = ''; }, 650);
      for (var i = 0; i < options.length; i++) {
        if (!options[i].el.disabled && options[i].el.textContent.toLowerCase().indexOf(search) === 0) {
          setActive(i);
          return;
        }
      }
    }

    trigger.addEventListener('click', function () {
      if (menu.hidden) open();
      else close();
    });

    trigger.addEventListener('keydown', function (event) {
      if (trigger.disabled) return;
      if (menu.hidden) {
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp' || event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          open();
          if (event.key === 'ArrowUp') setActive(lastEnabled());
        }
        return;
      }
      if (event.key === 'ArrowDown') { event.preventDefault(); moveActive(1); }
      else if (event.key === 'ArrowUp') { event.preventDefault(); moveActive(-1); }
      else if (event.key === 'Home') { event.preventDefault(); setActive(firstEnabled()); }
      else if (event.key === 'End') { event.preventDefault(); setActive(lastEnabled()); }
      else if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        if (activeIndex >= 0) choose(options[activeIndex].opt);
      }
      else if (event.key === 'Escape') {
        event.preventDefault();
        close();
      }
      else if (event.key === 'Tab') {
        close();
      }
      else if (event.key.length === 1) {
        typeAhead(event.key);
      }
    });

    select.addEventListener('change', sync);
    select.addEventListener('vivid:select-sync', sync);
    var observer = new MutationObserver(function () { rebuild(); });
    observer.observe(select, { childList: true, subtree: true, attributes: true, attributeFilter: ['disabled'] });

    var label = select.closest('label');
    if (label) {
      label.addEventListener('click', function (event) {
        if (event.target.closest('.v-select')) return;
        event.preventDefault();
        trigger.focus();
        if (menu.hidden) open();
      });
    }

    rebuild();
  }

  function init() {
    var selects = document.querySelectorAll('select:not(.v-select-enhanced)');
    Array.prototype.forEach.call(selects, enhance);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
