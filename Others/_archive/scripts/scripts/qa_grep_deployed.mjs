const resp = await fetch('https://familyalbumvault.netlify.app');
const s = await resp.text();
const terms = ['unmount', 'createRoot', 'removeChild', 'root.render', 'document.body.innerHTML', 'window.close', 'location.reload', 'resetRoot'];
for (const t of terms) {
  let i = -1, count = 0;
  while ((i = s.indexOf(t, i + 1)) !== -1) {
    count++;
    if (count <= 3) console.log('--- ' + t + ' @' + i + ':\n' + s.slice(Math.max(0, i - 150), i + 250).replace(/\n/g, '\\n'));
  }
  console.log('TOTAL "' + t + '": ' + count);
}
