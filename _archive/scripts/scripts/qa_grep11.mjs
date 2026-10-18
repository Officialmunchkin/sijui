const resp = await fetch('https://familyalbumvault.netlify.app');
const s = await resp.text();
// exact code around the ADMIN button onClick
const k = s.indexOf('"ADMIN"');
// find all occurrences of "ADMIN" with 200 chars context
let idx = 0, n = 0;
while ((idx = s.indexOf('"ADMIN"', idx)) !== -1 && n < 12) {
  console.log('--- @', idx, ':', s.slice(idx - 200, idx + 200).replace(/\n/g, ' '));
  idx += 1; n++;
}
