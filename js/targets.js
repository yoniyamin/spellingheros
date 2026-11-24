/* Letter dummies and the bosses.
   (plain script: shares the global scope with the other files in js/, load order matters - see index.html) */
'use strict';

/* =====================================================================
   DUMMIES (letter targets)
   ===================================================================== */
function roundRect(c,x,y,w,h,r){ c.beginPath(); c.moveTo(x+r,y); c.arcTo(x+w,y,x+w,y+h,r); c.arcTo(x+w,y+h,x,y+h,r); c.arcTo(x,y+h,x,y,r); c.arcTo(x,y,x+w,y,r); c.closePath(); }
function drawSym(c,btn,cx,cy,r,color){
  c.lineWidth=r*.34; c.strokeStyle=color; c.lineCap='round'; c.lineJoin='round'; c.beginPath();
  if(btn===0){ c.moveTo(cx-r,cy-r); c.lineTo(cx+r,cy+r); c.moveTo(cx+r,cy-r); c.lineTo(cx-r,cy+r); }
  else if(btn===1){ c.arc(cx,cy,r,0,7); } else if(btn===2){ c.rect(cx-r,cy-r,2*r,2*r); }
  else { c.moveTo(cx,cy-r); c.lineTo(cx+r*1.1,cy+r*.8); c.lineTo(cx-r*1.1,cy+r*.8); c.closePath(); }
  c.stroke();
}
function cardMat(letter,btn){
  const t=new BABYLON.DynamicTexture('card',256,scene,true); const c=t.getContext(); c.clearRect(0,0,256,256);
  const col=BTN[btn].color;
  roundRect(c,10,10,236,236,34); c.fillStyle='#ffffff'; c.fill();
  const g=c.createLinearGradient(0,10,0,246); g.addColorStop(0,col+'10'); g.addColorStop(1,col+'66'); c.fillStyle=g; c.fill();
  c.save(); c.clip(); c.fillStyle='rgba(255,255,255,.55)'; c.beginPath(); c.ellipse(80,40,140,46,-.25,0,7); c.fill(); c.restore();
  roundRect(c,10,10,236,236,34); c.lineWidth=11; c.strokeStyle=col; c.stroke();
  c.fillStyle='#2d2f6b'; c.beginPath(); c.arc(54,54,36,0,7); c.fill(); drawSym(c,btn,54,54,14,col);
  c.font='bold 160px "Comic Sans MS","Trebuchet MS",Arial'; c.textAlign='center'; c.textBaseline='alphabetic';
  c.fillStyle='rgba(45,47,107,.22)'; c.fillText(letter,144,207);
  c.lineWidth=10; c.strokeStyle='#ffffff'; c.lineJoin='round'; c.strokeText(letter,138,200);
  c.fillStyle='#2d2f6b'; c.fillText(letter,138,200);
  t.hasAlpha=true; t.update();
  const m=new BABYLON.StandardMaterial('cardM',scene); m.diffuseTexture=t; m.useAlphaFromDiffuseTexture=true; m.emissiveColor=BABYLON.Color3.White();
  m.disableLighting=true; m.backFaceCulling=false; return m;
}
function makeDummy(letter,btn){
  const root=nd(null,0,0,0), wood=M('#a9a0d8'), dark=M('#6c72c4'), light=M('#e8eaff'), ink=M('#1c1d3a',0);
  cy(.8,1,.14,dark,root,0,.07,0); cy(.3,.34,1.05,wood,root,0,.64,0); const arms=bx(1.3,.2,.2,wood,root,0,1.05,0);
  const head=sp(.64,light,root,0,1.55,0); [-1,1].forEach(s=>sp(.09,ink,root,s*.12,1.6,-.28));
  bx(.22,.04,.04,ink,root,0,1.42,-.3);
  tor(.42,.1,M(BTN[btn].color,.7),root,0,.55,0);
  const card=pl(1.55,1.55,cardMat(letter,btn),root,0,3.05,0); card.billboardMode=BABYLON.Mesh.BILLBOARDMODE_ALL;
  const glow=BABYLON.MeshBuilder.CreateDisc('glow',{radius:1,tessellation:28},scene); glow.rotation.x=PI/2; glow.position.y=.035;
  glow.parent=root; glow.material=GM(BTN[btn].color,.28); glow.isPickable=false;
  blob(root,.7); outlineNode(root,.022,card);
  return {root,card,letter,btn,arms,alive:true,hint:false,t:Math.random()*5};
}
function disposeDummy(d){ try{ d.card.material.dispose(true,true); }catch(e){} d.root.dispose(); }

/* =====================================================================
   BOSSES (all monochrome, glowing eyes)
   ===================================================================== */
function bossBase(root,wob){
  return {
    root,wob,baby:null,
    async hit(){ await tween(480,k=>{ wob.rotation.z=Math.sin(k*PI*5)*.18*(1-k); wob.scaling.y=1-Math.sin(k*PI)*.16; wob.scaling.x=1+Math.sin(k*PI)*.1; }); wob.rotation.z=0; wob.scaling.setAll(1); },
    async laugh(){ await tween(420,k=>{ wob.scaling.y=1+Math.sin(k*PI*2)*.07; wob.rotation.z=Math.sin(k*PI*4)*.05; }); wob.scaling.setAll(1); wob.rotation.z=0; },
    async defeat(){ SFX.bossHit(); const p0=root.position.clone();
      await tween(1300,k=>{ wob.rotation.z=k*9; wob.position.y=k*k*14; wob.position.x=k*6; wob.scaling.setAll(Math.max(.01,1-k*.5)); },E.in);
      burst(V3(p0.x+6,p0.y+10,p0.z),{count:60,power:9,size:.9}); shock(V3(p0.x+6,p0.y+10,p0.z-2),{color:'#ffffff',size:10,ms:700});
      flash('#ffffff'); freeze(260,.15); camPunch=1; wob.setEnabled(false); },
    dispose(){ root.dispose(); },
  };
}
function bossHomework(){
  const root=nd(null,0,0,0), wob=nd(root,0,0,0); const cols=['#6a70c4','#8a90dc','#5a60b0','#9aa0e8'];
  const sizes=[[3.4,.8,2.4],[3.1,.8,2.2],[2.8,.8,2.0],[2.6,.9,1.9]]; let y=0;
  sizes.forEach((s,i)=>{ y+=s[1]/2; const b=bx(s[0],s[1],s[2],M(cols[i]),wob,(i%2?.15:-.15),y,0); b.rotation.y=(i-1.5)*.06; y+=s[1]/2; });
  const white=M('#ffffff',.7), dark=M('#1c1d3a',0), glow=GM('#ff5a7a');
  [-1,1].forEach(s=>{ sp(.62,white,wob,s*.55,2.95,-1.0); sp(.3,dark,wob,s*.55,2.92,-1.27); sp(.12,glow,wob,s*.55,2.95,-1.38);
    const br=bx(.8,.14,.1,dark,wob,s*.58,3.35,-.99); br.rotation.z=s*.4; });
  bx(1.3,.34,.1,dark,wob,0,2.5,-.97); for(let i=0;i<4;i++) bx(.2,.2,.06,white,wob,-.45+i*.3,2.62,-1.02);
  [-1,1].forEach(s=>{ const a=nd(wob,s*1.9,1.8,0); a.rotation.z=s*.9; cy(.16,.16,2.5,M('#c3c7f6'),a); cy(0,.16,.35,M('#3a3f8f'),a,0,1.4,0); });
  rig_papers(wob);
  const mover=nd(wob,0,0,0); wob.getChildren().forEach(c=>{ if(c!==mover) c.parent=mover; });        // the wandering about moves everything but the hit / laugh wobble
  const b=bossBase(root,wob); b.name='Grumpy Homework Monster';
  const roam=bossRoam(b,{onLand:()=>bossPuff(b)}); b.roam=roam;
  b.idle=t=>{ roam.step(t,G.bossArrived); const S=roam.S; roamPose(S,mover,{waddle:.09,squash:.16}); if(S.name==='taunt') mover.rotation.z+=Math.sin(t*16)*.06*(1-Math.abs(S.u*2-1)); };   // taunting: the stack shivers with rage
  const hit0=b.hit, laugh0=b.laugh; b.hit=async function(...a){ roam.hold(.9); return hit0.apply(b,a); }; b.laugh=async function(...a){ roam.hold(.9); return laugh0.apply(b,a); };
  return b;
}
function rig_papers(wob){ const m=M('#ffffff',.8); for(let i=0;i<3;i++){ const p=pl(.8,1,m,wob,-2.2+i*2.2,4.2+i%2*.6,-.5); p.rotation.z=.4*i; } }
function bossBunny(){
  const root=nd(null,0,0,0), wob=nd(root,0,0,0), fl=M('#e6e8fc',.5), fl2=M('#d4d7f8',.5);
  sp(3.2,fl,wob,0,1.7,0,1,1.05,1);
  for(let k=0;k<22;k++){ const ph=Math.acos(1-2*(k+.5)/22), th=PI*(1+Math.sqrt(5))*k;
    sp(1.0+(k%3)*.15,k%2?fl:fl2,wob,1.55*Math.sin(ph)*Math.cos(th),1.7+1.65*Math.cos(ph),1.55*Math.sin(ph)*Math.sin(th)); }
  [-1,1].forEach(s=>{ const e=sp(.9,fl,wob,s*.8,3.9,0,1,2.6,.6); e.rotation.z=s*-.18; const i=sp(.5,M('#b4b9ee',.5),wob,s*.8,3.9,-.2,1,2.2,.4); i.rotation.z=s*-.18; });
  const white=M('#ffffff',.7), dark=M('#1c1d3a',0), glow=GM('#ff5a7a');
  [-1,1].forEach(s=>{ sp(.6,white,wob,s*.58,2.0,-1.45); sp(.3,dark,wob,s*.58,1.98,-1.72); sp(.1,glow,wob,s*.58,2.02,-1.82);
    const br=bx(.7,.12,.1,dark,wob,s*.58,2.5,-1.5); br.rotation.z=s*.4; });
  sp(.32,M('#8f95e0'),wob,0,1.55,-1.7); bx(.9,.14,.1,dark,wob,0,1.15,-1.6); [-1,1].forEach(s=>bx(.16,.22,.06,white,wob,s*.15,1.02,-1.62));
  const b=bossBase(root,wob); b.name='Giant Dust Bunny'; return b;
}
function bossEgg(){
  const root=nd(null,0,0,0), wob=nd(root,0,0,0), shell=M('#e9e6fb',.5), spot=M('#b9b6e6',.4);
  const surf=(x,y)=>{ const u=x/1.35, v=(y-1.9)/1.85, r=1-u*u-v*v; return -1.35*Math.sqrt(Math.max(r,0))-.01; };
  sp(2,shell,wob,0,1.9,0,1.35,1.85,1.35);
  for(let i=0;i<9;i++){ const th=i*2.4, ph=.5+((i*37)%10)/10*1.7; const x=1.35*Math.sin(ph)*Math.cos(th)*.95, y=1.9+1.85*Math.cos(ph);
    sp(.42+(i%3)*.12,spot,wob,x,y,surf(x,y)+.02,1,1,.25); }
  const dark=M('#1c1d3a',0);
  [-1,1].forEach(s=>{ const path=[]; for(let i=0;i<=8;i++){ const u=i/8*2-1; path.push(V3(s*.55+u*.28,2.3-.1*(1-u*u),surf(s*.55+u*.28,2.3)-.02)); }
    const t=BABYLON.MeshBuilder.CreateTube('eye',{path,radius:.035,tessellation:6},scene); t.material=dark; t.parent=wob; t.isPickable=false; });
  const zs=[]; for(let i=0;i<3;i++){ const t=new BABYLON.DynamicTexture('z',128,scene,true); const c=t.getContext(); c.clearRect(0,0,128,128);
    c.fillStyle='#ffffff'; c.strokeStyle='#6c72c4'; c.lineWidth=8; c.font='bold 100px "Comic Sans MS",Arial'; c.textAlign='center'; c.strokeText('Z',64,100); c.fillText('Z',64,100); t.hasAlpha=true; t.update();
    const m=new BABYLON.StandardMaterial('zm',scene); m.diffuseTexture=t; m.useAlphaFromDiffuseTexture=true; m.disableLighting=true; m.emissiveColor=BABYLON.Color3.White(); m.backFaceCulling=false;
    const z=pl(.7+i*.2,.7+i*.2,m,root,1.7+i*.45,4.2+i*.5,-.5); z.billboardMode=BABYLON.Mesh.BILLBOARDMODE_ALL; zs.push(z); }
  const cracks=[]; [[-.6,3.6],[.5,3.5],[-.1,3.1],[.9,2.7],[-.9,2.5]].forEach((st,n)=>{ const path=[]; let x=st[0],y=st[1];
    for(let i=0;i<7;i++){ path.push(V3(x,y,surf(x,y)-.03)); x+=(i%2?.18:-.18)*(n%2?1:-1); y-=.25; }
    const t=BABYLON.MeshBuilder.CreateTube('crack',{path,radius:.045,tessellation:5},scene); t.material=M('#3a3f8f',0); t.parent=wob; t.isPickable=false; t.setEnabled(false); cracks.push(t); });
  const mover=nd(wob,0,0,0); wob.getChildren().forEach(c=>{ if(c!==mover) c.parent=mover; });        // the wandering about moves everything but the hit / laugh wobble
  const b=bossBase(root,wob); b.name='Sleepy T-Rex Egg'; b.zs=zs;
  /* the egg's routine (see bossRoam): it waddles from side to side, bounces, spins as it hops, rams the hero, and shakes with rage */
  const roam=bossRoam(b,{onLand:()=>bossPuff(b)}); b.roam=roam;
  b.idle=t=>{ roam.step(t,G.bossArrived); const S=roam.S; roamPose(S,mover,{waddle:.2,squash:.22});
    if(S.name==='taunt') mover.rotation.z+=Math.sin(t*22)*.1*Math.sin(S.u*PI); else if(S.name==='charge'&&S.u>.3&&S.u<.58) mover.rotation.z+=.16*Math.sin((S.u-.3)/.28*PI);   // shaking / leaning into the ram
    zs.forEach((z,i)=>{ z.position.x=1.7+i*.45+S.x; }); };
  const baseHit=b.hit; b.hit=async function(n){ roam.hold(.9); for(let i=0;i<Math.min(n,cracks.length);i++) cracks[i].setEnabled(true); await baseHit(); };
  const laugh0=b.laugh; b.laugh=async function(...a){ roam.hold(.9); return laugh0.apply(b,a); };
  b.defeat=async function(){
    roam.hold(99); SFX.bossHit(); await tween(700,k=>{ wob.rotation.z=Math.sin(k*PI*14)*.22*k; wob.scaling.y=1+k*.12; });
    const p=root.position; burst(V3(p.x+(b.off||0),p.y+2,p.z-1),{count:70,power:9,size:.9,c1:[1,1,1],c2:[.7,.8,1]}); SFX.pop(); wob.setEnabled(false); zs.forEach(z=>z.setEnabled(false));
    const baby=nd(root,b.off||0,0,-.6), mint=M('#9be8c0',.5), mint2=M('#7bd4a4',.5);
    sp(1.5,mint,baby,0,.95,0,1,1.1,1.2); sp(1.2,mint,baby,0,1.9,-.55); [-1,1].forEach(s=>{ sp(.42,M('#fff',.7),baby,s*.35,2.05,-1.05); sp(.2,M('#1c1d3a',0),baby,s*.35,2.03,-1.22); });
    const tail=cy(0,.8,1.5,mint2,baby,0,.9,.95); tail.rotation.x=-1.2; [-1,1].forEach(s=>{ const a=sp(.28,mint2,baby,s*.65,1.2,-.65,.7,1,.7); a.rotation.z=s*.4; });
    for(let i=0;i<4;i++) cy(0,.26,.34,mint2,baby,0,1.85-i*.28,.35+i*.32);
    bx(.7,.12,.1,M('#1c1d3a',0),baby,0,1.65,-1.2);
    baby.scaling.setAll(.01); b.baby=baby; await tween(500,k=>baby.scaling.setAll(k),E.back);
  };
  return b;
}
/* Grumpy Red Pig: the "Puglin" from Quaternius' Bestiary - Dungeon Monsters kit (models/Puglin.glb), in its red colour variant
   (models/Textures/Puglin-red.png). The model has no animation clips, so hit / laugh / defeat come from bossBase (wobbling the wob node).
   It loads asynchronously; if that fails (offline, no loaders script, file missing) the old Giant Dust Bunny takes its place. */
const PIG_SCALE=3.8, PIG_FACE=PI;     // PIG_FACE: turn about y (radians) so the pig looks at the camera (the model arrives facing away)
const PIG_ARMS=-1.15;                 // the model is in a T-pose: swing both upper arms down by this much (radians, about the bone's z axis)
const PIG_STOMP=3.2;                  // seconds between stomps (feet take turns)
const PIG_LEG=1, PIG_LEAN=1, PIG_TAP=1, PIG_LID=1;    // turn directions (+1 / -1) for knee-up, lean, club tap and lid closing
/* 3D eyes on top of the painted ones (those are tiny and stare at nothing). Measured from where the eye colour sits on the model,
   in the Head bone's space (x = side, y = up, z = forward, in model units): a glowing eyeball, a pupil that watches the hero and
   darts about, a highlight, and a grumpy slanted lid that blinks. */
const PIG_EYE={x:.135,y:.11,z:.125,r:.056};
const PIG_LID_REST=-.3;               // how far the lids hang down when the pig is just glaring (negative = swung back off the eyeball, PI/2 = shut). Was .3, which already covered most of the eye at rest
function pigEyes(head){
  const R=PIG_EYE.r, ball=GM('#ffb43a'), dark=GM('#1a0b12'), shine=GM('#ffffff'), lidM=M('#6a2230',.35);
  const list=[-1,1].map(s=>{
    const c=nd(head,s*PIG_EYE.x,PIG_EYE.y,PIG_EYE.z); sp(R*2,ball,c);
    const pupil=nd(c,0,0,R*.97); sp(R*.9,dark,pupil,0,0,0,1,1.2,.4); sp(R*.32,shine,pupil,R*.2,R*.26,R*.12);
    const tilt=nd(c,0,0,0); tilt.rotation.z=s*.38;               // slanted towards the snout: a cross look
    const hinge=nd(tilt,0,0,0);
    const lid=BABYLON.MeshBuilder.CreateSphere('pigLid',{diameter:R*2.5,segments:14,slice:.5,sideOrientation:BABYLON.Mesh.DOUBLESIDE},scene);
    lid._noOutline=true;   // tiny lid + the boss outline (.045 in model units, x3.8 scale) painted a thick blue "eyebrow" halo around it
    fin(lid,lidM,hinge,0,0,0); return {c,pupil,hinge,lx:0,ly:0};
  });
  const inv=new BABYLON.Matrix(), loc=new BABYLON.Vector3(), tgt=new BABYLON.Vector3();
  let nextBlink=1.5, blinkAt=-9, dartAt=0, dx=0, dy=0, glanceTill=-1, moodK='', moodTill=-1;
  return {
    mood(k,sec){ moodK=k; moodTill=G.t+sec; },
    update(t){
      // where to look: the hero's head most of the time, now and then a glare out at the player; small darts on top
      if(t>dartAt){ dartAt=t+.35+Math.random()*1.1; dx=(Math.random()-.5)*.25; dy=(Math.random()-.5)*.18; if(Math.random()<.12) glanceTill=t+1.2; }
      if(G.rig&&t>glanceTill) tgt.copyFrom(G.rig.root.position).addInPlaceFromFloats(0,2.2,0); else tgt.copyFrom(camera.position);
      head.getWorldMatrix().invertToRef(inv); BABYLON.Vector3.TransformCoordinatesToRef(tgt,inv,loc);
      list.forEach(e=>{
        const d=loc.subtract(e.c.position).normalize(), x=Math.max(-.6,Math.min(.6,d.x+dx)), y=Math.max(-.45,Math.min(.45,d.y+dy));
        e.lx+=(x-e.lx)*.35; e.ly+=(y-e.ly)*.35; e.pupil.position.set(e.lx*R*.97,e.ly*R*.97,Math.sqrt(Math.max(.05,1-e.lx*e.lx-e.ly*e.ly))*R*.97);
      });
      // lids: half shut and grumpy, a quick blink every few seconds (sometimes two), squeezed or smug when the boss reacts
      if(t>nextBlink){ blinkAt=t; nextBlink=t+(Math.random()<.25?.3:2+Math.random()*3.5); }
      let shut=t-blinkAt<.16?Math.sin((t-blinkAt)/.16*PI):0;
      if(t<moodTill) shut=Math.max(shut,moodK==='squeeze'?1:.55);
      const a=PIG_LID_REST+shut*(PI/2-PIG_LID_REST);
      list.forEach(e=>{ e.hinge.rotation.x=a*PIG_LID; });
    },
  };
}
function pigStompDust(b,foot){
  if(!foot||G.boss!==b||!G.bossArrived||QUAL==='low') return;
  const p=foot.getAbsolutePosition();
  burst(V3(p.x,.15,p.z-.3),{tex:'dot',count:8,power:2.2,size:.45,c1:[1,1,1],c2:[.82,.85,1],life:.55,grav:-1});
}
async function bossPig(){
  let root=null;
  try{
    const res=await glbImport('Puglin.glb');
    root=nd(null,0,0,0); const wob=nd(root,0,0,0), holder=nd(wob,0,0,0);
    holder.scaling.setAll(PIG_SCALE); holder.rotation.y=PIG_FACE; res.meshes[0].parent=holder;
    res.animationGroups.forEach(a=>a.stop());
    const bone=n=>res.transformNodes.find(t=>t.name===n), AX=BABYLON.Axis, RA=BABYLON.Quaternion.RotationAxis;
    [['upperarm_l',1],['upperarm_r',-1]].forEach(([n,s])=>{ const k=bone(n);                  // arms down (mirrored for the right arm)
      if(k&&k.rotationQuaternion) k.rotationQuaternion=k.rotationQuaternion.multiply(RA(AX.Z,PIG_ARMS*s)); });
    // bones the idle animation moves, with their rest rotation; pose(name,x,y,z) = rest rotation + turns about the bone's own x, y and z axes
    const rest={}; ['spine_01','spine_02','spine_03','neck_01','Head','upperarm_l','upperarm_r','lowerarm_l','lowerarm_r','thigh_l','thigh_r','calf_l','calf_r','foot_l','foot_r']
      .forEach(n=>{ const k=bone(n); if(k&&k.rotationQuaternion) rest[n]={k,q:k.rotationQuaternion.clone()}; });
    const pose=(n,x=0,y=0,z=0)=>{ const r=rest[n]; if(!r) return; let q=r.q; if(x) q=q.multiply(RA(AX.X,x)); if(y) q=q.multiply(RA(AX.Y,y)); if(z) q=q.multiply(RA(AX.Z,z)); r.k.rotationQuaternion=q; };
    const eyes=bone('Head')?pigEyes(bone('Head')):null;
    // false = no flip, like glTF. Wait until it has really loaded: an unloaded texture draws the pig black (or a red/black checker when it fails)
    let tex=null; await new Promise((ok,fail)=>{ const to=setTimeout(()=>fail(new Error('pig texture timed out')),20000);
      tex=new BABYLON.Texture(GLB_DIR+'Textures/Puglin-red.png',scene,true,false,BABYLON.Texture.TRILINEAR_SAMPLINGMODE,()=>{ clearTimeout(to); ok(); },(m,e)=>{ clearTimeout(to); fail(e||new Error(m||'pig texture failed')); }); });
    const old=[], mats=[]; res.meshes.forEach(m=>{ if(m.getTotalVertices&&m.getTotalVertices()>0){ if(m.material) old.push(m.material); glbToon(m,.003,tex); mats.push(m.material); } });
    old.forEach(m=>{ try{ m.dispose(true,true); }catch(e){} });                               // the model's own PBR materials and textures are not used
    holder.position.y=-.06;                                                                    // sink the soles a touch into the floor
    // a tight, darker contact shadow under the feet (the round shadow the game adds is big and faint, so the feet seemed to hover)
    const cm=new BABYLON.StandardMaterial('pigShadow',scene); cm.disableLighting=true; cm.diffuseColor=BABYLON.Color3.Black(); cm.emissiveColor=BABYLON.Color3.FromHexString('#1a1c5c'); cm.alpha=.42;
    const cs=BABYLON.MeshBuilder.CreateDisc('pigContact',{radius:1,tessellation:32},scene); cs.rotation.x=PI/2; cs.scaling.set(1.55,1.05,1); cs.position.set(0,.045,.1);   // after the x turn the disc's y scale runs along the floor's z
    cs.parent=root; cs.material=cm; cs.isPickable=false;
    const b=bossBase(root,wob); b.name='Grumpy Red Pig'; b.grounded=true;                      // feet on the floor: no hovering bob
    /* idle: the model has no clips, so move it by hand. Breathing, an impatient stomp (one foot lifts and slams down, the other foot
       next time, with a jolt and a puff of dust), leaning onto the standing leg, tapping the club, a slow grumpy look around.
       Only holder and the bones are touched here; wob belongs to hit / laugh / defeat. */
    const feet={'-1':bone('foot_r'),'1':bone('foot_l')}; let stomped=-1;
    b.idle=t=>{
      const br=Math.sin(t*2.3), sw=Math.sin(t*1.15);
      const cyc=Math.floor(t/PIG_STOMP), ph=t-cyc*PIG_STOMP, side=cyc%2?1:-1;          // side: +1 = the pig's left foot (glTF +x)
      const u=Math.min(ph/.6,1), lift=u<.7?Math.sin(u/.7*PI/2):Math.cos((u-.7)/.3*PI/2);   // slow up, fast slam down
      const imp=ph>.6?Math.exp(-(ph-.6)*9):0;                                              // landing jolt, fading out
      if(ph>.6&&stomped!==cyc){ stomped=cyc; pigStompDust(b,feet[side]); }
      const lean=Math.sin(Math.min(ph/.75,1)*PI);                                           // weight onto the standing leg while the other is up
      holder.scaling.set(PIG_SCALE*(1-br*.010+imp*.03),PIG_SCALE*(1+br*.018-imp*.05),PIG_SCALE*(1-br*.010+imp*.03));
      holder.rotation.z=sw*.02; holder.position.x=sw*.06;
      const L=side>0?'_l':'_r', R=side>0?'_r':'_l';
      pose('thigh'+L,-.95*lift*PIG_LEG); pose('calf'+L,1.35*lift*PIG_LEG); pose('foot'+L,-.4*lift*PIG_LEG);
      pose('thigh'+R); pose('calf'+R); pose('foot'+R);
      pose('spine_01',0,0,side*lean*.09*PIG_LEAN);
      pose('spine_02',imp*.10,Math.sin(t*.85)*.10); pose('spine_03',0,0,-sw*.06);
      // head: a slow look around, a little nod with the breath, jolted by the landing
      pose('Head',Math.sin(t*1.5)*.05+imp*.16,Math.sin(t*.7+1)*.28,Math.sin(t*.9)*.05);
      // arms swing a bit; the club hand (right) taps the club up and down twice between the stomps
      const tap=ph>1.4&&ph<2.6?Math.abs(Math.sin((ph-1.4)/1.2*PI*2))*.6:0;
      pose('upperarm_l',0,0,Math.sin(t*1.7)*.07+lean*side*.05); pose('upperarm_r',0,0,-Math.sin(t*1.7+.8)*.05);
      pose('lowerarm_r',tap*PIG_TAP); pose('lowerarm_l',Math.sin(t*1.7)*.08);
      if(eyes) eyes.update(t);
    };
    // the eyes react too: squeezed shut when hit, a smug squint when laughing, shut for good when defeated
    const hit0=b.hit, laugh0=b.laugh, defeat0=b.defeat;
    b.hit=async function(...a){ if(eyes) eyes.mood('squeeze',.55); return hit0.apply(b,a); };
    b.laugh=async function(...a){ if(eyes) eyes.mood('smug',.9); return laugh0.apply(b,a); };
    b.defeat=async function(...a){ if(eyes) eyes.mood('squeeze',99); return defeat0.apply(b,a); };
    const base=b.dispose; b.dispose=function(){ base(); mats.forEach(m=>{ try{ m.dispose(false,false); }catch(e){} }); try{ cm.dispose(); }catch(e){} try{ tex.dispose(); }catch(e){} };
    return b;
  }catch(e){ console.warn('pig model not used, using the dust bunny:',e); if(root) root.dispose(); return bossBunny(); }
}
/* Cheeky Green Imp: the "Imp" from the same Quaternius kit (models/Imp.glb, with the unused normal / ORM maps cut out so it is 1 MB instead of 9 MB;
   its green colour variant is models/Textures/Imp-green.png, downsized to 1024). It has the Puglin's skeleton and no animation clips either, so the
   idle is done by hand: it keeps hopping about (crouch, jump with the arms up, a squashy landing with a puff of dust), taps the mace and looks around.
   It is the first boss of the Haunted Forest. If it fails to load, the Giant Dust Bunny takes its place (same as the pig). */
const IMP_SCALE=3.1, IMP_FACE=PI;     // turned about y so the imp looks at the camera (like the pig, the model arrives facing away)
const IMP_ARMS=-1.15;                 // the model is in a T-pose: swing both upper arms down by this much (radians, about the bone's z axis)
const IMP_HOP=2.6;                    // seconds between hops
async function bossImp(){
  let root=null;
  try{
    const res=await glbImport('Imp.glb');
    root=nd(null,0,0,0); const wob=nd(root,0,0,0), mover=nd(wob,0,0,0), holder=nd(mover,0,0,0);     // mover: the wandering about (bossRoam); holder: the model itself
    holder.scaling.setAll(IMP_SCALE); holder.rotation.y=IMP_FACE; res.meshes[0].parent=holder;
    res.animationGroups.forEach(a=>a.stop());
    const bone=n=>res.transformNodes.find(t=>t.name===n), AX=BABYLON.Axis, RA=BABYLON.Quaternion.RotationAxis;
    [['upperarm_l',1],['upperarm_r',-1]].forEach(([n,s])=>{ const k=bone(n); if(k&&k.rotationQuaternion) k.rotationQuaternion=k.rotationQuaternion.multiply(RA(AX.Z,IMP_ARMS*s)); });
    const rest={}; ['spine_01','spine_02','spine_03','neck_01','Head','upperarm_l','upperarm_r','lowerarm_l','lowerarm_r','thigh_l','thigh_r','calf_l','calf_r','foot_l','foot_r']
      .forEach(n=>{ const k=bone(n); if(k&&k.rotationQuaternion) rest[n]={k,q:k.rotationQuaternion.clone()}; });
    const pose=(n,x=0,y=0,z=0)=>{ const r=rest[n]; if(!r) return; let q=r.q; if(x) q=q.multiply(RA(AX.X,x)); if(y) q=q.multiply(RA(AX.Y,y)); if(z) q=q.multiply(RA(AX.Z,z)); r.k.rotationQuaternion=q; };
    let tex=null; await new Promise((ok,fail)=>{ const to=setTimeout(()=>fail(new Error('imp texture timed out')),20000);
      tex=new BABYLON.Texture(GLB_DIR+'Textures/Imp-green.png',scene,true,false,BABYLON.Texture.TRILINEAR_SAMPLINGMODE,()=>{ clearTimeout(to); ok(); },(m,e)=>{ clearTimeout(to); fail(e||new Error(m||'imp texture failed')); }); });
    const old=[], mats=[]; res.meshes.forEach(m=>{ if(m.getTotalVertices&&m.getTotalVertices()>0){ if(m.material) old.push(m.material); glbToon(m,.003,tex); mats.push(m.material); } });
    old.forEach(m=>{ try{ m.dispose(true,true); }catch(e){} });
    const BASE_Y=-.02; holder.position.y=BASE_Y;
    const cm=new BABYLON.StandardMaterial('impShadow',scene); cm.disableLighting=true; cm.diffuseColor=BABYLON.Color3.Black(); cm.emissiveColor=BABYLON.Color3.FromHexString('#1a1c5c'); cm.alpha=.42;
    const cs=BABYLON.MeshBuilder.CreateDisc('impContact',{radius:1,tessellation:32},scene); cs.rotation.x=PI/2; cs.scaling.set(1.2,.85,1); cs.position.set(0,.045,.1);
    cs.parent=mover; cs.material=cm; cs.isPickable=false;
    const b=bossBase(root,wob); b.name='Cheeky Green Imp'; b.grounded=true;
    /* the imp's routine (see bossRoam): scampers to and fro with a proper leg cycle, long hops, spinning leaps with the arms up, charges at the hero
       and swings its mace, and taunts with wiggling arms. Legs / arms / head are posed every frame from what the routine says (S). */
    const roam=bossRoam(b,{onLand:()=>bossPuff(b)}); b.roam=roam;
    b.idle=t=>{
      roam.step(t,G.bossArrived); const S=roam.S, br=Math.sin(t*3.1);
      roamPose(S,mover,{squash:.17,waddle:.04});
      holder.scaling.set(IMP_SCALE*(1-br*.008),IMP_SCALE*(1+br*.016),IMP_SCALE*(1-br*.008)); holder.position.y=BASE_Y;
      const sh=1-Math.min(S.y,2)*.2; cs.scaling.set(1.2*sh,.85*sh,1);
      const w1=Math.sin(S.walk), w2=Math.sin(S.walk+PI), mv=S.v, c=Math.max(S.sq*.9,S.air*.6);            // c: how far the knees are bent
      pose('thigh_l',-.7*c-.8*w1*mv); pose('calf_l',1.0*c+1.1*Math.max(0,w1)*mv); pose('foot_l',-.3*c);
      pose('thigh_r',-.7*c-.8*w2*mv); pose('calf_r',1.0*c+1.1*Math.max(0,w2)*mv); pose('foot_r',-.3*c);
      pose('spine_01',.1*S.sq+mv*.08); pose('spine_02',.08*S.sq,Math.sin(t*.9)*.08+w1*mv*.12); pose('spine_03',0,0,Math.sin(t*1.3)*.04);
      pose('Head',Math.sin(t*1.7)*.05+S.sq*.12,Math.sin(t*.8+1)*.32*(1-mv),Math.sin(t*1.1)*.06);
      // arms: up in the air and when taunting (wiggling), swinging while it walks, the mace hand strikes during a charge
      const taunt=S.name==='taunt'?.55+.45*Math.sin(t*13):0, up=Math.max(S.air,taunt);
      const strike=S.name==='charge'&&S.u>.3&&S.u<.58?Math.sin((S.u-.3)/.28*PI):0;
      pose('upperarm_l',w1*mv*.5,0,up*.95+Math.sin(t*2.1)*.06*(1-mv)); pose('upperarm_r',w2*mv*.5-strike*1.7,0,-up*.95-Math.sin(t*2.1+.8)*.05*(1-mv));
      pose('lowerarm_r',strike*.9); pose('lowerarm_l',Math.sin(t*2.1)*.08);
    };
    const hit0=b.hit, laugh0=b.laugh; b.hit=async function(...a){ roam.hold(.9); return hit0.apply(b,a); }; b.laugh=async function(...a){ roam.hold(.9); return laugh0.apply(b,a); };
    const base=b.dispose; b.dispose=function(){ base(); mats.forEach(m=>{ try{ m.dispose(false,false); }catch(e){} }); try{ cm.dispose(); }catch(e){} try{ tex.dispose(); }catch(e){} };
    return b;
  }catch(e){ console.warn('imp model not used, using the dust bunny:',e); if(root) root.dispose(); return bossBunny(); }
}
function impLand(b){ bossPuff(b); }

/* =====================================================================
   BOSS ROUTINES. Every boss follows the hero (main.js) and, on top of that, wanders about by itself: it strides to and fro, hops,
   spins, charges at the hero and strikes, then walks back, and taunts now and then. bossRoam() is the "director": it picks the next
   move (never the same twice in a row), runs the clock for it and publishes the result in S (x / y / z offset, facing, squash, walk phase ...).
   What a move looks like is up to the boss: a model with animation clips plays the matching clip (see bossModel), the hand-built bosses
   pose their own bones or tilt their body (see roamPose and the imp). b.off is the sideways offset, so attacks can aim at the boss.
   ===================================================================== */
const ROAM_X=[-3.6,1.2];       // how far a boss may wander from its place: towards the hero (-), away from it (+; the screen ends not far behind it)
function bossPuff(b){          // a puff of dust and a small shake where the boss lands or strikes
  if(G.boss!==b||!G.bossArrived||QUAL==='low') return;
  const p=b.root.position; burst(V3(p.x+(b.off||0),.15,p.z-.5),{tex:'dot',count:14,power:3,size:.5,c1:[1,1,1],c2:[.82,.85,1],life:.6,grav:-1}); G.shake=Math.max(G.shake,.14);
}
function bossRoam(b,cfg={}){
  const S={x:0,y:0,z:0,face:0,spin:0,sq:0,v:0,run:0,air:0,walk:0,name:'rest',u:0,dur:1,from:0,to:0};
  /* A boss mostly stays where it is: it rests and makes threatening gestures ('taunt'), and now and then takes a small step, a small hop or leans in
     at the hero with a strike ('charge', a short one). The big run at the hero is only the final hit (bossWins in game.js); 'spin' is off. */
  const W=Object.assign({rest:2.4,taunt:3,stride:.4,hop:.4,charge:.7,spin:0},cfg.weights||{});
  let tPrev=null, hold=0, last='', phase=0, landed=false;
  const RX=[ROAM_X[0],cfg.xmax??ROAM_X[1]];                       // (a wide boss gets less room on the far side)
  const clampX=x=>Math.max(RX[0],Math.min(RX[1],x)), ease=u=>u<.5?2*u*u:1-Math.pow(-2*u+2,2)/2, lerp=(a,b,k)=>a+(b-a)*k;
  function pick(){
    const names=Object.keys(W).filter(n=>n!==last&&W[n]>0), tot=names.reduce((s,n)=>s+W[n],0); let r=Math.random()*tot;
    for(const n of names){ r-=W[n]; if(r<=0) return n; } return names[0];
  }
  function start(name){
    S.name=name; S.u=0; S.from=S.x; phase=0; landed=false; if(name!=='arrive') last=name;
    if(name==='rest') S.dur=1.3+Math.random()*1.7;
    else if(name==='stride'){ const lo=Math.max(RX[0],-1.2), hi=Math.min(RX[1],.5); let to, tries=0; do to=lerp(lo,hi,Math.random()); while(Math.abs(to-S.x)<.6&&tries++<10); S.to=to; S.dur=Math.max(1.2,Math.abs(to-S.x)/1.4); }   // a short step near its place
    else if(name==='hop'){ const dir=S.x>.3?-1:S.x<-.8?1:(Math.random()<.5?-1:1); S.to=clampX(S.x+dir*(.4+Math.random()*.5)); S.dur=1.1; }
    else if(name==='spin'){ S.to=clampX(S.x+(Math.random()-.5)*3.4); S.dur=1.35; }
    else if(name==='charge'){ S.to=clampX(S.x-.9); S.dur=2.1; }                  // leans in at the hero, strikes, steps back
    else if(name==='taunt') S.dur=1.8;
    else S.dur=99;                                    // 'arrive'
    if(cfg.onMove) cfg.onMove(name==='charge'?'run':name,S);
  }
  start('rest');
  return {S,
    hold(sec){ hold=Math.max(hold,sec); },                                      // freeze the routine (hit / laugh / defeat reactions)
    step(t,arrived){
      const dt=tPrev===null?.016:Math.min(.1,Math.max(0,t-tPrev)); tPrev=t;
      let ft=0; S.v=0; S.run=0; S.air=0; let sq=0;
      if(hold>0){ hold-=dt; if(hold<=0){ hold=0; start('rest'); } S.y*=.8; S.z*=.9; S.spin=0; }
      else if(!arrived){ if(S.name!=='arrive') start('arrive'); S.v=1; S.run=1; ft=1.1; }
      else {
        if(S.name==='arrive') start('taunt');
        S.u+=dt/S.dur; const u=Math.min(S.u,1), n=S.name;
        if(n==='stride'){ S.x=lerp(S.from,S.to,ease(u)); S.v=1; ft=(S.to<S.from?1:-1)*.95*Math.min(1,u*8,(1-u)*8); }
        else if(n==='hop'||n==='spin'){
          const a=.14, b=.86; if(u>a&&u<b){ const k=(u-a)/(b-a); S.y=Math.sin(k*PI)*(n==='spin'?2.1:1.2); S.x=lerp(S.from,S.to,k); S.air=1; if(n==='spin') S.spin=k*PI*2; } else { S.y=0; S.spin=0; S.x=u<=a?S.from:S.to; }
          sq=u<=a?Math.sin(u/a*PI/2):u>=b?1-(u-b)/(1-b):0;
          if(u>=b&&!landed){ landed=true; if(cfg.onLand) cfg.onLand(S); }
          ft=n==='hop'?(S.to<S.from?.5:-.5):0;
        }
        else if(n==='charge'){
          if(u<.3){ const k=ease(u/.3); S.x=lerp(S.from,S.to,k); S.z=-.45*k; S.v=1; S.run=1; ft=.6; }                              // step in at the hero
          else if(u<.58){ if(phase<1){ phase=1; if(cfg.onMove) cfg.onMove('strike',S); SFX.whoosh(); }
            const k=(u-.3)/.28; S.x=S.to-.3*Math.sin(Math.min(1,k*1.6)*PI); S.z=-.45; ft=.5; sq=k>.35&&k<.6?Math.sin((k-.35)/.25*PI)*.9:0;
            if(k>.38&&phase<2){ phase=2; bossPuff(b); } }
          else { if(phase<3){ phase=3; if(cfg.onMove) cfg.onMove('back',S); } const k=ease((u-.58)/.42); S.x=lerp(S.to,S.from,k); S.z=-.45*(1-k); S.v=1; ft=-.5; }   // back to its place
        }
        else if(n==='taunt'){ ft=Math.sin(u*PI*2)*.35; }
        if(S.u>=1){ S.y=0; S.spin=0; S.z=0; S.x=(n==='charge')?S.from:(S.x); start(pick()); }
      }
      S.sq+=(sq-S.sq)*Math.min(1,dt*18); S.face+=(ft-S.face)*Math.min(1,dt*(S.run?6:9));
      S.walk+=dt*(S.run?15:S.v?8.5:0); b.off=S.x;
    },
  };
}
/* hand-built bosses: turn S into a transform on the mover node (x / y / z, facing + spin, a squash, a waddle while moving) */
function roamPose(S,mover,o={}){
  mover.position.set(S.x,S.y,S.z); mover.rotation.y=S.face+S.spin; mover.rotation.z=Math.sin(S.walk)*(o.waddle||0)*S.v;
  const q=S.sq*(o.squash||.18); mover.scaling.set(1+q*.6,1-q,1+q*.6);
}

/* =====================================================================
   BOSS MODELS WITH ANIMATION CLIPS (Quaternius "Ultimate Monsters" and "Pirate Kit", CC0; models/Monsters, models/Pirates, made with tools/gltf2glb.py).
   The routine in bossRoam picks the moves, this plays the clip that fits (spec.clips = role -> clip names to try, in order):
   arrive/charge -> run, stride -> walk, hop/spin -> jump, strike -> punch, taunt -> wave / yes / no, hit -> hit, defeat -> death.
   The model is scaled to spec.height and stands on the floor. If it fails to load, the Giant Dust Bunny takes its place.
   ===================================================================== */
const BIG_CLIPS={idle:'Idle',walk:'Walk',run:'Run',jump:'Jump',punch:['Punch','Weapon'],wave:'Wave',yes:'Yes',no:'No',hit:'HitReact',death:'Death'};
const BOSS_FACE_SIGN=1;       // +1 / -1: which way a positive turn about y looks (so the boss faces the hero when it runs towards it)
async function bossModel(spec){
  let root=null;
  try{
    const res=await glbImport(spec.file);
    root=nd(null,0,0,0); const flat=nd(root,0,0,0), wob=nd(flat,0,0,0), mover=nd(wob,0,0,0), holder=nd(mover,0,0,0);
    const fix=nd(holder,0,0,0);                                                   // fix: moves the model's middle onto the holder's pivot, so that it turns on the spot
    holder.rotation.y=PI; res.meshes[0].parent=fix;                               // (the models arrive facing away from the camera, like the pig)
    const meshes=res.meshes.filter(m=>m.getTotalVertices&&m.getTotalVertices()>0);
    // scale to the wanted height and put the feet on the floor
    let lo=1e9,hi=-1e9,x0=1e9,x1=-1e9,z0=1e9,z1=-1e9;
    meshes.forEach(m=>{ m.computeWorldMatrix(true); const bb=m.getBoundingInfo().boundingBox; lo=Math.min(lo,bb.minimumWorld.y); hi=Math.max(hi,bb.maximumWorld.y);
      x0=Math.min(x0,bb.minimumWorld.x); x1=Math.max(x1,bb.maximumWorld.x); z0=Math.min(z0,bb.minimumWorld.z); z1=Math.max(z1,bb.maximumWorld.z); });
    fix.position.set((x0+x1)/2,0,(z0+z1)/2);                                       // (measured with the holder turned half a circle, so the centre is the mirror image)
    holder.rotation.y=spec.face??PI;
    /* Stay behind the letter signs (they stand at z=0, the boss at z=1.8) without moving back behind the scenery (z 2.5 and up): a big model is
       flattened a little along the depth (flat.scaling.z), so its front edge stays clear of the signs. From the camera in front this is hardly visible. */
    const k=spec.height/Math.max(.1,hi-lo), radius=Math.max(x1-x0,z1-z0)/2*k*1.1, zs=Math.max(.4,Math.min(1,1.35/radius,spec.zs||1));          // (spec.zs: for a model whose swinging weapon reaches far forward)
    flat.scaling.z=zs; holder.scaling.setAll(k); holder.position.y=-lo*k-.02;
    /* The colour map of these models is a tiny palette (every triangle points at one square of colour). Drawn as it is (smoothed, with mipmaps) it came out
       muddy and dark, so it is copied into a plain texture without smoothing, and lightened (spec.light) because the palette colours are on the dull side. */
    const olds=[], mats=[]; meshes.forEach(m=>{ if(m.material) olds.push(m.material); });
    const src=olds.map(m=>m.albedoTexture||m.diffuseTexture).find(Boolean); let tex=null;
    if(src){
      for(let i=0;i<60&&!src.isReady();i++) await wait(50);
      const px=await src.readPixels(), n=src.getSize().width, L=spec.light||1.25, out=new Uint8Array(n*n*4);
      for(let i=0;i<out.length;i+=4){ const r=px[i],g=px[i+1],bl=px[i+2], l=(r+g+bl)/3;
        out[i]=Math.min(255,(l+(r-l)*1.15)*L); out[i+1]=Math.min(255,(l+(g-l)*1.15)*L); out[i+2]=Math.min(255,(l+(bl-l)*1.15)*L); out[i+3]=255; }       // a little more colour, and lighter
      tex=new BABYLON.RawTexture(out,n,n,BABYLON.Engine.TEXTUREFORMAT_RGBA,scene,false,false,BABYLON.Texture.NEAREST_SAMPLINGMODE);
    }
    meshes.forEach(m=>{ glbToon(m,.003,tex); mats.push(m.material); });
    const cm=new BABYLON.StandardMaterial('bossShadow',scene); cm.disableLighting=true; cm.diffuseColor=BABYLON.Color3.Black(); cm.emissiveColor=BABYLON.Color3.FromHexString('#1a1c5c'); cm.alpha=.42;
    const cs=BABYLON.MeshBuilder.CreateDisc('bossContact',{radius:1,tessellation:32},scene); cs.rotation.x=PI/2; cs.scaling.set(spec.height*.3,spec.height*.2,1); cs.position.set(0,.045,.1);
    cs.parent=mover; cs.material=cm; cs.isPickable=false;
    // clips
    const grp={}; res.animationGroups.forEach(a=>{ grp[a.name]=a; a.stop(); a.targetedAnimations.forEach(t=>{ t.animation.enableBlending=true; t.animation.blendingSpeed=.09; }); });
    const clip=role=>{ const c=spec.clips[role]; return (Array.isArray(c)?c:[c]).map(n=>grp[n]).find(Boolean); };
    let cur=null;
    const play=(role,loop=true,speed=1)=>{ const g=clip(role)||clip('idle'); if(!g) return null;
      if(cur===g&&loop&&g.isStarted) return g; if(cur&&cur!==g) cur.stop(); else if(cur===g) g.stop(); cur=g; g.start(loop,speed); return g; };
    const b=bossBase(root,wob); b.name=spec.name; b.grounded=true;
    const roam=bossRoam(b,{weights:spec.weights,xmax:spec.xmax,
      onMove:(n)=>{ if(n==='taunt') play(rnd(['punch','punch','no']),true); else if(n==='hop'||n==='spin') play('jump',false,1.15); else if(n==='strike') play('punch',false,1.2);   // threatening: swings, head shakes
        else if(n==='arrive') play('run'); else if(n==='run'||n==='stride'||n==='back') play('walk'); else play('idle'); },
      onLand:()=>bossPuff(b)});
    b.roam=roam;
    b.idle=t=>{ roam.step(t,G.bossArrived); const S=roam.S, sh=spec.shift||0; mover.position.set(S.x+sh,S.y,S.z*.3); b.off=S.x+sh; mover.rotation.y=S.face*BOSS_FACE_SIGN+S.spin; cs.scaling.set(spec.height*.3*(1-Math.min(S.y,2)*.18),spec.height*.2*(1-Math.min(S.y,2)*.18)/zs,1); };
    const hit0=b.hit, laugh0=b.laugh;
    b.hit=async function(...a){ roam.hold(1); play('hit',false,1.1); return hit0.apply(b,a); };
    b.laugh=async function(...a){ roam.hold(1); play(rnd(['yes','wave']),false); return laugh0.apply(b,a); };
    b.defeat=async function(){                    // the real "death" clip, then a poof
      roam.hold(99); SFX.bossHit(); play('death',false,1); await wait(1250);
      const p0=root.position.clone(); const c=V3(p0.x+(b.off||0),p0.y+2.4,p0.z);
      burst(c,{count:60,power:9,size:.9}); shock(V3(c.x,c.y,c.z-2),{color:'#ffffff',size:10,ms:700}); flash('#ffffff'); freeze(260,.15); camPunch=1; wob.setEnabled(false);
    };
    const base=b.dispose; b.dispose=function(){ base(); res.animationGroups.forEach(a=>{ try{ a.stop(); a.dispose(); }catch(e){} }); mats.forEach(m=>{ try{ m.dispose(false,false); }catch(e){} }); olds.forEach(m=>{ try{ m.dispose(true,true); }catch(e){} }); try{ if(tex) tex.dispose(); }catch(e){} try{ cm.dispose(); }catch(e){} };
    play('run');
    return b;
  }catch(e){ console.warn('boss model not used, using the dust bunny:',spec.file,e); if(root) root.dispose(); return bossBunny(); }
}
const BIGSPEC=(file,name,height,extra)=>Object.assign({file:'Monsters/'+file+'.glb',name,height,clips:BIG_CLIPS,shift:-.9},extra);
const bossYeti=()=>bossModel(BIGSPEC('Yeti','Grumpy Yeti',5.8,{light:1.4,shift:-.7}));
const bossBarbarossa=()=>bossModel({file:'Pirates/Captain_Barbarossa.glb',name:'Captain Barbarossa',height:5.2,light:1.15,shift:-1,zs:.6,clips:Object.assign({},BIG_CLIPS,{punch:['Sword','Punch']})});
const bossPinkBlob=()=>bossModel({file:'Monsters/PinkBlob.glb',name:'Bouncy Pink Blob',height:4.4,light:1.7,shift:-1.5,weights:{hop:.9},
  clips:{idle:'Idle',walk:'Walk',run:'Walk',jump:'Jump',punch:'Bite_Front',wave:['Dance','Yes'],yes:'Yes',no:'No',hit:'HitRecieve',death:'Death'}});
const bossAlien=()=>bossModel(BIGSPEC('Alien','Wobbly Alien',5.2,{light:1.6}));
const bossDino=()=>bossModel(BIGSPEC('Dino','Dizzy Dino',5));
const bossOrc=()=>bossModel(BIGSPEC('Orc','Grumpy Orc',5.4));
const bossFrog=()=>bossModel(BIGSPEC('Frog','Hoppy Frog',4.6,{weights:{hop:1.1}}));
const BOSSES=[bossHomework,bossPig,bossEgg,bossImp,bossYeti,bossPinkBlob,bossBarbarossa,bossAlien,bossDino,bossOrc,bossFrog];
const EXTRA_BOSSES=[bossImp,bossEgg,bossAlien,bossDino,bossOrc,bossFrog];      // what turns up when the tour comes round to a place again (see bossForLevel in places.js)
