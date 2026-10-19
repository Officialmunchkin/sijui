const resp = await fetch('https://familyalbumvault.netlify.app');
const s = await resp.text();
const i = s.indexOf('https://famvault-r2.famvault.workers.dev/ph');
console.log(s.slice(i - 250, i + 400));
