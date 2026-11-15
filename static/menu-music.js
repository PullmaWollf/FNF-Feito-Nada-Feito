window.MenuAmbience=(()=>{
 let context,source,gain,enabled=true,wanted=true;
 async function start(){wanted=true;if(!enabled||document.hidden)return;if(context?.state==='running')return;try{if(!context){context=new(window.AudioContext||window.webkitAudioContext)();gain=context.createGain();gain.gain.value=.12;gain.connect(context.destination);const rate=22050,seconds=16,buffer=context.createBuffer(1,rate*seconds,rate),data=buffer.getChannelData(0),roots=[130.81,103.83,155.56,116.54];for(let i=0;i<data.length;i++){const t=i/rate,bar=Math.floor(t/4),root=roots[bar],phase=t%4,beat=t%.5;const pad=Math.min(1,phase*4)*Math.min(1,(4-phase)*4);data[i]=pad*(Math.sin(2*Math.PI*root*t)*.18+Math.sin(2*Math.PI*root*1.4983*t)*.09)+Math.sin(2*Math.PI*(55+50*Math.exp(-beat*35))*beat)*Math.exp(-beat*25)*.18+Math.sin(2*Math.PI*root*2*t)*Math.exp(-(t%.25)*22)*.06;}source=context.createBufferSource();source.buffer=buffer;source.loop=true;source.connect(gain);source.start();}await context.resume();}catch{/* A new user gesture may retry autoplay. */}}
 function stop(){wanted=false;if(context?.state==='running')context.suspend();}
 function setEnabled(value){enabled=value;if(!enabled)context?.suspend();else if(wanted)start();}
 document.addEventListener('pointerdown',()=>{if(!document.querySelector('#menu').hidden)start();},{passive:true});
 document.addEventListener('keydown',()=>{if(!document.querySelector('#menu').hidden)start();});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)context?.suspend();else if(wanted)start();});
 return{start,stop,setEnabled};
})();
