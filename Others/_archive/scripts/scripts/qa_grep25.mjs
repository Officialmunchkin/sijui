const resp = await fetch('https://familyalbumvault.netlify.app');
const s = await resp.text();
// find where the tab content is chosen — search for t==="ADMIN" with different quoting
for (const pat of ["t===\"ADMIN\"", "'ADMIN'==t", "t==='ADMIN'", 'ADMIN?' ]) {
  let i = s.indexOf(pat);
  console.log(JSON.stringify(pat), '@', i, i > 0 ? s.slice(i - 150, i + 400) : '');
}
