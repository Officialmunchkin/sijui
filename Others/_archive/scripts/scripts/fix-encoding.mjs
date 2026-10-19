// fix-encoding.mjs — clean up kashifamily.html encoding
// 1. ensure <meta charset="utf-8"> is first tag in <head>
// 2. decode UTF-8-as-Windows-1252 mojibake back to real chars
// 3. escape ALL remaining non-ASCII:
//      - inside <script>: \uXXXX escapes
//      - in HTML/CSS: &#xXXXX; entities
// 4. strip BOM, save UTF-8 no BOM
import fs from 'fs';

const file = 'C:/Users/Admin/OneDrive/Desktop/famvault-site/kashifamily.html';
let s = fs.readFileSync(file, 'utf8');

// strip BOM
if (s.charCodeAt(0) === 0xFEFF) s = s.slice(1);

// ensure meta charset is first in head
s = s.replace(/<head>\s*<meta charset="[^"]*">/, '<head>\n<meta charset="utf-8">');
if (!/^<head>\n<meta charset="utf-8">/m.test(s)) {
  s = s.replace('<head>', '<head>\n<meta charset="utf-8">');
}

// --- generic mojibake decoder: chars 0x80-0x9F + 0xA0-0xFF that came from
// UTF-8 bytes mis-decoded as Windows-1252 ---
const cp1252 = [0x20AC,0x81,0x201A,0x0192,0x201E,0x2026,0x2020,0x2021,0x02C6,0x2030,
  0x0160,0x2039,0x0152,0x8D,0x017D,0x8F,0x90,0x2018,0x2019,0x201C,0x201D,0x2022,
  0x2013,0x2014,0x2DC,0x2122,0x0161,0x203A,0x0153,0x9D,0x017E,0x0178];
// reverse map: codepoint -> byte
const rev = {};
for (let b = 0; b < 256; b++) {
  const cp = b >= 0x80 && b <= 0x9F ? cp1252[b - 0x80] : b;
  if (cp !== undefined) rev[cp] = b;
}
// try decoding every maximal run of "high" chars as UTF-8 bytes
function decodeRuns(str) {
  let out = '', i = 0;
  while (i < str.length) {
    const c = str.codePointAt(i);
    if (c < 0x80) { out += str[i]; i++; continue; }
    // collect run of chars that have cp1252 byte mappings
    let run = '', j = i;
    while (j < str.length) {
      const cc = str.codePointAt(j);
      if (cc < 0x80) break;
      if (!(cc in rev) && !(cc >= 0xA0 && cc <= 0xFF)) break;
      const b = cc in rev ? rev[cc] : cc;
      run += String.fromCharCode(b);
      j++;
    }
    // try utf8 decode of run
    try {
      const decoded = new TextDecoder('utf-8', { fatal: true }).decode(new Uint8Array([...run].map(ch => ch.charCodeAt(0))));
      out += decoded;
    } catch { out += run; } // keep raw bytes if not valid utf8
    i = j;
  }
  return out;
}
s = decodeRuns(s);

// --- split into segments ---
const OPEN = '<script>', CLOSE = '</script>';
const parts = [];
let rest = s, inScript = false;
while (true) {
  if (!inScript) {
    const idx = rest.indexOf(OPEN);
    if (idx === -1) { parts.push({ html: rest }); break; }
    parts.push({ html: rest.slice(0, idx) });
    rest = rest.slice(idx + OPEN.length);
    inScript = true;
  } else {
    const idx = rest.indexOf(CLOSE);
    if (idx === -1) { parts.push({ js: rest }); break; }
    parts.push({ js: rest.slice(0, idx) });
    rest = rest.slice(idx + CLOSE.length);
    inScript = false;
  }
}

const hex4 = c => '\\u' + c.toString(16).toUpperCase().padStart(4, '0');
function escJS(str) {
  return str.replace(/[\u0080-\uFFFF]/g, ch => hex4(ch.codePointAt(0)));
}
function escHTML(str) {
  return str.replace(/[\u0080-\uFFFF]/g, ch => '&#x' + ch.codePointAt(0).toString(16).toUpperCase() + ';');
}

let out = '';
for (const p of parts) {
  if ('html' in p) out += escHTML(p.html);
  else out += OPEN + escJS(p.js) + CLOSE;
}

fs.writeFileSync(file, out, { encoding: 'utf8' });
// verify
const check = fs.readFileSync(file, 'utf8');
const high = [...check].filter(c => c.codePointAt(0) > 0x7F);
console.log('remaining raw non-ascii chars:', high.length);
console.log('charset meta:', check.includes('<meta charset="utf-8">'));
console.log('size:', check.length);
