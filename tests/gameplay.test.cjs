/* Real game/controller code exercised with virtual audio time and canvas/DOM doubles.
   This is a deterministic integration test, not a browser or audio-quality test. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {execFileSync} = require('node:child_process');
const root = path.resolve(__dirname,'..');
const charts = JSON.parse(execFileSync('python',['-c','import json; from game.charts import make_chart; print(json.dumps([make_chart(i) for i in range(1,5)]))'],{cwd:root,encoding:'utf8'}));
function harness(mobile=false,unlocked=true,blocked=false,storageBroken=false){
 const circles=[],draws=[];
 const noop=()=>{}, drawing=new Proxy({arc:(x,y,r)=>circles.push({x,y,r}),drawImage:(...args)=>draws.push(args),createLinearGradient:()=>({addColorStop:noop})},{get:(o,k)=>o[k]||noop});
 class Element{constructor(){this.hidden=false;this.value='0';this.textContent='';this.innerHTML='';this.classList={add:noop,remove:noop,toggle:noop};this.dataset={};}getContext(){return drawing;}getBoundingClientRect(){return{left:0,top:0,width:mobile?390:1280,height:mobile?844:720};}showModal(){this.open=true;}close(){this.open=false;}addEventListener(){}setAttribute(){}setPointerCapture(){}}
 const elements=new Map(),get=s=>{if(!elements.has(s))elements.set(s,new Element());return elements.get(s);};
 const levels=[1,2,3,4].map(i=>{const e=new Element();e.dataset.level=String(i);return e;});
 const pads=[0,1,2,3].map(i=>{const e=new Element();e.dataset.lane=String(i);return e;});
 const handlers={},storage=new Map();if(unlocked)storage.set('ruptura-progress-v1',JSON.stringify({freeplay:true,secret:false}));let queued,transitionCallback;
 const node=()=>({connect:noop,disconnect:noop,start:noop,stop:noop,frequency:{setValueAtTime:noop,exponentialRampToValueAtTime:noop},gain:{value:0,cancelScheduledValues:noop,setTargetAtTime:noop,setValueAtTime:noop,exponentialRampToValueAtTime:noop}});
 let currentAudio,audioOrigin=.25;
 class Audio{constructor(){audioOrigin=.25;this.currentTime=0;this.sampleRate=8000;this.destination={};currentAudio=this;}createGain(){return node();}createOscillator(){return node();}createDynamicsCompressor(){return node();}createBiquadFilter(){return{...node(),frequency:{value:0},Q:{value:0}};}createBuffer(ch,len){return{getChannelData:()=>new Float32Array(len)};}async decodeAudioData(){return{duration:97.15};}createBufferSource(){return node();}resume(){return blocked?Promise.reject(Error('Audio blocked')):Promise.resolve();}suspend(){return Promise.resolve();}close(){return Promise.resolve();}}
 const sandbox={console,Math,Date,setInterval:()=>1,clearInterval:noop,setTimeout:fn=>{transitionCallback=fn;return 1;},clearTimeout:()=>{transitionCallback=null;},MenuAmbience:{start:noop,stop:noop,setEnabled:noop},Studio:{list:async()=>[]},AudioContext:Audio,innerWidth:mobile?390:1280,innerHeight:mobile?844:720,devicePixelRatio:1,matchMedia:q=>({matches:mobile&&q.includes('pointer')}),localStorage:{getItem:k=>{if(storageBroken)throw Error('Storage unavailable');return storage.get(k)||null;},setItem:(k,v)=>{if(storageBroken)throw Error('Storage unavailable');storage.set(k,v);}},document:{querySelector:get,querySelectorAll:s=>s==='[data-level]'?levels:s==='[data-lane]'?pads:[],body:{classList:{toggle:noop}},fonts:{ready:Promise.resolve()},createElement:()=>new Element(),addEventListener:noop},addEventListener:(name,fn)=>handlers[name]=fn,requestAnimationFrame:fn=>{queued=fn;return 1;},cancelAnimationFrame:()=>{queued=null;},fetch:async url=>({ok:true,arrayBuffer:async()=>new ArrayBuffer(8),json:async()=>url==='/api/levels/'?{levels:charts.map(c=>({...c,notes:undefined,attacks:undefined}))}:charts[Number(url.match(/\d+/)[0])-1]})};
 sandbox.window=sandbox;vm.createContext(sandbox);
 for(const file of ['engine.js','art.js','audio-engine.js','game.js'])vm.runInContext(fs.readFileSync(path.join(root,'static',file),'utf8'),sandbox,{filename:file});
 return{get,levels,pads,handlers,storage,circles,draws,async transition(){const fn=transitionCallback;transitionCallback=null;audioOrigin=currentAudio.currentTime+.25;await fn?.();},async ready(){await new Promise(resolve=>setImmediate(resolve));},tick(t){circles.length=0;draws.length=0;currentAudio.currentTime=t+audioOrigin;queued?.();},key(key,type='keydown'){handlers[type]({key,code:key===' '?'Space':`Key${key.toUpperCase()}`,preventDefault:noop,repeat:false});}};
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
 const mobile=harness(true);await mobile.ready();await mobile.levels[0].onclick();const first=charts[0].notes.find(n=>n.side==='player');const x=90+first.lane*180;const noteY=()=>Math.max(...mobile.draws.filter(p=>p.length===5&&Math.abs((p[1]+p[3]/2)-x)<1&&p[3]<160).map(p=>p[2]+p[4]/2).filter(y=>y<1360));mobile.tick(first.time-.3);const before=noteY();mobile.tick(first.time-.1);const after=noteY();assert.ok(after>before,'Mobile notes must descend toward the receptor');
 async function perfect(game,c){const events=[];for(const n of c.notes.filter(n=>n.side==='player')){events.push({time:n.time,lane:n.lane,up:false});events.push({time:n.time+(n.hold||.03)+.015,lane:n.lane,up:true});}for(const time of c.attacks)events.push({time:time-.3,dodge:true});events.sort((a,b)=>a.time-b.time);for(const e of events){game.tick(e.time);if(e.dodge)game.key(' ');else game.key('dfjk'[e.lane],e.up?'keyup':'keydown');}game.tick(c.duration+.3);}
 const locked=harness(false,false);await locked.ready();assert.equal(locked.get('#freeplay-tab').disabled,true);await locked.levels[0].onclick();assert.notEqual(locked.get('#song-label').textContent,'01 / PAVIO CURTO');locked.get('#story-difficulty').value='insane';await locked.get('#start-story').onclick();for(let i=0;i<3;i++){await perfect(locked,charts[i]);if(i<2)await locked.transition();}const unlock=JSON.parse(locked.storage.get('ruptura-progress-v1'));assert.equal(unlock.freeplay,true);assert.equal(unlock.secret,true);assert.equal(locked.get('#freeplay-tab').disabled,false);await locked.levels[3].onclick();assert.match(locked.get('#song-label').textContent,/MOM/);await perfect(locked,charts[3]);assert.equal(locked.get('#result-title').textContent,'RESPEITO CONQUISTADO.');
 const normal=harness(false,false);await normal.ready();normal.get('#story-difficulty').value='hard';await normal.get('#start-story').onclick();for(let i=0;i<3;i++){await perfect(normal,charts[i]);if(i<2)await normal.transition();}assert.equal(JSON.parse(normal.storage.get('ruptura-progress-v1')).secret,false);normal.get('#note-size').oninput({target:{value:'1.4'}});normal.get('#scroll-speed').oninput({target:{value:'1.8'}});assert.equal(JSON.parse(normal.storage.get('ruptura-note-size')),1.4);assert.equal(JSON.parse(normal.storage.get('ruptura-scroll')),1.8);
 const broken=harness(false,false,false,true);await broken.ready();assert.equal(broken.get('#freeplay-tab').disabled,true);const blockedAudio=harness(false,false,true);await blockedAudio.ready();await blockedAudio.get('#start-story').onclick();assert.equal(blockedAudio.get('#result-title').textContent,'Não foi possível iniciar');
 const shortHold=harness();await shortHold.ready();await shortHold.levels[0].onclick();const heldNote=charts[0].notes.find(n=>n.side==='player'&&n.hold);shortHold.tick(heldNote.time);shortHold.key('dfjk'[heldNote.lane]);shortHold.key('dfjk'[heldNote.lane],'keyup');shortHold.tick(heldNote.time+.02);assert.ok(shortHold.draws.some(args=>args.length===9&&args[1]>=3920),'Early hold release triggers damage');
 const original=charts[0];charts[0]={...original,notes:[2,2.5].flatMap(time=>[0,1,2,3].map(lane=>({time,side:'player',lane,hold:0}))),music:[]};const swipe=harness(true);await swipe.ready();await swipe.levels[0].onclick();swipe.tick(2);const gesture={pointerId:44,clientX:2,preventDefault(){}};swipe.get('#game').onpointerdown(gesture);swipe.get('#game').onpointermove({...gesture,clientX:389});swipe.get('#game').onpointerup(gesture);swipe.tick(2.5);swipe.get('#game').onpointerdown({...gesture,clientX:389});swipe.get('#game').onpointermove({...gesture,clientX:2});swipe.get('#game').onpointerup(gesture);swipe.tick(original.duration+.3);assert.match(swipe.get('#result-stats').innerHTML,/2[.,]800/);assert.match(swipe.get('#result-stats').innerHTML,/ERROS<b>0/);charts[0]=original;
 console.log('Desktop/mobile: fases perfeitas, downscroll, toque por faixa, sustentações, esquiva, sprite de dano, pausa e recordes: OK');
})().catch(e=>{console.error(e);process.exitCode=1;});
