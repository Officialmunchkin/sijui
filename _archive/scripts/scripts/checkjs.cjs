const { transformSync } = require('c:/Users/Admin/OneDrive/Desktop/Wallpaper/famvault-worker/node_modules/esbuild');
const fs = require('fs');
const p = 'c:/Users/Admin/OneDrive/Desktop/Wallpaper/famvault.html';
const s = fs.readFileSync(p, 'utf8');
const start = s.indexOf('<script type="module">') + '<script type="module">'.length;
const end = s.indexOf('</script>', start);
const js = s.slice(start, end);
try {
  transformSync(js, { loader: 'js' });
  console.log('PARSE OK — script is valid JavaScript');
} catch (e) {
  const er = e.errors[0];
  console.log('ERROR:', er.text, 'at', er.location.line + ':' + er.location.column);
  const lines = js.split('\n');
  const L = lines[er.location.line - 1];
  console.log(JSON.stringify(L.slice(Math.max(0, er.location.column - 160), er.location.column + 100)));
}
