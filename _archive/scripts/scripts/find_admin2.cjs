const fs = require('fs');
const s = fs.readFileSync('famvault.html', 'utf8');
const m = [...s.matchAll(/\[(\w+),\s*(\w+)\]\s*=\s*\w+\.useState\(\s*"([A-Z]+)"\s*\)/g)];
console.log('useState-with-string matches:');
m.forEach(x => console.log(' ', x[1], ',', x[2], '=', x[3], ' @', x.index));
let i = 0, c = 0;
while ((i = s.indexOf('ADMIN', i)) >= 0 && c < 40) {
  const ctx = s.slice(Math.max(0, i - 100), i + 150).replace(/\n/g, ' ');
  if (/tab|Tab|view|View|page|Page|r\(|setTab|===/.test(ctx)) {
    console.log('--- @', i, '::', ctx);
  }
  i += 5; c++;
}
