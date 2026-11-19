/* Synthesised sound effects, the action music engine and speech.
   (plain script: shares the global scope with the other files in js/, load order matters - see index.html) */
'use strict';

/* =====================================================================
   AUDIO (all synthesised - no files) + speech
   ===================================================================== */
let AC = null, musicOn = true;
try{ if(localStorage.getItem('sh_music')==='off') musicOn=false; }catch(e){}
function audio(){
  if(!AC){ try{ AC = new (window.AudioContext||window.webkitAudioContext)(); }catch(e){} }
  if(AC && AC.state==='suspended') AC.resume();
  try{ if(AC) Music.start(); }catch(e){}
  return AC;
}
function tone(f,d=.15,type='sine',v=.15,slideTo=null,delay=0){
  const ac=audio(); if(!ac) return; const t=ac.currentTime+delay;
  const o=ac.createOscillator(), g=ac.createGain(); o.type=type; o.frequency.setValueAtTime(f,t);
  if(slideTo) o.frequency.exponentialRampToValueAtTime(slideTo,t+d);
  g.gain.setValueAtTime(.0001,t); g.gain.exponentialRampToValueAtTime(v,t+.012); g.gain.exponentialRampToValueAtTime(.0001,t+d);
  o.connect(g).connect(ac.destination); o.start(t); o.stop(t+d+.05);
}
let sfxNoise=null;   // one shared second of noise (making a new buffer for every sound wastes time)
function noise(d=.25,v=.2,f0=3000,f1=400,delay=0){
  const ac=audio(); if(!ac) return;
  if(!sfxNoise){ sfxNoise=ac.createBuffer(1,ac.sampleRate,ac.sampleRate); const a=sfxNoise.getChannelData(0); for(let i=0;i<a.length;i++) a[i]=Math.random()*2-1; }
  const s=ac.createBufferSource(); s.buffer=sfxNoise; s.loop=true; const f=ac.createBiquadFilter(); f.type='bandpass'; const t=ac.currentTime+delay;
  f.frequency.setValueAtTime(f0,t); f.frequency.exponentialRampToValueAtTime(f1,t+d);
  const g=ac.createGain(); g.gain.setValueAtTime(v,t); g.gain.exponentialRampToValueAtTime(.0001,t+d);
  s.connect(f).connect(g).connect(ac.destination); s.start(t,Math.random()*.5); s.stop(t+d+.05);
}
const SFX = {
  ding(i=0){ const b=523*Math.pow(1.122,i*2); tone(b,.14,'triangle',.22); tone(b*1.5,.3,'triangle',.2,null,.09); },
  wrong(){ tone(330,.35,'square',.08,110); },
  boing(){ tone(180,.4,'sine',.25,520); tone(520,.3,'sine',.15,200,.2); },
  bonk(){ tone(220,.18,'square',.2,70); noise(.12,.25,1500,300); },
  tick(){ tone(700,.06,'square',.1,400); },
  whoosh(){ noise(.28,.22,400,4000); },
  pop(){ tone(400,.12,'sine',.2,900); },
  coin(){ tone(988,.08,'square',.1); tone(1319,.25,'square',.1,null,.07); },
  thud(){ tone(110,.3,'sine',.4,50); noise(.15,.15,500,100); },
  bossHit(){ tone(140,.4,'sawtooth',.18,40); noise(.3,.3,2500,200); },
  fanfare(){ [523,659,784,1047,1319].forEach((f,i)=>tone(f,.28,'triangle',.2,null,i*.1)); },
  chest(){ [392,523,659,784,1047,1319].forEach((f,i)=>tone(f,.4,'triangle',.18,null,i*.09)); },
  swap(){ tone(600,.07,'triangle',.12); },
  buy(){ tone(784,.1,'square',.1); tone(1047,.1,'square',.1,null,.08); tone(1568,.2,'square',.1,null,.16); },
  zap(){ noise(.35,.3,6000,700); tone(1400,.25,'square',.07,160); },
  boom(){ tone(95,.5,'sine',.45,30); noise(.4,.3,900,80); },
  whistle(){ tone(500,.5,'sine',.07,1800); },
  crackle(){ for(let i=0;i<6;i++) noise(.06,.16,5000,2000,i*.05+Math.random()*.03); },
  laser(){ tone(1600,.35,'sawtooth',.07,220); tone(800,.35,'square',.05,110); },
  whirl(){ noise(.8,.2,300,2500); },
  slash(){ noise(.16,.2,2500,7000); },
  skull(){ tone(260,.22,'triangle',.14,140); },
  perfect(){ [784,988,1175,1568].forEach((f,i)=>tone(f,.2,'triangle',.16,null,i*.08)); },
};

/* ---------------------------------------------------------------------
   MUSIC - generated live, no audio files.
   140 BPM, Japanese "hirajoshi" scale. It is a whole song now, not a 4-bar loop:
     8 sections x 4 bars (about a minute) : A  A'  B  A  C(breakdown)  D(build-up)  B  A'
     every time the song comes round again it changes key, and each bar has a
     small chance of a different melody phrase or an echo, so it rarely sounds the same twice.
   Layers fade in and out with the game:
     menus  -> dreamy pad + soft arpeggio + bells
     play   -> taiko + kick + snare + hats + driving bass + arpeggio + bells
     combo x3+ / boss at 2 hearts -> heroic lead melody joins
     boss at 3 hearts -> hats double up to 16ths
   --------------------------------------------------------------------- */
const Music=(()=>{
  const BPM=140, SPS=60/BPM/4, A2=110;
  const hz=(b,s)=>b*Math.pow(2,s/12);
  const ARPS=[
    [0,7,12,15,12,7,3,7, 0,7,12,19,15,12,7,3],
    [0,12,7,12,15,12,7,12, 0,12,8,12,15,12,19,12],
    [12,7,3,0,3,7,12,15, 19,15,12,7,12,15,19,24],
    [0,3,7,3,12,7,15,12, 0,3,7,3,19,15,12,7],
  ];
  const BASSES=[                                              // 1 = root, 2 = octave up
    [1,0,1,0, 2,0,1,1, 1,0,1,0, 2,0,1,2],
    [1,0,0,1, 0,0,1,0, 1,0,2,0, 1,0,2,1],
    [1,1,0,1, 1,0,2,0, 1,1,0,1, 2,0,2,1],
    [1,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0],                     // breakdown: long notes
  ];
  const KICKS=[
    [1,0,0,0, 1,0,0,0, 1,0,0,1, 1,0,0,0],
    [1,0,0,0, 0,0,1,0, 1,0,0,0, 0,0,1,0],
    [1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,1,0],
  ];
  const TAIK=[1,0,0,1, 0,0,1,0, 1,0,0,0, 0,0,1,0];
  const SNAR=[0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0];
  const PH=[                                                  // [step, semitones above A3, length] - notes of A hirajoshi
    [[0,12,2],[3,15,1],[4,14,2],[6,12,2],[8,7,2],[10,8,1],[11,7,1],[12,3,4]],
    [[0,15,2],[2,12,1],[3,7,1],[4,8,2],[6,7,2],[8,3,2],[10,7,2],[12,12,4]],
    [[0,20,2],[2,15,2],[4,12,2],[6,8,2],[8,12,2],[10,15,2],[12,12,2],[14,8,2]],
    [[0,19,2],[2,15,2],[4,14,2],[6,12,2],[8,7,4],[12,14,1],[13,15,1],[14,19,2]],
    [[0,12,1],[1,14,1],[2,15,2],[4,19,4],[8,20,2],[10,19,2],[12,15,4]],
    [[0,14,3],[3,12,1],[4,7,2],[6,8,2],[8,12,6],[14,14,2]],
    [[0,8,4],[4,12,2],[6,15,2],[8,20,4],[12,19,2],[14,15,2]],
    [[0,19,4],[4,14,2],[6,12,2],[8,7,6],[14,8,2]],
    [[0,12,2],[2,15,2],[4,19,2],[6,24,2],[8,19,2],[10,15,2],[12,14,2],[14,12,2]],
    [[0,15,3],[3,19,1],[4,20,4],[8,19,2],[10,15,2],[12,12,4]],
    [[0,12,8],[8,15,8]],
    [[0,8,8],[8,7,8]],
    [[0,7,4],[4,8,4],[8,14,8]],
    [[0,15,2],[2,15,2],[4,19,2],[6,15,2],[8,20,2],[10,19,2],[12,15,2],[14,14,2]],
    [[0,14,2],[2,14,2],[4,19,2],[6,14,2],[8,20,2],[10,19,2],[12,14,2],[14,12,2]],
    [[0,19,1],[1,20,1],[2,19,1],[3,15,1],[4,14,1],[5,12,1],[6,8,1],[7,7,1],[8,24,8]],
  ];
  const SEC={
    A :{roots:[0,3,-4,-5], arp:0, bass:0, kick:0, drums:1, lead:[0,1,2,3]},
    A2:{roots:[0,3,-4,-5], arp:1, bass:1, kick:0, drums:1, lead:[0,1,4,5]},
    B :{roots:[-4,-5,0,3], arp:2, bass:2, kick:2, drums:1, lead:[6,7,8,9], bell:1},
    C :{roots:[0,0,-4,-5], arp:3, bass:3, kick:1, drums:0, lead:[10,11,10,12], bell:1},
    D :{roots:[3,3,-5,-5], arp:2, bass:0, kick:2, drums:1, lead:[13,14,13,15], build:1},
  };
  const FORM=['A','A2','B','A','C','D','B','A2'];
  const KEYS=[0,2,-3];                                        // key change every time the song repeats
  const T={pad:0,kick:0,taiko:0,snare:0,hat:0,bass:0,arp:0,lead:0,bell:0}, layers={};
  let ctx=null,bus=null,duckG=null,filt=null,noiseBuf=null,timer=null,worker=null,step=0,nextT=0,started=false,H16=false;
  let barLead=null, barEcho=false;

  function osc(type,f,t,dur,dest,peak,o={}){
    const os=ctx.createOscillator(), g=ctx.createGain(), a=o.a||.004;
    os.type=type; os.frequency.setValueAtTime(f,t); if(o.f2) os.frequency.exponentialRampToValueAtTime(o.f2,t+dur);
    g.gain.setValueAtTime(.0001,t); g.gain.exponentialRampToValueAtTime(peak,t+a); g.gain.exponentialRampToValueAtTime(.0001,t+dur);
    if(o.filter){ const fl=ctx.createBiquadFilter(); fl.type=o.filter.type; fl.frequency.setValueAtTime(o.filter.f,t);
      if(o.filter.f2) fl.frequency.exponentialRampToValueAtTime(o.filter.f2,t+dur); fl.Q.value=o.filter.q||1; os.connect(fl); fl.connect(g); }
    else os.connect(g);
    g.connect(dest); os.start(t); os.stop(t+dur+.03);
  }
  function nz(t,dur,dest,peak,o={}){
    const s=ctx.createBufferSource(), fl=ctx.createBiquadFilter(), g=ctx.createGain(); s.buffer=noiseBuf;
    fl.type=o.type||'highpass'; fl.frequency.setValueAtTime(o.f||5000,t); if(o.f2) fl.frequency.exponentialRampToValueAtTime(o.f2,t+dur); fl.Q.value=o.q||1;
    g.gain.setValueAtTime(peak,t); g.gain.exponentialRampToValueAtTime(.0001,t+dur);
    s.connect(fl); fl.connect(g); g.connect(dest); s.start(t,Math.random()*.45); s.stop(t+dur+.03);
  }
  const kick =(t,v)=>{ osc('sine',155,t,.3,layers.kick,.95*v,{f2:42}); nz(t,.03,layers.kick,.25*v,{f:2500}); };
  const taiko=(t,v,p)=>{ osc('triangle',125*p,t,.45,layers.taiko,.75*v,{f2:58*p}); nz(t,.14,layers.taiko,.3*v,{type:'bandpass',f:380,q:.7}); };
  const tom  =(t,f)=>osc('sine',f,t,.25,layers.taiko,.6,{f2:f*.55});
  const snare=(t,v)=>{ nz(t,.17,layers.snare,.45*v,{f:1800}); osc('triangle',210,t,.1,layers.snare,.3*v,{f2:120}); };
  const hat  =(t,v,open)=>nz(t,open?.2:.045,layers.hat,.2*v,{f:7500});
  const bass =(t,f,d)=>osc('sawtooth',f,t,d,layers.bass,.3,{a:.006,filter:{type:'lowpass',f:1100,f2:260,q:3}});
  const arp  =(t,f)=>osc('triangle',f,t,.2,layers.arp,.16,{filter:{type:'lowpass',f:3600,f2:1100}});
  const lead =(t,f,d)=>{ osc('sawtooth',f,t,d*1.2,layers.lead,.1,{a:.012,filter:{type:'lowpass',f:2600,q:2}}); osc('square',f*1.004,t,d*1.2,layers.lead,.04,{a:.012}); };
  const bell =(t,f)=>{ osc('sine',f,t,.9,layers.bell,.08,{a:.005}); osc('sine',f*2.01,t,.35,layers.bell,.025,{a:.003}); };
  const pad  =(t,root)=>[0,7,14,19].forEach(o=>osc('triangle',hz(A2*2,root+o),t,SPS*16*1.1,layers.pad,.05,{a:.6}));

  function sched(s,t){
    const st=s%16, barN=s>>4, secN=Math.floor(barN/4), bar=barN%4;
    const sec=SEC[FORM[secN%FORM.length]], key=KEYS[Math.floor(secN/FORM.length)%KEYS.length];
    const root=sec.roots[bar]+key, fill=bar===3&&st>=12, roll=sec.build&&bar===3&&st>=8, full=sec.drums>=1;
    if(st===0){ let p=sec.lead[bar]; if(Math.random()<.2) p=rnd(sec.lead); barLead=PH[p]; barEcho=Math.random()<.18; }
    if(T.pad>.02&&st===0) pad(t,root);
    if(T.kick>.02&&full&&!roll&&KICKS[sec.kick][st]) kick(t,st%4===0?1:.75);
    if(T.taiko>.02){ if(fill&&!roll) tom(t,[240,200,170,140][st-12]); else if(TAIK[st]) taiko(t,st===0?1:.8,st===3?1.15:1); }
    if(T.snare>.02){ if(roll) snare(t,.3+(st-8)*.09); else if(full&&(SNAR[st]||fill)) snare(t,fill?.7:1); }
    if(T.hat>.02){ if(st%2===0||H16) hat(t,st%4===2?.9:(st%2===0?.6:.4),st===14&&bar%2===1);
      if(st===0&&bar===0&&T.kick>.5&&full) nz(t,1.4,layers.hat,.35,{f:4000,f2:2500}); }
    const bp=BASSES[sec.bass][st];
    if(T.bass>.02&&bp) bass(t,hz(A2,root)*(bp===2?2:1),SPS*(sec.bass===3?7:1.7));
    if(T.arp>.02&&(T.arp>.5||st%2===0)) arp(t,hz(A2*4,root+ARPS[sec.arp][st]));
    if(T.lead>.02&&barLead) for(const n of barLead) if(n[0]===st) lead(t,hz(220,n[1]+key),n[2]*SPS);
    if(T.bell>.02){
      if(sec.bell&&(st===0||st===6||st===10)) bell(t,hz(440,root+(st===0?12:st===6?7:19)-12));
      if(barEcho&&barLead&&T.lead<.02) for(const n of barLead) if(n[0]===st&&n[0]%4===0) bell(t,hz(440,n[1]+key));
    }
  }
  function tick(){
    if(!ctx) return;
    if(ctx.state!=='running'){ nextT=ctx.currentTime+.1; return; }
    if(nextT<ctx.currentTime-.2) nextT=ctx.currentTime+.05;
    while(nextT<ctx.currentTime+.4){ sched(step,nextT); nextT+=SPS; step++; }
  }
  /* the scheduler clock runs in a Web Worker so a slow animation frame cannot delay the notes */
  function startClock(){
    const fallback=()=>{ if(worker){ try{ worker.terminate(); }catch(e){} worker=null; } if(!timer) timer=setInterval(tick,25); };
    try{
      const src='let t=null;onmessage=e=>{clearInterval(t);if(e.data==="start")t=setInterval(()=>postMessage(0),25);};';
      worker=new Worker(URL.createObjectURL(new Blob([src],{type:'text/javascript'})));
      worker.onmessage=tick; worker.onerror=fallback; worker.postMessage('start');
    }catch(e){ fallback(); }
  }
  function start(){
    if(started) return; started=true; ctx=audio(); if(!ctx){ started=false; return; }
    noiseBuf=ctx.createBuffer(1,ctx.sampleRate,ctx.sampleRate); const d=noiseBuf.getChannelData(0); for(let i=0;i<d.length;i++) d[i]=Math.random()*2-1;
    const comp=ctx.createDynamicsCompressor(); comp.threshold.value=-16; comp.ratio.value=4; comp.knee.value=12; comp.attack.value=.005; comp.release.value=.2;
    filt=ctx.createBiquadFilter(); filt.type='lowpass'; filt.frequency.value=18000;
    duckG=ctx.createGain(); bus=ctx.createGain(); bus.gain.value=musicOn?.8:0;
    bus.connect(duckG); duckG.connect(filt); filt.connect(comp); comp.connect(ctx.destination);
    for(const n in T){ const g=ctx.createGain(); g.gain.value=0; g.connect(bus); layers[n]=g; }
    nextT=ctx.currentTime+.15; startClock(); update();
  }
  function update(){
    if(!ctx||!bus) return;
    const st=G.state, m=st==='pause'?G.prevState:st, hp=G.bossHP, now=ctx.currentTime;
    const action=(m==='play'||m==='busy')&&document.body.classList.contains('playing');
    for(const k in T) T[k]=0;
    if(action){ T.pad=.35; T.kick=T.taiko=T.snare=T.hat=T.bass=1; T.arp=.75; T.bell=.8; T.lead=(G.combo>=3||hp<=2)?1:0; H16=hp<=3; }
    else if(m==='chest'||m==='summary'){ T.pad=1; T.arp=.7; T.lead=1; T.bell=.6; H16=false; }
    else { T.pad=1; T.arp=.4; T.bell=.7; H16=false; }
    for(const k in T) layers[k].gain.setTargetAtTime(T[k],now,.3);
    filt.frequency.setTargetAtTime(st==='pause'?450:18000,now,.08);
    bus.gain.setTargetAtTime(!musicOn?0:(st==='pause'?.4:.8),now,.1);
  }
  function duck(level=.4,ms=1500){
    if(!ctx||!duckG||speaking) return; const n=ctx.currentTime; duckG.gain.cancelScheduledValues(n);
    duckG.gain.setTargetAtTime(level,n,.04); duckG.gain.setTargetAtTime(1,n+ms/1000,.25);
  }
  /* hold the music quiet for as long as someone is speaking (released by speechDone) */
  function duckHold(level=.12){
    if(!ctx||!duckG) return; const n=ctx.currentTime; duckG.gain.cancelScheduledValues(n);
    duckG.gain.setValueAtTime(duckG.gain.value,n); duckG.gain.setTargetAtTime(level,n,.03);
  }
  function release(){
    if(!ctx||!duckG) return; const n=ctx.currentTime; duckG.gain.cancelScheduledValues(n);
    duckG.gain.setValueAtTime(duckG.gain.value,n); duckG.gain.setTargetAtTime(1,n+.15,.35);
  }
  function stinger(kind){
    if(!ctx||!started||!musicOn||ctx.state!=='running') return; const t=ctx.currentTime+.01;
    if(kind==='wrong'){ duck(.35,350); osc('sine',90,t,.5,filt,.8,{f2:35}); nz(t,.25,filt,.3,{type:'lowpass',f:900,f2:150}); }
    else if(kind==='boss'){ duck(.5,500); nz(t,.9,filt,.35,{f:3000,f2:1200}); osc('sine',120,t,.6,filt,.9,{f2:38}); osc('triangle',65,t,.6,filt,.5); }
  }
  return {start,update,duck,duckHold,release,stinger, level:()=>duckG?duckG.gain.value:1};
})();

/* ---------------------------------------------------------------------
   SPEECH - picks the clearest voice the computer has, speaks a little slower
   than normal at natural pitch, and keeps the music quiet until it has finished.
   --------------------------------------------------------------------- */
let voice=null, speaking=false, speechTimer=null, speechId=0;
function pickVoice(){
  const vs=window.speechSynthesis.getVoices().filter(v=>/^en([-_]|$)/i.test(v.lang)); if(!vs.length) return null;
  const score=v=>{ const n=v.name; let s=0;
    if(/natural|neural/i.test(n)) s+=60;                  // Edge "Online (Natural)" voices are by far the clearest
    if(/online/i.test(n)) s+=15;
    if(/google us english/i.test(n)) s+=45; else if(/google/i.test(n)) s+=30;
    if(/\b(aria|jenny|ana|samantha|ava|allison|emma|libby|sonia)\b/i.test(n)) s+=20;
    if(/\b(zira|susan|hazel)\b/i.test(n)) s+=12;
    if(/en[-_]US/i.test(v.lang)) s+=8; else if(/en[-_]GB/i.test(v.lang)) s+=5;
    if(/\b(david|mark|george)\b/i.test(n)) s-=5;
    return s; };
  return vs.sort((a,b)=>score(b)-score(a))[0];
}
function speechDone(id){
  if(id!==speechId) return;
  speaking=false; clearTimeout(speechTimer); try{ Music.release(); }catch(e){}
}
/* say(text) speaks once; say(word,rate,{repeat:true}) says the word, pauses, then says it again */
function say(text,rate=.8,{repeat=false}={}){
  try{
    const ss=window.speechSynthesis; if(!ss) return; ss.cancel();
    if(!voice) voice=pickVoice();
    const id=++speechId; speaking=true;
    try{ Music.duckHold(.12); }catch(e){}
    const parts=repeat?[text,text]:[text];
    parts.forEach((t,i)=>{
      const u=new SpeechSynthesisUtterance(t); u.lang=voice?voice.lang:'en-US'; if(voice) u.voice=voice;
      u.rate=i?rate*.92:rate; u.pitch=1; u.volume=1;      // natural pitch is easier to understand than a squeaky one
      if(i===parts.length-1){ u.onend=()=>speechDone(id); u.onerror=()=>speechDone(id); }
      if(i>0) ss.speak(new SpeechSynthesisUtterance(' '));  // a short gap between the two
      ss.speak(u);
    });
    // safety net: some browsers never fire "end" - bring the music back anyway
    clearTimeout(speechTimer); speechTimer=setTimeout(()=>speechDone(id),1500+String(text).length*260*parts.length/rate);
  }catch(e){ speaking=false; }
}
/* the word to spell: said clearly, twice */
const sayWord=(w,rate=.72)=>say(w,rate,{repeat:true});
/* a letter name ("A", "B") - lower case "a" gets read as "uh" */
const sayLetter=l=>say(l.toUpperCase()+'.',.8);
try{ speechSynthesis.onvoiceschanged=()=>{ voice=null; }; }catch(e){}
