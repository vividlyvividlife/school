(function(){
'use strict';
var LANG = (document.documentElement.lang || 'ru').toLowerCase().indexOf('en') === 0 ? 'en' : 'ru';
function tr(ru, en){ return LANG === 'en' ? en : ru; }
function esc(v){
  return String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
var $ = function(s){ return document.querySelector(s); };
var ui = {
  type:$('#sheet-type'), rows:$('#rows'), cols:$('#cols'), pages:$('#pages'), from:$('#from'), limit:$('#limit'),
  carry:$('#carry'), star:$('#star'), ops:$('#ops'), miss:$('#miss'), ans:$('#ans'), write:$('#write'), seed:$('#seed'),
  again:$('#again'), print:$('#print'), sheets:$('#sheets'), rangeHint:$('#range-hint')
};

var TYPE_NAMES = ['examples', 'digits', 'compare', 'missing', 'brackets', 'units', 'perimeter', 'problems', 'polylines',
  'equations', 'remainders', 'area', 'operations', 'divisibility', 'geometry', 'thousand', 'round', 'tree'];
var RANGE = {
  examples: [0, 100], digits: [10, 99], compare: [1, 100], missing: [1, 100],
  brackets: [1, 100], units: [1, 10000], perimeter: [1, 20], problems: [1, 100], polylines: [1, 20],
  equations: [1, 100], remainders: [1, 100], area: [1, 20], operations: [1, 100], divisibility: [1, 100],
  geometry: [1, 20], thousand: [100, 999], round: [1, 99], tree: [2, 6]
};
var DEFAULTS = {
  examples: { rows: 8, cols: 3, from: 0, to: 18, ops: ['add', 'sub'], miss: 'r' },
  digits: { rows: 8, cols: 2, from: 10, to: 99 },
  compare: { rows: 8, cols: 3, from: 1, to: 100 },
  missing: { rows: 8, cols: 3, from: 1, to: 100, ops: ['add', 'sub'], miss: 'r' },
  brackets: { rows: 8, cols: 2, from: 1, to: 100, ops: ['add', 'sub', 'mul', 'div'] },
  units: { rows: 8, cols: 2, from: 1, to: 100 },
  perimeter: { rows: 6, cols: 2, from: 1, to: 20 },
  problems: { rows: 5, cols: 1, from: 10, to: 100, ops: ['add', 'sub'] },
  polylines: { rows: 5, cols: 1, from: 1, to: 10 },
  equations: { rows: 8, cols: 3, from: 1, to: 100 },
  remainders: { rows: 8, cols: 3, from: 10, to: 100 },
  area: { rows: 6, cols: 2, from: 1, to: 10 },
  operations: { rows: 6, cols: 2, from: 1, to: 20, ops: ['add', 'sub'] },
  divisibility: { rows: 8, cols: 3, from: 1, to: 50 },
  geometry: { rows: 5, cols: 2, from: 1, to: 20 },
  thousand: { rows: 8, cols: 3, from: 100, to: 999 },
  round: { rows: 8, cols: 3, from: 1, to: 50 },
  tree: { rows: 6, cols: 2, from: 2, to: 5 }
};
var current = 'examples';
var memory = {};

function clampInt(v, min, max, dflt){ return MathSheet.clampInt(v, min, max, dflt); }
function variantLabel(seed, pageIndex, pageCount){
  return pageCount > 1 ? seed + '-' + (pageIndex + 1) : String(seed);
}
/* номера идут сверху вниз по колонкам, как в тетради */
function columnNumbers(count, cols){
  var nums = [], start = 1;
  for(var c = 0; c < cols && c < count; c++){
    var rows = Math.ceil((count - c) / cols);
    for(var r = 0; r < rows; r++) nums[r * cols + c] = start + r;
    start += rows;
  }
  return nums;
}
function headHTML(pageIndex, pageCount, seed){
  return '<div class="sheet-head">' +
      '<span class="wr">' + tr('Имя', 'Name') + '<span class="line"></span></span>' +
      '<span class="wr">' + tr('Дата', 'Date') + '<span class="line short"></span></span>' +
      '<span class="right">' + tr('Вариант ', 'Variant ') + variantLabel(seed, pageIndex, pageCount) + '</span>' +
    '</div>';
}
function exHTML(item, mode, n){
  function cell(value, missing){
    if(!missing) return '<span class="num">' + value + '</span>';
    return mode === 'faint' ? '<span class="ansv">' + value + '</span>' : '<span class="blank"></span>';
  }
  return '<div class="ex"><span class="tn">' + n + '.</span>' +
      cell(item.a, item.miss === 'a') +
      '<span class="op">' + item.op + '</span>' +
      cell(item.b, item.miss === 'b') +
      '<span class="eq">=</span>' +
      cell(item.r, item.miss === 'r') +
    '</div>';
}
function keyHTML(item, n){
  return '<div><span class="kn">' + n + '.</span> ' + item.a + ' ' + item.op + ' ' + item.b + ' = ' + item.r + '</div>';
}
/* рабочее поле: пропуски для записи условия и решения или клетки под всю запись */
var cellsSeq = 0;
/* клетка школьной тетради — 5 мм; в SVG-паттерне 1 мм = 96/25.4 px */
var CELL_PX = +(5 * 96 / 25.4).toFixed(3);
function cellsHTML(){
  var id = 'wp-cells-' + (++cellsSeq);
  return '<span class="wp-work wp-work-hard"><svg class="wp-cells" aria-hidden="true">' +
    '<defs><pattern id="' + id + '" width="' + CELL_PX + '" height="' + CELL_PX + '" patternUnits="userSpaceOnUse">' +
    '<path d="M' + CELL_PX + ' 0H0V' + CELL_PX + '"/></pattern></defs>' +
    '<rect width="100%" height="100%" fill="url(#' + id + ')"/>' +
  '</svg></span>';
}
/* числа в поле «с условием и решением» ученик вписывает сам — остаются подписи, знаки и единицы */
function blankNumbers(text){
  return esc(String(text)).replace(/\d+|\?/g, '<span class="blank"></span>');
}
function workHTML(item, mode, write){
  if(!item.work || write === 'none') return '';
  if(write === 'hard') return cellsHTML();
  var given = item.work.given.map(function(pair){
    return '<span class="wp-gi"><span class="wp-gk">' + esc(pair[0]) + '</span> ' + blankNumbers(pair[1]) + '</span>';
  }).join('');
  var steps = item.work.steps.map(function(step, i){
    if(step[1] === null) return '<span class="wp-step wp-step-note">' + blankNumbers(step[0]) + '</span>';
    var result = mode === 'faint'
      ? '<span class="ansv">' + esc(step[1]) + '</span>'
      : '<span class="blank"></span>';
    return '<span class="wp-step"><span class="wp-n">' + (i + 1) + ')</span>' +
      '<span class="wp-eq">' + blankNumbers(step[0]) + ' = ' + result + '</span></span>';
  }).join('');
  return '<span class="wp-work">' +
    '<span class="wp-work-h">' + tr('Краткая запись', 'Short note') + '</span>' +
    '<span class="wp-given">' + given + '</span>' +
    '<span class="wp-work-h">' + tr('Решение', 'Solution') + '</span>' +
    '<span class="wp-steps">' + steps + '</span>' +
  '</span>';
}
function taskHTML(item, n, mode, write){
  var answer = mode === 'faint'
    ? '<span class="ansv">' + esc(item.answer) + '</span>'
    : '<span class="blank' + (item.blank === 'sign' ? ' sign' : '') + '"></span>';
  var work = workHTML(item, mode, write);
  var cls = (item.cls || '') + (work ? ' wp-worked' : '');
  var html = item.html.replace('{{work}}', work).replace('{{b}}', answer);
  return '<div class="task' + (cls ? ' ' + cls : '') + '"><span class="tn">' + n + '.</span>' +
    '<span class="q">' + html + '</span></div>';
}

function radioValue(group, fallback){
  if(!group) return fallback;
  var on = group.querySelector('input[type="radio"]:checked');
  return on ? on.value : fallback;
}
function setRadio(group, value){
  if(!group) return;
  var inputs = Array.prototype.slice.call(group.querySelectorAll('input[type="radio"]'));
  if(!inputs.some(function(x){ return x.value === value; })) return;
  inputs.forEach(function(x){ x.checked = x.value === value; });
}
function missMode(){ return radioValue(ui.miss, 'r'); }
function answerMode(){ return radioValue(ui.ans, 'none'); }
function writeMode(){ return radioValue(ui.write, 'none'); }
/* звезда: включает задачи со звёздочкой — они решаются повторным + или − */
function starMode(){ return !!(ui.star && ui.star.classList.contains('on')); }
function setStar(on){
  if(!ui.star) return;
  ui.star.classList.toggle('on', !!on);
  ui.star.setAttribute('aria-pressed', on ? 'true' : 'false');
}
/* с полями условия и решения на лист помещается не больше четырёх задач */
function fitWriteRows(){
  if(current !== 'problems' || !ui.write) return;
  var mode = writeMode();
  ui.rows.max = mode === 'none' ? 10 : 4;
  if(+ui.rows.value > +ui.rows.max) ui.rows.value = ui.rows.max;
}

function selectedOps(){
  if(!ui.ops) return ['add', 'sub'];
  var boxes = Array.prototype.slice.call(ui.ops.querySelectorAll('input[type="checkbox"]'));
  var out = boxes.filter(function(x){ return x.checked; }).map(function(x){ return x.value; });
  return out.length ? out : ['add', 'sub'];
}
function setOps(keys){
  if(!ui.ops) return;
  var boxes = Array.prototype.slice.call(ui.ops.querySelectorAll('input[type="checkbox"]'));
  boxes.forEach(function(x){ x.checked = keys.indexOf(x.value) >= 0; });
  if(boxes.length && !boxes.some(function(x){ return x.checked; })) boxes[0].checked = true;
}
function legacyOps(type){
  if(type === 'all') return ['add', 'sub', 'mul', 'div'];
  if(type === 'muldiv') return ['mul', 'div'];
  return MathSheet.normalizeOps(type);
}
function toggleCarry(){
  if(!ui.carry) return;
  var active = (current === 'examples' || current === 'missing') &&
    selectedOps().some(function(op){ return op === 'add' || op === 'sub'; });
  ui.carry.disabled = !active;
}

function taskInputs(type){
  var box = document.querySelector('[data-tasks="' + type + '"]');
  return box ? Array.prototype.slice.call(box.querySelectorAll('input[type="checkbox"]')) : [];
}
function taskAllowed(value){
  if(current !== 'problems' || !window.MathProblems) return true;
  return window.MathProblems.problemTypesForOps([value], selectedOps(), starMode()).length > 0;
}
function selectedTasks(type){
  var all = taskInputs(type);
  var pool = type === 'problems' ? all.filter(function(x){ return taskAllowed(x.value); }) : all;
  var out = pool.filter(function(x){ return x.checked; }).map(function(x){ return x.value; });
  return out.length ? out : pool.map(function(x){ return x.value; });
}
var OPS_NAMES = { add: '+', sub: '−', mul: '×', div: '÷' };
function syncTaskChips(){  if(current !== 'problems' || !window.MathProblems) return;
  taskInputs('problems').forEach(function(inp){
    var ok = window.MathProblems.problemTypesForOps([inp.value], selectedOps(), starMode()).length > 0;
    var lab = inp.closest('label');
    if(ok){
      inp.disabled = false;
      if(lab){ lab.classList.remove('off'); lab.removeAttribute('title'); }
      return;
    }
    inp.checked = false;
    inp.disabled = true;
    if(lab){
      lab.classList.add('off');
      lab.title = window.MathProblems.problemIsStarred(inp.value)
        ? tr('Включите ★', 'Turn on ★')
        : tr('Нужно действие: ', 'Requires: ') + window.MathProblems.problemTypeNeeds(inp.value)
          .map(function(route){
            return route.map(function(o){ return OPS_NAMES[o]; }).join(' ');
          }).join(tr(' или ', ' or '));
    }
  });
}
function allTasksMap(){
  var map = {};
  document.querySelectorAll('[data-tasks]').forEach(function(box){
    map[box.getAttribute('data-tasks')] = Array.prototype.slice.call(box.querySelectorAll('input[type="checkbox"]')).map(function(x){ return x.value; });
  });
  return map;
}
function readState(){
  return {
    rows: ui.rows.value, cols: ui.cols.value, pages: ui.pages.value,
    from: ui.from.value, to: ui.limit.value,
    ops: selectedOps(), miss: missMode(), write: writeMode(), star: starMode(),
    tasks: (function(){
      var map = {};
      document.querySelectorAll('[data-tasks]').forEach(function(box){
        map[box.getAttribute('data-tasks')] = Array.prototype.slice.call(box.querySelectorAll('input[type="checkbox"]'))
          .filter(function(x){ return x.checked; }).map(function(x){ return x.value; });
      });
      return map;
    })()
  };
}
function applyTaskSelections(map){
  document.querySelectorAll('[data-tasks]').forEach(function(box){
    var type = box.getAttribute('data-tasks'), want = map && map[type];
    if(!want || !want.length) return;
    Array.prototype.slice.call(box.querySelectorAll('input[type="checkbox"]')).forEach(function(x){
      x.checked = want.indexOf(x.value) >= 0;
    });
  });
}
function defaultsFor(type){
  var d = DEFAULTS[type] || DEFAULTS.examples;
  return {
    rows: d.rows, cols: d.cols, pages: 1, from: d.from, to: d.to,
    ops: d.ops || ['add', 'sub'], miss: d.miss || 'r', write: 'none', star: false, tasks: allTasksMap()
  };
}
function applyState(st){
  var range = RANGE[current] || RANGE.examples;
  var def = DEFAULTS[current] || DEFAULTS.examples;
  var oneCol = current === 'problems' || current === 'polylines';
  ui.rows.max = current === 'polylines' ? 5 : oneCol ? 10 : current === 'examples' ? 40 : 24;
  ui.cols.min = oneCol ? 1 : 2;
  ui.cols.max = oneCol ? 1 : current === 'examples' ? 10 : (current === 'perimeter' || current === 'area' || current === 'operations' || current === 'geometry') ? 2 : 4;
  ui.rows.value = clampInt(st.rows, 2, +ui.rows.max, def.rows);
  ui.cols.value = clampInt(st.cols, +ui.cols.min, +ui.cols.max, def.cols);
  ui.pages.value = clampInt(st.pages, 1, 12, 1);
  ui.from.min = range[0]; ui.from.max = range[1];
  ui.limit.min = Math.max(1, range[0]); ui.limit.max = range[1];
  var from = clampInt(st.from, range[0], range[1], def.from);
  var to = clampInt(st.to, Math.max(1, range[0]), range[1], def.to);
  if(from > to){ var t = from; from = to; to = t; }
  ui.from.value = from;
  ui.limit.value = to;
  setOps(st.ops || ['add', 'sub']);
  setRadio(ui.miss, st.miss || 'r');
  setRadio(ui.write, st.write || 'none');
  setStar(!!st.star);
  applyTaskSelections(st.tasks);
  fitWriteRows();
  syncTaskChips();
}
function applyVisibility(){
  document.querySelectorAll('[data-only]').forEach(function(el){
    el.hidden = el.getAttribute('data-only').split(/\s+/).indexOf(current) < 0;
  });
  if(ui.rangeHint){
    Array.prototype.slice.call(ui.rangeHint.querySelectorAll('[data-for]')).forEach(function(el){
      el.hidden = el.getAttribute('data-for') !== current;
    });
  }
  Array.prototype.slice.call(document.querySelectorAll('#ops .op')).forEach(function(el){
    el.hidden = false;
  });
  var radio = document.querySelector('input[name="sheet-type"][value="' + current + '"]');
  if(radio) radio.checked = true;
}

function renderExamples(){
  var variant = MathSheet.makeVariant({
    rows: ui.rows.value, cols: ui.cols.value, pages: ui.pages.value,
    ops: selectedOps(), from: ui.from.value, limit: ui.limit.value, carry: ui.carry.checked,
    miss: missMode(), seed: ui.seed.value
  });
  if(!variant.sheetPages.length){
    ui.sheets.innerHTML = '<div class="empty-note">' + tr('Для выбранных границ действий нет примеров. Увеличьте «до» или выключите переход через 10.', 'No problems for the selected operation ranges. Increase “to” or turn off carry over 10.') + '</div>';
    return;
  }
  var maxDigits = Math.max(2, String(variant.limit).length);
  var fs = MathSheet.fontSizePt(variant.cols, variant.rows, {
    maxDigits: maxDigits,
    twoBlanks: variant.miss.length > 1,
    numbered: true
  });
  var kl = MathSheet.keyLayout(variant.per);
  var mode = answerMode();
  var parts = [];

  variant.sheetPages.forEach(function(items, i){
    var nums = columnNumbers(items.length, variant.cols);
    parts.push('<section class="sheet">' +
      headHTML(i, variant.pages, variant.seed) +
      '<div class="grid" style="grid-template-columns:repeat(' + variant.cols + ',1fr);--fs:' + fs + 'pt">' +
        items.map(function(it, j){ return exHTML(it, mode, nums[j]); }).join('') +
      '</div>' +
    '</section>');
  });

  if(mode === 'key'){
    variant.sheetPages.forEach(function(items, i){
      var nums = columnNumbers(items.length, variant.cols);
      parts.push('<section class="sheet key" style="--keycols:' + kl.cols + ';--keyfs:' + kl.fontSizePt + 'pt">' +
        headHTML(i, variant.pages, variant.seed) +
        '<h2>' + tr('Ответы к варианту ', 'Answers for variant ') + variantLabel(variant.seed, i, variant.pages) + '</h2>' +
        '<div class="key-cols">' + items.map(function(it, j){ return keyHTML(it, nums[j]); }).join('') + '</div>' +
      '</section>');
    });
  }
  ui.sheets.innerHTML = parts.join('');
}

function renderTasks(){
  var variant = WorksheetTasks.makeVariant({
    kind: current,
    rows: ui.rows.value, cols: ui.cols.value, pages: ui.pages.value,
    from: ui.from.value, to: ui.limit.value,
    tasks: selectedTasks(current), ops: selectedOps(), miss: missMode(), star: starMode(),
    carry: ui.carry.checked, seed: ui.seed.value
  });
  var total = variant.sheets.reduce(function(n, s){ return n + s.items.length; }, 0);
  if(!total){
    ui.sheets.innerHTML = '<div class="empty-note">' + tr('Для выбранных настроек нет заданий.', 'No tasks for the selected settings.') + '</div>';
    return;
  }
  var fs = WorksheetTasks.taskFontPt(current, variant.cols, variant.rows);
  var mode = answerMode();
  var write = current === 'problems' ? writeMode() : 'none';
  var keyCols = current === 'problems' ? 1 : variant.cols >= 3 ? 3 : 2;
  var keyFs = current === 'problems' ? 9.5 : 10;
  var parts = [];

  variant.sheets.forEach(function(sheet, i){
    var nums = columnNumbers(sheet.items.length, variant.cols);
    parts.push('<section class="sheet' + (write === 'hard' ? ' write-hard' : '') + '">' +
      headHTML(i, variant.pages, variant.seed) +
      '<div class="grid tasks-grid' + (write === 'hard' ? ' write-hard' : '') + '" data-kind="' + current + '" style="grid-template-columns:repeat(' + variant.cols + ',1fr);--fs:' + fs + 'pt">' +
        sheet.items.map(function(it, j){ return taskHTML(it, nums[j], mode, write); }).join('') +
      '</div>' +
    '</section>');
  });

  if(mode === 'key'){
    variant.sheets.forEach(function(sheet, i){
      if(!sheet.items.length) return;
      var nums = columnNumbers(sheet.items.length, variant.cols);
      parts.push('<section class="sheet key" style="--keycols:' + keyCols + ';--keyfs:' + keyFs + 'pt">' +
        headHTML(i, variant.pages, variant.seed) +
        '<h2>' + tr('Ответы к варианту ', 'Answers for variant ') + variantLabel(variant.seed, i, variant.pages) + '</h2>' +
        '<div class="key-cols">' + sheet.items.map(function(it, j){
          return '<div><span class="kn">' + nums[j] + '.</span> ' + esc(it.key) + '</div>';
        }).join('') + '</div>' +
      '</section>');
    });
  }
  ui.sheets.innerHTML = parts.join('');
}

function render(){
  if(current === 'examples') renderExamples();
  else renderTasks();
}

['rows','cols','pages','from','limit','carry','seed'].forEach(function(id){
  ui[id].addEventListener('input', render);
  ui[id].addEventListener('change', render);
});
ui.miss.addEventListener('change', render);
ui.ans.addEventListener('change', render);
if(ui.write) ui.write.addEventListener('change', function(){
  fitWriteRows();
  render();
});
/* звезда только переключает звёздные задачи, действия и галочки не меняет */
function setStarGroup(on){
  setStar(on);
  /* включаем звёздочку — сразу подключаем весь звёздный набор задач */
  if(on && window.MathProblems){
    taskInputs('problems').forEach(function(inp){
      if(window.MathProblems.problemIsStarred(inp.value)) inp.checked = true;
    });
  }
}

if(ui.star) ui.star.addEventListener('click', function(){
  setStarGroup(!starMode());
  syncTaskChips();
  render();
});
ui.ops.addEventListener('change', function(e){
  if(!selectedOps().length){
    var boxes = Array.prototype.slice.call(ui.ops.querySelectorAll('input[type="checkbox"]'));
    boxes.forEach(function(x){ x.checked = x === e.target; });
  }
  syncTaskChips();
  toggleCarry();
  render();
});
document.querySelectorAll('[data-tasks] input[type="checkbox"]').forEach(function(input){
  input.addEventListener('change', function(e){
    var box = e.target.closest('[data-tasks]');
    if(box && !box.querySelector('input:checked')) e.target.checked = true;
    render();
  });
});
ui.type.addEventListener('change', function(e){
  if(e.target.name !== 'sheet-type') return;
  memory[current] = readState();
  current = e.target.value;
  applyState(memory[current] || defaultsFor(current));
  applyVisibility();
  toggleCarry();
  render();
});
ui.again.addEventListener('click', function(){
  ui.seed.value = 1000 + Math.floor(Math.random() * 9000);
  render();
});
ui.print.addEventListener('click', function(){ window.print(); });

/* ---------- стрелки у числовых полей ---------- */
function initSteppers(){
  Array.prototype.forEach.call(document.querySelectorAll('.fld input[type="number"]'), function(inp){
    if(inp.parentElement && inp.parentElement.classList.contains('numstep')) return;
    var host = document.createElement('span');
    host.className = 'numstep';
    inp.parentNode.insertBefore(host, inp);
    host.appendChild(inp);

    var labelEl = inp.closest('.fld');
    var fieldName = labelEl ? labelEl.textContent.replace(/\s+/g, ' ').trim() : '';
    var box = document.createElement('span');
    box.className = 'stepbtns';
    box.appendChild(stepBtn(1, tr('Увеличить', 'Increase') + (fieldName ? ': ' + fieldName : '')));
    box.appendChild(stepBtn(-1, tr('Уменьшить', 'Decrease') + (fieldName ? ': ' + fieldName : '')));
    host.appendChild(box);

    box.addEventListener('click', function(e){
      var btn = e.target.closest('button[data-dir]');
      if(!btn) return;
      e.preventDefault();
      var dir = Number(btn.getAttribute('data-dir'));
      var min = inp.min !== '' ? Number(inp.min) : -Infinity;
      var max = inp.max !== '' ? Number(inp.max) : Infinity;
      var step = Number(inp.step) || 1;
      var v = parseInt(inp.value, 10);
      if(isNaN(v)) v = min !== -Infinity ? min : 0;
      var next = Math.max(min, Math.min(max, v + dir * step));
      if(next === v) return;
      inp.value = next;
      inp.dispatchEvent(new Event('input', { bubbles: true }));
      inp.dispatchEvent(new Event('change', { bubbles: true }));
    });
  });
}
function stepBtn(dir, label){
  var btn = document.createElement('button');
  btn.type = 'button';
  btn.setAttribute('data-dir', dir);
  btn.setAttribute('aria-label', label);
  btn.innerHTML = '<svg viewBox="0 0 10 7" aria-hidden="true"><path d="' +
    (dir > 0 ? 'M1 6l4-4 4 4' : 'M1 1l4 4 4-4') + '"/></svg>';
  return btn;
}

var helpBtn = $('#sheet-help'), helpPanel = $('#sheet-help-panel');
function setHelp(open){
  if(!helpBtn || !helpPanel) return;
  helpPanel.hidden = !open;
  helpBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
}
if(helpBtn && helpPanel){
  helpBtn.addEventListener('click', function(e){
    e.stopPropagation();
    setHelp(helpPanel.hidden);
  });
  helpPanel.addEventListener('click', function(e){ e.stopPropagation(); });
  document.addEventListener('click', function(){ setHelp(false); });
  document.addEventListener('keydown', function(e){ if(e.key === 'Escape') setHelp(false); });
}

/* настройки можно задать прямо в ссылке:
   ?type=digits&rows=8&cols=2&pages=2&tasks=tens,ones&from=10&to=99&ans=key&seed=1234
   для задач: &write=easy — краткая запись и решение, &write=hard — пустые линейки,
   &star=1 — включить задачи со звёздочкой (решение повторным + или −).
   Старые ссылки с ?type=add,sub и ?type=mix продолжают работать для примеров. */
function parseQuery(){
  var q = {};
  (location.search || '').replace(/^\?/, '').split('&').forEach(function(kv){
    if(!kv) return;
    var p = kv.split('=');
    q[decodeURIComponent(p[0])] = decodeURIComponent(p[1] || '');
  });
  return q;
}
function applyUrlParams(q){
  ['rows','cols','pages','from','limit','seed'].forEach(function(id){
    if(q[id] !== undefined && q[id] !== '') ui[id].value = q[id];
  });
  if(q.to !== undefined && q.to !== '') ui.limit.value = q.to;
  if(q.miss !== undefined && q.miss !== '') setRadio(ui.miss, q.miss);
  if(q.ans !== undefined && q.ans !== '') setRadio(ui.ans, q.ans);
  if(q.write !== undefined && q.write !== '') setRadio(ui.write, q.write);
  if(q.carry !== undefined && q.carry !== '') ui.carry.checked = !(q.carry === '0' || q.carry === 'false');
  if(q.star !== undefined && q.star !== '') setStar(!(q.star === '0' || q.star === 'false'));
  if(q.ops !== undefined && q.ops !== '') setOps(MathSheet.normalizeOps(q.ops));
  else if(q.type !== undefined && q.type !== '' && TYPE_NAMES.indexOf(q.type) < 0) setOps(legacyOps(q.type));
  if(q.tasks !== undefined && q.tasks !== ''){
    var want = q.tasks.split(/[,\s]+/), all = taskInputs(current);
    var valid = want.filter(function(x){ return all.some(function(inp){ return inp.value === x; }); });
    if(valid.length){
      all.forEach(function(inp){ inp.checked = valid.indexOf(inp.value) >= 0; });
    }
  }
  applyState(readState());
  /* ссылка со звёздочкой без списка задач — подключаем весь звёздный набор */
  if((q.tasks === undefined || q.tasks === '') && starMode()){
    setStarGroup(true);
    syncTaskChips();
  }
}

var q = parseQuery();
current = TYPE_NAMES.indexOf(q.type) >= 0 ? q.type : 'examples';
applyState(defaultsFor(current));
applyVisibility();
applyUrlParams(q);
if(!/^\d+$/.test(ui.seed.value)) ui.seed.value = 1000 + Math.floor(Math.random() * 9000);
toggleCarry();
initSteppers();
render();
})();
