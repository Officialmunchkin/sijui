const fs = require('fs');
const s = fs.readFileSync('famvault.html', 'utf8');
const terms = ['ADMIN', 'admin', 'setTab', 'setView', 'tab===', 'view===', 'herman'];
const lines = s.split('\n');
console.log('total lines:', lines.length, 'total chars:', s.length);
// find which line(s) contain "ADMIN"
lines.forEach((ln, i) => {
  if (ln.includes('ADMIN') || ln.includes('admin') || ln.includes('setTab') || ln.includes('setView')) {
    console.log('line', i + 1, 'len', ln.length, '::', ln.slice(0, 200));
  }
});
