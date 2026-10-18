const resp = await fetch('https://familyalbumvault.netlify.app');
const s = await resp.text();
// ADMIN block uses Cu(o.birthday) and vp map. Check Cu and vp definitions
for (const m of s.matchAll(/function (Cu|vp)\b|[,;](Cu|vp)=/g)) console.log('--- @', m.index, ':', s.slice(m.index, m.index + 250));
