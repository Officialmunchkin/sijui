const fs = require('fs');
const file = 'C:/Users/Admin/OneDrive/Desktop/famvault-site/kashifamily.html';
const s = fs.readFileSync(file, 'utf8');
// find remaining suspicious \u00XX escapes and their context
const re = /\\u00[89AB][0-9A-Fa-f]{2}\\u00[0-9A-Fa-f]{2}/g;
let m, found = 0;
while ((m = re.exec(s)) && found < 10) {
  console.log('at', m.index, ':', s.slice(m.index - 60, m.index + 80).replace(/\n/g, ' '));
  found++;
}
if (!found) console.log('no 008x-00BF double-escape runs found');
// count all \u00XX escapes
const all = s.match(/\\u00[0-9A-Fa-f]{2}/g) || [];
const counts = {};
all.forEach(x => counts[x] = (counts[x] || 0) + 1);
console.log(JSON.stringify(counts));
