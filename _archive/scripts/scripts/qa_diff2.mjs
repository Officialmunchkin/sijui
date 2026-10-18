const fs = await import('fs');
const local = fs.readFileSync('C:/Users/Admin/OneDrive/Desktop/Wallpaper/Famvault-Readable-Version.html', 'utf8');
const r = await fetch('https://familyalbumvault.netlify.app', { cache: 'no-store' });
let deployed = await r.text();
// strip the netlify injected comment
const cStart = deployed.indexOf('<!-- This site is hosted on Netlify');
const cEnd = deployed.indexOf('-->', cStart) + 3;
console.log('injected comment len:', cEnd - cStart);
const stripped = deployed.slice(0, cStart) + deployed.slice(cEnd);
console.log('stripped len:', stripped.length, 'local len:', local.length);
console.log('identical after strip:', stripped === local);
if (stripped !== local) {
  let i = 0; while (i < Math.min(stripped.length, local.length) && stripped[i] === local[i]) i++;
  console.log('first divergence at', i);
  console.log('stripped:', JSON.stringify(stripped.slice(i, i + 300)));
  console.log('local   :', JSON.stringify(local.slice(i, i + 300)));
}
