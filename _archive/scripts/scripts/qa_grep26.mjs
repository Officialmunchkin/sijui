const resp = await fetch('https://familyalbumvault.netlify.app');
const s = await resp.text();
// Print the entire ADMIN tab block
console.log(s.slice(231312, 231312 + 5000));
