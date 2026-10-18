const resp = await fetch('https://familyalbumvault.netlify.app');
const s = await resp.text();
// find the variable "O" used in ADMIN block — search for O.photos or "pe" definition near
// find "let O=" or "O=" that's set from Pe
for (const m of s.matchAll(/[,;]O=(?:\$\.useState|[^;]{0,80})/g)) {
  console.log('--- @', m.index, ':', s.slice(m.index, m.index + 250));
}
