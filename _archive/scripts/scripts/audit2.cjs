const fs = require('fs');
const s = fs.readFileSync('C:/Users/Admin/OneDrive/Desktop/famvault-site/kashifamily.html', 'utf8');
const out = [];
function show(label, i, len) { out.push('== ' + label + ' @ ' + i + '\n' + (i >= 0 ? s.slice(i, i + len) : 'NOT FOUND')); }
show('upload-file binding', s.indexOf('upload-file') + 0, 0);
// find all indexes of 'upload-file'
let i = -1, n = 0;
while ((i = s.indexOf('upload-file', i + 1)) !== -1) { out.push('occurrence @ ' + i + ': ' + s.slice(i - 80, i + 160).replace(/\n/g, ' ')); n++; if (n > 8) break; }
show('uploadAlbum select', s.indexOf('uploadAlbum') , 300);
show('upload modal full', s.indexOf('function uploadModalHTML'), 2600);
show('bind fn start', s.indexOf('function bind()'), 400);
fs.writeFileSync('C:/Users/Admin/OneDrive/Desktop/Wallpaper/upload-audit2.txt', out.join('\n\n'));
console.log('ok', out.join('').length);
