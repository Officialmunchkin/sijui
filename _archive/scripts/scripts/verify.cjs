const fs = require('fs');
const s = fs.readFileSync('C:/Users/Admin/OneDrive/Desktop/famvault-site/kashifamily.html', 'utf8');
const checks = [
  ['old uploadFile (single) refs', (s.match(/uploadFile\b/g) || []).length - (s.match(/uploadFiles/g) || []).length],
  ['onUploadFile (old) refs', (s.match(/onUploadFile\b/g) || []).length - (s.match(/onUploadFiles/g) || []).length],
  ['onUploadFiles refs', (s.match(/onUploadFiles/g) || []).length],
  ['uploadFiles refs', (s.match(/uploadFiles/g) || []).length],
  ['multiple attr', (s.match(/multiple/g) || []).length],
  ['meta charset utf-8', s.includes('<meta charset="utf-8">')],
];
checks.forEach(c => console.log(c[0] + ':', c[1]));
// extract the JS between <script> tags and syntax-check it
const m = s.match(/<script>([\s\S]*?)<\/script>/);
if (m) {
  try { new Function(m[1]); console.log('JS syntax: OK'); }
  catch (e) { console.log('JS syntax ERROR:', e.message); }
} else console.log('no inline script found');
