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

function unescapeJS(str) {
  return str.replace(/\\u([0-9A-Fa-f]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16)));
}
function unescapeHTML(str) {
  return str.replace(/&#x([0-9A-Fa-f]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)));
}

const dec = new TextDecoder('utf-8', { fatal: true });
function isSuspicious(c) {
  return (c >= 0x80 && c <= 0x9F && CP1252[c] !== undefined) || (c >= 0xA0 && c <= 0xFF);
}
function toByte(c) {
  return c <= 0xFF ? c : CP1252[c];
}
// decode longest valid utf8 prefix from run
function decodeRun(run) {
  // try full run, then trim from the end
  for (let end = run.length; end >= 2; end--) {
    try {
      const decoded = dec.decode(new Uint8Array(run.slice(0, end).map(toByte)));
      return { text: decoded, used: end };
    } catch { }
  }
  return { text: String.fromCodePoint(...run.slice(0, 1)), used: 1 };
}
function fixMojibake(str) {
  let out = '', i = 0;
  while (i < str.length) {
    const c = str.codePointAt(i);
    if (!isSuspicious(c)) { out += str[i]; i++; continue; }
    const run = [];
    let j = i;
    while (j < str.length && isSuspicious(str.codePointAt(j))) { run.push(str.codePointAt(j)); j++; }
    // greedily decode valid utf8 chunks from run
    let k = 0;
    while (k < run.length) {
      const sub = run.slice(k);
      const r = decodeRun(sub);
      out += r.text;
      k += r.used;
    }
    i = j;
  }
  return out;
}

let out = '';
for (const seg of segs) {
  let v = seg.t === 'js' ? unescapeJS(seg.v) : unescapeHTML(seg.v);
  v = fixMojibake(v);
  if (seg.t === 'js') {
    v = v.replace(/[\u0080-\uFFFF]/g, ch => '\\u' + ch.codePointAt(0).toString(16).toUpperCase().padStart(4, '0'));
    out += OPEN + v + CLOSE;
  } else {
    v = v.replace(/[\u0080-\uFFFF]/g, ch => '&#x' + ch.codePointAt(0).toString(16).toUpperCase() + ';');
    out += v;
  }
}
fs.writeFileSync(file, out, 'utf8');
const check = fs.readFileSync(file, 'utf8');
const bad = ['\\u00E2\\u2020\\u2018', '\\u00E2\\u201A\\u00AC', '\\u00E2\\u20AC\\u201D', '\\u00E2\\u20AC\\u0153', '\\u00C3\\u00A9'];
bad.forEach(p => console.log('pattern', p, '=>', check.includes(p) ? 'STILL PRESENT' : 'clean'));
console.log('up-arrows:', (check.match(/\\u2191/g) || []).length);
console.log('hearts:', (check.match(/\\u2665/g) || []).length);
console.log('size:', check.length);
