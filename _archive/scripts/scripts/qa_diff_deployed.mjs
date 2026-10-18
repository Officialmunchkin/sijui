const fs = await import('fs');
const html = fs.readFileSync('C:/Users/Admin/OneDrive/Desktop/Wallpaper/Famvault-Readable-Version.html', 'utf8');
const resp = await fetch('https://familyalbumvault.netlify.app');
const deployed = await resp.text();
// extract the big module script from each
function getScript(s) {
  const m = s.match(/<script type="module">([\s\S]*?)<\/script>/);
  return m ? m[1] : '';
}
const a = getScript(html), b = getScript(deployed);
console.log('local script len:', a.length, 'deployed script len:', b.length);
// find first difference
let i = 0; const n = Math.min(a.length, b.length);
while (i < n && a[i] === b[i]) i++;
console.log('first diff at', i);
console.log('LOCAL  ...', a.slice(Math.max(0, i - 100), i + 400).replace(/\n/g, '\\n'));
console.log('LIVE   ...', b.slice(Math.max(0, i - 100), i + 400).replace(/\n/g, '\\n'));
