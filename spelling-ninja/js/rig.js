/* LEGO-style hero rigs, cosmetics and the pose / move system.
   (plain script: shares the global scope with the other files in js/, load order matters - see index.html) */
'use strict';

/* =====================================================================
   LEGO-STYLE MINIFIGURE RIG
   ===================================================================== */
const SKIN='#ffd23f';
function baseBody(rig,c){
  const j=rig.j;
  [j.legR,j.legL].forEach(l=>{ bx(.4,.75,.5,M(c.leg),l,0,-.375,0); bx(.44,.14,.64,M(c.shoe),l,0,-.68,.06); });
  bx(.9,.22,.52,M(c.leg),j.body,0,.8,0);
  bx(.95,.9,.55,M(c.torso),j.upper,0,.47,0);
  [j.armR,j.armL].forEach(a=>{ bx(.28,.72,.34,M(c.arm),a,0,-.36,0); sp(.27,M(c.hand||SKIN),a,0,-.8,0,1,1,.9); });
  if(!c.hood) cy(.56,.56,.5,M(SKIN),j.head,0,.28,0);
  cy(.22,.22,.1,M(c.hood||SKIN),j.head,0,c.hood?.6:.58,0);
}
function face(j,{y=.32,mouth=true}={}){
  const dark=M('#1c1d3a',0);
  [-1,1].forEach(s=>{ sp(.09,dark,j.head,s*.1,y,.262,1,1.3,.5); sp(.035,GM('#ffffff'),j.head,s*.1+.02,y+.045,.287); });
  if(mouth){ const path=[]; for(let i=0;i<=8;i++){ const u=i/8*2-1, x=u*.12; path.push(V3(x,y-.17+.06*u*u,Math.sqrt(.28*.28-x*x)+.003)); }
    const t=BABYLON.MeshBuilder.CreateTube('mouth',{path,radius:.013,tessellation:6},scene); t.material=dark; t.parent=j.head; t.isPickable=false; }
}
function buildNinja(rig){
  const j=rig.j, red='#d8222d';
  baseBody(rig,{torso:red,arm:red,leg:'#b81822',shoe:'#26263f',hood:red});
  cy(.6,.6,.54,M(red),j.head,0,.27,0);
  bx(.42,.16,.1,M(SKIN),j.head,0,.33,.26);
  const dark=M('#1c1d3a',0); [-1,1].forEach(s=>{ sp(.09,dark,j.head,s*.1,.33,.312,1,1.3,.4); sp(.035,GM('#ffffff'),j.head,s*.1+.02,.375,.334); });
  cy(.64,.64,.1,M('#7a0d15'),j.head,0,.5,0);
  bx(1.0,.14,.6,M('#1d1d33'),j.upper,0,.12,0); bx(.2,.22,.1,M('#1d1d33'),j.upper,0,.12,.3);
  rig.tails=[]; for(let i=0;i<2;i++){ const t=nd(j.head,0,.5,-.3); t.rotation.y=(i?1:-1)*.25; bx(.1,.06,.55,M('#7a0d15'),t,0,0,-.27); rig.tails.push(t); }
}
function buildKnight(rig){
  const j=rig.j, steel='#bcc5db';
  baseBody(rig,{torso:steel,arm:'#aeb7d0',leg:'#6f7799',shoe:'#4b5275'});
  face(j);
  bx(.4,.4,.08,M('#3558d8'),j.upper,0,.5,.3); bx(.12,.3,.09,M('#ffd23f',.6),j.upper,0,.5,.31); bx(.3,.1,.09,M('#ffd23f',.6),j.upper,0,.55,.31);
  cy(.64,.64,.3,M(steel),j.head,0,.5,0); bx(.08,.28,.08,M(steel),j.head,0,.32,.29);
  bx(.1,.36,.6,M('#d8222d'),j.head,0,.82,-.05); bx(.16,.1,.3,M('#d8222d'),j.head,0,.68,-.3);
  const sw=nd(j.armR,0,-.8,0); bx(.14,.14,.14,M('#ffd23f',.6),sw); bx(.5,.1,.1,M('#ffd23f',.6),sw,0,0,.13);
  bx(.1,.12,.95,M('#eef1ff',.7),sw,0,0,.7); bx(.04,.04,.04,M('#fff'),sw,0,0,1.2);
  const sh=nd(j.armL,-.2,-.5,.05); bx(.1,.85,.65,M('#3558d8'),sh); bx(.12,.5,.1,M('#ffd23f',.6),sh,-.03,0,0); bx(.12,.1,.4,M('#ffd23f',.6),sh,-.03,0,0);
}
function buildPrincess(rig){
  const j=rig.j, pink='#ff86b8', hair='#6b3b1e', gold='#ffd23f';
  baseBody(rig,{torso:pink,arm:pink,leg:'#f4f0ff',shoe:'#d4a017',hand:'#ff3d6e'});
  [j.armR,j.armL].forEach(a=>sp(.4,M('#ff3d6e'),a,0,-.82,0.02));
  cy(.8,1.3,.55,M('#ff6fa8'),j.body,0,.75,0); cy(1.3,1.34,.08,M('#ffe0f0',.6),j.body,0,.5,0);
  bx(.95,.1,.58,M('#ffd23f',.6),j.upper,0,.1,0);
  face(j); [-1,1].forEach(s=>sp(.13,M('#ff9fc0',.6),j.head,s*.2,.2,.205,1,.6,.3));
  cy(.62,.62,.3,M(hair),j.head,0,.43,0); bx(.6,.6,.2,M(hair),j.head,0,.2,-.22); sp(.34,M(hair),j.head,0,.3,-.42);
  cy(.6,.6,.07,M(gold,.6),j.head,0,.6,0);
  [-.17,0,.17].forEach(x=>cy(0,.14,.16,M(gold,.6),j.head,x,.7,.15));
  const cape=nd(j.upper,0,.9,-.3); bx(.9,1.25,.06,M('#7b4fd6'),cape,0,-.62,0); bx(1.0,.1,.1,M('#ffd23f',.6),cape,0,0,0.02);
  rig.cape=cape;
}
const HEROES=[
  {id:'ninja',  name:'Kai the Red Ninja', desc:'Super-speedy karate chops!', build:buildNinja, finisher:'shuriken',
    glb:{model:'character-soldier', texture:'colormap-kai.png', scale:2.9, extras:glbNinjaExtras,   // Kenney soldier, recoloured red; mask, tails and katana added
         clips:{idle:'idle', move:'sprint', cheer:'emote-yes'}},
    moves:['spinChop','flyingKick','flurry','crane','hipBump','uppercut','tornadoSpin','dropKick','headbutt']},
  {id:'knight', name:'Saint Jordi the Knight', desc:'Shield bonks and silly sword swings!', build:buildKnight, finisher:'beam',
    glb:{model:'character-knight', scale:2.9, sword:true, shield:true,   // Kenney mini-character (CC0); the box-built knight above is the fallback
         clips:{idle:'idle', move:'sprint', cheer:'emote-yes'}},
    moves:['swordSpin','shieldBash','swordChop','hipBump','groundPound','headbutt','uppercut']},
  {id:'princess',name:'Princess Aina', desc:'Flips, kicks and boxing gloves!', build:buildPrincess, finisher:'sparkle',
    glb:{model:'character-female-b', texture:'colormap-aina.png', scale:2.9, extras:glbPrincessExtras,   // Kenney female-b, recoloured pink; skirt, crown and cape added
         clips:{idle:'idle', move:'sprint', cheer:'emote-yes'}},
    moves:['flipKick','flurry','spinChop','crane','hipBump','cartwheel','groundPound','tornadoSpin']},
];
function makeRig(hero){
  const rig={hero,t:Math.random()*10,busy:false,moving:false,cheer:false,cos:[],spin:[],tails:[],cape:null,scarfTail:null,trailPS:null,lastMove:null,
             pet:null,petWings:null,wings:null,backCape:null,jetPS:null,halo:null};
  const root=nd(null,0,0,0); const body=nd(root,0,0,0);
  const j={body}; j.legR=nd(body,.22,.75,0); j.legL=nd(body,-.22,.75,0); j.upper=nd(body,0,.78,0);
  j.armR=nd(j.upper,.63,.86,0); j.armL=nd(j.upper,-.63,.86,0); j.head=nd(j.upper,0,.94,0);
  rig.j=j; rig.root=root; hero.build(rig); outlineNode(root); blob(root,.8);
  if(hero.glb) rig.lego=root.getChildMeshes();     // remembered so they can be hidden once the .glb model has loaded (or kept if it fails)
  rig.pod=nd(root,0,0,0); cy(1.7,1.9,.16,M('#aab0ee',.4),rig.pod,0,.04,0,36); tor(1.72,.07,GM('#ffffff'),rig.pod,0,.125,0); rig.pod.setEnabled(false);
  const tn=BABYLON.MeshBuilder.CreateBox('tn',{size:.01},scene); tn.isVisible=false; tn.parent=root; tn.position.set(0,.4,-.35); rig.trailNode=tn;
  applyCosmetics(rig); return rig;
}

/* ---- cosmetics ---- */
const HATS={
  party:(n)=>{ cy(0,.46,.62,M('#ff6fb5'),n,0,.85,0); sp(.15,M('#ffd23f',.7),n,0,1.18,0); cy(.47,.47,.07,M('#ffd23f',.6),n,0,.56,0); },
  cat:(n)=>{ [-1,1].forEach(s=>{ const e=cy(0,.26,.34,M('#3f4390'),n,s*.2,.78,0,4); e.rotation.z=-s*.25; const i=cy(0,.14,.2,M('#ff9fc8'),n,s*.2,.76,-.05,4); i.rotation.z=-s*.25; }); },
  tophat:(n)=>{ cy(.82,.82,.06,M('#2a2d55'),n,0,.55,0); cy(.5,.5,.5,M('#2a2d55'),n,0,.8,0); cy(.52,.52,.12,M('#d8222d'),n,0,.62,0); },
  prop:(n,rig)=>{ cy(.5,.6,.2,M('#3aa6ff'),n,0,.62,0); sp(.12,M('#ffd23f',.7),n,0,.76,0);
    const p=nd(n,0,.84,0); bx(.9,.03,.14,M('#ff6b6b'),p); bx(.14,.03,.9,M('#ffd23f'),p); rig.spin.push(p); },
  wizard:(n)=>{ cy(.84,.84,.05,M('#5b3fd0'),n,0,.55,0); const c=cy(0,.52,.95,M('#5b3fd0'),n,0,1.05,0); c.rotation.z=.12; cy(.54,.54,.1,M('#ffd23f',.6),n,0,.62,0);
    sp(.18,M('#ffd23f',.8),n,.0,.8,.27); },
  crown:(n)=>{ cy(.6,.6,.14,M('#ffd23f',.7),n,0,.6,0); for(let i=0;i<5;i++){const a=i/5*PI*2; cy(0,.16,.24,M('#ffd23f',.7),n,Math.cos(a)*.24,.78,Math.sin(a)*.24); sp(.07,M('#d8222d'),n,Math.cos(a)*.24,.93,Math.sin(a)*.24);} },
  pirate:(n)=>{ const k=M('#23243f'); cy(.95,.95,.06,k,n,0,.57,0); cy(.52,.66,.34,k,n,0,.76,0); bx(.96,.2,.1,k,n,0,.7,.28);
    sp(.17,M('#ffffff',.7),n,0,.76,.34); [-1,1].forEach(s=>{ const b=bx(.24,.04,.03,M('#ffffff',.7),n,0,.64,.35); b.rotation.z=s*.5; }); },
  viking:(n)=>{ const st=M('#bcc5db',.3), cr=M('#fff3d6',.5); sp(.7,st,n,0,.5,0,1,.78,1); cy(.72,.72,.08,M('#ffd23f',.6),n,0,.5,0);
    [-1,1].forEach(s=>{ const h=cy(0,.17,.52,cr,n,s*.43,.74,0); h.rotation.z=-s*.95; }); },
  unicorn:(n)=>{ const h=cy(0,.2,.7,M('#fff6fb',.6),n,0,.92,.12); h.rotation.x=.3; tor(.22,.05,M('#ff8fd0',.6),n,0,.72,.07);
    ['#ff8fab','#ffe27a','#7cc8ff','#b79cff'].forEach((c,i)=>sp(.26,M(c,.5),n,0,.62-i*.13,-.3-i*.03)); },
  astro:(n)=>{ sp(1.08,M('#bfe6ff',.35,.3),n,0,.3,0); tor(.8,.12,M('#ffffff',.5),n,0,-.06,0); bx(.03,.22,.03,M('#c9d1ea'),n,.2,.88,0); sp(.1,GM('#ff4d6d'),n,.2,1.0,0); },
  halo:(n,rig)=>{ rig.halo=tor(.62,.07,GM('#ffe066'),n,0,1.0,0); },
};
const BACKS={
  cape:(n,rig)=>{ const c=nd(n,0,0,0); bx(.95,1.35,.06,M('#e0242f'),c,0,-.66,0); bx(1.0,.1,.1,M('#ffd23f',.6),c,0,0,.02); rig.backCape=c; },
  wings:(n,rig)=>{ rig.wings=[-1,1].map(s=>{ const w=nd(n,s*.12,-.25,0); w.side=s; sp(.9,M('#ffffff',.55),w,s*.42,.12,0,1,.5,.12); sp(.65,M('#eef1ff',.55),w,s*.36,-.22,0,1,.45,.1); return w; }); },
  batwings:(n,rig)=>{ rig.wings=[-1,1].map(s=>{ const w=nd(n,s*.12,-.25,0); w.side=s; sp(.9,M('#5a3a92',.3),w,s*.42,.1,0,1,.45,.1);
    for(let k=0;k<3;k++) sp(.32,M('#7a55c0',.3),w,s*(.2+k*.27),-.18,0,1,.8,.12); return w; }); },
  jetpack:(n,rig)=>{ const st=M('#c9d1ea',.4), rd=M('#ff4d4d',.4); bx(.5,.6,.16,M('#8f95dc',.3),n,0,-.35,.02);
    [-1,1].forEach(k=>{ cy(.3,.3,.75,st,n,k*.2,-.4,-.1); cy(0,.3,.25,rd,n,k*.2,.1,-.1); cy(.22,.16,.12,M('#5b61b0'),n,k*.2,-.83,-.1); });
    const em=BABYLON.MeshBuilder.CreateBox('je',{size:.01},scene); em.isVisible=false; em.isPickable=false; em.parent=n; em.position.set(0,-.95,-.1);
    const ps=new BABYLON.ParticleSystem('jet',120,scene); ps.particleTexture=TEX.dot; ps.emitter=em; ps.minEmitBox=V3(-.25,0,-.05); ps.maxEmitBox=V3(.25,0,.05);
    ps.color1=new BABYLON.Color4(1,.85,.3,1); ps.color2=new BABYLON.Color4(1,.35,.1,1); ps.colorDead=new BABYLON.Color4(.6,.6,.8,0);
    ps.direction1=V3(-.15,-1,-.15); ps.direction2=V3(.15,-1.6,.15); ps.minEmitPower=1.5; ps.maxEmitPower=3; ps.minLifeTime=.12; ps.maxLifeTime=.3;
    ps.minSize=.15; ps.maxSize=.35; ps.emitRate=0; ps.updateSpeed=.02; ps.start(); rig.jetPS=ps; },
};
const PETS={
  dragon:(n,rig)=>{ const g=M('#5fd38a',.35), g2=M('#3fae6a',.35), y=M('#ffe27a',.5), dk=M('#1c1d3a',0);
    sp(.55,g,n,0,0,0,1,.9,1.1); sp(.42,g,n,0,.22,.3); sp(.22,y,n,0,.14,.5,1,.7,.8);
    [-1,1].forEach(s=>{ sp(.09,dk,n,s*.1,.3,.48); cy(0,.08,.16,y,n,s*.1,.46,.26); });
    rig.petWings=[-1,1].map(s=>{ const w=nd(n,s*.2,.12,-.05); w.side=s; sp(.5,g2,w,s*.24,0,0,1,.15,.7); return w; });
    const tl=cy(0,.18,.5,g2,n,0,-.05,-.42); tl.rotation.x=-1.3; },
  drone:(n,rig)=>{ const st=M('#c9d1ea',.35), dk=M('#5b61b0',.3); bx(.5,.3,.45,st,n); sp(.2,GM('#4de8ff'),n,0,0,.23,1,1,.4); bx(.06,.25,.06,dk,n,0,.26,0);
    const p=nd(n,0,.4,0); bx(.7,.03,.1,M('#ff6b6b'),p); bx(.1,.03,.7,M('#ff6b6b'),p); rig.spin.push(p); },
  ghost:(n)=>{ const w=M('#ffffff',.6,.85); sp(.6,w,n,0,.05,0); cy(.6,.6,.3,w,n,0,-.18,0,16); [-.18,0,.18].forEach(x=>sp(.2,w,n,x,-.33,0));
    [-1,1].forEach(s=>sp(.12,M('#1c1d3a',0),n,s*.12,.12,.27,1,1.4,.5)); sp(.1,M('#ff9fc0',.6),n,0,-.02,.29,1,.6,.4); },
  chick:(n,rig)=>{ const y=M('#ffe066',.45); sp(.55,y,n,0,0,0); sp(.14,y,n,0,.3,0); const bk=cy(0,.14,.18,M('#ff9f1c',.5),n,0,-.02,.3); bk.rotation.x=PI/2;
    [-1,1].forEach(s=>sp(.09,M('#1c1d3a',0),n,s*.11,.1,.24)); rig.petWings=[-1,1].map(s=>{ const w=nd(n,s*.26,0,0); w.side=s; sp(.22,y,w,s*.04,0,0,.5,1,1); return w; }); },
};
/* what each pet throws in a finisher: an emoji, or a glowing ball colour */
const PET_SHOT={dragon:{emoji:'🔥'}, drone:{color:'#4de8ff'}, ghost:{emoji:'👻'}, chick:{emoji:'🥚'}};
const TRAILS={star:{tex:'star',col:[1,.82,.15]}, heart:{tex:'heart',col:[1,.35,.65]}, bubble:{tex:'bubble',col:[.55,.85,1]},
  fire:{tex:'dot',col:[1,.65,.15],col2:[1,.2,.05],size:.75,grav:2.5}, notes:{emoji:'🎵'}, rainbow:{emoji:'🌈'}, bolt:{emoji:'⚡'}};
function applyCosmetics(rig){
  rig.cos.forEach(n=>n.dispose()); rig.cos=[]; rig.spin=[]; rig.scarfTail=null; rig.pet=null; rig.petWings=null; rig.wings=null; rig.backCape=null; rig.halo=null;
  if(rig.trailPS){ rig.trailPS.dispose(false); rig.trailPS=null; }      // false: keep the shared particle texture alive
  if(rig.jetPS){ rig.jetPS.dispose(false); rig.jetPS=null; }
  const e=save.equip, j=rig.j;
  const hd=rig.hold?rig.hold.head:j.head, nk=rig.hold?rig.hold.neck:j.upper, bk=rig.hold?rig.hold.back:j.upper;   // .glb heroes: anchors that follow the model's own head / torso bones
  if(e.hat&&HATS[e.hat]){ const n=nd(hd,0,0,0); HATS[e.hat](n,rig); outlineNode(n); rig.cos.push(n); }
  if(e.neck){ const it=SHOP.find(s=>s.id===e.neck); if(it){ const n=nd(nk,0,.93,0);
    if(it.kind==='bow'){ const m=M(it.color,.5); [-1,1].forEach(s=>{ const c=cy(0,.3,.26,m,n,s*.15,-.06,.31,4); c.rotation.z=s*PI/2; }); sp(.13,m,n,0,-.06,.31); }
    else if(it.kind==='medal'){ const rb=M('#3558d8',.4); [-1,1].forEach(s=>{ const b=bx(.08,.5,.04,rb,n,s*.12,-.27,.29); b.rotation.z=-s*.35; });
      const md=cy(.34,.34,.06,M('#ffd23f',.7),n,0,-.55,.31); md.rotation.x=PI/2; sp(.13,M('#fff27a',.8),n,0,-.55,.34,1,1,.3); }
    else { const m=M(it.color,.5); tor(.74,.2,m,n); const t=nd(n,.22,0,-.3); bx(.2,.6,.07,m,t,0,-.3,0); rig.scarfTail=t; }
    outlineNode(n); rig.cos.push(n); } }
  if(e.back&&BACKS[e.back]){ const n=nd(bk,0,.85,-.32); BACKS[e.back](n,rig); outlineNode(n); rig.cos.push(n); }
  if(e.pet&&PETS[e.pet]){ const n=nd(rig.root,.95,2.9,-.55); PETS[e.pet](n,rig); outlineNode(n,.018); rig.pet=n; rig.petId=e.pet; rig.cos.push(n); }
  const T=TRAILS[e.trail];
  if(T){
    const ps=new BABYLON.ParticleSystem('trail',140,scene); ps.emitter=rig.trailNode;
    if(T.emoji){ ps.particleTexture=emojiTex(T.emoji); ps.blendMode=BABYLON.ParticleSystem.BLENDMODE_STANDARD;
      ps.color1=new BABYLON.Color4(1,1,1,1); ps.color2=new BABYLON.Color4(1,1,1,1); ps.colorDead=new BABYLON.Color4(1,1,1,0); }
    else { const col=T.col, c2=T.col2; ps.particleTexture=TEX[T.tex];
      ps.color1=new BABYLON.Color4(col[0],col[1],col[2],1); ps.color2=c2?new BABYLON.Color4(c2[0],c2[1],c2[2],1):new BABYLON.Color4(1,1,1,.9); ps.colorDead=new BABYLON.Color4(col[0],col[1],col[2],0); }
    const sz=T.size||.5; ps.minSize=sz*.5; ps.maxSize=sz; ps.minLifeTime=.5; ps.maxLifeTime=1; ps.emitRate=0; ps.direction1=V3(-.6,.5,-.6); ps.direction2=V3(.6,1.2,.6);
    ps.minEmitPower=.4; ps.maxEmitPower=1.4; ps.gravity=V3(0,T.grav||.8,0); ps.minAngularSpeed=-2; ps.maxAngularSpeed=2; ps.start(); rig.trailPS=ps;
  }
}

/* ---- pose animation ---- */
const JN=['armR','armL','legR','legL','upper','head','body'];
const REST={armR:[0,0,.12],armL:[0,0,-.12]};
const wrap=v=>((v+PI)%(2*PI)+2*PI)%(2*PI)-PI;
function snap(rig){ const s={}; for(const k of JN){ const r=rig.j[k].rotation; s[k]=[wrap(r.x),wrap(r.y),wrap(r.z)]; } const p=rig.j.body.position; s.pos=[p.x,p.y,p.z]; return s; }
function norm(p){ const s={}; for(const k of JN) s[k]=p[k]||REST[k]||[0,0,0]; s.pos=p.pos||[0,0,0]; return s; }
function poseTo(rig,p,ms,ease){
  const a=snap(rig), b=norm(p);
  return tween(ms,k=>{ for(const n of JN){ const r=rig.j[n].rotation; r.x=a[n][0]+(b[n][0]-a[n][0])*k; r.y=a[n][1]+(b[n][1]-a[n][1])*k; r.z=a[n][2]+(b[n][2]-a[n][2])*k; }
    const q=rig.j.body.position; q.x=a.pos[0]+(b.pos[0]-a.pos[0])*k; q.y=a.pos[1]+(b.pos[1]-a.pos[1])*k; q.z=a.pos[2]+(b.pos[2]-a.pos[2])*k; },ease||E.inOut);
}
async function seq(rig,frames,onHit){ rig.busy=true; for(const f of frames){ await poseTo(rig,f.p||{},f.ms,f.ease); if(f.hit&&onHit) onHit(f.hit); } rig.busy=false; }
function updateRig(rig,dt){
  rig.t+=dt/1000; const t=rig.t, j=rig.j;
  const sw=(n,x,y,z,k=.28)=>{ const r=n.rotation; r.x+=(x-r.x)*k; r.y+=(y-r.y)*k; r.z+=(z-r.z)*k; };
  if(rig.glb&&rig.glb.ready) updateGlb(rig);       // .glb hero: built-in clips for idle / run / cheer, the pose system for the funny moves
  else if(!rig.busy){
    if(rig.cheer){
      sw(j.armR,-2.9+Math.sin(t*12)*.35,0,.3); sw(j.armL,-2.9+Math.sin(t*12+1)*.35,0,-.3);
      sw(j.legR,0,0,0); sw(j.legL,0,0,0); sw(j.upper,0,0,0); j.body.position.y=Math.abs(Math.sin(t*7))*.35;
    } else if(rig.moving){
      const w=t*17, s=Math.sin(w);
      sw(j.legR,s*.95,0,0); sw(j.legL,-s*.95,0,0); sw(j.armR,-s*.8,0,.12); sw(j.armL,s*.8,0,-.12); sw(j.upper,.18,0,0);
      j.body.position.y=Math.abs(s)*.08;
    } else {
      sw(j.legR,0,0,0); sw(j.legL,0,0,0); sw(j.upper,0,0,0); sw(j.head,0,0,0);
      sw(j.armR,Math.sin(t*2)*.05,0,.12+Math.sin(t*2.2)*.03); sw(j.armL,-Math.sin(t*2)*.05,0,-.12-Math.sin(t*2.2)*.03);
      j.body.position.y=Math.sin(t*3)*.03;
    }
  }
  const mv=rig.moving?.55:0;
  rig.tails.forEach((n,i)=>{ n.rotation.x=.25+mv+Math.sin(t*8+i*1.5)*.22; });
  if(rig.cape) rig.cape.rotation.x=.12+mv*.7+Math.sin(t*3)*.05;
  if(rig.scarfTail){ rig.scarfTail.rotation.x=.2+mv+Math.sin(t*7)*.2; rig.scarfTail.rotation.z=Math.sin(t*5)*.15; }
  rig.spin.forEach(n=>n.rotation.y+=dt*.03);
  if(rig.trailPS) rig.trailPS.emitRate=rig.moving?34:0;
  if(rig.backCape) rig.backCape.rotation.x=.15+mv*.9+Math.sin(t*3.4)*.08;
  if(rig.wings){ const f=rig.moving?Math.sin(t*16)*.5:Math.sin(t*3)*.18; rig.wings.forEach(w=>{ w.rotation.y=-w.side*(.35+f); }); }
  if(rig.petWings) rig.petWings.forEach(w=>{ w.rotation.z=w.side*Math.sin(t*14)*.6; });
  if(rig.pet){ rig.pet.position.y=2.9+Math.sin(t*3)*.16; rig.pet.rotation.y=Math.sin(t*1.3)*.4; rig.pet.rotation.z=Math.sin(t*2.1)*.08; }
  if(rig.halo) rig.halo.position.y=1+Math.sin(t*3)*.05;
  if(rig.jetPS) rig.jetPS.emitRate=rig.moving||rig.busy?(QUAL==='low'?40:90):(QUAL==='low'?8:18);
}

/* =====================================================================
   .GLB HEROES: Kenney "Mini Characters" (CC0), files in models/
   The model's skeleton matches the pose joints above (torso=upper, arm-right=armR ...), so MOVES keep working:
   - idle / run / cheer play the model's own animation clips (cross-faded)
   - during a funny move (rig.busy) the clips stop and the joint rotations from poseTo() are copied onto the bones
   If anything fails (offline, no loaders script) the box-built hero stays, so the game always works.
   ===================================================================== */
const GLB_DIR='models/';
const GLB_BONES={upper:'torso',head:'head',armR:'arm-right',armL:'arm-left',legR:'leg-right',legL:'leg-left'};
const GLB_ARM_HANG=1.13;
const GLB_AXES=[1,-1,-1];      // the loader mirrors the model on x, so y and z turns flip sign (x turns do not)
function glbImport(file){
  const L=BABYLON.SceneLoader; if(!L||!L.ImportMeshAsync) return Promise.reject(new Error('no model loader'));
  return L.ImportMeshAsync('',GLB_DIR,file,scene);
}
/* the model ships with PBR materials; the game's look is toon-like, so use a simple lit material with the same colour map */
function glbToon(mesh,outline,texture){
  const src=mesh.material; if(!src) return;
  const m=new BABYLON.StandardMaterial('glb',scene), tex=texture||src.albedoTexture||src.diffuseTexture;
  m.diffuseTexture=tex; m.emissiveTexture=tex; m.emissiveColor=new BABYLON.Color3(.85,.85,.85); m.diffuseColor=new BABYLON.Color3(.65,.65,.65); m.specularColor=new BABYLON.Color3(.08,.08,.1); m.specularPower=24; m.backFaceCulling=true;
  mesh.material=m; mesh.isPickable=false; mesh.alwaysSelectAsActiveMesh=true; reg(mesh);
  if(outline){ mesh.renderOutline=true; mesh.outlineWidth=outline; mesh.outlineColor=OUTC; }
}
async function upgradeRigToGlb(rig){
  const def=rig.hero.glb; if(!def||rig.glb) return;
  let holder=null;
  try{
    const res=await glbImport(def.model+'.glb');
    const top=res.meshes[0], j=rig.j;
    res.animationGroups.forEach(a=>{ a.stop(); a.targetedAnimations.forEach(t=>{ t.animation.enableBlending=true; t.animation.blendingSpeed=.07; }); });
    const groups={}; res.animationGroups.forEach(a=>groups[a.name]=a);
    const node=n=>res.transformNodes.find(t=>t.name===n);
    holder=nd(j.body,0,0,0); holder.scaling.setAll(def.scale); top.parent=holder;
    // The clips only key the joints they use, so a joint keeps its last value when another clip starts. The model's "static" clip is its
    // bind pose: remember it, and put every joint a new clip does not animate back to it (see glbBase). The pose system rotates on top of it.
    const base=[], rest={}, bones={};
    (groups['static']?groups['static'].targetedAnimations:[]).forEach(t=>{ const v=t.animation.getKeys()[0].value; base.push({t:t.target,p:t.animation.targetProperty,v:v.clone()}); });
    for(const k in GLB_BONES){ const b=node(GLB_BONES[k]); bones[k]=b;
      const bs=base.find(x=>x.t===b&&x.p==='rotationQuaternion'); rest[k]=bs?bs.v.clone():b.rotationQuaternion.clone(); }
    // The model's arms are a T-pose; its idle rests them 0.55 rad below horizontal. The pose system thinks of arms as hanging down (a swing
    // forward is a turn about x), so use a hanging rest instead: 25 degrees out from vertical (1.13 rad about z; mirrored for the left arm).
    [['armR',GLB_ARM_HANG],['armL',-GLB_ARM_HANG]].forEach(([k,a])=>{ const q=BABYLON.Quaternion.RotationAxis(BABYLON.Axis.Z,a); rest[k]=q;
      const bs=base.find(x=>x.t===bones[k]&&x.p==='rotationQuaternion'); if(bs) bs.v=q.clone(); else base.push({t:bones[k],p:'rotationQuaternion',v:q.clone()}); });
    // def.texture = a recoloured copy of the shared colour map (models/Textures/): same layout, other colours. false = no flip, like glTF
    const tex=def.texture?new BABYLON.Texture(GLB_DIR+'Textures/'+def.texture,scene,true,false):null;
    res.meshes.forEach(m=>{ if(m.getTotalVertices&&m.getTotalVertices()>0) glbToon(m,def.outline||.004,tex); });
    // anchors for hats / scarves / capes that follow the head and torso bones (the model's scale + mirror are cancelled out).
    // The box heroes are ~0.6 wide with a hat resting at y~0.6; the model's head is bigger, so each anchor has its own scale and height.
    const mkHold=(bone,y,s)=>{ const h=nd(bone,0,y/def.scale,0); h.scaling.set(-s/def.scale,s/def.scale,s/def.scale); return h; };
    rig.hold={head:mkHold(bones.head,def.headY??-.08,def.headScale??1.85), neck:mkHold(bones.upper,def.neckY??-1.1,def.neckScale??1.5),
              back:mkHold(bones.upper,def.backY??-.19,def.backScale??.75)};
    // props hang from the arm bones (T-pose: the hand is 0.28 along the arm); turned back by the arm's rest angle so they stay upright
    try{      // a missing prop must not cost the hero its model
      if(def.sword) await glbAttach(res,'weapon-sword',bones.armR,def.swordFit||{p:[-.27,-.02,.05],r:[0,0,-GLB_ARM_HANG],s:1});
      if(def.shield) await glbAttach(res,'shield-round',bones.armL,def.shieldFit||{p:[.27,-.03,.07],r:[0,0,GLB_ARM_HANG],s:1});
    }catch(e){ console.warn('prop not loaded:',e); }
    rig.glb={ready:true,def,groups,bones,rest,base,snap:{},cur:null,wasBusy:false,blend:0,top,holder,mk:mkHold};
    glbBase(rig.glb);
    rig.lego.forEach(m=>m.setEnabled(false));
    if(def.extras){ try{ await def.extras(rig,rig.glb); }catch(e){ console.warn('hero extras not added:',e); } }   // parts the model does not have (mask, skirt, crown ...)
    applyCosmetics(rig);
  }catch(e){ console.warn('3D model not used, keeping the built-in hero:',e); rig.hold=null; rig.glb=null; if(holder) holder.dispose(); }
}
/* Parts the Kenney models do not have. Each hero's anchors work in "box hero" units (a head is ~0.6 wide, see mkHold above),
   so the numbers are close to the ones in buildNinja / buildPrincess. */
async function glbNinjaExtras(rig,g){
  const dark=M('#1d1d33'), tail=M('#7a0d15');
  const face=nd(rig.hold.head,0,0,0);
  bx(.6,.17,.58,dark,face,0,.08,0);                           // mask over the mouth and nose
  rig.tails=[]; for(let i=0;i<2;i++){ const t=nd(rig.hold.head,0,.4,-.3); t.rotation.y=(i?1:-1)*.25; bx(.1,.06,.55,tail,t,0,0,-.27); rig.tails.push(t); }   // headband ends
  outlineNode(face);
  await glbAttach(null,'weapon-sword',g.bones.upper,{p:[.05,.02,-.2],r:[0,0,-.7],s:1});     // katana across the back
}
function glbPrincessExtras(rig,g){
  const gold=M('#ffd23f',.6), pink=M('#ff6fa8'), rim=M('#ffe0f0',.6);
  const skirt=g.mk(g.bones.upper,-.1,1);                       // follows the torso; world-size units
  cy(1.02,1.55,.42,pink,skirt,0,-.02,0); cy(1.55,1.59,.08,rim,skirt,0,-.2,0); bx(1.04,.09,.66,gold,skirt,0,.2,0);
  const crown=nd(rig.hold.head,0,.62,0); cy(.6,.6,.08,gold,crown); [-.17,0,.17].forEach(x=>cy(0,.14,.16,gold,crown,x,.1,.2));
  const cape=nd(rig.hold.back,0,.95,-.3); bx(1.05,.72,.06,M('#7b4fd6'),cape,0,-.36,0); bx(1.15,.1,.1,gold,cape,0,0,.02); rig.cape=cape;   // short, so the wide skirt does not hide it
  outlineNode(skirt); outlineNode(crown); outlineNode(cape);
}

/* hang a prop (sword, shield...) from a bone; its own mesh is used so no extra mirror is applied */
async function glbAttach(owner,file,bone,fit){
  const r=await glbImport(file+'.glb'), mesh=r.meshes.find(m=>m.getTotalVertices&&m.getTotalVertices()>0);
  if(!mesh) return;
  mesh.parent=bone; mesh.position.set(...fit.p); mesh.rotationQuaternion=null; mesh.rotation.set(...fit.r); mesh.scaling.setAll(fit.s);
  glbToon(mesh,.004); r.meshes[0].dispose(); r.animationGroups.forEach(a=>a.dispose());
}
/* put joints back to the bind pose, except the ones listed in `skip` (a Set of "uniqueId.property") */
function glbBase(g,skip){
  g.base.forEach(b=>{ if(skip&&skip.has(b.t.uniqueId+'.'+b.p)) return; if(b.p==='rotationQuaternion') b.t.rotationQuaternion=b.v.clone(); else b.t[b.p].copyFrom(b.v); });
}
function glbPlay(rig,key){
  const g=rig.glb; if(g.cur===key) return; g.cur=key;
  for(const n in g.groups) if(g.groups[n].isStarted) g.groups[n].stop();
  const a=g.groups[g.def.clips[key]];
  glbBase(g,a&&new Set(a.targetedAnimations.map(t=>t.target.uniqueId+'.'+t.animation.targetProperty)));   // joints this clip animates keep their value, so it can blend
  if(a) a.start(true,key==='move'?1.15:1);
}
function updateGlb(rig){
  const g=rig.glb, j=rig.j;
  if(rig.busy){
    if(!g.wasBusy){ g.wasBusy=true; g.blend=0; g.cur=null; for(const n in g.groups) if(g.groups[n].isStarted) g.groups[n].stop();
      for(const k in g.bones) g.snap[k]=g.bones[k].rotationQuaternion.clone();
      glbBase(g,new Set(Object.values(g.bones).map(b=>b.uniqueId+'.rotationQuaternion'))); }   // everything except the 6 driven joints back to bind pose
    g.blend=Math.min(1,g.blend+engine.getDeltaTime()/150);
    for(const k in g.bones){ const r=j[k].rotation, d=BABYLON.Quaternion.RotationYawPitchRoll(r.y*GLB_AXES[1],r.x*GLB_AXES[0],r.z*GLB_AXES[2]);
      g.bones[k].rotationQuaternion=BABYLON.Quaternion.Slerp(g.snap[k],d.multiply(g.rest[k]),g.blend); }
  } else {
    g.wasBusy=false;
    glbPlay(rig,rig.cheer?'cheer':rig.moving?'move':'idle');
    j.body.position.y=rig.cheer?Math.abs(Math.sin(rig.t*7))*.3:j.body.position.y*.7;
  }
}

/* ---- the funny moves ---- */
const MOVES={
  spinChop:[{ms:220,p:{armR:[-2.8,0,.3],upper:[-.1,.6,0],pos:[0,.05,0]}},{ms:450,hit:1,p:{armR:[-.4,0,0],body:[0,PI*2,0],pos:[0,.3,0],legL:[-.7,0,0]}},{ms:250,p:{}}],
  flyingKick:[{ms:200,p:{upper:[.3,0,0],legR:[.5,0,0],pos:[0,-.1,0]}},{ms:300,hit:1,p:{pos:[0,1.1,.3],upper:[-.45,0,0],legR:[-1.5,0,0],legL:[.5,0,0],armR:[.6,0,.9],armL:[.6,0,-.9]}},{ms:320,p:{}}],
  flurry:[{ms:130,p:{upper:[.1,.4,0],armR:[-1.6,0,0],armL:[.3,0,0]}},{ms:100,hit:'light',p:{upper:[.1,-.4,0],armR:[.3,0,0],armL:[-1.6,0,0]}},
          {ms:100,hit:'light',p:{upper:[.1,.4,0],armR:[-1.6,0,0],armL:[.3,0,0]}},{ms:100,hit:'light',p:{upper:[.1,-.4,0],armR:[.3,0,0],armL:[-1.6,0,0]}},
          {ms:140,hit:1,p:{upper:[.3,.5,0],armR:[-1.6,0,0],armL:[-1.6,0,.2],pos:[0,0,.4]}},{ms:250,p:{}}],
  crane:[{ms:350,p:{legR:[-1.3,0,0],armR:[0,0,1.7],armL:[0,0,-1.7]}},{ms:260,p:{legR:[-1.3,0,0],armR:[0,0,1.7],armL:[0,0,-1.7]}},
         {ms:140,hit:1,p:{legR:[-1.6,0,0],armR:[-.6,0,1.2],armL:[-.6,0,-1.2],upper:[-.25,0,0],pos:[0,.15,.3]}},{ms:300,p:{}}],
  hipBump:[{ms:250,p:{body:[0,PI,0],pos:[0,0,-.3],armR:[0,0,1.3],armL:[0,0,-1.3]}},{ms:130,hit:1,p:{body:[0,PI,0],pos:[0,0,.7],armR:[-.8,0,1],armL:[-.8,0,-1],legR:[.4,0,0]}},{ms:300,p:{}}],
  swordSpin:[{ms:220,p:{armR:[-1.6,0,.2],upper:[0,.4,0]}},{ms:520,hit:1,p:{armR:[-1.6,0,.2],body:[0,PI*2,0],pos:[0,.1,0]}},
             {ms:160,p:{body:[0,PI*2+.6,0],head:[0,.5,.3]}},{ms:160,p:{body:[0,PI*2-.6,0],head:[0,-.5,-.3]}},{ms:250,p:{}}],
  shieldBash:[{ms:250,p:{armL:[-.4,0,-.6],upper:[-.15,0,0],pos:[0,0,-.3]}},{ms:110,hit:1,p:{armL:[-1.5,0,-.2],upper:[.35,0,0],pos:[0,0,.8]}},{ms:300,p:{}}],
  swordChop:[{ms:260,p:{armR:[-3,0,.1],upper:[-.3,0,0]}},{ms:120,hit:1,p:{armR:[-.5,0,0],upper:[.5,0,0]}},
             {ms:220,p:{armR:[-.5,0,0],upper:[.5,.7,0]}},{ms:220,p:{armR:[-.5,0,0],upper:[.5,-.7,0]}},{ms:250,p:{}}],
  flipKick:[{ms:200,p:{upper:[.3,0,0],pos:[0,-.1,0]}},{ms:520,p:{body:[PI*2,0,0],pos:[0,1.4,.4],legR:[-.6,0,0],legL:[-.6,0,0],armR:[-.3,0,.9],armL:[-.3,0,-.9]}},
            {ms:140,hit:1,p:{pos:[0,.2,.3],legR:[-1.6,0,0],upper:[-.2,0,0],armR:[-.6,0,.8],armL:[-.6,0,-.8]}},{ms:300,p:{}}],
};
MOVES.uppercut=[{ms:200,p:{upper:[.4,0,0],armR:[.3,0,.2],pos:[0,-.25,0],legR:[.5,0,0],legL:[-.3,0,0]}},
  {ms:170,hit:1,p:{armR:[-3,0,.1],upper:[-.3,0,0],pos:[0,1.2,.3],legL:[.6,0,0]}},{ms:320,p:{}}];
MOVES.groundPound=[{ms:260,p:{pos:[0,1.7,.2],legR:[-.9,0,0],legL:[-.9,0,0],armR:[-2.6,0,.4],armL:[-2.6,0,-.4]}},
  {ms:130,hit:1,p:{pos:[0,-.1,.5],armR:[-.8,0,.4],armL:[-.8,0,-.4],upper:[.5,0,0],legR:[-.5,0,0],legL:[.3,0,0]}},{ms:300,p:{}}];
MOVES.tornadoSpin=[{ms:200,p:{armR:[0,0,1.5],armL:[0,0,-1.5]}},{ms:600,hit:1,p:{armR:[0,0,1.5],armL:[0,0,-1.5],body:[0,PI*4,0],pos:[0,.6,.3]}},{ms:300,p:{}}];
MOVES.dropKick=[{ms:220,p:{pos:[0,.9,0],legR:[.6,0,0],legL:[.6,0,0],upper:[.3,0,0]}},
  {ms:160,hit:1,p:{body:[-1.1,0,0],pos:[0,.9,.6],legR:[-1.4,0,0],legL:[-1.4,0,0],armR:[-2.8,0,.3],armL:[-2.8,0,-.3]}},{ms:280,p:{pos:[0,.2,0]}},{ms:160,p:{}}];
MOVES.headbutt=[{ms:240,p:{upper:[-.5,0,0],head:[-.4,0,0],pos:[0,0,-.3]}},{ms:110,hit:1,p:{upper:[.7,0,0],head:[.4,0,0],pos:[0,0,.7]}},
  {ms:180,p:{upper:[.2,0,.2],head:[0,0,.45]}},{ms:180,p:{upper:[.2,0,-.2],head:[0,0,-.45]}},{ms:250,p:{}}];
MOVES.cartwheel=[{ms:150,p:{armR:[0,0,2.6],armL:[0,0,-2.6]}},{ms:520,hit:1,p:{body:[0,0,-PI*2],pos:[0,.5,.5],armR:[0,0,2.6],armL:[0,0,-2.6],legR:[0,0,.6],legL:[0,0,-.6]}},{ms:280,p:{}}];
const COMIC=['BONK!','WHACK!','BOING!','POW!','HI-YAH!','SPLAT!','KAPOW!','OOF!','BOOP!','WHAM!','ZONK!','KA-BLAM!','THWACK!','YEET!'];
