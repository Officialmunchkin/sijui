const resp = await fetch('https://familyalbumvault.netlify.app');
const s = await resp.text();
// Search around the tail where the app code likely lives (after React bundle)
const tail = s.slice(150000);
const terms = ['ADMIN', 'adminTab', 'setTab', 'tab===', 'activeTab', 'VIEW ADMIN', 'panel'];
for (const t of terms) {
  let i = -1, count = 0;
  while ((i = tail.indexOf(t, i + 1)) !== -1) {
    count++;
    if (count <= 4) console.log('--- ' + t + ' @' + (150000 + i) + ':\n' + tail.slice(Math.max(0, i - 250), i + 400).replace(/\n/g, '\\n') + '\n');
  }
  console.log('TOTAL "' + t + '": ' + count + '\n');
}
