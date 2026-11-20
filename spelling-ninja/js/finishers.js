/* Finisher attacks: projectile helper, the throw poses and the FIN table (hero signature moves + shared super attacks).
   Used by finisher() in game.js and by test.html (the asset test page).
   (plain script: shares the global scope with the other files in js/, load order matters - see index.html) */
'use strict';

function throwProj(node,from,to,ms,opt={}){
  const {arc=0,spin=0,scaleTo=1,jy=0,delay=0}=opt;
  return (async()=>{ if(delay) await wait(delay); node.setEnabled(true); await tween(ms,k=>{
      node.position.x=from.x+(to.x-from.x)*k; node.position.y=from.y+(to.y-from.y)*k+Math.sin(k*PI)*arc+jy*k; node.position.z=from.z+(to.z-from.z)*k;
      node.rotation.z=k*spin; if(scaleTo!==1) node.scaling.setAll(1+(scaleTo-1)*k); },E.lin);
    burst(to.add(V3(0,jy,-1)),{count:10,power:4,size:.35}); node.dispose(); })();
}
function makeStar(){ const n=nd(null,0,0,0); n.setEnabled(false); const dk=M('#2a2d5f');
  bx(.8,.14,.05,dk,n); bx(.14,.8,.05,dk,n); [1,-1].forEach(s=>{ const b=bx(.7,.12,.05,dk,n); b.rotation.z=s*PI/4; }); sp(.24,GM('#ff3b4e'),n,0,0,-.04); return n; }

/* ---------------- finishers: hero signature moves + shared super attacks ---------------- */
const POSE_THROW=[[{armR:[-2.5,0,.3],upper:[-.25,-.4,0]},220],[{armR:[-1.2,0,0],armL:[-.6,0,0],upper:[.25,.35,0]},90]];
const POSE_SKY  =[[{armR:[-3,0,.3],armL:[-3,0,-.3],upper:[-.2,0,0],pos:[0,.2,0]},300],[{armR:[-2.6,0,.5],armL:[-2.6,0,-.5],upper:[.1,0,0],pos:[0,0,0]},120]];
const POSE_PUSH =[[{armR:[-1.6,0,0],armL:[-1.6,0,0],upper:[-.1,0,0]},250],[{armR:[-1.6,0,.3],armL:[-1.6,0,-.3],upper:[.25,0,0],pos:[0,0,.3]},100]];
const FIN={
  shuriken:{name:'NINJA STARS!',pose:POSE_THROW, fire:(f,t,mega)=>{ const n=mega?9:3, j=[]; for(let i=0;i<n;i++) j.push(throwProj(makeStar(),f,t,650,{arc:1.2,spin:PI*8,delay:i*90,jy:(i%3-1)*.7})); return j; }},
  beam:{name:'SWORD BEAM!',pose:[[{armR:[-2.9,0,.1],upper:[-.35,0,0]},300],[{armR:[-.6,0,0],upper:[.5,0,0]},100]], fire:(f,t,mega)=>{ const n=mega?3:1, j=[];
    for(let i=0;i<n;i++){ const b=nd(null,0,0,0); b.setEnabled(false); sp(1,GM('#bfe6ff'),b,0,0,0,1.8,.2,.5); sp(1,GM('#ffffff',.7),b,0,0,0,2.4,.38,.7);
      b.scaling.setAll(mega?1.8:1.1); j.push(throwProj(b,f,t,620,{delay:i*160,scaleTo:mega?2.6:1.5,jy:(i-(n-1)/2)*.9})); } return j; }},
  sparkle:{name:'SPARKLE RINGS!',pose:POSE_PUSH, fire:(f,t,mega)=>{ const n=mega?4:2, j=[];
    for(let i=0;i<n;i++){ const r=nd(null,0,0,0); tor(1,.14,GM(i%2?'#ffd23f':'#ff7ac8'),r); r.rotation.z=PI/2;
      const holder=nd(null,0,0,0); holder.setEnabled(false); r.parent=holder; j.push(throwProj(holder,f,t,720,{delay:i*140,scaleTo:mega?4:2.6})); } return j; }},
  meteor:{name:'METEOR SHOWER!',pose:POSE_SKY, fire:(f,t,mega)=>{ const n=nFx(mega?8:4), j=[];
    for(let i=0;i<n;i++) j.push(meteorDrop(t.add(V3((Math.random()-.5)*2.6,(Math.random()-.5)*1.4,-.8)),i*130)); return j; }},
  lightning:{name:'THUNDER STRIKE!',pose:POSE_SKY, fire:(f,t,mega)=>{ const n=mega?5:3, j=[];
    for(let i=0;i<n;i++) j.push((async()=>{ await wait(i*170); const to=t.add(V3((Math.random()-.5)*2,(Math.random()-.5)*1.5,-.8));
      bolt(to.add(V3((Math.random()-.5)*3,12,0)),to); SFX.zap(); if(i===0) flash('#fff9c4',.3);
      burst(to,{count:16,power:6,size:.5,c1:[1,1,.6],c2:[1,.85,.2]}); fxPlane(TEX.ring,to.add(V3(0,0,-.4)),{color:'#fff27a',size:3.5,ms:300}); await wait(150); })()); return j; }},
  rainbow:{name:'RAINBOW BLAST!',pose:POSE_PUSH, fire:(f,t,mega)=>[rainbowBeam(f,t,mega)]},
  fireworks:{name:'FIREWORKS!',pose:POSE_SKY, fire:(f,t,mega)=>{ const n=nFx(mega?7:4), j=[];
    for(let i=0;i<n;i++) j.push(rocket(f,t.add(V3((Math.random()-.5)*3,(Math.random()-.3)*2.5,-1)),i*140)); return j; }},
  fist:{name:'MEGA PUNCH!',pose:POSE_PUSH, fire:(f,t,mega)=>{ const g=nd(null,0,0,0); g.setEnabled(false); const red=M('#ff3b4e',.4);
    sp(1,red,g,0,0,0,1.1,1,1); sp(.45,red,g,-.1,.36,.25); const cf=cy(.72,.72,.4,M('#ffffff',.6),g,-.6,0,0); cf.rotation.z=PI/2; outlineNode(g,.03);
    SFX.whoosh(); return [throwProj(g,f,t,500,{scaleTo:mega?3.6:2.4,arc:.5})]; }},
  snack:{name:'SNACK ATTACK!',pose:POSE_THROW, fire:(f,t,mega)=>{ const n=nFx(mega?10:6), j=[], foods=['🍕','🍩','🍌','🧁','🍉','🌮','🍪','🍭'];
    for(let i=0;i<n;i++){ const h=nd(null,0,0,0); h.setEnabled(false); emojiPlane(rnd(foods),1.2,h);
      j.push(throwProj(h,f,t.add(V3(0,(Math.random()-.5)*1.6,0)),600,{arc:2+Math.random()*1.5,spin:PI*4*(Math.random()<.5?-1:1),delay:i*90})); } return j; }},
  tornado:{name:'TORNADO!',pose:[[{armR:[0,0,1.5],armL:[0,0,-1.5]},200],[{armR:[0,0,1.5],armL:[0,0,-1.5],body:[0,PI*2,0]},380]], fire:(f,t,mega)=>[tornadoFx(f,t,mega)]},
};
const SHARED_FIN=['meteor','lightning','rainbow','fireworks','fist','snack','tornado'];
