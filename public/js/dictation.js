(function(global){
'use strict';

var cfg = global.__DICTATION__ || {};
var offline = global.__DICTATION_DATA__ || null;
var ctx = null, gain = null;
var sources = [];
var banks = {};
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

function cfgFor(name){
  if(cfg[name]) return cfg[name];
  return name === 'light' ? cfg : null;
}

function offlineFor(name){
  if(!offline) return null;
  if(offline[name]) return offline[name];
  return name === 'light' && offline.timings ? offline : null;
}

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
  var b = banks[name] || (banks[name] = {});
  if(b.buffer && b.meta) return Promise.resolve(true);
  if(b.loading) return b.loading;
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
  for(var i = 0; i < sources.length; i++){
    try{ sources[i].stop(0); }catch(e){}
  }
  sources = [];
}

function playKeys(keys, name){
  name = name || 'light';
  var b = banks[name];
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
    src.connect(gain);
    src.start(t, clip[0], clip[1]);
    sources.push(src);
    t += clip[1] + gap;
  }
  return { duration: t - startedAt, keys: keys };
}

function play(a, op, b){
  var opKey = OP_KEY[op];
  if(!opKey) return null;
  return playKeys([opKey + a, 'n' + b], 'light');
}

global.DictationAudio = {
  load: load,
  unlock: unlock,
  isReady: function(name){ var b = banks[name || 'light']; return !!(b && b.buffer && b.meta); },
  isSupported: function(){ return !!(global.AudioContext || global.webkitAudioContext); },
  play: play,
  playKeys: playKeys,
  stop: stop
};
})(typeof window !== 'undefined' ? window : globalThis);
