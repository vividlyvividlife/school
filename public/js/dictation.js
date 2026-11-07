(function(global){
'use strict';

var cfg = global.__DICTATION__ || {};
var offline = global.__DICTATION_DATA__ || null;
var ctx = null, gain = null;
var sources = [];
var htmlAudio = null, htmlTimer = 0, htmlSeq = 0;
var banks = {};
var voice = 'f';
var rate = 1;
var OP_KEY = { '+':'add', '−':'sub', '-':'sub', '×':'mul', '*':'mul', '÷':'div', '/':'div' };

function ensureCtx(){
  if(ctx) return ctx;
  var AC = global.AudioContext || global.webkitAudioContext;
  if(!AC) return null;
  ctx = new AC();
  gain = ctx.createGain();
  gain.gain.value = 0.95;
  gain.connect(ctx.destination);
  return ctx;
}

function decode(ab){
  return new Promise(function(resolve, reject){
    var c = ensureCtx();
    if(!c) return reject(new Error('no audio context'));
    var p = c.decodeAudioData(ab, resolve, reject);
    if(p && p.then) p.then(resolve, reject);
  });
}

function pick(src, name){
  if(!src) return null;
  var node = src[name];
  if(node && node.audio) return node;
  if(node && node[voice]) return node[voice];
  var flat = src[name + '_' + voice];
  if(flat) return flat;
  return name === 'light' && src.timings ? src : null;
}

function cfgFor(name){ return pick(cfg, name); }

function offlineFor(name){ return pick(offline, name); }

function getTimings(name){
  var off = offlineFor(name);
  if(off && off.timings) return Promise.resolve(off.timings);
  var c = cfgFor(name);
  if(!c || !c.timings) return Promise.reject(new Error('no timings'));
  return fetch(c.timings).then(function(r){
    if(!r.ok) throw new Error('timings ' + r.status);
    return r.json();
  });
}

function getAudio(name){
  var off = offlineFor(name);
  var url = (off && off.audio) || (cfgFor(name) || {}).audio;
  if(!url) return Promise.reject(new Error('no audio url'));
  return fetch(url).then(function(r){
    if(!r.ok) throw new Error('audio ' + r.status);
    return r.arrayBuffer();
  });
}

function load(name){
  name = name || 'light';
  var key = name + ':' + voice;
  var b = banks[key] || (banks[key] = {});
  if(b.buffer && b.meta) return Promise.resolve(true);
  if(b.loading) return b.loading;
  b.url = getAudioUrl(name);
  b.loading = Promise.all([getTimings(name), getAudio(name)]).then(function(res){
    b.meta = res[0];
    return decode(res[1]);
  }).then(function(buf){
    b.buffer = buf;
    return true;
  }).catch(function(err){
    b.loading = null;
    b.meta = null;
    b.buffer = null;
    throw err;
  });
  return b.loading;
}

function unlock(){
  var c = ensureCtx();
  if(c && c.state === 'suspended' && c.resume) c.resume();
}

function stop(){
  htmlSeq++;
  window.clearTimeout(htmlTimer);
  htmlTimer = 0;
  if(htmlAudio){
    try{ htmlAudio.pause(); }catch(e){}
    htmlAudio = null;
  }
  for(var i = 0; i < sources.length; i++){
    try{ sources[i].stop(0); }catch(e){}
  }
  sources = [];
}

function getAudioUrl(name){
  var off = offlineFor(name);
  return (off && off.audio) || (cfgFor(name) || {}).audio || null;
}

function playKeysHtml(keys, bank, name){
  var clips = bank.meta.clips, gap = bank.meta.gap || 0.06;
  var duration = 0;
  for(var j = 0; j < keys.length; j++){
    var cl = clips[keys[j]];
    if(!cl) return null;
    duration += cl[1] / rate + (j ? gap : 0);
  }
  stop();
  var seq = ++htmlSeq;
  var el = new Audio(bank.url);
  el.preservesPitch = true;
  el.mozPreservesPitch = true;
  el.webkitPreservesPitch = true;
  el.playbackRate = rate;
  el.defaultPlaybackRate = rate;
  el.volume = 0.95;
  htmlAudio = el;
  var i = 0;
  function next(){
    if(seq !== htmlSeq) return;
    if(i >= keys.length){
      try{ el.pause(); }catch(e){}
      if(htmlAudio === el) htmlAudio = null;
      return;
    }
    var clip = clips[keys[i]];
    if(!clip){ stop(); return; }
    var startAt = clip[0];
    var endAt = clip[0] + clip[1];
    var fadeIn = 0.035;
    var fadeOut = 0.06;
    var tail = 0.015;
    el.volume = 0;
    try{ el.currentTime = startAt; }catch(e){}
    var p = el.play();
    if(p && p.catch) p.catch(function(){});
    var guard = 0;
    function watch(){
      if(seq !== htmlSeq) return;
      var t = el.currentTime;
      if(t < startAt - 0.02 && guard++ < 60){
        htmlTimer = window.setTimeout(watch, 10);
        return;
      }
      var left = endAt - t;
      if(left > 0){
        el.volume = left <= fadeOut
          ? 0.95 * left / fadeOut
          : 0.95 * Math.min(1, Math.max(0, (t - startAt) / fadeIn));
      } else {
        el.volume = 0;
        if(t >= endAt + tail){
          try{ el.pause(); }catch(e){}
          i++;
          htmlTimer = window.setTimeout(next, gap * 1000);
          return;
        }
      }
      htmlTimer = window.setTimeout(watch, 10);
    }
    htmlTimer = window.setTimeout(watch, 10);
  }
  if(el.readyState >= 1) next();
  else el.addEventListener('loadedmetadata', next, { once: true });
  return { duration: duration, keys: keys };
}

function playKeys(keys, name){
  name = name || 'light';
  var b = banks[name + ':' + voice];
  if(rate !== 1 && b && b.meta && b.url) return playKeysHtml(keys, b, name);
  var c = ensureCtx();
  if(!c || !b || !b.buffer || !b.meta) return null;
  if(c.state === 'suspended' && c.resume) c.resume();
  stop();
  var clips = b.meta.clips, gap = b.meta.gap || 0.06;
  var t = c.currentTime + 0.1;
  var startedAt = t;
  for(var i = 0; i < keys.length; i++){
    var clip = clips[keys[i]];
    if(!clip) return null;
    var src = c.createBufferSource();
    src.buffer = b.buffer;
    src.playbackRate.value = rate;
    src.connect(gain);
    src.start(t, clip[0], clip[1]);
    sources.push(src);
    t += clip[1] / rate + gap;
  }
  return { duration: t - startedAt, keys: keys };
}

function play(a, op, b){
  var opKey = OP_KEY[op];
  if(!opKey) return null;
  return playKeys(['c' + a, 'o_' + opKey, 'n' + b], 'light');
}

function setVoice(v){
  v = v === 'm' ? 'm' : 'f';
  if(v === voice) return;
  voice = v;
  stop();
}

function setRate(v){
  v = Number(v);
  if(!isFinite(v) || v < 0.5 || v > 2.5) v = 1;
  rate = v;
}

function getRate(){ return rate; }

global.DictationAudio = {
  load: load,
  unlock: unlock,
  setVoice: setVoice,
  getVoice: function(){ return voice; },
  setRate: setRate,
  getRate: getRate,
  isReady: function(name){ var b = banks[(name || 'light') + ':' + voice]; return !!(b && b.buffer && b.meta); },
  isSupported: function(){ return !!(global.AudioContext || global.webkitAudioContext); },
  play: play,
  playKeys: playKeys,
  stop: stop
};
})(typeof window !== 'undefined' ? window : globalThis);
