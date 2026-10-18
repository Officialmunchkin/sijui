const fs = require('fs');
const file = 'C:/Users/Admin/OneDrive/Desktop/famvault-site/kashifamily.html';
let s = fs.readFileSync(file, 'utf8');

// direct mojibake -> intended char map (from context inspection)
const map = {
  '\\u00F0\\u0178\\u017D\\u2030': '\\uD83C\\uDF89',            // 🎉 party
  '\\u00F0\\u0178\\u2014\\u2018': '\\uD83D\\uDDD1',            // 🗑 wastebasket (delete)
  '\\u00E2\\u0153\\u201C': '\\u2714',                           // ✔ check (upload success)
  '\\u00E2\\u0153\\u2022': '\\u2715',                           // ✕ close
  '\\u00E2\\u2020\\u2019': '\\u2192',                           // → arrow
  '\\u00E2\\u2122\\u00A5': '\\u2665',                           // ♥ heart
  '\\u00E2\\u00AC\\u2021': '\\u2B07',                           // ⬇ down arrow (download)
  '\\u00E2\\u2014\\u008F': '\\u25CF',                           // ● bullet (password status)
};
for (const [k, v] of Object.entries(map)) {
  const before = s.split(k).length - 1;
  s = s.split(k).join(v);
  console.log(k, '->', v, ':', before, 'replaced');
}
fs.writeFileSync(file, s, 'utf8');

// final verify: no more suspicious 00xx escapes in JS strings
const check = fs.readFileSync(file, 'utf8');
const sus = check.match(/\\u00[89AB][0-9A-Fa-f]{2}|\\u00E[0-9A-F]|\\u00F0/g) || [];
console.log('remaining suspicious escapes:', sus.length);
console.log('hearts:', (check.match(/\\u2665/g) || []).length);
console.log('arrows:', (check.match(/\\u2192/g) || []).length);
console.log('party:', (check.match(/\\uD83C\\uDF89/g) || []).length);
