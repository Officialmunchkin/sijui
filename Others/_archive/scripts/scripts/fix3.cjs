const fs = require('fs');
const file = 'C:/Users/Admin/OneDrive/Desktop/famvault-site/kashifamily.html';
let s = fs.readFileSync(file, 'utf8');

const segs = [];
const OPEN = '<script>', CLOSE = '</script>';
let rest = s, inScript = false;
while (true) {
  if (!inScript) {
    const i = rest.indexOf(OPEN);
    if (i === -1) { segs.push({ t: 'html', v: rest }); break; }
    segs.push({ t: 'html', v: rest.slice(0, i) });
    rest = rest.slice(i + OPEN.length); inScript = true;
  } else {
    const i = rest.indexOf(CLOSE);
    if (i === -1) { segs.push({ t: 'js', v: rest }); break; }
    segs.push({ t: 'js', v: rest.slice(0, i) });
    rest = rest.slice(i + CLOSE.length); inScript = false;
  }
}

const CP1252 = {};
const cps = [0x20AC,0x81,0x201A,0x0192,0x201E,0x2026,0x2020,0x2021,0x02C6,0x2030,
  0x0160,0x2039,0x0152,null,0x017D,null,null,0x2018,0x2019,0x201C,0x201D,0x2022,
  0x2013,0x2014,0x02DC,0x2122,0x0161,0x203A,0x0153,null,0x017E,0x0178];
cps.forEach((c, idx) => { if (c) CP1252[c] = 0x80 + idx; });

// unescape \uXXXX -> char
function unescapeJS(str) {
  return str.replace(/\\u([0-9A-Fa-f]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16)));
}

// fix mojibake: runs of chars in 0x80-0x9F (cp1252 specials) and any high chars
// whose cp1252 bytes form valid UTF-8
function fixMojibake(str) {
  const dec = new TextDecoder('utf-8', { fatal: true });
  let out = '', i = 0;
  while (i < str.length) {
    const c = str.codePointAt(i);
    // char is a cp1252-mapped special (0x80-0x9F range chars like € ‚ ƒ „ … † ‡ ˆ ‰ Š ‹ Œ Ž ' ' " " • – — ˜ ™ š › œ ž Ÿ)
    // or 0xA0-0xFF — these are suspicious when adjacent
    const isSpecial = (c >= 0x80 && c <= 0x9F && CP1252[c] !== undefined) || (c >= 0xA0 && c <= 0xFF);
    if (!isSpecial) { out += str[i]; i++; continue; }
    // build a run of such chars
    let run = [], j = i;
    while (j < str.length) {
      const cc = str.codePointAt(j);
      const sp = (cc >= 0x80 && cc <= 0x9F && CP1252[cc] !== undefined) || (cc >= 0xA0 && cc <= 0xFF);
      if (!sp) break;
      run.push(cc); j++;
    }
    // convert run chars to cp1252 bytes
    const bytes = run.map(cc => (cc <= 0xFF) ? cc : CP1252[cc]);
    try {
      const decoded = dec.decode(new Uint8Array(bytes));
      out += decoded;
    } catch {
      // not valid utf8 — try shorter runs from the end? just keep raw
      out += run.map(cc => String.fromCodePoint(cc)).join('');
    }
    i = j;
  }
  return out;
}

let out = '';
for (const seg of segs) {
  if (seg.t === 'js') {
    let v = unescapeJS(seg.v);
    v = fixMojibake(v);
    // re-escape everything non-ascii
    v = v.replace(/[\u0080-\uFFFF]/g, ch => '\\u' + ch.codePointAt(0).toString(16).toUpperCase().padStart(4, '0'));
    out += OPEN + v + CLOSE;
  } else {
    // html: unescape &#x...; then fix mojibake then re-escape
    let v = seg.v.replace(/&#x([0-9A-Fa-f]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)));
    v = fixMojibake(v);
    v = v.replace(/[\u0080-\uFFFF]/g, ch => '&#x' + ch.codePointAt(0).toString(16).toUpperCase() + ';');
    out += v;
  }
}

fs.writeFileSync(file, out, 'utf8');
// verify: look for known mojibake patterns
const check = fs.readFileSync(file, 'utf8');
const bad = ['\\u00E2\\u2020\\u2018', '\\u00E2\\u20AC\\u201D', '\\u00E2\\u0080\\u00A2', '\\u00EF\\u00BF\\u00BD'];
bad.forEach(p => console.log('pattern', p, '=>', check.includes(p) ? 'STILL PRESENT' : 'clean'));
console.log('size:', check.length);
console.log('sample arrows:', (check.match(/\\u2191/g) || []).length, 'up-arrows; bullets:', (check.match(/\\u2022/g) || []).length);
