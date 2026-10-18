const resp = await fetch('https://familyalbumvault.netlify.app');
const s = await resp.text();
// Find the tab click handler: {k:"ADMIN",label:"ADMIN",red:!0}
let j = s.indexOf('k:"ADMIN"');
console.log('k:"ADMIN" @', j);
console.log(s.slice(j - 600, j + 1400).replace(/\n/g, '\\n'));
// Also find t==="ADMIN" render
let k = s.indexOf('t==="ADMIN"');
console.log('\n\nt==="ADMIN" @', k);
console.log(s.slice(k - 300, k + 2000).replace(/\n/g, '\\n'));
