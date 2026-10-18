const resp = await fetch('https://familyalbumvault.netlify.app');
const s = await resp.text();
// app code starts after react bundle. Find "Pe" setter near the fetch at 187853-ish? Actually find where Pe is defined as a state setter
// find `,O=Pe` patterns or where "O" is set from "Pe" state.
// search for `function Pe` or `,Pe=`
for (const m of s.matchAll(/[,;]Pe=\$\.useState[^;]{0,80}/g)) console.log('--- @', m.index, ':', s.slice(m.index, m.index + 200));
