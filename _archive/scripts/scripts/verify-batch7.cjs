const fs = require('fs');
const s = fs.readFileSync('C:/Users/Admin/OneDrive/Desktop/famvault-site/kashifamily.html', 'utf8');
const m = s.match(/<script>([\s\S]*)<\/script>/);
try { new Function(m[1]); console.log('JS SYNTAX OK, script length', m[1].length); }
catch(e){ console.log('SYNTAX ERROR:', e.message); }
console.log('isHerman defined:', s.includes('function isHerman'));
console.log('X-Famvault-Role header count:', (s.match(/X-Famvault-Role/g)||[]).length);
// check all fetch calls include role header where needed
const fetches = s.match(/fetch\(`\$\{R2_CONFIG\.API\}[^`]*`[^)]*\)/g) || [];
fetches.forEach(f => console.log('FETCH:', f.slice(0, 140)));
