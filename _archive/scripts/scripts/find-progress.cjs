const fs = require('fs');
const s = fs.readFileSync('C:/Users/Admin/OneDrive/Desktop/famvault-site/kashifamily.html', 'utf8');
// find the template-literal progress markup
let i = s.indexOf('UPLOADING \\u2022 ${');
console.log('with \\u2022:', i);
i = s.indexOf('UPLOADING \u2022 ${');
console.log('literal bullet:', i);
if (i >= 0) console.log(s.slice(i - 700, i + 900));
else {
  // search for upload-bar-fill or upload-pct in HTML
  const j = s.indexOf('upload-pct');
  console.log('upload-pct @', j);
  if (j >= 0) console.log(s.slice(j - 900, j + 700));
}
