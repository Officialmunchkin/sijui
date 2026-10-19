const resp = await fetch('https://familyalbumvault.netlify.app');
const s = await resp.text();
const i = s.indexOf('"ADMIN"');
// nav bar tabs: find the onClick that sets tab to ADMIN
let k = s.indexOf('ADMIN:1');
console.log('ADMIN:1 @', k, s.slice(k-300, k+100));
// The content gate at 231312
console.log('--- gate ---');
console.log(s.slice(231312, 231312 + 1200));
