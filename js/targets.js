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
  cy(.8,1,.14,dark,root,0,.07,0); cy(.3,.34,1.05,wood,root,0,.64,0); bx(1.3,.2,.2,wood,root,0,1.05,0);
  const head=sp(.64,light,root,0,1.55,0); [-1,1].forEach(s=>sp(.09,ink,root,s*.12,1.6,-.28));
  bx(.22,.04,.04,ink,root,0,1.42,-.3);
  tor(.42,.1,M(BTN[btn].color,.7),root,0,.55,0);
  const card=pl(1.55,1.55,cardMat(letter,btn),root,0,3.05,0); card.billboardMode=BABYLON.Mesh.BILLBOARDMODE_ALL;
  const glow=BABYLON.MeshBuilder.CreateDisc('glow',{radius:1,tessellation:28},scene); glow.rotation.x=PI/2; glow.position.y=.035;
  glow.parent=root; glow.material=GM(BTN[btn].color,.28); glow.isPickable=false;
  blob(root,.7); outlineNode(root,.022,card);
  return {root,card,letter,btn,alive:true,hint:false,t:Math.random()*5};
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
  const b=bossBase(root,wob); b.name='Grumpy Homework Monster'; return b;
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
  const b=bossBase(root,wob); b.name='Sleepy T-Rex Egg'; b.zs=zs;
  const baseHit=b.hit; b.hit=async function(n){ for(let i=0;i<Math.min(n,cracks.length);i++) cracks[i].setEnabled(true); await baseHit(); };
  b.defeat=async function(){
    SFX.bossHit(); await tween(700,k=>{ wob.rotation.z=Math.sin(k*PI*14)*.22*k; wob.scaling.y=1+k*.12; });
    const p=root.position; burst(V3(p.x,p.y+2,p.z-1),{count:70,power:9,size:.9,c1:[1,1,1],c2:[.7,.8,1]}); SFX.pop(); wob.setEnabled(false); zs.forEach(z=>z.setEnabled(false));
    const baby=nd(root,0,0,-.6), mint=M('#9be8c0',.5), mint2=M('#7bd4a4',.5);
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
const BOSSES=[bossHomework,bossPig,bossEgg];
