/* PS4 pad + keyboard + mouse input.
   (plain script: shares the global scope with the other files in js/, load order matters - see index.html) */
'use strict';

/* =====================================================================
   INPUT  (PS4 pad: 0=✕ 1=○ 2=□ 3=△ 4=L1 5=R1 9=Options)
   ===================================================================== */
const PADMAP={0:'A',1:'B',2:'X',3:'Y',4:'L1',5:'R1',9:'start',12:'up',13:'down',14:'left',15:'right'};
const prevBtn=[]; let prevDir=null, padOn=false;
function pollPad(){
  const pads=navigator.getGamepads?navigator.getGamepads():[]; let gp=null;
  for(const p of pads){ if(p&&p.connected){ gp=p; break; } }
  if(!gp){ if(padOn){ padOn=false; updateHints(); } return; }
  if(!padOn){ padOn=true; updateHints(); }
  gp.buttons.forEach((b,i)=>{ const d=b.pressed; if(d&&!prevBtn[i]){ if(PADMAP[i]) onInput(PADMAP[i]); else if(G.state==='title') onInput('A'); } prevBtn[i]=d; });
  const ax=gp.axes[0]||0, ay=gp.axes[1]||0; const dir=ax>.6?'right':ax<-.6?'left':ay>.6?'down':ay<-.6?'up':null;
  if(dir&&dir!==prevDir) onInput(dir); prevDir=dir;
}
/* on-screen help changes depending on whether a controller is plugged in */
/* a phone or tablet (no mouse): the help talks about tapping */
const TOUCH=(()=>{ try{ return matchMedia('(pointer: coarse)').matches&&!matchMedia('(pointer: fine)').matches; }catch(e){ return false; } })();
if(TOUCH) document.documentElement.classList.add('touch');
const IOS=/iPhone|iPad|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
function updateHints(){
  const iosTip=IOS&&!navigator.standalone?' · Tip: Share ⬆️ then "Add to Home Screen" to play full screen':'';
  $('pad').textContent=padOn?'🎮 Controller ready!':TOUCH?'👆 Tap to play!'+iosTip:'🖱️ No controller? Use your mouse (or keys 1-4)!';
  $('hintbar').innerHTML=!padOn&&TOUCH?'👆 Tap the sign with the right letter! &nbsp;·&nbsp; 🔊 hear the word':padOn
    ?'Press the button on the sign: <span class="b-x">✕</span> <span class="b-o">○</span> <span class="b-s">□</span> <span class="b-t">△</span> &nbsp;·&nbsp; R1 = hear the word &nbsp;·&nbsp; L1 = power-up &nbsp;·&nbsp; Options = pause'
    :'🖱️ Click the sign with the right letter! &nbsp;·&nbsp; 🔊 hear the word &nbsp;·&nbsp; keys 1-4 work too, 5 / 6 use a power-up';
}
const KEYMAP={'1':'A','2':'B','3':'X','4':'Y','5':'P1','6':'P2',ArrowLeft:'left',ArrowRight:'right',ArrowUp:'up',ArrowDown:'down',Enter:'ok',' ':'ok',
              Escape:'back',Backspace:'back',q:'L1',e:'R1',r:'R1',p:'start'};
window.addEventListener('keydown',e=>{
  const tg=e.target;                                    // typing in the word list: let the keys type
  if(tg&&(tg.tagName==='INPUT'||tg.tagName==='TEXTAREA')){ if(e.key==='Escape') tg.blur(); return; }
  unlockAudio();
  if(e.key==='m'||e.key==='M'){ toggleMusic(); return; }
  if(e.key==='g'||e.key==='G'){ cycleGfx(); return; }
  if(e.key==='t'||e.key==='T'){ toggleTimer(); return; }
  if(G.state==='title'){ e.preventDefault(); onInput('A'); return; }
  if(e.repeat&&(e.key==='p'||e.key==='P'||e.key==='Escape')) return;      // holding P / Esc must not flip pause on and off
  const a=KEYMAP[e.key]||KEYMAP[e.key.length===1?e.key.toLowerCase():'']; if(a){ e.preventDefault(); onInput(a); }   // (Caps Lock: R, P, E, Q work too)
});
window.addEventListener('pointerdown',()=>{ unlockAudio(); if(G.state==='title') onInput('A'); });

/* ---------------- mouse: click the 3D things (tested on screen, no mesh picking needed) ---------------- */
function dummyAt(x,y){
  let hit=-1;
  G.dummies.forEach((d,i)=>{ if(!d.alive||!d.root||d.root.isDisposed()) return; const p=d.root.position;
    const c=toScreen(V3(p.x,2,p.z)), e=toScreen(V3(p.x+1.2,2,p.z)), top=toScreen(V3(p.x,4,p.z)).y, bot=toScreen(V3(p.x,0,p.z)).y, r=Math.abs(e.x-c.x);
    if(Math.abs(x-c.x)<=r&&y>=top&&y<=bot) hit=i; });
  return hit;
}
function heroAt(x,y){
  let hit=-1;
  G.rigs.forEach((r,i)=>{ if(!r.root.isEnabled()) return; const p=r.root.position;
    const c=toScreen(V3(p.x,1.6,p.z)), e=toScreen(V3(p.x+1.7,1.6,p.z)), top=toScreen(V3(p.x,4,p.z)).y, bot=toScreen(V3(p.x,0,p.z)).y;
    if(Math.abs(x-c.x)<=Math.abs(e.x-c.x)&&y>=top&&y<=bot) hit=i; });
  return hit;
}
canvas.addEventListener('pointerdown',e=>{
  const q=toLocal(e.clientX,e.clientY);                // (the page may be turned sideways, see ROT in engine.js)
  if(G.state==='play'){ const i=dummyAt(q.x,q.y); if(i>=0) onInput(['A','B','X','Y'][i]); }
  else if(G.state==='chest') onInput('A');
  else if(G.state==='select'){ const i=heroAt(q.x,q.y);
    if(i>=0){ if(i===G.heroIdx) onInput('A'); else { G.heroIdx=i; SFX.swap(); layoutSelect(); } } }
});
canvas.addEventListener('pointermove',e=>{
  let h=-1;
  const q=toLocal(e.clientX,e.clientY);
  if(G.state==='play'&&!G.lock) h=dummyAt(q.x,q.y);
  else if(G.state==='select') h=heroAt(q.x,q.y);
  G.hover=G.state==='play'?h:-1; canvas.style.cursor=(h>=0||G.state==='chest')?'pointer':'';
});
