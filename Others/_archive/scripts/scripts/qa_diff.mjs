const fs = await import('fs');
const crypto = await import('crypto');
const local = fs.readFileSync('C:/Users/Admin/OneDrive/Desktop/Wallpaper/Famvault-Readable-Version.html', 'utf8');
const r = await fetch('https://familyalbumvault.netlify.app', { cache: 'no-store' });
const deployed = await r.text();
console.log('local len:', local.length, 'sha:', crypto.createHash('sha1').update(local).digest('hex'));
console.log('deploy len:', deployed.length, 'sha:', crypto.createHash('sha1').update(deployed).digest('hex'));
console.log('identical:', local === deployed);
// find where they diverge
if (local !== deployed) {
  let i = 0; while (i < Math.min(local.length, deployed.length) && local[i] === deployed[i]) i++;
  console.log('first divergence at', i);
  console.log('deployed snippet:', deployed.slice(Math.max(0, i - 100), i + 400));
}
// check admin branch exists in deployed
console.log('deployed has admin branch:', deployed.includes('t==="ADMIN"&&!V&&s('));
console.log('deployed title:', (deployed.match(/<title>([^<]*)<\/title>/) || [])[1]);
console.log('deployed has root div:', deployed.includes('<div id="root"></div>'));
