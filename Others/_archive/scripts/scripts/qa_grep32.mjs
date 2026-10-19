const resp = await fetch('https://familyalbumvault.netlify.app');
const s = await resp.text();
// print content of admin gate at 231312 for 4500 chars
console.log(s.slice(231312, 231312 + 4500));
