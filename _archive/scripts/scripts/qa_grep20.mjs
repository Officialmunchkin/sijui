const resp = await fetch('https://familyalbumvault.netlify.app');
const s = await resp.text();
// rest of nv — where it returns data uri?
console.log(s.slice(182100, 182509));
