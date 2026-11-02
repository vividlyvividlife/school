(function(global){
'use strict';

var cfg = global.__DICTATION__ || {};
var offline = global.__DICTATION_DATA__ || null;
var ctx = null, gain = null, buffer = null, meta = null, loading = null;
var sources = [];
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

function getTimings(){
  if(offline && offline.timings) return Promise.resolve(offline.timings);
  return fetch(cfg.timings).then(function(r){
    if(!r.ok) throw new Error('timings ' + r.status);
    return r.json();
  });
}

function getAudio(){
  var url = (offline && offline.audio) || cfg.audio;
  if(!url) return Promise.reject(new Error('no audio url'));
  return fetch(url).then(function(r){
    if(!r.ok) throw new Error('audio ' + r.status);
    return r.arrayBuffer();
  });
}

function load(){
  if(buffer && meta) return Promise.resolve(true);
  if(loading) return loading;
  loading = Promise.all([getTimings(), getAudio()]).then(function(res){
    meta = res[0];
    return decode(res[1]);
  }).then(function(buf){
    buffer = buf;
    return true;
  }).catch(function(err){
    loading = null;
    meta = null;
    buffer = null;
    throw err;
  });
  return loading;
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

function play(a, op, b){
  var c = ensureCtx();
  if(!c || !buffer || !meta) return null;
  if(c.state === 'suspended' && c.resume) c.resume();
  stop();
  var opKey = OP_KEY[op];
  if(!opKey) return null;
  var keys = [opKey + a, 'n' + b];
  var clips = meta.clips;
  var t = c.currentTime + 0.1;
  var startedAt = t;
  for(var i = 0; i < keys.length; i++){
    var clip = clips[keys[i]];
    if(!clip) return null;
    var src = c.createBufferSource();
    src.buffer = buffer;
    src.connect(gain);
    src.start(t, clip[0], clip[1]);
    sources.push(src);
    t += clip[1] + (meta.gap || 0.06);
  }
  return { duration: t - startedAt, keys: keys };
}

global.DictationAudio = {
  load: load,
  unlock: unlock,
  isReady: function(){ return !!(buffer && meta); },
  isSupported: function(){ return !!(global.AudioContext || global.webkitAudioContext); },
  play: play,
  stop: stop
};
})(typeof window !== 'undefined' ? window : globalThis);
