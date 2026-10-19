const fs = require('fs');
const s = fs.readFileSync('famvault.html', 'utf8');
// print context around 230991 - 1200 before
console.log(s.slice(230991 - 1500, 230991 + 200).replace(/\n/g, ' '));
console.log('\n=== search for "V=" declarations near admin ===');
const idx = s.indexOf('t==="ADMIN"&&!V');
console.log(s.slice(idx - 3000, idx));
