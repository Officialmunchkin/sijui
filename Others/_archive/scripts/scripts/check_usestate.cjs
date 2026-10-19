const fs = require('fs');
const s = fs.readFileSync('c:/Users/Admin/OneDrive/Desktop/Wallpaper/famvault.html', 'utf8');
// find where the App component's useState block is; look for these names being declared as part of destructuring like [x,y]=useState
const names = ['Ot', 'Jr', 'Ut', 'ap', 'cp', 'da'];
for (const n of names) {
  const re = new RegExp('[,\\[]\\s*(' + n + ')\\s*[,\\]]\\s*=\\s*useState', 'g');
  let m, found = false;
  while ((m = re.exec(s)) !== null) {
    found = true;
    console.log(n, 'declared @', m.index, '::', s.slice(m.index - 80, m.index + 100).replace(/\n/g, ' '));
  }
  if (!found) console.log(n, ': NOT found as useState destructure');
}
