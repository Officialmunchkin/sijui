const fs = require('fs');
const s = fs.readFileSync('c:/Users/Admin/OneDrive/Desktop/Wallpaper/famvault.html', 'utf8');
// find 'Ot' as destructured state or props assignment:  [x, Ot] = ... or { Ot } = or Ot= 
for (const pat of [/\[\s*\w+\s*,\s*Ot\s*\]\s*=/, /\[\s*Ot\s*,\s*\w+\s*\]\s*=/, /Ot\s*=\s*/, /\{\s*Ot\s*[,}]/]) {
  let m, c = 0;
  const re = new RegExp(pat.source, 'g');
  console.log('--- pattern', pat.source);
  while ((m = re.exec(s)) !== null && c < 8) {
    console.log('@' + m.index, '::', s.slice(Math.max(0, m.index - 100), m.index + 120).replace(/\n/g, ' '));
    c++;
  }
}
