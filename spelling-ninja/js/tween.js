/* Tween / pose scheduler (frozen while paused).
   (plain script: shares the global scope with the other files in js/, load order matters - see index.html) */
'use strict';

/* =====================================================================
   TWEENS (frozen while paused)
   ===================================================================== */
const E={ lin:k=>k, inOut:k=>k<.5?2*k*k:1-2*(1-k)*(1-k), out:k=>1-(1-k)*(1-k), in:k=>k*k,
  back:k=>{const c=1.70158,x=k-1;return x*x*((c+1)*x+c)+1;},
  bounce:k=>{const n=7.5625,d=2.75;if(k<1/d)return n*k*k;if(k<2/d)return n*(k-=1.5/d)*k+.75;if(k<2.5/d)return n*(k-=2.25/d)*k+.9375;return n*(k-=2.625/d)*k+.984375;} };
const tweens=[]; let paused=false;
const tween=(ms,fn,ease=E.inOut)=>new Promise(res=>tweens.push({t:0,ms,fn,ease,res}));
const wait=ms=>tween(ms,()=>{});
function stepTweens(dt){
  if(paused) return;
  for(let i=tweens.length-1;i>=0;i--){ const T=tweens[i]; T.t+=dt; const k=Math.min(1,T.t/T.ms); T.fn(T.ease(k),k);
    if(k>=1){ tweens.splice(i,1); T.res(); } }
}
