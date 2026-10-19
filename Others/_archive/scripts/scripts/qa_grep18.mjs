const resp = await fetch('https://familyalbumvault.netlify.app');
const s = await resp.text();
// tv() returns 28 demo photos with a src from nv(n,...). Check nv for broken src and O (photos state) usage in ADMIN block:
// 1. print tv() more fully
console.log(s.slice(182509, 182509 + 700));
// 2. check nv function
const i = s.indexOf('function nv(');
console.log('\nnv @', i, i > 0 ? s.slice(i, i + 300) : 'not found');
