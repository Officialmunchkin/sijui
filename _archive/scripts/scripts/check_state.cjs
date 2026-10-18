const fs = require('fs');
const s = fs.readFileSync('c:/Users/Admin/OneDrive/Desktop/Wallpaper/famvault.html', 'utf8');
const i = s.indexOf('[ap,Ft]=$.useState(!1)');
console.log(s.slice(i - 300, i + 300));
