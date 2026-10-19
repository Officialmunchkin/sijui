const resp = await fetch('https://familyalbumvault.netlify.app');
const s = await resp.text();
// check Ao and tp definitions (birthday parse)
const i = s.indexOf('function Ao(');
console.log(s.slice(i, i + 500));
const j = s.indexOf('function tp(');
console.log('\ntp:', s.slice(j, j + 400));
