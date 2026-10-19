const resp = await fetch('https://familyalbumvault.netlify.app');
const s = await resp.text();
// Find tv() definition
const i = s.indexOf('function tv(') !== -1 ? s.indexOf('function tv(') : s.indexOf('tv=');
console.log('tv at', i, s.slice(i, i + 900));
