const s = require('fs').readFileSync('C:/Users/Admin/OneDrive/Desktop/famvault-site/kashifamily.html', 'utf8');
// find the file input listener + pickFile
const i = s.indexOf("'upload-file'");
console.log('upload-file listener:', s.slice(i - 200, i + 1400));
const j = s.indexOf('function apiUpload');
console.log('===== apiUpload');
console.log(s.slice(j, j + 1200));
// where is do-upload case handled
const k = s.indexOf('case "do-upload"');
console.log('===== case');
console.log(s.slice(k, k + 200));
