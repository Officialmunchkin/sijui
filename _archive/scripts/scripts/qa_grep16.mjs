const resp = await fetch('https://familyalbumvault.netlify.app');
const s = await resp.text();
// app code starts where React lib ends — find start of app around 180000+
// find where the state var that O refers to is defined — search near 180000-190000 for ",Pe="
const idx = s.indexOf(',Pe=');
console.log('idx Pe= :', idx, s.slice(idx, idx + 150));
const i2 = s.indexOf(' Pe=');
console.log(' Pe= :', i2, s.slice(i2, i2 + 150));
// also search for O=Pe or [O,Pe]=
for (const m of s.matchAll(/\[([A-Za-z]{1,3}),Pe\]=/g)) console.log('--- destructure @', m.index, ':', s.slice(m.index - 40, m.index + 120));
