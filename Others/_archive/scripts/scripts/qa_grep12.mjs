const resp = await fetch('https://familyalbumvault.netlify.app');
const s = await resp.text();
// print from ADMIN block start to +9000 in readable chunks
const k = 231316;
console.log(s.slice(k + 3500, k + 9000));
