/* Real game/controller code exercised with virtual audio time and canvas/DOM doubles.
   This is a deterministic integration test, not a browser or audio-quality test. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {execFileSync} = require('node:child_process');
const root = path.resolve(__dirname,'..');
const charts = JSON.parse(execFileSync('python',['-c','import json; from game.charts import make_chart; print(json.dumps([make_chart(i) for i in range(1,4)]))'],{cwd:root,encoding:'utf8'}));
function harness(mobile=false){
 const circles=[],draws=[];
 const noop=()=>{}, drawing=new Proxy({arc:(x,y,r)=>circles.push({x,y,r}),drawImage:(...args)=>draws.push(args),createLinearGradient:()=>({addColorStop:noop})},{get:(o,k)=>o[k]||noop});
 class Element{constructor(){this.hidden=false;this.value='0';this.textContent='';this.innerHTML='';this.classList={add:noop,remove:noop,toggle:noop};this.dataset={};}getContext(){return drawing;}getBoundingClientRect(){return{left:0,top:0,width:mobile?390:1280,height:mobile?844:720};}showModal(){this.open=true;}close(){this.open=false;}addEventListener(){}setAttribute(){}setPointerCapture(){}}
 const elements=new Map(),get=s=>{if(!elements.has(s))elements.set(s,new Element());return elements.get(s);};
 const levels=[1,2,3].map(i=>{const e=new Element();e.dataset.level=String(i);return e;});
 const pads=[0,1,2,3].map(i=>{const e=new Element();e.dataset.lane=String(i);return e;});
 const handlers={},storage=new Map();let queued;
 const node=()=>({connect:noop,disconnect:noop,start:noop,stop:noop,frequency:{setValueAtTime:noop,exponentialRampToValueAtTime:noop},gain:{value:0,cancelScheduledValues:noop,setTargetAtTime:noop,setValueAtTime:noop,exponentialRampToValueAtTime:noop}});
 let currentAudio;
 class Audio{constructor(){this.currentTime=0;this.sampleRate=8000;this.destination={};currentAudio=this;}createGain(){return node();}createOscillator(){return node();}createDynamicsCompressor(){return node();}createBiquadFilter(){return{...node(),frequency:{value:0},Q:{value:0}};}createBuffer(ch,len){return{getChannelData:()=>new Float32Array(len)};}createBufferSource(){return node();}resume(){return Promise.resolve();}suspend(){return Promise.resolve();}close(){return Promise.resolve();}}
 const sandbox={console,Math,Date,setInterval:()=>1,clearInterval:noop,AudioContext:Audio,innerWidth:mobile?390:1280,innerHeight:mobile?844:720,devicePixelRatio:1,matchMedia:q=>({matches:mobile&&q.includes('pointer')}),localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},document:{querySelector:get,querySelectorAll:s=>s==='[data-level]'?levels:s==='[data-lane]'?pads:[],body:{classList:{toggle:noop}},fonts:{ready:Promise.resolve()},createElement:()=>new Element(),addEventListener:noop},addEventListener:(name,fn)=>handlers[name]=fn,requestAnimationFrame:fn=>{queued=fn;return 1;},cancelAnimationFrame:()=>{queued=null;},fetch:async url=>({ok:true,json:async()=>url==='/api/levels/'?{levels:charts.map(c=>({...c,notes:undefined,attacks:undefined}))}:charts[Number(url.match(/\d+/)[0])-1]})};
 sandbox.window=sandbox;vm.createContext(sandbox);
 for(const file of ['engine.js','art.js','game.js'])vm.runInContext(fs.readFileSync(path.join(root,'static',file),'utf8'),sandbox,{filename:file});
 return{get,levels,pads,handlers,storage,circles,draws,async ready(){await new Promise(resolve=>setImmediate(resolve));},tick(t){circles.length=0;draws.length=0;currentAudio.currentTime=t+.2;queued?.();},key(key,type='keydown'){handlers[type]({key,code:key===' '?'Space':`Key${key.toUpperCase()}`,preventDefault:noop,repeat:false});}};
}
(async()=>{
 for(let index=0;index<4;index++){
  const mobile=index===3;const game=harness(mobile);const chartIndex=mobile?2:index;await game.ready();await game.levels[chartIndex].onclick();
  const c=charts[chartIndex],events=[];
  for(const n of c.notes.filter(n=>n.side==='player')){events.push({time:n.time,type:'hit',lane:n.lane});events.push({time:n.time+(n.hold||.03)+.015,type:'release',lane:n.lane});}
  for(const time of c.attacks)events.push({time:time-.3,type:'dodge'});
  events.sort((a,b)=>a.time-b.time);
  for(const event of events){game.tick(event.time);if(event.type==='hit'){if(mobile)game.get('#game').onpointerdown({clientX:(event.lane+.5)*390/4,clientY:event.lane%2?720:80,pointerId:event.lane,preventDefault(){}});else game.key('dfjk'[event.lane]);}else if(event.type==='release'){if(mobile)game.get('#game').onpointerup({pointerId:event.lane});else game.key('dfjk'[event.lane],'keyup');}else game.key(' ');}
  game.tick(c.duration+.3);
  assert.match(game.get('#result-kicker').textContent,/CONFRONTO ENCERRADO/);
  assert.match(game.get('#result-stats').innerHTML,/100.0%/);
  assert.match(game.get('#result-stats').innerHTML,/ERROS<b>0/);
  assert.ok(game.storage.has('ruptura-best-v2'));
 }
 const game=harness();await game.ready();await game.levels[2].onclick();
 game.get('#pause-button').onclick();assert.equal(game.get('#result-title').textContent,'RESPIRA.');
 await game.get('#resume').onclick();
 for(let t=0;t<25;t+=.1)game.tick(t);
 assert.equal(game.get('#result-title').textContent,'PERDEU O COMPASSO.');
 const damage=harness();await damage.ready();await damage.levels[0].onclick();const missed=charts[0].notes.find(n=>n.side==='player');damage.tick(missed.time+.2);assert.ok(damage.draws.some(args=>args.length===9&&args[1]>=3920),'A missed note must select the damage sprite');
 const mobile=harness(true);await mobile.ready();await mobile.levels[0].onclick();const first=charts[0].notes.find(n=>n.side==='player');const x=90+first.lane*180;const noteY=()=>Math.max(...mobile.circles.filter(p=>Math.abs(p.x-x)<1&&Math.abs(p.r-38.4)<1).map(p=>p.y).filter(y=>y<1360));mobile.tick(first.time-.3);const before=noteY();mobile.tick(first.time-.1);const after=noteY();assert.ok(after>before,'Mobile notes must descend toward the receptor');
 console.log('Desktop/mobile: fases perfeitas, downscroll, toque por faixa, sustentações, esquiva, sprite de dano, pausa e recordes: OK');
})().catch(e=>{console.error(e);process.exitCode=1;});
