const resp = await fetch('https://familyalbumvault.netlify.app');
const s = await resp.text();
// find where V is set — likely from a state used to gate admin. Search for the context that defines V near "V," in destructuring or V=useState
const gate = s.indexOf('t==="ADMIN"&&!V');
// look at lines before the gate for "V" destructure — search the enclosing function start. Instead find all "V=" assignments
const out = [];
let i = 0;
while ((i = s.indexOf('V=', i)) >= 0 && out.length < 30) {
  const ctx = s.slice(i, i + 60);
  if (!/V==(===)?/.test(ctx) && !/^V=a/.test(ctx)) out.push({ at: i, ctx: s.slice(i - 60, i + 80).replace(/\n/g, ' ') });
  i += 2;
}
console.log(out.map(o => o.at + ': ' + o.ctx).join('\n'));
