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
const BOSSES=[bossHomework,bossBunny,bossEgg];
