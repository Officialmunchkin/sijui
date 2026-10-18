const fs = require('fs');
const file = 'C:/Users/Admin/OneDrive/Desktop/famvault-site/kashifamily.html';
const s = fs.readFileSync(file, 'utf8');
['\\u00F0','\\u00E2','\\u00A5','\\u00AC','\\u008F'].forEach(p => {
  let i = -1, n = 0;
  while ((i = s.indexOf(p, i + 1)) !== -1 && n < 6) {
    console.log('==', p, 'at', i, ':', s.slice(Math.max(0, i - 70), i + 90).replace(/\n/g, ' '));
    n++;
  }
});
