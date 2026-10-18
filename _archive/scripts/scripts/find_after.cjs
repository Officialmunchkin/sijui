const fs = require('fs');
const s = fs.readFileSync('c:/Users/Admin/OneDrive/Desktop/Wallpaper/famvault.html', 'utf8');
const p = s.indexOf('t==="ADMIN"&&!V');
const q = s.indexOf('t==="PROFILE"&&', p);
console.log('admin at', p, 'next PROFILE at', q);
console.log(s.slice(p, q > 0 ? q : p + 12000));
