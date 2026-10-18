const fs = require('fs');
const s = fs.readFileSync('C:/Users/Admin/OneDrive/Desktop/famvault-site/kashifamily.html', 'utf8');
let i = -1, n = 0;
while ((i = s.indexOf('\\u00E2', i + 1)) !== -1) {
  console.log('at', i, ':', s.slice(Math.max(0, i - 60), i + 100).replace(/\n/g, ' '));
  n++;
}
