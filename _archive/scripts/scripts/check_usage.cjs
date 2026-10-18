const fs = require('fs');
const s = fs.readFileSync('c:/Users/Admin/OneDrive/Desktop/Wallpaper/famvault.html', 'utf8');
const start = s.indexOf('t==="ADMIN"&&!V');
const chunk = s.slice(start, start + 9000);
for (const n of ['Ot', 'Jr', 'Ut', 'ap']) {
  const re = new RegExp('\\b' + n + '\\b', 'g');
  let m;
  console.log('=== ' + n + ' ===');
  while ((m = re.exec(chunk)) !== null) {
    console.log('  @' + m.index + ' :: ' + chunk.slice(Math.max(0, m.index - 120), m.index + 120).replace(/\n/g, ' '));
  }
}
