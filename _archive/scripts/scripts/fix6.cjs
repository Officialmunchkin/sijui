const fs = require('fs');
const file = 'C:/Users/Admin/OneDrive/Desktop/famvault-site/kashifamily.html';
let s = fs.readFileSync(file, 'utf8');
const map = {
  '\\u00E2\\u0153\\u017D': '\\u270E',   // ✎ pencil (rename/edit)
  '\\u00E2\\u2020\\u2018': '\\u2192',   // → arrow
};
for (const [k, v] of Object.entries(map)) {
  const n = s.split(k).length - 1;
  s = s.split(k).join(v);
  console.log(k, '->', v, ':', n);
}
fs.writeFileSync(file, s, 'utf8');
const check = fs.readFileSync(file, 'utf8');
const sus = check.match(/\\u00[0-9A-F]{2}/g) || [];
console.log('remaining 00xx escapes:', JSON.stringify(sus));
