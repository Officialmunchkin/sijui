const resp = await fetch('https://familyalbumvault.netlify.app');
const s = await resp.text();
// find main content switch: "ADMIN" tab rendering (t === 'ADMIN')
let i = s.indexOf('ADMIN"===');
console.log('ADMIN\"=== @', i, i>0 ? s.slice(i-100, i+400) : 'not found');
i = s.indexOf("===\"ADMIN\"");
console.log('===\"ADMIN\" @', i, i>0 ? s.slice(i-200, i+600) : 'not found');
