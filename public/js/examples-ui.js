(function(){
'use strict';
var $ = function(s){ return document.querySelector(s); };
var ui = {
  rows:$('#rows'), cols:$('#cols'), pages:$('#pages'), from:$('#from'), limit:$('#limit'),
  carry:$('#carry'), ops:$('#ops'), miss:$('#miss'), ans:$('#ans'), seed:$('#seed'),
  again:$('#again'), print:$('#print'), sheets:$('#sheets')
};

function variantLabel(seed, pageIndex, pageCount){
  return pageCount > 1 ? seed + '-' + (pageIndex + 1) : String(seed);
}
function headHTML(pageIndex, pageCount, seed){
  return '<div class="sheet-head">' +
      '<span class="wr">Имя<span class="line"></span></span>' +
      '<span class="wr">Дата<span class="line short"></span></span>' +
      '<span class="right">Вариант ' + variantLabel(seed, pageIndex, pageCount) + '</span>' +
    '</div>';
}
function exHTML(item, mode){
  function cell(value, missing){
    if(!missing) return '<span class="num">' + value + '</span>';
    return mode === 'faint' ? '<span class="ansv">' + value + '</span>' : '<span class="blank"></span>';
  }
  return '<div class="ex">' +
      cell(item.a, item.miss === 'a') +
      '<span class="op">' + item.op + '</span>' +
      cell(item.b, item.miss === 'b') +
      '<span class="eq">=</span>' +
      cell(item.r, item.miss === 'r') +
    '</div>';
}
function keyHTML(item){
  return '<div>' + item.a + ' ' + item.op + ' ' + item.b + ' = ' + item.r + '</div>';
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
  var active = selectedOps().some(function(op){ return op === 'add' || op === 'sub'; });
  ui.carry.disabled = !active;
}

function render(){
  var variant = MathSheet.makeVariant({
    rows: ui.rows.value, cols: ui.cols.value, pages: ui.pages.value,
    ops: selectedOps(), from: ui.from.value, limit: ui.limit.value, carry: ui.carry.checked,
    miss: ui.miss.value, seed: ui.seed.value
  });
  if(!variant.sheetPages.length){
    ui.sheets.innerHTML = '<div class="empty-note">Для выбранных границ действий нет примеров. Увеличьте «до» или выключите переход через 10.</div>';
    return;
  }
  var maxDigits = Math.max(2, String(variant.limit).length);
  var fs = MathSheet.fontSizePt(variant.cols, variant.rows, {
    maxDigits: maxDigits,
    twoBlanks: variant.miss.length > 1
  });
  var kl = MathSheet.keyLayout(variant.per);
  var mode = ui.ans.value;
  var parts = [];

  variant.sheetPages.forEach(function(items, i){
    parts.push('<section class="sheet">' +
      headHTML(i, variant.pages, variant.seed) +
      '<div class="grid" style="grid-template-columns:repeat(' + variant.cols + ',1fr);--fs:' + fs + 'pt">' +
        items.map(function(it){ return exHTML(it, mode); }).join('') +
      '</div>' +
    '</section>');
  });

  if(mode === 'key'){
    variant.sheetPages.forEach(function(items, i){
      parts.push('<section class="sheet key" style="--keycols:' + kl.cols + ';--keyfs:' + kl.fontSizePt + 'pt">' +
        headHTML(i, variant.pages, variant.seed) +
        '<h2>Ответы к варианту ' + variantLabel(variant.seed, i, variant.pages) + '</h2>' +
        '<div class="key-cols">' + items.map(keyHTML).join('') + '</div>' +
      '</section>');
    });
  }
  ui.sheets.innerHTML = parts.join('');
}

['rows','cols','pages','from','limit','carry','miss','ans','seed'].forEach(function(id){
  ui[id].addEventListener('input', render);
  ui[id].addEventListener('change', render);
});
ui.ops.addEventListener('change', function(e){
  if(!selectedOps().length){
    var boxes = Array.prototype.slice.call(ui.ops.querySelectorAll('input[type="checkbox"]'));
    boxes.forEach(function(x){ x.checked = x === e.target; });
  }
  toggleCarry();
  render();
});
ui.again.addEventListener('click', function(){
  ui.seed.value = 1000 + Math.floor(Math.random() * 9000);
  render();
});
ui.print.addEventListener('click', function(){ window.print(); });

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
   ?rows=8&cols=3&pages=2&ops=add,sub,mul,div&from=0&limit=100&carry=0&miss=all&ans=key&seed=1234 */
function applyUrlParams(){
  var q = {};
  (location.search || '').replace(/^\?/, '').split('&').forEach(function(kv){
    if(!kv) return;
    var p = kv.split('=');
    q[decodeURIComponent(p[0])] = decodeURIComponent(p[1] || '');
  });
  ['rows','cols','pages','from','limit','miss','ans','seed'].forEach(function(id){
    if(q[id] !== undefined && q[id] !== '') ui[id].value = q[id];
  });
  if(q.carry !== undefined && q.carry !== '') ui.carry.checked = !(q.carry === '0' || q.carry === 'false');
  if(q.ops !== undefined && q.ops !== '') setOps(MathSheet.normalizeOps(q.ops));
  else if(q.type !== undefined && q.type !== '') setOps(legacyOps(q.type));
}

applyUrlParams();
if(!/^\d+$/.test(ui.seed.value)) ui.seed.value = 1000 + Math.floor(Math.random() * 9000);
toggleCarry();
render();
})();
