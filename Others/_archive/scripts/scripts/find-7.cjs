const fs = require('fs');
const s = fs.readFileSync('C:/Users/Admin/OneDrive/Desktop/famvault-site/kashifamily.html', 'utf8');
let i = -1;
while ((i = s.indexOf('show-more', i + 1)) >= 0) {
  console.log('@', i, JSON.stringify(s.slice(i - 160, i + 30)));
}
