/* Settings, save data, word lists and the wardrobe catalog.
   (plain script: shares the global scope with the other files in js/, load order matters - see index.html) */
'use strict';

/* =====================================================================
   SETTINGS - the default word list.  {w: word, e: emoji picture hint}
   (players can change the list in the game: menu bar -> 📝 Words)
   ===================================================================== */
const DEFAULT_WORDS = [
  {w:'bee',   e:'🐝'},
  {w:'see',   e:'👀'},
  {w:'tree',  e:'🌳'},
  {w:'teeth', e:'🦷'},
  {w:'feet',  e:'🦶'},
  {w:'say',   e:'💬'},
  {w:'may',   e:'🙋'},
];
const WORDS = [];             // the live list: the words of all ticked word groups (see rebuildWords below; chosen on the Words screen)
let WORDS_PER_LEVEL = 4;       // words to beat one boss = the boss's hearts (changeable on the Words screen)
const LIVES_PER_BOSS = 3;      // your lives in each boss round: a wrong letter or a timeout costs one
const LETTER_TIME = 20;        // seconds to choose each letter (can be switched off: menu bar -> Timer)
/* Levels 1-3 only blank part of the word (the rest is already filled in); from level 4 on the whole word has to be spelled.
   Vowels are blanked first, because they are the tricky part (ee, ay, ai...). */
const BLANK_SHARE = [.34,.55,.8];
const STEP = 8;                // how far the hero walks after each letter
const POWER_FILL = 6;          // right letters that fill the ⚡ power meter; a full meter gives a power-up (you can hold 2)
const QUICK_TIME = 4;          // a right letter picked within this many seconds (and first try) is "quick": +1 coin
/* power-ups: won by filling the power meter, used with a click on the HUD button, keys 5 / 6 or L1 on the pad */
const POWERUPS = {
  lens:  {icon:'🔍', name:'Magnifier',  desc:'two wrong signs disappear'},
  shield:{icon:'🛡️', name:'Shield',     desc:'your next slip costs no life'},
  heart: {icon:'💚', name:'Extra life', desc:'one life back'},
};
/* word twists (see chooseWordMode in game.js): from level 2 some words are shown for a moment and then hidden ("look, cover, spell"),
   from level 3 a word you have met before can come without its picture; any word can be a golden word (double coins).
   Tricky words always come as "look, cover, spell". */
const TWIST = {gold:.12, flash:.15, mystery:.15};

/* Wrong-letter choices. For each letter: the letters kids really mix it up with, most confusing first.
   The first one is ALWAYS offered (so "a" always comes with "e"), the rest are picked at random.
   Vowels get vowels, look-alikes (b/d/p/q) get look-alikes, sound-alikes (c/k/s, f/v) get sound-alikes. */
const CONFUSABLE = {
  a:'eoui', e:'iaoy', i:'eyau', o:'auew', u:'oaew', y:'ieaj',
  b:'dpqh', d:'bpqt', p:'bqdg', q:'pgdk', g:'jqky', j:'giyd',
  m:'nwhu', n:'muhr', h:'nbkm', r:'wlnv', w:'vumr', v:'fwub',
  c:'ksez', k:'cqgx', s:'czxf', z:'sxjc', x:'kzsc',
  t:'dfli', f:'vtph', l:'itrk',
};
const VOWELS = 'aeiouy';
const BTN = [ {sym:'✕',color:'#6ba3ff'}, {sym:'○',color:'#ff6b6b'}, {sym:'□',color:'#ff8fd0'}, {sym:'△',color:'#4be3a0'} ];

/* ---------------- ready-made word packs (Words screen) ---------------- */
const WORD_PACKS = [
  {id:'starter', icon:'⭐', name:'Starter (ee / ay)', words:DEFAULT_WORDS},
  {id:'igh',     icon:'🌙', name:'igh', words:[{w:'night',e:'🌃'},{w:'high',e:'🏔️'},{w:'light',e:'💡'},{w:'right',e:'✅'},{w:'bright',e:'🌟'},{w:'fight',e:'🥊'},{w:'tights',e:'🧦'}]},
  {id:'animals', icon:'🐾', name:'Animals', words:[{w:'cat',e:'🐱'},{w:'dog',e:'🐶'},{w:'fish',e:'🐟'},{w:'frog',e:'🐸'},{w:'duck',e:'🦆'},{w:'pig',e:'🐷'},{w:'cow',e:'🐮'},{w:'fox',e:'🦊'},{w:'bear',e:'🐻'},{w:'owl',e:'🦉'}]},
  {id:'colors',  icon:'🎨', name:'Colors', words:[{w:'red',e:'🟥'},{w:'blue',e:'🟦'},{w:'green',e:'🟩'},{w:'yellow',e:'🟨'},{w:'pink',e:'🌸'},{w:'black',e:'⬛'},{w:'white',e:'⬜'},{w:'brown',e:'🟫'},{w:'purple',e:'🟪'}]},
  {id:'aioa',    icon:'🌧️', name:'ai / oa', words:[{w:'rain',e:'🌧️'},{w:'train',e:'🚆'},{w:'snail',e:'🐌'},{w:'tail',e:'🐒'},{w:'boat',e:'⛵'},{w:'goat',e:'🐐'},{w:'coat',e:'🧥'},{w:'road',e:'🛣️'},{w:'soap',e:'🧼'}]},
  {id:'sight',   icon:'👀', name:'Sight words', words:[{w:'the',e:'👉'},{w:'and',e:'➕'},{w:'said',e:'🗣️'},{w:'was',e:'⏪'},{w:'they',e:'👫'},{w:'have',e:'🤲'},{w:'come',e:'👋'},{w:'what',e:'❓'},{w:'here',e:'📍'},{w:'you',e:'👤'}]},
  {id:'numbers', icon:'🔢', name:'Numbers', words:[{w:'one',e:'1️⃣'},{w:'two',e:'2️⃣'},{w:'three',e:'3️⃣'},{w:'four',e:'4️⃣'},{w:'five',e:'5️⃣'},{w:'six',e:'6️⃣'},{w:'seven',e:'7️⃣'},{w:'eight',e:'8️⃣'},{w:'nine',e:'9️⃣'},{w:'ten',e:'🔟'}]},
  {id:'food',    icon:'🍕', name:'Food', words:[{w:'apple',e:'🍎'},{w:'cake',e:'🍰'},{w:'milk',e:'🥛'},{w:'bread',e:'🍞'},{w:'cheese',e:'🧀'},{w:'pizza',e:'🍕'},{w:'corn',e:'🌽'},{w:'egg',e:'🥚'},{w:'grapes',e:'🍇'}]},
];
/* picture guesses for words typed in by hand (anything else gets a pencil - or type your own emoji) */
const EMOJI_DICT = {};
WORD_PACKS.forEach(p=>p.words.forEach(o=>{ EMOJI_DICT[o.w]=o.e; }));
Object.assign(EMOJI_DICT,{
  sun:'☀️',moon:'🌙',star:'⭐',bird:'🐦',hen:'🐔',lion:'🦁',tiger:'🐯',horse:'🐴',sheep:'🐑',mouse:'🐭',rabbit:'🐰',bunny:'🐰',
  snake:'🐍',whale:'🐳',shark:'🦈',bat:'🦇',ant:'🐜',bug:'🐛',crab:'🦀',monkey:'🐵',zebra:'🦓',bee:'🐝',banana:'🍌',grape:'🍇',
  lemon:'🍋',pie:'🥧',carrot:'🥕',hat:'🎩',shoe:'👟',sock:'🧦',shirt:'👕',dress:'👗',ball:'⚽',kite:'🪁',book:'📖',bed:'🛏️',
  car:'🚗',bus:'🚌',ship:'🚢',plane:'✈️',bike:'🚲',snow:'❄️',wind:'💨',cloud:'☁️',fire:'🔥',hand:'✋',eye:'👁️',ear:'👂',nose:'👃',
  mouth:'👄',leg:'🦵',arm:'💪',heart:'❤️',king:'🤴',queen:'👸',baby:'👶',home:'🏠',house:'🏠',key:'🔑',ring:'💍',bell:'🔔',
  clock:'⏰',box:'📦',cup:'☕',orange:'🍊',play:'🎮',run:'🏃',jump:'🦘',swim:'🏊',sleep:'😴',eat:'🍽️',sing:'🎤',read:'📚',
  happy:'😀',sad:'😢',big:'🐘',small:'🐜',hot:'🥵',cold:'🥶',boy:'👦',girl:'👧',mom:'👩',dad:'👨',school:'🏫',door:'🚪',sea:'🌊',
  day:'🌞',night:'🌃',light:'💡',seed:'🌱',leaf:'🍃',meat:'🍖',beach:'🏖️',peach:'🍑',tea:'🍵',pay:'💵',hay:'🌾',green:'🟩',
  feet:'🦶',tree:'🌳',see:'👀',teeth:'🦷',say:'💬',may:'🙋',rain:'🌧️',ice:'🧊',robot:'🤖',ghost:'👻',dragon:'🐉',rocket:'🚀',
});
/* pictures offered by the "More..." picker in the word editor (space separated) */
const EMOJI_CATS = [
  {icon:'🐾', name:'Animals', list:'🐶 🐱 🐭 🐹 🐰 🦊 🐻 🐼 🐨 🐯 🦁 🐮 🐷 🐸 🐵 🐔 🐧 🐦 🦆 🦉 🦇 🐺 🐴 🦄 🐝 🐛 🦋 🐌 🐞 🐜 🐢 🐍 🦎 🐙 🦀 🐠 🐟 🐬 🐳 🦈 🐘 🦒 🦓 🐪 🐑 🐐 🐒 🦘 🐓 🦅 🦜 🐉'.split(' ')},
  {icon:'🍕', name:'Food', list:'🍎 🍐 🍊 🍋 🍌 🍉 🍇 🍓 🍒 🍑 🥭 🍍 🥝 🍅 🥕 🌽 🥦 🥔 🍞 🧀 🥚 🍳 🥞 🍔 🍟 🍕 🌭 🌮 🍝 🍣 🍦 🍩 🍪 🎂 🍰 🧁 🍫 🍬 🍭 🥛 ☕ 🍵 🧃 🍿'.split(' ')},
  {icon:'🌳', name:'Nature', list:'☀️ 🌙 ⭐ 🌈 ☁️ ⛅ 🌧️ ⛈️ ❄️ ⛄ 💨 🌪️ 🔥 💧 🌊 🌍 🌋 ⛰️ 🏖️ 🌵 🌴 🌳 🌲 🌱 🌿 🍀 🍁 🍂 🌸 🌼 🌻 🌹 🌷 🍄 🐚 🪨'.split(' ')},
  {icon:'🎒', name:'Things', list:'🏠 🏫 🚪 🛏️ 🪑 🔑 🔔 ⏰ 💡 📖 📚 ✏️ 🖍️ ✂️ 📦 🎁 🎒 👓 🎩 👑 👕 👗 👟 🧦 🧤 🧣 ☂️ 💍 📱 💻 📷 🎧 🔦 🧸 🪁 🧲 🔨 🪣 🧹 🧼 💰 🗝️'.split(' ')},
  {icon:'🚗', name:'Travel', list:'🚗 🚕 🚌 🚓 🚑 🚒 🚜 🚲 🛵 🏍️ 🚂 🚆 ✈️ 🚁 🚀 🛸 🚢 ⛵ 🚤 ⚓ 🗺️ 🏰 🎡 🎪 ⛺ 🌉 🗼 🛣️ 🚦 ⛽'.split(' ')},
  {icon:'🙂', name:'People', list:'😀 😃 😄 😁 😆 😊 😍 😎 🤩 🥳 😴 😢 😭 😡 😱 🤔 🤗 😇 👶 👦 👧 👨 👩 🧓 🤴 👸 🦸 🧙 🧚 🥷 👮 👷 👨‍🚀 🏃 💃 ✋ 👀 👂 👃 👄 🦷 🦵 🦶 💪 ❤️ 💖'.split(' ')},
  {icon:'⚽', name:'Fun', list:'⚽ 🏀 🏈 ⚾ 🎾 🏐 🏓 🥊 🎯 🎮 🧩 🎲 🎨 🎭 🎤 🎸 🎹 🥁 🎺 🎵 🎬 🎉 🎈 🏆 🥇 🏊 🚴 ⛸️ 🎿 🪀 🛝 ⚔️ 🛡️ 🏹'.split(' ')},
];

/* ===================================================================== */
const $ = id => document.getElementById(id);
const PI = Math.PI;
const V3 = (x,y,z) => new BABYLON.Vector3(x,y,z);
const shuffle = a => { for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];} return a; };
const rnd = a => a[Math.floor(Math.random()*a.length)];
const esc = s => String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

/* ---------------- save data ---------------- */
const SAVE_KEY = 'spellingHeroes_v1';
let save = {coins:25, stars:0, stickers:{}, owned:{}, equip:{}, hero:0, weak:{}, hist:{}, place:'tour'};
// place: a place id from places.js, 'tour' (a new place and boss every level) or 'random'
// weak: "needs practice" score per word (0-5, see buildPool in game.js); hist: per-word history {n: times played, ok: times perfect, pos: {letter index: misses}}
try { Object.assign(save, JSON.parse(localStorage.getItem(SAVE_KEY)||'{}')); } catch(e){}
if(save.placeV!==2){ save.place='tour'; save.placeV=2; }   // the tour became the default: older saves (which only ever held the first, automatic place) start on it
if(!save.weak || typeof save.weak!=='object' || Array.isArray(save.weak)) save.weak = {};
if(!save.hist || typeof save.hist!=='object' || Array.isArray(save.hist)) save.hist = {};
save.equip = Object.assign({hat:null,neck:null,back:null,trail:null,pet:null,power:null}, save.equip||{});
if(save.perLevel>=2 && save.perLevel<=10) WORDS_PER_LEVEL = save.perLevel;
const persist = () => { try{ localStorage.setItem(SAVE_KEY, JSON.stringify(save)); }catch(e){} };

/* ---------------- word groups ----------------
   A group is a named list of words. There are the ready-made packs (WORD_PACKS, id 'pack:<id>', read-only) and the
   player's own groups (save.groups, editable). Any number of groups can be ticked at once (save.active); the words of all
   ticked groups together (each word once) are the live list WORDS that the game plays. */
const cleanGroupWords = a => Array.isArray(a) ? a.filter(o=>o&&o.w).map(o=>({w:String(o.w),e:o.e||'✏️'})) : [];
if(!Array.isArray(save.groups) || !save.groups.length){
  const old = cleanGroupWords(save.words);            // saves from before groups: the single word list becomes "My words"
  save.groups = [{id:'g1', name:'My words', icon:'📒', words:old}];
  save.active = old.length ? ['g1'] : ['pack:starter'];
  delete save.words;
}
save.groups = save.groups.filter(g=>g&&g.id).map(g=>({id:String(g.id), name:String(g.name||'My words').slice(0,24), icon:g.icon||'📒', words:cleanGroupWords(g.words)}));
if(!Array.isArray(save.active)) save.active = ['pack:starter'];
const packGroup = p => ({id:'pack:'+p.id, name:p.name, icon:p.icon, words:p.words, pack:true});
const allGroups = () => save.groups.concat(WORD_PACKS.map(packGroup));
const groupById = id => allGroups().find(g=>g.id===id);
save.active = save.active.filter(id=>groupById(id));
const isActive = id => save.active.includes(id);
/* rebuild the live list from the ticked groups (a word that is in two groups is played once) */
function rebuildWords(){
  WORDS.length = 0; const seen = new Set();
  save.active.forEach(id=>{ const g=groupById(id); if(g) g.words.forEach(o=>{ if(!seen.has(o.w)){ seen.add(o.w); WORDS.push({w:o.w,e:o.e}); } }); });
}
rebuildWords();
/* is a word in any group at all? (practice scores of words that are in no group any more are forgotten) */
const inAnyGroup = w => allGroups().some(g=>g.words.some(o=>o.w===w));

/* ---------------- wardrobe catalog ---------------- */
const SLOT_NAME = {hat:'🎩 Hat', neck:'🧣 Neck', back:'🦸 Back', trail:'✨ Trail', pet:'🐾 Pet', power:'💥 Power'};
const SHOP = [
  {id:'party',  slot:'hat',name:'Party Hat',     icon:'🎉',price:40},
  {id:'cat',    slot:'hat',name:'Cat Ears',      icon:'🐱',price:50},
  {id:'tophat', slot:'hat',name:'Top Hat',       icon:'🎩',price:70},
  {id:'pirate', slot:'hat',name:'Pirate Hat',    icon:'🏴‍☠️',price:90},
  {id:'prop',   slot:'hat',name:'Propeller Cap', icon:'🌀',price:90},
  {id:'viking', slot:'hat',name:'Viking Helmet', icon:'⚔️',price:120},
  {id:'wizard', slot:'hat',name:'Wizard Hat',    icon:'🧙',price:120},
  {id:'unicorn',slot:'hat',name:'Unicorn Horn',  icon:'🦄',price:150},
  {id:'astro',  slot:'hat',name:'Space Helmet',  icon:'👨‍🚀',price:180},
  {id:'halo',   slot:'hat',name:'Glowing Halo',  icon:'😇',price:200},
  {id:'crown',  slot:'hat',name:'Golden Crown',  icon:'👑',price:250},
  {id:'scarfGold',slot:'neck',name:'Gold Scarf', icon:'🧣',price:50,color:'#ffd23f'},
  {id:'scarfMint',slot:'neck',name:'Mint Scarf', icon:'🧣',price:50,color:'#3fe0b0'},
  {id:'scarfPink',slot:'neck',name:'Pink Scarf', icon:'🧣',price:50,color:'#ff5fa8'},
  {id:'bowtie', slot:'neck',name:'Fancy Bow Tie', icon:'🎀',price:70,color:'#ff3d6e',kind:'bow'},
  {id:'medal',  slot:'neck',name:'Champion Medal',icon:'🏅',price:140,kind:'medal'},
  {id:'cape',   slot:'back',name:'Super Cape',   icon:'🦸',price:160},
  {id:'wings',  slot:'back',name:'Angel Wings',  icon:'👼',price:220},
  {id:'batwings',slot:'back',name:'Bat Wings',   icon:'🦇',price:220},
  {id:'jetpack',slot:'back',name:'Rocket Jetpack',icon:'🚀',price:300},
  {id:'bubble', slot:'trail',name:'Bubble Trail', icon:'🔵',price:70},
  {id:'star',   slot:'trail',name:'Star Trail',   icon:'⭐',price:80},
  {id:'heart',  slot:'trail',name:'Heart Trail',  icon:'💖',price:80},
  {id:'notes',  slot:'trail',name:'Music Trail',  icon:'🎵',price:100},
  {id:'fire',   slot:'trail',name:'Fire Trail',   icon:'🔥',price:120},
  {id:'rainbow',slot:'trail',name:'Rainbow Trail',icon:'🌈',price:150},
  {id:'bolt',   slot:'trail',name:'Lightning Trail',icon:'⚡',price:150},
  {id:'chick',  slot:'pet',name:'Fluffy Chick',  icon:'🐥',price:250,desc:'A tiny friend who throws eggs at the boss!'},
  {id:'ghost',  slot:'pet',name:'Friendly Ghost',icon:'👻',price:280,desc:'A spooky-cute buddy who helps you attack!'},
  {id:'drone',  slot:'pet',name:'Robo Drone',    icon:'🤖',price:300,desc:'Shoots laser balls at the boss!'},
  {id:'dragon', slot:'pet',name:'Baby Dragon',   icon:'🐉',price:350,desc:'Breathes fireballs at the boss!'},
  {id:'pFire',  slot:'power',name:'Fire Power',  icon:'🔥',price:250,desc:'Every hit bursts into flames!'},
  {id:'pIce',   slot:'power',name:'Ice Power',   icon:'❄️',price:250,desc:'Every hit sprays freezing snowflakes!'},
  {id:'pThunder',slot:'power',name:'Thunder Power',icon:'⚡',price:300,desc:'Lightning strikes on every hit!'},
  {id:'pRainbow',slot:'power',name:'Rainbow Power',icon:'🌈',price:350,desc:'Rainbow sparkles on every hit!'},
];
