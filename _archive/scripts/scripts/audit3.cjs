const fs = require('fs');
const s = fs.readFileSync('C:/Users/Admin/OneDrive/Desktop/famvault-site/kashifamily.html', 'utf8');
const out = [];
function show(label, i, len) { out.push('== ' + label + ' @ ' + i + '\n' + (i >= 0 ? s.slice(i, i + len) : 'NOT FOUND')); }
show('onUploadFile', s.indexOf('function onUploadFile'), 900);
show('dropzone listeners', s.indexOf('dz.addEventListener') - 100, 1400);
show('upload modal tail (caption->end)', s.indexOf('function uploadModalHTML') + 2600, 2200);
fs.writeFileSync('C:/Users/Admin/OneDrive/Desktop/Wallpaper/upload-audit3.txt', out.join('\n\n'));
console.log('ok');
