const fs = await import('fs');
const r = await fetch('https://familyalbumvault.netlify.app', { cache: 'no-store' });
let deployed = await r.text();
const appStart = deployed.indexOf('<script type="module">');
const appEnd = deployed.indexOf('</script>', appStart) + 9;
const app = deployed.slice(appStart, appEnd);
fs.writeFileSync('C:/Users/Admin/OneDrive/Desktop/Wallpaper/deployed_app.js', app);
console.log('saved', app.length, 'chars');
// find admin branch
const i = app.indexOf('t==="ADMIN"');
console.log('admin branch idx:', i);
if (i >= 0) console.log(app.slice(i - 200, i + 6000));
