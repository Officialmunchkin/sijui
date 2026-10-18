const fs = require('fs');
const s = fs.readFileSync('C:/Users/Admin/OneDrive/Desktop/famvault-site/kashifamily.html', 'utf8');
for (const needle of ['addEventListener("click"', 'onclick', 'dataset.action', 'getAttribute("data-action")', 'case "DEL"', 'case "OPEN"']) {
  const i = s.indexOf(needle);
  console.log(needle, '@', i);
  if (i >= 0) console.log(JSON.stringify(s.slice(i - 150, i + 800)), '\n');
}
