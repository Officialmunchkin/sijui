const resp = await fetch('https://familyalbumvault.netlify.app');
const s = await resp.text();
// tv() definition
const i = s.indexOf('function tv()');
console.log('function tv @', i, i > 0 ? s.slice(i, i + 300) : 'not found');
const i2 = s.indexOf('tv=');
console.log('tv= @', i2, i2 > 0 ? s.slice(i2 - 40, i2 + 250) : 'not found');
