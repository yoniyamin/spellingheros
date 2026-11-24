/* The places the game can be played in: the school corridor (corridor.js) plus the Haunted Forest, Candy Land,
   Snowy Mountain and Pirate Beach. A place is a preset: fog, sky colour, lights, floor, a painted sky backdrop, the four
   wall/scenery pieces that repeat along the way (merged into one mesh each, like the corridor walls) and the floating particles.
   setPlace(id) swaps all of it at runtime, the scroll logic in main.js does not change.
   (plain script: shares the global scope with the other files in js/, load order matters - see index.html) */
'use strict';

/* nodes that belong to the places: game.js sweepScene() throws away whatever a run created, but must leave these alone */
const PLACE_KEEP=new Set();
const keepNode=n=>{ PLACE_KEEP.add(n); n.onDisposeObservable.add(()=>PLACE_KEEP.delete(n)); return n; };
const rng=seed=>()=>(seed=(seed*16807)%2147483647)/2147483647;      // small seeded random, so every piece of scenery looks the same each time
const hexC=h=>BABYLON.Color3.FromHexString(h);

/* ---------------- drawing helpers ---------------- */
function canvasTex(w,h,draw,wrap){
  const t=new BABYLON.DynamicTexture('pt',{width:w,height:h},scene,true), c=t.getContext(); draw(c,w,h); t.update();
  if(wrap){ t.wrapU=t.wrapV=BABYLON.Texture.WRAP_ADDRESSMODE; t.anisotropicFilteringLevel=8; } return t;
}
function texMat(t,em=.5){ const m=new BABYLON.StandardMaterial('ptm',scene); m.diffuseTexture=t; m.emissiveColor=new BABYLON.Color3(em,em,em); m.specularColor=BABYLON.Color3.Black(); return m; }
const glowDot=(c,x,y,r,rgb,a)=>{ const g=c.createRadialGradient(x,y,0,x,y,r); g.addColorStop(0,`rgba(${rgb},${a})`); g.addColorStop(1,`rgba(${rgb},0)`); c.fillStyle=g; c.fillRect(x-r,y-r,r*2,r*2); };
/* a soft round glow (for lanterns, ghosts, mushrooms, treasure): an unlit colour whose opacity fades out towards the edge */
let glowShape=null; const glowCache={};
function glowMat(hex,a=.6){
  const k=hex+'|'+a; if(glowCache[k]) return glowCache[k];
  if(!glowShape) glowShape=canvasTex(128,128,(c,w,h)=>{ const g=c.createRadialGradient(64,64,0,64,64,64); g.addColorStop(0,'#fff'); g.addColorStop(.35,'#777'); g.addColorStop(1,'#000'); c.fillStyle=g; c.fillRect(0,0,w,h); });
  const m=new BABYLON.StandardMaterial('glow'+k,scene); m.disableLighting=true; m.emissiveColor=hexC(hex); m.opacityTexture=glowShape; m.opacityTexture.getAlphaFromRGB=true; m.alpha=a;
  m.backFaceCulling=false; m.fogEnabled=false; return glowCache[k]=m;
}
const wrapDraw=(S,fn)=>{ for(const dx of [-S,0,S]) for(const dy of [-S,0,S]) fn(dx,dy); };     // draw a thing again on the far sides, so the floor tile repeats without a seam

/* ---------------- the painted sky backdrop (one big plane behind the scenery that follows the camera) ----------------
   1536 x 512 px for 150 x 50 world units (10.24 px per unit); world y=39 is the top edge, y=0 (the ground at the far end) is at px 399 */
const SK={W:1536,H:512,U:10.24}, skx=x=>SK.W/2+x*SK.U, sky_y=y=>(39-y)*SK.U;
const skyGrad=(c,stops)=>{ const g=c.createLinearGradient(0,0,0,SK.H); stops.forEach(([o,col])=>g.addColorStop(o,col)); c.fillStyle=g; c.fillRect(0,0,SK.W,SK.H); };
const skyCloud=(c,x,y,s,col)=>{ c.fillStyle=col; [[0,0,1],[-.8,.18,.7],[.85,.15,.75],[.35,-.35,.7],[-.35,-.25,.65]].forEach(([dx,dy,k])=>{ c.beginPath(); c.arc(x+dx*s,y+dy*s,k*s*.55,0,7); c.fill(); }); };
function skyRidge(c,seed,baseY,minH,maxH,step,col,cap){      // a jagged mountain range; cap = colour of the snow on the peaks
  const r=rng(seed), pts=[]; for(let x=-40;x<SK.W+80;x+=step) pts.push([x+(r()-.5)*step*.4,baseY-minH-r()*(maxH-minH)]);
  c.fillStyle=col; c.beginPath(); c.moveTo(-40,SK.H); pts.forEach(p=>c.lineTo(p[0],p[1])); c.lineTo(SK.W+80,SK.H); c.fill();
  if(cap){ c.fillStyle=cap; pts.forEach((p,i)=>{ if(baseY-p[1]<(minH+maxH)*.55) return; const h=(baseY-p[1])*.3;
    c.beginPath(); c.moveTo(p[0],p[1]); c.lineTo(p[0]-h*.55,p[1]+h); c.lineTo(p[0]-h*.2,p[1]+h*.75); c.lineTo(p[0]+h*.1,p[1]+h*1.05); c.lineTo(p[0]+h*.3,p[1]+h*.8); c.lineTo(p[0]+h*.55,p[1]+h); c.fill(); }); }
}
function skyPines(c,seed,baseY,minH,maxH,step,col){
  const r=rng(seed); c.fillStyle=col; c.fillRect(0,baseY,SK.W,SK.H-baseY);
  for(let x=-20;x<SK.W+20;x+=step){ const h=minH+r()*(maxH-minH), w=h*.38, cx=x+(r()-.5)*step*.5;
    for(let k=0;k<3;k++){ const yy=baseY-h*(k*.24), ww=w*(1-k*.22); c.beginPath(); c.moveTo(cx,yy-h*.5+k*h*.02); c.lineTo(cx-ww,yy+2); c.lineTo(cx+ww,yy+2); c.fill(); } }
}

/* ---------------- floor textures ---------------- */
function floorTexOf(draw,tile,sz){
  const t=canvasTex(512,512,draw,true); t.uScale=120/tile; t.vScale=22*sz/tile; return t;
}
const floorMoss=c=>{ c.fillStyle='#2b3a58'; c.fillRect(0,0,512,512); const r=rng(5);
  wrapDraw(512,(dx,dy)=>{ for(let i=0;i<26;i++){ const x=(i*97%512)+dx, y=(i*211%512)+dy; glowDot(c,x,y,40+(i%4)*14,i%2?'58,120,110':'60,80,150',.55); } });
  c.lineWidth=2; for(let i=0;i<260;i++){ const x=r()*512, y=r()*512, h=5+r()*9, lean=(r()-.5)*5; c.strokeStyle=i%3?'#4aa58f':'#6a7fe0';
    wrapDraw(512,(dx,dy)=>{ c.beginPath(); c.moveTo(x+dx,y+dy); c.lineTo(x+dx+lean,y+dy-h); c.stroke(); }); }
  for(let i=0;i<22;i++){ const x=r()*512, y=r()*512, rx=10+r()*14; c.fillStyle='#4b5c90'; wrapDraw(512,(dx,dy)=>{ c.beginPath(); c.ellipse(x+dx,y+dy,rx,rx*.6,0,0,7); c.fill(); });
    c.fillStyle='rgba(255,255,255,.18)'; wrapDraw(512,(dx,dy)=>{ c.beginPath(); c.ellipse(x+dx-rx*.2,y+dy-rx*.2,rx*.6,rx*.3,0,0,7); c.fill(); }); } };
const floorCandy=c=>{ c.fillStyle='#ffc6df'; c.fillRect(0,0,512,512); const r=rng(9);
  wrapDraw(512,(dx,dy)=>{ for(let i=0;i<10;i++){ const x=(i*131%512)+dx, y=(i*73%512)+dy; glowDot(c,x,y,70,i%2?'255,255,255':'255,170,205',.5); } });
  c.lineCap='round'; c.strokeStyle='rgba(255,255,255,.7)'; c.lineWidth=14;
  wrapDraw(512,(dx,dy)=>{ for(let i=0;i<6;i++){ c.beginPath(); c.arc(60+i*85+dx,100+(i%3)*150+dy,38+(i%2)*16,.4+i,2.6+i); c.stroke(); } });
  const cols=['#ff5d7a','#ffd23f','#5ad6a0','#59b4ff','#a07bff','#ffffff']; c.lineWidth=9;
  for(let i=0;i<120;i++){ const x=r()*512, y=r()*512, a=r()*PI; c.strokeStyle=cols[i%cols.length]; wrapDraw(512,(dx,dy)=>{ c.beginPath(); c.moveTo(x+dx,y+dy); c.lineTo(x+dx+Math.cos(a)*14,y+dy+Math.sin(a)*14); c.stroke(); }); } };
const floorSnow=c=>{ c.fillStyle='#eaf3ff'; c.fillRect(0,0,512,512); const r=rng(21);
  wrapDraw(512,(dx,dy)=>{ for(let i=0;i<18;i++){ const x=(i*89%512)+dx, y=(i*157%512)+dy; glowDot(c,x,y,55+(i%3)*20,i%2?'170,200,240':'255,255,255',.55); } });
  c.strokeStyle='rgba(150,185,235,.45)'; c.lineWidth=5; c.lineCap='round';
  wrapDraw(512,(dx,dy)=>{ for(let i=0;i<7;i++){ c.beginPath(); c.moveTo(20+i*70+dx,40+(i*83%460)+dy); c.quadraticCurveTo(60+i*70+dx,10+(i*83%460)+dy,110+i*70+dx,40+(i*83%460)+dy); c.stroke(); } });
  for(let i=0;i<150;i++){ const x=r()*512, y=r()*512; c.fillStyle=i%3?'#ffffff':'#bfeaff'; c.fillRect(x,y,3,3); } };
const floorSand=c=>{ c.fillStyle='#f3d996'; c.fillRect(0,0,512,512); const r=rng(33);
  wrapDraw(512,(dx,dy)=>{ for(let i=0;i<14;i++){ const x=(i*113%512)+dx, y=(i*191%512)+dy; glowDot(c,x,y,60,i%2?'255,236,170':'222,180,100',.5); } });
  c.strokeStyle='rgba(205,160,90,.5)'; c.lineWidth=4; c.lineCap='round';
  wrapDraw(512,(dx,dy)=>{ for(let i=0;i<8;i++){ c.beginPath(); c.moveTo(i*70+dx,60+(i*61%440)+dy); c.bezierCurveTo(i*70+40+dx,30+(i*61%440)+dy,i*70+80+dx,90+(i*61%440)+dy,i*70+130+dx,60+(i*61%440)+dy); c.stroke(); } });
  for(let i=0;i<260;i++){ const x=r()*512, y=r()*512; c.fillStyle=i%2?'#d1ad66':'#fff3c9'; c.fillRect(x,y,2+r()*2,2+r()*2); }
  for(let i=0;i<9;i++){ const x=r()*512, y=r()*512; c.fillStyle=i%2?'#ffb8c8':'#ffffff'; wrapDraw(512,(dx,dy)=>{ c.beginPath(); c.ellipse(x+dx,y+dy,7,5,r()*3,0,7); c.fill(); }); } };

/* ---------------- floating particles per place ---------------- */
const PETAL0={tex:'petal',c1:[1,1,1,.7],c2:[.82,.86,1,.55],cd:[1,1,1,0],size:[.22,.5],life:[8,13],dir1:[-.5,-.5,0],dir2:[.2,-.15,0],power:[.3,.8],grav:[0,-.12,0],
  box:[[-13,4,-4],[13,6.5,6]],spin:[-1.5,1.5],blend:'add',rate:4};
const DUST0={tex:'dot',c1:[1,1,1,.75],c2:[.85,.88,1,.5],cd:[1,1,1,0],size:[.05,.16],life:[6,11],dir1:[-.1,.05,0],dir2:[.1,.3,0],power:[.1,.4],grav:[0,0,0],
  box:[[-12,-1,-3],[12,5,10]],spin:[0,0],blend:'add',rate:14};
function applyPS(ps,c){
  ps.particleTexture=TEX[c.tex]; ps.color1=new BABYLON.Color4(...c.c1); ps.color2=new BABYLON.Color4(...c.c2); ps.colorDead=new BABYLON.Color4(...c.cd);
  ps.minSize=c.size[0]; ps.maxSize=c.size[1]; ps.minLifeTime=c.life[0]; ps.maxLifeTime=c.life[1];
  ps.direction1=V3(...c.dir1); ps.direction2=V3(...c.dir2); ps.minEmitPower=c.power[0]; ps.maxEmitPower=c.power[1]; ps.gravity=V3(...c.grav);
  ps.minEmitBox=V3(...c.box[0]); ps.maxEmitBox=V3(...c.box[1]); ps.minAngularSpeed=c.spin[0]; ps.maxAngularSpeed=c.spin[1];
  ps.blendMode=c.blend==='std'?BABYLON.ParticleSystem.BLENDMODE_STANDARD:BABYLON.ParticleSystem.BLENDMODE_ONEONE;
  try{ ps.stop(); ps.reset(); ps.start(); ps._off=false; }catch(e){}       // start again so the old place's particles do not linger (pre-warm fills the screen at once)
}

/* ---------------- scenery pieces: a tiny kit of helpers that collect meshes to be merged ----------------
   (they pass false to fin() so nothing is registered as a shadow caster / reflection: the pieces are merged straight away) */
const LOD_C=.75, LOD_S=.35, LOD_T=.62;      // (a Babylon sphere with `segments` s has about 4*(s+2)^2 triangles: s=10 -> 576, s=4 -> 144, s=3 -> 100)
function kit(add){
  const mk=(o,m,x,y,z)=>add(fin(o,m,null,x,y,z,false));
  const K={
    B:(w,h,d,m,x,y,z)=>mk(BABYLON.MeshBuilder.CreateBox('b',{width:w,height:h,depth:d},scene),m,x,y,z),
    // (the tessellation numbers are scaled down by LOD_*: there are ~16 copies of the scenery on screen, so every triangle counts 16 times)
    C:(dt,db,h,m,x,y,z,t=10)=>mk(BABYLON.MeshBuilder.CreateCylinder('c',{diameterTop:dt,diameterBottom:db,height:h,tessellation:Math.max(6,Math.round(t*LOD_C))},scene),m,x,y,z),      // dt=0 makes a cone
    S:(d,m,x,y,z,sx=1,sy=1,sz=1,sg=10)=>{ const o=mk(BABYLON.MeshBuilder.CreateSphere('s',{diameter:d,segments:Math.max(2,Math.round(sg*LOD_S))},scene),m,x,y,z); o.scaling.set(sx,sy,sz); return o; },
    P:(w,h,m,x,y,z)=>mk(BABYLON.MeshBuilder.CreatePlane('p',{width:w,height:h},scene),m,x,y,z),                                                              // faces the camera
    T:(d,th,m,x,y,z,t=18)=>mk(BABYLON.MeshBuilder.CreateTorus('t',{diameter:d,thickness:th,tessellation:Math.max(8,Math.round(t*LOD_T))},scene),m,x,y,z),
    flat:(w,d,m,x,y,z)=>{ const o=mk(BABYLON.MeshBuilder.CreatePlane('f',{width:w,height:d},scene),m,x,y,z); o.rotation.x=PI/2; return o; },                   // lies on the ground
    limb:(x,y,z,L,th,w0,w1,m)=>{ K.C(w1,w0,L,m,x-Math.sin(th)*L/2,y+Math.cos(th)*L/2,z,7).rotation.z=th; return [x-Math.sin(th)*L,y+Math.cos(th)*L]; },   // branch from (x,y), th = lean from straight up (+ = towards -x); returns its tip
  };
  return K;
}

/* =====================================================================
   HAUNTED FOREST  (night, glowing mushrooms, friendly ghost - spooky but cute)
   ===================================================================== */
function segForest(t,K){
  const {B,C,S,P,flat,limb}=K, r=rng(101+t*37);
  const trunk=M('#4b3573',.3), trunk2=M('#5d4690',.3), ink=M('#12102e',0), cream=M('#fff1e6',.6), stone=M('#8089c0',.35), wood=M('#6a4d6e',.3),
        leaf=M('#2f7b86',.3), leaf2=M('#3a5fb0',.3), leaf3=M('#2d4c96',.3), pine=M('#2c2a7e',.2), pine2=M('#393596',.2), moss=M('#3f9a86',.3), orange=M('#ff9a2e',.5), ghostM=M('#eef5ff',.8);
  const gY=GM('#ffe45c'), gP=GM('#ff7be0'), gC=GM('#6fe8ff'), gG=GM('#9bff8a');
  const pineT=(x,z,h,m)=>{ C(h*.08,h*.1,h*.3,trunk,x,h*.15,z,6); for(let i=0;i<3;i++) C(0,h*(.55-.13*i),h*.42,m,x,h*(.14+.22*i)+h*.21,z,8); };
  const roundTree=(x,z,s)=>{ C(.3*s,.55*s,2.8*s,trunk,x,1.4*s,z,7); S(2.8*s,leaf,x,3.5*s,z,1,.8,1,10); S(2*s,leaf2,x-.95*s,3.0*s,z-.25,1,.9,1); S(2*s,leaf3,x+.95*s,3.05*s,z-.25,1,.9,1); S(.22*s,gY,x+.5*s,2.5*s,z-.9*s,1,1,1,6); };
  const tuft=(x,z,s)=>{ C(0,.2*s,.8*s,moss,x,.4*s,z,5); C(0,.16*s,.6*s,moss,x+.13*s,.3*s,z,5).rotation.z=-.3; C(0,.16*s,.6*s,moss,x-.13*s,.3*s,z,5).rotation.z=.3; };
  const caps={m:[M('#ff6bd6',.5),gP,'#ff7be0'],c:[M('#4fd8ff',.5),gC,'#6fe8ff'],g:[M('#8cf07a',.5),gG,'#9bff8a']};
  const mush=(x,z,s,k)=>{ const [cap,glow,hex]=caps[k]; C(.3*s,.42*s,1.1*s,cream,x,.55*s,z,7); S(1.6*s,cap,x,1.2*s,z,1,.6,1,10);
    for(let i=0;i<3;i++){ const a=PI*(1.25+i*.25); S(.2*s,glow,x+Math.cos(a)*.5*s,1.57*s,z+Math.sin(a)*.5*s,1,1,.6,6); }
    flat(3.4*s,3.4*s,glowMat(hex,.5),x,.05,z+.2); };
  for(let i=0;i<3;i++) pineT(-1.6+i*1.6+(r()-.5)*.7,9+r()*5,6+r()*4,i%2?pine:pine2);                      // far pines: the fog makes soft silhouettes of them
  if(t===1||t===2) roundTree(r()<.5?-1.2:1.3,6.4,1.1);
  for(let i=0;i<5;i++) tuft(-1.8+i*.9+(r()-.5)*.4,2.4+r()*1.4,.8+r()*.6);
  if(t===0){                                           // the big friendly tree with a face and a lantern
    const x=-.3, z=3.4;
    C(.9,1.6,3,trunk,x,1.5,z,10); C(.7,.9,2.6,trunk2,x+.12,4.2,z,10).rotation.z=-.1; C(.45,.7,2.4,trunk,x+.3,6.3,z,9).rotation.z=-.2;
    S(4.4,leaf,x+.6,7.9,z+.1,1,.7,1,12); S(3.2,leaf2,x-1.3,7.3,z+.2,1,.8,1); S(3.2,leaf3,x+2,7.4,z+.1,1,.8,1);
    const [b1x,b1y]=limb(x-.35,4.6,z,2.2,.95,.34,.12,trunk2); limb(b1x,b1y,z,1.1,.2,.12,.06,trunk2);
    const [b2x,b2y]=limb(x+.45,5.2,z,2.0,-1.0,.3,.1,trunk2); limb(b2x,b2y,z,1,-.1,.1,.05,trunk2);
    S(.55,gY,x-.3,3.55,z-.46,1,1.2,.3,8); S(.55,gY,x+.3,3.55,z-.46,1,1.2,.3,8);                    // eyes, pupils, smile
    S(.22,ink,x-.28,3.52,z-.55,1,1.3,.4,6); S(.22,ink,x+.32,3.52,z-.55,1,1.3,.4,6);
    for(let i=-2;i<=2;i++) B(.13,.1,.08,gY,x+i*.15,2.85+i*i*.045,z-.5);
    B(.03,.5,.03,ink,b1x,b1y-.25,z-.1); S(.4,gY,b1x,b1y-.7,z-.1,1,1.15,1,8); P(2.4,2.4,glowMat('#ffe45c',.55),b1x,b1y-.7,z-.4);
    mush(1.6,2.9,.8,'m'); mush(-1.7,2.8,.6,'c');
  } else if(t===1){                                    // glowing mushrooms and a tombstone that says BOO
    mush(-1.3,3.0,1.5,'m'); mush(-.3,2.7,.9,'c'); mush(.7,3.1,1.9,'m'); mush(1.6,2.7,.8,'g');
    const boo=texMat(canvasTex(128,64,(c,w,h)=>{ c.fillStyle='#8c95cc'; c.fillRect(0,0,w,h); c.fillStyle='#262266'; c.font='bold 44px "Comic Sans MS",Arial'; c.textAlign='center'; c.fillText('BOO',64,48); }),.55);
    const tx=-1.9; B(.9,1.3,.3,stone,tx,.65,3.6).rotation.z=.07; C(.9,.9,.3,stone,tx,1.3,3.6,14).rotation.x=PI/2; P(.7,.4,boo,tx,1.0,3.42);
  } else if(t===2){                                    // a crooked fence, a ghost and a glowing pumpkin
    for(let i=0;i<6;i++) B(.16,1.1+r()*.35,.12,wood,-1.9+i*.76,.6,2.95).rotation.z=(r()-.5)*.2;
    B(4,.1,.07,wood,0,.55,2.9).rotation.z=.03; B(4,.1,.07,wood,0,.95,2.9).rotation.z=-.04;
    const gx=.5, gy=3.4, gz=3.8;
    S(1.9,ghostM,gx,gy,gz,1,1.2,.9,12); [-.62,-.2,.2,.62].forEach((o,i)=>S(.75,ghostM,gx+o,gy-1.0-(i%2)*.06,gz,1,1,.9,8));
    S(.55,ghostM,gx-1.0,gy-.1,gz-.1,1,.6,.6,8).rotation.z=.5; S(.55,ghostM,gx+1.0,gy-.1,gz-.1,1,.6,.6,8).rotation.z=-.5;
    [-1,1].forEach(s=>{ S(.32,ink,gx+s*.34,gy+.2,gz-.8,1,1.3,.4,8); S(.09,ghostM,gx+s*.38,gy+.3,gz-.84,1,1,.6,6); S(.3,GM('#ff9fc8'),gx+s*.6,gy-.1,gz-.78,1,.6,.3,6); });
    S(.22,ink,gx,gy-.12,gz-.82,1.1,.8,.3,6); P(4.6,4.6,glowMat('#bfd6ff',.45),gx,gy,gz+.4);
    const px=-1.25; S(.95,orange,px,.45,2.5,1.15,.85,1,10); C(.1,.16,.25,moss,px,1.0,2.5,6);
    [-1,1].forEach(s=>B(.15,.15,.05,gY,px+s*.2,.55,2.04).rotation.z=s*.7); for(let i=-2;i<=2;i++) B(.1,.08,.05,gY,px+i*.1,.28+(i%2?0:.07),2.04);
  } else {                                             // a dead tree with an owl, a lantern post and two bats
    const x=.7, z=3.5; C(.35,.85,5.6,trunk,x,2.8,z,8);
    const [a1x,a1y]=limb(x-.1,3.6,z,2.2,.9,.28,.08,trunk); limb(a1x,a1y,z,1.2,-.3,.08,.04,trunk);
    const [a2x,a2y]=limb(x+.1,4.4,z,2.3,-.85,.26,.08,trunk); limb(a2x,a2y,z,1.1,.35,.08,.04,trunk); limb(x,5.3,z,1.8,.25,.2,.05,trunk);
    const ox=a2x-.5, oy=a2y-.4; S(.95,M('#8a6a9a',.4),ox,oy+.35,z-.3,1,1.2,.9,10); S(.7,cream,ox,oy+.25,z-.62,1,1.1,.4,8);
    [-1,1].forEach(s=>{ S(.36,GM('#fff3a8'),ox+s*.2,oy+.62,z-.62,1,1,.4,8); S(.15,ink,ox+s*.2,oy+.62,z-.74,1,1,.4,6); C(0,.18,.25,M('#8a6a9a',.4),ox+s*.28,oy+1.0,z-.3,4); });
    C(0,.16,.26,orange,ox,oy+.5,z-.8,5).rotation.x=-PI/2;
    const lx=-1.3; C(.1,.14,3.2,ink,lx,1.6,3.0,6); B(.9,.07,.07,ink,lx+.4,3.1,3.0); S(.5,GM('#ffcf6b'),lx+.8,2.75,3.0,1,1.2,1,8); P(3,3,glowMat('#ffd98a',.55),lx+.8,2.75,3.2);
    [[-1.3,6.6],[1.8,7.1]].forEach(([bxp,byp])=>{ S(.28,ink,bxp,byp,3.2,1,1,1,6); [-1,1].forEach(s=>{ B(.55,.05,.22,ink,bxp+s*.36,byp+.05,3.2).rotation.z=-s*.45; }); });
    mush(-.2,2.8,.9,'c'); mush(1.9,2.9,.6,'m');
  }
}
function skyForest(c){
  skyGrad(c,[[0,'#0c0926'],[.45,'#251d5e'],[.78,'#4a3a92'],[1,'#33296b']]);
  const r=rng(7); for(let i=0;i<240;i++){ c.fillStyle=`rgba(255,255,255,${.35+r()*.65})`; c.beginPath(); c.arc(r()*SK.W,r()*SK.H*.62,.6+r()*1.7,0,7); c.fill(); }
  for(let i=0;i<7;i++){ const x=r()*SK.W, y=SK.H*(.3+r()*.25); const g=c.createRadialGradient(x,y,0,x,y,180); g.addColorStop(0,'rgba(120,100,210,.22)'); g.addColorStop(1,'rgba(120,100,210,0)'); c.save(); c.translate(x,y); c.scale(1,.28); c.translate(-x,-y); c.fillStyle=g; c.fillRect(x-180,y-180,360,360); c.restore(); }
  const mx=skx(15), my=sky_y(21); glowDot(c,mx,my,190,'255,240,170',.4); c.fillStyle='#fff6c8'; c.beginPath(); c.arc(mx,my,40,0,7); c.fill();
  c.fillStyle='#f0e3a0'; [[-14,-10,7],[12,8,9],[-6,16,5]].forEach(([dx,dy,rr])=>{ c.beginPath(); c.arc(mx+dx,my+dy,rr,0,7); c.fill(); });
  c.strokeStyle='#7a6a9a'; c.lineWidth=3; c.lineCap='round'; [-1,1].forEach(s=>{ c.beginPath(); c.arc(mx+s*14,my-2,6,.2,PI-.2); c.stroke(); }); c.beginPath(); c.arc(mx,my+10,9,.3,PI-.3); c.stroke();     // a sleepy smiling moon
  skyPines(c,3,sky_y(0)-30,70,120,26,'#2a2266'); skyPines(c,4,sky_y(0)+5,55,95,22,'#1b1548');
}

/* =====================================================================
   CANDY LAND
   ===================================================================== */
function segCandy(t,K){
  const {B,C,S,P,T,flat}=K, r=rng(211+t*41);
  const pink=M('#ff9ec9',.5), mint=M('#9be8c8',.5), lilac=M('#c6b0ff',.5), lemon=M('#ffe58a',.55), peach=M('#ffc59a',.5), white=M('#ffffff',.7), red=M('#ff5d7a',.5), choc=M('#7a4527',.3),
        ginger=M('#c98a52',.35), cookie=M('#e0a868',.4), blue=M('#7cc8ff',.5);
  const swirl=(a,b)=>texMat(canvasTex(256,256,(c,w,h)=>{ c.fillStyle=a; c.fillRect(0,0,w,h); c.strokeStyle=b; c.lineWidth=30; c.lineCap='round';
    [0,PI].forEach(o=>{ c.beginPath(); for(let q=0;q<13.4;q+=.1){ const rr=q*9.2, x=128+Math.cos(q+o)*rr, y=128+Math.sin(q+o)*rr; q?c.lineTo(x,y):c.moveTo(x,y); } c.stroke(); }); }),.3);
  const cane=texMat(canvasTex(64,256,(c,w,h)=>{ c.fillStyle='#fff'; c.fillRect(0,0,w,h); c.fillStyle='#ff4d6d'; for(let k=-1;k<7;k++){ c.beginPath(); c.moveTo(0,k*48); c.lineTo(w,k*48+w*.7); c.lineTo(w,k*48+w*.7+24); c.lineTo(0,k*48+24); c.fill(); } }),.4);
  const waffle=texMat(canvasTex(128,128,(c,w,h)=>{ c.fillStyle='#e8ae62'; c.fillRect(0,0,w,h); c.strokeStyle='#b97a3a'; c.lineWidth=7; for(let k=-4;k<9;k++){ c.beginPath(); c.moveTo(k*20,0); c.lineTo(k*20+128,128); c.moveTo(k*20+128,0); c.lineTo(k*20,128); c.stroke(); } }),.3);
  const lolly=(x,z,s,mat,y0=0)=>{ C(.14*s,.14*s,2.8*s,white,x,1.4*s,z,8); C(1.9*s,1.9*s,.2*s,mat,x,3.4*s,z-.05,28).rotation.x=PI/2; };
  const gum=(x,z,d,m)=>S(d,m,x,0,z,1,.55,1,12);
  const sprink=(x,y,z,n,rad)=>{ const cols=[red,lemon,mint,blue,lilac]; for(let i=0;i<n;i++){ const a=i*2.4; B(.2,.07,.05,cols[i%5],x+Math.cos(a)*rad*(.3+(i%3)*.3),y+Math.sin(a)*rad*.5,z).rotation.z=i; } };
  const wrapped=(x,z,m)=>{ S(.55,m,x,.3,z,1.2,.9,.9,8); [-1,1].forEach(s=>C(0,.4,.3,m,x+s*.5,.3,z,6).rotation.z=-s*PI/2); };
  gum(-1.2+(r()-.5)*.6,13,7.5,mint); gum(1.6,15,9,lilac); gum(-.2,11,5,peach);                                                // far gumdrop hills
  lolly(r()<.5?-1.4:1.3,7,.9,t%2?swirl('#c6b0ff','#fff'):swirl('#9be8c8','#fff'));
  wrapped(-1.7,2.5,pink); wrapped(1.8,2.7,lemon);
  if(t===0){                                           // three swirly lollipops
    lolly(-1.2,3.2,1.25,swirl('#ff9ec9','#ffffff')); lolly(.4,3.6,1.05,swirl('#7cc8ff','#ffffff')); lolly(1.6,3.0,.8,swirl('#ffd23f','#ff9ec9'));
  } else if(t===1){                                    // gingerbread house with icing roof
    const x=0, z=3.6; B(2.6,1.7,1.8,ginger,x,.85,z); [-1,1].forEach(s=>{ B(1.7,.2,2.1,white,x+s*.62,2.15,z).rotation.z=s*.62; });
    B(.5,1.0,.06,choc,x-.55,.5,z-.92); S(.1,lemon,x-.38,.5,z-.96); B(.55,.55,.06,GM('#fff2a8'),x+.6,1.0,z-.92);
    for(let i=0;i<5;i++){ S(.3,[pink,mint,lemon,blue,lilac][i],x-1.25+i*.62,1.8+(i%2)*.0,z-1.15,1,1,.7,8); }
    B(.35,.9,.35,ginger,x+.8,2.8,z+.2); B(.45,.12,.45,white,x+.8,3.3,z+.2);
    [-1,1].forEach(s=>{ C(.16,.16,2.4,cane,x+s*1.9,1.2,z-.8,8); T(.5,.14,red,x+s*1.9+(s>0?-.2:.2),2.45,z-.8,14).rotation.x=0; });
    for(let i=0;i<4;i++) B(.9,.12,.5,white,x-1.2+i*.8,1.72,z-.98).rotation.z=((i%2)-.5)*.2;
  } else if(t===2){                                    // ice-cream cones and a cupcake
    const x=.4, z=3.5; C(1.4,0,2.5,waffle,x,1.25,z,14); S(1.6,pink,x,2.8,z,1,.9,1,12); S(1.4,mint,x,3.85,z,1,.9,1,12); S(.5,red,x,4.75,z,1,1,1,8);
    S(.35,white,x+.2,2.35,z-.7,.9,1.7,.7,8); sprink(x,3.9,z-.64,10,.6); sprink(x,2.8,z-.7,10,.7);
    const x2=2.0, z2=4.2; C(1.0,0,1.9,waffle,x2,.95,z2,12); S(1.2,lilac,x2,2.15,z2,1,.9,1,12); S(.4,red,x2,2.9,z2,1,1,1,8);
    const cx=-1.6, cz=3.0; C(1.2,.9,.7,pink,cx,.35,cz,14); S(1.3,white,cx,.95,cz,1,.6,1,12); S(.95,pink,cx,1.3,cz,1,.6,1,12); S(.35,red,cx,1.75,cz,1,1,1,8); sprink(cx,1.0,cz-.55,7,.5);
  } else {                                             // giant donut and cookie
    const x=-.4, z=3.6; T(2.6,1.0,cookie,x,1.9,z,28).rotation.x=PI/2; const fr=T(2.6,.96,pink,x,1.9,z-.1,28); fr.rotation.x=PI/2; fr.scaling.z=.8;
    const cols=[red,lemon,mint,blue,white]; for(let i=0;i<14;i++){ const a=i*.9; const rr=1.3+((i%3)-1)*.28; B(.22,.07,.05,cols[i%5],x+Math.cos(a)*rr,1.9+Math.sin(a)*rr,z-.5).rotation.z=i; }
    const kx=1.9, kz=3.9; C(2,2,.3,cookie,kx,1.2,kz,22).rotation.x=PI/2; for(let i=0;i<7;i++) S(.28,choc,kx+Math.cos(i*1.1)*(.2+i*.1),1.2+Math.sin(i*1.1)*(.2+i*.1),kz-.2,1,1,.5,6);
    wrapped(.6,2.3,blue);
  }
}
function skyCandy(c){
  skyGrad(c,[[0,'#ffb4e1'],[.4,'#ffdcf1'],[.78,'#fff3d8'],[1,'#ffe0ee']]);
  const rb=['#ff7b9a','#ffb15c','#ffe36b','#7fe39a','#7cc8ff','#b79cff']; rb.forEach((col,i)=>{ c.strokeStyle=col; c.lineWidth=16; c.beginPath(); c.arc(skx(-6),sky_y(-8),420-i*15,PI*1.12,PI*1.88); c.stroke(); });
  [[-26,20,3.2],[8,26,2.6],[22,17,3.6],[-44,28,2.8],[44,28,2.4]].forEach(([x,y,s])=>skyCloud(c,skx(x),sky_y(y),s*10,'rgba(255,255,255,.92)'));
  glowDot(c,skx(-20),sky_y(25),130,'255,240,160',.6); c.fillStyle='#fff4a8'; c.beginPath(); c.arc(skx(-20),sky_y(25),38,0,7); c.fill();
  const r=rng(8); [['#c6b0ff',46],['#9be8c8',64],['#ffc59a',50],['#ffb3d6',72]].forEach(([col,rad],k)=>{ for(let x=-40;x<SK.W+60;x+=200+k*26){ c.fillStyle=col; c.beginPath(); c.ellipse(x+r()*60+k*40,sky_y(0)+14,rad*1.5,rad*(.55+k*.04),0,PI,0); c.fill(); } });
  for(let x=0;x<SK.W;x+=170){ c.fillStyle='#fff'; c.fillRect(x+r()*40,sky_y(0)-100,6,100); c.fillStyle=['#ff7b9a','#7cc8ff','#ffd23f','#7fe39a'][(x/170|0)%4]; c.beginPath(); c.arc(x+r()*40+3,sky_y(0)-110,26,0,7); c.fill(); }
  c.fillStyle='#ffd0e6'; c.fillRect(0,sky_y(0)+4,SK.W,SK.H);
}

/* =====================================================================
   SNOWY MOUNTAIN
   ===================================================================== */
function segSnow(t,K){
  const {B,C,S,P,T,flat,limb}=K, r=rng(307+t*53);
  const snow=M('#f6faff',.55), shade=M('#dbe8fb',.5), pine=M('#2f7a74',.3), pine2=M('#3d9188',.3), ice=M('#9fe6ff',.7), rock=M('#8c97bd',.35), coal=M('#20284a',0), carrot=M('#ff8a2a',.5),
        scarf=M('#ff4d6d',.5), wood=M('#8a5a44',.3), navy=M('#2d3560',.35), orange=M('#ffa22e',.5), hat=M('#2b2f5c',.3), ink=M('#26244a',0);
  const snowPine=(x,z,h,m)=>{ C(h*.07,h*.09,h*.25,wood,x,h*.12,z,6); for(let i=0;i<4;i++){ const w=h*(.5-.1*i), hh=h*.36, y=h*(.14+.2*i)+hh/2; C(0,w,hh,m,x,y,z,9); C(0,w*.8,hh*.62,snow,x,y+hh*.2,z-.02,9); } };
  const mound=(x,z,d,h)=>S(d,snow,x,0,z,1,h,1,12);
  const snowman=(x,z,s)=>{ S(1.9*s,snow,x,.85*s,z,1,1,1,12); S(1.4*s,snow,x,2.1*s,z,1,1,1,12); S(1.0*s,snow,x,3.05*s,z,1,1,1,12);
    [-1,1].forEach(q=>{ S(.12*s,coal,x+q*.18*s,3.15*s,z-.46*s,1,1,.6,6); B(.08*s,.08*s,.05,coal,x+q*.2*s-q*.05*s,2.82*s,z-.47*s).rotation.z=q*.0; });
    for(let i=-2;i<=2;i++) S(.07*s,coal,x+i*.09*s,2.78*s-(i*i)*.014*s,z-.48*s,1,1,.6,5);
    C(0,.16*s,.55*s,carrot,x,3.02*s,z-.62*s,6).rotation.x=-PI/2;
    [2.3,1.9,1.5].forEach(y=>S(.14*s,coal,x,y*s,z-.68*s,1,1,.6,6));
    T(1.0*s,.2*s,scarf,x,2.6*s,z,16); B(.26*s,.75*s,.08*s,scarf,x+.3*s,2.25*s,z-.5*s).rotation.z=.15;
    C(1.0*s,1.0*s,.1*s,hat,x,3.55*s,z,16); C(.62*s,.62*s,.7*s,hat,x,3.9*s,z,16); C(.64*s,.64*s,.14*s,scarf,x,3.65*s,z,16);
    [-1,1].forEach(q=>{ C(.05*s,.07*s,1.3*s,wood,x+q*1.0*s,2.2*s,z,5).rotation.z=q*1.1; }); };
  const penguin=(x,z,s)=>{ S(1.2*s,navy,x,.7*s,z,1,1.2,.9); S(.9*s,M('#ffffff',.8),x,.62*s,z-.2*s,1,1.15,.55); S(.85*s,navy,x,1.62*s,z,1,1,1);
    [-1,1].forEach(q=>{ S(.22*s,M('#ffffff',.9),x+q*.2*s,1.7*s,z-.38*s,1,1.1,.5,6); S(.1*s,coal,x+q*.2*s,1.7*s,z-.46*s,1,1,.5,5); S(.34*s,navy,x+q*.64*s,.95*s,z,.4,1.3,.7,6).rotation.z=-q*.35; B(.36*s,.08*s,.5*s,orange,x+q*.22*s,.04*s,z-.15*s); });
    C(0,.22*s,.4*s,orange,x,1.5*s,z-.46*s,5).rotation.x=-PI/2; };
  const crystal=(x,z,s,th)=>{ const o=C(0,.8*s,3*s,ice,x,1.5*s,z,5); o.rotation.z=th; return o; };
  mound(-1.6,6.2,5.5,.3); mound(1.8,6.8,6.5,.35);
  for(let i=0;i<3;i++) snowPine(-1.6+i*1.6+(r()-.5)*.6,9+r()*5,6+r()*3.5,i%2?pine:pine2);
  if(t===0){                                           // snowmen
    snowman(-.4,3.5,1); snowman(1.5,2.9,.55); mound(-1.9,2.8,2.2,.35); mound(.6,2.4,1.6,.3);
  } else if(t===1){                                    // an igloo, a sled and a little pine
    const x=-.2, z=3.8; S(4.2,M('#f2f8ff',.6),x,0,z,1,.78,1,14); C(1.3,1.3,1.6,M('#f2f8ff',.6),x,.55,z-1.7,12).rotation.x=PI/2; C(.95,.95,.05,coal,x,.5,z-2.52,14).rotation.x=PI/2;
    [[.55,1.9],[1.0,1.55],[1.4,1.05]].forEach(([h,R])=>{ T(R*1.9,.07,shade,x,h,z,24); });
    B(1.3,.1,.55,wood,1.9,.28,2.6); [-1,1].forEach(q=>B(1.4,.07,.07,ink,1.9,.14,2.6+q*.22)); B(.1,.4,.1,wood,1.3,.2,2.6); snowPine(-1.9,3.0,3,pine);
  } else if(t===2){                                    // a big snowy pine and two penguins
    snowPine(-.9,3.6,7.5,pine); snowPine(1.8,4.4,4.5,pine2); penguin(.7,2.8,1); penguin(1.6,2.5,.65); mound(.9,2.5,3.2,.25);
  } else {                                             // ice crystals, a lamp post and rocks
    [[-1.4,3.4,1.2,.12],[-.7,3.8,1.7,-.1],[.1,3.6,1.0,.28],[1.1,3.5,1.5,-.2]].forEach(([x,z,s,th])=>crystal(x,z,s,th));
    const lx=1.8; C(.1,.14,3.4,ink,lx,1.7,3.0,6); S(.55,GM('#ffe3a0'),lx,3.5,3.0,1,1.2,1,8); P(3.2,3.2,glowMat('#ffe3a0',.6),lx,3.5,3.2); S(.7,snow,lx,3.9,3.0,1,.5,1,8);
    S(1.7,rock,-1.9,.5,2.8,1,.7,.9,8); S(1.4,snow,-1.9,.8,2.8,1,.4,.9,8); B(1.5,.12,.5,wood,.3,.55,2.6); B(1.5,.06,.55,snow,.3,.64,2.6); [-.6,.6].forEach(q=>B(.1,.55,.4,ink,.3+q,.28,2.6));
  }
}
function skySnow(c){
  skyGrad(c,[[0,'#5a8cd6'],[.4,'#8fb8ea'],[.78,'#cfe2f7'],[1,'#e8f2ff']]);
  [[-30,16,3],[6,24,2.8],[28,14,3.4],[-8,30,2.4]].forEach(([x,y,s])=>skyCloud(c,skx(x),sky_y(y),s*10,'rgba(255,255,255,.85)'));
  glowDot(c,skx(18),sky_y(20),200,'255,250,220',.5); c.fillStyle='#fffbe0'; c.beginPath(); c.arc(skx(18),sky_y(20),34,0,7); c.fill();
  skyRidge(c,5,sky_y(0)+10,120,260,150,'#a6bfe6','#f2f8ff'); skyRidge(c,9,sky_y(0)+10,60,150,110,'#8aa6d8','#ffffff'); skyPines(c,12,sky_y(0)-8,40,80,24,'#5e87a6');
  c.fillStyle='#e6f0ff'; c.fillRect(0,sky_y(0)+6,SK.W,SK.H);
}

/* =====================================================================
   PIRATE BEACH
   ===================================================================== */
function segBeach(t,K){
  const {B,C,S,P,T,flat,limb}=K, r=rng(401+t*59);
  const trunk=M('#a06f3e',.35), frond=M('#3dbd6d',.4), frond2=M('#2f9e5a',.4), sand=M('#f2d48a',.5), wet=M('#dcbc76',.45), wood=M('#8b5a2b',.35), wood2=M('#b5803f',.4), red=M('#ff5555',.5), white=M('#ffffff',.7),
        gold=M('#ffd23f',.7), dark=M('#2d2250',0), metal=M('#59607c',.3), crab=M('#ff6a4d',.5), sea=M('#3ec3dd',.6), sea2=M('#63d6e8',.6), foam=GM('#ffffff',.85), star=M('#ff8fa6',.5), ink=M('#26244a',0);
  const palm=(x,z,s,lean)=>{ let px=x, py=0; const segs=5; for(let i=0;i<segs;i++){ const th=-lean*(.04+i*.08), L=1.15*s; C(.3*s*(1-i*.1),.38*s*(1-i*.08),L,trunk,px-Math.sin(th)*L/2,py+Math.cos(th)*L/2,z,7).rotation.z=th; px-=Math.sin(th)*L; py+=Math.cos(th)*L; }
    for(let k=0;k<7;k++){ const phi=k*PI*2/7+.3, len=3.4*s, psi=-.25-(k%2)*.15, cx=px+Math.cos(phi)*len/2*Math.cos(psi), cy=py+.1+len/2*Math.sin(psi), cz=z+Math.sin(phi)*len/2*Math.cos(psi);
      const f=S(1,k%2?frond:frond2,cx,cy,cz,len,.1,.95*s,6); f.rotation.y=-phi; f.rotation.z=psi; }
    [[-.2,-.1],[.2,-.12],[0,.15]].forEach(([dx,dz])=>S(.4*s,M('#6b4a2b',.3),px+dx*s,py-.25*s,z+dz*s,1,1,1,6)); };
  const barrel=(x,z,s)=>{ C(.85*s,.85*s,1.2*s,wood,x,.6*s,z,12); [.25,.6,.95].forEach(y=>T(.9*s,.07*s,metal,x,y*s,z,16)); C(.8*s,.8*s,.04*s,wood2,x,1.2*s,z,12); };
  const crate=(x,z,s,rot,y0=0)=>{ B(.9*s,.9*s,.9*s,wood2,x,y0+.45*s,z).rotation.y=rot; [-1,1].forEach(q=>B(.1*s,.95*s,.95*s,wood,x+q*.4*s*Math.cos(rot),y0+.45*s,z-q*.4*s*Math.sin(rot)).rotation.y=rot); };
  flat(4.02,20,sea,0,.03,19); [10,13.5,17.5,22,27].forEach((z,i)=>flat(4.02,.14,foam,0,.05,z+(i%2)*.6)); flat(4.02,2,wet,0,.02,8);          // the sea beyond the sand
  flat(1.6,.1,GM('#ffffff',.7),-1+(t%2)*1.6,.06,11.2); flat(1.2,.1,GM('#ffffff',.6),1.2-(t%3)*.9,.06,15.3);
  palm(-1.6+(r()-.5)*.6,7.5,.7,1); palm(1.6,8.4,.8,-1);                                                                                      // small palms further back
  [[-1.8,2.3],[1.9,2.6]].forEach(([x,z],k)=>{ for(let i=0;i<5;i++){ const a=i*PI*2/5; S(.3,star,x+Math.cos(a)*.22,.05,z+Math.sin(a)*.22,1.8,.25,.55,6).rotation.y=-a; } });
  if(t===0){ palm(-.3,3.6,1.15,1); barrel(1.7,2.8,.8); }
  else if(t===1){                                      // treasure chest, X marks the spot, a shovel
    const x=.3, z=3.4; B(1.7,.8,1.1,wood,x,.4,z); [-.6,.6].forEach(q=>B(.14,.84,1.14,gold,x+q,.41,z)); B(1.7,.12,1.1,gold,x,.04,z);
    const lid=B(1.7,.14,1.0,wood,x,1.35,z+.65); lid.rotation.x=-1.25; [-.6,.6].forEach(q=>{ const g=B(.14,.16,1.04,gold,x+q,1.35,z+.65); g.rotation.x=-1.25; });
    for(let i=0;i<9;i++) S(.38,gold,x-.55+(i%5)*.28,.9+(i>4?.18:0),z-.05+(i%2)*.08,1,.55,1,8); [[-.2,-.5],[.4,-.6],[.9,-.35]].forEach(([dx,dz])=>C(.3,.3,.05,gold,x+dx,.04,z+dz-.4,10));
    P(3.4,3.4,glowMat('#ffe27a',.6),x,1.2,z+.9);
    const xs=-1.7; B(1.0,.03,.18,red,xs,.04,2.4).rotation.y=.78; B(1.0,.03,.18,red,xs,.04,2.4).rotation.y=-.78;
    C(.07,.07,1.8,wood,1.9,.9,2.5,5).rotation.z=.25; B(.4,.5,.06,metal,2.25,.15,2.5);
  } else if(t===2){                                    // sandcastle, a striped umbrella and a crab
    const x=-.9, z=3.4; B(2.2,1.0,1.3,sand,x,.5,z); [-1,1].forEach(q=>{ C(.8,.95,1.9,sand,x+q*1.25,.95,z,10); C(0,.95,.7,red,x+q*1.25,2.2,z,10); C(.03,.03,.5,white,x+q*1.25,2.75,z,4); B(.3,.18,.03,red,x+q*1.25+.17,2.85,z).rotation.z=0; });
    B(.5,.7,.06,dark,x,.4,z-.68); [-.75,-.25,.25,.75].forEach(q=>B(.28,.22,.3,sand,x+q,1.1,z-.5)); [-1,1].forEach(q=>B(.14,.3,.06,dark,x+q*1.25,1.3,z-.5));
    const um=texMat(canvasTex(256,16,(c,w,h)=>{ for(let i=0;i<8;i++){ c.fillStyle=i%2?'#fff':'#ff5555'; c.fillRect(i*32,0,32,h); } }),.65);
    C(.08,.08,3.4,white,1.6,1.7,3.8,6).rotation.z=.15; C(0,3.4,1.0,um,1.35,3.6,3.8,16).rotation.z=.15;
    const cxp=.7, cz=2.4; S(.7,crab,cxp,.3,cz,1.3,.55,1,8); [-1,1].forEach(q=>{ S(.34,crab,cxp+q*.68,.4,cz-.1,1,.7,.7,6); S(.14,white,cxp+q*.18,.62,cz-.25,1,1,1,5); S(.06,ink,cxp+q*.18,.63,cz-.31,1,1,1,4); for(let i=0;i<3;i++) B(.28,.04,.04,crab,cxp+q*(.52+i*.04),.1,cz+.05+i*.12); });
  } else {                                             // the pirate flag, barrels and crates
    const x=-.2; C(.12,.17,7,wood,x,3.5,3.6,6); S(.3,gold,x,7.05,3.6,1,1,1,6);
    const flag=texMat(canvasTex(256,160,(c,w,h)=>{ c.fillStyle='#1f1a3a'; c.fillRect(0,0,w,h); c.strokeStyle='#fff'; c.lineWidth=16; c.lineCap='round'; c.beginPath(); c.moveTo(60,30); c.lineTo(196,132); c.moveTo(196,30); c.lineTo(60,132); c.stroke();
      c.fillStyle='#fff'; c.beginPath(); c.arc(128,70,38,0,7); c.fill(); c.fillRect(104,90,48,34); c.fillStyle='#1f1a3a'; [-16,16].forEach(o=>{ c.beginPath(); c.arc(128+o,68,10,0,7); c.fill(); }); c.beginPath(); c.moveTo(128,82); c.lineTo(122,96); c.lineTo(134,96); c.fill();
      for(let i=0;i<4;i++) c.fillRect(112+i*10,106,3,16); }),.8); flag.backFaceCulling=false;
    P(2.5,1.56,flag,x+1.3,6.1,3.55);
    barrel(1.3,2.9,1); barrel(2.0,3.0,.7); crate(-1.6,2.7,1,.3); crate(-1.55,2.7,.7,0,.9); C(.05,.05,1.2,M('#c9a25f',.4),.4,.1,2.4,5).rotation.z=PI/2;
  }
}
function skyBeach(c){
  skyGrad(c,[[0,'#3fa9f5'],[.4,'#7fcdfb'],[.7,'#c5ecff'],[.86,'#fff0cc'],[1,'#d6f3ff']]);
  glowDot(c,skx(-14),sky_y(22),230,'255,244,170',.55); c.fillStyle='#fffbd0'; c.beginPath(); c.arc(skx(-14),sky_y(22),38,0,7); c.fill();
  [[-34,17,3.4],[-4,28,2.6],[14,19,3.2],[34,29,2.8],[-50,26,2.4]].forEach(([x,y,s])=>skyCloud(c,skx(x),sky_y(y),s*10,'rgba(255,255,255,.95)'));
  const sg=c.createLinearGradient(0,sky_y(3.4),0,sky_y(0)+8); sg.addColorStop(0,'#58cfe6'); sg.addColorStop(1,'#2ea5cc'); c.fillStyle=sg; c.fillRect(0,sky_y(3.4),SK.W,SK.H);        // the sea reaching up to the horizon
  c.fillStyle='rgba(255,255,255,.5)'; const r=rng(12); for(let i=0;i<60;i++) c.fillRect(r()*SK.W,sky_y(3.2)+r()*(sky_y(0)-sky_y(3.2)),20+r()*40,2);
  c.fillStyle='#2e8f6a'; c.beginPath(); c.ellipse(skx(26),sky_y(3.3),120,22,0,PI,0); c.fill(); c.fillStyle='#6b4a2b'; c.fillRect(skx(24),sky_y(3.3)-70,5,70); c.fillStyle='#2e8f6a'; [-1,1].forEach(s=>{ c.beginPath(); c.ellipse(skx(24)+s*22,sky_y(3.3)-72,26,6,s*.3,0,7); c.fill(); });
  c.fillStyle='#fff'; c.beginPath(); c.moveTo(skx(-30),sky_y(3.3)-60); c.lineTo(skx(-30),sky_y(3.3)-10); c.lineTo(skx(-30)+34,sky_y(3.3)-10); c.fill(); c.fillStyle='#7a4a2a'; c.fillRect(skx(-30)-14,sky_y(3.3)-8,56,8);   // a far-away ship
}

/* =====================================================================
   THE PLACES
   ===================================================================== */
const PLACES=[
  {id:'school',name:'School Corridor',icon:'🏫',desc:'Where the adventure begins!',
   fog:'#aab0ea',fogD:.017,amb:'#8c92d8',hemi:['#ffffff','#9da3e6',.55],sunC:'#ffffff',sunI:.62,vig:[.35,.38,.75],blob:'#2c3086',
   floor:{tex:()=>floorTex,diff:[.78,.8,.95],em:['#7f86cc',.12],spec:[.12,.12,.2],pow:80,mirror:.2,z:-5,sz:1},
   tour:()=>bossHomework,protos:()=>SCHOOL_PROTOS,sky:null,petals:{...PETAL0},dust:{...DUST0}},
  {id:'forest',name:'Haunted Forest',icon:'🌲',desc:'Glowing mushrooms, a friendly ghost and a grumpy red pig!',
   fog:'#33296b',fogD:.019,amb:'#7468c8',hemi:['#cfc8ff','#5a4cb0',.66],sunC:'#d8e4ff',sunI:.5,vig:[.1,.05,.3],blob:'#0c0a30',
   floor:{draw:floorMoss,tile:5,diff:[.95,1,1.1],em:['#6a5cc8',.2],spec:[.05,.08,.1],pow:30,mirror:.1,z:8,sz:3},
   seg:segForest,sky:skyForest,tour:()=>bossPig,
   petals:{...PETAL0,tex:'dot',c1:[1,.95,.45,.95],c2:[.6,1,.55,.8],cd:[1,.9,.4,0],size:[.14,.34],life:[5,9],dir1:[-.25,-.05,-.1],dir2:[.25,.2,.1],power:[.15,.5],grav:[0,0,0],box:[[-13,.4,-4],[13,4.6,6]],spin:[0,0],rate:6},
   dust:{...DUST0,c1:[.75,.65,1,.55],c2:[.5,.85,1,.4]}},
  {id:'candy',name:'Candy Land',icon:'🍭',desc:'Lollipops, a gingerbread house and a bouncy pink blob!',
   fog:'#ffd8ec',fogD:.014,amb:'#ffb0d6',hemi:['#fff4fb','#ffb6dd',.66],sunC:'#fff6e0',sunI:.6,vig:[1,.55,.82],blob:'#9a3f7e',
   floor:{draw:floorCandy,tile:4,diff:[.95,.95,1],em:['#ff9ec9',.2],spec:[.3,.25,.3],pow:60,mirror:.12,z:8,sz:3},
   seg:segCandy,sky:skyCandy,tour:()=>bossPinkBlob,
   petals:{...PETAL0,tex:'heart',c1:[1,.55,.78,.95],c2:[1,.9,.45,.9],cd:[1,.8,.9,0],size:[.28,.5],life:[8,13],dir1:[-.4,-.5,0],dir2:[.2,-.15,0],grav:[0,-.15,0],blend:'std',rate:4},
   dust:{...DUST0,c1:[1,1,1,.9],c2:[1,.8,.92,.7],blend:'std'}},
  {id:'snow',name:'Snowy Mountain',icon:'⛄',desc:'Snowmen, penguins and a grumpy yeti!',
   fog:'#d3e4f8',fogD:.017,amb:'#a9c4ee',hemi:['#ffffff','#b8cdf0',.66],sunC:'#fffbe8',sunI:.62,vig:[.45,.65,1],blob:'#5063a6',
   floor:{draw:floorSnow,tile:6,diff:[.98,1,1],em:['#cfe0ff',.22],spec:[.25,.28,.4],pow:60,mirror:.16,z:8,sz:3},
   seg:segSnow,sky:skySnow,tour:()=>bossYeti,
   petals:{...PETAL0,tex:'dot',c1:[1,1,1,.95],c2:[.88,.94,1,.85],cd:[1,1,1,0],size:[.12,.3],life:[5,7],dir1:[-.45,-1.5,-.1],dir2:[.35,-.9,.1],power:[.4,.9],grav:[0,-.35,0],box:[[-14,7,-4],[14,10,7]],spin:[0,0],blend:'std',rate:22},
   dust:{...DUST0,c1:[1,1,1,.95],c2:[.75,.9,1,.7],size:[.04,.1],blend:'add'}},
  {id:'beach',name:'Pirate Beach',icon:'🏴‍☠️',desc:'Palm trees, a treasure chest and Captain Barbarossa!',
   fog:'#d3f1ff',fogD:.013,amb:'#9ad6f0',hemi:['#fffbea','#a9dff2',.66],sunC:'#fff4cc',sunI:.66,vig:[.3,.75,.95],blob:'#8a6a2a',
   floor:{draw:floorSand,tile:5,diff:[1,1,.98],em:['#ffe9a8',.2],spec:[.12,.1,.05],pow:30,mirror:.1,z:8,sz:3},
   seg:segBeach,sky:skyBeach,tour:()=>bossBarbarossa,
   petals:{...PETAL0,tex:'bubble',c1:[1,1,1,.75],c2:[.8,.96,1,.55],cd:[1,1,1,0],size:[.25,.5],life:[7,11],dir1:[-.2,.2,0],dir2:[.2,.6,0],power:[.2,.5],grav:[0,.06,0],box:[[-13,.3,-4],[13,3.2,6]],spin:[0,0],blend:'std',rate:3},
   dust:{...DUST0,c1:[1,1,.85,.7],c2:[1,.95,.7,.5],blend:'add'}},
];
/* what the player can pick on the hero select screen: every place, or a different one on every level */
const PLACE_CHOICES=[{id:'tour',icon:'🗺️',name:'Adventure tour',desc:'A new place and a new boss on every level!'}]
  .concat(PLACES.map(p=>({id:p.id,icon:p.icon,name:p.name,desc:p.desc})),[{id:'random',icon:'🎲',name:'Surprise me!',desc:'A different place on every level, picked at random'}]);

let PLACE=PLACES[0];
const protoCache={};
function buildProto(p,t){
  const parts=[], k=kit(m=>{ parts.push(m); return m; }); p.seg(t,k);
  const merged=BABYLON.Mesh.MergeMeshes(parts,true,true,undefined,false,true); merged.isVisible=false; merged.isPickable=false; return keepNode(backdrop(merged));
}
function placeProtos(p){                     // anything not prepared yet is built right now
  if(p.protos) return p.protos();
  const a=protoCache[p.id]||(protoCache[p.id]=[]);
  for(let t=0;t<4;t++) if(!a[t]) a[t]=buildProto(p,t);
  return a;
}
function floorOf(p){ const f=p.floor; if(!f._tex) f._tex=f.tex?f.tex():floorTexOf(f.draw,f.tile,f.sz); return f._tex; }
/* get a place ready in the background: one small piece at a time, so no single frame has to build everything (a stutter) */
function prepPlace(p,delay=0){
  if(!p||p.protos||p._prep) return; p._prep=true;
  const a=protoCache[p.id]||(protoCache[p.id]=[]);
  const steps=[0,1,2,3].map(t=>()=>{ if(!a[t]) a[t]=buildProto(p,t); });
  steps.push(()=>floorOf(p),()=>{ if(p.sky) skyMatOf(p); });
  steps.forEach((fn,i)=>setTimeout(()=>{ try{ fn(); }catch(e){ console.warn('place not prepared:',p.id,e); } },300+delay+i*400));
}
/* ---- the adventure tour: level 1 in the school, level 2 in the forest, ... then round again; every place has its own boss ---- */
const TOUR=['school','forest','candy','snow','beach'];
const tourPlace=level=>PLACES.find(p=>p.id===TOUR[(level-1)%TOUR.length]);
/* the place a level takes place in, or null when it is picked at random */
function placeForLevel(level){ if(save.place==='random') return null; if(save.place==='tour') return tourPlace(level); return PLACES.find(p=>p.id===save.place)||PLACES[0]; }
/* the painted sky: one plane behind everything; it follows the camera a little slower than the scenery, so the moon / sun drifts */
const skyPlane=keepNode(backdrop(BABYLON.MeshBuilder.CreatePlane('placeSky',{width:150,height:50},scene)));
skyPlane.position.set(0,14,30); skyPlane.isPickable=false; skyPlane.alwaysSelectAsActiveMesh=true; skyPlane.setEnabled(false);
function placeFollow(camX){ skyPlane.position.x=camX*.96; }
function skyMatOf(p){
  if(p._skyMat) return p._skyMat;
  const m=new BABYLON.StandardMaterial('sky_'+p.id,scene); m.emissiveTexture=canvasTex(SK.W,SK.H,p.sky); m.disableLighting=true; m.backFaceCulling=false; m.fogEnabled=false;
  m.emissiveColor=BABYLON.Color3.Black(); return p._skyMat=m;      // (Babylon ADDS the emissive colour to the emissive texture, so it must be black or the sky washes out to white)
}
function setPlace(id){
  const p=PLACES.find(q=>q.id===id)||PLACES[0]; PLACE=p;
  document.documentElement.style.background=document.body.style.background=p.fog;      // the canvas is not cleared (it stays see-through), so the page colour behind it matches the fog
  const fog=hexC(p.fog); scene.fogColor=fog; scene.fogDensity=p.fogD; scene.clearColor=new BABYLON.Color4(fog.r,fog.g,fog.b,1); scene.ambientColor=hexC(p.amb);
  hemi.diffuse=hexC(p.hemi[0]); hemi.groundColor=hexC(p.hemi[1]); hemi.intensity=p.hemi[2]; sun.diffuse=hexC(p.sunC); sun.intensity=p.sunI;
  scene.imageProcessingConfiguration.vignetteColor=new BABYLON.Color4(p.vig[0],p.vig[1],p.vig[2],0); shadowMat.emissiveColor=hexC(p.blob);
  const f=p.floor;
  floorMat.diffuseTexture=floorOf(p); floorMat.diffuseColor=new BABYLON.Color3(...f.diff); floorMat.emissiveColor=hexC(f.em[0]).scale(f.em[1]);
  floorMat.specularColor=new BABYLON.Color3(...f.spec); floorMat.specularPower=f.pow; mirror.level=f.mirror; floor.position.z=f.z; floor.scaling.z=f.sz;
  if(p.sky){ skyPlane.material=skyMatOf(p); skyPlane.setEnabled(true); } else skyPlane.setEnabled(false);
  // the repeating wall / scenery pieces: new instances at the same spots, so a swap in the middle of a run is seamless
  const protos=placeProtos(p), xs=SEGS.map(s=>s.position.x);
  SEGS.forEach(s=>{ const i=mirrorList.indexOf(s); if(i>=0) mirrorList.splice(i,1); s.dispose(); }); SEGS.length=0;
  xs.forEach((x,i)=>{ const s=keepNode(backdrop(protos[i%4].createInstance('seg'+i))); s.position.x=x; s.isPickable=false; SEGS.push(s); });
  petalRate=p.petals.rate; dustRate=p.dust.rate; applyPS(petals,p.petals); applyPS(dust,p.dust);
  setEmit(petals,QUAL==='low'?Math.ceil(petalRate/2):petalRate); setEmit(dust,QUAL==='low'?Math.ceil(dustRate/2):dustRate);
}
/* the boss that belongs to this level in the current place (a place can have its own order, see PLACES) */
/* The first time a run comes to a place, that place's own boss is there (PLACES[].tour). When it comes back to the same place (the tour going
   round again, or a place that was picked for every level), the boss is a random one from EXTRA_BOSSES (targets.js), never the same twice in a row. */
let lastBoss=null;
function bossForLevel(level){
  if(level===1||!G.visited) G.visited={};
  const first=!G.visited[PLACE.id]; G.visited[PLACE.id]=1;
  const list=first?[(PLACE.tour||(()=>bossHomework))()]:EXTRA_BOSSES.filter(f=>f!==lastBoss);
  return lastBoss=rnd(list);
}
/* while a level is played, quietly get the next place of the tour ready */
function prepNextPlace(level){
  if(save.place==='tour') prepPlace(tourPlace(level+1));
  else if(save.place==='random') PLACES.filter(p=>p!==PLACE).forEach((p,i)=>prepPlace(p,i*700));       // any of them could come next
}

setPlace((placeForLevel(1)||PLACES[0]).id);
