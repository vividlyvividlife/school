(function(){
'use strict';
var $ = function(s){ return document.querySelector(s); };
var ui = { rows:$('#rows'), cols:$('#cols'), pages:$('#pages'), type:$('#type'), miss:$('#miss'), ans:$('#ans'), seed:$('#seed'), again:$('#again'), print:$('#print'), sheets:$('#sheets') };

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
/* пример рисуется по-разному: пропущен ответ, первое число или второе */
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

function render(){
  var variant = MathSheet.makeVariant({
    rows: ui.rows.value, cols: ui.cols.value, pages: ui.pages.value,
    type: ui.type.value, miss: ui.miss.value, seed: ui.seed.value
  });
  var fs = MathSheet.fontSizePt(variant.cols, variant.rows);
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
      parts.push('<section class="sheet key">' +
        headHTML(i, variant.pages, variant.seed) +
        '<h2>Ответы к варианту ' + variantLabel(variant.seed, i, variant.pages) + '</h2>' +
        '<div class="key-cols">' + items.map(keyHTML).join('') + '</div>' +
      '</section>');
    });
  }
  ui.sheets.innerHTML = parts.join('');
}

['rows','cols','pages','type','miss','ans','seed'].forEach(function(id){
  ui[id].addEventListener('input', render);
  ui[id].addEventListener('change', render);
});
ui.again.addEventListener('click', function(){
  ui.seed.value = 1000 + Math.floor(Math.random() * 9000);
  render();
});
ui.print.addEventListener('click', function(){ window.print(); });

/* настройки можно задать прямо в ссылке:
   math-examples-20.html?rows=8&cols=3&pages=2&type=add&miss=all&ans=key&seed=1234 */
function applyUrlParams(){
  var q = {};
  (location.search || '').replace(/^\?/, '').split('&').forEach(function(kv){
    if(!kv) return;
    var p = kv.split('=');
    q[decodeURIComponent(p[0])] = decodeURIComponent(p[1] || '');
  });
  ['rows','cols','pages','type','miss','ans','seed'].forEach(function(id){
    if(q[id] !== undefined && q[id] !== '') ui[id].value = q[id];
  });
}

applyUrlParams();
if(!/^\d+$/.test(ui.seed.value)) ui.seed.value = 1000 + Math.floor(Math.random() * 9000);
render();
})();
