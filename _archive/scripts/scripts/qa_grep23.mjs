const resp = await fetch('https://familyalbumvault.netlify.app');
const s = await resp.text();
// find the ADMIN button render / setView('ADMIN') in bundle
for (const m of s.matchAll(/ADMIN/g)) { /* count */ }
const hits = [...s.matchAll(/ADMIN/g)].length;
console.log('ADMIN occurrences:', hits);
// find setView handler near 'BOARD'
let i = s.indexOf('"BOARD"');
if (i < 0) i = s.indexOf("'BOARD'");
console.log('BOARD @', i, s.slice(i - 200, i + 200));
