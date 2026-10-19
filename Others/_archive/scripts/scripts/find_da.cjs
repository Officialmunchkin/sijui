const fs = require('fs');
const s = fs.readFileSync('c:/Users/Admin/OneDrive/Desktop/Wallpaper/famvault.html', 'utf8');
// da is the component rendering ADMIN tab; xo is a different one. Check where da gets 'Ot' from — look at da signature
const daStart = 193453;
console.log('da signature:', s.slice(daStart, daStart + 700).replace(/\n/g, ' '));
// Also: is the 'Ot' used in ADMIN block a local or prop? Print a window around each Ot usage inside da's chunk
const daEnd = 230986 + 9000;
const chunk = s.slice(daStart, daEnd);
const re = /\bOt\b/g;
let m;
while ((m = re.exec(chunk)) !== null) {
  console.log('Ot @da+' + m.index, '::', chunk.slice(Math.max(0, m.index - 80), m.index + 80).replace(/\n/g, ' '));
}
