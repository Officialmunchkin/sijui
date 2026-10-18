const fs = require('fs');
const s = fs.readFileSync('C:/Users/Admin/OneDrive/Desktop/famvault-site/kashifamily.html', 'utf8');
// find the event delegation: search for closest('[data-action]')
const i = s.indexOf("data-action']");
console.log('closest @', i);
if (i >= 0) console.log(s.slice(i - 300, i + 2000));
else {
  const j = s.indexOf("addEventListener('click'");
  console.log('click listener @', j);
  if (j >= 0) console.log(s.slice(j, j + 2200));
}
