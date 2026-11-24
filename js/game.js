/* Game state, screens, wardrobe, word list editor and the game flow (levels, words, finishers, report, chest).
   (plain script: shares the global scope with the other files in js/, load order matters - see index.html) */
'use strict';

/* =====================================================================
   GAME STATE
   ===================================================================== */
const G={state:'title',heroIdx:save.hero||0,rigs:[],rig:null,x0:0,level:1,pool:[],cur:null,idx:0,wordMistakes:0,wrongRow:0,
         combo:0,bossHP:5,boss:null,dummies:[],lock:true,chest:null,prevState:'play',camX:0,shake:0,t:0,
         results:[],rec:null,hover:-1,sumDone:null,wordDone:false,again:{},
         lives:LIVES_PER_BOSS,blanks:[],timeLeft:null};     // blanks: the letter positions to spell in this word; timeLeft: seconds left for this letter (null = not running)
let timerOn=true; try{ timerOn=localStorage.getItem('sh_timer')!=='off'; }catch(e){}
window.__game=G;
const camT=V3(0,1.8,0);
const run=fn=>fn().catch(recover);     // every game-flow chain goes through here, so any error ends up in recover() instead of freezing the game
const show=(id,on)=>$(id).classList.toggle('show',on);
const setScreens=name=>{ ['title','select','shop','locker','pause','reveal','words','summary'].forEach(s=>show(s,s===name)); };

function refreshStats(){ $('coins').textContent=save.coins; $('stars').textContent=save.stars; $('lvl').textContent=G.level; }
function addCoins(n){ save.coins+=n; refreshStats(); persist(); }
function banner(small,big,ms=1900){ const b=$('banner'); b.querySelector('small').textContent=small; b.querySelector('b').textContent=big; b.classList.add('show'); return wait(ms).then(()=>b.classList.remove('show')); }
function toScreen(v){
  const w=engine.getRenderWidth(), h=engine.getRenderHeight(), r=canvas.getBoundingClientRect();
  const p=BABYLON.Vector3.Project(v,BABYLON.Matrix.IdentityReadOnly,scene.getTransformMatrix(),camera.viewport.toGlobal(w,h));
  return {x:r.left+p.x/w*r.width,y:r.top+p.y/h*r.height};
}
function popText(txt,world,color){ const p=toScreen(world), e=document.createElement('div'); e.className='popt'; e.textContent=txt; e.style.left=p.x+'px'; e.style.top=p.y+'px';
  if(color) e.style.color=color; document.body.appendChild(e); setTimeout(()=>e.remove(),1050); }
function flyEl(html,from,toEl,ms=700){
  return new Promise(res=>{ const e=document.createElement('div'); e.className='fly'; e.textContent=html; e.style.left=from.x+'px'; e.style.top=from.y+'px'; document.body.appendChild(e);
    const r=toEl.getBoundingClientRect();
    requestAnimationFrame(()=>requestAnimationFrame(()=>{ const tr=`${ms}ms cubic-bezier(.3,.7,.4,1)`;
      e.style.transition=`left ${tr},top ${tr},transform ${ms}ms,opacity ${ms}ms`; e.style.left=(r.left+r.width/2)+'px'; e.style.top=(r.top+r.height/2)+'px'; e.style.transform='translate(-50%,-50%) scale(.7)'; }));
    setTimeout(()=>e.remove(),ms+30);
    wait(ms+30).then(res); });      // on the tween clock (not setTimeout), so resetting the game also stops whatever is waiting for this
}
/* slots: given (already filled in, grey) · filled (spelled, green) · cur (the one to spell now) · todo (still to come, faded) */
function renderWord(){
  const w=G.cur.w; $('emoji').textContent=G.cur.e;
  $('blanks').innerHTML=[...w].map((ch,i)=>{
    const given=!G.blanks.includes(i), cls=given?'given':i<G.idx?'filled':i===G.idx?'cur':'todo';
    return `<div class="slot ${cls}" id="slot${i}">${given||i<G.idx?ch:''}</div>`; }).join('');
}
/* which letters of a word the child has to spell on this level (see BLANK_SHARE in settings.js); vowels are blanked first */
function pickBlanks(w){
  const all=[...w].map((_,i)=>i), share=BLANK_SHARE[G.level-1];
  if(!share) return all;
  const n=Math.max(1,Math.min(all.length,Math.round(all.length*share)));
  const vow=shuffle(all.filter(i=>VOWELS.includes(w[i]))), con=shuffle(all.filter(i=>!VOWELS.includes(w[i])));
  return vow.concat(con).slice(0,n).sort((a,b)=>a-b);
}
function renderHearts(){ $('hearts').textContent='❤️'.repeat(Math.max(0,G.bossHP))+'🖤'.repeat(Math.max(0,WORDS_PER_LEVEL-G.bossHP)); }
function renderLives(){ $('livesbox').textContent='💚'.repeat(Math.max(0,G.lives))+'🖤'.repeat(Math.max(0,LIVES_PER_BOSS-G.lives)); }
function loseLife(){
  G.lives=Math.max(0,G.lives-1); renderLives();
  const b=$('livesbox'); b.classList.remove('shake'); void b.offsetWidth; b.classList.add('shake');
}
/* ---- letter timer ---- */
function updateTimerBar(){
  const t=$('timer'), on=timerOn&&G.timeLeft!=null; t.classList.toggle('on',on); if(!on) return;
  const f=Math.max(0,G.timeLeft/LETTER_TIME); t.firstElementChild.style.width=(f*100)+'%';
  t.classList.toggle('warn',G.timeLeft<=10&&G.timeLeft>5); t.classList.toggle('low',G.timeLeft<=5);
}
function startTimer(){ G.timeLeft=LETTER_TIME; updateTimerBar(); }
function stopTimer(){ G.timeLeft=null; updateTimerBar(); }
function tickLetterTimer(dt){          // called from the main loop (it does not run while paused)
  if(!timerOn||G.timeLeft==null||G.state!=='play'||G.lock) return;
  const before=Math.ceil(G.timeLeft); G.timeLeft-=dt/1000; updateTimerBar();
  if(G.timeLeft<=5&&Math.ceil(G.timeLeft)<before&&G.timeLeft>0) SFX.tick();       // a tick every second in the last 5 seconds
  if(G.timeLeft<=0){ G.lock=true; G.timeLeft=null; updateTimerBar(); run(timeUp); }
}
/* say the word again (once) as a reminder */
const remindWord=()=>{ if(G.cur) say(G.cur.w,.72); };
function setCombo(){ const c=$('combo'); if(G.combo>=2){ c.textContent=`🔥 x${Math.min(G.combo,5)} combo!`; c.style.opacity=1; c.classList.toggle('hot',G.combo>=3); } else c.style.opacity=0; }

/* ---------------- menu bar helpers ---------------- */
function updateMenuLabels(){
  $('mbMusic').textContent=musicOn?'🎵 Music: On':'🔇 Music: Off';
  $('mbGfx').textContent='✨ Graphics: '+QNAME[QUAL];
  document.querySelectorAll('[data-act="music"]').forEach(b=>{ if(b.id!=='mbMusic') b.textContent=musicOn?'🎵 Music: On':'🔇 Music: Off'; });
  document.querySelectorAll('[data-act="timer"]').forEach(b=>{ b.textContent=timerOn?'⏱️ Timer: On':'⏱️ Timer: Off'; });
}
/* calm mode: no countdown (lives are still lost on wrong letters) */
function toggleTimer(){ timerOn=!timerOn; try{ localStorage.setItem('sh_timer',timerOn?'on':'off'); }catch(e){} toast(timerOn?'Timer on ⏱️':'Timer off - take your time 😌'); updateMenuLabels(); updateTimerBar(); }
function toggleMusic(){ musicOn=!musicOn; try{ localStorage.setItem('sh_music',musicOn?'on':'off'); }catch(e){} toast(musicOn?'Music on 🎵':'Music off'); try{ Music.update(); }catch(err){} updateMenuLabels(); }
function cycleGfx(){ setQuality(QUAL==='balanced'?'high':QUAL==='high'?'low':'balanced',true); updateMenuLabels(); }

/* ---------------- select screen ---------------- */
function layoutSelect(){
  G.rigs.forEach((r,i)=>{ r.root.setEnabled(true); r.pod.setEnabled(true); r.cheer=(i===G.heroIdx); r.moving=false; r.busy=false; r.root.position.set((i-1)*4.6,0,0); });
  const h=HEROES[G.heroIdx]; $('heroName').textContent=h.name; $('heroDesc').textContent=h.desc;
}
function enterSelect(){
  const home=placeForLevel(1); if(home&&PLACE.id!==home.id) setPlace(home.id);        // coming back from a run of other places: show the start place again
  G.state='select'; document.body.classList.remove('playing'); setScreens('select'); layoutSelect(); G.camTarget=0; refreshStats(); updateMenuLabels(); renderPlace();
}

/* ---------------- places (see places.js): chosen on the select screen, or a different one on every level ---------------- */
function renderPlace(){
  const ch=PLACE_CHOICES.find(c=>c.id===save.place)||PLACE_CHOICES[0];
  $('placeIcon').textContent=ch.icon; $('placeName').textContent=ch.name; $('placeDesc').textContent=ch.desc;
}
function cyclePlace(dir){
  const i=Math.max(0,PLACE_CHOICES.findIndex(c=>c.id===save.place)), ch=PLACE_CHOICES[(i+dir+PLACE_CHOICES.length)%PLACE_CHOICES.length];
  save.place=ch.id; persist(); SFX.swap();
  const to=placeForLevel(1);
  if(to&&to.id!==PLACE.id){ setPlace(to.id); flash('#ffffff',.35); }        // the scene behind the menu changes right away, so the child can see it
  renderPlace();
}
/* at the start of every level: a fixed place stays; the tour moves to the next place; "Surprise me" to a random other one (the flash hides the swap) */
function pickLevelPlace(){
  const next=placeForLevel(G.level)||rnd(PLACES.filter(p=>p.id!==PLACE.id));
  if(next.id!==PLACE.id){ setPlace(next.id); flash('#ffffff',.7); }
  prepNextPlace(G.level);
}

/* ---------------- wardrobe ---------------- */
let shopIdx=0;
const SHOP_COLS=6;
function shopIcon(it){ return it.color&&!it.kind?`<span class="sw" style="background:${it.color}"></span>`:it.icon; }
function renderShop(){
  $('shopCoins').textContent=save.coins;
  $('shopGrid').innerHTML=SHOP.map((it,i)=>{
    const owned=save.owned[it.id], eq=save.equip[it.slot]===it.id, cant=!owned&&save.coins<it.price;
    return `<div class="item ${i===shopIdx?'sel':''} ${eq?'eq':''} ${owned?'':'lock'} ${cant?'poor':''}" data-i="${i}"><div class="slotTag">${SLOT_NAME[it.slot]}</div><div class="ic">${shopIcon(it)}</div>${esc(it.name)}<br>${eq?'✅ wearing':owned?'owned':'🪙 '+it.price}</div>`; }).join('');
  const it=SHOP[shopIdx], owned=save.owned[it.id], eq=save.equip[it.slot]===it.id;
  $('shopInfo').innerHTML=`<b>${esc(it.name)}</b>${it.desc?' - '+esc(it.desc):''} &nbsp; ${owned?(eq?'(✕ / click to take it off)':'(✕ / click to wear it)'):`costs 🪙 ${it.price}${save.coins<it.price?` - you need ${it.price-save.coins} more!`:''}`}`;
  $('shopAct').textContent=owned?(eq?'Take off':'Wear it!'):`Buy 🪙 ${it.price}`;
  const sel=$('shopGrid').children[shopIdx]; if(sel) sel.scrollIntoView({block:'nearest'});
}
function shopAct(){
  const it=SHOP[shopIdx];
  if(!save.owned[it.id]){
    if(save.coins<it.price){ SFX.wrong(); $('shopCoins').parentElement.classList.remove('shake'); void $('shopCoins').offsetWidth; $('shopCoins').parentElement.classList.add('shake'); return; }
    save.coins-=it.price; save.owned[it.id]=true; save.equip[it.slot]=it.id; SFX.buy(); confettiDom();
  } else { save.equip[it.slot]=(save.equip[it.slot]===it.id)?null:it.id; SFX.swap(); }
  persist(); G.rigs.forEach(applyCosmetics); setAuraColor(); renderShop(); refreshStats();
}
function confettiDom(){ const r=$('shopAct').getBoundingClientRect(); for(let i=0;i<14;i++){ const e=document.createElement('div'); e.className='cdot';
  e.textContent=rnd(['🎉','✨','⭐','💖','🪙']); e.style.left=(r.left+r.width/2)+'px'; e.style.top=r.top+'px';
  e.style.setProperty('--dx',(Math.random()*300-150)+'px'); e.style.setProperty('--dy',(-80-Math.random()*200)+'px'); document.body.appendChild(e); setTimeout(()=>e.remove(),1100); } }
function renderLocker(){
  const got=WORDS.filter(w=>save.stickers[w.w]).length; $('lockerCount').textContent=`(${got}/${WORDS.length})`;
  $('lockerGrid').innerHTML=WORDS.map(w=>{ const s=save.stickers[w.w];
    return s?`<div class="item"><div class="ic">${esc(w.e)}</div>${esc(w.w)}<br>${'⭐'.repeat(s)}${'☆'.repeat(3-s)}</div>`:`<div class="item lock"><div class="ic">❓</div>???<br>☆☆☆</div>`; }).join('');
}

/* ---------------- word list editor (menu bar -> 📝 Words) ---------------- */
function openWords(){ G.state='words'; setScreens('words'); renderWords(); togglePicker(false); SFX.swap(); }
/* "More..." picture picker: a category grid that fills the picture box (Auto clears it again) */
let pkCat=0;
function renderPicker(){
  const cur=$('eIn').value.trim();
  $('pkTabs').innerHTML=EMOJI_CATS.map((c,i)=>`<button class="pk-tab${i===pkCat?' on':''}" data-cat="${i}">${c.icon} ${esc(c.name)}</button>`).join('');
  $('pkGrid').innerHTML=EMOJI_CATS[pkCat].list.map(e=>`<button class="pk-e${e===cur?' sel':''}" data-emo="${esc(e)}">${e}</button>`).join('');
}
function togglePicker(open){
  const p=$('picker'), show=open===undefined?!p.classList.contains('show'):open;
  p.classList.toggle('show',show); if(show) renderPicker();
}
function saveWords(){
  save.words=WORDS.map(o=>({w:o.w,e:o.e})); save.perLevel=WORDS_PER_LEVEL;
  Object.keys(save.weak).forEach(k=>{ if(!WORDS.some(o=>o.w===k)) delete save.weak[k]; });     // forget practice scores of removed words
  persist(); G.pool=[];
}
function renderWords(){
  $('wList').innerHTML=WORDS.length?WORDS.map((w,i)=>`<span class="wchip"><span class="say" data-say="${i}" title="hear it${weakOf(w.w)>=2?' - needs practice, it will come back more often':''}">${weakOf(w.w)>=2?'🎯 ':''}${esc(w.e)} ${esc(w.w)}</span><button class="x" data-del="${i}" title="remove">✖</button></span>`).join('')
    :'<i>No words yet - type some above!</i>';
  $('wCount').textContent=WORDS.length; $('perN').textContent=WORDS_PER_LEVEL;
  if(!$('packs').children.length) $('packs').innerHTML=WORD_PACKS.map((p,i)=>`<button class="btn sm" data-pack="${i}">${esc(p.name)}</button>`).join('');
}
const cleanWord=s=>s.toLowerCase().replace(/[^a-z]/g,'').slice(0,14);
function addWords(){
  const parts=$('wIn').value.split(/[\s,;]+/).map(cleanWord).filter(Boolean), myE=$('eIn').value.trim().slice(0,8);
  let added=0;
  parts.forEach(w=>{ if(WORDS.some(o=>o.w===w)) return; WORDS.push({w,e:(parts.length===1&&myE)||EMOJI_DICT[w]||'✏️'}); added++; });
  if(!added){ SFX.wrong(); toast(parts.length?'Those words are already on the list':'Type a word first ✏️'); return; }
  $('wIn').value=''; $('eIn').value=''; $('eIn').placeholder='🙂'; togglePicker(false); saveWords(); renderWords(); SFX.pop(); toast(`Added ${added} word${added>1?'s':''}! ✅`);
  if(parts.length===1) sayWord(parts[0]);
}
function wordsClick(e){
  const t=e.target.closest('[data-del],[data-say],[data-pack],[data-wact],[data-emo],[data-cat]'); if(!t) return;
  if(t.dataset.del!==undefined){ WORDS.splice(+t.dataset.del,1); saveWords(); renderWords(); SFX.tick(); }
  else if(t.dataset.say!==undefined){ const w=WORDS[+t.dataset.say]; if(w) sayWord(w.w); }
  else if(t.dataset.pack!==undefined){ const p=WORD_PACKS[+t.dataset.pack]; WORDS.length=0; p.words.forEach(o=>WORDS.push({...o})); saveWords(); renderWords(); SFX.buy(); toast('Loaded '+p.name); }
  else if(t.dataset.emo!==undefined){ $('eIn').value=t.dataset.emo; togglePicker(false); SFX.pop(); }
  else if(t.dataset.cat!==undefined){ pkCat=+t.dataset.cat; renderPicker(); SFX.tick(); }
  else { const a=t.dataset.wact;
    if(a==='add') addWords();
    else if(a==='more'){ togglePicker(); SFX.swap(); }
    else if(a==='auto'){ $('eIn').value=''; togglePicker(false); SFX.swap(); toast('Auto picture ✨'); }
    else if(a==='per-'||a==='per+'){ WORDS_PER_LEVEL=Math.max(2,Math.min(10,WORDS_PER_LEVEL+(a==='per+'?1:-1))); saveWords(); renderWords(); SFX.swap(); }
    else if(a==='clear'){ if(confirm('Remove all the words from the list?')){ WORDS.length=0; saveWords(); renderWords(); } } }
  t.blur();
}
$('words').addEventListener('click',wordsClick);
$('wIn').addEventListener('keydown',e=>{ if(e.key==='Enter'){ e.preventDefault(); addWords(); } });
$('wIn').addEventListener('input',()=>{ const w=cleanWord($('wIn').value); $('eIn').placeholder=EMOJI_DICT[w]||'🙂'; });

/* ---------------- clicks on any on-screen button ---------------- */
document.addEventListener('click',e=>{
  const b=e.target.closest('[data-act]'); if(!b) return; e.preventDefault(); b.blur(); audio();
  const a=b.dataset.act;
  if(a==='music') toggleMusic(); else if(a==='timer') toggleTimer(); else if(a==='gfx') cycleGfx(); else if(a==='words'){ if(G.state==='select') openWords(); } else onInput(a);
});
$('shopGrid').addEventListener('click',e=>{ const it=e.target.closest('[data-i]'); if(!it) return; const i=+it.dataset.i;
  if(i===shopIdx) shopAct(); else { shopIdx=i; SFX.swap(); renderShop(); } });

/* ---------------- input dispatch ---------------- */
function onInput(a){
  audio();
  // while playing (waiting for a letter, or watching an animation) Esc pauses and Enter/Space do nothing
  if(G.state==='play'||G.state==='busy'){ if(a==='ok') return; if(a==='back') a='start'; } else { if(a==='ok') a='A'; if(a==='back') a='B'; }
  switch(G.state){
    case 'title': SFX.ding(0); enterSelect(); break;
    case 'select':
      if(a==='left'||a==='right'){ G.heroIdx=(G.heroIdx+(a==='right'?1:-1)+HEROES.length)%HEROES.length; SFX.swap(); layoutSelect(); }
      else if(a==='up'||a==='pleft') cyclePlace(-1);
      else if(a==='down'||a==='pright') cyclePlace(1);
      else if(a==='A'){ if(!WORDS.length){ toast('Add some words first! 📝'); openWords(); break; } save.hero=G.heroIdx; persist(); run(startRun); }
      else if(a==='Y'){ G.state='shop'; shopIdx=0; setScreens('shop'); renderShop(); SFX.swap(); }
      else if(a==='X'){ G.state='locker'; setScreens('locker'); renderLocker(); SFX.swap(); }
      else if(a==='L1') openWords();
      break;
    case 'shop':
      if(a==='left') shopIdx=(shopIdx+SHOP.length-1)%SHOP.length; else if(a==='right') shopIdx=(shopIdx+1)%SHOP.length;
      else if(a==='up') shopIdx=(shopIdx+SHOP.length-SHOP_COLS)%SHOP.length; else if(a==='down') shopIdx=(shopIdx+SHOP_COLS)%SHOP.length;
      else if(a==='A'){ shopAct(); break; } else if(a==='B'){ enterSelect(); break; } else break;
      SFX.swap(); renderShop(); break;
    case 'locker': if(a==='B'||a==='A') enterSelect(); break;
    case 'words': if(a==='B'||a==='start'){ enterSelect(); } break;
    case 'play':
      if(a==='A'||a==='B'||a==='X'||a==='Y') run(()=>pick({A:0,B:1,X:2,Y:3}[a]));
      else if(a==='L1'||a==='R1'){ if(G.cur) sayWord(G.cur.w); }
      else if(a==='start') pauseGame(true);
      break;
    case 'busy': if(a==='start') pauseGame(true); break;     // animations (dashes, finishers, banners...) can be paused too
    case 'chest': if(a==='A') run(chestPress); else if(a==='start') pauseGame(true); break;
    case 'summary': if(a==='A'&&G.sumDone){ const f=G.sumDone; G.sumDone=null; setScreens(null); G.state='busy'; f(); } break;
    case 'pause':
      if(a==='A'||a==='start') pauseGame(false); else if(a==='B') resetToSelect();
      break;
  }
}
function pauseGame(on){
  if(on){ G.prevState=G.state; G.state='pause'; paused=true; setScreens('pause'); updateMenuLabels(); }
  else { G.state=G.prevState; paused=false; setScreens(null); }
}
/* pause by itself when the tab/window is hidden (the animation clock stops, so the timers that drive speech and effects must not run on without it) */
document.addEventListener('visibilitychange',()=>{
  if(!document.hidden) return;
  try{ speechSynthesis.cancel(); }catch(e){}
  if(G.state==='play'||G.state==='busy'||G.state==='chest') pauseGame(true);
});

/* =====================================================================
   RESET & ERROR RECOVERY
   ===================================================================== */
/* everything that exists when the game has finished starting up (rigs, corridor, lights...) is remembered, so that
   "back to hero select" can throw away whatever a run created (boss, letter signs, flying projectiles, effects...) */
let BASE=null;
function snapshotScene(){ BASE=new Set([...scene.meshes,...scene.transformNodes]); }
function sweepScene(){
  if(!BASE) return;
  [...scene.meshes,...scene.transformNodes].forEach(n=>{ if(!BASE.has(n)&&!PLACE_KEEP.has(n)&&!n.parent&&!n.isDisposed()){ try{ n.dispose(); }catch(e){} } });     // (the scenery of the places is built later on demand, see places.js)
}
function resetRigPose(rig){
  JN.forEach(n=>{ const p=REST[n]||[0,0,0]; rig.j[n].rotation.set(p[0],p[1],p[2]); });
  rig.j.body.position.set(0,0,0); rig.busy=false; rig.moving=false; rig.dashing=false; rig.cheer=false;
}
function hideRunUi(){
  ['banner','sticker','callout'].forEach(id=>$(id).classList.remove('show')); $('prompt').style.display='none'; $('flash').style.opacity=0;
  stopTimer();
  document.querySelectorAll('.popt,.fly,.cdot').forEach(e=>e.remove());
}
/* Back to the hero select screen WITHOUT reloading the page: stop everything the run was doing, remove what it built, and put the world back at the start. */
function resetToSelect(){
  cancelTweens(); paused=false; slowMul=1; clearTimeout(slowT);          // every await in the old run now simply never continues
  try{ speechSynthesis.cancel(); }catch(e){}
  G.dummies.forEach(d=>{ try{ disposeDummy(d); }catch(e){} }); G.dummies=[];
  if(G.boss){ try{ G.boss.dispose(); }catch(e){} }
  if(G.chest){ try{ G.chest.ch.root.dispose(); }catch(e){} }
  sweepScene();
  G.boss=null; G.chest=null; G.cur=null; G.rec=null; G.rig=null; G.lock=true; G.sumDone=null; G.wordDone=false; G.again={};
  G.combo=0; setCombo(); G.shake=0; camPunch=0; G.hover=-1; G.pool=[]; G.results=[]; G.lives=LIVES_PER_BOSS; G.blanks=[];
  hideRunUi(); $('hud').style.display='';
  G.rigs.forEach(r=>{ resetRigPose(r); r.root.rotation.y=PI; r.root.scaling.setAll(1); });
  setEmit(aura,0); setEmit(streak,0);
  G.camX=0; SEGS.forEach((s,i)=>{ s.position.x=i*4-24; });                // the corridor scrolls forever, so put it back where it started
  enterSelect();
}
/* Something went wrong in the middle of a run. A child should never get stuck: first try the current word again, and if that keeps
   failing (or we are not in the middle of a word) go back to the hero select screen. */
let recoverN=0, recoverT=0;
function recover(err){
  console.error('[recover]',err);
  const now=performance.now(); recoverN=now-recoverT<20000?recoverN+1:1; recoverT=now;
  const midWord=!!(G.rig&&G.boss&&G.cur&&G.bossHP>0&&!G.chest);
  if(!midWord||recoverN>2){ toast('Oops, something went wrong - back to the hero menu'); resetToSelect(); return; }
  toast('Oops! Let us try that word again 🔄'); paused=false; slowMul=1; G.state='busy'; setScreens(null);
  run(retryWord);
}
async function retryWord(){
  G.dummies.forEach(d=>{ try{ disposeDummy(d); }catch(e){} }); G.dummies=[];
  resetRigPose(G.rig); hideRunUi();
  if(G.wordDone){ await nextWord(); return; }                      // the word was already finished: just carry on with the next one
  G.idx=G.blanks[0]; G.wordMistakes=0; G.wrongRow=0; if(!G.rec) G.rec={w:G.cur.w,e:G.cur.e,miss:[]};
  renderWord(); await spawnOptions();
}

/* =====================================================================
   GAME FLOW
   ===================================================================== */
async function startRun(){
  G.state='busy'; setScreens(null); document.body.classList.add('playing');
  G.rigs.forEach((r,i)=>{ r.cheer=false; r.pod.setEnabled(false); r.root.setEnabled(i===G.heroIdx); });
  G.rig=G.rigs[G.heroIdx]; const rig=G.rig; rig.root.position.set(0,0,0); rig.root.rotation.y=PI/2+.45; rig.root.scaling.setAll(1);
  G.x0=0; G.level=1; G.pool=[]; G.again={}; G.wordDone=false; G.combo=0; G.camTarget=5.5; refreshStats(); setCombo();
  await startLevel();
}
async function startLevel(){
  G.state='play'; G.lock=true; G.bossHP=WORDS_PER_LEVEL; G.results=[]; G.lives=LIVES_PER_BOSS; renderLives(); stopTimer(); refreshStats();
  pickLevelPlace();
  const mk=bossForLevel(G.level), rig0=G.rig; const boss=await mk();                   // a boss can be a .glb model, which loads asynchronously (the place can have its own order of bosses)
  if(!G.rig||G.rig!==rig0){ boss.dispose(); return; }                                  // the player went back to hero select while it was loading
  G.boss=boss; G.boss.root.position.set(G.rig.root.position.x+30,0,1.8);
  blob(G.boss.root,2.4).position.z=-.2; outlineNode(G.boss.root,.045); G.bossArrived=false;
  $('bossName').textContent=G.boss.name; renderHearts(); $('hud').style.display='block';
  SFX.thud(); await banner(`Level ${G.level} boss!`,G.boss.name,2200);
  await nextWord();
}
/* ---- which word comes next: words the child struggles with come back more often ----
   save.weak[word] is a "needs practice" score (0-5): it goes up when the word had mistakes and down when it was spelled perfectly. */
const weakOf=w=>save.weak[w]||0;
function buildPool(last){
  const items=[]; WORDS.forEach(o=>{ const k=weakOf(o.w), copies=1+(k>=3?2:k>=1?1:0); for(let i=0;i<copies;i++) items.push(o); });   // weak words get 1-2 extra turns per round
  // draw the playing order one word at a time, never the same word as the one before (also not the one just played)
  // (a word whose copies would no longer fit between the other words is placed right away, so copies never end up bunched at the end)
  const seq=[]; let prev=last;
  while(items.length){
    const cnt={}; items.forEach(o=>{ cnt[o.w]=(cnt[o.w]||0)+1; });
    const must=Object.keys(cnt).find(w=>w!==prev&&cnt[w]*2>items.length), ok=items.filter(o=>o.w!==prev);
    const pick=rnd(must?items.filter(o=>o.w===must):(ok.length?ok:items));
    items.splice(items.indexOf(pick),1); seq.push(pick); prev=pick.w; }
  return seq.reverse();      // words are taken from the END of the pool, so the first word drawn must be last
}
/* after a word with mistakes: get it back in about 3 words' time (twice at most per run), so it is practised while it is fresh */
function requeueWord(w){
  if(WORDS.length<3||(G.again[w.w]||0)>=2) return;
  G.again[w.w]=(G.again[w.w]||0)+1;
  if(!G.pool.length) G.pool=buildPool(w.w);
  G.pool.splice(Math.max(0,G.pool.length-3),0,w);
}
async function nextWord(){
  if(!G.pool.length) G.pool=buildPool(G.cur&&G.cur.w);
  G.cur=G.pool.pop(); G.blanks=pickBlanks(G.cur.w); G.idx=G.blanks[0]; G.wordMistakes=0; G.wrongRow=0; G.wordDone=false; G.rec={w:G.cur.w,e:G.cur.e,miss:[]}; renderWord();
  setTimeout(()=>sayWord(G.cur.w),250);
  await spawnOptions();
}
/* the 4 letter choices: the right letter + the letters kids really mix it up with (see CONFUSABLE in settings.js) */
function makeOptions(){
  const word=G.cur.w, correct=word[G.idx], set=new Set([correct]);
  const conf=(CONFUSABLE[correct]||'').split('').filter(c=>c!==correct);
  if(conf.length) set.add(conf[0]);                                   // the most confusing one is always there (a -> e)
  shuffle(conf.slice(1)).forEach(c=>{ if(set.size<4) set.add(c); });
  const kind=VOWELS.includes(correct)?VOWELS:'bcdfghjklmnprstvwz';      // rare letters: same kind of letter
  shuffle(kind.split('')).forEach(c=>{ if(set.size<4) set.add(c); });
  return shuffle([...set]);
}
async function spawnOptions(){
  G.lock=true; G.dummies=[]; const opts=makeOptions(), x0=G.rig.root.position.x; G.x0=x0;
  const jobs=opts.map((l,i)=>{ const d=makeDummy(l,i); d.root.position.set(x0+3.3+i*2.45,0,0); d.root.scaling.setAll(.001); G.dummies.push(d);
    return (async()=>{ await wait(i*90); SFX.pop(); await tween(380,k=>d.root.scaling.setAll(Math.max(.001,k)),E.back); })(); });
  await Promise.all(jobs); G.lock=false; G.state='play'; startTimer();
}
async function dashTo(rig,x,ms=320){
  const x0=rig.root.position.x; rig.moving=true; rig.dashing=x>x0;
  if(Math.abs(x-x0)>1) burst(V3(x0-.3,.2,0),{tex:'dot',count:10,power:2.5,size:.5,c1:[1,1,1],c2:[.8,.85,1],life:.6,grav:-.5});
  await tween(ms,k=>{ rig.root.position.x=x0+(x-x0)*k; }); rig.moving=false; rig.dashing=false;
}
async function pick(i){
  if(G.state!=='play'||G.lock) return; const d=G.dummies[i]; if(!d||!d.alive) return;
  G.lock=true; stopTimer();
  if(d.letter===G.cur.w[G.idx]) await correct(d); else await wrong(d);
}
async function launchDummy(d){
  d.alive=false; const p=d.root.position, p0=p.clone(), vx=2+Math.random()*3, vy=8+Math.random()*3, vz=-(2+Math.random()*3), sp=(Math.random()<.5?-1:1)*(5+Math.random()*5);
  await tween(950,k=>{ p.x=p0.x+vx*k*2; p.z=p0.z+vz*k*2; p.y=p0.y+vy*k*2-9*k*k*2.2; d.root.rotation.z=k*sp; d.root.rotation.x=k*sp*.6; },E.lin);
  disposeDummy(d);
}
/* a wrong letter: the dummy hits back first. It winds up, whirls its arms and smacks the hero, who is knocked back, seeing stars
   (the hero then dashes in again and does the normal attack that launches the dummy). */
async function dummyCounter(d){
  const rig=G.rig, p=rig.root.position, dp=d.root.position, dx=dp.x, hx=p.x;
  d.alive=false; rig.busy=true; rig.moving=false;               // not alive: the idle wobble in main.js must not fight the swing
  SFX.whoosh();
  await tween(160,k=>{ dp.x=dx+.5*k; d.root.rotation.z=-.3*k; d.root.scaling.set(1-.08*k,1+.12*k,1); });             // wind up: lean back
  await tween(110,k=>{ dp.x=dx+.5-1.5*k; d.root.rotation.z=-.3+.6*k; d.root.scaling.setAll(1); d.arms.rotation.y=k*PI*2; },E.in);   // smack
  d.arms.rotation.y=0;
  const hit=p.add(V3(0,1.6,0));
  SFX.bonk(); setTimeout(()=>SFX.boing(),120); G.shake=.4; camPunch=.4; freeze(80,.06); flash('#ff4040',.25);
  shock(hit.add(V3(0,0,-.6)),{color:'#ff6b6b',size:3.2,ms:340}); popText(rnd(['OUCH!','BONK!','OOF!','YOWCH!']),hit.add(V3(0,.4,0)),'#ff6b6b');
  burst(hit,{count:18,power:5,size:.4,c1:[1,.4,.3],c2:[1,.85,.4]}); powFx(hit);
  const settle=tween(300,k=>{ dp.x=dx-1+k; d.root.rotation.z=.3*(1-k); });          // the dummy settles back onto its spot
  poseTo(rig,{upper:[-.5,0,0],head:[-.5,0,0],armR:[-.8,0,1.2],armL:[-.8,0,-1.2],legR:[.3,0,0],legL:[-.3,0,0]},90);
  await tween(340,k=>{ p.x=hx-2.2*k; p.y=Math.sin(k*PI)*.9; },E.out);               // the hero is knocked back with a little hop
  p.y=0; emojiBurst(p.add(V3(0,2.4,0)),['💫'],{count:3,size:.6,power:2,life:.9,grav:-1});
  await Promise.all([settle,poseTo(rig,{},160)]); rig.busy=false;
}
async function wrong(d){
  const rig=G.rig, x0=rig.root.position.x; G.combo=0; setCombo(); G.wordMistakes++; G.wrongRow++;
  if(G.rec) G.rec.miss.push({i:G.idx,l:d.letter});
  SFX.wrong(); SFX.whoosh(); Music.stinger('wrong'); loseLife();
  await dashTo(rig,d.root.position.x-1.75,260);
  await dummyCounter(d); await dashTo(rig,d.root.position.x-1.75,180);          // the dummy hits back, then the hero charges in again
  let mv; do{ mv=rnd(rig.hero.moves); }while(mv===rig.lastMove&&rig.hero.moves.length>1); rig.lastMove=mv;
  const tp=d.root.position.clone(); tp.y=1.6;
  await seq(rig,MOVES[mv],lvl=>{
    if(lvl==='light'){ SFX.tick(); d.root.rotation.z=.25; setTimeout(()=>{ if(d.root) d.root.rotation.z=0; },80); if(Math.random()<.5) slashFx(tp); return; }
    SFX.bonk(); setTimeout(()=>SFX.boing(),120); G.shake=.35; shock(tp.add(V3(0,0,-.6)),{size:3,ms:340}); freeze(70,.08); camPunch=.35;
    popText(rnd(COMIC),tp,rnd(['#fff','#ffe066','#9fe8ff','#ffb3d9'])); burst(tp,{count:18,power:5,size:.4,c1:[1,1,1],c2:[.8,.85,1]});
    hitFx(tp); launchDummy(d);
  });
  await dashTo(rig,x0,300);
  if(G.wrongRow>=2){ const c=G.dummies.find(x=>x.alive&&x.letter===G.cur.w[G.idx]); if(c) c.hint=true; }
  const lg=G.boss&&G.boss.laugh();
  if(G.lives<=0){ await lg; await gameOver(); return; }       // let the laugh finish before the boss strikes back
  remindWord(); G.lock=false; startTimer();
}
/* the 20 seconds ran out: lose a life, hear the word again, same signs, fresh 20 seconds */
async function timeUp(){
  G.combo=0; setCombo(); G.wordMistakes++; G.wrongRow++;
  if(G.rec) G.rec.miss.push({i:G.idx,l:'⏰'});
  SFX.wrong(); Music.stinger('wrong'); loseLife(); callout('⏰ Time is up!','#ff6b6b'); G.shake=.25;
  if(G.boss) await G.boss.laugh();
  if(G.lives<=0){ await gameOver(); return; }
  if(G.wrongRow>=2){ const c=G.dummies.find(x=>x.alive&&x.letter===G.cur.w[G.idx]); if(c) c.hint=true; }
  remindWord(); G.lock=false; startTimer();
}
/* The boss strikes back (mirror of the hero's attack): it winds up, lunges at the hero with the same kind of impact effects
   (shake, hit-stop, shockwave, comic text), and the hero is knocked flat on the ground, seeing stars. */
async function bossWins(){
  const rig=G.rig, b=G.boss; if(!rig||!b) return;
  const w=b.wob, j=rig.j, p=rig.root.position, x0=p.x; rig.busy=true; rig.moving=false; rig.cheer=false;
  callout('😈 BOSS SMASH!','#ff6b6b'); SFX.whoosh();
  if(b.roam) b.roam.hold(3);                                            // the boss stops wandering while it strikes
  const reach=Math.max(6,b.root.position.x+(b.off||0)-x0-3);            // the boss root keeps following the hero, so lunge with the wob node
  await tween(420,k=>{ w.position.x=k*1.8; w.rotation.z=-k*.25; w.scaling.set(1-k*.06,1+k*.14,1); });          // wind up: lean back, stretch
  SFX.whoosh();
  await tween(190,k=>{ w.position.x=1.8-(1.8+reach)*k; w.rotation.z=-.25+.55*k; w.scaling.set(.94+k*.06,1.14-k*.14,1); },E.in);   // lunge
  // impact
  const hit=p.add(V3(0,1.6,0));
  SFX.bossHit(); SFX.bonk(); setTimeout(()=>SFX.boing(),120); G.shake=.9; camPunch=1; freeze(180,.06); flash('#ff4040',.5);
  shock(hit.add(V3(0,0,-.6)),{color:'#ff6b6b',size:5,ms:420});
  popText(rnd(['SMASH!','WHAM!','KA-BOOM!','THWACK!']),hit.add(V3(0,.4,0)),'#ff6b6b');
  burst(hit,{count:32,power:6,size:.5,c1:[1,.4,.3],c2:[1,.85,.4]}); powFx(hit); slashFx(hit,'#ff9fd0'); ringFx(p.clone(),'#ff6b6b');
  // the boss pulls back while the hero is thrown away from it, spinning, and lands on its back
  const back=tween(520,k=>{ w.position.x=-reach*(1-k); w.rotation.z=.3*(1-k); w.scaling.setAll(1); });
  await tween(720,k=>{ p.x=x0-5.5*k; p.y=Math.sin(k*PI)*3; j.body.rotation.x=-(PI*2+1.5)*k;
    j.armR.rotation.set(-.6,0,1.4+Math.sin(k*22)*.3); j.armL.rotation.set(-.6,0,-1.4-Math.sin(k*22)*.3); j.legR.rotation.x=Math.sin(k*18)*.6; j.legL.rotation.x=-Math.sin(k*18)*.6; },E.out);
  p.y=0; SFX.thud(); G.shake=.5; burst(V3(p.x,.2,p.z),{tex:'dot',count:20,power:3,size:.7,c1:[1,1,1],c2:[.8,.85,1],life:.8,grav:-1}); ringFx(p.clone(),'#ffffff');
  await Promise.all([back,poseTo(rig,{body:[-1.5,0,0],pos:[0,.4,0],armR:[0,0,1.7],armL:[0,0,-1.7],legR:[0,0,.35],legL:[0,0,-.35],head:[-.2,0,0]},260)]);
  // dizzy stars over the knocked-out hero
  popText('K.O.!',p.add(V3(0,2,0)),'#ffe066');
  for(let i=0;i<4;i++){ emojiBurst(p.add(V3(0,1.4,0)),[rnd(['💫','⭐'])],{count:3,size:.6,power:2.5,life:1,grav:-1}); await wait(260); }
  await b.laugh();
}
/* out of lives: the boss wins this round. Show the report (so the words can be practised), then back to hero select. */
async function gameOver(){
  G.state='busy'; G.lock=true; stopTimer();
  if(G.rec){ G.results.push(G.rec); G.rec=null; }          // the word you were on counts too...
  if(G.cur){ save.weak[G.cur.w]=Math.min(5,weakOf(G.cur.w)+1); persist(); }       // ...and it goes on the "needs practice" list
  try{ await bossWins(); }catch(e){ console.warn('boss victory animation skipped:',e); }      // the report must always come, even if the animation fails
  SFX.skull(); await banner('Oh no!','The boss wins this time... 😈',2200);
  await showSummary(true);
  resetToSelect();
}
async function correct(d){
  const rig=G.rig; G.combo++; setCombo(); G.wrongRow=0; d.alive=false;
  if(G.combo%5===0&&G.lives<LIVES_PER_BOSS){ G.lives++; renderLives(); popText('+1 💚',rig.root.position.add(V3(0,3.4,0)),'#2fbf80'); }     // every 5 right in a row wins a life back
  if(G.combo===3) callout('🔥 ON FIRE!'); else if(G.combo===5) callout('⚡ SUPER COMBO!','#ffe066'); else if(G.combo===8) callout('🌟 UNSTOPPABLE!','#9fe8ff');
  const mult=Math.min(G.combo,5); SFX.ding(G.idx); sayLetter(d.letter); SFX.coin();
  const from=toScreen(d.root.position.add(V3(0,3,0))); const slot=$('slot'+G.idx);
  const coinFly=flyEl('🪙',from,$('coins'),900).then(()=>addCoins(mult));
  const letterFly=flyEl(d.letter,from,slot,650);
  const fxPos=d.root.position.add(V3(0,2,0));
  burst(fxPos,{count:24,power:5,size:.45}); shock(d.root.position.add(V3(0,2,-.6)),{color:'#ffd23f',size:3.4,ms:420}); camPunch=.2;
  if(Math.random()<.5) emojiBurst(fxPos,[rnd(['⭐','✨','🎉','💖','🌟','🪙'])],{count:6,size:.7,power:5}); else confetti(fxPos,12);
  powerHit(fxPos,false);
  G.dummies.forEach(o=>{ if(o!==d&&o.alive){ o.alive=false; } });
  const others=G.dummies.filter(o=>o!==d);
  tween(300,k=>{ d.root.scaling.setAll(1+Math.sin(k*PI)*.3); d.root.rotation.y=k*PI*2; });
  others.forEach(o=>tween(300,k=>o.root.scaling.setAll(Math.max(.001,1-k)),E.in).then(()=>disposeDummy(o)));
  SFX.pop(); await letterFly;
  const nb=G.blanks.find(b=>b>G.idx); G.idx=nb===undefined?G.cur.w.length:nb; renderWord();     // on to the next blank (letters that are already filled in are skipped)
  await wait(100); tween(260,k=>d.root.scaling.setAll(Math.max(.001,1-k)),E.in).then(()=>disposeDummy(d));
  if(G.idx>=G.cur.w.length){ await wordComplete(); return; }
  const wd=G.cur; wait(350).then(()=>{ if(G.cur===wd) remindWord(); });          // after the letter name: say the word again
  rig.cheer=true; await wait(520); rig.cheer=false;
  await dashTo(rig,rig.root.position.x+STEP,STEP*125); await spawnOptions();
}
function bossTarget(){ const t=G.boss.root.position.clone(); t.x+=G.boss.off||0; t.y=2.3; return t; }      // (off: how far the boss has wandered from its place, see bossRoam)
/* throwProj, makeStar, POSE_*, FIN and SHARED_FIN live in finishers.js */
let lastFin=null;
function chooseFinisher(rig){ let k, n=0; do{ k=Math.random()<.3?rig.hero.finisher:rnd(SHARED_FIN); }while(k===lastFin&&++n<10); lastFin=k; return k; }
function petShot(rig,tgt,jobs){
  if(!rig.pet||!PET_SHOT[rig.petId]) return; const s=PET_SHOT[rig.petId], from=rig.pet.getAbsolutePosition().clone();
  for(let i=0;i<3;i++){ const h=nd(null,0,0,0); h.setEnabled(false);
    if(s.emoji) emojiPlane(s.emoji,.8,h); else sp(.4,GM(s.color),h);
    jobs.push(throwProj(h,from,tgt.add(V3(0,(i-1)*.6,-.5)),560,{arc:1.4,spin:s.emoji?PI*3:0,delay:200+i*120})); }
}
async function finisher(rig,mega){
  const tgt=bossTarget(), from=rig.root.position.add(V3(.4,1.8,0)); rig.busy=true;
  const kind=chooseFinisher(rig), F=FIN[kind];
  callout(mega?'💥 MEGA '+F.name:F.name, mega?'#ffe066':null);
  for(const [p,ms] of F.pose) await poseTo(rig,p,ms);
  SFX.whoosh();
  const jobs=F.fire(from,tgt,mega);
  if(mega){ const extra=rnd(['meteor','lightning','fireworks'].filter(k=>k!==kind)); jobs.push(...FIN[extra].fire(from,tgt,true)); }
  petShot(rig,tgt,jobs);
  jobs.push(poseTo(rig,{},380)); await Promise.all(jobs); rig.busy=false;
  const bt=bossTarget().add(V3(0,0,-2));
  SFX.bossHit(); Music.stinger('boss'); G.shake=mega?.9:.45; popText(mega?'MEGA BLAST!':rnd(['POW!','BAM!','ZAP!','KABOOM!','WHAM!']),bossTarget().add(V3(-2,1.5,-1)),mega?'#ffd23f':'#fff');
  burst(bt,{count:mega?90:40,power:mega?11:7,size:mega?.9:.6,c1:[1,.8,.2],c2:[1,.4,.6]});
  shock(bossTarget().add(V3(0,0,-2.5)),{color:mega?'#ffd23f':'#ffffff',size:mega?8:4.5,ms:mega?560:420});
  powFx(bt); powerHit(bt,true); if(mega) confetti(bt,30);
  freeze(mega?210:110); camPunch=mega?1:.6; flash(mega?'#ffffff':'#fff6d8',mega?.55:.35);
}
async function wordComplete(){
  const rig=G.rig, w=G.cur; const stars=G.wordMistakes===0?3:G.wordMistakes<=2?2:1;
  if(G.rec){ G.results.push(G.rec); G.rec=null; }
  G.wordDone=true;
  // practice score: mistakes push it up (3+ mistakes count double), a perfect spelling lowers it again
  const wk=weakOf(w.w), nk=G.wordMistakes===0?Math.max(0,wk-1):Math.min(5,wk+(G.wordMistakes>=3?2:1));
  if(nk) save.weak[w.w]=nk; else delete save.weak[w.w];
  if(G.wordMistakes>0) requeueWord(w);
  save.stickers[w.w]=Math.max(save.stickers[w.w]||0,stars); save.stars+=stars; addCoins(stars*3); persist();
  SFX.fanfare(); setTimeout(()=>say(w.w,.75),200);
  const st=$('sticker'); st.querySelector('.e').textContent=w.e; st.querySelector('.w').textContent=w.w;
  st.querySelector('.s').textContent='⭐'.repeat(stars)+'☆'.repeat(3-stars); st.classList.add('show'); burst(rig.root.position.add(V3(0,2.5,0)),{count:50,power:8,size:.7});
  if(stars===3) confetti(rig.root.position.add(V3(0,2.5,0)),20);
  rig.cheer=true; await wait(1500); rig.cheer=false; st.classList.remove('show'); await wait(250);
  const mega=G.bossHP===1; await finisher(rig,mega); G.bossHP--; renderHearts(); await G.boss.hit(WORDS_PER_LEVEL-G.bossHP);
  if(G.bossHP<=0){ await G.boss.defeat(); await showSummary(); await chestScene(); return; }
  await dashTo(rig,rig.root.position.x+STEP,STEP*125); await nextWord();
}

/* ---------------- spelling report after each boss ---------------- */
function showSummary(lost){
  return new Promise(res=>{
    const R=G.results, total=R.reduce((s,r)=>s+r.miss.length,0), perfect=R.filter(r=>!r.miss.length).length;
    $('sumTitle').textContent=lost?`💔 Level ${G.level} - out of lives!`:`📜 Level ${G.level} Spelling Report`;
    $('summary').querySelector('[data-act="A"]').textContent=lost?'🏠 Back to heroes':'🎁 Open the treasure!';
    $('sumStats').innerHTML=`🌟 <b>${perfect}</b> perfect &nbsp;·&nbsp; 💀 <b>${total}</b> mistake${total===1?'':'s'}`;
    $('sumList').innerHTML=R.map((r,ri)=>{
      const letters=[...r.w].map((ch,i)=>{ const bad=r.miss.filter(m=>m.i===i);
        return `<span class="lt${bad.length?' bad':''}">${esc(ch)}${bad.length?`<small>${bad.map(m=>esc(m.l)).join(' ')}</small>`:''}</span>`; }).join('');
      const n=r.miss.length, skulls=n?(n>8?'💀 x'+n:'💀'.repeat(n)):'✅';
      return `<div class="srow ${n?'wrong':'ok'}" style="--i:${ri}"><span class="em">${esc(r.e)}</span><span class="wd">${letters}</span><span class="sk">${skulls}</span></div>`; }).join('');
    $('sumNote').textContent=lost?'Red letters = where you slipped (the small letters show what you picked, ⏰ = time ran out). Practise these and come back!'
      :total?'Red letters = where you slipped (the small letters show what you picked, ⏰ = time ran out)':'WOW! Every word spelled perfectly!';
    G.state='summary'; G.sumDone=res; setScreens('summary'); updateMenuLabels();
    if(lost){ setTimeout(()=>say('Good try! Let us practise these words, and try again.',.85),300); }
    else if(!total){ SFX.perfect(); setTimeout(()=>say('Perfect spelling! Amazing!',.9),300); }
    else { R.forEach((r,ri)=>{ if(r.miss.length) setTimeout(()=>SFX.skull(),350+ri*150); }); setTimeout(()=>say('Great job! Here are your words.',.9),300); }
  });
}

/* ---------------- treasure chest ---------------- */
function makeChest(){
  const root=nd(null,0,0,0), lav=M('#7f86d8'), gold=M('#ffd23f',.65);
  bx(1.9,.9,1.2,lav,root,0,.45,0); [-.6,.6].forEach(x=>bx(.2,.92,1.25,gold,root,x,.46,0)); bx(2.0,.1,1.3,gold,root,0,.02,0);
  const hinge=nd(root,0,.92,.6); bx(1.9,.5,1.2,lav,hinge,0,.25,-.6); [-.6,.6].forEach(x=>bx(.2,.52,1.25,gold,hinge,x,.25,-.6)); bx(2,.1,1.3,gold,hinge,0,.52,-.6);
  bx(.32,.38,.1,gold,root,0,.85,-.62); blob(root,1.3); outlineNode(root);
  const beam=cy(.6,2.6,7,GM('#fff2a8',.28),root,0,4.6,0); beam.setEnabled(false);
  return {root,hinge,beam};
}
async function chestScene(){
  const rig=G.rig, cx=rig.root.position.x+5; const ch=makeChest(); G.chest={ch,opened:false,busy:true}; ch.root.position.set(cx,14,0);
  await tween(900,k=>{ ch.root.position.y=14*(1-k); },E.bounce); SFX.thud(); G.shake=.5;
  rig.cheer=true; setTimeout(()=>{ rig.cheer=false; },900);
  $('prompt').style.display='block'; G.chest.busy=false; G.state='chest';
}
async function chestPress(){
  const C=G.chest; if(C.busy) return; C.busy=true;
  if(!C.opened){
    C.opened=true; $('prompt').style.display='none'; SFX.chest();
    await tween(650,k=>{ C.ch.hinge.rotation.x=1.9*k; },E.out); C.ch.beam.setEnabled(true);
    const top=C.ch.root.position.add(V3(0,1.6,0)); burst(top,{count:80,power:10,size:.8}); confetti(top,24); G.shake=.4;
    const un=SHOP.filter(s=>!save.owned[s.id]); let icon,name,sub;
    if(un.length&&Math.random()<.9){ const it=rnd(un); save.owned[it.id]=true; if(!save.equip[it.slot]) save.equip[it.slot]=it.id; G.rigs.forEach(applyCosmetics); setAuraColor();
      icon=it.color&&!it.kind?'🧣':it.icon; name=it.name; sub=save.equip[it.slot]===it.id?'You are wearing it already!':'Find it in the wardrobe!'; }
    else { icon='🪙'; name='60 coins!'; sub='Wow, so rich!'; addCoins(60); }
    addCoins(20); persist(); $('revIcon').textContent=icon; $('revName').textContent=name; $('revSub').textContent=sub+'  (+20 🪙)';
    setScreens('reveal'); setTimeout(()=>say(name,.8),300); C.busy=false; return;
  }
  setScreens(null); G.state='busy'; C.ch.root.dispose(); G.boss.dispose(); G.boss=null; G.chest=null; G.level++; refreshStats();
  await dashTo(G.rig,G.rig.root.position.x+STEP,STEP*125); await startLevel();
}
