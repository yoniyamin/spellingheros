/* Main loop and start-up.
   (plain script: shares the global scope with the other files in js/, load order matters - see index.html) */
'use strict';

/* =====================================================================
   MAIN LOOP
   ===================================================================== */
HEROES.forEach(h=>{ const r=makeRig(h); r.root.rotation.y=PI; G.rigs.push(r); });
G.rigs.forEach(r=>{ if(r.hero.glb) upgradeRigToGlb(r); });     // swaps in the 3D model when it has loaded (async); the box hero is the fallback
/* the title's mascots: the four wardrobe pets fly in a row over the title. The page keeps empty slots (#title .pets) and every
   few frames each pet is placed in the 3D scene right behind its slot, so the row lines up on any screen (and when the page is turned). */
const TITLE_PETS=['dragon','chick','ghost','drone'].map((k,i)=>{
  const n=nd(null,0,6,0), own={spin:[],petWings:null}; PETS[k](n,own); n.scaling.setAll(1.6); n.rotation.y=PI; outlineNode(n,.018);
  return {n,own,ph:i*1.7,base:V3((i-1.5)*2.4,6,-1)}; });
let titlePetsOn=true;
function placeTitlePets(){
  const slots=document.querySelectorAll('#title .pets i');
  TITLE_PETS.forEach((p,i)=>{ const el=slots[i]; if(!el||!el.offsetWidth) return; const c=rectCenter(el);
    const ray=scene.createPickingRay(c.x,c.y,BABYLON.Matrix.Identity(),camera,false), t=(-1-ray.origin.z)/ray.direction.z;   // where the slot's line of sight meets z = -1
    p.base.copyFrom(ray.origin.add(ray.direction.scale(t)));
    const a=toScreen(p.base), b=toScreen(p.base.add(V3(0,1,0))), pxPerUnit=Math.max(1,Math.abs(a.y-b.y));    // size the pet to its slot (a pet is ~0.65 units tall)
    p.n.scaling.setAll(Math.max(.7,Math.min(2.2,el.offsetHeight/pxPerUnit/.65))); });
}
G.camTarget=0; layoutSelect(); fit(); setQuality(QUAL); try{ G.qualFixed=!!localStorage.getItem('sh_q2'); }catch(e){}
let lastTick=performance.now(), fpsAcc=0, fpsN=0, fpsT=0, goodWindows=0;
scene.onBeforeRenderObservable.add(()=>{
  const dtr=Math.min(engine.getDeltaTime()||16,50), dt=dtr*slowMul; G.t+=dt/1000;
  pollPad(); stepTweens(dt);
  camPunch*=Math.exp(-dtr/120); camera.fov=baseFov*(1-camPunch*.09);
  /* continuous auto-quality (previously a single one-shot check that then locked itself off forever):
     every ~4 s of gameplay, below 28 fps it first renders at fewer pixels (dynScale 1 -> 1.15 -> 1.3,
     which keeps all the pretty features) and only then drops a whole quality level; above 55 fps for
     three checks in a row it gives the sharpness back, so one busy finisher never ruins the picture.
     A quality the player picked themselves (G key / saved setting) is never touched. */
  if((G.state==='play'||G.state==='busy'||G.state==='chest')&&!G.qualFixed){ fpsT+=dtr; fpsAcc+=dtr; fpsN++;
    if(fpsT>4000){ const fps=1000/(fpsAcc/fpsN); fpsT=0; fpsAcc=0; fpsN=0;
      if(fps<28){ goodWindows=0;
        if(dynScale<dynMax()-.01) setDynScale(dynScale*1.15);
        else if(QUAL!=='low'){ const nq=QUAL==='high'?'balanced':'low'; setQuality(nq); updateMenuLabels(); toast('Graphics set to '+QNAME[nq]+' for smoother play (press G to change)'); } }
      else if(fps>55&&dynScale>1){ if(++goodWindows>=3){ goodWindows=0; setDynScale(dynScale/1.15); } }
      else goodWindows=0; } }
  if((G.frame=(G.frame||0)+1)%12===0){ try{ Music.update(); }catch(e){} }
  if(G.frame%30===0&&canvas.clientHeight>0){                      // the picture must never be stretched (see onViewport in corridor.js)
    const a=engine.getRenderWidth()/Math.max(1,engine.getRenderHeight()), b=canvas.clientWidth/canvas.clientHeight;
    if(Math.abs(a-b)>.02*b) applyResScale(); }
  if(paused) return;
  tickLetterTimer(dt);
  const onTitle=G.state==='title';
  if(onTitle!==titlePetsOn){ titlePetsOn=onTitle; TITLE_PETS.forEach(p=>p.n.setEnabled(onTitle)); }
  if(onTitle){ if(G.frame%15===1) placeTitlePets(); const t=G.t;
    TITLE_PETS.forEach(p=>{ const n=p.n; n.position.set(p.base.x+Math.sin(t*1.1+p.ph)*.18,p.base.y+Math.sin(t*2.6+p.ph)*.2,p.base.z);
      n.rotation.y=PI+Math.sin(t*1.3+p.ph)*.5; n.rotation.z=Math.sin(t*2.1+p.ph)*.12;
      if(p.own.petWings) p.own.petWings.forEach(w=>{ w.rotation.z=w.side*Math.sin(t*14+p.ph)*.6; });
      p.own.spin.forEach(s=>{ s.rotation.y+=dt*.03; }); }); }
  const sel=G.state==='select'||G.state==='venue'||G.state==='shop'||G.state==='locker'||G.state==='title';
  // hero select: a bouncing marker over the chosen hero (in the game frame, see toScreen)
  const mk=$('heroMark'), showMk=G.state==='select'&&G.rigs[G.heroIdx];
  if(showMk&&(G.frame%20===0||mk._hero!==G.heroIdx)){ mk._hero=G.heroIdx;      // above the hero's real top: hats, wings and a pet make it taller
    try{ const rg=G.rigs[G.heroIdx], inPet=m=>{ for(let n=m;n;n=n.parent) if(n===rg.pet) return true; return false; }; let top=2.6;   // (the floating pet does not count)
      rg.root.getChildMeshes(false).forEach(m=>{ if(!m.isEnabled()||!m.isVisible||inPet(m)) return; top=Math.max(top,m.getBoundingInfo().boundingBox.maximumWorld.y); });
      mk._top=Math.min(top,4.2); }catch(e){ mk._top=3.4; } }
  if(showMk){ const r=G.rigs[G.heroIdx].root.position, p=toScreen(V3(r.x,(mk._top||3.4)+.02+Math.abs(Math.sin(G.t*4))*.2,r.z)); mk.style.transform=`translate(${p.x.toFixed(1)}px,${p.y.toFixed(1)}px) translate(-50%,-100%)`; }
  if(mk._on!==!!showMk){ mk._on=!!showMk; mk.style.display=showMk?'block':'none'; }
  G.rigs.forEach((r,i)=>{ if(!r.root.isEnabled()) return; updateRig(r,dt);
    if(sel){ const hot=(G.state==='select'||G.state==='shop')&&i===G.heroIdx, tgt=hot?1.3:1, s=r.root.scaling.x+(tgt-r.root.scaling.x)*lerpK(.2,dtr); r.root.scaling.setAll(s);
      r.root.rotation.y+=((PI)-r.root.rotation.y)*lerpK(.15,dtr); r.cheer=hot; }
  });
  G.camX+=(((G.camTarget||0)-G.camX)*(1-Math.exp(-dt/320)));
  // camera shake: smooth layered wobble that dies away (random jitter every frame looked like stutter, worst at high refresh rates)
  G.shake*=Math.pow(.9,dtr/16.667); const st=G.t*1000/16.667, sh=G.shake*.5;
  const sx=(Math.sin(st*1.31)+Math.sin(st*2.17+1.7)*.6)*sh*.62, sy=(Math.sin(st*1.73+.5)+Math.sin(st*2.71+2.3)*.6)*sh*.62;
  // hero select: the camera tips down a little, so the heroes stand higher and the hero card + PLAY fit underneath them
  G.lookOff=(G.lookOff||0)+(((G.state==='select'||G.state==='shop')?(ROT.h<=500?-.55:-1):0)-(G.lookOff||0))*lerpK(.08,dtr);
  camera.position.set(G.camX+sx,camY+sy,-camDist); camT.set(G.camX+sx*.3,LOOKY+G.lookOff,0); camera.setTarget(camT);
  if(G.state==='play'||G.state==='chest'||G.state==='busy'){ if(G.rig) G.camTarget=G.rig.root.position.x+5.5; }
  SEGS.forEach(s=>{ if(s.position.x<G.camX-26) s.position.x+=SEGN*4; });
  dust.emitter.x=G.camX; petals.emitter.x=G.camX+2; floor.position.x=Math.round((G.camX+14)/4)*4; placeFollow(G.camX);
  sun.position.set(G.camX+4-sunDir.x*30,-sunDir.y*30,-1-sunDir.z*30);
  if(G.rig){ const rp=G.rig.root.position; streak.emitter.x=rp.x-.3; streak.emitter.y=rp.y; streak.emitter.z=rp.z; setEmit(streak,G.rig.dashing?90:0); }
  else setEmit(streak,0);
  // combo aura: flames around the hero from combo x3
  if(G.rig&&document.body.classList.contains('playing')){ const rp=G.rig.root.position; aura.emitter.set(rp.x,rp.y,rp.z); setEmit(aura,G.combo>=3?(QUAL==='low'?25:(G.combo>=5?90:55)):0); }
  else setEmit(aura,0);
  if(G.boss){ const b=G.boss, tx=G.rig.root.position.x+13.6; b.root.position.x+=(tx-b.root.position.x)*(1-Math.exp(-dt/450)); b.root.position.y=b.grounded?0:Math.sin(G.t*2)*.18+.1; if(b.idle) b.idle(G.t);   // grounded bosses (with feet) stay on the floor
    if(!G.bossArrived&&Math.abs(tx-b.root.position.x)<1.5){ G.bossArrived=true; G.shake=.8; camPunch=.5; SFX.thud();
      burst(V3(b.root.position.x,.3,-1.5),{tex:'dot',count:40,power:6,size:.9,c1:[1,1,1],c2:[.8,.85,1],life:1.2,grav:-1}); shock(V3(b.root.position.x,.4,-2),{size:12,ms:700}); }
    if(b.zs) b.zs.forEach((z,i)=>{ z.position.y=4.2+i*.5+Math.sin(G.t*2+i)*.2; });
    if(b.baby) b.baby.position.y=Math.abs(Math.sin(G.t*6))*.45; }
  G.dummies.forEach(d=>{ if(!d.alive||!d.root) return; d.t+=dt/1000; if(!d.root.isDisposed()){ d.root.rotation.z=Math.sin(d.t*2.2)*.04;
      const hov=G.dummies[G.hover]===d&&!G.lock;
      d.card.position.y=3.05+Math.sin(d.t*2.4)*.06;                                     // the signs float gently, each at its own pace
      if(d.hint){ const k=1+Math.sin(G.t*9)*.14+(hov?.1:0); d.card.scaling.set(k,k,k); }
      else { const k0=d.card.scaling.x, k=k0+((hov?1.15:1)-k0)*lerpK(.25,dtr); d.card.scaling.set(k,k,k); } } });
});
engine.runRenderLoop(()=>scene.render());

refreshStats(); updateHints(); updateMenuLabels();
snapshotScene();          // remember what exists now, so resetToSelect() can remove everything a run adds
window.__ready=true;      // tells index.html that start-up worked (otherwise it shows the "could not start" screen)
