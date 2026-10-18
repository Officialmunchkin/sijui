const fs = require('fs');
const file = 'C:/Users/Admin/OneDrive/Desktop/famvault-site/kashifamily.html';

// read as latin1 to get raw bytes, strip BOM
let bytes = fs.readFileSync(file);
if (bytes[0] === 0xEF && bytes[1] === 0xBB && bytes[2] === 0xBF) bytes = bytes.slice(3);

// try to fix mojibake: decode whole buffer as utf8 where valid.
// Strategy: walk bytes; when we find an invalid utf8 sequence, treat that byte
// as a literal cp1252/latin1 char.
function smartDecode(buf) {
  const dec = new TextDecoder('utf-8', { fatal: true });
  let out = '', i = 0;
  while (i < buf.length) {
    // try to decode the largest valid utf8 chunk from i
    let j = buf.length, chunk = null;
    while (j > i) {
      try { chunk = dec.decode(buf.subarray(i, j)); break; }
      catch { j--; }
    }
    if (chunk !== null && j > i) { out += chunk; i = j; }
    else {
      // single invalid byte -> cp1252 char
      const b = buf[i];
      out += cp1252Char(b);
      i++;
    }
  }
  return out;
}
const CP1252 = [0x20AC,0x81,0x201A,0x0192,0x201E,0x2026,0x2020,0x2021,0x02C6,0x2030,
  0x0160,0x2039,0x0152,null,0x017D,null,0x90,0x2018,0x2019,0x201C,0x201D,0x2022,
  0x2013,0x2014,0x02DC,0x2122,0x0161,0x203A,0x0153,null,0x017E,0x0178];
function cp1252Char(b) {
  if (b >= 0x80 && b <= 0x9F) { const c = CP1252[b - 0x80]; return c ? String.fromCharCode(c) : '?'; }
  return String.fromCharCode(b);
}

let s = smartDecode(bytes);

// ensure meta charset first in head
s = s.replace(/<head>\s*(<meta charset="[^"]*">)?/, '<head>\n<meta charset="utf-8">');

// split into script / non-script parts
const OPEN = '<script>', CLOSE = '</script>';
const segs = [];
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

function escJS(str) {
  return str.replace(/[\u0080-\uFFFF]/g, ch => '\\u' + ch.codePointAt(0).toString(16).toUpperCase().padStart(4, '0'));
}
function escHTML(str) {
  return str.replace(/[\u0080-\uFFFF]/g, ch => '&#x' + ch.codePointAt(0).toString(16).toUpperCase() + ';');
}

let out = '';
for (const seg of segs) {
  out += seg.t === 'js' ? OPEN + escJS(seg.v) + CLOSE : escHTML(seg.v);
}

fs.writeFileSync(file, out, 'utf8');

// verify
const check = fs.readFileSync(file, 'utf8');
const raw = [...check].filter(c => c.codePointAt(0) > 0x7F);
console.log('done. raw non-ascii remaining:', raw.length);
console.log('meta charset present:', /<head>\n<meta charset="utf-8">/.test(check));
console.log('new size:', check.length);
