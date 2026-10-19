const fs = require('fs');
const s = fs.readFileSync('c:/Users/Admin/OneDrive/Desktop/Wallpaper/famvault.html', 'utf8');
// The function containing the ADMIN render ('t==="ADMIN"&&!V') — find it
const start = s.indexOf('t==="ADMIN"&&!V');
const back = s.slice(Math.max(0, start - 40000), start);
const matches = [...back.matchAll(/function\s+([A-Za-z_$][\w$]*)\s*\(/g)];
console.log('ADMIN block @', start, 'containing fn:', matches.slice(-1).map(m => m[1] + '@' + (m.index + Math.max(0, start - 40000))));
// Show what 'xo' component (containing Ot decl) renders — find its tab condition
const xoStart = 185676;
const xo = s.slice(xoStart, xoStart + 400);
console.log('xo signature:', xo.replace(/\n/g, ' '));
