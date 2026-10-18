const fs = require('fs');
const s = fs.readFileSync('c:/Users/Admin/OneDrive/Desktop/Wallpaper/famvault.html', 'utf8');
// window of the admin render block
const start = s.indexOf('t==="ADMIN"&&!V');
const chunk = s.slice(start, start + 9000);

// find all short identifiers used and check if declared earlier in file
const ids = new Set();
for (const m of chunk.matchAll(/\b[a-zA-Z_$][\w$]*\b(?=\s*[,)\].&&|])/g)) ids.add(m[0]);
// filter common words
const junk = new Set(['className','children','style','div','span','button','input','select','option','textarea','if','for','of','const','let','return','new','Date','now','Math','Object','keys','length','slice','map','filter','trailing','md','col','grid','cols','gap','p','px','py','w','h','max','min','rounded','border','bg','text','font','tracking','flex','items','justify','between','space','y','x','overflow','hidden','auto','pr','mt','truncate','shrink','relative','absolute','inset','fixed','z','hover','focus','placeholder','transition','all','this','alert','confirm']);
const out = [];
for (const id of ids) {
  if (junk.has(id) || id.length < 2) continue;
  // how many times declared (as function or var) anywhere in file
  const re = new RegExp('(function\\s+' + id + '\\b|(?:const|let|var)\\s+' + id + '\\b|' + id + '\\s*=\\s*(?:\\{|\\(|function|[A-Za-z0-9_$.]))', 'g');
  let count = 0, m;
  while ((m = re.exec(s)) !== null) count++;
  if (count === 0) out.push('UNDEFINED?: ' + id);
}
console.log(out.join('\n'));
