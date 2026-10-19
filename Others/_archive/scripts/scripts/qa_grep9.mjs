const resp = await fetch('https://familyalbumvault.netlify.app');
const s = await resp.text();
// where is Pe / O persisted? search "localStorage.setItem" occurrences with context
let idx = 0, n = 0;
while ((idx = s.indexOf('localStorage.setItem', idx)) !== -1 && n < 10) {
  console.log('--- setItem @', idx, ':', s.slice(idx - 60, idx + 140).replace(/\n/g, ' '));
  idx += 1; n++;
}
idx = 0; n = 0;
while ((idx = s.indexOf('localStorage.getItem', idx)) !== -1 && n < 10) {
  console.log('--- getItem @', idx, ':', s.slice(idx - 60, idx + 140).replace(/\n/g, ' '));
  idx += 1; n++;
}
