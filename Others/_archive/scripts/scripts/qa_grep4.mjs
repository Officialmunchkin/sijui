const resp = await fetch('https://familyalbumvault.netlify.app');
const s = await resp.text();
// The tab bar has HOME ALBUMS MEMBERS BOARD ADMIN UPLOAD — find that string
const i = s.indexOf('"ADMIN"');
console.log('first plain ADMIN string @', i);
// find the tab-nav render code: search for ALBUMS\",\"MEMBERS
let j = s.indexOf('ALBUMS","MEMBERS');
if (j === -1) j = s.indexOf('"ALBUMS"');
console.log('tabs list @', j);
console.log(s.slice(Math.max(0, j - 400), j + 1200).replace(/\n/g, '\\n'));
