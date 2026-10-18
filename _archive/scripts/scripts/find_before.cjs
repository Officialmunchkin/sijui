const fs = require('fs');
const s = fs.readFileSync('c:/Users/Admin/OneDrive/Desktop/Wallpaper/famvault.html', 'utf8');
const i = s.indexOf('t==="ADMIN"&&!V');
console.log('=== 4000 chars BEFORE admin render ===');
console.log(s.slice(i - 4000, i));
