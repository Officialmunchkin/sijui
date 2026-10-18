const resp = await fetch('https://familyalbumvault.netlify.app');
const s = await resp.text();
const terms = ['.unmount()', 'getElementById("root")', "getElementById('root')", 'innerHTML=""', "innerHTML=''", 'display:none', 'classList.add("hidden")', 'visibility'];
for (const t of terms) {
  let i = -1, count = 0;
  while ((i = s.indexOf(t, i + 1)) !== -1) {
    count++;
    if (count <= 5) console.log('--- ' + t + ' @' + i + ':\n' + s.slice(Math.max(0, i - 180), i + 300).replace(/\n/g, '\\n'));
  }
  console.log('TOTAL "' + t + '": ' + count + '\n');
}
