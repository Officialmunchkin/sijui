// Rebuild famvault.html from Famvault-Readable-Version.html with R2 patches.
// Verified anchors; rebuilds from pristine source every run.
const fs = require('fs');
const { transformSync } = require('./famvault-worker/node_modules/esbuild');

const SRC = 'Famvault-Readable-Version.html';
const OUT = 'famvault.html';
const API = 'https://famvault-r2.famvault.workers.dev';

let s = fs.readFileSync(SRC, 'utf8');

// ---- Identify identifiers ----
const mPhotos = s.match(/\[([A-Za-z0-9_$]+),([A-Za-z0-9_$]+)\]=\$\$?\.useState\(\(\)=>([A-Za-z0-9_$]+)\(\)\)/);
if (!mPhotos) { console.log('cannot find photos state'); process.exit(1); }
const PHOTOS = mPhotos[1], SETPHOTOS = mPhotos[2];

const mAc = s.match(/function ([A-Za-z0-9_$]+)\(([a-z])\)\{let ([a-z])=URL\.createObjectURL\(\2\);([A-Za-z0-9_$]+)\(\3\)\}/);
if (!mAc) { console.log('cannot find ac handler'); process.exit(1); }
const AC = mAc[1], SETPREVIEW = mAc[4];

const mMp = s.match(/function ([A-Za-z0-9_$]+)\(\)\{if\(([A-Za-z0-9_$]+)\)return;if\(!([A-Za-z0-9_$]+)\)return;let ([a-z])=([A-Za-z0-9_$]+)\|\|([A-Za-z0-9_$]+)\[0\]\|\|"UNSORTED"/);
if (!mMp) { console.log('cannot find save handler'); process.exit(1); }
const MP = mMp[1], GUEST = mMp[2], PREVIEWSTATE = mMp[3];
console.log('photos:', PHOTOS, SETPHOTOS, '| ac:', AC, SETPREVIEW, '| save:', MP, GUEST, PREVIEWSTATE);

// ---- PATCH 1: accept videos ----
const accOld = 'accept:"image/*"';
if (!s.includes(accOld)) { console.log('accept missing'); process.exit(1); }
s = s.replace(accOld, 'accept:"image/*,video/*"');

// ---- PATCH 2: keep raw File ----
const acOld = `function ${AC}(${mAc[2]}){let ${mAc[3]}=URL.createObjectURL(${mAc[2]});${SETPREVIEW}(${mAc[3]})}`;
if (!s.includes(acOld)) { console.log('ac fn missing'); process.exit(1); }
const acNew = `function ${AC}(${mAc[2]}){window.__fvfile=${mAc[2]};let ${mAc[3]}=URL.createObjectURL(${mAc[2]});${SETPREVIEW}(${mAc[3]})}`;
s = s.replace(acOld, acNew);
const acEnd = s.indexOf(acNew) + acNew.length;

// ---- PATCH 3: async R2 save ----
const mpBodyStart = s.indexOf(`function ${MP}(){`, acEnd);
const open = s.indexOf('{', mpBodyStart);
let depth = 0, end = -1;
for (let i = open; i < s.length; i++) {
  const c = s[i];
  if (c === '{') depth++;
  else if (c === '}') { depth--; if (depth === 0) { end = i; break; } }
}
if (end === -1) { console.log('mp fn end not found'); process.exit(1); }
const mpOld = s.slice(mpBodyStart, end + 1);
const mCap = mpOld.match(/caption:([A-Za-z0-9_$]+)\|\|/) || mpOld.match(/caption:([A-Za-z0-9_$]+)/);
const CAP = mCap ? mCap[1] : '';
const mUp = mpOld.match(/uploadedBy:([A-Za-z0-9_$]+)\|\|"herman"/);
const UPVAR = mUp ? mUp[1] : 'e';
const mReset = mpOld.match(/Pe\(\(T\)=>\[g,\.\.\.T\]\),([A-Za-z0-9_$]+)\(!1\),([A-Za-z0-9_$]+)\(null\),([A-Za-z0-9_$]+)\(""\),([A-Za-z0-9_$]+)\(""\),([A-Za-z0-9_$]+)\(!1\)\}/);
if (!mReset) { console.log('cannot find reset sequence'); process.exit(1); }
const SETPHOTOSCALL = 'Pe((T)=>[photo,...T])';
const CLOSEMODAL = mReset[1], CLEARPREV = mReset[2], CLEARCAP = mReset[3], CLEARALB = mReset[4], CLOSENEW = mReset[5];
const ALBUMEXPR = mpOld.match(new RegExp(`let ${mMp[4]}=(.+?),`))[1];
console.log('cap:', CAP, 'up:', UPVAR, 'album:', ALBUMEXPR, 'reset:', CLOSEMODAL, CLEARPREV, CLEARCAP, CLEARALB, CLOSENEW);

const mpNew =
  `async function ${MP}(){if(${GUEST})return;let f=window.__fvfile;if(!f)return;` +
  `window.__fvbusy=!0;try{` +
  `let fd=new FormData;fd.append("file",f);fd.append("caption",${CAP}||"");fd.append("album",${ALBUMEXPR});` +
  `fd.append("uploadedBy",${UPVAR}||"herman");fd.append("tagged",${UPVAR}||"herman");` +
  `let res=await fetch("${API}/upload",{method:"POST",headers:{"X-Famvault-Role":"member"},body:fd});` +
  `if(!res.ok){let er=await res.json().catch(()=>({}));throw new Error(er.error||"UPLOAD FAILED")}` +
  `let photo=(await res.json()).photo;${SETPHOTOS}((T)=>[photo,...T]),${CLOSEMODAL}(!1),${CLEARPREV}(null),${CLEARCAP}(""),${CLEARALB}(""),${CLOSENEW}(!1)` +
  `}catch(err){alert("UPLOAD FAILED: "+err.message)}finally{window.__fvbusy=!1}}`;
s = s.slice(0, mpBodyStart) + mpNew + s.slice(end + 1);

// ---- PATCH 4: button label ----
s = s.replace('children:"UPLOAD TO VAULT', 'children:window.__fvbusy?"UPLOADING...":"UPLOAD TO VAULT');

// ---- PATCH 5: load photos on start ----
const saveAnchor = '$.useEffect(()=>{try{localStorage.setItem("famvault_albums"';
if (!s.includes(saveAnchor)) { console.log('save anchor missing'); process.exit(1); }
const loader =
  `$.useEffect(()=>{fetch("${API}/photos").then((h)=>h.json()).then((h)=>{` +
  `if(Array.isArray(h.photos)&&h.photos.length)${SETPHOTOS}(h.photos)}).catch(()=>{})},[]),`;
s = s.replace(saveAnchor, loader + saveAnchor);

// ---- PATCH 6: video rendering ----
const mCard = s.match(/children:\[a\("img",\{src:([A-Za-z0-9_$]+)\.src,alt:\1\.caption/);
if (mCard) {
  const v = mCard[1];
  s = s.replace(
    `children:[a("img",{src:${v}.src,alt:${v}.caption`,
    `children:[${v}.type==="video"?a("video",{src:${v}.src,className:"w-full",muted:!0,playsInline:!0}):a("img",{src:${v}.src,alt:${v}.caption`
  );
  console.log('card video OK, var:', v);
} else console.log('WARN: card pattern not found');

const mLb = s.match(/children:\[a\("img",\{src:([A-Za-z0-9_$]+)\.src,className:"max-w-full max-h-\[70vh\] object-contain",alt:\1\.caption\}\)/);
if (mLb) {
  const v = mLb[1];
  s = s.replace(
    `children:[a("img",{src:${v}.src,className:"max-w-full max-h-[70vh] object-contain",alt:${v}.caption})`,
    `children:[${v}.type==="video"?a("video",{src:${v}.src,className:"max-w-full max-h-[70vh] object-contain",controls:!0,autoPlay:!0,playsInline:!0}):a("img",{src:${v}.src,className:"max-w-full max-h-[70vh] object-contain",alt:${v}.caption})`
  );
  console.log('lightbox video OK, var:', v);
} else console.log('WARN: lightbox pattern not found');

// ---- PATCH 7: ADMIN tab visible to Herman only ----
// Nav gate currently: if(V&&o.k==="ADMIN")return null  (V = isGuest)
// Change to: if(o.k==="ADMIN"&&e!=="herman")return null  (e = current username)
const adminGateOld = 'if(V&&o.k==="ADMIN")return null';
if (!s.includes(adminGateOld)) { console.log('admin gate missing'); process.exit(1); }
s = s.replace(adminGateOld, 'if(o.k==="ADMIN"&&e!=="herman")return null');
console.log('admin gate OK');

// ---- PATCH 8: Board POST button works ----
// The POST button has no onClick. The input next to it has no value binding.
// Add state + handler: use a module-level approach with a local state hook injected in the Board component.
// Simplest robust approach: make the button read the input's DOM value, post locally (persist to localStorage) and prepend to the pinned list.
// The board list is rendered from a literal array — replace it with a state-driven list.
// Strategy: inject a state declaration + handler just before the BOARD section render, and rewrite the pinned list to use it.
// 8a: find the board render block
const boardStart = s.indexOf('t==="BOARD"&&a("div",');
if (boardStart === -1) { console.log('board block missing'); process.exit(1); }

// 8b: inject board state into the component. Find the enclosing component's state cluster:
// the nearest preceding "[$.useState" cluster — inject after the album localStorage effect instead:
const boardStateDecl =
  `,` +
  `[Bt0,Bq0]=$.useState([{user:"LUCY",text:"DINNER SUNDAY 6PM. NO EXCUSES. BRING APPETITE.",time:"2H AGO",color:"#06B6D4"},{user:"HERMAN",text:"UPLOADED SUMMER 24 ALBUM. PLEASE TAG FACES.",time:"5H AGO",color:"#F59E0B"},{user:"FAITH",text:"WHO TOOK MY POLAROID CAMERA?? RETURN IT.",time:"1D AGO",color:"#EC4899"}]),` +
  `[Dj0,Br0]=$.useState("")`;
// inject into the state cluster: find '[PHOTOS,SETPHOTOS]=$.useState(()=>seed())' and append
const stateAnchor = `[${PHOTOS},${SETPHOTOS}]=$.useState(()=>`;
if (!s.includes(stateAnchor)) { console.log('state anchor missing'); process.exit(1); }
// find end of this useState call
const saIdx = s.indexOf(stateAnchor);
// scan to matching close of useState(...)
let d2 = 0, saEnd = -1, started = false;
for (let i = s.indexOf('(', saIdx); i < s.length; i++) {
  const c = s[i];
  if (c === '(') { d2++; started = true; }
  else if (c === ')') { d2--; if (started && d2 === 0) { saEnd = i + 1; break; } }
}
if (saEnd === -1) { console.log('state end not found'); process.exit(1); }
s = s.slice(0, saEnd) + boardStateDecl + s.slice(saEnd);
console.log('board state injected');

// 8c: replace the literal pinned array with state mapping + wire input/button
const postsArrayOld = s.match(/children:\[\{user:"LUCY"[\s\S]*?\.map\(\(o,g\)=>/);
if (!postsArrayOld) { console.log('posts array missing'); process.exit(1); }
s = s.replace(postsArrayOld[0], 'children:Bt0.map((o,g)=>');
// input: add value/onChange
s = s.replace(
  'a("input",{placeholder:"WRITE ON BOARD...",disabled:V,',
  'a("input",{placeholder:"WRITE ON BOARD...",value:Dj0,onChange:(g)=>Br0(g.target.value),disabled:V,'
);
// button: add onClick
s = s.replace(
  'a("button",{disabled:V,className:"h-[40px] px-5 rounded-full bg-gradient-to-r from-[#6366F1] to-[#8B5CF6]',
  'a("button",{disabled:V||!Dj0.trim(),onClick:()=>{if(!Dj0.trim())return;let nv={user:(e||"HERMAN").toUpperCase(),text:Dj0.trim().toUpperCase(),time:"NOW",color:"#6366F1"};Bq0((T)=>[nv,...T]),Br0("")},className:"h-[40px] px-5 rounded-full bg-gradient-to-r from-[#6366F1] to-[#8B5CF6]'
);
console.log('board post OK');

// ---- PATCH 9: real storage numbers (10240 MB = 10GB) ----
// Old: children:[(O.length*2.4).toFixed(1)," MB / 5000 MB"]
// Real used bytes come from the photo metadata the worker returns (size field).
// Add a computed usage var and rewrite the display.
const storageOld = s.match(/children:\[\(([A-Za-z0-9_$]+)\.length\*2\.4\)\.toFixed\(1\)," MB \/ 5000 MB"\]/);
if (!storageOld) { console.log('storage display missing'); process.exit(1); }
// photos have size in bytes (added by worker). compute MB.
const usedExpr = `(function(){let b=0;for(const q of ${PHOTOS})b+=(q.size||0);return b/1048576})().toFixed(1)`;
s = s.replace(storageOld[0], `children:[${usedExpr}," MB / 10240 MB"]`);
// also fix the progress bar width if it uses the same fake math
// also fix the static progress bar
const d2bar = s.indexOf('children:a("div",{className:"h-full w-[12%] bg-[#FF6B8A]"})');
if (d2bar > -1) {
  const usedPct = '(function(){let b=0;for(const q of ' + PHOTOS + ')b+=(q.size||0);return Math.max(0.5,Math.min(100,b/1048576/10240*100))}).toFixed' ;
  const usedPctExpr = '(function(){let b=0;for(const q of ' + PHOTOS + ')b+=(q.size||0);return Math.max(0.5,Math.min(100,b/1048576/10240*100))}).toFixed(1)';
  s = s.replace('children:a("div",{className:"h-full w-[12%] bg-[#FF6B8A]"})',
    'children:a("div",{className:"h-full bg-[#FF6B8A]",style:{width:' + usedPctExpr + '+"%"}})');
  console.log('storage bar OK');
} else console.log('WARN: storage bar not found');
console.log('storage OK');

// ---- VERIFY: module script must parse ----
const start = s.indexOf('<script type="module">') + '<script type="module">'.length;
const endTag = s.indexOf('</script>', start);
const js = s.slice(start, endTag);
try {
  transformSync(js, { loader: 'js' });
  console.log('PARSE OK');
} catch (e) {
  const er = e.errors[0];
  console.log('PARSE ERROR:', er.text, 'at', er.location.line + ':' + er.location.column);
  const L = js.split('\n')[er.location.line - 1];
  console.log(JSON.stringify(L.slice(Math.max(0, er.location.column - 150), er.location.column + 100)));
  process.exit(1);
}

fs.writeFileSync(OUT, s);
console.log('wrote', OUT, s.length, 'chars');
