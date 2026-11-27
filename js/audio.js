/* Synthesised sound effects, the action music engine and speech.
   (plain script: shares the global scope with the other files in js/, load order matters - see index.html) */
'use strict';

/* =====================================================================
   AUDIO (all synthesised - no files) + speech
   ===================================================================== */
let AC = null, musicOn = true;
try{ if(localStorage.getItem('sh_music')==='off') musicOn=false; }catch(e){}
function audio(){
  if(!AC){
    try{ if(navigator.audioSession) navigator.audioSession.type='playback'; }catch(e){}   // iPhone: play even with the ring / silent switch on silent (the words must be heard)
    try{ AC = new (window.AudioContext||window.webkitAudioContext)(); }catch(e){} }
  if(AC && AC.state!=='running' && AC.state!=='closed') AC.resume();            // 'suspended', or 'interrupted' on iOS after a call / the app was in the background
  try{ if(AC) Music.start(); }catch(e){}
  return AC;
}
/* a small room reverb, made from decaying noise (no audio file). Used by the sound effects and by the music. */
function makeIR(ac,sec=2,decay=3){
  const n=Math.floor(ac.sampleRate*sec), b=ac.createBuffer(2,n,ac.sampleRate);
  for(let c=0;c<2;c++){ const a=b.getChannelData(c); for(let i=0;i<n;i++) a[i]=(Math.random()*2-1)*Math.pow(1-i/n,decay); }
  return b;
}
/* all sound effects go through one bus: a gentle compressor (so many sounds at once never clip) and a little reverb (so they sit in the same room) */
let SFXOUT=null;
function sfxOut(ac){
  if(SFXOUT) return SFXOUT;
  const comp=ac.createDynamicsCompressor(); comp.threshold.value=-14; comp.ratio.value=5; comp.knee.value=10; comp.attack.value=.003; comp.release.value=.15;
  const g=ac.createGain(); g.gain.value=.95; g.connect(comp); comp.connect(ac.destination);
  try{ const send=ac.createGain(), cv=ac.createConvolver(); send.gain.value=.14; cv.buffer=makeIR(ac,1.4,3.5); g.connect(send); send.connect(cv); cv.connect(comp); }catch(e){}
  return SFXOUT=g;
}
function tone(f,d=.15,type='sine',v=.15,slideTo=null,delay=0){
  const ac=audio(); if(!ac) return; const t=ac.currentTime+delay;
  const o=ac.createOscillator(), g=ac.createGain(); o.type=type; o.frequency.setValueAtTime(f,t);
  if(slideTo) o.frequency.exponentialRampToValueAtTime(slideTo,t+d);
  g.gain.setValueAtTime(.0001,t); g.gain.exponentialRampToValueAtTime(v,t+.012); g.gain.exponentialRampToValueAtTime(.0001,t+d);
  o.connect(g).connect(sfxOut(ac)); o.start(t); o.stop(t+d+.05);
}
let sfxNoise=null;   // one shared second of noise (making a new buffer for every sound wastes time)
function noise(d=.25,v=.2,f0=3000,f1=400,delay=0){
  const ac=audio(); if(!ac) return;
  if(!sfxNoise){ sfxNoise=ac.createBuffer(1,ac.sampleRate,ac.sampleRate); const a=sfxNoise.getChannelData(0); for(let i=0;i<a.length;i++) a[i]=Math.random()*2-1; }
  const s=ac.createBufferSource(); s.buffer=sfxNoise; s.loop=true; const f=ac.createBiquadFilter(); f.type='bandpass'; const t=ac.currentTime+delay;
  f.frequency.setValueAtTime(f0,t); f.frequency.exponentialRampToValueAtTime(f1,t+d);
  const g=ac.createGain(); g.gain.setValueAtTime(v,t); g.gain.exponentialRampToValueAtTime(.0001,t+d);
  s.connect(f).connect(g).connect(sfxOut(ac)); s.start(t,Math.random()*.5); s.stop(t+d+.05);
}
const PENTA=[0,2,4,7,9,12,14,16,19,21,24,26,28,31];       // the right-letter "ding" climbs this scale, one step per letter of the word
const SFX = {
  ding(i=0){ const f=523.25*Math.pow(2,PENTA[Math.min(i,PENTA.length-1)]/12);
    tone(f,.2,'triangle',.2); tone(f*2,.12,'sine',.07); tone(f*1.5,.4,'sine',.1,null,.07); tone(f*3,.25,'sine',.035,null,.07); },
  wrong(){ tone(311,.16,'triangle',.18,277); tone(233,.36,'triangle',.18,185,.15); },           // a soft "uh-oh", not a buzzer
  boing(){ tone(180,.4,'sine',.25,520); tone(520,.3,'sine',.15,200,.2); },
  bonk(){ tone(220,.18,'square',.16,70); noise(.12,.25,1500,300); tone(90,.15,'sine',.25,50); },
  tick(){ tone(1250,.05,'sine',.16,900); tone(2500,.025,'triangle',.05); },                       // a woodblock tick (the last seconds of the timer)
  whoosh(){ noise(.28,.22,400,4000); },
  pop(){ tone(400,.12,'sine',.2,900); tone(1200,.05,'sine',.05,null,.04); },
  coin(){ tone(988,.08,'square',.08); tone(1319,.3,'square',.08,null,.07); tone(2637,.25,'sine',.04,null,.07); },
  thud(){ tone(110,.3,'sine',.4,50); noise(.15,.15,500,100); },
  bossHit(){ tone(140,.4,'sawtooth',.18,40); noise(.3,.3,2500,200); tone(70,.5,'sine',.35,35); },
  fanfare(perfect){ const n=perfect?[523,659,784,1047,1319,1568]:[523,659,784,1047];
    n.forEach((f,i)=>{ tone(f,.3,'triangle',.18,null,i*.09); tone(f*2,.15,'sine',.04,null,i*.09); });
    const e=n.length*.09; [523,659,784].forEach(f=>tone(f*2,.9,'triangle',.07,null,e)); if(perfect) [2093,2637,3136].forEach((f,i)=>tone(f,.3,'sine',.05,null,e+.1+i*.06)); },
  chest(){ [392,523,659,784,1047,1319].forEach((f,i)=>tone(f,.4,'triangle',.18,null,i*.09)); [1047,1319,1568].forEach(f=>tone(f,1.2,'sine',.06,null,.6)); },
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
  perfect(){ [784,988,1175,1568].forEach((f,i)=>tone(f,.25,'triangle',.15,null,i*.08)); [2349,3136].forEach((f,i)=>tone(f,.4,'sine',.04,null,.35+i*.05)); },
  /* new: power-ups, missions, word twists */
  powerup(use){ if(use){ tone(330,.35,'sine',.2,1320); noise(.3,.12,800,6000); tone(1760,.3,'triangle',.06,null,.25); return; }
    [523,659,784,1047,1319,1568,2093].forEach((f,i)=>tone(f,.16,'square',.05,null,i*.045)); noise(.4,.08,3000,9000,.1); tone(2093,.6,'sine',.07,null,.33); },
  shield(){ tone(880,.5,'sine',.16,620); tone(1320,.35,'triangle',.07); tone(2640,.2,'sine',.04); noise(.15,.12,5000,2500); },
  mission(){ [392,523,659,784].forEach((f,i)=>tone(f,.18,'triangle',.18,null,i*.1)); [1047,1319].forEach(f=>tone(f,.9,'triangle',.1,null,.42)); SFX.coin(); },
  peek(){ [1568,1760,2093,2349,2637,3136].forEach((f,i)=>tone(f,.25,'sine',.06,null,i*.05)); },
  goldWord(){ [1319,1568,1976,2637].forEach((f,i)=>tone(f,.3,'sine',.07,null,i*.06)); tone(988,.4,'triangle',.08,null,.25); },
};

/* ---------------------------------------------------------------------
   MUSIC - generated live, no audio files.
   There is one song per place (see SONGS and SONG_OF_PLACE below); menus play the "dojo" song, and the music
   fades from one song to the next when a level moves to a new place. The "dojo" song is 140 BPM, Japanese
   "hirajoshi" scale. Every song is a whole song, not a 4-bar loop:
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
  const hz=(b,s)=>b*Math.pow(2,s/12);
  const rep=(n,fn)=>Array.from({length:n},(_,i)=>fn(i));
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

  /* ---- SONG 2: "School Bell March" (level 1 / the school) ----
     120 BPM, C major pentatonic, marimba lead, kalimba arpeggio, tuba bass, woodblock + snare march.
     Bass values: 1 = root, 2 = octave up, 3 = fifth. Phrase notes are semitones above C4. */
  const S_ARPS=[
    [0,7,12,7, 14,12,7,12, 0,7,12,7, 14,12,7,12],
    [12,7,0,7, 12,14,12,7, 12,7,0,7, 14,12,14,19],
    [0,12,7,12, 14,12,7,12, 0,12,7,12, 19,14,12,7],
    [0,7,12,14, 12,7,12,7, 0,7,12,14, 12,7,12,19],
  ];
  const S_BASSES=[
    [1,0,0,0, 3,0,0,0, 1,0,0,0, 3,0,0,1],
    [1,0,1,0, 3,0,3,0, 1,0,1,0, 3,0,2,0],
    [1,0,0,1, 3,0,0,3, 1,0,0,1, 3,0,2,0],
    [1,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0],                     // breakdown: long notes
  ];
  const S_KICKS=[
    [1,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0],
    [1,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,1,0],
    [1,0,0,0, 0,0,1,0, 1,0,0,0, 0,0,1,0],
  ];
  const S_WOOD=[0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,0];
  const S_SNAR=[0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0];
  const S_PH=[
    [[0,7,2],[2,9,2],[4,12,4],[8,9,2],[10,7,2],[12,4,4]],                            //  0 A  - rising bell tune
    [[0,4,2],[2,7,2],[4,9,2],[6,7,2],[8,12,4],[12,9,2],[14,7,2]],                    //  1
    [[0,12,2],[2,14,2],[4,16,4],[8,14,2],[10,12,2],[12,9,4]],                        //  2
    [[0,7,2],[2,4,2],[4,2,2],[6,4,2],[8,7,4],[12,0,4]],                              //  3    (comes home to C)
    [[0,12,3],[3,9,1],[4,7,2],[6,9,2],[8,12,2],[10,14,2],[12,12,4]],                 //  4 A' - a little busier
    [[0,9,2],[2,12,2],[4,14,2],[6,12,2],[8,9,4],[12,7,4]],                           //  5
    [[0,12,2],[2,16,2],[4,19,4],[8,16,2],[10,14,2],[12,12,4]],                       //  6 B  - higher, bright
    [[0,14,2],[2,16,2],[4,19,2],[6,21,2],[8,19,4],[12,16,4]],                        //  7
    [[0,19,2],[2,16,2],[4,14,2],[6,12,2],[8,14,4],[12,7,4]],                         //  8
    [[0,14,4],[4,12,2],[6,9,2],[8,7,6],[14,9,2]],                                    //  9
    [[0,12,8],[8,9,8]],                                                              // 10 C  - breakdown
    [[0,7,8],[8,9,8]],                                                               // 11
    [[0,4,4],[4,7,4],[8,9,8]],                                                       // 12
    [[0,9,2],[2,9,2],[4,12,2],[6,9,2],[8,14,2],[10,12,2],[12,9,2],[14,7,2]],         // 13 D  - build-up
    [[0,12,2],[2,12,2],[4,14,2],[6,12,2],[8,16,2],[10,14,2],[12,12,2],[14,9,2]],     // 14
    [[0,16,1],[1,14,1],[2,12,1],[3,9,1],[4,7,1],[5,9,1],[6,12,1],[7,14,1],[8,19,8]], // 15
  ];
  const S_SEC={                                               // chords: C, G, Am, F  (roots in semitones from C)
    A :{roots:[0,-5,-3,-7], arp:0, bass:0, kick:0, drums:1, lead:[0,1,2,3]},
    A2:{roots:[0,-5,-3,-7], arp:1, bass:1, kick:1, drums:1, lead:[4,5,2,3]},
    B :{roots:[-7,0,-5,-5], arp:2, bass:2, kick:2, drums:1, lead:[6,7,8,9], bell:1},
    C :{roots:[0,-3,-7,-5], arp:3, bass:3, kick:1, drums:0, lead:[10,11,10,12], bell:1},
    D :{roots:[-7,-7,-5,-5], arp:2, bass:0, kick:2, drums:1, lead:[13,14,13,15], build:1},
  };

  /* ---- SONG 3: "Moonlit Mushroom Sneak" (haunted forest) ----
     96 BPM swung, D minor, music-box celesta lead, pizzicato arpeggio, plucked upright bass, clock "tock" percussion.
     Chords i-iv-i-v (Dm Gm Dm Am), all minor, so the arpeggios can use the minor third. Phrase notes are semitones above D4. */
  const F_ARPS=[
    [0,7,12,7, 3,7,12,7, 0,7,12,7, 15,12,7,3],
    [12,7,3,7, 12,7,3,7, 15,12,7,3, 0,3,7,12],
    [0,3,7,12, 15,12,7,3, 0,3,7,12, 19,15,12,7],
    [0,12,0,12, 7,12,7,12, 3,12,3,12, 7,15,7,12],
  ];
  const F_BASSES=[
    [1,0,3,0, 1,0,3,0, 1,0,3,0, 2,0,3,0],
    [1,0,0,3, 0,0,1,0, 2,0,0,3, 0,0,1,0],
    [1,0,1,3, 1,0,2,0, 1,0,1,3, 2,0,3,0],
    [1,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0],
  ];
  const F_KICKS=[
    [1,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0],
    [1,0,0,0, 0,0,1,0, 1,0,0,0, 0,0,0,0],
    [1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0],
  ];
  const F_TOCK=[0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,1];
  const F_PH=[
    [[0,7,1],[2,8,1],[4,7,1],[6,3,2],[8,2,1],[10,3,1],[12,0,4]],                      //  0 A  - tiptoe down
    [[0,5,1],[2,7,1],[4,8,2],[6,10,2],[8,8,1],[10,7,1],[12,5,4]],                     //  1
    [[0,12,2],[3,10,1],[4,8,2],[6,7,2],[8,3,2],[10,2,2],[12,0,4]],                    //  2
    [[0,7,2],[2,10,2],[4,14,2],[6,10,2],[8,7,4],[12,2,4]],                            //  3
    [[0,0,1],[1,2,1],[2,3,1],[3,5,1],[4,7,2],[8,8,1],[10,7,1],[12,3,2],[14,2,2]],     //  4 A'
    [[0,5,2],[2,3,2],[4,2,2],[6,0,2],[8,-2,2],[10,0,2],[12,2,4]],                     //  5
    [[0,15,2],[2,14,2],[4,12,2],[6,10,2],[8,12,4],[12,10,2],[14,8,2]],                //  6 B  - higher
    [[0,12,2],[2,14,2],[4,15,4],[8,14,2],[10,12,2],[12,10,4]],                        //  7
    [[0,17,2],[2,15,2],[4,14,2],[6,12,2],[8,15,4],[12,12,4]],                         //  8
    [[0,10,3],[3,8,1],[4,7,2],[6,3,2],[8,2,2],[10,1,2],[12,0,4]],                     //  9 (creeps down)
    [[0,12,8],[8,10,8]],                                                              // 10 C  - breakdown
    [[0,8,8],[8,7,8]],                                                                // 11
    [[0,3,4],[4,2,4],[8,1,8]],                                                        // 12
    [[0,10,2],[2,10,2],[4,14,2],[6,10,2],[8,15,2],[10,14,2],[12,10,2],[14,7,2]],      // 13 D  - build-up
    [[0,7,2],[2,7,2],[4,12,2],[6,7,2],[8,14,2],[10,12,2],[12,10,2],[14,7,2]],         // 14
    [[0,14,1],[1,12,1],[2,10,1],[3,7,1],[4,6,1],[5,7,1],[6,10,1],[7,12,1],[8,14,8]],  // 15
  ];
  const F_SEC={                                               // Dm Gm Dm Am  (roots in semitones from D)
    A :{roots:[0,-7,0,-5], arp:0, bass:0, kick:0, drums:1, lead:[0,1,2,3]},
    A2:{roots:[0,-7,0,-5], arp:1, bass:1, kick:1, drums:1, lead:[4,5,2,3]},
    B :{roots:[-7,-5,0,0], arp:2, bass:2, kick:2, drums:1, lead:[6,7,8,9], bell:1},
    C :{roots:[0,-7,0,-5], arp:3, bass:3, kick:1, drums:0, lead:[10,11,10,12], bell:1},
    D :{roots:[-7,-7,-5,-5], arp:2, bass:0, kick:2, drums:1, lead:[13,14,13,15], build:1},
  };

  /* ---- SONG 4: "Sugar Rush Bounce" (candy land) ----
     132 BPM with a light shuffle, F major, toy-piano lead, bubbly arpeggio, bouncy bass, four-on-the-floor kick, claps and bubble pops.
     Chords F C Dm Bb; arpeggios use root / fifth / ninth only, so they fit every chord. Phrase notes are semitones above F4. */
  const C_ARPS=[
    [0,12,7,12, 14,12,7,12, 0,12,7,12, 19,14,12,7],
    [0,7,12,19, 24,19,12,7, 0,7,12,19, 24,19,14,12],
    [12,0,12,7, 12,14,12,7, 12,0,12,7, 19,14,12,14],
    [0,7,14,7, 12,7,14,7, 0,7,14,7, 19,14,12,7],
  ];
  const C_BASSES=[
    [1,0,2,0, 1,0,2,0, 1,0,2,0, 1,0,2,3],
    [1,0,2,1, 0,2,1,0, 1,0,2,1, 0,2,3,0],
    [1,2,1,2, 1,2,1,2, 1,2,1,2, 3,2,3,2],
    [1,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0],
  ];
  const C_KICKS=[
    [1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0],
    [1,0,0,0, 1,0,0,1, 1,0,0,0, 1,0,1,0],
    [1,0,1,0, 1,0,0,0, 1,0,1,0, 1,0,0,0],
  ];
  const C_POP=[0,0,0,1, 0,0,0,0, 0,0,0,1, 0,0,1,0];
  const C_PH=[
    [[0,0,1],[1,4,1],[2,7,2],[4,9,2],[6,7,2],[8,12,3],[11,9,1],[12,7,4]],             //  0 A  - skipping up
    [[0,7,2],[2,4,2],[4,2,2],[6,4,2],[8,7,2],[10,11,2],[12,7,4]],                     //  1
    [[0,9,2],[2,12,2],[4,14,2],[6,12,2],[8,9,2],[10,5,2],[12,2,4]],                   //  2
    [[0,5,2],[2,9,2],[4,12,2],[6,9,2],[8,7,4],[12,4,2],[14,7,2]],                     //  3
    [[0,12,1],[1,11,1],[2,12,2],[4,7,2],[6,9,2],[8,4,2],[10,7,2],[12,0,4]],           //  4 A'
    [[0,4,1],[1,7,1],[2,11,2],[4,14,2],[6,11,2],[8,7,4],[12,9,2],[14,11,2]],          //  5
    [[0,14,2],[2,12,2],[4,9,2],[6,12,2],[8,17,4],[12,14,4]],                          //  6 B  - sugar high
    [[0,12,2],[2,16,2],[4,19,4],[8,16,2],[10,14,2],[12,12,4]],                        //  7
    [[0,19,2],[2,16,2],[4,14,2],[6,11,2],[8,14,4],[12,7,4]],                          //  8
    [[0,14,1],[1,16,1],[2,14,1],[3,11,1],[4,7,4],[8,9,2],[10,11,2],[12,12,4]],        //  9
    [[0,12,8],[8,9,8]],                                                               // 10 C  - breakdown
    [[0,14,8],[8,12,8]],                                                              // 11
    [[0,9,4],[4,11,4],[8,7,8]],                                                       // 12
    [[0,5,2],[2,5,2],[4,9,2],[6,5,2],[8,12,2],[10,9,2],[12,5,2],[14,9,2]],            // 13 D  - build-up
    [[0,7,2],[2,7,2],[4,11,2],[6,7,2],[8,14,2],[10,11,2],[12,7,2],[14,11,2]],         // 14
    [[0,7,1],[1,9,1],[2,11,1],[3,12,1],[4,14,1],[5,16,1],[6,17,1],[7,19,1],[8,24,8]], // 15
  ];
  const C_SEC={                                               // F C Dm Bb  (roots in semitones from F)
    A :{roots:[0,-5,-3,-7], arp:0, bass:0, kick:0, drums:1, lead:[0,1,2,3]},
    A2:{roots:[0,-5,-3,-7], arp:1, bass:1, kick:1, drums:1, lead:[4,5,2,3]},
    B :{roots:[-7,0,-5,-5], arp:2, bass:2, kick:2, drums:1, lead:[6,7,8,9], bell:1},
    C :{roots:[0,-3,-7,-5], arp:3, bass:3, kick:1, drums:0, lead:[10,11,10,12], bell:1},
    D :{roots:[-7,-7,-5,-5], arp:2, bass:0, kick:2, drums:1, lead:[13,14,13,15], build:1},
  };

  /* ---- SONG 5: "Snowflake Waltz" (snowy mountain) ----
     A waltz: 3/4 time, so a bar has 12 steps (3 beats of 4). 92 BPM, G major, glockenspiel lead, sleigh bells on the hi-hat,
     oom-pah-pah bass. Chords G Em C D. Phrase notes are semitones above G4. */
  const W_ARPS=[
    [0,12,7,12, 14,12,7,12, 19,12,14,12],
    [12,7,0,7, 12,14,19,14, 12,7,14,7],
    [0,7,12,19, 24,19,12,7, 12,14,12,7],
    [0,7,12,14, 19,14,12,7, 0,7,12,7],
  ];
  const W_BASSES=[
    [1,0,0,0, 0,0,0,0, 3,0,0,0],
    [1,0,0,0, 2,0,0,0, 3,0,0,0],
    [1,0,0,1, 2,0,0,0, 3,0,2,0],
    [1,0,0,0, 0,0,0,0, 0,0,0,0],
  ];
  const W_KICKS=[
    [1,0,0,0, 0,0,0,0, 0,0,0,0],
    [1,0,0,0, 0,0,0,0, 0,0,1,0],
    [1,0,0,0, 0,0,0,0, 1,0,0,0],
  ];
  const W_TAP=[0,0,0,0, 1,0,0,0, 1,0,0,0];
  const W_SNAR=[0,0,0,0, 1,0,0,0, 1,0,0,0];
  const W_PH=[
    [[0,7,4],[4,12,4],[8,16,4]],                                                      //  0 A  - one-two-three
    [[0,19,6],[6,16,2],[8,14,4]],                                                     //  1
    [[0,16,4],[4,12,4],[8,9,4]],                                                      //  2
    [[0,14,6],[6,12,2],[8,11,2],[10,9,2]],                                            //  3
    [[0,7,2],[2,9,2],[4,11,4],[8,12,4]],                                              //  4 A'
    [[0,14,4],[4,16,2],[6,14,2],[8,11,4]],                                            //  5
    [[0,21,6],[6,19,2],[8,16,4]],                                                     //  6 B  - high and twinkly
    [[0,23,6],[6,21,2],[8,19,4]],                                                     //  7
    [[0,24,8],[8,19,4]],                                                              //  8
    [[0,16,2],[2,14,2],[4,12,4],[8,7,4]],                                             //  9
    [[0,12,12]],                                                                      // 10 C  - breakdown
    [[0,11,12]],                                                                      // 11
    [[0,9,6],[6,11,6]],                                                               // 12
    [[0,12,2],[2,16,2],[4,19,2],[6,16,2],[8,12,2],[10,16,2]],                         // 13 D  - build-up
    [[0,11,2],[2,14,2],[4,19,2],[6,14,2],[8,11,2],[10,14,2]],                         // 14
    [[0,11,1],[1,12,1],[2,14,1],[3,16,1],[4,19,8]],                                   // 15
  ];
  const W_SEC={                                               // G Em C D  (roots in semitones from G)
    A :{roots:[0,-3,-7,-5], arp:0, bass:0, kick:0, drums:1, lead:[0,1,2,3]},
    A2:{roots:[0,-3,-7,-5], arp:1, bass:1, kick:1, drums:1, lead:[4,5,2,3]},
    B :{roots:[-7,-5,0,0], arp:2, bass:2, kick:2, drums:1, lead:[6,7,8,9], bell:1},
    C :{roots:[0,-3,-7,-5], arp:3, bass:3, kick:1, drums:0, lead:[10,11,10,12], bell:1},
    D :{roots:[-7,-7,-5,-5], arp:2, bass:0, kick:2, drums:1, lead:[13,14,13,15], build:1},
  };

  /* ---- SONG 6: "Pirate Jig" (pirate beach) ----
     6/8 time: a step is an eighth note and a "bar" here is 12 steps (two bars of 6/8). D dorian, squeeze-box accordion lead,
     mandolin arpeggio, oom-pah tuba, claps and a shaker. Chords Dm C Dm A. Phrase notes are semitones above D4. */
  const J_ARPS=[
    [0,7,12, 7,12,7, 0,7,12, 19,12,7],
    [12,7,0, 7,12,19, 12,7,0, 7,12,7],
    [0,12,7, 12,19,12, 0,12,7, 24,19,12],
    [0,7,12, 0,7,12, 0,7,12, 0,7,12],
  ];
  const J_BASSES=[
    [1,0,0, 3,0,0, 1,0,0, 3,0,0],
    [1,0,0, 3,0,1, 2,0,0, 3,0,0],
    [1,0,3, 1,0,3, 1,0,3, 2,0,3],
    [1,0,0, 0,0,0, 0,0,0, 0,0,0],
  ];
  const J_KICKS=[
    [1,0,0, 0,0,0, 1,0,0, 0,0,0],
    [1,0,0, 0,0,1, 1,0,0, 0,0,0],
    [1,0,0, 1,0,0, 1,0,0, 1,0,0],
  ];
  const J_WOOD=[0,0,1, 0,0,1, 0,0,1, 0,1,1];
  const J_CLAP=[0,0,0, 1,0,0, 0,0,0, 1,0,0];
  const J_PH=[
    [[0,7,2],[2,5,1],[3,3,2],[5,2,1],[6,0,2],[8,2,1],[9,3,2],[11,5,1]],               //  0 A  - diddly-dee
    [[0,7,2],[2,9,1],[3,10,2],[5,9,1],[6,7,3],[9,2,3]],                               //  1
    [[0,12,2],[2,10,1],[3,9,2],[5,7,1],[6,5,2],[8,3,1],[9,2,2],[11,0,1]],             //  2
    [[0,7,2],[2,11,1],[3,14,3],[6,11,2],[8,9,1],[9,7,3]],                             //  3
    [[0,0,1],[1,2,1],[2,3,1],[3,5,2],[5,7,1],[6,10,2],[8,9,1],[9,7,3]],               //  4 A'
    [[0,12,2],[2,10,1],[3,7,2],[5,10,1],[6,9,2],[8,7,1],[9,2,3]],                     //  5
    [[0,17,3],[3,14,2],[5,12,1],[6,9,3],[9,5,3]],                                     //  6 B  - heave-ho
    [[0,14,2],[2,15,1],[3,17,2],[5,15,1],[6,14,3],[9,10,3]],                          //  7
    [[0,19,2],[2,17,1],[3,15,2],[5,14,1],[6,12,3],[9,7,3]],                           //  8
    [[0,11,2],[2,14,1],[3,19,3],[6,17,2],[8,14,1],[9,11,3]],                          //  9
    [[0,12,12]],                                                                      // 10 C  - breakdown
    [[0,10,12]],                                                                      // 11
    [[0,9,6],[6,7,6]],                                                                // 12
    [[0,5,1],[1,9,1],[2,12,1],[3,5,1],[4,9,1],[5,12,1],[6,5,1],[7,9,1],[8,12,1],[9,17,3]],   // 13 D  - build-up
    [[0,7,1],[1,11,1],[2,14,1],[3,7,1],[4,11,1],[5,14,1],[6,7,1],[7,11,1],[8,14,1],[9,19,3]],// 14
    [[0,19,1],[1,17,1],[2,14,1],[3,11,1],[4,9,1],[5,7,1],[6,24,6]],                   // 15
  ];
  const J_SEC={                                               // Dm C Dm A  (roots in semitones from D)
    A :{roots:[0,-2,0,-5], arp:0, bass:0, kick:0, drums:1, lead:[0,1,2,3]},
    A2:{roots:[0,-2,0,-5], arp:1, bass:1, kick:1, drums:1, lead:[4,5,2,3]},
    B :{roots:[-7,-2,0,-5], arp:2, bass:2, kick:2, drums:1, lead:[6,7,8,9], bell:1},
    C :{roots:[0,-2,-7,-5], arp:3, bass:3, kick:1, drums:0, lead:[10,11,10,12], bell:1},
    D :{roots:[-7,-7,-5,-5], arp:2, bass:0, kick:2, drums:1, lead:[13,14,13,15], build:1},
  };

  /* ---- the song list. A song is plain data: tempo, key note, patterns, form and which instruments play it.
     spb = steps per bar, swing = how late the off-beat 16ths come (0..0.5), hat/hat16 = hi-hat loudness per step
     (hat16 is added when the boss is nearly beaten), reg = octave of the tonic for each part. ---- */
  const SONGS={
    dojo:{bpm:140, base:110, spb:16, swing:0, pad:'triangle', open:14, reg:{pad:2,arp:4,lead:2,bell:4},
      voice:{lead:'saw',arp:'tri',bass:'saw',perc:'taiko'},
      hat:rep(16,i=>i%2?0:(i%4===2?.9:.6)), hat16:rep(16,i=>i%2?.4:0),
      ARPS,BASSES,KICKS,TAIK,SNAR,PH,SEC,FORM,KEYS},
    school:{bpm:120, base:130.81, spb:16, swing:0, pad:'triangle', open:14, reg:{pad:2,arp:4,lead:2,bell:4},
      voice:{lead:'marimba',arp:'kalimba',bass:'tuba',perc:'wood'},
      hat:[.5,0,.7,0, .5,0,.7,0, .5,0,.7,0, .5,0,.9,0], hat16:rep(16,i=>i%2?.3:0),
      ARPS:S_ARPS,BASSES:S_BASSES,KICKS:S_KICKS,TAIK:S_WOOD,SNAR:S_SNAR,PH:S_PH,SEC:S_SEC,
      FORM:['A','A2','B','A','C','D','B','A2'],KEYS:[0,2,5]},
    /* mix: loudness of each part for this song (1 = normal), rev: how much reverb, crash: the cymbal at the start of a section */
    forest:{bpm:96, base:73.42, spb:16, swing:.2, pad:'sine', open:14, reg:{pad:2,arp:4,lead:4,bell:8}, rev:1.4, crash:.4,
      voice:{lead:'celesta',arp:'pluck',bass:'pbass',perc:'tock',hat:'shaker'}, mix:{kick:.6,snare:.45,hat:.7,arp:.8},
      hat:rep(16,i=>i%2?0:(i%4===2?.5:.3)), hat16:rep(16,i=>i%2?.25:0),
      ARPS:F_ARPS,BASSES:F_BASSES,KICKS:F_KICKS,TAIK:F_TOCK,SNAR:SNAR,PH:F_PH,SEC:F_SEC,FORM:['A','A2','B','A','C','D','B','A2'],KEYS:[0,-2,3]},
    candy:{bpm:132, base:87.31, spb:16, swing:.12, pad:'triangle', open:14, reg:{pad:2,arp:8,lead:4,bell:8}, rev:.8, crash:.7,
      voice:{lead:'toy',arp:'bub',bass:'bounce',perc:'pop',snare:'clap'}, mix:{kick:.85,arp:.75},
      hat:rep(16,i=>i%2?.3:.55), hat16:rep(16,i=>i%2?.25:0),
      ARPS:C_ARPS,BASSES:C_BASSES,KICKS:C_KICKS,TAIK:C_POP,SNAR:SNAR,PH:C_PH,SEC:C_SEC,FORM:['A','A2','B','A','C','D','B','A2'],KEYS:[0,2,-3]},
    snow:{bpm:92, base:98, spb:12, swing:0, pad:'sine', open:10, reg:{pad:2,arp:4,lead:4,bell:8}, rev:1.6, crash:.35,
      voice:{lead:'glock',arp:'kalimba',bass:'pbass',perc:'wood',hat:'jingle'}, mix:{kick:.55,snare:.3,taiko:.5,arp:.7},
      hat:[.7,0,.3,0, .5,0,.3,0, .5,0,.3,.2], hat16:rep(12,i=>i%2?.3:0),
      ARPS:W_ARPS,BASSES:W_BASSES,KICKS:W_KICKS,TAIK:W_TAP,SNAR:W_SNAR,PH:W_PH,SEC:W_SEC,FORM:['A','A2','B','A','C','D','B','A2'],KEYS:[0,2,-2]},
    beach:{bpm:84, base:73.42, spb:12, swing:0, pad:'triangle', open:9, reg:{pad:2,arp:4,lead:4,bell:8}, rev:.9, crash:.5,
      voice:{lead:'accordion',arp:'mando',bass:'tuba',perc:'wood',snare:'clap',hat:'shaker'}, mix:{arp:.8,taiko:.8},
      hat:[.55,.2,.3, .5,.2,.3, .55,.2,.3, .5,.2,.3], hat16:rep(12,i=>i%3===1?.25:0),
      ARPS:J_ARPS,BASSES:J_BASSES,KICKS:J_KICKS,TAIK:J_WOOD,SNAR:J_CLAP,PH:J_PH,SEC:J_SEC,FORM:['A','A2','B','A','C','D','B','A2'],KEYS:[0,2,-3]},
  };
  /* which song belongs to which place (anything not listed here plays the "dojo" song) */
  const SONG_OF_PLACE={school:'school',forest:'forest',candy:'candy',snow:'snow',beach:'beach'};
  const placeSong=()=>{ try{ return SONG_OF_PLACE[PLACE.id]||'dojo'; }catch(e){ return 'dojo'; } };

  const T={pad:0,kick:0,taiko:0,snare:0,hat:0,bass:0,arp:0,lead:0,bell:0}, layers={};
  let S=SONGS.dojo, SPS=60/S.bpm/4, pending=null, swapAt=0;   // S = the song playing now, pending = the song we are fading to
  let ctx=null,bus=null,xf=null,duckG=null,filt=null,noiseBuf=null,timer=null,worker=null,step=0,nextT=0,started=false,H16=false;
  let barLead=null, barEcho=false, revOut=null;
  const REV_SEND={pad:.5,arp:.35,lead:.45,bell:.7,snare:.15,taiko:.1};     // how much of each part goes to the reverb

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
  const pad  =(t,root)=>[0,7,14,19].forEach(o=>osc(S.pad,hz(S.base*S.reg.pad,root+o),t,SPS*S.spb*1.1,layers.pad,.05,{a:.6}));
  const wood =(t,v)=>{ osc('sine',1000,t,.07,layers.taiko,.5*v,{a:.001,f2:680}); osc('triangle',2100,t,.03,layers.taiko,.14*v,{a:.001}); };
  const marimba=(t,f,d)=>{ const l=Math.min(d*1.3,.6); osc('sine',f,t,l+.1,layers.lead,.22,{a:.003}); osc('sine',f*4,t,.1,layers.lead,.07,{a:.002}); osc('triangle',f*2,t,l*.6,layers.lead,.05,{a:.003}); };
  const kalimba=(t,f)=>{ osc('sine',f,t,.28,layers.arp,.2,{a:.002}); osc('sine',f*3,t,.06,layers.arp,.05,{a:.002}); };
  const tuba =(t,f,d)=>{ osc('square',f,t,d,layers.bass,.2,{a:.012,filter:{type:'lowpass',f:650,f2:320,q:1}}); osc('sine',f,t,d,layers.bass,.25,{a:.01}); };
  /* instruments of the place songs */
  const celesta=(t,f,d)=>{ const l=Math.min(Math.max(d*2.5,.5),1.4); osc('sine',f,t,l,layers.lead,.17,{a:.003}); osc('sine',f*4,t,.18,layers.lead,.05,{a:.002}); osc('sine',f*2,t,l*.5,layers.lead,.05,{a:.003}); };
  const toy  =(t,f,d)=>{ const l=Math.min(d*1.4,.45)+.1; osc('square',f,t,l,layers.lead,.05,{a:.002,filter:{type:'lowpass',f:3200,f2:900}}); osc('sine',f*2,t,l*.8,layers.lead,.11,{a:.002}); osc('sine',f*3.98,t,.07,layers.lead,.04,{a:.001}); };
  const glock=(t,f,d)=>{ osc('sine',f,t,Math.min(1.6,d*2+.6),layers.lead,.15,{a:.002}); osc('sine',f*2.76,t,.3,layers.lead,.05,{a:.001}); osc('sine',f*5.4,t,.1,layers.lead,.025,{a:.001}); };
  const accordion=(t,f,d)=>{ const l=d*1.05; [.996,1.004].forEach(m=>osc('sawtooth',f*m,t,l,layers.lead,.045,{a:.025,filter:{type:'lowpass',f:2000,q:1.5}})); osc('square',f*2,t,l,layers.lead,.015,{a:.025,filter:{type:'lowpass',f:2600}}); };
  const pluck=(t,f)=>osc('triangle',f,t,.18,layers.arp,.2,{a:.002,filter:{type:'lowpass',f:2600,f2:300,q:2}});
  const bub  =(t,f)=>{ osc('sine',f,t,.16,layers.arp,.14,{a:.003,f2:f*1.03}); osc('sine',f*2,t,.06,layers.arp,.04,{a:.002}); };
  const mando=(t,f)=>{ osc('sawtooth',f,t,.16,layers.arp,.08,{a:.002,filter:{type:'lowpass',f:3600,f2:500,q:3}}); osc('sawtooth',f,t+.045,.12,layers.arp,.04,{a:.002,filter:{type:'lowpass',f:3000,f2:500}}); };
  const pbass=(t,f,d)=>{ const l=Math.min(d,.45); osc('sine',f,t,l,layers.bass,.42,{a:.004}); osc('triangle',f*2,t,l*.4,layers.bass,.08,{a:.003,filter:{type:'lowpass',f:900}}); };
  const bounce=(t,f,d)=>{ const l=Math.min(d,.28); osc('sine',f,t,l,layers.bass,.38,{a:.003,f2:f*.97}); osc('square',f,t,l*.8,layers.bass,.1,{a:.003,filter:{type:'lowpass',f:900,f2:300,q:4}}); };
  const tock =(t,v)=>{ osc('sine',560,t,.08,layers.taiko,.45*v,{a:.001,f2:380}); nz(t,.03,layers.taiko,.12*v,{type:'bandpass',f:1500,q:2}); };
  const pop  =(t,v)=>osc('sine',320,t,.07,layers.taiko,.5*v,{a:.001,f2:1100});
  const clap =(t,v)=>{ [0,.011,.022].forEach(o=>nz(t+o,.03,layers.snare,.35*v,{type:'bandpass',f:1400,q:1.2})); nz(t+.03,.16,layers.snare,.22*v,{type:'bandpass',f:1200,q:.8}); };
  const jingle=(t,v,open)=>{ nz(t,open?.3:.13,layers.hat,.16*v,{type:'bandpass',f:7200,q:4}); nz(t+.018,.1,layers.hat,.1*v,{type:'bandpass',f:9600,q:5}); osc('sine',5300+Math.random()*400,t,.09,layers.hat,.02*v,{a:.001}); };
  const shaker=(t,v)=>nz(t,.06,layers.hat,.14*v,{type:'bandpass',f:6200,q:1.2});
  /* instruments a song can pick (see "voice" in SONGS) */
  const VOICE={ lead:{saw:lead,marimba,celesta,toy,glock,accordion}, arp:{tri:arp,kalimba,pluck,bub,mando}, bass:{saw:bass,tuba,pbass,bounce},
                perc:{taiko,wood,tock,pop}, snare:{snare,clap}, hat:{nz:hat,jingle,shaker} };

  function sched(s,t){
    const spb=S.spb, st=s%spb, barN=Math.floor(s/spb), secN=Math.floor(barN/4), bar=barN%4;
    const sec=S.SEC[S.FORM[secN%S.FORM.length]], key=S.KEYS[Math.floor(secN/S.FORM.length)%S.KEYS.length];
    const root=sec.roots[bar]+key, fill=bar===3&&st>=spb-4, roll=sec.build&&bar===3&&st>=spb-8, full=sec.drums>=1;
    const V=S.voice, base=S.base, rg=S.reg;
    if(S.swing&&st%2===1) t+=S.swing*SPS;
    if(st===0){ let p=sec.lead[bar]; if(Math.random()<.2) p=rnd(sec.lead); barLead=S.PH[p]; barEcho=Math.random()<.18; }
    if(T.pad>.02&&st===0) pad(t,root);
    if(T.kick>.02&&full&&!roll&&S.KICKS[sec.kick][st]) kick(t,st%4===0?1:.75);
    if(T.taiko>.02){ if(fill&&!roll) tom(t,[240,200,170,140][st-(spb-4)]); else if(S.TAIK[st]) VOICE.perc[V.perc](t,st===0?1:.8,st===3?1.15:1); }
    const SN=VOICE.snare[V.snare||'snare'], HT=VOICE.hat[V.hat||'nz'];
    if(T.snare>.02){ if(roll) snare(t,.3+(st-(spb-8))*.09); else if(full&&(S.SNAR[st]||fill)) SN(t,fill?.7:1); }
    if(T.hat>.02){ const hv=S.hat[st]||(H16?S.hat16[st]:0); if(hv) HT(t,hv,st===S.open&&bar%2===1);
      if(st===0&&bar===0&&T.kick>.5&&full) nz(t,1.4,layers.hat,.35*(S.crash==null?1:S.crash),{f:4000,f2:2500}); }
    const bp=S.BASSES[sec.bass][st];
    if(T.bass>.02&&bp) VOICE.bass[V.bass](t,hz(base,root)*(bp===2?2:bp===3?1.5:1),SPS*(sec.bass===3?7:1.7));
    if(T.arp>.02&&(T.arp>.5||st%2===0)) VOICE.arp[V.arp](t,hz(base*rg.arp,root+S.ARPS[sec.arp][st]));
    if(T.lead>.02&&barLead) for(const n of barLead) if(n[0]===st) VOICE.lead[V.lead](t,hz(base*rg.lead,n[1]+key),n[2]*SPS);
    if(T.bell>.02){
      if(sec.bell&&(st===0||st===6||st===10)) bell(t,hz(base*rg.bell,root+(st===0?12:st===6?7:19)-12));
      if(barEcho&&barLead&&T.lead<.02) for(const n of barLead) if(n[0]===st&&n[0]%4===0) bell(t,hz(base*rg.bell,n[1]+key));
    }
  }
  /* switch song: fade out, change at the end of the fade, start the new song from its beginning, fade in */
  function applySong(n){ S=n; SPS=60/n.bpm/4; step=0; barLead=null; barEcho=false; if(revOut) revOut.gain.setTargetAtTime(.32*(n.rev||1),ctx.currentTime,.3); }
  function setSong(id){
    const n=SONGS[id]||SONGS.dojo;
    if(pending&&n===S){ pending=null; if(xf) xf.gain.setTargetAtTime(1,ctx.currentTime,.12); return; }   // changed our mind during the fade
    if(n===(pending||S)) return;
    if(!ctx||!started){ applySong(n); return; }
    pending=n; swapAt=ctx.currentTime+.9; xf.gain.setTargetAtTime(0,ctx.currentTime,.2);
  }
  function tick(){
    if(!ctx) return;
    if(ctx.state!=='running'){ nextT=ctx.currentTime+.1; return; }
    if(pending&&ctx.currentTime>=swapAt){ applySong(pending); pending=null; xf.gain.setTargetAtTime(1,ctx.currentTime,.12); }
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
    duckG=ctx.createGain(); bus=ctx.createGain(); bus.gain.value=musicOn?.8:0; xf=ctx.createGain();   // xf = the fade between songs
    bus.connect(xf); xf.connect(duckG); duckG.connect(filt); filt.connect(comp); comp.connect(ctx.destination);
    // reverb: some parts are sent to a shared hall (its level depends on the song, see "rev" in SONGS)
    let rev=null; try{ rev=ctx.createConvolver(); rev.buffer=makeIR(ctx,2.4,2.6); revOut=ctx.createGain(); revOut.gain.value=.32*(S.rev||1); rev.connect(revOut); revOut.connect(bus); }catch(e){ rev=null; }
    for(const n in T){ const g=ctx.createGain(); g.gain.value=0; g.connect(bus); layers[n]=g;
      if(rev&&REV_SEND[n]){ const sg=ctx.createGain(); sg.gain.value=REV_SEND[n]; g.connect(sg); sg.connect(rev); } }
    nextT=ctx.currentTime+.15; startClock(); update();
  }
  function update(){
    if(!ctx||!bus) return;
    const st=G.state, m=st==='pause'?G.prevState:st, hp=G.bossHP, now=ctx.currentTime;
    const action=(m==='play'||m==='busy')&&document.body.classList.contains('playing');
    setSong(document.body.classList.contains('playing')?placeSong():'dojo');   // in a run: the song of the place; menus: the dojo song
    for(const k in T) T[k]=0;
    if(action){ T.pad=.35; T.kick=T.taiko=T.snare=T.hat=T.bass=1; T.arp=.75; T.bell=.8; T.lead=(G.combo>=3||hp<=2)?1:0; H16=hp<=3; }
    else if(m==='chest'||m==='summary'){ T.pad=1; T.arp=.7; T.lead=1; T.bell=.6; H16=false; }
    else { T.pad=1; T.arp=.4; T.bell=.7; H16=false; }
    const mix=S.mix||{}; for(const k in T) layers[k].gain.setTargetAtTime(T[k]*(mix[k]==null?1:mix[k]),now,.3);
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
    else if(kind==='rage'){ duck(.45,700); osc('sawtooth',58,t,.9,filt,.35,{f2:42,filter:{type:'lowpass',f:500,f2:200,q:6}}); osc('sine',55,t,.9,filt,.6,{f2:40}); nz(t,.7,filt,.2,{type:'lowpass',f:700,f2:120}); }
    else if(kind==='boss'){ duck(.5,500); nz(t,.9,filt,.35,{f:3000,f2:1200}); osc('sine',120,t,.6,filt,.9,{f2:38}); osc('triangle',65,t,.6,filt,.5); }
  }
  return {start,update,duck,duckHold,release,stinger,setSong, level:()=>duckG?duckG.gain.value:1};
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
/* iPhone / iPad only allow speech that starts from a tap: say a silent word on the first tap or key press, after that the game may speak any time */
let speechUnlocked=false;
function unlockAudio(){
  audio();
  if(speechUnlocked) return; speechUnlocked=true;
  try{ const u=new SpeechSynthesisUtterance(' '); u.volume=0; speechSynthesis.speak(u); }catch(e){}
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
