const fs = require('fs');
const s = fs.readFileSync('c:/Users/Admin/OneDrive/Desktop/Wallpaper/famvault.html', 'utf8');
// is 'Ot' used inside admin block? where does it come from — check if it's a prop/function param
const start = s.indexOf('t==="ADMIN"&&!V');
const chunk = s.slice(Math.max(0, start - 2000), start + 9000);
// search whole file for 'Ot' as param or const
const re = /\bOt\b/g;
let m, c = 0;
while ((m = re.exec(s)) !== null) {
  console.log('@' + m.index + ' :: ' + s.slice(Math.max(0, m.index - 100), m.index + 100).replace(/\n/g, ' '));
  if (++c > 12) break;
}
