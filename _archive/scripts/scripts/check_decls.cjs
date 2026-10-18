const fs = require('fs');
const s = fs.readFileSync('c:/Users/Admin/OneDrive/Desktop/Wallpaper/famvault.html', 'utf8');
const names = ['Ot', 'Jr', 'Ut', 'ap'];
for (const n of names) {
  const re = new RegExp('(const|let|var|function)\\s+' + n + '\\b', 'g');
  const decls = [];
  let m;
  while ((m = re.exec(s)) !== null) {
    decls.push('@' + m.index + ' :: ' + s.slice(m.index, m.index + 120).replace(/\n/g, ' '));
  }
  console.log('---', n, '(' + decls.length + ' declarations)');
  decls.forEach(d => console.log(d));
}
