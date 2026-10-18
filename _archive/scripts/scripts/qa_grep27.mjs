const resp = await fetch('https://familyalbumvault.netlify.app');
const s = await resp.text();
// Find the nav tab "ADMIN" and its onClick
let i = s.indexOf('children:"ADMIN"');
console.log('--- nav ADMIN @', i, '---');
console.log(s.slice(i - 700, i + 200));
// find V && s("div" (the admin tab content gate) and V definition
let j = s.indexOf('t==="ADMIN"&&!V');
console.log('--- gate @', j, '---');
// search where V is set
for (const m of s.matchAll(/V=[^,;]{0,60}/g)) { const t = m[0]; if (/V=\(|V=\[|V=!|V==/.test(t)) continue; }
