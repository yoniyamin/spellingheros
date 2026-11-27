/* Babylon set-up, lighting/quality, mesh helpers, particle textures and screen effects.
   (plain script: shares the global scope with the other files in js/, load order matters - see index.html) */
'use strict';

/* =====================================================================
   BABYLON SET-UP
   ===================================================================== */
const canvas = $('c');
/* ---------------- always sideways on phones ----------------
   The scene is wide, so on a phone held upright the whole page (body) is turned 90 degrees and the game shows sideways
   anyway: the child turns the phone (this works with the phone's rotation lock on, too). When the browser itself turns
   to landscape, the page is not turned. Everything inside body is laid out in the turned "game frame"; toLocal() turns
   screen points (taps, element rectangles) into that frame. --vw / --vh are 1% of the game frame (used by style.css instead of vw / vh). */
const ROT={on:false,w:innerWidth,h:innerHeight};
function layoutRotation(){
  let touch=false; try{ touch=matchMedia('(pointer: coarse)').matches; }catch(e){}
  const w=innerWidth, h=innerHeight, on=touch&&h>w&&w<600, de=document.documentElement, st=de.style;
  ROT.on=on; ROT.w=on?h:w; ROT.h=on?w:h;
  de.classList.toggle('rot',on); de.classList.toggle('compact',ROT.h<=500);
  st.setProperty('--fw',ROT.w+'px'); st.setProperty('--fh',ROT.h+'px'); st.setProperty('--vw',ROT.w/100+'px'); st.setProperty('--vh',ROT.h/100+'px');
}
layoutRotation();
/* a point on the screen (clientX / clientY, getBoundingClientRect) -> the same point in the game frame */
const toLocal=(x,y)=>ROT.on?{x:y,y:innerWidth-x}:{x,y};
const rectCenter=el=>{ const r=el.getBoundingClientRect(); return toLocal(r.left+r.width/2,r.top+r.height/2); };
const engine =new BABYLON.Engine(canvas,true,{stencil:true,preserveDrawingBuffer:false});
engine.setHardwareScalingLevel(1);   // the real level is set by applyResScale (corridor.js): sharper on hi-DPI screens, within a pixel budget
const scene = new BABYLON.Scene(engine);
/* Draw order. Group 0 is the backdrop: the floor, the sky, the scenery pieces and the ambient sparkles (fireflies, snow, dust). Everything else (the hero,
   the letter signs, the boss, effects) is in group 1, which is drawn afterwards over a cleared depth buffer. So the backdrop can never cut through,
   or float over, a character or a sign, however the boss and the scenery slide past each other. New meshes and particle systems start in group 1;
   backdrop(x) moves one into group 0. (the backdrop all lies behind the hero, so nothing is drawn in the wrong order) */
const BACKDROP=new WeakSet();     // (Babylon announces a new mesh only after its constructor ran, so the backdrop marks itself and the announcement skips it)
scene.onNewMeshAddedObservable.add(m=>{ if(!BACKDROP.has(m)) m.renderingGroupId=1; });
scene.onBeforeRenderObservable.add(()=>{ const a=scene.particleSystems; for(let i=0;i<a.length;i++){ const p=a[i]; if(p._rg===undefined){ p._rg=1; if(!BACKDROP.has(p)) p.renderingGroupId=1; } } });
const backdrop=o=>{ BACKDROP.add(o); o.renderingGroupId=0; return o; };
scene.skipPointerMovePicking=true;   // we never pick meshes under the mouse (clicks are tested in screen space), so skip that work
const FOG = BABYLON.Color3.FromHexString('#aab0ea');
scene.clearColor = new BABYLON.Color4(FOG.r,FOG.g,FOG.b,1);
scene.fogMode = BABYLON.Scene.FOGMODE_EXP2; scene.fogColor = FOG; scene.fogDensity = .017;
scene.ambientColor = BABYLON.Color3.FromHexString('#8c92d8');

const camera = new BABYLON.FreeCamera('cam',V3(0,2.7,-12.2),scene);
camera.minZ=.1; camera.maxZ=140; camera.fov=.8;
const hemi = new BABYLON.HemisphericLight('h',V3(0,1,-.3),scene);
hemi.intensity=.55; hemi.diffuse=BABYLON.Color3.FromHexString('#ffffff'); hemi.groundColor=BABYLON.Color3.FromHexString('#9da3e6');
const sunDir=V3(-.35,-1,.45).normalize();
const sun = new BABYLON.DirectionalLight('d',sunDir.clone(),scene); sun.intensity=.62;

let pipe=null;
try{
  pipe = new BABYLON.DefaultRenderingPipeline('dp',true,scene,[camera]);
  pipe.fxaaEnabled=false; pipe.bloomEnabled=true; pipe.bloomThreshold=.95; pipe.bloomWeight=.22; pipe.bloomKernel=16; pipe.bloomScale=.3;   // no FXAA pass: the engine's own MSAA is enough, and bloom is kept small/cheap
  pipe.imageProcessingEnabled=true;
  const ip=pipe.imageProcessing; ip.vignetteEnabled=true; ip.vignetteWeight=2.4; ip.vignetteColor=new BABYLON.Color4(.35,.38,.75,0);
  ip.contrast=1.12; ip.exposure=.92;
}catch(e){ console.warn('post-processing unavailable',e); }

const HALFW=9.6, DIST=12.2, CAMY=2.7, LOOKY=1.8, MAXFOV=1.15;
let baseFov=.8, camPunch=0, camDist=DIST, camY=CAMY;
/* the play area (hero, four signs, boss: about 19 units wide) always fits the screen. On wide screens the field of view
   narrows; on narrow ones (a phone held upright, a tablet) it widens up to MAXFOV and then the camera steps back instead,
   keeping the same downward angle. */
function fit(){
  engine.resize();
  const a=engine.getRenderWidth()/Math.max(1,engine.getRenderHeight());
  const v=2*Math.atan(Math.tan(Math.atan2(HALFW,DIST))/a);
  baseFov=Math.min(Math.max(v,.5),MAXFOV); camera.fov=baseFov;
  const need=HALFW/(Math.tan(baseFov/2)*a);              // the distance at which HALFW fits with this field of view
  camDist=Math.max(DIST,need); camY=LOOKY+(CAMY-LOOKY)*camDist/DIST;
}

/* ---------------- lighting FX: soft shadows, glossy floor ---------------- */
/* quality levels: 'balanced' (default: blob shadows only), 'high' (real shadows + live floor reflection + bloom), 'low' (cheapest, lower resolution) */
let QUAL='balanced'; try{ const q=localStorage.getItem('sh_q2'); if(q==='high'||q==='low'||q==='balanced') QUAL=q; }catch(e){}
sun.autoUpdateExtends=false; sun.autoCalcShadowZBounds=false;
sun.orthoLeft=-17; sun.orthoRight=17; sun.orthoBottom=-11; sun.orthoTop=11; sun.shadowMinZ=1; sun.shadowMaxZ=70;
const shadowGen=new BABYLON.ShadowGenerator(512,sun);
shadowGen.usePoissonSampling=false; shadowGen.bias=.002; shadowGen.setDarkness(.4);   // plain PCF is much cheaper than Poisson sampling; only used on High (see setQuality)
const mirrorList=[]; let REG=false;
function reg(o){                       // register a mesh as a shadow caster + floor reflection
  if(!REG||!o.material||o.material.alpha<1) return;
  if(!o.material.disableLighting) shadowGen.addShadowCaster(o);
  mirrorList.push(o); o.onDisposeObservable.add(()=>{ const i=mirrorList.indexOf(o); if(i>=0) mirrorList.splice(i,1); });
}
const mirror=new BABYLON.MirrorTexture('mir',128,scene,true);
mirror.mirrorPlane=new BABYLON.Plane(0,-1,0,0); mirror.renderList=mirrorList; mirror.level=.3; mirror.adaptiveBlurKernel=0;   // 128px, no blur pass: the floor is glossy, not a real mirror
let toastT=null;
function toast(msg){ const t=$('toast'); t.textContent=msg; t.classList.add('show'); clearTimeout(toastT); toastT=setTimeout(()=>t.classList.remove('show'),1800); }

/* ---------------- helpers: materials & meshes ---------------- */
const matCache={};
function M(hex,em=.16,alpha=1){
  const k=hex+'|'+em+'|'+alpha; if(matCache[k]) return matCache[k];
  const m=new BABYLON.StandardMaterial('m'+k,scene), c=BABYLON.Color3.FromHexString(hex);
  m.diffuseColor=c; m.emissiveColor=c.scale(em); m.specularColor=new BABYLON.Color3(.1,.1,.14); m.specularPower=24;
  if(alpha<1){ m.alpha=alpha; } matCache[k]=m; return m;
}
function GM(hex,alpha=1){           // glowing, unlit material
  const k='g'+hex+'|'+alpha; if(matCache[k]) return matCache[k];
  const m=new BABYLON.StandardMaterial(k,scene); m.disableLighting=true; m.emissiveColor=BABYLON.Color3.FromHexString(hex);
  m.alpha=alpha; m.backFaceCulling=false; matCache[k]=m; return m;
}
const nd=(par,x=0,y=0,z=0)=>{ const n=new BABYLON.TransformNode('n',scene); n.parent=par; n.position.set(x,y,z); return n; };
function fin(o,m,par,x,y,z,r=true){ o.material=m; o.parent=par; o.position.set(x,y,z); o.isPickable=false; if(r) reg(o); return o; }
const bx=(w,h,d,m,par,x=0,y=0,z=0)=>fin(BABYLON.MeshBuilder.CreateBox('b',{width:w,height:h,depth:d},scene),m,par,x,y,z);
const cy=(dt,db,h,m,par,x=0,y=0,z=0,t=24)=>fin(BABYLON.MeshBuilder.CreateCylinder('c',{diameterTop:dt,diameterBottom:db,height:h,tessellation:t},scene),m,par,x,y,z);
const sp=(d,m,par,x=0,y=0,z=0,sx=1,sy=1,sz=1)=>{ const o=fin(BABYLON.MeshBuilder.CreateSphere('s',{diameter:d,segments:14},scene),m,par,x,y,z); o.scaling.set(sx,sy,sz); return o; };
const pl=(w,h,m,par,x=0,y=0,z=0)=>fin(BABYLON.MeshBuilder.CreatePlane('p',{width:w,height:h},scene),m,par,x,y,z,false);
const tor=(d,t,m,par,x=0,y=0,z=0)=>fin(BABYLON.MeshBuilder.CreateTorus('t',{diameter:d,thickness:t,tessellation:28},scene),m,par,x,y,z);
/* ---------------- merging static pieces into few draw calls ----------------
   MergeMeshes alone keeps one sub-mesh (= one draw call) per material, and a wall of the scenery uses ~20 colours.
   mergeBaked() turns every plain colour material into a vertex colour first, so pieces that differ only in colour share
   one material. Babylon's standard shader computes clamp(light + emissive) x vertex colour, which equals the original
   colour x (light + glow) when the shared material is white with a grey glow, so the look stays the same (the glow amount
   is rounded to steps of 0.05). Pieces with textures, transparency or no lighting are grouped by those properties instead.
   The parts must be built around the origin (their world position is what gets merged); parent the result afterwards. */
const bakedMats={};
function bakedMat(lit,em,alpha,spec,pow,bfc){
  const k=[lit?1:0,em,alpha,spec,pow,bfc?1:0].join('|'); if(bakedMats[k]) return bakedMats[k];
  const m=new BABYLON.StandardMaterial('vc'+k,scene); m.diffuseColor=BABYLON.Color3.White(); m.backFaceCulling=bfc; m.alpha=alpha;
  if(lit){ m.emissiveColor=new BABYLON.Color3(em,em,em); m.specularColor=BABYLON.Color3.FromHexString(spec); m.specularPower=pow; }
  else { m.disableLighting=true; m.emissiveColor=BABYLON.Color3.White(); }
  return bakedMats[k]=m;
}
function bakeColor(p){
  const m=p.material, n=p.getTotalVertices(); let c=[1,1,1];
  const plain=m&&m.getClassName&&m.getClassName()==='StandardMaterial'&&!m.diffuseTexture&&!m.emissiveTexture&&!m.opacityTexture&&!m.reflectionTexture&&!m.bumpTexture&&!m.ambientTexture;
  if(plain){
    const d=m.diffuseColor, e=m.emissiveColor;
    if(m.disableLighting){ c=[e.r,e.g,e.b]; p.material=bakedMat(false,1,m.alpha,'',0,m.backFaceCulling); }
    else { const mx=Math.max(d.r,d.g,d.b), em=mx>0?Math.round(Math.max(e.r,e.g,e.b)/mx*20)/20:0; c=[d.r,d.g,d.b];
      p.material=bakedMat(true,em,m.alpha,m.specularColor.toHexString(),m.specularPower,m.backFaceCulling); }
  }
  const col=new Float32Array(n*4); for(let i=0;i<n;i++){ col[i*4]=c[0]; col[i*4+1]=c[1]; col[i*4+2]=c[2]; col[i*4+3]=1; }
  p.setVerticesData(BABYLON.VertexBuffer.ColorKind,col,false);
}
function mergeBaked(parts){
  parts.forEach(bakeColor);
  const merged=BABYLON.Mesh.MergeMeshes(parts,true,true,undefined,false,true);
  if(merged){ merged.hasVertexAlpha=false; merged.isPickable=false; }
  return merged;
}
/* merge every mesh under a node that was built around the origin into one mesh (the node is disposed) */
function bakeNode(n){ n.computeWorldMatrix(true); const parts=n.getChildMeshes(false); parts.forEach(m=>m.computeWorldMatrix(true)); const m=mergeBaked(parts); n.dispose(); reg(m); return m; }
/* frame-rate independent smoothing: "move k of the way per 60 Hz frame", correct at 120 / 144 Hz too */
const lerpK=(k,dt)=>1-Math.pow(1-k,dt/16.667);

const shadowMat=(()=>{ const m=new BABYLON.StandardMaterial('shadow',scene); m.disableLighting=true; m.diffuseColor=BABYLON.Color3.Black();
  m.emissiveColor=BABYLON.Color3.FromHexString('#2c3086'); m.alpha=.16; return m; })();
function blob(par,r){ const s=BABYLON.MeshBuilder.CreateDisc('sh',{radius:r,tessellation:28},scene); s.rotation.x=PI/2; s.position.y=.025;
  s.parent=par; s.material=shadowMat; s.isPickable=false; return s; }
/* cartoon outline for toy-like characters. Every outlined mesh is drawn a second time by Babylon's
   outline renderer, so: tiny details (< ~18cm) skip it (they only produced a coloured smudge - the pig's
   eyelids being the worst case), meshes can opt out with _noOutline, and Low quality turns it off entirely. */
const OUTC=BABYLON.Color3.FromHexString('#2b2f78');
const outlinedMeshes=[];
function outlineNode(n,w=.022,skip){
  n.getChildMeshes().forEach(m=>{ const mt=m.material; if(!mt||mt.alpha<1||mt.disableLighting||mt.diffuseTexture||m===skip||m._noOutline) return;
    try{ const ext=m.getBoundingInfo().boundingBox.extendSizeWorld; if(Math.max(ext.x,ext.y,ext.z)*2<.18) return; }catch(e){}
    m.renderOutline=QUAL!=='low'; m.outlineWidth=w; m.outlineColor=OUTC;
    if(!outlinedMeshes.includes(m)) outlinedMeshes.push(m); });
}

/* ---------------- particle textures ---------------- */
function mkTex(draw){ const t=new BABYLON.DynamicTexture('tx',64,scene,true); const c=t.getContext(); c.clearRect(0,0,64,64); draw(c); t.hasAlpha=true; t.update(); return t; }
const TEX={
  dot:mkTex(c=>{const g=c.createRadialGradient(32,32,0,32,32,30);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(1,'rgba(255,255,255,0)');c.fillStyle=g;c.fillRect(0,0,64,64);}),
  star:mkTex(c=>{c.fillStyle='#fff';c.beginPath();for(let i=0;i<10;i++){const r=i%2?12:29,a=-PI/2+i*PI/5;c.lineTo(32+r*Math.cos(a),33+r*Math.sin(a));}c.closePath();c.fill();}),
  heart:mkTex(c=>{c.fillStyle='#fff';c.beginPath();c.moveTo(32,56);c.bezierCurveTo(2,36,6,8,32,22);c.bezierCurveTo(58,8,62,36,32,56);c.fill();}),
  bubble:mkTex(c=>{c.strokeStyle='#fff';c.lineWidth=5;c.beginPath();c.arc(32,32,24,0,7);c.stroke();c.fillStyle='rgba(255,255,255,.35)';c.fill();c.fillStyle='#fff';c.beginPath();c.arc(23,23,5,0,7);c.fill();}),
};
/* set a continuous particle system's rate, fully stopping it at 0: Babylon keeps animating/rendering
   a started system even when emitRate is 0, so "off" should mean stopped, not just silent */
function setEmit(ps,rate){
  ps.emitRate=rate;
  if(rate>0){ if(ps._off){ ps._off=false; try{ ps.start(); }catch(e){} } }
  else if(!ps._off){ ps._off=true; try{ ps.stop(); }catch(e){} }
}
/* one-shot bursts are pooled (8 systems, reused via stop()+reset()+start()): creating and disposing a
   ParticleSystem on every hit allocated GPU buffers and caused the little hitches on hits/finishers.
   If all 8 are busy at once (a mega finisher), the old create-and-dispose path is used as a fallback. */
const burstPool=[];
function burst(pos,{tex='star',count=34,c1=[1,.82,.2],c2=[1,.5,.7],power=7,life=1,size=.55,grav=-7,sphere=false,std=false}={}){
  const n=Math.min(QUAL==='low'?Math.ceil(count*.5):count,128);
  let item=burstPool.find(i=>!i.busy);
  if(!item&&burstPool.length<8){ item={ps:new BABYLON.ParticleSystem('burstPool',128,scene),busy:false}; burstPool.push(item); }
  const pooled=!!item, ps=pooled?item.ps:new BABYLON.ParticleSystem('burst',n+8,scene);
  if(pooled){ item.busy=true; try{ ps.stop(); ps.reset(); }catch(e){} }
  ps.particleTexture=TEX[tex]||tex; ps.emitter=pos.clone();
  ps.color1=new BABYLON.Color4(c1[0],c1[1],c1[2],1); ps.color2=new BABYLON.Color4(c2[0],c2[1],c2[2],1); ps.colorDead=new BABYLON.Color4(c2[0],c2[1],c2[2],0);
  ps.minSize=size*.5; ps.maxSize=size; ps.minLifeTime=life*.5; ps.maxLifeTime=life; ps.emitRate=0; ps.manualEmitCount=n;
  ps.minEmitBox=V3(0,0,0); ps.maxEmitBox=V3(0,0,0);
  if(sphere){ ps.direction1=V3(-1,-1,-1); ps.direction2=V3(1,1,1); } else { ps.direction1=V3(-1,.6,-1); ps.direction2=V3(1,2,1); }
  ps.minEmitPower=power*.4; ps.maxEmitPower=power; ps.updateSpeed=.02;
  ps.blendMode=std?BABYLON.ParticleSystem.BLENDMODE_STANDARD:BABYLON.ParticleSystem.BLENDMODE_ONEONE;
  ps.gravity=V3(0,grav,0); ps.minAngularSpeed=-4; ps.maxAngularSpeed=4; ps.targetStopDuration=life; ps.start();
  if(pooled) setTimeout(()=>{ item.busy=false; },life*1000+400); else killPS(ps,life*1000+400);
}
/* dispose a particle system later WITHOUT disposing its (shared) texture -
   "disposeOnStop" would also destroy the shared texture, so later bursts could vanish */
function killPS(ps,ms){ setTimeout(()=>{ try{ ps.dispose(false); }catch(e){} },ms); }
TEX.ring=mkTex(c=>{c.strokeStyle='#fff';c.lineWidth=7;c.beginPath();c.arc(32,32,26,0,7);c.stroke();});
TEX.petal=mkTex(c=>{const g=c.createRadialGradient(32,32,2,32,32,26);g.addColorStop(0,'rgba(255,255,255,.95)');g.addColorStop(1,'rgba(255,255,255,0)');
  c.fillStyle=g;c.save();c.translate(32,32);c.rotate(.6);c.scale(1,.5);c.translate(-32,-32);c.beginPath();c.arc(32,32,26,0,7);c.fill();c.restore();});
TEX.streak=mkTex(c=>{const g=c.createLinearGradient(0,0,64,0);g.addColorStop(0,'rgba(255,255,255,0)');g.addColorStop(.7,'rgba(255,255,255,.85)');g.addColorStop(1,'rgba(255,255,255,1)');
  c.fillStyle=g;c.fillRect(0,26,64,12);});
/* expanding impact ring that always faces the camera (pooled planes/materials, same trick as burst();
   falls back to a throwaway plane when every pooled ring is already on screen) */
const shockPool=[];
function shock(pos,{color='#ffffff',size=3,ms=380}={}){
  for(let i=shockPool.length-1;i>=0;i--) if(shockPool[i].p.isDisposed()) shockPool.splice(i,1);   // resetToSelect() sweeps planes made during a run
  let item=shockPool.find(i=>!i.busy);
  if(!item&&shockPool.length<6){
    const p=BABYLON.MeshBuilder.CreatePlane('shock',{size:1},scene), m=new BABYLON.StandardMaterial('shk',scene);
    m.diffuseTexture=TEX.ring; m.useAlphaFromDiffuseTexture=true; m.disableLighting=true; m.backFaceCulling=false;
    p.material=m; p.billboardMode=BABYLON.Mesh.BILLBOARDMODE_ALL; p.isPickable=false; p.isVisible=false;
    item={p,m,busy:false}; shockPool.push(item);
  }
  if(!item){ const p=BABYLON.MeshBuilder.CreatePlane('shock',{size:1},scene), m=new BABYLON.StandardMaterial('shk',scene);
    m.diffuseTexture=TEX.ring; m.useAlphaFromDiffuseTexture=true; m.emissiveColor=BABYLON.Color3.FromHexString(color); m.disableLighting=true; m.backFaceCulling=false;
    p.material=m; p.billboardMode=BABYLON.Mesh.BILLBOARDMODE_ALL; p.position.copyFrom(pos); p.isPickable=false;
    tween(ms,k=>{ const s=.3+k*size; p.scaling.set(s,s,s); m.alpha=1-k; },E.out).then(()=>{ m.dispose(); p.dispose(); }); return; }
  item.busy=true; const {p,m}=item;
  p.isVisible=true; p.position.copyFrom(pos); m.emissiveColor=BABYLON.Color3.FromHexString(color); m.alpha=1;
  tween(ms,k=>{ const s=.3+k*size; p.scaling.set(s,s,s); m.alpha=1-k; },E.out).then(()=>{ p.isVisible=false; item.busy=false; });
}
/* hit-freeze: the game briefly crawls so big impacts feel heavy */
let slowMul=1, slowT=null;
function freeze(ms,scale=.04){ slowMul=scale; clearTimeout(slowT); slowT=setTimeout(()=>{ slowMul=1; },ms); }
function flash(color='#ffffff',op=.55){ const f=$('flash'); f.style.transition='none'; f.style.background=color; f.style.opacity=op; void f.offsetWidth; f.style.transition='opacity .45s'; f.style.opacity=0; }
/* speed streaks behind the hero while dashing */
const streak=new BABYLON.ParticleSystem('streak',96,scene);
streak.particleTexture=TEX.streak; streak.emitter=V3(0,0,0); streak.billboardMode=BABYLON.ParticleSystem.BILLBOARDMODE_STRETCHED;
streak.minEmitBox=V3(-.3,.1,-.9); streak.maxEmitBox=V3(.3,2.4,.9); streak.direction1=V3(-1,0,-.05); streak.direction2=V3(-1,.04,.05);
streak.minEmitPower=14; streak.maxEmitPower=22; streak.minLifeTime=.16; streak.maxLifeTime=.3; streak.minSize=.6; streak.maxSize=1;
streak.minScaleX=3; streak.maxScaleX=6; streak.minScaleY=.06; streak.maxScaleY=.12; streak.emitRate=0;
streak.color1=new BABYLON.Color4(.3,.34,.85,.65); streak.color2=new BABYLON.Color4(1,1,1,.8); streak.colorDead=new BABYLON.Color4(.3,.34,.85,0);
streak.start();
/* slow falling petals / light flakes for dreaminess */
const petals=backdrop(new BABYLON.ParticleSystem('petals',160,scene));     // room for the busiest place (snowfall, see places.js)
petals.particleTexture=TEX.petal; petals.emitter=V3(0,0,0); petals.minEmitBox=V3(-13,4,-4); petals.maxEmitBox=V3(13,6.5,6);
petals.direction1=V3(-.5,-.5,0); petals.direction2=V3(.2,-.15,0); petals.minEmitPower=.3; petals.maxEmitPower=.8; petals.gravity=V3(0,-.12,0);
petals.minSize=.22; petals.maxSize=.5; petals.minLifeTime=8; petals.maxLifeTime=13; petals.emitRate=8; petals.minAngularSpeed=-1.5; petals.maxAngularSpeed=1.5;
petals.color1=new BABYLON.Color4(1,1,1,.7); petals.color2=new BABYLON.Color4(.82,.86,1,.55); petals.colorDead=new BABYLON.Color4(1,1,1,0);
petals.preWarmCycles=120; petals.preWarmStepOffset=10; petals.start();
