const fs = require('fs');
const s = fs.readFileSync('Famvault-Readable-Version.html', 'utf8');
const p = s.indexOf('children:"POST"})');
console.log('=== POST AREA ===');
console.log(s.slice(p - 1500, p + 300));
const st = s.indexOf('/ 5000 MB');
console.log('\n=== STORAGE ===');
console.log(s.slice(st - 700, st + 100));
