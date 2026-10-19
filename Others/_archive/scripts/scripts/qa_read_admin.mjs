const fs = await import('fs');
const s = fs.readFileSync('C:/Users/Admin/OneDrive/Desktop/Wallpaper/Famvault-Readable-Version.html', 'utf8');
const i = s.indexOf('t==="ADMIN"&&!V&&s(');
// print admin branch, 9000 chars
console.log(s.slice(i, i + 9000));
