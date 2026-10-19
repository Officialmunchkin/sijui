const resp = await fetch('https://familyalbumvault.netlify.app');
const s = await resp.text();
// Find the ADMIN render block
const k = s.indexOf('t==="ADMIN"');
const blk = s.slice(k, k + 9000);
// Look for suspicious calls inside it: .map(, .filter(, .length, JSON, btoa, atob
for (const pat of ['.map(', '.filter(', '.sort(', 'JSON.parse', 'atob(', 'btoa(', 'decodeURIComponent', 'localStorage']) {
  let idx = 0, hits = [];
  while ((idx = blk.indexOf(pat, idx)) !== -1) { hits.push(idx); idx += 1; }
  if (hits.length) console.log(pat, '→', hits.length, 'hits, first at +', hits[0]);
}
console.log('---- first 3500 chars of ADMIN block ----');
console.log(blk.slice(0, 3500));
