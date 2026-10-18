const resp = await fetch('https://familyalbumvault.netlify.app');
const s = await resp.text();
// How is photos state O initialized? find "useState" near a photos default
// Find where photos come from localStorage
for (const pat of ['useState', 'localStorage.getItem']) {
  let idx = 0, n = 0;
  while ((idx = s.indexOf(pat, idx)) !== -1 && n < 40) { n++; idx += 1; }
  console.log(pat, '→', n, 'occurrences');
}
// search for photos variable name: find "let [O," or "[O,"
for (const pat of ['[O,', '[O,', ',O]=', ',O]=', ',Ot]=', 'const[O,', 'let[O,', 'useState([])']) {
  const i = s.indexOf(pat);
  console.log('pat', JSON.stringify(pat), '@', i, i >= 0 ? s.slice(i - 100, i + 120).replace(/\n/g, ' ') : '');
}
