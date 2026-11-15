/* Pure timing rules shared by the renderer and regression checks. */
(function(root){'use strict';
 const RULES={window:.16,sick:.045,good:.09,bad:.13,dodgeWindow:.65,warning:.8};
 function judge(delta){const d=Math.abs(delta);return d<=RULES.sick?'SICK!!':d<=RULES.good?'GOOD!':d<=RULES.bad?'BAD':'SHIT';}
 function candidate(notes,lane,t){return notes.find(n=>n.side==='player'&&n.lane===lane&&!n.hit&&!n.missed&&Math.abs(n.time-t)<=RULES.window);}
 function dodgeable(attack,t){return !attack.done&&t>=attack.time-RULES.dodgeWindow&&t<=attack.time+.1;}
 const api={RULES,judge,candidate,dodgeable};root.Rhythm=api;if(typeof module!=='undefined')module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
