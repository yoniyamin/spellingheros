/* Babylon set-up, lighting/quality, mesh helpers, particle textures and screen effects.
   (plain script: shares the global scope with the other files in js/, load order matters - see index.html) */
'use strict';

/* =====================================================================
   BABYLON SET-UP
   ===================================================================== */
const canvas = $('c');
const engine = new BABYLON.Engine(canvas,true,{stencil:true,preserveDrawingBuffer:false});
engine.setHardwareScalingLevel(1);   // never render above CSS resolution: hi-DPI screens would cost 4x the pixels
const scene = new BABYLON.Scene(engine);
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
  pipe.fxaaEnabled=true; pipe.bloomEnabled=true; pipe.bloomThreshold=.95; pipe.bloomWeight=.22; pipe.bloomKernel=32; pipe.bloomScale=.3;
  pipe.imageProcessingEnabled=true;
  const ip=pipe.imageProcessing; ip.vignetteEnabled=true; ip.vignetteWeight=2.4; ip.vignetteColor=new BABYLON.Color4(.35,.38,.75,0);
  ip.contrast=1.12; ip.exposure=.92;
}catch(e){ console.warn('post-processing unavailable',e); }

const HALFW=9.6, DIST=12.2;
let baseFov=.8, camPunch=0;
function fit(){
  engine.resize();
  const a=engine.getRenderWidth()/engine.getRenderHeight();
  const v=2*Math.atan(Math.tan(Math.atan2(HALFW,DIST))/a);
  baseFov=Math.min(Math.max(v,.5),1.35); camera.fov=baseFov;
}
window.addEventListener('resize',fit);

/* ---------------- lighting FX: soft shadows, glossy floor ---------------- */
/* quality levels: 'balanced' (default: shadows + light bloom), 'high' (adds live floor reflection), 'low' (no shadows/bloom) */
let QUAL='balanced'; try{ const q=localStorage.getItem('sh_q2'); if(q==='high'||q==='low'||q==='balanced') QUAL=q; }catch(e){}
sun.autoUpdateExtends=false; sun.autoCalcShadowZBounds=false;
sun.orthoLeft=-17; sun.orthoRight=17; sun.orthoBottom=-11; sun.orthoTop=11; sun.shadowMinZ=1; sun.shadowMaxZ=70;
const shadowGen=new BABYLON.ShadowGenerator(512,sun);
shadowGen.usePoissonSampling=true; shadowGen.bias=.002; shadowGen.setDarkness(.4);
const mirrorList=[]; let REG=false;
function reg(o){                       // register a mesh as a shadow caster + floor reflection
  if(!REG||!o.material||o.material.alpha<1) return;
  if(!o.material.disableLighting) shadowGen.addShadowCaster(o);
  mirrorList.push(o); o.onDisposeObservable.add(()=>{ const i=mirrorList.indexOf(o); if(i>=0) mirrorList.splice(i,1); });
}
const mirror=new BABYLON.MirrorTexture('mir',256,scene,true);
mirror.mirrorPlane=new BABYLON.Plane(0,-1,0,0); mirror.renderList=mirrorList; mirror.level=.3; mirror.adaptiveBlurKernel=8;
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
const shadowMat=(()=>{ const m=new BABYLON.StandardMaterial('shadow',scene); m.disableLighting=true; m.diffuseColor=BABYLON.Color3.Black();
  m.emissiveColor=BABYLON.Color3.FromHexString('#2c3086'); m.alpha=.16; return m; })();
function blob(par,r){ const s=BABYLON.MeshBuilder.CreateDisc('sh',{radius:r,tessellation:28},scene); s.rotation.x=PI/2; s.position.y=.025;
  s.parent=par; s.material=shadowMat; s.isPickable=false; return s; }
/* cartoon outline for toy-like characters */
const OUTC=BABYLON.Color3.FromHexString('#2b2f78');
function outlineNode(n,w=.022,skip){
  n.getChildMeshes().forEach(m=>{ const mt=m.material; if(!mt||mt.alpha<1||mt.disableLighting||mt.diffuseTexture||m===skip) return;
    m.renderOutline=true; m.outlineWidth=w; m.outlineColor=OUTC; });
}

/* ---------------- particle textures ---------------- */
function mkTex(draw){ const t=new BABYLON.DynamicTexture('tx',64,scene,true); const c=t.getContext(); c.clearRect(0,0,64,64); draw(c); t.hasAlpha=true; t.update(); return t; }
const TEX={
  dot:mkTex(c=>{const g=c.createRadialGradient(32,32,0,32,32,30);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(1,'rgba(255,255,255,0)');c.fillStyle=g;c.fillRect(0,0,64,64);}),
  star:mkTex(c=>{c.fillStyle='#fff';c.beginPath();for(let i=0;i<10;i++){const r=i%2?12:29,a=-PI/2+i*PI/5;c.lineTo(32+r*Math.cos(a),33+r*Math.sin(a));}c.closePath();c.fill();}),
  heart:mkTex(c=>{c.fillStyle='#fff';c.beginPath();c.moveTo(32,56);c.bezierCurveTo(2,36,6,8,32,22);c.bezierCurveTo(58,8,62,36,32,56);c.fill();}),
  bubble:mkTex(c=>{c.strokeStyle='#fff';c.lineWidth=5;c.beginPath();c.arc(32,32,24,0,7);c.stroke();c.fillStyle='rgba(255,255,255,.35)';c.fill();c.fillStyle='#fff';c.beginPath();c.arc(23,23,5,0,7);c.fill();}),
};
function burst(pos,{tex='star',count=34,c1=[1,.82,.2],c2=[1,.5,.7],power=7,life=1,size=.55,grav=-7,sphere=false,std=false}={}){
  const n=QUAL==='low'?Math.ceil(count*.5):count;
  const ps=new BABYLON.ParticleSystem('burst',n+8,scene); ps.particleTexture=TEX[tex]||tex; ps.emitter=pos.clone();
  ps.color1=new BABYLON.Color4(c1[0],c1[1],c1[2],1); ps.color2=new BABYLON.Color4(c2[0],c2[1],c2[2],1); ps.colorDead=new BABYLON.Color4(c2[0],c2[1],c2[2],0);
  ps.minSize=size*.5; ps.maxSize=size; ps.minLifeTime=life*.5; ps.maxLifeTime=life; ps.emitRate=0; ps.manualEmitCount=n;
  if(sphere){ ps.direction1=V3(-1,-1,-1); ps.direction2=V3(1,1,1); } else { ps.direction1=V3(-1,.6,-1); ps.direction2=V3(1,2,1); }
  ps.minEmitPower=power*.4; ps.maxEmitPower=power; ps.updateSpeed=.02;
  if(std) ps.blendMode=BABYLON.ParticleSystem.BLENDMODE_STANDARD;
  ps.gravity=V3(0,grav,0); ps.minAngularSpeed=-4; ps.maxAngularSpeed=4; ps.targetStopDuration=life; ps.start();
  killPS(ps,life*1000+400);
}
/* dispose a particle system later WITHOUT disposing its (shared) texture -
   "disposeOnStop" would also destroy the shared texture, so later bursts could vanish */
function killPS(ps,ms){ setTimeout(()=>{ try{ ps.dispose(false); }catch(e){} },ms); }
TEX.ring=mkTex(c=>{c.strokeStyle='#fff';c.lineWidth=7;c.beginPath();c.arc(32,32,26,0,7);c.stroke();});
TEX.petal=mkTex(c=>{const g=c.createRadialGradient(32,32,2,32,32,26);g.addColorStop(0,'rgba(255,255,255,.95)');g.addColorStop(1,'rgba(255,255,255,0)');
  c.fillStyle=g;c.save();c.translate(32,32);c.rotate(.6);c.scale(1,.5);c.translate(-32,-32);c.beginPath();c.arc(32,32,26,0,7);c.fill();c.restore();});
TEX.streak=mkTex(c=>{const g=c.createLinearGradient(0,0,64,0);g.addColorStop(0,'rgba(255,255,255,0)');g.addColorStop(.7,'rgba(255,255,255,.85)');g.addColorStop(1,'rgba(255,255,255,1)');
  c.fillStyle=g;c.fillRect(0,26,64,12);});
/* expanding impact ring that always faces the camera */
function shock(pos,{color='#ffffff',size=3,ms=380}={}){
  const p=BABYLON.MeshBuilder.CreatePlane('shock',{size:1},scene), m=new BABYLON.StandardMaterial('shk',scene);
  m.diffuseTexture=TEX.ring; m.useAlphaFromDiffuseTexture=true; m.emissiveColor=BABYLON.Color3.FromHexString(color); m.disableLighting=true; m.backFaceCulling=false;
  p.material=m; p.billboardMode=BABYLON.Mesh.BILLBOARDMODE_ALL; p.position.copyFrom(pos); p.isPickable=false;
  tween(ms,k=>{ const s=.3+k*size; p.scaling.set(s,s,s); m.alpha=1-k; },E.out).then(()=>{ m.dispose(); p.dispose(); });
}
/* hit-freeze: the game briefly crawls so big impacts feel heavy */
let slowMul=1, slowT=null;
function freeze(ms,scale=.04){ slowMul=scale; clearTimeout(slowT); slowT=setTimeout(()=>{ slowMul=1; },ms); }
function flash(color='#ffffff',op=.55){ const f=$('flash'); f.style.transition='none'; f.style.background=color; f.style.opacity=op; void f.offsetWidth; f.style.transition='opacity .45s'; f.style.opacity=0; }
/* speed streaks behind the hero while dashing */
const streak=new BABYLON.ParticleSystem('streak',160,scene);
streak.particleTexture=TEX.streak; streak.emitter=V3(0,0,0); streak.billboardMode=BABYLON.ParticleSystem.BILLBOARDMODE_STRETCHED;
streak.minEmitBox=V3(-.3,.1,-.9); streak.maxEmitBox=V3(.3,2.4,.9); streak.direction1=V3(-1,0,-.05); streak.direction2=V3(-1,.04,.05);
streak.minEmitPower=14; streak.maxEmitPower=22; streak.minLifeTime=.16; streak.maxLifeTime=.3; streak.minSize=.6; streak.maxSize=1;
streak.minScaleX=3; streak.maxScaleX=6; streak.minScaleY=.06; streak.maxScaleY=.12; streak.emitRate=0;
streak.color1=new BABYLON.Color4(.3,.34,.85,.65); streak.color2=new BABYLON.Color4(1,1,1,.8); streak.colorDead=new BABYLON.Color4(.3,.34,.85,0);
streak.start();
/* slow falling petals / light flakes for dreaminess */
const petals=new BABYLON.ParticleSystem('petals',90,scene);
petals.particleTexture=TEX.petal; petals.emitter=V3(0,0,0); petals.minEmitBox=V3(-13,4,-4); petals.maxEmitBox=V3(13,6.5,6);
petals.direction1=V3(-.5,-.5,0); petals.direction2=V3(.2,-.15,0); petals.minEmitPower=.3; petals.maxEmitPower=.8; petals.gravity=V3(0,-.12,0);
petals.minSize=.22; petals.maxSize=.5; petals.minLifeTime=8; petals.maxLifeTime=13; petals.emitRate=8; petals.minAngularSpeed=-1.5; petals.maxAngularSpeed=1.5;
petals.color1=new BABYLON.Color4(1,1,1,.7); petals.color2=new BABYLON.Color4(.82,.86,1,.55); petals.colorDead=new BABYLON.Color4(1,1,1,0);
petals.preWarmCycles=120; petals.preWarmStepOffset=10; petals.start();
