const fs = await import('fs');
const local = fs.readFileSync('C:/Users/Admin/OneDrive/Desktop/Wallpaper/Famvault-Readable-Version.html', 'utf8');
const r = await fetch('https://familyalbumvault.netlify.app', { cache: 'no-store' });
let deployed = await r.text();
const cStart = deployed.indexOf('<!-- This site is hosted on Netlify');
const cEnd = deployed.indexOf('-->', cStart) + 3;
const stripped = deployed.slice(0, cStart) + deployed.slice(cEnd);
// main app module script in both
const appStart = stripped.indexOf('<script type="module">');
const appStartL = local.indexOf('<script type="module">');
const appD = stripped.slice(appStart, stripped.indexOf('</script>', appStart) + 9);
const appL = local.slice(appStartL, local.indexOf('</script>', appStartL) + 9);
console.log('app script deployed len:', appD.length, 'local len:', appL.length, 'identical:', appD === appL);
console.log('deployed head len:', stripped.indexOf('<body'), 'local head len:', local.indexOf('<body'));
console.log('head identical:', stripped.slice(0, stripped.indexOf('<body')) === local.slice(0, local.indexOf('<body')));
// everything after the module script
const tailD = stripped.slice(stripped.indexOf('</script>', appStart) + 9);
const tailL = local.slice(local.indexOf('</script>', appStartL) + 9);
console.log('tail deployed len:', tailD.length, 'local len:', tailL.length, 'identical:', tailD === tailL);
if (tailD !== tailL) {
  let i = 0; while (i < Math.min(tailD.length, tailL.length) && tailD[i] === tailL[i]) i++;
  console.log('tail divergence at', i, 'of', tailL.length);
  console.log('deployed tail:', JSON.stringify(tailD.slice(i, i + 600)));
  console.log('local tail   :', JSON.stringify(tailL.slice(i, i + 600)));
}
