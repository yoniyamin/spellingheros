/* The dreamy school corridor, floor, ambient particles and the graphics quality switch.
   (plain script: shares the global scope with the other files in js/, load order matters - see index.html) */
'use strict';

/* =====================================================================
   THE DREAMY SCHOOL CORRIDOR  (periwinkle with candy-coloured lockers)
   ===================================================================== */
/* sky seen through the windows, and the ABC poster (shared materials) */
const skyMat=(()=>{
  const t=new BABYLON.DynamicTexture('sky',256,scene,true), c=t.getContext();
  const g=c.createLinearGradient(0,0,0,256); g.addColorStop(0,'#fbfbff'); g.addColorStop(1,'#cdd2fb'); c.fillStyle=g; c.fillRect(0,0,256,256);
  for(let i=0;i<9;i++){ const x=30+i*26+(i%2)*10, y=60+(i*53)%140, r=26+(i*7)%22, rg=c.createRadialGradient(x,y,2,x,y,r);
    rg.addColorStop(0,'rgba(255,255,255,.85)'); rg.addColorStop(1,'rgba(255,255,255,0)'); c.fillStyle=rg; c.fillRect(x-r,y-r,r*2,r*2); }
  t.update(); const m=new BABYLON.StandardMaterial('skyM',scene); m.emissiveTexture=t; m.emissiveColor=BABYLON.Color3.White();
  m.disableLighting=true; m.backFaceCulling=false; return m;
})();
const posterMat=(()=>{
  const tex=new BABYLON.DynamicTexture('poster',256,scene,true), c=tex.getContext();
  c.fillStyle='#f4f5ff'; c.fillRect(0,0,256,256); c.strokeStyle='#6c72c4'; c.lineWidth=12; c.strokeRect(6,6,244,244);
  c.fillStyle='#4a50a8'; c.font='bold 70px "Comic Sans MS",Arial'; c.textAlign='center'; c.fillText('A B C',128,100);
  c.font='bold 54px "Comic Sans MS",Arial'; c.fillText('a b c',128,175); c.font='30px Arial'; c.fillText('\u270E \u270E \u270E',128,225); tex.update();
  const pm=new BABYLON.StandardMaterial('posterM',scene); pm.diffuseTexture=tex; pm.emissiveColor=new BABYLON.Color3(.55,.55,.62); pm.specularColor=BABYLON.Color3.Black(); return pm;
})();

/* candy colours for lockers and bunting */
const RAINBOW=[['#ff8fab','#ffb3c6'],['#ffb86b','#ffd29e'],['#ffe27a','#fff0b3'],['#8be39b','#b6f0c0'],['#7cc8ff','#b0deff'],['#b79cff','#d4c4ff']];
/* four wall types, merged into one mesh each and repeated with instances */
function buildSegment(type){
  const parts=[]; const add=m=>{parts.push(m);return m;};
  const wall=M('#c4c8f3',.45), wain=M('#8f95dc',.3), rail=M('#e4e6fe',.5), dark=M('#5b61b0',.2),
        pale=M('#e6e8ff',.55), frame=M('#7a80cf',.3), cream=M('#f3efd8',.7);
  // wall, wainscot panel, rail, skirting, ceiling, ceiling beam and lamps
  add(bx(4.02,6.6,.3,wall,null,0,3.3,3.5));
  add(bx(4.02,1.5,.08,wain,null,0,.85,3.31));
  add(bx(4.02,.1,.14,rail,null,0,1.62,3.27));
  add(bx(4.02,.38,.12,frame,null,0,.19,3.27));
  add(bx(4.02,.3,18,M('#d6d9fb',.5),null,0,6.6,-5));
  add(bx(.3,.45,18,M('#c1c5f1',.4),null,-2,6.3,-5));
  add(bx(1.9,.08,.8,GM('#ffffff'),null,0,6.42,2.2));
  add(bx(1.9,.08,.8,GM('#ffffff'),null,0,6.42,-3.2));
  const lantern=x=>{ add(bx(.03,1.3,.03,dark,null,x,5.85,-2.5)); add(sp(.55,GM('#f6f6ff'),null,x,5.1,-2.5)); };
  const plant=x=>{ add(cy(.5,.36,.5,M('#6a70c2',.3),null,x,.25,2.5)); add(sp(.7,M('#8fa0ea',.4),null,x,.85,2.5,1,.9,1));
    add(sp(.45,M('#a3b2f2',.4),null,x+.22,1.1,2.45)); add(sp(.4,M('#a3b2f2',.4),null,x-.2,1.05,2.55)); };
  const locker=(lx,w,ci)=>{
    const [c1,c2]=RAINBOW[ci%RAINBOW.length];
    add(bx(w,3.3,.5,M(c1,.36),null,lx,1.85,3.05));
    add(bx(w-.14,3.1,.04,M(c2,.4),null,lx,1.85,2.79));
    add(bx(w+.04,.06,.54,pale,null,lx,3.53,3.05));
    for(let k=0;k<4;k++) add(bx(w*.53,.05,.03,dark,null,lx,3.15-k*.13,2.76));
    add(bx(.07,.34,.07,pale,null,lx+w*.3,1.7,2.74)); add(bx(w*.53,.18,.03,pale,null,lx,2.2,2.76));
  };
  if(type===0){
    for(let i=0;i<4;i++) locker(-1.5+i,.94,i);
  } else if(type===1){                                   // big window, bench, plant, lantern
    add(bx(3.1,2.5,.12,pale,null,0,3.5,3.25)); add(pl(2.8,2.2,skyMat,null,0,3.5,3.18));
    add(bx(.08,2.2,.07,pale,null,0,3.5,3.14)); add(bx(2.8,.08,.07,pale,null,0,3.5,3.14));
    add(bx(3.2,.2,.8,frame,null,0,.82,2.75)); add(bx(.15,.82,.6,M('#6a70c2',.3),null,-1.4,.4,2.75)); add(bx(.15,.82,.6,M('#6a70c2',.3),null,1.4,.4,2.75));
    const s1=pl(2.7,8,GM('#ffffff',.13),null,0,2.4,1.9); s1.rotation.x=.95; add(s1);
    const s2=pl(1.2,8,GM('#ffffff',.1),null,.9,2.4,1.5); s2.rotation.x=.95; add(s2);
    add(pl(.5,.7,posterMat,null,1.8,2.2,3.12)); plant(-1.78); lantern(0);
  } else if(type===2){                                   // classroom door, notice board, clock
    add(bx(1.5,3.6,.1,frame,null,-1.1,1.8,3.24)); add(bx(1.3,3.4,.06,M('#aab0ee',.4),null,-1.1,1.75,3.17));
    add(pl(.5,.9,skyMat,null,-1.1,2.7,3.13)); add(sp(.1,pale,null,-.65,1.7,3.1));
    add(bx(1.7,1.3,.06,frame,null,.85,2.4,3.25)); add(bx(1.55,1.15,.05,M('#b3b8f2',.4),null,.85,2.4,3.2));
    [[-.4,2.7,.2],[0,2.5,-.15],[.45,2.75,.1],[-.2,2.15,-.1],[.4,2.2,.25]].forEach(p=>{ const q=bx(.38,.5,.02,M('#f6f7ff',.7),null,.85+p[0],p[1],3.16); q.rotation.z=p[2]; add(q); });
    const ck=cy(.7,.7,.06,M('#f4f5ff',.7),null,.85,4.3,3.2); ck.rotation.x=PI/2; add(ck);
    add(bx(.04,.25,.02,dark,null,.85,4.38,3.16)); add(bx(.2,.04,.02,dark,null,.93,4.3,3.16));
    lantern(-1);
  } else {                                               // trophy case, two lockers, lantern
    add(bx(2.3,2.6,.05,M('#9aa0e4',.4),null,-.85,2.1,3.2));
    add(bx(.12,2.6,.38,frame,null,-1.99,2.1,3.05)); add(bx(.12,2.6,.38,frame,null,.29,2.1,3.05));
    add(bx(2.3,.12,.38,frame,null,-.85,3.4,3.05)); add(bx(2.3,.12,.38,frame,null,-.85,.8,3.05));
    [1.55,2.3].forEach(y=>add(bx(2.1,.05,.3,pale,null,-.85,y,3.05)));
    [.86,1.6,2.35].forEach(y=>[-1.5,-.85,-.2].forEach(x=>{
      add(cy(.3,.3,.06,dark,null,x,y+.03,3.05)); add(cy(.06,.06,.12,cream,null,x,y+.12,3.05)); add(cy(.3,.14,.28,cream,null,x,y+.32,3.05)); }));
    add(bx(2.2,2.5,.02,GM('#eef0ff',.22),null,-.85,2.1,2.9));
    locker(.78,.88,4); locker(1.62,.88,5); lantern(1);
  }
  // party bunting along the top of every wall (merged into the wall mesh, so it costs nothing extra to draw)
  add(bx(4.02,.03,.03,dark,null,0,5.78,3.3));
  for(let k=0;k<5;k++){ const f=bx(.36,.36,.03,M(RAINBOW[(k+type*2)%RAINBOW.length][0],.5),null,-1.6+k*.8,5.55,3.29); f.rotation.z=PI/4; add(f); }
  const merged=mergeBaked(parts);          // ~20 colours -> a handful of draw calls (see mergeBaked in engine.js)
  merged.isVisible=false; merged.isPickable=false; return backdrop(merged);
}
const SEGS=[]; const SEGN=20;
const SCHOOL_PROTOS=[0,1,2,3].map(buildSegment);       // places.js builds the walls of the other places the same way and swaps them in
for(let i=0;i<SEGN;i++){ const s=backdrop(SCHOOL_PROTOS[i%4].createInstance('seg'+i)); s.position.x=i*4-24; s.isPickable=false; SEGS.push(s); }
REG=true; SEGS.forEach(s=>mirrorList.push(s));

/* glossy tiled floor that follows the camera */
const floorTex=(()=>{
  const t=new BABYLON.DynamicTexture('floorT',512,scene,true), c=t.getContext();
  c.fillStyle='#8a90d4'; c.fillRect(0,0,512,512);
  for(let i=0;i<2;i++) for(let j=0;j<2;j++){ c.fillStyle=(i+j)%2?'#b4b9f2':'#8389cf'; c.fillRect(i*256,j*256,256,256);
    const g=c.createLinearGradient(i*256,j*256,i*256+256,j*256+256); g.addColorStop(0,'rgba(255,255,255,.14)'); g.addColorStop(1,'rgba(255,255,255,0)'); c.fillStyle=g; c.fillRect(i*256,j*256,256,256); }
  c.strokeStyle='#6f75c0'; c.lineWidth=8; c.strokeRect(0,0,512,512); c.beginPath(); c.moveTo(256,0); c.lineTo(256,512); c.moveTo(0,256); c.lineTo(512,256); c.stroke();
  t.update(); t.anisotropicFilteringLevel=8; t.wrapU=t.wrapV=BABYLON.Texture.WRAP_ADDRESSMODE; return t;
})();
const floorMat=new BABYLON.StandardMaterial('floorM',scene);
floorMat.diffuseTexture=floorTex; floorTex.uScale=30; floorTex.vScale=5.5; floorMat.specularColor=new BABYLON.Color3(.12,.12,.2); floorMat.specularPower=80;
floorMat.diffuseColor=new BABYLON.Color3(.78,.8,.95); floorMat.emissiveColor=BABYLON.Color3.FromHexString('#7f86cc').scale(.12); floorMat.reflectionTexture=mirror;
mirror.level=.2;
const floor=backdrop(BABYLON.MeshBuilder.CreateGround('floor',{width:120,height:22},scene));
floor.position.set(14,0,-5); floor.material=floorMat; floor.receiveShadows=true; floor.isPickable=false;

/* dust motes */
const dust=backdrop(new BABYLON.ParticleSystem('dust',130,scene));
dust.particleTexture=TEX.dot; dust.emitter=V3(0,2,0); dust.minEmitBox=V3(-12,-1,-3); dust.maxEmitBox=V3(12,5,10);
dust.direction1=V3(-.1,.05,0); dust.direction2=V3(.1,.3,0); dust.minEmitPower=.1; dust.maxEmitPower=.4;
dust.minSize=.05; dust.maxSize=.16; dust.minLifeTime=6; dust.maxLifeTime=11; dust.emitRate=14;
dust.color1=new BABYLON.Color4(1,1,1,.75); dust.color2=new BABYLON.Color4(.85,.88,1,.5); dust.colorDead=new BABYLON.Color4(1,1,1,0);
dust.preWarmCycles=100; dust.preWarmStepOffset=10; dust.start();

/* (the corridor above is the "School Corridor" place; the other places and the switch between them are in places.js) */
/* graphics quality: Balanced (default), High (adds live floor reflection), Low (for slow computers) */
const QNAME={balanced:'Balanced',high:'High',low:'Low'}; let pipeOn=!!pipe;
/* dynamic resolution: the auto-quality check in main.js scales rendering with this (1 = the quality's
   own resolution) before it drops a whole quality level, and eases it back when there is headroom */
let dynScale=1;
let petalRate=4, dustRate=14;   // particles per second at Balanced/High; the current place sets these (places.js), Low uses half
/* sharpness: on Retina / phone screens (devicePixelRatio > 1) render with more pixels than CSS pixels, but within a budget of
   about 1.6 million pixels (an iPhone held sideways gets ~2x, a 1080p monitor stays at 1x). dynScale (auto quality, main.js)
   can then take it back down step by step, to below CSS resolution like before. */
const PIX_BUDGET=1.6e6;
function pixelRatio(){ const dpr=window.devicePixelRatio||1, css=Math.max(1,ROT.w*ROT.h); return Math.max(1,Math.min(dpr,2.5,Math.sqrt(PIX_BUDGET/css))); }
const dynMax=()=>1.3*pixelRatio();
function applyResScale(){ engine.setHardwareScalingLevel((QUAL==='low'?1.3:QUAL==='high'?1.15:1)*dynScale/pixelRatio()); fit(); }
function setDynScale(v){ dynScale=Math.max(1,Math.min(dynMax(),v)); applyResScale(); }
/* keep the drawing surface the same shape as the canvas on screen. iPhone Safari reports the new size a moment AFTER a
   rotation, so a resize handled right away kept the old shape and the picture looked stretched: also watch the canvas itself
   (ResizeObserver), re-check shortly after every resize, and main.js compares the shapes every half second as a last net. */
function onViewport(){ layoutRotation(); applyResScale(); }
window.addEventListener('resize',()=>{ onViewport(); setTimeout(onViewport,120); setTimeout(onViewport,450); });
window.addEventListener('orientationchange',()=>{ setTimeout(onViewport,60); setTimeout(onViewport,400); });
try{ if(window.visualViewport) visualViewport.addEventListener('resize',onViewport); }catch(e){}
try{ new ResizeObserver(()=>applyResScale()).observe(canvas); }catch(e){}
try{ matchMedia('(resolution: '+(window.devicePixelRatio||1)+'dppx)').addEventListener('change',()=>applyResScale()); }catch(e){}   // moved to another screen
function setQuality(q,manual){
  QUAL=q; const low=q==='low', hi=q==='high'; dynScale=1;   // a quality change starts again at full sharpness for that level
  for(let i=outlinedMeshes.length-1;i>=0;i--){ const m=outlinedMeshes[i]; if(m.isDisposed()) outlinedMeshes.splice(i,1); else m.renderOutline=!low; }
  sun.shadowEnabled=hi;   // real shadows only on High: heroes/bosses/dummies already have blob() contact shadows, so Balanced/Low lose almost nothing
  // the reflection renders the whole scene a second time, so it only exists on High - and even there the
  // corridor segments are left out (their reflection in the floor is barely visible, the characters' is)
  floorMat.reflectionTexture=hi?mirror:null; mirror.renderList=hi?mirrorList.filter(m=>SEGS.indexOf(m)<0):[];
  const ct=scene.customRenderTargets, ci=ct.indexOf(mirror);
  if(hi&&ci<0) ct.push(mirror); else if(!hi&&ci>=0) ct.splice(ci,1);
  setEmit(petals,low?Math.ceil(petalRate/2):petalRate); setEmit(dust,low?Math.ceil(dustRate/2):dustRate);
  // the post-process pipeline (bloom + FXAA) costs several full-screen passes, so only High uses it;
  // otherwise the scene's own colour grading is applied directly while drawing (no extra passes)
  const ic=scene.imageProcessingConfiguration;
  if(pipe){ try{
    const mgr=scene.postProcessRenderPipelineManager;
    if(hi&&!pipeOn){ mgr.attachCamerasToRenderPipeline('dp',camera); pipeOn=true; }
    else if(!hi&&pipeOn){ mgr.detachCamerasFromRenderPipeline('dp',camera); pipeOn=false; }
  }catch(e){ console.warn('quality fx',e); } }
  ic.applyByPostProcess=hi&&pipeOn; ic.exposure=hi?.92:1.08; ic.contrast=hi?1.12:1.05; ic.vignetteWeight=hi?2.4:1.6;
  applyResScale();   // High renders at ~76% of the pixels (scaling 1.15): with bloom+reflection+shadows on top, that is what keeps it smooth
  if(manual){ try{ localStorage.setItem('sh_q2',q); }catch(e){} G.qualFixed=true; toast('Graphics: '+QNAME[q]+'  (press G to switch)'); }
}
