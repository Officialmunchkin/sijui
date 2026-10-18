const fs = require('fs');
const s = fs.readFileSync('famvault.html', 'utf8');
// Find where V is declared - look for ",V]=" or "[..,V]=" patterns near useState
const pats = [
  /,.{1,3}\]\s*=\s*\w+\.useState\([^)]{0,60}\)/g,
];
for (const p of pats) {
  let m;
  while ((m = p.exec(s))) {
    if (m[0].includes('V]')) console.log('DECL @', m.index, '::', m[0]);
  }
}
// also find "V=" plain assignments
let i = 0, c = 0;
while ((i = s.indexOf('V=', i)) >= 0 && c < 30) {
  console.log('ASSIGN @', i, '::', s.slice(i - 80, i + 120).replace(/\n/g, ' '));
  i += 2; c++;
}
