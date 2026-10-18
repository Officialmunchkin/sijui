const fs = require('fs');
const s = fs.readFileSync('C:/Users/Admin/OneDrive/Desktop/famvault-site/kashifamily.html', 'utf8');
const out = [];
function show(label, i, len) { out.push('== ' + label + ' @ ' + i + '\n' + (i >= 0 ? s.slice(i, i + len) : 'NOT FOUND')); }
show('pickFile', s.indexOf('function pickFile'), 900);
show('doUpload', s.indexOf('function doUpload'), 1800);
show('apiUpload', s.indexOf('function apiUpload'), 1400);
show('upload input html', s.indexOf('id="upload-file"') - 200, 500);
show('upload-file listener', s.indexOf("'upload-file'") - 100, 1600);
show('do-upload case', s.indexOf('case "do-upload"'), 400);
show('open-upload action', s.indexOf('open-upload'), 400);
fs.writeFileSync('C:/Users/Admin/OneDrive/Desktop/Wallpaper/upload-audit.txt', out.join('\n\n'));
console.log('written', out.join('').length);
