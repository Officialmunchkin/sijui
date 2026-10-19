const resp = await fetch('https://familyalbumvault.netlify.app');
const s = await resp.text();
// full nv body
console.log(s.slice(180842, 180842 + 1400));
