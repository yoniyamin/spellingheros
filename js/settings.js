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
const WORDS = DEFAULT_WORDS.map(o=>({...o}));   // the live list (edited from the Words screen)
let WORDS_PER_LEVEL = 4;       // words to beat one boss = the boss's hearts (changeable on the Words screen)
const LIVES_PER_BOSS = 3;      // your lives in each boss round: a wrong letter or a timeout costs one
const LETTER_TIME = 20;        // seconds to choose each letter (can be switched off: menu bar -> Timer)
/* Levels 1-3 only blank part of the word (the rest is already filled in); from level 4 on the whole word has to be spelled.
   Vowels are blanked first, because they are the tricky part (ee, ay, ai...). */
const BLANK_SHARE = [.34,.55,.8];
const STEP = 8;                // how far the hero walks after each letter

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
  {name:'⭐ Starter (ee / ay)', words:DEFAULT_WORDS},
  {name:'🌙 igh', words:[{w:'night',e:'🌃'},{w:'high',e:'🏔️'},{w:'light',e:'💡'},{w:'right',e:'✅'},{w:'bright',e:'🌟'},{w:'fight',e:'🥊'},{w:'tights',e:'🧦'}]},
  {name:'🐾 Animals', words:[{w:'cat',e:'🐱'},{w:'dog',e:'🐶'},{w:'fish',e:'🐟'},{w:'frog',e:'🐸'},{w:'duck',e:'🦆'},{w:'pig',e:'🐷'},{w:'cow',e:'🐮'},{w:'fox',e:'🦊'},{w:'bear',e:'🐻'},{w:'owl',e:'🦉'}]},
  {name:'🎨 Colors', words:[{w:'red',e:'🟥'},{w:'blue',e:'🟦'},{w:'green',e:'🟩'},{w:'yellow',e:'🟨'},{w:'pink',e:'🌸'},{w:'black',e:'⬛'},{w:'white',e:'⬜'},{w:'brown',e:'🟫'},{w:'purple',e:'🟪'}]},
  {name:'🌧️ ai / oa', words:[{w:'rain',e:'🌧️'},{w:'train',e:'🚆'},{w:'snail',e:'🐌'},{w:'tail',e:'🐒'},{w:'boat',e:'⛵'},{w:'goat',e:'🐐'},{w:'coat',e:'🧥'},{w:'road',e:'🛣️'},{w:'soap',e:'🧼'}]},
  {name:'👀 Sight words', words:[{w:'the',e:'👉'},{w:'and',e:'➕'},{w:'said',e:'🗣️'},{w:'was',e:'⏪'},{w:'they',e:'👫'},{w:'have',e:'🤲'},{w:'come',e:'👋'},{w:'what',e:'❓'},{w:'here',e:'📍'},{w:'you',e:'👤'}]},
  {name:'🔢 Numbers', words:[{w:'one',e:'1️⃣'},{w:'two',e:'2️⃣'},{w:'three',e:'3️⃣'},{w:'four',e:'4️⃣'},{w:'five',e:'5️⃣'},{w:'six',e:'6️⃣'},{w:'seven',e:'7️⃣'},{w:'eight',e:'8️⃣'},{w:'nine',e:'9️⃣'},{w:'ten',e:'🔟'}]},
  {name:'🍕 Food', words:[{w:'apple',e:'🍎'},{w:'cake',e:'🍰'},{w:'milk',e:'🥛'},{w:'bread',e:'🍞'},{w:'cheese',e:'🧀'},{w:'pizza',e:'🍕'},{w:'corn',e:'🌽'},{w:'egg',e:'🥚'},{w:'grapes',e:'🍇'}]},
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
let save = {coins:25, stars:0, stickers:{}, owned:{}, equip:{}, hero:0, weak:{}, place:'tour'};   // place: a place id from places.js, 'tour' (a new place and boss every level) or 'random'   // weak: "needs practice" score per word (see buildPool in game.js)
try { Object.assign(save, JSON.parse(localStorage.getItem(SAVE_KEY)||'{}')); } catch(e){}
if(save.placeV!==2){ save.place='tour'; save.placeV=2; }   // the tour became the default: older saves (which only ever held the first, automatic place) start on it
if(!save.weak || typeof save.weak!=='object' || Array.isArray(save.weak)) save.weak = {};
save.equip = Object.assign({hat:null,neck:null,back:null,trail:null,pet:null,power:null}, save.equip||{});
if(Array.isArray(save.words) && save.words.length){ WORDS.length=0; save.words.forEach(o=>{ if(o&&o.w) WORDS.push({w:String(o.w),e:o.e||'✏️'}); }); }
if(save.perLevel>=2 && save.perLevel<=10) WORDS_PER_LEVEL = save.perLevel;
const persist = () => { try{ localStorage.setItem(SAVE_KEY, JSON.stringify(save)); }catch(e){} };

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
