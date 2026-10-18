const fs = require('fs');
const s = fs.readFileSync('famvault.html', 'utf8');
const out = [];
let i = 0;
while ((i = s.indexOf('ADMIN', i)) >= 0) {
  out.push('=== @' + i + ' :: ' + s.slice(Math.max(0, i - 200), i + 250).replace(/\n/g, ' '));
  i += 5;
}
fs.writeFileSync('admin_contexts.txt', out.join('\n\n'));
console.log('wrote', out.length, 'occurrences');
