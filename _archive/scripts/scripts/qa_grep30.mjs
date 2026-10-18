const resp = await fetch('https://familyalbumvault.netlify.app');
const s = await resp.text();
// Search for the tab button labelled ADMIN with onClick that switches view. Try 'ADMIN"' occurrences with onClick within 300 chars after.
const out = [];
let i = 0;
while ((i = s.indexOf('ADMIN', i)) >= 0) {
  const ctx = s.slice(i, i + 400);
  if (/onClick|view|"ADMIN"\)|setView|setT\(/.test(ctx) && /children/.test(s.slice(Math.max(0,i-100), i+120))) {
    out.push({ at: i, ctx: s.slice(i - 150, i + 350) });
  }
  i += 5;
  if (out.length > 8) break;
}
console.log(out.length, 'candidates');
for (const o of out) console.log('=== @', o.at, '===\n', o.ctx, '\n');
