const fs = require('fs');
const s = fs.readFileSync('c:/Users/Admin/OneDrive/Desktop/Wallpaper/famvault.html', 'utf8');
for (const n of ['Ot', 'Jr', 'Ut', 'ap', 'cp', 'da']) {
  const re = new RegExp('\\b' + n + '\\s*[,\\]]?\\s*=', 'g');
  let m, count = 0;
  const lines = [];
  while ((m = re.exec(s)) !== null && count < 5) {
    lines.push('@' + m.index + ' :: ' + s.slice(Math.max(0, m.index - 100), m.index + 100).replace(/\n/g, ' '));
    count++;
  }
  console.log('=== ' + n + ' (' + count + ' assignments) ===');
  lines.forEach(l => console.log(l));
}
