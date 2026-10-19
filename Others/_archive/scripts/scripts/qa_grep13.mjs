const resp = await fetch('https://familyalbumvault.netlify.app');
const s = await resp.text();
// ADMIN block from start to +4000
const k = 231316;
console.log(s.slice(k, k + 3500));
