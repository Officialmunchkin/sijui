const s = require('fs').readFileSync('C:/Users/Admin/OneDrive/Desktop/famvault-site/kashifamily.html', 'utf8');
const i = s.indexOf('data-action="open-upload"');
console.log('open-upload ctx:', s.slice(i - 150, i + 200));
const m = s.indexOf('do-upload');
console.log('=====');
console.log('do-upload ctx:', s.slice(m - 400, m + 200));
// event wiring
const w = s.indexOf('upload-file');
const e2 = s.indexOf("addEventListener", w);
console.log('=====');
console.log(s.slice(w, w + 2400));
