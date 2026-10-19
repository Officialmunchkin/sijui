const fs = require('fs');
const s = fs.readFileSync('C:/Users/Admin/OneDrive/Desktop/famvault-site/kashifamily.html', 'utf8');
const i = s.indexOf('case "cancel-login"');
console.log(s.slice(i, i + 2800));
