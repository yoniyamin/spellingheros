/* Main loop and start-up.
   (plain script: shares the global scope with the other files in js/, load order matters - see index.html) */
'use strict';

/* =====================================================================
   MAIN LOOP
   ===================================================================== */
HEROES.forEach(h=>{ const r=makeRig(h); r.root.rotation.y=PI; G.rigs.push(r); });
G.camTarget=0; layoutSelect(); fit(); setQuality(QUAL); try{ G.qualFixed=!!localStorage.getItem('sh_q2'); }catch(e){}
let lastTick=performance.now(), fpsAcc=0, fpsN=0, fpsT=0;
scene.onBeforeRenderObservable.add(()=>{
  const dtr=Math.min(engine.getDeltaTime()||16,50), dt=dtr*slowMul; G.t+=dt/1000;
  pollPad(); stepTweens(dt);
  camPunch*=Math.exp(-dtr/120); camera.fov=baseFov*(1-camPunch*.09);
  // auto-detect slow computers: every ~6 s of play, if below 28 fps step the graphics down one level (until Low)
  if(G.state==='play'&&!G.qualFixed&&QUAL!=='low'){ fpsT+=dtr; fpsAcc+=dtr; fpsN++;
    if(fpsT>6000){ const fps=1000/(fpsAcc/fpsN); fpsT=0; fpsAcc=0; fpsN=0;
      if(fps<28){ const nq=QUAL==='high'?'balanced':'low'; setQuality(nq); updateMenuLabels(); toast('Graphics set to '+QNAME[nq]+' for smoother play (press G to change)'); } else G.qualFixed=true; } }
  if((G.frame=(G.frame||0)+1)%12===0){ try{ Music.update(); }catch(e){} }
  if(paused) return;
  const sel=G.state==='select'||G.state==='shop'||G.state==='locker'||G.state==='title';
  G.rigs.forEach((r,i)=>{ if(!r.root.isEnabled()) return; updateRig(r,dt);
    if(sel){ const hot=(G.state==='select'||G.state==='shop')&&i===G.heroIdx, tgt=hot?1.3:1, s=r.root.scaling.x+(tgt-r.root.scaling.x)*.2; r.root.scaling.setAll(s);
      r.root.rotation.y+=((PI)-r.root.rotation.y)*.15; r.cheer=hot; }
  });
  G.camX+=(((G.camTarget||0)-G.camX)*(1-Math.exp(-dt/320)));
  G.shake*=.9; const sx=(Math.random()-.5)*G.shake, sy=(Math.random()-.5)*G.shake;
  camera.position.set(G.camX+sx,2.7+sy,-12.2); camT.set(G.camX,1.8,0); camera.setTarget(camT);
  if(G.state==='play'||G.state==='chest'||G.state==='busy'){ if(G.rig) G.camTarget=G.rig.root.position.x+5.5; }
  SEGS.forEach(s=>{ if(s.position.x<G.camX-26) s.position.x+=SEGN*4; });
  dust.emitter.x=G.camX; petals.emitter.x=G.camX+2; floor.position.x=Math.round((G.camX+14)/4)*4;
  sun.position.set(G.camX+4-sunDir.x*30,-sunDir.y*30,-1-sunDir.z*30);
  if(G.rig){ const rp=G.rig.root.position; streak.emitter.x=rp.x-.3; streak.emitter.y=rp.y; streak.emitter.z=rp.z; streak.emitRate=G.rig.dashing?90:0; }
  else streak.emitRate=0;
  // combo aura: flames around the hero from combo x3
  if(G.rig&&document.body.classList.contains('playing')){ const rp=G.rig.root.position; aura.emitter.set(rp.x,rp.y,rp.z); aura.emitRate=G.combo>=3?(QUAL==='low'?25:(G.combo>=5?90:55)):0; }
  else aura.emitRate=0;
  if(G.boss){ const b=G.boss, tx=G.rig.root.position.x+13.6; b.root.position.x+=(tx-b.root.position.x)*(1-Math.exp(-dt/450)); b.root.position.y=Math.sin(G.t*2)*.18+.1;
    if(!G.bossArrived&&Math.abs(tx-b.root.position.x)<1.5){ G.bossArrived=true; G.shake=.8; camPunch=.5; SFX.thud();
      burst(V3(b.root.position.x,.3,-1.5),{tex:'dot',count:40,power:6,size:.9,c1:[1,1,1],c2:[.8,.85,1],life:1.2,grav:-1}); shock(V3(b.root.position.x,.4,-2),{size:12,ms:700}); }
    if(b.zs) b.zs.forEach((z,i)=>{ z.position.y=4.2+i*.5+Math.sin(G.t*2+i)*.2; });
    if(b.baby) b.baby.position.y=Math.abs(Math.sin(G.t*6))*.45; }
  G.dummies.forEach(d=>{ if(!d.alive||!d.root) return; d.t+=dt/1000; if(!d.root.isDisposed()){ d.root.rotation.z=Math.sin(d.t*2.2)*.04;
      const hov=G.dummies[G.hover]===d&&!G.lock;
      if(d.hint){ const k=1+Math.sin(G.t*9)*.14+(hov?.1:0); d.card.scaling.set(k,k,k); }
      else { const k0=d.card.scaling.x, k=k0+((hov?1.15:1)-k0)*.25; d.card.scaling.set(k,k,k); } } });
});
engine.runRenderLoop(()=>scene.render());

refreshStats(); updateHints(); updateMenuLabels();
snapshotScene();          // remember what exists now, so resetToSelect() can remove everything a run adds
window.__ready=true;      // tells index.html that start-up worked (otherwise it shows the "could not start" screen)
