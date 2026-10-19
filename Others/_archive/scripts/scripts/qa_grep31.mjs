const resp = await fetch('https://familyalbumvault.netlify.app');
const s = await resp.text();
// Find the nav tab button whose children include an icon + "ADMIN" label and an onClick that changes tab/view
// The bottom nav likely uses array of tabs. Search for "ADMIN" as tab name near a switch, e.g. {id:"ADMIN"
for (const pat of ['id:"ADMIN"', 'id:"admin"', 'key:"ADMIN"', '"ADMIN",', "t===\"ADMIN\"", "t==\"ADMIN\"", "tab==\"ADMIN\""]) {
  const i = s.indexOf(pat);
  console.log(JSON.stringify(pat), '@', i, i > 0 ? s.slice(i - 200, i + 300).replace(/\n/g, ' ') : '');
}
