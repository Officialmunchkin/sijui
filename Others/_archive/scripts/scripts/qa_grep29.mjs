const resp = await fetch('https://familyalbumvault.netlify.app');
const s = await resp.text();
// Find what V is
const gate = s.indexOf('t==="ADMIN"&&!V');
// search backwards for "var V=" or "const V=" or V=...  within reasonable distance before gate
const before = s.slice(Math.max(0, gate - 40000), gate);
const m = [...before.matchAll(/\bV\s*=\s*[^,;]{0,80}/g)];
console.log(m.map(x => x[0]).slice(-12));
// Also find nav onClick handlers that set t (tab state) — search 'onClick:' near 'ADMIN' in nav
const nav = s.indexOf('children:"ADMIN"');
console.log('--- nav click ctx ---');
console.log(s.slice(nav - 400, nav + 300));
