const fs = await import('fs');
const local = fs.readFileSync('C:/Users/Admin/OneDrive/Desktop/Wallpaper/Famvault-Readable-Version.html', 'utf8');
const r = await fetch('https://familyalbumvault.netlify.app', { cache: 'no-store' });
let deployed = await r.text();
const cStart = deployed.indexOf('<!-- This site is hosted on Netlify');
const cEnd = deployed.indexOf('-->', cStart) + 3;
const stripped = deployed.slice(0, cStart) + deployed.slice(cEnd);
console.log('stripped len:', stripped.length, 'local len:', local.length, 'diff:', stripped.length - local.length);
console.log('stripped has HERMAN:', stripped.includes('HERMAN'));
console.log('stripped script tag count:', (stripped.match(/<script/g) || []).length);
console.log('local script tag count:', (local.match(/<script/g) || []).length);
// check what extra content deployed has — diff char by char from divergence point
let i = 65;
while (i < Math.min(stripped.length, local.length) && stripped[i] === local[i]) i++;
// they diverge due to the extra newline only; skip 1 char
console.log('after skip:', JSON.stringify(stripped.slice(i + 1, i + 120)) === JSON.stringify(local.slice(i, i + 120)));
