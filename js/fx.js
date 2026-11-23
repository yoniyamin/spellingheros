/* Extra attack effects: slashes, comic impact stars, lightning, emoji bursts, confetti, power effects,
   the combo aura and the finisher projectiles. Everything here is cheap: a few planes / thin tubes /
   small particle systems that are thrown away after a moment, and "Low" graphics halves the particles.
   (plain script: shares the global scope with the other files in js/, load order matters - see index.html) */
'use strict';

const LOWFX=()=>QUAL==='low';
const nFx=n=>LOWFX()?Math.max(1,Math.ceil(n*.5)):n;

/* ---------------- textures ---------------- */
function mkTex128(draw){ const t=new BABYLON.DynamicTexture('tx',128,scene,true); const c=t.getContext(); c.clearRect(0,0,128,128); draw(c); t.hasAlpha=true; t.update(); return t; }
TEX.slash=mkTex128(c=>{ const g=c.createLinearGradient(0,0,128,0); g.addColorStop(0,'rgba(255,255,255,0)'); g.addColorStop(.55,'rgba(255,255,255,1)'); g.addColorStop(1,'rgba(255,255,255,.15)');
  c.fillStyle=g; c.beginPath(); c.arc(64,64,60,0,7); c.fill(); c.globalCompositeOperation='destination-out'; c.beginPath(); c.arc(64,86,58,0,7); c.fill(); c.globalCompositeOperation='source-over'; });
TEX.pow=mkTex128(c=>{ const pts=16; c.beginPath(); for(let i=0;i<pts*2;i++){ const r=i%2?34:62-(i%4)*6, a=i/(pts*2)*PI*2; c.lineTo(64+r*Math.cos(a),64+r*Math.sin(a)); } c.closePath();
  c.fillStyle='#ffe066'; c.fill(); c.lineWidth=6; c.strokeStyle='#ff4d6d'; c.stroke();
  c.beginPath(); for(let i=0;i<pts*2;i++){ const r=i%2?18:36, a=i/(pts*2)*PI*2+.2; c.lineTo(64+r*Math.cos(a),64+r*Math.sin(a)); } c.closePath(); c.fillStyle='#ffffff'; c.fill(); });
TEX.rays=mkTex128(c=>{ c.strokeStyle='#fff'; c.lineCap='round'; for(let i=0;i<14;i++){ const a=i/14*PI*2+(i%2)*.1, r0=26+(i%3)*6, r1=58-(i%2)*8; c.lineWidth=5-(i%2)*2;
  c.beginPath(); c.moveTo(64+r0*Math.cos(a),64+r0*Math.sin(a)); c.lineTo(64+r1*Math.cos(a),64+r1*Math.sin(a)); c.stroke(); } });
TEX.conf=mkTex(c=>{ c.fillStyle='#fff'; c.fillRect(20,12,24,40); });

const emojiTexCache={}, emojiMatCache={};
function emojiTex(ch){
  if(emojiTexCache[ch]) return emojiTexCache[ch];
  const t=new BABYLON.DynamicTexture('emo',128,scene,true), c=t.getContext(); c.clearRect(0,0,128,128);
  c.font='96px "Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif'; c.textAlign='center'; c.textBaseline='middle'; c.fillText(ch,64,70);
  t.hasAlpha=true; t.update(); return emojiTexCache[ch]=t;
}
function emojiMat(ch){
  if(emojiMatCache[ch]) return emojiMatCache[ch];
  const m=new BABYLON.StandardMaterial('emoM',scene); m.diffuseTexture=emojiTex(ch); m.useAlphaFromDiffuseTexture=true;
  m.disableLighting=true; m.emissiveColor=BABYLON.Color3.White(); m.backFaceCulling=false; return emojiMatCache[ch]=m;
}
function emojiPlane(ch,size,par){ const p=BABYLON.MeshBuilder.CreatePlane('emo',{size},scene); p.material=emojiMat(ch); p.isPickable=false; if(par) p.parent=par; return p; }

/* ---------------- small building blocks ---------------- */
/* a flat picture facing the camera that grows and fades (pooled planes/materials like shock() in engine.js;
   a throwaway plane is used when every pooled one is already on screen) */
const fxPool=[];
function fxPlane(tex,pos,{color='#ffffff',size=3,ms=380,rot=0,spin=0,from=.3,flat=false}={}){
  for(let i=fxPool.length-1;i>=0;i--) if(fxPool[i].p.isDisposed()) fxPool.splice(i,1);   // resetToSelect() sweeps planes made during a run
  let item=fxPool.find(i=>!i.busy);
  if(!item&&fxPool.length<8){
    const p=BABYLON.MeshBuilder.CreatePlane('fx',{size:1},scene), m=new BABYLON.StandardMaterial('fxm',scene);
    m.useAlphaFromDiffuseTexture=true; m.disableLighting=true; m.backFaceCulling=false;
    p.material=m; p.isPickable=false; p.isVisible=false; item={p,m,busy:false}; fxPool.push(item);
  }
  if(!item){ const p=BABYLON.MeshBuilder.CreatePlane('fx',{size:1},scene), m=new BABYLON.StandardMaterial('fxm',scene);
    m.diffuseTexture=tex; m.useAlphaFromDiffuseTexture=true; m.emissiveColor=BABYLON.Color3.FromHexString(color); m.disableLighting=true; m.backFaceCulling=false;
    p.material=m; p.position.copyFrom(pos); p.isPickable=false; if(flat) p.rotation.x=PI/2; else p.rotation.z=rot;
    return tween(ms,k=>{ const s=from+k*size; p.scaling.set(s,s,s); m.alpha=1-k*k; if(spin) p.rotation.z=rot+spin*k; },E.out).then(()=>{ m.dispose(); p.dispose(); }); }
  item.busy=true; const {p,m}=item;
  p.isVisible=true; p.position.copyFrom(pos); p.rotation.set(flat?PI/2:0,0,flat?0:rot);
  m.diffuseTexture=tex; m.emissiveColor=BABYLON.Color3.FromHexString(color); m.alpha=1;
  return tween(ms,k=>{ const s=from+k*size; p.scaling.set(s,s,s); m.alpha=1-k*k; if(spin) p.rotation.z=rot+spin*k; },E.out).then(()=>{ p.isVisible=false; item.busy=false; });
}
const slashFx=(pos,color='#ffffff')=>{ SFX.slash(); return fxPlane(TEX.slash,pos.add(V3(0,0,-.7)),{color,size:3.4,ms:260,rot:Math.random()*PI*2,from:1.2}); };
const powFx  =pos=>fxPlane(TEX.pow,pos.add(V3(0,0,-.8)),{size:2.2,ms:320,rot:(Math.random()-.5)*.6,from:.4});
const raysFx =(pos,color='#ffffff')=>fxPlane(TEX.rays,pos.add(V3(0,0,-.6)),{color,size:4,ms:300,rot:Math.random()*PI,from:.6});
const ringFx =(pos,color='#ffffff')=>fxPlane(TEX.ring,V3(pos.x,.07,pos.z),{color,size:5,ms:450,flat:true});

function emojiBurst(pos,chars,{count=8,power=6,size=.75,life=1,grav=-6}={}){
  chars.forEach(ch=>burst(pos,{tex:emojiTex(ch),count,power,size,life,grav,c1:[1,1,1],c2:[1,1,1],std:true}));
}
function confetti(pos,count=18){
  burst(pos,{tex:'conf',count,power:7,size:.35,life:1.3,grav:-5,c1:[1,.35,.6],c2:[1,.85,.25],sphere:true,std:true});
  burst(pos,{tex:'conf',count,power:7,size:.35,life:1.3,grav:-5,c1:[.3,.75,1],c2:[.4,1,.6],sphere:true,std:true});
}
/* zig-zag lightning bolt made of two thin tubes, flickers then disappears */
function bolt(from,to,{color='#fff27a',ms=300,width=.07}={}){
  const path=[], n=9; for(let i=0;i<=n;i++){ const p=BABYLON.Vector3.Lerp(from,to,i/n); if(i>0&&i<n){ p.x+=(Math.random()-.5)*1.2; p.z+=(Math.random()-.5)*.4; } path.push(p); }
  const core=BABYLON.MeshBuilder.CreateTube('bolt',{path,radius:width,tessellation:4},scene); core.material=GM('#ffffff'); core.isPickable=false;
  const glow=BABYLON.MeshBuilder.CreateTube('boltG',{path,radius:width*3.4,tessellation:5},scene); glow.material=GM(color,.4); glow.isPickable=false;
  return tween(ms,k=>{ const on=k<.2||(k>.35&&k<.55)||(k>.7&&k<.85); core.isVisible=glow.isVisible=on; },E.lin).then(()=>{ core.dispose(); glow.dispose(); });
}
function fireTrail(pos){
  const ps=new BABYLON.ParticleSystem('ft',140,scene); ps.particleTexture=TEX.dot; ps.emitter=(pos||V3(0,-50,0)).clone();
  ps.minEmitBox=V3(-.2,-.2,-.2); ps.maxEmitBox=V3(.2,.2,.2);
  ps.color1=new BABYLON.Color4(1,.78,.25,1); ps.color2=new BABYLON.Color4(1,.32,.05,1); ps.colorDead=new BABYLON.Color4(.5,.1,.1,0);
  ps.minSize=.4; ps.maxSize=.9; ps.minLifeTime=.18; ps.maxLifeTime=.4; ps.emitRate=LOWFX()?50:130;
  ps.direction1=V3(-.3,.3,-.3); ps.direction2=V3(.3,1,.3); ps.minEmitPower=.3; ps.maxEmitPower=1; ps.updateSpeed=.02; ps.start(); return ps;
}
const stopPS=(ps,ms=700)=>{ ps.stop(); killPS(ps,ms); };

/* ---------------- power-ups (wardrobe "Power" slot) ---------------- */
const POWER={
  pFire:   {name:'FIRE',   col:'#ff8a1a', c1:[1,.65,.1], c2:[1,.15,.05], emoji:['🔥'], grav:3},
  pIce:    {name:'ICE',    col:'#9fe8ff', c1:[.8,.95,1], c2:[.35,.65,1], emoji:['❄️'], grav:-3},
  pThunder:{name:'THUNDER',col:'#fff27a', c1:[1,1,.55], c2:[1,.8,.2],   emoji:['⚡'], grav:-5},
  pRainbow:{name:'RAINBOW',col:'#ff7ac8', c1:[1,.4,.7], c2:[.4,.8,1],   emoji:['🌈','⭐'], grav:-4},
};
function powerHit(pos,big){
  const id=save.equip.power, p=POWER[id]; if(!p) return;
  burst(pos,{tex:'dot',count:big?40:16,power:big?9:5,size:big?.9:.6,c1:p.c1,c2:p.c2,life:.8,grav:p.grav});
  emojiBurst(pos,p.emoji,{count:big?8:3,size:.8,power:big?8:5});
  if(id==='pThunder'){ bolt(pos.add(V3((Math.random()-.5)*2,11,0)),pos); SFX.zap(); }
  if(id==='pRainbow') confetti(pos,big?20:10);
  if(id==='pFire') SFX.boom();
  ringFx(pos,p.col);
}
/* random mix of impact pictures for a hit, so no two hits look the same */
function hitFx(pos){
  const kinds=shuffle([0,1,2,3,4,5]).slice(0,LOWFX()?1:2);
  for(const k of kinds){
    if(k===0) slashFx(pos,rnd(['#ffffff','#ffe066','#9fe8ff','#ff9fd0']));
    else if(k===1) powFx(pos);
    else if(k===2) ringFx(pos);
    else if(k===3) emojiBurst(pos,[rnd(['💥','💫','⭐','✨','💢'])],{count:5,size:.9});
    else if(k===4) confetti(pos,12);
    else raysFx(pos,rnd(['#ffffff','#ffe066']));
  }
  powerHit(pos,false);
}

/* ---------------- combo aura: flames around the hero at combo x3+ ---------------- */
const aura=new BABYLON.ParticleSystem('aura',96,scene);
aura.particleTexture=TEX.dot; aura.emitter=V3(0,-50,0); aura.minEmitBox=V3(-.55,0,-.55); aura.maxEmitBox=V3(.55,2.6,.55);
aura.direction1=V3(-.2,1,-.2); aura.direction2=V3(.2,2,.2); aura.minEmitPower=.6; aura.maxEmitPower=1.5; aura.updateSpeed=.02;
aura.minLifeTime=.3; aura.maxLifeTime=.65; aura.minSize=.25; aura.maxSize=.6; aura.emitRate=0; aura.start();
function setAuraColor(){ const p=POWER[save.equip.power], c1=p?p.c1:[1,.78,.2], c2=p?p.c2:[1,.32,.1];
  aura.color1=new BABYLON.Color4(c1[0],c1[1],c1[2],.9); aura.color2=new BABYLON.Color4(c2[0],c2[1],c2[2],.9); aura.colorDead=new BABYLON.Color4(c2[0],c2[1],c2[2],0); }
setAuraColor();

/* ---------------- big on-screen shout ("THUNDER STRIKE!") ---------------- */
function callout(txt,color){ const c=$('callout'); c.textContent=txt; c.style.color=color||''; c.classList.remove('show'); void c.offsetWidth; c.classList.add('show'); }

/* ---------------- finisher projectiles ---------------- */
async function meteorDrop(to,delay){
  await wait(delay); const start=to.add(V3(-5+Math.random()*2,12,0));
  const m=nd(null,0,0,0); sp(.9,GM('#ffc04d'),m); sp(1.5,GM('#ff5a1a',.4),m); const ps=fireTrail(start);
  await tween(480,k=>{ m.position.copyFrom(BABYLON.Vector3.Lerp(start,to,k)); ps.emitter.copyFrom(m.position); },E.in);
  SFX.boom(); burst(to,{tex:'dot',count:22,power:6,size:.8,c1:[1,.75,.2],c2:[1,.25,.05],life:.7,grav:2.5}); fxPlane(TEX.ring,to.add(V3(0,0,-.5)),{color:'#ffb347',size:4,ms:350});
  G.shake=Math.max(G.shake,.35); m.dispose(); stopPS(ps);
}
async function rainbowBeam(from,to,mega){
  const cols=['#ff4d6d','#ff9f1c','#ffe066','#5fe07a','#4dc3ff','#9b6bff'], root=nd(null,0,0,0); root.position.copyFrom(from); root.lookAt(to);
  const len=BABYLON.Vector3.Distance(from,to), th=mega?.24:.15; SFX.laser();
  const bars=cols.map((c,i)=>{ const b=BABYLON.MeshBuilder.CreateCylinder('rb',{diameter:th,height:1,tessellation:8},scene); b.material=GM(c); b.parent=root; b.isPickable=false;
    b.rotation.x=PI/2; b.position.y=(i-2.5)*th*.92; b.scaling.y=.01; return b; });
  await tween(260,k=>bars.forEach(b=>{ b.scaling.y=Math.max(.01,len*k); b.position.z=len*k/2; }),E.out);
  burst(to,{count:40,power:8,size:.6,c1:[1,.4,.7],c2:[.4,.8,1],sphere:true});
  await tween(380,k=>{ const s=1+Math.sin(k*PI*6)*.2; bars.forEach(b=>{ b.scaling.x=b.scaling.z=s; }); });
  await tween(200,k=>bars.forEach(b=>{ b.scaling.x=b.scaling.z=Math.max(.01,1-k); }));
  root.dispose();
}
async function rocket(from,to,delay){
  await wait(delay); const cols=[['#ff4d6d',[1,.3,.45],[1,.85,.3]],['#4dc3ff',[.3,.75,1],[.6,1,.7]],['#ffe066',[1,.9,.3],[1,.5,.2]],['#b79cff',[.7,.5,1],[1,.5,.85]]], c=rnd(cols);
  const r=nd(null,0,0,0); sp(.35,GM(c[0]),r); const ps=fireTrail(from); SFX.whistle();
  await tween(520,k=>{ r.position.x=from.x+(to.x-from.x)*k; r.position.y=from.y+(to.y-from.y)*k+Math.sin(k*PI)*3; r.position.z=from.z+(to.z-from.z)*k; ps.emitter.copyFrom(r.position); },E.lin);
  r.dispose(); stopPS(ps,500); SFX.crackle();
  burst(to,{tex:'star',count:44,power:8,size:.5,c1:c[1],c2:c[2],life:1.1,grav:-2,sphere:true}); fxPlane(TEX.ring,to.add(V3(0,0,-.4)),{color:c[0],size:5,ms:450});
}
async function tornadoFx(from,to,mega){
  const r=nd(null,0,0,0), s=mega?1.6:1.15; r.position.set(from.x,0,from.z); SFX.whirl();
  cy(2.4*s,.35*s,3.2*s,GM('#e8ecff',.33),r,0,1.6*s,0,16); cy(1.6*s,.22*s,2.8*s,GM('#ffffff',.22),r,0,1.5*s,0,12);
  const spin=nd(r,0,0,0); for(let i=0;i<8;i++){ const a=i/8*PI*2, rad=(.5+i%3*.35)*s; const b=bx(.28,.28,.05,M(rnd(['#ffffff','#ffe066','#ff9fd0','#9fe8ff']),.6),spin,Math.cos(a)*rad,(.4+i*.35)*s,Math.sin(a)*rad); b.rotation.z=a; }
  await tween(800,k=>{ r.position.x=from.x+(to.x-from.x)*k; r.position.z=from.z+(to.z-from.z)*k; spin.rotation.y+=.45; },E.inOut);
  burst(to,{tex:'dot',count:30,power:7,size:.8,c1:[1,1,1],c2:[.8,.85,1],sphere:true});
  await tween(250,k=>{ spin.rotation.y+=.45; r.scaling.setAll(Math.max(.01,1-k)); }); r.dispose();
}
