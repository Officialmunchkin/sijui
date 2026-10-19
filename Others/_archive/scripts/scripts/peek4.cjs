const s = require('fs').readFileSync('C:/Users/Admin/OneDrive/Desktop/famvault-site/kashifamily.html', 'utf8');
const i = s.indexOf('upload-file');
console.log(s.slice(i - 300, i + 1200));
const k = s.indexOf('function pickFile');
console.log('===== pickFile');
console.log(k >= 0 ? s.slice(k, k + 900) : 'NOT FOUND');
// input element html
const h = s.indexOf('id="upload-file"');
console.log('===== input html');
console.log(h >= 0 ? s.slice(h - 150, h + 250) : 'NOT FOUND');
