const fs = await import('fs');
const local = fs.readFileSync('C:/Users/Admin/OneDrive/Desktop/Wallpaper/Famvault-Readable-Version.html', 'utf8');
const r = await fetch('https://familyalbumvault.netlify.app', { cache: 'no-store' });
let deployed = await r.text();
const cStart = deployed.indexOf('<!-- This site is hosted on Netlify');
const cEnd = deployed.indexOf('-->', cStart) + 3;
const stripped = deployed.slice(0, cStart) + deployed.slice(cEnd);
// print all script tag openings with context
let idx = 0;
while ((idx = stripped.indexOf('<script', idx)) !== -1) {
  console.log('--- @', idx, ':', JSON.stringify(stripped.slice(idx, idx + 150)));
  idx += 7;
}
