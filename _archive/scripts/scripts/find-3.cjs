const fs = require('fs');
const s = fs.readFileSync('C:/Users/Admin/OneDrive/Desktop/famvault-site/kashifamily.html', 'utf8');
let i = -1;
while ((i = s.indexOf('show-more', i + 1)) >= 0) {
  console.log('occ @', i, ':', JSON.stringify(s.slice(i - 60, i + 40)));
}
// find the click dispatch switch
const d = s.indexOf("data-action");
console.log('--- dispatch around data-action handler ---');
const sw = s.indexOf('action === ');
console.log('action=== @', sw);
if (sw >= 0) console.log(s.slice(sw - 300, sw + 1500));
