const fs = require('fs');
const s = fs.readFileSync('C:/Users/Admin/OneDrive/Desktop/famvault-site/kashifamily.html', 'utf8');
// extract the main <script> block
const start = s.indexOf('<script>') !== -1 ? s.indexOf('<script>') + 8 : -1;
const end = s.lastIndexOf('</script>');
console.log('script block:', start, end);
const code = s.slice(start, end);
try {
  new Function(code);
  console.log('SYNTAX OK, script length', code.length);
} catch (e) {
  console.log('SYNTAX ERROR:', e.message);
  // locate line
  const lines = code.split('\n');
  const m = e.stack.match(/<anonymous>:(\d+)/);
  if (m) {
    const ln = +m[1];
    console.log('around line', ln, ':', lines.slice(ln - 4, ln + 3).join('\n'));
  }
}
