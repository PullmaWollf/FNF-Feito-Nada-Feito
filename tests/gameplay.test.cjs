/* Real game/controller code exercised with virtual audio time and canvas/DOM doubles.
   This is a deterministic integration test, not a browser or audio-quality test. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {execFileSync} = require('node:child_process');
const root = path.resolve(__dirname,'..');
const charts = JSON.parse(execFileSync('python',['-c','import json; from game.charts import make_chart; print(json.dumps([make_chart(i) for i in range(1,4)]))'],{cwd:root,encoding:'utf8'}));
function harness(){
 const noop=()=>{}, drawing=new Proxy({createLinearGradient:()=>({addColorStop:noop})},{get:(o,k)=>o[k]||noop});
 class Element{constructor(){this.hidden=false;this.value='0';this.textContent='';this.innerHTML='';this.classList={add:noop,remove:noop,toggle:noop};this.dataset={};}getContext(){return drawing;}getBoundingClientRect(){return{width:600,height:420};}showModal(){this.open=true;}close(){this.open=false;}addEventListener(){}setAttribute(){}setPointerCapture(){}}
 const elements=new Map(),get=s=>{if(!elements.has(s))elements.set(s,new Element());return elements.get(s);};
 const levels=[1,2,3].map(i=>{const e=new Element();e.dataset.level=String(i);return e;});
 const pads=[0,1,2,3].map(i=>{const e=new Element();e.dataset.lane=String(i);return e;});
 const handlers={},storage=new Map();let queued;
 const node=()=>({connect:noop,start:noop,stop:noop,frequency:{setValueAtTime:noop,exponentialRampToValueAtTime:noop},gain:{value:0,setValueAtTime:noop,exponentialRampToValueAtTime:noop}});
 let currentAudio;
 class Audio{constructor(){this.currentTime=0;this.sampleRate=8000;this.destination={};currentAudio=this;}createGain(){return node();}createOscillator(){return node();}createDynamicsCompressor(){return node();}createBiquadFilter(){return{...node(),frequency:{value:0}};}createBuffer(ch,len){return{getChannelData:()=>new Float32Array(len)};}createBufferSource(){return node();}resume(){return Promise.resolve();}suspend(){return Promise.resolve();}close(){return Promise.resolve();}}
 const sandbox={console,Math,Date,AudioContext:Audio,innerWidth:1280,innerHeight:720,devicePixelRatio:1,matchMedia:()=>({matches:false}),localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},document:{querySelector:get,querySelectorAll:s=>s==='[data-level]'?levels:s==='[data-lane]'?pads:[],body:{classList:{toggle:noop}},fonts:{ready:Promise.resolve()},createElement:()=>new Element(),addEventListener:noop},addEventListener:(name,fn)=>handlers[name]=fn,requestAnimationFrame:fn=>{queued=fn;return 1;},cancelAnimationFrame:()=>{queued=null;},fetch:async url=>({ok:true,json:async()=>url==='/api/levels/'?{levels:charts.map(c=>({...c,notes:undefined,attacks:undefined}))}:charts[Number(url.match(/\d+/)[0])-1]})};
 sandbox.window=sandbox;vm.createContext(sandbox);
 for(const file of ['engine.js','art.js','game.js'])vm.runInContext(fs.readFileSync(path.join(root,'static',file),'utf8'),sandbox,{filename:file});
 return{get,levels,pads,handlers,storage,async ready(){await new Promise(resolve=>setImmediate(resolve));},tick(t){currentAudio.currentTime=t+.2;queued?.();},key(key,type='keydown'){handlers[type]({key,code:key===' '?'Space':`Key${key.toUpperCase()}`,preventDefault:noop,repeat:false});}};
}
(async()=>{
 for(let index=0;index<3;index++){
  const game=harness();await game.ready();await game.levels[index].onclick();
  const c=charts[index],events=[];
  for(const n of c.notes.filter(n=>n.side==='player')){events.push({time:n.time,type:'hit',lane:n.lane});events.push({time:n.time+(n.hold||.03)+.015,type:'release',lane:n.lane});}
  for(const time of c.attacks)events.push({time:time-.3,type:'dodge'});
  events.sort((a,b)=>a.time-b.time);
  for(const event of events){game.tick(event.time);if(event.type==='hit')game.key('dfjk'[event.lane]);else if(event.type==='release')game.key('dfjk'[event.lane],'keyup');else game.key(' ');}
  game.tick(c.duration+.3);
  assert.match(game.get('#result-kicker').textContent,/CONFRONTO ENCERRADO/);
  assert.match(game.get('#result-stats').innerHTML,/100.0%/);
  assert.match(game.get('#result-stats').innerHTML,/ERROS<b>0/);
  assert.ok(game.storage.has('ruptura-best'));
 }
 const game=harness();await game.ready();await game.levels[2].onclick();
 game.get('#pause-button').onclick();assert.equal(game.get('#result-title').textContent,'RESPIRA.');
 await game.get('#resume').onclick();
 for(let t=0;t<25;t+=.1)game.tick(t);
 assert.equal(game.get('#result-title').textContent,'PERDEU O COMPASSO.');
 console.log('Três fases perfeitas com DFJK + sustentações + esquivas; pausa, retomada, derrota e recordes: OK');
})().catch(e=>{console.error(e);process.exitCode=1;});
