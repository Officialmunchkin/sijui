const resp = await fetch('https://familyalbumvault.netlify.app');
const s = await resp.text();
// print 4512..9000 of admin gate to see what could crash (map over O, pe, etc.)
console.log(s.slice(231312 + 4500, 231312 + 9000));
