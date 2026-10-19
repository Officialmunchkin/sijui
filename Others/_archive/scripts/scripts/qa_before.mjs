const fs = await import('fs');
const app = fs.readFileSync('C:/Users/Admin/OneDrive/Desktop/Wallpaper/deployed_app.js', 'utf8');
const i = app.indexOf('t==="ADMIN"&&!V&&s(');
// search backwards for the gate condition - the ternary chain start
console.log('--- 4000 chars BEFORE admin branch ---');
console.log(app.slice(Math.max(0, i - 4000), i));
