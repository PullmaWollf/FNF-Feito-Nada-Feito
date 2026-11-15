const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');
let last,failNetwork=false,failDecode=false;
class Context{
 constructor(){last=this;this.currentTime=0;this.state='suspended';this.destination={};this.starts=[];this.disconnected=0;}
 createGain(){return{gain:{value:0,setTargetAtTime(v){this.value=v;}},connect(){},disconnect:()=>this.disconnected++};}
 createDynamicsCompressor(){return{connect(){}};}
 createBufferSource(){return{connect(){},start:(...args)=>this.starts.push(args),stop(){},disconnect:()=>this.disconnected++};}
 async decodeAudioData(){if(failDecode)throw Error('decode failed');return{duration:10};}
 async suspend(){this.state='suspended';}async resume(){this.state='running';}async close(){this.state='closed';}
}
const scope={AudioContext:Context,fetch:async()=>({ok:!failNetwork,arrayBuffer:async()=>new ArrayBuffer(4)})};
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../static/audio-engine.js'),'utf8'),scope);
(async()=>{
 const engine=new scope.GameAudio.AudioEngine({master:'invalid',vocals:.4});
 assert.equal(engine.master.gain.value,.65);assert.equal(engine.buses.vocals.gain.value,.4);
 await engine.loadStems({drums:'/drums.ogg',vocals:'/vocals.ogg'});
 engine.startStems(2,.5);assert.equal(last.starts.length,2);
 assert.equal(last.starts[0][0],2);assert.equal(last.starts[1][0],2);
 await engine.resume();last.currentTime=3;await engine.pause();assert.equal(last.currentTime,3);assert.equal(last.state,'suspended');
 await engine.resume();assert.equal(last.currentTime,3);
 engine.setVolumes({master:.8,sfx:0});assert.equal(engine.master.gain.value,.8);assert.equal(engine.buses.sfx.gain.value,0);
 failNetwork=true;await assert.rejects(()=>engine.loadStems({music:'/missing.ogg'}));failNetwork=false;
 failDecode=true;await assert.rejects(()=>engine.loadStems({music:'/bad.ogg'}));
 await engine.close();assert.equal(last.state,'closed');assert.equal(engine.sources.length,0);assert.equal(engine.buffers.size,0);await engine.close();assert.equal(last.state,'closed');
 console.log('AudioEngine: stems alinhados, volumes, pause/resume, falhas e cleanup OK');
})().catch(e=>{console.error(e);process.exitCode=1;});
