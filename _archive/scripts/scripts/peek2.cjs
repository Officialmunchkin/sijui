const s = require('fs').readFileSync('C:/Users/Admin/OneDrive/Desktop/famvault-site/kashifamily.html', 'utf8');
const i = s.indexOf('function doUpload');
console.log(s.slice(i, i + 2400));
const j = s.indexOf('upload-file"');
const k = s.indexOf('addEventListener', j);
console.log('===== listeners');
console.log(s.slice(k - 100, k + 1800));
