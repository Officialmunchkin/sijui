const fs = require('fs');
const s = fs.readFileSync('c:/Users/Admin/OneDrive/Desktop/Wallpaper/famvault.html', 'utf8');
// find component boundaries: look for the string 'ADMIN PANEL' render region and find 't==="' usages around to see which component is which
const i = s.indexOf('"ADMIN PANEL"');
console.log('ADMIN PANEL @', i);
// Find start of this component: search backwards for 'useRef(null)' or a function boundary
// Instead, find where component that contains ADMIN PANEL starts — search back for 'function ' or '=>' with component name
const back = s.slice(Math.max(0, i - 30000), i);
const matches = [...back.matchAll(/function\s+([A-Za-z_$][\w$]*)\s*\(/g)];
console.log('nearest function names before:', matches.slice(-3).map(m => m[1] + '@' + (m.index + Math.max(0, i - 30000))));
// also find where Ot (invites) is declared at 186370 and what component it belongs to
const back2 = s.slice(Math.max(0, 186370 - 30000), 186370);
const m2 = [...back2.matchAll(/function\s+([A-Za-z_$][\w$]*)\s*\(/g)];
console.log('function containing Ot decl:', m2.slice(-2).map(x => x[1] + '@' + (x.index + Math.max(0, 186370 - 30000))));
